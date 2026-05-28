import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { generateDailyOutfit } from '@/lib/gemini';
import { getDailyFitCache, setDailyFitCache } from '@/lib/daily-fit-cache';

// Weather code → text mapping (WMO standard)
function interpretWeatherCode(code: number): string {
    if (code <= 3)  return 'Despejado a ligeramente nublado';
    if (code <= 48) return 'Nublado o con niebla';
    if (code <= 69) return 'Lluvia o llovizna';
    if (code <= 79) return 'Nieve';
    return 'Tormenta';
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // ── 1. Serve from cache if fresh (1-hour TTL) ──────────────────────
        const cached = getDailyFitCache(userId);
        if (cached) {
            logger.debug(`[daily-fit] Cache HIT for user ${userId}`);
            return NextResponse.json(cached, {
                headers: { 'X-Cache': 'HIT' }
            });
        }

        logger.debug(`[daily-fit] Cache MISS for user ${userId}, generating...`);

        // ── 2. Fetch Weather (with AbortSignal timeout of 3s) ──────────────
        const url = new URL(request.url);
        const lat = url.searchParams.get('lat') || '-34.6037';
        const lng = url.searchParams.get('lng') || '-58.3816';

        let weatherText = 'Despejado';
        let temperature = 22;

        try {
            const controller = new AbortController();
            const weatherTimeout = setTimeout(() => controller.abort(), 3000);

            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`,
                { signal: controller.signal }
            );
            clearTimeout(weatherTimeout);

            if (weatherRes.ok) {
                const weatherData = await weatherRes.json();
                temperature = weatherData.current_weather.temperature;
                weatherText = interpretWeatherCode(weatherData.current_weather.weathercode);
            }
        } catch (weatherErr) {
            // Non-fatal: use defaults silently
            logger.warn('[daily-fit] Weather fetch failed, using defaults:', weatherErr);
        }

        // ── 3. Single optimized DB query (user + items together) ──────────
        const [items, user] = await Promise.all([
            prisma.item.findMany({
                where: { userId },
                select: { id: true, category: true, imageUrl: true, style: true, color: true },
                take: 30 // Cap at 30 items to keep prompt size small
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { stylePreferences: true }
            })
        ]);

        // Parse stylePreferences safely (stored as JSON string in DB)
        let stylePrefs: any = { styles: ['Casual'] };
        if (user?.stylePreferences) {
            try {
                stylePrefs = typeof user.stylePreferences === 'string'
                    ? JSON.parse(user.stylePreferences)
                    : user.stylePreferences;
            } catch {
                // Keep default
            }
        }

        // ── 4. Call Gemini (the slow part) ────────────────────────────────
        const recommendation = await generateDailyOutfit({
            weather: weatherText,
            temperature,
            wardrobe: items,
            stylePreferences: stylePrefs
        });

        const selectedItems = items.filter(item =>
            recommendation.selectedItemIds?.includes(item.id)
        );

        const result = {
            weather: { temperature, condition: weatherText },
            recommendation: {
                message: recommendation.message,
                items: selectedItems,
                generalSuggestions: recommendation.generalSuggestions ?? [],
                confidence: recommendation.confidence ?? 70
            }
        };

        // ── 5. Cache the result for 1 hour ────────────────────────────────
        setDailyFitCache(userId, result);

        return NextResponse.json(result, {
            headers: { 'X-Cache': 'MISS' }
        });

    } catch (error) {
        logger.error('Error serving daily fit:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
