import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ users: [], items: [] });
        }

        const users = await prisma.user.findMany({
            where: {
                username: {
                    contains: query
                }
            },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                level: true
            },
            take: 5
        });

        const items = await prisma.item.findMany({
            where: {
                OR: [
                    { category: { contains: query } },
                    { brand: { contains: query } },
                    { color: { contains: query } }
                ]
            },
            take: 5
        });

        return NextResponse.json({ users, items });
    } catch (error) {
        logger.error('Error searching:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
