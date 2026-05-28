
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Full Wardrobe Sync (Healing)...');

    // Get the first user (assuming single user context for now)
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('❌ No user found in DB.');
        return;
    }
    const userId = user.id;
    console.log(`👤 Target User: ${userId} (${user.email || 'No Email'})`);

    const starterPackPath = path.join(__dirname, '../src/lib/StarterPackData.ts');
    const content = fs.readFileSync(starterPackPath, 'utf8');

    // Regex to match item objects from the file
    // { category: 'TOP', imageUrl: '...', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'White' },
    const regex = /\{\s*category:\s*'([^']+)',\s*imageUrl:\s*'([^']+)',\s*style:\s*'([^']+)',\s*occasion:\s*'([^']+)',\s*season:\s*'([^']+)',\s*brand:\s*'([^']+)',\s*color:\s*'([^']+)'\s*\}/g;

    let match;
    let synced = 0;

    while ((match = regex.exec(content)) !== null) {
        const [_, category, imageUrl, style, occasion, season, brand, color] = match;

        // Check if item exists (loose matching by Category + Color + Style to avoid duplicates)
        const existing = await prisma.item.findFirst({
            where: {
                userId: userId,
                category: category,
                color: color,
                style: style
            }
        });

        if (existing) {
            console.log(`Assignments: [UPDATE] ${color} ${category}`);
            await prisma.item.update({
                where: { id: existing.id },
                data: { imageUrl: imageUrl }
            });
        } else {
            console.log(`Assignments: [CREATE] ${color} ${category}`);
            await prisma.item.create({
                data: {
                    userId: userId,
                    category: category,
                    imageUrl: imageUrl,
                    style: style,
                    occasion: occasion,
                    season: season,
                    brand: brand,
                    color: color
                }
            });
        }
        synced++;
    }

    console.log(`\n🎉 Wardrobe Healed. Synced ${synced} items.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
