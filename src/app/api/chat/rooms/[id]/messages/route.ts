import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';
import logger from '@/lib/logger';

// GET - Fetch messages for a specific chat room
export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const roomId = params.id;

        // Verify user is participant in the room
        const room = await prisma.chatRoom.findUnique({
            where: { id: roomId }
        });

        if (!room) {
            return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
        }

        if (room.user1Id !== userId && room.user2Id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const messages = await prisma.chatMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(messages);
    } catch (err: any) {
        logger.error('Error fetching chat messages:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

// POST - Send a message to a chat room
export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const roomId = params.id;
        const body = await request.json();
        const { content, imageUrl } = body;

        if (!content && !imageUrl) {
            return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }

        // Verify user is participant in the room
        const room = await prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: {
                user1: { select: { username: true } },
                user2: { select: { username: true } }
            }
        });

        if (!room) {
            return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
        }

        if (room.user1Id !== userId && room.user2Id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Determine recipient ID and sender username
        const isUser1 = room.user1Id === userId;
        const recipientId = isUser1 ? room.user2Id : room.user1Id;
        const senderUsername = isUser1 ? room.user1.username : room.user2.username;

        // Create message and update room's updatedAt
        const [message] = await prisma.$transaction([
            prisma.chatMessage.create({
                data: {
                    roomId,
                    senderId: userId,
                    content: content || '',
                    imageUrl
                }
            }),
            prisma.chatRoom.update({
                where: { id: roomId },
                data: { updatedAt: new Date() }
            }),
            // Notify the recipient
            prisma.notification.create({
                data: {
                    userId: recipientId,
                    type: 'NEW_CHAT_MESSAGE',
                    title: `Nuevo mensaje de @${senderUsername || 'Usuario'} 💬`,
                    message: content ? (content.length > 50 ? `${content.substring(0, 50)}...` : content) : 'Te envió una imagen',
                    link: `/chat/${roomId}`
                }
            })
        ]);

        return NextResponse.json(message);
    } catch (err: any) {
        logger.error('Error sending chat message:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
