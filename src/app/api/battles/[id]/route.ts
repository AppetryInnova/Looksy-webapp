import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: 'Missing Battle ID' }, { status: 400 });
        }

        const battle = await prisma.battle.findUnique({
            where: { id },
            include: {
                entries: {
                    include: {
                        user: { select: { username: true, avatarUrl: true, id: true } },
                        scan: { select: { photoUrl: true, harmonyScore: true } }
                    },
                    orderBy: {
                        score: 'desc'
                    }
                }
            }
        });

        if (!battle) {
            return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        return NextResponse.json(battle);
    } catch (error) {
        console.error('Error fetching battle details:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
