const test = require('node:test');
const assert = require('node:assert');
const { planRotations, nextSeason, cropFit, FALLOW } = require('../lib/rotation');
const { CROPS } = require('../lib/crops');

const season = (months, values) => ({ months, meanTempC: 20, hotDayC: 30, coldNightC: 8, rainMm: 400, wetness: 0.5, ...values });
const climate = ({ main = {}, second = {}, trend = {} } = {}) => ({
    seasons: {
        main: season([6, 7, 8, 9, 10, 11], { meanTempC: 30, hotDayC: 38, coldNightC: 20, rainMm: 650, ...main }),
        second: season([12, 1, 2, 3, 4, 5], { meanTempC: 19, hotDayC: 32, coldNightC: 4, rainMm: 80, ...second })
    },
    trend: { rainChangePct: 0, mainSeasonTempChangeC: 0, dryYearsRecent: 0, ...trend }
});
const loam = { texture: 'loam', organicMatter: 'medium', ph: 7 };
const plan = (farm, c = climate(), soil = loam) => planRotations({ climate: c, soil, farm: { irrigation: 'limited', startSeason: 'main', ...farm } });

test('returns 3 different 2-year plans in season order', () => {
    const plans = plan({});
    assert.strictEqual(plans.length, 3);
    for (const p of plans) assert.deepStrictEqual(p.seasons.map(s => s.season), ['main', 'second', 'main', 'second']);
    // Each plan differs from the others in at least 2 seasons.
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        const diff = plans[i].seasons.filter((s, k) => s.crop !== plans[j].seasons[k].crop).length;
        assert.ok(diff >= 2);
    }
});

test('only crops that fit the season are used', () => {
    for (const p of plan({})) {
        for (const s of p.seasons) {
            assert.ok(cropFit(s.crop, climate().seasons[s.season], { texture: 'loam', ph: 7, irrigation: 'limited' }), s.crop);
        }
    }
});

test('never the same crop twice in a row, including after the last crop', () => {
    for (const lastCrop of Object.keys(CROPS)) {
        for (const p of plan({ lastCrop })) {
            const sequence = [lastCrop, ...p.seasons.map(s => s.crop)];
            sequence.slice(1).forEach((crop, i) => assert.notStrictEqual(crop, sequence[i], `${lastCrop}: ${sequence}`));
        }
    }
});

test('crop fit: temperature, frost, soil, pH and water', () => {
    const hot = climate().seasons.main;
    const conditions = { texture: 'loam', ph: 7, irrigation: 'full' };
    assert.strictEqual(cropFit('wheat', hot, conditions), null); // too warm
    assert.ok(cropFit('maize', hot, conditions));
    assert.strictEqual(cropFit('maize', { ...hot, coldNightC: -3 }, conditions), null); // frost
    assert.strictEqual(cropFit('rice', hot, { ...conditions, texture: 'sandy' }), null);
    assert.strictEqual(cropFit('potato', climate().seasons.second, { ...conditions, ph: 7.5 }), null);
    // Rice needs ~1000 mm; with rain only it doesn't fit, with full irrigation it does.
    assert.strictEqual(cropFit('rice', hot, { ...conditions, irrigation: 'none' }), null);
    assert.ok(cropFit('rice', hot, conditions).gapMm > 0);
});

test('a crop the farmer wants to keep is in every plan', () => {
    const plans = plan({ keepCrop: 'cotton' });
    assert.ok(plans.length > 0);
    for (const p of plans) assert.ok(p.seasons.some(s => s.crop === 'cotton'));
    assert.deepStrictEqual(plan({ keepCrop: 'potato' }, climate({ second: { meanTempC: 30 } })), []);
});

test('priorities change the ranking', () => {
    const water = plan({ priorities: ['water'] })[0];
    const income = plan({ priorities: ['income'] })[0];
    assert.ok(water.scores.water >= income.scores.water);
    assert.ok(income.scores.income >= water.scores.income);
});

test('legumes after heavy feeders are explained', () => {
    const best = plan({ lastCrop: 'maize', priorities: ['soil'] })[0];
    const legume = best.reasons.find(r => r.code === 'legume_after');
    assert.ok(legume, JSON.stringify(best));
    assert.strictEqual(CROPS[legume.crop].nitrogen, 1);
});

test('a drying trend lowers resilience of thirsty crops and is explained', () => {
    const dry = trend => climate({ main: { rainMm: 350 }, trend });
    const farm = { irrigation: 'limited', keepCrop: 'maize' };
    const steady = plan(farm, dry({}))[0];
    const drying = plan(farm, dry({ rainChangePct: -15, dryYearsRecent: 4 }))[0];
    assert.ok(drying.scores.resilience < steady.scores.resilience);
    const plans = plan({ irrigation: 'none', priorities: ['resilience'] }, dry({ rainChangePct: -15, dryYearsRecent: 4 }));
    assert.ok(plans.some(p => p.reasons.some(r => r.code === 'dry_trend' && r.pct === -15 && r.dry === 4)));
});

test('irrigation suggested never exceeds what the farmer has', () => {
    for (const p of plan({ irrigation: 'none' })) for (const s of p.seasons) assert.strictEqual(s.irrigationMm, 0);
    for (const p of plan({ irrigation: 'limited' })) for (const s of p.seasons) assert.ok(s.irrigationMm <= 200);
});

test('very cold winters leave only frost-hardy crops, or fallow when nothing fits', () => {
    const cold = climate({ second: { meanTempC: -5, coldNightC: -25 } });
    for (const p of plan({}, cold)) {
        for (const s of p.seasons.filter(x => x.season === 'second')) assert.ok(CROPS[s.crop].frost, s.crop);
    }
    const arctic = climate({ second: { meanTempC: -15, coldNightC: -40 } });
    const p = plan({}, arctic)[0];
    assert.deepStrictEqual(p.seasons.filter(s => s.season === 'second').map(s => s.crop), [FALLOW, FALLOW]);
    assert.ok(p.warnings.some(w => w.code === 'bare'));
});

test('next season is the one that starts soonest', () => {
    const c = climate(); // main Jun-Nov, second Dec-May
    assert.strictEqual(nextSeason(c, new Date(2026, 3, 15)), 'main'); // April
    assert.strictEqual(nextSeason(c, new Date(2026, 7, 15)), 'second'); // August: main is 2 months in
    assert.strictEqual(nextSeason(c, new Date(2026, 6, 15)), 'main'); // July: main began last month, still in time
});
