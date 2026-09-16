/**
 * Vercel API Route for NASA SMAP Soil Moisture Data
 * Path: /api/smap/soil-moisture
 */

// Use native fetch (available in Vercel runtime)

// NASA Earthdata credentials (server-side environment only)
const NASA_CONFIG = {
    username: process.env.NASA_USERNAME,
    password: process.env.NASA_PASSWORD,
    token: process.env.NASA_TOKEN
};

// Helper function to get auth headers
function getAuthHeaders(userToken = null) {
    const token = userToken || NASA_CONFIG.token;
    const headers = {
        'User-Agent': 'TerraData Farm Navigator v1.0',
        'Accept': 'application/json'
    };
    // Without a token the request is sent unauthenticated; auth failures use the existing fallback path
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Helper function to get realistic temperature based on latitude
function getRealisticTemperature(lat) {
    if (Math.abs(lat) > 70) {
        return -20 + Math.random() * 30; // Arctic
    } else if (Math.abs(lat) > 60) {
        return -10 + Math.random() * 25; // Sub-polar
    } else if (Math.abs(lat) < 23.5) {
        return 20 + Math.random() * 15; // Tropical
    } else {
        return 5 + Math.random() * 25; // Temperate
    }
}

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

    const { lat, lon, date } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon parameters are required' });
    }

    try {
        // Extract user token from Authorization header
        const userToken = req.headers.authorization?.replace('Bearer ', '');

        console.log(`🛰️ Fetching SMAP data for lat=${lat}, lon=${lon}`);

        // TODO: Retrieve and validate actual SMAP soil moisture measurements from the
        // matched granule. Only CMR granule metadata is queried below; every
        // surface_moisture and temperature value returned by this route is simulated.
        let realData = null;
        try {
            const earthdataUrl = `https://cmr.earthdata.nasa.gov/search/granules.json`;

            const endDate = '2024-12-31';
            const startDate = '2023-01-01';

            // Use verified collection IDs
            const collectionIds = [
                'C2776463943-NSIDC_ECS', // SPL3SMP_E
                'C3383993430-NSIDC_ECS', // SPL4SMGP
                'C2776463773-NSIDC_ECS'  // SPL2SMP_E
            ];

            for (const collectionId of collectionIds) {
                const params = new URLSearchParams({
                    collection_concept_id: collectionId,
                    temporal: `${startDate}T00:00:00Z,${endDate}T23:59:59Z`,
                    bounding_box: `${parseFloat(lon)-10},${parseFloat(lat)-10},${parseFloat(lon)+10},${parseFloat(lat)+10}`,
                    page_size: 5,
                    sort_key: '-start_date'
                });

                // Create abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000);

                const earthdataResponse = await fetch(`${earthdataUrl}?${params}`, {
                    headers: getAuthHeaders(userToken),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!earthdataResponse.ok) {
                    throw new Error(`EarthData API error: ${earthdataResponse.status}`);
                }

                const earthdataData = await earthdataResponse.json();

                if (earthdataData?.feed?.entry?.length > 0) {
                    const entry = earthdataData.feed.entry[0];

                    realData = {
                        surface_moisture: 0.15 + Math.random() * 0.25,
                        source: `Simulated values; NASA CMR SMAP granule metadata matched (Collection: ${collectionId}), measurements not retrieved`,
                        granule_id: entry.id,
                        granule_title: entry.title,
                        collection_used: collectionId
                    };
                    break;
                }
            }
        } catch (earthdataError) {
            console.error('EarthData API failed:', earthdataError.message);
        }

        // Prepare response data
        let data;
        if (realData) {
            data = {
                surface_moisture: realData.surface_moisture,
                temperature: getRealisticTemperature(parseFloat(lat)),
                source: realData.source,
                quality: 'simulated',
                timestamp: new Date().toISOString(),
                granule_id: realData.granule_id,
                collection: realData.collection_used,
                location: { lat: parseFloat(lat), lon: parseFloat(lon) }
            };
        } else {
            // Fallback data
            data = {
                surface_moisture: Math.random() * 0.6 + 0.1,
                temperature: getRealisticTemperature(parseFloat(lat)),
                source: 'Simulated fallback values; no NASA SMAP granule metadata matched',
                quality: 'simulated',
                timestamp: new Date().toISOString(),
                location: { lat: parseFloat(lat), lon: parseFloat(lon) }
            };
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('SMAP API error:', error);

        // Return fallback data on error
        const fallbackData = {
            surface_moisture: Math.random() * 0.6 + 0.1,
            temperature: getRealisticTemperature(parseFloat(lat)),
            source: 'Simulated fallback values (error); no NASA SMAP measurements retrieved',
            quality: 'simulated',
            timestamp: new Date().toISOString(),
            location: { lat: parseFloat(lat), lon: parseFloat(lon) },
            error: 'API temporarily unavailable'
        };

        return res.status(200).json(fallbackData);
    }
}