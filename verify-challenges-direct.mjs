import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function generateChallenges() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY missing");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using the model specified in the code
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Generate 3 unique, relevant fashion challenges for a social app called "Looksy".
    
    Current Context:
    - Date: ${new Date().toISOString()}
    
    INSTRUCTIONS:
    1. Deduce the likely Season (e.g., Winter, Festival Season, Christmas, Summer) based on the date.
    2. Identify 3 distinct trending aesthetics or themes relevant to this specific time of year.
    3. Create a challenge for each theme.
    
    Return ONLY a valid JSON array of objects with this structure:
    [
      {
        "title": "Creative Title",
        "description": "Engaging description",
        "difficulty": "Easy" | "Medium" | "Hard",
        "category": "Trending" | "New" | "ForYou",
        "xp": number (300-1000),
        "badgeName": "Badge Name",
        "rules": ["Rule 1", "Rule 2", "Rule 3"]
      }
    ]
  `;

    console.log("Sending prompt to Gemini...");
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Raw Response:", text);

        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = cleanedText.indexOf('[');
        const lastBrace = cleanedText.lastIndexOf(']');

        if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON array found");

        const json = JSON.parse(cleanedText.substring(firstBrace, lastBrace + 1));
        console.log("Parsed JSON:", JSON.stringify(json, null, 2));

    } catch (error) {
        console.error("Failed to generate challenges:", error);
    }
}

generateChallenges();
