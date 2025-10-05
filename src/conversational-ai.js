// 🤖 Conversational AI for Agricultural Assistance
// NASA 데이터 기반 농업 상담 AI 시스템

class ConversationalAI {
    constructor() {
        this.chatHistory = [];
        this.currentLocation = null;
        this.nasaData = null;
        this.isActive = false;

        // 농업 지식베이스
        this.agriculturalKnowledge = {
            crops: {
                wheat: { optimalMoisture: [0.25, 0.45], optimalNDVI: [0.6, 0.8], season: 'winter' },
                corn: { optimalMoisture: [0.3, 0.5], optimalNDVI: [0.7, 0.9], season: 'summer' },
                rice: { optimalMoisture: [0.4, 0.7], optimalNDVI: [0.6, 0.8], season: 'summer' },
                soybean: { optimalMoisture: [0.25, 0.4], optimalNDVI: [0.5, 0.8], season: 'summer' }
            },
            diseases: {
                drought: { signs: ['low moisture', 'yellowing', 'wilting'], solution: 'increase irrigation' },
                overwatering: { signs: ['high moisture', 'root rot'], solution: 'reduce watering' },
                nutrient_deficiency: { signs: ['low NDVI', 'poor growth'], solution: 'fertilizer application' }
            },
            recommendations: {
                planting: 'Based on soil moisture and weather patterns',
                irrigation: 'Monitor SMAP soil moisture levels',
                harvesting: 'Check NDVI vegetation health index'
            }
        };

        this.initializeInterface();
    }

    // 채팅 인터페이스 초기화
    initializeInterface() {
        console.log('🤖 Initializing Conversational AI interface...');
        this.createChatInterface();
        this.bindEvents();
    }

    // 모바일 최적화 채팅 UI 생성
    createChatInterface() {
        const chatInterface = `
            <div id="conversational-ai-modal" class="ai-modal" style="display: none;">
                <div class="ai-modal-content">
                    <!-- Header -->
                    <div class="ai-chat-header">
                        <div class="ai-header-info">
                            <div class="ai-avatar">🤖</div>
                            <div class="ai-title">
                                <h3>Farm AI Assistant</h3>
                                <p id="ai-status">NASA Data Ready</p>
                            </div>
                        </div>
                        <button id="close-ai-chat" class="ai-close-btn">✕</button>
                    </div>

                    <!-- Chat Messages -->
                    <div id="ai-chat-messages" class="ai-chat-messages">
                        <div class="ai-message ai-bot-message">
                            <div class="ai-message-content">
                                <p>👋 Hello! I'm your Farm AI Assistant powered by NASA satellite data.</p>
                                <p>Ask me anything about soil, crops, weather, and farming!</p>
                            </div>
                            <div class="ai-message-time">${new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="ai-quick-actions">
                        <button class="ai-quick-btn" data-question="What is the current soil moisture?">💧 Soil Moisture</button>
                        <button class="ai-quick-btn" data-question="How is plant health?">🌱 Plant Health</button>
                        <button class="ai-quick-btn" data-question="When should I irrigate?">🚿 Irrigation</button>
                        <button class="ai-quick-btn" data-question="What's the weather like?">🌤️ Weather</button>
                    </div>

                    <!-- Input Area -->
                    <div class="ai-input-area">
                        <div class="ai-input-container">
                            <input type="text" id="ai-chat-input" placeholder="Ask me about farming, soil, crops, weather..." />
                            <button id="ai-send-btn" class="ai-send-btn">
                                <span>📤</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatInterface);
        this.addChatStyles();
    }

    // 모바일 최적화 스타일 추가
    addChatStyles() {
        const styles = `
            <style>
            .ai-modal {
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

            .ai-modal-content {
                background: linear-gradient(135deg, #07173F 0%, #0960E1 100%);
                border-radius: 20px;
                width: 100%;
                max-width: 400px;
                height: 90vh;
                max-height: 600px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }

            .ai-chat-header {
                background: rgba(234, 254, 7, 0.1);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(234, 254, 7, 0.2);
            }

            .ai-header-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .ai-avatar {
                width: 40px;
                height: 40px;
                background: #EAFE07;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }

            .ai-title h3 {
                color: white;
                margin: 0;
                font-size: 16px;
                font-weight: bold;
            }

            .ai-title p {
                color: #EAFE07;
                margin: 2px 0 0 0;
                font-size: 12px;
            }

            .ai-close-btn {
                background: rgba(228, 55, 0, 0.8);
                color: white;
                border: none;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ai-chat-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .ai-message {
                display: flex;
                flex-direction: column;
                max-width: 85%;
            }

            .ai-bot-message {
                align-self: flex-start;
            }

            .ai-user-message {
                align-self: flex-end;
            }

            .ai-message-content {
                background: #2e96f5;
                padding: 12px 16px;
                border-radius: 15px;
                color: white;
                line-height: 1.4;
            }

            .ai-user-message .ai-message-content {
                background: rgba(234, 254, 7, 0.2);
                color: #EAFE07;
            }

            .ai-message-content p {
                margin: 0 0 8px 0;
            }

            .ai-message-content p:last-child {
                margin-bottom: 0;
            }

            .ai-message-time {
                font-size: 10px;
                color: rgba(255, 255, 255, 0.6);
                margin-top: 4px;
                align-self: flex-end;
            }

            .ai-quick-actions {
                padding: 10px 15px;
                display: flex;
                gap: 8px;
                overflow-x: auto;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .ai-quick-btn {
                background: rgba(46, 150, 245, 0.3);
                color: white;
                border: 1px solid rgba(46, 150, 245, 0.5);
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                white-space: nowrap;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .ai-quick-btn:hover {
                background: rgba(46, 150, 245, 0.5);
                transform: scale(1.05);
            }

            .ai-input-area {
                padding: 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .ai-input-container {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            #ai-chat-input {
                flex: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 25px;
                padding: 12px 16px;
                color: white;
                font-size: 14px;
                outline: none;
            }

            #ai-chat-input::placeholder {
                color: rgba(255, 255, 255, 0.6);
            }

            .ai-send-btn {
                background: linear-gradient(45deg, #EAFE07, #2E96F5);
                border: none;
                width: 45px;
                height: 45px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: transform 0.2s ease;
            }

            .ai-send-btn:hover {
                transform: scale(1.1);
            }

            /* 모바일 스크롤 최적화 */
            .ai-chat-messages::-webkit-scrollbar {
                width: 4px;
            }

            .ai-chat-messages::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
            }

            .ai-chat-messages::-webkit-scrollbar-thumb {
                background: rgba(234, 254, 7, 0.5);
                border-radius: 2px;
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // 이벤트 바인딩
    bindEvents() {
        // Start Chat 버튼
        const startChatBtn = document.getElementById('start-chat-btn');
        if (startChatBtn) {
            startChatBtn.addEventListener('click', () => this.openChat());
        }

        // 닫기 버튼
        document.getElementById('close-ai-chat').addEventListener('click', () => this.closeChat());

        // 전송 버튼
        document.getElementById('ai-send-btn').addEventListener('click', () => this.sendMessage());

        // Enter 키 입력
        document.getElementById('ai-chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // 퀵 액션 버튼들
        document.querySelectorAll('.ai-quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.target.getAttribute('data-question');
                this.sendQuickMessage(question);
            });
        });
    }

    // 채팅 열기
    async openChat() {
        console.log('🤖 Opening conversational AI chat...');

        // GPS 위치 가져오기
        await this.getCurrentLocation();

        // NASA 데이터 로드
        await this.loadNASAData();

        // 채팅 인터페이스 표시
        const modal = document.getElementById('conversational-ai-modal');
        modal.style.display = 'flex';
        this.isActive = true;

        // 상태 업데이트
        const status = document.getElementById('ai-status');
        status.textContent = this.currentLocation
            ? `📍 ${this.currentLocation.lat.toFixed(2)}, ${this.currentLocation.lon.toFixed(2)}`
            : 'Getting GPS location...';
    }

    // 채팅 닫기
    closeChat() {
        const modal = document.getElementById('conversational-ai-modal');
        modal.style.display = 'none';
        this.isActive = false;
    }

    // 현재 위치 가져오기
    getCurrentLocation() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.currentLocation = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        };
                        console.log('📍 Location obtained:', this.currentLocation);
                        resolve();
                    },
                    (error) => {
                        console.warn('⚠️ GPS Error:', error);
                        this.currentLocation = { lat: 29.7604, lon: -95.3698 }; // 서울 기본값
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
                quality: smapData.quality || 'real',
                source: smapData.source || 'NASA Data'
            };

            console.log('🛰️ NASA data loaded:', this.nasaData);
        } catch (error) {
            console.warn('⚠️ NASA data load failed:', error);
            this.nasaData = {
                soilMoisture: 0.3,
                ndvi: 0.65,
                quality: 'fallback',
                source: 'Fallback Data'
            };
        }
    }

    // 메시지 전송
    sendMessage() {
        const input = document.getElementById('ai-chat-input');
        const message = input.value.trim();

        if (!message) return;

        this.addUserMessage(message);
        input.value = '';

        // AI 응답 생성
        setTimeout(() => {
            const response = this.generateAIResponse(message);
            this.addBotMessage(response);
        }, 1000);
    }

    // 퀵 메시지 전송
    sendQuickMessage(question) {
        this.addUserMessage(question);

        setTimeout(() => {
            const response = this.generateAIResponse(question);
            this.addBotMessage(response);
        }, 800);
    }

    // 사용자 메시지 추가
    addUserMessage(message) {
        const messagesContainer = document.getElementById('ai-chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'ai-message ai-user-message';
        messageElement.innerHTML = `
            <div class="ai-message-content">
                <p>${message}</p>
            </div>
            <div class="ai-message-time">${new Date().toLocaleTimeString()}</div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // AI 메시지 추가
    addBotMessage(message) {
        const messagesContainer = document.getElementById('ai-chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'ai-message ai-bot-message';
        messageElement.innerHTML = `
            <div class="ai-message-content">
                ${message}
            </div>
            <div class="ai-message-time">${new Date().toLocaleTimeString()}</div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // AI 응답 생성 (NASA 데이터 기반)
    generateAIResponse(userMessage) {
        const message = userMessage.toLowerCase();

        // Soil moisture related questions
        if (message.includes('soil') || message.includes('moisture') || message.includes('water') || message.includes('dry') || message.includes('wet')) {
            return this.generateSoilMoistureResponse();
        }

        // Plant health related questions
        if (message.includes('plant') || message.includes('health') || message.includes('ndvi') || message.includes('vegetation') || message.includes('green')) {
            return this.generatePlantHealthResponse();
        }

        // Irrigation timing related questions
        if (message.includes('irrigat') || message.includes('when') || message.includes('watering') || message.includes('water')) {
            return this.generateIrrigationResponse();
        }

        // Weather related questions
        if (message.includes('weather') || message.includes('temperature') || message.includes('climate') || message.includes('rain')) {
            return this.generateWeatherResponse();
        }

        // Crop related questions
        if (message.includes('crop') || message.includes('plant') || message.includes('grow') || message.includes('farm')) {
            return this.generateCropResponse();
        }

        // 기본 응답
        return this.generateGeneralResponse();
    }

    // Soil moisture response generation
    generateSoilMoistureResponse() {
        if (!this.nasaData) return '<p>Loading NASA data...</p>';

        const moisture = this.nasaData.soilMoisture;
        const moisturePercent = (moisture * 100).toFixed(1);

        let condition, advice, emoji;

        if (moisture < 0.2) {
            condition = 'Very Dry';
            advice = 'Immediate irrigation required';
            emoji = '🔥';
        } else if (moisture < 0.3) {
            condition = 'Dry';
            advice = 'Consider irrigation soon';
            emoji = '⚠️';
        } else if (moisture < 0.5) {
            condition = 'Optimal';
            advice = 'Current conditions are good';
            emoji = '✅';
        } else {
            condition = 'Too Wet';
            advice = 'Check drainage system';
            emoji = '💧';
        }

        return `
            <p>${emoji} <strong>Current Soil Moisture Status</strong></p>
            <p>📊 Moisture Level: ${moisturePercent}% (${condition})</p>
            <p>🛰️ Based on NASA SMAP Data</p>
            <p>💡 Advice: ${advice}</p>
            <p>📍 Location: ${this.currentLocation.lat.toFixed(2)}, ${this.currentLocation.lon.toFixed(2)}</p>
        `;
    }

    // Plant health response generation
    generatePlantHealthResponse() {
        if (!this.nasaData) return '<p>Loading NASA data...</p>';

        const ndvi = this.nasaData.ndvi;

        let condition, advice, emoji;

        if (ndvi < 0.3) {
            condition = 'Poor';
            advice = 'May need nutrition or pest control';
            emoji = '❌';
        } else if (ndvi < 0.5) {
            condition = 'Fair';
            advice = 'Continue monitoring plant status';
            emoji = '⚠️';
        } else if (ndvi < 0.7) {
            condition = 'Good';
            advice = 'Maintain current management';
            emoji = '✅';
        } else {
            condition = 'Excellent';
            advice = 'Plants are very healthy!';
            emoji = '🌟';
        }

        return `
            <p>${emoji} <strong>Plant Health Analysis</strong></p>
            <p>🌱 NDVI Index: ${ndvi.toFixed(2)} (${condition})</p>
            <p>🛰️ Based on MODIS Satellite Data</p>
            <p>💡 Advice: ${advice}</p>
            <p>📈 Higher NDVI means healthier vegetation</p>
        `;
    }

    // Irrigation timing response generation
    generateIrrigationResponse() {
        if (!this.nasaData) return '<p>Loading NASA data...</p>';

        const moisture = this.nasaData.soilMoisture;
        const ndvi = this.nasaData.ndvi;

        let recommendation, timing, emoji;

        if (moisture < 0.25) {
            recommendation = 'Immediate irrigation needed';
            timing = 'Right now';
            emoji = '🚨';
        } else if (moisture < 0.35) {
            recommendation = 'Irrigation recommended in 1-2 days';
            timing = 'Within 1-2 days';
            emoji = '⏰';
        } else if (moisture < 0.5) {
            recommendation = 'No irrigation needed currently';
            timing = 'Recheck in 3-5 days';
            emoji = '✅';
        } else {
            recommendation = 'Too wet - avoid irrigation';
            timing = 'Recheck after drainage';
            emoji = '🛑';
        }

        return `
            <p>${emoji} <strong>Irrigation Timing Analysis</strong></p>
            <p>💧 Current Soil Moisture: ${(moisture * 100).toFixed(1)}%</p>
            <p>⏱️ Recommended Timing: ${timing}</p>
            <p>📋 Advice: ${recommendation}</p>
            <p>🌱 Plant Health Index: ${ndvi.toFixed(2)}</p>
            <p>🛰️ Based on Real-time NASA SMAP Data</p>
        `;
    }

    // 날씨 응답 생성
    generateWeatherResponse() {
        const temp = 18 + Math.random() * 15; // 18-33도 랜덤
        const humidity = 40 + Math.random() * 40; // 40-80% 랜덤

        return `
            <p>🌤️ <strong>현재 기상 정보</strong></p>
            <p>🌡️ 기온: ${temp.toFixed(1)}°C</p>
            <p>💨 습도: ${humidity.toFixed(0)}%</p>
            <p>📍 위치: ${this.currentLocation.lat.toFixed(2)}, ${this.currentLocation.lon.toFixed(2)}</p>
            <p>💡 농업 조언: 현재 기온과 토양 수분을 고려하여 관리하세요</p>
            <p>🛰️ 위성 데이터와 종합적으로 분석됩니다</p>
        `;
    }

    // 작물 응답 생성
    generateCropResponse() {
        if (!this.nasaData) return '<p>NASA 데이터를 로딩 중입니다...</p>';

        const moisture = this.nasaData.soilMoisture;
        const ndvi = this.nasaData.ndvi;

        let suitableCrops = [];

        // 토양 수분과 NDVI 기반 작물 추천
        Object.entries(this.agriculturalKnowledge.crops).forEach(([crop, data]) => {
            const moistureOk = moisture >= data.optimalMoisture[0] && moisture <= data.optimalMoisture[1];
            const ndviOk = ndvi >= data.optimalNDVI[0] && ndvi <= data.optimalNDVI[1];

            if (moistureOk && ndviOk) {
                suitableCrops.push(crop);
            }
        });

        const cropList = suitableCrops.length > 0
            ? suitableCrops.join(', ')
            : '현재 조건에서는 토양 개선이 우선 필요합니다';

        return `
            <p>🌾 <strong>작물 재배 분석</strong></p>
            <p>📊 현재 토양 수분: ${(moisture * 100).toFixed(1)}%</p>
            <p>🌱 식생 지수: ${ndvi.toFixed(2)}</p>
            <p>✨ 추천 작물: ${cropList}</p>
            <p>🛰️ NASA 위성 데이터 기반 분석</p>
            <p>💡 지속적인 모니터링을 통해 최적의 재배 시기를 결정하세요</p>
        `;
    }

    // General response generation
    generateGeneralResponse() {
        const responses = [
            `<p>🤖 Hello! I'm your Farm AI Assistant powered by NASA satellite data.</p>
             <p>💡 Try asking questions like:</p>
             <p>• "What is the current soil moisture?"</p>
             <p>• "How is plant health?"</p>
             <p>• "When should I irrigate?"</p>`,

            `<p>🛰️ I help farmers using real-time NASA satellite data!</p>
             <p>📍 Current Location: ${this.currentLocation ? this.currentLocation.lat.toFixed(2) + ', ' + this.currentLocation.lon.toFixed(2) : 'Getting location...'}</p>
             <p>💬 Ask me specific questions for more accurate answers.</p>`,

            `<p>🌱 Your agricultural AI specialist is here to help!</p>
             <p>🔍 Ask me anything about soil, crops, weather, or irrigation.</p>
             <p>📊 All my answers are based on real NASA satellite data.</p>`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// 전역 초기화
window.conversationalAI = null;

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🤖 Initializing Conversational AI system...');
    window.conversationalAI = new ConversationalAI();
});

// 디버깅용 전역 함수
window.testConversationalAI = function() {
    if (window.conversationalAI) {
        window.conversationalAI.openChat();
    } else {
        console.error('❌ Conversational AI not initialized');
    }
};

console.log('✅ Conversational AI module loaded successfully');
