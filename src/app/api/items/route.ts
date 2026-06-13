import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/gemini';
import logger from '@/lib/logger';
import { getUserIdFromRequest } from '@/lib/auth-mobile';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userIdParam = searchParams.get('userId');
        const authenticatedUserId = await getUserIdFromRequest(request);

        let targetUserId = userIdParam;
        if (!targetUserId) {
            if (!authenticatedUserId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            targetUserId = authenticatedUserId;
        }

        // Check privacy if viewing someone else's wardrobe
        if (targetUserId !== authenticatedUserId) {
            const targetUser = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { privacySettings: true }
            });

            if (!targetUser) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            let wardrobeVisibility = 'public';
            if (targetUser.privacySettings) {
                try {
                    const parsed = JSON.parse(targetUser.privacySettings);
                    wardrobeVisibility = parsed.wardrobeVisibility || 'public';
                } catch (_) {}
            }

            if (wardrobeVisibility === 'private') {
                return NextResponse.json({ error: 'Private wardrobe' }, { status: 403 });
            }

            if (wardrobeVisibility === 'friends' || wardrobeVisibility === 'followers') {
                let isFollowing = false;
                if (authenticatedUserId) {
                    const follow = await prisma.follow.findUnique({
                        where: {
                            followerId_followingId: {
                                followerId: authenticatedUserId,
                                followingId: targetUserId
                            }
                        }
                    });
                    isFollowing = !!follow;
                }
                if (!isFollowing) {
                    return NextResponse.json({ error: 'Private wardrobe (followers only)' }, { status: 403 });
                }
            }
        }

        const items = await prisma.item.findMany({
            where: { userId: targetUserId },
            orderBy: { createdAt: 'desc' },
            include: { user: true },
        });
        return NextResponse.json(items);
    } catch (error) {
        logger.error('Error fetching items:', error);
        return NextResponse.json({ error: 'Error fetching items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, imageUrl, category, color, brand } = body;

        let targetUserId = userId;
        if (!targetUserId) {
            const defaultUser = await prisma.user.upsert({
                where: { email: 'demo@looksy.app' },
                update: {},
                create: {
                    email: 'demo@looksy.app',
                    username: 'LooksyUser',
                }
            });
            targetUserId = defaultUser.id;
        }

        const item = await prisma.item.create({
            data: {
                userId: targetUserId,
                imageUrl,
                category,
                color,
                brand,
            },
        });

        // Generate and save embedding asynchronously so it doesn't block UI too much
        // Note: For production, this could also go to Inngest
        try {
            const descriptionText = `Prenda de ropa: ${category}. Color: ${color || 'desconocido'}. Marca: ${brand || 'desconocida'}.`;
            const embedding = await generateEmbedding(descriptionText);

            // Use executeRaw to set the pgvector embedding
            // Format for pgvector: '[0.1, 0.2, ...]'
            const embeddingString = `[${embedding.join(',')}]`;
            
            await prisma.$executeRaw`UPDATE "Item" SET embedding = ${embeddingString}::vector WHERE id = ${item.id}`;
            logger.info(`Vector embedding generated and saved for item ${item.id}`);
        } catch (embedError) {
            logger.error(`Error generating embedding for item ${item.id}:`, embedError);
            // Non-fatal, we still return the created item
        }

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating item' }, { status: 500 });
    }
}
