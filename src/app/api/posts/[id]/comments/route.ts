import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/posts/[id]/comments
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: postId } = await params;
    try {
        const comments = await prisma.postComment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json(comments);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

// POST /api/posts/[id]/comments
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
        const { content } = await req.json();
        if (!content?.trim()) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, avatarUrl: true }
        });

        const comment = await prisma.postComment.create({
            data: {
                postId,
                userId,
                username: user?.username ?? 'Usuario',
                avatarUrl: user?.avatarUrl ?? null,
                content: content.trim(),
            }
        });

        return NextResponse.json(comment, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}
