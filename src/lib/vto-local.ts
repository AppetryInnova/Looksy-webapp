import { prisma } from '@/lib/prisma';
import { analyzeFit, generateNanoBananaVTO } from '@/lib/gemini';
import logger from '@/lib/logger';

export async function processVtoJobLocally(jobId: string) {
    try {
        logger.info(`[Local VTO Fallback] Starting processing for job: ${jobId}`);
        const job = await prisma.vTOJob.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            logger.error(`[Local VTO Fallback] VTO Job ${jobId} not found`);
            return;
        }

        // 1. Mark as PROCESSING
        await prisma.vTOJob.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' }
        });

        // 2. Fetch images and convert to base64
        async function fetchImageAsBase64(url: string) {
            const absoluteUrl = url.startsWith('/') ? `http://localhost:3000${url}` : url;
            const response = await fetch(absoluteUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer).toString('base64');
        }

        logger.info(`[Local VTO Fallback] Fetching base model and garment images...`);
        const userBase64 = await fetchImageAsBase64(job.baseModelUrl);
        const garmentBase64 = await fetchImageAsBase64(job.garmentImageUrl);

        // 3. Call Gemini VTO and Fit analysis
        logger.info(`[Local VTO Fallback] Calling Gemini for Try-On simulation...`);
        const [report, resultUrl] = await Promise.all([
            analyzeFit(userBase64, garmentBase64, 'es', job.category),
            generateNanoBananaVTO(userBase64, garmentBase64, job.category)
        ]);

        const finalUrl = resultUrl || job.baseModelUrl;

        // 4. Mark as COMPLETED
        await prisma.vTOJob.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                generatedUrl: finalUrl,
                aiReport: report ? JSON.stringify(report) : null
            }
        });

        logger.info(`[Local VTO Fallback] Finished VTO processing for job ${jobId} successfully`);
    } catch (error: any) {
        logger.error(`[Local VTO Fallback] Error in processVtoJobLocally for job ${jobId}:`, error);
        try {
            await prisma.vTOJob.update({
                where: { id: jobId },
                data: {
                    status: 'FAILED',
                    error: error.message || 'Error durante la generación de prueba virtual.'
                }
            });
        } catch (dbErr) {
            logger.error(`[Local VTO Fallback] Failed to mark job as FAILED:`, dbErr);
        }
    }
}
