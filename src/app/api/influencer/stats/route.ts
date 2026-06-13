import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import logger from '@/lib/logger';

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                socialConnections: true,
                campaignApplications: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const totalFollowers = user.socialConnections.reduce((sum, conn) => sum + (conn.followerCount || 0), 0);
        
        // Mock engagement rate based on followers and some randomness
        const engagementRate = totalFollowers > 0 ? (3.5 + Math.random() * 2).toFixed(2) : 0;
        
        // Estimated valuation per post based on followers (simple formula for demo)
        const valuation = Math.floor(totalFollowers * 0.005) + Math.floor((user.influencerScore || 0) * 0.5);

        // Growth simulation
        const growth = (2.4 + Math.random() * 1.5).toFixed(1);

        return NextResponse.json({
            isInfluencer: user.isInfluencer,
            influencerScore: user.influencerScore || 0,
            walletBalance: user.walletBalance.toFixed(2),
            totalFollowers,
            engagementRate,
            activeApplications: user.campaignApplications.length,
            valuation,
            growth,
            pendingPayments: (user.campaignApplications.filter(a => a.status === 'COMPLETED').length * 25).toFixed(2)
        });

    } catch (error) {
        logger.error('Error fetching influencer stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
