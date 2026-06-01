import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from '@/lib/supabase';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        let userId = session?.user?.id;

        // Mobile clients using Supabase Bearer token
        if (!userId) {
            const authHeader = request.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const { data: { user }, error } = await supabase.auth.getUser(token);
                    if (user && !error) {
                        userId = user.id;
                    }
                } catch (err) {
                    logger.error('Error verifying Supabase token in battle enter:', err);
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Await params first
        const resolvedParams = await params;
        const battleId = resolvedParams.id;
        const body = await request.json();
        const { scanId } = body;

        if (!userId || !scanId) {
            return NextResponse.json({ error: 'Missing userId or scanId' }, { status: 400 });
        }

        // Check if already entered
        const existingEntry = await prisma.battleEntry.findUnique({
            where: {
                battleId_userId: {
                    battleId: battleId,
                    userId: userId
                }
            }
        });

        if (existingEntry) {
            return NextResponse.json({ error: 'Already entered this battle' }, { status: 400 });
        }

        const entry = await prisma.battleEntry.create({
            data: {
                battleId: battleId,
                userId: userId,
                scanId: scanId
            }
        });

        return NextResponse.json(entry);
    } catch (error) {
        logger.error('Error entering battle:', error);
        return NextResponse.json({ error: 'Failed to enter battle' }, { status: 500 });
    }
}
