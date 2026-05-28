import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '5');

        let battles = await prisma.battle.findMany({
            where: {
                isActive: true,
                endDate: { gt: new Date() }
            },
            take: limit,
            orderBy: { endDate: 'asc' },
            include: {
                _count: {
                    select: { entries: true }
                }
            }
        });

        // Seed if no active battles
        if (battles.length === 0) {
            const newBattle = await prisma.battle.create({
                data: {
                    title: "Neon Nights",
                    description: "Captura la energía de la ciudad. Luces neón, contrastes altos y vibes cyberpunk.",
                    theme: "Cyberpunk",
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    imageUrl: "https://images.unsplash.com/photo-1545156526-90b5bd438686?q=80&w=2699&auto=format&fit=crop"
                }
            });
            battles = [newBattle as any];
        }

        return NextResponse.json(battles);
    } catch (error) {
        logger.error('Error fetching battles:', error);
        return NextResponse.json({ error: 'Failed to fetch battles' }, { status: 500 });
    }
}
