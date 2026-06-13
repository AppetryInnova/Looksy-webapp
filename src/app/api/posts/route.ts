import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';

// GET /api/posts — Feed paginado
export async function GET(req: NextRequest) {
    const authenticatedUserId = await getUserIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const userIdParam = searchParams.get('userId');
    const limit = 20;

    try {
        let where: Record<string, unknown> = {};

        if (userIdParam) {
            // Check privacy visibility of the target user
            if (userIdParam !== authenticatedUserId) {
                const targetUser = await prisma.user.findUnique({
                    where: { id: userIdParam },
                    select: { privacySettings: true }
                });

                if (!targetUser) {
                    return NextResponse.json({ error: 'User not found' }, { status: 404 });
                }

                let isPrivate = false;
                if (targetUser.privacySettings) {
                    try {
                        const parsed = JSON.parse(targetUser.privacySettings);
                        isPrivate = parsed.profileVisibility === 'private';
                    } catch (_) {}
                }

                if (isPrivate) {
                    let isFollowing = false;
                    if (authenticatedUserId) {
                        const follow = await prisma.follow.findUnique({
                            where: {
                                followerId_followingId: {
                                    followerId: authenticatedUserId,
                                    followingId: userIdParam
                                }
                            }
                        });
                        isFollowing = !!follow;
                    }
                    if (!isFollowing) {
                        return NextResponse.json({ error: 'Private profile' }, { status: 403 });
                    }
                }
            }
            where.userId = userIdParam;
        }

        const posts = await prisma.post.findMany({
            take: limit + 1,
            where,
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
        const enriched = items.map(post => ({
            ...post,
            likedByMe: authenticatedUserId ? post.likes.some(l => l.userId === authenticatedUserId) : false,
        }));

        return NextResponse.json({ posts: enriched, nextCursor });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

// POST /api/posts — Crear post
export async function POST(req: NextRequest) {
    const authenticatedUserId = await getUserIdFromRequest(req);
    if (!authenticatedUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { content, imageUrl } = await req.json();
        if (!content?.trim() && !imageUrl) {
            return NextResponse.json({ error: 'Content or image required' }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                userId: authenticatedUserId,
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
