import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { question, options, userId, expiresAt } = body;

        if (!question || !options || options.length < 2) {
            return NextResponse.json({ error: 'Invalid poll data' }, { status: 400 });
        }

        const poll = await prisma.poll.create({
            data: {
                question,
                creatorId: userId,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                options: {
                    create: options.map((opt: { text: string; imageUrl?: string }) => ({
                        text: opt.text,
                        imageUrl: opt.imageUrl
                    }))
                }
            },
            include: {
                options: true
            }
        });

        return NextResponse.json(poll);
    } catch (error) {
        logger.error('Error creating poll:', error);
        return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        // Fetch recent active polls
        const polls = await prisma.poll.findMany({
            where: {
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                creator: {
                    select: { username: true, image: true }
                },
                scan: {
                    select: { photoUrl: true }  // Include outfit context
                },
                options: {
                    include: {
                        votes: true
                    }
                },
            }
        });

        return NextResponse.json(polls);
    } catch (error) {
        logger.error('Error fetching polls:', error);
        return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
    }
}
