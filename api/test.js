/**
 * Simple test endpoint to verify Vercel Functions work
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

    try {
        // Simple test response
        const response = {
            status: 'success',
            message: 'Vercel Functions working',
            timestamp: new Date().toISOString(),
            method: req.method,
            query: req.query,
            userAgent: req.headers['user-agent'] || 'Unknown'
        };

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}