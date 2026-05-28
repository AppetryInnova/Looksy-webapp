import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';

dotenv.config();

async function listGeminiModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("NO API KEY FOUND IN .env");
        process.exit(1);
    }

    console.log("API Key loaded. Length:", apiKey.length);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        const modelNames = data.models ? data.models.map(m => m.name.replace('models/', '')) : [];
        console.log("Available Gemini Models:");
        console.log(modelNames.filter(n => n.includes('gemini-') && !n.includes('embedding')).join("\n"));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listGeminiModels();
