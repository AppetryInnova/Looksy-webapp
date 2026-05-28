import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { id: true, username: true, avatarUrl: true, email: true }
                },
                attendees: {
                    include: {
                        user: {
                            select: { id: true, username: true, avatarUrl: true }
                        },
                        plannedOutfit: true
                    }
                },
                invitations: true,
                _count: {
                    select: { attendees: true, messages: true, photos: true }
                }
            }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Check permissions for private events
        if (event.visibility !== 'PUBLIC') {
            if (!session?.user?.email) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            // Check if user is creator, attendee, or invited
            const isCreator = event.creatorId === user.id;
            const isAttendee = event.attendees.some(a => a.userId === user.id);
            const isInvited = event.invitations.some(i => i.inviteeId === user.id);

            if (!isCreator && !isAttendee && !isInvited) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
        }

        // Add user's RSVP status if logged in
        let userRSVP = null;
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) {
                const userAttendee = event.attendees.find(a => a.userId === user.id);
                userRSVP = userAttendee?.rsvpStatus || null;
            }
        }

        return NextResponse.json({ ...event, userRSVP });
    } catch (error) {
        logger.error('Error fetching event:', error);
        return NextResponse.json({ error: 'Error fetching event' }, { status: 500 });
    }
}

export async function PATCH(
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
            return NextResponse.json({ error: 'Only creator and co-hosts can edit this event' }, { status: 403 });
        }

        const body = await request.json();
        const {
            title,
            description,
            date,
            endTime,
            location,
            dressCode,
            imageUrl,
            visibility,
            category,
            tags,
            maxAttendees,
            requiresApproval,
            coHosts: newCoHosts
        } = body;

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(date && { date: new Date(date) }),
                ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
                ...(location && { location }),
                ...(dressCode && { dressCode }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(visibility && { visibility }),
                ...(category !== undefined && { category }),
                ...(tags !== undefined && { tags }),
                ...(maxAttendees !== undefined && { maxAttendees }),
                ...(requiresApproval !== undefined && { requiresApproval }),
                ...(newCoHosts !== undefined && { coHosts: newCoHosts })
            }
        });

        return NextResponse.json(updatedEvent);
    } catch (error) {
        logger.error('Error updating event:', error);
        return NextResponse.json({ error: 'Error updating event' }, { status: 500 });
    }
}

export async function DELETE(
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

        // Only creator can delete
        if (event.creatorId !== user.id) {
            return NextResponse.json({ error: 'Only the creator can delete this event' }, { status: 403 });
        }

        await prisma.event.delete({ where: { id: eventId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Error deleting event' }, { status: 500 });
    }
}
