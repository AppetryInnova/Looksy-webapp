import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const influencerData = [
  {
    username: 'sophia_vanguard',
    name: 'Sophia Mora',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&auto=format&fit=crop',
    bio: 'Editora de moda en CDMX. Amante del minimalismo y texturas orgánicas. ✨',
    isInfluencer: true,
    isVerified: true,
    level: 'Style Icon',
    scans: [
      {
        photoUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
        aiFeedback: '[OUTFIT] Este look monocromático en tonos tierra es la definición de "Quiet Luxury". El entalle del blazer estructurado complementa perfectamente la fluidez de los pantalones palazzo.',
        harmonyScore: 94
      },
      {
        photoUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop',
        aiFeedback: '[OUTFIT] Gran uso de capas. El contraste entre la seda y la lana añade una profundidad visual exquisita.',
        harmonyScore: 88
      }
    ]
  },
  {
    username: 'mateo_streetwear',
    name: 'Mateo Ortiz',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop',
    bio: 'Streetwear & Sneakers. Bogotá / Buenos Aires. 👟🔥',
    isInfluencer: true,
    isVerified: true,
    level: 'Trend Hunter',
    scans: [
      {
        photoUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=800&auto=format&fit=crop',
        aiFeedback: '[OUTFIT] El arquetipo Gorpcore está muy bien ejecutado aquí. La paleta técnica es coherente con las tendencias actuales de alta montaña urbana.',
        harmonyScore: 91
      }
    ]
  },
  {
    username: 'valeria_beauty',
    name: 'Valeria Santos',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&h=256&auto=format&fit=crop',
    bio: 'MUA profesional. Tips de colorimetría y estética. 💄',
    isInfluencer: true,
    isVerified: false,
    level: 'Trend Hunter',
    scans: [
      {
        photoUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800&auto=format&fit=crop',
        aiFeedback: '[MAKEUP] Excelente aplicación de la técnica "no-makeup makeup". Los tonos cálidos resaltan tu subtono de piel de manera natural.',
        harmonyScore: 95
      }
    ]
  }
];

async function main() {
  console.log('🌱 Seeding social data for Looksy...');

  for (const data of influencerData) {
    const { scans, ...userData } = data;
    
    const user = await prisma.user.upsert({
      where: { email: `${data.username}@looksy.app` },
      update: {
        ...userData,
        emailVerified: new Date(),
      },
      create: {
        ...userData,
        email: `${data.username}@looksy.app`,
        emailVerified: new Date(),
      },
    });

    console.log(`✅ Created/Updated user: @${user.username}`);

    for (const scanData of scans) {
      await prisma.scan.create({
        data: {
          ...scanData,
          userId: user.id,
        }
      });
    }
    
    // Add some posts too
    await prisma.post.create({
        data: {
            userId: user.id,
            content: `¡Hola comunidad! Acabo de subir un nuevo análisis de outfit. ¿Qué les parece la combinación de texturas? ${data.username === 'mateo_streetwear' ? '🔥👟' : '✨👗'}`,
            imageUrl: scans[0].photoUrl // Reuse image for post
        }
    });

    console.log(`   - Added ${scans.length} scans and 1 post for @${user.username}`);
  }

  console.log('✨ Seeding complete! The community is now alive.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
