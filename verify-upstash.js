require('dotenv').config();
const { Redis } = require('@upstash/redis');

async function testUpstash() {
    console.log("Testing Upstash Redis Connection...");
    
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.error("Upstash credentials missing in .env");
        return;
    }

    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    try {
        await redis.set('test-key', 'Hello Latin America!');
        const value = await redis.get('test-key');
        console.log("Upstash Redis connection successful!");
        console.log("Retrieved value:", value);
        await redis.del('test-key');
    } catch (e) {
        console.error("Upstash Redis connection failed:", e);
    }
}

testUpstash();
