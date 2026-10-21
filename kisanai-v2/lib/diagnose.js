/**
 * Crop photo diagnosis with Google Gemini.
 * Adapted from v1's server/vision.js: same input checks and privacy rules,
 * but asks about crop health and a practical next step instead of "what is this".
 * Images are processed in memory only; they are never logged or stored.
 */

const DEFAULT_MODEL = 'gemini-3.8-flash';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const LANGUAGES = { en: 'English', hi: 'Hindi' };

const RESULT_SCHEMA = {
    type: 'object',
    properties: {
        isCrop: { type: 'boolean', description: 'True if the photo shows a crop plant, leaf, fruit or field' },
        crop: { type: 'string', description: 'Crop name, or what the photo shows if it is not a crop' },
        status: { type: 'string', enum: ['healthy', 'problem', 'unsure'] },
        problem: { type: 'string', description: 'Most likely disease, pest or deficiency; empty if healthy' },
        confidence: { type: 'number', description: 'Self-reported confidence from 0 to 1' },
        advice: { type: 'array', items: { type: 'string' }, description: '1-3 short, practical next steps a small farmer can take' }
    },
    required: ['isCrop', 'crop', 'status', 'problem', 'confidence', 'advice'],
    additionalProperties: false
};

function buildPrompt(language, crop) {
    const hint = crop ? `The farmer says this is ${crop}. ` : '';
    return `You are an experienced agronomist helping a small farmer. ${hint}Look at this photo.
If it shows a crop, judge its health: name the most likely disease, pest or nutrient deficiency, or say it looks healthy.
Use status "unsure" when the photo is too blurry, too far away, or the signs are not clear; never guess with high confidence.
Give 1-3 short, practical, low-cost next steps. Prefer safe options and say when to ask a local agriculture officer.
Write crop, problem and advice in ${LANGUAGES[language]}, in simple words.`;
}

let defaultClient = null;

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

function createDiagnoseHandler({ getClient = getDefaultClient } = {}) {
    return async function diagnoseHandler(req, res) {
        const { image, mimeType, crop } = req.body || {};
        const language = LANGUAGES[req.body?.language] ? req.body.language : 'en';

        if (typeof image !== 'string' || !image || !ALLOWED_MIME_TYPES.includes(mimeType)) {
            return res.status(400).json({ error: 'Body must include base64 image and mimeType (image/jpeg, image/png, or image/webp)' });
        }
        if (Buffer.byteLength(image, 'base64') > MAX_IMAGE_BYTES) {
            return res.status(413).json({ error: 'Image is larger than 4 MB' });
        }

        const client = getClient();
        if (!client) {
            return res.status(503).json({ error: 'Photo diagnosis is not configured' });
        }

        const model = process.env.GEMINI_VISION_MODEL || DEFAULT_MODEL;
        const cropName = typeof crop === 'string' ? crop.slice(0, 40) : '';

        try {
            const response = await client.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: image } }, { text: buildPrompt(language, cropName) }] }],
                config: { responseMimeType: 'application/json', responseJsonSchema: RESULT_SCHEMA }
            });
            return res.json({ ...JSON.parse(response.text), model });
        } catch (error) {
            // Log only the error message; never the request body.
            console.error('Diagnosis failed:', error.message);
            return res.status(502).json({ error: 'Diagnosis provider request failed' });
        }
    };
}

module.exports = { createDiagnoseHandler, buildPrompt, RESULT_SCHEMA };
