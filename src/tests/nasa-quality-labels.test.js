/**
 * Focused checks that the SMAP and MODIS API routes label generated values
 * as simulated on every response path. Upstream NASA calls are mocked.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');

// The routes are ES modules for Vercel; load them as CommonJS in a vm context.
function loadHandler(relativePath, fetchMock) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
        .replace('export default async function handler', 'module.exports = async function handler');
    const context = {
        module: {},
        process: { env: {} },
        console: { log() {}, warn() {}, error() {} },
        fetch: fetchMock,
        AbortController,
        URLSearchParams,
        setTimeout,
        clearTimeout,
        Date,
        Math
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return context.module.exports;
}

async function callHandler(handler, req = { method: 'GET', query: { lat: '37.5', lon: '127.0' }, headers: {} }) {
    const res = {
        statusCode: 200,
        body: null,
        setHeader() {},
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
        end() { return this; }
    };
    await handler(req, res);
    return res;
}

const jsonResponse = (body, ok = true, status = 200) => async () => ({ ok, status, json: async () => body });
const cmrEntry = { feed: { entry: [{ id: 'G123-TEST', title: 'granule' }] } };
const cmrEmpty = { feed: { entry: [] } };

function expectSimulated(res) {
    expect(res.statusCode).toBe(200);
    expect(res.body.quality).toBe('simulated');
    expect(res.body.source).toMatch(/^Simulated/);
    expect(res.body.source).not.toMatch(/real/i);
}

describe('SMAP soil moisture quality labels', () => {
    const route = 'api/smap/soil-moisture.js';

    test('CMR metadata match keeps granule context but is simulated', async () => {
        const res = await callHandler(loadHandler(route, jsonResponse(cmrEntry)));
        expectSimulated(res);
        expect(res.body.granule_id).toBe('G123-TEST');
        expect(res.body.source).toContain('measurements not retrieved');
    });

    test('empty CMR results fall back to simulated', async () => {
        expectSimulated(await callHandler(loadHandler(route, jsonResponse(cmrEmpty))));
    });

    test('CMR API error falls back to simulated', async () => {
        expectSimulated(await callHandler(loadHandler(route, jsonResponse({}, false, 500))));
    });

    test('unexpected handler error returns simulated fallback', async () => {
        const res = await callHandler(loadHandler(route, jsonResponse(cmrEntry)),
            { method: 'GET', query: { lat: '37.5', lon: '127.0' } });
        expectSimulated(res);
        expect(res.body.error).toBe('API temporarily unavailable');
    });
});

describe('MODIS NDVI quality labels', () => {
    const route = 'api/modis/ndvi.js';
    const byHost = (cmr, ornl) => async (url, options) =>
        (url.includes('modis.ornl.gov') ? ornl : cmr)(url, options);

    test('CMR metadata match keeps granule context but is simulated', async () => {
        const res = await callHandler(loadHandler(route, jsonResponse(cmrEntry)));
        expectSimulated(res);
        expect(res.body.granule_id).toBe('G123-TEST');
    });

    test('ORNL backup response is simulated', async () => {
        const fetchMock = byHost(jsonResponse(cmrEmpty), jsonResponse({ subset: [{ data: [5000] }] }));
        const res = await callHandler(loadHandler(route, fetchMock));
        expectSimulated(res);
        expect(res.body.source).toContain('ORNL');
    });

    test('CMR error and ORNL error fall back to simulated', async () => {
        const fetchMock = byHost(jsonResponse({}, false, 500), jsonResponse({}, false, 503));
        const res = await callHandler(loadHandler(route, fetchMock));
        expectSimulated(res);
        expect(res.body.granule_id).toBeUndefined();
    });

    test('unexpected handler error returns simulated fallback', async () => {
        const res = await callHandler(loadHandler(route, jsonResponse(cmrEntry)),
            { method: 'GET', query: { lat: '37.5', lon: '127.0' } });
        expectSimulated(res);
        expect(res.body.error).toBe('API temporarily unavailable');
    });
});
