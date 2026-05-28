const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // There is no direct listModels in the standard SDK easily accessible like this without a specific client
    // But we can try to "guess" or use the REST API via fetch to be sure
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("Available Models:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
