const path = require('path');
const express = require('express');
const { fetchConditions, isValidLocation } = require('./lib/conditions');
const { irrigationAdvice, CROPS } = require('./lib/advice');
const { createDiagnoseHandler } = require('./lib/diagnose');

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

    app.post('/api/diagnose', createDiagnoseHandler(getClient ? { getClient } : {}));

    return app;
}

if (require.main === module) {
    const port = process.env.PORT || 3000;
    createApp().listen(port, () => console.log(`KisanAI running on http://localhost:${port}`));
}

module.exports = { createApp };
