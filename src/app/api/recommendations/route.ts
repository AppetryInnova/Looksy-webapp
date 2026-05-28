import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId');
        const limit = parseInt(searchParams.get('limit') || '5', 10);

        if (!itemId) {
            return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
        }

        // We use $queryRaw to perform vector similarity search using pgvector's <-> operator
        // This finds items closest in the 768-dimensional space to the target item.
        const recommendations = await prisma.$queryRaw`
            SELECT id, "userId", "imageUrl", category, color, brand, "createdAt", "updatedAt"
            FROM "Item"
            WHERE id != ${itemId} AND embedding IS NOT NULL
            ORDER BY embedding <-> (SELECT embedding FROM "Item" WHERE id = ${itemId})
            LIMIT ${limit};
        `;

        return NextResponse.json({ recommendations });
    } catch (error: any) {
        logger.error(`Error fetching recommendations for itemId:`, error);
        return NextResponse.json({ error: 'Error fetching recommendations' }, { status: 500 });
    }
}
