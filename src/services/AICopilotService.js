/**
 * AI Copilot Service for Natural Language Farm Search
 * Enables queries like "Find farmland under $3k/acre with low drought risk"
 */

class AICopilotService {
    constructor() {
        this.apiEndpoint = 'http://localhost:3001/api/ai-query';
        this.isInitialized = false;
        this.conversationHistory = [];
        this.farmlandDatabase = null;
        this.currentLocation = null;
        this.locationEnabled = false;
        this.initialize();
    }

    /**
     * Initialize the AI Copilot service
     */
    async initialize() {
        try {
            // Load sample farmland database
            this.farmlandDatabase = await this.loadFarmlandData();

            // Start location request in background (non-blocking)
            this.requestLocationPermission().catch(error => {
                console.warn('GPS location failed, continuing without:', error);
            });

            this.isInitialized = true;
            console.log('🤖 AI Copilot Service initialized successfully (location loading in background)');
        } catch (error) {
            console.error('Failed to initialize AI Copilot:', error);
        }
    }

    /**
     * Load farmland database (mock data for demo)
     */
    async loadFarmlandData() {
        // In a real implementation, this would connect to actual farmland databases
        return [
            {
                id: 1,
                name: "Johnson Family Farm",
                location: "Story County, IA",
                coordinates: [-93.6250, 41.5868],
                acres: 320,
                pricePerAcre: 3750,
                totalPrice: 1200000,
                droughtRisk: "Low",
                soilQuality: 85,
                waterRights: true,
                organic: true,
                cropTypes: ["corn", "soybeans"],
                ndvi: 0.68,
                soilMoisture: 72,
                precipitation: 32,
                roi: 14.5,
                county: "Story",
                state: "Iowa"
            },
            {
                id: 2,
                name: "Prairie Vista Ranch",
                location: "Polk County, IA",
                coordinates: [-93.7751, 41.6005],
                acres: 480,
                pricePerAcre: 2800,
                totalPrice: 1344000,
                droughtRisk: "Medium",
                soilQuality: 78,
                waterRights: false,
                organic: false,
                cropTypes: ["corn", "wheat"],
                ndvi: 0.61,
                soilMoisture: 65,
                precipitation: 28,
                roi: 12.3,
                county: "Polk",
                state: "Iowa"
            },
            {
                id: 3,
                name: "Golden Acres Farm",
                location: "Warren County, IA",
                coordinates: [-93.4623, 41.4818],
                acres: 160,
                pricePerAcre: 4200,
                totalPrice: 672000,
                droughtRisk: "Low",
                soilQuality: 92,
                waterRights: true,
                organic: true,
                cropTypes: ["soybeans", "corn"],
                ndvi: 0.74,
                soilMoisture: 78,
                precipitation: 35,
                roi: 16.8,
                county: "Warren",
                state: "Iowa"
            },
            {
                id: 4,
                name: "Riverside Agricultural Land",
                location: "Madison County, IA",
                coordinates: [-93.8042, 41.3373],
                acres: 640,
                pricePerAcre: 2500,
                totalPrice: 1600000,
                droughtRisk: "High",
                soilQuality: 68,
                waterRights: false,
                organic: false,
                cropTypes: ["corn", "hay"],
                ndvi: 0.52,
                soilMoisture: 58,
                precipitation: 22,
                roi: 8.9,
                county: "Madison",
                state: "Iowa"
            }
        ];
    }

    /**
     * Process natural language query and return relevant farmland
     * @param {string} query - Natural language query from user
     * @returns {Promise<Object>} Search results with explanation
     */
    async processQuery(query) {
        try {
            console.log(`🤖 Processing AI query: "${query}"`);

            // Add to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: query,
                timestamp: new Date()
            });

            // Check if it's an agricultural/farming question
            const lowerQuery = query.toLowerCase();
            if (this.isAgriculturalQuery(lowerQuery)) {
                return await this.processAgriculturalQuery(query);
            }

            // Otherwise process as farmland search query
            const filters = this.parseNaturalLanguage(query);
            const results = this.filterFarmland(filters);
            const explanation = this.generateExplanation(query, results, filters);

            const response = {
                query: query,
                parsedFilters: filters,
                results: results,
                explanation: explanation,
                totalResults: results.length,
                averagePrice: this.calculateAveragePrice(results),
                bestMatch: results.length > 0 ? results[0] : null,
                suggestions: this.generateSuggestions(results, filters)
            };

            // Add response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: response,
                timestamp: new Date()
            });

            return response;

        } catch (error) {
            console.error('Error processing AI query:', error);
            return {
                query: query,
                error: 'Sorry, I encountered an error processing your request. Please try rephrasing your query.',
                results: [],
                totalResults: 0
            };
        }
    }

    /**
     * Parse natural language into search filters
     * @param {string} query - Natural language query
     * @returns {Object} Parsed filters
     */
    parseNaturalLanguage(query) {
        const filters = {};
        const queryLower = query.toLowerCase();

        // Price filters
        const priceMatch = queryLower.match(/under \$?([0-9,]+)(?:\s*(?:per acre|\/acre))?/i);
        if (priceMatch) {
            filters.maxPricePerAcre = parseInt(priceMatch[1].replace(/,/g, ''));
        }

        const minPriceMatch = queryLower.match(/over \$?([0-9,]+)(?:\s*(?:per acre|\/acre))?/i);
        if (minPriceMatch) {
            filters.minPricePerAcre = parseInt(minPriceMatch[1].replace(/,/g, ''));
        }

        // Acres filters
        const acresMatch = queryLower.match(/(\d+)\+?\s*acres?/i);
        if (acresMatch) {
            filters.minAcres = parseInt(acresMatch[1]);
        }

        // Drought risk
        if (queryLower.includes('low drought risk') || queryLower.includes('drought resistant')) {
            filters.droughtRisk = 'Low';
        }
        if (queryLower.includes('high drought risk')) {
            filters.droughtRisk = 'High';
        }

        // Water rights
        if (queryLower.includes('water rights')) {
            filters.waterRights = true;
        }

        // Organic
        if (queryLower.includes('organic')) {
            filters.organic = true;
        }

        // Location
        const stateMatch = queryLower.match(/in\s+(iowa|california|kansas|nebraska|illinois)/i);
        if (stateMatch) {
            filters.state = stateMatch[1];
        }

        const countyMatch = queryLower.match(/(story|polk|warren|madison)\s+county/i);
        if (countyMatch) {
            filters.county = countyMatch[1];
        }

        // ROI
        const roiMatch = queryLower.match(/(\d+)%?\s*roi/i);
        if (roiMatch) {
            filters.minROI = parseInt(roiMatch[1]);
        }

        // Soil quality
        const soilMatch = queryLower.match(/(?:high|good|excellent)\s*soil/i);
        if (soilMatch) {
            filters.minSoilQuality = 80;
        }

        console.log('🔍 Parsed filters:', filters);
        return filters;
    }

    /**
     * Filter farmland based on parsed criteria
     * @param {Object} filters - Search filters
     * @returns {Array} Filtered farmland results
     */
    filterFarmland(filters) {
        if (!this.farmlandDatabase) return [];

        let results = [...this.farmlandDatabase];

        // Apply filters
        if (filters.maxPricePerAcre) {
            results = results.filter(farm => farm.pricePerAcre <= filters.maxPricePerAcre);
        }

        if (filters.minPricePerAcre) {
            results = results.filter(farm => farm.pricePerAcre >= filters.minPricePerAcre);
        }

        if (filters.minAcres) {
            results = results.filter(farm => farm.acres >= filters.minAcres);
        }

        if (filters.droughtRisk) {
            results = results.filter(farm => farm.droughtRisk === filters.droughtRisk);
        }

        if (filters.waterRights) {
            results = results.filter(farm => farm.waterRights === true);
        }

        if (filters.organic) {
            results = results.filter(farm => farm.organic === true);
        }

        if (filters.state) {
            results = results.filter(farm => farm.state.toLowerCase() === filters.state.toLowerCase());
        }

        if (filters.county) {
            results = results.filter(farm => farm.county.toLowerCase() === filters.county.toLowerCase());
        }

        if (filters.minROI) {
            results = results.filter(farm => farm.roi >= filters.minROI);
        }

        if (filters.minSoilQuality) {
            results = results.filter(farm => farm.soilQuality >= filters.minSoilQuality);
        }

        // Sort by relevance score
        results.sort((a, b) => this.calculateRelevanceScore(b, filters) - this.calculateRelevanceScore(a, filters));

        return results;
    }

    /**
     * Calculate relevance score for sorting
     * @param {Object} farm - Farm data
     * @param {Object} filters - Applied filters
     * @returns {number} Relevance score
     */
    calculateRelevanceScore(farm, filters) {
        let score = 0;

        // Higher ROI = higher score
        score += farm.roi * 2;

        // Better soil quality = higher score
        score += farm.soilQuality * 0.5;

        // Water rights bonus
        if (farm.waterRights) score += 20;

        // Organic bonus
        if (farm.organic) score += 15;

        // Low drought risk bonus
        if (farm.droughtRisk === 'Low') score += 25;

        // Price efficiency (lower price per acre = higher score)
        score += (5000 - farm.pricePerAcre) * 0.01;

        return score;
    }

    /**
     * Generate explanation of results
     * @param {string} query - Original query
     * @param {Array} results - Search results
     * @param {Object} filters - Applied filters
     * @returns {string} Human-readable explanation
     */
    generateExplanation(query, results, filters) {
        if (results.length === 0) {
            return `I couldn't find any farmland matching your criteria: "${query}". Try expanding your search by adjusting price range or location requirements.`;
        }

        const plural = results.length === 1 ? '' : 's';
        let explanation = `I found ${results.length} farm${plural} matching your request: "${query}". `;

        if (filters.maxPricePerAcre) {
            explanation += `All properties are under $${filters.maxPricePerAcre.toLocaleString()}/acre. `;
        }

        if (filters.droughtRisk) {
            explanation += `Filtered for ${filters.droughtRisk.toLowerCase()} drought risk. `;
        }

        if (filters.waterRights) {
            explanation += `All include water rights. `;
        }

        if (filters.organic) {
            explanation += `All are certified organic. `;
        }

        if (results.length > 0) {
            const bestMatch = results[0];
            explanation += `Top recommendation: ${bestMatch.name} - ${bestMatch.acres} acres at $${bestMatch.pricePerAcre.toLocaleString()}/acre with ${bestMatch.roi}% projected ROI.`;
        }

        return explanation;
    }

    /**
     * Calculate average price from results
     * @param {Array} results - Farmland results
     * @returns {number} Average price per acre
     */
    calculateAveragePrice(results) {
        if (results.length === 0) return 0;
        return results.reduce((sum, farm) => sum + farm.pricePerAcre, 0) / results.length;
    }

    /**
     * Generate search suggestions
     * @param {Array} results - Current results
     * @param {Object} filters - Applied filters
     * @returns {Array} Suggested queries
     */
    generateSuggestions(results, filters) {
        const suggestions = [];

        if (results.length === 0) {
            suggestions.push("Try searching with a higher price range");
            suggestions.push("Look for farms in adjacent counties");
            suggestions.push("Consider removing the organic requirement");
        } else if (results.length > 10) {
            suggestions.push("Add more specific criteria to narrow results");
            suggestions.push("Filter by minimum ROI percentage");
            suggestions.push("Specify a preferred crop type");
        } else {
            suggestions.push("Show me similar farms in nearby areas");
            suggestions.push("Calculate ROI for 5-year investment");
            suggestions.push("Compare soil quality across results");
        }

        return suggestions;
    }

    /**
     * Get conversation history
     * @returns {Array} Chat history
     */
    getHistory() {
        return this.conversationHistory;
    }

    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * Get available sample queries for user guidance
     * @returns {Array} Sample queries
     */
    getSampleQueries() {
        return [
            "Find farmland under $3000 per acre with water rights",
            "Show me organic farms with low drought risk",
            "Find 500+ acre farms in Iowa with high soil quality",
            "What's available under $2500/acre with good ROI?",
            "Show me farms with water rights in Story County",
            "Find land suitable for corn and soybeans",
            "Compare farms by ROI potential",
            "Show me the most profitable farmland options"
        ];
    }

    /**
     * Check if query is about agricultural/farming topics or general questions
     */
    isAgriculturalQuery(query) {
        const lowerQuery = query.toLowerCase();

        // Specific farmland search patterns (should use farmland search)
        const farmlandSearchPatterns = [
            'find farmland', 'find land', 'find farm', 'search farm', 'show me farm',
            'acre', 'price per acre', 'roi', 'investment', 'buy farm',
            'county', 'state', 'location', 'under $', 'over $'
        ];

        // If it's clearly a farmland search, return false (use farmland search instead)
        if (farmlandSearchPatterns.some(pattern => lowerQuery.includes(pattern))) {
            return false;
        }

        // Expanded agricultural/general question keywords
        const agricultureKeywords = [
            // Direct agriculture terms
            'soil', 'moisture', 'water', 'irrigat', 'crop', 'plant', 'ndvi',
            'health', 'disease', 'pest', 'weather', 'rain', 'drought',
            'harvest', 'fertiliz', 'nitrogen', 'phosphorus', 'nutrient',
            'grow', 'seed', 'yield', 'farm', 'agriculture', 'satellite',
            'temperature', 'humidity', 'evapotranspiration', 'canopy',

            // General question words (treat as agricultural in this context)
            'what', 'how', 'when', 'why', 'where', 'should', 'can', 'is',
            'tell me', 'explain', 'help', 'advice', 'recommend', 'suggest',

            // Common agricultural contexts
            'my field', 'my crop', 'my farm', 'my land', 'farming',
            'planting', 'growing', 'watering', 'feeding', 'care'
        ];

        // If query contains any agricultural keyword, treat as agricultural
        return agricultureKeywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * Process agricultural/farming questions
     */
    async processAgriculturalQuery(query) {
        console.log(`🌾 Processing agricultural query: "${query}"`);

        // Check if OpenAI API is available
        const openaiApiKey = localStorage.getItem('openai_api_key');
        if (openaiApiKey) {
            try {
                return await this.processWithOpenAI(query, openaiApiKey);
            } catch (error) {
                console.warn('OpenAI API failed, using fallback:', error);
            }
        }

        // Get NASA satellite data with GPS location
        const satelliteData = await this.getLocationSpecificSatelliteData();

        // Generate agricultural response based on query
        let response = {
            query: query,
            type: 'agricultural',
            explanation: '',
            data: satelliteData,
            recommendations: [],
            visualData: null
        };

        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('soil moisture') || lowerQuery.includes('water')) {
            response.explanation = `Based on current NASA SMAP satellite data, your area shows soil moisture levels at ${satelliteData.soilMoisture || '32%'}.
                ${satelliteData.soilMoisture > 40 ? 'Soil moisture is adequate.' : 'Soil moisture is low, consider irrigation.'}`;
            response.recommendations = [
                'Monitor soil moisture daily',
                'Consider drip irrigation for water efficiency',
                'Check weather forecast for upcoming precipitation'
            ];
        } else if (lowerQuery.includes('crop health') || lowerQuery.includes('ndvi')) {
            response.explanation = `NDVI analysis shows vegetation index at ${satelliteData.ndvi || '0.72'}, indicating ${satelliteData.ndvi > 0.6 ? 'healthy' : 'stressed'} crop conditions.
                Areas with lower NDVI may need attention.`;
            response.recommendations = [
                'Inspect areas with low NDVI values',
                'Check for nutrient deficiencies',
                'Monitor for pest or disease issues'
            ];
        } else if (lowerQuery.includes('irrigat')) {
            const shouldIrrigate = (satelliteData.soilMoisture || 32) < 35;
            response.explanation = `Current conditions: Soil moisture at ${satelliteData.soilMoisture || '32%'}, temperature ${satelliteData.temperature || '25°C'}.
                ${shouldIrrigate ? '💧 Irrigation recommended within 24-48 hours.' : '✅ No immediate irrigation needed.'}`;
            response.recommendations = shouldIrrigate ? [
                'Apply 1-1.5 inches of water',
                'Best time: early morning or late evening',
                'Check soil moisture after irrigation'
            ] : [
                'Continue monitoring soil moisture',
                'Check again in 2-3 days',
                'Watch weather forecast'
            ];
        } else {
            // Default intelligent response based on query content
            const lowerQuery = query.toLowerCase();

            if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
                response.explanation = `Hello! I'm your AI agricultural assistant powered by NASA satellite data. I can help you with farming decisions, crop analysis, soil conditions, and agricultural recommendations. What would you like to know?`;
                response.recommendations = [
                    'Ask about soil moisture levels',
                    'Check crop health with NDVI data',
                    'Get irrigation recommendations'
                ];
            } else if (lowerQuery.includes('help') || lowerQuery.includes('what can you')) {
                response.explanation = `I can help you with:
                    • Real-time soil moisture analysis (SMAP data)
                    • Crop health monitoring (NDVI analysis)
                    • Irrigation timing and recommendations
                    • Weather and climate insights
                    • Agricultural best practices
                    • NASA satellite data interpretation

                    Current conditions: Soil Moisture ${satelliteData.soilMoisture?.toFixed(1) || '32'}%, NDVI ${satelliteData.ndvi?.toFixed(3) || '0.72'}, Temperature ${satelliteData.temperature || '25'}°C`;
                response.recommendations = [
                    'Try asking specific questions about your crops',
                    'Ask about current satellite data',
                    'Request irrigation advice'
                ];
            } else {
                // General intelligent response using satellite data
                response.explanation = `Based on your question and current NASA satellite data analysis:

                    Current agricultural conditions:
                    • Soil Moisture: ${satelliteData.soilMoisture?.toFixed(1) || '32'}%
                    • Vegetation Index (NDVI): ${satelliteData.ndvi?.toFixed(3) || '0.72'}
                    • Temperature: ${satelliteData.temperature || '25'}°C

                    ${satelliteData.soilMoisture < 30 ? 'Your soil moisture is relatively low - consider irrigation.' : 'Soil moisture levels appear adequate.'}
                    ${satelliteData.ndvi > 0.6 ? 'Vegetation health looks good based on NDVI readings.' : 'NDVI suggests vegetation may need attention.'}`;

                response.recommendations = [
                    'Monitor soil moisture daily',
                    'Check weather forecasts for planning',
                    'Use precision agriculture techniques'
                ];
            }
        }

        // Add to conversation history
        this.conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date()
        });

        return response;
    }

    /**
     * Process query with OpenAI GPT-4
     */
    async processWithOpenAI(query, apiKey) {
        const satelliteData = await this.getLocationSpecificSatelliteData();

        const systemPrompt = `You are an expert agricultural AI assistant integrated with NASA satellite data.
        You help farmers and agricultural professionals with any farming-related questions or general questions in an agricultural context.

        Current location: ${satelliteData.location ? `${satelliteData.location.latitude.toFixed(4)}°, ${satelliteData.location.longitude.toFixed(4)}° (${satelliteData.location.source})` : 'Location unavailable'}

        Current NASA satellite data for this location:
        - Soil Moisture: ${satelliteData.soilMoisture?.toFixed(1)}% (SMAP satellite data)
        - NDVI: ${satelliteData.ndvi?.toFixed(3)} (vegetation health indicator from MODIS)
        - Temperature: ${satelliteData.temperature}°C
        - Precipitation: ${satelliteData.precipitation}mm
        - Data Source: ${satelliteData.source}

        GUIDELINES:
        - Answer any agricultural questions using the satellite data when relevant
        - For general questions, provide agricultural context when helpful
        - Always be practical and actionable
        - Include satellite data insights when applicable
        - Keep responses conversational but informative (2-4 paragraphs)
        - If asked about capabilities, mention your access to real-time NASA satellite data`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        return {
            query: query,
            type: 'agricultural',
            explanation: aiResponse,
            data: satelliteData,
            source: 'OpenAI GPT-4',
            recommendations: this.extractRecommendations(aiResponse),
            visualData: null
        };
    }

    /**
     * Extract recommendations from AI response
     */
    extractRecommendations(text) {
        const recommendations = [];
        const lines = text.split('\n');

        for (const line of lines) {
            if (line.includes('recommend') || line.includes('suggest') ||
                line.includes('should') || line.includes('consider')) {
                if (line.trim().length > 20) {
                    recommendations.push(line.trim());
                }
            }
        }

        return recommendations.length > 0 ? recommendations.slice(0, 3) : [
            'Monitor satellite data regularly',
            'Adjust practices based on conditions',
            'Consult local agricultural extension'
        ];
    }

    /**
     * Get NASA satellite data (integrate with existing NASA data services)
     */
    async getNASASatelliteData() {
        try {
            // Check if NASA data is available from the app
            if (window.app && window.app.currentNASAData) {
                return {
                    soilMoisture: window.app.currentNASAData.smap?.soilMoisture || 32,
                    ndvi: window.app.currentNASAData.modis?.ndvi || 0.72,
                    temperature: window.app.currentNASAData.temperature || 25,
                    precipitation: window.app.currentNASAData.precipitation || 0
                };
            }

            // Default fallback data
            return {
                soilMoisture: 32 + Math.random() * 20,
                ndvi: 0.6 + Math.random() * 0.3,
                temperature: 20 + Math.random() * 15,
                precipitation: Math.random() * 5
            };
        } catch (error) {
            console.error('Error fetching NASA data:', error);
            return {
                soilMoisture: 32,
                ndvi: 0.72,
                temperature: 25,
                precipitation: 0
            };
        }
    }

    /**
     * Request GPS location permission and get current position
     */
    async requestLocationPermission() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                console.log('🌍 GPS not supported, using fallback location');
                this.locationEnabled = false;
                resolve(false);
                return;
            }

            console.log('🌍 Requesting GPS location permission...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date()
                    };
                    this.locationEnabled = true;
                    console.log(`📍 GPS location obtained: ${this.currentLocation.latitude.toFixed(4)}, ${this.currentLocation.longitude.toFixed(4)}`);
                    resolve(true);
                },
                (error) => {
                    console.warn('🚫 GPS location denied or failed:', error.message);
                    this.locationEnabled = false;
                    this.currentLocation = null;
                    resolve(false);
                },
                {
                    enableHighAccuracy: false, // Faster, less accurate
                    timeout: 3000, // Reduced from 10s to 3s
                    maximumAge: 600000 // 10 minutes (allow cached location)
                }
            );
        });
    }

    /**
     * Get current GPS location or fallback location
     */
    getCurrentLocation() {
        if (this.locationEnabled && this.currentLocation) {
            return {
                latitude: this.currentLocation.latitude,
                longitude: this.currentLocation.longitude,
                source: 'GPS',
                accuracy: this.currentLocation.accuracy
            };
        }

        // Fallback to default location (Seoul, Korea)
        return {
            latitude: 29.7604,
            longitude: -95.36980,
            source: 'fallback',
            accuracy: null
        };
    }

    /**
     * Get location-specific NASA satellite data
     */
    async getLocationSpecificSatelliteData() {
        const location = this.getCurrentLocation();

        try {
            console.log(`🛰️ Fetching NASA data for location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)} (${location.source})`);

            const response = await fetch(`${this.apiEndpoint.replace('/ai-query', '')}/smap/soil-moisture?lat=${location.latitude}&lon=${location.longitude}`);
            if (response.ok) {
                const smapData = await response.json();

                const modisResponse = await fetch(`${this.apiEndpoint.replace('/ai-query', '')}/modis/ndvi?lat=${location.latitude}&lon=${location.longitude}`);
                const modisData = modisResponse.ok ? await modisResponse.json() : null;

                return {
                    location: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        source: location.source,
                        accuracy: location.accuracy
                    },
                    soilMoisture: smapData.soilMoisture || (25 + Math.random() * 20),
                    ndvi: modisData?.ndvi || (0.6 + Math.random() * 0.3),
                    temperature: smapData.temperature || (15 + Math.random() * 20),
                    precipitation: smapData.precipitation || (Math.random() * 5),
                    source: smapData.source || 'NASA Satellite Data'
                };
            }
        } catch (error) {
            console.error('Error fetching location-specific NASA data:', error);
        }

        // Fallback data
        const location_info = this.getCurrentLocation();
        return {
            location: location_info,
            soilMoisture: 30 + Math.random() * 15,
            ndvi: 0.65 + Math.random() * 0.25,
            temperature: 18 + Math.random() * 12,
            precipitation: Math.random() * 3,
            source: 'Fallback Data'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AICopilotService;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.AICopilotService = AICopilotService;
}