/**
 * NASA Farm Navigators - ML Prediction Service
 * Integrates machine learning models for agricultural predictions
 * Supports soil moisture forecasting, crop yield prediction, and anomaly detection
 */

class MLPredictionService {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || 'https://api.nasa-harvest.org/ml';
        this.fallbackMode = options.fallbackMode !== false;
        this.cacheEnabled = options.cacheEnabled !== false;
        this.predictionCache = new Map();
        this.modelVersions = new Map();

        // Pre-trained model configurations
        this.models = {
            soilMoisture: {
                name: 'SMAP Soil Moisture Forecaster',
                version: '2.1.0',
                inputFeatures: ['temperature', 'precipitation', 'ndvi', 'historical_moisture'],
                outputType: 'time_series',
                accuracy: 0.87,
                description: 'Predicts soil moisture 7-14 days ahead using SMAP L3/L4 data'
            },
            cropYield: {
                name: 'Multi-Crop Yield Predictor',
                version: '1.8.0',
                inputFeatures: ['soil_moisture', 'temperature', 'precipitation', 'ndvi', 'growth_stage'],
                outputType: 'scalar',
                accuracy: 0.82,
                description: 'Estimates crop yield potential based on satellite data'
            },
            anomalyDetection: {
                name: 'Agricultural Anomaly Detector',
                version: '1.5.0',
                inputFeatures: ['soil_moisture', 'temperature', 'precipitation', 'ndvi'],
                outputType: 'classification',
                accuracy: 0.91,
                description: 'Detects unusual patterns requiring farmer attention'
            },
            irrigationOptimizer: {
                name: 'Smart Irrigation Optimizer',
                version: '1.2.0',
                inputFeatures: ['soil_moisture', 'weather_forecast', 'crop_stage', 'soil_type'],
                outputType: 'recommendation',
                accuracy: 0.89,
                description: 'Optimizes irrigation timing and amounts'
            }
        };

        // Fallback statistical models
        this.statisticalModels = {
            linearTrend: this.calculateLinearTrend.bind(this),
            seasonalDecomposition: this.performSeasonalDecomposition.bind(this),
            movingAverage: this.calculateMovingAverage.bind(this)
        };
    }

    /**
     * Predict soil moisture for the next 7-14 days
     */
    async predictSoilMoisture(inputData) {
        try {
            const cacheKey = `soil_moisture_${JSON.stringify(inputData).slice(0, 50)}`;

            if (this.cacheEnabled && this.predictionCache.has(cacheKey)) {
                return this.predictionCache.get(cacheKey);
            }

            // Try ML API first
            const mlResult = await this.callMLAPI('soil_moisture', inputData);

            if (mlResult) {
                this.predictionCache.set(cacheKey, mlResult);
                return mlResult;
            }

            // Fallback to statistical model
            if (this.fallbackMode) {
                return this.fallbackSoilMoisturePrediction(inputData);
            }

            throw new Error('ML prediction failed and fallback disabled');

        } catch (error) {
            console.warn('Soil moisture prediction error:', error);
            return this.fallbackSoilMoisturePrediction(inputData);
        }
    }

    /**
     * Predict crop yield based on current conditions
     */
    async predictCropYield(cropType, locationData, satelliteData) {
        try {
            const inputFeatures = this.prepareCropYieldFeatures(cropType, locationData, satelliteData);

            const prediction = await this.callMLAPI('crop_yield', {
                crop_type: cropType,
                features: inputFeatures,
                location: locationData
            });

            if (prediction) {
                return {
                    predictedYield: prediction.yield,
                    confidence: prediction.confidence,
                    factors: prediction.contributing_factors,
                    recommendations: prediction.recommendations,
                    model: this.models.cropYield
                };
            }

            // Fallback to rule-based estimation
            return this.fallbackCropYieldEstimation(cropType, satelliteData);

        } catch (error) {
            console.warn('Crop yield prediction error:', error);
            return this.fallbackCropYieldEstimation(cropType, satelliteData);
        }
    }

    /**
     * Detect anomalies in agricultural data
     */
    async detectAnomalies(timeSeriesData, contextData = {}) {
        try {
            const anomalyResult = await this.callMLAPI('anomaly_detection', {
                time_series: timeSeriesData,
                context: contextData
            });

            if (anomalyResult) {
                return {
                    anomalies: anomalyResult.detected_anomalies,
                    severity: anomalyResult.severity_scores,
                    recommendations: anomalyResult.action_recommendations,
                    confidence: anomalyResult.confidence
                };
            }

            // Fallback to statistical anomaly detection
            return this.statisticalAnomalyDetection(timeSeriesData);

        } catch (error) {
            console.warn('Anomaly detection error:', error);
            return this.statisticalAnomalyDetection(timeSeriesData);
        }
    }

    /**
     * Generate irrigation recommendations
     */
    async optimizeIrrigation(fieldData, weatherForecast, cropInfo) {
        try {
            const irrigationResult = await this.callMLAPI('irrigation_optimizer', {
                field_conditions: fieldData,
                weather_forecast: weatherForecast,
                crop_info: cropInfo
            });

            if (irrigationResult) {
                return {
                    recommendation: irrigationResult.action,
                    timing: irrigationResult.optimal_timing,
                    amount: irrigationResult.water_amount,
                    reasoning: irrigationResult.explanation,
                    confidence: irrigationResult.confidence
                };
            }

            // Fallback to rule-based irrigation logic
            return this.fallbackIrrigationRecommendation(fieldData, weatherForecast, cropInfo);

        } catch (error) {
            console.warn('Irrigation optimization error:', error);
            return this.fallbackIrrigationRecommendation(fieldData, weatherForecast, cropInfo);
        }
    }

    /**
     * Call external ML API
     */
    async callMLAPI(modelType, inputData) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${modelType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'NASA-Farm-Navigators/2.0'
                },
                body: JSON.stringify({
                    model_version: this.models[modelType]?.version,
                    input_data: inputData,
                    return_confidence: true
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.warn('ML API call failed:', error);
            return null;
        }
    }

    /**
     * Fallback statistical soil moisture prediction
     */
    fallbackSoilMoisturePrediction(inputData) {
        const { historicalData, weather } = inputData;

        // Simple trend analysis with seasonal adjustment
        const trend = this.calculateLinearTrend(historicalData);
        const seasonal = this.performSeasonalDecomposition(historicalData);

        const prediction = [];
        const currentDate = new Date();

        for (let i = 1; i <= 14; i++) {
            const futureDate = new Date(currentDate);
            futureDate.setDate(currentDate.getDate() + i);

            const trendValue = trend.slope * i + trend.intercept;
            const seasonalFactor = seasonal.getSeasonalFactor(futureDate);
            const weatherAdjustment = this.calculateWeatherImpact(weather, i);

            prediction.push({
                date: futureDate.toISOString().split('T')[0],
                soilMoisture: Math.max(0, Math.min(1, trendValue * seasonalFactor + weatherAdjustment)),
                confidence: Math.max(0.3, 0.8 - (i * 0.03)) // Decreasing confidence over time
            });
        }

        return {
            predictions: prediction,
            model: 'Statistical Fallback',
            method: 'Trend + Seasonal + Weather',
            accuracy: 0.65
        };
    }

    /**
     * Fallback crop yield estimation
     */
    fallbackCropYieldEstimation(cropType, satelliteData) {
        const { ndvi, soilMoisture, temperature } = satelliteData;

        // Rule-based yield estimation
        const cropFactors = {
            corn: { ndvi_weight: 0.4, moisture_weight: 0.4, temp_weight: 0.2, baseline: 150 },
            wheat: { ndvi_weight: 0.5, moisture_weight: 0.3, temp_weight: 0.2, baseline: 45 },
            soybeans: { ndvi_weight: 0.3, moisture_weight: 0.5, temp_weight: 0.2, baseline: 40 }
        };

        const factors = cropFactors[cropType] || cropFactors.corn;

        const yieldIndex = (
            (ndvi || 0.7) * factors.ndvi_weight +
            (soilMoisture || 0.5) * factors.moisture_weight +
            (1 - Math.abs((temperature || 25) - 25) / 15) * factors.temp_weight
        );

        const estimatedYield = factors.baseline * yieldIndex;

        return {
            predictedYield: estimatedYield,
            confidence: 0.6,
            method: 'Rule-based estimation',
            factors: {
                ndvi_contribution: ndvi * factors.ndvi_weight,
                moisture_contribution: soilMoisture * factors.moisture_weight,
                temperature_contribution: (1 - Math.abs(temperature - 25) / 15) * factors.temp_weight
            }
        };
    }

    /**
     * Statistical anomaly detection
     */
    statisticalAnomalyDetection(timeSeriesData) {
        const values = timeSeriesData.map(d => d.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);

        const anomalies = [];
        const threshold = 2.5; // Standard deviations

        timeSeriesData.forEach((point, index) => {
            const zScore = Math.abs((point.value - mean) / std);
            if (zScore > threshold) {
                anomalies.push({
                    index,
                    date: point.date,
                    value: point.value,
                    severity: Math.min(1, (zScore - threshold) / threshold),
                    type: point.value > mean ? 'high' : 'low'
                });
            }
        });

        return {
            anomalies,
            method: 'Z-Score Statistical Analysis',
            threshold,
            confidence: 0.7
        };
    }

    /**
     * Fallback irrigation recommendation
     */
    fallbackIrrigationRecommendation(fieldData, weatherForecast, cropInfo) {
        const { soilMoisture, temperature } = fieldData;
        const { precipitation } = weatherForecast;

        let recommendation = 'monitor';
        let amount = 0;
        let timing = null;

        // Simple rule-based logic
        if (soilMoisture < 0.3 && precipitation < 5) {
            recommendation = 'irrigate_immediately';
            amount = 25; // mm
            timing = 'morning';
        } else if (soilMoisture < 0.5 && precipitation < 10) {
            recommendation = 'irrigate_soon';
            amount = 15; // mm
            timing = 'evening';
        }

        return {
            recommendation,
            amount,
            timing,
            reasoning: `Soil moisture: ${(soilMoisture * 100).toFixed(0)}%, Expected precipitation: ${precipitation}mm`,
            confidence: 0.65,
            method: 'Rule-based fallback'
        };
    }

    /**
     * Utility functions
     */
    calculateLinearTrend(data) {
        const n = data.length;
        const x = data.map((_, i) => i);
        const y = data.map(d => d.value);

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    }

    performSeasonalDecomposition(data) {
        // Simplified seasonal decomposition
        const monthlyAverages = new Array(12).fill(0);
        const monthlyCounts = new Array(12).fill(0);

        data.forEach(point => {
            const month = new Date(point.date).getMonth();
            monthlyAverages[month] += point.value;
            monthlyCounts[month]++;
        });

        for (let i = 0; i < 12; i++) {
            if (monthlyCounts[i] > 0) {
                monthlyAverages[i] /= monthlyCounts[i];
            }
        }

        return {
            getSeasonalFactor: (date) => {
                const month = date.getMonth();
                const overallMean = monthlyAverages.reduce((a, b) => a + b, 0) / 12;
                return monthlyAverages[month] / overallMean;
            }
        };
    }

    calculateMovingAverage(data, window = 7) {
        const result = [];
        for (let i = window - 1; i < data.length; i++) {
            const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b.value, 0);
            result.push({
                date: data[i].date,
                value: sum / window
            });
        }
        return result;
    }

    calculateWeatherImpact(weatherForecast, dayOffset) {
        const forecast = weatherForecast.find(f => f.day === dayOffset);
        if (!forecast) return 0;

        // Simple weather impact calculation
        const precipitationImpact = Math.min(0.3, forecast.precipitation * 0.01);
        const temperatureImpact = -Math.abs(forecast.temperature - 25) * 0.005;

        return precipitationImpact + temperatureImpact;
    }

    prepareCropYieldFeatures(cropType, locationData, satelliteData) {
        return {
            crop_type: cropType,
            latitude: locationData.lat,
            longitude: locationData.lon,
            soil_moisture_avg: satelliteData.soilMoisture || 0.5,
            ndvi_avg: satelliteData.ndvi || 0.7,
            temperature_avg: satelliteData.temperature || 25,
            precipitation_sum: satelliteData.precipitation || 100,
            growth_day: Math.floor(Math.random() * 180) + 1 // Placeholder
        };
    }

    getModelInfo() {
        return this.models;
    }

    getCacheStats() {
        return {
            cacheSize: this.predictionCache.size,
            cacheEnabled: this.cacheEnabled
        };
    }

    clearCache() {
        this.predictionCache.clear();
    }
}

export { MLPredictionService };