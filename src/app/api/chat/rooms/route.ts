import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import logger from '@/lib/logger';

// GET - List all chat rooms for current user
export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch rooms where user is participant
        const rooms = await prisma.chatRoom.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            include: {
                user1: {
                    select: { id: true, username: true, avatarUrl: true }
                },
                user2: {
                    select: { id: true, username: true, avatarUrl: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Format to easily identify the "other user"
        const formattedRooms = rooms.map(room => {
            const isUser1 = room.user1Id === userId;
            const otherUser = isUser1 ? room.user2 : room.user1;
            const lastMessage = room.messages[0] || null;

            return {
                id: room.id,
                updatedAt: room.updatedAt,
                otherUser,
                lastMessage
            };
        });

        return NextResponse.json(formattedRooms);
    } catch (err: any) {
        logger.error('Error fetching chat rooms:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

// POST - Create or open a chat room with another user
export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { targetUserId } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
        }

        if (userId === targetUserId) {
            return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });
        }

        // Order IDs to check uniqueness in @@unique([user1Id, user2Id])
        const [user1Id, user2Id] = [userId, targetUserId].sort();

        // Check if room already exists
        let room = await prisma.chatRoom.findUnique({
            where: {
                user1Id_user2Id: { user1Id, user2Id }
            },
            include: {
                user1: { select: { id: true, username: true, avatarUrl: true } },
                user2: { select: { id: true, username: true, avatarUrl: true } }
            }
        });

        if (!room) {
            // Create new room
            room = await prisma.chatRoom.create({
                data: {
                    user1Id,
                    user2Id
                },
                include: {
                    user1: { select: { id: true, username: true, avatarUrl: true } },
                    user2: { select: { id: true, username: true, avatarUrl: true } }
                }
            });
        }

        const isUser1 = room.user1Id === userId;
        const otherUser = isUser1 ? room.user2 : room.user1;

        return NextResponse.json({
            id: room.id,
            updatedAt: room.updatedAt,
            otherUser
        });
    } catch (err: any) {
        logger.error('Error creating chat room:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
