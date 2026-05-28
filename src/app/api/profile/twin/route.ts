import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { baseModelUrl } = body;

        if (!baseModelUrl) {
            return NextResponse.json({ error: 'baseModelUrl is required' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { baseModelUrl }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Error updating twin:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
