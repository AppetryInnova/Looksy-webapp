import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await prisma.notification.updateMany({
            where: {
                userId: user.id,
                read: false
            },
            data: { read: true }
        });

        return NextResponse.json({ message: 'All notifications marked as read' });
    } catch (error) {
        logger.error('Error marking all as read:', error);
        return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
    }
}
