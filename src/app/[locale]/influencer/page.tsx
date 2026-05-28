
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CampaignList from "@/components/influencer/CampaignList";

export default async function InfluencerPage() {
    // 1. Fetch Active Campaigns
    const campaigns = await prisma.campaign.findMany({
        where: { status: 'ACTIVE' },
        include: {
            store: true, // Show store info
            _count: { select: { applications: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="p-6 pb-24 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Influencer Hub
                </h1>
                <p className="text-gray-500">Find campaigns and collaborate with top brands.</p>
            </header>

            <section>
                <CampaignList />
            </section>
        </div>
    );
}
