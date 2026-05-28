import { generateNanoBananaVTO, analyzeFit } from '../src/lib/gemini.ts';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Mock images (1x1 transparent dot or small real images if available)
const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function test() {
    console.log("--- Testing Nano Banana (VTO Image) ---");
    try {
        const result = await generateNanoBananaVTO(dummyBase64, dummyBase64, 'top');
        console.log("Result type:", typeof result);
        if (result) {
            console.log("SUCCESS: Received generated image (starts with:", result.substring(0, 30), ")");
        } else {
            console.log("FAILURE: Received null (no image generated)");
        }
    } catch (e) {
        console.error("CRITICAL ERROR:", e.message);
    }

    console.log("\n--- Testing Analyze Fit (Text) ---");
    try {
        const report = await analyzeFit(dummyBase64, dummyBase64, 'es', 'top');
        console.log("Report received:", JSON.stringify(report, null, 2));
    } catch (e) {
        console.error("REPORT ERROR:", e.message);
    }
}

test();
