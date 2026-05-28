const { generateChallenges } = require('../src/lib/gemini');
require('dotenv').config({ path: '.env' }); // Need dotenv to interpret .env

async function testGen() {
    console.log("Testing generation...");
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ NO API KEY FOUND IN ENV");
        return;
    }
    console.log("API Key present (starts with):", process.env.GEMINI_API_KEY.substring(0, 4) + "...");

    try {
        const challenges = await generateChallenges({ date: new Date().toISOString() });
        console.log("Result:", JSON.stringify(challenges, null, 2));
    } catch (e) {
        console.error("Fatal error:", e);
    }
}

testGen();
