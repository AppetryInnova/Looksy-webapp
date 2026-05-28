import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/posts — Feed paginado
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = 20;

    try {
        const posts = await prisma.post.findMany({
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, username: true, avatarUrl: true, isVerified: true }
                },
                likes: {
                    select: { userId: true }
                },
                comments: {
                    take: 2,
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, username: true, avatarUrl: true, content: true, createdAt: true }
                },
                _count: {
                    select: { likes: true, comments: true }
                }
            }
        });

        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        // Annotate with current user's like status
        const userId = session?.user?.id;
        const enriched = items.map(post => ({
            ...post,
            likedByMe: userId ? post.likes.some(l => l.userId === userId) : false,
        }));

        return NextResponse.json({ posts: enriched, nextCursor });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

// POST /api/posts — Crear post
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { content, imageUrl } = await req.json();
        if (!content?.trim() && !imageUrl) {
            return NextResponse.json({ error: 'Content or image required' }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                userId: session.user.id,
                content: content?.trim() ?? '',
                imageUrl: imageUrl ?? null,
            },
            include: {
                user: { select: { id: true, username: true, avatarUrl: true, isVerified: true } },
                _count: { select: { likes: true, comments: true } }
            }
        });

        return NextResponse.json(post, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
