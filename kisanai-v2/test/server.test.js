const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../server');
const { openMeteoResponse } = require('./fixtures');

async function withServer(options, fn) {
    const server = createApp(options).listen(0);
    const base = `http://localhost:${server.address().port}`;
    try { await fn(base); } finally { server.close(); }
}

const okFetch = data => async () => ({ ok: true, json: async () => data });

test('GET /api/advice returns conditions and advice', async () => {
    await withServer({ fetchFn: okFetch(openMeteoResponse({ shallow: 0.1, deep: 0.12 })) }, async base => {
        const res = await fetch(`${base}/api/advice?lat=28.6&lon=77.2&crop=wheat`);
        const body = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(body.conditions.soilMoisture, 0.11);
        assert.strictEqual(body.advice.action, 'irrigate_now');
    });
});

test('GET /api/advice rejects bad input', async () => {
    await withServer({ fetchFn: okFetch({}) }, async base => {
        assert.strictEqual((await fetch(`${base}/api/advice?lat=abc&lon=1&crop=wheat`)).status, 400);
        assert.strictEqual((await fetch(`${base}/api/advice?lat=1&lon=1&crop=banana`)).status, 400);
    });
});

test('GET /api/advice returns 502 when the data source fails', async () => {
    await withServer({ fetchFn: async () => { throw new Error('timeout'); } }, async base => {
        assert.strictEqual((await fetch(`${base}/api/advice?lat=1&lon=1&crop=wheat`)).status, 502);
    });
});

const post = (base, body) => fetch(`${base}/api/diagnose`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});

test('POST /api/diagnose sends photo, language and crop to Gemini', async () => {
    let request;
    const result = { isCrop: true, crop: 'Wheat', status: 'problem', problem: 'Leaf rust', confidence: 0.7, advice: ['Remove affected leaves'] };
    const getClient = () => ({ models: { generateContent: async r => { request = r; return { text: JSON.stringify(result) }; } } });
    await withServer({ getClient }, async base => {
        const res = await post(base, { image: 'aGVsbG8=', mimeType: 'image/jpeg', language: 'hi', crop: 'wheat' });
        const body = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(body.problem, 'Leaf rust');
        const prompt = request.contents[0].parts[1].text;
        assert.match(prompt, /Hindi/);
        assert.match(prompt, /this is wheat/);
        assert.strictEqual(request.contents[0].parts[0].inlineData.data, 'aGVsbG8=');
    });
});

test('POST /api/diagnose validates input and config', async () => {
    await withServer({ getClient: () => null }, async base => {
        assert.strictEqual((await post(base, { image: 'aGVsbG8=', mimeType: 'image/gif' })).status, 400);
        assert.strictEqual((await post(base, { image: 'aGVsbG8=', mimeType: 'image/jpeg' })).status, 503);
    });
});

test('POST /api/diagnose returns 502 on provider error', async () => {
    const getClient = () => ({ models: { generateContent: async () => { throw new Error('quota'); } } });
    await withServer({ getClient }, async base => {
        assert.strictEqual((await post(base, { image: 'aGVsbG8=', mimeType: 'image/png' })).status, 502);
    });
});
