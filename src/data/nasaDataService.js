class NASADataService {
    constructor() {
        this.baseURL = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/';
        this.apiKey = null; // NASA APIs are typically free but may require registration
        this.cache = new Map();
        this.isOnline = navigator.onLine;

        this.mockDataEnabled = true; // Enable mock data for demo purposes

        this.setupOfflineSupport();
    }

    setupOfflineSupport() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('NASA Data Service: Back online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('NASA Data Service: Offline mode - using cached data');
        });
    }

    async fetchNDVIData(coordinates, dateRange) {
        const cacheKey = `ndvi_${coordinates.lat}_${coordinates.lng}_${dateRange.start}_${dateRange.end}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            console.log('Returning cached NDVI data');
            return this.cache.get(cacheKey);
        }

        if (this.mockDataEnabled || !this.isOnline) {
            return this.generateMockNDVIData(coordinates, dateRange);
        }

        try {
            const response = await this.fetchRealNDVIData(coordinates, dateRange);
            this.cache.set(cacheKey, response);
            return response;
        } catch (error) {
            console.warn('Failed to fetch real NDVI data, using mock data:', error);
            return this.generateMockNDVIData(coordinates, dateRange);
        }
    }

    async fetchSoilMoistureData(coordinates, dateRange) {
        const cacheKey = `smap_${coordinates.lat}_${coordinates.lng}_${dateRange.start}_${dateRange.end}`;

        if (this.cache.has(cacheKey)) {
            console.log('Returning cached SMAP data');
            return this.cache.get(cacheKey);
        }

        if (this.mockDataEnabled || !this.isOnline) {
            return this.generateMockSMAPData(coordinates, dateRange);
        }

        try {
            const response = await this.fetchRealSMAPData(coordinates, dateRange);
            this.cache.set(cacheKey, response);
            return response;
        } catch (error) {
            console.warn('Failed to fetch real SMAP data, using mock data:', error);
            return this.generateMockSMAPData(coordinates, dateRange);
        }
    }

    async fetchPrecipitationData(coordinates, dateRange) {
        const cacheKey = `gpm_${coordinates.lat}_${coordinates.lng}_${dateRange.start}_${dateRange.end}`;

        if (this.cache.has(cacheKey)) {
            console.log('Returning cached GPM data');
            return this.cache.get(cacheKey);
        }

        if (this.mockDataEnabled || !this.isOnline) {
            return this.generateMockGPMData(coordinates, dateRange);
        }

        try {
            const response = await this.fetchRealGPMData(coordinates, dateRange);
            this.cache.set(cacheKey, response);
            return response;
        } catch (error) {
            console.warn('Failed to fetch real GPM data, using mock data:', error);
            return this.generateMockGPMData(coordinates, dateRange);
        }
    }

    async fetchRealNDVIData(coordinates, dateRange) {
        // This would be the actual implementation for NASA GIBS/CMR APIs
        const params = new URLSearchParams({
            SERVICE: 'WMTS',
            REQUEST: 'GetTile',
            VERSION: '1.0.0',
            LAYER: 'MODIS_Terra_NDVI_8Day',
            STYLE: 'default',
            TILEMATRIXSET: 'EPSG4326_250m',
            FORMAT: 'image/png',
            TILEMATRIX: '5',
            TILEROW: this.calculateTileRow(coordinates.lat),
            TILECOL: this.calculateTileCol(coordinates.lng),
            TIME: dateRange.start
        });

        const url = `${this.baseURL}?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NASA API request failed: ${response.statusText}`);
        }

        return await this.processNDVIResponse(response);
    }

    async fetchRealSMAPData(coordinates, dateRange) {
        // SMAP data would come from NASA EARTHDATA
        // This is a placeholder for actual API implementation
        const earthdataURL = 'https://n5eil01u.ecs.nsidc.org/SMAP/';
        // Implementation would depend on specific SMAP data product
        throw new Error('Real SMAP API not implemented in demo');
    }

    async fetchRealGPMData(coordinates, dateRange) {
        // GPM data would come from NASA Precipitation Measurement
        const gpmURL = 'https://gpm.nasa.gov/data-access/';
        // Implementation would depend on specific GPM data product
        throw new Error('Real GPM API not implemented in demo');
    }

    generateMockNDVIData(coordinates, dateRange) {
        console.log('Generating mock NDVI data for demo');

        const data = {
            source: 'MODIS Terra NDVI (Mock Data)',
            coordinates: coordinates,
            dateRange: dateRange,
            resolution: '250m',
            values: []
        };

        // Generate realistic NDVI values for Arizona farmland
        const baseNDVI = 0.4; // Base value for agricultural land
        const seasonalVariation = this.calculateSeasonalVariation(new Date(dateRange.start));

        // Generate grid of NDVI values
        for (let i = 0; i < 100; i++) { // 10x10 grid
            const noise = (Math.random() - 0.5) * 0.2;
            const stressPattern = this.addStressPattern(i);
            let ndvi = baseNDVI + seasonalVariation + noise + stressPattern;

            // Clamp to valid NDVI range
            ndvi = Math.max(-1, Math.min(1, ndvi));

            data.values.push({
                index: i,
                ndvi: ndvi,
                quality: 'good',
                timestamp: dateRange.start
            });
        }

        return Promise.resolve(data);
    }

    generateMockSMAPData(coordinates, dateRange) {
        console.log('Generating mock SMAP data for demo');

        const data = {
            source: 'SMAP L3 Soil Moisture (Mock Data)',
            coordinates: coordinates,
            dateRange: dateRange,
            resolution: '36km',
            values: []
        };

        const baseMoisture = 0.25; // Base soil moisture for Arizona
        const seasonalVariation = this.calculateMoistureVariation(new Date(dateRange.start));

        for (let i = 0; i < 100; i++) {
            const noise = (Math.random() - 0.5) * 0.1;
            const drainagePattern = this.addDrainagePattern(i);
            let moisture = baseMoisture + seasonalVariation + noise + drainagePattern;

            moisture = Math.max(0, Math.min(0.6, moisture)); // Realistic range for semi-arid

            data.values.push({
                index: i,
                soilMoisture: moisture,
                temperature: 25 + Math.random() * 15, // Celsius
                quality: 'good',
                timestamp: dateRange.start
            });
        }

        return Promise.resolve(data);
    }

    generateMockGPMData(coordinates, dateRange) {
        console.log('Generating mock GPM data for demo');

        const data = {
            source: 'GPM IMERG Final (Mock Data)',
            coordinates: coordinates,
            dateRange: dateRange,
            resolution: '0.1° x 0.1°',
            forecast: []
        };

        // Generate 7-day precipitation forecast
        const currentDate = new Date(dateRange.start);
        for (let day = 0; day < 7; day++) {
            const date = new Date(currentDate);
            date.setDate(date.getDate() + day);

            // Arizona precipitation patterns (generally low with occasional storms)
            let precipitation = 0;
            if (Math.random() < 0.3) { // 30% chance of precipitation
                precipitation = Math.random() * 2; // 0-2 inches
            }

            data.forecast.push({
                date: date.toISOString().split('T')[0],
                precipitation: precipitation,
                probability: Math.random() * 100,
                temperature: {
                    high: 85 + Math.random() * 20,
                    low: 65 + Math.random() * 15
                }
            });
        }

        return Promise.resolve(data);
    }

    calculateSeasonalVariation(date) {
        const dayOfYear = this.getDayOfYear(date);
        const growingSeason = Math.sin((dayOfYear - 80) * Math.PI / 180); // Peak around day 170 (June)
        return growingSeason * 0.3; // Max variation of 0.3 NDVI units
    }

    calculateMoistureVariation(date) {
        const dayOfYear = this.getDayOfYear(date);
        const dryness = Math.cos((dayOfYear - 150) * Math.PI / 180); // Driest around day 240 (late summer)
        return dryness * -0.1; // Reduce moisture during dry season
    }

    addStressPattern(index) {
        // Simulate some zones being more stressed than others
        const row = Math.floor(index / 10);
        const col = index % 10;

        // Create stress patterns (lower NDVI in certain areas)
        if ((row >= 3 && row <= 6) && (col >= 2 && col <= 5)) {
            return -0.15; // Stressed zone in middle
        }

        if (row === 0 || row === 9 || col === 0 || col === 9) {
            return -0.05; // Edge effects
        }

        return 0;
    }

    addDrainagePattern(index) {
        // Simulate drainage patterns affecting soil moisture
        const row = Math.floor(index / 10);
        const col = index % 10;

        // Lower areas retain more moisture
        if ((row >= 6 && row <= 8) && (col >= 3 && col <= 7)) {
            return 0.1; // Depression area with better moisture
        }

        // Higher areas drain faster
        if ((row <= 2) || (col <= 1) || (col >= 8)) {
            return -0.05; // Higher/edge areas drain more
        }

        return 0;
    }

    calculateTileRow(lat) {
        // Convert latitude to WMTS tile row
        return Math.floor((90 - lat) / 0.5);
    }

    calculateTileCol(lng) {
        // Convert longitude to WMTS tile column
        return Math.floor((lng + 180) / 0.5);
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    async processNDVIResponse(response) {
        // Process the actual NASA response
        // This would involve parsing the image data or JSON response
        const blob = await response.blob();
        return {
            imageData: blob,
            metadata: {
                source: 'NASA MODIS',
                timestamp: new Date().toISOString()
            }
        };
    }

    // Utility methods for data integration
    interpolateData(data, targetResolution) {
        // Interpolate satellite data to match game grid resolution
        return data; // Placeholder implementation
    }

    validateData(data) {
        // Validate data quality and completeness
        return data.values && data.values.length > 0;
    }

    // Public API methods
    async getLatestData(coordinates) {
        const dateRange = {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        };

        const [ndviData, smapData, gpmData] = await Promise.all([
            this.fetchNDVIData(coordinates, dateRange),
            this.fetchSoilMoistureData(coordinates, dateRange),
            this.fetchPrecipitationData(coordinates, dateRange)
        ]);

        return {
            ndvi: ndviData,
            soilMoisture: smapData,
            precipitation: gpmData,
            lastUpdated: new Date().toISOString()
        };
    }

    clearCache() {
        this.cache.clear();
        console.log('NASA data cache cleared');
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            isOnline: this.isOnline,
            mockDataEnabled: this.mockDataEnabled
        };
    }
}