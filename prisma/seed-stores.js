const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STORES = [
    // --- BUENOS AIRES ---
    {
        name: "Galeria Pacífico",
        description: "Iconic shopping center with frescoes and premium brands.",
        address: "Av. Córdoba 550, CABA",
        lat: -34.5997,
        lng: -58.3756,
        type: "Mall",
        rating: 4.8,
        imageUrl: "https://images.unsplash.com/photo-1519567241046-7f570eee3d9f?w=800&q=80",
        openingHours: "10:00 - 21:00",
        items: [
            { name: "Luxury Handbag", price: 1200, category: "Accessories", imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800" },
            { name: "Silk Scarf", price: 150, category: "Accessories", imageUrl: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800" }
        ]
    },
    {
        name: "Palermo Soho Vintage",
        description: "Curated selection of 90s fashion and rare finds.",
        address: "Malabia 1700, Palermo",
        lat: -34.5912,
        lng: -58.4239,
        type: "Vintage",
        rating: 4.6,
        imageUrl: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?w=800&q=80",
        openingHours: "14:00 - 20:00",
        items: [
            { name: "Retro Jacket", price: 85, category: "Outerwear", imageUrl: "https://images.unsplash.com/photo-1551488852-d8048f5422ae?w=800" },
            { name: "Band Tee", price: 45, category: "Tops", imageUrl: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800" }
        ]
    },
    {
        name: "Recoleta Boutique",
        description: "Designer wear for sophisticated tastes.",
        address: "Av. Alvear 1800, Recoleta",
        lat: -34.5878,
        lng: -58.3905,
        type: "Boutique",
        rating: 4.9,
        imageUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80",
        openingHours: "11:00 - 19:00",
        items: [
            { name: "Evening Gown", price: 890, category: "Dresses", imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800" },
            { name: "Heels", price: 320, category: "Shoes", imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800" }
        ]
    },
    // --- NEW YORK (for contrast) ---
    {
        name: "SoHo Designer Loft",
        description: "Minimalist fashion in a converted industrial space.",
        address: "Greene St, NY",
        lat: 40.7233,
        lng: -74.0006,
        type: "Boutique",
        rating: 4.7,
        imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
        openingHours: "11:00 - 20:00",
        items: []
    }
];

async function main() {
    console.log(`Start seeding stores...`);
    // clean up old store attempts if any (optional, be careful in prod)
    // await prisma.store.deleteMany({}); 

    for (const storeData of STORES) {
        const { items, ...store } = storeData;
        const createdStore = await prisma.store.create({
            data: {
                ...store,
                items: {
                    create: items
                }
            }
        });
        console.log(`Created store with id: ${createdStore.id}`);
    }
    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
