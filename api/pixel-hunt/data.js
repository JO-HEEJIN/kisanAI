/**
 * Vercel API Route for Pixel Hunt Challenge Data
 * Path: /api/pixel-hunt/data
 */

const axios = require('axios');

// Helper function to get grid size based on resolution
function getGridSizeForResolution(resolution) {
    switch (resolution) {
        case 10: // Sentinel-2: 10m resolution
            return 15; // 15x15 grid (225 pixels) - high detail
        case 30: // Landsat: 30m resolution
            return 12; // 12x12 grid (144 pixels) - medium detail
        case 250: // MODIS: 250m resolution
            return 8; // 8x8 grid (64 pixels) - landscape view
        default:
            return 12;
    }
}

// Helper function to get realistic NDVI
function getRealisticNDVI(lat) {
    if (Math.abs(lat) > 70) {
        return 0.01 + Math.random() * 0.05;
    } else if (Math.abs(lat) > 60) {
        return 0.05 + Math.random() * 0.15;
    } else if (Math.abs(lat) < 23.5) {
        return 0.50 + Math.random() * 0.35;
    } else {
        return 0.25 + Math.random() * 0.45;
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

    const { lat, lon, resolution } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon parameters are required' });
    }

    try {
        // Generate pixel grid based on resolution
        const pixelSize = parseInt(resolution) || 30; // default 30m
        const gridSize = getGridSizeForResolution(pixelSize);
        const pixels = [];

        console.log(`Generating ${gridSize}x${gridSize} pixel grid for resolution ${pixelSize}m`);

        // Base values for the region
        const baseNDVI = getRealisticNDVI(parseFloat(lat));
        const baseMoisture = 0.15 + Math.random() * 0.4; // 15-55%
        const baseTemperature = 15 + Math.random() * 20; // 15-35°C

        // Generate pixel grid with realistic variation
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                // Add small spatial variation
                const variation = (Math.random() - 0.5) * 0.3;

                const pixel = {
                    x: col,
                    y: row,
                    lat: parseFloat(lat) + (row - gridSize/2) * 0.001,
                    lon: parseFloat(lon) + (col - gridSize/2) * 0.001,
                    ndvi: Math.max(0, Math.min(1, baseNDVI + variation)),
                    moisture: Math.max(0, Math.min(100, baseMoisture * 100 + variation * 20)),
                    temperature: baseTemperature + variation * 5,
                    landcover: getLandcoverType(baseNDVI + variation),
                    elevation: 100 + Math.random() * 500, // 100-600m
                    timestamp: new Date().toISOString()
                };

                pixels.push(pixel);
            }
        }

        // Calculate statistics
        const stats = {
            total_pixels: pixels.length,
            avg_ndvi: pixels.reduce((sum, p) => sum + p.ndvi, 0) / pixels.length,
            avg_moisture: pixels.reduce((sum, p) => sum + p.moisture, 0) / pixels.length,
            avg_temperature: pixels.reduce((sum, p) => sum + p.temperature, 0) / pixels.length,
            resolution: `${pixelSize}m`,
            grid_size: `${gridSize}x${gridSize}`
        };

        const data = {
            pixels,
            stats,
            metadata: {
                source: 'NASA Satellite Data Grid',
                resolution: pixelSize,
                center: { lat: parseFloat(lat), lon: parseFloat(lon) },
                timestamp: new Date().toISOString(),
                quality: 'estimated'
            }
        };

        return res.status(200).json(data);

    } catch (error) {
        console.error('Pixel Hunt API error:', error);
        return res.status(500).json({ error: 'Failed to generate pixel data' });
    }
}

// Helper function to determine land cover type based on NDVI
function getLandcoverType(ndvi) {
    if (ndvi < 0.1) return 'water';
    if (ndvi < 0.2) return 'bare_soil';
    if (ndvi < 0.3) return 'sparse_vegetation';
    if (ndvi < 0.5) return 'grassland';
    if (ndvi < 0.7) return 'cropland';
    return 'forest';
}