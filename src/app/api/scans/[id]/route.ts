import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-mobile';

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

        const scan = await prisma.scan.findUnique({
            where: { id }
        });

        if (!scan) {
            return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
        }

        if (scan.userId !== authenticatedUserId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.scan.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Scan deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting scan' }, { status: 500 });
    }
}
