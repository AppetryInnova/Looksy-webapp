import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAndAwardBadges } from '@/lib/badges';
import logger from '@/lib/logger';
import { inngest } from '@/lib/inngest';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        let userId = session?.user?.id;

        // Mobile clients using Supabase Bearer token
        if (!userId) {
            const authHeader = request.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const { data: { user: sbUser }, error } = await supabase.auth.getUser(token);
                    if (sbUser && !error) {
                        userId = sbUser.id;
                    }
                } catch (err) {
                    logger.error('Error verifying Supabase token in scans:', err);
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // --- Rate Limiting Logic with Monetization Support ---
        const { shouldEnforceLimits, getUsageLimits } = await import('@/lib/monetization');
        const plan = user.subscription?.plan || 'FREE';
        const isPremium = plan === 'ELITE' || plan === 'PRO';

        // Check if we should enforce limits based on current monetization phase
        if (shouldEnforceLimits(user.createdAt, isPremium)) {
            const limits = getUsageLimits(user.createdAt, isPremium);

            if (!limits.unlimited) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const dailyScans = await prisma.scan.count({
                    where: {
                        userId: user.id,
                        createdAt: {
                            gte: today
                        }
                    }
                });

                if (dailyScans >= limits.scansPerDay) {
                    return NextResponse.json({
                        error: `Daily scan limit reached (${limits.scansPerDay}/day). Upgrade to Elite for unlimited scans.`,
                        limitReached: true
                    }, { status: 403 });
                }
            }
        }
        // ---------------------------

        const body = await request.json();
        const { photoUrl, aiFeedback, harmonyScore, isAsync, mode, locale, location, facialProfile } = body;

        if (isAsync) {
            // 1. Create PENDING scan
            const scan = await prisma.scan.create({
                data: {
                    userId: user.id,
                    photoUrl,
                    aiFeedback: "Processing with AI...",
                    harmonyScore: 0,
                    status: "PENDING",
                },
            });

            // 2. Dispatch Inngest Event
            try {
                await inngest.send({
                    name: "scan/created",
                    data: {
                        scanId: scan.id,
                        mode: mode || 'OUTFIT',
                        locale: locale || 'en',
                        location: location || '',
                        facialProfile: facialProfile || '',
                    },
                });
            } catch (inngestErr) {
                logger.warn("Inngest send failed in scans, running local background fallback:", inngestErr);
                
                // Run the scan analysis asynchronously using setTimeout so we don't block the API response
                setTimeout(async () => {
                    try {
                        const { processScanLocally } = await import('@/lib/scan-local');
                        await processScanLocally(
                            scan.id,
                            mode || 'OUTFIT',
                            locale || 'es',
                            location || '',
                            facialProfile || ''
                        );
                    } catch (err) {
                        logger.error(`Local scan fallback processing failed for scan ${scan.id}:`, err);
                    }
                }, 100);
            }

            return NextResponse.json({
                scan,
                status: "PENDING",
                message: "Analysis started in background"
            });
        }

        // 1. Save the scan (Synchronous flow)
        const scan = await prisma.scan.create({
            data: {
                userId: user.id,
                photoUrl,
                aiFeedback,
                harmonyScore,
            },
        });

        // 2. Award points (Gamification)
        const pointsAwarded = 50; // Base points for a scan

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                stylePoints: { increment: pointsAwarded },
            },
        });

        // 3. Check for level up (Simple logic)
        // Note: Real logic should probably be in a shared lib or use the one in profile route
        let newLevel = updatedUser.level;
        if (updatedUser.stylePoints >= 500 && updatedUser.level === 'New Face') {
            newLevel = 'Trend Hunter';
        } else if (updatedUser.stylePoints >= 1500 && updatedUser.level === 'Trend Hunter') {
            newLevel = 'Style Icon';
        }

        if (newLevel !== updatedUser.level) {
            await prisma.user.update({
                where: { id: user.id },
                data: { level: newLevel },
            });
        }

        // 4. Check for badge unlocks
        const newBadges = await checkAndAwardBadges(user.id);

        return NextResponse.json({
            scan,
            pointsAwarded,
            newLevel,
            newBadges
        });
    } catch (error) {
        logger.error('Error saving scan:', error);
        return NextResponse.json({ error: 'Error saving scan' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const following = searchParams.get('following') === 'true';

        let where: Record<string, unknown> = {};

        if (userId) {
            where.userId = userId;
        } else if (following) {
            if (!session || !session.user?.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            // Get list of followed user IDs
            const followedUsers = await prisma.follow.findMany({
                where: { followerId: session.user.id },
                select: { followingId: true }
            });

            const followedIds = followedUsers.map(f => f.followingId);
            where.userId = { in: followedIds };
        }

        const scans = await prisma.scan.findMany({
            where,
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, username: true, avatarUrl: true }
                }
            }
        });
        return NextResponse.json(scans);
    } catch (error) {
        logger.error('Error fetching scans:', error);
        return NextResponse.json({ error: 'Error fetching scans' }, { status: 500 });
    }
}
