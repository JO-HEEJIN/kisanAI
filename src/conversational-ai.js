// 🤖 Conversational AI for Agricultural Assistance v3.2
// This version is now exclusively powered by a GPT model, removing the rule-based fallback system
// for a more streamlined, AI-centric architecture.


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


       // Agricultural knowledge base is kept to provide rich context to the AI model
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
   }


   // --- 1. INITIALIZATION ---


   initializeInterface() {
       console.log('🤖 Initializing Conversational AI interface v3.2 (GPT-only)...');
       this.createChatInterface();
       this.addChatStyles();
       this.bindEvents();
   }


   createChatInterface() {
       if (document.getElementById('conversational-ai-modal')) return;
       const chatInterface = `
           <div id="conversational-ai-modal" class="ai-modal">
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
           /* ... [All existing CSS styles remain here] ... */
           .ai-modal {
               position: fixed; top: 0; left: 0; width: 100%; height: 100%;
               background: rgba(10, 25, 47, 0.9); backdrop-filter: blur(8px);
               z-index: 10000; display: none; align-items: center; justify-content: center;
               padding: 10px; opacity: 0; transform: scale(0.95); transition: opacity 0.3s ease, transform 0.3s ease;
           }
           .ai-modal.visible { display: flex; opacity: 1; transform: scale(1); }
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
           .ai-message-content { padding: 12px 16px; border-radius: 18px; color: white; line-height: 1.5; word-wrap: break-word; }
           .ai-bot-message .ai-message-content { background: #2e96f5; border-bottom-left-radius: 4px; }
           .ai-user-message .ai-message-content { background: rgba(234, 254, 7, 0.2); color: #EAFE07; border-bottom-right-radius: 4px; }
           .ai-message-content p { margin: 0 0 8px 0; }
           .ai-message-content p:last-child { margin-bottom: 0; }
           .ai-quick-actions {
               padding: 10px 15px; display: flex; gap: 8px; overflow-x: auto;
               border-top: 1px solid rgba(255, 255, 255, 0.1);
           }
           .ai-quick-actions::-webkit-scrollbar { height: 4px; }
           .ai-quick-actions::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
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
               transition: transform 0.2s ease; flex-shrink: 0;
           }
           .ai-send-btn:hover { transform: scale(1.1); }
           .ai-send-btn:disabled { background: #555; cursor: not-allowed; transform: scale(1); }
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
       console.log('🔗 Binding conversational AI events v3.2 (Global Delegation)...');
      
       document.body.addEventListener('click', (event) => {
           const targetButton = event.target.closest('button');
           if (!targetButton) return;


           const targetId = targetButton.id;
           const quickQuestion = targetButton.getAttribute('data-question');


           if (targetId === 'start-chat-btn') this.openChat();
           else if (targetId === 'close-ai-chat') this.closeChat();
           else if (targetId === 'ai-send-btn') this.sendMessage();
           else if (quickQuestion) this.sendQuickMessage(quickQuestion);
       });


       const input = document.getElementById('ai-chat-input');
       if (input) {
           input.addEventListener('keypress', (e) => {
               if (e.key === 'Enter' && !input.disabled) this.sendMessage();
           });
       }
   }


   async openChat() {
       console.log('🤖 Opening conversational AI chat...');
       const modal = document.getElementById('conversational-ai-modal');
       if(!modal) return;
      
       modal.classList.add('visible');
       this.isActive = true;


       this.openAIApiKey = localStorage.getItem('openaiApiKey');
       this.updateStatus('Getting GPS location...');
       this.state = 'loading_gps';


       await this.getCurrentLocation();
       this.updateStatus(`📍 ${this.currentLocation.lat.toFixed(2)}, ${this.currentLocation.lon.toFixed(2)} | Fetching NASA Data...`);
       this.state = 'loading_nasa';


       await this.loadNASAData();
       this.updateStatus(`✅ NASA Data Ready for ${this.currentLocation.lat.toFixed(2)}, ${this.currentLocation.lon.toFixed(2)}`);
      
       const chatInput = document.getElementById('ai-chat-input');
       const sendBtn = document.getElementById('ai-send-btn');
       if(chatInput) chatInput.disabled = false;
       if(sendBtn) sendBtn.disabled = false;
      
       this.state = 'ready';
       this.addWelcomeMessage();
   }


   closeChat() {
       const modal = document.getElementById('conversational-ai-modal');
       if(modal) modal.classList.remove('visible');
       this.isActive = false;
   }


   async sendMessage() {
       const input = document.getElementById('ai-chat-input');
       const sendBtn = document.getElementById('ai-send-btn');
       const message = input.value.trim();
       if (!message || this.state === 'awaiting_response') return;


       this.addUserMessage(message);
       input.value = '';
       input.disabled = true;
       sendBtn.disabled = true;
       this.state = 'awaiting_response';


       const thinkingMessage = this.addBotMessage('<div class="typing-indicator"><span></span><span></span><span></span></div>');


       try {
           const response = await this.generateAIResponse(message);
           this.updateBotMessage(thinkingMessage, response);
       } catch (error) {
           this.updateBotMessage(thinkingMessage, "Sorry, I encountered an error. Please try again.");
       } finally {
           input.disabled = false;
           sendBtn.disabled = false;
           input.focus();
           this.state = 'ready';
       }
   }


   async sendQuickMessage(question) {
       if (this.state === 'awaiting_response') return;
       this.addUserMessage(question);
      
       const input = document.getElementById('ai-chat-input');
       const sendBtn = document.getElementById('ai-send-btn');
       if(input) input.disabled = true;
       if(sendBtn) sendBtn.disabled = true;
       this.state = 'awaiting_response';


       const thinkingMessage = this.addBotMessage('<div class="typing-indicator"><span></span><span></span><span></span></div>');
      
       try {
           const response = await this.generateAIResponse(question);
           this.updateBotMessage(thinkingMessage, response);
       } catch (error) {
           this.updateBotMessage(thinkingMessage, "Sorry, I encountered an error. Please try again.");
       } finally {
           if(input) input.disabled = false;
           if(sendBtn) sendBtn.disabled = false;
           if(input) input.focus();
           this.state = 'ready';
       }
   }


   /**
    * --- MODIFIED: Core logic now exclusively uses GPT-3.5 and has no fallback ---
    */
   async generateAIResponse(userMessage) {
       this.chatHistory.push({ role: "user", content: userMessage });
      
       if (!this.openAIApiKey) {
           console.error("❌ OpenAI API Key not found. Please add it to the settings.");
           return "My AI capabilities are offline. Please add an OpenAI API key in the application settings (⚙️) to enable advanced responses.";
       }


       const systemPrompt = `You are an expert agronomist for "NASA Farm Navigators". Provide concise, actionable advice based *only* on the real-time satellite data provided. If asked for a prediction or forecast, use the data to make a reasonable 14-day projection. Keep your responses brief, actionable, and always cite the data (e.g., "According to SMAP data..."). Keep responses under 100 words.`;


       const contextPrompt = `
           Current Farm Data:
           - Location (Lat/Lon): ${this.currentLocation.lat.toFixed(4)}, ${this.currentLocation.lon.toFixed(4)}
           - NASA SMAP Soil Moisture: ${this.nasaData.soilMoisture.toFixed(3)} m³/m³
           - NASA MODIS NDVI (Vegetation Health): ${this.nasaData.ndvi.toFixed(3)}
           - Data Quality: ${this.nasaData.quality}
       `;
      
       const recentHistory = this.chatHistory.slice(-2).map(msg => ({ role: msg.role, content: msg.content }));


       try {
           const response = await fetch('https://api.openai.com/v1/chat/completions', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${this.openAIApiKey}`
               },
               body: JSON.stringify({
                   model: "gpt-3.5-turbo",
                   messages: [
                       { role: "system", content: systemPrompt },
                       { role: "user", content: contextPrompt },
                       ...recentHistory
                   ],
                   max_tokens: 150,
                   temperature: 0.3
               })
           });


           if (!response.ok) {
               const errData = await response.json();
               console.error("API Error Response:", errData);
               throw new Error(`API request failed with status ${response.status}`);
           }


           const data = await response.json();
           const botResponse = data.choices[0].message.content.trim();
           this.chatHistory.push({ role: "assistant", content: botResponse });
           return botResponse;


       } catch (error) {
           console.error("❌ GPT API call failed:", error);
           return "I'm having trouble connecting to the AI service right now. Please check your API key and network connection, then try again.";
       }
   }


   // --- UI HELPER FUNCTIONS ---
   addUserMessage(message) {
       const messagesContainer = document.getElementById('ai-chat-messages');
       const messageElement = document.createElement('div');
       messageElement.className = 'ai-message ai-user-message';
       messageElement.innerHTML = `<div class="ai-message-content"><p>${message}</p></div>`;
       messagesContainer.appendChild(messageElement);
       messagesContainer.scrollTop = messagesContainer.scrollHeight;
   }
  
   addBotMessage(message) {
       const messagesContainer = document.getElementById('ai-chat-messages');
       const messageElement = document.createElement('div');
       messageElement.className = 'ai-message ai-bot-message';
       messageElement.innerHTML = `<div class="ai-message-content">${message}</div>`;
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
  
   addWelcomeMessage() {
       const container = document.getElementById('ai-chat-messages');
       container.innerHTML = '';
       const welcome = {
           role: 'assistant',
           content: `Hello! I'm your Farm AI Assistant, powered by NASA data. How can I help you today?`
       };
       this.chatHistory = [welcome];
       this.addBotMessage(welcome.content);
   }


   // --- Data and Location Functions ---
   async getCurrentLocation() {
       return new Promise((resolve) => {
           if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(
                   (position) => {
                       this.currentLocation = {
                           lat: position.coords.latitude,
                           lon: position.coords.longitude,
                       };
                       console.log('📍 Location obtained:', this.currentLocation);
                       resolve();
                   },
                   (error) => {
                       console.warn('⚠️ GPS Error:', error);
                       this.currentLocation = { lat: 34.0522, lon: -118.2437 }; // Fallback to Los Angeles
                       resolve();
                   }
               );
           } else {
               this.currentLocation = { lat: 34.0522, lon: -118.2437 };
               resolve();
           }
       });
   }


   async loadNASAData() {
       const now = Date.now();
       if (this.cache.nasaData && (now - this.cache.timestamp) < this.cache.ttl) {
           console.log('🛰️ Using cached NASA data.');
           this.nasaData = this.cache.nasaData;
           return;
       }
       if (!this.currentLocation) return;
       try {
           console.log('🛰️ Fetching fresh NASA data...');
           const [smapData, modisData] = await Promise.all([
               fetch(`${window.getNASAApiEndpoint()}/smap/soil-moisture?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`).then(r => r.json()),
               fetch(`${window.getNASAApiEndpoint()}/modis/ndvi?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lon}`).then(r => r.json())
           ]);
           this.nasaData = {
               soilMoisture: smapData.soilMoisture || 0.3,
               ndvi: modisData.ndvi || 0.65,
               quality: smapData.quality || 'real',
               source: smapData.source || 'NASA Data'
           };
           this.cache.nasaData = this.nasaData;
           this.cache.timestamp = now;
       } catch (error) {
           console.warn('⚠️ NASA data load failed:', error);
           this.nasaData = { soilMoisture: 0.3, ndvi: 0.65, quality: 'fallback', source: 'Fallback Data' };
       }
   }


   updateStatus(text) {
       const statusEl = document.getElementById('ai-status');
       if (statusEl) statusEl.textContent = text;
   }
}


// Global initialization using window.onload for safety
window.addEventListener('load', () => {
   if (!window.conversationalAI) {
       console.log('🤖 Initializing Conversational AI system from window.onload...');
       window.conversationalAI = new ConversationalAI();
       window.conversationalAI.initializeInterface();
   }
});


console.log('✅ Conversational AI module (v3.2 GPT-only) loaded.');





