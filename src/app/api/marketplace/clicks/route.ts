import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import { getAffiliateRedirectUrl } from '@/lib/affiliate';

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        const body = await request.json();
        const { storeItemId, country, locale } = body;

        if (!storeItemId) {
            return NextResponse.json({ error: 'storeItemId is required' }, { status: 400 });
        }

        // Verify that the product exists before recording a click
        const product = await prisma.storeItem.findUnique({
            where: { id: storeItemId },
            include: { store: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Store item not found' }, { status: 404 });
        }

        // Record the click
        const affiliateClick = await prisma.affiliateClick.create({
            data: {
                storeItemId,
                userId: userId || undefined
            }
        });

        // Generate dynamic affiliate redirect URL centrally
        const redirectUrl = getAffiliateRedirectUrl({
            url: product.affiliateUrl || undefined,
            productName: product.name,
            storeName: product.store?.name || 'Tienda',
            locale: locale || 'es',
            country: country || 'UY'
        });

        return NextResponse.json({ 
            success: true, 
            clickId: affiliateClick.id,
            redirectUrl
        });
    } catch (error: any) {
        logger.error('Error recording affiliate click:', error);
        return NextResponse.json({ error: 'Error recording affiliate click' }, { status: 500 });
    }
}
