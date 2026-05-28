import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/gemini';
import logger from '@/lib/logger';

export async function GET() {
    try {
        const items = await prisma.item.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: true },
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, imageUrl, category, color, brand } = body;

        let targetUserId = userId;
        if (!targetUserId) {
            const defaultUser = await prisma.user.upsert({
                where: { email: 'demo@looksy.app' },
                update: {},
                create: {
                    email: 'demo@looksy.app',
                    username: 'LooksyUser',
                }
            });
            targetUserId = defaultUser.id;
        }

        const item = await prisma.item.create({
            data: {
                userId: targetUserId,
                imageUrl,
                category,
                color,
                brand,
            },
        });

        // Generate and save embedding asynchronously so it doesn't block UI too much
        // Note: For production, this could also go to Inngest
        try {
            const descriptionText = `Prenda de ropa: ${category}. Color: ${color || 'desconocido'}. Marca: ${brand || 'desconocida'}.`;
            const embedding = await generateEmbedding(descriptionText);

            // Use executeRaw to set the pgvector embedding
            // Format for pgvector: '[0.1, 0.2, ...]'
            const embeddingString = `[${embedding.join(',')}]`;
            
            await prisma.$executeRaw`UPDATE "Item" SET embedding = ${embeddingString}::vector WHERE id = ${item.id}`;
            logger.info(`Vector embedding generated and saved for item ${item.id}`);
        } catch (embedError) {
            logger.error(`Error generating embedding for item ${item.id}:`, embedError);
            // Non-fatal, we still return the created item
        }

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating item' }, { status: 500 });
    }
}
