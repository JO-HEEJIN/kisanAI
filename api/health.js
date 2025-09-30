/**
 * Vercel API Route for Health Check
 * Path: /api/health
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const healthData = {
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'NASA Farm Navigator API',
        endpoints: [
            'GET /api/smap/soil-moisture?lat={lat}&lon={lon}&date={date}',
            'GET /api/modis/ndvi?lat={lat}&lon={lon}&date={date}',
            'GET /api/landsat/imagery?lat={lat}&lon={lon}&date={date}',
            'GET /api/pixel-hunt/data?lat={lat}&lon={lon}&resolution={resolution}',
            'POST /api/ai/soil-analysis',
            'POST /api/ai/farming-advisor',
            'POST /api/ai/predictions',
            'GET /api/health'
        ],
        platform: 'Vercel Serverless Functions',
        documentation: 'NASA satellite data API for TerraData Farm Navigator'
    };

    return res.status(200).json(healthData);
}