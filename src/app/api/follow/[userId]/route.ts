import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// GET /api/follow/[userId] - Check if current user follows this user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await params;

        const follow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: session.user.id,
                    followingId: userId
                }
            }
        });

        return NextResponse.json({
            isFollowing: !!follow,
            followId: follow?.id
        });
    } catch (error) {
        logger.error('Error checking follow status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/follow/[userId] - Follow a user
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await params;

        // Can't follow yourself
        if (session.user.id === userId) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        // Check if already following
        const existing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: session.user.id,
                    followingId: userId
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Already following' }, { status: 400 });
        }

        // Create follow
        const follow = await prisma.follow.create({
            data: {
                followerId: session.user.id,
                followingId: userId
            }
        });

        // Optional: Create notification for followed user
        await prisma.notification.create({
            data: {
                userId: userId,
                type: 'FOLLOW',
                title: 'New Follower',
                message: `${session.user.name || 'Someone'} started following you`,
                link: `/profile/${session.user.id}`
            }
        }).catch((err: unknown) => logger.error('Notification error:', err)); // Don't fail if notification fails

        return NextResponse.json({ success: true, follow });
    } catch (error) {
        logger.error('Error following user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/follow/[userId] - Unfollow a user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await params;

        await prisma.follow.deleteMany({
            where: {
                followerId: session.user.id,
                followingId: userId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error unfollowing user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
