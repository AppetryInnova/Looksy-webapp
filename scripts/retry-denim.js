
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../public/wardrobe-images');

// Ensure API key is set
if (!API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY is not set');
    process.exit(1);
}

const item = {
    name: 'blue-skirt-denim',
    prompt: 'Blue denim skirt laid on a matte white surface, illuminated by natural window sunlight coming from the side, soft cast shadows, denim texture, authentic look, smartphone photography style'
};

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
                        if (!response.predictions || !response.predictions[0]) {
                            reject(new Error(`No predictions returned. Safety block? ${JSON.stringify(response)}`));
                            return;
                        }
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

function saveImage(imageData, filename) {
    const buffer = Buffer.from(imageData, 'base64');
    const filepath = path.join(OUTPUT_DIR, `${filename}.png`);
    fs.writeFileSync(filepath, buffer);
    console.log(`✓ Saved: ${filename}.png`);
}

async function main() {
    console.log('🔄 Retrying: blue-skirt-denim...');
    try {
        const imageData = await generateImage(item);
        saveImage(imageData, item.name);
    } catch (error) {
        console.error(`✗ Failed: ${error.message}`);
        process.exit(1);
    }
}

main();
