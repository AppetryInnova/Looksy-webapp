import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import logger from '@/lib/logger';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const eventId = resolvedParams.id;
        const userId = (session.user as any).id;
        const body = await request.json();
        const { status, responseMessage, plusOnes } = body; // 'GOING', 'MAYBE', 'NOT_GOING'

        if (!['GOING', 'MAYBE', 'NOT_GOING'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const rsvp = await prisma.eventAttendee.upsert({
            where: {
                eventId_userId: { eventId, userId }
            },
            update: {
                rsvpStatus: status,
                responseMessage: responseMessage || null,
                plusOnes: plusOnes ? parseInt(plusOnes.toString()) : 0
            },
            create: {
                eventId,
                userId,
                rsvpStatus: status,
                responseMessage: responseMessage || null,
                plusOnes: plusOnes ? parseInt(plusOnes.toString()) : 0
            }
        });

        return NextResponse.json(rsvp);
    } catch (error) {
        logger.error('Error in event RSVP:', error);
        return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
    }
}
