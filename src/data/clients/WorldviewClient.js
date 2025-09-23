/**
 * NASA Farm Navigators - Worldview Client
 * Interface for NASA Worldview GIBS (Global Imagery Browse Services)
 * Handles satellite imagery and visualization layers
 */

class WorldviewClient {
    constructor() {
        this.baseUrl = 'https://gibs.earthdata.nasa.gov';
        this.wmtsUrl = `${this.baseUrl}/wmts/epsg4326/best`;
        this.metadataUrl = 'https://worldview.earthdata.nasa.gov/config';

        // Available layers for different data types
        this.layers = {
            'VIIRS_NDVI': {
                layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
                resolution: 375,
                format: 'image/jpeg',
                description: 'VIIRS True Color imagery'
            },
            'MODIS_IMAGERY': {
                layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
                resolution: 250,
                format: 'image/jpeg',
                description: 'MODIS Terra True Color'
            },
            'LANDSAT_IMAGERY': {
                layer: 'Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual',
                resolution: 30,
                format: 'image/png',
                description: 'Landsat Annual True Color Composite'
            }
        };
    }

    /**
     * Fetch satellite imagery for visualization
     * @param {string} dataType - Type of imagery to fetch
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Imagery data
     */
    async fetchImagery(dataType, params) {
        const layerConfig = this.layers[dataType];
        if (!layerConfig) {
            throw new Error(`Unknown imagery type: ${dataType}`);
        }

        try {
            // Get tile for the specified location
            const tileInfo = this.calculateTileCoordinates(
                params.latitude,
                params.longitude,
                params.zoomLevel || 10
            );

            const imageUrl = this.buildImageUrl(layerConfig, tileInfo, params.date);

            // Fetch the actual image
            const imageData = await this.fetchImage(imageUrl);

            return {
                type: 'imagery',
                source: dataType,
                resolution: layerConfig.resolution,
                url: imageUrl,
                data: imageData,
                location: {
                    latitude: params.latitude,
                    longitude: params.longitude
                },
                timestamp: params.date || new Date().toISOString().split('T')[0],
                educational: {
                    pixelSize: this.formatPixelSize(layerConfig.resolution),
                    description: layerConfig.description,
                    note: 'Visual imagery for context and validation of data products'
                }
            };

        } catch (error) {
            console.error(`Worldview imagery fetch failed:`, error);
            throw new Error(`Failed to fetch ${dataType} imagery: ${error.message}`);
        }
    }

    /**
     * Build WMTS URL for image tile
     * @param {Object} layerConfig - Layer configuration
     * @param {Object} tileInfo - Tile coordinates
     * @param {string} date - Date string
     * @returns {string} WMTS URL
     */
    buildImageUrl(layerConfig, tileInfo, date) {
        const dateString = date || this.getLatestAvailableDate();

        return `${this.wmtsUrl}/${layerConfig.layer}/default/${dateString}/GoogleMapsCompatible_Level9/${tileInfo.z}/${tileInfo.y}/${tileInfo.x}.${this.getFileExtension(layerConfig.format)}`;
    }

    /**
     * Calculate tile coordinates from lat/lon
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {number} zoom - Zoom level
     * @returns {Object} Tile coordinates
     */
    calculateTileCoordinates(lat, lon, zoom) {
        const latRad = lat * Math.PI / 180;
        const n = Math.pow(2, zoom);

        const x = Math.floor((lon + 180) / 360 * n);
        const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);

        return { x, y, z: zoom };
    }

    /**
     * Fetch image data from URL
     * @param {string} url - Image URL
     * @returns {Promise<Object>} Image data
     */
    async fetchImage(url) {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'NASA-Farm-Navigators/2.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Image fetch failed: ${response.status} ${response.statusText}`);
        }

        // Return blob data for image
        const blob = await response.blob();

        return {
            blob: blob,
            url: url,
            size: blob.size,
            type: blob.type
        };
    }

    /**
     * Get available layers for a specific date
     * @param {string} date - Date string (YYYY-MM-DD)
     * @returns {Promise<Array>} Available layers
     */
    async getAvailableLayers(date) {
        try {
            const response = await fetch(`${this.metadataUrl}/wv.json`);
            const config = await response.json();

            const availableLayers = [];

            for (const [layerId, layerInfo] of Object.entries(config.layers)) {
                if (this.isLayerAvailableOnDate(layerInfo, date)) {
                    availableLayers.push({
                        id: layerId,
                        title: layerInfo.title,
                        description: layerInfo.description,
                        resolution: layerInfo.resolution || 'Variable',
                        temporal: layerInfo.temporal || false
                    });
                }
            }

            return availableLayers;

        } catch (error) {
            console.error('Failed to get available layers:', error);
            return Object.keys(this.layers).map(key => ({
                id: key,
                title: this.layers[key].description,
                description: this.layers[key].description,
                resolution: this.layers[key].resolution
            }));
        }
    }

    /**
     * Check if layer is available on specific date
     * @param {Object} layerInfo - Layer metadata
     * @param {string} date - Date string
     * @returns {boolean} True if available
     */
    isLayerAvailableOnDate(layerInfo, date) {
        if (!layerInfo.temporal) return true;

        const targetDate = new Date(date);
        const startDate = layerInfo.startDate ? new Date(layerInfo.startDate) : new Date('2000-01-01');
        const endDate = layerInfo.endDate ? new Date(layerInfo.endDate) : new Date();

        return targetDate >= startDate && targetDate <= endDate;
    }

    /**
     * Get the latest available date for imagery
     * @returns {string} Date string (YYYY-MM-DD)
     */
    getLatestAvailableDate() {
        // Most satellite imagery has 1-2 day delay
        const date = new Date();
        date.setDate(date.getDate() - 2);
        return date.toISOString().split('T')[0];
    }

    /**
     * Get file extension from MIME type
     * @param {string} format - MIME type
     * @returns {string} File extension
     */
    getFileExtension(format) {
        const extensions = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/tiff': 'tif'
        };
        return extensions[format] || 'jpg';
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
     * Get imagery comparison for resolution education
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} date - Date string
     * @returns {Promise<Object>} Comparison imagery
     */
    async getResolutionComparison(lat, lon, date) {
        const comparisons = [];

        // Fetch imagery at different resolutions
        for (const [type, config] of Object.entries(this.layers)) {
            try {
                const imagery = await this.fetchImagery(type, {
                    latitude: lat,
                    longitude: lon,
                    date: date
                });

                comparisons.push({
                    type: type,
                    resolution: config.resolution,
                    data: imagery,
                    detectionCapability: this.getDetectionCapability(config.resolution)
                });

            } catch (error) {
                console.warn(`Failed to fetch ${type} for comparison:`, error);
            }
        }

        // Sort by resolution (highest first)
        comparisons.sort((a, b) => a.resolution - b.resolution);

        return {
            location: { latitude: lat, longitude: lon },
            date: date,
            comparisons: comparisons,
            educational: {
                purpose: 'Compare how different satellite resolutions show the same area',
                instructions: 'Notice how higher resolution shows more detail but covers smaller areas'
            }
        };
    }

    /**
     * Get detection capability for resolution
     * @param {number} resolution - Resolution in meters
     * @returns {Array} Detection capabilities
     */
    getDetectionCapability(resolution) {
        if (resolution <= 30) {
            return [
                'Individual trees',
                'Small buildings',
                'Farm equipment',
                'Field boundaries',
                'Roads and paths'
            ];
        } else if (resolution <= 250) {
            return [
                'Large buildings',
                'Field patterns',
                'Water bodies',
                'Forest boundaries',
                'Major roads'
            ];
        } else {
            return [
                'Large landscape features',
                'Major water bodies',
                'City boundaries',
                'Regional patterns',
                'Cloud formations'
            ];
        }
    }

    /**
     * Create animated time series imagery
     * @param {Object} params - Animation parameters
     * @returns {Promise<Object>} Animation data
     */
    async createTimeSeries(params) {
        const frames = [];
        const startDate = new Date(params.startDate);
        const endDate = new Date(params.endDate);
        const dayIncrement = params.dayIncrement || 7; // Weekly by default

        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0];

            try {
                const imagery = await this.fetchImagery(params.dataType, {
                    latitude: params.latitude,
                    longitude: params.longitude,
                    date: dateString,
                    zoomLevel: params.zoomLevel || 10
                });

                frames.push({
                    date: dateString,
                    imagery: imagery
                });

            } catch (error) {
                console.warn(`Failed to fetch imagery for ${dateString}:`, error);
            }

            currentDate.setDate(currentDate.getDate() + dayIncrement);
        }

        return {
            type: 'time_series',
            location: {
                latitude: params.latitude,
                longitude: params.longitude
            },
            timeRange: {
                start: params.startDate,
                end: params.endDate
            },
            frames: frames,
            educational: {
                purpose: 'Show how satellite imagery changes over time',
                applications: 'Crop growth monitoring, seasonal changes, disaster response'
            }
        };
    }
}

export { WorldviewClient };