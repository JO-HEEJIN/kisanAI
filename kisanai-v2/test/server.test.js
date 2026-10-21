const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../server');
const { openMeteoResponse, powerResponse, soilGridsResponse } = require('./fixtures');

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

// Answers NASA POWER and SoilGrids by URL; records which hosts were called.
function routedFetch({ power = powerResponse(), soil = soilGridsResponse(), soilFails = false } = {}) {
    const calls = [];
    const fetchFn = async url => {
        const host = new URL(url).hostname;
        calls.push(host);
        if (host === 'rest.isric.org' && soilFails) throw new Error('reset');
        const body = host === 'power.larc.nasa.gov' ? power : soil;
        return { ok: true, json: async () => body };
    };
    return { fetchFn, calls };
}

test('GET /api/rotation returns NASA climate, soil and 3 plans', async () => {
    const { fetchFn } = routedFetch();
    await withServer({ fetchFn }, async base => {
        const res = await fetch(`${base}/api/rotation?lat=28.6&lon=77.2&irrigation=limited&lastCrop=maize&priorities=soil,water`);
        const body = await res.json();
        assert.strictEqual(res.status, 200);
        assert.match(body.climate.source, /NASA POWER/);
        assert.deepStrictEqual(body.soil, { texture: 'loam', organicMatter: 'low', ph: 7.2, source: 'soilgrids' });
        assert.ok(['main', 'second'].includes(body.startSeason));
        assert.strictEqual(body.plans.length, 3);
        assert.strictEqual(body.plans[0].seasons.length, 4);
    });
});

test('GET /api/rotation uses the farmer\'s soil and skips the soil map', async () => {
    const { fetchFn, calls } = routedFetch();
    await withServer({ fetchFn }, async base => {
        const body = await (await fetch(`${base}/api/rotation?lat=28.6&lon=77.2&irrigation=none&soil=clay&om=high`)).json();
        assert.deepStrictEqual(body.soil, { texture: 'clay', organicMatter: 'high', ph: null, source: 'farmer' });
        assert.deepStrictEqual(calls, ['power.larc.nasa.gov']);
    });
});

test('GET /api/rotation falls back to loam when the soil map is down', async () => {
    const { fetchFn } = routedFetch({ soilFails: true });
    await withServer({ fetchFn }, async base => {
        const body = await (await fetch(`${base}/api/rotation?lat=28.6&lon=77.2&irrigation=full`)).json();
        assert.strictEqual(body.soil.source, 'default');
        assert.strictEqual(body.soil.texture, 'loam');
    });
});

test('GET /api/rotation caches NASA POWER per area', async () => {
    const { fetchFn, calls } = routedFetch();
    await withServer({ fetchFn }, async base => {
        const url = `${base}/api/rotation?lat=28.61&lon=77.21&irrigation=none&soil=loam&om=low`;
        await fetch(url);
        await fetch(url.replace('28.61', '28.62'));
        assert.strictEqual(calls.filter(h => h === 'power.larc.nasa.gov').length, 1);
    });
});

test('GET /api/rotation rejects bad input', async () => {
    const { fetchFn } = routedFetch();
    await withServer({ fetchFn }, async base => {
        for (const query of [
            'lat=95&lon=1&irrigation=none',
            'lat=1&lon=1&irrigation=lots',
            'lat=1&lon=1&irrigation=none&soil=mud',
            'lat=1&lon=1&irrigation=none&ph=14',
            'lat=1&lon=1&irrigation=none&keepCrop=banana',
            'lat=1&lon=1&irrigation=none&priorities=fun'
        ]) {
            assert.strictEqual((await fetch(`${base}/api/rotation?${query}`)).status, 400, query);
        }
    });
});

test('GET /api/rotation returns 502 when NASA POWER fails', async () => {
    await withServer({ fetchFn: async () => ({ ok: false, status: 500 }) }, async base => {
        assert.strictEqual((await fetch(`${base}/api/rotation?lat=1&lon=1&irrigation=none&soil=loam&om=low`)).status, 502);
    });
});
