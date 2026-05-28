
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const campaigns = await prisma.campaign.findMany({
            where: { status: 'ACTIVE' },
            include: {
                store: true,
                applications: {
                    where: { user: { email: session.user?.email as string } }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Map to include 'hasApplied' flag
        const mappedCampaigns = campaigns.map(c => ({
            ...c,
            hasApplied: c.applications.length > 0,
            applicationStatus: c.applications.length > 0 ? c.applications[0].status : null
        }))

        return NextResponse.json(mappedCampaigns)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { campaignId } = await request.json()
        const user = await prisma.user.findUnique({ where: { email: session.user.email as string } })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const existingApp = await prisma.campaignApplication.findUnique({
            where: {
                campaignId_userId: {
                    campaignId,
                    userId: user.id
                }
            }
        })

        if (existingApp) {
            return NextResponse.json({ error: 'Already applied' }, { status: 400 })
        }

        const application = await prisma.campaignApplication.create({
            data: {
                campaignId,
                userId: user.id,
                status: 'PENDING'
            }
        })

        return NextResponse.json(application)

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
