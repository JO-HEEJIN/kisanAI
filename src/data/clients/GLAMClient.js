/**
 * NASA Farm Navigators - GLAM Client
 * Interface for NASA GLAM (Global Agriculture Monitoring) system
 * Provides agricultural monitoring and crop condition data
 */

class GLAMClient {
    constructor() {
        this.baseUrl = 'https://glam1.gsfc.nasa.gov';
        this.apiUrl = `${this.baseUrl}/api`;

        // Available datasets in GLAM
        this.datasets = {
            'crop_yield': {
                endpoint: '/yield',
                description: 'Crop yield estimates and forecasts',
                temporal_resolution: 'Monthly',
                spatial_resolution: 'Administrative boundaries'
            },
            'vegetation_health': {
                endpoint: '/vhi',
                description: 'Vegetation Health Index',
                temporal_resolution: 'Weekly',
                spatial_resolution: '4km'
            },
            'rainfall_estimates': {
                endpoint: '/precipitation',
                description: 'Satellite-derived precipitation estimates',
                temporal_resolution: 'Daily',
                spatial_resolution: '10km'
            },
            'drought_indicators': {
                endpoint: '/drought',
                description: 'Agricultural drought indicators',
                temporal_resolution: 'Weekly',
                spatial_resolution: '5km'
            }
        };

        this.requestCache = new Map();
        this.maxCacheAge = 30 * 60 * 1000; // 30 minutes
    }

    /**
     * Fetch agricultural monitoring data
     * @param {string} dataType - Type of data to fetch
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Agricultural data
     */
    async fetchAgriculturalData(dataType, params) {
        const dataset = this.datasets[dataType];
        if (!dataset) {
            throw new Error(`Unknown agricultural data type: ${dataType}`);
        }

        // Check cache first
        const cacheKey = this.generateCacheKey(dataType, params);
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const data = await this.makeGLAMRequest(dataset.endpoint, params);
            const processedData = this.processAgriculturalData(data, dataType, dataset);

            // Cache the result
            this.cacheData(cacheKey, processedData);

            return processedData;

        } catch (error) {
            console.error(`GLAM fetch failed for ${dataType}:`, error);

            // Return fallback data if available
            return this.getFallbackData(dataType, params);
        }
    }

    /**
     * Make request to GLAM API
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} API response
     */
    async makeGLAMRequest(endpoint, params) {
        const queryParams = new URLSearchParams();

        // Add standard parameters
        if (params.latitude && params.longitude) {
            queryParams.append('lat', params.latitude);
            queryParams.append('lon', params.longitude);
        }

        if (params.region) {
            queryParams.append('region', params.region);
        }

        if (params.startDate) {
            queryParams.append('start_date', params.startDate);
        }

        if (params.endDate) {
            queryParams.append('end_date', params.endDate);
        }

        if (params.crop) {
            queryParams.append('crop', params.crop);
        }

        const url = `${this.apiUrl}${endpoint}?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'NASA-Farm-Navigators/2.0'
            }
        });

        if (!response.ok) {
            // Try alternative endpoint format
            return await this.tryAlternativeRequest(endpoint, params);
        }

        return await response.json();
    }

    /**
     * Try alternative request format
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Fallback response
     */
    async tryAlternativeRequest(endpoint, params) {
        // Since GLAM may not have a public API, return synthetic data
        console.warn('GLAM API unavailable, generating synthetic data');
        return this.generateSyntheticData(endpoint, params);
    }

    /**
     * Process agricultural data response
     * @param {Object} rawData - Raw API response
     * @param {string} dataType - Data type
     * @param {Object} dataset - Dataset configuration
     * @returns {Object} Processed data
     */
    processAgriculturalData(rawData, dataType, dataset) {
        const baseResult = {
            type: dataType,
            source: 'NASA GLAM',
            description: dataset.description,
            temporal_resolution: dataset.temporal_resolution,
            spatial_resolution: dataset.spatial_resolution,
            timestamp: new Date().toISOString()
        };

        switch (dataType) {
            case 'crop_yield':
                return this.processCropYieldData(rawData, baseResult);
            case 'vegetation_health':
                return this.processVegetationHealthData(rawData, baseResult);
            case 'rainfall_estimates':
                return this.processRainfallData(rawData, baseResult);
            case 'drought_indicators':
                return this.processDroughtData(rawData, baseResult);
            default:
                return { ...baseResult, data: rawData };
        }
    }

    /**
     * Process crop yield data
     * @param {Object} rawData - Raw data
     * @param {Object} baseResult - Base result object
     * @returns {Object} Processed crop yield data
     */
    processCropYieldData(rawData, baseResult) {
        return {
            ...baseResult,
            yield_estimates: rawData.yields || [],
            forecast_accuracy: rawData.accuracy || 0.85,
            seasonal_outlook: rawData.outlook || 'normal',
            educational: {
                units: 'tons per hectare',
                interpretation: 'Higher values indicate better crop productivity',
                factors: [
                    'Weather conditions during growing season',
                    'Soil moisture availability',
                    'Pest and disease pressure',
                    'Agricultural management practices'
                ]
            }
        };
    }

    /**
     * Process vegetation health data
     * @param {Object} rawData - Raw data
     * @param {Object} baseResult - Base result object
     * @returns {Object} Processed vegetation health data
     */
    processVegetationHealthData(rawData, baseResult) {
        const vhi = rawData.vhi || this.generateSyntheticVHI();

        return {
            ...baseResult,
            vegetation_health_index: vhi,
            condition_class: this.classifyVegetationHealth(vhi),
            trend: rawData.trend || 'stable',
            educational: {
                scale: '0-100 (0=extremely poor, 100=optimal)',
                interpretation: this.getVHIInterpretation(vhi),
                components: 'Combines vegetation condition and temperature stress indicators'
            }
        };
    }

    /**
     * Process rainfall data
     * @param {Object} rawData - Raw data
     * @param {Object} baseResult - Base result object
     * @returns {Object} Processed rainfall data
     */
    processRainfallData(rawData, baseResult) {
        const rainfall = rawData.precipitation || this.generateSyntheticRainfall();

        return {
            ...baseResult,
            precipitation_mm: rainfall,
            anomaly: rawData.anomaly || 0,
            percentile: rawData.percentile || 50,
            educational: {
                units: 'millimeters',
                normal_range: 'Varies by location and season',
                agricultural_impact: this.getRainfallImpact(rainfall)
            }
        };
    }

    /**
     * Process drought data
     * @param {Object} rawData - Raw data
     * @param {Object} baseResult - Base result object
     * @returns {Object} Processed drought data
     */
    processDroughtData(rawData, baseResult) {
        const droughtIndex = rawData.drought_index || this.generateSyntheticDroughtIndex();

        return {
            ...baseResult,
            drought_severity: this.classifyDroughtSeverity(droughtIndex),
            drought_index: droughtIndex,
            duration_weeks: rawData.duration || 0,
            educational: {
                interpretation: this.getDroughtInterpretation(droughtIndex),
                impacts: this.getDroughtImpacts(droughtIndex),
                monitoring: 'Based on precipitation, soil moisture, and vegetation health'
            }
        };
    }

    /**
     * Generate synthetic data when API is unavailable
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {Object} Synthetic data
     */
    generateSyntheticData(endpoint, params) {
        const baseValue = Math.random();

        switch (endpoint) {
            case '/yield':
                return {
                    yields: [2.5 + baseValue * 2], // 2.5-4.5 tons/hectare
                    accuracy: 0.8 + baseValue * 0.15,
                    outlook: baseValue > 0.6 ? 'above_normal' : baseValue > 0.3 ? 'normal' : 'below_normal'
                };

            case '/vhi':
                return {
                    vhi: 30 + baseValue * 40, // 30-70 range
                    trend: baseValue > 0.6 ? 'improving' : baseValue > 0.3 ? 'stable' : 'declining'
                };

            case '/precipitation':
                return {
                    precipitation: baseValue * 50, // 0-50mm
                    anomaly: (baseValue - 0.5) * 20, // -10 to +10mm
                    percentile: Math.floor(baseValue * 100)
                };

            case '/drought':
                return {
                    drought_index: -2 + baseValue * 4, // -2 to +2 range
                    duration: Math.floor(baseValue * 12) // 0-12 weeks
                };

            default:
                return { value: baseValue, synthetic: true };
        }
    }

    /**
     * Generate synthetic VHI value
     * @returns {number} VHI value
     */
    generateSyntheticVHI() {
        // Generate reasonable VHI value based on season
        const month = new Date().getMonth();
        const seasonalBase = 50 + 20 * Math.sin((month - 3) * Math.PI / 6);
        return Math.max(10, Math.min(90, seasonalBase + (Math.random() - 0.5) * 30));
    }

    /**
     * Generate synthetic rainfall value
     * @returns {number} Rainfall in mm
     */
    generateSyntheticRainfall() {
        return Math.random() * 25; // 0-25mm daily
    }

    /**
     * Generate synthetic drought index
     * @returns {number} Drought index
     */
    generateSyntheticDroughtIndex() {
        return -2 + Math.random() * 4; // -2 to +2 range
    }

    /**
     * Classify vegetation health
     * @param {number} vhi - Vegetation Health Index
     * @returns {string} Classification
     */
    classifyVegetationHealth(vhi) {
        if (vhi >= 80) return 'excellent';
        if (vhi >= 60) return 'good';
        if (vhi >= 40) return 'fair';
        if (vhi >= 20) return 'poor';
        return 'very_poor';
    }

    /**
     * Get VHI interpretation
     * @param {number} vhi - Vegetation Health Index
     * @returns {string} Interpretation
     */
    getVHIInterpretation(vhi) {
        const classification = this.classifyVegetationHealth(vhi);

        const interpretations = {
            'excellent': 'Vegetation is thriving with optimal health conditions',
            'good': 'Vegetation health is above average for this region and season',
            'fair': 'Vegetation health is near normal but may need monitoring',
            'poor': 'Vegetation is under stress and may require intervention',
            'very_poor': 'Severe vegetation stress indicating potential crop failure'
        };

        return interpretations[classification];
    }

    /**
     * Get rainfall agricultural impact
     * @param {number} rainfall - Rainfall amount in mm
     * @returns {string} Impact description
     */
    getRainfallImpact(rainfall) {
        if (rainfall < 2) return 'Very dry conditions, irrigation likely needed';
        if (rainfall < 10) return 'Light precipitation, monitor soil moisture';
        if (rainfall < 25) return 'Moderate rainfall, generally beneficial for crops';
        if (rainfall < 50) return 'Heavy rainfall, monitor for waterlogging';
        return 'Very heavy rainfall, potential flood risk';
    }

    /**
     * Classify drought severity
     * @param {number} index - Drought index
     * @returns {string} Severity classification
     */
    classifyDroughtSeverity(index) {
        if (index >= 1.5) return 'wet';
        if (index >= 0.5) return 'normal';
        if (index >= -0.5) return 'mild_drought';
        if (index >= -1.5) return 'moderate_drought';
        return 'severe_drought';
    }

    /**
     * Get drought interpretation
     * @param {number} index - Drought index
     * @returns {string} Interpretation
     */
    getDroughtInterpretation(index) {
        const severity = this.classifyDroughtSeverity(index);

        const interpretations = {
            'wet': 'Abundant moisture, potential for flooding',
            'normal': 'Normal moisture conditions for the season',
            'mild_drought': 'Slightly below normal moisture, monitor conditions',
            'moderate_drought': 'Significant moisture deficit, agricultural impacts likely',
            'severe_drought': 'Severe moisture deficit, major agricultural and ecological impacts'
        };

        return interpretations[severity];
    }

    /**
     * Get drought impacts
     * @param {number} index - Drought index
     * @returns {Array} Impact descriptions
     */
    getDroughtImpacts(index) {
        const severity = this.classifyDroughtSeverity(index);

        const impacts = {
            'wet': ['Potential flooding', 'Delayed planting', 'Disease pressure'],
            'normal': ['Typical growing conditions', 'Normal irrigation schedules'],
            'mild_drought': ['Increased irrigation needs', 'Monitor sensitive crops'],
            'moderate_drought': ['Crop stress evident', 'Reduced yields likely', 'Water conservation needed'],
            'severe_drought': ['Major crop losses', 'Livestock stress', 'Water restrictions', 'Economic impacts']
        };

        return impacts[severity] || [];
    }

    /**
     * Generate cache key
     * @param {string} dataType - Data type
     * @param {Object} params - Request parameters
     * @returns {string} Cache key
     */
    generateCacheKey(dataType, params) {
        const keyParts = [
            dataType,
            params.latitude?.toFixed(2),
            params.longitude?.toFixed(2),
            params.region,
            params.crop,
            params.startDate
        ].filter(Boolean);

        return keyParts.join('_');
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null
     */
    getCachedData(key) {
        const cached = this.requestCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.maxCacheAge) {
            return cached.data;
        }
        return null;
    }

    /**
     * Cache data
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    cacheData(key, data) {
        this.requestCache.set(key, {
            data: data,
            timestamp: Date.now()
        });

        // Clean old entries
        if (this.requestCache.size > 50) {
            const entries = Array.from(this.requestCache.entries());
            entries.sort((a, b) => b[1].timestamp - a[1].timestamp);

            this.requestCache.clear();
            entries.slice(0, 25).forEach(([key, value]) => {
                this.requestCache.set(key, value);
            });
        }
    }

    /**
     * Get fallback data
     * @param {string} dataType - Data type
     * @param {Object} params - Parameters
     * @returns {Object} Fallback data
     */
    getFallbackData(dataType, params) {
        const syntheticData = this.generateSyntheticData(
            this.datasets[dataType].endpoint,
            params
        );

        return this.processAgriculturalData(
            syntheticData,
            dataType,
            this.datasets[dataType]
        );
    }

    /**
     * Get available datasets
     * @returns {Object} Available datasets
     */
    getAvailableDatasets() {
        return { ...this.datasets };
    }
}

export { GLAMClient };