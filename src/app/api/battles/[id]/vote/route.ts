import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import logger from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
                    logger.error('Error verifying Supabase token in battle vote:', err);
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: battleId } = await params;
        const body = await request.json();
        const { entryId } = body;

        if (!entryId) {
            return NextResponse.json({ error: 'Missing entryId' }, { status: 400 });
        }

        // Verify if vote already exists
        const existingVote = await prisma.battleVote.findUnique({
            where: {
                entryId_userId: { entryId, userId }
            }
        });

        if (existingVote) {
             return NextResponse.json({ error: 'Already voted for this entry' }, { status: 400 });
        }

        // Transaction to add vote and increment score
        await prisma.$transaction([
            prisma.battleVote.create({
                data: { entryId, userId }
            }),
            prisma.battleEntry.update({
                where: { id: entryId },
                data: { score: { increment: 1 } }
            })
        ]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        logger.error('Error in battle vote:', error);
        return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }
}
