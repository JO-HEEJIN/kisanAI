/**
 * ARSystemExtension
 * Bridges the core AR system with advanced interface features
 * Extends ARSystem with NASA data integration and enhanced UI
 */
class ARSystemExtension {
    constructor(arSystem) {
        this.arSystem = arSystem;
        this.arInterface = null;
        this.isExtended = false;
        this.nasaDataInterval = null;
        this.locationData = { lat: 33.43, lon: -111.94 }; // Default Phoenix location

        // Extension features
        this.features = {
            nasaIntegration: true,
            voiceCommands: true,
            touchGestures: true,
            dataVisualization: true,
            realTimeUpdates: true
        };

        // Performance monitoring
        this.metrics = {
            renderFPS: 0,
            dataUpdateCount: 0,
            voiceCommandCount: 0,
            gestureCount: 0,
            lastUpdate: null
        };

        console.log('🔧 ARSystemExtension: Initialized');
    }

    async extendARSystem() {
        try {
            console.log('🚀 ARSystemExtension: Extending AR system...');

            if (!this.arSystem) {
                throw new Error('AR System not provided');
            }

            // Initialize AR Interface Manager
            this.arInterface = new window.ARInterfaceManager();
            await this.arInterface.initialize();

            // Setup NASA data integration
            await this.setupNASAIntegration();

            // Setup performance monitoring
            this.setupPerformanceMonitoring();

            // Setup location services
            await this.setupLocationServices();

            // Setup advanced event handlers
            this.setupAdvancedEventHandlers();

            // Setup real-time data updates
            this.setupRealTimeUpdates();

            this.isExtended = true;
            console.log('✅ ARSystemExtension: AR system extended successfully');

            return true;
        } catch (error) {
            console.error('❌ ARSystemExtension: Extension failed:', error);
            throw error;
        }
    }

    async setupNASAIntegration() {
        try {
            console.log('🛰️ ARSystemExtension: Setting up NASA integration...');

            // Verify NASA proxy server connection
            await this.verifyNASAConnection();

            // Setup data fetching intervals
            this.setupNASADataFetching();

            // Setup AR data overlays
            this.setupARDataOverlays();

            console.log('✅ ARSystemExtension: NASA integration ready');
        } catch (error) {
            console.error('❌ ARSystemExtension: NASA integration setup failed:', error);
            // Continue without NASA data if connection fails
        }
    }

    async verifyNASAConnection() {
        try {
            const response = await fetch('http://localhost:3001/api/health');
            if (!response.ok) {
                throw new Error('NASA proxy server not available');
            }
            console.log('✅ ARSystemExtension: NASA proxy server connected');
        } catch (error) {
            console.warn('⚠️ ARSystemExtension: NASA proxy server unavailable:', error.message);
            throw error;
        }
    }

    setupNASADataFetching() {
        // Fetch NASA data every 30 seconds when AR is active
        this.nasaDataInterval = setInterval(async () => {
            if (this.arSystem.isActive && this.arInterface.isActive) {
                try {
                    await this.arInterface.refreshNASAData();
                    this.metrics.dataUpdateCount++;
                    this.metrics.lastUpdate = new Date();
                } catch (error) {
                    console.warn('⚠️ ARSystemExtension: NASA data update failed:', error);
                }
            }
        }, 30000);
    }

    setupARDataOverlays() {
        // Add NASA data visualization to AR scene
        if (this.arSystem.scene) {
            this.createDataVisualizationElements();
        }
    }

    createDataVisualizationElements() {
        try {
            // Create 3D data markers using Babylon.js
            if (this.arSystem.babylon && this.arSystem.scene) {
                // Soil moisture indicator
                const soilSphere = this.arSystem.babylon.MeshBuilder.CreateSphere(
                    "soilMoisture",
                    { diameter: 0.5 },
                    this.arSystem.scene
                );
                soilSphere.position = new this.arSystem.babylon.Vector3(-2, 1, 0);

                // NDVI vegetation indicator
                const ndviBox = this.arSystem.babylon.MeshBuilder.CreateBox(
                    "ndviIndicator",
                    { size: 0.4 },
                    this.arSystem.scene
                );
                ndviBox.position = new this.arSystem.babylon.Vector3(2, 1, 0);

                // Store references for updates
                this.dataVisualizationElements = {
                    soilMoisture: soilSphere,
                    ndvi: ndviBox
                };

                console.log('✅ ARSystemExtension: Data visualization elements created');
            }
        } catch (error) {
            console.error('❌ ARSystemExtension: Data visualization creation failed:', error);
        }
    }

    updateDataVisualization(nasaData) {
        try {
            if (!this.dataVisualizationElements || !nasaData) return;

            // Update soil moisture visualization
            if (this.dataVisualizationElements.soilMoisture && nasaData.soilMoisture) {
                const soilLevel = nasaData.soilMoisture.soilMoisture / 100;
                const material = new this.arSystem.babylon.StandardMaterial(
                    "soilMaterial",
                    this.arSystem.scene
                );

                // Color based on soil moisture level
                if (soilLevel < 0.2) {
                    material.diffuseColor = new this.arSystem.babylon.Color3(1, 0, 0); // Red - dry
                } else if (soilLevel < 0.4) {
                    material.diffuseColor = new this.arSystem.babylon.Color3(1, 1, 0); // Yellow - moderate
                } else {
                    material.diffuseColor = new this.arSystem.babylon.Color3(0, 1, 0); // Green - adequate
                }

                this.dataVisualizationElements.soilMoisture.material = material;
            }

            // Update NDVI visualization
            if (this.dataVisualizationElements.ndvi && nasaData.ndvi) {
                const ndviValue = nasaData.ndvi.ndvi;
                const material = new this.arSystem.babylon.StandardMaterial(
                    "ndviMaterial",
                    this.arSystem.scene
                );

                // Color based on NDVI value
                const greenIntensity = Math.max(0, Math.min(1, ndviValue));
                material.diffuseColor = new this.arSystem.babylon.Color3(
                    1 - greenIntensity,
                    greenIntensity,
                    0
                );

                this.dataVisualizationElements.ndvi.material = material;
            }
        } catch (error) {
            console.error('❌ ARSystemExtension: Data visualization update failed:', error);
        }
    }

    setupPerformanceMonitoring() {
        // Monitor render performance
        if (this.arSystem.engine) {
            this.arSystem.engine.runRenderLoop(() => {
                if (this.arSystem.scene && this.arSystem.isActive) {
                    this.arSystem.scene.render();

                    // Update FPS counter
                    this.metrics.renderFPS = this.arSystem.engine.getFps();
                }
            });
        }

        // Performance logging every 10 seconds
        setInterval(() => {
            if (this.isExtended && this.arSystem.isActive) {
                this.logPerformanceMetrics();
            }
        }, 10000);
    }

    logPerformanceMetrics() {
        console.log('📊 ARSystemExtension Performance:', {
            fps: this.metrics.renderFPS.toFixed(1),
            dataUpdates: this.metrics.dataUpdateCount,
            voiceCommands: this.metrics.voiceCommandCount,
            gestures: this.metrics.gestureCount,
            memoryUsage: performance.memory ?
                `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB` : 'N/A'
        });
    }

    async setupLocationServices() {
        try {
            console.log('📍 ARSystemExtension: Setting up location services...');

            // Get user's current location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.locationData = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            timestamp: new Date()
                        };
                        console.log('📍 Location updated:', this.locationData);
                    },
                    (error) => {
                        console.warn('⚠️ Location access denied, using default location');
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                );
            }

            // Setup location tracking for AR
            this.setupLocationTracking();

            console.log('✅ ARSystemExtension: Location services ready');
        } catch (error) {
            console.error('❌ ARSystemExtension: Location setup failed:', error);
        }
    }

    setupLocationTracking() {
        // Update location every 5 minutes when AR is active
        setInterval(() => {
            if (this.arSystem.isActive && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const newLocation = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            timestamp: new Date()
                        };

                        // Check if location changed significantly (>100m)
                        const distance = this.calculateDistance(
                            this.locationData.lat, this.locationData.lon,
                            newLocation.lat, newLocation.lon
                        );

                        if (distance > 0.1) { // 100 meters
                            this.locationData = newLocation;
                            console.log('📍 Significant location change detected, updating data...');

                            // Trigger NASA data refresh for new location
                            if (this.arInterface) {
                                this.arInterface.refreshNASAData();
                            }
                        }
                    },
                    (error) => {
                        console.warn('⚠️ Location update failed:', error);
                    }
                );
            }
        }, 300000); // 5 minutes
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    setupAdvancedEventHandlers() {
        // Enhanced AR system event handlers
        this.setupAREventListeners();
        this.setupKeyboardShortcuts();
        this.setupDeviceOrientationHandlers();
    }

    setupAREventListeners() {
        // Listen for AR system events
        if (this.arSystem.eventListeners) {
            // AR session start
            this.arSystem.eventListeners.set('ar-start', async () => {
                console.log('🚀 ARSystemExtension: AR session started');

                if (this.arInterface) {
                    await this.arInterface.activate();
                }

                // Start NASA data updates
                if (this.arInterface) {
                    await this.arInterface.refreshNASAData();
                }
            });

            // AR session end
            this.arSystem.eventListeners.set('ar-stop', async () => {
                console.log('🛑 ARSystemExtension: AR session stopped');

                if (this.arInterface) {
                    await this.arInterface.deactivate();
                }
            });
        }
    }

    setupKeyboardShortcuts() {
        const handleKeyPress = (event) => {
            if (!this.arSystem.isActive) return;

            switch (event.key.toLowerCase()) {
                case 'd':
                    // Toggle data overlay
                    if (this.arInterface) {
                        if (this.arInterface.dataOverlay.style.display === 'none') {
                            this.arInterface.showDataOverlay();
                        } else {
                            this.arInterface.hideDataOverlay();
                        }
                    }
                    break;
                case 'r':
                    // Refresh NASA data
                    if (this.arInterface) {
                        this.arInterface.refreshNASAData();
                    }
                    break;
                case 'v':
                    // Toggle voice recognition
                    if (this.arInterface) {
                        this.arInterface.toggleVoiceRecognition();
                        this.metrics.voiceCommandCount++;
                    }
                    break;
                case 'h':
                    // Show help
                    this.showKeyboardHelp();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        // Store for cleanup
        this.keyboardHandler = handleKeyPress;
    }

    setupDeviceOrientationHandlers() {
        if (window.DeviceOrientationEvent) {
            const handleOrientation = (event) => {
                if (!this.arSystem.isActive) return;

                // Use device orientation for enhanced AR experience
                const alpha = event.alpha; // Z axis rotation
                const beta = event.beta;   // X axis rotation
                const gamma = event.gamma; // Y axis rotation

                // Update AR scene based on device orientation
                this.updateARSceneOrientation(alpha, beta, gamma);
            };

            window.addEventListener('deviceorientation', handleOrientation);
            this.orientationHandler = handleOrientation;
        }
    }

    updateARSceneOrientation(alpha, beta, gamma) {
        try {
            if (this.dataVisualizationElements && this.arSystem.scene) {
                // Subtle rotation of data elements based on device orientation
                Object.values(this.dataVisualizationElements).forEach(element => {
                    if (element) {
                        element.rotation.y = (alpha || 0) * Math.PI / 180 * 0.1;
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ ARSystemExtension: Orientation update failed:', error);
        }
    }

    setupRealTimeUpdates() {
        // Setup WebSocket connection for real-time updates (if available)
        this.setupWebSocketConnection();

        // Setup periodic health checks
        this.setupHealthChecks();
    }

    setupWebSocketConnection() {
        // Placeholder for WebSocket implementation
        // Could connect to real-time NASA data streams in the future
        console.log('📡 ARSystemExtension: WebSocket support ready for future implementation');
    }

    setupHealthChecks() {
        // Periodic health checks every 2 minutes
        setInterval(() => {
            if (this.isExtended) {
                this.performHealthCheck();
            }
        }, 120000);
    }

    async performHealthCheck() {
        try {
            const health = {
                arSystem: this.arSystem ? this.arSystem.getStatus() : null,
                arInterface: this.arInterface ? this.arInterface.getStatus() : null,
                nasaConnection: await this.checkNASAConnection(),
                location: this.locationData,
                performance: this.metrics,
                timestamp: new Date()
            };

            console.log('🏥 ARSystemExtension Health Check:', health);

            // Auto-recovery if needed
            if (!health.nasaConnection && this.arInterface) {
                console.log('🔧 ARSystemExtension: Attempting NASA connection recovery...');
                try {
                    await this.verifyNASAConnection();
                } catch (error) {
                    console.warn('⚠️ NASA connection recovery failed');
                }
            }

            return health;
        } catch (error) {
            console.error('❌ ARSystemExtension: Health check failed:', error);
            return null;
        }
    }

    async checkNASAConnection() {
        try {
            const response = await fetch('http://localhost:3001/api/health', {
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    showKeyboardHelp() {
        const helpText = `
🎮 AR System Keyboard Shortcuts:
• D - Toggle data overlay
• R - Refresh NASA data
• V - Toggle voice recognition
• H - Show this help
        `;

        if (this.arInterface) {
            this.arInterface.speak('Keyboard shortcuts: D for data, R for refresh, V for voice, H for help');
        }

        console.log(helpText);
    }

    // Enhanced AR session management
    async startEnhancedAR() {
        try {
            console.log('🚀 ARSystemExtension: Starting enhanced AR session...');

            // Start base AR system
            await this.arSystem.startAR();

            // Activate interface components
            if (this.arInterface) {
                await this.arInterface.activate();
            }

            // Initial NASA data fetch
            if (this.arInterface) {
                await this.arInterface.refreshNASAData();
            }

            // Update performance metrics
            this.metrics.dataUpdateCount++;

            console.log('✅ ARSystemExtension: Enhanced AR session started');
            return true;
        } catch (error) {
            console.error('❌ ARSystemExtension: Enhanced AR start failed:', error);
            throw error;
        }
    }

    async stopEnhancedAR() {
        try {
            console.log('🛑 ARSystemExtension: Stopping enhanced AR session...');

            // Deactivate interface components - try multiple sources
            if (this.arInterface) {
                await this.arInterface.deactivate();
            }

            // Also try global ARInterfaceManager if available
            if (window.arInterfaceManager) {
                await window.arInterfaceManager.deactivate();
            }

            // Force hide any remaining AR UI panels
            this.forceHideARPanels();

            // Stop base AR system
            await this.arSystem.stopAR();

            console.log('✅ ARSystemExtension: Enhanced AR session stopped');
        } catch (error) {
            console.error('❌ ARSystemExtension: Enhanced AR stop failed:', error);
        }
    }

    forceHideARPanels() {
        try {
            console.log('🧹 ARSystemExtension: Force hiding ALL AR panels...');

            // Comprehensive list of AR-related selectors
            const panelSelectors = [
                '#ar-control-panel',
                '#ar-data-overlay',
                '#ar-voice-indicator',
                '#ar-system-canvas',
                '#ar-system-controls',
                '#ar-fallback-camera',
                '[id*="ar-"]',
                '[class*="ar-"]',
                'canvas[id*="ar"]',
                'video[id*="ar"]'
            ];

            let hiddenCount = 0;
            panelSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    // Multiple ways to hide
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                    el.style.opacity = '0';
                    el.style.pointerEvents = 'none';
                    el.style.zIndex = '-9999';

                    // Try to remove from DOM completely
                    try {
                        if (el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                    } catch (e) {
                        // If removal fails, at least it's hidden
                    }

                    hiddenCount++;
                });
            });

            // Also try to deactivate any global AR interface
            if (window.arInterfaceManager && typeof window.arInterfaceManager.deactivate === 'function') {
                try {
                    window.arInterfaceManager.deactivate();
                    console.log('✓ Called global arInterfaceManager.deactivate()');
                } catch (e) {
                    console.warn('⚠️ Failed to deactivate global arInterfaceManager:', e);
                }
            }

            console.log(`🗑️ ARSystemExtension: Force hid/removed ${hiddenCount} AR elements`);
        } catch (error) {
            console.error('❌ ARSystemExtension: Force hide panels error:', error);
        }
    }

    // Cleanup method
    async cleanup() {
        try {
            console.log('🧹 ARSystemExtension: Starting cleanup...');

            // Stop intervals
            if (this.nasaDataInterval) {
                clearInterval(this.nasaDataInterval);
                this.nasaDataInterval = null;
            }

            // Remove event listeners
            if (this.keyboardHandler) {
                document.removeEventListener('keydown', this.keyboardHandler);
            }
            if (this.orientationHandler) {
                window.removeEventListener('deviceorientation', this.orientationHandler);
            }

            // Cleanup AR interface
            if (this.arInterface) {
                await this.arInterface.cleanup();
                this.arInterface = null;
            }

            // Cleanup visualization elements
            if (this.dataVisualizationElements) {
                Object.values(this.dataVisualizationElements).forEach(element => {
                    if (element) {
                        element.dispose();
                    }
                });
                this.dataVisualizationElements = null;
            }

            // Reset state
            this.isExtended = false;
            this.metrics = {
                renderFPS: 0,
                dataUpdateCount: 0,
                voiceCommandCount: 0,
                gestureCount: 0,
                lastUpdate: null
            };

            console.log('✅ ARSystemExtension: Cleanup complete');
        } catch (error) {
            console.error('❌ ARSystemExtension: Cleanup error:', error);
        }
    }

    // Status and utility methods
    getExtensionStatus() {
        return {
            isExtended: this.isExtended,
            features: this.features,
            metrics: this.metrics,
            location: this.locationData,
            hasARInterface: !!this.arInterface,
            hasARSystem: !!this.arSystem
        };
    }

    getPerformanceReport() {
        return {
            currentFPS: this.metrics.renderFPS,
            totalDataUpdates: this.metrics.dataUpdateCount,
            totalVoiceCommands: this.metrics.voiceCommandCount,
            totalGestures: this.metrics.gestureCount,
            lastUpdate: this.metrics.lastUpdate,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
        };
    }

    // Removed debug utilities for production
}

// Export for global access
window.ARSystemExtension = ARSystemExtension;