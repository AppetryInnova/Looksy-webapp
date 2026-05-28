import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const TEXT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

async function runWithFallback(models, fn) {
  for (const model of models) {
    try {
      return await fn(model);
    } catch (e) {
      if (e.message?.includes('429') || e.message?.includes('quota') || e.message?.includes('503')) {
        console.log(`  Model ${model} unavailable, trying next...`);
        continue;
      }
      throw e;
    }
  }
  throw new Error("All models exhausted");
}

async function analyzeImage(base64Data, mimeType) {
  const prompt = `Eres el Asesor de Estilo Personal de Looksy, experto en moda de lujo.
Analiza la imagen adjunta.
Responde ÚNICAMENTE con este JSON válido (sin texto extra ni markdown):
{"feedback":"Análisis detallado de 2-3 párrafos.","harmonyScore":85,"style":"Nombre del estilo"}`;

  return runWithFallback(TEXT_MODELS, async (modelName) => {
    console.log(`  Using: ${modelName}`);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { response_mime_type: "application/json" }
    });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType } }
    ]);
    return JSON.parse(result.response.text());
  });
}

async function main() {
  const pendingScans = await prisma.scan.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${pendingScans.length} pending scans to process\n`);
  if (pendingScans.length === 0) {
    console.log("Nothing to do! All scans are already processed.");
    await prisma.$disconnect();
    return;
  }

  for (const scan of pendingScans) {
    console.log(`Processing: ${scan.id}`);
    try {
      const response = await fetch(scan.photoUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      console.log(`  Size: ${(arrayBuffer.byteLength / 1024).toFixed(1)} KB`);

      const aiResult = await analyzeImage(base64Data, mimeType);
      console.log(`  ✅ Score: ${aiResult.harmonyScore} | Style: ${aiResult.style}`);

      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          aiFeedback: aiResult.feedback,
          harmonyScore: Number(aiResult.harmonyScore) || 80,
          status: 'COMPLETED'
        }
      });
    } catch (err) {
      console.error(`  ❌ ${err.message}`);
      await prisma.scan.update({
        where: { id: scan.id },
        data: { aiFeedback: `Error: ${err.message}`, status: 'FAILED' }
      });
    }
    console.log();
  }

  await prisma.$disconnect();
  console.log("All done!");
}

main().catch(console.error);
