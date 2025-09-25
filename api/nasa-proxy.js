// Vercel Serverless Function for NASA API Proxy

// Helper function to get simulated data
function getSimulatedData(type, lat, lon) {
    const baseData = {
        lat,
        lon,
        timestamp: new Date().toISOString(),
        source: 'Simulated Data (Fallback)',
        quality: 'simulated'
    };

    switch(type) {
        case 'soil-moisture':
            return {
                ...baseData,
                soilMoisture: 0.25 + Math.random() * 0.3,
                depth: '0-5cm',
                unit: 'volumetric water content'
            };
        case 'ndvi':
            return {
                ...baseData,
                ndvi: 0.3 + Math.random() * 0.5,
                cloudCoverage: Math.random() * 0.3,
                quality: 'good'
            };
        case 'temperature':
            return {
                ...baseData,
                temperature: 15 + Math.random() * 20,
                humidity: 40 + Math.random() * 40,
                unit: 'celsius'
            };
        case 'precipitation':
            return {
                ...baseData,
                precipitation: Math.random() * 10,
                accumulated_3hr: Math.random() * 30,
                unit: 'mm'
            };
        default:
            return baseData;
    }
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { query } = req;
    const path = req.url.replace('/api/', '');

    // Parse the path to determine data type
    let dataType = 'unknown';
    if (path.includes('smap/soil-moisture')) dataType = 'soil-moisture';
    else if (path.includes('modis/ndvi')) dataType = 'ndvi';
    else if (path.includes('ecostress/temperature')) dataType = 'temperature';
    else if (path.includes('gpm/precipitation')) dataType = 'precipitation';

    const { lat = 33.4255, lon = -111.9400 } = query;

    try {
        // For now, return simulated data
        // In production, you would make actual NASA API calls here
        const data = getSimulatedData(dataType, parseFloat(lat), parseFloat(lon));

        return res.status(200).json({
            success: true,
            data,
            message: 'Data retrieved successfully'
        });
    } catch (error) {
        console.error('NASA API Error:', error);

        // Fallback to simulated data on error
        const fallbackData = getSimulatedData(dataType, parseFloat(lat), parseFloat(lon));

        return res.status(200).json({
            success: true,
            data: fallbackData,
            message: 'Using fallback simulated data',
            error: error.message
        });
    }
};