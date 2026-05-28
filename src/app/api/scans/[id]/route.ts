import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.scan.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Scan deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting scan' }, { status: 500 });
    }
}
