/**
 * Independent Babylon.js AR System
 * Clean implementation with proper cleanup and navigation protection
 */
class ARSystem {
    constructor() {
        this.babylon = null;
        this.engine = null;
        this.scene = null;
        this.xrHelper = null;
        this.canvas = null;
        this.isActive = false;
        this.isInitialized = false;
        this.cleanupHandlers = [];
        this.eventListeners = new Map();

        // Bind methods to preserve 'this' context
        this.cleanup = this.cleanup.bind(this);
        this.emergencyCleanup = this.emergencyCleanup.bind(this);

        console.log('🚀 ARSystem: Initialized');
    }

    async initialize() {
        try {
            console.log('🔄 ARSystem: Starting initialization...');

            // Load Babylon.js if not already loaded
            await this.loadBabylonJS();

            // Create canvas
            this.createCanvas();

            // Initialize Babylon engine and scene
            await this.initializeBabylon();

            // Setup WebXR
            await this.setupWebXR();

            this.isInitialized = true;
            console.log('✅ ARSystem: Initialization complete');

            return true;
        } catch (error) {
            console.error('❌ ARSystem: Initialization failed:', error);
            await this.cleanup();
            throw error;
        }
    }

    async loadBabylonJS() {
        if (window.BABYLON) {
            this.babylon = window.BABYLON;
            return;
        }

        console.log('📦 ARSystem: Loading Babylon.js...');

        // Load Babylon.js modules
        const scripts = [
            'https://cdn.babylonjs.com/babylon.js',
            'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js'
        ];

        for (const src of scripts) {
            await this.loadScript(src);
        }

        this.babylon = window.BABYLON;
        console.log('✅ ARSystem: Babylon.js loaded');
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);

            // Track for cleanup
            this.cleanupHandlers.push(() => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            });
        });
    }

    createCanvas() {
        // Remove any existing AR canvas and controls
        const existingCanvas = document.getElementById('ar-system-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        const existingControls = document.getElementById('ar-system-controls');
        if (existingControls) {
            existingControls.remove();
        }

        // Create AR canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'ar-system-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10000;
            display: none;
            touch-action: none;
            background: transparent;
        `;

        // Create AR controls overlay
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = 'ar-system-controls';
        this.controlsContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            display: none;
            flex-direction: column;
            gap: 10px;
        `;

        // Create Exit AR button
        this.exitButton = document.createElement('button');
        this.exitButton.id = 'exit-ar-btn';
        this.exitButton.innerHTML = '❌ Exit AR';
        this.exitButton.style.cssText = `
            background: rgba(231, 55, 0, 0.9);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(231, 55, 0, 0.3);
            backdrop-filter: blur(4px);
            min-width: 120px;
        `;

        // Add exit button click handler with multiple attachment methods
        const exitHandler = async () => {
            console.log('🛑 AR Exit button clicked');

            try {
                // Try to stop the enhanced AR system first
                if (window.arSystemExtension && typeof window.arSystemExtension.stopEnhancedAR === 'function') {
                    console.log('🔄 Calling ARSystemExtension.stopEnhancedAR()...');
                    await window.arSystemExtension.stopEnhancedAR();
                } else if (window.arIntegrationManager && typeof window.arIntegrationManager.stopAR === 'function') {
                    console.log('🔄 Calling ARIntegrationManager.stopAR()...');
                    await window.arIntegrationManager.stopAR();
                } else {
                    console.log('🔄 Calling basic ARSystem.stopAR()...');
                    await this.stopAR();
                }

                // Force cleanup any remaining UI (but exclude the exit button itself from being cloned)
                this.forceCleanupUI();

                console.log('✅ AR Exit completed');
            } catch (error) {
                console.error('❌ AR Exit error:', error);
                // Force cleanup even if error
                this.forceCleanupUI();
            }
        };

        // Store the handler for later reattachment if needed
        this.exitHandler = exitHandler;

        // Multiple ways to attach the event listener
        this.exitButton.addEventListener('click', exitHandler);
        this.exitButton.onclick = exitHandler; // Fallback method

        // Also add a global click handler via event delegation
        document.addEventListener('click', (event) => {
            if (event.target && event.target.id === 'exit-ar-btn') {
                console.log('🎯 Exit button clicked via delegation');
                exitHandler();
            }
        });

        console.log('✅ Exit button event handlers attached');

        // Add a method to reattach event listeners if they get removed
        this.reattachExitHandler = () => {
            const exitBtn = document.getElementById('exit-ar-btn');
            if (exitBtn && !exitBtn.onclick && this.exitHandler) {
                console.log('🔄 Reattaching exit button handler');
                exitBtn.addEventListener('click', this.exitHandler);
                exitBtn.onclick = this.exitHandler;
            }
        };

        // Periodically check and reattach if needed
        this.exitHandlerInterval = setInterval(this.reattachExitHandler, 1000);

        // Create AR status indicator
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.innerHTML = '🥽 AR Active';
        this.statusIndicator.style.cssText = `
            background: rgba(46, 150, 245, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            backdrop-filter: blur(4px);
        `;

        // Assemble controls
        this.controlsContainer.appendChild(this.exitButton);
        this.controlsContainer.appendChild(this.statusIndicator);

        // Add to DOM
        document.body.appendChild(this.canvas);
        document.body.appendChild(this.controlsContainer);

        // Track for cleanup
        this.cleanupHandlers.push(() => {
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            if (this.controlsContainer && this.controlsContainer.parentNode) {
                this.controlsContainer.parentNode.removeChild(this.controlsContainer);
            }
            this.canvas = null;
            this.controlsContainer = null;
            this.exitButton = null;
            this.statusIndicator = null;
        });

        console.log('🎨 ARSystem: Canvas created');
    }

    async initializeBabylon() {
        this.engine = new this.babylon.Engine(this.canvas, true);
        this.scene = new this.babylon.Scene(this.engine);

        // AR Scene setup - transparent background for camera passthrough
        this.scene.clearColor = new this.babylon.Color4(0, 0, 0, 0); // Transparent background
        this.engine.setHardwareScalingLevel(1); // Full resolution

        // Basic scene setup
        const camera = new this.babylon.ArcRotateCamera(
            "camera",
            -Math.PI / 2,
            Math.PI / 2.5,
            10,
            this.babylon.Vector3.Zero(),
            this.scene
        );

        const light = new this.babylon.HemisphericLight(
            "light",
            new this.babylon.Vector3(0, 1, 0),
            this.scene
        );

        // Start render loop
        this.engine.runRenderLoop(() => {
            if (this.scene && this.isActive) {
                this.scene.render();
            }
        });

        // Handle resize
        const resizeHandler = () => {
            if (this.engine) {
                this.engine.resize();
            }
        };
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.set('resize', resizeHandler);

        console.log('🎭 ARSystem: Babylon scene initialized');
    }

    async setupWebXR() {
        if (!this.scene) {
            throw new Error('Scene not initialized');
        }

        try {
            // Check WebXR support
            const xrSupported = await this.babylon.WebXRSessionManager.IsSessionSupportedAsync('immersive-ar');
            if (!xrSupported) {
                console.warn('⚠️ ARSystem: WebXR immersive-ar not supported');
                return;
            }

            // Create WebXR experience helper with camera background
            this.xrHelper = await this.scene.createDefaultXRExperienceAsync({
                uiOptions: {
                    sessionMode: 'immersive-ar',
                    referenceSpaceType: 'local-floor'
                },
                optionalFeatures: ['hit-test', 'anchors', 'plane-detection'],
                outputCanvasOptions: {
                    canvasElement: this.canvas,
                    newCanvasCssStyle: "position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                }
            });

            // Enable camera background for AR
            if (this.xrHelper.baseExperience) {
                // Set AR session to show camera background
                this.xrHelper.baseExperience.onInitialXRPoseSetObservable.add(() => {
                    console.log('🎥 ARSystem: XR pose initialized, camera background should be visible');
                });
            }

            console.log('🥽 ARSystem: WebXR initialized');
        } catch (error) {
            console.warn('⚠️ ARSystem: WebXR setup failed:', error);
        }
    }

    async startAR() {
        try {
            console.log('🚀 ARSystem: Starting AR session...');

            if (!this.isInitialized) {
                await this.initialize();
            }

            // Request camera permission first
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                console.log('📹 ARSystem: Camera permission granted');
                // Stop the stream as WebXR will handle it
                stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                console.error('❌ ARSystem: Camera permission denied:', error);
                throw new Error('Camera access is required for AR');
            }

            this.isActive = true;

            // Show AR canvas and controls
            this.canvas.style.display = 'block';
            this.controlsContainer.style.display = 'flex';

            // Set canvas background to transparent for camera passthrough
            this.canvas.style.background = 'transparent';

            if (this.xrHelper && this.xrHelper.baseExperience) {
                await this.xrHelper.baseExperience.enterXRAsync('immersive-ar', 'local-floor');
                console.log('🎥 ARSystem: WebXR AR session active with camera');
            } else {
                console.warn('⚠️ ARSystem: WebXR not available, using fallback');
                // Fallback: show a simple camera view
                await this.setupFallbackCamera();
            }

            console.log('✅ ARSystem: AR session started');
            return true;
        } catch (error) {
            console.error('❌ ARSystem: Failed to start AR:', error);
            await this.stopAR();
            throw error;
        }
    }

    async stopAR() {
        try {
            console.log('🛑 ARSystem: Stopping AR session...');

            this.isActive = false;

            // Hide AR canvas and controls
            if (this.canvas) {
                this.canvas.style.display = 'none';
            }
            if (this.controlsContainer) {
                this.controlsContainer.style.display = 'none';
            }

            if (this.xrHelper && this.xrHelper.baseExperience) {
                try {
                    await this.xrHelper.baseExperience.exitXRAsync();
                } catch (error) {
                    console.warn('⚠️ ARSystem: XR exit warning:', error);
                }
            }

            // Notify integration manager
            if (window.arIntegrationManager && window.arIntegrationManager.isActive()) {
                await window.arIntegrationManager.stopAR();
            }

            console.log('✅ ARSystem: AR session stopped');
        } catch (error) {
            console.error('❌ ARSystem: Error stopping AR:', error);
        }
    }

    async setupFallbackCamera() {
        try {
            console.log('📹 ARSystem: Setting up fallback camera view...');

            // Create video element for camera fallback
            const video = document.createElement('video');
            video.id = 'ar-fallback-camera';
            video.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                z-index: -1;
            `;
            video.autoplay = true;
            video.playsInline = true;
            video.muted = true;

            // Get camera stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            video.srcObject = stream;

            // Add video behind canvas
            this.canvas.parentNode.insertBefore(video, this.canvas);

            // Store for cleanup
            this.fallbackVideo = video;
            this.fallbackStream = stream;

            console.log('✅ ARSystem: Fallback camera view ready');

        } catch (error) {
            console.error('❌ ARSystem: Fallback camera setup failed:', error);
        }
    }

    forceCleanupUI() {
        try {
            console.log('🧹 ARSystem: Force cleanup UI...');

            // ONLY AR-specific elements, NOT general page elements
            const selectors = [
                '#ar-system-canvas',
                '#ar-system-controls',
                '#ar-control-panel',
                '#ar-data-overlay',
                '#ar-voice-indicator',
                '#ar-fallback-camera'
                // REMOVED: Wildcard selectors that can match page elements
            ];

            let removedCount = 0;
            let attempts = 0;

            // Multiple cleanup attempts to handle timing issues
            const performCleanup = () => {
                attempts++;
                console.log(`🧹 ARSystem: Cleanup attempt ${attempts}`);

                selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        // Skip the exit button itself to preserve its event listeners
                        if (el.id === 'exit-ar-btn') {
                            console.log('🚫 Skipping exit button to preserve handlers');
                            return;
                        }

                        // Aggressive hiding
                        el.style.cssText = `
                            display: none !important;
                            visibility: hidden !important;
                            opacity: 0 !important;
                            pointer-events: none !important;
                            z-index: -99999 !important;
                            position: absolute !important;
                            left: -99999px !important;
                            top: -99999px !important;
                        `;

                        // For non-exit-button elements, remove them completely
                        try {
                            el.remove();
                            removedCount++;
                        } catch (e) {
                            // Last resort: just hide it
                            console.warn('⚠️ Could not remove element:', el.id || el.className);
                        }
                    });
                });

                // Also clean up any WebXR sessions
                if (navigator.xr) {
                    try {
                        navigator.xr.requestSession = undefined;
                    } catch (e) {}
                }

                // Clear any AR-related global variables
                ['arSystem', 'arSystemExtension', 'arIntegrationManager', 'arInterfaceManager'].forEach(varName => {
                    if (window[varName] && typeof window[varName].cleanup === 'function') {
                        try {
                            window[varName].cleanup();
                        } catch (e) {}
                    }
                    window[varName] = null;
                });
            };

            // Immediate cleanup
            performCleanup();

            // Delayed cleanups to catch any elements created asynchronously
            setTimeout(performCleanup, 100);
            setTimeout(performCleanup, 500);
            setTimeout(performCleanup, 1000);

            console.log(`🗑️ ARSystem: Force cleanup removed/hid ${removedCount} elements`);
        } catch (error) {
            console.warn('⚠️ ARSystem: Force cleanup error:', error);
        }
    }

    async cleanup() {
        try {
            console.log('🧹 ARSystem: Starting cleanup...');

            // Clear exit handler interval
            if (this.exitHandlerInterval) {
                clearInterval(this.exitHandlerInterval);
                this.exitHandlerInterval = null;
            }

            // Stop AR session
            await this.stopAR();

            // Cleanup fallback camera
            if (this.fallbackStream) {
                this.fallbackStream.getTracks().forEach(track => track.stop());
                this.fallbackStream = null;
            }
            if (this.fallbackVideo) {
                this.fallbackVideo.remove();
                this.fallbackVideo = null;
            }

            // Dispose Babylon resources
            if (this.scene) {
                this.scene.dispose();
                this.scene = null;
            }

            if (this.engine) {
                this.engine.dispose();
                this.engine = null;
            }

            // Remove event listeners
            this.eventListeners.forEach((handler, event) => {
                window.removeEventListener(event, handler);
            });
            this.eventListeners.clear();

            // Execute cleanup handlers
            this.cleanupHandlers.forEach(handler => {
                try {
                    handler();
                } catch (error) {
                    console.warn('⚠️ ARSystem: Cleanup handler error:', error);
                }
            });
            this.cleanupHandlers = [];

            this.isInitialized = false;
            this.isActive = false;
            this.xrHelper = null;

            console.log('✅ ARSystem: Cleanup complete');
        } catch (error) {
            console.error('❌ ARSystem: Cleanup error:', error);
        }
    }

    async emergencyCleanup() {
        console.log('🚨 ARSystem: Emergency cleanup initiated');

        // Force stop everything
        this.isActive = false;
        this.isInitialized = false;

        // Remove canvas immediately
        const canvas = document.getElementById('ar-system-canvas');
        if (canvas) {
            canvas.remove();
        }

        // Force cleanup all Babylon resources
        try {
            if (this.engine) {
                this.engine.stopRenderLoop();
                this.engine.dispose();
            }
        } catch (error) {
            console.warn('⚠️ ARSystem: Emergency engine cleanup error:', error);
        }

        // Remove all event listeners
        this.eventListeners.forEach((handler, event) => {
            try {
                window.removeEventListener(event, handler);
            } catch (error) {
                console.warn('⚠️ ARSystem: Event listener removal error:', error);
            }
        });

        // Execute all cleanup handlers
        this.cleanupHandlers.forEach(handler => {
            try {
                handler();
            } catch (error) {
                console.warn('⚠️ ARSystem: Emergency handler error:', error);
            }
        });

        // Reset state
        this.babylon = null;
        this.engine = null;
        this.scene = null;
        this.xrHelper = null;
        this.canvas = null;
        this.eventListeners.clear();
        this.cleanupHandlers = [];

        console.log('✅ ARSystem: Emergency cleanup complete');
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isActive: this.isActive,
            hasCanvas: !!this.canvas,
            hasEngine: !!this.engine,
            hasScene: !!this.scene,
            hasXR: !!this.xrHelper
        };
    }
}

// Export for global access
window.ARSystem = ARSystem;