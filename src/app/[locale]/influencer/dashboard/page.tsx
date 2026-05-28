import InfluencerDashboard from '@/components/influencer/InfluencerDashboard'
import CampaignList from '@/components/influencer/CampaignList'
import { FaStar } from 'react-icons/fa'

export default function InfluencerPage() {
    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <div className="mb-8">
                <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                    <FaStar className="text-yellow-400" /> Influencer Hub
                </h1>
                <p className="text-white/60 text-lg">
                    Monetize your style, connect with brands, and level up your influence.
                </p>
            </div>

            <InfluencerDashboard />

            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Active Campaigns</h2>
                <CampaignList />
            </div>
        </div>
    )
}
