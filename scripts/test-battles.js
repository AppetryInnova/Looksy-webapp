const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma Client...');
    try {
        const battles = await prisma.battle.findMany();
        console.log('Battles found:', battles.length);

        if (battles.length === 0) {
            console.log('Seeding initial battle...');
            await prisma.battle.create({
                data: {
                    title: "Neon Nights",
                    description: "Captura la energía de la ciudad. Luces neón, contrastes altos y vibes cyberpunk.",
                    theme: "Cyberpunk",
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    imageUrl: "https://images.unsplash.com/photo-1545156526-90b5bd438686?q=80&w=2699&auto=format&fit=crop"
                }
            });
            console.log('Battle seeded!');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
