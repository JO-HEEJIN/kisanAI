/**
 * SafeARIntegration.js - Safe AR Integration with Main App
 * Separated from DOM interference, integrates AR system into main application
 */
class SafeARIntegration {
    constructor() {
        this.arSystem = null;
        this.isActive = false;
        this.isFarmerMode = false;
        this.currentState = {};
        this.eventListeners = new Map();
        this.aiManager = null;
        this.lastNASAData = null;
        this.farmDataInterval = null;

        // Farmer interface addition
        this.farmerInterface = null;

        console.log('🛡️ SafeARIntegration: Initialized');
    }

    // Start safe AR
    async startSafeAR() {
        try {
            console.log('🚀 SafeARIntegration: Starting safe AR');

            // Complete cleanup of existing AR system
            await this.emergencyCleanupAll();

            // Backup current app state
            this.backupCurrentState();

            // Create minimal AR system
            this.arSystem = new MinimalWebXRAR();

            // Set up global safety measures
            this.setupGlobalSafeties();

            // Start AR
            const success = await this.arSystem.startAR();

            if (success) {
                this.isActive = true;
                console.log('✅ SafeARIntegration: Safe AR activated');

                // State notification
                this.notifyARStateChange('started');

                return true;
            } else {
                throw new Error('AR system startup failed');
            }

        } catch (error) {
            console.error('❌ SafeARIntegration: AR startup failed:', error);

            // Complete cleanup on failure
            await this.cleanup();

            this.showSafeNotification('AR startup failed. Please check WebXR support.', 'error');

            return false;
        }
    }

    // Stop safe AR
    async stopSafeAR() {
        try {
            console.log('🛑 SafeARIntegration: Stopping safe AR');

            this.isActive = false;

            // Stop AR system
            if (this.arSystem) {
                await this.arSystem.stopAR();
            }

            // Complete cleanup
            await this.cleanup();

            // Restore app state
            this.restoreAppState();

            // State notification
            this.notifyARStateChange('stopped');

            console.log('✅ SafeARIntegration: Safe AR stopped successfully');
            return true;

        } catch (error) {
            console.error('❌ SafeARIntegration: AR stop failed:', error);

            // Force cleanup on failure
            await this.cleanup();
            return false;
        }
    }

    // Start farmer AR
    async startFarmerAR() {
        try {
            console.log('👨‍🌾 SafeARIntegration: Starting farmer AR');

            // Complete cleanup of existing AR system
            await this.emergencyCleanupAll();

            // Set farmer mode
            this.isFarmerMode = true;

            // Backup current app state
            this.backupCurrentState();

            // Create minimal AR system
            this.arSystem = new MinimalWebXRAR();

            // Create farmer interface (replace existing overlay)
            this.farmerInterface = new FarmerARInterface();
            this.farmerInterface.createFarmerInterface();
            this.farmerInterface.show();

            // Set up farmer event listeners
            this.setupFarmerEventListeners();

            // Set up global safety measures
            this.setupGlobalSafeties();

            // Start AR
            const success = await this.arSystem.startAR();

            if (success) {
                this.isActive = true;

                // Load initial farm data
                setTimeout(() => {
                    this.loadInitialFarmData();
                }, 1000);

                // Start periodic farm data updates
                this.startFarmDataUpdates();

                console.log('✅ SafeARIntegration: Farmer AR activated');

                // State notification
                this.notifyARStateChange('farmer-started');

                return true;
            } else {
                throw new Error('Farmer AR system startup failed');
            }

        } catch (error) {
            console.error('❌ SafeARIntegration: Farmer AR startup failed:', error);

            // Complete cleanup on failure
            await this.cleanup();

            // Notify user
            this.showSafeNotification('Farmer AR startup failed. Please check WebXR support.', 'error');

            return false;
        }
    }

    // Load initial farm data
    async loadInitialFarmData() {
        try {
            // Load NASA satellite data
            const soilData = await this.fetchNASAData('soil');
            const ndviData = await this.fetchNASAData('ndvi');

            if (this.farmerInterface) {
                this.farmerInterface.updateWithNASAData(soilData, ndviData);
                console.log('✅ Farm data update complete');
            }

            this.lastNASAData = { soilData, ndviData };

        } catch (error) {
            console.warn('⚠️ Failed to load initial farm data:', error);

            // Use fallback data
            const fallbackData = this.generateFallbackData();
            if (this.farmerInterface) {
                this.farmerInterface.updateWithNASAData(fallbackData.soil, fallbackData.ndvi);
            }
        }
    }

    // Start farm data updates
    startFarmDataUpdates() {
        if (this.farmDataInterval) {
            clearInterval(this.farmDataInterval);
        }

        this.farmDataInterval = setInterval(() => {
            if (this.isActive && this.isFarmerMode) {
                this.loadInitialFarmData();
            }
        }, 120000); // Update every 2 minutes

        console.log('⏰ Farm data auto-update started (2-minute intervals)');
    }

    // Generate fallback data
    generateFallbackData() {
        return {
            soil: {
                surface_moisture: 0.25 + Math.random() * 0.5,
                temperature: 20 + Math.random() * 15
            },
            ndvi: {
                ndvi: 0.3 + Math.random() * 0.4,
                temperature: 20 + Math.random() * 15
            }
        };
    }

    // Fetch NASA data
    async fetchNASAData(type) {
        const response = await fetch(`http://localhost:3001/api/${type === 'soil' ? 'smap/soil-moisture' : 'modis/ndvi'}?lat=33.43&lon=-111.94`);
        const data = await response.json();
        return data;
    }

    // Set up farmer event listeners
    setupFarmerEventListeners() {
        // Monitor farmer interface events
        const farmerEvents = ['scan-complete', 'data-refresh', 'analysis-save'];

        // Farmer AR exit event
        const farmerExitHandler = () => {
            console.log('🔴 Farmer AR exit event received');
            this.cleanup();
        };

        document.addEventListener('farmer-ar-exit', farmerExitHandler);
        this.eventListeners.set('farmer-ar-exit', farmerExitHandler);

        // Farm data update request
        const dataUpdateHandler = (event) => {
            console.log('🔄 Farm data update requested');
            this.loadInitialFarmData();
        };

        document.addEventListener('farm-data-update', dataUpdateHandler);
        this.eventListeners.set('farm-data-update', dataUpdateHandler);

        // Area scan complete event
        const scanCompleteHandler = (event) => {
            console.log('🔍 Area scan complete:', event.detail);
            // Perform additional analysis based on scan results
            if (event.detail && event.detail.scanResults) {
                this.processScanResults(event.detail.scanResults);
            }
        };

        document.addEventListener('area-scan-complete', scanCompleteHandler);
        this.eventListeners.set('area-scan-complete', scanCompleteHandler);

        console.log('👨‍🌾 Farmer event listeners setup complete');
    }

    // Process scan results
    processScanResults(scanResults) {
        if (this.farmerInterface && scanResults) {
            // Generate additional advice based on scan results
            const enhancedAnalysis = {
                scanArea: scanResults.area,
                soilVariability: scanResults.variability,
                recommendations: this.generateScanBasedAdvice(scanResults)
            };

            // Update farmer interface with enhanced analysis
            this.farmerInterface.updateWithScanResults(enhancedAnalysis);
        }
    }

    // Generate scan-based advice
    generateScanBasedAdvice(scanResults) {
        const advice = [];

        if (scanResults.variability > 0.3) {
            advice.push('High soil variability detected. Consider variable rate application.');
        }

        if (scanResults.avgMoisture < 0.2) {
            advice.push('Low average moisture detected. Prioritize irrigation in dry zones.');
        }

        return advice.length > 0 ? advice : ['Scan results look normal. Continue current management.'];
    }

    // Backup current state
    backupCurrentState() {
        try {
            // Backup active tab state
            const activeTab = document.querySelector('.tab.active, .tab-button.active');
            this.currentState.activeTab = activeTab ? activeTab.getAttribute('data-tab') : null;

            // Backup scroll position
            this.currentState.scrollPosition = {
                x: window.scrollX,
                y: window.scrollY
            };

            // Backup body classes
            this.currentState.bodyClasses = Array.from(document.body.classList);

            console.log('💾 App state backup complete');

        } catch (error) {
            console.warn('⚠️ Failed to backup app state:', error);
        }
    }

    // Restore app state
    restoreAppState() {
        try {
            // Restore tab state
            if (this.currentState.activeTab) {
                const tabToRestore = document.querySelector(`[data-tab="${this.currentState.activeTab}"]`);
                if (tabToRestore && typeof window.showTab === 'function') {
                    window.showTab(this.currentState.activeTab);
                }
            }

            // Restore scroll position
            if (this.currentState.scrollPosition) {
                window.scrollTo(this.currentState.scrollPosition.x, this.currentState.scrollPosition.y);
            }

            console.log('✅ App state restore complete');

        } catch (error) {
            console.warn('⚠️ Failed to restore app state:', error);
        }
    }

    // Set up global safety measures
    setupGlobalSafeties() {
        // Page visibility change - exit AR when page hidden
        const visibilityHandler = () => {
            if (document.hidden && this.isActive) {
                console.log('📱 Page hidden - exiting AR');
                this.cleanup();
            }
        };

        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.set('visibilitychange', visibilityHandler);

        // Browser close - cleanup
        const beforeUnloadHandler = (event) => {
            if (this.isActive) {
                this.cleanup();
            }
        };

        window.addEventListener('beforeunload', beforeUnloadHandler);
        this.eventListeners.set('beforeunload', beforeUnloadHandler);

        // Keyboard shortcuts (Escape to exit AR)
        const keydownHandler = (event) => {
            if (event.key === 'Escape' && this.isActive) {
                console.log('⌨️ Escape key - exiting AR');
                this.cleanup();
            }
        };

        document.addEventListener('keydown', keydownHandler);
        this.eventListeners.set('keydown', keydownHandler);

        // Memory monitoring
        this.setupMemoryMonitoring();

        console.log('🛡️ Global safety measures active');
    }

    // Set up memory monitoring
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            const memoryCheckInterval = setInterval(() => {
                if (!this.isActive) {
                    clearInterval(memoryCheckInterval);
                    return;
                }

                const memInfo = performance.memory;
                const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);

                if (usedMB > 200 && this.isActive) { // Over 200MB
                    console.warn('⚠️ High memory usage - exiting AR');
                    this.cleanup();
                }
            }, 10000); // Check every 10 seconds

            this.eventListeners.set('memoryCheck', () => clearInterval(memoryCheckInterval));
        }
    }

    // Show safe notification
    showSafeNotification(message, type = 'info') {
        try {
            // Create notification element
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#e74c3c' : '#3498db'};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                z-index: 999999;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                max-width: 300px;
                word-wrap: break-word;
            `;
            notification.textContent = message;

            document.body.appendChild(notification);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);

        } catch (error) {
            console.warn('⚠️ Failed to show notification:', error);
        }
    }

    // Notify AR state change
    notifyARStateChange(state) {
        const event = new CustomEvent('ar-state-change', {
            detail: { state, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    // Complete cleanup of existing AR system
    async emergencyCleanupAll() {
        console.log('🚨 Complete cleanup of existing AR system');

        try {
            // Clean up global AR objects
            const globalARObjects = [
                'arChatGPTCore', 'babylonXRFramework', 'arOverlayDisplay',
                'arSystem', 'arIntegrationManager', 'tabGuard'
            ];

            globalARObjects.forEach(objName => {
                if (window[objName]) {
                    try {
                        if (typeof window[objName].cleanup === 'function') {
                            window[objName].cleanup();
                        }
                        if (typeof window[objName].emergencyCleanup === 'function') {
                            window[objName].emergencyCleanup();
                        }
                    } catch (error) {
                        console.warn(`⚠️ ${objName} cleanup failed:`, error);
                    }

                    window[objName] = null;
                }
            });

            // Remove AR-related DOM elements
            const arElements = document.querySelectorAll('[id*="ar-"], [class*="ar-"], canvas[id*="babylon"], video[autoplay]');
            arElements.forEach(element => {
                if (element.parentNode && element.id !== 'start-ar-btn' && element.id !== 'start-farmer-ar-btn') {
                    element.parentNode.removeChild(element);
                }
            });

            // Clear all timers
            for (let i = 1; i < 99999; i++) {
                clearTimeout(i);
                clearInterval(i);
            }

            console.log('✅ Existing AR system cleanup complete');

        } catch (error) {
            console.error('❌ Emergency cleanup failed:', error);
        }
    }

    // Clean up event listeners
    cleanupEventListeners() {
        this.eventListeners.forEach((handler, event) => {
            try {
                if (event === 'memoryCheck' || event === 'farmDataTimer') {
                    handler(); // Execute cleanup function
                } else if (event === 'visibilitychange' || event === 'keydown') {
                    document.removeEventListener(event, handler);
                } else if (event === 'beforeunload') {
                    window.removeEventListener(event, handler);
                } else {
                    document.removeEventListener(event, handler);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to cleanup ${event} listener:`, error);
            }
        });

        this.eventListeners.clear();
    }

    // Safe cleanup
    async cleanup() {
        this.isActive = false;

        console.log('🧹 SafeARIntegration: Starting cleanup');

        // Clean up AR system
        if (this.arSystem) {
            try {
                await this.arSystem.cleanup();
            } catch (error) {
                console.warn('⚠️ AR system cleanup failed:', error);
            }
            this.arSystem = null;
        }

        // Clean up farmer interface
        if (this.farmerInterface) {
            try {
                this.farmerInterface.cleanup();
                console.log('👨‍🌾 Farmer interface cleanup complete');
            } catch (error) {
                console.warn('⚠️ Farmer interface cleanup failed:', error);
            }
            this.farmerInterface = null;
        }

        // Clean up farm data update timer
        if (this.farmDataInterval) {
            clearInterval(this.farmDataInterval);
            this.farmDataInterval = null;
            console.log('⏰ Farm data update timer cleanup complete');
        }

        // Reset farmer mode state
        this.isFarmerMode = false;

        // Clean up AI manager
        if (this.aiManager) {
            try {
                this.aiManager.cleanup();
                console.log('🤖 AI manager cleanup complete');
            } catch (error) {
                console.warn('⚠️ AI manager cleanup failed:', error);
            }
            this.aiManager = null;
        }

        // Clean up event listeners
        this.cleanupEventListeners();

        // Reset state
        this.currentState = {};
        this.lastNASAData = null;

        // State notification
        this.notifyARStateChange('cleaned');

        console.log('✅ SafeARIntegration: Cleanup complete');
    }

    // Get status
    getStatus() {
        return {
            isActive: this.isActive,
            isFarmerMode: this.isFarmerMode,
            hasARSystem: !!this.arSystem,
            hasFarmerInterface: !!this.farmerInterface,
            eventListenerCount: this.eventListeners.size
        };
    }
}

// Global access
if (typeof window !== 'undefined') {
    window.SafeARIntegration = SafeARIntegration;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SafeARIntegration;
}