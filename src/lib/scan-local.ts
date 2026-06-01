import { prisma } from '@/lib/prisma';
import { analyzeImageCore } from '@/lib/gemini';
import { checkAndAwardBadges } from '@/lib/badges';
import logger from '@/lib/logger';

export async function processScanLocally(
    scanId: string,
    mode: string = 'OUTFIT',
    locale: string = 'es',
    location: string = '',
    facialProfile: string = ''
) {
    try {
        logger.info(`[Local Scan Fallback] Starting processing for scan: ${scanId}`);
        const scan = await prisma.scan.findUnique({
            where: { id: scanId },
        });

        if (!scan) {
            logger.error(`[Local Scan Fallback] Scan ${scanId} not found`);
            return;
        }

        // Fetch image and convert to base64
        const response = await fetch(scan.photoUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${scan.photoUrl}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        const mimeType = 'image/jpeg'; // Fallback to jpeg

        // Call Gemini
        const aiResult = await analyzeImageCore(
            base64Data,
            mimeType,
            mode as any,
            locale,
            location,
            facialProfile
        );

        // Update Scan in DB
        const pointsAwarded = 50;
        await prisma.$transaction(async (tx) => {
            await tx.scan.update({
                where: { id: scanId },
                data: {
                    aiFeedback: aiResult.feedback,
                    harmonyScore: aiResult.harmonyScore,
                    status: 'COMPLETED',
                },
            });

            // Update user points
            const user = await tx.user.update({
                where: { id: scan.userId },
                data: {
                    stylePoints: { increment: pointsAwarded },
                },
            });

            // Level up checks
            let newLevel = user.level;
            if (user.stylePoints >= 500 && user.level === 'New Face') {
                newLevel = 'Trend Hunter';
            } else if (user.stylePoints >= 1500 && user.level === 'Trend Hunter') {
                newLevel = 'Style Icon';
            }

            if (newLevel !== user.level) {
                await tx.user.update({
                    where: { id: user.id },
                    data: { level: newLevel },
                });
            }
        });

        // Award badges
        try {
            await checkAndAwardBadges(scan.userId);
        } catch (badgeErr) {
            logger.error('[Local Scan Fallback] Error awarding badges:', badgeErr);
        }

        logger.info(`[Local Scan Fallback] Finished processing scan ${scanId} successfully`);
    } catch (error: any) {
        logger.error(`[Local Scan Fallback] Error in processScanLocally for ${scanId}:`, error);
        try {
            await prisma.scan.update({
                where: { id: scanId },
                data: {
                    status: 'FAILED',
                    aiFeedback: `Error de análisis: ${error.message || 'Error interno del servidor de IA.'}`,
                },
            });
        } catch (dbErr) {
            logger.error(`[Local Scan Fallback] Failed to mark scan as FAILED:`, dbErr);
        }
    }
}
