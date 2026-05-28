const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const BOT_NAMES = ['Aria_Stylist', 'NeoFashion', 'ElenaVogue', 'CyberChic', 'RetroBoy99'];

async function main() {
  console.log('🚀 Starting Bot Seeding Process...');

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY no detectada. Los bots no generarán contenido, solo se crearán.');
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  for (const botName of BOT_NAMES) {
    const email = `${botName.toLowerCase()}@looksy.bot`;
    
    // 1. Create or find the bot user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: botName,
          name: botName.replace('_', ' '),
          avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${botName}`,
          bio: "Influencer virtual generado por Looksy Gravity.",
          level: "Trendsetter",
        }
      });
      console.log(`✅ Created bot user: ${botName}`);
    } else {
      console.log(`ℹ️ Bot user ${botName} already exists.`);
    }

    // 2. Fetch some existing items to comment on
    const items = await prisma.item.findMany({ take: 3 });
    if (items.length === 0) {
      console.log('⚠️ No items found in DB to comment on. Skipping content generation.');
      break;
    }

    if (process.env.GEMINI_API_KEY) {
      for (const item of items) {
        try {
          // Wait 15 seconds between calls to respect Gemini Free Tier limits (15 RPM max)
          await new Promise(resolve => setTimeout(resolve, 15000));
          
          const prompt = `Actúa como un influencer de moda joven y crítico (Generación Z). Tienes una prenda de categoría "${item.category}" y color "${item.color}". Escribe un comentario muy corto y casual (máximo 15 palabras) con emojis. Responde SOLO con el comentario, nada más.`;
          const result = await model.generateContent(prompt);
          const commentText = result.response.text().trim().replace(/['"]/g, '');

          await prisma.post.create({
            data: {
              userId: user.id,
              content: `Miren esta prenda! ${commentText}`,
              imageUrl: item.imageUrl,
            }
          });
          console.log(`📝 ${botName} posted: ${commentText}`);
        } catch (e) {
          console.error(`❌ Failed to generate content for ${botName}:`, (e as any).message);
        }
      }
    }
  }

  console.log('✨ Bot Seeding Finished!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
