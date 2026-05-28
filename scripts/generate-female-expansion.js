
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

// Define NEW female clothing items
const CLOTHING_ITEMS = [
    // TOPS
    { category: 'top', name: 'white-blouse-silk', prompt: 'White silk blouse laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic drape, elegant look, smartphone photography style' },
    { category: 'top', name: 'floral-blouse-summer', prompt: 'Floral print summer blouse laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic drape, authentic look, smartphone photography style' },

    // BOTTOMS
    { category: 'bottom', name: 'black-skirt-pencil', prompt: 'Black pencil skirt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, professional look, smartphone photography style' },
    { category: 'bottom', name: 'beige-skirt-midi', prompt: 'Beige flowy midi skirt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style' },
    { category: 'bottom', name: 'blue-skirt-denim', prompt: 'Blue denim miniskirt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, denim texture, authentic look, smartphone photography style' },

    // SHOES
    { category: 'shoes', name: 'red-heels-stiletto', prompt: 'Red stiletto high heels placed on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, glossy finish, authentic look, smartphone photography style' },
    { category: 'shoes', name: 'black-boots-ankle', prompt: 'Black leather ankle boots placed on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, leather texture, authentic look, smartphone photography style' },

    // ACCESSORIES
    { category: 'accessory', name: 'black-bag-leather', prompt: 'Black leather handbag placed on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, gold hardware, authentic look, smartphone photography style' },
    { category: 'accessory', name: 'patterned-scarf-silk', prompt: 'Colorfully patterned silk scarf drapes on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, fluid fabric, authentic look, smartphone photography style' },

    // DRESSES
    { category: 'dress', name: 'floral-dress-summer', prompt: 'Floral summer dress laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style' }
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
    console.log('🎨 Starting Female Wardrobe Expansion...\n');
    console.log(`Total new items to generate: ${CLOTHING_ITEMS.length}\n`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < CLOTHING_ITEMS.length; i++) {
        const item = CLOTHING_ITEMS[i];
        console.log(`[${i + 1}/${CLOTHING_ITEMS.length}] Generating: ${item.name}...`);

        try {
            const imageData = await generateImage(item);
            saveImage(imageData, item.name);
            results.push({ ...item, filename: `${item.name}.png`, success: true });
            successCount++;

            // Wait 2 seconds between requests
            if (i < CLOTHING_ITEMS.length - 1) await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`✗ Failed: ${item.name} - ${error.message}`);
            results.push({ ...item, success: false, error: error.message });
            failCount++;
        }
    }

    // Append to manifest if exists, or create new
    // We'll just log summary. The sync script relies on file existence/naming mostly.

    console.log('\n📊 Expansion Summary:');
    console.log(`✓ Success: ${successCount}`);
    console.log(`✗ Failed: ${failCount}`);
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
