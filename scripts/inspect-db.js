
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Inspecting Database Items...');
    const items = await prisma.item.findMany({
        take: 50
    });

    console.log(`Found ${items.length} items.`);
    items.forEach(item => {
        console.log(`ID: ${item.id} | Cat: ${item.category} | Color: ${item.color} | Style: ${item.style} | Brand: ${item.brand} | Img: ${item.imageUrl}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
