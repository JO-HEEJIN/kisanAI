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
            this.arSupported = await this.checkARSupport();

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
        if (!navigator.xr) {
            console.warn('WebXR not supported on this device');
            return false;
        }

        try {
            const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
            console.log('AR Session Support:', isSupported);
            return isSupported;
        } catch (error) {
            console.warn('AR support check failed:', error);
            return false;
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

        // Initialize WebXR Framework
        if (typeof WebXRFramework !== 'undefined') {
            this.webXRFramework = new WebXRFramework();
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
        if (!this.arSupported) {
            throw new Error('AR not supported on this device');
        }

        try {
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'dom-overlay'],
                optionalFeatures: ['camera-access', 'plane-detection'],
                domOverlay: { root: document.getElementById('ar-overlay') }
            });

            await this.webXRFramework.startSession(this.xrSession);

            document.dispatchEvent(new CustomEvent('ar-session-start'));

        } catch (error) {
            console.error('Failed to start AR session:', error);
            throw error;
        }
    }

    async endARSession() {
        if (this.xrSession) {
            await this.xrSession.end();
            this.xrSession = null;
            document.dispatchEvent(new CustomEvent('ar-session-end'));
        }
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

    // Public API
    isReady() {
        return this.isInitialized;
    }

    getSupportedFeatures() {
        return {
            ar: this.arSupported,
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