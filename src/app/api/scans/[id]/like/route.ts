import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Check if already liked
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_scanId: {
                    userId,
                    scanId: id
                }
            }
        });

        if (existingLike) {
            // Unlike
            await prisma.like.delete({
                where: { id: existingLike.id }
            });
            return NextResponse.json({ liked: false });
        } else {
            // Like
            await prisma.like.create({
                data: {
                    userId,
                    scanId: id
                }
            });

            // Create Notification
            const scan = await prisma.scan.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (scan && scan.userId !== userId) {
                await prisma.notification.create({
                    data: {
                        userId: scan.userId,
                        type: 'LIKE',
                        title: 'New Like',
                        message: 'Someone liked your style scan!',
                        link: `/scans/${id}`
                    }
                });
            }

            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        logger.error('Error toggling like:', error);
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        const likes = await prisma.like.findMany({
            where: { scanId: id }
        });

        const isLiked = userId ? likes.some(like => like.userId === userId) : false;

        return NextResponse.json({
            count: likes.length,
            isLiked
        });
    } catch (error) {
        logger.error('Error fetching likes:', error);
        return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 });
    }
}
