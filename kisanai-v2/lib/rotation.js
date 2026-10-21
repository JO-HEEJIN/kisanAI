/**
 * Crop rotation planner (pure function, no network).
 * Tries every 2-year plan (4 seasons: main, second, main, second) built from crops that fit the
 * local climate, soil and water, scores each for soil health, water, climate resilience and
 * income, weights the scores by the farmer's priorities and returns the best 3 different plans.
 */

const { CROPS } = require('./crops');

const FALLOW = 'fallow';
const PRIORITIES = ['soil', 'water', 'resilience', 'income'];
const IRRIGATION_MM = { none: 0, limited: 200, full: Infinity }; // extra water per season
const RAIN_USE = { sandy: 0.6, loam: 0.7, clay: 0.75 }; // share of season rain a crop can use
const SOIL_STORE_MM = { sandy: 60, loam: 120, clay: 160 }; // water a full root zone holds
const PLAN_COUNT = 3;
const DRY_YEAR = 0.8; // a dry year: 80% of normal rain

const clamp = n => Math.max(0, Math.min(100, Math.round(n)));

// Water a season provides (mm): useful rain + stored soil water (scaled by NASA soil wetness).
function seasonWaterMm(season, texture) {
    return season.rainMm * RAIN_USE[texture] + SOIL_STORE_MM[texture] * season.wetness;
}

// Can this crop grow in this season? Returns null, or
// { gapMm: irrigation to apply in a normal year (no more than the farmer has),
//   dryShortPct: water still missing in a dry year }.
function cropFit(name, season, { texture, ph, irrigation }) {
    const crop = CROPS[name];
    if (season.meanTempC < crop.temp[0] || season.meanTempC > crop.temp[1]) return null;
    if (season.coldNightC < 0 && !crop.frost) return null;
    if (crop.badSoil.includes(texture)) return null;
    if (Number.isFinite(ph) && (ph < crop.ph[0] || ph > crop.ph[1])) return null;
    const waterMm = seasonWaterMm(season, texture);
    const gapMm = Math.max(0, crop.waterMm - waterMm);
    // Tolerant crops can get by with up to 45% less water (sensitive ones 15%).
    const copesWithMm = 0.15 * crop.drought * crop.waterMm;
    if (gapMm - copesWithMm > IRRIGATION_MM[irrigation]) return null;
    const dryShortMm = Math.max(0, crop.waterMm - DRY_YEAR * waterMm - copesWithMm - IRRIGATION_MM[irrigation]);
    return {
        gapMm: Math.round(Math.min(gapMm, IRRIGATION_MM[irrigation])),
        dryShortPct: Math.round((dryShortMm / crop.waterMm) * 100)
    };
}

// Cash crops of the same family one after another (cover crops and fallow in between
// don't break the pest and disease cycle). Returns [[earlier, later], ...].
function familyRepeats(sequence) {
    const cash = sequence.filter(n => CROPS[n] && !CROPS[n].cover);
    const repeats = [];
    for (let i = 1; i < cash.length; i++) {
        if (CROPS[cash[i - 1]].family === CROPS[cash[i]].family) repeats.push([cash[i - 1], cash[i]]);
    }
    return repeats;
}

function soilScore(crops, lastCrop, organicMatter) {
    const lowOm = organicMatter === 'low';
    let score = 40;
    for (const name of crops) {
        if (name === FALLOW) { score -= 12; continue; } // bare soil erodes and loses carbon
        const c = CROPS[name];
        if (c.nitrogen > 0) score += 12;
        if (c.residue) score += lowOm ? 8 : 4;
        if (c.cover) score += lowOm ? 10 : 6;
        if (c.deepRoots) score += 3;
    }
    const families = new Set(crops.filter(n => n !== FALLOW).map(n => CROPS[n].family));
    score += 5 * Math.max(0, families.size - 1);
    const sequence = lastCrop ? [lastCrop, ...crops] : crops;
    for (let i = 1; i < sequence.length; i++) {
        const a = CROPS[sequence[i - 1]];
        const b = CROPS[sequence[i]];
        if (!a || !b) continue;
        // A cover crop is cut down before the next crop, so it carries over fewer pests.
        if (a.family === b.family && (a.cover || b.cover)) score -= 6;
        if (a.nitrogen < 0 && b.nitrogen < 0) score -= 8;
    }
    score -= 18 * familyRepeats(sequence).length;
    return clamp(score);
}

// How well the plan holds up in a dry or hot year. Weighs more when NASA data shows
// the area getting drier or hotter.
function resilienceScore(picks, seasons, trend) {
    const drying = (trend.rainChangePct <= -5 ? 1 : 0) + (trend.dryYearsRecent >= 3 ? 1 : 0);
    const heatWeight = trend.mainSeasonTempChangeC >= 0.5 ? 3 : 2;
    const scores = [];
    picks.forEach(({ name, dryShortPct }, i) => {
        if (name === FALLOW) { scores.push(40); return; } // no crop = no harvest to fall back on
        const c = CROPS[name];
        let s = 100 - Math.min(dryShortPct, 50) * (1 + 0.5 * drying);
        const overC = seasons[i].hotDayC - c.heatC;
        if (overC > 0) s -= Math.min(overC, 10) * heatWeight;
        scores.push(s);
    });
    return clamp(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function explain(crops, lastCrop, seasons, climate, totalIrrigationMm) {
    const reasons = [];
    const warnings = [];
    const { trend } = climate;
    const drying = trend.rainChangePct <= -5 || trend.dryYearsRecent >= 3;
    const sequence = [lastCrop, ...crops];

    const legumeIndex = crops.findIndex((n, i) => CROPS[n]?.nitrogen > 0 && CROPS[sequence[i]]?.nitrogen < 0);
    if (legumeIndex >= 0) reasons.push({ code: 'legume_after', crop: crops[legumeIndex], prev: sequence[legumeIndex] });
    const cover = crops.find(n => CROPS[n]?.cover);
    if (cover) reasons.push({ code: 'cover', crop: cover });
    const tough = crops.find(n => CROPS[n]?.drought === 3);
    if (drying && tough) reasons.push({ code: 'dry_trend', crop: tough, pct: trend.rainChangePct, dry: trend.dryYearsRecent });
    const families = new Set(crops.filter(n => n !== FALLOW).map(n => CROPS[n].family));
    if (families.size >= 3) reasons.push({ code: 'families', n: families.size });
    reasons.push({ code: 'water', mm: totalIrrigationMm });

    const hot = new Set();
    crops.forEach((name, i) => {
        const c = CROPS[name];
        if (c && !hot.has(name) && seasons[i].hotDayC - c.heatC > 3) {
            hot.add(name);
            warnings.push({ code: 'heat', crop: name, c: seasons[i].hotDayC });
        }
    });
    for (const [a, b] of familyRepeats(sequence)) warnings.push({ code: 'same_family', a, b });
    if (crops.includes(FALLOW)) warnings.push({ code: 'bare' });
    return { reasons, warnings };
}

/**
 * climate: from lib/climate.js. soil: { texture, organicMatter, ph }.
 * farm: { irrigation: none|limited|full, lastCrop, keepCrop, priorities: [...], startSeason: main|second }.
 */
function planRotations({ climate, soil, farm }) {
    const start = farm.startSeason === 'second' ? 'second' : 'main';
    const other = start === 'main' ? 'second' : 'main';
    const order = [start, other, start, other];
    const conditions = { texture: soil.texture, ph: soil.ph, irrigation: farm.irrigation };
    const lastCrop = CROPS[farm.lastCrop] ? farm.lastCrop : null;
    const keepCrop = CROPS[farm.keepCrop] ? farm.keepCrop : null; // farmer wants this crop in the plan

    // Crops that fit each season type. Leave the field empty only when nothing fits
    // (cover crops already offer "rest the land" without bare soil).
    const options = {};
    for (const type of [start, other]) {
        options[type] = [];
        for (const name of Object.keys(CROPS)) {
            const fit = cropFit(name, climate.seasons[type], conditions);
            if (fit) options[type].push({ name, ...fit });
        }
        if (!options[type].length) options[type].push({ name: FALLOW, gapMm: 0, dryShortPct: 0 });
    }

    const weights = Object.fromEntries(PRIORITIES.map(p => [p, (farm.priorities || []).includes(p) ? 3 : 1]));
    const weightSum = PRIORITIES.reduce((sum, p) => sum + weights[p], 0);
    const seasons = order.map(type => climate.seasons[type]);

    const plans = [];
    for (const a of options[order[0]]) for (const b of options[order[1]]) for (const c of options[order[2]]) for (const d of options[order[3]]) {
        const picks = [a, b, c, d];
        const crops = picks.map(p => p.name);
        // Never the same crop twice in a row (pests and diseases build up).
        const sequence = [lastCrop, ...crops];
        if (sequence.some((n, i) => i > 0 && n !== FALLOW && n === sequence[i - 1])) continue;
        if (keepCrop && !crops.includes(keepCrop)) continue;

        const irrigationMm = picks.reduce((sum, p) => sum + p.gapMm, 0);
        const scores = {
            soil: soilScore(crops, lastCrop, soil.organicMatter),
            water: clamp(100 - irrigationMm / 12),
            resilience: resilienceScore(picks, seasons, climate.trend),
            income: clamp((crops.reduce((sum, n) => sum + (CROPS[n]?.value || 0), 0) / (3 * crops.length)) * 100)
        };
        const total = Math.round(PRIORITIES.reduce((sum, p) => sum + scores[p] * weights[p], 0) / weightSum);
        plans.push({ picks, crops, irrigationMm, scores, total });
    }
    plans.sort((x, y) => y.total - x.total);

    // Keep the best plans that differ from each other in at least 2 seasons.
    const chosen = [];
    for (const plan of plans) {
        if (chosen.length === PLAN_COUNT) break;
        const different = chosen.every(c => c.crops.filter((n, i) => n !== plan.crops[i]).length >= 2);
        if (different) chosen.push(plan);
    }

    return chosen.map(plan => ({
        seasons: plan.picks.map((p, i) => ({ season: order[i], crop: p.name, irrigationMm: p.gapMm })),
        scores: plan.scores,
        total: plan.total,
        irrigationMm: plan.irrigationMm,
        ...explain(plan.crops, lastCrop, seasons, climate, plan.irrigationMm)
    }));
}

// Next season to plant: the one that starts soonest (a season that began last month still counts).
function nextSeason(climate, now = new Date()) {
    const month = now.getMonth() + 1;
    const until = startMonth => {
        const n = (startMonth - month + 12) % 12;
        return n === 11 ? -1 : n;
    };
    return until(climate.seasons.main.months[0]) <= until(climate.seasons.second.months[0]) ? 'main' : 'second';
}

module.exports = { planRotations, nextSeason, cropFit, PRIORITIES, IRRIGATION: Object.keys(IRRIGATION_MM), FALLOW };
