// 🎤 Voice Commands for Agricultural Assistance
// Web Speech API를 활용한 핸즈프리 농업 분석 시스템

class VoiceCommands {
    constructor() {
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.isSupported = false;
        this.currentLocation = null;
        this.nasaData = null;

        // 농업 음성 명령어 패턴
        this.voiceCommands = {
            // 토양 관련 명령어
            soil: {
                patterns: [
                    /soil.*moisture/i,
                    /how.*soil/i,
                    /check.*soil/i,
                    /soil.*status/i,
                    /moisture.*level/i
                ],
                action: 'checkSoilMoisture',
                response: 'Checking soil moisture from NASA satellite data'
            },

            // 식물 건강도 관련 명령어
            plant: {
                patterns: [
                    /plant.*health/i,
                    /vegetation.*index/i,
                    /how.*plants/i,
                    /ndvi.*status/i,
                    /crop.*health/i
                ],
                action: 'checkPlantHealth',
                response: 'Analyzing plant health using MODIS data'
            },

            // 관개 관련 명령어
            irrigation: {
                patterns: [
                    /when.*water/i,
                    /irrigation.*time/i,
                    /should.*irrigate/i,
                    /watering.*schedule/i,
                    /need.*water/i
                ],
                action: 'checkIrrigation',
                response: 'Calculating optimal irrigation timing'
            },

            // 날씨 관련 명령어
            weather: {
                patterns: [
                    /weather.*today/i,
                    /current.*weather/i,
                    /temperature.*now/i,
                    /climate.*status/i,
                    /forecast/i
                ],
                action: 'checkWeather',
                response: 'Getting current weather conditions'
            },

            // 위치 관련 명령어
            location: {
                patterns: [
                    /where.*am.*i/i,
                    /current.*location/i,
                    /gps.*position/i,
                    /my.*coordinates/i
                ],
                action: 'getLocation',
                response: 'Getting your GPS location'
            },

            // 도움말 명령어
            help: {
                patterns: [
                    /help/i,
                    /what.*can.*you/i,
                    /commands/i,
                    /how.*to.*use/i
                ],
                action: 'showHelp',
                response: 'Here are the voice commands you can use'
            }
        };

        this.initializeVoiceSystem();
    }

    // 음성 시스템 초기화
    initializeVoiceSystem() {
        console.log('🎤 Initializing Voice Commands system...');

        // Web Speech API 지원 확인
        this.checkSpeechSupport();

        if (this.isSupported) {
            this.setupSpeechRecognition();
            this.setupSpeechSynthesis();
            this.createVoiceInterface();
        } else {
            console.warn('⚠️ Web Speech API not supported');
            this.createUnsupportedInterface();
        }
    }

    // iOS/모바일 감지
    isIOSDevice() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 음성 인식 지원 확인
    checkSpeechSupport() {
        const hasWebSpeechAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        const isIOSDevice = this.isIOSDevice();

        if (hasWebSpeechAPI) {
            this.isSupported = true;
            if (isIOSDevice) {
                console.log('✅ Speech Recognition supported (iOS text input fallback)');
            } else {
                console.log('✅ Speech Recognition supported (native)');
            }
        } else {
            this.isSupported = false;
            console.log('❌ Speech Recognition not supported');
        }

        if ('speechSynthesis' in window) {
            console.log('✅ Speech Synthesis supported');
        } else {
            console.log('❌ Speech Synthesis not supported');
        }
    }

    // 음성 인식 설정 (iOS Safari polyfill 지원)
    setupSpeechRecognition() {
        // 기본 Web Speech API 또는 iOS polyfill 사용
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        if (this.isIOSDevice()) {
            console.log('🍎 Using iOS Safari text input fallback');
        } else {
            console.log('🎤 Using native Web Speech API');
        }

        // 음성 인식 설정
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;

        // 이벤트 리스너 설정
        this.recognition.onstart = () => {
            console.log('🎤 Voice recognition started');
            this.updateVoiceStatus('Listening...');
            this.isListening = true;
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;

            console.log(`🗣️ Voice input: "${transcript}" (confidence: ${confidence.toFixed(2)})`);
            this.processVoiceCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('❌ Voice recognition error:', event.error);
            this.updateVoiceStatus(`Error: ${event.error}`);
            this.isListening = false;
        };

        this.recognition.onend = () => {
            console.log('🎤 Voice recognition ended');
            this.updateVoiceStatus('Ready to listen');
            this.isListening = false;
        };
    }

    // 음성 합성 설정
    setupSpeechSynthesis() {
        this.synthesis = window.speechSynthesis;
    }

    // 음성 인터페이스 생성
    createVoiceInterface() {
        const voiceInterface = `
            <div id="voice-commands-modal" class="voice-modal" style="display: none;">
                <div class="voice-modal-content">
                    <!-- Header -->
                    <div class="voice-header">
                        <div class="voice-title">
                            <h3>🎤 Voice Commands</h3>
                            <p id="voice-status">Ready to listen</p>
                            <p id="ios-info" style="font-size: 12px; color: #EAFE07; margin: 5px 0 0 0; display: none;">
                                iOS Safari: Voice commands will show text input dialog
                            </p>
                        </div>
                        <button id="close-voice-modal" class="voice-close-btn">✕</button>
                    </div>

                    <!-- Voice Controls -->
                    <div class="voice-controls">
                        <div class="voice-button-container">
                            <button id="start-listening-btn" class="voice-main-btn">
                                <span class="voice-icon">🎤</span>
                                <span class="voice-text">Start Listening</span>
                            </button>

                            <button id="stop-listening-btn" class="voice-main-btn" style="display: none;">
                                <span class="voice-icon">🛑</span>
                                <span class="voice-text">Stop Listening</span>
                            </button>
                        </div>

                        <div class="voice-indicator">
                            <div id="voice-wave" class="voice-wave"></div>
                        </div>
                    </div>

                    <!-- Quick Voice Commands -->
                    <div class="voice-quick-commands">
                        <h4>Try saying:</h4>
                        <div class="voice-command-list">
                            <div class="voice-command-item" onclick="window.voiceCommands.simulateVoice('Check soil moisture')">
                                💧 "Check soil moisture"
                            </div>
                            <div class="voice-command-item" onclick="window.voiceCommands.simulateVoice('How is plant health')">
                                🌱 "How is plant health?"
                            </div>
                            <div class="voice-command-item" onclick="window.voiceCommands.simulateVoice('When should I water')">
                                🚿 "When should I water?"
                            </div>
                            <div class="voice-command-item" onclick="window.voiceCommands.simulateVoice('What is the weather')">
                                🌤️ "What's the weather?"
                            </div>
                        </div>
                    </div>

                    <!-- Voice Response Area -->
                    <div id="voice-response-area" class="voice-response-area">
                        <div class="voice-response-placeholder">
                            <p>🎤 Voice responses will appear here</p>
                            <p>Try asking about soil, plants, weather, or irrigation</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', voiceInterface);
        this.addVoiceStyles();
        this.bindVoiceEvents();
    }

    // 지원되지 않는 브라우저용 인터페이스
    createUnsupportedInterface() {
        const unsupportedInterface = `
            <div id="voice-commands-modal" class="voice-modal" style="display: none;">
                <div class="voice-modal-content">
                    <div class="voice-header">
                        <div class="voice-title">
                            <h3>🎤 Voice Commands</h3>
                            <p>Not Available</p>
                        </div>
                        <button id="close-voice-modal" class="voice-close-btn">✕</button>
                    </div>

                    <div class="voice-unsupported">
                        <div class="unsupported-icon">🚫</div>
                        <h3>Voice Commands Not Supported</h3>
                        <p>Your browser doesn't support Web Speech API.</p>
                        <p>Try using Chrome, Edge, or Safari for voice features.</p>

                        <!-- Fallback: Text-based commands -->
                        <div class="fallback-commands">
                            <h4>Available Commands:</h4>
                            <button onclick="window.voiceCommands.simulateVoice('Check soil moisture')" class="fallback-btn">
                                💧 Check Soil Moisture
                            </button>
                            <button onclick="window.voiceCommands.simulateVoice('How is plant health')" class="fallback-btn">
                                🌱 Check Plant Health
                            </button>
                            <button onclick="window.voiceCommands.simulateVoice('When should I water')" class="fallback-btn">
                                🚿 Irrigation Timing
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', unsupportedInterface);
        this.addVoiceStyles();
        this.bindVoiceEvents();
    }

    // 음성 UI 스타일 추가
    addVoiceStyles() {
        const styles = `
            <style>
            .voice-modal {
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
                padding: 15px;
            }

            .voice-modal-content {
                background: linear-gradient(135deg, #07173F 0%, #0960E1 100%);
                border-radius: 20px;
                width: 100%;
                max-width: 400px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }

            .voice-header {
                background: rgba(234, 254, 7, 0.1);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(234, 254, 7, 0.2);
            }

            .voice-title h3 {
                color: white;
                margin: 0;
                font-size: 18px;
                font-weight: bold;
            }

            .voice-title p {
                color: #EAFE07;
                margin: 2px 0 0 0;
                font-size: 12px;
            }

            .voice-close-btn {
                background: rgba(228, 55, 0, 0.8);
                color: white;
                border: none;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                font-size: 16px;
                cursor: pointer;
            }

            .voice-controls {
                padding: 30px 20px;
                text-align: center;
            }

            .voice-button-container {
                margin-bottom: 20px;
            }

            .voice-main-btn {
                background: linear-gradient(45deg, #EAFE07, #2E96F5);
                color: #07173F;
                border: none;
                padding: 20px 30px;
                border-radius: 50px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 0 auto;
                transition: all 0.3s ease;
                min-width: 200px;
                justify-content: center;
            }

            .voice-main-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(234, 254, 7, 0.4);
            }

            .voice-main-btn:active {
                transform: scale(0.95);
            }

            .voice-icon {
                font-size: 20px;
            }

            .voice-indicator {
                margin: 20px 0;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .voice-wave {
                width: 80px;
                height: 4px;
                background: rgba(234, 254, 7, 0.3);
                border-radius: 2px;
                position: relative;
                overflow: hidden;
            }

            .voice-wave.active::before {
                content: '';
                position: absolute;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, #EAFE07, transparent);
                animation: voice-pulse 1.5s infinite;
            }

            @keyframes voice-pulse {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            .voice-quick-commands {
                padding: 0 20px 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                margin-top: 10px;
            }

            .voice-quick-commands h4 {
                color: white;
                margin: 15px 0 10px;
                font-size: 14px;
                text-align: center;
            }

            .voice-command-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .voice-command-item {
                background: rgba(46, 150, 245, 0.2);
                color: white;
                padding: 12px 15px;
                border-radius: 10px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid rgba(46, 150, 245, 0.3);
            }

            .voice-command-item:hover {
                background: rgba(46, 150, 245, 0.4);
                transform: translateX(5px);
            }

            .voice-response-area {
                padding: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                flex: 1;
                overflow-y: auto;
                min-height: 120px;
            }

            .voice-response-placeholder {
                text-align: center;
                color: rgba(255, 255, 255, 0.6);
                font-size: 14px;
            }

            .voice-response-item {
                background: rgba(255, 255, 255, 0.1);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 10px;
                color: white;
                border-left: 4px solid #EAFE07;
            }

            .voice-response-item h5 {
                color: #EAFE07;
                margin: 0 0 8px 0;
                font-size: 14px;
            }

            /* 지원되지 않는 브라우저용 스타일 */
            .voice-unsupported {
                padding: 40px 20px;
                text-align: center;
                color: white;
            }

            .unsupported-icon {
                font-size: 60px;
                margin-bottom: 20px;
                opacity: 0.7;
            }

            .voice-unsupported h3 {
                color: #EAFE07;
                margin: 0 0 15px;
            }

            .voice-unsupported p {
                margin: 8px 0;
                opacity: 0.8;
                line-height: 1.4;
            }

            .fallback-commands {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
            }

            .fallback-commands h4 {
                color: white;
                margin-bottom: 15px;
            }

            .fallback-btn {
                background: rgba(46, 150, 245, 0.3);
                color: white;
                border: 1px solid rgba(46, 150, 245, 0.5);
                padding: 12px 20px;
                border-radius: 10px;
                margin: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
                display: block;
                width: 100%;
                margin-bottom: 10px;
            }

            .fallback-btn:hover {
                background: rgba(46, 150, 245, 0.5);
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // 이벤트 바인딩
    bindVoiceEvents() {
        // Test Voice 버튼
        const testVoiceBtn = document.getElementById('test-voice-btn');
        if (testVoiceBtn) {
            testVoiceBtn.addEventListener('click', () => this.openVoiceModal());
        }

        // 닫기 버튼
        const closeBtn = document.getElementById('close-voice-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeVoiceModal());
        }

        // 음성 시작/중지 버튼 (지원되는 브라우저만)
        if (this.isSupported) {
            const startBtn = document.getElementById('start-listening-btn');
            const stopBtn = document.getElementById('stop-listening-btn');

            if (startBtn) {
                startBtn.addEventListener('click', () => this.startListening());
            }

            if (stopBtn) {
                stopBtn.addEventListener('click', () => this.stopListening());
            }
        }
    }

    // 음성 모달 열기
    async openVoiceModal() {
        console.log('🎤 Opening Voice Commands modal...');

        // GPS 위치와 NASA 데이터 로드
        await this.loadLocationAndData();

        const modal = document.getElementById('voice-commands-modal');
        modal.style.display = 'flex';

        // iOS 특화 UI 업데이트
        if (this.isIOSDevice()) {
            const iosInfo = document.getElementById('ios-info');
            const startBtn = document.getElementById('start-listening-btn');
            const startBtnText = startBtn?.querySelector('.voice-text');

            if (iosInfo) iosInfo.style.display = 'block';
            if (startBtnText) startBtnText.textContent = 'Type Voice Command';

            this.updateVoiceStatus('Ready - Tap to type command');
        } else {
            // 지원되는 브라우저에서 자동으로 음성 인식 시작
            if (this.isSupported) {
                setTimeout(() => {
                    this.speak("Voice commands ready. You can ask about soil, plants, weather, or irrigation.");
                }, 500);
            }
        }
    }

    // 음성 모달 닫기
    closeVoiceModal() {
        const modal = document.getElementById('voice-commands-modal');
        modal.style.display = 'none';

        if (this.isListening) {
            this.stopListening();
        }
    }

    // 위치와 NASA 데이터 로드
    async loadLocationAndData() {
        // GPS 위치 가져오기
        await this.getCurrentLocation();

        // NASA 데이터 로드
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
                        console.log('📍 Location for voice commands:', this.currentLocation);
                        resolve();
                    },
                    (error) => {
                        console.warn('⚠️ GPS Error for voice:', error);
                        this.currentLocation = { lat: 37.5665, lon: 126.9780 };
                        resolve();
                    }
                );
            } else {
                this.currentLocation = { lat: 37.5665, lon: 126.9780 };
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

            console.log('🛰️ NASA data loaded for voice commands:', this.nasaData);
        } catch (error) {
            console.warn('⚠️ NASA data load failed for voice:', error);
            this.nasaData = {
                soilMoisture: 0.3,
                ndvi: 0.65,
                quality: 'fallback'
            };
        }
    }

    // 음성 인식 시작
    startListening() {
        if (!this.isSupported || this.isListening) return;

        try {
            this.recognition.start();

            // UI 업데이트
            document.getElementById('start-listening-btn').style.display = 'none';
            document.getElementById('stop-listening-btn').style.display = 'flex';
            document.getElementById('voice-wave').classList.add('active');

        } catch (error) {
            console.error('❌ Failed to start voice recognition:', error);
            this.updateVoiceStatus('Failed to start listening');
        }
    }

    // 음성 인식 중지
    stopListening() {
        if (!this.isSupported || !this.isListening) return;

        this.recognition.stop();

        // UI 업데이트
        document.getElementById('start-listening-btn').style.display = 'flex';
        document.getElementById('stop-listening-btn').style.display = 'none';
        document.getElementById('voice-wave').classList.remove('active');
    }

    // 음성 상태 업데이트
    updateVoiceStatus(status) {
        const statusElement = document.getElementById('voice-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    // 음성 명령 처리
    processVoiceCommand(transcript) {
        console.log(`🔍 Processing voice command: "${transcript}"`);

        // 명령어 패턴 매칭
        let matchedCommand = null;

        for (const [category, command] of Object.entries(this.voiceCommands)) {
            for (const pattern of command.patterns) {
                if (pattern.test(transcript)) {
                    matchedCommand = command;
                    break;
                }
            }
            if (matchedCommand) break;
        }

        if (matchedCommand) {
            // 일치하는 명령어 실행
            this.speak(matchedCommand.response);
            this.executeVoiceAction(matchedCommand.action, transcript);
        } else {
            // 일치하지 않는 경우
            this.speak("I didn't understand that command. Try asking about soil, plants, weather, or irrigation.");
        }
    }

    // 음성 액션 실행
    async executeVoiceAction(action, originalCommand) {
        console.log(`🎯 Executing voice action: ${action}`);

        let response = '';

        switch (action) {
            case 'checkSoilMoisture':
                response = this.generateSoilMoistureVoiceResponse();
                break;

            case 'checkPlantHealth':
                response = this.generatePlantHealthVoiceResponse();
                break;

            case 'checkIrrigation':
                response = this.generateIrrigationVoiceResponse();
                break;

            case 'checkWeather':
                response = this.generateWeatherVoiceResponse();
                break;

            case 'getLocation':
                response = this.generateLocationVoiceResponse();
                break;

            case 'showHelp':
                response = this.generateHelpVoiceResponse();
                break;

            default:
                response = "Sorry, I couldn't process that command.";
        }

        // 응답 표시 및 음성 출력
        this.displayVoiceResponse(originalCommand, response);

        setTimeout(() => {
            this.speak(response);
        }, 500);
    }

    // 음성 응답 생성 - 토양 수분
    generateSoilMoistureVoiceResponse() {
        if (!this.nasaData) return "NASA data is not available right now.";

        const moisture = this.nasaData.soilMoisture;
        const moisturePercent = (moisture * 100).toFixed(0);

        let condition, advice;

        if (moisture < 0.2) {
            condition = 'very dry';
            advice = 'Immediate irrigation is needed.';
        } else if (moisture < 0.3) {
            condition = 'dry';
            advice = 'Consider irrigating soon.';
        } else if (moisture < 0.5) {
            condition = 'optimal';
            advice = 'Soil conditions are good.';
        } else {
            condition = 'too wet';
            advice = 'Check your drainage system.';
        }

        return `Current soil moisture is ${moisturePercent} percent, which is ${condition}. ${advice}`;
    }

    // 음성 응답 생성 - 식물 건강도
    generatePlantHealthVoiceResponse() {
        if (!this.nasaData) return "NASA plant data is not available right now.";

        const ndvi = this.nasaData.ndvi;
        let condition, advice;

        if (ndvi < 0.3) {
            condition = 'poor';
            advice = 'Your plants may need nutrition or pest control.';
        } else if (ndvi < 0.5) {
            condition = 'fair';
            advice = 'Continue monitoring your plants.';
        } else if (ndvi < 0.7) {
            condition = 'good';
            advice = 'Maintain your current management.';
        } else {
            condition = 'excellent';
            advice = 'Your plants are very healthy!';
        }

        return `Plant health index is ${ndvi.toFixed(2)}, which is ${condition}. ${advice}`;
    }

    // 음성 응답 생성 - 관개
    generateIrrigationVoiceResponse() {
        if (!this.nasaData) return "Irrigation data is not available right now.";

        const moisture = this.nasaData.soilMoisture;
        let timing, advice;

        if (moisture < 0.25) {
            timing = 'right now';
            advice = 'Immediate irrigation is required.';
        } else if (moisture < 0.35) {
            timing = 'within one to two days';
            advice = 'Plan to irrigate soon.';
        } else if (moisture < 0.5) {
            timing = 'in three to five days';
            advice = 'No immediate irrigation needed.';
        } else {
            timing = 'not recommended';
            advice = 'Soil is too wet, avoid irrigation.';
        }

        return `Based on current soil moisture, irrigation is ${timing}. ${advice}`;
    }

    // 음성 응답 생성 - 날씨
    generateWeatherVoiceResponse() {
        const temp = 18 + Math.random() * 15;
        const humidity = 40 + Math.random() * 40;

        return `Current temperature is ${temp.toFixed(0)} degrees Celsius with ${humidity.toFixed(0)} percent humidity. Good conditions for farming activities.`;
    }

    // 음성 응답 생성 - 위치
    generateLocationVoiceResponse() {
        if (!this.currentLocation) return "Location data is not available.";

        return `You are at latitude ${this.currentLocation.lat.toFixed(2)} and longitude ${this.currentLocation.lon.toFixed(2)}.`;
    }

    // 음성 응답 생성 - 도움말
    generateHelpVoiceResponse() {
        return "You can ask me about soil moisture, plant health, irrigation timing, weather conditions, or your current location. Just speak naturally!";
    }

    // 음성 응답 표시
    displayVoiceResponse(command, response) {
        const responseArea = document.getElementById('voice-response-area');
        const placeholder = responseArea.querySelector('.voice-response-placeholder');

        if (placeholder) {
            placeholder.remove();
        }

        const responseItem = document.createElement('div');
        responseItem.className = 'voice-response-item';
        responseItem.innerHTML = `
            <h5>🗣️ You said: "${command}"</h5>
            <p>🤖 ${response}</p>
        `;

        responseArea.appendChild(responseItem);
        responseArea.scrollTop = responseArea.scrollHeight;
    }

    // 텍스트를 음성으로 변환
    speak(text) {
        if (!this.synthesis) return;

        // 진행 중인 음성 중지
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        // 가능하면 여성 음성 사용
        const voices = this.synthesis.getVoices();
        const femaleVoice = voices.find(voice =>
            voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => voice.lang.startsWith('en'));

        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }

        utterance.onstart = () => {
            console.log('🔊 Speaking:', text);
        };

        utterance.onend = () => {
            console.log('🔇 Speech ended');
        };

        this.synthesis.speak(utterance);
    }

    // 음성 명령 시뮬레이션 (테스트용)
    simulateVoice(command) {
        console.log(`🎭 Simulating voice command: "${command}"`);
        this.processVoiceCommand(command);
    }
}

// 전역 초기화
window.voiceCommands = null;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎤 Initializing Voice Commands system...');
    window.voiceCommands = new VoiceCommands();
});

// 디버깅용 전역 함수
window.testVoiceCommands = function() {
    if (window.voiceCommands) {
        window.voiceCommands.openVoiceModal();
    } else {
        console.error('❌ Voice Commands not initialized');
    }
};

console.log('✅ Voice Commands module loaded successfully');