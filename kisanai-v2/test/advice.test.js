const test = require('node:test');
const assert = require('node:assert');
const { irrigationAdvice } = require('../lib/advice');

const days = (rain, et0 = [5, 5, 5]) => rain.map((r, i) => ({ rainMm: r, et0Mm: et0[i] }));

test('dry soil and no rain: irrigate now with an amount', () => {
    const a = irrigationAdvice({ soilMoisture: 0.12, days: days([0, 0, 0]), crop: 'wheat' });
    assert.strictEqual(a.action, 'irrigate_now');
    assert.strictEqual(a.inDays, 0);
    assert.strictEqual(a.waterMm, Math.round((0.28 - 0.12) * 240));
});

test('dry soil but heavy rain today: wait', () => {
    const a = irrigationAdvice({ soilMoisture: 0.15, days: days([60, 0, 0]), crop: 'wheat' });
    assert.strictEqual(a.action, 'wait');
    assert.strictEqual(a.reason, 'rain_coming');
});

test('soil will dry in two days: irrigate soon', () => {
    // wheat: 5 mm x 1.15 = 5.75 mm/day = 0.024 per day
    const a = irrigationAdvice({ soilMoisture: 0.24, days: days([0, 0, 0]), crop: 'wheat' });
    assert.strictEqual(a.action, 'irrigate_soon');
    assert.strictEqual(a.inDays, 2);
});

test('plenty of water: wait', () => {
    const a = irrigationAdvice({ soilMoisture: 0.33, days: days([0, 0, 0], [2, 2, 2]), crop: 'millet' });
    assert.strictEqual(a.action, 'wait');
    assert.strictEqual(a.reason, 'enough_water');
});

test('saturated soil: wait, except rice', () => {
    assert.strictEqual(irrigationAdvice({ soilMoisture: 0.4, days: days([0, 0, 0]), crop: 'maize' }).reason, 'soil_wet');
    assert.notStrictEqual(irrigationAdvice({ soilMoisture: 0.4, days: days([0, 0, 0]), crop: 'rice' }).reason, 'soil_wet');
});

test('facts explain the decision', () => {
    const a = irrigationAdvice({ soilMoisture: 0.2, days: days([1, 2, 3]), crop: 'pulses' });
    assert.deepStrictEqual(a.facts, { soilMoisturePct: 20, refillPct: 18, rainMm: 6, cropUseMm: 15 });
});

test('unknown crop throws', () => {
    assert.throws(() => irrigationAdvice({ soilMoisture: 0.2, days: days([0]), crop: 'banana' }), /Unknown crop/);
});
