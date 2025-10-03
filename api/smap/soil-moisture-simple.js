/**
 * Simple SMAP test endpoint without NASA API calls
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon parameters are required' });
    }

    try {
        // Simple hardcoded response for testing
        const data = {
            surface_moisture: 0.35,
            temperature: 22.5,
            source: 'Vercel Functions Test Data',
            quality: 'test',
            timestamp: new Date().toISOString(),
            location: { lat: parseFloat(lat), lon: parseFloat(lon) },
            message: 'Vercel Functions working successfully'
        };

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}