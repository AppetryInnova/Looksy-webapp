import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                username: true,
                bio: true,
                pronouns: true,
                location: true,
                emailNotifications: true,
                pushNotifications: true,
                notifyLikes: true,
                notifyComments: true,
                notifyFollows: true,
                notifyEvents: true,
                notifyBattles: true,
                notifyRecommendations: true,
                reducedMotion: true,
                highContrast: true,
                textSize: true,
                privacySettings: true,
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        logger.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Filter out undefined values and only update provided fields
        const updateData: Record<string, unknown> = {};
        const allowedFields = [
            'emailNotifications',
            'pushNotifications',
            'notifyLikes',
            'notifyComments',
            'notifyFollows',
            'notifyEvents',
            'notifyBattles',
            'notifyRecommendations',
            'reducedMotion',
            'highContrast',
            'textSize',
            'privacySettings',
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        logger.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Error updating settings' }, { status: 500 });
    }
}
