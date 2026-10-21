const test = require('node:test');
const assert = require('node:assert');
const { parseResponse, buildUrl, fetchClimate } = require('../lib/climate');
const { powerResponse } = require('./fixtures');

test('splits the year into the warm half and the rest', () => {
    const c = parseResponse(powerResponse());
    assert.strictEqual(c.splitBy, 'temperature');
    assert.deepStrictEqual(c.seasons.main.months, [5, 6, 7, 8, 9, 10]);
    assert.deepStrictEqual(c.seasons.second.months, [11, 12, 1, 2, 3, 4]);
    assert.strictEqual(c.seasons.main.meanTempC, 21.3);
    assert.strictEqual(c.seasons.main.wetness, 0.5);
    // 2 mm/day over May-Oct (184 days)
    assert.strictEqual(c.seasons.main.rainMm, 368);
    assert.strictEqual(c.annualRainMm, Math.round(2 * 365.25));
});

test('heat and frost are judged on the middle 4 months of a season', () => {
    const c = parseResponse(powerResponse());
    // Main season May-Oct: middle months Jun-Sep. Hottest Jul 27+10, coldest Sep 20-8.
    assert.strictEqual(c.seasons.main.hotDayC, 37);
    assert.strictEqual(c.seasons.main.coldNightC, 12);
    // Second season Nov-Apr: middle months Dec-Mar. Coldest Jan 0-8.
    assert.strictEqual(c.seasons.second.coldNightC, -8);
});

test('trend compares the first and last 10 years', () => {
    const c = parseResponse(powerResponse({
        rain: y => (y >= 2011 ? 1.5 : 2),
        t2m: (y, m) => [0, 2, 6, 12, 18, 24, 27, 26, 20, 13, 6, 1][m] + (y >= 2011 ? 1 : 0)
    }));
    assert.strictEqual(c.trend.early, '1991-2000');
    assert.strictEqual(c.trend.recent, '2011-2020');
    assert.strictEqual(c.trend.rainChangePct, -25);
    assert.strictEqual(c.trend.mainSeasonTempChangeC, 1);
    // Normal = mean of all 30 years (1.83 mm/day); 1.5 mm/day is 82% of it, so not a dry year.
    assert.strictEqual(c.trend.dryYearsRecent, 0);
});

test('counts dry years in the last 10', () => {
    const c = parseResponse(powerResponse({ rain: y => ([2016, 2018, 2020].includes(y) ? 1 : 2) }));
    assert.strictEqual(c.trend.dryYearsRecent, 3);
});

test('in the tropics the main season is the wettest half', () => {
    const c = parseResponse(powerResponse({ t2m: () => 25, rain: (y, m) => (m >= 2 && m <= 7 ? 5 : 1) }));
    assert.strictEqual(c.splitBy, 'rain');
    assert.deepStrictEqual(c.seasons.main.months, [3, 4, 5, 6, 7, 8]);
});

test('skips years with missing values and fails when too few are left', () => {
    const data = powerResponse({ rain: (y, m) => (y === 1995 && m === 3 ? -999 : 2) });
    assert.strictEqual(parseResponse(data).source, 'NASA POWER (MERRA-2), 1991-2020');
    assert.strictEqual(parseResponse(data).trend.early, '1991-2001'); // 1995 dropped
    assert.throws(() => parseResponse(powerResponse({ firstYear: 2010 })), /Not enough/);
    assert.throws(() => parseResponse({ properties: { parameter: {} } }), /missing T2M/);
});

test('url asks NASA POWER for the agriculture parameters up to last year', () => {
    const url = new URL(buildUrl(28.6, 77.2, 2025));
    assert.strictEqual(url.hostname, 'power.larc.nasa.gov');
    assert.strictEqual(url.searchParams.get('parameters'), 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,GWETROOT');
    assert.strictEqual(url.searchParams.get('start'), '1991');
    assert.strictEqual(url.searchParams.get('end'), '2025');
});

test('reports NASA POWER errors', async () => {
    await assert.rejects(fetchClimate(1, 1, { fetchFn: async () => ({ ok: false, status: 503 }) }), /503/);
});
