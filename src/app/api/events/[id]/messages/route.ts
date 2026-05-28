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

        // Check if user has access to event
        const isCreator = event.creatorId === user.id;
        const isAttendee = await prisma.eventAttendee.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: user.id
                }
            }
        });
        const isInvited = await prisma.eventInvitation.findUnique({
            where: {
                eventId_inviteeId: {
                    eventId,
                    inviteeId: user.id
                }
            }
        });

        if (!isCreator && !isAttendee && !isInvited && event.visibility !== 'PUBLIC') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const messages = await prisma.eventMessage.findMany({
            where: { eventId },
            orderBy: { createdAt: 'asc' },
            take: limit,
            skip: offset
        });

        return NextResponse.json(messages);
    } catch (error) {
        logger.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Error fetching messages' }, { status: 500 });
    }
}

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

        // Check if user has access to event
        const isCreator = event.creatorId === user.id;
        const isAttendee = await prisma.eventAttendee.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: user.id
                }
            }
        });
        const isInvited = await prisma.eventInvitation.findUnique({
            where: {
                eventId_inviteeId: {
                    eventId,
                    inviteeId: user.id
                }
            }
        });

        if (!isCreator && !isAttendee && !isInvited && event.visibility !== 'PUBLIC') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const body = await request.json();
        const { content, imageUrl } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        const message = await prisma.eventMessage.create({
            data: {
                eventId,
                userId: user.id,
                username: user.username || user.name || 'Anonymous',
                avatarUrl: user.avatarUrl || user.image,
                content: content.trim(),
                imageUrl
            }
        });

        return NextResponse.json(message);
    } catch (error) {
        logger.error('Error creating message:', error);
        return NextResponse.json({ error: 'Error creating message' }, { status: 500 });
    }
}
