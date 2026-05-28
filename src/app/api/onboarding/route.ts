import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const {
            styles,
            brands,
            colors,
            sizePreferences,
            budgetRange,
            username,
            bio,
            avatarUrl,
            pronouns,
            privacySettings,
            facialProfile
        } = data;

        // Update user with onboarding data
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                onboardingCompleted: true,
                stylePreferences: JSON.stringify({ styles, brands, colors }),
                sizePreferences: JSON.stringify(sizePreferences),
                budgetRange: JSON.stringify(budgetRange),
                username: username || session.user.name,
                bio: bio || null,
                avatarUrl: avatarUrl || session.user.image,
                pronouns: pronouns || null,
                privacySettings: JSON.stringify(privacySettings),
                facialProfile: facialProfile ? JSON.stringify(facialProfile) : null,
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        logger.error('Onboarding error:', error);
        return NextResponse.json(
            { error: 'Failed to save onboarding data' },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                onboardingCompleted: true,
                stylePreferences: true,
                sizePreferences: true,
                budgetRange: true,
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        logger.error('Error fetching onboarding status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch onboarding status' },
            { status: 500 }
        );
    }
}
