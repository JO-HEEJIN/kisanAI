const path = require('path');
const express = require('express');
const { fetchConditions, isValidLocation } = require('./lib/conditions');
const { irrigationAdvice, CROPS } = require('./lib/advice');
const { createDiagnoseHandler } = require('./lib/diagnose');
const { fetchClimate } = require('./lib/climate');
const { fetchSoil } = require('./lib/soil');
const { planRotations, nextSeason, PRIORITIES, IRRIGATION } = require('./lib/rotation');
const { CROPS: ROTATION_CROPS } = require('./lib/crops');

const TEXTURES = ['sandy', 'loam', 'clay'];
const ORGANIC_MATTER = ['low', 'medium', 'high'];
const CLIMATE_CACHE_MAX = 500;

function createApp({ fetchFn = fetch, getClient } = {}) {
    const app = express();
    app.use(express.json({ limit: '6mb' })); // base64 of a 4 MB image
    app.use(express.static(path.join(__dirname, 'public')));

    // GET /api/advice?lat=28.6&lon=77.2&crop=wheat
    app.get('/api/advice', async (req, res) => {
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);
        const crop = req.query.crop;
        if (!isValidLocation(lat, lon)) {
            return res.status(400).json({ error: 'lat and lon must be valid coordinates' });
        }
        if (!CROPS[crop]) {
            return res.status(400).json({ error: `crop must be one of: ${Object.keys(CROPS).join(', ')}` });
        }
        try {
            const conditions = await fetchConditions(lat, lon, { fetchFn });
            res.json({ conditions, advice: irrigationAdvice({ ...conditions, crop }) });
        } catch (error) {
            console.error('Conditions failed:', error.message);
            res.status(502).json({ error: 'Could not get field data right now' });
        }
    });

    // NASA POWER history doesn't change during the day; cache it per ~10 km cell.
    const climateCache = new Map();
    async function climateFor(lat, lon) {
        const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
        if (!climateCache.has(key)) {
            if (climateCache.size >= CLIMATE_CACHE_MAX) climateCache.clear();
            const promise = fetchClimate(lat, lon, { fetchFn });
            climateCache.set(key, promise);
            promise.catch(() => climateCache.delete(key)); // don't keep failures
        }
        return climateCache.get(key);
    }

    // GET /api/rotation?lat=28.6&lon=77.2&irrigation=limited&soil=loam&om=low&ph=7.2
    //     &lastCrop=rice&keepCrop=wheat&priorities=soil,water
    // soil, om and ph are optional: if soil or om is missing, the SoilGrids map fills them in.
    app.get('/api/rotation', async (req, res) => {
        const q = req.query;
        const lat = Number(q.lat);
        const lon = Number(q.lon);
        const ph = q.ph === undefined || q.ph === '' ? null : Number(q.ph);
        const priorities = q.priorities ? String(q.priorities).split(',') : [];
        const errors = [];
        if (!isValidLocation(lat, lon)) errors.push('lat and lon must be valid coordinates');
        if (!IRRIGATION.includes(q.irrigation)) errors.push(`irrigation must be one of: ${IRRIGATION.join(', ')}`);
        if (q.soil && !TEXTURES.includes(q.soil)) errors.push(`soil must be one of: ${TEXTURES.join(', ')}`);
        if (q.om && !ORGANIC_MATTER.includes(q.om)) errors.push(`om must be one of: ${ORGANIC_MATTER.join(', ')}`);
        if (ph !== null && !(ph >= 3 && ph <= 10)) errors.push('ph must be between 3 and 10');
        for (const key of ['lastCrop', 'keepCrop']) {
            if (q[key] && !ROTATION_CROPS[q[key]]) errors.push(`${key} must be one of: ${Object.keys(ROTATION_CROPS).join(', ')}`);
        }
        if (!priorities.every(p => PRIORITIES.includes(p))) errors.push(`priorities must be from: ${PRIORITIES.join(', ')}`);
        if (errors.length) return res.status(400).json({ error: errors.join('; ') });

        let climate;
        try {
            climate = await climateFor(lat, lon);
        } catch (error) {
            console.error('NASA POWER failed:', error.message);
            return res.status(502).json({ error: 'Could not get NASA climate data right now' });
        }

        // The farmer's answers win; the soil map fills the gaps (pH is optional, so it alone doesn't trigger a lookup).
        const needsMap = !q.soil || !q.om;
        const map = needsMap ? await fetchSoil(lat, lon, { fetchFn }) : null;
        const soil = {
            texture: q.soil || map?.texture || 'loam',
            organicMatter: q.om || map?.organicMatter || 'medium',
            ph: ph ?? map?.ph ?? null,
            source: !needsMap ? 'farmer' : map ? 'soilgrids' : 'default'
        };

        const startSeason = nextSeason(climate);
        const plans = planRotations({
            climate,
            soil,
            farm: { irrigation: q.irrigation, lastCrop: q.lastCrop, keepCrop: q.keepCrop, priorities, startSeason }
        });
        res.json({ climate, soil, startSeason, plans });
    });

    app.post('/api/diagnose', createDiagnoseHandler(getClient ? { getClient } : {}));

    return app;
}

if (require.main === module) {
    const port = process.env.PORT || 3000;
    createApp().listen(port, () => console.log(`KisanAI running on http://localhost:${port}`));
}

module.exports = { createApp };
