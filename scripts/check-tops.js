const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Dumping ALL Items...');
    const items = await prisma.item.findMany();

    console.log(`Found ${items.length} items total.`);
    items.forEach(i => {
        console.log(`[${i.id}] ${i.category} / ${i.color} / ${i.style} -> ${i.imageUrl}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
