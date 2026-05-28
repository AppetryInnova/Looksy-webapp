import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET() {
    try {
        let campaigns = await prisma.campaign.findMany({
            where: { status: 'ACTIVE' },
            include: {
                store: {
                    select: { name: true, imageUrl: true }
                },
                _count: {
                    select: { applications: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Auto-seed for presentation if db is empty
        if (campaigns.length === 0) {
            logger.info("Seeding Campaigns for demo...");
            const brand1 = await prisma.store.create({
                data: {
                    name: "Neo-Vintage Boutique",
                    type: "Boutique",
                    address: "Virtual",
                    lat: 0,
                    lng: 0,
                    imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=400&q=80"
                }
            });

            const brand2 = await prisma.store.create({
                data: {
                    name: "Urban Core Apparel",
                    type: "Streetwear",
                    address: "Virtual",
                    lat: 0,
                    lng: 0,
                    imageUrl: "https://images.unsplash.com/photo-1555529771-835f59bfc50c?auto=format&fit=crop&w=400&q=80"
                }
            });

            await prisma.campaign.create({
                data: {
                    storeId: brand1.id,
                    title: "Denim Revival Summer",
                    description: "Buscamos creadores fashionistas para estilar nuestra nueva colección de Denim orgánico. Sube un outfit completo destacando una prenda de jean.",
                    requirements: JSON.stringify({ minFollowers: 5000, specificPlatform: "INSTAGRAM", contentTypes: ["SCAN", "REEL"] }),
                    reward: "$150 USD + Ropa Gratis",
                    budget: 5000,
                    rewardValue: 150,
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
                }
            });

            await prisma.campaign.create({
                data: {
                    storeId: brand2.id,
                    title: "Cyber-Streetwear Launch",
                    description: "Necesitamos influencers con estética Cyberpunk o Grunge para promocionar las nuevas camperas reflectivas.",
                    requirements: JSON.stringify({ minFollowers: 10000, specificPlatform: "TIKTOK", contentTypes: ["SCAN"] }),
                    reward: "$300 USD",
                    budget: 10000,
                    rewardValue: 300,
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    imageUrl: "https://images.unsplash.com/photo-1545156526-90b5bd438686?auto=format&fit=crop&w=600&q=80"
                }
            });

            // Re-fetch after seed
            campaigns = await prisma.campaign.findMany({
                where: { status: 'ACTIVE' },
                include: { store: { select: { name: true, imageUrl: true } }, _count: { select: { applications: true } } },
                orderBy: { createdAt: 'desc' }
            });
        }

        return NextResponse.json(campaigns);

    } catch (error) {
        logger.error('Error fetching campaigns:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
