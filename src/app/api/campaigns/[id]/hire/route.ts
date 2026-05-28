
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params; // Campaign ID
        const body = await request.json();
        const { applicantId } = body;

        // Verify Campaign Ownership
        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: { store: true }
        });

        if (!campaign || (campaign.store as any).ownerId !== (session.user as any).id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Update Application Status
        const updatedApp = await prisma.campaignApplication.update({
            where: {
                campaignId_userId: {
                    campaignId: id,
                    userId: applicantId
                }
            },
            data: {
                status: 'APPROVED',
                contractStatus: 'SIGNED'
            } as any
        });

        return NextResponse.json(updatedApp);

    } catch (error) {
        return NextResponse.json({ error: 'Failed to hire' }, { status: 500 });
    }
}
