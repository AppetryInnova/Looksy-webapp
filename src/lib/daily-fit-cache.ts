/**
 * In-memory cache for Daily Fit responses.
 * Caches Gemini + weather results per user for 1 hour (3600s).
 * Resets naturally on server restart; no Redis required for this MVP.
 */

interface CacheEntry {
    data: any;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

export function getDailyFitCache(userId: string): any | null {
    const entry = cache.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(userId);
        return null;
    }
    return entry.data;
}

export function setDailyFitCache(userId: string, data: any): void {
    cache.set(userId, {
        data,
        expiresAt: Date.now() + TTL_MS
    });
}

export function invalidateDailyFitCache(userId: string): void {
    cache.delete(userId);
}
