/**
 * NASA Farm Navigators - Weather Integration Service
 * Integrates weather data with satellite pass predictions for optimal data acquisition
 * Provides cloud cover, precipitation, and atmospheric conditions analysis
 */

import { EventSystem } from '../utils/EventSystem.js';

class WeatherIntegrationService {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.eventSystem = gameEngine ? gameEngine.getEventSystem() : EventSystem.getInstance();

        // Weather API configuration (using multiple sources for reliability)
        this.weatherAPIs = {
            openWeatherMap: {
                baseUrl: 'https://api.openweathermap.org/data/2.5',
                key: null, // Would be configured in production
                available: false
            },
            weatherAPI: {
                baseUrl: 'https://api.weatherapi.com/v1',
                key: null, // Would be configured in production
                available: false
            },
            NASA_POWER: {
                baseUrl: 'https://power.larc.nasa.gov/api/temporal/daily/point',
                available: true // NASA POWER is open access
            }
        };

        // Weather data cache
        this.weatherCache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes

        // Weather quality thresholds for satellite data acquisition
        this.qualityThresholds = {
            cloudCover: {
                excellent: 0,      // 0% cloud cover
                veryGood: 10,      // ≤10% cloud cover
                good: 25,          // ≤25% cloud cover
                fair: 50,          // ≤50% cloud cover
                poor: 100          // >50% cloud cover
            },
            visibility: {
                excellent: 50,     // >50km visibility
                veryGood: 25,      // >25km visibility
                good: 10,          // >10km visibility
                fair: 5,           // >5km visibility
                poor: 0            // ≤5km visibility
            },
            precipitation: {
                excellent: 0,      // No precipitation
                veryGood: 0.1,     // Light mist
                good: 1.0,         // Light rain
                fair: 5.0,         // Moderate rain
                poor: 999          // Heavy rain/snow
            },
            atmosphericPressure: {
                excellent: { min: 1010, max: 1020 }, // Stable high pressure
                veryGood: { min: 1005, max: 1025 },  // Moderate pressure
                good: { min: 1000, max: 1030 },      // Normal range
                fair: { min: 995, max: 1035 },       // Wider range
                poor: { min: 0, max: 9999 }          // Extreme conditions
            }
        };

        // Satellite-specific weather requirements
        this.satelliteRequirements = {
            'LANDSAT8': {
                cloudThreshold: 25,
                requiresDaylight: true,
                sensitiveToHaze: true,
                optimalSunAngle: { min: 30, max: 60 }
            },
            'LANDSAT9': {
                cloudThreshold: 25,
                requiresDaylight: true,
                sensitiveToHaze: true,
                optimalSunAngle: { min: 30, max: 60 }
            },
            'SENTINEL2A': {
                cloudThreshold: 20,
                requiresDaylight: true,
                sensitiveToHaze: true,
                optimalSunAngle: { min: 25, max: 65 }
            },
            'SENTINEL2B': {
                cloudThreshold: 20,
                requiresDaylight: true,
                sensitiveToHaze: true,
                optimalSunAngle: { min: 25, max: 65 }
            },
            'TERRA': {
                cloudThreshold: 50,
                requiresDaylight: true,
                sensitiveToHaze: false,
                optimalSunAngle: { min: 15, max: 75 }
            },
            'AQUA': {
                cloudThreshold: 50,
                requiresDaylight: true,
                sensitiveToHaze: false,
                optimalSunAngle: { min: 15, max: 75 }
            },
            'SMAP': {
                cloudThreshold: 100, // Not affected by clouds
                requiresDaylight: false,
                sensitiveToHaze: false,
                affectedByPrecipitation: true
            },
            'GPM': {
                cloudThreshold: 100, // Measures precipitation
                requiresDaylight: false,
                sensitiveToHaze: false,
                optimalInStorms: true
            }
        };

        // Historical weather patterns for predictive analysis
        this.weatherPatterns = {
            seasonal: new Map(),
            regional: new Map(),
            predictions: []
        };

        this.isInitialized = false;
    }

    /**
     * Initialize the weather integration service
     */
    async initialize() {
        try {
            console.log('Initializing Weather Integration Service...');

            // Test API availability
            await this.testAPIAvailability();

            // Load historical weather patterns
            await this.loadHistoricalPatterns();

            // Set up real-time weather monitoring
            this.startWeatherMonitoring();

            this.isInitialized = true;
            console.log('Weather Integration Service initialized');

            // Emit initialization event
            this.eventSystem.emit('weather:initialized', {
                availableAPIs: Object.keys(this.weatherAPIs).filter(api => this.weatherAPIs[api].available),
                capabilities: this.getCapabilities()
            });

        } catch (error) {
            console.warn('Weather Integration Service initialization failed:', error);
            // Continue with limited functionality
            this.isInitialized = true;
        }
    }

    /**
     * Test availability of weather APIs
     */
    async testAPIAvailability() {
        // Test NASA POWER API (always available)
        try {
            const testUrl = `${this.weatherAPIs.NASA_POWER.baseUrl}?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=-112.0740&latitude=33.4484&start=20230101&end=20230101&format=JSON`;
            const response = await fetch(testUrl);
            if (response.ok) {
                this.weatherAPIs.NASA_POWER.available = true;
                console.log('NASA POWER API available');
            }
        } catch (error) {
            console.warn('NASA POWER API test failed:', error.message);
        }

        // Note: In production, you would test other APIs with valid keys
        console.log('Weather APIs tested - NASA POWER available for solar data');
    }

    /**
     * Load historical weather patterns for location
     */
    async loadHistoricalPatterns() {
        try {
            // Simulate loading historical patterns (would be real data in production)
            const phoenixPatterns = {
                spring: { cloudCover: 20, precipitation: 0.5, clearDays: 75 },
                summer: { cloudCover: 15, precipitation: 0.1, clearDays: 85 },
                fall: { cloudCover: 25, precipitation: 0.3, clearDays: 70 },
                winter: { cloudCover: 35, precipitation: 2.0, clearDays: 60 }
            };

            this.weatherPatterns.regional.set('phoenix', phoenixPatterns);
            console.log('Historical weather patterns loaded');

        } catch (error) {
            console.warn('Failed to load historical patterns:', error);
        }
    }

    /**
     * Start real-time weather monitoring
     */
    startWeatherMonitoring() {
        // Update weather data every 15 minutes
        this.weatherUpdateInterval = setInterval(() => {
            this.updateCurrentWeatherData();
        }, 15 * 60 * 1000);

        // Generate weather forecasts every hour
        this.forecastUpdateInterval = setInterval(() => {
            this.generateWeatherForecasts();
        }, 60 * 60 * 1000);

        console.log('Real-time weather monitoring started');
    }

    /**
     * Stop weather monitoring
     */
    stopWeatherMonitoring() {
        if (this.weatherUpdateInterval) {
            clearInterval(this.weatherUpdateInterval);
            this.weatherUpdateInterval = null;
        }
        if (this.forecastUpdateInterval) {
            clearInterval(this.forecastUpdateInterval);
            this.forecastUpdateInterval = null;
        }
        console.log('Weather monitoring stopped');
    }

    /**
     * Get weather conditions for satellite pass optimization
     */
    async getPassWeatherConditions(location, datetime, satelliteId) {
        const cacheKey = `${location.lat}_${location.lon}_${datetime.getTime()}_${satelliteId}`;

        // Check cache first
        if (this.weatherCache.has(cacheKey)) {
            const cached = this.weatherCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            // Get weather forecast for the specific time
            const weatherData = await this.fetchWeatherForecast(location, datetime);

            // Apply satellite-specific analysis
            const conditions = this.analyzeSatelliteConditions(weatherData, satelliteId, datetime);

            // Calculate acquisition quality
            const quality = this.calculateAcquisitionQuality(conditions, satelliteId);

            const result = {
                location,
                datetime,
                satelliteId,
                weather: weatherData,
                conditions,
                quality,
                recommendations: this.generateRecommendations(conditions, quality, satelliteId)
            };

            // Cache the result
            this.weatherCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;

        } catch (error) {
            console.warn(`Failed to get weather conditions for ${satelliteId}:`, error);
            return this.getFallbackConditions(location, datetime, satelliteId);
        }
    }

    /**
     * Fetch weather forecast for specific location and time
     */
    async fetchWeatherForecast(location, datetime) {
        // In production, this would call real weather APIs
        // For now, we'll simulate realistic weather data

        const seasonalFactor = this.getSeasonalFactor(datetime);
        const timeFactor = this.getTimeFactor(datetime);
        const locationFactor = this.getLocationFactor(location);

        // Simulate weather conditions based on location and season
        const baseCloudCover = Math.random() * 100 * seasonalFactor.cloudiness;
        const basePrecipitation = Math.random() * 5 * seasonalFactor.precipitation;
        const baseVisibility = 15 + Math.random() * 35;
        const basePressure = 1013 + (Math.random() - 0.5) * 30;
        const baseHumidity = 30 + Math.random() * 50;
        const baseWindSpeed = Math.random() * 15;

        return {
            cloudCover: Math.max(0, Math.min(100, baseCloudCover)),
            precipitation: Math.max(0, basePrecipitation),
            visibility: Math.max(1, baseVisibility),
            pressure: Math.max(980, Math.min(1040, basePressure)),
            humidity: Math.max(10, Math.min(95, baseHumidity)),
            windSpeed: Math.max(0, baseWindSpeed),
            temperature: this.calculateTemperature(location, datetime, seasonalFactor),
            conditions: this.determineWeatherConditions(baseCloudCover, basePrecipitation),
            sunAngle: this.calculateSunAngle(location, datetime),
            forecast: {
                confidence: 0.8 + Math.random() * 0.2,
                lastUpdate: new Date()
            }
        };
    }

    /**
     * Analyze conditions specific to satellite requirements
     */
    analyzeSatelliteConditions(weatherData, satelliteId, datetime) {
        const requirements = this.satelliteRequirements[satelliteId] || {};
        const analysis = {
            overall: 'unknown',
            factors: {},
            issues: [],
            advantages: []
        };

        // Cloud cover analysis
        if (weatherData.cloudCover <= requirements.cloudThreshold) {
            analysis.factors.cloudCover = 'excellent';
            analysis.advantages.push(`Clear skies (${Math.round(weatherData.cloudCover)}% cloud cover)`);
        } else if (weatherData.cloudCover <= requirements.cloudThreshold * 1.5) {
            analysis.factors.cloudCover = 'good';
            analysis.advantages.push(`Mostly clear (${Math.round(weatherData.cloudCover)}% cloud cover)`);
        } else {
            analysis.factors.cloudCover = 'poor';
            analysis.issues.push(`High cloud cover (${Math.round(weatherData.cloudCover)}%)`);
        }

        // Daylight requirements
        if (requirements.requiresDaylight) {
            const sunAngle = weatherData.sunAngle;
            if (sunAngle >= requirements.optimalSunAngle.min && sunAngle <= requirements.optimalSunAngle.max) {
                analysis.factors.lighting = 'excellent';
                analysis.advantages.push(`Optimal sun angle (${Math.round(sunAngle)}°)`);
            } else if (sunAngle > 0) {
                analysis.factors.lighting = 'good';
            } else {
                analysis.factors.lighting = 'poor';
                analysis.issues.push('Nighttime pass - requires daylight');
            }
        }

        // Precipitation analysis
        if (weatherData.precipitation > 0) {
            if (requirements.optimalInStorms) {
                analysis.factors.precipitation = 'excellent';
                analysis.advantages.push('Active precipitation for GPM measurements');
            } else if (requirements.affectedByPrecipitation) {
                analysis.factors.precipitation = 'poor';
                analysis.issues.push('Precipitation may affect microwave measurements');
            } else {
                analysis.factors.precipitation = 'fair';
                analysis.issues.push('Light precipitation present');
            }
        } else {
            analysis.factors.precipitation = requirements.optimalInStorms ? 'poor' : 'excellent';
        }

        // Atmospheric visibility
        if (requirements.sensitiveToHaze && weatherData.visibility < 20) {
            analysis.factors.visibility = 'poor';
            analysis.issues.push(`Reduced visibility (${Math.round(weatherData.visibility)}km)`);
        } else {
            analysis.factors.visibility = 'excellent';
        }

        // Overall assessment
        const factorScores = Object.values(analysis.factors).map(f => {
            switch (f) {
                case 'excellent': return 4;
                case 'good': return 3;
                case 'fair': return 2;
                case 'poor': return 1;
                default: return 2;
            }
        });

        const avgScore = factorScores.reduce((a, b) => a + b, 0) / factorScores.length;
        if (avgScore >= 3.5) analysis.overall = 'excellent';
        else if (avgScore >= 2.5) analysis.overall = 'good';
        else if (avgScore >= 1.5) analysis.overall = 'fair';
        else analysis.overall = 'poor';

        return analysis;
    }

    /**
     * Calculate overall acquisition quality score
     */
    calculateAcquisitionQuality(conditions, satelliteId) {
        const weights = {
            cloudCover: 0.4,
            lighting: 0.3,
            precipitation: 0.2,
            visibility: 0.1
        };

        let totalScore = 0;
        let totalWeight = 0;

        Object.entries(conditions.factors).forEach(([factor, quality]) => {
            const weight = weights[factor] || 0.1;
            let score = 0;

            switch (quality) {
                case 'excellent': score = 100; break;
                case 'good': score = 80; break;
                case 'fair': score = 60; break;
                case 'poor': score = 40; break;
                default: score = 60;
            }

            totalScore += score * weight;
            totalWeight += weight;
        });

        const finalScore = totalWeight > 0 ? totalScore / totalWeight : 60;

        return {
            score: Math.round(finalScore),
            grade: finalScore >= 90 ? 'A' : finalScore >= 80 ? 'B' : finalScore >= 70 ? 'C' : finalScore >= 60 ? 'D' : 'F',
            confidence: 0.7 + Math.random() * 0.3,
            factors: conditions.factors
        };
    }

    /**
     * Generate weather-based recommendations
     */
    generateRecommendations(conditions, quality, satelliteId) {
        const recommendations = [];

        if (quality.score >= 85) {
            recommendations.push('Excellent acquisition opportunity - proceed with data collection');
        } else if (quality.score >= 70) {
            recommendations.push('Good conditions for data acquisition');
        } else if (quality.score >= 55) {
            recommendations.push('Acceptable conditions with some limitations');
        } else {
            recommendations.push('Poor conditions - consider rescheduling');
        }

        // Specific weather-based recommendations
        if (conditions.issues.length > 0) {
            recommendations.push(`Issues: ${conditions.issues.join(', ')}`);
        }

        if (conditions.advantages.length > 0) {
            recommendations.push(`Advantages: ${conditions.advantages.join(', ')}`);
        }

        // Timing recommendations
        const satellite = this.satelliteRequirements[satelliteId];
        if (satellite && satellite.requiresDaylight) {
            recommendations.push('Optimal during mid-morning to mid-afternoon hours');
        }

        return recommendations;
    }

    /**
     * Get seasonal weather factors
     */
    getSeasonalFactor(datetime) {
        const month = datetime.getMonth();

        // Northern Hemisphere seasonal patterns
        if (month >= 2 && month <= 4) { // Spring
            return { cloudiness: 0.6, precipitation: 0.7, temperature: 20 };
        } else if (month >= 5 && month <= 7) { // Summer
            return { cloudiness: 0.3, precipitation: 0.2, temperature: 35 };
        } else if (month >= 8 && month <= 10) { // Fall
            return { cloudiness: 0.5, precipitation: 0.5, temperature: 25 };
        } else { // Winter
            return { cloudiness: 0.8, precipitation: 1.0, temperature: 15 };
        }
    }

    /**
     * Get time-based factors
     */
    getTimeFactor(datetime) {
        const hour = datetime.getHours();

        // Diurnal weather patterns
        return {
            cloudDevelopment: hour >= 12 && hour <= 16 ? 1.3 : 1.0, // Afternoon cloud buildup
            visibility: hour >= 6 && hour <= 10 ? 1.2 : 1.0, // Morning clarity
            stability: hour >= 0 && hour <= 6 ? 1.1 : 1.0 // Nighttime stability
        };
    }

    /**
     * Get location-based weather factors
     */
    getLocationFactor(location) {
        // Simple regional adjustments (would be more complex in production)
        const lat = Math.abs(location.lat);
        const coastal = false; // Would determine from geographic data

        return {
            aridityFactor: lat < 35 && location.lon < -100 ? 1.5 : 1.0, // Desert regions
            stabilityFactor: coastal ? 0.8 : 1.2, // Coastal vs continental
            elevationFactor: 1.0 // Would use elevation data
        };
    }

    /**
     * Calculate temperature based on location and season
     */
    calculateTemperature(location, datetime, seasonalFactor) {
        const baseTemp = seasonalFactor.temperature;
        const hourVariation = Math.sin((datetime.getHours() - 6) * Math.PI / 12) * 8;
        const randomVariation = (Math.random() - 0.5) * 6;

        return Math.round(baseTemp + hourVariation + randomVariation);
    }

    /**
     * Determine weather conditions from metrics
     */
    determineWeatherConditions(cloudCover, precipitation) {
        if (precipitation > 2.0) return 'rainy';
        if (precipitation > 0.5) return 'light-rain';
        if (cloudCover > 75) return 'overcast';
        if (cloudCover > 50) return 'cloudy';
        if (cloudCover > 25) return 'partly-cloudy';
        return 'clear';
    }

    /**
     * Calculate sun angle for given location and time
     */
    calculateSunAngle(location, datetime) {
        // Simplified solar position calculation
        const dayOfYear = Math.floor((datetime - new Date(datetime.getFullYear(), 0, 0)) / 86400000);
        const declination = 23.45 * Math.sin(Math.PI * (284 + dayOfYear) / 365);
        const hourAngle = 15 * (datetime.getHours() + datetime.getMinutes() / 60 - 12);

        const elevation = Math.asin(
            Math.sin(location.lat * Math.PI / 180) * Math.sin(declination * Math.PI / 180) +
            Math.cos(location.lat * Math.PI / 180) * Math.cos(declination * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
        ) * 180 / Math.PI;

        return Math.max(0, elevation);
    }

    /**
     * Update current weather data
     */
    async updateCurrentWeatherData() {
        try {
            // In production, this would fetch real-time data
            const locations = [
                { lat: 33.4484, lon: -112.0740, name: 'Phoenix, AZ' }
            ];

            for (const location of locations) {
                const conditions = await this.fetchWeatherForecast(location, new Date());
                this.eventSystem.emit('weather:updated', {
                    location,
                    conditions,
                    timestamp: new Date()
                });
            }

        } catch (error) {
            console.warn('Failed to update weather data:', error);
        }
    }

    /**
     * Generate weather forecasts for upcoming satellite passes
     */
    async generateWeatherForecasts() {
        try {
            const forecasts = [];
            const now = new Date();

            // Generate 7-day forecast
            for (let day = 0; day < 7; day++) {
                const forecastDate = new Date(now);
                forecastDate.setDate(now.getDate() + day);

                const forecast = await this.fetchWeatherForecast(
                    { lat: 33.4484, lon: -112.0740, name: 'Phoenix, AZ' },
                    forecastDate
                );

                forecasts.push({
                    date: forecastDate,
                    ...forecast
                });
            }

            this.weatherPatterns.predictions = forecasts;

            this.eventSystem.emit('weather:forecastUpdated', {
                forecasts,
                location: 'Phoenix, AZ',
                generatedAt: new Date()
            });

        } catch (error) {
            console.warn('Failed to generate weather forecasts:', error);
        }
    }

    /**
     * Get fallback conditions when weather API is unavailable
     */
    getFallbackConditions(location, datetime, satelliteId) {
        const seasonal = this.getSeasonalFactor(datetime);

        return {
            location,
            datetime,
            satelliteId,
            weather: {
                cloudCover: seasonal.cloudiness * 40,
                precipitation: 0,
                visibility: 25,
                pressure: 1013,
                humidity: 45,
                windSpeed: 5,
                temperature: seasonal.temperature,
                conditions: 'partly-cloudy',
                sunAngle: this.calculateSunAngle(location, datetime)
            },
            conditions: {
                overall: 'fair',
                factors: { cloudCover: 'fair', lighting: 'good' },
                issues: ['Weather data unavailable'],
                advantages: []
            },
            quality: {
                score: 65,
                grade: 'C',
                confidence: 0.3,
                factors: { fallback: true }
            },
            recommendations: ['Using historical weather patterns - actual conditions may vary']
        };
    }

    /**
     * Get service capabilities
     */
    getCapabilities() {
        return {
            realTimeWeather: this.weatherAPIs.NASA_POWER.available,
            forecasting: true,
            satelliteOptimization: true,
            historicalAnalysis: true,
            supportedSatellites: Object.keys(this.satelliteRequirements),
            updateFrequency: '15 minutes',
            forecastRange: '7 days'
        };
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.stopWeatherMonitoring();
        this.weatherCache.clear();
        this.isInitialized = false;
        console.log('Weather Integration Service destroyed');
    }
}

export { WeatherIntegrationService };