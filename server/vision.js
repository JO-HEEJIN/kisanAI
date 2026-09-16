/**
 * General image identification with Google Gemini.
 * POST /api/vision/identify  body: { image: <base64>, mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }
 * Images are processed in memory only; they are never logged or stored.
 */

const DEFAULT_MODEL = 'gemini-3.8-flash';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const PROMPT = `Identify the main subject of this photo. It can be anything: an everyday object, electronics, an animal, a person, food, or a plant.
If the subject is a plant or plant produce, identify the most specific species you can and give its scientific name.
Use label "unknown" only if you genuinely cannot tell what the subject is.`;

const RESULT_SCHEMA = {
    type: 'object',
    properties: {
        label: { type: 'string', description: 'Short name of the main subject' },
        category: { type: 'string', enum: ['plant', 'animal', 'object', 'food', 'person', 'scene', 'other', 'unknown'] },
        isPlant: { type: 'boolean', description: 'True for a living plant or plant produce' },
        commonName: { type: 'string', description: 'Common name, or the label for non-plants' },
        scientificName: { type: 'string', description: 'Binomial scientific name for plants, empty string otherwise' },
        confidence: { type: 'number', description: 'Self-reported confidence from 0 to 1' },
        alternatives: { type: 'array', items: { type: 'string' }, description: 'Other plausible identifications' }
    },
    required: ['label', 'category', 'isPlant', 'commonName', 'scientificName', 'confidence', 'alternatives'],
    additionalProperties: false
};

let defaultClient = null;

// @google/genai requires Node 20+, so it is loaded only when a real client is needed.
function getDefaultClient() {
    if (!process.env.GEMINI_API_KEY) {
        return null;
    }
    if (!defaultClient) {
        const { GoogleGenAI } = require('@google/genai');
        defaultClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return defaultClient;
}

function createIdentifyHandler({ getClient = getDefaultClient } = {}) {
    return async function identifyHandler(req, res) {
        const { image, mimeType } = req.body || {};

        if (typeof image !== 'string' || !image || !ALLOWED_MIME_TYPES.includes(mimeType)) {
            return res.status(400).json({ error: 'Body must include base64 image and mimeType (image/jpeg, image/png, or image/webp)' });
        }
        if (Buffer.byteLength(image, 'base64') > MAX_IMAGE_BYTES) {
            return res.status(413).json({ error: 'Image is larger than 4 MB' });
        }

        const client = getClient();
        if (!client) {
            return res.status(503).json({ error: 'Vision API is not configured' });
        }

        const model = process.env.GEMINI_VISION_MODEL || DEFAULT_MODEL;

        try {
            const response = await client.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: image } }, { text: PROMPT }] }],
                config: { responseMimeType: 'application/json', responseJsonSchema: RESULT_SCHEMA }
            });
            const result = JSON.parse(response.text);
            return res.json({ ...result, provider: 'gemini', model });
        } catch (error) {
            // Log only the error message; never the request body.
            console.error('Vision identify failed:', error.message);
            return res.status(502).json({ error: 'Vision provider request failed' });
        }
    };
}

module.exports = { createIdentifyHandler, RESULT_SCHEMA, DEFAULT_MODEL };
