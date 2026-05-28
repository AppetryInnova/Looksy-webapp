
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// API Configuration
const API_KEY = process.env.GEMINI_API_KEY;
// Using FAST model to avoid Ultra quota and test styles quickly
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict';

if (!API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY is not set');
    process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '../public/wardrobe-images');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Aesthetics to test
const VARIANTS = [
    {
        name: 'test-style-a',
        description: 'Texture Bomb (Raw)',
        prompt: 'Raw close-up photo of a white cotton t-shirt laid flat, slightly wrinkled, heavy fabric texture visibility, sharp details, harsh realistic overhead lighting, not retouched, 8k uhd'
    },
    {
        name: 'test-style-b',
        description: 'Natural Sunlight (Organic)',
        prompt: 'White cotton t-shirt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, organic folds, authentic look, smartphone photography style'
    },
    {
        name: 'test-style-c',
        description: 'Studio Dramatic (Contrast)',
        prompt: 'High-end fashion photography of a white t-shirt, dramatic side lighting, deep shadows to accentuate form, volumetric lighting, ghost mannequin, sharp focus, 8k resolution'
    }
];

async function generateImage(item) {
    console.log(`\n🎨 Generating Variant: ${item.description}...`);

    try {
        const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instances: [
                    { prompt: item.prompt }
                ],
                parameters: {
                    aspectRatio: "1:1",
                    sampleCount: 1,
                    storageUriPrefix: ""
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API returned status ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
            const buffer = Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
            const filename = `${item.name}.png`;
            const filepath = path.join(OUTPUT_DIR, filename);

            fs.writeFileSync(filepath, buffer);
            console.log(`✓ Saved: ${filename}`);
            return { success: true, filename };
        } else {
            throw new Error('No image data in response');
        }

    } catch (error) {
        console.error(`✗ Failed: ${item.name} - ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🧪 Starting Realism Style Lab...\n');
    console.log(`Output Directory: ${OUTPUT_DIR}`);

    for (const variant of VARIANTS) {
        await generateImage(variant);
    }

    console.log('\n✨ Style Lab Complete!');
}

main();
