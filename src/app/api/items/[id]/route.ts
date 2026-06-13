import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getUserIdFromRequest } from '@/lib/auth-mobile';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const item = await prisma.item.findUnique({
            where: { id },
        });
        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching item' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const item = await prisma.item.update({
            where: { id },
            data: body,
        });
        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating item' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const item = await prisma.item.update({
            where: { id },
            data: body,
        });
        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating item' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authenticatedUserId = await getUserIdFromRequest(request);

        if (!authenticatedUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const item = await prisma.item.findUnique({
            where: { id }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.userId !== authenticatedUserId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.item.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Item deleted' });
    } catch (error) {
        logger.error('DELETE Error:', error);
        const message = error instanceof Error ? error.message : 'Error deleting item';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
