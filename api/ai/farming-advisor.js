/**
 * Vercel API Route for AI Farming Advisor
 * Path: /api/ai/farming-advisor
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
            message,
            context = {},
            language = 'en',
            farmData
        } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'message is required' });
        }

        console.log(`🤖 AI Farming Advisor query: "${message}"`);

        // Generate AI response
        const response = await generateFarmingAdvice({
            message,
            context,
            language,
            farmData
        });

        return res.status(200).json(response);

    } catch (error) {
        console.error('AI Farming Advisor error:', error);
        return res.status(500).json({ error: 'AI advisor failed' });
    }
}

async function generateFarmingAdvice({ message, context, language, farmData }) {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Analyze the message to determine intent
    const intent = classifyIntent(message);
    const entities = extractEntities(message);

    // Generate contextual response based on intent and available data
    const response = await generateResponse({
        intent,
        entities,
        message,
        context,
        farmData
    });

    return {
        response: response.text,
        intent: intent,
        entities: entities,
        confidence: response.confidence,
        suggestions: response.suggestions,
        actions: response.actions,
        metadata: {
            model: 'FarmGPT v3.0',
            language: language,
            processing_time: '1.0s',
            timestamp: new Date().toISOString()
        }
    };
}

function classifyIntent(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('water') || lowerMessage.includes('irrigat') || lowerMessage.includes('dry')) {
        return 'irrigation_advice';
    }
    if (lowerMessage.includes('fertil') || lowerMessage.includes('nutrient') || lowerMessage.includes('nitrogen')) {
        return 'fertilization_advice';
    }
    if (lowerMessage.includes('pest') || lowerMessage.includes('insect') || lowerMessage.includes('disease')) {
        return 'pest_management';
    }
    if (lowerMessage.includes('harvest') || lowerMessage.includes('yield') || lowerMessage.includes('crop')) {
        return 'harvest_advice';
    }
    if (lowerMessage.includes('plant') || lowerMessage.includes('seed') || lowerMessage.includes('sow')) {
        return 'planting_advice';
    }
    if (lowerMessage.includes('soil') || lowerMessage.includes('ground')) {
        return 'soil_management';
    }
    if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('temperature')) {
        return 'weather_advice';
    }

    return 'general_farming';
}

function extractEntities(message) {
    const entities = [];
    const lowerMessage = message.toLowerCase();

    // Extract crops
    const crops = ['wheat', 'corn', 'rice', 'soybean', 'tomato', 'potato', 'lettuce', 'carrot'];
    crops.forEach(crop => {
        if (lowerMessage.includes(crop)) {
            entities.push({ type: 'crop', value: crop });
        }
    });

    // Extract problems
    const problems = ['drought', 'flood', 'pest', 'disease', 'yellowing', 'wilting', 'spots'];
    problems.forEach(problem => {
        if (lowerMessage.includes(problem)) {
            entities.push({ type: 'problem', value: problem });
        }
    });

    // Extract numbers (for quantities, percentages)
    const numbers = lowerMessage.match(/\d+/g);
    if (numbers) {
        numbers.forEach(num => {
            entities.push({ type: 'quantity', value: parseInt(num) });
        });
    }

    return entities;
}

async function generateResponse({ intent, entities, message, context, farmData }) {
    const crop = entities.find(e => e.type === 'crop')?.value || 'crops';
    const problem = entities.find(e => e.type === 'problem')?.value;

    let response = {};

    switch (intent) {
        case 'irrigation_advice':
            response = generateIrrigationAdvice(farmData, crop);
            break;
        case 'fertilization_advice':
            response = generateFertilizationAdvice(farmData, crop);
            break;
        case 'pest_management':
            response = generatePestManagementAdvice(problem, crop);
            break;
        case 'harvest_advice':
            response = generateHarvestAdvice(farmData, crop);
            break;
        case 'planting_advice':
            response = generatePlantingAdvice(farmData, crop);
            break;
        case 'soil_management':
            response = generateSoilManagementAdvice(farmData);
            break;
        case 'weather_advice':
            response = generateWeatherAdvice(farmData);
            break;
        default:
            response = generateGeneralAdvice(message, farmData);
    }

    return response;
}

function generateIrrigationAdvice(farmData, crop) {
    const moisture = farmData?.soilMoisture || Math.random() * 60 + 20;

    let text, suggestions, actions;

    if (moisture < 25) {
        text = `Your ${crop} fields urgently need irrigation! Soil moisture is at ${Math.round(moisture)}%, which is critically low. Immediate watering is required to prevent stress and yield loss.`;
        suggestions = [
            'Apply 25-30mm of water immediately',
            'Check irrigation system for proper coverage',
            'Consider drip irrigation for water efficiency'
        ];
        actions = ['irrigation_urgent', 'check_system'];
    } else if (moisture < 40) {
        text = `Your ${crop} could benefit from irrigation soon. Current soil moisture is ${Math.round(moisture)}%, which is below optimal. Plan irrigation in the next 2-3 days.`;
        suggestions = [
            'Schedule irrigation within 3 days',
            'Monitor weather forecast for rain',
            'Apply 15-20mm of water when irrigating'
        ];
        actions = ['irrigation_planned', 'weather_check'];
    } else {
        text = `Your ${crop} irrigation levels look good! Soil moisture is at ${Math.round(moisture)}%, which is in the optimal range. Continue monitoring and maintain current schedule.`;
        suggestions = [
            'Continue current irrigation schedule',
            'Monitor for any dry spots in fields',
            'Prepare for seasonal changes'
        ];
        actions = ['maintain_schedule'];
    }

    return {
        text,
        confidence: 0.92,
        suggestions,
        actions
    };
}

function generateFertilizationAdvice(farmData, crop) {
    const ndvi = farmData?.ndvi || Math.random() * 0.6 + 0.2;

    let text, suggestions, actions;

    if (ndvi < 0.3) {
        text = `Your ${crop} shows signs of nutrient deficiency. NDVI reading of ${ndvi.toFixed(2)} indicates poor vegetation health. Nitrogen fertilization is recommended.`;
        suggestions = [
            'Apply nitrogen-rich fertilizer (100-120 kg/ha)',
            'Test soil for specific nutrient deficiencies',
            'Consider foliar feeding for quick response'
        ];
        actions = ['fertilize_nitrogen', 'soil_test'];
    } else if (ndvi < 0.5) {
        text = `Your ${crop} vegetation health is moderate. NDVI of ${ndvi.toFixed(2)} suggests some nutrient supplementation could improve growth.`;
        suggestions = [
            'Apply balanced NPK fertilizer',
            'Monitor plant color and growth',
            'Consider organic amendments'
        ];
        actions = ['fertilize_balanced'];
    } else {
        text = `Excellent vegetation health! Your ${crop} shows strong NDVI of ${ndvi.toFixed(2)}, indicating good nutrient levels. Continue current fertilization program.`;
        suggestions = [
            'Maintain current fertilization schedule',
            'Monitor for any changing conditions',
            'Consider micro-nutrient supplements if needed'
        ];
        actions = ['maintain_program'];
    }

    return {
        text,
        confidence: 0.89,
        suggestions,
        actions
    };
}

function generatePestManagementAdvice(problem, crop) {
    const pestSolutions = {
        pest: `For pest control in your ${crop}, I recommend integrated pest management (IPM). Monitor regularly for early detection and use targeted treatments.`,
        disease: `Disease management in ${crop} requires prevention and early intervention. Ensure good air circulation and avoid overhead watering.`,
        yellowing: `Yellowing in ${crop} could indicate nutrient deficiency, overwatering, or disease. Check soil drainage and nutrient levels.`,
        spots: `Leaf spots on ${crop} often indicate fungal infection. Remove affected leaves and apply appropriate fungicide if needed.`
    };

    const text = pestSolutions[problem] || `For ${crop} health issues, start with proper cultural practices: adequate spacing, proper watering, and soil health maintenance.`;

    return {
        text,
        confidence: 0.85,
        suggestions: [
            'Monitor fields regularly for early detection',
            'Use biological controls when possible',
            'Apply treatments only when necessary',
            'Keep detailed records of pest issues'
        ],
        actions: ['monitor_pests', 'apply_ipm']
    };
}

function generateHarvestAdvice(farmData, crop) {
    const text = `For optimal ${crop} harvest, timing is crucial. Monitor maturity indicators and weather conditions. Harvest during dry conditions when possible for best quality.`;

    return {
        text,
        confidence: 0.87,
        suggestions: [
            'Check crop maturity indicators daily',
            'Plan harvest equipment availability',
            'Monitor weather forecast for dry periods',
            'Prepare storage facilities'
        ],
        actions: ['monitor_maturity', 'prepare_harvest']
    };
}

function generatePlantingAdvice(farmData, crop) {
    const text = `For successful ${crop} planting, consider soil temperature, moisture, and weather forecast. Optimal soil conditions ensure good germination and establishment.`;

    return {
        text,
        confidence: 0.90,
        suggestions: [
            'Check soil temperature (optimal: 10-15°C for cool crops, 15-20°C for warm crops)',
            'Ensure adequate soil moisture for germination',
            'Choose appropriate varieties for your region',
            'Plan planting dates based on frost risk'
        ],
        actions: ['check_soil_temp', 'plan_planting']
    };
}

function generateSoilManagementAdvice(farmData) {
    const text = `Healthy soil is the foundation of successful farming. Focus on organic matter, proper pH, and good drainage for optimal crop production.`;

    return {
        text,
        confidence: 0.88,
        suggestions: [
            'Test soil pH and adjust if needed (6.0-7.0 for most crops)',
            'Add organic matter through compost or cover crops',
            'Ensure proper drainage to prevent waterlogging',
            'Practice crop rotation to maintain soil health'
        ],
        actions: ['soil_test', 'add_organic_matter']
    };
}

function generateWeatherAdvice(farmData) {
    const text = `Weather monitoring is essential for farm management. Use satellite data and local forecasts to make informed decisions about irrigation, harvesting, and protection measures.`;

    return {
        text,
        confidence: 0.86,
        suggestions: [
            'Check weather forecast daily',
            'Monitor soil moisture with satellite data',
            'Prepare for extreme weather events',
            'Adjust farming activities based on conditions'
        ],
        actions: ['monitor_weather', 'prepare_protection']
    };
}

function generateGeneralAdvice(message, farmData) {
    const text = `Thank you for your question about farming. Based on current conditions and best practices, I recommend focusing on soil health, proper irrigation, and regular monitoring for the best results.`;

    return {
        text,
        confidence: 0.75,
        suggestions: [
            'Monitor your fields regularly',
            'Maintain good soil health',
            'Use satellite data for decision making',
            'Keep detailed farm records'
        ],
        actions: ['general_monitoring']
    };
}