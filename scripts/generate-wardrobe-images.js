/**
 * Script to generate realistic clothing images using Gemini Image Generation API
 * Run this script when the API quota resets to generate all wardrobe placeholder images
 * 
 * Usage: node scripts/generate-wardrobe-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../public/wardrobe-images');
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict';

// Ensure API key is set
if (!API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY is not set');
    process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Define all clothing items to generate
const CLOTHING_ITEMS = [
    // TOPS
    { category: 'top', name: 'white-tshirt-casual', prompt: 'White cotton t-shirt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'white' },
    { category: 'top', name: 'black-tshirt-streetwear', prompt: 'Black streetwear t-shirt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'black' },
    { category: 'top', name: 'navy-tshirt-casual', prompt: 'Navy blue casual t-shirt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'navy' },
    { category: 'top', name: 'white-shirt-formal', prompt: 'White formal dress shirt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'white' },
    { category: 'top', name: 'blue-shirt-smart', prompt: 'Light blue smart casual button-up shirt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'blue' },
    { category: 'top', name: 'gray-sweater-casual', prompt: 'Gray casual sweater laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'gray' },

    // BOTTOMS
    { category: 'bottom', name: 'blue-jeans-casual', prompt: 'Blue denim jeans laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'blue' },
    { category: 'bottom', name: 'black-jeans-casual', prompt: 'Black denim jeans laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'black' },
    { category: 'bottom', name: 'navy-pants-formal', prompt: 'Navy blue formal dress pants laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'navy' },
    { category: 'bottom', name: 'gray-pants-smart', prompt: 'Gray smart casual pants laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'gray' },
    { category: 'bottom', name: 'khaki-chinos-casual', prompt: 'Khaki chino pants laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'khaki' },

    // SHOES
    { category: 'shoes', name: 'white-sneakers-sport', prompt: 'White sports sneakers placed on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, authentic look, smartphone photography style', color: 'white' },
    { category: 'shoes', name: 'black-sneakers-casual', prompt: 'Black casual sneakers placed on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, authentic look, smartphone photography style', color: 'black' },
    { category: 'shoes', name: 'brown-shoes-formal', prompt: 'Brown leather formal dress shoes placed on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, authentic look, smartphone photography style', color: 'brown' },
    { category: 'shoes', name: 'black-shoes-formal', prompt: 'Black leather formal dress shoes placed on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, authentic look, smartphone photography style', color: 'black' },
    { category: 'shoes', name: 'beige-heels-elegant', prompt: 'Beige elegant high heels placed on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, authentic look, smartphone photography style', color: 'beige' },

    // OUTERWEAR
    { category: 'outerwear', name: 'black-jacket-urban', prompt: 'Black urban jacket laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'black' },
    { category: 'outerwear', name: 'navy-jacket-classic', prompt: 'Navy blue classic jacket laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'navy' },
    { category: 'outerwear', name: 'gray-coat-winter', prompt: 'Gray winter coat laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'gray' },
    { category: 'outerwear', name: 'camel-coat-elegant', prompt: 'Camel colored elegant coat laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'camel' },

    // DRESSES
    { category: 'dress', name: 'pink-dress-elegant', prompt: 'Pink elegant dress laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'pink' },
    { category: 'dress', name: 'black-dress-formal', prompt: 'Black formal dress laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'black' },
    { category: 'dress', name: 'navy-dress-professional', prompt: 'Navy blue professional dress laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'navy' },
    { category: 'dress', name: 'blue-dress-casual', prompt: 'Light blue casual dress laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style', color: 'blue' },

    // ACCESSORIES
    { category: 'accessory', name: 'silver-watch-minimal', prompt: 'Silver minimalist wristwatch placed on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, authentic look, smartphone photography style', color: 'silver' },
    { category: 'accessory', name: 'gold-watch-luxury', prompt: 'Gold luxury wristwatch placed on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, authentic look, smartphone photography style', color: 'gold' },
    { category: 'accessory', name: 'black-belt-leather', prompt: 'Black leather belt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, authentic look, smartphone photography style', color: 'black' },
    { category: 'accessory', name: 'brown-belt-classic', prompt: 'Brown leather belt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, authentic look, smartphone photography style', color: 'brown' },
];

/**
 * Generate image using Gemini API
 */
async function generateImage(item) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            instances: [{
                prompt: item.prompt
            }],
            parameters: {
                sampleCount: 1,
                aspectRatio: "3:4",
                safetyFilterLevel: "block_some",
                personGeneration: "dont_allow"
            }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        const imageData = response.predictions[0].bytesBase64Encoded;
                        resolve(imageData);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                } else {
                    reject(new Error(`API returned status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Save image to file
 */
function saveImage(imageData, filename) {
    const buffer = Buffer.from(imageData, 'base64');
    const filepath = path.join(OUTPUT_DIR, `${filename}.png`);
    fs.writeFileSync(filepath, buffer);
    console.log(`✓ Saved: ${filename}.png`);
    return filepath;
}

/**
 * Main execution
 */
async function main() {
    console.log('🎨 Starting wardrobe image generation...\n');
    console.log(`Total items to generate: ${CLOTHING_ITEMS.length}\n`);

    if (!API_KEY) {
        console.error('❌ Error: API_KEY not found in environment variables');
        process.exit(1);
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < CLOTHING_ITEMS.length; i++) {
        const item = CLOTHING_ITEMS[i];
        console.log(`[${i + 1}/${CLOTHING_ITEMS.length}] Generating: ${item.name}...`);

        try {
            const imageData = await generateImage(item);
            saveImage(imageData, item.name);

            results.push({
                ...item,
                filename: `${item.name}.png`,
                success: true
            });

            successCount++;

            // Wait 2 seconds between requests to avoid rate limiting
            if (i < CLOTHING_ITEMS.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`✗ Failed: ${item.name} - ${error.message}`);
            results.push({
                ...item,
                success: false,
                error: error.message
            });
            failCount++;
        }
    }

    // Save results manifest
    const manifest = {
        generatedAt: new Date().toISOString(),
        totalItems: CLOTHING_ITEMS.length,
        successCount,
        failCount,
        items: results
    };

    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );

    console.log('\n📊 Generation Summary:');
    console.log(`✓ Success: ${successCount}`);
    console.log(`✗ Failed: ${failCount}`);
    console.log(`\n📁 Images saved to: ${OUTPUT_DIR}`);
    console.log(`📄 Manifest saved to: ${path.join(OUTPUT_DIR, 'manifest.json')}`);

    if (successCount > 0) {
        console.log('\n✨ Next step: Run update-starter-pack.js to update StarterPackData.ts');
    }
}

// Run the script
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
