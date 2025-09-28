class ARChatGPTCore {
    constructor() {
        this.isInitialized = false;
        this.xrSession = null;
        this.arSupported = false;
        this.conversationalAI = null;
        this.plantIdentificationAI = null;
        this.webXRFramework = null;
        this.currentMode = 'chat'; // 'chat', 'field-scan', 'ar-overlay'
        this.callbacks = {};

        this.initializeCore();
    }

    async initializeCore() {
        try {
            console.log('Initializing AR ChatGPT Core...');

            // Check WebXR support
            this.arSupportInfo = await this.checkARSupport();
            this.arSupported = this.arSupportInfo.supported;

            // Initialize components
            await this.initializeComponents();

            // Set up event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('AR ChatGPT Core initialized successfully');

            // Trigger initialization callback
            if (this.callbacks.onInitialized) {
                this.callbacks.onInitialized(this);
            }

        } catch (error) {
            console.error('Failed to initialize AR ChatGPT Core:', error);
        }
    }

    async checkARSupport() {
        // Check if we're in a secure context (HTTPS required for WebXR)
        if (!window.isSecureContext) {
            console.warn('WebXR requires HTTPS');
            return { supported: false, reason: 'HTTPS required', fallback: true };
        }

        // Check Babylon.js WebXR support
        if (this.webXRFramework && this.webXRFramework.isInitialized) {
            const babylonSupport = this.webXRFramework.getXRSupport();
            if (babylonSupport.webxr) {
                console.log('Babylon.js WebXR support detected');
                return { supported: true, reason: 'Babylon.js WebXR support', mode: 'babylon-xr' };
            }
        }

        // Fallback to native WebXR check
        if (!navigator.xr) {
            console.warn('WebXR not supported on this device');
            return { supported: false, reason: 'WebXR not available', fallback: true };
        }

        try {
            // Try with minimal requirements first
            const basicSupported = await navigator.xr.isSessionSupported('immersive-ar');
            console.log('Basic AR Session Support:', basicSupported);

            if (basicSupported) {
                return { supported: true, reason: 'Native WebXR support', mode: 'immersive-ar' };
            } else {
                // Check for inline AR as fallback
                try {
                    const inlineSupported = await navigator.xr.isSessionSupported('inline');
                    if (inlineSupported) {
                        return { supported: true, reason: 'Inline AR support', mode: 'inline', fallback: true };
                    }
                } catch (inlineError) {
                    console.warn('Inline AR check failed:', inlineError);
                }
            }

            return { supported: false, reason: 'No AR session types supported', fallback: true };
        } catch (error) {
            console.warn('AR support check failed:', error);
            return { supported: false, reason: `Check failed: ${error.message}`, fallback: true };
        }
    }

    async initializeComponents() {
        // Initialize Conversational AI
        if (typeof ConversationalAI !== 'undefined') {
            this.conversationalAI = new ConversationalAI();
            await this.conversationalAI.initialize();
        }

        // Initialize Plant Identification AI
        if (typeof PlantIdentificationAI !== 'undefined') {
            this.plantIdentificationAI = new PlantIdentificationAI();
            await this.plantIdentificationAI.initialize();
        }

        // Initialize Babylon.js WebXR Framework
        if (typeof BabylonXRFramework !== 'undefined') {
            this.webXRFramework = new BabylonXRFramework();
            await this.webXRFramework.initialize();
        }
    }

    setupEventListeners() {
        // Listen for AR session events
        document.addEventListener('ar-session-start', this.onARSessionStart.bind(this));
        document.addEventListener('ar-session-end', this.onARSessionEnd.bind(this));

        // Listen for voice commands
        document.addEventListener('voice-command', this.onVoiceCommand.bind(this));

        // Listen for plant identification results
        document.addEventListener('plant-identified', this.onPlantIdentified.bind(this));
    }

    // AR Session Management
    async startARSession() {
        // Re-check AR support with current status
        const supportInfo = await this.checkARSupport();

        if (!supportInfo.supported) {
            return this.startFallbackMode(supportInfo.reason);
        }

        try {
            let sessionOptions;
            const sessionMode = supportInfo.mode || 'immersive-ar';

            if (sessionMode === 'immersive-ar') {
                // Try with reduced requirements for better compatibility
                sessionOptions = {
                    optionalFeatures: ['hit-test', 'dom-overlay', 'camera-access', 'plane-detection'],
                    domOverlay: { root: document.getElementById('ar-overlay') }
                };
            } else {
                // Inline mode with minimal requirements
                sessionOptions = {
                    optionalFeatures: ['camera-access']
                };
            }

            console.log(`Starting AR session with Babylon.js WebXR...`);

            if (this.webXRFramework) {
                const xrStarted = await this.webXRFramework.startXRSession();
                if (!xrStarted) {
                    return this.startFallbackMode('Babylon.js XR session failed');
                }
                this.xrSession = this.webXRFramework.xrExperience;
            }

            document.dispatchEvent(new CustomEvent('ar-session-start', {
                detail: { mode: sessionMode, fallback: supportInfo.fallback }
            }));

            return { success: true, mode: sessionMode };

        } catch (error) {
            console.error('Failed to start AR session:', error);

            // Try fallback mode if AR session failed
            if (error.name === 'NotSupportedError' || error.name === 'SecurityError') {
                return this.startFallbackMode('WebXR session failed - ' + error.message);
            }

            throw error;
        }
    }

    async startFallbackMode(reason) {
        console.log('Starting AR fallback mode:', reason);

        // Show fallback UI instead of AR
        this.showARFallbackInterface(reason);

        document.dispatchEvent(new CustomEvent('ar-fallback-start', {
            detail: { reason }
        }));

        return { success: true, mode: 'fallback', reason };
    }

    showARFallbackInterface(reason) {
        const arOverlay = document.getElementById('ar-overlay');
        if (arOverlay) {
            arOverlay.style.display = 'block';
            arOverlay.innerHTML = `
                <div class="ar-fallback-container">
                    <div class="ar-fallback-header">
                        <h3>🌱 Agricultural AI Assistant</h3>
                        <p>AR Mode: ${reason}</p>
                    </div>
                    <div class="ar-fallback-content">
                        <div class="feature-grid">
                            <div class="feature-card" onclick="window.arChatGPTCore.identifyPlant()">
                                <span class="feature-icon">🔍</span>
                                <h4>Plant Recognition</h4>
                                <p>Upload photo to identify plants</p>
                            </div>
                            <div class="feature-card" onclick="window.arChatGPTCore.startChat()">
                                <span class="feature-icon">💬</span>
                                <h4>AI Chat</h4>
                                <p>Ask agricultural questions</p>
                            </div>
                            <div class="feature-card" onclick="window.arChatGPTCore.testVoice()">
                                <span class="feature-icon">🎤</span>
                                <h4>Voice Commands</h4>
                                <p>Test voice recognition</p>
                            </div>
                            <div class="feature-card" onclick="window.arChatGPTCore.showNASAData()">
                                <span class="feature-icon">🛰️</span>
                                <h4>NASA Data</h4>
                                <p>View satellite information</p>
                            </div>
                        </div>
                    </div>
                    <button class="ar-close-btn" onclick="window.arChatGPTCore.closeARInterface()">
                        Close
                    </button>
                </div>
            `;
        }
    }

    async endARSession() {
        if (this.webXRFramework && this.webXRFramework.isXRActive()) {
            await this.webXRFramework.endXRSession();
        }
        this.xrSession = null;
        document.dispatchEvent(new CustomEvent('ar-session-end'));
    }

    // Chat Interface Methods
    async sendMessage(message, context = {}) {
        console.log('ARChatGPTCore: sendMessage called with:', message, context);

        if (!this.conversationalAI) {
            console.error('ARChatGPTCore: Conversational AI not initialized');
            throw new Error('Conversational AI not initialized');
        }

        console.log('ARChatGPTCore: Getting NASA context...');
        const nasaData = await this.getNASAContext();
        console.log('ARChatGPTCore: NASA data received:', nasaData);

        const enrichedContext = {
            ...context,
            mode: this.currentMode,
            arSupported: this.arSupported,
            sessionActive: !!this.xrSession,
            nasaData: nasaData
        };

        console.log('ARChatGPTCore: Calling conversationalAI.processMessage with enriched context:', enrichedContext);

        const result = await this.conversationalAI.processMessage(message, enrichedContext);
        console.log('ARChatGPTCore: Got result from processMessage:', result);

        return result;
    }

    async getNASAContext() {
        // Get current NASA satellite data context directly
        try {
            // Use the same method as ConversationalAI
            if (this.conversationalAI) {
                return await this.conversationalAI.getCurrentNASAData();
            }

            // Fallback: fetch directly from NASA proxy
            let lat = 33.43, lon = -111.94; // Default Phoenix location
            let locationSource = 'default (Phoenix, AZ)';

            if (navigator.geolocation) {
                try {
                    console.log('🌍 ARChatGPTCore: Requesting user location...');
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 60000
                        });
                    });
                    lat = position.coords.latitude;
                    lon = position.coords.longitude;
                    locationSource = 'GPS';
                    console.log(`📍 ARChatGPTCore: Got location: ${lat.toFixed(4)}, ${lon.toFixed(4)} (${locationSource})`);
                } catch (geoError) {
                    console.warn('📍 ARChatGPTCore: Geolocation failed:', geoError.message);
                }
            }

            // Fetch NASA data directly from proxy server
            const response = await fetch(`http://localhost:3001/api/smap/soil-moisture?lat=${lat}&lon=${lon}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const smapData = await response.json();

            return {
                soilMoisture: smapData.soil_moisture ? smapData.soil_moisture * 100 : 30,
                ndvi: 0.65,
                temperature: 25,
                precipitation: 15,
                location: { lat, lon, source: locationSource },
                source: smapData.source || 'NASA Proxy',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.warn('Failed to get NASA context:', error);

            // Return fallback data
            return {
                soilMoisture: 35,
                ndvi: 0.68,
                temperature: 24,
                precipitation: 12,
                location: { lat: 33.43, lon: -111.94, source: 'default (Phoenix, AZ)' },
                source: 'Fallback data',
                timestamp: new Date().toISOString()
            };
        }
    }

    // Plant Identification
    async identifyPlant(imageData) {
        if (!this.plantIdentificationAI) {
            throw new Error('Plant Identification AI not initialized');
        }

        return await this.plantIdentificationAI.identify(imageData);
    }

    async scanField() {
        if (!this.xrSession) {
            throw new Error('AR session not active');
        }

        // Switch to field scanning mode
        this.currentMode = 'field-scan';

        // Enable camera and start scanning
        return await this.webXRFramework.startFieldScan();
    }

    // Mode Management
    setMode(mode) {
        const validModes = ['chat', 'field-scan', 'ar-overlay'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}`);
        }

        this.currentMode = mode;
        document.dispatchEvent(new CustomEvent('ar-mode-change', { detail: mode }));
    }

    // Event Handlers
    onARSessionStart() {
        console.log('AR session started');
        document.body.classList.add('ar-active');
    }

    onARSessionEnd() {
        console.log('AR session ended');
        document.body.classList.remove('ar-active');
        this.currentMode = 'chat';
    }

    onVoiceCommand(event) {
        const command = event.detail;
        console.log('Voice command received:', command);

        // Process voice command through conversational AI
        this.sendMessage(command.text, { type: 'voice', confidence: command.confidence });
    }

    onPlantIdentified(event) {
        const plantData = event.detail;
        console.log('Plant identified:', plantData);

        // Send plant data to conversational AI for agricultural insights
        const message = `I identified a ${plantData.species} in the field. Can you provide agricultural insights?`;
        this.sendMessage(message, { type: 'plant-identification', plantData });
    }

    // Callback Management
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    off(event) {
        delete this.callbacks[event];
    }

    // AR Mode Management
    exitARMode() {
        console.log('AR mode exited');
        this.currentMode = 'normal';

        // Dispatch exit event
        document.dispatchEvent(new CustomEvent('ar-session-end', {
            detail: { mode: this.currentMode }
        }));

        return { status: 'exited', mode: this.currentMode };
    }

    // Fallback Methods for Non-AR Devices
    async identifyPlant() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file && this.plantIdentificationAI) {
                try {
                    const result = await this.plantIdentificationAI.identifyFromFile(file);
                    this.showPlantResult(result);
                } catch (error) {
                    console.error('Plant identification failed:', error);
                    this.showMessage('Plant identification failed. Please try again.');
                }
            }
        };

        input.click();
    }

    async startChat() {
        if (this.conversationalAI) {
            const message = prompt("Ask a question about farming or NASA data:");
            if (message) {
                try {
                    const response = await this.conversationalAI.sendMessage(message);
                    this.showMessage(`AI: ${response.text}`);
                } catch (error) {
                    console.error('Chat failed:', error);
                    this.showMessage('Chat is temporarily unavailable.');
                }
            }
        }
    }

    async testVoice() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.onresult = (event) => {
                const command = event.results[0][0].transcript;
                this.showMessage(`Voice command received: "${command}"`);
            };

            recognition.onerror = () => {
                this.showMessage('Voice recognition failed. Please check microphone permissions.');
            };

            recognition.start();
            this.showMessage('Listening... Please speak now.');
        } else {
            this.showMessage('Voice recognition not supported on this device.');
        }
    }

    async showNASAData() {
        try {
            const response = await fetch('/api/nasa-proxy.js?lat=33.43&lon=-111.94');
            const data = await response.json();
            this.showMessage(`NASA Data: Temperature: ${data.temperature}°C, Humidity: ${data.humidity}%`);
        } catch (error) {
            console.error('NASA data fetch failed:', error);
            this.showMessage('NASA data temporarily unavailable.');
        }
    }

    showPlantResult(result) {
        const overlay = document.getElementById('ar-overlay');
        if (overlay) {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'plant-result';
            resultDiv.innerHTML = `
                <div class="plant-result-card">
                    <h4>🌱 Plant Identified</h4>
                    <p><strong>Species:</strong> ${result.species || 'Unknown'}</p>
                    <p><strong>Confidence:</strong> ${Math.round((result.confidence || 0) * 100)}%</p>
                    <p><strong>Health:</strong> ${result.health || 'Good'}</p>
                    <button onclick="this.parentElement.parentElement.remove()">Close</button>
                </div>
            `;
            overlay.appendChild(resultDiv);

            setTimeout(() => {
                if (resultDiv.parentElement) {
                    resultDiv.remove();
                }
            }, 5000);
        }
    }

    showMessage(message) {
        const overlay = document.getElementById('ar-overlay');
        if (overlay) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'ar-message';
            messageDiv.innerHTML = `
                <div class="message-card">
                    <p>${message}</p>
                    <button onclick="this.parentElement.parentElement.remove()">Close</button>
                </div>
            `;
            overlay.appendChild(messageDiv);

            setTimeout(() => {
                if (messageDiv.parentElement) {
                    messageDiv.remove();
                }
            }, 3000);
        } else {
            alert(message);
        }
    }

    closeARInterface() {
        const overlay = document.getElementById('ar-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }
    }

    // Public API
    isReady() {
        return this.isInitialized;
    }

    getSupportedFeatures() {
        return {
            ar: this.arSupported,
            arInfo: this.arSupportInfo,
            chat: !!this.conversationalAI,
            plantID: !!this.plantIdentificationAI,
            webXR: !!this.webXRFramework
        };
    }
}

// Global instance
window.arChatGPTCore = new ARChatGPTCore();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ARChatGPTCore;
}