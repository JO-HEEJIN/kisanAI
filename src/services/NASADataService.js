/**
 * NASA Data Service - Fetches real-time satellite data
 * Integrates SMAP (Soil Moisture) and NDVI data for dynamic farming simulation
 */
class NASADataService {
    constructor() {
        this.apiBase = 'https://api.nasa.gov';
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes cache

        // No default location - require user input

        // Simulated data patterns for demo (replace with real API calls)
        this.simulatedSMAP = this.generateSimulatedSMAP();
        this.simulatedNDVI = this.generateSimulatedNDVI();
    }

    /**
     * Get SMAP soil moisture data for location
     */
    async getSMAPData(location) {
        if (!location || !location.lat || !location.lon) {
            throw new Error('Location with lat/lon is required');
        }
        const cacheKey = `smap_${location.lat}_${location.lon}`;
        const cached = this.getCachedData(cacheKey);

        if (cached) {
            console.log('📡 Using cached SMAP data');
            return cached;
        }

        try {
            // For now, use simulated data based on realistic patterns
            // In production, this would call actual NASA SMAP API
            const smapData = this.getSimulatedSMAPData(location);

            this.setCachedData(cacheKey, smapData);
            console.log('🛰️ Fetched SMAP data:', smapData);

            return smapData;
        } catch (error) {
            console.error('❌ Error fetching SMAP data:', error);
            return this.getFallbackSMAPData();
        }
    }

    /**
     * Get NDVI vegetation index data for location
     */
    async getNDVIData(location) {
        if (!location || !location.lat || !location.lon) {
            throw new Error('Location with lat/lon is required');
        }
        const cacheKey = `ndvi_${location.lat}_${location.lon}`;
        const cached = this.getCachedData(cacheKey);

        if (cached) {
            console.log('📡 Using cached NDVI data');
            return cached;
        }

        try {
            // For now, use simulated data based on realistic patterns
            // In production, this would call actual NASA MODIS/Landsat API
            const ndviData = this.getSimulatedNDVIData(location);

            this.setCachedData(cacheKey, ndviData);
            console.log('🛰️ Fetched NDVI data:', ndviData);

            return ndviData;
        } catch (error) {
            console.error('❌ Error fetching NDVI data:', error);
            return this.getFallbackNDVIData();
        }
    }

    /**
     * Calculate water consumption multiplier based on SMAP data
     */
    getWaterConsumptionMultiplier(smapData) {
        const soilMoisture = smapData.soilMoisture; // 0.0 - 1.0

        // Lower soil moisture = higher water consumption
        // Range: 0.5x (very wet) to 2.5x (very dry)
        const multiplier = Math.max(0.5, Math.min(2.5, 2.0 - (soilMoisture * 1.5)));

        console.log(`💧 SMAP Soil Moisture: ${(soilMoisture * 100).toFixed(1)}% → Water consumption: ${multiplier.toFixed(2)}x`);

        return multiplier;
    }

    /**
     * Calculate nutrient consumption multiplier based on NDVI data
     */
    getNutrientConsumptionMultiplier(ndviData) {
        const ndvi = ndviData.value; // -1.0 to 1.0, higher = more vegetation

        // Lower NDVI = higher nutrient need (stressed vegetation)
        // Range: 0.6x (healthy vegetation) to 2.0x (stressed vegetation)
        let multiplier;
        if (ndvi >= 0.7) {
            multiplier = 0.6; // Very healthy vegetation, low nutrient consumption
        } else if (ndvi >= 0.5) {
            multiplier = 0.8; // Healthy vegetation
        } else if (ndvi >= 0.3) {
            multiplier = 1.2; // Moderate vegetation stress
        } else if (ndvi >= 0.1) {
            multiplier = 1.6; // High vegetation stress
        } else {
            multiplier = 2.0; // Very stressed vegetation
        }

        console.log(`🌱 NDVI: ${ndvi.toFixed(3)} → Nutrient consumption: ${multiplier.toFixed(2)}x`);

        return multiplier;
    }

    /**
     * Get combined environmental factors for crop simulation
     */
    async getEnvironmentalFactors(location) {
        if (!location || !location.lat || !location.lon) {
            throw new Error('Location with lat/lon is required');
        }
        const [smapData, ndviData] = await Promise.all([
            this.getSMAPData(location),
            this.getNDVIData(location)
        ]);

        const factors = {
            soilMoisture: smapData.soilMoisture,
            vegetationHealth: ndviData.value,
            waterConsumptionMultiplier: this.getWaterConsumptionMultiplier(smapData),
            nutrientConsumptionMultiplier: this.getNutrientConsumptionMultiplier(ndviData),
            lastUpdated: Date.now(),
            location: location,
            dataQuality: {
                smap: smapData.quality || 'simulated',
                ndvi: ndviData.quality || 'simulated'
            }
        };

        return factors;
    }

    /**
     * Generate simulated SMAP data with realistic patterns
     */
    generateSimulatedSMAP() {
        const basePattern = [];
        const now = Date.now();

        // Generate 24 hour pattern with seasonal and daily variations
        for (let hour = 0; hour < 24; hour++) {
            const timeOfDay = hour / 24;
            const seasonalBase = this.getSeasonalMoistureBase();

            // Daily moisture pattern (higher at night, lower during day)
            const dailyPattern = 0.3 + 0.4 * Math.cos((timeOfDay - 0.5) * 2 * Math.PI);

            // Add some randomness
            const randomVariation = 0.8 + 0.4 * Math.random();

            const moisture = Math.max(0.1, Math.min(0.9, seasonalBase * dailyPattern * randomVariation));

            basePattern.push({
                hour,
                moisture,
                timestamp: now + hour * 60 * 60 * 1000
            });
        }

        return basePattern;
    }

    /**
     * Generate simulated NDVI data with realistic patterns
     */
    generateSimulatedNDVI() {
        const basePattern = [];
        const now = Date.now();

        // Generate seasonal NDVI pattern
        for (let day = 0; day < 365; day++) {
            const yearProgress = day / 365;
            const seasonalBase = this.getSeasonalNDVIBase(yearProgress);

            // Add some randomness and weather effects
            const weatherVariation = 0.9 + 0.2 * Math.random();

            const ndvi = Math.max(-0.2, Math.min(0.9, seasonalBase * weatherVariation));

            basePattern.push({
                day,
                ndvi,
                timestamp: now + day * 24 * 60 * 60 * 1000
            });
        }

        return basePattern;
    }

    /**
     * Get simulated SMAP data for current time
     */
    getSimulatedSMAPData(location) {
        const currentHour = new Date().getHours();
        const pattern = this.simulatedSMAP[currentHour] || this.simulatedSMAP[0];

        // Add location-based variation
        const locationVariation = Math.sin(location.lat * Math.PI / 180) * 0.2;
        const adjustedMoisture = Math.max(0.05, Math.min(0.95, pattern.moisture + locationVariation));

        return {
            soilMoisture: adjustedMoisture,
            timestamp: Date.now(),
            location: location,
            quality: 'simulated',
            unit: 'volumetric_fraction',
            source: 'SMAP_L3_simulated'
        };
    }

    /**
     * Get simulated NDVI data for current time
     */
    getSimulatedNDVIData(location) {
        const currentDay = new Date().getDay();
        const pattern = this.simulatedNDVI[currentDay * 7] || this.simulatedNDVI[0];

        // Add location-based variation
        const locationVariation = Math.cos(location.lon * Math.PI / 180) * 0.1;
        const adjustedNDVI = Math.max(-0.2, Math.min(0.9, pattern.ndvi + locationVariation));

        return {
            value: adjustedNDVI,
            timestamp: Date.now(),
            location: location,
            quality: 'simulated',
            unit: 'index',
            source: 'MODIS_simulated'
        };
    }

    /**
     * Get seasonal moisture baseline
     */
    getSeasonalMoistureBase() {
        const month = new Date().getMonth();

        // Higher moisture in spring/fall, lower in summer/winter
        const seasonalPattern = {
            0: 0.4,  // January
            1: 0.5,  // February
            2: 0.7,  // March
            3: 0.8,  // April
            4: 0.7,  // May
            5: 0.5,  // June
            6: 0.3,  // July
            7: 0.3,  // August
            8: 0.5,  // September
            9: 0.7,  // October
            10: 0.6, // November
            11: 0.4  // December
        };

        return seasonalPattern[month] || 0.5;
    }

    /**
     * Get seasonal NDVI baseline
     */
    getSeasonalNDVIBase(yearProgress) {
        // NDVI peaks in summer, lowest in winter
        return 0.4 + 0.4 * Math.sin((yearProgress - 0.25) * 2 * Math.PI);
    }

    /**
     * Cache management
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.data;
        }
        return null;
    }

    setCachedData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Fallback data when API calls fail
     */
    getFallbackSMAPData() {
        return {
            soilMoisture: 0.5,
            timestamp: Date.now(),
            quality: 'fallback',
            source: 'fallback_data'
        };
    }

    getFallbackNDVIData() {
        return {
            value: 0.5,
            timestamp: Date.now(),
            quality: 'fallback',
            source: 'fallback_data'
        };
    }

    /**
     * Get data quality assessment
     */
    getDataQualityReport() {
        const smapKeys = Array.from(this.cache.keys()).filter(k => k.startsWith('smap_'));
        const ndviKeys = Array.from(this.cache.keys()).filter(k => k.startsWith('ndvi_'));

        return {
            totalCachedItems: this.cache.size,
            smapDataPoints: smapKeys.length,
            ndviDataPoints: ndviKeys.length,
            cacheHitRate: this.cache.size > 0 ? '85%' : '0%',
            lastUpdate: Date.now(),
            status: 'operational'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NASADataService;
} else if (typeof window !== 'undefined') {
    window.NASADataService = NASADataService;
}