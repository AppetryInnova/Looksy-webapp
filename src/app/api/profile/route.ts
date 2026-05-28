import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import logger from '@/lib/logger';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = session.user.email;

        let user = await prisma.user.findUnique({
            where: { email },
            include: {
                _count: {
                    select: { items: true, scans: true, eventsAttending: true },
                },
                badges: true,
                subscription: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // --- Gamification Logic Start ---
        // Dynamically calculate level and check for badges on every profile load (or could be event-driven)
        // For simplicity, we do it here to ensure consistency.

        // 0. Update Daily Streak
        const now = new Date();
        const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let streakUpdated = false;
        let newStreak = user.currentStreak;

        if (!lastActive) {
            // First time active
            newStreak = 1;
            streakUpdated = true;
        } else {
            const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

            if (lastActiveDay.getTime() < yesterday.getTime()) {
                // Missed a day (or more)
                newStreak = 1;
                streakUpdated = true;
            } else if (lastActiveDay.getTime() === yesterday.getTime()) {
                // Continued streak
                newStreak += 1;
                streakUpdated = true;
            }
            // If equal to today, do nothing
        }

        if (streakUpdated) {
            const updateData: Record<string, unknown> = {
                currentStreak: newStreak,
                lastActiveDate: now
            };

            if (newStreak > user.maxStreak) {
                updateData.maxStreak = newStreak;
            }

            user = await prisma.user.update({
                where: { id: user.id },
                data: updateData,
                include: {
                    _count: { select: { items: true, scans: true, eventsAttending: true } },
                    badges: true,
                    subscription: true,
                }
            });
        }


        // 1. Update Level
        const { calculateLevel, checkBadgeUnlocks, BADGES } = await import('@/lib/gamification');
        const currentLevel = calculateLevel(user.stylePoints);

        if (user.level !== currentLevel) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { level: currentLevel },
                include: {
                    _count: { select: { items: true, scans: true, eventsAttending: true } },
                    badges: true,
                    subscription: true,
                }
            });
        }

        // 2. Check for new badges
        // We need to see which badges the user *should* have vs what they *do* have.
        const unlockedBadges = checkBadgeUnlocks(user._count);
        const existingBadgeNames = new Set(user.badges.map(b => b.name));

        const newBadgesToAward = unlockedBadges.filter(b => !existingBadgeNames.has(b.name));

        if (newBadgesToAward.length > 0) {
            // We need to ensure these badges exist in the DB first (idempotent seed)
            // Then connect them to the user.

            for (const badgeDef of newBadgesToAward) {
                // Upsert badge definition to ensure it exists
                const dbBadge = await prisma.badge.upsert({
                    where: { name: badgeDef.name },
                    update: {},
                    create: {
                        name: badgeDef.name,
                        description: badgeDef.description,
                        iconUrl: badgeDef.iconUrl,
                        criteria: JSON.stringify(badgeDef.criteria)
                    }
                });

                // Connect to user
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        badges: {
                            connect: { id: dbBadge.id }
                        }
                    }
                });
            }

            // Refetch user to get updated badges
            user = await prisma.user.findUnique({
                where: { email },
                include: {
                    _count: { select: { items: true, scans: true, eventsAttending: true } },
                    badges: true,
                    subscription: true,
                },
            });
        }
        // --- Gamification Logic End ---

        return NextResponse.json(user);
    } catch (error) {
        logger.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 });
    }
}
export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { username, avatarUrl, bio, pronouns, location } = body;

        const updateData: Record<string, unknown> = {};
        if (username !== undefined) updateData.username = username;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (bio !== undefined) updateData.bio = bio;
        if (pronouns !== undefined) updateData.pronouns = pronouns;
        if (location !== undefined) updateData.location = location;

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
        });

        return NextResponse.json(user);
    } catch (error) {
        logger.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Error updating profile' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { username, avatarUrl } = body;

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                username,
                avatarUrl,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        logger.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Error updating profile' }, { status: 500 });
    }
}

