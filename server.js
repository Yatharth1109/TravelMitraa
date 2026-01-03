const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Parse JSON bodies

// --- PROMPT ENGINEERING ---
// This is the brain of your application.
const generateSystemPrompt = (data) => `
You are TravelMitra, an expert AI Travel Agent for India.
User Plan: "${data.prompt}"
Budget: ${data.budget}
Transport: ${data.transport}
Diet: ${data.diet}
Language: ${data.language}

TASK: Create a detailed itinerary in valid JSON format ONLY. 
Do not include markdown formatting (like \`\`\`json). Just the raw JSON object.

JSON STRUCTURE REQUIRED:
{
    "trip_title": "String",
    "summary": "String",
    "safety_report": {
        "score": "String (e.g., 8/10)",
        "tips": ["String", "String"],
        "emergency_contact": "String"
    },
    "transport_options": [
        {"mode": "String", "details": "String", "cost_est": "String"}
    ],
    "hotels": [
        {"name": "String", "rating": "String", "tags": ["String"], "reason": "String"}
    ],
    "itinerary": [
        {
            "day": 1,
            "title": "String",
            "activities": [
                {"time": "String", "activity": "String", "description": "String"}
            ],
            "food_spot": "String"
        }
    ],
    "budget_breakdown": {
        "transport": "String",
        "stay": "String",
        "food": "String",
        "total_est": "String"
    }
}
`;

// --- API Route ---
app.post('/generate', async (req, res) => {
    try {
        const userInputs = req.body;
        console.log("Received Request:", userInputs);

        const systemPrompt = generateSystemPrompt(userInputs);
        const apiKey = process.env.GEMINI_API_KEY;

        // Call Google Gemini API
        // NOTE: If using OpenAI, change URL to 'https://api.openai.com/v1/chat/completions'
        // and adjust the body structure accordingly.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });

        const data = await response.json();

        // Extract text from Gemini response
        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error("AI returned empty response");
        }

        // Clean up markdown code blocks if AI adds them
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonResponse = JSON.parse(rawText);
        res.json(jsonResponse);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Failed to generate itinerary. " + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 TravelMitra Server running on http://localhost:${PORT}`);
});