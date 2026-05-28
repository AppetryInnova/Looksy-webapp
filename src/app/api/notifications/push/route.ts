import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST — Register push subscription
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { endpoint, p256dh, auth } = await req.json();
        if (!endpoint || !p256dh || !auth) {
            return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 });
        }

        await prisma.pushSubscription.upsert({
            where: { endpoint },
            create: { userId: session.user.id, endpoint, p256dh, auth },
            update: { userId: session.user.id, p256dh, auth },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }
}

// DELETE — Remove push subscription
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { endpoint } = await req.json();
        if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

        await prisma.pushSubscription.deleteMany({
            where: { endpoint, userId: session.user.id },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
    }
}
