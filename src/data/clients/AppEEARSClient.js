/**
 * NASA Farm Navigators - AppEEARS Client
 * Interface for NASA AppEEARS (Application for Extracting and Exploring Analysis Ready Samples)
 * Handles Landsat, MODIS, and other satellite data requests
 */

class AppEEARSClient {
    constructor(earthdataAuth) {
        this.earthdataAuth = earthdataAuth;
        this.baseUrl = 'https://lpdaacsvc.cr.usgs.gov/appeears/api';
        this.requestQueue = [];
        this.rateLimiter = {
            requests: 0,
            resetTime: Date.now() + 60000, // Reset every minute
            maxRequests: 100 // Max requests per minute
        };
    }

    /**
     * Fetch NDVI data from Landsat or MODIS
     * @param {string} dataType - 'LANDSAT_NDVI' or 'MODIS_NDVI'
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} NDVI data
     */
    async fetchNDVI(dataType, params) {
        const product = this.getProductForDataType(dataType);
        const layer = this.getLayerForDataType(dataType);

        const requestData = {
            task_type: 'point',
            task_name: `farm_navigator_${Date.now()}`,
            params: {
                dates: this.formatDateRange(params.startDate, params.endDate),
                layers: [{
                    product: product,
                    layer: layer
                }],
                coordinates: [{
                    latitude: params.latitude,
                    longitude: params.longitude,
                    id: 'farm_point'
                }]
            }
        };

        try {
            // Submit task
            const taskId = await this.submitTask(requestData);

            // Wait for completion
            const result = await this.waitForTask(taskId);

            // Process and return data
            return this.processNDVIData(result, dataType);

        } catch (error) {
            console.error(`AppEEARS NDVI fetch failed:`, error);
            throw new Error(`Failed to fetch ${dataType}: ${error.message}`);
        }
    }

    /**
     * Fetch GPM precipitation data
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Precipitation data
     */
    async fetchGPM(params) {
        const requestData = {
            task_type: 'point',
            task_name: `gpm_request_${Date.now()}`,
            params: {
                dates: this.formatDateRange(params.startDate, params.endDate),
                layers: [{
                    product: 'GPM_3IMERGDF_06',
                    layer: 'precipitationCal'
                }],
                coordinates: [{
                    latitude: params.latitude,
                    longitude: params.longitude,
                    id: 'precip_point'
                }]
            }
        };

        try {
            const taskId = await this.submitTask(requestData);
            const result = await this.waitForTask(taskId);
            return this.processPrecipitationData(result);

        } catch (error) {
            console.error('AppEEARS GPM fetch failed:', error);
            throw new Error(`Failed to fetch precipitation data: ${error.message}`);
        }
    }

    /**
     * Submit task to AppEEARS
     * @param {Object} requestData - Task request data
     * @returns {Promise<string>} Task ID
     */
    async submitTask(requestData) {
        await this.checkRateLimit();

        const response = await this.earthdataAuth.authenticatedRequest(
            `${this.baseUrl}/task`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Task submission failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return result.task_id;
    }

    /**
     * Wait for task completion
     * @param {string} taskId - Task ID to monitor
     * @returns {Promise<Object>} Task result
     */
    async waitForTask(taskId, maxWaitTime = 300000) { // 5 minutes max
        const startTime = Date.now();
        const pollInterval = 5000; // Poll every 5 seconds

        while (Date.now() - startTime < maxWaitTime) {
            const status = await this.getTaskStatus(taskId);

            if (status.status === 'done') {
                return await this.getTaskResult(taskId);
            } else if (status.status === 'error') {
                throw new Error(`Task failed: ${status.message || 'Unknown error'}`);
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error('Task timeout - AppEEARS request took too long');
    }

    /**
     * Get task status
     * @param {string} taskId - Task ID
     * @returns {Promise<Object>} Task status
     */
    async getTaskStatus(taskId) {
        const response = await this.earthdataAuth.authenticatedRequest(
            `${this.baseUrl}/task/${taskId}`
        );

        if (!response.ok) {
            throw new Error(`Failed to get task status: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Get task result data
     * @param {string} taskId - Task ID
     * @returns {Promise<Object>} Task result data
     */
    async getTaskResult(taskId) {
        const response = await this.earthdataAuth.authenticatedRequest(
            `${this.baseUrl}/bundle/${taskId}`
        );

        if (!response.ok) {
            throw new Error(`Failed to get task result: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Process NDVI data response
     * @param {Object} result - Raw AppEEARS result
     * @param {string} dataType - Data type identifier
     * @returns {Object} Processed NDVI data
     */
    processNDVIData(result, dataType) {
        const resolution = this.getResolutionForDataType(dataType);

        // Extract NDVI values from result
        const ndviValues = this.extractValuesFromResult(result, 'NDVI');

        // Calculate statistics
        const validValues = ndviValues.filter(v => v !== null && v !== -3000); // -3000 is fill value
        const mean = validValues.length > 0 ? validValues.reduce((a, b) => a + b) / validValues.length : null;

        return {
            type: 'NDVI',
            source: dataType,
            resolution: resolution,
            values: ndviValues,
            statistics: {
                mean: mean ? mean / 10000 : null, // Convert from scaled integer
                count: validValues.length,
                validPixels: validValues.length,
                totalPixels: ndviValues.length
            },
            timestamp: new Date().toISOString(),
            location: {
                latitude: result.coordinates?.[0]?.latitude,
                longitude: result.coordinates?.[0]?.longitude
            }
        };
    }

    /**
     * Process precipitation data response
     * @param {Object} result - Raw AppEEARS result
     * @returns {Object} Processed precipitation data
     */
    processPrecipitationData(result) {
        const precipValues = this.extractValuesFromResult(result, 'precipitation');

        // Calculate total precipitation
        const validValues = precipValues.filter(v => v !== null && v >= 0);
        const total = validValues.reduce((a, b) => a + b, 0);

        return {
            type: 'precipitation',
            source: 'GPM',
            resolution: 11000,
            values: precipValues,
            statistics: {
                total: total,
                daily_average: validValues.length > 0 ? total / validValues.length : 0,
                max_daily: Math.max(...validValues),
                days_with_rain: validValues.filter(v => v > 0.1).length
            },
            timestamp: new Date().toISOString(),
            location: {
                latitude: result.coordinates?.[0]?.latitude,
                longitude: result.coordinates?.[0]?.longitude
            }
        };
    }

    /**
     * Extract values from AppEEARS result
     * @param {Object} result - AppEEARS result
     * @param {string} variable - Variable name to extract
     * @returns {Array} Array of values
     */
    extractValuesFromResult(result, variable) {
        if (!result.files || result.files.length === 0) {
            return [];
        }

        // Find the CSV file with our data
        const csvFile = result.files.find(file =>
            file.file_name.includes('.csv') &&
            file.file_name.includes(variable)
        );

        if (!csvFile || !csvFile.content) {
            return [];
        }

        // Parse CSV content (simplified)
        const lines = csvFile.content.split('\n');
        const values = [];

        for (let i = 1; i < lines.length; i++) { // Skip header
            const parts = lines[i].split(',');
            if (parts.length > 2) {
                const value = parseFloat(parts[2]); // Assuming value is in 3rd column
                values.push(isNaN(value) ? null : value);
            }
        }

        return values;
    }

    /**
     * Get product name for data type
     * @param {string} dataType - Data type identifier
     * @returns {string} AppEEARS product name
     */
    getProductForDataType(dataType) {
        const products = {
            'LANDSAT_NDVI': 'HLSL30_015',
            'MODIS_NDVI': 'MOD13Q1_061'
        };
        return products[dataType] || products['MODIS_NDVI'];
    }

    /**
     * Get layer name for data type
     * @param {string} dataType - Data type identifier
     * @returns {string} Layer name
     */
    getLayerForDataType(dataType) {
        const layers = {
            'LANDSAT_NDVI': 'NDVI',
            'MODIS_NDVI': '250m_16_days_NDVI'
        };
        return layers[dataType] || layers['MODIS_NDVI'];
    }

    /**
     * Get resolution for data type
     * @param {string} dataType - Data type identifier
     * @returns {number} Resolution in meters
     */
    getResolutionForDataType(dataType) {
        const resolutions = {
            'LANDSAT_NDVI': 30,
            'MODIS_NDVI': 250
        };
        return resolutions[dataType] || 250;
    }

    /**
     * Format date range for AppEEARS
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Array} Date range array
     */
    formatDateRange(startDate, endDate) {
        return [
            {
                startDate: startDate || this.getDefaultStartDate(),
                endDate: endDate || this.getDefaultEndDate()
            }
        ];
    }

    /**
     * Get default start date (30 days ago)
     * @returns {string} Date string
     */
    getDefaultStartDate() {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    }

    /**
     * Get default end date (today)
     * @returns {string} Date string
     */
    getDefaultEndDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Check rate limiting
     * @returns {Promise<void>}
     */
    async checkRateLimit() {
        const now = Date.now();

        // Reset counter if minute has passed
        if (now >= this.rateLimiter.resetTime) {
            this.rateLimiter.requests = 0;
            this.rateLimiter.resetTime = now + 60000;
        }

        // Check if we're at the limit
        if (this.rateLimiter.requests >= this.rateLimiter.maxRequests) {
            const waitTime = this.rateLimiter.resetTime - now;
            console.log(`Rate limit reached, waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));

            // Reset after wait
            this.rateLimiter.requests = 0;
            this.rateLimiter.resetTime = Date.now() + 60000;
        }

        this.rateLimiter.requests++;
    }

    /**
     * Get available products
     * @returns {Promise<Array>} Available products list
     */
    async getAvailableProducts() {
        const response = await this.earthdataAuth.authenticatedRequest(
            `${this.baseUrl}/product`
        );

        if (!response.ok) {
            throw new Error(`Failed to get products: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Get layers for a product
     * @param {string} product - Product name
     * @returns {Promise<Array>} Available layers
     */
    async getProductLayers(product) {
        const response = await this.earthdataAuth.authenticatedRequest(
            `${this.baseUrl}/product/${product}`
        );

        if (!response.ok) {
            throw new Error(`Failed to get product layers: ${response.status}`);
        }

        const result = await response.json();
        return result.layers || [];
    }
}

export { AppEEARSClient };