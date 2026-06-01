import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { generateEventStyling } from '@/lib/gemini';
import logger from '@/lib/logger';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        let userId = session?.user?.id;
        const { id: eventId } = await params;

        // Mobile clients using Supabase Bearer token
        if (!userId) {
            const authHeader = request.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const { data: { user: sbUser }, error } = await supabase.auth.getUser(token);
                    if (sbUser && !error) {
                        userId = sbUser.id;
                    }
                } catch (err) {
                    logger.error('Error verifying Supabase token in event optimizer:', err);
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch event details
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // 2. Fetch user items (wardrobe) from DB
        const garments = await prisma.item.findMany({
            where: { userId }
        });

        if (garments.length === 0) {
            return NextResponse.json({
                recommendation: 'Tu ropero está vacío en este momento. ¡Añade algunas prendas en la sección "Mi Ropero" para que Looksy IA pueda combinarlas por ti! 👗🧥'
            });
        }

        // 3. Generate stylist recommendation via Gemini with fallback
        logger.info(`Running server-side Gemini event dress optimizer: Event=${eventId}, User=${userId}`);
        const recommendation = await generateEventStyling(
            event.title,
            event.description || '',
            event.dressCode,
            garments.map(g => ({
                name: g.brand && g.color ? `${g.color} ${g.brand} ${g.category}` : undefined,
                category: g.category,
                color: g.color,
                brand: g.brand
            }))
        );

        return NextResponse.json({ recommendation });
    } catch (error: any) {
        logger.error('Error in event optimize route:', error);
        return NextResponse.json(
            { error: error.message || 'Error generating event styling recommendation' },
            { status: 500 }
        );
    }
}
