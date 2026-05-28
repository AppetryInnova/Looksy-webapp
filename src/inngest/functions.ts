import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { analyzeImageCore, analyzeFit, generateNanoBananaVTO } from "@/lib/gemini";
import logger from "@/lib/logger";

export const analyzeScanJob = inngest.createFunction(
  { id: "analyze-scan", triggers: { event: "scan/created" } },
  async ({ event, step }) => {
    const { scanId, mode, locale, location, facialProfile } = event.data;

    // 1. Fetch scan to get photoUrl
    const scan = await step.run("fetch-scan", async () => {
      return await prisma.scan.findUnique({
        where: { id: scanId },
      });
    });

    if (!scan) {
      logger.error(`Scan ${scanId} not found`);
      return;
    }

    try {
      // 2. Fetch image and convert to base64
      // Note: In a real scenario, we might want to fetch from Supabase Storage
      const base64Data = await step.run("fetch-image-base64", async () => {
        const response = await fetch(scan.photoUrl);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
      });

      // 3. Call Gemini
      const aiResult = await step.run("gemini-analysis", async () => {
        return await analyzeImageCore(
          base64Data,
          "image/jpeg", // Assuming jpeg for now, should ideally store mimeType in DB
          mode,
          locale,
          location,
          facialProfile
        );
      });

      // 4. Update Scan in DB
      await step.run("update-scan", async () => {
        await prisma.scan.update({
          where: { id: scanId },
          data: {
            aiFeedback: aiResult.feedback,
            harmonyScore: aiResult.harmonyScore,
            status: "COMPLETED",
          },
        });
      });

      return { success: true };

    } catch (error: any) {
      logger.error(`Error in analyzeScanJob for ${scanId}:`, error);
      
      await step.run("mark-as-failed", async () => {
        await prisma.scan.update({
          where: { id: scanId },
          data: {
            status: "FAILED",
            aiFeedback: `Error: ${error.message || "Failed to analyze image."}`,
          },
        });
      });

      return { success: false, error: error.message };
    }
  }
);

export const generateVTOJob = inngest.createFunction(
  { id: "generate-vto", triggers: { event: "vto/generate" } },
  async ({ event, step }) => {
    const { jobId } = event.data;

    const job = await step.run("fetch-job", async () => {
      return await prisma.vTOJob.findUnique({ where: { id: jobId } });
    });

    if (!job) {
      logger.error(`VTO Job ${jobId} not found`);
      return;
    }

    try {
      await step.run("mark-processing", async () => {
        await prisma.vTOJob.update({
          where: { id: jobId },
          data: { status: "PROCESSING" }
        });
      });

      const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

      async function fetchImageAsBase64(url: string) {
          const absoluteUrl = url.startsWith('/') ? `https://localhost:3000${url}` : url; // simplified, Inngest might fail on relative URLs, we should pass absolutes from frontend
          const response = await fetch(absoluteUrl);
          if (!response.ok) throw new Error(`Failed to fetch image`);
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer).toString('base64');
      }

      let finalUrl = null;
      let aiReport = null;

      if (!REPLICATE_API_TOKEN) {
          // Nano Banana (Gemini)
          const [userBase64, garmentBase64] = await step.run("fetch-images", async () => {
              return await Promise.all([
                  fetchImageAsBase64(job.baseModelUrl),
                  fetchImageAsBase64(job.garmentImageUrl)
              ]);
          });

          const results = await step.run("generate-nano-banana", async () => {
              const [report, url] = await Promise.all([
                  analyzeFit(userBase64, garmentBase64, 'es', job.category),
                  generateNanoBananaVTO(userBase64, garmentBase64, job.category)
              ]);
              return { report, url };
          });
          
          aiReport = results.report;
          finalUrl = results.url || job.baseModelUrl;
      } else {
          // Replicate Premium
          finalUrl = await step.run("generate-replicate", async () => {
              const response = await fetch("https://api.replicate.com/v1/predictions", {
                  method: "POST",
                  headers: {
                      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                      version: "03b751de61d974044132e1673a359c20e1a4645228549cf06296799049386c91",
                      input: {
                          garm_img: job.garmentImageUrl,
                          human_img: job.baseModelUrl,
                          garment_des: "fashion item",
                          category: job.category 
                      },
                  }),
              });

              if (!response.ok) throw new Error("Replicate API error");
              let prediction = await response.json();
              
              let retries = 0;
              while ((prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") && retries < 30) {
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                      headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
                  });
                  prediction = await pollRes.json();
                  retries++;
              }

              if (prediction.status === "succeeded") {
                  return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
              } else {
                  throw new Error(`Generation failed: ${prediction.status}`);
              }
          });
      }

      await step.run("mark-completed", async () => {
        await prisma.vTOJob.update({
          where: { id: jobId },
          data: {
            status: "COMPLETED",
            generatedUrl: finalUrl,
            aiReport: aiReport ? JSON.stringify(aiReport) : null
          }
        });
      });

      return { success: true, url: finalUrl };

    } catch (error: any) {
      logger.error(`Error in generateVTOJob ${jobId}:`, error);
      await step.run("mark-failed", async () => {
        await prisma.vTOJob.update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            error: error.message || "Failed to generate VTO"
          }
        });
      });
      return { success: false, error: error.message };
    }
  }
);
