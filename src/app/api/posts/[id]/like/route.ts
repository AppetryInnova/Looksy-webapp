import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts/[id]/like — Toggle like
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;
    const userId = session.user.id;

    try {
        const existing = await prisma.postLike.findUnique({
            where: { postId_userId: { postId, userId } }
        });

        if (existing) {
            await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
            const count = await prisma.postLike.count({ where: { postId } });
            return NextResponse.json({ liked: false, count });
        } else {
            await prisma.postLike.create({ data: { postId, userId } });
            const count = await prisma.postLike.count({ where: { postId } });
            return NextResponse.json({ liked: true, count });
        }
    } catch {
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
    }
}
