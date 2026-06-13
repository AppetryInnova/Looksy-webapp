import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';

// POST /api/subscription/checkout — Simulated checkout (Stripe-ready)
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan, paymentMethod } = await req.json();

        if (!['PRO', 'ELITE'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // ── STRIPE INTEGRATION POINT ──
        // In production, replace the block below with:
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        // const session = await stripe.checkout.sessions.create({ ... });
        // return NextResponse.json({ redirectUrl: session.url });

        // Simulate payment processing delay (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update subscription in DB
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await prisma.subscription.upsert({
            where: { userId },
            create: {
                userId,
                plan,
                status: 'ACTIVE',
                endDate,
            },
            update: {
                plan,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate,
            },
        });


        return NextResponse.json({
            success: true,
            plan,
            message: `Suscripción ${plan} activada correctamente`,
            nextBillingDate: endDate.toISOString(),
        });
    } catch (err) {
        return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
    }
}
