import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const body = await request.json();
        const { storeItemId } = body;

        if (!storeItemId) {
            return NextResponse.json({ error: 'storeItemId is required' }, { status: 400 });
        }

        // Verify that the product exists before recording a click
        const product = await prisma.storeItem.findUnique({
            where: { id: storeItemId }
        });

        if (!product) {
            return NextResponse.json({ error: 'Store item not found' }, { status: 404 });
        }

        // Record the click
        const userId = session?.user ? (session.user as any).id : null;
        const affiliateClick = await prisma.affiliateClick.create({
            data: {
                storeItemId,
                userId: userId || undefined // Will set to null if undefined due to relation rules or we can pass null directly if it allows it. In Prisma, relation fields set to null can be passed as null or undefined.
            }
        });

        return NextResponse.json({ success: true, clickId: affiliateClick.id });
    } catch (error: any) {
        logger.error('Error recording affiliate click:', error);
        return NextResponse.json({ error: 'Error recording affiliate click' }, { status: 500 });
    }
}
