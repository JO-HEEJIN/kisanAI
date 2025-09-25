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
        this.initialize();
    }

    /**
     * Initialize the AI Copilot service
     */
    async initialize() {
        try {
            // Load sample farmland database
            this.farmlandDatabase = await this.loadFarmlandData();
            this.isInitialized = true;
            console.log('🤖 AI Copilot Service initialized successfully');
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

            // Parse the query and filter farmland
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AICopilotService;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.AICopilotService = AICopilotService;
}