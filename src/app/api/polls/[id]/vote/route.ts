import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await request.json();
        const { userId, optionId } = body;
        const { id } = await params;
        const pollId = id;

        // Check if user already voted
        const existingVote = await prisma.pollVote.findUnique({
            where: {
                userId_pollId: {
                    userId,
                    pollId
                }
            }
        });

        if (existingVote) {
            return NextResponse.json({ error: 'Already voted' }, { status: 400 });
        }

        const vote = await prisma.pollVote.create({
            data: {
                pollId,
                optionId,
                userId
            }
        });

        return NextResponse.json(vote);
    } catch (error) {
        logger.error('Error voting:', error);
        return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }
}
