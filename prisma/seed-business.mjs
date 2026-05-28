import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const storeData = [
  {
    name: 'Boutique Antara',
    address: 'Polanco, CDMX',
    lat: 19.4362,
    lng: -99.2012,
    type: 'Boutique',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
    campaigns: [
      {
        title: 'Verano en Antara 2026',
        description: 'Buscamos influencers con estilo minimalista para promocionar nuestra nueva colección de lino. Se requiere un reel y 2 historias.',
        reward: '$150 USD + Gift Card $100',
        requirements: JSON.stringify({ minFollowers: 5000, platform: 'Instagram' }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    ]
  },
  {
    name: 'Street Soul Bogotá',
    address: 'Chapinero, Bogotá',
    lat: 4.6482,
    lng: -74.0601,
    type: 'Concept Store',
    imageUrl: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=800&auto=format&fit=crop',
    campaigns: [
      {
        title: 'Lanzamiento Drop "Bogotá Night"',
        description: 'Campaña para el lanzamiento de la colección de invierno urbana. Buscamos creadores de contenido de moda urbana.',
        reward: '$200 USD + Outfit Completo',
        requirements: JSON.stringify({ minFollowers: 10000, platform: 'TikTok' }),
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      }
    ]
  }
];

async function main() {
  console.log('🏬 Seeding business data for Looksy...');

  for (const data of storeData) {
    const { campaigns, ...storeInfo } = data;
    
    const store = await prisma.store.create({
      data: {
        ...storeInfo,
      }
    });

    console.log(`✅ Created store: ${store.name}`);

    for (const camp of campaigns) {
      await prisma.campaign.create({
        data: {
          ...camp,
          storeId: store.id,
        }
      });
    }
    
    console.log(`   - Added ${campaigns.length} campaigns for ${store.name}`);
  }

  console.log('✨ Business seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
