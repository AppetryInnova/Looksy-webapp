import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const campaignId = (await params).id;

        // Verify campaign exists
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Apply
        const application = await prisma.campaignApplication.create({
            data: {
                campaignId,
                userId: session.user.id,
                status: 'PENDING',
                contractStatus: 'APPLIED',
                negotiatedPrice: campaign.rewardValue
            }
        });

        // Add a notification for user UX simulation
        await prisma.notification.create({
            data: {
                userId: session.user.id,
                type: 'CAMPAIGN_APPLY',
                title: 'Postulación Recibida',
                message: `Has aplicado exitosamente a la campaña: ${campaign.title}`,
                link: `/influencer/dashboard`
            }
        });

        return NextResponse.json({ success: true, application });

    } catch (error: any) {
        // Handle unique constraint failure
        if (error.code === 'P2002') {
             return NextResponse.json({ error: 'Already applied' }, { status: 400 });
        }
        logger.error(`Error applying to campaign ${(await params).id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
