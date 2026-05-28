import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { read } = body;

        const notification = await prisma.notification.update({
            where: { id },
            data: { read }
        });

        return NextResponse.json(notification);
    } catch (error) {
        logger.error('Error updating notification:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.notification.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Notification deleted' });
    } catch (error) {
        logger.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
}
