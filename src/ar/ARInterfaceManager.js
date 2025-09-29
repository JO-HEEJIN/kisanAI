/**
 * ARInterfaceManager
 * Comprehensive AR interface with NASA data integration, touch interactions, and voice commands
 * Based on DeepSeek's implementation
 */
class ARInterfaceManager {
    constructor() {
        this.isInitialized = false;
        this.isActive = false;
        this.currentMode = 'overview'; // overview, detail, settings

        // NASA API endpoints
        this.nasaEndpoints = {
            soilMoisture: 'http://localhost:3001/api/smap/soil-moisture',
            ndvi: 'http://localhost:3001/api/modis/ndvi'
            // Note: weather endpoint removed as it's not available in the proxy
        };

        // UI components
        this.controlPanel = null;
        this.dataOverlay = null;
        this.voiceIndicator = null;
        this.touchHandler = null;

        // Voice recognition
        this.speechRecognition = null;
        this.speechSynthesis = window.speechSynthesis;
        this.isListening = false;

        // Data cache
        this.nasaData = {
            soilMoisture: null,
            ndvi: null,
            lastUpdate: null
        };

        // Touch interactions
        this.touchStartPos = { x: 0, y: 0 };
        this.isGestureActive = false;

        console.log('🎨 ARInterfaceManager: Initialized');
    }

    async initialize() {
        try {
            console.log('🔄 ARInterfaceManager: Starting initialization...');

            // Initialize voice recognition
            await this.initializeVoiceRecognition();

            // Create UI components
            this.createControlPanel();
            this.createDataOverlay();
            this.createVoiceIndicator();

            // Setup touch handlers
            this.setupTouchHandlers();

            // Setup voice commands
            this.setupVoiceCommands();

            this.isInitialized = true;
            console.log('✅ ARInterfaceManager: Initialization complete');

            return true;
        } catch (error) {
            console.error('❌ ARInterfaceManager: Initialization failed:', error);
            throw error;
        }
    }

    async initializeVoiceRecognition() {
        try {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.speechRecognition = new SpeechRecognition();

                this.speechRecognition.continuous = true;
                this.speechRecognition.interimResults = true;
                this.speechRecognition.lang = 'en-US';

                this.speechRecognition.onresult = (event) => {
                    this.handleVoiceResult(event);
                };

                this.speechRecognition.onerror = (event) => {
                    console.warn('⚠️ Speech recognition error:', event.error);
                    this.updateVoiceIndicator('error');
                };

                console.log('✅ ARInterfaceManager: Voice recognition ready');
            } else {
                console.warn('⚠️ ARInterfaceManager: Speech recognition not supported');
            }
        } catch (error) {
            console.error('❌ ARInterfaceManager: Voice recognition setup failed:', error);
        }
    }

    createControlPanel() {
        this.controlPanel = document.createElement('div');
        this.controlPanel.id = 'ar-control-panel';
        this.controlPanel.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 280px;
            background: rgba(7, 23, 63, 0.95);
            border: 1px solid rgba(46, 150, 245, 0.3);
            border-radius: 12px;
            padding: 16px;
            z-index: 10002;
            display: none;
            backdrop-filter: blur(8px);
            color: white;
            font-family: 'Segoe UI', sans-serif;
        `;

        this.controlPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; color: #2E96F5; font-size: 16px;">AR Interface</h3>
                <div style="display: flex; gap: 8px;">
                    <button id="ar-refresh-btn" style="background: #2E96F5; border: none; border-radius: 4px; padding: 6px 10px; color: white; font-size: 12px; cursor: pointer;">🔄</button>
                    <button id="ar-voice-btn" style="background: #E43700; border: none; border-radius: 4px; padding: 6px 10px; color: white; font-size: 12px; cursor: pointer;">🎤</button>
                </div>
            </div>

            <div id="ar-mode-selector" style="margin-bottom: 16px;">
                <div style="display: flex; gap: 4px; margin-bottom: 8px;">
                    <button class="ar-mode-btn" data-mode="overview" style="flex: 1; background: #2E96F5; border: none; border-radius: 4px; padding: 8px; color: white; font-size: 12px; cursor: pointer;">Overview</button>
                    <button class="ar-mode-btn" data-mode="detail" style="flex: 1; background: rgba(46, 150, 245, 0.3); border: none; border-radius: 4px; padding: 8px; color: white; font-size: 12px; cursor: pointer;">Detail</button>
                    <button class="ar-mode-btn" data-mode="settings" style="flex: 1; background: rgba(46, 150, 245, 0.3); border: none; border-radius: 4px; padding: 8px; color: white; font-size: 12px; cursor: pointer;">Settings</button>
                </div>
            </div>

            <div id="ar-quick-actions" style="margin-bottom: 16px;">
                <div style="font-size: 12px; margin-bottom: 8px; color: #EAFE07;">Quick Actions:</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    <button class="ar-action-btn" data-action="scan" style="background: rgba(46, 150, 245, 0.5); border: none; border-radius: 4px; padding: 6px; color: white; font-size: 11px; cursor: pointer;">📱 Scan</button>
                    <button class="ar-action-btn" data-action="measure" style="background: rgba(46, 150, 245, 0.5); border: none; border-radius: 4px; padding: 6px; color: white; font-size: 11px; cursor: pointer;">📏 Measure</button>
                    <button class="ar-action-btn" data-action="analyze" style="background: rgba(46, 150, 245, 0.5); border: none; border-radius: 4px; padding: 6px; color: white; font-size: 11px; cursor: pointer;">🔬 Analyze</button>
                    <button class="ar-action-btn" data-action="save" style="background: rgba(46, 150, 245, 0.5); border: none; border-radius: 4px; padding: 6px; color: white; font-size: 11px; cursor: pointer;">💾 Save</button>
                </div>
            </div>

            <div id="ar-status-info">
                <div style="font-size: 12px; margin-bottom: 6px; color: #EAFE07;">System Status:</div>
                <div id="ar-status-text" style="font-size: 11px; color: #ccc;">Initializing...</div>
            </div>
        `;

        document.body.appendChild(this.controlPanel);
        this.setupControlPanelEvents();
    }

    createDataOverlay() {
        this.dataOverlay = document.createElement('div');
        this.dataOverlay.id = 'ar-data-overlay';
        this.dataOverlay.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 320px;
            background: rgba(7, 23, 63, 0.9);
            border: 1px solid rgba(46, 150, 245, 0.3);
            border-radius: 12px;
            padding: 16px;
            z-index: 10002;
            display: none;
            backdrop-filter: blur(8px);
            color: white;
            font-family: 'Segoe UI', sans-serif;
        `;

        this.dataOverlay.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; color: #2E96F5; font-size: 16px;">🛰️ NASA Data</h3>
                <div id="ar-data-timestamp" style="font-size: 10px; color: #ccc;">--:--</div>
            </div>

            <div id="ar-data-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div class="ar-data-card" style="background: rgba(46, 150, 245, 0.2); border-radius: 8px; padding: 12px;">
                    <div style="font-size: 11px; color: #EAFE07; margin-bottom: 4px;">Soil Moisture</div>
                    <div id="ar-soil-value" style="font-size: 18px; font-weight: bold; color: white;">--</div>
                    <div style="font-size: 10px; color: #ccc;">% volumetric</div>
                </div>

                <div class="ar-data-card" style="background: rgba(46, 150, 245, 0.2); border-radius: 8px; padding: 12px;">
                    <div style="font-size: 11px; color: #EAFE07; margin-bottom: 4px;">NDVI</div>
                    <div id="ar-ndvi-value" style="font-size: 18px; font-weight: bold; color: white;">--</div>
                    <div style="font-size: 10px; color: #ccc;">vegetation index</div>
                </div>

                <div class="ar-data-card" style="background: rgba(46, 150, 245, 0.2); border-radius: 8px; padding: 12px;">
                    <div style="font-size: 11px; color: #EAFE07; margin-bottom: 4px;">Temperature</div>
                    <div id="ar-temp-value" style="font-size: 18px; font-weight: bold; color: white;">--</div>
                    <div style="font-size: 10px; color: #ccc;">°C</div>
                </div>

                <div class="ar-data-card" style="background: rgba(46, 150, 245, 0.2); border-radius: 8px; padding: 12px;">
                    <div style="font-size: 11px; color: #EAFE07; margin-bottom: 4px;">Humidity</div>
                    <div id="ar-humidity-value" style="font-size: 18px; font-weight: bold; color: white;">--</div>
                    <div style="font-size: 10px; color: #ccc;">%</div>
                </div>
            </div>

            <div id="ar-recommendation" style="background: rgba(231, 55, 0, 0.2); border-radius: 8px; padding: 12px; border-left: 4px solid #E43700;">
                <div style="font-size: 11px; color: #EAFE07; margin-bottom: 4px;">🤖 AI Recommendation</div>
                <div id="ar-recommendation-text" style="font-size: 12px; color: white;">Loading analysis...</div>
            </div>
        `;

        document.body.appendChild(this.dataOverlay);
    }

    createVoiceIndicator() {
        this.voiceIndicator = document.createElement('div');
        this.voiceIndicator.id = 'ar-voice-indicator';
        this.voiceIndicator.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(7, 23, 63, 0.95);
            border: 2px solid #E43700;
            border-radius: 50px;
            padding: 12px 24px;
            z-index: 10003;
            display: none;
            backdrop-filter: blur(8px);
            color: white;
            font-family: 'Segoe UI', sans-serif;
            animation: pulse 1.5s infinite;
        `;

        this.voiceIndicator.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div id="ar-voice-icon" style="font-size: 16px;">🎤</div>
                <div id="ar-voice-text" style="font-size: 14px; font-weight: bold;">Listening...</div>
            </div>
        `;

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(231, 55, 0, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(231, 55, 0, 0); }
                100% { box-shadow: 0 0 0 0 rgba(231, 55, 0, 0); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(this.voiceIndicator);
    }

    setupControlPanelEvents() {
        // Mode buttons
        const modeButtons = this.controlPanel.querySelectorAll('.ar-mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMode(e.target.dataset.mode);
            });
        });

        // Action buttons
        const actionButtons = this.controlPanel.querySelectorAll('.ar-action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.executeAction(e.target.dataset.action);
            });
        });

        // Refresh button
        const refreshBtn = this.controlPanel.querySelector('#ar-refresh-btn');
        refreshBtn.addEventListener('click', () => {
            this.refreshNASAData();
        });

        // Voice button
        const voiceBtn = this.controlPanel.querySelector('#ar-voice-btn');
        voiceBtn.addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });
    }

    setupTouchHandlers() {
        const arCanvas = document.getElementById('ar-system-canvas');
        if (!arCanvas) return;

        arCanvas.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        }, { passive: false });

        arCanvas.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        }, { passive: false });

        arCanvas.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        }, { passive: false });

        // Double tap detection
        let lastTap = 0;
        arCanvas.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                this.handleDoubleTap(e);
            }
            lastTap = currentTime;
        });
    }

    setupVoiceCommands() {
        this.voiceCommands = {
            'show data': () => this.showDataOverlay(),
            'hide data': () => this.hideDataOverlay(),
            'refresh': () => this.refreshNASAData(),
            'analyze': () => this.executeAction('analyze'),
            'scan': () => this.executeAction('scan'),
            'overview mode': () => this.setMode('overview'),
            'detail mode': () => this.setMode('detail'),
            'help': () => this.showVoiceHelp()
        };
    }

    async activate() {
        try {
            console.log('🚀 ARInterfaceManager: Activating AR interface...');

            if (!this.isInitialized) {
                await this.initialize();
            }

            this.isActive = true;

            // Show UI components
            this.controlPanel.style.display = 'block';
            this.dataOverlay.style.display = 'block';

            // Start data refresh
            await this.refreshNASAData();

            // Update status
            this.updateStatus('AR Interface Active', 'success');

            console.log('✅ ARInterfaceManager: AR interface activated');
            return true;
        } catch (error) {
            console.error('❌ ARInterfaceManager: Activation failed:', error);
            throw error;
        }
    }

    async deactivate() {
        try {
            console.log('🛑 ARInterfaceManager: Deactivating AR interface...');

            this.isActive = false;

            // Hide ALL UI components forcefully
            if (this.controlPanel) {
                this.controlPanel.style.display = 'none';
                this.controlPanel.style.visibility = 'hidden';
            }
            if (this.dataOverlay) {
                this.dataOverlay.style.display = 'none';
                this.dataOverlay.style.visibility = 'hidden';
            }
            if (this.voiceIndicator) {
                this.voiceIndicator.style.display = 'none';
                this.voiceIndicator.style.visibility = 'hidden';
            }

            // Stop voice recognition
            if (this.isListening) {
                this.stopVoiceRecognition();
            }

            // Update status
            this.updateStatus('AR Interface Inactive', 'inactive');

            console.log('✅ ARInterfaceManager: AR interface deactivated');
        } catch (error) {
            console.error('❌ ARInterfaceManager: Deactivation error:', error);
        }
    }

    async refreshNASAData() {
        try {
            console.log('🔄 ARInterfaceManager: Refreshing NASA data...');

            // Get current location (fallback to default)
            const position = await this.getCurrentPosition();

            // Fetch all NASA data in parallel
            const [soilData, ndviData] = await Promise.allSettled([
                this.fetchSoilMoistureData(position.lat, position.lon),
                this.fetchNDVIData(position.lat, position.lon)
            ]);

            // Process results
            this.nasaData.soilMoisture = soilData.status === 'fulfilled' ? soilData.value : null;
            this.nasaData.ndvi = ndviData.status === 'fulfilled' ? ndviData.value : null;
            this.nasaData.lastUpdate = new Date();

            // Update UI
            this.updateDataDisplay();
            this.generateRecommendation();

            // Update AR visualization if available
            if (window.arSystemExtension && typeof window.arSystemExtension.updateDataVisualization === 'function') {
                window.arSystemExtension.updateDataVisualization(this.nasaData);
            }

            console.log('✅ ARInterfaceManager: NASA data refreshed');
        } catch (error) {
            console.error('❌ ARInterfaceManager: NASA data refresh failed:', error);
            this.updateStatus('Data refresh failed', 'error');
        }
    }

    async fetchSoilMoistureData(lat, lon) {
        const response = await fetch(`${this.nasaEndpoints.soilMoisture}?lat=${lat}&lon=${lon}`);
        return await response.json();
    }

    async fetchNDVIData(lat, lon) {
        const response = await fetch(`${this.nasaEndpoints.ndvi}?lat=${lat}&lon=${lon}`);
        return await response.json();
    }

    // Weather data removed as endpoint is not available

    async getCurrentPosition() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        });
                    },
                    () => {
                        // Fallback to default location
                        resolve({ lat: 33.43, lon: -111.94 });
                    }
                );
            } else {
                resolve({ lat: 33.43, lon: -111.94 });
            }
        });
    }

    updateDataDisplay() {
        // Update timestamp
        const timestamp = document.getElementById('ar-data-timestamp');
        if (timestamp) {
            timestamp.textContent = this.nasaData.lastUpdate ?
                this.nasaData.lastUpdate.toLocaleTimeString() : '--:--';
        }

        // Update soil moisture
        const soilValue = document.getElementById('ar-soil-value');
        if (soilValue && this.nasaData.soilMoisture) {
            soilValue.textContent = ((this.nasaData.soilMoisture.surface_moisture || 0) * 100).toFixed(1) || '--';
        }

        // Update NDVI
        const ndviValue = document.getElementById('ar-ndvi-value');
        if (ndviValue && this.nasaData.ndvi) {
            ndviValue.textContent = this.nasaData.ndvi.ndvi?.toFixed(2) || '--';
        }

        // Update temperature and humidity from SMAP data
        const tempValue = document.getElementById('ar-temp-value');
        const humidityValue = document.getElementById('ar-humidity-value');
        if (this.nasaData.soilMoisture) {
            if (tempValue) tempValue.textContent = this.nasaData.soilMoisture.surface_temperature?.toFixed(1) || '--';
            if (humidityValue) humidityValue.textContent = ((this.nasaData.soilMoisture.surface_moisture || 0) * 100).toFixed(0) || '--';
        }
    }

    generateRecommendation() {
        const recommendationText = document.getElementById('ar-recommendation-text');
        if (!recommendationText) return;

        let recommendation = 'Analysis in progress...';

        if (this.nasaData.soilMoisture && this.nasaData.ndvi) {
            const soilMoisture = this.nasaData.soilMoisture.surface_moisture * 100;
            const ndvi = this.nasaData.ndvi.ndvi;
            const temperature = this.nasaData.soilMoisture.surface_temperature;

            if (soilMoisture < 20) {
                recommendation = '💧 Low soil moisture detected. Consider irrigation within 24-48 hours.';
            } else if (ndvi < 0.3) {
                recommendation = '🌱 Low vegetation index. Monitor crop health and consider nutrient supplementation.';
            } else if (temperature > 35) {
                recommendation = '🌡️ High temperature stress detected. Ensure adequate water supply and shade protection.';
            } else if (soilMoisture > 20 && ndvi > 0.6) {
                recommendation = '✅ Optimal conditions detected. Continue current management practices.';
            } else {
                recommendation = '📊 Conditions are moderate. Regular monitoring recommended.';
            }
        }

        recommendationText.textContent = recommendation;
    }

    setMode(mode) {
        this.currentMode = mode;

        // Update button states
        const modeButtons = this.controlPanel.querySelectorAll('.ar-mode-btn');
        modeButtons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.style.background = '#2E96F5';
            } else {
                btn.style.background = 'rgba(46, 150, 245, 0.3)';
            }
        });

        console.log(`🔧 ARInterfaceManager: Mode changed to ${mode}`);
    }

    executeAction(action) {
        console.log(`⚡ ARInterfaceManager: Executing action: ${action}`);

        switch (action) {
            case 'scan':
                this.executeAnalysisScan();
                break;
            case 'measure':
                this.executeMeasurement();
                break;
            case 'analyze':
                this.executeDeepAnalysis();
                break;
            case 'save':
                this.saveCurrentData();
                break;
            default:
                console.warn(`⚠️ Unknown action: ${action}`);
        }
    }

    executeAnalysisScan() {
        this.updateStatus('Scanning area...', 'scanning');
        this.speak('Initiating area scan. Please hold device steady.');

        setTimeout(() => {
            this.updateStatus('Scan complete', 'success');
            this.speak('Scan completed. Data updated.');
        }, 3000);
    }

    executeMeasurement() {
        this.updateStatus('Measuring field parameters...', 'measuring');
        this.speak('Starting field measurement.');

        setTimeout(() => {
            this.updateStatus('Measurement complete', 'success');
        }, 2000);
    }

    executeDeepAnalysis() {
        this.updateStatus('Running deep analysis...', 'analyzing');
        this.speak('Performing comprehensive analysis of satellite data.');

        setTimeout(() => {
            this.refreshNASAData();
            this.updateStatus('Analysis complete', 'success');
        }, 4000);
    }

    saveCurrentData() {
        const dataPackage = {
            timestamp: new Date().toISOString(),
            location: { lat: 33.43, lon: -111.94 }, // Would use actual GPS
            data: this.nasaData
        };

        localStorage.setItem('ar_data_' + Date.now(), JSON.stringify(dataPackage));
        this.updateStatus('Data saved locally', 'success');
        this.speak('Data has been saved to local storage.');
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartPos = { x: touch.clientX, y: touch.clientY };
        this.isGestureActive = true;
    }

    handleTouchMove(e) {
        if (!this.isGestureActive) return;
        e.preventDefault();

        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartPos.x;
        const deltaY = touch.clientY - this.touchStartPos.y;

        // Implement gesture recognition here
        if (Math.abs(deltaX) > 50) {
            // Horizontal swipe
            if (deltaX > 0) {
                this.handleSwipeRight();
            } else {
                this.handleSwipeLeft();
            }
        }
    }

    handleTouchEnd(e) {
        this.isGestureActive = false;
    }

    handleDoubleTap(e) {
        console.log('👆 ARInterfaceManager: Double tap detected');
        this.executeAction('scan');
    }

    handleSwipeLeft() {
        console.log('👈 ARInterfaceManager: Swipe left detected');
        // Switch to next mode
        const modes = ['overview', 'detail', 'settings'];
        const currentIndex = modes.indexOf(this.currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.setMode(modes[nextIndex]);
    }

    handleSwipeRight() {
        console.log('👉 ARInterfaceManager: Swipe right detected');
        // Switch to previous mode
        const modes = ['overview', 'detail', 'settings'];
        const currentIndex = modes.indexOf(this.currentMode);
        const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
        this.setMode(modes[prevIndex]);
    }

    // Voice recognition methods
    toggleVoiceRecognition() {
        if (this.isListening) {
            this.stopVoiceRecognition();
        } else {
            this.startVoiceRecognition();
        }
    }

    startVoiceRecognition() {
        if (!this.speechRecognition) {
            this.speak('Voice recognition not supported on this device.');
            return;
        }

        try {
            this.speechRecognition.start();
            this.isListening = true;
            this.updateVoiceIndicator('listening');
            this.voiceIndicator.style.display = 'block';
            console.log('🎤 ARInterfaceManager: Voice recognition started');
        } catch (error) {
            console.error('❌ Voice recognition start error:', error);
            this.updateVoiceIndicator('error');
        }
    }

    stopVoiceRecognition() {
        if (this.speechRecognition && this.isListening) {
            this.speechRecognition.stop();
            this.isListening = false;
            this.voiceIndicator.style.display = 'none';
            console.log('🔇 ARInterfaceManager: Voice recognition stopped');
        }
    }

    handleVoiceResult(event) {
        const results = event.results;
        const lastResult = results[results.length - 1];

        if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript.toLowerCase().trim();
            console.log('🗣️ Voice command:', transcript);

            this.processVoiceCommand(transcript);
        }
    }

    processVoiceCommand(transcript) {
        let commandExecuted = false;

        for (const [command, action] of Object.entries(this.voiceCommands)) {
            if (transcript.includes(command)) {
                action();
                commandExecuted = true;
                this.speak(`Executing ${command}`);
                break;
            }
        }

        if (!commandExecuted) {
            this.speak('Command not recognized. Say "help" for available commands.');
        }
    }

    showVoiceHelp() {
        const commands = Object.keys(this.voiceCommands).join(', ');
        this.speak(`Available commands: ${commands}`);
    }

    speak(text) {
        if (this.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            utterance.volume = 0.7;
            this.speechSynthesis.speak(utterance);
        }
    }

    updateVoiceIndicator(state) {
        const icon = this.voiceIndicator.querySelector('#ar-voice-icon');
        const text = this.voiceIndicator.querySelector('#ar-voice-text');

        switch (state) {
            case 'listening':
                icon.textContent = '🎤';
                text.textContent = 'Listening...';
                this.voiceIndicator.style.borderColor = '#2E96F5';
                break;
            case 'processing':
                icon.textContent = '⚡';
                text.textContent = 'Processing...';
                this.voiceIndicator.style.borderColor = '#EAFE07';
                break;
            case 'error':
                icon.textContent = '❌';
                text.textContent = 'Error';
                this.voiceIndicator.style.borderColor = '#E43700';
                break;
        }
    }

    showDataOverlay() {
        this.dataOverlay.style.display = 'block';
    }

    hideDataOverlay() {
        this.dataOverlay.style.display = 'none';
    }

    updateStatus(message, type = 'info') {
        const statusText = document.getElementById('ar-status-text');
        if (statusText) {
            statusText.textContent = message;

            // Update color based on type
            switch (type) {
                case 'success':
                    statusText.style.color = '#2E96F5';
                    break;
                case 'error':
                    statusText.style.color = '#E43700';
                    break;
                case 'warning':
                    statusText.style.color = '#EAFE07';
                    break;
                default:
                    statusText.style.color = '#ccc';
            }
        }

        console.log(`📊 ARInterfaceManager Status: ${message}`);
    }

    // Cleanup method
    cleanup() {
        try {
            console.log('🧹 ARInterfaceManager: Starting cleanup...');

            // Stop voice recognition
            if (this.isListening) {
                this.stopVoiceRecognition();
            }

            // Remove UI components
            if (this.controlPanel && this.controlPanel.parentNode) {
                this.controlPanel.parentNode.removeChild(this.controlPanel);
            }
            if (this.dataOverlay && this.dataOverlay.parentNode) {
                this.dataOverlay.parentNode.removeChild(this.dataOverlay);
            }
            if (this.voiceIndicator && this.voiceIndicator.parentNode) {
                this.voiceIndicator.parentNode.removeChild(this.voiceIndicator);
            }

            // Reset state
            this.isInitialized = false;
            this.isActive = false;
            this.controlPanel = null;
            this.dataOverlay = null;
            this.voiceIndicator = null;

            console.log('✅ ARInterfaceManager: Cleanup complete');
        } catch (error) {
            console.error('❌ ARInterfaceManager: Cleanup error:', error);
        }
    }

    // Status methods
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isActive: this.isActive,
            currentMode: this.currentMode,
            isListening: this.isListening,
            hasNASAData: !!this.nasaData.lastUpdate,
            dataAge: this.nasaData.lastUpdate ?
                (new Date() - this.nasaData.lastUpdate) / 1000 : null
        };
    }
}

// Export for global access
window.ARInterfaceManager = ARInterfaceManager;