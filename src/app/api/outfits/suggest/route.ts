import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { occasion, season } = body;

        // Get user's wardrobe
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                items: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get store items that complement user's wardrobe
        const storeItems = await prisma.storeItem.findMany({
            where: {
                inStock: true,
                // Filter by occasion/season if provided
            },
            include: {
                store: true
            },
            take: 10
        });

        // Simple algorithm: suggest items from categories user doesn't have much of
        const userCategories = user.items.map(item => item.category);
        const categoryCounts: Record<string, number> = {};
        userCategories.forEach(cat => {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        // Find least represented categories
        const suggestions = storeItems
            .filter(item => !categoryCounts[item.category] || categoryCounts[item.category] < 3)
            .slice(0, 5);

        return NextResponse.json({
            suggestions,
            message: suggestions.length > 0
                ? 'Encontramos estas prendas que complementan tu estilo'
                : 'No hay sugerencias disponibles en este momento'
        });
    } catch (error) {
        logger.error('Error generating outfit suggestions:', error);
        return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
    }
}
