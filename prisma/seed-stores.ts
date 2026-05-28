import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding stores...');

    // Clean existing data to avoid duplicates if running multiple times
    await prisma.storeItem.deleteMany({});
    await prisma.store.deleteMany({});

    // 1. Urban Style Boutique (Palermo Soho)
    await prisma.store.create({
        data: {
            name: 'Urban Style Boutique',
            description: 'Street fashion y diseño minimalista.',
            address: 'Gurruchaga 1750, CABA',
            lat: -34.5885,
            lng: -58.4306,
            type: 'Boutique',
            rating: 4.8,
            imageUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800',
            openingHours: '10:00 - 20:00',
            items: {
                create: [
                    {
                        name: 'Remera Blanca Minimalista',
                        price: 35.00,
                        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400',
                        category: 'Remeras' // Mapped later? Or keep generic? Let's use the new ones + generic
                    },
                    {
                        name: 'Pantalón Chino Slim',
                        price: 75.00,
                        imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa804b86d27b?q=80&w=400',
                        category: 'Pantalones'
                    },
                    {
                        name: 'Sweater de Lana Merino',
                        price: 89.00,
                        imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=400',
                        category: 'Sweaters'
                    }
                ]
            }
        }
    });

    // 2. Vintage Treasures (San Telmo)
    await prisma.store.create({
        data: {
            name: 'Vintage Treasures',
            description: 'Selección curada de clásicos de los 70s y 80s.',
            address: 'Defensa 1060, CABA',
            lat: -34.6179,
            lng: -58.3715,
            type: 'Vintage',
            rating: 4.6,
            imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800',
            openingHours: '11:00 - 19:00',
            items: {
                create: [
                    {
                        name: 'Campera de Jean Retro',
                        price: 120.00,
                        imageUrl: 'https://images.unsplash.com/photo-1551537482-f2035a38ee6d?q=80&w=400',
                        category: 'Sacos'
                    },
                    {
                        name: 'Vestido Floral 90s',
                        price: 65.00,
                        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=400',
                        category: 'Vestidos'
                    }
                ]
            }
        }
    });

    // 3. Galería de Diseño (Recoleta)
    await prisma.store.create({
        data: {
            name: 'Galería de Diseño',
            description: 'Piezas de diseñador y lujo.',
            address: 'Av. Alvear 1880, CABA',
            lat: -34.5889,
            lng: -58.3889,
            type: 'Luxury',
            rating: 4.9,
            imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800',
            openingHours: '10:00 - 19:30',
            items: {
                create: [
                    {
                        name: 'Vestido de Noche Seda',
                        price: 450.00,
                        imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=400',
                        category: 'Vestidos'
                    },
                    {
                        name: 'Saco Formal Negro',
                        price: 299.00,
                        imageUrl: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?q=80&w=400',
                        category: 'Sacos'
                    },
                    {
                        name: 'Stilettos Rojos',
                        price: 180.00,
                        imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=400',
                        category: 'Zapatos'
                    }
                ]
            }
        }
    });

    // 4. Zara (Simulado - Multi)
    await prisma.store.create({
        data: {
            name: 'Zara',
            description: 'Moda rápida y tendencias actuales.',
            address: 'Florida 100, CABA',
            lat: -34.6037,
            lng: -58.3816,
            type: 'Retail',
            rating: 4.4,
            imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800',
            openingHours: '09:00 - 21:00',
            items: {
                create: [
                    {
                        name: 'Sweater Oversized',
                        price: 45.00,
                        imageUrl: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?q=80&w=400',
                        category: 'Sweaters'
                    },
                    {
                        name: 'Pantalón Cargo',
                        price: 59.00,
                        imageUrl: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=400',
                        category: 'Pantalones'
                    },
                    {
                        name: 'Botas de Cuero',
                        price: 99.00,
                        imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b69f?q=80&w=400',
                        category: 'Zapatos'
                    }
                ]
            }
        }
    });

    console.log('Seeded 4 diverse stores in Buenos Aires');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
