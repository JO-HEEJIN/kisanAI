// 🌱 Plant Recognition with TensorFlow.js
// 실시간 식물 인식 및 건강 분석 시스템

console.log('🚀 [PLANT-RECOGNITION] Script file is loading...');
console.log('🚀 [PLANT-RECOGNITION] TensorFlow.js available:', typeof tf !== 'undefined');

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

        // 식물 데이터베이스 (농업 작물 중심)
        this.plantDatabase = {
            // 곡물류
            'wheat': {
                category: 'cereal',
                scientificName: 'Triticum aestivum',
                commonNames: ['wheat', 'winter wheat', 'spring wheat'],
                optimalConditions: {
                    soilMoisture: [0.25, 0.45],
                    ndvi: [0.6, 0.8],
                    temperature: [15, 25],
                    season: 'winter'
                },
                diseases: ['rust', 'blight', 'powdery mildew'],
                healthIndicators: {
                    excellent: { ndvi: 0.8, color: 'deep green', growth: 'vigorous' },
                    good: { ndvi: 0.6, color: 'green', growth: 'normal' },
                    poor: { ndvi: 0.3, color: 'yellow-green', growth: 'stunted' }
                }
            },

            'corn': {
                category: 'cereal',
                scientificName: 'Zea mays',
                commonNames: ['corn', 'maize', 'sweet corn'],
                optimalConditions: {
                    soilMoisture: [0.3, 0.5],
                    ndvi: [0.7, 0.9],
                    temperature: [20, 30],
                    season: 'summer'
                },
                diseases: ['corn borer', 'leaf blight', 'rust'],
                healthIndicators: {
                    excellent: { ndvi: 0.85, color: 'dark green', growth: 'tall' },
                    good: { ndvi: 0.7, color: 'green', growth: 'normal' },
                    poor: { ndvi: 0.4, color: 'pale green', growth: 'short' }
                }
            },

            'rice': {
                category: 'cereal',
                scientificName: 'Oryza sativa',
                commonNames: ['rice', 'paddy rice'],
                optimalConditions: {
                    soilMoisture: [0.4, 0.7],
                    ndvi: [0.6, 0.8],
                    temperature: [25, 35],
                    season: 'summer'
                },
                diseases: ['blast', 'bacterial blight', 'sheath rot'],
                healthIndicators: {
                    excellent: { ndvi: 0.75, color: 'bright green', growth: 'dense' },
                    good: { ndvi: 0.6, color: 'green', growth: 'normal' },
                    poor: { ndvi: 0.35, color: 'yellow', growth: 'sparse' }
                }
            },

            'soybean': {
                category: 'legume',
                scientificName: 'Glycine max',
                commonNames: ['soybean', 'soy'],
                optimalConditions: {
                    soilMoisture: [0.25, 0.4],
                    ndvi: [0.5, 0.8],
                    temperature: [20, 30],
                    season: 'summer'
                },
                diseases: ['root rot', 'pod blight', 'mosaic virus'],
                healthIndicators: {
                    excellent: { ndvi: 0.75, color: 'deep green', growth: 'bushy' },
                    good: { ndvi: 0.6, color: 'green', growth: 'normal' },
                    poor: { ndvi: 0.35, color: 'light green', growth: 'weak' }
                }
            },

            // 채소류
            'tomato': {
                category: 'fruit',
                scientificName: 'Solanum lycopersicum',
                commonNames: ['tomato', 'cherry tomato'],
                optimalConditions: {
                    soilMoisture: [0.3, 0.5],
                    ndvi: [0.6, 0.8],
                    temperature: [18, 26],
                    season: 'summer'
                },
                diseases: ['blight', 'wilt', 'mosaic virus'],
                healthIndicators: {
                    excellent: { ndvi: 0.8, color: 'dark green', growth: 'robust' },
                    good: { ndvi: 0.65, color: 'green', growth: 'healthy' },
                    poor: { ndvi: 0.4, color: 'yellow-green', growth: 'weak' }
                }
            },

            'potato': {
                category: 'tuber',
                scientificName: 'Solanum tuberosum',
                commonNames: ['potato', 'sweet potato'],
                optimalConditions: {
                    soilMoisture: [0.3, 0.5],
                    ndvi: [0.5, 0.7],
                    temperature: [15, 22],
                    season: 'spring'
                },
                diseases: ['late blight', 'scab', 'blackleg'],
                healthIndicators: {
                    excellent: { ndvi: 0.7, color: 'green', growth: 'leafy' },
                    good: { ndvi: 0.55, color: 'green', growth: 'normal' },
                    poor: { ndvi: 0.3, color: 'yellow', growth: 'stunted' }
                }
            },

            // 일반 식물 (인식 불가시 기본값)
            'generic_plant': {
                category: 'general',
                scientificName: 'Unknown Plant',
                commonNames: ['unknown plant', 'unidentified'],
                optimalConditions: {
                    soilMoisture: [0.2, 0.5],
                    ndvi: [0.4, 0.8],
                    temperature: [15, 30],
                    season: 'all'
                },
                diseases: [],
                healthIndicators: {
                    excellent: { ndvi: 0.7, color: 'green', growth: 'healthy' },
                    good: { ndvi: 0.5, color: 'green', growth: 'normal' },
                    poor: { ndvi: 0.3, color: 'pale', growth: 'weak' }
                }
            }
        };

        this.initializePlantRecognition();
    }

    // 식물 인식 시스템 초기화
    async initializePlantRecognition() {
        console.log('🌱 Initializing Plant Recognition system...');

        // 로딩 인디케이터 표시
        this.showLoadingIndicator('Loading AI Model...');

        try {
            await this.loadTensorFlowModel();
            this.createPlantInterface();
            this.bindPlantEvents();

            // 로딩 완료
            this.hideLoadingIndicator();
            console.log('✅ Plant Recognition system ready');

            // 성공 알림 (3초 후 사라짐)
            this.showSuccessMessage('🌱 AI Plant Recognition Ready!');
        } catch (error) {
            console.error('❌ Failed to initialize Plant Recognition:', error);
            this.hideLoadingIndicator();
            this.createErrorInterface();
            alert(`Plant Recognition initialization failed: ${error.message}`);
        }
    }

    // 로딩 인디케이터 표시
    showLoadingIndicator(message) {
        const existingLoader = document.getElementById('plant-recognition-loader');
        if (existingLoader) return;

        const loader = document.createElement('div');
        loader.id = 'plant-recognition-loader';
        loader.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #0960E1 0%, #07173F 100%);
            color: #FFFFFF;
            padding: 15px 25px;
            border-radius: 12px;
            border: 2px solid #EAFE07;
            box-shadow: 0 4px 20px rgba(9, 96, 225, 0.4);
            z-index: 999999;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            font-weight: 600;
        `;

        loader.innerHTML = `
            <div style="
                width: 24px;
                height: 24px;
                border: 3px solid #EAFE07;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <span>${message}</span>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.appendChild(loader);
    }

    // 로딩 인디케이터 숨기기
    hideLoadingIndicator() {
        const loader = document.getElementById('plant-recognition-loader');
        if (loader) {
            loader.style.transition = 'opacity 0.3s ease-out';
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    }

    // 성공 메시지 표시
    showSuccessMessage(message) {
        const success = document.createElement('div');
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00C851 0%, #007E33 100%);
            color: #FFFFFF;
            padding: 15px 25px;
            border-radius: 12px;
            border: 2px solid #EAFE07;
            box-shadow: 0 4px 20px rgba(0, 200, 81, 0.4);
            z-index: 999999;
            font-size: 14px;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
        `;

        success.innerHTML = message;
        document.body.appendChild(success);

        // 3초 후 제거
        setTimeout(() => {
            success.style.transition = 'opacity 0.3s ease-out';
            success.style.opacity = '0';
            setTimeout(() => success.remove(), 300);
        }, 3000);
    }

    // TensorFlow.js 모델 로드
    async loadTensorFlowModel() {
        console.log('🧠 Loading real TensorFlow.js model (MobileNetV2)...');

        try {
            // TensorFlow.js 라이브러리 확인
            console.log('🔍 Checking TensorFlow.js availability...');
            if (typeof tf === 'undefined') {
                throw new Error('TensorFlow.js (tf) is not loaded. Please include the script in your HTML.');
            }
            console.log(`✅ TensorFlow.js version: ${tf.version.tfjs}`);

            // 실제 MobileNetV2 모델 로드 (TensorFlow Hub)
            console.log('📦 Loading MobileNetV2 from TensorFlow Hub... (This may take 10-30 seconds)');
            this.showLoadingIndicator('Downloading AI Model... (10-30s)');

            const modelUrl = 'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/5';

            const startTime = Date.now();
            this.model = await tf.loadGraphModel(modelUrl, { fromTFHub: true });
            const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);

            console.log(`✅ Model loaded in ${loadTime} seconds`);

            // Warm up the model
            console.log('🔥 Warming up model...');
            this.showLoadingIndicator('Preparing AI Model...');

            tf.tidy(() => {
                const warmupTensor = tf.zeros([1, 224, 224, 3]);
                this.model.predict(warmupTensor);
            });

            this.isModelLoaded = true;
            console.log('✅ Real Plant Recognition model loaded successfully');
            console.log('🎯 Model ready for predictions!');

        } catch (error) {
            console.error('❌ Real model loading failed:', error);
            console.error('❌ Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // ImageNet 클래스 매핑 (일부)
    get imagenetClasses() {
        return {
            985: 'ear',
            989: 'corn_cob',
            // 더 많은 클래스는 필요시 추가
        };
    }

    // ImageNet → 농업 작물 매핑
    get plantMapping() {
        return {
            'ear': 'corn',
            'corn_cob': 'corn',
            'acorn': 'generic_plant',
            'head cabbage': 'generic_plant',
            'broccoli': 'generic_plant',
            'cauliflower': 'generic_plant',
            'zucchini': 'generic_plant',
            'cucumber': 'generic_plant',
            'bell pepper': 'generic_plant',
            'Granny Smith': 'generic_plant',
            'strawberry': 'generic_plant',
            'orange': 'generic_plant',
            'lemon': 'generic_plant',
            'banana': 'generic_plant',
            'pomegranate': 'generic_plant',
            'pineapple': 'generic_plant'
        };
    }

    /**
     * 실제 TensorFlow 모델로 예측 실행
     * @param {HTMLVideoElement} videoElement - 비디오 엘리먼트
     * @returns {Promise<object>} 예측 결과
     */
    async runModelPrediction(videoElement) {
        console.log('🧠 Running real TensorFlow prediction...');

        if (!this.model || !this.isModelLoaded) {
            throw new Error('Model not loaded yet. Please wait for initialization.');
        }

        console.log('📸 Capturing video frame...');
        const tensor = tf.browser.fromPixels(videoElement)
            .resizeBilinear([224, 224])
            .toFloat()
            .expandDims(0);

        console.log('🔮 Running model inference...');
        const predictions = await this.model.predict(tensor).data();
        tensor.dispose();

        console.log(`✅ Got ${predictions.length} predictions`);

        // 최고 확률 클래스 찾기
        let topResult = { confidence: 0, index: -1 };
        for (let i = 0; i < predictions.length; i++) {
            if (predictions[i] > topResult.confidence) {
                topResult = { confidence: predictions[i], index: i };
            }
        }

        console.log(`🎯 Top prediction: index ${topResult.index}, confidence ${(topResult.confidence * 100).toFixed(2)}%`);

        // ImageNet 클래스 → 농업 작물 매핑
        const imagenetClass = this.imagenetClasses[topResult.index] || 'generic_plant';
        const plantType = this.plantMapping[imagenetClass] || 'generic_plant';

        console.log(`🌱 Detected: ImageNet[${topResult.index}] = "${imagenetClass}" → Plant: "${plantType}" (${(topResult.confidence * 100).toFixed(1)}%)`);

        return {
            plantType: plantType,
            confidence: topResult.confidence,
            isManual: false
        };
    }

    // 식물 인식 인터페이스 생성
    createPlantInterface() {
        const plantInterface = `
            <div id="plant-recognition-modal" class="plant-modal" style="display: none;">
                <div class="plant-modal-content">
                    <!-- Header -->
                    <div class="plant-header">
                        <div class="plant-title">
                            <h3>🌱 Plant Recognition</h3>
                            <p id="plant-status">AI Model Ready</p>
                        </div>
                        <button id="close-plant-modal" class="plant-close-btn">✕</button>
                    </div>

                    <!-- Camera View -->
                    <div class="plant-camera-container">
                        <video id="plant-video" class="plant-video" autoplay muted playsinline></video>
                        <canvas id="plant-canvas" class="plant-canvas"></canvas>

                        <!-- Camera Overlay -->
                        <div class="plant-camera-overlay">
                            <div class="plant-target-frame">
                                <div class="corner top-left"></div>
                                <div class="corner top-right"></div>
                                <div class="corner bottom-left"></div>
                                <div class="corner bottom-right"></div>
                            </div>
                            <div class="plant-instructions">
                                📱 Point camera at plant leaves or crops
                            </div>
                        </div>
                    </div>

                    <!-- Camera Controls -->
                    <div class="plant-controls">
                        <button id="start-camera-btn" class="plant-control-btn primary">
                            <span>📷</span> Start Camera
                        </button>
                        <button id="capture-plant-btn" class="plant-control-btn secondary" style="display: none;">
                            <span>🔍</span> Analyze Plant
                        </button>
                        <button id="stop-camera-btn" class="plant-control-btn danger" style="display: none;">
                            <span>🛑</span> Stop Camera
                        </button>
                    </div>

                    <!-- Analysis Results -->
                    <div id="plant-results" class="plant-results">
                        <div class="plant-results-placeholder">
                            <div class="placeholder-icon">🌿</div>
                            <p>Plant analysis results will appear here</p>
                            <p>Start the camera and point it at plants or crops</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', plantInterface);
        this.addPlantStyles();
    }

    // 오류 인터페이스 생성
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
                        <p>This feature requires a modern browser with WebGL support.</p>

                        <!-- Manual Plant Input -->
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
                            <button id="analyze-manual-plant" class="manual-analyze-btn">
                                Analyze Selected Plant
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', errorInterface);
        this.addPlantStyles();
    }

    // 식물 인식 UI 스타일 추가
    addPlantStyles() {
        const styles = `
            <style>
            .plant-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(7, 23, 63, 0.95);
                backdrop-filter: blur(10px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px;
            }

            .plant-modal-content {
                background: linear-gradient(135deg, #07173F 0%, #0960E1 100%);
                border-radius: 20px;
                width: 100%;
                max-width: 450px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }

            .plant-header {
                background: rgba(234, 254, 7, 0.1);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(234, 254, 7, 0.2);
            }

            .plant-title h3 {
                color: white;
                margin: 0;
                font-size: 18px;
                font-weight: bold;
            }

            .plant-title p {
                color: #EAFE07;
                margin: 2px 0 0 0;
                font-size: 12px;
            }

            .plant-close-btn {
                background: rgba(228, 55, 0, 0.8);
                color: white;
                border: none;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                font-size: 16px;
                cursor: pointer;
            }

            .plant-camera-container {
                position: relative;
                background: #000;
                aspect-ratio: 4/3;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .plant-video {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: none;
            }

            .plant-video.active {
                display: block;
            }

            .plant-canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: none;
            }

            .plant-camera-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                pointer-events: none;
                z-index: 1;
            }

            .plant-target-frame {
                position: relative;
                width: 200px;
                height: 200px;
                margin-bottom: 20px;
            }

            .corner {
                position: absolute;
                width: 30px;
                height: 30px;
                border: 3px solid #EAFE07;
                box-shadow: 0 0 10px rgba(234, 254, 7, 0.5);
            }

            .corner.top-left {
                top: 0;
                left: 0;
                border-right: none;
                border-bottom: none;
            }

            .corner.top-right {
                top: 0;
                right: 0;
                border-left: none;
                border-bottom: none;
            }

            .corner.bottom-left {
                bottom: 0;
                left: 0;
                border-right: none;
                border-top: none;
            }

            .corner.bottom-right {
                bottom: 0;
                right: 0;
                border-left: none;
                border-top: none;
            }

            .plant-instructions {
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                text-align: center;
            }

            .plant-controls {
                padding: 20px;
                display: flex;
                gap: 10px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .plant-control-btn {
                padding: 12px 20px;
                border: none;
                border-radius: 25px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                min-width: 120px;
                justify-content: center;
            }

            .plant-control-btn.primary {
                background: linear-gradient(45deg, #EAFE07, #2E96F5);
                color: #07173F;
            }

            .plant-control-btn.secondary {
                background: rgba(46, 150, 245, 0.8);
                color: white;
            }

            .plant-control-btn.danger {
                background: rgba(228, 55, 0, 0.8);
                color: white;
            }

            .plant-control-btn:hover {
                transform: scale(1.05);
            }

            .plant-results {
                padding: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                flex: 1;
                overflow-y: auto;
                max-height: 250px;
            }

            .plant-results-placeholder {
                text-align: center;
                color: rgba(255, 255, 255, 0.6);
                padding: 20px;
            }

            .placeholder-icon {
                font-size: 40px;
                margin-bottom: 15px;
                opacity: 0.7;
            }

            .plant-results-placeholder p {
                margin: 8px 0;
                line-height: 1.4;
            }

            .plant-result-item {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 15px;
                color: white;
                border-left: 4px solid #EAFE07;
            }

            .plant-result-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .plant-name {
                font-size: 16px;
                font-weight: bold;
                color: #EAFE07;
            }

            .confidence-badge {
                background: rgba(46, 150, 245, 0.3);
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
            }

            .plant-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin: 10px 0;
            }

            .detail-item {
                background: rgba(0, 0, 0, 0.2);
                padding: 8px 10px;
                border-radius: 6px;
                font-size: 12px;
            }

            .detail-label {
                color: #EAFE07;
                font-weight: bold;
                display: block;
                margin-bottom: 2px;
            }

            .health-score {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 10px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
            }

            .health-indicator {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
            }

            .health-indicator.excellent {
                background: #4CAF50;
                color: white;
            }

            .health-indicator.good {
                background: #FF9800;
                color: white;
            }

            .health-indicator.poor {
                background: #F44336;
                color: white;
            }

            /* 오류 화면 스타일 */
            .plant-error {
                padding: 40px 20px;
                text-align: center;
                color: white;
            }

            .error-icon {
                font-size: 60px;
                margin-bottom: 20px;
                opacity: 0.7;
            }

            .plant-error h3 {
                color: #EAFE07;
                margin: 0 0 15px;
            }

            .plant-error p {
                margin: 8px 0;
                opacity: 0.8;
                line-height: 1.4;
            }

            .manual-plant-input {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
            }

            .manual-plant-input h4 {
                color: white;
                margin-bottom: 15px;
            }

            .manual-select {
                width: 100%;
                padding: 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 14px;
                margin-bottom: 15px;
            }

            .manual-select option {
                background: #07173F;
                color: white;
            }

            .manual-analyze-btn {
                width: 100%;
                padding: 12px 20px;
                background: linear-gradient(45deg, #EAFE07, #2E96F5);
                color: #07173F;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .manual-analyze-btn:hover {
                transform: scale(1.02);
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // 이벤트 바인딩
    bindPlantEvents() {
        // Test Recognition 버튼
        const testPlantBtn = document.getElementById('test-plant-id-btn');
        if (testPlantBtn) {
            testPlantBtn.addEventListener('click', () => this.openPlantModal());
        }

        // 닫기 버튼
        const closeBtn = document.getElementById('close-plant-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePlantModal());
        }

        if (this.isModelLoaded) {
            // 카메라 제어 버튼들
            const startCameraBtn = document.getElementById('start-camera-btn');
            const capturePlantBtn = document.getElementById('capture-plant-btn');
            const stopCameraBtn = document.getElementById('stop-camera-btn');

            if (startCameraBtn) {
                startCameraBtn.addEventListener('click', () => this.startCamera());
            }

            if (capturePlantBtn) {
                capturePlantBtn.addEventListener('click', () => this.capturePlant());
            }

            if (stopCameraBtn) {
                stopCameraBtn.addEventListener('click', () => this.stopCamera());
            }
        } else {
            // 수동 분석 버튼 (모델 로드 실패 시)
            const manualAnalyzeBtn = document.getElementById('analyze-manual-plant');
            if (manualAnalyzeBtn) {
                manualAnalyzeBtn.addEventListener('click', () => this.analyzeManualPlant());
            }
        }
    }

    // 식물 인식 모달 열기
    async openPlantModal() {
        console.log('🌱 Opening Plant Recognition modal...');

        // GPS 위치와 NASA 데이터 로드
        await this.loadLocationAndData();

        const modal = document.getElementById('plant-recognition-modal');
        modal.style.display = 'flex';

        // 상태 업데이트
        this.updatePlantStatus('Ready for plant analysis');
    }

    // 식물 인식 모달 닫기
    closePlantModal() {
        const modal = document.getElementById('plant-recognition-modal');
        modal.style.display = 'none';

        // 카메라 정리
        this.stopCamera();
    }

    // 위치와 NASA 데이터 로드
    async loadLocationAndData() {
        await this.getCurrentLocation();
        await this.loadNASAData();
    }

    // GPS 위치 가져오기
    getCurrentLocation() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.currentLocation = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };
                        console.log('📍 Location for plant recognition:', this.currentLocation);
                        resolve();
                    },
                    (error) => {
                        console.warn('⚠️ GPS Error for plant recognition:', error);
                        this.currentLocation = { lat: 29.7604, lon: -95.3698 };
                        resolve();
                    }
                );
            } else {
                this.currentLocation = { lat: 29.7604, lon: -95.3698 };
                resolve();
            }
        });
    }

    // NASA 데이터 로드
    async loadNASAData() {
        if (!this.currentLocation) return;

        try {
            const [smapData, modisData] = await Promise.all([
                fetch(`http://localhost:3001/api/smap/soil-moisture?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`).then(r => r.json()),
                fetch(`http://localhost:3001/api/modis/ndvi?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`).then(r => r.json())
            ]);

            this.nasaData = {
                soilMoisture: smapData.soilMoisture || 0.3,
                ndvi: modisData.ndvi || 0.65,
                quality: smapData.quality || 'real'
            };

            console.log('🛰️ NASA data loaded for plant recognition:', this.nasaData);
        } catch (error) {
            console.warn('⚠️ NASA data load failed for plant recognition:', error);
            this.nasaData = {
                soilMoisture: 0.3,
                ndvi: 0.65,
                quality: 'fallback'
            };
        }
    }

    // 카메라 시작
    async startCamera() {
        console.log('📷 Starting camera for plant recognition...');

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            this.video = document.getElementById('plant-video');
            this.video.srcObject = this.stream;
            this.video.classList.add('active');

            this.canvas = document.getElementById('plant-canvas');
            this.ctx = this.canvas.getContext('2d');

            // UI 업데이트
            document.getElementById('start-camera-btn').style.display = 'none';
            document.getElementById('capture-plant-btn').style.display = 'block';
            document.getElementById('stop-camera-btn').style.display = 'block';

            this.isCapturing = true;
            this.updatePlantStatus('Camera active - Point at plant');

            console.log('✅ Camera started successfully');

        } catch (error) {
            console.error('❌ Camera access failed:', error);
            this.updatePlantStatus('Camera access failed');
            alert('Camera access denied. Please allow camera permissions and try again.');
        }
    }

    // 카메라 중지
    stopCamera() {
        console.log('🛑 Stopping camera...');

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.video) {
            this.video.classList.remove('active');
            this.video.srcObject = null;
        }

        // UI 업데이트
        document.getElementById('start-camera-btn').style.display = 'block';
        document.getElementById('capture-plant-btn').style.display = 'none';
        document.getElementById('stop-camera-btn').style.display = 'none';

        this.isCapturing = false;
        this.updatePlantStatus('Camera stopped');
    }

    // 식물 캡처 및 분석
    async capturePlant() {
        if (!this.isCapturing || !this.video) {
            console.warn('⚠️ Camera not ready for capture');
            return;
        }

        console.log('🔍 Capturing and analyzing plant...');
        this.updatePlantStatus('Analyzing plant...');

        try {
            // 실제 TensorFlow 모델로 예측 실행
            const prediction = await this.runModelPrediction(this.video);

            // 결과 표시
            this.displayPlantResult(prediction);

            this.updatePlantStatus('Analysis complete');

        } catch (error) {
            console.error('❌ Plant analysis failed:', error);
            this.updatePlantStatus('Analysis failed');
        }
    }

    // 수동 식물 분석 (모델 실패 시)
    analyzeManualPlant() {
        const select = document.getElementById('manual-plant-select');
        const plantType = select.value;

        if (!plantType) {
            alert('Please select a plant type first');
            return;
        }

        console.log(`🌱 Manual plant analysis: ${plantType}`);

        // 시뮬레이션 예측 결과 생성
        const prediction = {
            plantType: plantType,
            confidence: 0.95,
            isManual: true
        };

        this.displayPlantResult(prediction);
    }


    // 식물 분석 결과 표시
    displayPlantResult(prediction) {
        const resultsContainer = document.getElementById('plant-results');
        const placeholder = resultsContainer.querySelector('.plant-results-placeholder');

        if (placeholder) {
            placeholder.remove();
        }

        const plantData = this.plantDatabase[prediction.plantType] || this.getGenericPlantData();
        const healthAnalysis = this.analyzePlantHealth(plantData);

        const resultElement = document.createElement('div');
        resultElement.className = 'plant-result-item';

        resultElement.innerHTML = `
            <div class="plant-result-header">
                <div class="plant-name">${plantData.scientificName}</div>
                <div class="confidence-badge">${(prediction.confidence * 100).toFixed(0)}% ${prediction.isManual ? 'Manual' : 'AI'}</div>
            </div>

            <div class="plant-details">
                <div class="detail-item">
                    <span class="detail-label">Category:</span>
                    ${plantData.category}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Season:</span>
                    ${plantData.optimalConditions.season}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Soil Moisture:</span>
                    ${(this.nasaData.soilMoisture * 100).toFixed(1)}%
                </div>
                <div class="detail-item">
                    <span class="detail-label">NDVI Index:</span>
                    ${this.nasaData.ndvi.toFixed(2)}
                </div>
            </div>

            <div class="health-score">
                <div class="health-indicator ${healthAnalysis.level}">
                    ${healthAnalysis.score}%
                </div>
                <div>
                    <div style="color: #EAFE07; font-weight: bold; margin-bottom: 4px;">
                        Plant Health: ${healthAnalysis.level.toUpperCase()}
                    </div>
                    <div style="font-size: 12px; opacity: 0.8;">
                        ${healthAnalysis.advice}
                    </div>
                </div>
            </div>

            <div style="margin-top: 12px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 12px;">
                <strong>Recommendations:</strong><br>
                ${healthAnalysis.recommendations.join(' • ')}
            </div>
        `;

        resultsContainer.appendChild(resultElement);
        resultsContainer.scrollTop = resultsContainer.scrollHeight;

        console.log('✅ Plant analysis result displayed:', prediction);
    }

    // 식물 건강도 분석
    analyzePlantHealth(plantData) {
        if (!this.nasaData || !plantData.optimalConditions) {
            return {
                level: 'unknown',
                score: 50,
                advice: 'Unable to analyze health without NASA data',
                recommendations: ['Monitor plant regularly', 'Check soil conditions']
            };
        }

        let healthScore = 50; // 기본 점수
        const recommendations = [];

        // 토양 수분 평가 (0-30점)
        const soilMoisture = this.nasaData.soilMoisture;
        const optimalMoisture = plantData.optimalConditions.soilMoisture;

        if (soilMoisture >= optimalMoisture[0] && soilMoisture <= optimalMoisture[1]) {
            healthScore += 25; // 최적 수분
        } else if (soilMoisture < optimalMoisture[0]) {
            healthScore += 10; // 건조
            recommendations.push('Increase irrigation frequency');
        } else {
            healthScore += 15; // 과습
            recommendations.push('Improve drainage system');
        }

        // NDVI 평가 (0-30점)
        const ndvi = this.nasaData.ndvi;
        const optimalNDVI = plantData.optimalConditions.ndvi;

        if (ndvi >= optimalNDVI[1]) {
            healthScore += 25; // 우수한 식생
        } else if (ndvi >= optimalNDVI[0]) {
            healthScore += 20; // 양호한 식생
        } else {
            healthScore += 10; // 부족한 식생
            recommendations.push('Consider fertilizer application');
            recommendations.push('Check for pest or disease issues');
        }

        // 데이터 품질 보너스 (0-5점)
        if (this.nasaData.quality === 'real') {
            healthScore += 5;
        }

        // 건강도 레벨 결정
        let level, advice;
        if (healthScore >= 80) {
            level = 'excellent';
            advice = 'Plant is in excellent condition';
            recommendations.push('Maintain current management practices');
        } else if (healthScore >= 65) {
            level = 'good';
            advice = 'Plant health is good with room for improvement';
            recommendations.push('Monitor closely and optimize conditions');
        } else {
            level = 'poor';
            advice = 'Plant needs immediate attention';
            recommendations.push('Address soil and environmental issues urgently');
        }

        return {
            level,
            score: Math.min(100, Math.max(0, healthScore)),
            advice,
            recommendations: recommendations.slice(0, 3) // 최대 3개 권장사항
        };
    }

    // 일반 식물 데이터 (데이터베이스에 없는 경우)
    getGenericPlantData() {
        return {
            scientificName: 'Unknown Plant Species',
            category: 'general',
            optimalConditions: {
                soilMoisture: [0.25, 0.45],
                ndvi: [0.5, 0.7],
                temperature: [18, 26],
                season: 'growing'
            }
        };
    }

    // 상태 업데이트
    updatePlantStatus(status) {
        const statusElement = document.getElementById('plant-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
}

// 전역 초기화
window.plantRecognition = null;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 [PLANT-RECOGNITION] DOMContentLoaded event fired!');
    console.log('🚀 [PLANT-RECOGNITION] Current window.plantRecognition:', window.plantRecognition);
    console.log('🚀 [PLANT-RECOGNITION] Creating new PlantRecognition instance...');

    try {
        window.plantRecognition = new PlantRecognition();
        console.log('✅ [PLANT-RECOGNITION] Instance created successfully!');
    } catch (error) {
        console.error('❌ [PLANT-RECOGNITION] Failed to create instance:', error);
        console.error('❌ [PLANT-RECOGNITION] Error stack:', error.stack);
    }
});

// 디버깅용 전역 함수
window.testPlantRecognition = function() {
    if (window.plantRecognition) {
        window.plantRecognition.openPlantModal();
    } else {
        console.error('❌ Plant Recognition not initialized');
    }
};

console.log('✅ Plant Recognition module loaded successfully');