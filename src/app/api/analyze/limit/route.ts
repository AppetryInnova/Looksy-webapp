import { NextResponse } from 'next/server';
import { aiRateLimiter } from '@/lib/redis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        if (!aiRateLimiter) {
            return NextResponse.json({ limitReached: false });
        }

        const session = await getServerSession(authOptions);
        
        // Bypass limit for Premium users
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                include: { subscription: true }
            });
            const plan = user?.subscription?.plan;
            if (plan === 'PRO' || plan === 'ELITE') {
                return NextResponse.json({ limitReached: false });
            }
        }

        const identifier = session?.user?.id || req.headers.get('x-forwarded-for') || '127.0.0.1';

        // Check the limit using Upstash
        const { success, limit, remaining, reset } = await aiRateLimiter.limit(identifier);

        if (!success) {
            return NextResponse.json({ 
                limitReached: true, 
                limit: limit, 
                reset: reset,
                isEarlyAdopter: true // Simulado para oferta
            });
        }

        return NextResponse.json({ 
            limitReached: false,
            remaining 
        });
        
    } catch (e) {
        console.error("Rate limit API error:", e);
        return NextResponse.json({ limitReached: false });
    }
}

