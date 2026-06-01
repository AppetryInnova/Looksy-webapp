import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';
import { inngest } from '@/lib/inngest';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        let userId = session?.user?.id;

        // Mobile clients using Supabase Bearer token
        if (!userId) {
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const { data: { user }, error } = await supabase.auth.getUser(token);
                    if (user && !error) {
                        userId = user.id;
                    }
                } catch (err) {
                    logger.error('Error verifying Supabase token in VTO:', err);
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { baseModelUrl, itemImageUrls, category = "upper_body" } = body;

        if (!baseModelUrl || !itemImageUrls || !itemImageUrls.length) {
            return NextResponse.json({ error: 'Missing images' }, { status: 400 });
        }

        const garmentImageUrl = itemImageUrls[0];

        // Token Economy Logic
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { gravityTokens: true, lastTokenReset: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const now = new Date();
        const lastReset = user.lastTokenReset || new Date(0);
        const isSameDay = now.getFullYear() === lastReset.getFullYear() && 
                          now.getMonth() === lastReset.getMonth() && 
                          now.getDate() === lastReset.getDate();

        let currentTokens = user.gravityTokens;

        if (!isSameDay) {
            // Reset tokens to 5
            currentTokens = 5;
            await prisma.user.update({
                where: { id: userId },
                data: { gravityTokens: 5, lastTokenReset: now }
            });
        }

        if (currentTokens <= 0) {
            return NextResponse.json({ 
                error: 'Sin Gravity Tokens', 
                message: 'Has agotado tus usos del Espejo Virtual por hoy. Vuelve mañana para recargar tus tokens.' 
            }, { status: 403 });
        }

        // Decrement token
        await prisma.user.update({
            where: { id: userId },
            data: { gravityTokens: { decrement: 1 } }
        });

        // Create the async job in the database
        const job = await prisma.vTOJob.create({
            data: {
                userId: userId,
                baseModelUrl,
                garmentImageUrl,
                category,
                status: 'PENDING'
            }
        });

        // Dispatch background processing to Inngest
        await inngest.send({
            name: "vto/generate",
            data: { jobId: job.id }
        });

        // Immediately return the jobId so the frontend can subscribe via Realtime
        return NextResponse.json({ 
            success: true, 
            jobId: job.id,
            message: "El trabajo de Virtual Try-On ha sido encolado y se está procesando."
        });

    } catch (error: any) {
        logger.error('Error creating VTO Job:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
