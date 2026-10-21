const test = require('node:test');
const assert = require('node:assert');
const { parseResponse, textureClass, organicMatterClass, fetchSoil } = require('../lib/soil');
const { soilGridsResponse } = require('./fixtures');

test('turns SoilGrids values into simple soil classes', () => {
    assert.deepStrictEqual(parseResponse(soilGridsResponse()), { texture: 'loam', organicMatter: 'low', ph: 7.2, source: 'soilgrids' });
    assert.strictEqual(parseResponse(soilGridsResponse({ clay: 450, sand: 200 })).texture, 'clay');
    assert.strictEqual(parseResponse(soilGridsResponse({ clay: 100, sand: 750, soc: 250 })).organicMatter, 'high');
});

test('texture and organic matter thresholds', () => {
    assert.strictEqual(textureClass(70, 10), 'sandy');
    assert.strictEqual(textureClass(70, 25), 'loam');
    assert.strictEqual(textureClass(20, 35), 'clay');
    assert.strictEqual(organicMatterClass(9.9), 'low');
    assert.strictEqual(organicMatterClass(15), 'medium');
    assert.strictEqual(organicMatterClass(20), 'high');
});

test('no data (sea, city) gives null instead of a guess', () => {
    assert.strictEqual(parseResponse(soilGridsResponse({ clay: null })), null);
});

test('service down gives null', async () => {
    assert.strictEqual(await fetchSoil(1, 1, { fetchFn: async () => { throw new Error('reset'); } }), null);
    assert.strictEqual(await fetchSoil(1, 1, { fetchFn: async () => ({ ok: false, status: 500 }) }), null);
});
