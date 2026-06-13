import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { generateStylistOutfits } from '@/lib/gemini';
import { getUserIdFromRequest } from '@/lib/auth-mobile';

export async function POST(request: NextRequest) {
    try {
        // Support both web session and mobile token authentication
        let userId: string | null = null;
        try {
            userId = await getUserIdFromRequest(request);
        } catch (_) {}

        if (!userId) {
            const session = await getServerSession(authOptions);
            userId = session?.user?.id || null;
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user wardrobe items
        const items = await prisma.item.findMany({
            where: { userId },
            select: { id: true, category: true, imageUrl: true, name: true, color: true, brand: true, style: true },
            take: 40 // Take up to 40 items
        });

        if (items.length < 2) {
            return NextResponse.json({
                error: 'Necesitas al menos 2 prendas en tu ropero para generar combinaciones.'
            }, { status: 400 });
        }

        // Fetch user preferences
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stylePreferences: true }
        });

        let stylePrefs: any = { styles: ['Casual'] };
        if (user?.stylePreferences) {
            try {
                stylePrefs = typeof user.stylePreferences === 'string'
                    ? JSON.parse(user.stylePreferences)
                    : user.stylePreferences;
            } catch (_) {}
        }

        // Generate recommendations using Gemini
        const recommendation = await generateStylistOutfits(items, stylePrefs);

        // Map item details back for frontend convenience
        const enrichedOutfits = recommendation.outfits.map((outfit: any) => {
            const selectedItems = items.filter(item => outfit.itemIds.includes(item.id));
            return {
                ...outfit,
                items: selectedItems
            };
        });

        return NextResponse.json({ outfits: enrichedOutfits });

    } catch (error: any) {
        logger.error('Error generating AI stylist outfits:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
