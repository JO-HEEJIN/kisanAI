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
        this.planeDetector = null;
        this.detectedPlanes = [];
        this.gpsCoords = { latitude: null, longitude: null };
        this.compassHeading = 0;
        this.analysisPoints = [];
        this.aiEngine = null;
        this.overlayDisplay = null;

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

        // Add to AR overlay or hide by default
        const arOverlay = document.getElementById('ar-overlay');
        if (arOverlay) {
            arOverlay.appendChild(this.canvas);
        } else {
            // Add to body but hide until AR tab is active
            document.body.appendChild(this.canvas);
            this.hideCanvasInOtherTabs();
        }
    }

    async initializeWebXR() {
        try {
            // Enhanced WebXR capability detection
            console.log('🔍 Checking WebXR availability...');
            console.log('- Protocol:', window.location.protocol);
            console.log('- navigator.xr:', !!navigator.xr);
            console.log('- HTTPS required for WebXR:', window.location.protocol === 'https:');

            if (!navigator.xr) {
                console.log('❌ WebXR not available - missing navigator.xr');
                console.log('🔒 Ensure you are using HTTPS: https://localhost:3443');
                this.createFallbackScene();
                return false;
            }

            // Check AR session support
            try {
                const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
                console.log('🥽 AR Session Support:', isARSupported);
                if (!isARSupported) {
                    console.log('❌ immersive-ar not supported on this device');
                }
            } catch (sessionError) {
                console.log('⚠️ Error checking AR session support:', sessionError.message);
            }

            // Create WebXR experience with proper AR features
            this.xrExperience = await this.scene.createDefaultXRExperienceAsync({
                uiOptions: {
                    sessionMode: 'immersive-ar',
                    referenceSpaceType: 'local-floor'
                },
                optionalFeatures: ['hit-test', 'plane-detection', 'anchors', 'light-estimation'],
                requiredFeatures: []
            });

            // Check if WebXR is supported
            if (!this.xrExperience || !this.xrExperience.baseExperience) {
                console.log('WebXR experience creation failed, using fallback');
                this.createFallbackScene();
                return false;
            }

            // Enable hit testing for AR placement
            if (this.xrExperience.featuresManager && this.xrExperience.featuresManager.getEnabledFeature(BABYLON.WebXRFeatureName.HIT_TEST)) {
                console.log('WebXR Hit Test enabled');
                this.setupAdvancedHitTesting();
            }

            // Enable plane detection for ground surface analysis
            if (this.xrExperience.featuresManager && this.xrExperience.featuresManager.getEnabledFeature(BABYLON.WebXRFeatureName.PLANE_DETECTION)) {
                console.log('WebXR Plane Detection enabled');
                this.setupPlaneDetection();
            }

            // Enable hand tracking if available
            if (this.xrExperience.featuresManager && this.xrExperience.featuresManager.getEnabledFeature(BABYLON.WebXRFeatureName.HAND_TRACKING)) {
                console.log('WebXR Hand Tracking enabled');
            }

            // Initialize GPS tracking for coordinate mapping
            await this.initializeGPSTracking();

            // Initialize AI engine for terrain/crop classification
            await this.initializeAIEngine();

            // Initialize AR overlay display system
            this.initializeOverlayDisplay();

            // Setup XR session event handlers
            this.setupXREventHandlers();

            console.log('WebXR experience created successfully');
            return true;

        } catch (error) {
            console.log('WebXR not available (expected on desktop), creating enhanced 3D mode:', error.message);

            // Create enhanced fallback 3D scene for non-XR devices
            this.createFallbackScene();
            return false;
        }
    }

    createFallbackScene() {
        console.log('Creating enhanced AR-like 3D scene for desktop...');

        // Create camera for non-XR mode with AR-like perspective
        this.camera = new BABYLON.FreeCamera("ar-camera", new BABYLON.Vector3(0, 1.2, -1), this.scene);
        this.camera.attachControls(this.canvas, true);

        // Set camera to look down at an angle (AR-like view)
        this.camera.setTarget(new BABYLON.Vector3(0, 0, 2));

        // Create transparent ground for AR-like effect
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, this.scene);
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.8, 0.1);
        groundMaterial.alpha = 0.3; // Semi-transparent for AR effect
        ground.material = groundMaterial;

        // Add demo markers for desktop testing
        this.addDemoMarkers();

        // Enable picking in non-XR mode
        this.setupDesktopInteraction();

        // Setup camera background for fallback mode
        setTimeout(() => {
            this.setupCameraBackground();
        }, 1000);

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

        // Setup camera background for AR
        this.setupCameraBackground();
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

    setupAdvancedHitTesting() {
        // Enhanced hit testing for soil analysis points
        if (this.xrExperience && this.xrExperience.featuresManager) {
            const hitTest = this.xrExperience.featuresManager.getEnabledFeature(BABYLON.WebXRFeatureName.HIT_TEST);
            if (hitTest) {
                // Set up continuous hit testing for ground plane
                hitTest.onHitTestResultObservable.add((results) => {
                    this.hitTestResults = results;
                    this.updateReticlePosition(results);
                });
                console.log('Advanced hit testing initialized');
            }
        }
    }

    setupPlaneDetection() {
        // Initialize plane detection for ground surface identification
        if (this.xrExperience && this.xrExperience.featuresManager) {
            this.planeDetector = this.xrExperience.featuresManager.getEnabledFeature(BABYLON.WebXRFeatureName.PLANE_DETECTION);
            if (this.planeDetector) {
                // Listen for detected planes
                this.planeDetector.onPlaneAddedObservable.add((plane) => {
                    this.onPlaneDetected(plane);
                });

                this.planeDetector.onPlaneRemovedObservable.add((plane) => {
                    this.onPlaneRemoved(plane);
                });

                console.log('Plane detection initialized');
            }
        }
    }

    async initializeGPSTracking() {
        // Initialize GPS for coordinate mapping
        try {
            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 60000
                    });
                });

                this.gpsCoords.latitude = position.coords.latitude;
                this.gpsCoords.longitude = position.coords.longitude;

                console.log(`GPS coordinates: ${this.gpsCoords.latitude}, ${this.gpsCoords.longitude}`);

                // Watch for GPS updates
                navigator.geolocation.watchPosition((pos) => {
                    this.gpsCoords.latitude = pos.coords.latitude;
                    this.gpsCoords.longitude = pos.coords.longitude;
                });
            }

            // Initialize compass heading if available
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientationabsolute', (event) => {
                    this.compassHeading = event.alpha || 0;
                });
            }

        } catch (error) {
            console.warn('GPS tracking initialization failed:', error);
        }
    }

    async initializeAIEngine() {
        // Initialize AI engine for intelligent terrain and crop classification
        try {
            if (typeof ARIntelligenceEngine !== 'undefined') {
                this.aiEngine = new ARIntelligenceEngine();
                await this.aiEngine.initialize();
                console.log('AI Engine initialized successfully');
            } else {
                console.warn('ARIntelligenceEngine not available, using basic classification');
            }
        } catch (error) {
            console.warn('AI Engine initialization failed:', error);
        }
    }

    initializeOverlayDisplay() {
        // Initialize AR overlay display system
        try {
            if (typeof AROverlayDisplay !== 'undefined') {
                this.overlayDisplay = new AROverlayDisplay(this.scene, this.camera);
                const success = this.overlayDisplay.initialize();
                if (success) {
                    console.log('AR Overlay Display initialized successfully');
                } else {
                    console.warn('AR Overlay Display initialization failed');
                }
            } else {
                console.warn('AROverlayDisplay not available');
            }
        } catch (error) {
            console.warn('Overlay Display initialization failed:', error);
        }
    }

    onPlaneDetected(plane) {
        // Handle detected ground planes
        this.detectedPlanes.push(plane);

        // Create visual representation of detected plane
        const planeMesh = BABYLON.MeshBuilder.CreateGround(`plane_${plane.id}`, {
            width: plane.polygon.length > 0 ? 2 : 1,
            height: plane.polygon.length > 0 ? 2 : 1
        }, this.scene);

        // Semi-transparent plane visualization
        const planeMaterial = new BABYLON.StandardMaterial(`planeMaterial_${plane.id}`, this.scene);
        planeMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        planeMaterial.alpha = 0.3;
        planeMesh.material = planeMaterial;

        // Position plane based on detected plane transform
        if (plane.transformationMatrix) {
            planeMesh.position = BABYLON.Vector3.FromArray(plane.transformationMatrix);
        }

        plane.mesh = planeMesh;
        console.log('Ground plane detected and visualized');
    }

    onPlaneRemoved(plane) {
        // Clean up removed planes
        const index = this.detectedPlanes.findIndex(p => p.id === plane.id);
        if (index !== -1) {
            if (plane.mesh) {
                plane.mesh.dispose();
            }
            this.detectedPlanes.splice(index, 1);
        }
    }

    updateReticlePosition(hitTestResults) {
        // Update reticle position based on hit test results
        if (this.reticle && hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            if (hit.transformationMatrix) {
                const matrix = BABYLON.Matrix.FromArray(hit.transformationMatrix);
                const position = new BABYLON.Vector3();
                matrix.decompose(undefined, undefined, position);

                this.reticle.position = position;
                this.reticle.isVisible = true;
            }
        } else if (this.reticle) {
            this.reticle.isVisible = false;
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

    // AR Analysis System - Core functionality for soil analysis
    async performARAnalysis(screenX, screenY) {
        try {
            // Convert screen coordinates to world coordinates using hit testing
            const worldPosition = await this.screenToWorldPosition(screenX, screenY);
            if (!worldPosition) {
                throw new Error('Unable to determine world position');
            }

            // Convert world position to GPS coordinates
            const gpsCoords = this.worldToGPSCoordinates(worldPosition);

            // Fetch NASA data for this location
            const nasaData = await this.fetchNASADataForLocation(gpsCoords);

            // Perform AI-powered terrain classification
            const terrainType = await this.classifyTerrain(nasaData);

            // Perform AI-powered crop classification if applicable
            let cropInfo = null;
            if (this.aiEngine && this.aiEngine.isInitialized && terrainType === 'cropland') {
                try {
                    cropInfo = await this.aiEngine.classifyCrop(nasaData, terrainType);
                } catch (error) {
                    console.warn('Crop classification failed:', error);
                }
            }

            // Create Pixel Hunt compatible data format
            const analysisResult = {
                pixel: [screenX, screenY],
                worldPosition: {
                    x: worldPosition.x,
                    y: worldPosition.y,
                    z: worldPosition.z
                },
                gpsCoords: gpsCoords,
                moisture: nasaData.soilMoisture || 25.0,
                soilMoisture: nasaData.soilMoisture || 25.0, // For mobile display compatibility
                ndvi: nasaData.ndvi || 0.45,
                temperature: nasaData.temperature || 22.0,
                x: Math.round(screenX), // For mobile display
                y: Math.round(screenY), // For mobile display
                type: terrainType,
                crop: cropInfo?.crop || 'none',
                cropConfidence: cropInfo?.confidence || 0,
                health: this.calculateHealthScore(nasaData),
                index: this.analysisPoints.length,
                timestamp: Date.now(),
                aiClassification: {
                    terrain: terrainType,
                    crop: cropInfo,
                    source: this.aiEngine?.isInitialized ? 'AI' : 'rule-based'
                }
            };

            // Store analysis point
            this.analysisPoints.push(analysisResult);

            // Create visual marker
            this.createAnalysisMarker(worldPosition, analysisResult);

            // Display result in overlay if available
            if (this.overlayDisplay) {
                this.overlayDisplay.displayAnalysisResult(analysisResult);
                this.overlayDisplay.createWorldSpaceOverlay(analysisResult);
            }

            console.log('AR Analysis completed:', analysisResult);
            return analysisResult;

        } catch (error) {
            console.error('AR Analysis failed:', error);
            return null;
        }
    }

    async screenToWorldPosition(screenX, screenY) {
        // Use WebXR hit testing to convert screen coordinates to world position
        if (this.xrExperience && this.isXRActive()) {
            // Try WebXR hit testing first
            const ray = this.scene.createPickingRay(screenX, screenY, BABYLON.Matrix.Identity(), this.scene.activeCamera);

            // Use hit test results if available
            if (this.hitTestResults.length > 0) {
                const hit = this.hitTestResults[0];
                if (hit.transformationMatrix) {
                    const matrix = BABYLON.Matrix.FromArray(hit.transformationMatrix);
                    const position = new BABYLON.Vector3();
                    matrix.decompose(undefined, undefined, position);
                    return position;
                }
            }

            // Fallback to ray casting against detected planes
            for (const plane of this.detectedPlanes) {
                if (plane.mesh) {
                    const pickResult = this.scene.pickWithRay(ray, (mesh) => mesh === plane.mesh);
                    if (pickResult.hit) {
                        return pickResult.pickedPoint;
                    }
                }
            }
        }

        // Desktop/non-XR fallback: Create synthetic world position
        console.log('Using fallback world position for desktop mode');

        // Normalize screen coordinates to -1 to 1 range
        const normalizedX = (screenX / window.innerWidth) * 2 - 1;
        const normalizedY = -((screenY / window.innerHeight) * 2 - 1);

        // Create a position on an imaginary ground plane
        return new BABYLON.Vector3(
            normalizedX * 5,  // Scale to reasonable world space
            0,                // Ground level
            normalizedY * 5   // Depth
        );
    }

    worldToGPSCoordinates(worldPosition) {
        // Convert AR world coordinates to GPS coordinates
        // This is a simplified conversion - in production, you'd use more sophisticated mapping

        if (!this.gpsCoords.latitude || !this.gpsCoords.longitude) {
            console.warn('GPS coordinates not available, using defaults');
            return { latitude: 37.7749, longitude: -122.4194 }; // San Francisco default
        }

        // Calculate offset based on world position and compass heading
        // Assuming 1 meter in AR space = ~0.00001 degrees (approximate)
        const latOffset = (worldPosition.z * Math.cos(this.compassHeading * Math.PI / 180)) * 0.00001;
        const lonOffset = (worldPosition.x * Math.sin(this.compassHeading * Math.PI / 180)) * 0.00001;

        return {
            latitude: this.gpsCoords.latitude + latOffset,
            longitude: this.gpsCoords.longitude + lonOffset
        };
    }

    async fetchNASADataForLocation(gpsCoords) {
        // Fetch NASA data for the specified GPS coordinates
        try {
            console.log(`🛰️ Fetching NASA data for: ${gpsCoords.latitude}, ${gpsCoords.longitude}`);

            // Use NASA proxy server endpoints
            const baseUrl = 'http://localhost:3001';

            // Fetch data from multiple NASA endpoints in parallel
            const [smapResponse, modisResponse] = await Promise.allSettled([
                fetch(`${baseUrl}/api/smap/soil-moisture?lat=${gpsCoords.latitude}&lon=${gpsCoords.longitude}`),
                fetch(`${baseUrl}/api/modis/ndvi?lat=${gpsCoords.latitude}&lon=${gpsCoords.longitude}`)
            ]);

            let soilMoisture = 32; // default
            let ndvi = 0.65; // default
            let temperature = 25; // default

            // Process SMAP soil moisture data
            if (smapResponse.status === 'fulfilled' && smapResponse.value.ok) {
                const smapData = await smapResponse.value.json();
                soilMoisture = smapData.soilMoisture || soilMoisture;
                console.log('✅ SMAP data loaded:', soilMoisture);
            }

            // Process MODIS NDVI data
            if (modisResponse.status === 'fulfilled' && modisResponse.value.ok) {
                const modisData = await modisResponse.value.json();
                ndvi = modisData.ndvi || ndvi;
                temperature = modisData.temperature || temperature;
                console.log('✅ MODIS data loaded:', ndvi, temperature);
            }

            return {
                soilMoisture: soilMoisture,
                ndvi: ndvi,
                temperature: temperature,
                precipitation: 0,
                source: 'NASA Proxy Server'
            };

        } catch (error) {
            console.warn('NASA data fetch failed, using synthetic data:', error);

            // Generate realistic synthetic data based on location
            return {
                soilMoisture: 20 + Math.random() * 40, // 20-60%
                ndvi: 0.2 + Math.random() * 0.6, // 0.2-0.8
                temperature: 15 + Math.random() * 25, // 15-40°C
                precipitation: Math.random() * 10,
                source: 'Synthetic'
            };
        }
    }

    async classifyTerrain(nasaData) {
        // Classify terrain type using AI engine or fallback to rule-based
        try {
            if (this.aiEngine && this.aiEngine.isInitialized) {
                const result = await this.aiEngine.classifyTerrain(nasaData);
                return result.type;
            }
        } catch (error) {
            console.warn('AI terrain classification failed:', error);
        }

        // Fallback to rule-based classification
        const { ndvi, soilMoisture } = nasaData;

        if (ndvi > 0.6 && soilMoisture > 30) {
            return 'cropland';
        } else if (ndvi > 0.4 && soilMoisture > 20) {
            return 'pasture';
        } else if (ndvi > 0.3) {
            return 'grassland';
        } else if (soilMoisture < 15) {
            return 'barren';
        } else {
            return 'mixed';
        }
    }

    calculateHealthScore(nasaData) {
        // Calculate overall health score (0-100)
        const { ndvi, soilMoisture, temperature } = nasaData;

        let score = 0;

        // NDVI contribution (40%)
        score += Math.min(ndvi * 100, 40);

        // Soil moisture contribution (40%)
        if (soilMoisture >= 20 && soilMoisture <= 60) {
            score += 40 * (1 - Math.abs(soilMoisture - 40) / 40);
        }

        // Temperature contribution (20%)
        if (temperature >= 15 && temperature <= 30) {
            score += 20 * (1 - Math.abs(temperature - 22.5) / 15);
        }

        return Math.round(Math.max(0, Math.min(100, score)));
    }

    createAnalysisMarker(worldPosition, analysisData) {
        // Create visual marker for analysis point
        const marker = BABYLON.MeshBuilder.CreateSphere(`analysis_${analysisData.index}`, {
            diameter: 0.1
        }, this.scene);

        marker.position = worldPosition;

        // Color based on health score
        const markerMaterial = new BABYLON.StandardMaterial(`analysisMaterial_${analysisData.index}`, this.scene);
        if (analysisData.health > 70) {
            markerMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green
        } else if (analysisData.health > 40) {
            markerMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0); // Yellow
        } else {
            markerMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
        }

        marker.material = markerMaterial;
        marker.analysisData = analysisData;

        this.markers.push(marker);
        return marker;
    }

    setupCameraBackground() {
        // Setup camera background for AR view
        console.log('🎥 Setting up camera background...');

        return new Promise((resolve, reject) => {
            try {
                const isMobile = /Mobi|Android/i.test(navigator.userAgent);
                console.log('📱 Mobile device:', isMobile);

                if (this.xrExperience && this.xrExperience.baseExperience && this.isXRActive()) {
                    const sessionManager = this.xrExperience.baseExperience.sessionManager;

                    if (sessionManager && sessionManager.session) {
                        // WebXR automatically handles camera background
                        console.log('✅ WebXR camera background is active');

                        // For passthrough AR, ensure environment blend mode is set
                        const session = sessionManager.session;
                        if (session.environmentBlendMode) {
                            console.log('🌍 Environment blend mode:', session.environmentBlendMode);
                        }
                        resolve();
                        return;
                    }
                }

                // For mobile devices or fallback mode, setup camera preview
                if (isMobile || !this.isXRActive()) {
                    console.log('📱 Setting up mobile/fallback camera preview...');
                    this.setupMobileCameraPreview()
                        .then(() => {
                            console.log('✅ Mobile camera preview setup completed');
                            resolve();
                        })
                        .catch(error => {
                            console.warn('⚠️ Mobile camera setup failed, using desktop fallback:', error);
                            this.setupDesktopCameraPreview();
                            resolve(); // Still resolve, don't fail completely
                        });
                } else {
                    // Desktop fallback
                    console.log('🖥️ Setting up desktop camera preview...');
                    this.setupDesktopCameraPreview();
                    resolve();
                }

            } catch (error) {
                console.warn('⚠️ Camera background setup failed:', error);
                this.createPlaceholderBackground();
                resolve(); // Still resolve, don't fail the whole process
            }
        });
    }

    async setupDesktopCameraPreview() {
        // Desktop fallback: show camera preview
        console.log('Attempting to access camera...');

        try {
            // Check if camera is already running
            if (this.videoElement && this.videoElement.srcObject) {
                console.log('Camera already active');
                return;
            }

            // Request camera access with multiple fallback options
            let stream;
            try {
                // Try back camera first
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                console.log('✅ Back camera accessed');
            } catch (backCameraError) {
                console.log('Back camera failed, trying front camera...');
                // Fallback to front camera
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                console.log('✅ Front camera accessed');
            }

            // Create video element for camera preview
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = stream;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;
            this.videoElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                z-index: 999;
                background: #000;
            `;

            // Ensure video starts playing
            this.videoElement.addEventListener('loadedmetadata', () => {
                console.log('✅ Camera video loaded');
                this.videoElement.play().catch(e => console.warn('Video play failed:', e));
            });

            // Add to body for maximum visibility
            document.body.appendChild(this.videoElement);

            // Create super-visible exit button directly on the video
            this.createSuperExitButton();

            // Move canvas above video
            if (this.canvas) {
                this.canvas.style.zIndex = '1000';
                this.canvas.style.background = 'transparent';
            }

            // Also add to AR overlay if it exists
            const arOverlay = document.getElementById('ar-overlay');
            if (arOverlay) {
                arOverlay.style.display = 'block';
                arOverlay.appendChild(this.videoElement.cloneNode());
            }

            console.log('✅ Desktop camera preview active and visible');

        } catch (error) {
            console.error('❌ Camera access failed:', error);

            // Show detailed error message
            alert(`카메라 접근 실패: ${error.message}\n\n브라우저에서 카메라 권한을 허용해주세요.`);

            // Create a placeholder background
            this.createPlaceholderBackground();
        }
    }

    createPlaceholderBackground() {
        // Create a farm field placeholder background
        const background = document.createElement('div');
        background.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #228B22 100%);
            z-index: -1;
        `;

        const arOverlay = document.getElementById('ar-overlay');
        if (arOverlay) {
            arOverlay.appendChild(background);
        } else if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.insertBefore(background, this.canvas);
        }

        console.log('Placeholder farm background created');
    }

    // Desktop/non-XR interaction methods
    addDemoMarkers() {
        // Add some sample farm plots for desktop testing
        const demoPlots = [
            { position: new BABYLON.Vector3(-2, 0.1, 2), type: 'wheat', health: 85 },
            { position: new BABYLON.Vector3(2, 0.1, 2), type: 'corn', health: 72 },
            { position: new BABYLON.Vector3(-2, 0.1, -2), type: 'soybean', health: 91 },
            { position: new BABYLON.Vector3(2, 0.1, -2), type: 'pasture', health: 67 }
        ];

        demoPlots.forEach((plot, index) => {
            const marker = BABYLON.MeshBuilder.CreateCylinder(`demo_${index}`, {
                diameterTop: 0.3,
                diameterBottom: 0.3,
                height: 0.1
            }, this.scene);

            marker.position = plot.position;

            const material = new BABYLON.StandardMaterial(`demoMaterial_${index}`, this.scene);
            if (plot.health > 80) {
                material.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green - healthy
            } else if (plot.health > 60) {
                material.diffuseColor = new BABYLON.Color3(1, 1, 0); // Yellow - moderate
            } else {
                material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red - poor
            }

            marker.material = material;
            marker.demoData = plot;
        });

        console.log('Demo farm markers added for desktop testing');
    }

    setupDesktopInteraction() {
        // Add click/touch handling for desktop mode
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.pickInfo.hit && pointerInfo.event.type === 'pointerdown') {
                const pickedPoint = pointerInfo.pickInfo.pickedPoint;
                if (pickedPoint) {
                    console.log('Desktop click detected at:', pickedPoint);

                    // Convert Babylon coordinates to screen coordinates
                    const screenCoords = BABYLON.Vector3.Project(
                        pickedPoint,
                        BABYLON.Matrix.Identity(),
                        this.scene.getTransformMatrix(),
                        this.camera.viewport.toGlobal(
                            this.engine.getRenderWidth(),
                            this.engine.getRenderHeight()
                        )
                    );

                    // Trigger AR analysis
                    this.performARAnalysis(screenCoords.x, screenCoords.y);
                }
            }
        });

        console.log('Desktop interaction enabled - click on the ground to analyze');
    }

    hideCanvasInOtherTabs() {
        // Hide AR canvas when not in AR tab
        const observer = new MutationObserver(() => {
            const arTab = document.getElementById('arChatGPTTab');
            const isARTabActive = arTab && arTab.classList.contains('active');

            if (this.canvas) {
                this.canvas.style.display = isARTabActive ? 'block' : 'none';
            }
        });

        // Observe tab changes
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            observer.observe(mainContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        }

        // Initial hide if not in AR tab
        const arTab = document.getElementById('arChatGPTTab');
        if (!arTab || !arTab.classList.contains('active')) {
            if (this.canvas) {
                this.canvas.style.display = 'none';
            }
        }
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

            // Dispose AI engine
            if (this.aiEngine) {
                this.aiEngine.dispose();
            }

            // Dispose overlay display
            if (this.overlayDisplay) {
                this.overlayDisplay.dispose();
            }

            // Dispose scene
            if (this.scene) {
                this.scene.dispose();
            }

            // Dispose engine
            if (this.engine) {
                this.engine.dispose();
            }

            // Stop camera stream
            if (this.videoElement && this.videoElement.srcObject) {
                const tracks = this.videoElement.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                this.videoElement.srcObject = null;
                if (this.videoElement.parentNode) {
                    this.videoElement.parentNode.removeChild(this.videoElement);
                }
            }

            // Remove super exit button
            if (this.superExitBtn && this.superExitBtn.parentNode) {
                this.superExitBtn.parentNode.removeChild(this.superExitBtn);
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

    createSuperExitButton() {
        // Remove any existing super exit button
        const existingBtn = document.getElementById('super-exit-btn');
        if (existingBtn) {
            existingBtn.remove();
        }

        // Create a super-visible exit button
        const superExitBtn = document.createElement('button');
        superExitBtn.id = 'super-exit-btn';
        superExitBtn.innerHTML = '✕ Exit AR';

        superExitBtn.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: #ff3b30 !important;
            color: white !important;
            border: 3px solid white !important;
            padding: 20px 30px !important;
            border-radius: 12px !important;
            font-size: 18px !important;
            font-weight: bold !important;
            z-index: 99999999 !important;
            cursor: pointer !important;
            box-shadow: 0 6px 20px rgba(255, 59, 48, 0.8) !important;
            min-width: 120px !important;
            touch-action: manipulation !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            transform: scale(1) !important;
            transition: transform 0.1s ease !important;
        `;

        // Add hover/touch effects
        superExitBtn.addEventListener('mousedown', () => {
            superExitBtn.style.transform = 'scale(0.95) !important';
        });
        superExitBtn.addEventListener('mouseup', () => {
            superExitBtn.style.transform = 'scale(1) !important';
        });

        // Add exit functionality
        const exitHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚪 Super exit button triggered');

            // Multiple exit strategies to ensure it works
            this.forceExitAR();
        };

        superExitBtn.addEventListener('click', exitHandler);
        superExitBtn.addEventListener('touchstart', exitHandler);
        superExitBtn.addEventListener('touchend', (e) => e.preventDefault());

        // Add to body with highest priority
        document.body.appendChild(superExitBtn);

        console.log('✅ Super exit button created and added');

        // Store reference for cleanup
        this.superExitBtn = superExitBtn;
    }

    forceExitAR() {
        console.log('🚨 Force exiting AR mode...');

        try {
            // 1. Remove AR overlay from DOM
            if (this.overlayDisplay) {
                this.overlayDisplay.detachFromDOM();
                console.log('📊 AR Soil Analysis overlay removed');
            }

            // 2. Stop all camera streams
            if (this.videoElement && this.videoElement.srcObject) {
                const tracks = this.videoElement.srcObject.getTracks();
                tracks.forEach(track => {
                    track.stop();
                    console.log('🎥 Camera track stopped');
                });
                this.videoElement.srcObject = null;
            }

            // 3. Remove video element
            if (this.videoElement && this.videoElement.parentNode) {
                this.videoElement.parentNode.removeChild(this.videoElement);
                console.log('📹 Video element removed');
            }

            // 3. Remove super exit button
            if (this.superExitBtn && this.superExitBtn.parentNode) {
                this.superExitBtn.parentNode.removeChild(this.superExitBtn);
                console.log('🚪 Super exit button removed');
            }

            // Remove mobile exit button
            if (this.mobileExitBtn && this.mobileExitBtn.parentNode) {
                this.mobileExitBtn.parentNode.removeChild(this.mobileExitBtn);
                console.log('📱 Mobile exit button removed');
            }

            // Remove any exit buttons by ID
            const mobileExitBtn = document.getElementById('mobile-exit-btn');
            if (mobileExitBtn) {
                mobileExitBtn.remove();
                console.log('📱 Mobile exit button removed by ID');
            }

            // 4. Hide AR overlay
            const arOverlay = document.getElementById('ar-overlay');
            if (arOverlay) {
                arOverlay.style.display = 'none';
                arOverlay.innerHTML = '';
                console.log('🎭 AR overlay hidden');
            }

            // 5. Stop XR session
            if (this.xrExperience && this.xrExperience.baseExperience) {
                try {
                    this.xrExperience.baseExperience.exitXRAsync();
                    console.log('🔄 XR session ended');
                } catch (xrError) {
                    console.warn('XR session end error:', xrError);
                }
            }

            // 6. Dispose engine
            if (this.engine) {
                this.engine.dispose();
                console.log('🏭 Engine disposed');
            }

            // 7. Remove canvas
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
                console.log('🎨 Canvas removed');
            }

            // 8. Restore main app UI
            const tabContent = document.getElementById('tabContent');
            if (tabContent) {
                tabContent.style.display = 'block';
                console.log('🔄 Main tab content restored');
            }

            // Hide any AR containers that might still be visible
            const arContainer = document.getElementById('ar-chat-container');
            if (arContainer) {
                arContainer.style.display = 'none';
                console.log('📱 AR chat container hidden');
            }

            // 9. Notify other systems
            if (window.arChatGPTCore) {
                window.arChatGPTCore.exitARMode();
                console.log('📢 AR ChatGPT Core notified');
            }

            // 10. Force reload location if nothing else works
            setTimeout(() => {
                if (document.getElementById('ar-overlay') &&
                    document.getElementById('ar-overlay').style.display !== 'none') {
                    console.log('🔄 Force reloading page...');
                    window.location.reload();
                }
            }, 2000);

            console.log('✅ Force exit completed');

        } catch (error) {
            console.error('❌ Force exit failed:', error);
            // Last resort: reload page
            window.location.reload();
        }
    }

    /**
     * Setup mobile camera preview for AR fallback mode
     */
    async setupMobileCameraPreview() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('📱 Initializing mobile camera preview...');

                // Request camera access with mobile-optimized constraints
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'environment' }, // Prefer back camera
                        width: { ideal: 1280, max: 1920 },
                        height: { ideal: 720, max: 1080 },
                        frameRate: { ideal: 30, max: 60 }
                    },
                    audio: false
                });

                console.log('✅ Camera stream obtained');

                // Create or find video element for camera preview
                let videoElement = document.getElementById('ar-camera-video');
                if (!videoElement) {
                    videoElement = document.createElement('video');
                    videoElement.id = 'ar-camera-video';
                    videoElement.style.cssText = `
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        object-fit: cover !important;
                        z-index: 9998 !important;
                        background: #000 !important;
                        pointer-events: auto !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        display: block !important;
                    `;
                    videoElement.autoplay = true;
                    videoElement.muted = true;
                    videoElement.playsInline = true; // Important for iOS
                    document.body.appendChild(videoElement);
                }

                // Set stream to video element
                videoElement.srcObject = stream;
                console.log('📹 Video element created and stream assigned');
                console.log('Video element details:', {
                    id: videoElement.id,
                    width: videoElement.clientWidth,
                    height: videoElement.clientHeight,
                    zIndex: videoElement.style.zIndex,
                    position: videoElement.style.position,
                    stream: !!stream
                });

                // Force video to be visible
                videoElement.style.display = 'block';
                videoElement.style.visibility = 'visible';

                // Multiple attempts to start video playback
                const attemptVideoPlay = async (attemptNumber = 1) => {
                    try {
                        console.log(`📹 Attempting video play (attempt ${attemptNumber})`);
                        await videoElement.play();
                        console.log('✅ Mobile camera preview active');
                        this.cameraStream = stream; // Store for cleanup

                        // Verify video is actually playing
                        setTimeout(() => {
                            console.log('Video playback verification:', {
                                paused: videoElement.paused,
                                currentTime: videoElement.currentTime,
                                readyState: videoElement.readyState,
                                videoWidth: videoElement.videoWidth,
                                videoHeight: videoElement.videoHeight
                            });
                        }, 1000);

                        // Create mobile-optimized exit button after video starts
                        this.createMobileExitButton();

                        // Setup mobile touch interaction
                        this.setupMobileTouchInteraction(videoElement);

                        resolve();
                    } catch (error) {
                        console.error(`❌ Video play attempt ${attemptNumber} failed:`, error);
                        if (attemptNumber < 3) {
                            setTimeout(() => attemptVideoPlay(attemptNumber + 1), 500);
                        } else {
                            reject(error);
                        }
                    }
                };

                // Wait for video to load with timeout
                const metadataTimeout = setTimeout(() => {
                    console.warn('⏰ Video metadata loading timeout, forcing play attempt');
                    attemptVideoPlay();
                }, 3000);

                videoElement.onloadedmetadata = () => {
                    clearTimeout(metadataTimeout);
                    console.log('📹 Video metadata loaded successfully');
                    console.log('Video dimensions:', {
                        videoWidth: videoElement.videoWidth,
                        videoHeight: videoElement.videoHeight,
                        duration: videoElement.duration
                    });
                    attemptVideoPlay();
                };

                // Additional event listeners for debugging
                videoElement.oncanplay = () => {
                    console.log('📹 Video can start playing');
                };

                videoElement.onplaying = () => {
                    console.log('📹 Video is now playing');
                };

                videoElement.onstalled = () => {
                    console.warn('⚠️ Video playback stalled');
                };

                // Start immediate play attempt for some browsers
                setTimeout(() => {
                    if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
                        console.log('📹 Video ready for immediate play');
                        attemptVideoPlay();
                    }
                }, 100);

                // Handle video errors
                videoElement.onerror = (error) => {
                    console.error('❌ Video element error:', error);
                    reject(error);
                };

            } catch (error) {
                console.error('❌ Mobile camera preview setup failed:', error);
                if (error.name === 'NotAllowedError') {
                    reject(new Error('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'));
                } else if (error.name === 'NotFoundError') {
                    reject(new Error('카메라를 찾을 수 없습니다. 장치에 카메라가 있는지 확인해주세요.'));
                } else {
                    reject(new Error('카메라 초기화 실패: ' + error.message));
                }
            }
        });
    }

    /**
     * Create mobile-optimized exit button
     */
    createMobileExitButton() {
        // Remove any existing mobile exit button
        const existingBtn = document.getElementById('mobile-exit-btn');
        if (existingBtn) {
            existingBtn.remove();
        }

        console.log('📱 Creating mobile-optimized exit button...');

        const exitBtn = document.createElement('button');
        exitBtn.id = 'mobile-exit-btn';
        exitBtn.innerHTML = '✕';

        exitBtn.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            width: 60px !important;
            height: 60px !important;
            background: rgba(255, 59, 48, 0.9) !important;
            color: white !important;
            border: 3px solid rgba(255, 255, 255, 0.8) !important;
            border-radius: 50% !important;
            font-size: 24px !important;
            font-weight: bold !important;
            z-index: 999999 !important;
            cursor: pointer !important;
            box-shadow: 0 8px 20px rgba(255, 59, 48, 0.6) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            touch-action: manipulation !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            -webkit-tap-highlight-color: transparent !important;
            line-height: 1 !important;
            transition: all 0.2s ease !important;
        `;

        // Mobile-optimized event handlers
        const exitHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Mobile exit button triggered');

            // Visual feedback
            exitBtn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                exitBtn.style.transform = 'scale(1)';
            }, 100);

            // Force exit AR
            this.forceExitAR();
        };

        // Add multiple event types for maximum compatibility
        exitBtn.addEventListener('click', exitHandler);
        exitBtn.addEventListener('touchstart', exitHandler);
        exitBtn.addEventListener('touchend', (e) => e.preventDefault());

        // Add hover effects for visual feedback
        exitBtn.addEventListener('touchstart', () => {
            exitBtn.style.background = 'rgba(255, 59, 48, 1)';
            exitBtn.style.transform = 'scale(1.1)';
        });

        exitBtn.addEventListener('touchend', () => {
            setTimeout(() => {
                exitBtn.style.background = 'rgba(255, 59, 48, 0.9)';
                exitBtn.style.transform = 'scale(1)';
            }, 100);
        });

        // Add to body
        document.body.appendChild(exitBtn);

        console.log('✅ Mobile exit button created and added');
        this.mobileExitBtn = exitBtn;
    }

    /**
     * Setup mobile touch interaction for AR analysis
     */
    setupMobileTouchInteraction(videoElement) {
        console.log('📱 Setting up mobile touch interaction...');

        // Remove existing touch listeners
        if (this.mobileTouchHandler) {
            videoElement.removeEventListener('touchstart', this.mobileTouchHandler);
        }

        // Create mobile touch handler
        this.mobileTouchHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.touches && e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = videoElement.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                console.log(`📱 Touch detected at: ${x}, ${y}`);

                // Visual feedback for touch
                this.showTouchFeedback(touch.clientX, touch.clientY);

                // Trigger AR analysis
                this.handleMobileARAnalysis(x, y);
            }
        };

        // Add touch event listeners
        videoElement.addEventListener('touchstart', this.mobileTouchHandler, { passive: false });

        // Also handle regular clicks for testing
        videoElement.addEventListener('click', (e) => {
            e.preventDefault();
            const rect = videoElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            console.log(`🖱️ Click detected at: ${x}, ${y}`);
            this.showTouchFeedback(e.clientX, e.clientY);
            this.handleMobileARAnalysis(x, y);
        });

        console.log('✅ Mobile touch interaction setup completed');
    }

    /**
     * Show visual feedback for touch
     */
    showTouchFeedback(screenX, screenY) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed !important;
            left: ${screenX - 25}px !important;
            top: ${screenY - 25}px !important;
            width: 50px !important;
            height: 50px !important;
            border: 3px solid #00ff88 !important;
            border-radius: 50% !important;
            background: rgba(0, 255, 136, 0.2) !important;
            z-index: 99999 !important;
            pointer-events: none !important;
            animation: pulse 0.6s ease-out !important;
        `;

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(feedback);

        // Remove after animation
        setTimeout(() => {
            feedback.remove();
            style.remove();
        }, 600);
    }

    /**
     * Handle mobile AR analysis
     */
    async handleMobileARAnalysis(x, y) {
        try {
            console.log(`🔍 Starting mobile AR analysis at: ${x}, ${y}`);

            // Show loading indicator
            this.showMobileLoadingIndicator();

            // Check if we have the overlay display system
            if (this.overlayDisplay && typeof this.overlayDisplay.handleScreenTouch === 'function') {
                await this.overlayDisplay.handleScreenTouch(x, y);
            } else if (window.babylonXRFramework && window.babylonXRFramework.performARAnalysis) {
                const result = await window.babylonXRFramework.performARAnalysis(x, y);
                if (result) {
                    this.displayMobileAnalysisResult(result);
                }
            } else {
                // Fallback: simulate AR analysis
                const mockResult = this.generateMockAnalysisResult(x, y);
                this.displayMobileAnalysisResult(mockResult);
            }

        } catch (error) {
            console.error('❌ Mobile AR analysis failed:', error);
            this.showMobileErrorMessage('AR 분석 실패: ' + error.message);
        } finally {
            this.hideMobileLoadingIndicator();
        }
    }

    /**
     * Show mobile loading indicator
     */
    showMobileLoadingIndicator() {
        const existing = document.getElementById('mobile-loading');
        if (existing) existing.remove();

        const loading = document.createElement('div');
        loading.id = 'mobile-loading';
        loading.innerHTML = '🔍 분석 중...';
        loading.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: rgba(0, 0, 0, 0.8) !important;
            color: white !important;
            padding: 20px 30px !important;
            border-radius: 10px !important;
            font-size: 18px !important;
            z-index: 999999 !important;
            border: 2px solid #00ff88 !important;
        `;

        document.body.appendChild(loading);
    }

    /**
     * Hide mobile loading indicator
     */
    hideMobileLoadingIndicator() {
        const loading = document.getElementById('mobile-loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * Display mobile analysis result
     */
    displayMobileAnalysisResult(result) {
        const existing = document.getElementById('mobile-result');
        if (existing) existing.remove();

        const resultDiv = document.createElement('div');
        resultDiv.id = 'mobile-result';
        resultDiv.style.cssText = `
            position: fixed !important;
            bottom: 80px !important;
            left: 20px !important;
            right: 20px !important;
            background: rgba(0, 0, 0, 0.9) !important;
            color: white !important;
            padding: 20px !important;
            border-radius: 15px !important;
            border: 2px solid #00ff88 !important;
            z-index: 999999 !important;
            max-height: 200px !important;
            overflow-y: auto !important;
            font-size: 16px !important;
        `;

        resultDiv.innerHTML = `
            <button onclick="this.parentElement.remove()" style="
                position: absolute;
                top: 10px;
                right: 15px;
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
            ">×</button>
            <h3 style="color: #00ff88; margin: 0 0 15px 0;">🌱 AR 토양 분석</h3>
            <div><strong>토양 수분:</strong> ${result.soilMoisture || '측정 중'}%</div>
            <div><strong>식생 지수:</strong> ${result.ndvi || '측정 중'}</div>
            <div><strong>온도:</strong> ${result.temperature || '측정 중'}°C</div>
            <div style="margin-top: 10px; font-size: 14px; color: #ccc;">
                터치한 위치: (${result.x || 0}, ${result.y || 0})
            </div>
        `;

        document.body.appendChild(resultDiv);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (document.body.contains(resultDiv)) {
                resultDiv.remove();
            }
        }, 10000);
    }

    /**
     * Generate mock analysis result for testing
     */
    generateMockAnalysisResult(x, y) {
        return {
            x: Math.round(x),
            y: Math.round(y),
            soilMoisture: Math.round(20 + Math.random() * 40),
            ndvi: (0.3 + Math.random() * 0.5).toFixed(3),
            temperature: Math.round(15 + Math.random() * 20),
            analysis: '모바일 AR 분석 완료'
        };
    }

    /**
     * Show mobile error message
     */
    showMobileErrorMessage(message) {
        const existing = document.getElementById('mobile-error');
        if (existing) existing.remove();

        const errorDiv = document.createElement('div');
        errorDiv.id = 'mobile-error';
        errorDiv.innerHTML = `❌ ${message}`;
        errorDiv.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: rgba(255, 59, 48, 0.9) !important;
            color: white !important;
            padding: 20px 30px !important;
            border-radius: 10px !important;
            font-size: 16px !important;
            z-index: 999999 !important;
            text-align: center !important;
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// Import WebXRState for state checking
const WebXRState = {
    NOT_IN_XR: 0,
    ENTERING_XR: 1,
    IN_XR: 2,
    EXITING_XR: 3
};

// Make BabylonXRFramework globally available
window.BabylonXRFramework = BabylonXRFramework;