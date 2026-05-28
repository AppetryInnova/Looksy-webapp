import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { id: eventId } = await params;
        const event = await prisma.event.findUnique({ where: { id: eventId } });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Check if user is creator or co-host
        const isCreator = event.creatorId === user.id;
        const coHosts = event.coHosts ? JSON.parse(event.coHosts) : [];
        const isCoHost = coHosts.includes(user.id);

        if (!isCreator && !isCoHost) {
            return NextResponse.json({ error: 'Only creator and co-hosts can send invitations' }, { status: 403 });
        }

        const body = await request.json();
        const { inviteeIds, message } = body;

        if (!inviteeIds || !Array.isArray(inviteeIds) || inviteeIds.length === 0) {
            return NextResponse.json({ error: 'Invalid invitee IDs' }, { status: 400 });
        }

        // Create invitations
        const invitations = await Promise.all(
            inviteeIds.map(async (inviteeId: string) => {
                const invitation = await prisma.eventInvitation.upsert({
                    where: {
                        eventId_inviteeId: {
                            eventId,
                            inviteeId
                        }
                    },
                    update: {
                        inviterId: user.id,
                        message,
                        status: 'PENDING'
                    },
                    create: {
                        eventId,
                        inviterId: user.id,
                        inviteeId,
                        message,
                        status: 'PENDING'
                    }
                });

                // Create notification for invitee
                await prisma.notification.create({
                    data: {
                        userId: inviteeId,
                        type: 'EVENT_INVITE',
                        title: 'Event Invitation',
                        message: `${user.username || 'Someone'} invited you to ${event.title}`,
                        link: `/events/${eventId}`
                    }
                });

                return invitation;
            })
        );

        return NextResponse.json({ invitations, count: invitations.length });
    } catch (error) {
        logger.error('Error sending invitations:', error);
        return NextResponse.json({ error: 'Error sending invitations' }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { id: eventId } = await params;
        const event = await prisma.event.findUnique({ where: { id: eventId } });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Only creator and co-hosts can view invitations
        const isCreator = event.creatorId === user.id;
        const coHosts = event.coHosts ? JSON.parse(event.coHosts) : [];
        const isCoHost = coHosts.includes(user.id);

        if (!isCreator && !isCoHost) {
            return NextResponse.json({ error: 'Only creator and co-hosts can view invitations' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: Record<string, unknown> = { eventId };
        if (status) {
            where.status = status;
        }

        const invitations = await prisma.eventInvitation.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(invitations);
    } catch (error) {
        logger.error('Error fetching invitations:', error);
        return NextResponse.json({ error: 'Error fetching invitations' }, { status: 500 });
    }
}
