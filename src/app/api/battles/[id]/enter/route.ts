import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params are now a Promise in Next.js 15+
) {
    try {
        // Await params first
        const resolvedParams = await params;
        const battleId = resolvedParams.id;
        const body = await request.json();
        const { userId, scanId } = body;

        if (!userId || !scanId) {
            return NextResponse.json({ error: 'Missing userId or scanId' }, { status: 400 });
        }

        // Check if already entered
        const existingEntry = await prisma.battleEntry.findUnique({
            where: {
                battleId_userId: {
                    battleId: battleId,
                    userId: userId
                }
            }
        });

        if (existingEntry) {
            return NextResponse.json({ error: 'Already entered this battle' }, { status: 400 });
        }

        const entry = await prisma.battleEntry.create({
            data: {
                battleId: battleId,
                userId: userId,
                scanId: scanId
            }
        });

        return NextResponse.json(entry);
    } catch (error) {
        logger.error('Error entering battle:', error);
        return NextResponse.json({ error: 'Failed to enter battle' }, { status: 500 });
    }
}
