/**
 * PlantRecognition.js v2.2
 * Implements a real-time plant recognition and health analysis system using TensorFlow.js,
 * fused with NASA satellite data. This version includes robust event handling to prevent race conditions.
 */
class PlantRecognition {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
        this.isCapturing = false;
        this.stream = null;
        this.canvas = null;
        this.ctx = null;
        this.video = null;
        this.currentLocation = null;
        this.nasaData = null;

        this.imagenetClasses = { 985: 'ear', 989: 'corn_cob' };

        this.plantDatabase = {
            'wheat': { category: 'cereal', scientificName: 'Triticum aestivum', optimalConditions: { soilMoisture: [0.25, 0.45], ndvi: [0.6, 0.8] } },
            'corn': { category: 'cereal', scientificName: 'Zea mays', optimalConditions: { soilMoisture: [0.3, 0.5], ndvi: [0.7, 0.9] } },
            'rice': { category: 'cereal', scientificName: 'Oryza sativa', optimalConditions: { soilMoisture: [0.4, 0.7], ndvi: [0.6, 0.8] } },
            'soybean': { category: 'legume', scientificName: 'Glycine max', optimalConditions: { soilMoisture: [0.25, 0.4], ndvi: [0.5, 0.8] } },
            'tomato': { category: 'fruit', scientificName: 'Solanum lycopersicum', optimalConditions: { soilMoisture: [0.3, 0.5], ndvi: [0.6, 0.8] } },
            'potato': { category: 'tuber', scientificName: 'Solanum tuberosum', optimalConditions: { soilMoisture: [0.3, 0.5], ndvi: [0.5, 0.7] } },
            'generic_plant': { scientificName: 'Unknown Plant', category: 'general', optimalConditions: { soilMoisture: [0.2, 0.5], ndvi: [0.4, 0.8] } }
        };

        this.plantMapping = {
            'ear': 'corn', 'corn_cob': 'corn', 'acorn': 'generic_plant',
            'head cabbage': 'generic_plant', 'broccoli': 'generic_plant', 'cauliflower': 'generic_plant',
            'zucchini': 'generic_plant', 'cucumber': 'generic_plant', 'bell pepper': 'generic_plant',
            'Granny Smith': 'generic_plant', 'strawberry': 'generic_plant', 'orange': 'generic_plant', 'lemon': 'generic_plant',
            'banana': 'generic_plant', 'pomegranate': 'generic_plant', 'pineapple': 'generic_plant'
        };
    }

    async initializePlantRecognition() {
        console.log('🌱 Initializing Plant Recognition system v2.2...');
        try {
            await this.loadTensorFlowModel();
            this.createPlantInterface();
            this.bindPlantEvents();
            console.log('✅ Plant Recognition system ready');
        } catch (error) {
            console.error('❌ Failed to initialize Plant Recognition:', error);
            this.createErrorInterface();
            this.bindPlantEvents(); // Still bind events for the error modal
        }
    }

    async loadTensorFlowModel() {
        console.log('🧠 Loading real TensorFlow.js model (MobileNetV2)...');
        try {
            if (typeof tf === 'undefined') {
                throw new Error('TensorFlow.js (tf) is not loaded. Please include the script in your HTML.');
            }
            const modelUrl = 'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/5';
            this.model = await tf.loadGraphModel(modelUrl, { fromTFHub: true });

            tf.tidy(() => {
                const warmupTensor = tf.zeros([1, 224, 224, 3]);
                this.model.predict(warmupTensor);
            });

            this.isModelLoaded = true;
            console.log('✅ Real Plant Recognition model loaded successfully');
        } catch (error) {
            console.error('❌ Real model loading failed:', error);
            throw error;
        }
    }
    
    async runModelPrediction(videoElement) {
        console.log('🧠 Running prediction...');
        
        const tensor = tf.browser.fromPixels(videoElement)
            .resizeBilinear([224, 224])
            .toFloat()
            .expandDims(0);

        const predictions = await this.model.predict(tensor).data();
        tensor.dispose();

        let topResult = { confidence: 0, index: -1 };
        for (let i = 0; i < predictions.length; i++) {
            if (predictions[i] > topResult.confidence) {
                topResult = { confidence: predictions[i], index: i };
            }
        }
        
        const imagenetClass = this.imagenetClasses[topResult.index] || 'generic_plant';
        const plantType = this.plantMapping[imagenetClass] || 'generic_plant';

        return {
            plantType: plantType,
            confidence: topResult.confidence,
            isManual: false
        };
    }

    async capturePlant() {
        if (!this.isCapturing || !this.video) return;

        console.log('🔍 Capturing and analyzing plant...');
        this.updatePlantStatus('Analyzing plant...');

        try {
            const prediction = await this.runModelPrediction(this.video);
            this.displayPlantResult(prediction);
            this.updatePlantStatus('Analysis complete');
        } catch (error) {
            console.error('❌ Plant analysis failed:', error);
            this.updatePlantStatus('Analysis failed');
        }
    }
    
    createPlantInterface() {
        const plantInterface = `
            <div id="plant-recognition-modal" class="plant-modal" style="display: none;">
                <div class="plant-modal-content">
                    <div class="plant-header">
                        <div class="plant-title">
                            <h3>🌱 Plant Recognition</h3>
                            <p id="plant-status">AI Model Ready</p>
                        </div>
                        <button id="close-plant-modal" class="plant-close-btn">✕</button>
                    </div>
                    <div class="plant-camera-container">
                        <video id="plant-video" class="plant-video" autoplay muted playsinline></video>
                        <canvas id="plant-canvas" class="plant-canvas"></canvas>
                        <div class="plant-camera-overlay">
                            <div class="plant-target-frame">
                                <div class="corner top-left"></div><div class="corner top-right"></div>
                                <div class="corner bottom-left"></div><div class="corner bottom-right"></div>
                            </div>
                            <div class="plant-instructions">📱 Point camera at plant leaves or crops</div>
                        </div>
                    </div>
                    <div class="plant-controls">
                        <button id="start-camera-btn" class="plant-control-btn primary"><span>📷</span> Start Camera</button>
                        <button id="capture-plant-btn" class="plant-control-btn secondary" style="display: none;"><span>🔍</span> Analyze Plant</button>
                        <button id="stop-camera-btn" class="plant-control-btn danger" style="display: none;"><span>🛑</span> Stop Camera</button>
                    </div>
                    <div id="plant-results" class="plant-results">
                        <div class="plant-results-placeholder">
                            <div class="placeholder-icon">🌿</div>
                            <p>Plant analysis results will appear here</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', plantInterface);
        this.addPlantStyles();
    }

    createErrorInterface() {
        const errorInterface = `
            <div id="plant-recognition-modal" class="plant-modal" style="display: none;">
                <div class="plant-modal-content">
                    <div class="plant-header">
                        <div class="plant-title">
                            <h3>🌱 Plant Recognition</h3>
                            <p>Model Loading Failed</p>
                        </div>
                        <button id="close-plant-modal" class="plant-close-btn">✕</button>
                    </div>
                    <div class="plant-error">
                        <div class="error-icon">⚠️</div>
                        <h3>Plant Recognition Unavailable</h3>
                        <p>TensorFlow.js model could not be loaded.</p>
                        <div class="manual-plant-input">
                            <h4>Manual Plant Analysis:</h4>
                            <select id="manual-plant-select" class="manual-select">
                                <option value="">Select a plant type...</option>
                                <option value="wheat">🌾 Wheat</option>
                                <option value="corn">🌽 Corn/Maize</option>
                                <option value="rice">🍚 Rice</option>
                                <option value="soybean">🫘 Soybean</option>
                                <option value="tomato">🍅 Tomato</option>
                                <option value="potato">🥔 Potato</option>
                            </select>
                            <button id="analyze-manual-plant" class="manual-analyze-btn">Analyze Selected Plant</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', errorInterface);
        this.addPlantStyles();
    }

    addPlantStyles() {
        if (document.getElementById('plant-recognition-styles')) return;
        const styles = `<style id="plant-recognition-styles"> /* ... [All your CSS styles go here] ... */ </style>`;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * --- MODIFIED: Uses robust global event delegation to prevent all race conditions ---
     */
    bindPlantEvents() {
        console.log('🔗 Binding plant recognition events v2.2 (Global Delegation)...');
        
        // A single listener on the document body handles all clicks.
        // This is robust and works no matter when the buttons are added to the page.
        document.body.addEventListener('click', (event) => {
            const targetButton = event.target.closest('button');
            if (!targetButton) return; // Ignore clicks that aren't on or inside a button

            const targetId = targetButton.id;

            switch(targetId) {
                case 'test-plant-id-btn':
                    console.log('🌱 "Test Recognition" button clicked via global delegation.');
                    this.openPlantModal();
                    break;
                case 'close-plant-modal':
                    this.closePlantModal();
                    break;
                case 'start-camera-btn':
                    this.startCamera();
                    break;
                case 'capture-plant-btn':
                    this.capturePlant();
                    break;
                case 'stop-camera-btn':
                    this.stopCamera();
                    break;
                case 'analyze-manual-plant':
                    this.analyzeManualPlant();
                    break;
            }
        });

        console.log('✅ All plant recognition events are now handled via a single global listener.');
    }

    async openPlantModal() {
        console.log('🌱 Opening Plant Recognition modal...');
        await this.loadLocationAndData();
        // The modal might have been created by the error handler, so we check for both.
        const modal = document.getElementById('plant-recognition-modal');
        if(modal) modal.style.display = 'flex';
        this.updatePlantStatus('Ready for plant analysis');
    }

    closePlantModal() {
        const modal = document.getElementById('plant-recognition-modal');
        if(modal) modal.style.display = 'none';
        this.stopCamera();
    }
    
    // Unchanged functions
    async loadLocationAndData() { /* ... unchanged ... */ }
    getCurrentLocation() { /* ... unchanged ... */ }
    async loadNASAData() { /* ... unchanged ... */ }
    async startCamera() { /* ... unchanged ... */ }
    stopCamera() { /* ... unchanged ... */ }
    analyzeManualPlant() { /* ... unchanged ... */ }
    displayPlantResult(prediction) { /* ... unchanged ... */ }
    analyzePlantHealth(plantData) { /* ... unchanged ... */ }
    getGenericPlantData() { /* ... unchanged ... */ }
    updatePlantStatus(status) { /* ... unchanged ... */ }
}

// --- MODIFIED: Changed from DOMContentLoaded to window.onload ---
window.addEventListener('load', () => {
    if (!window.plantRecognition) {
        console.log('🌱 Initializing Plant Recognition system from window.onload...');
        window.plantRecognition = new PlantRecognition();
        window.plantRecognition.initializePlantRecognition();
    }
});

console.log('✅ Plant Recognition module loaded successfully');

