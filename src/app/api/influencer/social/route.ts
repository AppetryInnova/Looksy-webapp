
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { platform, handle } = await request.json()
        const user = await prisma.user.findUnique({ where: { email: session.user.email as string } })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // Real implementation requires OAuth tokens to fetch actual data.
        // For now, we store the connection but set followers to 0 as we cannot verify them without API access.
        const initialFollowers = 0;

        const connection = await prisma.socialConnection.upsert({
            where: {
                userId_platform: {
                    userId: user.id,
                    platform: platform.toUpperCase()
                }
            },
            update: {
                handle,
                // Do not update followers blindly to 0 if they were set previously? 
                // Actually, if we re-link, we should probably verify again.
                // Keeping existing count if it exists would be safer, but for this refactor we are removing "simulated" behavior.
                // Let's just set it to 0 or keep existing if > 0 (assuming it was manually set or verified).
                // But since all current data is simulated, resetting to 0 is correct.
                followerCount: initialFollowers
            },
            create: {
                userId: user.id,
                platform: platform.toUpperCase(),
                handle,
                followerCount: initialFollowers
            }
        })

        // Only upgrade if they somehow have followers (e.g. manual override in DB)
        if (connection.followerCount > 1000) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isInfluencer: true }
            })
        }

        return NextResponse.json(connection)

    } catch (error) {
        logger.error('Error linking social:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
