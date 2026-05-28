import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize global Redis connection exclusively if tokens exist
export const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Initialize an AI explicit Rate Limiter
// Limit free users to 10 scans per 24 hours. Premium protection.
export const aiRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '24 h'),
        analytics: true,
        // Prefix helps segment keys in Upstash Redis
        prefix: '@upstash/ratelimit/ai-scanner',
      })
    : null;
