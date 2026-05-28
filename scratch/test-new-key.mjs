import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const TEXT_MODELS = ["gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];

async function runWithFallback(models, fn) {
  for (const modelName of models) {
    try {
      return await fn(modelName);
    } catch (e) {
      console.log(`  ${modelName} failed: ${e.message.slice(0, 60)}...`);
      continue;
    }
  }
  throw new Error("All models exhausted");
}

async function test() {
    const imagePath = 'C:\\Users\\nicol\\.gemini\\antigravity\\brain\\e18cc0be-5ee5-447b-915b-2477bd88b784\\test_fashion_outfit_1777667933918.png';
    const base64Data = fs.readFileSync(imagePath).toString('base64');
    const prompt = `Analiza este outfit. Responde JSON: {"feedback":"texto","harmonyScore":90,"style":"nombre"}`;

    console.log("🔑 Testing new API key:", process.env.GEMINI_API_KEY?.slice(0, 12) + "...");
    
    const result = await runWithFallback(TEXT_MODELS, async (modelName) => {
        console.log(`  Trying: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { response_mime_type: "application/json" } });
        const r = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType: "image/png" } }]);
        return JSON.parse(r.response.text());
    });

    console.log("\n✅ SUCCESS!");
    console.log(`  Score: ${result.harmonyScore}`);
    console.log(`  Style: ${result.style}`);
    console.log(`  Feedback: ${result.feedback?.slice(0, 100)}...`);
}

test().catch(e => console.error("❌ FAILED:", e.message));
