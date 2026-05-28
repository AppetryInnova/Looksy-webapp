import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { platform, handle } = body;

        if (!platform || !handle) {
            return NextResponse.json({ error: 'Platform and handle missing' }, { status: 400 });
        }

        // Mock: Generate random followers (10k to 100k) to make it fun
        const randomFollowers = Math.floor(Math.random() * 90000) + 10000;

        await prisma.$transaction([
            prisma.socialConnection.upsert({
                where: {
                    userId_platform: {
                        userId: session.user.id,
                        platform: platform.toUpperCase()
                    }
                },
                update: {
                    handle,
                    followerCount: randomFollowers
                },
                create: {
                    userId: session.user.id,
                    platform: platform.toUpperCase(),
                    handle,
                    followerCount: randomFollowers
                }
            }),
            prisma.user.update({
                where: { id: session.user.id },
                data: {
                    isInfluencer: true,
                    influencerScore: { increment: 50 } // Base boost for connecting
                }
            })
        ]);

        return NextResponse.json({ success: true, followers: randomFollowers });
    } catch (error) {
        logger.error('Error connecting social account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
