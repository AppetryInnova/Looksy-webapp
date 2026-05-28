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

        // Check if user is attendee
        const isAttendee = await prisma.eventAttendee.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: user.id
                }
            }
        });

        if (!isAttendee && event.creatorId !== user.id) {
            return NextResponse.json({ error: 'Only attendees can view photos' }, { status: 403 });
        }

        const photos = await prisma.eventPhoto.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(photos);
    } catch (error) {
        logger.error('Error fetching photos:', error);
        return NextResponse.json({ error: 'Error fetching photos' }, { status: 500 });
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

        // Check if user is attendee
        const isAttendee = await prisma.eventAttendee.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: user.id
                }
            }
        });

        if (!isAttendee && event.creatorId !== user.id) {
            return NextResponse.json({ error: 'Only attendees can upload photos' }, { status: 403 });
        }

        const body = await request.json();
        const { imageUrl, caption } = body;

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        const photo = await prisma.eventPhoto.create({
            data: {
                eventId,
                userId: user.id,
                username: user.username || user.name || 'Anonymous',
                imageUrl,
                caption
            }
        });

        return NextResponse.json(photo);
    } catch (error) {
        logger.error('Error uploading photo:', error);
        return NextResponse.json({ error: 'Error uploading photo' }, { status: 500 });
    }
}
