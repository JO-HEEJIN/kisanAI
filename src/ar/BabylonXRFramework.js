// Babylon.js WebXR Framework for NASA Farm Navigator AR
// Uses CDN loaded Babylon.js instead of ES modules

/**
 * Babylon.js WebXR Framework for NASA Farm Navigator AR
 * Provides enhanced WebXR compatibility and better AR experience
 */
class BabylonXRFramework {
    constructor() {
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.xrExperience = null;
        this.markers = [];
        this.hitTestResults = [];
        this.isInitialized = false;
        this.canvas = null;

        console.log('Initializing Babylon.js XR Framework...');
    }

    async initialize() {
        try {
            // Create canvas for Babylon.js
            this.createCanvas();

            // Initialize Babylon.js engine
            this.engine = new BABYLON.Engine(this.canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true,
                alpha: true
            });

            // Create scene
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.createDefaultCameraOrLight();

            // Setup lighting
            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
            light.intensity = 0.7;

            // Initialize WebXR with enhanced compatibility
            await this.initializeWebXR();

            // Setup resize handling
            window.addEventListener("resize", () => {
                this.engine.resize();
            });

            this.isInitialized = true;
            console.log('Babylon.js XR Framework initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Babylon.js XR Framework:', error);
            throw error;
        }
    }

    createCanvas() {
        // Remove existing AR canvas if present
        const existingCanvas = document.getElementById('babylon-ar-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }

        // Create new canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'babylon-ar-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            pointer-events: auto;
            touch-action: none;
        `;

        // Add to AR overlay or body
        const arOverlay = document.getElementById('ar-overlay');
        if (arOverlay) {
            arOverlay.appendChild(this.canvas);
        } else {
            document.body.appendChild(this.canvas);
        }
    }

    async initializeWebXR() {
        try {
            // Create WebXR experience with enhanced compatibility
            this.xrExperience = await this.scene.createDefaultXRExperienceAsync({
                floorMeshes: [],
                optionalFeatures: true,
                requiredFeatures: []
            });

            // Check if WebXR is supported
            if (!this.xrExperience.baseExperience) {
                throw new Error('WebXR not supported');
            }

            // Enable hit testing for AR placement
            if (this.xrExperience.featuresManager.getEnabledFeature(BABYLON.WebXRFeatureName.HIT_TEST)) {
                console.log('WebXR Hit Test enabled');
            }

            // Enable hand tracking if available
            if (this.xrExperience.featuresManager.getEnabledFeature(BABYLON.WebXRFeatureName.HAND_TRACKING)) {
                console.log('WebXR Hand Tracking enabled');
            }

            // Setup XR session event handlers
            this.setupXREventHandlers();

            console.log('WebXR experience created successfully');
            return true;

        } catch (error) {
            console.warn('WebXR initialization failed:', error);

            // Create fallback 3D scene for non-XR devices
            this.createFallbackScene();
            return false;
        }
    }

    createFallbackScene() {
        console.log('Creating fallback 3D scene...');

        // Create camera for non-XR mode
        this.camera = new BABYLON.FreeCamera("fallback-camera", new BABYLON.Vector3(0, 1.6, -3), this.scene);
        this.camera.attachControls(this.canvas, true);

        // Add some demo content
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, this.scene);
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.2);
        ground.material = groundMaterial;

        // Start render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    setupXREventHandlers() {
        if (!this.xrExperience) return;

        // XR session start
        this.xrExperience.baseExperience.onStateChangedObservable.add((state) => {
            switch (state) {
                case WebXRState.IN_XR:
                    console.log('Entered XR session');
                    this.onXRSessionStart();
                    break;
                case WebXRState.NOT_IN_XR:
                    console.log('Exited XR session');
                    this.onXRSessionEnd();
                    break;
            }
        });
    }

    onXRSessionStart() {
        // Start render loop for XR
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Enable AR-specific features
        this.enableARFeatures();
    }

    onXRSessionEnd() {
        // Cleanup AR features
        this.disableARFeatures();
    }

    enableARFeatures() {
        // Create reticle for AR placement
        this.createReticle();

        // Setup hit testing
        this.setupHitTesting();
    }

    disableARFeatures() {
        // Remove reticle and markers
        this.clearMarkers();
        if (this.reticle) {
            this.reticle.dispose();
            this.reticle = null;
        }
    }

    createReticle() {
        // Create ring geometry for AR reticle
        this.reticle = BABYLON.MeshBuilder.CreateTorus("reticle", {
            diameter: 0.3,
            thickness: 0.02
        }, this.scene);

        const reticleMaterial = new BABYLON.StandardMaterial("reticleMaterial", this.scene);
        reticleMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        reticleMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        this.reticle.material = reticleMaterial;
        this.reticle.rotationQuaternion = null;
        this.reticle.rotation.x = Math.PI / 2;
        this.reticle.isVisible = false;
    }

    setupHitTesting() {
        // Hit testing will be handled by Babylon.js WebXR system
        if (this.xrExperience && this.xrExperience.featuresManager) {
            const hitTest = this.xrExperience.featuresManager.getEnabledFeature(BABYLON.WebXRFeatureName.HIT_TEST);
            if (hitTest) {
                console.log('Hit testing is available');
            }
        }
    }

    async startXRSession() {
        try {
            if (!this.xrExperience) {
                throw new Error('WebXR experience not initialized');
            }

            // Enter immersive AR mode
            await this.xrExperience.baseExperience.enterXRAsync("immersive-ar", "local-floor");
            console.log('XR session started successfully');
            return true;

        } catch (error) {
            console.error('Failed to start XR session:', error);

            // Try fallback modes
            return this.tryFallbackModes();
        }
    }

    async tryFallbackModes() {
        try {
            // Try inline XR as fallback
            await this.xrExperience.baseExperience.enterXRAsync("inline", "viewer");
            console.log('Started inline XR session as fallback');
            return true;
        } catch (fallbackError) {
            console.warn('All XR modes failed:', fallbackError);
            return false;
        }
    }

    async endXRSession() {
        try {
            if (this.xrExperience && this.xrExperience.baseExperience) {
                await this.xrExperience.baseExperience.exitXRAsync();
                console.log('XR session ended');
            }
        } catch (error) {
            console.error('Error ending XR session:', error);
        }
    }

    // Plant marker system for agricultural AR
    addPlantMarker(position, plantData) {
        const marker = BABYLON.MeshBuilder.CreateCylinder("plantMarker", {
            diameterTop: 0.1,
            diameterBottom: 0.1,
            height: 0.2
        }, this.scene);

        const markerMaterial = new BABYLON.StandardMaterial("markerMaterial", this.scene);
        markerMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green for healthy plants
        marker.material = markerMaterial;

        marker.position = new BABYLON.Vector3(position.x, position.y, position.z);
        marker.plantData = plantData;

        this.markers.push(marker);
        return marker;
    }

    updateMarkerColor(marker, healthStatus) {
        if (marker && marker.material) {
            switch (healthStatus) {
                case 'healthy':
                    marker.material.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green
                    break;
                case 'warning':
                    marker.material.diffuseColor = new BABYLON.Color3(1, 1, 0); // Yellow
                    break;
                case 'critical':
                    marker.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
                    break;
            }
        }
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            marker.dispose();
        });
        this.markers = [];
    }

    // NASA data visualization in AR
    displayNASADataOverlay(position, nasaData) {
        // Create text plane for NASA data
        const plane = BABYLON.MeshBuilder.CreatePlane("nasaDataPlane", { size: 1 }, this.scene);

        // Position overlay
        plane.position = new BABYLON.Vector3(position.x, position.y + 0.5, position.z);
        plane.lookAt(this.scene.activeCamera.position);

        // Store NASA data
        plane.nasaData = nasaData;

        return plane;
    }

    // Utility methods
    getXRSupport() {
        return {
            webxr: !!this.xrExperience,
            immersiveAR: this.xrExperience?.baseExperience?.sessionManager?.isSessionSupportedAsync('immersive-ar'),
            hitTest: !!this.xrExperience?.featuresManager?.getEnabledFeature(BABYLON.WebXRFeatureName.HIT_TEST),
            handTracking: !!this.xrExperience?.featuresManager?.getEnabledFeature(BABYLON.WebXRFeatureName.HAND_TRACKING)
        };
    }

    isXRActive() {
        return this.xrExperience?.baseExperience?.state === WebXRState.IN_XR;
    }

    dispose() {
        try {
            // End XR session if active
            if (this.isXRActive()) {
                this.endXRSession();
            }

            // Clear markers
            this.clearMarkers();

            // Dispose scene
            if (this.scene) {
                this.scene.dispose();
            }

            // Dispose engine
            if (this.engine) {
                this.engine.dispose();
            }

            // Remove canvas
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }

            console.log('Babylon.js XR Framework disposed');

        } catch (error) {
            console.error('Error disposing Babylon.js XR Framework:', error);
        }
    }
}

// Import WebXRState for state checking
const WebXRState = {
    NOT_IN_XR: 0,
    ENTERING_XR: 1,
    IN_XR: 2,
    EXITING_XR: 3
};

export default BabylonXRFramework;