const test = require('node:test');
const assert = require('node:assert');
const { parseResponse, buildUrl, isValidLocation, fetchConditions } = require('../lib/conditions');
const { openMeteoResponse } = require('./fixtures');

test('uses the current hour root-zone soil moisture', () => {
    const c = parseResponse(openMeteoResponse({ shallow: 0.2, deep: 0.3 }));
    assert.strictEqual(c.soilMoisture, 0.25);
    assert.strictEqual(c.temperatureC, 31.2);
    assert.strictEqual(c.days.length, 3);
    assert.deepStrictEqual(c.days[0], { date: '2026-10-21', rainMm: 0, rainChance: 10, et0Mm: 4, maxTempC: 33 });
});

test('fails instead of inventing data when soil moisture is missing', () => {
    const data = openMeteoResponse();
    data.hourly.soil_moisture_3_to_9cm[1] = null;
    assert.throws(() => parseResponse(data), /No soil moisture/);
});

test('url asks for the right variables', () => {
    const url = new URL(buildUrl(28.6, 77.2));
    assert.strictEqual(url.searchParams.get('latitude'), '28.6000');
    assert.match(url.searchParams.get('hourly'), /soil_moisture_9_to_27cm/);
    assert.match(url.searchParams.get('daily'), /et0_fao_evapotranspiration/);
});

test('validates coordinates', () => {
    assert.ok(isValidLocation(28.6, 77.2));
    assert.ok(!isValidLocation(91, 0));
    assert.ok(!isValidLocation(NaN, 0));
});

test('reports upstream errors', async () => {
    const fetchFn = async () => ({ ok: false, status: 500 });
    await assert.rejects(fetchConditions(1, 1, { fetchFn }), /500/);
});
