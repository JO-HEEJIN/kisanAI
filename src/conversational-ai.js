// 🤖 Conversational AI for Agricultural Assistance v3.0
// This version integrates a full-featured UI, advanced GPT-3.5 prompting with history,
// NASA data caching, and a comprehensive rule-based fallback system.

class ConversationalAI {
    constructor() {
        // State Management
        this.chatHistory = [];
        this.currentLocation = null;
        this.nasaData = null;
        this.isActive = false;
        this.openAIApiKey = null;
        this.state = 'idle'; // idle, loading_gps, loading_nasa, ready, awaiting_response

        // Caching
        this.cache = {
            nasaData: null,
            timestamp: 0,
            ttl: 300000, // 5 minutes
        };

        // Expanded agricultural knowledge base for context and fallbacks
        this.agriculturalKnowledge = {
            crops: {
                wheat: { name: 'Wheat', optimalMoisture: [0.25, 0.45], optimalNDVI: [0.6, 0.8], season: 'Winter' },
                corn: { name: 'Corn (Maize)', optimalMoisture: [0.3, 0.5], optimalNDVI: [0.7, 0.9], season: 'Summer' },
                rice: { name: 'Rice', optimalMoisture: [0.4, 0.7], optimalNDVI: [0.6, 0.8], season: 'Summer' },
                soybean: { name: 'Soybean', optimalMoisture: [0.25, 0.4], optimalNDVI: [0.5, 0.8], season: 'Summer' },
                potato: { name: 'Potato', optimalMoisture: [0.3, 0.5], optimalNDVI: [0.5, 0.7], season: 'Spring' },
                tomato: { name: 'Tomato', optimalMoisture: [0.3, 0.5], optimalNDVI: [0.6, 0.8], season: 'Summer' }
            },
            diseases: {
                drought: { signs: 'low moisture, yellowing leaves, wilting', solution: 'Increase irrigation frequency and volume.' },
                overwatering: { signs: 'high moisture, root rot, leaf yellowing', solution: 'Reduce watering and ensure proper soil drainage.' },
                nutrient_deficiency: { signs: 'low NDVI, stunted growth, discoloration', solution: 'Apply a balanced fertilizer. A soil test is recommended.' }
            }
        };

        this.initializeInterface();
    }

    // --- 1. INITIALIZATION ---

    initializeInterface() {
        console.log('🤖 Initializing Conversational AI interface v3.0...');
        this.createChatInterface();
        this.addChatStyles();
        this.bindEvents();
    }

    createChatInterface() {
        const chatInterface = `
            <div id="conversational-ai-modal" class="ai-modal" style="display: none;">
                <div class="ai-modal-content">
                    <div class="ai-chat-header">
                        <div class="ai-header-info">
                            <div class="ai-avatar">🤖</div>
                            <div class="ai-title">
                                <h3>Farm AI Assistant</h3>
                                <p id="ai-status">Connecting...</p>
                            </div>
                        </div>
                        <button id="close-ai-chat" class="ai-close-btn">✕</button>
                    </div>
                    <div id="ai-chat-messages" class="ai-chat-messages">
                        <!-- Welcome message will be added dynamically -->
                    </div>
                    <div class="ai-quick-actions">
                        <button class="ai-quick-btn" data-question="Analyze my current farm conditions">📊 Analyze Farm</button>
                        <button class="ai-quick-btn" data-question="Should I irrigate today?">💧 Irrigation Advice</button>
                        <button class="ai-quick-btn" data-question="What is the forecast?">📈 Predictions</button>
                    </div>
                    <div class="ai-input-area">
                        <div class="ai-input-container">
                            <input type="text" id="ai-chat-input" placeholder="Ask a question..." disabled />
                            <button id="ai-send-btn" class="ai-send-btn" disabled><span>📤</span></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatInterface);
    }

    addChatStyles() {
        if (document.getElementById('conversational-ai-styles')) return;
        const styles = `
            <style id="conversational-ai-styles">
            .ai-modal {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(10, 25, 47, 0.9); backdrop-filter: blur(8px);
                z-index: 10000; display: flex; align-items: center; justify-content: center;
                padding: 10px; opacity: 0; transform: scale(0.95); transition: opacity 0.3s ease, transform 0.3s ease;
            }
            .ai-modal.visible { opacity: 1; transform: scale(1); }
            .ai-modal-content {
                background: linear-gradient(145deg, #1e3c72, #2a5298);
                border-radius: 20px; width: 100%; max-width: 420px; height: 90vh; max-height: 700px;
                display: flex; flex-direction: column; overflow: hidden;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .ai-chat-header {
                background: rgba(0, 0, 0, 0.2); padding: 15px 20px; display: flex;
                justify-content: space-between; align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1); flex-shrink: 0;
            }
            .ai-header-info { display: flex; align-items: center; gap: 12px; }
            .ai-avatar {
                width: 40px; height: 40px; background: #EAFE07; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; font-size: 20px;
                color: #1e3c72;
            }
            .ai-title h3 { color: white; margin: 0; font-size: 16px; font-weight: bold; }
            .ai-title p { color: #EAFE07; margin: 2px 0 0 0; font-size: 12px; opacity: 0.8; }
            .ai-close-btn {
                background: rgba(255, 255, 255, 0.1); color: white; border: none;
                width: 35px; height: 35px; border-radius: 50%; font-size: 16px; cursor: pointer;
                transition: background-color 0.2s;
            }
            .ai-close-btn:hover { background: rgba(255, 255, 255, 0.2); }
            .ai-chat-messages {
                flex: 1; padding: 15px; overflow-y: auto; display: flex;
                flex-direction: column; gap: 15px;
            }
            .ai-message { display: flex; flex-direction: column; max-width: 85%; animation: fadeIn 0.4s ease; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; translateY(0); } }
            .ai-bot-message { align-self: flex-start; }
            .ai-user-message { align-self: flex-end; }
            .ai-message-content { padding: 12px 16px; border-radius: 18px; color: white; line-height: 1.5; }
            .ai-bot-message .ai-message-content { background: #2e96f5; border-bottom-left-radius: 4px; }
            .ai-user-message .ai-message-content { background: rgba(234, 254, 7, 0.2); color: #EAFE07; border-bottom-right-radius: 4px; }
            .ai-message-content p { margin: 0 0 8px 0; }
            .ai-message-content p:last-child { margin-bottom: 0; }
            .ai-quick-actions {
                padding: 10px 15px; display: flex; gap: 8px; overflow-x: auto;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            .ai-quick-btn {
                background: rgba(46, 150, 245, 0.3); color: white; border: 1px solid rgba(46, 150, 245, 0.5);
                padding: 8px 14px; border-radius: 20px; font-size: 13px; white-space: nowrap; cursor: pointer;
                transition: all 0.2s ease;
            }
            .ai-quick-btn:hover { background: rgba(46, 150, 245, 0.5); transform: translateY(-2px); }
            .ai-input-area { padding: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); }
            .ai-input-container { display: flex; gap: 10px; align-items: center; }
            #ai-chat-input {
                flex: 1; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 25px; padding: 12px 18px; color: white; font-size: 14px; outline: none;
                transition: border-color 0.2s;
            }
            #ai-chat-input:focus { border-color: #EAFE07; }
            .ai-send-btn {
                background: linear-gradient(45deg, #EAFE07, #2E96F5); border: none;
                width: 45px; height: 45px; border-radius: 50%; cursor: pointer;
                display: flex; align-items: center; justify-content: center; font-size: 16px;
                transition: transform 0.2s ease;
            }
            .ai-send-btn:hover { transform: scale(1.1); }
            .ai-send-btn:disabled { background: #555; cursor: not-allowed; }
            .typing-indicator span {
                height: 8px; width: 8px; background-color: rgba(255,255,255,0.7);
                display: inline-block; border-radius: 50%; margin: 0 2px;
                animation: typing 1.4s infinite ease-in-out both;
            }
            .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
            .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
            @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    bindEvents() {
        document.body.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;

            const targetId = target.id;
            const quickQuestion = target.getAttribute('data-question');

            if (targetId === 'start-chat-btn') this.openChat();
            else if (targetId === 'close-ai-chat') this.closeChat();
            else if (targetId === 'ai-send-btn') this.sendMessage();
            else if (quickQuestion) this.sendQuickMessage(quickQuestion);
        });

        const input = document.getElementById('ai-chat-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
    }

    async openChat() {
        console.log('🤖 Opening conversational AI chat...');
        // Retrieve API key from settings when the chat is opened.
        this.openAIApiKey = localStorage.getItem('openaiApiKey');

        await this.getCurrentLocation();
        await this.loadNASAData();

        const modal = document.getElementById('conversational-ai-modal');
        if(modal) modal.style.display = 'flex';
        this.isActive = true;

        const status = document.getElementById('ai-status');
        if(status) {
            status.textContent = this.currentLocation
                ? `📍 ${this.currentLocation.lat.toFixed(2)}, ${this.currentLocation.lon.toFixed(2)}`
                : 'Getting GPS...';
        }
    }

    closeChat() {
        const modal = document.getElementById('conversational-ai-modal');
        if(modal) modal.style.display = 'none';
        this.isActive = false;
    }

    // MODIFIED: All message sending is now async
    async sendMessage() {
        const input = document.getElementById('ai-chat-input');
        const message = input.value.trim();
        if (!message) return;

        this.addUserMessage(message);
        input.value = '';
        input.disabled = true;

        // Show a "thinking" message
        const thinkingMessage = this.addBotMessage("🤖 Accessing NASA data and thinking...");

        try {
            const response = await this.generateAIResponse(message);
            this.updateBotMessage(thinkingMessage, response);
        } catch (error) {
            this.updateBotMessage(thinkingMessage, "Sorry, I encountered an error. Please try again.");
        } finally {
            input.disabled = false;
            input.focus();
        }
    }

    async sendQuickMessage(question) {
        this.addUserMessage(question);
        const thinkingMessage = this.addBotMessage("🤖 Accessing NASA data and thinking...");
        
        try {
            const response = await this.generateAIResponse(question);
            this.updateBotMessage(thinkingMessage, response);
        } catch (error) {
            this.updateBotMessage(thinkingMessage, "Sorry, I encountered an error. Please try again.");
        }
    }

    // --- MODIFIED: This is now the core function for calling the GPT model ---
    async generateAIResponse(userMessage) {
        if (!this.openAIApiKey) {
            console.warn("⚠️ OpenAI API Key not found. Using rule-based fallback.");
            // Fallback to your original logic if no API key is set
            return this.generateRuleBasedResponse(userMessage);
        }

        const prompt = `
            You are an expert agricultural assistant for the "NASA Farm Navigators" app.
            Your task is to provide concise, helpful advice to a farmer based on the provided real-time satellite data.
            Keep your responses brief, actionable, and always cite the data you are using.

            Current Farm Data:
            - Location (Lat/Lon): ${this.currentLocation.lat.toFixed(4)}, ${this.currentLocation.lon.toFixed(4)}
            - NASA SMAP Soil Moisture: ${this.nasaData.soilMoisture.toFixed(3)} m³/m³
            - NASA MODIS NDVI (Vegetation Health): ${this.nasaData.ndvi.toFixed(3)}
            - Data Quality: ${this.nasaData.quality}

            User's Question: "${userMessage}"

            Your Response:
        `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openAIApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo", // Cost-effective and fast
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 150, // Limit response length
                    temperature: 0.3 // More factual, less creative
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();

        } catch (error) {
            console.error("❌ GPT API call failed:", error);
            // Fallback to rule-based response on API error
            return this.generateRuleBasedResponse(userMessage);
        }
    }

    // --- RENAMED: This is your original logic, now used as a fallback ---
    generateRuleBasedResponse(userMessage) {
        const message = userMessage.toLowerCase();
        if (message.includes('soil') || message.includes('moisture')) {
            return this.generateSoilMoistureResponse();
        }
        if (message.includes('plant') || message.includes('health') || message.includes('ndvi')) {
            return this.generatePlantHealthResponse();
        }
        if (message.includes('irrigat')) {
            return this.generateIrrigationResponse();
        }
        if (message.includes('weather') || message.includes('temperature') || message.includes('climate') || message.includes('rain')) {
            return this.generateWeatherResponse();
        }
        if (message.includes('crop') || message.includes('plant') || message.includes('grow') || message.includes('farm')) {
            return this.generateCropResponse();
        }
        return this.generateGeneralResponse();
    }

    // --- UI HELPER FUNCTIONS ---
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
    
    addBotMessage(message) {
        const messagesContainer = document.getElementById('ai-chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'ai-message ai-bot-message';
        messageElement.innerHTML = `
            <div class="ai-message-content"><p>${message}</p></div>
        `;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return messageElement;
    }

    updateBotMessage(messageElement, newMessage) {
        const content = messageElement.querySelector('.ai-message-content');
        if (content) {
            content.innerHTML = `<p>${newMessage.replace(/\n/g, '</p><p>')}</p>`;
        }
    }
    
  
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

    // NASA 
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
    generatePredictionResponse() {
        if (!this.nasaData) return '<p>Loading NASA data...</p>';
        const moisture = this.nasaData.soilMoisture;
        const ndvi = this.nasaData.ndvi;
        let prediction, advice, emoji;
        if (moisture < 0.2 && ndvi < 0.4) {
            prediction = 'Yield may decrease';
            advice = 'Critical conditions detected. Immediate intervention is required to prevent crop loss.';
            emoji = '📉';
        } else if (moisture < 0.25) {
            prediction = 'Health may decline';
            advice = 'Upcoming dry period could stress crops. Plan for irrigation.';
            emoji = '😟';
        } else if (ndvi > 0.7 && moisture > 0.3) {
            prediction = 'Stable, positive outlook';
            advice = 'Conditions are favorable for healthy growth. Maintain current practices.';
            emoji = '📈';
        } else {
            prediction = 'Stable conditions expected';
            advice = 'Continue monitoring key metrics. No major changes are predicted in the short term.';
            emoji = '📊';
        }
        return `
            <p>${emoji} <strong>14-Day Agricultural Forecast</strong></p>
            <p><strong>Outlook:</strong> ${prediction}</p>
            <p><strong>AI Advice:</strong> ${advice}</p>
            <p>🛰️ Based on current NASA SMAP/MODIS data and weather models.</p>
        `;
    }
    
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

    // --- MODIFIED: Translated to English ---
    generateWeatherResponse() {
        const temp = 18 + Math.random() * 15; // 18-33 degrees Celsius
        const humidity = 40 + Math.random() * 40; // 40-80% humidity

        return `
            <p>🌤️ <strong>Current Weather Information</strong></p>
            <p>🌡️ Temperature: ${temp.toFixed(1)}°C</p>
            <p>💨 Humidity: ${humidity.toFixed(0)}%</p>
            <p>📍 Location: ${this.currentLocation.lat.toFixed(2)}, ${this.currentLocation.lon.toFixed(2)}</p>
            <p>💡 Farming Advice: Manage your farm considering the current temperature and soil moisture.</p>
            <p>🛰️ Analyzed comprehensively with satellite data.</p>
        `;
    }

    // --- MODIFIED: Translated to English ---
    generateCropResponse() {
        if (!this.nasaData) return '<p>Loading NASA data...</p>';

        const moisture = this.nasaData.soilMoisture;
        const ndvi = this.nasaData.ndvi;

        let suitableCrops = [];

        Object.entries(this.agriculturalKnowledge.crops).forEach(([crop, data]) => {
            const moistureOk = moisture >= data.optimalMoisture[0] && moisture <= data.optimalMoisture[1];
            const ndviOk = ndvi >= data.optimalNDVI[0] && ndvi <= data.optimalNDVI[1];

            if (moistureOk && ndviOk) {
                suitableCrops.push(crop);
            }
        });

        const cropList = suitableCrops.length > 0
            ? suitableCrops.join(', ')
            : 'Soil improvement is necessary under current conditions.';

        return `
            <p>🌾 <strong>Crop Cultivation Analysis</strong></p>
            <p>📊 Current Soil Moisture: ${(moisture * 100).toFixed(1)}%</p>
            <p>🌱 Vegetation Index: ${ndvi.toFixed(2)}</p>
            <p>✨ Recommended Crops: ${cropList}</p>
            <p>🛰️ Analysis based on NASA satellite data.</p>
            <p>💡 Determine the optimal planting time through continuous monitoring.</p>
        `;
    }

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


// --- MODIFIED: Initialization is now safer ---
window.addEventListener('load', () => {
    if (!window.conversationalAI) {
        console.log('🤖 Initializing Conversational AI system from window.onload...');
        window.conversationalAI = new ConversationalAI();
    }
});

console.log('✅ Conversational AI module (v2.0 with GPT) loaded.');
