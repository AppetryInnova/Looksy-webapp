import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const attendees = await prisma.eventAttendee.findMany({
            where: { eventId: id },
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true
                    }
                }
            }
        });

        return NextResponse.json(attendees);
    } catch (error) {
        logger.error('Error fetching attendees:', error);
        return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
    }
}
