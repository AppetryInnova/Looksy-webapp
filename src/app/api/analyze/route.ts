import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeImageCore } from '@/lib/gemini';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- Rate Limiting Enforcement (Google Gemini Cost Control) ---
        const { prisma } = await import('@/lib/prisma');
        const { aiRateLimiter } = await import('@/lib/redis');

        if (aiRateLimiter) {
            // Check if user is premium to bypass limits
            let isPremium = false;
            if (session.user.email) {
                const user = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    include: { subscription: true }
                });
                const plan = user?.subscription?.plan;
                if (plan === 'PRO' || plan === 'ELITE') {
                    isPremium = true;
                }
            }

            if (!isPremium) {
                const identifier = session.user.email || request.headers.get('x-forwarded-for') || '127.0.0.1';
                const { success, limit, reset } = await aiRateLimiter.limit(identifier);
                if (!success) {
                    logger.warn(`Rate limit exceeded for identifier ${identifier} in server-side Gemini analyze API.`);
                    return NextResponse.json({ 
                        error: 'Daily limit reached. Upgrade to PRO or ELITE for unlimited usage.',
                        limitReached: true,
                        limit,
                        reset
                    }, { status: 429 });
                }
            }
        }

        const formData = await request.formData();
        const file = formData.get('image') as File | null;
        const mode = formData.get('mode') as string | null;
        const locale = (formData.get('locale') as string) || 'es';
        const facialProfile = (formData.get('facialProfile') as string) || '';

        if (!file) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        if (!mode) {
            return NextResponse.json({ error: 'No analysis mode provided' }, { status: 400 });
        }

        // Convert the File object to base64 for the Gemini API
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';

        logger.info(`Running server-side Gemini analysis: Mode=${mode}, Locale=${locale}, Size=${buffer.length} bytes`);

        const result = await analyzeImageCore(
            base64Data,
            mimeType,
            mode as any,
            locale,
            '', // location context if any
            facialProfile
        );

        return NextResponse.json(result);
    } catch (error: any) {
        logger.error('Error in secure server-side image analysis:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze image' },
            { status: 500 }
        );
    }
}
