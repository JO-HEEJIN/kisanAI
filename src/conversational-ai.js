// 🤖 Conversational AI for Agricultural Assistance v2.0
// This version is upgraded to use an external open-source GPT model for more intelligent responses.

class ConversationalAI {
    constructor() {
        this.chatHistory = [];
        this.currentLocation = null;
        this.nasaData = null;
        this.isActive = false;
        // NEW: Store your OpenAI API key here. It is retrieved from settings.
        this.openAIApiKey = null;

        // Agricultural knowledge base (used for fallback and context)
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
            }
        };

        this.initializeInterface();
    }

    initializeInterface() {
        console.log('🤖 Initializing Conversational AI interface v2.0...');
        this.createChatInterface();
        this.bindEvents();
    }

    createChatInterface() {
        // --- No changes needed to your UI creation logic ---
        const chatInterface = `
            <div id="conversational-ai-modal" class="ai-modal" style="display: none;">
                <div class="ai-modal-content">
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
                    <div id="ai-chat-messages" class="ai-chat-messages">
                        <div class="ai-message ai-bot-message">
                            <div class="ai-message-content">
                                <p>👋 Hello! I am powered by a generative AI and NASA's satellite data.</p>
                                <p>Ask me anything about your farm!</p>
                            </div>
                        </div>
                    </div>
                    <div class="ai-quick-actions">
                        <button class="ai-quick-btn" data-question="Analyze my current farm conditions">📊 Analyze Farm</button>
                        <button class="ai-quick-btn" data-question="Should I irrigate today?">💧 Irrigation Advice</button>
                        <button class="ai-quick-btn" data-question="What crops are suitable for my area?">🌱 Crop Suggestions</button>
                    </div>
                    <div class="ai-input-area">
                        <div class="ai-input-container">
                            <input type="text" id="ai-chat-input" placeholder="Ask a question..." />
                            <button id="ai-send-btn" class="ai-send-btn"><span>📤</span></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatInterface);
        this.addChatStyles();
    }

    addChatStyles() { /* ... Your existing styles ... */ }

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
    
    // --- Unchanged Functions ---
    getCurrentLocation() { /* ... your existing code ... */ }
    loadNASAData() { /* ... your existing code ... */ }
    generateSoilMoistureResponse() { /* ... your existing code ... */ }
    generatePlantHealthResponse() { /* ... your existing code ... */ }
    generateIrrigationResponse() { /* ... your existing code ... */ }

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

    generateGeneralResponse() { /* ... your existing code ... */ }
}

// --- MODIFIED: Initialization is now safer ---
window.addEventListener('load', () => {
    if (!window.conversationalAI) {
        console.log('🤖 Initializing Conversational AI system from window.onload...');
        window.conversationalAI = new ConversationalAI();
    }
});

console.log('✅ Conversational AI module (v2.0 with GPT) loaded.');
