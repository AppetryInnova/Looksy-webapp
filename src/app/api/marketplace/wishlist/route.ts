import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import logger from '@/lib/logger';

// GET - Fetch user's wishlist
export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const wishlist = await prisma.wishlist.findMany({
            where: { userId: userId },
            include: {
                storeItem: {
                    include: {
                        store: {
                            select: { name: true, rating: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(wishlist);
    } catch (error) {
        logger.error('Error fetching wishlist:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Add item to wishlist
export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { storeItemId } = await request.json();

        // Check if already in wishlist
        const existing = await prisma.wishlist.findUnique({
            where: {
                userId_storeItemId: {
                    userId: userId,
                    storeItemId
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Already in wishlist' }, { status: 400 });
        }

        const wishlistItem = await prisma.wishlist.create({
            data: {
                userId: userId,
                storeItemId
            }
        });

        return NextResponse.json(wishlistItem);
    } catch (error) {
        logger.error('Error adding to wishlist:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Remove item from wishlist
export async function DELETE(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { storeItemId } = await request.json();

        await prisma.wishlist.deleteMany({
            where: {
                userId: userId,
                storeItemId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error removing from wishlist:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
