/**
 * NASA Farm Navigators - Data Integration Layer
 * Manages access to multiple NASA data sources with resolution awareness
 */

import { EarthdataAuth } from './EarthdataAuth.js';
import { AppEEARSClient } from './clients/AppEEARSClient.js';
import { CropCASMAClient } from './clients/CropCASMAClient.js';
import { WorldviewClient } from './clients/WorldviewClient.js';
import { GLAMClient } from './clients/GLAMClient.js';
import { DataCache } from './DataCache.js';

class NASADataIntegrator {
    constructor(options = {}) {
        this.earthdataAuth = options.earthdataAuth || new EarthdataAuth();
        this.cacheSize = options.cacheSize || 100;
        this.offlineMode = options.offlineMode || false;

        // Initialize data clients
        this.appEEARSClient = new AppEEARSClient(this.earthdataAuth);
        this.cropCASMAClient = new CropCASMAClient();
        this.worldviewClient = new WorldviewClient();
        this.glamClient = new GLAMClient();

        // Data cache for offline support
        this.dataCache = new DataCache(this.cacheSize);

        // Resolution mapping for different data sources
        this.resolutionMap = new Map([
            ['SMAP_L3', { resolution: 9000, depth: 'surface', source: 'cropCASMA' }],
            ['SMAP_L4', { resolution: 9000, depth: 'rootZone', source: 'cropCASMA' }],
            ['MODIS_NDVI', { resolution: 250, depth: null, source: 'appEEARS' }],
            ['LANDSAT_NDVI', { resolution: 30, depth: null, source: 'appEEARS' }],
            ['GPM_PRECIPITATION', { resolution: 11000, depth: null, source: 'appEEARS' }],
            ['VIIRS_NDVI', { resolution: 375, depth: null, source: 'worldview' }]
        ]);

        // Data quality thresholds
        this.qualityThresholds = {
            confidence: 0.7,
            maxCloudCover: 0.3,
            maxTimeDelta: 7 * 24 * 60 * 60 * 1000, // 7 days
            spatialAccuracy: 0.8
        };

        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.rateLimiters = new Map();
    }

    /**
     * Fetch SMAP soil moisture data with depth specification
     * @param {string} depth - 'surface' for L3 or 'rootZone' for L4
     * @param {Object} params - Location and time parameters
     * @returns {Promise<Object>} SMAP data with metadata
     */
    async fetchSMAPData(depth, params) {
        const dataType = depth === 'surface' ? 'SMAP_L3' : 'SMAP_L4';
        const cacheKey = this.generateCacheKey(dataType, params);

        // Check cache first
        let cachedData = this.dataCache.get(cacheKey);
        if (cachedData && !this.isExpired(cachedData)) {
            return this.addMetadata(cachedData, 'cache');
        }

        if (this.offlineMode) {
            return this.getOfflineFallback(dataType, params);
        }

        try {
            const data = await this.cropCASMAClient.fetchSMAP(depth, params);

            // Validate data quality
            const validation = this.validateDataAccuracy(data);

            // Add educational metadata
            const enrichedData = {
                ...data,
                validation,
                educational: {
                    resolution: 9000,
                    pixelSize: '9km × 9km',
                    depth: depth === 'surface' ? '0-5cm' : '0-100cm',
                    updateFrequency: depth === 'surface' ? '2-3 days' : 'Daily',
                    accuracy: validation.confidence || 0.85,
                    limitations: this.getDataLimitations('SMAP', params)
                }
            };

            // Cache the data
            this.dataCache.set(cacheKey, enrichedData);

            return enrichedData;

        } catch (error) {
            console.error(`Failed to fetch SMAP ${depth} data:`, error);

            // Try to return cached data even if expired
            cachedData = this.dataCache.get(cacheKey);
            if (cachedData) {
                return this.addMetadata(cachedData, 'stale_cache');
            }

            throw new Error(`SMAP ${depth} data unavailable: ${error.message}`);
        }
    }

    /**
     * Fetch NDVI data at specified resolution
     * @param {number} resolution - Desired resolution in meters (30, 250, 375)
     * @param {Object} params - Location and time parameters
     * @returns {Promise<Object>} NDVI data with resolution metadata
     */
    async fetchNDVI(resolution, params) {
        const dataType = this.selectNDVISource(resolution);
        const cacheKey = this.generateCacheKey(dataType, params);

        // Check cache first
        let cachedData = this.dataCache.get(cacheKey);
        if (cachedData && !this.isExpired(cachedData)) {
            return this.addMetadata(cachedData, 'cache');
        }

        if (this.offlineMode) {
            return this.getOfflineFallback(dataType, params);
        }

        try {
            let data;
            const sourceInfo = this.resolutionMap.get(dataType);

            switch (sourceInfo.source) {
                case 'appEEARS':
                    data = await this.appEEARSClient.fetchNDVI(dataType, params);
                    break;
                case 'worldview':
                    data = await this.worldviewClient.fetchImagery(dataType, params);
                    break;
                default:
                    throw new Error(`Unknown source: ${sourceInfo.source}`);
            }

            // Add resolution-specific metadata
            const enrichedData = {
                ...data,
                educational: {
                    resolution: resolution,
                    pixelSize: this.formatPixelSize(resolution),
                    source: this.getSourceName(dataType),
                    detectionCapability: this.getDetectionCapability(resolution),
                    revisitTime: this.getRevisitTime(dataType),
                    limitations: this.getDataLimitations(dataType, params)
                }
            };

            this.dataCache.set(cacheKey, enrichedData);
            return enrichedData;

        } catch (error) {
            console.error(`Failed to fetch NDVI at ${resolution}m:`, error);
            throw new Error(`NDVI data unavailable at ${resolution}m resolution: ${error.message}`);
        }
    }

    /**
     * Fetch GPM precipitation data
     * @param {Object} params - Location and time parameters
     * @returns {Promise<Object>} Precipitation data
     */
    async fetchGPMPrecipitation(params) {
        const dataType = 'GPM_PRECIPITATION';
        const cacheKey = this.generateCacheKey(dataType, params);

        let cachedData = this.dataCache.get(cacheKey);
        if (cachedData && !this.isExpired(cachedData)) {
            return this.addMetadata(cachedData, 'cache');
        }

        if (this.offlineMode) {
            return this.getOfflineFallback(dataType, params);
        }

        try {
            const data = await this.appEEARSClient.fetchGPM(params);

            const enrichedData = {
                ...data,
                educational: {
                    resolution: 11000,
                    pixelSize: '11km × 11km',
                    source: 'GPM (Global Precipitation Measurement)',
                    updateFrequency: '30 minutes',
                    limitations: this.getDataLimitations('GPM', params)
                }
            };

            this.dataCache.set(cacheKey, enrichedData);
            return enrichedData;

        } catch (error) {
            console.error('Failed to fetch GPM precipitation:', error);
            throw new Error(`Precipitation data unavailable: ${error.message}`);
        }
    }

    /**
     * Get data at specific resolution with automatic source selection
     * @param {string} type - Data type (ndvi, moisture, precipitation)
     * @param {number} resolution - Desired resolution in meters
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Data with resolution metadata
     */
    async getDataAtResolution(type, resolution, params) {
        switch (type.toLowerCase()) {
            case 'ndvi':
                return await this.fetchNDVI(resolution, params);
            case 'moisture':
                // For moisture, resolution is fixed at 9km, but we can specify depth
                const depth = params.depth || 'surface';
                return await this.fetchSMAPData(depth, params);
            case 'precipitation':
                return await this.fetchGPMPrecipitation(params);
            default:
                throw new Error(`Unknown data type: ${type}`);
        }
    }

    /**
     * Validate data accuracy and completeness
     * @param {Object} data - Data to validate
     * @returns {Object} Validation results
     */
    validateDataAccuracy(data) {
        const validation = {
            isValid: true,
            confidence: 1.0,
            issues: [],
            limitations: []
        };

        if (!data || !data.values) {
            validation.isValid = false;
            validation.issues.push('No data values present');
            return validation;
        }

        // Check data completeness
        const validValues = data.values.filter(v => v !== null && v !== undefined && !isNaN(v));
        const completeness = validValues.length / data.values.length;

        if (completeness < 0.8) {
            validation.confidence *= 0.7;
            validation.issues.push(`Low data completeness: ${Math.round(completeness * 100)}%`);
        }

        // Check timestamp freshness
        if (data.timestamp) {
            const age = Date.now() - new Date(data.timestamp).getTime();
            if (age > this.qualityThresholds.maxTimeDelta) {
                validation.confidence *= 0.8;
                validation.issues.push(`Data is ${Math.round(age / (24 * 60 * 60 * 1000))} days old`);
            }
        }

        // Check spatial accuracy
        if (data.spatialAccuracy && data.spatialAccuracy < this.qualityThresholds.spatialAccuracy) {
            validation.confidence *= data.spatialAccuracy;
            validation.issues.push('Lower spatial accuracy than optimal');
        }

        // Set final confidence
        validation.confidence = Math.max(0.1, validation.confidence);

        return validation;
    }

    /**
     * Explain data limitations for educational purposes
     * @param {Object} data - Data object
     * @returns {string[]} Array of limitation explanations
     */
    explainDataLimitations(data) {
        const limitations = [];

        if (data.educational && data.educational.resolution) {
            const resolution = data.educational.resolution;

            if (resolution >= 9000) {
                limitations.push('Large pixel size (9-11km) averages conditions over vast areas');
                limitations.push('Cannot detect features smaller than several kilometers');
                limitations.push('Useful for regional trends but not field-level precision');
            } else if (resolution >= 250) {
                limitations.push('Medium resolution can detect field boundaries but not within-field variation');
                limitations.push('Good for monitoring large agricultural areas');
            } else {
                limitations.push('High resolution shows detailed patterns but covers smaller areas');
                limitations.push('Requires more data storage and processing');
            }
        }

        if (data.educational && data.educational.depth) {
            const depth = data.educational.depth;
            if (depth === '0-5cm') {
                limitations.push('Surface moisture may not reflect root zone conditions');
                limitations.push('Can be misleading for deep-rooted crops');
            } else if (depth === '0-100cm') {
                limitations.push('Root zone average may mask surface drying');
                limitations.push('Best for understanding overall plant water stress');
            }
        }

        return limitations;
    }

    /**
     * Select appropriate NDVI data source based on resolution
     * @param {number} resolution - Desired resolution in meters
     * @returns {string} Data type identifier
     */
    selectNDVISource(resolution) {
        if (resolution <= 30) return 'LANDSAT_NDVI';
        if (resolution <= 250) return 'MODIS_NDVI';
        if (resolution <= 375) return 'VIIRS_NDVI';
        throw new Error(`No NDVI source available for ${resolution}m resolution`);
    }

    /**
     * Get detection capability description for resolution
     * @param {number} resolution - Resolution in meters
     * @returns {string[]} Capabilities description
     */
    getDetectionCapability(resolution) {
        if (resolution <= 30) {
            return [
                'Individual trees and farm equipment',
                'Small field boundaries and paths',
                'Detailed crop health variations',
                'Infrastructure and buildings'
            ];
        } else if (resolution <= 250) {
            return [
                'Field boundaries for large fields',
                'General crop health patterns',
                'Large water bodies and forests',
                'Major infrastructure'
            ];
        } else if (resolution <= 1000) {
            return [
                'Large agricultural regions',
                'Major landscape features',
                'Regional vegetation patterns',
                'Large urban areas'
            ];
        } else {
            return [
                'Continental-scale patterns',
                'Regional climate effects',
                'Major biome boundaries',
                'Global trends only'
            ];
        }
    }

    /**
     * Format pixel size for display
     * @param {number} resolution - Resolution in meters
     * @returns {string} Formatted pixel size
     */
    formatPixelSize(resolution) {
        if (resolution >= 1000) {
            return `${resolution / 1000}km × ${resolution / 1000}km`;
        } else {
            return `${resolution}m × ${resolution}m`;
        }
    }

    /**
     * Get source name for display
     * @param {string} dataType - Data type identifier
     * @returns {string} Human-readable source name
     */
    getSourceName(dataType) {
        const sources = {
            'LANDSAT_NDVI': 'Landsat 8/9',
            'MODIS_NDVI': 'MODIS Terra/Aqua',
            'VIIRS_NDVI': 'VIIRS (Suomi NPP)',
            'SMAP_L3': 'SMAP Level 3',
            'SMAP_L4': 'SMAP Level 4',
            'GPM_PRECIPITATION': 'GPM'
        };
        return sources[dataType] || dataType;
    }

    /**
     * Get revisit time for data source
     * @param {string} dataType - Data type identifier
     * @returns {string} Revisit frequency
     */
    getRevisitTime(dataType) {
        const revisitTimes = {
            'LANDSAT_NDVI': '16 days',
            'MODIS_NDVI': '1-2 days',
            'VIIRS_NDVI': 'Daily',
            'SMAP_L3': '2-3 days',
            'SMAP_L4': 'Daily',
            'GPM_PRECIPITATION': '30 minutes'
        };
        return revisitTimes[dataType] || 'Variable';
    }

    /**
     * Get data limitations for specific type and parameters
     * @param {string} dataType - Data type
     * @param {Object} params - Request parameters
     * @returns {string[]} Limitations array
     */
    getDataLimitations(dataType, params) {
        const limitations = [];

        if (dataType.includes('SMAP')) {
            limitations.push('Cannot penetrate through dense vegetation');
            limitations.push('Less accurate over frozen or snow-covered ground');
            limitations.push('9km resolution averages over large areas');
        }

        if (dataType.includes('NDVI') || dataType.includes('LANDSAT') || dataType.includes('MODIS')) {
            limitations.push('Affected by cloud cover');
            limitations.push('May show atmospheric interference');
            if (params && params.cloudCover > 0.3) {
                limitations.push('High cloud cover may affect data quality');
            }
        }

        return limitations;
    }

    /**
     * Generate cache key for data request
     * @param {string} dataType - Data type
     * @param {Object} params - Request parameters
     * @returns {string} Cache key
     */
    generateCacheKey(dataType, params) {
        const keyParams = {
            type: dataType,
            lat: params.latitude?.toFixed(3),
            lng: params.longitude?.toFixed(3),
            date: params.date,
            depth: params.depth
        };
        return JSON.stringify(keyParams);
    }

    /**
     * Check if cached data is expired
     * @param {Object} data - Cached data
     * @returns {boolean} True if expired
     */
    isExpired(data) {
        if (!data.cachedAt) return true;
        const maxAge = 60 * 60 * 1000; // 1 hour
        return Date.now() - data.cachedAt > maxAge;
    }

    /**
     * Add metadata to data
     * @param {Object} data - Data object
     * @param {string} source - Source type
     * @returns {Object} Data with metadata
     */
    addMetadata(data, source) {
        return {
            ...data,
            metadata: {
                source,
                retrievedAt: Date.now(),
                cached: source.includes('cache')
            }
        };
    }

    /**
     * Get offline fallback data
     * @param {string} dataType - Data type
     * @param {Object} params - Parameters
     * @returns {Object} Fallback data
     */
    getOfflineFallback(dataType, params) {
        // Return cached data or synthetic data for offline mode
        const fallback = {
            values: [0.3], // Generic reasonable value
            timestamp: new Date().toISOString(),
            offline: true,
            educational: {
                resolution: this.resolutionMap.get(dataType)?.resolution || 1000,
                note: 'Offline mode - using cached or sample data'
            }
        };

        return fallback;
    }

    /**
     * Get cached data for request
     * @param {Object} params - Request parameters
     * @returns {Object|null} Cached data or null
     */
    async getCachedData(params) {
        // Implementation for getting cached data
        const cacheKey = this.generateCacheKey('GENERIC', params);
        return this.dataCache.get(cacheKey);
    }

    /**
     * Sync offline data when connection restored
     * @param {Array} offlineChanges - Array of offline changes
     * @returns {Promise<void>}
     */
    async syncData(offlineChanges) {
        // Implementation for syncing offline changes
        console.log('Syncing offline changes:', offlineChanges.length);
        // Process each change...
    }

    /**
     * Update method called by GameEngine
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Process any queued requests
        if (!this.isProcessingQueue && this.requestQueue.length > 0) {
            this.processRequestQueue();
        }

        // Clean up expired cache entries
        if (Math.random() < 0.01) { // 1% chance per update
            this.dataCache.cleanup();
        }
    }

    /**
     * Process queued data requests
     */
    async processRequestQueue() {
        if (this.requestQueue.length === 0) return;

        this.isProcessingQueue = true;

        try {
            const request = this.requestQueue.shift();
            await request.execute();
        } catch (error) {
            console.error('Error processing queued request:', error);
        } finally {
            this.isProcessingQueue = false;
        }
    }
}

export { NASADataIntegrator };