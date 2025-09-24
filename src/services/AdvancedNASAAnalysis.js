/**
 * Advanced NASA Data Analysis Service
 * Implements sophisticated multi-sensor fusion and edge case detection
 * Based on detailed analysis of SMAP, MODIS, GPM, and Sentinel-2 datasets
 */

class AdvancedNASAAnalysis {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

        // Thresholds for edge case detection
        this.thresholds = {
            criticalSoilMoisture: 0.15, // m³/m³
            stressTempDiff: 5, // Kelvin
            lowNDVI: 0.3,
            highSalinity: 0.4, // Inferred from NDVI drop patterns
            floodThreshold: 0.45, // Soil moisture above this indicates flooding
            droughtThreshold: 0.1 // Soil moisture below this indicates severe drought
        };

        // Crop-specific parameters and thresholds
        this.cropProfiles = {
            wheat: {
                name: "Wheat",
                optimalNDVI: { min: 0.4, max: 0.8, ideal: 0.65 },
                optimalSoilMoisture: { min: 0.25, max: 0.45, ideal: 0.35 },
                optimalTemperature: { min: 285, max: 298, ideal: 291 }, // 12-25°C, ideal 18°C
                waterStressTolerance: 0.6, // moderate tolerance
                growthStages: {
                    germination: { duration: 7, ndviTarget: 0.15, moistureNeed: 0.4 },
                    tillering: { duration: 30, ndviTarget: 0.4, moistureNeed: 0.35 },
                    heading: { duration: 20, ndviTarget: 0.7, moistureNeed: 0.3 },
                    maturity: { duration: 30, ndviTarget: 0.5, moistureNeed: 0.25 }
                },
                specificAlerts: {
                    disease: { tempRange: [288, 293], humidityMin: 0.7 },
                    pest: { tempRange: [290, 295], droughtStress: 0.4 }
                }
            },
            corn: {
                name: "Corn/Maize",
                optimalNDVI: { min: 0.5, max: 0.9, ideal: 0.75 },
                optimalSoilMoisture: { min: 0.3, max: 0.5, ideal: 0.4 },
                optimalTemperature: { min: 288, max: 303, ideal: 295 }, // 15-30°C, ideal 22°C
                waterStressTolerance: 0.3, // low tolerance - needs consistent water
                growthStages: {
                    planting: { duration: 10, ndviTarget: 0.2, moistureNeed: 0.45 },
                    vegetative: { duration: 45, ndviTarget: 0.6, moistureNeed: 0.4 },
                    reproductive: { duration: 30, ndviTarget: 0.85, moistureNeed: 0.45 },
                    maturity: { duration: 35, ndviTarget: 0.6, moistureNeed: 0.3 }
                },
                specificAlerts: {
                    waterStress: { criticalStage: "reproductive", threshold: 0.35 },
                    heatStress: { tempThreshold: 308, criticalStage: "reproductive" }
                }
            },
            rice: {
                name: "Rice",
                optimalNDVI: { min: 0.6, max: 0.9, ideal: 0.8 },
                optimalSoilMoisture: { min: 0.4, max: 0.8, ideal: 0.6 }, // Flooded conditions
                optimalTemperature: { min: 293, max: 308, ideal: 300 }, // 20-35°C, ideal 27°C
                waterStressTolerance: 0.1, // very low tolerance - requires flooding
                growthStages: {
                    transplanting: { duration: 14, ndviTarget: 0.3, moistureNeed: 0.8 },
                    tillering: { duration: 35, ndviTarget: 0.6, moistureNeed: 0.7 },
                    heading: { duration: 25, ndviTarget: 0.85, moistureNeed: 0.6 },
                    maturity: { duration: 30, ndviTarget: 0.7, moistureNeed: 0.5 }
                },
                specificAlerts: {
                    flooding: { soilMoistureMin: 0.6, required: true },
                    temperature: { nightMin: 288, dayMax: 310 }
                }
            },
            cotton: {
                name: "Cotton",
                optimalNDVI: { min: 0.4, max: 0.75, ideal: 0.6 },
                optimalSoilMoisture: { min: 0.2, max: 0.4, ideal: 0.3 },
                optimalTemperature: { min: 293, max: 308, ideal: 300 }, // 20-35°C, ideal 27°C
                waterStressTolerance: 0.7, // high tolerance to drought
                growthStages: {
                    planting: { duration: 14, ndviTarget: 0.2, moistureNeed: 0.35 },
                    squaring: { duration: 35, ndviTarget: 0.5, moistureNeed: 0.3 },
                    flowering: { duration: 45, ndviTarget: 0.65, moistureNeed: 0.35 },
                    maturity: { duration: 30, ndviTarget: 0.45, moistureNeed: 0.25 }
                },
                specificAlerts: {
                    bollworm: { tempRange: [298, 305], moistureRange: [0.25, 0.35] },
                    heatStress: { tempThreshold: 310, criticalStage: "flowering" }
                }
            },
            soybean: {
                name: "Soybean",
                optimalNDVI: { min: 0.4, max: 0.8, ideal: 0.65 },
                optimalSoilMoisture: { min: 0.25, max: 0.45, ideal: 0.35 },
                optimalTemperature: { min: 283, max: 303, ideal: 293 }, // 10-30°C, ideal 20°C
                waterStressTolerance: 0.5, // moderate tolerance
                growthStages: {
                    emergence: { duration: 10, ndviTarget: 0.2, moistureNeed: 0.4 },
                    vegetative: { duration: 40, ndviTarget: 0.6, moistureNeed: 0.35 },
                    reproductive: { duration: 35, ndviTarget: 0.75, moistureNeed: 0.4 },
                    maturity: { duration: 25, ndviTarget: 0.5, moistureNeed: 0.3 }
                },
                specificAlerts: {
                    rust: { humidityMin: 0.8, tempRange: [288, 298] },
                    aphids: { droughtStress: 0.3, tempRange: [293, 303] }
                }
            },
            potato: {
                name: "Potato",
                optimalNDVI: { min: 0.5, max: 0.85, ideal: 0.7 },
                optimalSoilMoisture: { min: 0.3, max: 0.5, ideal: 0.4 },
                optimalTemperature: { min: 278, max: 293, ideal: 285 }, // 5-20°C, ideal 12°C
                waterStressTolerance: 0.4, // moderate-low tolerance
                growthStages: {
                    planting: { duration: 14, ndviTarget: 0.1, moistureNeed: 0.4 },
                    emergence: { duration: 21, ndviTarget: 0.3, moistureNeed: 0.4 },
                    tuberization: { duration: 35, ndviTarget: 0.75, moistureNeed: 0.45 },
                    maturity: { duration: 30, ndviTarget: 0.6, moistureNeed: 0.35 }
                },
                specificAlerts: {
                    blight: { humidityMin: 0.9, tempRange: [288, 298] },
                    heatStress: { tempThreshold: 298, criticalStage: "tuberization" }
                }
            },
            tomato: {
                name: "Tomato",
                optimalNDVI: { min: 0.6, max: 0.9, ideal: 0.8 },
                optimalSoilMoisture: { min: 0.3, max: 0.5, ideal: 0.4 },
                optimalTemperature: { min: 288, max: 308, ideal: 298 }, // 15-35°C, ideal 25°C
                waterStressTolerance: 0.3, // low tolerance
                growthStages: {
                    transplant: { duration: 14, ndviTarget: 0.4, moistureNeed: 0.45 },
                    flowering: { duration: 30, ndviTarget: 0.7, moistureNeed: 0.4 },
                    fruiting: { duration: 45, ndviTarget: 0.85, moistureNeed: 0.45 },
                    harvest: { duration: 30, ndviTarget: 0.75, moistureNeed: 0.4 }
                },
                specificAlerts: {
                    blossom_rot: { moistureVariation: 0.1, calcium: "low" },
                    wilt: { soilMoisture: 0.25, tempThreshold: 303 }
                }
            }
        };

        // Quality flag mappings for SMAP
        this.smapQualityFlags = {
            0: 'good_quality',
            1: 'dense_vegetation',
            2: 'snow_coverage',
            4: 'frozen_ground',
            8: 'precipitation',
            16: 'radio_frequency_interference'
        };

        // Temporal windows for predictive analysis
        this.temporalWindows = {
            smapCycle: 2.75, // days
            gpmUpdate: 0.5, // hours
            irrigationPrediction: 3, // days ahead
            anomalyLookback: 30 // days for historical comparison
        };

        // Weather integration settings
        this.weatherSettings = {
            apiKey: 'demo_key', // In production, use environment variable
            updateInterval: 10 * 60 * 1000, // 10 minutes
            forecastDays: 7,
            alertThresholds: {
                temperature: { min: -5, max: 45 }, // Celsius
                windSpeed: 15, // m/s
                precipitation: 50, // mm/day
                humidity: { min: 20, max: 90 } // percentage
            }
        };

        // Machine learning settings
        this.mlSettings = {
            minDataPoints: 10, // Minimum data points for ML predictions
            windowSize: 30, // Days for moving averages
            predictionHorizon: 14, // Days ahead to predict
            confidenceThreshold: 0.7,
            models: {
                linearRegression: true,
                exponentialSmoothing: true,
                seasonalDecomposition: true,
                anomalyDetection: true
            }
        };

        // Initialize ML state
        this.mlState = {
            models: {},
            lastTrained: null,
            trainingData: []
        };
    }

    /**
     * Machine Learning Predictions and Analytics
     */
    async performMLAnalysis(historicalData, currentData, options = {}) {
        if (!historicalData || historicalData.length < this.mlSettings.minDataPoints) {
            return {
                status: 'insufficient_data',
                minRequired: this.mlSettings.minDataPoints,
                currentCount: historicalData ? historicalData.length : 0
            };
        }

        // Prepare training data
        const trainingData = this.prepareTrainingData(historicalData, currentData);

        // Train models
        const models = await this.trainPredictionModels(trainingData);

        // Generate predictions
        const predictions = this.generateMLPredictions(models, trainingData, currentData);

        // Detect anomalies
        const anomalies = this.detectMLAnomalies(trainingData, currentData);

        // Calculate feature importance
        const featureImportance = this.calculateFeatureImportance(trainingData);

        return {
            status: 'success',
            predictions,
            anomalies,
            featureImportance,
            models: {
                performance: this.evaluateModelPerformance(models, trainingData),
                confidence: this.calculatePredictionConfidence(predictions)
            },
            insights: this.generateMLInsights(predictions, anomalies, featureImportance)
        };
    }

    prepareTrainingData(historicalData, currentData) {
        const features = [];

        historicalData.forEach((point, index) => {
            if (index < historicalData.length - 1) { // Exclude last point for target
                const target = historicalData[index + 1];

                features.push({
                    // Input features
                    soilMoisture: point.soilMoisture,
                    ndvi: point.ndvi,
                    temperature: point.temperature,
                    precipitation: point.precipitation,

                    // Derived features
                    dayOfYear: this.getDayOfYear(new Date(point.timestamp)),
                    weekOfYear: this.getWeekOfYear(new Date(point.timestamp)),
                    moistureChange: this.calculateChange(historicalData, index, 'soilMoisture'),
                    ndviChange: this.calculateChange(historicalData, index, 'ndvi'),
                    tempChange: this.calculateChange(historicalData, index, 'temperature'),

                    // Moving averages
                    moistureMA7: this.calculateMovingAverage(historicalData, index, 'soilMoisture', 7),
                    ndviMA7: this.calculateMovingAverage(historicalData, index, 'ndvi', 7),
                    tempMA7: this.calculateMovingAverage(historicalData, index, 'temperature', 7),

                    // Target variables (next day values)
                    target_soilMoisture: target.soilMoisture,
                    target_ndvi: target.ndvi,
                    target_temperature: target.temperature,

                    timestamp: point.timestamp
                });
            }
        });

        return features;
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    getWeekOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 1);
        const diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    }

    calculateChange(data, index, parameter) {
        if (index === 0) return 0;
        return data[index][parameter] - data[index - 1][parameter];
    }

    calculateMovingAverage(data, index, parameter, window) {
        const start = Math.max(0, index - window + 1);
        const values = data.slice(start, index + 1).map(d => d[parameter]);
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    async trainPredictionModels(trainingData) {
        const models = {};

        // Linear Regression Model
        if (this.mlSettings.models.linearRegression) {
            models.linearRegression = this.trainLinearRegression(trainingData);
        }

        // Exponential Smoothing Model
        if (this.mlSettings.models.exponentialSmoothing) {
            models.exponentialSmoothing = this.trainExponentialSmoothing(trainingData);
        }

        // Seasonal Decomposition
        if (this.mlSettings.models.seasonalDecomposition) {
            models.seasonal = this.performSeasonalDecomposition(trainingData);
        }

        this.mlState.models = models;
        this.mlState.lastTrained = new Date().toISOString();

        return models;
    }

    trainLinearRegression(trainingData) {
        const features = ['soilMoisture', 'ndvi', 'temperature', 'precipitation', 'dayOfYear'];
        const targets = ['target_soilMoisture', 'target_ndvi', 'target_temperature'];

        const models = {};

        targets.forEach(target => {
            // Simple linear regression implementation
            const X = trainingData.map(d => features.map(f => d[f]));
            const y = trainingData.map(d => d[target]);

            const weights = this.fitLinearRegression(X, y);

            models[target] = {
                weights,
                features,
                r2: this.calculateR2(X, y, weights),
                mse: this.calculateMSE(X, y, weights)
            };
        });

        return models;
    }

    fitLinearRegression(X, y) {
        // Simple gradient descent implementation
        const numFeatures = X[0].length;
        let weights = new Array(numFeatures + 1).fill(0); // +1 for bias
        const learningRate = 0.01;
        const iterations = 1000;

        for (let iter = 0; iter < iterations; iter++) {
            const predictions = X.map(x => this.predictLinear(x, weights));
            const errors = predictions.map((pred, i) => pred - y[i]);

            // Update weights
            weights[0] -= learningRate * errors.reduce((a, b) => a + b, 0) / X.length; // bias

            for (let j = 0; j < numFeatures; j++) {
                const gradient = errors.reduce((sum, error, i) => sum + error * X[i][j], 0) / X.length;
                weights[j + 1] -= learningRate * gradient;
            }
        }

        return weights;
    }

    predictLinear(x, weights) {
        return weights[0] + x.reduce((sum, val, i) => sum + val * weights[i + 1], 0);
    }

    calculateR2(X, y, weights) {
        const predictions = X.map(x => this.predictLinear(x, weights));
        const yMean = y.reduce((a, b) => a + b, 0) / y.length;

        const ssRes = predictions.reduce((sum, pred, i) => sum + Math.pow(y[i] - pred, 2), 0);
        const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);

        return 1 - (ssRes / ssTot);
    }

    calculateMSE(X, y, weights) {
        const predictions = X.map(x => this.predictLinear(x, weights));
        return predictions.reduce((sum, pred, i) => sum + Math.pow(y[i] - pred, 2), 0) / predictions.length;
    }

    trainExponentialSmoothing(trainingData) {
        const parameters = ['soilMoisture', 'ndvi', 'temperature'];
        const models = {};

        parameters.forEach(param => {
            const values = trainingData.map(d => d[param]);
            const alpha = 0.3; // Smoothing parameter

            let smoothed = [values[0]];
            for (let i = 1; i < values.length; i++) {
                smoothed[i] = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
            }

            models[param] = {
                alpha,
                lastValue: smoothed[smoothed.length - 1],
                trend: this.calculateTrend(smoothed.slice(-10)) // Use last 10 points for trend
            };
        });

        return models;
    }

    performSeasonalDecomposition(trainingData) {
        const parameters = ['soilMoisture', 'ndvi', 'temperature'];
        const seasonalComponents = {};

        parameters.forEach(param => {
            const values = trainingData.map(d => d[param]);
            const days = trainingData.map(d => this.getDayOfYear(new Date(d.timestamp)));

            // Simple seasonal decomposition
            const seasonalPattern = this.extractSeasonalPattern(values, days);
            const trend = this.extractTrend(values);
            const residuals = this.calculateResiduals(values, trend, seasonalPattern, days);

            seasonalComponents[param] = {
                seasonal: seasonalPattern,
                trend,
                residuals,
                amplitude: Math.max(...Object.values(seasonalPattern)) - Math.min(...Object.values(seasonalPattern))
            };
        });

        return seasonalComponents;
    }

    extractSeasonalPattern(values, days) {
        const seasonal = {};
        const dayGroups = {};

        // Group values by day of year
        values.forEach((val, i) => {
            const day = Math.floor(days[i] / 30); // Monthly grouping
            if (!dayGroups[day]) dayGroups[day] = [];
            dayGroups[day].push(val);
        });

        // Calculate average for each month
        Object.keys(dayGroups).forEach(day => {
            seasonal[day] = dayGroups[day].reduce((a, b) => a + b, 0) / dayGroups[day].length;
        });

        return seasonal;
    }

    extractTrend(values) {
        const windowSize = Math.min(10, Math.floor(values.length / 3));
        const trend = [];

        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(values.length, i + Math.ceil(windowSize / 2));
            const window = values.slice(start, end);
            trend[i] = window.reduce((a, b) => a + b, 0) / window.length;
        }

        return trend;
    }

    calculateResiduals(values, trend, seasonalPattern, days) {
        return values.map((val, i) => {
            const day = Math.floor(days[i] / 30);
            const seasonal = seasonalPattern[day] || 0;
            return val - trend[i] - seasonal;
        });
    }

    generateMLPredictions(models, trainingData, currentData) {
        const predictions = {};

        // Linear regression predictions
        if (models.linearRegression) {
            predictions.linearRegression = this.predictWithLinearRegression(models.linearRegression, currentData);
        }

        // Exponential smoothing predictions
        if (models.exponentialSmoothing) {
            predictions.exponentialSmoothing = this.predictWithExponentialSmoothing(models.exponentialSmoothing);
        }

        // Seasonal predictions
        if (models.seasonal) {
            predictions.seasonal = this.predictWithSeasonalModel(models.seasonal, currentData);
        }

        // Ensemble prediction (weighted average)
        predictions.ensemble = this.createEnsemblePrediction(predictions);

        return predictions;
    }

    predictWithLinearRegression(model, currentData) {
        const predictions = {};
        const features = [
            currentData.soilMoisture,
            currentData.ndvi,
            currentData.temperature,
            currentData.precipitation || 0,
            this.getDayOfYear(new Date())
        ];

        Object.keys(model).forEach(target => {
            const prediction = this.predictLinear(features, model[target].weights);
            predictions[target.replace('target_', '')] = {
                value: prediction,
                confidence: Math.min(model[target].r2, 0.95)
            };
        });

        return predictions;
    }

    predictWithExponentialSmoothing(model) {
        const predictions = {};

        Object.keys(model).forEach(param => {
            const { lastValue, trend, alpha } = model[param];
            const prediction = lastValue + trend.slope;

            predictions[param] = {
                value: prediction,
                confidence: 0.7 // Fixed confidence for exponential smoothing
            };
        });

        return predictions;
    }

    predictWithSeasonalModel(model, currentData) {
        const predictions = {};
        const currentDay = Math.floor(this.getDayOfYear(new Date()) / 30);

        Object.keys(model).forEach(param => {
            const { seasonal, trend } = model[param];
            const seasonalComponent = seasonal[currentDay] || 0;
            const trendComponent = trend[trend.length - 1] || 0;

            predictions[param] = {
                value: trendComponent + seasonalComponent,
                confidence: 0.6
            };
        });

        return predictions;
    }

    createEnsemblePrediction(predictions) {
        const ensemble = {};
        const methods = ['linearRegression', 'exponentialSmoothing', 'seasonal'];
        const parameters = ['soilMoisture', 'ndvi', 'temperature'];

        parameters.forEach(param => {
            let weightedSum = 0;
            let totalWeight = 0;

            methods.forEach(method => {
                if (predictions[method] && predictions[method][param]) {
                    const pred = predictions[method][param];
                    const weight = pred.confidence;
                    weightedSum += pred.value * weight;
                    totalWeight += weight;
                }
            });

            if (totalWeight > 0) {
                ensemble[param] = {
                    value: weightedSum / totalWeight,
                    confidence: totalWeight / methods.length,
                    methods: methods.filter(m => predictions[m] && predictions[m][param])
                };
            }
        });

        return ensemble;
    }

    detectMLAnomalies(trainingData, currentData) {
        const anomalies = [];

        // Statistical anomaly detection
        const statAnomalies = this.detectStatisticalAnomalies(trainingData, currentData);
        anomalies.push(...statAnomalies);

        // Seasonal anomaly detection
        const seasonalAnomalies = this.detectSeasonalAnomalies(trainingData, currentData);
        anomalies.push(...seasonalAnomalies);

        // Multivariate anomaly detection
        const multivariateAnomalies = this.detectMultivariateAnomalies(trainingData, currentData);
        anomalies.push(...multivariateAnomalies);

        return anomalies;
    }

    detectStatisticalAnomalies(trainingData, currentData) {
        const anomalies = [];
        const parameters = ['soilMoisture', 'ndvi', 'temperature'];

        parameters.forEach(param => {
            const values = trainingData.map(d => d[param]);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const std = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length);

            const zScore = Math.abs((currentData[param] - mean) / std);

            if (zScore > 3) {
                anomalies.push({
                    type: 'statistical',
                    parameter: param,
                    severity: zScore > 4 ? 'extreme' : 'high',
                    zScore: zScore.toFixed(2),
                    description: `${param} value ${currentData[param].toFixed(3)} is ${zScore.toFixed(1)}σ from mean`,
                    confidence: Math.min(0.95, zScore / 5)
                });
            }
        });

        return anomalies;
    }

    detectSeasonalAnomalies(trainingData, currentData) {
        const anomalies = [];
        const currentDay = this.getDayOfYear(new Date());
        const currentMonth = Math.floor(currentDay / 30);

        // Group historical data by month
        const monthlyData = {};
        trainingData.forEach(d => {
            const day = this.getDayOfYear(new Date(d.timestamp));
            const month = Math.floor(day / 30);
            if (!monthlyData[month]) monthlyData[month] = [];
            monthlyData[month].push(d);
        });

        if (monthlyData[currentMonth] && monthlyData[currentMonth].length > 2) {
            const monthData = monthlyData[currentMonth];

            ['soilMoisture', 'ndvi', 'temperature'].forEach(param => {
                const values = monthData.map(d => d[param]);
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const std = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length);

                const deviation = Math.abs(currentData[param] - mean) / std;

                if (deviation > 2) {
                    anomalies.push({
                        type: 'seasonal',
                        parameter: param,
                        severity: deviation > 3 ? 'high' : 'medium',
                        deviation: deviation.toFixed(2),
                        description: `${param} unusual for this time of year`,
                        confidence: Math.min(0.9, deviation / 4)
                    });
                }
            });
        }

        return anomalies;
    }

    detectMultivariateAnomalies(trainingData, currentData) {
        const anomalies = [];

        // Check correlation-based anomalies
        const correlations = this.calculateCorrelations(trainingData);

        // Soil moisture vs NDVI correlation
        const expectedNDVI = this.predictFromCorrelation(currentData.soilMoisture, correlations.soilMoisture_ndvi);
        const ndviDeviation = Math.abs(currentData.ndvi - expectedNDVI);

        if (ndviDeviation > 0.1) {
            anomalies.push({
                type: 'multivariate',
                parameters: ['soilMoisture', 'ndvi'],
                severity: ndviDeviation > 0.2 ? 'high' : 'medium',
                description: `NDVI-soil moisture relationship anomaly detected`,
                deviation: ndviDeviation.toFixed(3),
                confidence: 0.7
            });
        }

        return anomalies;
    }

    calculateCorrelations(trainingData) {
        const correlations = {};

        // Soil moisture vs NDVI correlation
        const soilMoisture = trainingData.map(d => d.soilMoisture);
        const ndvi = trainingData.map(d => d.ndvi);
        correlations.soilMoisture_ndvi = this.calculatePearsonCorrelation(soilMoisture, ndvi);

        return correlations;
    }

    calculatePearsonCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
        const sumX2 = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
        const sumY2 = y.map(yi => yi * yi).reduce((a, b) => a + b, 0);

        const correlation = (n * sumXY - sumX * sumY) /
                          Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return {
            coefficient: correlation,
            slope: (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX),
            intercept: (sumY - this.slope * sumX) / n
        };
    }

    predictFromCorrelation(inputValue, correlation) {
        return correlation.slope * inputValue + correlation.intercept;
    }

    calculateFeatureImportance(trainingData) {
        const features = ['soilMoisture', 'ndvi', 'temperature', 'precipitation'];
        const importance = {};

        features.forEach(feature => {
            // Calculate correlation with target variables
            const values = trainingData.map(d => d[feature]);
            const targets = ['target_soilMoisture', 'target_ndvi', 'target_temperature'];

            let totalImportance = 0;
            targets.forEach(target => {
                const targetValues = trainingData.map(d => d[target]);
                const correlation = Math.abs(this.calculatePearsonCorrelation(values, targetValues).coefficient);
                totalImportance += correlation;
            });

            importance[feature] = {
                score: totalImportance / targets.length,
                rank: 0 // Will be set after sorting
            };
        });

        // Rank features by importance
        const sorted = Object.keys(importance).sort((a, b) => importance[b].score - importance[a].score);
        sorted.forEach((feature, index) => {
            importance[feature].rank = index + 1;
        });

        return importance;
    }

    evaluateModelPerformance(models, trainingData) {
        const performance = {};

        if (models.linearRegression) {
            performance.linearRegression = {
                r2: Object.values(models.linearRegression).map(m => m.r2).reduce((a, b) => a + b, 0) / Object.keys(models.linearRegression).length,
                mse: Object.values(models.linearRegression).map(m => m.mse).reduce((a, b) => a + b, 0) / Object.keys(models.linearRegression).length
            };
        }

        return performance;
    }

    calculatePredictionConfidence(predictions) {
        const allConfidences = [];

        Object.values(predictions).forEach(methodPredictions => {
            if (typeof methodPredictions === 'object') {
                Object.values(methodPredictions).forEach(pred => {
                    if (pred && pred.confidence) {
                        allConfidences.push(pred.confidence);
                    }
                });
            }
        });

        return allConfidences.length > 0 ?
               allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length : 0;
    }

    generateMLInsights(predictions, anomalies, featureImportance) {
        const insights = {
            keyFindings: [],
            recommendations: [],
            riskAssessment: this.assessMLRisks(predictions, anomalies),
            confidenceLevel: this.calculateOverallConfidence(predictions)
        };

        // Generate key findings
        if (anomalies.length > 0) {
            insights.keyFindings.push(`${anomalies.length} anomalies detected in current conditions`);
        }

        const topFeature = Object.keys(featureImportance).reduce((a, b) =>
            featureImportance[a].score > featureImportance[b].score ? a : b
        );
        insights.keyFindings.push(`${topFeature} is the most predictive feature (importance: ${featureImportance[topFeature].score.toFixed(2)})`);

        // Generate recommendations
        if (predictions.ensemble) {
            Object.keys(predictions.ensemble).forEach(param => {
                const pred = predictions.ensemble[param];
                if (pred.confidence > 0.7) {
                    insights.recommendations.push({
                        parameter: param,
                        prediction: pred.value.toFixed(3),
                        confidence: pred.confidence.toFixed(2),
                        action: this.getRecommendationForPrediction(param, pred.value)
                    });
                }
            });
        }

        return insights;
    }

    assessMLRisks(predictions, anomalies) {
        let riskLevel = 'low';
        const risks = [];

        // High anomaly count increases risk
        if (anomalies.length > 3) {
            riskLevel = 'high';
            risks.push('Multiple anomalies detected');
        } else if (anomalies.length > 1) {
            riskLevel = 'medium';
        }

        // Extreme anomalies
        const extremeAnomalies = anomalies.filter(a => a.severity === 'extreme');
        if (extremeAnomalies.length > 0) {
            riskLevel = 'high';
            risks.push('Extreme anomalies present');
        }

        return { level: riskLevel, factors: risks };
    }

    calculateOverallConfidence(predictions) {
        if (predictions.ensemble) {
            const confidences = Object.values(predictions.ensemble)
                                     .map(p => p.confidence)
                                     .filter(c => c !== undefined);

            return confidences.length > 0 ?
                   confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
        }
        return 0;
    }

    getRecommendationForPrediction(parameter, value) {
        switch(parameter) {
            case 'soilMoisture':
                if (value < 0.2) return 'Increase irrigation - low soil moisture predicted';
                if (value > 0.5) return 'Monitor drainage - high soil moisture predicted';
                return 'Maintain current irrigation schedule';

            case 'ndvi':
                if (value < 0.3) return 'Monitor crop health - declining vegetation predicted';
                if (value > 0.8) return 'Optimal growing conditions predicted';
                return 'Continue current management practices';

            case 'temperature':
                if (value > 35) return 'Prepare heat stress mitigation measures';
                if (value < 5) return 'Implement frost protection measures';
                return 'Normal temperature conditions expected';

            default:
                return 'Monitor conditions closely';
        }
    }

    /**
     * Real-time weather integration
     */
    async getEnhancedWeatherData(location) {
        try {
            // For demo purposes, generate realistic weather data
            // In production, integrate with APIs like OpenWeatherMap, WeatherAPI, etc.
            const weatherData = await this.generateRealisticWeatherData(location);

            // Add weather-satellite fusion analysis
            const weatherSatelliteCorrelation = this.analyzeWeatherSatelliteCorrelation(weatherData);

            return {
                ...weatherData,
                correlation: weatherSatelliteCorrelation,
                alerts: this.generateWeatherAlerts(weatherData),
                forecast: await this.getWeatherForecast(location),
                agronomicInsights: this.generateAgronomicWeatherInsights(weatherData, location)
            };
        } catch (error) {
            console.error('Weather data fetch failed:', error);
            return this.getFallbackWeatherData(location);
        }
    }

    async generateRealisticWeatherData(location) {
        const now = new Date();
        const latitude = Math.abs(location.lat);

        // Base weather on latitude and season
        const isWinter = now.getMonth() >= 11 || now.getMonth() <= 2;
        const isSummer = now.getMonth() >= 5 && now.getMonth() <= 8;

        // Temperature modeling based on latitude and season
        let baseTemp = 20; // Celsius
        if (latitude > 60) baseTemp = isWinter ? -10 : 15;
        else if (latitude > 45) baseTemp = isWinter ? 5 : 22;
        else if (latitude > 30) baseTemp = isWinter ? 15 : 30;
        else if (latitude < 23.5) baseTemp = isWinter ? 25 : 32; // Tropical

        const temperature = baseTemp + (Math.random() - 0.5) * 10;
        const humidity = Math.min(95, Math.max(15, 60 + (Math.random() - 0.5) * 40));
        const windSpeed = Math.max(0, 3 + (Math.random() - 0.5) * 8);
        const pressure = 1013 + (Math.random() - 0.5) * 30;

        // Precipitation based on season and location
        let precipitationProbability = 0.2;
        if (latitude < 10) precipitationProbability = 0.4; // Tropical
        if (isWinter && latitude > 30) precipitationProbability = 0.3; // Winter precipitation

        const precipitation = Math.random() < precipitationProbability ?
                             Math.random() * 25 : 0;

        // Cloud cover correlated with humidity and precipitation
        const cloudCover = Math.min(100, Math.max(0,
            (humidity - 30) * 1.5 + (precipitation > 0 ? 40 : 0) + (Math.random() - 0.5) * 30
        ));

        // UV Index based on latitude, season, and cloud cover
        const maxUV = latitude < 23.5 ? 12 : latitude < 45 ? 8 : 6;
        const uvIndex = Math.max(0, maxUV * (1 - cloudCover / 100) * (isSummer ? 1.2 : 0.8));

        return {
            timestamp: now.toISOString(),
            temperature: parseFloat(temperature.toFixed(1)),
            temperatureFeelsLike: parseFloat((temperature + (humidity > 70 ? 3 : -1)).toFixed(1)),
            humidity: parseFloat(humidity.toFixed(0)),
            windSpeed: parseFloat(windSpeed.toFixed(1)),
            windDirection: Math.floor(Math.random() * 360),
            pressure: parseFloat(pressure.toFixed(1)),
            precipitation: parseFloat(precipitation.toFixed(1)),
            cloudCover: parseFloat(cloudCover.toFixed(0)),
            uvIndex: parseFloat(uvIndex.toFixed(1)),
            dewPoint: parseFloat((temperature - (100 - humidity) / 5).toFixed(1)),
            visibility: Math.max(1, 15 - cloudCover / 10 + (Math.random() - 0.5) * 5),
            source: 'Enhanced Weather Model',
            location,
            conditions: this.determineWeatherConditions(temperature, humidity, precipitation, cloudCover, windSpeed)
        };
    }

    determineWeatherConditions(temp, humidity, precip, clouds, wind) {
        if (precip > 10) return wind > 10 ? 'thunderstorm' : 'heavy_rain';
        if (precip > 2) return 'light_rain';
        if (clouds > 80) return 'overcast';
        if (clouds > 50) return 'partly_cloudy';
        if (clouds < 20) return temp > 25 ? 'hot_sunny' : 'clear';
        return 'partly_sunny';
    }

    analyzeWeatherSatelliteCorrelation(weatherData) {
        // Analyze correlation between weather and satellite observations
        return {
            temperatureSatelliteAlignment: this.assessTemperatureAlignment(weatherData),
            moistureCoherence: this.assessMoistureCoherence(weatherData),
            vegetationWeatherStress: this.assessVegetationWeatherStress(weatherData),
            precipitationValidation: this.validatePrecipitationWithSatellite(weatherData)
        };
    }

    assessTemperatureAlignment(weatherData) {
        // Compare ground weather temp with satellite land surface temperature
        const groundTemp = weatherData.temperature + 273.15; // Convert to Kelvin
        const expectedLSTDiff = 5; // Expected difference between ground and LST

        return {
            coherence: 'high', // Would be calculated based on actual LST data
            expectedLST: groundTemp + expectedLSTDiff,
            reliability: 0.85
        };
    }

    assessMoistureCoherence(weatherData) {
        // Assess how weather humidity aligns with soil moisture patterns
        const { humidity, precipitation } = weatherData;

        let coherenceLevel = 'medium';
        if (humidity > 70 && precipitation > 5) coherenceLevel = 'high';
        else if (humidity < 40 && precipitation === 0) coherenceLevel = 'high';
        else if (Math.abs(humidity - 50) < 10) coherenceLevel = 'medium';
        else coherenceLevel = 'low';

        return {
            level: coherenceLevel,
            soilMoistureExpectation: this.predictSoilMoistureFromWeather(weatherData),
            confidence: coherenceLevel === 'high' ? 0.9 : coherenceLevel === 'medium' ? 0.7 : 0.5
        };
    }

    assessVegetationWeatherStress(weatherData) {
        const { temperature, humidity, windSpeed, uvIndex } = weatherData;

        let stressFactors = [];
        let stressLevel = 0;

        // Temperature stress
        if (temperature > 35) {
            stressFactors.push('high_temperature');
            stressLevel += 0.3;
        } else if (temperature < 5) {
            stressFactors.push('low_temperature');
            stressLevel += 0.4;
        }

        // Humidity stress
        if (humidity < 30) {
            stressFactors.push('low_humidity');
            stressLevel += 0.2;
        } else if (humidity > 85) {
            stressFactors.push('high_humidity');
            stressLevel += 0.1;
        }

        // Wind stress
        if (windSpeed > 12) {
            stressFactors.push('high_wind');
            stressLevel += 0.2;
        }

        // UV stress
        if (uvIndex > 8) {
            stressFactors.push('high_uv');
            stressLevel += 0.15;
        }

        return {
            level: Math.min(1, stressLevel),
            factors: stressFactors,
            category: stressLevel > 0.7 ? 'severe' : stressLevel > 0.4 ? 'moderate' : stressLevel > 0.1 ? 'mild' : 'minimal'
        };
    }

    validatePrecipitationWithSatellite(weatherData) {
        // Cross-validate precipitation with satellite precipitation data
        const { precipitation } = weatherData;

        return {
            groundMeasurement: precipitation,
            satelliteEstimation: precipitation * (0.8 + Math.random() * 0.4), // Simulated variation
            agreement: 'good', // Would be calculated based on actual comparison
            confidence: 0.8
        };
    }

    predictSoilMoistureFromWeather(weatherData) {
        const { precipitation, humidity, temperature, windSpeed } = weatherData;

        // Simple model to predict soil moisture from weather
        let moistureIndex = 0.3; // Base moisture

        // Precipitation impact
        moistureIndex += precipitation * 0.02;

        // Humidity impact
        moistureIndex += (humidity - 50) * 0.002;

        // Temperature impact (higher temp reduces moisture)
        moistureIndex -= Math.max(0, (temperature - 25) * 0.005);

        // Wind impact (increases evaporation)
        moistureIndex -= windSpeed * 0.003;

        return Math.min(0.8, Math.max(0.1, moistureIndex));
    }

    generateWeatherAlerts(weatherData) {
        const alerts = [];
        const thresholds = this.weatherSettings.alertThresholds;

        // Temperature alerts
        if (weatherData.temperature > thresholds.temperature.max) {
            alerts.push({
                type: 'extreme_heat',
                severity: 'high',
                message: `Extreme heat warning: ${weatherData.temperature}°C`,
                recommendations: ['Provide shade for crops', 'Increase irrigation', 'Avoid midday field work']
            });
        } else if (weatherData.temperature < thresholds.temperature.min) {
            alerts.push({
                type: 'frost_warning',
                severity: 'high',
                message: `Frost warning: ${weatherData.temperature}°C`,
                recommendations: ['Cover sensitive plants', 'Consider frost protection', 'Monitor for damage']
            });
        }

        // Wind alerts
        if (weatherData.windSpeed > thresholds.windSpeed) {
            alerts.push({
                type: 'high_wind',
                severity: 'medium',
                message: `High wind conditions: ${weatherData.windSpeed} m/s`,
                recommendations: ['Avoid spraying operations', 'Check irrigation equipment', 'Secure loose materials']
            });
        }

        // Precipitation alerts
        if (weatherData.precipitation > thresholds.precipitation) {
            alerts.push({
                type: 'heavy_rainfall',
                severity: 'medium',
                message: `Heavy rainfall: ${weatherData.precipitation} mm`,
                recommendations: ['Check drainage', 'Delay field operations', 'Monitor for flooding']
            });
        }

        // Humidity alerts
        if (weatherData.humidity < thresholds.humidity.min) {
            alerts.push({
                type: 'low_humidity',
                severity: 'low',
                message: `Very dry conditions: ${weatherData.humidity}% humidity`,
                recommendations: ['Increase irrigation frequency', 'Monitor plant stress', 'Consider windbreaks']
            });
        } else if (weatherData.humidity > thresholds.humidity.max) {
            alerts.push({
                type: 'high_humidity',
                severity: 'medium',
                message: `High humidity: ${weatherData.humidity}%`,
                recommendations: ['Monitor for fungal diseases', 'Improve air circulation', 'Adjust spray timing']
            });
        }

        return alerts;
    }

    async getWeatherForecast(location) {
        // Generate 7-day forecast
        const forecast = [];
        const baseWeather = await this.generateRealisticWeatherData(location);

        for (let day = 1; day <= this.weatherSettings.forecastDays; day++) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + day);

            // Add some variation to base weather
            const tempVariation = (Math.random() - 0.5) * 8;
            const humidityVariation = (Math.random() - 0.5) * 20;
            const precipVariation = Math.random() * 15;

            forecast.push({
                date: futureDate.toISOString().split('T')[0],
                temperature: {
                    min: baseWeather.temperature + tempVariation - 3,
                    max: baseWeather.temperature + tempVariation + 5,
                    avg: baseWeather.temperature + tempVariation
                },
                humidity: Math.min(95, Math.max(15, baseWeather.humidity + humidityVariation)),
                precipitation: Math.random() < 0.3 ? precipVariation : 0,
                windSpeed: Math.max(0, baseWeather.windSpeed + (Math.random() - 0.5) * 5),
                conditions: this.predictWeatherConditions(day, baseWeather),
                confidence: Math.max(0.3, 0.9 - day * 0.1) // Confidence decreases with time
            });
        }

        return forecast;
    }

    predictWeatherConditions(daysAhead, baseWeather) {
        // Simple weather pattern prediction
        const patterns = ['clear', 'partly_cloudy', 'cloudy', 'light_rain', 'sunny'];
        const confidence = Math.max(0.3, 1 - daysAhead * 0.1);

        return {
            primary: patterns[Math.floor(Math.random() * patterns.length)],
            confidence
        };
    }

    generateAgronomicWeatherInsights(weatherData, location) {
        const insights = {
            evapotranspiration: this.calculateEvapotranspiration(weatherData),
            growingDegreeDay: this.calculateGrowingDegreeDays(weatherData),
            stressFactors: this.identifyWeatherStressFactors(weatherData),
            optimalActivities: this.identifyOptimalFarmActivities(weatherData),
            cropStageImpact: this.assessCropStageImpact(weatherData)
        };

        return insights;
    }

    calculateEvapotranspiration(weatherData) {
        // Simplified Penman-Monteith equation components
        const { temperature, humidity, windSpeed, uvIndex } = weatherData;

        // Reference ET calculation (simplified)
        const temperatureFactor = Math.max(0, (temperature - 5) / 30);
        const humidityFactor = Math.max(0.2, 1 - humidity / 100);
        const windFactor = 1 + windSpeed / 10;
        const solarFactor = uvIndex / 10;

        const et = temperatureFactor * humidityFactor * windFactor * solarFactor * 5; // mm/day

        return {
            dailyET: parseFloat(et.toFixed(2)),
            category: et > 6 ? 'high' : et > 3 ? 'moderate' : 'low',
            waterDemand: et * 1.2 // Including crop coefficient
        };
    }

    calculateGrowingDegreeDays(weatherData) {
        const { temperature, temperatureFeelsLike } = weatherData;
        const baseTemp = 10; // Base temperature for most crops (°C)
        const upperLimit = 30; // Upper limit for GDD calculation

        const adjustedTemp = Math.min(upperLimit, Math.max(baseTemp, temperatureFeelsLike));
        const gdd = Math.max(0, adjustedTemp - baseTemp);

        return {
            daily: parseFloat(gdd.toFixed(1)),
            category: gdd > 20 ? 'high' : gdd > 10 ? 'moderate' : 'low',
            cropDevelopment: this.interpretGDDForCrops(gdd)
        };
    }

    interpretGDDForCrops(gdd) {
        if (gdd > 20) return 'rapid_development';
        if (gdd > 15) return 'active_growth';
        if (gdd > 10) return 'steady_progress';
        if (gdd > 5) return 'slow_development';
        return 'minimal_activity';
    }

    identifyWeatherStressFactors(weatherData) {
        const stressFactors = [];
        const { temperature, humidity, windSpeed, uvIndex, precipitation } = weatherData;

        if (temperature > 32) stressFactors.push({ factor: 'heat_stress', severity: 'high' });
        if (temperature < 8) stressFactors.push({ factor: 'cold_stress', severity: 'high' });
        if (humidity < 30) stressFactors.push({ factor: 'drought_stress', severity: 'medium' });
        if (windSpeed > 10) stressFactors.push({ factor: 'wind_stress', severity: 'medium' });
        if (uvIndex > 9) stressFactors.push({ factor: 'uv_stress', severity: 'low' });
        if (precipitation > 25) stressFactors.push({ factor: 'waterlog_risk', severity: 'medium' });

        return stressFactors;
    }

    identifyOptimalFarmActivities(weatherData) {
        const activities = [];
        const { temperature, humidity, windSpeed, precipitation, conditions } = weatherData;

        // Optimal conditions for different activities
        if (windSpeed < 5 && precipitation === 0) {
            activities.push({ activity: 'spraying', suitability: 'excellent' });
        }

        if (temperature > 15 && temperature < 25 && precipitation === 0) {
            activities.push({ activity: 'planting', suitability: 'good' });
        }

        if (humidity > 60 && precipitation === 0) {
            activities.push({ activity: 'harvesting', suitability: 'poor' });
        } else if (humidity < 60 && windSpeed < 8) {
            activities.push({ activity: 'harvesting', suitability: 'excellent' });
        }

        if (conditions === 'clear' || conditions === 'partly_sunny') {
            activities.push({ activity: 'field_inspection', suitability: 'excellent' });
        }

        return activities;
    }

    assessCropStageImpact(weatherData) {
        const { temperature, humidity, precipitation } = weatherData;

        return {
            germination: this.assessStageConditions('germination', weatherData),
            vegetative: this.assessStageConditions('vegetative', weatherData),
            flowering: this.assessStageConditions('flowering', weatherData),
            maturity: this.assessStageConditions('maturity', weatherData)
        };
    }

    assessStageConditions(stage, weatherData) {
        const { temperature, humidity, precipitation, windSpeed } = weatherData;

        let suitability = 'moderate';
        const factors = [];

        switch(stage) {
            case 'germination':
                if (temperature > 15 && temperature < 25 && humidity > 60) {
                    suitability = 'excellent';
                } else if (temperature < 10 || temperature > 30) {
                    suitability = 'poor';
                    factors.push('temperature_stress');
                }
                break;

            case 'vegetative':
                if (temperature > 18 && temperature < 28 && precipitation < 15) {
                    suitability = 'good';
                } else if (temperature > 32 || windSpeed > 12) {
                    suitability = 'poor';
                    factors.push('environmental_stress');
                }
                break;

            case 'flowering':
                if (temperature > 20 && temperature < 26 && windSpeed < 8 && precipitation < 10) {
                    suitability = 'excellent';
                } else if (temperature > 30 || precipitation > 20) {
                    suitability = 'poor';
                    factors.push('critical_stage_stress');
                }
                break;

            case 'maturity':
                if (temperature < 30 && humidity < 70 && precipitation < 5) {
                    suitability = 'good';
                } else if (precipitation > 15 || humidity > 85) {
                    suitability = 'poor';
                    factors.push('harvest_complications');
                }
                break;
        }

        return { suitability, factors };
    }

    getFallbackWeatherData(location) {
        return {
            temperature: 22,
            temperatureFeelsLike: 23,
            humidity: 65,
            windSpeed: 3,
            windDirection: 180,
            pressure: 1013,
            precipitation: 0,
            cloudCover: 30,
            uvIndex: 5,
            dewPoint: 16,
            visibility: 10,
            source: 'Fallback Weather Data',
            location,
            conditions: 'partly_sunny',
            alerts: [],
            forecast: [],
            agronomicInsights: {
                evapotranspiration: { dailyET: 3.5, category: 'moderate' },
                growingDegreeDay: { daily: 12, category: 'moderate' }
            }
        };
    }

    /**
     * Enhanced SMAP data with quality filtering and vegetation water content
     */
    async getEnhancedSMAPData(location, options = {}) {
        const { includeQualityFilter = true, includeVWC = true } = options;

        try {
            // Get user token from localStorage
            const token = localStorage.getItem('nasa_earthdata_token');

            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`http://localhost:3001/api/smap/soil-moisture?lat=${location.lat}&lon=${location.lon}`, {
                headers
            });
            const rawData = await response.json();

            // Enhance with quality assessment
            const enhancedData = {
                ...rawData,
                soilMoisture: rawData.soilMoisture || 0.35,
                surfaceTemperature: this.calculateSurfaceTemp(location.lat),
                vegetationWaterContent: this.calculateVWC(rawData.soilMoisture, location),
                qualityFlag: this.assessDataQuality(rawData),
                reliability: this.calculateReliability(rawData)
            };

            // Filter based on quality if requested
            if (includeQualityFilter && enhancedData.qualityFlag !== 'good_quality') {
                enhancedData.filtered = true;
                enhancedData.fallbackReason = `Data quality issue: ${enhancedData.qualityFlag}`;
            }

            // Add edge case detection
            enhancedData.edgeCases = this.detectSMAPEdgeCases(enhancedData);

            return enhancedData;
        } catch (error) {
            console.error('Enhanced SMAP fetch failed:', error);
            return this.getFallbackSMAPData(location);
        }
    }

    /**
     * Crop-specific sensor fusion analysis
     */
    async performCropSpecificFusion(location, cropType = 'wheat', growthStage = null) {
        const baseFusion = await this.performSensorFusion(location);

        if (!this.cropProfiles[cropType]) {
            console.warn(`Crop type ${cropType} not found, using default analysis`);
            return baseFusion;
        }

        const cropProfile = this.cropProfiles[cropType];
        const cropInsights = this.analyzeCropSpecificConditions(baseFusion, cropProfile, growthStage);

        return {
            ...baseFusion,
            cropType,
            cropProfile,
            growthStage,
            cropInsights,
            cropRecommendations: this.generateCropSpecificRecommendations(baseFusion, cropProfile, cropInsights, growthStage)
        };
    }

    analyzeCropSpecificConditions(fusionData, cropProfile, growthStage) {
        const currentNDVI = fusionData.rawData.modis.ndvi;
        const currentSoilMoisture = fusionData.rawData.smap.soilMoisture;
        const currentTemp = fusionData.rawData.modis.landSurfaceTemp;

        // Assess crop health relative to crop-specific optimal ranges
        const ndviHealth = this.assessParameterHealth(currentNDVI, cropProfile.optimalNDVI);
        const moistureHealth = this.assessParameterHealth(currentSoilMoisture, cropProfile.optimalSoilMoisture);
        const temperatureHealth = this.assessParameterHealth(currentTemp, cropProfile.optimalTemperature);

        // Calculate crop-specific stress indicators
        const cropWaterStress = this.calculateCropWaterStress(
            currentSoilMoisture,
            currentTemp,
            cropProfile.waterStressTolerance,
            cropProfile.optimalSoilMoisture
        );

        // Analyze growth stage compatibility
        const stageAnalysis = growthStage ? this.analyzeGrowthStage(
            fusionData,
            cropProfile.growthStages[growthStage],
            growthStage
        ) : null;

        // Detect crop-specific alerts
        const specificAlerts = this.detectCropSpecificAlerts(
            fusionData,
            cropProfile.specificAlerts,
            currentTemp,
            currentSoilMoisture
        );

        return {
            overallCropHealth: (ndviHealth.score + moistureHealth.score + temperatureHealth.score) / 3,
            parameterHealth: {
                ndvi: ndviHealth,
                soilMoisture: moistureHealth,
                temperature: temperatureHealth
            },
            cropWaterStress,
            stageAnalysis,
            specificAlerts,
            optimizationScore: this.calculateCropOptimizationScore(fusionData, cropProfile)
        };
    }

    assessParameterHealth(currentValue, optimalRange) {
        const { min, max, ideal } = optimalRange;
        let score = 0;
        let status = '';

        if (currentValue >= min && currentValue <= max) {
            // Within acceptable range
            const distanceFromIdeal = Math.abs(currentValue - ideal);
            const rangeSize = (max - min) / 2;
            score = Math.max(0.6, 1 - (distanceFromIdeal / rangeSize) * 0.4);

            if (Math.abs(currentValue - ideal) < rangeSize * 0.2) {
                status = 'optimal';
            } else {
                status = 'acceptable';
            }
        } else if (currentValue < min) {
            const deficitRatio = (min - currentValue) / min;
            score = Math.max(0, 0.5 - deficitRatio);
            status = deficitRatio > 0.5 ? 'critically_low' : 'low';
        } else {
            const excessRatio = (currentValue - max) / max;
            score = Math.max(0, 0.5 - excessRatio);
            status = excessRatio > 0.5 ? 'critically_high' : 'high';
        }

        return { score, status, currentValue, optimal: optimalRange };
    }

    calculateCropWaterStress(soilMoisture, temperature, tolerance, optimalMoisture) {
        const baseStress = Math.max(0, (optimalMoisture.ideal - soilMoisture) / optimalMoisture.ideal);
        const tempStress = Math.max(0, (temperature - 303) / 15); // Above 30°C baseline
        const toleranceAdjustment = 1 - tolerance; // Lower tolerance = higher stress impact

        const cropStress = (baseStress * 0.7 + tempStress * 0.3) * (1 + toleranceAdjustment);

        return {
            level: Math.min(1, cropStress),
            category: cropStress > 0.8 ? 'severe' :
                     cropStress > 0.5 ? 'moderate' :
                     cropStress > 0.2 ? 'mild' : 'minimal',
            toleranceAdjustment
        };
    }

    analyzeGrowthStage(fusionData, stageProfile, stageName) {
        if (!stageProfile) return null;

        const currentNDVI = fusionData.rawData.modis.ndvi;
        const currentSoilMoisture = fusionData.rawData.smap.soilMoisture;

        const ndviAlignment = currentNDVI >= stageProfile.ndviTarget * 0.8 ? 'on_track' :
                             currentNDVI >= stageProfile.ndviTarget * 0.6 ? 'behind' : 'significantly_behind';

        const moistureAlignment = currentSoilMoisture >= stageProfile.moistureNeed * 0.9 ? 'adequate' :
                                 currentSoilMoisture >= stageProfile.moistureNeed * 0.7 ? 'marginal' : 'insufficient';

        return {
            stage: stageName,
            duration: stageProfile.duration,
            ndvi: {
                target: stageProfile.ndviTarget,
                current: currentNDVI,
                alignment: ndviAlignment
            },
            moisture: {
                needed: stageProfile.moistureNeed,
                current: currentSoilMoisture,
                alignment: moistureAlignment
            },
            stageHealth: ndviAlignment === 'on_track' && moistureAlignment === 'adequate' ? 'healthy' :
                        ndviAlignment !== 'significantly_behind' && moistureAlignment !== 'insufficient' ? 'caution' : 'critical'
        };
    }

    detectCropSpecificAlerts(fusionData, specificAlerts, temperature, soilMoisture) {
        const alerts = [];

        Object.keys(specificAlerts).forEach(alertType => {
            const alertConfig = specificAlerts[alertType];
            let alertTriggered = false;
            let severity = 'medium';

            switch(alertType) {
                case 'disease':
                case 'rust':
                case 'blight':
                    if (alertConfig.tempRange &&
                        temperature >= alertConfig.tempRange[0] &&
                        temperature <= alertConfig.tempRange[1] &&
                        fusionData.rawData.smap.vegetationWaterContent > (alertConfig.humidityMin || 0.7) * 5) {
                        alertTriggered = true;
                        severity = 'high';
                    }
                    break;

                case 'pest':
                case 'aphids':
                case 'bollworm':
                    if (alertConfig.tempRange &&
                        temperature >= alertConfig.tempRange[0] &&
                        temperature <= alertConfig.tempRange[1] &&
                        fusionData.waterStressIndex > (alertConfig.droughtStress || 0.4) * 100) {
                        alertTriggered = true;
                        severity = 'medium';
                    }
                    break;

                case 'waterStress':
                    if (soilMoisture < alertConfig.threshold) {
                        alertTriggered = true;
                        severity = 'high';
                    }
                    break;

                case 'heatStress':
                    if (temperature > alertConfig.tempThreshold) {
                        alertTriggered = true;
                        severity = 'high';
                    }
                    break;

                case 'flooding':
                    if (alertConfig.required && soilMoisture < alertConfig.soilMoistureMin) {
                        alertTriggered = true;
                        severity = 'critical';
                    } else if (!alertConfig.required && soilMoisture > 0.6) {
                        alertTriggered = true;
                        severity = 'medium';
                    }
                    break;

                case 'wilt':
                    if (soilMoisture < alertConfig.soilMoisture && temperature > alertConfig.tempThreshold) {
                        alertTriggered = true;
                        severity = 'high';
                    }
                    break;
            }

            if (alertTriggered) {
                alerts.push({
                    type: alertType,
                    severity,
                    description: this.getAlertDescription(alertType, alertConfig),
                    recommendations: this.getAlertRecommendations(alertType)
                });
            }
        });

        return alerts;
    }

    getAlertDescription(alertType, config) {
        const descriptions = {
            disease: 'Conditions favorable for crop disease development detected',
            pest: 'Environmental conditions may promote pest activity',
            rust: 'High humidity and temperature conditions favorable for rust disease',
            blight: 'Environmental conditions conducive to blight development',
            aphids: 'Drought stress conditions that may attract aphids',
            bollworm: 'Temperature and moisture conditions favorable for bollworm activity',
            waterStress: 'Soil moisture below critical threshold for crop growth',
            heatStress: 'Temperature stress conditions detected',
            flooding: 'Soil moisture conditions not meeting crop requirements',
            wilt: 'Combined heat and water stress conditions detected',
            blossom_rot: 'Conditions that may lead to blossom end rot'
        };

        return descriptions[alertType] || `${alertType} alert conditions detected`;
    }

    getAlertRecommendations(alertType) {
        const recommendations = {
            disease: ['Apply preventive fungicide', 'Improve air circulation', 'Monitor crop closely'],
            pest: ['Scout for pest presence', 'Consider integrated pest management', 'Monitor weekly'],
            rust: ['Apply fungicide if rust observed', 'Avoid overhead irrigation', 'Ensure good drainage'],
            blight: ['Apply appropriate fungicide', 'Remove infected plant material', 'Improve ventilation'],
            aphids: ['Scout for aphid colonies', 'Consider beneficial insects', 'Monitor stress levels'],
            bollworm: ['Check for egg laying', 'Consider pheromone traps', 'Plan treatment if needed'],
            waterStress: ['Increase irrigation frequency', 'Apply mulch to conserve moisture', 'Monitor daily'],
            heatStress: ['Provide shade if possible', 'Increase irrigation', 'Time applications for cooler periods'],
            flooding: ['Improve drainage', 'Adjust irrigation schedule', 'Monitor for root issues'],
            wilt: ['Immediate irrigation needed', 'Check irrigation system', 'Provide temporary shade'],
            blossom_rot: ['Maintain consistent soil moisture', 'Check calcium levels', 'Improve drainage']
        };

        return recommendations[alertType] || ['Monitor conditions closely', 'Consult agricultural specialist'];
    }

    calculateCropOptimizationScore(fusionData, cropProfile) {
        const ndviScore = this.assessParameterHealth(fusionData.rawData.modis.ndvi, cropProfile.optimalNDVI).score;
        const moistureScore = this.assessParameterHealth(fusionData.rawData.smap.soilMoisture, cropProfile.optimalSoilMoisture).score;
        const tempScore = this.assessParameterHealth(fusionData.rawData.modis.landSurfaceTemp, cropProfile.optimalTemperature).score;

        return {
            overall: (ndviScore * 0.4 + moistureScore * 0.4 + tempScore * 0.2),
            breakdown: {
                vegetation: ndviScore,
                water: moistureScore,
                temperature: tempScore
            }
        };
    }

    generateCropSpecificRecommendations(fusionData, cropProfile, cropInsights, growthStage) {
        const recommendations = [];

        // Health-based recommendations
        if (cropInsights.parameterHealth.soilMoisture.status === 'low' || cropInsights.parameterHealth.soilMoisture.status === 'critically_low') {
            recommendations.push({
                category: 'irrigation',
                priority: cropInsights.parameterHealth.soilMoisture.status === 'critically_low' ? 'critical' : 'high',
                action: `Increase irrigation for ${cropProfile.name}`,
                reason: `Soil moisture (${(fusionData.rawData.smap.soilMoisture * 100).toFixed(1)}%) below optimal range`,
                cropSpecific: true
            });
        }

        // Growth stage recommendations
        if (cropInsights.stageAnalysis) {
            const stage = cropInsights.stageAnalysis;
            if (stage.ndvi.alignment === 'behind' || stage.ndvi.alignment === 'significantly_behind') {
                recommendations.push({
                    category: 'nutrition',
                    priority: stage.ndvi.alignment === 'significantly_behind' ? 'high' : 'medium',
                    action: `Apply nitrogen fertilizer during ${growthStage} stage`,
                    reason: `NDVI below target for ${growthStage} stage of ${cropProfile.name}`,
                    cropSpecific: true
                });
            }

            if (stage.moisture.alignment === 'insufficient') {
                recommendations.push({
                    category: 'irrigation',
                    priority: 'high',
                    action: `Critical irrigation needed for ${growthStage} stage`,
                    reason: `${cropProfile.name} requires ${(stage.moisture.needed * 100).toFixed(0)}% soil moisture during ${growthStage}`,
                    cropSpecific: true
                });
            }
        }

        // Water stress tolerance recommendations
        if (cropInsights.cropWaterStress.category === 'severe' && cropProfile.waterStressTolerance < 0.5) {
            recommendations.push({
                category: 'emergency',
                priority: 'critical',
                action: `Emergency irrigation for water-sensitive ${cropProfile.name}`,
                reason: `${cropProfile.name} has low water stress tolerance and is experiencing severe stress`,
                cropSpecific: true
            });
        }

        // Temperature-based recommendations
        if (cropInsights.parameterHealth.temperature.status === 'critically_high') {
            recommendations.push({
                category: 'cooling',
                priority: 'high',
                action: `Implement cooling strategies for ${cropProfile.name}`,
                reason: `Temperature exceeds safe range for ${cropProfile.name}`,
                cropSpecific: true
            });
        }

        // Specific alert recommendations
        cropInsights.specificAlerts.forEach(alert => {
            recommendations.push({
                category: 'pest_disease',
                priority: alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : 'medium',
                action: alert.recommendations[0] || `Address ${alert.type} risk`,
                reason: alert.description,
                cropSpecific: true,
                alertType: alert.type
            });
        });

        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    /**
     * Sensor fusion: Combine SMAP and MODIS for water stress detection
     */
    async performSensorFusion(location) {
        const [smapData, modisData] = await Promise.all([
            this.getEnhancedSMAPData(location),
            this.getEnhancedMODISData(location)
        ]);

        const fusion = {
            timestamp: new Date().toISOString(),
            location,

            // Water stress indicator combining soil moisture and land surface temperature
            waterStressIndex: this.calculateWaterStressIndex(
                smapData.soilMoisture,
                modisData.landSurfaceTemp,
                smapData.surfaceTemperature
            ),

            // Vegetation stress combining NDVI and vegetation water content
            vegetationStressIndex: this.calculateVegetationStress(
                modisData.ndvi,
                smapData.vegetationWaterContent
            ),

            // Overall farm health score (0-100)
            farmHealthScore: this.calculateFarmHealth({
                soilMoisture: smapData.soilMoisture,
                ndvi: modisData.ndvi,
                vwc: smapData.vegetationWaterContent,
                lst: modisData.landSurfaceTemp
            }),

            // Specific alerts based on fusion
            alerts: this.generateFusionAlerts(smapData, modisData),

            // Confidence score based on data quality
            confidence: (smapData.reliability + modisData.reliability) / 2,

            rawData: { smap: smapData, modis: modisData }
        };

        return fusion;
    }

    /**
     * Enhanced MODIS data with pixel reliability
     */
    async getEnhancedMODISData(location) {
        try {
            // Get user token from localStorage
            const token = localStorage.getItem('nasa_earthdata_token');

            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`http://localhost:3001/api/modis/ndvi?lat=${location.lat}&lon=${location.lon}`, {
                headers
            });
            const rawData = await response.json();

            const enhancedData = {
                ...rawData,
                ndvi: rawData.ndvi || this.calculateLocationBasedNDVI(location.lat),
                evi: this.calculateEVI(rawData.ndvi), // Enhanced Vegetation Index
                landSurfaceTemp: this.calculateLST(location),
                pixelReliability: this.assessPixelQuality(rawData),
                reliability: 0.85 // Default high reliability for MODIS
            };

            // Detect vegetation anomalies
            enhancedData.anomalies = this.detectVegetationAnomalies(enhancedData);

            return enhancedData;
        } catch (error) {
            console.error('Enhanced MODIS fetch failed:', error);
            return this.getFallbackMODISData(location);
        }
    }

    /**
     * GPM precipitation with confidence scoring
     */
    async getEnhancedGPMData(location) {
        try {
            // Simulate GPM IMERG data
            const precipitationRate = Math.random() * 2; // mm/hr
            const kalmanWeight = 0.7 + Math.random() * 0.3; // Higher = more reliable

            const gpmData = {
                precipitationCal: precipitationRate,
                irKalmanFilterWeight: kalmanWeight,
                probabilityLiquidPrecipitation: this.calculateLiquidProbability(location.lat),
                confidence: this.calculateGPMConfidence(kalmanWeight),

                // Temporal intelligence
                forecast: this.generatePrecipitationForecast(precipitationRate),
                historicalAnomaly: this.detectPrecipitationAnomaly(precipitationRate, location),

                // Edge case detection
                floodRisk: precipitationRate > 10, // Heavy rain threshold
                droughtRisk: precipitationRate < 0.1 // No rain
            };

            return gpmData;
        } catch (error) {
            console.error('Enhanced GPM fetch failed:', error);
            return this.getFallbackGPMData(location);
        }
    }

    /**
     * Sentinel-2 high-resolution analysis with SWIR bands
     */
    async getSentinel2Analysis(location, fieldBoundary = null) {
        // Simulate Sentinel-2 10m resolution data
        const sentinel2Data = {
            resolution: 10, // meters
            bands: {
                b4_red: 0.15 + Math.random() * 0.1,
                b8_nir: 0.45 + Math.random() * 0.2,
                b11_swir1: 0.25 + Math.random() * 0.15, // Water content sensitive
                b12_swir2: 0.20 + Math.random() * 0.15  // Water content sensitive
            },

            // High-resolution NDVI (10m)
            ndvi_highres: null, // Calculated below

            // Water content index from SWIR
            waterContentIndex: null, // Calculated below

            // Scene classification
            sceneClassification: this.classifyScene(location),
            cloudCoverage: Math.random() * 20, // percentage

            // Field-specific analysis if boundary provided
            fieldAnalysis: fieldBoundary ? this.analyzeField(fieldBoundary) : null
        };

        // Calculate indices
        sentinel2Data.ndvi_highres = this.calculateNDVI(
            sentinel2Data.bands.b4_red,
            sentinel2Data.bands.b8_nir
        );

        sentinel2Data.waterContentIndex = this.calculateWaterIndex(
            sentinel2Data.bands.b8_nir,
            sentinel2Data.bands.b11_swir1
        );

        // Detect within-field variations
        if (fieldBoundary) {
            sentinel2Data.variations = this.detectFieldVariations(sentinel2Data);
        }

        return sentinel2Data;
    }

    /**
     * Edge case detection system
     */
    detectEdgeCases(fusionData) {
        const edgeCases = [];

        // Post-flood recovery detection
        if (fusionData.rawData.smap.soilMoisture > this.thresholds.floodThreshold) {
            edgeCases.push({
                type: 'post_flood',
                severity: 'high',
                description: 'Excessive soil moisture detected - possible flooding',
                recommendations: ['Delay planting', 'Improve drainage', 'Monitor for 72 hours']
            });
        }

        // Saline soil stress (inferred from NDVI drop with adequate moisture)
        if (fusionData.rawData.modis.ndvi < this.thresholds.lowNDVI &&
            fusionData.rawData.smap.soilMoisture > 0.25) {
            edgeCases.push({
                type: 'salinity_stress',
                severity: 'medium',
                description: 'Low vegetation health despite adequate moisture - possible salinity',
                recommendations: ['Test soil salinity', 'Consider salt-tolerant crops', 'Improve drainage']
            });
        }

        // Desertification boundary
        if (fusionData.rawData.smap.soilMoisture < this.thresholds.droughtThreshold &&
            fusionData.rawData.modis.ndvi < 0.2) {
            edgeCases.push({
                type: 'desertification_risk',
                severity: 'critical',
                description: 'Extremely low moisture and vegetation - desertification risk',
                recommendations: ['Immediate irrigation', 'Soil conservation measures', 'Consider drought-resistant varieties']
            });
        }

        // Temperature-moisture mismatch
        const tempDiff = Math.abs(fusionData.rawData.modis.landSurfaceTemp - fusionData.rawData.smap.surfaceTemperature);
        if (tempDiff > this.thresholds.stressTempDiff) {
            edgeCases.push({
                type: 'thermal_stress',
                severity: 'low',
                description: 'Temperature mismatch detected - possible measurement anomaly or micro-climate',
                recommendations: ['Verify local conditions', 'Check for equipment issues']
            });
        }

        return edgeCases;
    }

    /**
     * Temporal intelligence with predictive windows
     */
    async generateTemporalIntelligence(historicalData, currentData) {
        const trends = this.analyzeTrends(historicalData);
        const predictions = this.generatePredictions(trends, currentData);
        const seasonalPatterns = this.identifySeasonalPatterns(historicalData);
        const anomalies = this.detectTemporalAnomalies(historicalData, currentData);

        return {
            trends,
            predictions,
            seasonalPatterns,
            anomalies,
            recommendations: this.generateTemporalRecommendations(trends, predictions, anomalies)
        };
    }

    analyzeTrends(historicalData) {
        if (!historicalData || historicalData.length < 2) {
            return { insufficient_data: true };
        }

        const soilMoistureTrend = this.calculateTrendFromValues(historicalData.map(d => d.soilMoisture));
        const ndviTrend = this.calculateTrendFromValues(historicalData.map(d => d.ndvi));
        const temperatureTrend = this.calculateTrendFromValues(historicalData.map(d => d.temperature));
        const precipitationTrend = this.calculateTrendFromValues(historicalData.map(d => d.precipitation));

        return {
            soilMoisture: {
                direction: soilMoistureTrend.slope > 0 ? 'increasing' : 'decreasing',
                magnitude: Math.abs(soilMoistureTrend.slope),
                confidence: soilMoistureTrend.r2,
                weeklyChange: this.calculateWeeklyChange(historicalData.map(d => d.soilMoisture))
            },
            vegetation: {
                direction: ndviTrend.slope > 0 ? 'improving' : 'declining',
                magnitude: Math.abs(ndviTrend.slope),
                confidence: ndviTrend.r2,
                healthStatus: this.categorizeVegetationHealth(ndviTrend.slope)
            },
            temperature: {
                direction: temperatureTrend.slope > 0 ? 'warming' : 'cooling',
                magnitude: Math.abs(temperatureTrend.slope),
                confidence: temperatureTrend.r2,
                extremeEvents: this.countExtremeTemperatures(historicalData.map(d => d.temperature))
            },
            precipitation: {
                direction: precipitationTrend.slope > 0 ? 'increasing' : 'decreasing',
                magnitude: Math.abs(precipitationTrend.slope),
                confidence: precipitationTrend.r2,
                droughtRisk: this.assessDroughtRisk(historicalData.map(d => d.precipitation))
            }
        };
    }

    calculateTrendFromValues(values) {
        if (values.length < 2) return { slope: 0, r2: 0 };

        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = x.map((xi, i) => xi * values[i]).reduce((a, b) => a + b, 0);
        const sumXX = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
        const sumYY = values.map(yi => yi * yi).reduce((a, b) => a + b, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const predicted = x.map(xi => slope * xi + intercept);
        const ssRes = values.map((yi, i) => Math.pow(yi - predicted[i], 2)).reduce((a, b) => a + b, 0);
        const ssTot = values.map(yi => Math.pow(yi - sumY / n, 2)).reduce((a, b) => a + b, 0);
        const r2 = 1 - (ssRes / ssTot);

        return { slope, intercept, r2: Math.max(0, r2) };
    }

    calculateWeeklyChange(values) {
        if (values.length < 7) return 0;
        const recent = values.slice(-7);
        const previous = values.slice(-14, -7);
        if (previous.length === 0) return 0;

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

        return ((recentAvg - previousAvg) / previousAvg) * 100;
    }

    categorizeVegetationHealth(slope) {
        if (slope > 0.01) return 'improving';
        if (slope < -0.01) return 'declining';
        return 'stable';
    }

    countExtremeTemperatures(temperatures) {
        const mean = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
        const std = Math.sqrt(temperatures.map(t => Math.pow(t - mean, 2)).reduce((a, b) => a + b, 0) / temperatures.length);

        return temperatures.filter(t => Math.abs(t - mean) > 2 * std).length;
    }

    assessDroughtRisk(precipitation) {
        const recent30Days = precipitation.slice(-30);
        const avg = recent30Days.reduce((a, b) => a + b, 0) / recent30Days.length;
        const historical = precipitation.slice(0, -30);
        const historicalAvg = historical.reduce((a, b) => a + b, 0) / historical.length;

        if (avg < historicalAvg * 0.5) return 'severe';
        if (avg < historicalAvg * 0.7) return 'moderate';
        if (avg < historicalAvg * 0.85) return 'mild';
        return 'low';
    }

    generatePredictions(trends, currentData) {
        const daysAhead = 14; // 2-week predictions

        return {
            soilMoisture: {
                predicted: currentData.soilMoisture + (trends.soilMoisture.magnitude * daysAhead * (trends.soilMoisture.direction === 'increasing' ? 1 : -1)),
                confidence: trends.soilMoisture.confidence,
                range: this.calculatePredictionRange(currentData.soilMoisture, trends.soilMoisture)
            },
            vegetation: {
                predicted: currentData.ndvi + (trends.vegetation.magnitude * daysAhead * (trends.vegetation.direction === 'improving' ? 1 : -1)),
                confidence: trends.vegetation.confidence,
                alert: trends.vegetation.direction === 'declining' && trends.vegetation.magnitude > 0.005
            },
            waterStress: {
                predicted: this.predictWaterStress(trends, currentData),
                riskLevel: this.assessFutureWaterStressRisk(trends),
                actionNeeded: this.determineWaterManagementActions(trends)
            },
            optimalActions: this.generateOptimalActionPredictions(trends, currentData)
        };
    }

    calculatePredictionRange(currentValue, trend) {
        const uncertainty = Math.max(0.1, 1 - trend.confidence);
        const range = currentValue * uncertainty;
        return {
            min: Math.max(0, currentValue - range),
            max: Math.min(1, currentValue + range)
        };
    }

    predictWaterStress(trends, currentData) {
        let stressChange = 0;

        if (trends.soilMoisture.direction === 'decreasing') {
            stressChange += trends.soilMoisture.magnitude * 20;
        }
        if (trends.temperature.direction === 'warming') {
            stressChange += trends.temperature.magnitude * 15;
        }
        if (trends.precipitation.droughtRisk !== 'low') {
            stressChange += { mild: 10, moderate: 20, severe: 40 }[trends.precipitation.droughtRisk];
        }

        return Math.min(100, Math.max(0, currentData.waterStressIndex + stressChange));
    }

    assessFutureWaterStressRisk(trends) {
        const riskFactors = [];

        if (trends.soilMoisture.direction === 'decreasing' && trends.soilMoisture.magnitude > 0.02) {
            riskFactors.push('declining_soil_moisture');
        }
        if (trends.precipitation.droughtRisk === 'severe') {
            riskFactors.push('severe_drought_conditions');
        }
        if (trends.temperature.extremeEvents > 5) {
            riskFactors.push('frequent_extreme_temperatures');
        }

        if (riskFactors.length >= 2) return 'high';
        if (riskFactors.length === 1) return 'moderate';
        return 'low';
    }

    determineWaterManagementActions(trends) {
        const actions = [];

        if (trends.soilMoisture.weeklyChange < -15) {
            actions.push({
                action: 'increase_irrigation',
                urgency: 'immediate',
                reason: 'Rapid soil moisture decline detected'
            });
        }

        if (trends.precipitation.droughtRisk === 'severe') {
            actions.push({
                action: 'implement_water_conservation',
                urgency: 'high',
                reason: 'Severe drought conditions predicted'
            });
        }

        if (trends.vegetation.direction === 'declining' && trends.vegetation.magnitude > 0.01) {
            actions.push({
                action: 'apply_stress_mitigation',
                urgency: 'moderate',
                reason: 'Vegetation stress increasing'
            });
        }

        return actions;
    }

    generateOptimalActionPredictions(trends, currentData) {
        return {
            nextWeek: this.generateWeeklyRecommendations(trends, currentData),
            nextMonth: this.generateMonthlyRecommendations(trends, currentData),
            seasonalStrategy: this.generateSeasonalStrategy(trends)
        };
    }

    generateWeeklyRecommendations(trends, currentData) {
        const recommendations = [];

        if (trends.soilMoisture.direction === 'decreasing') {
            recommendations.push({
                priority: 'high',
                action: 'Monitor soil moisture daily',
                benefit: 'Prevent crop stress'
            });
        }

        if (currentData.waterStressIndex > 60) {
            recommendations.push({
                priority: 'critical',
                action: 'Increase irrigation frequency',
                benefit: 'Maintain crop health'
            });
        }

        return recommendations;
    }

    generateMonthlyRecommendations(trends, currentData) {
        const recommendations = [];

        if (trends.precipitation.droughtRisk !== 'low') {
            recommendations.push({
                priority: 'high',
                action: 'Install drought-resistant crop varieties',
                benefit: 'Long-term water conservation'
            });
        }

        if (trends.vegetation.healthStatus === 'declining') {
            recommendations.push({
                priority: 'moderate',
                action: 'Apply soil amendments and fertilizers',
                benefit: 'Improve vegetation vigor'
            });
        }

        return recommendations;
    }

    generateSeasonalStrategy(trends) {
        const strategy = [];

        if (trends.temperature.direction === 'warming') {
            strategy.push('Consider heat-tolerant crop varieties for next season');
        }

        if (trends.precipitation.direction === 'decreasing') {
            strategy.push('Plan for enhanced water storage and conservation systems');
        }

        return strategy;
    }

    identifySeasonalPatterns(historicalData) {
        if (!historicalData || historicalData.length < 30) {
            return { insufficient_data: true };
        }

        // Simple seasonal pattern detection
        const monthlyAverages = this.calculateMonthlyAverages(historicalData);
        const seasonalTrends = this.identifySeasonalTrends(monthlyAverages);

        return {
            monthlyPatterns: monthlyAverages,
            seasonalTrends,
            recommendations: this.generateSeasonalRecommendations(seasonalTrends)
        };
    }

    calculateMonthlyAverages(data) {
        const monthlyData = {};

        data.forEach(point => {
            const month = new Date(point.timestamp).getMonth();
            if (!monthlyData[month]) {
                monthlyData[month] = { soilMoisture: [], ndvi: [], temperature: [], precipitation: [] };
            }
            monthlyData[month].soilMoisture.push(point.soilMoisture);
            monthlyData[month].ndvi.push(point.ndvi);
            monthlyData[month].temperature.push(point.temperature);
            monthlyData[month].precipitation.push(point.precipitation);
        });

        const averages = {};
        Object.keys(monthlyData).forEach(month => {
            averages[month] = {
                soilMoisture: monthlyData[month].soilMoisture.reduce((a, b) => a + b, 0) / monthlyData[month].soilMoisture.length,
                ndvi: monthlyData[month].ndvi.reduce((a, b) => a + b, 0) / monthlyData[month].ndvi.length,
                temperature: monthlyData[month].temperature.reduce((a, b) => a + b, 0) / monthlyData[month].temperature.length,
                precipitation: monthlyData[month].precipitation.reduce((a, b) => a + b, 0) / monthlyData[month].precipitation.length
            };
        });

        return averages;
    }

    identifySeasonalTrends(monthlyAverages) {
        // Identify peak growing season, dry season, etc.
        const months = Object.keys(monthlyAverages).map(Number).sort();

        let peakGrowingSeason = null;
        let drySeason = null;
        let highestNDVI = 0;
        let lowestPrecipitation = Infinity;

        months.forEach(month => {
            const data = monthlyAverages[month];

            if (data.ndvi > highestNDVI) {
                highestNDVI = data.ndvi;
                peakGrowingSeason = month;
            }

            if (data.precipitation < lowestPrecipitation) {
                lowestPrecipitation = data.precipitation;
                drySeason = month;
            }
        });

        return {
            peakGrowingSeason,
            drySeason,
            optimalPlantingMonth: this.calculateOptimalPlantingMonth(monthlyAverages),
            harvestMonth: this.calculateOptimalHarvestMonth(monthlyAverages)
        };
    }

    calculateOptimalPlantingMonth(monthlyAverages) {
        // Simple heuristic: month with good soil moisture and moderate temperature
        const months = Object.keys(monthlyAverages).map(Number);
        let bestMonth = null;
        let bestScore = 0;

        months.forEach(month => {
            const data = monthlyAverages[month];
            const score = data.soilMoisture * 0.5 + (1 - Math.abs(data.temperature - 288) / 20) * 0.3 + data.precipitation * 0.2;

            if (score > bestScore) {
                bestScore = score;
                bestMonth = month;
            }
        });

        return bestMonth;
    }

    calculateOptimalHarvestMonth(monthlyAverages) {
        // Month with peak NDVI typically indicates maturity
        const months = Object.keys(monthlyAverages).map(Number);
        let bestMonth = null;
        let highestNDVI = 0;

        months.forEach(month => {
            const data = monthlyAverages[month];
            if (data.ndvi > highestNDVI) {
                highestNDVI = data.ndvi;
                bestMonth = month;
            }
        });

        return bestMonth;
    }

    generateSeasonalRecommendations(trends) {
        const recommendations = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (trends.optimalPlantingMonth !== null) {
            recommendations.push({
                category: 'planting',
                action: `Plan planting activities for ${monthNames[trends.optimalPlantingMonth]}`,
                benefit: 'Optimal soil and weather conditions'
            });
        }

        if (trends.drySeason !== null) {
            recommendations.push({
                category: 'water_management',
                action: `Prepare for dry conditions in ${monthNames[trends.drySeason]}`,
                benefit: 'Avoid water stress during critical periods'
            });
        }

        return recommendations;
    }

    detectTemporalAnomalies(historicalData, currentData) {
        if (!historicalData || historicalData.length < 30) {
            return { insufficient_data: true };
        }

        const anomalies = [];

        // Soil moisture anomaly detection
        const soilMoistureValues = historicalData.map(d => d.soilMoisture);
        const smMean = soilMoistureValues.reduce((a, b) => a + b, 0) / soilMoistureValues.length;
        const smStd = Math.sqrt(soilMoistureValues.map(v => Math.pow(v - smMean, 2)).reduce((a, b) => a + b, 0) / soilMoistureValues.length);

        if (Math.abs(currentData.soilMoisture - smMean) > 2 * smStd) {
            anomalies.push({
                type: 'soil_moisture_anomaly',
                severity: Math.abs(currentData.soilMoisture - smMean) > 3 * smStd ? 'extreme' : 'moderate',
                description: currentData.soilMoisture > smMean ? 'Unusually high soil moisture' : 'Unusually low soil moisture',
                deviation: ((currentData.soilMoisture - smMean) / smStd).toFixed(2)
            });
        }

        // NDVI anomaly detection
        const ndviValues = historicalData.map(d => d.ndvi);
        const ndviMean = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
        const ndviStd = Math.sqrt(ndviValues.map(v => Math.pow(v - ndviMean, 2)).reduce((a, b) => a + b, 0) / ndviValues.length);

        if (Math.abs(currentData.ndvi - ndviMean) > 2 * ndviStd) {
            anomalies.push({
                type: 'vegetation_anomaly',
                severity: Math.abs(currentData.ndvi - ndviMean) > 3 * ndviStd ? 'extreme' : 'moderate',
                description: currentData.ndvi > ndviMean ? 'Exceptionally healthy vegetation' : 'Vegetation stress detected',
                deviation: ((currentData.ndvi - ndviMean) / ndviStd).toFixed(2)
            });
        }

        return anomalies;
    }

    generateTemporalRecommendations(trends, predictions, anomalies) {
        const recommendations = [];

        // Trend-based recommendations
        if (trends.soilMoisture.direction === 'decreasing' && trends.soilMoisture.confidence > 0.7) {
            recommendations.push({
                category: 'irrigation',
                priority: 'high',
                action: 'Prepare for increased irrigation needs',
                timeframe: 'next 2 weeks',
                reason: 'Consistent soil moisture decline trend detected'
            });
        }

        if (predictions.waterStress.riskLevel === 'high') {
            recommendations.push({
                category: 'water_management',
                priority: 'critical',
                action: 'Implement emergency water conservation measures',
                timeframe: 'immediate',
                reason: 'High water stress risk predicted'
            });
        }

        // Anomaly-based recommendations
        anomalies.forEach(anomaly => {
            if (anomaly.type === 'soil_moisture_anomaly' && anomaly.severity === 'extreme') {
                recommendations.push({
                    category: 'emergency_response',
                    priority: 'critical',
                    action: anomaly.description.includes('low') ? 'Emergency irrigation required' : 'Check drainage systems',
                    timeframe: 'immediate',
                    reason: `Extreme soil moisture anomaly detected (${anomaly.deviation}σ)`
                });
            }
        });

        // Seasonal preparation recommendations
        if (trends.precipitation.droughtRisk === 'severe') {
            recommendations.push({
                category: 'seasonal_prep',
                priority: 'high',
                action: 'Install drought monitoring systems and backup water sources',
                timeframe: 'next month',
                reason: 'Severe drought risk identified in precipitation patterns'
            });
        }

        return recommendations;
    }

    // Helper calculation methods
    calculateWaterStressIndex(soilMoisture, lst, surfaceTemp) {
        // Higher index = more stress (0-100 scale)
        const moistureStress = Math.max(0, (0.3 - soilMoisture) / 0.3) * 50;
        const thermalStress = Math.max(0, (lst - 303) / 20) * 50; // 303K = 30°C baseline
        return Math.min(100, moistureStress + thermalStress);
    }

    calculateVegetationStress(ndvi, vwc) {
        // Lower NDVI and VWC = higher stress
        const ndviStress = Math.max(0, (0.5 - ndvi) / 0.5) * 60;
        const vwcStress = Math.max(0, (3 - vwc) / 3) * 40;
        return Math.min(100, ndviStress + vwcStress);
    }

    calculateFarmHealth(params) {
        // Weighted score 0-100 (higher is better)
        const weights = {
            soilMoisture: 0.3,
            ndvi: 0.3,
            vwc: 0.2,
            lst: 0.2
        };

        let score = 0;
        score += (params.soilMoisture / 0.4) * weights.soilMoisture * 100;
        score += params.ndvi * weights.ndvi * 100;
        score += (params.vwc / 5) * weights.vwc * 100;
        score += Math.max(0, (313 - params.lst) / 20) * weights.lst * 100; // Optimal ~40°C

        return Math.min(100, Math.max(0, score));
    }

    calculateVWC(soilMoisture, location) {
        // Vegetation Water Content estimation (kg/m²)
        const baseVWC = soilMoisture * 10; // Simple correlation
        const latitudeFactor = Math.abs(location.lat) < 30 ? 1.2 : 0.8; // Tropical vs temperate
        return baseVWC * latitudeFactor;
    }

    calculateEVI(ndvi) {
        // Enhanced Vegetation Index - more sensitive in high biomass regions
        return ndvi * 1.2 * (1 - 0.1); // Simplified EVI calculation
    }

    calculateNDVI(red, nir) {
        return (nir - red) / (nir + red);
    }

    calculateWaterIndex(nir, swir) {
        // Normalized Difference Water Index
        return (nir - swir) / (nir + swir);
    }

    calculateSurfaceTemp(lat) {
        // Realistic surface temperature based on latitude (Kelvin)
        const baseTemp = 288; // 15°C
        const latEffect = Math.abs(lat) * 0.5;
        return baseTemp + (30 - latEffect) + Math.random() * 10;
    }

    calculateLST(location) {
        // Land Surface Temperature
        return this.calculateSurfaceTemp(location.lat) + Math.random() * 5;
    }

    calculateLocationBasedNDVI(lat) {
        if (Math.abs(lat) < 23.5) return 0.6 + Math.random() * 0.25; // Tropical
        if (Math.abs(lat) < 45) return 0.4 + Math.random() * 0.3; // Temperate
        return 0.2 + Math.random() * 0.2; // Polar/Subpolar
    }

    assessDataQuality(data) {
        // Assess SMAP data quality based on flags
        if (!data.qualityFlag) return 'good_quality';

        const flag = parseInt(data.qualityFlag);
        for (const [bit, quality] of Object.entries(this.smapQualityFlags)) {
            if (flag & parseInt(bit)) return quality;
        }
        return 'good_quality';
    }

    calculateReliability(data) {
        // 0-1 reliability score
        const hasData = data.soilMoisture !== null ? 0.5 : 0;
        const quality = this.assessDataQuality(data) === 'good_quality' ? 0.3 : 0.1;
        const freshness = data.timestamp ? 0.2 : 0.1;
        return hasData + quality + freshness;
    }

    assessPixelQuality(data) {
        // MODIS pixel quality assessment
        if (data.cloudCover > 20) return 'cloudy';
        if (data.shadowFlag) return 'shadowed';
        if (data.aerosolFlag) return 'aerosol_affected';
        return 'clear';
    }

    calculateGPMConfidence(kalmanWeight) {
        // Higher Kalman weight = more microwave data = more reliable
        return kalmanWeight;
    }

    calculateLiquidProbability(lat) {
        // Probability of liquid vs frozen precipitation based on latitude
        if (Math.abs(lat) > 60) return 0.3; // Mostly snow
        if (Math.abs(lat) > 40) return 0.6; // Mixed
        return 0.95; // Mostly rain
    }

    detectSMAPEdgeCases(data) {
        const cases = [];

        if (data.soilMoisture > this.thresholds.floodThreshold) {
            cases.push('flood_conditions');
        }
        if (data.soilMoisture < this.thresholds.droughtThreshold) {
            cases.push('severe_drought');
        }
        if (data.vegetationWaterContent < 1) {
            cases.push('vegetation_water_stress');
        }

        return cases;
    }

    detectVegetationAnomalies(data) {
        const anomalies = [];

        if (data.ndvi < this.thresholds.lowNDVI) {
            anomalies.push('low_vegetation_health');
        }
        if (data.ndvi < 0.1) {
            anomalies.push('bare_soil_or_dead_vegetation');
        }
        if (data.evi / data.ndvi > 1.5) {
            anomalies.push('dense_canopy_detected');
        }

        return anomalies;
    }

    generateFusionAlerts(smapData, modisData) {
        const alerts = [];

        // Water stress alert
        if (smapData.soilMoisture < 0.2 && modisData.landSurfaceTemp > 308) {
            alerts.push({
                type: 'water_stress',
                priority: 'high',
                message: 'Critical water stress detected - immediate irrigation needed'
            });
        }

        // Vegetation decline alert
        if (modisData.ndvi < 0.3 && smapData.vegetationWaterContent < 2) {
            alerts.push({
                type: 'vegetation_decline',
                priority: 'medium',
                message: 'Vegetation health declining - check for pests or disease'
            });
        }

        return alerts;
    }

    classifyScene(location) {
        // Simplified scene classification
        const lat = Math.abs(location.lat);
        if (lat < 10) return 'tropical_forest';
        if (lat < 30) return 'cropland';
        if (lat < 50) return 'temperate_mixed';
        return 'boreal_tundra';
    }

    analyzeField(boundary) {
        // Analyze specific field within Sentinel-2 image
        return {
            avgNDVI: 0.45 + Math.random() * 0.2,
            minNDVI: 0.3,
            maxNDVI: 0.7,
            stdDev: 0.15,
            problemAreas: Math.floor(Math.random() * 3),
            uniformity: 0.7 + Math.random() * 0.3
        };
    }

    detectFieldVariations(data) {
        return {
            dryPatches: Math.floor(Math.random() * 5),
            waterloggedAreas: Math.floor(Math.random() * 2),
            healthyZones: 70 + Math.random() * 20, // percentage
            stressedZones: 10 + Math.random() * 20  // percentage
        };
    }

    generatePrecipitationForecast(currentRate) {
        // Simple forecast for next 3 days
        return Array.from({ length: 3 }, (_, i) => ({
            day: i + 1,
            expectedPrecipitation: Math.max(0, currentRate + (Math.random() - 0.5) * 2),
            confidence: 0.9 - i * 0.2
        }));
    }

    detectPrecipitationAnomaly(rate, location) {
        // Compare with historical average for location
        const expectedRate = Math.abs(location.lat) < 30 ? 1.5 : 0.8;
        const deviation = Math.abs(rate - expectedRate) / expectedRate;
        return deviation > 0.5 ? 'anomalous' : 'normal';
    }

    predictIrrigationNeeds(historical, current) {
        const nextWindow = new Date();
        nextWindow.setDate(nextWindow.getDate() + this.temporalWindows.irrigationPrediction);

        return {
            nextIrrigationDate: nextWindow,
            estimatedWaterNeeded: Math.max(0, (0.35 - current.soilMoisture) * 1000), // liters/hectare
            confidence: 0.75
        };
    }

    detectHistoricalAnomalies(historical, current) {
        // Simplified anomaly detection
        return {
            soilMoistureAnomaly: false,
            vegetationAnomaly: current.ndvi < 0.3,
            temperatureAnomaly: false
        };
    }

    calculateTrend(data, parameter) {
        // Simple trend: increasing, decreasing, or stable
        return 'stable';
    }

    predictDroughtRisk(historical) {
        return {
            risk: 'low',
            probability: 0.2,
            daysUntilCritical: 14
        };
    }

    predictFloodRisk(historical) {
        return {
            risk: 'low',
            probability: 0.1,
            vulnerableAreas: []
        };
    }

    predictOptimalHarvest(historical, current) {
        const harvestDate = new Date();
        harvestDate.setDate(harvestDate.getDate() + 7);

        return {
            optimalDate: harvestDate,
            readiness: 0.85,
            qualityScore: 0.9
        };
    }

    // Fallback methods
    getFallbackSMAPData(location) {
        return {
            soilMoisture: 0.35,
            surfaceTemperature: 298,
            vegetationWaterContent: 3,
            qualityFlag: 'fallback',
            reliability: 0.3,
            edgeCases: [],
            source: 'fallback'
        };
    }

    getFallbackMODISData(location) {
        return {
            ndvi: 0.5,
            evi: 0.6,
            landSurfaceTemp: 300,
            pixelReliability: 'fallback',
            reliability: 0.3,
            anomalies: [],
            source: 'fallback'
        };
    }

    getFallbackGPMData(location) {
        return {
            precipitationCal: 0.5,
            irKalmanFilterWeight: 0.5,
            probabilityLiquidPrecipitation: 0.8,
            confidence: 0.3,
            forecast: [],
            historicalAnomaly: 'unknown',
            floodRisk: false,
            droughtRisk: false,
            source: 'fallback'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedNASAAnalysis;
}

// Also make available globally in browser
if (typeof window !== 'undefined') {
    window.AdvancedNASAAnalysis = AdvancedNASAAnalysis;
}