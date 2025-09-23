/**
 * NASA Farm Navigators - Crop-CASMA Client
 * Interface for NASA Crop Condition and Soil Moisture Analytics (Crop-CASMA)
 * Handles SMAP soil moisture data access
 */

class CropCASMAClient {
    constructor() {
        this.baseUrl = 'https://gimms.gsfc.nasa.gov/SMAP';
        this.wmsUrl = 'https://gimms.gsfc.nasa.gov/cgi-bin/smap_wms.cgi';
        this.wcsUrl = 'https://gimms.gsfc.nasa.gov/cgi-bin/smap_wcs.cgi';

        // Available SMAP products
        this.products = {
            'surface': {
                product: 'SPL3SMP_E',
                version: '005',
                layer: 'Soil_Moisture_Retrieval_Data_AM_soil_moisture',
                resolution: 9000,
                depth: '0-5cm',
                description: 'SMAP L3 Enhanced Daily Global Soil Moisture'
            },
            'rootZone': {
                product: 'SPL4SMGP',
                version: '006',
                layer: 'Geophysical_Data_sm_rootzone',
                resolution: 9000,
                depth: '0-100cm',
                description: 'SMAP L4 Global Root Zone Soil Moisture'
            }
        };

        this.requestCache = new Map();
        this.maxCacheAge = 60 * 60 * 1000; // 1 hour
    }

    /**
     * Fetch SMAP soil moisture data
     * @param {string} depth - 'surface' for L3 or 'rootZone' for L4
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} SMAP soil moisture data
     */
    async fetchSMAP(depth, params) {
        const product = this.products[depth];
        if (!product) {
            throw new Error(`Unknown depth type: ${depth}`);
        }

        // Check cache first
        const cacheKey = this.generateCacheKey(depth, params);
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // Use WCS (Web Coverage Service) for point data
            const data = await this.fetchPointData(product, params);

            // Cache the result
            this.cacheData(cacheKey, data);

            return data;

        } catch (error) {
            console.error(`Crop-CASMA fetch failed for ${depth}:`, error);

            // Try fallback method
            return await this.fetchFallbackData(product, params);
        }
    }

    /**
     * Fetch point data using WCS
     * @param {Object} product - Product configuration
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Point data
     */
    async fetchPointData(product, params) {
        const date = params.date || this.getMostRecentDate();
        const bbox = this.createPointBbox(params.latitude, params.longitude);

        const wcsParams = new URLSearchParams({
            service: 'WCS',
            version: '2.0.1',
            request: 'GetCoverage',
            coverageId: `${product.product}_${product.version}:${product.layer}`,
            subset: [
                `Lat(${bbox.minLat},${bbox.maxLat})`,
                `Lon(${bbox.minLon},${bbox.maxLon})`,
                `TIME("${date}")`
            ].join(','),
            format: 'application/json',
            outputCrs: 'EPSG:4326'
        });

        const url = `${this.wcsUrl}?${wcsParams.toString()}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'NASA-Farm-Navigators/2.0'
            }
        });

        if (!response.ok) {
            throw new Error(`WCS request failed: ${response.status} ${response.statusText}`);
        }

        const rawData = await response.json();
        return this.processSMAPData(rawData, product, params);
    }

    /**
     * Fetch fallback data using alternative method
     * @param {Object} product - Product configuration
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Fallback data
     */
    async fetchFallbackData(product, params) {
        // Use synthetic/interpolated data as fallback
        const syntheticValue = this.generateSyntheticSMAPValue(params);

        return {
            type: 'soil_moisture',
            source: `${product.product} (fallback)`,
            depth: product.depth,
            resolution: product.resolution,
            values: [syntheticValue],
            location: {
                latitude: params.latitude,
                longitude: params.longitude
            },
            timestamp: new Date().toISOString(),
            fallback: true,
            educational: {
                note: 'Using fallback data due to service unavailability',
                explanation: 'Real SMAP data may be temporarily unavailable'
            }
        };
    }

    /**
     * Process raw SMAP data response
     * @param {Object} rawData - Raw response data
     * @param {Object} product - Product configuration
     * @param {Object} params - Original request parameters
     * @returns {Object} Processed SMAP data
     */
    processSMAPData(rawData, product, params) {
        // Extract soil moisture values
        let values = [];
        let metadata = {};

        if (rawData.values && Array.isArray(rawData.values)) {
            values = rawData.values.filter(v => v !== null && v !== -9999); // Filter invalid values
        } else if (rawData.coverage && rawData.coverage.values) {
            values = rawData.coverage.values.filter(v => v !== null && v !== -9999);
        }

        // Calculate statistics
        const validValues = values.filter(v => v >= 0 && v <= 1); // Valid soil moisture range
        const mean = validValues.length > 0 ? validValues.reduce((a, b) => a + b) / validValues.length : null;

        // Determine moisture level classification
        const moistureLevel = this.classifyMoistureLevel(mean);

        return {
            type: 'soil_moisture',
            source: product.product,
            depth: product.depth,
            resolution: product.resolution,
            values: validValues,
            statistics: {
                mean: mean,
                min: validValues.length > 0 ? Math.min(...validValues) : null,
                max: validValues.length > 0 ? Math.max(...validValues) : null,
                count: validValues.length,
                classification: moistureLevel
            },
            location: {
                latitude: params.latitude,
                longitude: params.longitude
            },
            timestamp: params.date || new Date().toISOString(),
            quality: this.assessDataQuality(validValues, rawData),
            educational: {
                units: 'm³/m³ (volumetric water content)',
                range: '0.0 to 1.0 (0% to 100% water content)',
                typical_agricultural: '0.2 to 0.5 for most crops',
                interpretation: this.getMoistureInterpretation(mean, product.depth)
            }
        };
    }

    /**
     * Classify moisture level based on value
     * @param {number} moistureValue - Soil moisture value (0-1)
     * @returns {string} Classification
     */
    classifyMoistureLevel(moistureValue) {
        if (moistureValue === null) return 'unknown';
        if (moistureValue < 0.15) return 'very_dry';
        if (moistureValue < 0.25) return 'dry';
        if (moistureValue < 0.4) return 'moderate';
        if (moistureValue < 0.55) return 'moist';
        return 'wet';
    }

    /**
     * Get moisture interpretation for educational purposes
     * @param {number} value - Moisture value
     * @param {string} depth - Depth range
     * @returns {string} Educational interpretation
     */
    getMoistureInterpretation(value, depth) {
        if (value === null) {
            return 'Data unavailable for this location and time';
        }

        const classification = this.classifyMoistureLevel(value);
        const depthContext = depth === '0-5cm' ? 'surface' : 'root zone';

        const interpretations = {
            'very_dry': `Very dry ${depthContext} conditions. ${depth === '0-5cm' ? 'Surface may appear cracked. Check deeper soil moisture for root zone status.' : 'Crops likely experiencing water stress. Irrigation recommended.'}`,
            'dry': `Dry ${depthContext} conditions. ${depth === '0-5cm' ? 'Monitor deeper soil moisture for full picture.' : 'May need irrigation depending on crop type and growth stage.'}`,
            'moderate': `Moderate ${depthContext} moisture. ${depth === '0-5cm' ? 'Typical for dry periods between irrigation/rain.' : 'Generally adequate for most crops.'}`,
            'moist': `Good ${depthContext} moisture levels. ${depth === '0-5cm' ? 'Recent precipitation or irrigation evident.' : 'Optimal conditions for most crops.'}`,
            'wet': `High ${depthContext} moisture. ${depth === '0-5cm' ? 'May indicate recent heavy precipitation.' : 'Risk of waterlogging for some crops.'}`
        };

        return interpretations[classification] || 'Unable to interpret moisture level';
    }

    /**
     * Assess data quality
     * @param {Array} values - Data values
     * @param {Object} rawData - Raw response data
     * @returns {Object} Quality assessment
     */
    assessDataQuality(values, rawData) {
        const quality = {
            score: 1.0,
            issues: [],
            confidence: 'high'
        };

        // Check data availability
        if (values.length === 0) {
            quality.score = 0;
            quality.issues.push('No valid data points');
            quality.confidence = 'none';
            return quality;
        }

        // Check for fill values or outliers
        const outliers = values.filter(v => v < 0 || v > 1);
        if (outliers.length > 0) {
            quality.score *= 0.8;
            quality.issues.push(`${outliers.length} outlier values detected`);
        }

        // Check data freshness
        if (rawData.timestamp) {
            const age = Date.now() - new Date(rawData.timestamp).getTime();
            const daysSinceData = age / (24 * 60 * 60 * 1000);

            if (daysSinceData > 7) {
                quality.score *= 0.9;
                quality.issues.push(`Data is ${Math.round(daysSinceData)} days old`);
            }
        }

        // Set confidence level
        if (quality.score >= 0.9) quality.confidence = 'high';
        else if (quality.score >= 0.7) quality.confidence = 'medium';
        else quality.confidence = 'low';

        return quality;
    }

    /**
     * Generate synthetic SMAP value for fallback
     * @param {Object} params - Request parameters
     * @returns {number} Synthetic moisture value
     */
    generateSyntheticSMAPValue(params) {
        // Generate reasonable synthetic value based on location and season
        const baseValue = 0.25; // Moderate moisture baseline

        // Add seasonal variation
        const month = new Date().getMonth();
        const seasonalAdjustment = 0.1 * Math.sin((month - 3) * Math.PI / 6); // Peak in summer

        // Add some randomness
        const randomVariation = (Math.random() - 0.5) * 0.1;

        // Ensure value is within valid range
        return Math.max(0.05, Math.min(0.6, baseValue + seasonalAdjustment + randomVariation));
    }

    /**
     * Create bounding box for point request
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Object} Bounding box
     */
    createPointBbox(lat, lon) {
        // Create small bounding box around point (±0.05 degrees ≈ 5.5km)
        const buffer = 0.05;

        return {
            minLat: lat - buffer,
            maxLat: lat + buffer,
            minLon: lon - buffer,
            maxLon: lon + buffer
        };
    }

    /**
     * Get most recent available date
     * @returns {string} Date string (YYYY-MM-DD)
     */
    getMostRecentDate() {
        // SMAP data typically has 2-3 day delay
        const date = new Date();
        date.setDate(date.getDate() - 3);
        return date.toISOString().split('T')[0];
    }

    /**
     * Generate cache key
     * @param {string} depth - Depth type
     * @param {Object} params - Request parameters
     * @returns {string} Cache key
     */
    generateCacheKey(depth, params) {
        return `smap_${depth}_${params.latitude?.toFixed(3)}_${params.longitude?.toFixed(3)}_${params.date || 'latest'}`;
    }

    /**
     * Get cached data if available and fresh
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

        // Clean old cache entries
        if (this.requestCache.size > 100) {
            const entries = Array.from(this.requestCache.entries());
            entries.sort((a, b) => b[1].timestamp - a[1].timestamp);

            // Keep only the 50 most recent
            this.requestCache.clear();
            entries.slice(0, 50).forEach(([key, value]) => {
                this.requestCache.set(key, value);
            });
        }
    }

    /**
     * Get available SMAP products
     * @returns {Object} Available products
     */
    getAvailableProducts() {
        return { ...this.products };
    }

    /**
     * Get product metadata
     * @param {string} depth - Depth type
     * @returns {Object} Product metadata
     */
    getProductMetadata(depth) {
        const product = this.products[depth];
        if (!product) {
            throw new Error(`Unknown depth type: ${depth}`);
        }

        return {
            ...product,
            temporal_resolution: depth === 'surface' ? '2-3 days' : 'Daily',
            spatial_resolution: '9 km',
            accuracy: depth === 'surface' ? '±0.04 m³/m³' : '±0.05 m³/m³',
            coverage: 'Global',
            data_latency: depth === 'surface' ? '2-3 days' : '1-2 days'
        };
    }
}

export { CropCASMAClient };