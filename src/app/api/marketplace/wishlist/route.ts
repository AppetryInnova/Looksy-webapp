import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import logger from '@/lib/logger';

// GET - Fetch user's wishlist
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const wishlist = await prisma.wishlist.findMany({
            where: { userId: user.id },
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
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { storeItemId } = await request.json();

        // Check if already in wishlist
        const existing = await prisma.wishlist.findUnique({
            where: {
                userId_storeItemId: {
                    userId: user.id,
                    storeItemId
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Already in wishlist' }, { status: 400 });
        }

        const wishlistItem = await prisma.wishlist.create({
            data: {
                userId: user.id,
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
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { storeItemId } = await request.json();

        await prisma.wishlist.deleteMany({
            where: {
                userId: user.id,
                storeItemId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error removing from wishlist:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
