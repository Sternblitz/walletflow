
const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

function getEnvValue(key) {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
        return match ? match[1].trim() : null;
    } catch (e) {
        return null;
    }
}

async function listModels() {
    const apiKey = getEnvValue('GEMINI_API_KEY') || getEnvValue('GOOGLE_API_KEY');
    if (!apiKey) {
        console.error("No API key found in .env.local");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        console.log("Listing models...");
        const response = await ai.models.list();
        console.log("Response structure:", Object.keys(response));

        // Try to find the array
        const models = Array.isArray(response) ? response : (response.models || response.data || []);

        if (models.length > 0) {
            console.log("\nAvailable Models:");
            models.forEach(model => {
                console.log(`- ${model.name}`);
            });
        } else {
            console.log("Response:", JSON.stringify(response, null, 2));
        }

    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
