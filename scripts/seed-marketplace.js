const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding marketplace products...');

    // Get existing stores
    const stores = await prisma.store.findMany();

    if (stores.length === 0) {
        console.log('No stores found. Please run seed-stores.js first.');
        return;
    }

    const products = [
        // Luna Boutique products
        {
            storeName: 'Luna Boutique',
            name: 'Vestido Emerald Silk',
            price: 120.00,
            category: 'Vestidos',
            imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
            inStock: true
        },
        {
            storeName: 'Luna Boutique',
            name: 'Blusa Satén Blanca',
            price: 65.00,
            category: 'Blusas',
            imageUrl: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=600&h=800&fit=crop',
            inStock: true
        },
        {
            storeName: 'Luna Boutique',
            name: 'Falda Plisada Midi',
            price: 85.00,
            category: 'Faldas',
            imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=800&fit=crop',
            inStock: true
        },
        // Urban Style products
        {
            storeName: 'Urban Style',
            name: 'Blazer Oversize Gris',
            price: 95.50,
            category: 'Sacos',
            imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop',
            inStock: true
        },
        {
            storeName: 'Urban Style',
            name: 'Jeans Mom Fit',
            price: 78.00,
            category: 'Pantalones',
            imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=800&fit=crop',
            inStock: true
        },
        {
            storeName: 'Urban Style',
            name: 'Chaqueta Denim',
            price: 89.00,
            category: 'Chaquetas',
            imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop',
            inStock: true
        },
        // Vintage Paradise products
        {
            storeName: 'Vintage Paradise',
            name: 'Vestido Floral Retro',
            price: 55.00,
            category: 'Vestidos',
            imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=800&fit=crop',
            inStock: true
        },
        {
            storeName: 'Vintage Paradise',
            name: 'Cardigan Tejido',
            price: 45.00,
            category: 'Sweaters',
            imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop',
            inStock: true
        },
        // Minimalist Co products
        {
            storeName: 'Minimalist Co',
            name: 'Camisa Lino Beige',
            price: 72.00,
            category: 'Camisas',
            imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop',
            inStock: true
        },
        {
            storeName: 'Minimalist Co',
            name: 'Pantalón Wide Leg',
            price: 98.00,
            category: 'Pantalones',
            imageUrl: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop',
            inStock: true
        },
        {
            storeName: 'Minimalist Co',
            name: 'Trench Coat Clásico',
            price: 145.00,
            category: 'Abrigos',
            imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=800&fit=crop',
            inStock: true
        },
        {
            storeName: 'Minimalist Co',
            name: 'Suéter Cuello Alto',
            price: 68.00,
            category: 'Sweaters',
            imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop',
            inStock: true
        }
    ];

    for (const product of products) {
        const store = stores.find(s => s.name === product.storeName);
        if (store) {
            await prisma.storeItem.create({
                data: {
                    storeId: store.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    imageUrl: product.imageUrl,
                    inStock: product.inStock
                }
            });
        }
    }

    console.log('Marketplace products seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
