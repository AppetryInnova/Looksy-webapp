import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get user's stores
        const stores = await prisma.store.findMany({
            where: { ownerId: session.user.id },
            include: {
                campaigns: {
                    include: {
                        applications: {
                            include: {
                                user: {
                                    select: {
                                        username: true,
                                        influencerScore: true,
                                        socialConnections: { select: { followerCount: true } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Aggregate metrics across all stores
        let totalApplications = 0;
        let approvedApplications = 0;
        let completedApplications = 0;
        let estimatedReach = 0;
        let budgetUsed = 0;
        let totalBudget = 0;
        const campaignBreakdown: {
            id: string;
            title: string;
            status: string;
            budget: number | null;
            applications: number;
            approved: number;
            estimatedReach: number;
        }[] = [];

        for (const store of stores) {
            for (const campaign of store.campaigns) {
                const apps = campaign.applications;
                const approved = apps.filter(a => a.status === 'APPROVED' || a.status === 'COMPLETED');
                const campaignReach = approved.reduce((sum, app) => {
                    const followers = app.user.socialConnections.reduce((s, sc) => s + sc.followerCount, 0);
                    return sum + followers;
                }, 0);

                totalApplications += apps.length;
                approvedApplications += approved.length;
                completedApplications += apps.filter(a => a.status === 'COMPLETED').length;
                estimatedReach += campaignReach;
                if (campaign.budget) {
                    totalBudget += campaign.budget;
                    const spent = approved.reduce((s, a) => s + (a.negotiatedPrice ?? campaign.rewardValue ?? 0), 0);
                    budgetUsed += spent;
                }

                campaignBreakdown.push({
                    id: campaign.id,
                    title: campaign.title,
                    status: campaign.status,
                    budget: campaign.budget,
                    applications: apps.length,
                    approved: approved.length,
                    estimatedReach: campaignReach,
                });
            }
        }

        return NextResponse.json({
            stores: stores.length,
            totalCampaigns: stores.reduce((s, st) => s + st.campaigns.length, 0),
            totalApplications,
            approvedApplications,
            completedApplications,
            pendingApplications: totalApplications - approvedApplications - completedApplications,
            estimatedReach,
            totalBudget,
            budgetUsed,
            budgetRemaining: totalBudget - budgetUsed,
            conversionRate: totalApplications > 0
                ? Math.round((approvedApplications / totalApplications) * 100)
                : 0,
            campaignBreakdown,
        });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
