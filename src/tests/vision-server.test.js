/**
 * Focused checks for server/vision.js with a mocked Gemini client.
 */

const { createIdentifyHandler, DEFAULT_MODEL } = require('../../server/vision');

const IMAGE = Buffer.from('fake-jpeg-bytes').toString('base64');

function mockResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }
    };
}

async function call(handler, body) {
    const res = mockResponse();
    await handler({ body }, res);
    return res;
}

describe('POST /api/vision/identify handler', () => {
    afterEach(() => {
        delete process.env.GEMINI_VISION_MODEL;
        jest.restoreAllMocks();
    });

    test('returns the Gemini identification with provider and model', async () => {
        const generateContent = jest.fn(async () => ({
            text: JSON.stringify({ label: 'laptop', category: 'object', isPlant: false, commonName: 'laptop', scientificName: '', confidence: 0.99, alternatives: [] })
        }));
        const handler = createIdentifyHandler({ getClient: () => ({ models: { generateContent } }) });

        const res = await call(handler, { image: IMAGE, mimeType: 'image/jpeg' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ label: 'laptop', isPlant: false, provider: 'gemini', model: DEFAULT_MODEL });
        const request = generateContent.mock.calls[0][0];
        expect(request.model).toBe('gemini-3.8-flash');
        expect(request.contents[0].parts[0]).toEqual({ inlineData: { mimeType: 'image/jpeg', data: IMAGE } });
        expect(request.config.responseMimeType).toBe('application/json');
    });

    test('GEMINI_VISION_MODEL overrides the default model', async () => {
        process.env.GEMINI_VISION_MODEL = 'gemini-3.1-pro-preview';
        const generateContent = jest.fn(async () => ({ text: '{"label":"rose"}' }));
        const handler = createIdentifyHandler({ getClient: () => ({ models: { generateContent } }) });

        const res = await call(handler, { image: IMAGE, mimeType: 'image/png' });

        expect(generateContent.mock.calls[0][0].model).toBe('gemini-3.1-pro-preview');
        expect(res.body.model).toBe('gemini-3.1-pro-preview');
    });

    test.each([
        ['missing image', { mimeType: 'image/jpeg' }],
        ['unsupported type', { image: IMAGE, mimeType: 'image/gif' }],
        ['missing body', undefined]
    ])('rejects %s with 400', async (_, body) => {
        const handler = createIdentifyHandler({ getClient: () => { throw new Error('should not be called'); } });
        expect((await call(handler, body)).statusCode).toBe(400);
    });

    test('rejects images over 4 MB with 413', async () => {
        const handler = createIdentifyHandler({ getClient: () => { throw new Error('should not be called'); } });
        const large = Buffer.alloc(4 * 1024 * 1024 + 1).toString('base64');
        expect((await call(handler, { image: large, mimeType: 'image/jpeg' })).statusCode).toBe(413);
    });

    test('returns 503 when no API key is configured', async () => {
        const handler = createIdentifyHandler({ getClient: () => null });
        const res = await call(handler, { image: IMAGE, mimeType: 'image/jpeg' });
        expect(res.statusCode).toBe(503);
    });

    test('returns 502 on provider error and never logs the image', async () => {
        const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
        const handler = createIdentifyHandler({
            getClient: () => ({ models: { generateContent: async () => { throw new Error('quota exceeded'); } } })
        });

        const res = await call(handler, { image: IMAGE, mimeType: 'image/jpeg' });

        expect(res.statusCode).toBe(502);
        expect(JSON.stringify(res.body)).not.toContain('quota');
        expect(JSON.stringify(errorLog.mock.calls)).not.toContain(IMAGE);
    });

    test('default client is not created without GEMINI_API_KEY', async () => {
        const saved = process.env.GEMINI_API_KEY;
        delete process.env.GEMINI_API_KEY;
        try {
            const res = await call(createIdentifyHandler(), { image: IMAGE, mimeType: 'image/jpeg' });
            expect(res.statusCode).toBe(503);
        } finally {
            if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
        }
    });
});
