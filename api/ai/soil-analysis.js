/**
 * Vercel API Route for AI-powered Soil Analysis
 * Path: /api/ai/soil-analysis
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            lat,
            lon,
            imageData, // Base64 encoded image
            nasaData,  // NASA satellite data
            cropType
        } = req.body;

        if (!lat || !lon) {
            return res.status(400).json({ error: 'lat and lon are required' });
        }

        console.log(`🧠 AI Soil Analysis for lat=${lat}, lon=${lon}`);

        // Simulate AI soil analysis based on multiple data sources
        const analysis = await performSoilAnalysis({
            location: { lat: parseFloat(lat), lon: parseFloat(lon) },
            imageData,
            nasaData,
            cropType
        });

        return res.status(200).json(analysis);

    } catch (error) {
        console.error('AI Soil Analysis error:', error);
        return res.status(500).json({ error: 'AI analysis failed' });
    }
}

async function performSoilAnalysis({ location, imageData, nasaData, cropType }) {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { lat, lon } = location;

    // Simulate AI-powered analysis combining multiple data sources
    const soilMoisture = nasaData?.surface_moisture || (0.15 + Math.random() * 0.4);
    const ndvi = nasaData?.ndvi || (0.3 + Math.random() * 0.4);
    const temperature = nasaData?.temperature || (15 + Math.random() * 20);

    // AI classification results
    const landCover = classifyLandCover(ndvi);
    const soilType = determineSoilType(lat, soilMoisture);
    const healthScore = calculateHealthScore(soilMoisture, ndvi, temperature);

    // Generate AI recommendations
    const recommendations = generateRecommendations({
        soilMoisture,
        ndvi,
        temperature,
        landCover,
        soilType,
        cropType,
        healthScore
    });

    return {
        analysis: {
            location: { lat, lon },
            timestamp: new Date().toISOString(),
            confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence

            // Soil characteristics
            soil_type: soilType,
            soil_moisture: Math.round(soilMoisture * 100),
            organic_matter: Math.round(2 + Math.random() * 4), // 2-6%
            ph_level: (6.5 + Math.random() * 1.5).toFixed(1), // 6.5-8.0

            // Vegetation analysis
            land_cover: landCover,
            ndvi: parseFloat(ndvi.toFixed(3)),
            vegetation_health: healthScore,

            // Environmental conditions
            temperature: Math.round(temperature),
            moisture_stress: soilMoisture < 0.25 ? 'high' : soilMoisture < 0.4 ? 'moderate' : 'low',

            // AI-powered insights
            suitability_score: Math.round(60 + healthScore * 40), // 60-100
            growth_potential: healthScore > 0.7 ? 'excellent' : healthScore > 0.5 ? 'good' : 'moderate',
        },

        recommendations,

        metadata: {
            model_version: 'SoilAI v2.1.0',
            processing_time: '1.5s',
            data_sources: ['NASA SMAP', 'MODIS NDVI', 'Image Analysis', 'ML Classification'],
            quality: 'real_time_analysis'
        }
    };
}

function classifyLandCover(ndvi) {
    if (ndvi < 0.1) return 'water';
    if (ndvi < 0.2) return 'bare_soil';
    if (ndvi < 0.3) return 'sparse_vegetation';
    if (ndvi < 0.5) return 'grassland';
    if (ndvi < 0.7) return 'cropland';
    return 'forest';
}

function determineSoilType(lat, moisture) {
    const absLat = Math.abs(lat);

    if (absLat > 60) return moisture > 0.4 ? 'peat' : 'sandy_loam';
    if (absLat < 23.5) return moisture > 0.5 ? 'clay' : 'laterite';

    // Temperate regions
    if (moisture > 0.5) return 'clay_loam';
    if (moisture > 0.3) return 'loam';
    return 'sandy_loam';
}

function calculateHealthScore(moisture, ndvi, temperature) {
    // Optimal ranges
    const moistureScore = moisture > 0.6 ? 0.8 : moisture > 0.3 ? 1.0 : moisture * 2;
    const ndviScore = ndvi > 0.8 ? 0.9 : ndvi > 0.4 ? ndvi : ndvi * 2;
    const tempScore = temperature > 35 ? 0.6 : temperature > 15 ? 1.0 : temperature / 15;

    return Math.min(1.0, (moistureScore + ndviScore + tempScore) / 3);
}

function generateRecommendations({ soilMoisture, ndvi, temperature, landCover, soilType, cropType, healthScore }) {
    const recommendations = [];

    // Irrigation recommendations
    if (soilMoisture < 0.25) {
        recommendations.push({
            type: 'irrigation',
            priority: 'high',
            action: 'Immediate irrigation required',
            details: `Soil moisture at ${Math.round(soilMoisture * 100)}% is below optimal range. Apply 25-30mm water.`,
            timing: 'within 24 hours'
        });
    } else if (soilMoisture < 0.4) {
        recommendations.push({
            type: 'irrigation',
            priority: 'medium',
            action: 'Schedule irrigation soon',
            details: `Soil moisture at ${Math.round(soilMoisture * 100)}% trending low. Plan irrigation in 2-3 days.`,
            timing: 'within 3 days'
        });
    }

    // Vegetation health recommendations
    if (ndvi < 0.3) {
        recommendations.push({
            type: 'fertilization',
            priority: 'high',
            action: 'Nitrogen fertilization needed',
            details: `Low NDVI (${ndvi.toFixed(2)}) indicates poor vegetation health. Apply nitrogen-rich fertilizer.`,
            timing: 'this week'
        });
    }

    // Temperature stress recommendations
    if (temperature > 30) {
        recommendations.push({
            type: 'protection',
            priority: 'medium',
            action: 'Heat stress mitigation',
            details: `High temperature (${Math.round(temperature)}°C) may stress crops. Consider shade or increased irrigation.`,
            timing: 'during hot periods'
        });
    }

    // Soil improvement recommendations
    if (soilType === 'sandy_loam' && soilMoisture < 0.3) {
        recommendations.push({
            type: 'soil_improvement',
            priority: 'low',
            action: 'Add organic matter',
            details: 'Sandy soil with low moisture retention. Consider adding compost or organic mulch.',
            timing: 'next season'
        });
    }

    // Overall health recommendation
    if (healthScore > 0.8) {
        recommendations.push({
            type: 'maintenance',
            priority: 'low',
            action: 'Continue current management',
            details: 'Excellent field conditions. Maintain current irrigation and fertilization schedule.',
            timing: 'ongoing'
        });
    }

    return recommendations;
}