import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import { logger } from '@/lib/logger';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const authenticatedUserId = await getUserIdFromRequest(request);

        // Fetch target user's privacy
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { privacySettings: true }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if caller is follower
        let isFollowing = false;
        if (authenticatedUserId && authenticatedUserId !== userId) {
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: authenticatedUserId,
                        followingId: userId
                    }
                }
            });
            isFollowing = !!follow;
        }

        let isPrivate = false;
        if (targetUser.privacySettings) {
            try {
                const parsed = JSON.parse(targetUser.privacySettings);
                isPrivate = parsed.profileVisibility === 'private';
            } catch (_) {}
        }

        const isOwner = authenticatedUserId === userId;
        if (isPrivate && !isOwner && !isFollowing) {
            return NextResponse.json({ error: 'Private profile' }, { status: 403 });
        }

        // Fetch following
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            include: {
                following: {
                    select: { id: true, name: true, username: true, avatarUrl: true, isVerified: true, level: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const list = following.map(f => f.following);
        return NextResponse.json(list);

    } catch (error) {
        logger.error('Error fetching following:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
