
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Syncing Database Images with StarterPackData.ts...');

    const starterPackPath = path.join(__dirname, '../src/lib/StarterPackData.ts');
    const content = fs.readFileSync(starterPackPath, 'utf8');

    // Regex to match item objects
    // Example: { category: 'TOP', imageUrl: '...', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'White' },
    // We capture category, imageUrl, style, brand, color to use as lookup keys (except imageUrl which is the value to update)
    const regex = /\{\s*category:\s*'([^']+)',\s*imageUrl:\s*'([^']+)',\s*style:\s*'([^']+)',\s*occasion:\s*'([^']+)',\s*season:\s*'([^']+)',\s*brand:\s*'([^']+)',\s*color:\s*'([^']+)'\s*\}/g;

    let match;
    let count = 0;
    let updated = 0;

    while ((match = regex.exec(content)) !== null) {
        const [fullMatch, category, imageUrl, style, occasion, season, brand, color] = match;

        // Skip placeholders if we want, but actually we want to update everything defined in the file
        // The file currently has the correct ?v= timestamps for generated images

        console.log(`Processing: ${color} ${category} (${style}) -> ${imageUrl}`);

        try {
            // Update items that match the definition
            // We use updateMany because multiple users might have the same starter item
            const result = await prisma.item.updateMany({
                where: {
                    category: category,
                    color: color,
                    brand: brand,
                    // We can be more specific if needed, but these 3 usually define the "sku"
                    style: style
                },
                data: {
                    imageUrl: imageUrl
                }
            });

            if (result.count > 0) {
                console.log(`   ✅ Updated ${result.count} record(s)`);
                updated += result.count;
            } else {
                console.log(`   ⚠️ No matching records found in DB`);
            }
        } catch (error) {
            console.error(`   ❌ Error updating: ${error.message}`);
        }
        count++;
    }

    console.log(`\n🎉 Sync Complete.`);
    console.log(`Processed definitions: ${count}`);
    console.log(`Total DB records updated: ${updated}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
