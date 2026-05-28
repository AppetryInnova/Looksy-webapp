import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import logger from '@/lib/logger';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // Get a few users that the current user isn't already following
        // For simplicity, we just grab users with high style points

        let excludedIds: string[] = [];
        if (session?.user?.id) {
            excludedIds.push(session.user.id);

            const following = await prisma.follow.findMany({
                where: { followerId: session.user.id },
                select: { followingId: true }
            });
            excludedIds.push(...following.map(f => f.followingId));
        }

        const suggestedUsers = await prisma.user.findMany({
            where: {
                id: { notIn: excludedIds },
                username: { not: null }
            },
            take: 5,
            orderBy: { stylePoints: 'desc' },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                level: true,
                stylePoints: true
            }
        });

        return NextResponse.json(suggestedUsers);
    } catch (error) {
        logger.error('Error in discovery API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
