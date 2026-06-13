import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import logger from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan } = body; // FREE, PRO, ELITE

        if (!['FREE', 'PRO', 'ELITE'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // Upsert subscription
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const subscription = await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
                plan,
                status: 'ACTIVE',
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days mock
            },
            create: {
                userId: user.id,
                plan,
                status: 'ACTIVE',
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        return NextResponse.json(subscription);

    } catch (error) {
        logger.error('Error updating subscription:', error);
        return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Import monetization utilities
        const { isEarlyAdopter, getMonetizationPhase, getEarlyAdopterBenefits } = await import('@/lib/monetization');

        const earlyAdopter = isEarlyAdopter(user.createdAt);
        const phase = getMonetizationPhase();
        const benefits = earlyAdopter ? getEarlyAdopterBenefits() : null;

        return NextResponse.json({
            ...(user.subscription || { plan: 'FREE', status: 'ACTIVE' }),
            isEarlyAdopter: earlyAdopter,
            monetizationPhase: phase,
            earlyAdopterBenefits: benefits
        });

    } catch (error) {
        logger.error('Error fetching subscription:', error);
        return NextResponse.json({ error: 'Error fetching subscription' }, { status: 500 });
    }
}
