import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import { logger } from '@/lib/logger';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: targetUserId } = await params;
        const authenticatedUserId = await getUserIdFromRequest(request);

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
                _count: {
                    select: { items: true, scans: true, eventsAttending: true, following: true, followers: true }
                },
                badges: true,
                subscription: true,
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check follow status
        let isFollowing = false;
        if (authenticatedUserId && authenticatedUserId !== targetUserId) {
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: authenticatedUserId,
                        followingId: targetUserId
                    }
                }
            });
            isFollowing = !!follow;
        }

        // Parse privacy visibility settings
        let isPrivate = false;
        if (targetUser.privacySettings) {
            try {
                const parsed = JSON.parse(targetUser.privacySettings);
                isPrivate = parsed.profileVisibility === 'private';
            } catch (_) {}
        }

        // Determine if profile is locked
        const isOwner = authenticatedUserId === targetUserId;
        const profileLocked = isPrivate && !isOwner && !isFollowing;

        if (profileLocked) {
            return NextResponse.json({
                id: targetUser.id,
                name: targetUser.name,
                username: targetUser.username,
                avatarUrl: targetUser.avatarUrl,
                isVerified: targetUser.isVerified,
                level: targetUser.level,
                isFollowing,
                profileLocked: true,
                _count: {
                    followers: targetUser._count.followers,
                    following: targetUser._count.following,
                    items: 0,
                    scans: 0,
                    eventsAttending: 0,
                }
            });
        }

        return NextResponse.json({
            id: targetUser.id,
            name: targetUser.name,
            username: targetUser.username,
            avatarUrl: targetUser.avatarUrl,
            isVerified: targetUser.isVerified,
            level: targetUser.level,
            bio: targetUser.bio,
            pronouns: targetUser.pronouns,
            location: targetUser.location,
            stylePoints: targetUser.stylePoints,
            badges: targetUser.badges,
            subscription: targetUser.subscription,
            isFollowing,
            profileLocked: false,
            _count: {
                followers: targetUser._count.followers,
                following: targetUser._count.following,
                items: targetUser._count.items,
                scans: targetUser._count.scans,
                eventsAttending: targetUser._count.eventsAttending,
            }
        });

    } catch (error) {
        logger.error('Error fetching external profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
