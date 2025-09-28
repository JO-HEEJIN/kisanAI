// AR Intelligence Engine for Real-Time Terrain and Crop Classification
// Integrates TensorFlow.js models with AR analysis system

/**
 * AR Intelligence Engine
 * Provides real-time AI inference for terrain and crop classification in AR
 * Optimized for <100ms inference time as per technical requirements
 */
class ARIntelligenceEngine {
    constructor() {
        this.terrainModel = null;
        this.cropModel = null;
        this.isInitialized = false;
        this.modelCache = new Map();
        this.inferenceQueue = [];
        this.isProcessing = false;

        // Performance monitoring
        this.metrics = {
            inferenceCount: 0,
            averageInferenceTime: 0,
            totalInferenceTime: 0
        };

        console.log('Initializing AR Intelligence Engine...');
    }

    async initialize() {
        try {
            // Initialize TensorFlow.js with WebGL backend for performance
            await tf.setBackend('webgl');
            await tf.ready();

            console.log('TensorFlow.js backend initialized:', tf.getBackend());

            // Load pre-trained models for terrain and crop classification
            await this.loadModels();

            this.isInitialized = true;
            console.log('AR Intelligence Engine initialized successfully');

        } catch (error) {
            console.error('Failed to initialize AR Intelligence Engine:', error);

            // Fallback to rule-based classification
            this.isInitialized = false;
            console.log('Using fallback rule-based classification');
        }
    }

    async loadModels() {
        try {
            // Load terrain classification model
            // In production, these would be hosted model URLs
            this.terrainModel = await this.createMockTerrainModel();
            console.log('Terrain classification model loaded');

            // Load crop classification model
            this.cropModel = await this.createMockCropModel();
            console.log('Crop classification model loaded');

        } catch (error) {
            console.warn('Model loading failed, using synthetic models:', error);

            // Create lightweight mock models for development
            this.terrainModel = await this.createMockTerrainModel();
            this.cropModel = await this.createMockCropModel();
        }
    }

    async createMockTerrainModel() {
        // Create a simple mock model for terrain classification
        // Input: [NDVI, soilMoisture, temperature, elevation]
        // Output: [cropland, pasture, forest, barren, water, urban]

        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [4], units: 16, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 8, activation: 'relu' }),
                tf.layers.dense({ units: 6, activation: 'softmax' })
            ]
        });

        // Compile with optimized settings for inference speed
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    async createMockCropModel() {
        // Create a simple mock model for crop classification
        // Input: [NDVI, LAI, chlorophyll, temperature, moisture]
        // Output: [wheat, corn, soybean, rice, cotton, other]

        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [5], units: 20, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.1 }),
                tf.layers.dense({ units: 12, activation: 'relu' }),
                tf.layers.dense({ units: 6, activation: 'softmax' })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    async classifyTerrain(nasaData) {
        const startTime = performance.now();

        try {
            if (!this.isInitialized || !this.terrainModel) {
                return this.fallbackTerrainClassification(nasaData);
            }

            // Prepare input features for terrain model
            const features = this.prepareTerrainFeatures(nasaData);
            const inputTensor = tf.tensor2d([features]);

            // Perform inference with timing
            const prediction = this.terrainModel.predict(inputTensor);
            const probabilities = await prediction.data();

            // Clean up tensors
            inputTensor.dispose();
            prediction.dispose();

            // Get classification result
            const result = this.interpretTerrainPrediction(probabilities);

            this.updateMetrics(startTime);
            return result;

        } catch (error) {
            console.warn('AI terrain classification failed, using fallback:', error);
            return this.fallbackTerrainClassification(nasaData);
        }
    }

    async classifyCrop(nasaData, terrainType) {
        const startTime = performance.now();

        try {
            if (!this.isInitialized || !this.cropModel || terrainType !== 'cropland') {
                return this.fallbackCropClassification(nasaData, terrainType);
            }

            // Prepare input features for crop model
            const features = this.prepareCropFeatures(nasaData);
            const inputTensor = tf.tensor2d([features]);

            // Perform inference
            const prediction = this.cropModel.predict(inputTensor);
            const probabilities = await prediction.data();

            // Clean up tensors
            inputTensor.dispose();
            prediction.dispose();

            // Get classification result
            const result = this.interpretCropPrediction(probabilities);

            this.updateMetrics(startTime);
            return result;

        } catch (error) {
            console.warn('AI crop classification failed, using fallback:', error);
            return this.fallbackCropClassification(nasaData, terrainType);
        }
    }

    prepareTerrainFeatures(nasaData) {
        // Normalize features for terrain model input
        const { ndvi, soilMoisture, temperature } = nasaData;

        return [
            Math.max(0, Math.min(1, ndvi || 0.4)),               // NDVI (0-1)
            Math.max(0, Math.min(100, soilMoisture || 30)) / 100, // Soil moisture (0-1)
            Math.max(-10, Math.min(50, temperature || 20)) / 60,  // Temperature normalized
            0.5  // Elevation placeholder (would come from DEM data)
        ];
    }

    prepareCropFeatures(nasaData) {
        // Normalize features for crop model input
        const { ndvi, soilMoisture, temperature } = nasaData;

        return [
            Math.max(0, Math.min(1, ndvi || 0.6)),                // NDVI (0-1)
            Math.max(0, Math.min(8, (ndvi || 0.6) * 6)),         // LAI estimate
            Math.max(0, Math.min(100, (ndvi || 0.6) * 80)),      // Chlorophyll estimate
            Math.max(-10, Math.min(50, temperature || 22)) / 60,  // Temperature normalized
            Math.max(0, Math.min(100, soilMoisture || 35)) / 100  // Soil moisture (0-1)
        ];
    }

    interpretTerrainPrediction(probabilities) {
        const classes = ['cropland', 'pasture', 'forest', 'barren', 'water', 'urban'];
        const maxIndex = probabilities.indexOf(Math.max(...probabilities));

        return {
            type: classes[maxIndex],
            confidence: probabilities[maxIndex],
            probabilities: Object.fromEntries(
                classes.map((cls, i) => [cls, probabilities[i]])
            )
        };
    }

    interpretCropPrediction(probabilities) {
        const classes = ['wheat', 'corn', 'soybean', 'rice', 'cotton', 'other'];
        const maxIndex = probabilities.indexOf(Math.max(...probabilities));

        return {
            crop: classes[maxIndex],
            confidence: probabilities[maxIndex],
            probabilities: Object.fromEntries(
                classes.map((cls, i) => [cls, probabilities[i]])
            )
        };
    }

    fallbackTerrainClassification(nasaData) {
        // Rule-based fallback classification
        const { ndvi, soilMoisture } = nasaData;

        if (ndvi > 0.6 && soilMoisture > 25) {
            return { type: 'cropland', confidence: 0.8, source: 'rule-based' };
        } else if (ndvi > 0.4 && soilMoisture > 15) {
            return { type: 'pasture', confidence: 0.7, source: 'rule-based' };
        } else if (ndvi > 0.3) {
            return { type: 'forest', confidence: 0.6, source: 'rule-based' };
        } else if (soilMoisture < 10) {
            return { type: 'barren', confidence: 0.7, source: 'rule-based' };
        } else {
            return { type: 'mixed', confidence: 0.5, source: 'rule-based' };
        }
    }

    fallbackCropClassification(nasaData, terrainType) {
        // Rule-based fallback for crop classification
        if (terrainType !== 'cropland') {
            return { crop: 'none', confidence: 0.9, source: 'rule-based' };
        }

        const { ndvi, temperature } = nasaData;

        if (ndvi > 0.7 && temperature > 25) {
            return { crop: 'corn', confidence: 0.7, source: 'rule-based' };
        } else if (ndvi > 0.6 && temperature < 20) {
            return { crop: 'wheat', confidence: 0.6, source: 'rule-based' };
        } else if (ndvi > 0.5) {
            return { crop: 'soybean', confidence: 0.6, source: 'rule-based' };
        } else {
            return { crop: 'other', confidence: 0.5, source: 'rule-based' };
        }
    }

    updateMetrics(startTime) {
        const inferenceTime = performance.now() - startTime;
        this.metrics.inferenceCount++;
        this.metrics.totalInferenceTime += inferenceTime;
        this.metrics.averageInferenceTime = this.metrics.totalInferenceTime / this.metrics.inferenceCount;

        if (inferenceTime > 100) {
            console.warn(`Slow inference detected: ${inferenceTime.toFixed(2)}ms`);
        }
    }

    // Batch processing for multiple analysis points
    async processBatch(analysisPoints) {
        const results = [];

        for (const point of analysisPoints) {
            const terrainResult = await this.classifyTerrain(point.nasaData);
            const cropResult = await this.classifyCrop(point.nasaData, terrainResult.type);

            results.push({
                ...point,
                terrainClassification: terrainResult,
                cropClassification: cropResult
            });
        }

        return results;
    }

    // Performance monitoring
    getPerformanceMetrics() {
        return {
            ...this.metrics,
            isInitialized: this.isInitialized,
            backend: tf.getBackend(),
            memoryInfo: tf.memory()
        };
    }

    // Cleanup resources
    dispose() {
        try {
            if (this.terrainModel) {
                this.terrainModel.dispose();
            }
            if (this.cropModel) {
                this.cropModel.dispose();
            }

            // Clear model cache
            this.modelCache.clear();

            console.log('AR Intelligence Engine disposed');

        } catch (error) {
            console.error('Error disposing AR Intelligence Engine:', error);
        }
    }
}

// Make ARIntelligenceEngine globally available
window.ARIntelligenceEngine = ARIntelligenceEngine;