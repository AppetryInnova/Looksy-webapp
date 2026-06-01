import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadLooksyMedia } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import logger from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        let userId = session?.user?.id;

        // Support mobile clients or NextAuth
        if (!userId) {
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const { data: { user: sbUser }, error } = await supabase.auth.getUser(token);
                    if (sbUser && !error) {
                        userId = sbUser.id;
                    }
                } catch (err) {
                    logger.error('Error verifying Supabase token in twin update:', err);
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { baseModelUrl, twinBackground } = body;

        if (!baseModelUrl && !twinBackground) {
            return NextResponse.json({ error: 'baseModelUrl or twinBackground is required' }, { status: 400 });
        }

        let processedUrl = baseModelUrl;
        const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

        if (baseModelUrl && REPLICATE_API_TOKEN) {
            try {
                logger.info(`Running background removal on Replicate for twin: ${baseModelUrl}`);
                
                // Call lucataco/remove-background model
                const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        version: "95f8a55543c7b2c0199736e4f3a359c20e1a4645228549cf06296799049386c91",
                        input: {
                            image: baseModelUrl
                        },
                    }),
                });

                if (replicateRes.ok) {
                    let prediction = await replicateRes.json();
                    let retries = 0;
                    
                    while ((prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") && retries < 30) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                            headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
                        });
                        prediction = await pollRes.json();
                        retries++;
                    }

                    if (prediction.status === "succeeded") {
                        const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
                        
                        if (outputUrl) {
                            // Download processed PNG and upload to Supabase Storage
                            const downloadRes = await fetch(outputUrl);
                            const arrayBuffer = await downloadRes.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            
                            // Convert to Blob for uploadLooksyMedia compatibility
                            const blob = new Blob([buffer], { type: 'image/png' });
                            const filename = `twins/${userId}-${Date.now()}.png`;
                            
                            const uploadedUrl = await uploadLooksyMedia(blob, filename);
                            if (uploadedUrl) {
                                processedUrl = uploadedUrl;
                                logger.info(`Successfully saved processed transparent twin: ${processedUrl}`);
                            }
                        }
                    } else {
                        logger.error(`Replicate background removal failed: ${prediction.error}`);
                    }
                }
            } catch (err) {
                logger.error('Error during background removal processing:', err);
                // Non-fatal, fallback to original URL
            }
        } else {
            logger.warn('REPLICATE_API_TOKEN is not configured. Background removal skipped.');
        }

        const updateData: Record<string, any> = {};
        if (baseModelUrl) updateData.baseModelUrl = processedUrl;
        if (twinBackground) updateData.twinBackground = twinBackground;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        return NextResponse.json({ success: true, user: updatedUser, processedUrl: processedUrl || updatedUser.baseModelUrl });
    } catch (error) {
        console.error('Error updating twin:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
