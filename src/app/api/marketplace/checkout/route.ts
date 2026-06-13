import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import logger from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, type, rentalDays } = body; // type is 'BUY' or 'RENT'

        if (!productId || !type) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Fetch item
        const item = await prisma.item.findUnique({
            where: { id: productId },
            include: { user: true }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.userId === userId) {
            return NextResponse.json({ error: 'You cannot buy your own item' }, { status: 400 });
        }

        const sellerId = item.userId;

        // 2. Calculate cost
        let cost = 0.0;
        if (type === 'BUY') {
            if (!item.isForSale || !item.price) {
                return NextResponse.json({ error: 'Item is not for sale' }, { status: 400 });
            }
            cost = item.price;
        } else if (type === 'RENT') {
            if (!item.isForRent || !item.rentalPrice) {
                return NextResponse.json({ error: 'Item is not for rent' }, { status: 400 });
            }
            const days = rentalDays ? parseInt(rentalDays.toString()) : 1;
            cost = item.rentalPrice * days;
        } else {
            return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
        }

        // 3. Fetch buyer wallet
        const buyer = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!buyer) {
            return NextResponse.json({ error: 'Buyer user not found' }, { status: 404 });
        }

        // Simulated credit card charge fallback if wallet balance is too low
        let paymentMethodUsed = 'wallet';
        let remainingBalance = buyer.walletBalance;

        if (buyer.walletBalance >= cost) {
            remainingBalance = buyer.walletBalance - cost;
        } else {
            // Simulated Stripe charge
            paymentMethodUsed = 'stripe_simulator';
        }

        // 4. Calculate split
        const sellerEarnings = cost * 0.90; // 90% goes to seller
        const platformCommission = cost * 0.10; // 10% looksy split

        // 5. Execute transaction in Prisma
        await prisma.$transaction(async (tx) => {
            // Deduct from buyer if using wallet
            if (paymentMethodUsed === 'wallet') {
                await tx.user.update({
                    where: { id: userId },
                    data: { walletBalance: remainingBalance }
                });
            }

            // Credit seller
            await tx.user.update({
                where: { id: sellerId },
                data: { walletBalance: { increment: sellerEarnings } }
            });

            if (type === 'BUY') {
                // Transfer ownership of the Item
                await tx.item.update({
                    where: { id: productId },
                    data: {
                        userId: userId, // New owner!
                        isForSale: false, // Unlist
                        isForRent: false,
                        price: null,
                        rentalPrice: null
                    }
                });
            } else {
                // For rental: just log the click or trigger notification
                // In a full production app we would write to a Rentals table, but for this MVP 
                // we simulate the rental split and notify the seller
            }

            // Create system notification for seller
            await tx.notification.create({
                data: {
                    userId: sellerId,
                    type: type === 'BUY' ? 'SALE_SUCCESS' : 'RENTAL_SUCCESS',
                    title: type === 'BUY' ? '¡Prenda Vendida! 💰' : '¡Prenda Alquilada! 🔑',
                    message: type === 'BUY' 
                        ? `Felicidades, tu prenda "${item.name || 'Prenda'}" fue comprada por ${buyer.username || 'un usuario'}. Se han acreditado $${sellerEarnings.toFixed(2)} a tu billetera.`
                        : `Tu prenda "${item.name || 'Prenda'}" fue alquilada por ${rentalDays} días. Se han acreditado $${sellerEarnings.toFixed(2)} a tu billetera.`,
                    link: `/profile`
                }
            });
        });

        return NextResponse.json({
            success: true,
            type,
            cost,
            paymentMethodUsed,
            newBalance: paymentMethodUsed === 'wallet' ? remainingBalance : buyer.walletBalance
        });
    } catch (err: any) {
        logger.error('Error during P2P checkout:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
