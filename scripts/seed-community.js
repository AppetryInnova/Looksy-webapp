const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding community data...');

    // 1. Create mock users
    const users = [
        {
            username: 'trendsetter_ny',
            name: 'Alex Rivera',
            avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop',
            stylePoints: 1200,
            level: 'Trend Hunter',
            bio: 'Fashion designer based in NY. Minimalist style advocate.'
        },
        {
            username: 'vintage_soul',
            name: 'Elena Garcia',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
            stylePoints: 2500,
            level: 'Style Icon',
            bio: 'Thrift shop lover. 70s and 90s aesthetic only.'
        },
        {
            username: 'cyber_punk_fan',
            name: 'Lucas Chen',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
            stylePoints: 800,
            level: 'New Face',
            bio: 'Techwear and futuristic fashion enthusiast.'
        }
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: `${u.username}@example.com` },
            update: u,
            create: {
                ...u,
                email: `${u.username}@example.com`,
            }
        });
    }

    // 2. Create scans for these users
    const dbUsers = await prisma.user.findMany({
        where: { username: { in: users.map(u => u.username) } }
    });

    const mockScans = [
        {
            username: 'trendsetter_ny',
            photoUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
            aiFeedback: 'Un look monocromático excelente. El corte del saco le da un toque sofisticado.',
            harmonyScore: 92
        },
        {
            username: 'vintage_soul',
            photoUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&h=800&fit=crop',
            aiFeedback: 'La combinación de texturas es arriesgada pero funciona perfectamente para un estilo retro.',
            harmonyScore: 85
        },
        {
            username: 'cyber_punk_fan',
            photoUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&h=800&fit=crop',
            aiFeedback: 'Estética futurista impecable. El contraste de negro con acentos neón es tendencia.',
            harmonyScore: 88
        }
    ];

    for (const s of mockScans) {
        const user = dbUsers.find(u => u.username === s.username);
        if (user) {
            await prisma.scan.create({
                data: {
                    userId: user.id,
                    photoUrl: s.photoUrl,
                    aiFeedback: s.aiFeedback,
                    harmonyScore: s.harmonyScore
                }
            });
        }
    }

    console.log('Community data seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
