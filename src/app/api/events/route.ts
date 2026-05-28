import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const events = await prisma.event.findMany({
            where: {
                date: { gte: new Date() },
                visibility: 'PUBLIC'
            },
            orderBy: { date: 'asc' },
            include: {
                creator: { select: { name: true, username: true, avatarUrl: true } },
                _count: { select: { attendees: true } }
            }
        });
        return NextResponse.json(events);
    } catch (error) {
        logger.error('Error fetching events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
            requiresApproval
        } = body;

        if (!title || !date || !location || !dressCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newEvent = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                endTime: endTime ? new Date(endTime) : null,
                location,
                dressCode,
                imageUrl,
                visibility: visibility || 'PUBLIC',
                category,
                tags: tags ? JSON.stringify(tags) : null,
                maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
                requiresApproval: requiresApproval || false,
                creatorId: user.id,
                attendees: {
                    create: {
                        userId: user.id,
                        rsvpStatus: 'GOING'
                    }
                }
            }
        });

        // Proactive Decision: Notify followers if the event is PUBLIC
        if (visibility === 'PUBLIC') {
            try {
                const followers = await prisma.follow.findMany({
                    where: { followingId: user.id },
                    select: { followerId: true }
                });

                if (followers.length > 0) {
                    await prisma.notification.createMany({
                        data: followers.map(f => ({
                            userId: f.followerId,
                            type: 'EVENT_INVITE',
                            title: 'Nuevo Evento 📅',
                            message: `${user.username || user.name} ha creado un nuevo evento: ${title}`,
                            link: `/events/${newEvent.id}`
                        }))
                    });
                }
            } catch (notifyError) {
                logger.error('Error sending event notifications to followers:', notifyError);
                // We don't fail the whole request because notifications are secondary
            }
        }

        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
        logger.error('Error creating event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
