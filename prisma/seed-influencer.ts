
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Influencer Data...')

    // Clear existing brands/campaigns to avoid duplicates if re-run
    try {
        await prisma.campaignApplication.deleteMany({})
        await prisma.campaign.deleteMany({})
        await prisma.store.deleteMany({})
    } catch (e) {
        console.log('Cleanup skipped or failed', e)
    }

    // 1. Urban Vogue
    const brand1 = await prisma.store.create({
        data: {
            name: 'Urban Vogue',
            imageUrl: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=200&auto=format&fit=crop',
            description: 'Streetwear for the modern soul. Bold, unapologetic styles.',
            address: '123 Main St, Fashion District',
            lat: 40.7128,
            lng: -74.0060,
            type: 'Boutique',
            campaigns: {
                create: [
                    {
                        title: 'Neon Nights Launch',
                        description: 'Showcase our new neon collection in a night setting. High energy, flash photography.',
                        requirements: JSON.stringify({ minFollowers: 1000, platform: 'INSTAGRAM', type: 'Post' }),
                        reward: '$100 + Free Item',
                        rewardValue: 100,
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
                        status: 'ACTIVE'
                    },
                    {
                        title: 'Urban Basics Reel',
                        description: 'Create a transition reel styling our basic whites.',
                        requirements: JSON.stringify({ minFollowers: 5000, platform: 'TIKTOK', type: 'Reel' }),
                        reward: '$300 Cash',
                        rewardValue: 300,
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                        status: 'ACTIVE'
                    }
                ]
            }
        }
    })

    // 2. EcoWear
    const brand2 = await prisma.store.create({
        data: {
            name: 'EcoWear',
            imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5fa5?q=80&w=200&auto=format&fit=crop',
            description: 'Sustainable fashion that cares for the planet.',
            address: '456 Green Way, Eco Valley',
            lat: 34.0522,
            lng: -118.2437,
            type: 'Pop-up',
            campaigns: {
                create: [
                    {
                        title: 'Green Summer Challenge',
                        description: 'Show us how you style our organic cotton dress for a summer picnic.',
                        requirements: JSON.stringify({ minFollowers: 500, platform: 'INSTAGRAM', type: 'Story' }),
                        reward: 'Eco Bundle ($80 value)',
                        rewardValue: 80,
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
                        status: 'ACTIVE'
                    }
                ]
            }
        }
    })

    // 3. TechFit
    await prisma.store.create({
        data: {
            name: 'TechFit',
            imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=200&auto=format&fit=crop',
            description: 'Performance gear for the tech-savvy athlete.',
            address: '789 Innovation Dr, Tech Park',
            lat: 37.7749,
            lng: -122.4194,
            type: 'Mall',
            campaigns: {
                create: [
                    {
                        title: 'Gym Mirror Selfie',
                        description: 'Post a gym selfie wearing TechFit gear with our hashtag #TechFitLife.',
                        requirements: JSON.stringify({ minFollowers: 200, platform: 'INSTAGRAM', type: 'Post' }),
                        reward: '20% Discount Code',
                        rewardValue: 0,
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                        status: 'ACTIVE'
                    }
                ]
            }
        }
    })

    console.log('Influencer data seeded!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
