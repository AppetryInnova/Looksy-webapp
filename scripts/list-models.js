const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (response.models) {
                console.log('Available models:');
                response.models.forEach(model => {
                    console.log(`- ${model.name}`);
                    console.log(`  Supported methods: ${model.supportedGenerationMethods}`);
                });
            } else {
                console.log('No models found or error:', response);
            }
        } catch (e) {
            console.error('Error parsing response:', e);
            console.log('Raw data:', data);
        }
    });
}).on('error', (e) => {
    console.error('Error:', e);
});
