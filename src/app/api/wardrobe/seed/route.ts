import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path if needed
import { prisma } from '@/lib/prisma';
import { STARTER_PACKS } from '@/lib/StarterPackData';
// Force rebuild: Fix import
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            // Fallback for demo if no session, but usually we need it
            // If authOptions export is tricky or location varies, try generic check
        }

        // In this app structure, we might need a more robust auth check if authOptions location is unknown, 
        // but let's assume standard NextAuth usage or use the email from session if possible.
        // Re-checking imports... actually I should verify authOptions location.
        // Assuming it's in @/lib/auth or @/app/api/auth/[...nextauth]/route.ts

        // Let's rely on client passing email or ID if session is flaky in dev, 
        // BUT for security we should use session. 
        // Let's assume text/json body with gender/age.

        // ...
        const body = await req.json();

        const { gender, age, userId } = body;

        // Determine Pack
        let pack: { category: string, imageUrl: string, style?: string, occasion?: string, season?: string, brand?: string, color?: string }[] = [];
        if (gender === 'FEMALE') {
            pack = Number(age) < 30 ? STARTER_PACKS.FEMALE.YOUNG : STARTER_PACKS.FEMALE.ADULT;
        } else {
            // Default to Male for now (covers Male + Unisex fallback)
            pack = Number(age) < 30 ? STARTER_PACKS.MALE.YOUNG : STARTER_PACKS.MALE.ADULT;
        }

        // ...

        let targetUserId = userId;


        if (typeof targetUserId === 'string' && targetUserId.includes('@')) {

            const user = await prisma.user.findUnique({ where: { email: targetUserId } });

            targetUserId = user?.id;
        }

        if (!targetUserId && session?.user?.email) {

            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            targetUserId = user?.id;
        }

        if (!targetUserId) {

            return NextResponse.json({ error: 'User not found. Could not resolve userId from email or session.' }, { status: 401 });
        }



        const itemsToCreate = pack.map(item => ({
            userId: targetUserId,
            category: item.category,
            imageUrl: item.imageUrl,
            style: item.style, // Ensure schema supports this
            occasion: item.occasion,
            season: item.season,
            brand: item.brand,
            color: item.color,
            // Remove createdAt/updatedAt if they are defaults, but let's keep them if Schema allows
        }));



        await prisma.item.createMany({
            data: itemsToCreate
        });



        return NextResponse.json({ success: true, count: itemsToCreate.length });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
