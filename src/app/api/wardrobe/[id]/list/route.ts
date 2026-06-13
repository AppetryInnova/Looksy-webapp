import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import logger from '@/lib/logger';

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const itemId = params.id;
        const body = await request.json();
        const { price, rentalPrice, isForSale, isForRent } = body;

        // Verify ownership
        const item = await prisma.item.findUnique({
            where: { id: itemId }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update the item
        const updatedItem = await prisma.item.update({
            where: { id: itemId },
            data: {
                price: price !== undefined && price !== null ? parseFloat(price.toString()) : null,
                rentalPrice: rentalPrice !== undefined && rentalPrice !== null ? parseFloat(rentalPrice.toString()) : null,
                isForSale: !!isForSale,
                isForRent: !!isForRent
            }
        });

        return NextResponse.json(updatedItem);
    } catch (err: any) {
        logger.error('Error listing item in wardrobe:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
