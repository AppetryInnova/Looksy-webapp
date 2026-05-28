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

        const { content } = await request.json();

        if (!content) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 });
        }

        const comment = await prisma.comment.create({
            data: {
                userId: session.user.id,
                username: session.user.username || session.user.name || 'User',
                content,
                scanId: id
            }
        });

        // Create Notification
        const scan = await prisma.scan.findUnique({
            where: { id },
            select: { userId: true }
        });

        const currentUserId = session.user.id;
        const currentUsername = session.user.username || session.user.name || 'User';

        if (scan && scan.userId !== currentUserId) {
            await prisma.notification.create({
                data: {
                    userId: scan.userId,
                    type: 'COMMENT',
                    title: 'New Comment',
                    message: `${currentUsername} commented: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
                    link: `/scans/${id}`
                }
            });
        }

        return NextResponse.json(comment);
    } catch (error) {
        logger.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const comments = await prisma.comment.findMany({
            where: { scanId: id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(comments);
    } catch (error) {
        logger.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}
