const https = require('https');

const apiKey = "AIzaSyDjeN8zA2QRyqcET5j1crjgMx7XOxhWMaI";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error.message);
            } else if (json.models) {
                console.log("AVAILABLE MODELS:");
                json.models.forEach(m => {
                    if (m.supportedGenerationMethods.includes("generateContent")) {
                        console.log(`- ${m.name}`);
                    }
                });
            } else {
                console.log("No models found or unexpected response:", json);
            }
        } catch (e) {
            console.error("Parse Error:", e.message);
        }
    });
}).on('error', (e) => {
    console.error("Request Error:", e.message);
});
