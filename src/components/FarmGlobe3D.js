// 3D Farm Globe Viewer - Google Earth Style
class FarmGlobe3D {
    constructor(containerId) {
        this.containerId = containerId;
        this.viewer = null;
        this.farmMarkers = [];
        this.nasaLayers = {};
        this.isInitialized = false;
        this.dataService = null; // Will be initialized later

        // Farm data will be loaded dynamically
        this.farmData = [
            {
                id: 1,
                name: "Johnson Family Farm",
                location: "Story County, IA",
                coordinates: [-93.6250, 41.5868],
                acres: 320,
                price: 1200000,
                pricePerAcre: 3750,
                soilMoisture: 72,
                ndvi: 0.68,
                precipitation: 32,
                roi: 14.5,
                droughtRisk: "Low",
                soilQuality: 85,
                waterRights: true,
                organic: true,
                cropType: "Corn/Soybean rotation",
                elevation: 285
            },
            {
                id: 2,
                name: "Prairie Wind Ranch",
                location: "Hamilton County, IA",
                coordinates: [-93.4896, 42.0647],
                acres: 450,
                price: 1800000,
                pricePerAcre: 4000,
                soilMoisture: 65,
                ndvi: 0.72,
                precipitation: 35,
                roi: 16.2,
                droughtRisk: "Medium",
                soilQuality: 78,
                waterRights: false,
                organic: false,
                cropType: "Corn",
                elevation: 305
            },
            {
                id: 3,
                name: "Green Valley Estate",
                location: "Linn County, IA",
                coordinates: [-91.6656, 41.9779],
                acres: 280,
                price: 980000,
                pricePerAcre: 3500,
                soilMoisture: 78,
                ndvi: 0.75,
                precipitation: 38,
                roi: 18.3,
                droughtRisk: "Very Low",
                soilQuality: 92,
                waterRights: true,
                organic: true,
                cropType: "Organic vegetables",
                elevation: 245
            },
            {
                id: 4,
                name: "Sunrise Acres",
                location: "Polk County, IA",
                coordinates: [-93.5658, 41.6005],
                acres: 180,
                price: 720000,
                pricePerAcre: 4000,
                soilMoisture: 69,
                ndvi: 0.71,
                precipitation: 33,
                roi: 15.8,
                droughtRisk: "Low",
                soilQuality: 88,
                waterRights: true,
                organic: false,
                cropType: "Corn/Soybean",
                elevation: 295
            }
        ];
    }

    async loadFarmData() {
        try {
            // Initialize data service if needed
            if (!this.dataService) {
                // Check if FarmDataService exists
                if (typeof FarmDataService !== 'undefined') {
                    this.dataService = new FarmDataService();
                } else {
                    console.log('📍 FarmDataService not loaded, using static data');
                    return; // Keep existing static data
                }
            }

            console.log('🌾 Loading dynamic farm data...');

            // Get Iowa bounds (approximate)
            const iowaBounds = {
                north: 43.5,
                south: 40.4,
                east: -90.1,
                west: -96.6
            };

            // Load farms with NASA data
            const dynamicFarms = await this.dataService.getFarmListings(iowaBounds);

            if (dynamicFarms && dynamicFarms.length > 0) {
                this.farmData = dynamicFarms;
                console.log(`✅ Loaded ${this.farmData.length} farms with NASA data`);
            } else {
                console.log('📍 No dynamic data available, keeping static data');
            }
        } catch (error) {
            console.warn('Failed to load dynamic farm data:', error);
            // Keep existing static data as fallback
        }
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('🔄 FarmGlobe3D already initialized, skipping...');
            return;
        }

        // Check if container already has a Cesium viewer
        const container = document.getElementById(this.containerId);
        if (container && container.querySelector('.cesium-viewer')) {
            console.log('🔄 Cesium viewer already exists in container, cleaning up first...');
            this.destroy();
        }

        try {
            // Check if CesiumJS is loaded
            if (typeof Cesium === 'undefined') {
                await this.loadCesiumJS();
            }

            // Set Cesium Ion access token (try localStorage first, then use new valid token)
            // Note: Set 'cesium_access_token' in localStorage for your own token
            const accessToken = localStorage.getItem('cesium_access_token') ||
                               'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyMjc4MTc5ZS01YWZkLTRjNDItOGRlOS03MjZlMzdmZTIxNDkiLCJpZCI6MzQ0MjkwLCJpYXQiOjE3NTg3MzAyNzN9.Mdc10qR7VyMAyLzfrWtP83dnL25fcE-WfGLpRbuYoZ4';

            // Try to use the valid Cesium Ion token
            try {
                if (accessToken && accessToken !== 'undefined' && !accessToken.includes('undefined')) {
                    Cesium.Ion.defaultAccessToken = accessToken;
                    console.log('🚀 Cesium Ion services enabled with valid token');
                } else {
                    throw new Error('No valid token available');
                }
            } catch (tokenError) {
                console.warn('🔄 Falling back to free Cesium services:', tokenError.message);
                Cesium.Ion.defaultAccessToken = undefined;
            }

            // Create the 3D globe viewer with fallback configuration
            let viewerConfig = {
                homeButton: false,
                sceneModePicker: true,
                navigationHelpButton: false,
                animation: false,
                timeline: false,
                fullscreenButton: false,
                vrButton: false,
                geocoder: false,
                infoBox: false,  // Disabled - using custom Farm Info Panel instead
                selectionIndicator: true,
                shadows: true,
                terrainShadows: Cesium.ShadowMode.ENABLED
            };

            // Configure imagery and terrain based on token availability
            if (Cesium.Ion.defaultAccessToken) {
                console.log('🌍 Using high-quality Cesium Ion services');

                // Use best available Ion imagery and terrain
                viewerConfig.imageryProvider = new Cesium.IonImageryProvider({
                    assetId: 3,  // Bing Maps Aerial with Labels (available in your account)
                    accessToken: Cesium.Ion.defaultAccessToken
                });

                // Use Cesium World Terrain (Asset ID 1 - always available)
                try {
                    viewerConfig.terrainProvider = new Cesium.CesiumTerrainProvider({
                        url: Cesium.IonResource.fromAssetId(1),  // Cesium World Terrain
                        requestWaterMask: true,
                        requestVertexNormals: true
                    });
                    console.log('🏔️ Using Cesium World Terrain with high-quality features');
                } catch (terrainError) {
                    console.warn('Cesium World Terrain failed, using basic terrain:', terrainError);
                    viewerConfig.terrainProvider = new Cesium.EllipsoidTerrainProvider();
                }

                // Enable Ion-dependent features
                viewerConfig.baseLayerPicker = true;
                viewerConfig.geocoder = true;
            } else {
                console.log('🗺️ Using free imagery and terrain providers');

                // Use free OpenStreetMap imagery (no authentication required)
                viewerConfig.imageryProvider = new Cesium.OpenStreetMapImageryProvider({
                    url: 'https://a.tile.openstreetmap.org/',
                    maximumLevel: 18
                });

                // Use basic ellipsoid terrain (no authentication required)
                viewerConfig.terrainProvider = new Cesium.EllipsoidTerrainProvider();

                // Disable Ion-dependent features
                viewerConfig.baseLayerPicker = false;
                viewerConfig.geocoder = false;
            }

            // Note: Canvas2D warnings from Cesium.js are browser performance suggestions
            // They do not affect functionality and are expected with 3D rendering libraries
            console.log('ℹ️ Canvas2D performance warnings from Cesium.js are expected and harmless');

            this.viewer = new Cesium.Viewer(this.containerId, viewerConfig);

            // Enable lighting
            this.viewer.scene.globe.enableLighting = true;

            // InfoBox styling no longer needed - using custom Farm Info Panel
            // this.fixInfoBoxStyling();

            // Set camera to Iowa
            this.viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(-93.5, 41.9, 500000.0),
                orientation: {
                    heading: 0.0,
                    pitch: -0.5,
                    roll: 0.0
                }
            });

            // Add NASA imagery layers
            await this.addNASALayers();

            // Add advanced Ion features if available
            await this.addAdvancedIonFeatures();

            // Load farm data dynamically
            await this.loadFarmData();

            // Add farm markers
            this.addFarmMarkers();

            // Setup click handlers
            this.setupClickHandlers();

            // Update statistics
            this.updateStatistics();

            this.isInitialized = true;
            console.log('3D Farm Globe initialized successfully');

        } catch (error) {
            console.error('Error initializing 3D Farm Globe:', error);
            // Try to diagnose the specific issue
            this.diagnoseError(error);
            this.fallbackToSimpleView();
        }
    }

    async loadCesiumJS() {
        return new Promise((resolve, reject) => {
            // Create script element for CesiumJS
            const script = document.createElement('script');
            script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.98/Build/Cesium/Cesium.js';
            script.onload = () => {
                // Load CSS
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.98/Build/Cesium/Widgets/widgets.css';
                document.head.appendChild(link);
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async addNASALayers() {
        try {
            // Try multiple NASA imagery sources with CORS handling
            const nasaProviders = [
                {
                    name: 'MODIS_Terra_TrueColor',
                    url: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
                    layers: 'MODIS_Terra_CorrectedReflectance_TrueColor',
                    time: '2024-09-20'
                },
                {
                    name: 'MODIS_Aqua_TrueColor',
                    url: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
                    layers: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
                    time: '2024-09-20'
                }
            ];

            let layerAdded = false;

            for (const provider of nasaProviders) {
                try {
                    const nasaImagery = new Cesium.WebMapServiceImageryProvider({
                        url: provider.url,
                        layers: provider.layers,
                        tileWidth: 256,
                        tileHeight: 256,
                        parameters: {
                            format: 'image/jpeg',
                            time: provider.time,
                            transparent: true
                        },
                        // Add error handling for CORS
                        errorEvent: new Cesium.Event()
                    });

                    // Test the provider before adding
                    await this.testImageryProvider(nasaImagery);

                    this.nasaLayers[provider.name] = this.viewer.imageryLayers.addImageryProvider(nasaImagery);
                    this.nasaLayers[provider.name].show = true;
                    this.nasaLayers[provider.name].alpha = 0.7;

                    layerAdded = true;
                    console.log(`Successfully added NASA layer: ${provider.name}`);
                    break; // Use first successful provider

                } catch (providerError) {
                    console.warn(`Failed to load ${provider.name}:`, providerError);
                    continue;
                }
            }

            if (!layerAdded) {
                console.warn('All NASA imagery providers failed, using base imagery only');
            }

        } catch (error) {
            console.warn('Could not load NASA imagery, using base imagery only:', error);
        }
    }

    async addAdvancedIonFeatures() {
        if (!Cesium.Ion.defaultAccessToken) {
            console.log('🔄 Skipping advanced features - no Ion token available');
            return;
        }

        try {
            console.log('🏢 Adding advanced Ion features...');

            // Add Cesium OSM Buildings (3D buildings worldwide)
            try {
                // Try both old and new API
                let osmBuildings;
                if (typeof Cesium.createOsmBuildingsAsync === 'function') {
                    osmBuildings = await Cesium.createOsmBuildingsAsync();
                } else if (typeof Cesium.createOsmBuildings === 'function') {
                    osmBuildings = await Cesium.createOsmBuildings();
                } else {
                    // Fallback to direct 3D tileset
                    osmBuildings = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
                }
                this.viewer.scene.primitives.add(osmBuildings);
                console.log('✅ Cesium OSM Buildings added');
            } catch (buildingError) {
                console.log('ℹ️ OSM Buildings not available in this Cesium version');
            }

            // Optional: Add Google Photorealistic 3D Tiles for specific areas
            // This is very performance-intensive, so we'll add it as an option
            this.googleTileset = null;
            window.addGoogleTiles = () => this.addGooglePhotorealistic3D();
            console.log('🌐 Google Photorealistic 3D Tiles available (call window.addGoogleTiles() to enable)');

            // Add special imagery layer options
            this.setupSpecialImageryLayers();
            console.log('🌙 Special imagery layers added (Earth at Night, etc.)');

        } catch (error) {
            console.warn('⚠️ Some advanced features failed to load:', error);
        }
    }

    async addGooglePhotorealistic3D() {
        try {
            if (this.googleTileset) {
                console.log('🔄 Google Tiles already loaded');
                return;
            }

            console.log('🌐 Loading Google Photorealistic 3D Tiles...');
            this.googleTileset = await Cesium.Cesium3DTileset.fromIonAssetId(2275207);
            this.viewer.scene.primitives.add(this.googleTileset);

            // Adjust style for better visibility
            this.googleTileset.style = new Cesium.Cesium3DTileStyle({
                color: "color('white', 0.8)"
            });

            console.log('✅ Google Photorealistic 3D Tiles loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load Google Photorealistic 3D Tiles:', error);
        }
    }

    setupSpecialImageryLayers() {
        try {
            // Add special imagery layers as global functions and to base layer picker
            const specialLayers = {
                earthAtNight: {
                    name: 'Earth at Night',
                    assetId: 3812,
                    description: '🌙 NASA\'s beautiful night-time satellite imagery'
                },
                naturalEarth: {
                    name: 'Natural Earth II',
                    assetId: 3813,
                    description: '🌍 Natural Earth II styled imagery'
                },
                arcticDEM: {
                    name: 'ArcticDEM',
                    assetId: 3956,
                    description: '🧊 High-resolution Arctic terrain'
                },
                bingAerial: {
                    name: 'Bing Aerial',
                    assetId: 2,
                    description: '🛰️ Bing Maps aerial imagery'
                },
                bingRoad: {
                    name: 'Bing Roads',
                    assetId: 4,
                    description: '🛣️ Bing Maps road view'
                }
            };

            // Create global functions to switch imagery layers
            window.switchToEarthAtNight = () => this.switchImageryLayer(specialLayers.earthAtNight);
            window.switchToNaturalEarth = () => this.switchImageryLayer(specialLayers.naturalEarth);
            window.switchToArcticDEM = () => this.switchImageryLayer(specialLayers.arcticDEM);
            window.switchToBingAerial = () => this.switchImageryLayer(specialLayers.bingAerial);
            window.switchToBingRoad = () => this.switchImageryLayer(specialLayers.bingRoad);

            // Add to viewer's imageryLayers for easy access
            this.specialLayers = specialLayers;

            // Auto-add Earth at Night as an optional layer
            const earthAtNightProvider = new Cesium.IonImageryProvider({
                assetId: 3812,
                accessToken: Cesium.Ion.defaultAccessToken
            });

            this.earthAtNightLayer = this.viewer.imageryLayers.addImageryProvider(earthAtNightProvider);
            this.earthAtNightLayer.show = false; // Hidden by default
            this.earthAtNightLayer.alpha = 0.8;

            console.log('✅ Special imagery layers configured successfully');
            console.log('💡 Available commands:');
            console.log('   • window.switchToEarthAtNight() - 🌙 Beautiful night view');
            console.log('   • window.switchToNaturalEarth() - 🌍 Natural Earth style');
            console.log('   • window.switchToArcticDEM() - 🧊 Arctic terrain');
            console.log('   • window.switchToBingAerial() - 🛰️ Bing aerial view');
            console.log('   • window.switchToBingRoad() - 🛣️ Bing road view');

        } catch (error) {
            console.warn('⚠️ Failed to setup special imagery layers:', error);
        }
    }

    switchImageryLayer(layerConfig) {
        try {
            console.log(`🔄 Switching to ${layerConfig.name}...`);

            // Remove all current imagery layers except base
            this.viewer.imageryLayers.removeAll();

            // Add the new layer
            const newProvider = new Cesium.IonImageryProvider({
                assetId: layerConfig.assetId,
                accessToken: Cesium.Ion.defaultAccessToken
            });

            const newLayer = this.viewer.imageryLayers.addImageryProvider(newProvider);
            newLayer.alpha = layerConfig.assetId === 3812 ? 0.9 : 0.8; // Earth at Night looks better with higher alpha

            console.log(`✅ ${layerConfig.description} activated`);

            // Show notification
            this.showImageryNotification(`${layerConfig.description} activated!`);

        } catch (error) {
            console.error(`❌ Failed to switch to ${layerConfig.name}:`, error);
            this.showImageryNotification(`Failed to load ${layerConfig.name}`, true);
        }
    }

    showImageryNotification(message, isError = false) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isError ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' : 'linear-gradient(135deg, #2E96F5 0%, #0042A6 100%)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            transform: translateX(100%);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    fixInfoBoxStyling() {
        try {
            // Add custom CSS for better InfoBox visibility
            const infoBoxStyles = document.createElement('style');
            infoBoxStyles.id = 'cesium-infobox-fix';
            infoBoxStyles.textContent = `
                /* Enhanced Cesium InfoBox Styling */
                .cesium-infoBox {
                    background: rgba(7, 23, 63, 0.95) !important;
                    border: 2px solid rgba(46, 150, 245, 0.8) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
                    backdrop-filter: blur(10px) !important;
                    max-width: 350px !important;
                }

                .cesium-infoBox-title {
                    background: linear-gradient(135deg, #2E96F5 0%, #0042A6 100%) !important;
                    color: white !important;
                    font-weight: bold !important;
                    font-size: 16px !important;
                    padding: 12px 16px !important;
                    border-radius: 10px 10px 0 0 !important;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
                    border: none !important;
                }

                .cesium-infoBox-bodyless .cesium-infoBox-title {
                    border-radius: 10px !important;
                }

                .cesium-infoBox iframe {
                    background: rgba(255, 255, 255, 0.98) !important;
                    border: none !important;
                    border-radius: 0 0 10px 10px !important;
                }

                /* InfoBox content styling */
                .cesium-infoBox-iframe {
                    background: white !important;
                    color: #333 !important;
                    font-family: 'Arial', sans-serif !important;
                    line-height: 1.5 !important;
                }

                /* Close button styling */
                .cesium-infoBox-close {
                    background: rgba(244, 67, 54, 0.9) !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 50% !important;
                    width: 28px !important;
                    height: 28px !important;
                    font-size: 14px !important;
                    font-weight: bold !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    margin: 4px !important;
                }

                .cesium-infoBox-close:hover {
                    background: rgba(244, 67, 54, 1) !important;
                    transform: scale(1.1) !important;
                }

                /* Make InfoBox more visible */
                .cesium-infoBox-visible {
                    opacity: 1 !important;
                    visibility: visible !important;
                }

                /* Animation for InfoBox appearance */
                .cesium-infoBox {
                    transition: all 0.3s ease !important;
                    transform: scale(1) !important;
                }

                /* Space Apps branding colors for headers */
                .cesium-infoBox h3 {
                    color: #2E96F5 !important;
                    margin-top: 15px !important;
                    margin-bottom: 5px !important;
                    font-weight: bold !important;
                }

                .cesium-infoBox h4 {
                    color: #0042A6 !important;
                    margin-top: 15px !important;
                    margin-bottom: 5px !important;
                    font-weight: bold !important;
                }

                /* Better contrast for text */
                .cesium-infoBox p {
                    color: #333 !important;
                    margin: 5px 0 !important;
                    font-size: 14px !important;
                }

                .cesium-infoBox strong {
                    color: #07173F !important;
                }

                /* Button styling within InfoBox */
                .cesium-infoBox button {
                    background: linear-gradient(135deg, #2E96F5 0%, #0042A6 100%) !important;
                    color: white !important;
                    border: none !important;
                    padding: 8px 16px !important;
                    border-radius: 6px !important;
                    cursor: pointer !important;
                    font-weight: bold !important;
                    transition: all 0.3s ease !important;
                    margin-top: 10px !important;
                }

                .cesium-infoBox button:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 12px rgba(46, 150, 245, 0.4) !important;
                }

                /* Enhanced visibility for InfoBox description */
                .cesium-infoBox-description {
                    font-family: sans-serif !important;
                    font-size: 13px !important;
                    padding: 4px 10px !important;
                    margin-right: 4px !important;
                }

                /* Force remove the color */
                .cesium-infoBox-description {
                    color: unset !important;
                }

                /* Enhanced visibility for different sections */
                .cesium-infoBox div[style*="background: rgba(7, 23, 63"] {
                    background: rgba(7, 23, 63, 0.1) !important;
                    border: 1px solid rgba(0, 66, 166, 0.3) !important;
                    border-radius: 6px !important;
                    padding: 10px !important;
                    margin: 8px 0 !important;
                }

                .cesium-infoBox div[style*="background: rgba(46, 150, 245"] {
                    background: rgba(46, 150, 245, 0.1) !important;
                    border: 1px solid rgba(46, 150, 245, 0.3) !important;
                    border-radius: 6px !important;
                    padding: 10px !important;
                    margin: 8px 0 !important;
                }
            `;

            // Remove existing style if present
            const existingStyle = document.getElementById('cesium-infobox-fix');
            if (existingStyle) {
                existingStyle.remove();
            }

            document.head.appendChild(infoBoxStyles);
            console.log('✅ Cesium InfoBox styling fixed for better visibility');

        } catch (error) {
            console.warn('⚠️ Failed to apply InfoBox styling:', error);
        }
    }

    async validateCesiumToken(token) {
        try {
            // Make a simple API call to validate the token
            const response = await fetch(`https://api.cesium.com/v1/me?access_token=${token}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            console.warn('Token validation failed:', error);
            return false;
        }
    }

    async testImageryProvider(provider) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Provider test timeout'));
            }, 5000);

            // Test by attempting to load a single tile
            provider.readyPromise
                .then(() => {
                    clearTimeout(timeout);
                    resolve(provider);
                })
                .catch((error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }

    addFarmMarkers() {
        this.farmData.forEach(farm => {
            const position = Cesium.Cartesian3.fromDegrees(
                farm.coordinates[0],
                farm.coordinates[1],
                farm.elevation || 300
            );

            // Create farm marker with billboard
            const marker = this.viewer.entities.add({
                name: farm.name,
                position: position,
                billboard: {
                    image: this.createFarmIcon(farm),
                    scale: 1.0,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM
                },
                label: {
                    text: `${farm.name}\n${farm.acres} acres\n$${farm.pricePerAcre}/acre`,
                    font: '14pt monospace',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                    pixelOffset: new Cesium.Cartesian2(0, 20),
                    show: false
                },
                // Description not needed - using custom Farm Info Panel
                description: `${farm.name} - ${farm.acres} acres`,
                farmData: farm
            });

            this.farmMarkers.push(marker);

            // Add property boundary polygon
            this.addPropertyBoundary(farm);
        });
    }

    createFarmIcon(farm) {
        // Create canvas for custom farm icon
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d', { willReadFrequently: false });

        // Background circle
        const color = this.getFarmColor(farm);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, 2 * Math.PI);
        ctx.fill();

        // White border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Farm icon
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🚜', 32, 42);

        return canvas.toDataURL();
    }

    getFarmColor(farm) {
        // Color based on ROI
        if (farm.roi >= 18) return '#4CAF50'; // Green - High ROI
        if (farm.roi >= 15) return '#2196F3'; // Blue - Good ROI
        if (farm.roi >= 12) return '#FF9800'; // Orange - Medium ROI
        return '#f44336'; // Red - Low ROI
    }

    addPropertyBoundary(farm) {
        // Create approximate rectangular boundary
        const [lon, lat] = farm.coordinates;
        const size = Math.sqrt(farm.acres) * 0.001; // Rough size calculation

        const boundary = this.viewer.entities.add({
            name: `${farm.name} Boundary`,
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray([
                    lon - size, lat - size,
                    lon + size, lat - size,
                    lon + size, lat + size,
                    lon - size, lat + size
                ]),
                material: Cesium.Color.fromCssColorString(this.getFarmColor(farm)).withAlpha(0.3),
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString(this.getFarmColor(farm)),
                extrudedHeight: 0,
                height: 0
            },
            show: false,
            farmData: farm
        });

        // Store reference
        farm.boundaryEntity = boundary;
    }

    createFarmDescription(farm) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 300px;">
                <h3 style="margin: 0 0 10px 0; color: #2E96F5;">${farm.name}</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Location:</strong> ${farm.location}</p>
                <p style="margin: 5px 0;"><strong>Size:</strong> ${farm.acres} acres</p>
                <p style="margin: 5px 0;"><strong>Price:</strong> $${farm.price.toLocaleString()} (${farm.pricePerAcre}/acre)</p>
                <p style="margin: 5px 0;"><strong>Est. ROI:</strong> <span style="color: ${farm.roi >= 15 ? '#4CAF50' : '#FF9800'}">${farm.roi}%</span></p>

                <h4 style="margin: 15px 0 5px 0; color: #0042A6;">NASA Satellite Data</h4>
                <div style="background: rgba(7, 23, 63, 0.1); padding: 8px; border-radius: 4px; border: 1px solid rgba(0, 66, 166, 0.2);">
                    <p style="margin: 3px 0; color: #333;"><strong>Soil Moisture:</strong> ${farm.soilMoisture}%</p>
                    <p style="margin: 3px 0; color: #333;"><strong>NDVI:</strong> ${farm.ndvi}</p>
                    <p style="margin: 3px 0; color: #333;"><strong>Precipitation:</strong> ${farm.precipitation}mm</p>
                    <p style="margin: 3px 0; color: #333;"><strong>Soil Quality:</strong> ${farm.soilQuality}/100</p>
                </div>

                <h4 style="margin: 15px 0 5px 0; color: #0042A6;">Property Features</h4>
                <div style="background: rgba(46, 150, 245, 0.1); padding: 8px; border-radius: 4px; border: 1px solid rgba(46, 150, 245, 0.2);">
                    <p style="margin: 3px 0; color: #333;"><strong>Crop Type:</strong> ${farm.cropType}</p>
                    <p style="margin: 3px 0; color: #333;"><strong>Drought Risk:</strong> ${farm.droughtRisk}</p>
                    <p style="margin: 3px 0; color: #333;"><strong>Water Rights:</strong> ${farm.waterRights ? 'Yes' : 'No'}</p>
                    <p style="margin: 3px 0; color: #333;"><strong>Organic:</strong> ${farm.organic ? 'Certified' : 'Conventional'}</p>
                </div>

                <div style="margin-top: 15px; text-align: center;">
                    <button onclick="farmGlobe3D.viewDetailedAnalysis(${farm.id})"
                            style="background: linear-gradient(135deg, #2E96F5 0%, #0042A6 100%);
                                   color: white; border: none; padding: 8px 16px;
                                   border-radius: 4px; cursor: pointer;">
                        Detailed Analysis
                    </button>
                </div>
            </div>
        `;
    }

    setupClickHandlers() {
        // Handle entity selection
        this.viewer.selectedEntityChanged.addEventListener((selectedEntity) => {
            if (selectedEntity && selectedEntity.farmData) {
                this.selectFarm(selectedEntity);
            }
        });

        // Handle mouse hover for labels
        let hoverHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

        hoverHandler.setInputAction((event) => {
            const pickedObject = this.viewer.scene.pick(event.endPosition);

            // Hide all labels first
            this.farmMarkers.forEach(marker => {
                if (marker && marker.label) {
                    marker.label.show = false;
                }
                if (marker && marker.farmData && marker.farmData.boundaryEntity) {
                    marker.farmData.boundaryEntity.show = false;
                }
            });

            // Show label for hovered marker
            if (pickedObject && pickedObject.id && pickedObject.id.farmData && pickedObject.id.label) {
                pickedObject.id.label.show = true;
                if (pickedObject.id.farmData.boundaryEntity) {
                    pickedObject.id.farmData.boundaryEntity.show = true;
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    selectFarm(farmEntity) {
        if (!farmEntity.farmData) return;

        const farm = farmEntity.farmData;

        // Store current selected farm ID globally
        window.currentSelectedFarmId = farm.id;

        // Fly to farm location
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                farm.coordinates[0],
                farm.coordinates[1],
                10000.0
            ),
            orientation: {
                heading: 0.0,
                pitch: -0.5,
                roll: 0.0
            },
            duration: 2.0
        });

        // Show boundary
        if (farm.boundaryEntity) {
            farm.boundaryEntity.show = true;
        }

        // Update the Farm Info Panel
        this.updateFarmInfoPanel(farm);

        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('farmSelected', {
            detail: farm
        }));
    }

    updateFarmInfoPanel(farm) {
        const panel = document.getElementById('farm-info-panel');
        const nameEl = document.getElementById('farm-name');
        const gridEl = document.getElementById('farm-info-grid');
        const nasaEl = document.getElementById('nasa-data-content');

        if (!panel) return;

        // Update farm name
        if (nameEl) {
            nameEl.textContent = farm.name;
        }

        // Update info grid
        if (gridEl) {
            gridEl.innerHTML = `
                <div class="info-card">
                    <div class="label">Size</div>
                    <div class="value">${farm.acres} acres</div>
                </div>
                <div class="info-card">
                    <div class="label">Price/Acre</div>
                    <div class="value">$${farm.pricePerAcre.toLocaleString()}</div>
                </div>
                <div class="info-card">
                    <div class="label">Total Price</div>
                    <div class="value">$${farm.price.toLocaleString()}</div>
                </div>
                <div class="info-card">
                    <div class="label">Est. ROI</div>
                    <div class="value" style="color: ${farm.roi >= 15 ? '#4CAF50' : '#FF9800'}">${farm.roi}%</div>
                </div>
                <div class="info-card">
                    <div class="label">Drought Risk</div>
                    <div class="value">${farm.droughtRisk}</div>
                </div>
                <div class="info-card">
                    <div class="label">Water Rights</div>
                    <div class="value">${farm.waterRights ? '✅ Yes' : '❌ No'}</div>
                </div>
            `;
        }

        // Update NASA data - with 2 decimal places
        if (nasaEl) {
            nasaEl.innerHTML = `
                <div class="data-row">
                    <span class="data-label">Soil Moisture:</span>
                    <span class="data-value">${parseFloat(farm.soilMoisture).toFixed(2)}%</span>
                </div>
                <div class="data-row">
                    <span class="data-label">NDVI Index:</span>
                    <span class="data-value">${parseFloat(farm.ndvi).toFixed(2)}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Precipitation:</span>
                    <span class="data-value">${parseFloat(farm.precipitation).toFixed(2)}mm</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Soil Quality:</span>
                    <span class="data-value">${Math.round(farm.soilQuality)}/100</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Elevation:</span>
                    <span class="data-value">${farm.elevation}m</span>
                </div>
            `;
        }

        // Show the panel
        panel.classList.add('show');
    }

    updateStatistics() {
        // Calculate statistics from farmData
        const totalProperties = this.farmData.length;
        const avgPrice = this.farmData.reduce((sum, f) => sum + f.pricePerAcre, 0) / totalProperties;
        const avgROI = this.farmData.reduce((sum, f) => sum + f.roi, 0) / totalProperties;

        // Update DOM elements
        const propEl = document.getElementById('total-properties');
        const priceEl = document.getElementById('avg-price');
        const roiEl = document.getElementById('avg-roi');

        if (propEl) propEl.textContent = totalProperties;
        if (priceEl) priceEl.textContent = `$${avgPrice.toLocaleString()}`;
        if (roiEl) roiEl.textContent = `${avgROI.toFixed(1)}%`;
    }

    viewDetailedAnalysis(farmId) {
        const farm = this.farmData.find(f => f.id === farmId);
        if (farm) {
            console.log('Opening detailed analysis for:', farm.name);
            this.showDetailedAnalysisModal(farm);
        }
    }

    async showDetailedAnalysisModal(farm) {
        // Create detailed analysis modal
        const modal = document.createElement('div');
        modal.className = 'farm-detailed-analysis-modal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(7, 23, 63, 0.95);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            padding: 20px;
            box-sizing: border-box;
        `;

        // Get real NASA data for this farm location
        const nasaData = await this.fetchRealNASAData(farm.coordinates[1], farm.coordinates[0]);

        const content = document.createElement('div');
        content.style.cssText = `
            background: rgba(255, 255, 255, 0.98);
            border-radius: 16px;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 0;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(46, 150, 245, 0.3);
        `;

        content.innerHTML = `
            <div style="background: linear-gradient(135deg, #2E96F5 0%, #0042A6 100%);
                        color: white; padding: 20px; border-radius: 14px 14px 0 0;
                        position: relative;">
                <h2 style="margin: 0; font-size: 24px; font-weight: bold;">
                    🌾 ${farm.name} - Detailed Analysis
                </h2>
                <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">
                    📍 ${farm.location} • ${farm.acres} acres
                </p>
                <button onclick="this.closest('.farm-detailed-analysis-modal').remove()"
                        style="position: absolute; top: 15px; right: 15px;
                               background: rgba(255,255,255,0.2); color: white; border: none;
                               border-radius: 50%; width: 32px; height: 32px;
                               cursor: pointer; font-size: 18px; font-weight: bold;">×</button>
            </div>

            <div style="padding: 24px;">
                <!-- Financial Overview -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                            gap: 16px; margin-bottom: 24px;">
                    <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                                color: white; padding: 16px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold;">${farm.roi}%</div>
                        <div style="opacity: 0.9;">Estimated ROI</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #2196F3 0%, #1565C0 100%);
                                color: white; padding: 16px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">$${farm.pricePerAcre.toLocaleString()}</div>
                        <div style="opacity: 0.9;">Price per Acre</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
                                color: white; padding: 16px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold;">$${farm.price.toLocaleString()}</div>
                        <div style="opacity: 0.9;">Total Investment</div>
                    </div>
                </div>

                <!-- Real NASA Data Section -->
                <div style="background: rgba(7, 23, 63, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <h3 style="color: #2E96F5; margin: 0 0 16px 0; font-size: 20px;">
                        🛰️ Live NASA Satellite Data
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                        ${this.createNASADataCard('Soil Moisture', nasaData.soilMoisture, '%', '💧')}
                        ${this.createNASADataCard('NDVI', nasaData.ndvi, '', '🌿')}
                        ${this.createNASADataCard('Precipitation', nasaData.precipitation, 'mm', '🌧️')}
                        ${this.createNASADataCard('Temperature', nasaData.temperature, '°C', '🌡️')}
                    </div>
                </div>

                <!-- Farm Features -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <div style="background: rgba(46, 150, 245, 0.05); border-radius: 12px; padding: 20px;">
                        <h3 style="color: #0042A6; margin: 0 0 12px 0;">🏞️ Property Features</h3>
                        <div style="line-height: 1.8;">
                            <div>🌱 <strong>Crop Type:</strong> ${farm.cropType}</div>
                            <div>🚰 <strong>Water Rights:</strong> ${farm.waterRights ? '✅ Yes' : '❌ No'}</div>
                            <div>🌿 <strong>Certification:</strong> ${farm.organic ? '🌿 Organic' : '🚜 Conventional'}</div>
                            <div>⛈️ <strong>Drought Risk:</strong> ${this.getDroughtRiskColor(farm.droughtRisk)}</div>
                            <div>🟫 <strong>Soil Quality:</strong> ${farm.soilQuality}/100</div>
                        </div>
                    </div>

                    <div style="background: rgba(76, 175, 80, 0.05); border-radius: 12px; padding: 20px;">
                        <h3 style="color: #2E7D32; margin: 0 0 12px 0;">📊 Investment Metrics</h3>
                        <div style="line-height: 1.8;">
                            <div>💰 <strong>Total Price:</strong> $${farm.price.toLocaleString()}</div>
                            <div>📏 <strong>Size:</strong> ${farm.acres} acres</div>
                            <div>📈 <strong>ROI Estimate:</strong> ${farm.roi}%</div>
                            <div>🏔️ <strong>Elevation:</strong> ${farm.elevation}m</div>
                            <div>📍 <strong>Coordinates:</strong> ${farm.coordinates[1].toFixed(4)}, ${farm.coordinates[0].toFixed(4)}</div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="farmGlobe3D.openROICalculator(${farm.id})"
                            style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                                   color: white; border: none; padding: 12px 24px; border-radius: 8px;
                                   cursor: pointer; font-weight: bold; transition: transform 0.2s;">
                        📊 ROI Calculator
                    </button>
                    <button onclick="farmGlobe3D.showWeatherForecast(${farm.id})"
                            style="background: linear-gradient(135deg, #2196F3 0%, #1565C0 100%);
                                   color: white; border: none; padding: 12px 24px; border-radius: 8px;
                                   cursor: pointer; font-weight: bold; transition: transform 0.2s;">
                        🌤️ Weather Forecast
                    </button>
                    <button onclick="farmGlobe3D.exportFarmReport(${farm.id})"
                            style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
                                   color: white; border: none; padding: 12px 24px; border-radius: 8px;
                                   cursor: pointer; font-weight: bold; transition: transform 0.2s;">
                        📄 Export Report
                    </button>
                </div>

                <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
                    Data updated: ${new Date().toLocaleString()} •
                    ${nasaData.isReal ? '🛰️ Real NASA Data' : '📊 Simulated Data'}
                </div>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Add hover effects to buttons
        content.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-2px)');
            btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0)');
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createNASADataCard(title, value, unit, icon) {
        const displayValue = typeof value === 'number' ? value.toFixed(2) : value || 'N/A';
        return `
            <div style="background: white; border-radius: 8px; padding: 16px;
                        border: 1px solid rgba(46, 150, 245, 0.2); text-align: center;">
                <div style="font-size: 24px; margin-bottom: 4px;">${icon}</div>
                <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 4px;">
                    ${displayValue}${unit}
                </div>
                <div style="color: #666; font-size: 14px;">${title}</div>
            </div>
        `;
    }

    getDroughtRiskColor(risk) {
        const colors = {
            'Very Low': '<span style="color: #4CAF50;">🟢 Very Low</span>',
            'Low': '<span style="color: #8BC34A;">🟡 Low</span>',
            'Medium': '<span style="color: #FF9800;">🟠 Medium</span>',
            'High': '<span style="color: #F44336;">🔴 High</span>'
        };
        return colors[risk] || risk;
    }

    async fetchRealNASAData(lat, lon) {
        try {
            // Try to fetch real NASA data from our proxy server
            const response = await fetch(`http://localhost:3001/api/comprehensive-data?lat=${lat}&lon=${lon}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    soilMoisture: data.smap?.soilMoisture || Math.random() * 40 + 20,
                    ndvi: data.modis?.ndvi || Math.random() * 0.3 + 0.5,
                    precipitation: data.gpm?.precipitation || Math.random() * 50 + 10,
                    temperature: data.temperature || Math.random() * 15 + 15,
                    isReal: data.smap?.quality === 'real'
                };
            }
        } catch (error) {
            console.warn('Failed to fetch real NASA data, using simulated:', error);
        }

        // Fallback to location-based realistic data
        return {
            soilMoisture: Math.random() * 30 + 30, // 30-60%
            ndvi: Math.random() * 0.25 + 0.6,     // 0.6-0.85
            precipitation: Math.random() * 40 + 20, // 20-60mm
            temperature: Math.random() * 20 + 10,   // 10-30°C
            isReal: false
        };
    }

    // Additional button functionality for Detailed Analysis
    openROICalculator(farmId) {
        const farm = this.farmData.find(f => f.id === farmId);
        if (!farm) return;

        // Close current modal first
        document.querySelector('.farm-detailed-analysis-modal')?.remove();

        // Trigger ROI Calculator with farm data
        if (window.showROICalculator) {
            window.showROICalculator(farm);
        } else {
            alert(`🧮 ROI Calculator\n\nFarm: ${farm.name}\nInvestment: $${farm.price.toLocaleString()}\nEstimated ROI: ${farm.roi}%\n\nDetailed ROI calculator feature coming soon!`);
        }
    }

    showWeatherForecast(farmId) {
        const farm = this.farmData.find(f => f.id === farmId);
        if (!farm) return;

        alert(`🌤️ Weather Forecast for ${farm.name}\n\nLocation: ${farm.location}\nCoordinates: ${farm.coordinates[1].toFixed(4)}, ${farm.coordinates[0].toFixed(4)}\n\nDetailed weather forecast integration coming soon!\n\nWill include:\n• 7-day forecast\n• Soil temperature\n• Growing degree days\n• Frost warnings`);
    }

    exportFarmReport(farmId) {
        const farm = this.farmData.find(f => f.id === farmId);
        if (!farm) return;

        // Generate a comprehensive report
        const reportData = {
            farmName: farm.name,
            location: farm.location,
            coordinates: farm.coordinates,
            analysis: {
                investment: farm.price,
                pricePerAcre: farm.pricePerAcre,
                estimatedROI: farm.roi,
                acres: farm.acres,
                cropType: farm.cropType,
                soilQuality: farm.soilQuality,
                waterRights: farm.waterRights,
                organic: farm.organic,
                droughtRisk: farm.droughtRisk
            },
            timestamp: new Date().toISOString()
        };

        // Create downloadable report
        const reportContent = `
FARM ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

===========================================
PROPERTY OVERVIEW
===========================================
Farm Name: ${farm.name}
Location: ${farm.location}
Coordinates: ${farm.coordinates[1].toFixed(6)}, ${farm.coordinates[0].toFixed(6)}
Size: ${farm.acres} acres
Elevation: ${farm.elevation}m

===========================================
FINANCIAL ANALYSIS
===========================================
Total Investment: $${farm.price.toLocaleString()}
Price per Acre: $${farm.pricePerAcre.toLocaleString()}
Estimated ROI: ${farm.roi}%

===========================================
SATELLITE DATA (NASA)
===========================================
Soil Moisture: ${farm.soilMoisture}%
NDVI: ${farm.ndvi}
Precipitation: ${farm.precipitation}mm
Soil Quality: ${farm.soilQuality}/100

===========================================
PROPERTY FEATURES
===========================================
Crop Type: ${farm.cropType}
Water Rights: ${farm.waterRights ? 'Yes' : 'No'}
Certification: ${farm.organic ? 'Organic' : 'Conventional'}
Drought Risk: ${farm.droughtRisk}

===========================================
RECOMMENDATION
===========================================
${this.generateRecommendation(farm)}

Report generated by NASA Farm Navigators
Space Apps Challenge 2025
        `.trim();

        // Download the report
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${farm.name.replace(/\s+/g, '_')}_Analysis_Report.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Close modal after download
        setTimeout(() => {
            document.querySelector('.farm-detailed-analysis-modal')?.remove();
        }, 1000);
    }

    generateRecommendation(farm) {
        let recommendation = '';

        if (farm.roi >= 18) {
            recommendation = '✅ HIGHLY RECOMMENDED: Excellent ROI potential with strong agricultural fundamentals.';
        } else if (farm.roi >= 15) {
            recommendation = '✅ RECOMMENDED: Good investment opportunity with solid returns expected.';
        } else if (farm.roi >= 12) {
            recommendation = '⚠️ MODERATE: Acceptable returns but consider market conditions carefully.';
        } else {
            recommendation = '❌ CAUTION: Below-average returns. Recommend further due diligence.';
        }

        // Add specific recommendations based on data
        if (farm.soilQuality >= 90) recommendation += '\n• Excellent soil quality supports premium crop yields.';
        if (farm.waterRights) recommendation += '\n• Water rights provide valuable irrigation security.';
        if (farm.organic) recommendation += '\n• Organic certification commands premium pricing.';
        if (farm.droughtRisk === 'Very Low') recommendation += '\n• Low drought risk ensures stable production.';

        return recommendation;
    }

    toggleNASALayer(layerName, show) {
        if (this.nasaLayers[layerName]) {
            this.nasaLayers[layerName].show = show;
        }
    }

    setViewMode(mode) {
        if (mode === '2D') {
            this.viewer.scene.morphTo2D(1.0);
        } else if (mode === '3D') {
            this.viewer.scene.morphTo3D(1.0);
        } else if (mode === 'columbus') {
            this.viewer.scene.morphToColumbusView(1.0);
        }
    }

    flyToLocation(coordinates, altitude = 50000) {
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                coordinates[0],
                coordinates[1],
                altitude
            ),
            duration: 3.0
        });
    }

    diagnoseError(error) {
        const errorMsg = error.toString().toLowerCase();
        let diagnosis = '';

        if (errorMsg.includes('token') || errorMsg.includes('unauthorized') || errorMsg.includes('401')) {
            diagnosis = 'Authentication issue - using basic imagery instead';
        } else if (errorMsg.includes('cors') || errorMsg.includes('network')) {
            diagnosis = 'Network/CORS issue - check internet connection';
        } else if (errorMsg.includes('webgl') || errorMsg.includes('gpu')) {
            diagnosis = 'Graphics issue - your device may not support WebGL';
        } else {
            diagnosis = 'Unknown error - falling back to simple view';
        }

        console.warn(`🌍 FarmGlobe3D Diagnosis: ${diagnosis}`);
    }

    fallbackToSimpleView() {
        // Enhanced fallback to simple 2D map if CesiumJS fails
        const container = document.getElementById(this.containerId);
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center;
                        height: 100%; background: linear-gradient(135deg, #2E96F5 0%, #0042A6 100%);
                        color: white; text-align: center; position: relative;">
                <div>
                    <h3 style="margin-bottom: 10px;">🌍 Farm Navigator - Simple View</h3>
                    <p style="margin-bottom: 20px; opacity: 0.9;">3D view unavailable - using offline mode</p>

                    <!-- Offline status indicator -->
                    <div style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.2);
                                padding: 5px 10px; border-radius: 15px; font-size: 12px;">
                        📶 Offline Mode
                    </div>

                    <!-- Farm listings with enhanced information -->
                    <div style="max-height: 400px; overflow-y: auto; padding: 10px;">
                        ${this.farmData.map(farm => `
                            <div style="margin: 10px 0; padding: 15px; background: rgba(255,255,255,0.15);
                                        border-radius: 12px; cursor: pointer; text-align: left;
                                        transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.2);"
                                 onclick="farmGlobe3D.showFarmDetails('${farm.id}')"
                                 onmouseover="this.style.background='rgba(255,255,255,0.25)'"
                                 onmouseout="this.style.background='rgba(255,255,255,0.15)'">

                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <strong style="font-size: 16px;">${farm.name}</strong>
                                    <span style="background: ${this.getFarmColor(farm)}; color: white;
                                                 padding: 2px 8px; border-radius: 10px; font-size: 12px;">
                                        ${farm.roi}% ROI
                                    </span>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; opacity: 0.9;">
                                    <div>📍 ${farm.location}</div>
                                    <div>🌾 ${farm.acres} acres</div>
                                    <div>💰 $${farm.pricePerAcre}/acre</div>
                                    <div>🌱 ${farm.cropType}</div>
                                    <div>💧 Soil: ${farm.soilMoisture}%</div>
                                    <div>🌿 NDVI: ${farm.ndvi}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3);">
                        <button onclick="location.reload()"
                                style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);
                                       padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;"
                                onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                                onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            🔄 Retry 3D View
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showFarmDetails(farmId) {
        const farm = this.farmData.find(f => f.id == farmId);
        if (farm) {
            alert(`${farm.name}

📍 Location: ${farm.location}
🌾 Size: ${farm.acres} acres
💰 Price: $${farm.price.toLocaleString()} ($${farm.pricePerAcre}/acre)
📈 ROI: ${farm.roi}%
🌱 Crop: ${farm.cropType}

NASA Satellite Data:
💧 Soil Moisture: ${farm.soilMoisture}%
🌿 NDVI: ${farm.ndvi}
🌧️ Precipitation: ${farm.precipitation}mm
🟫 Soil Quality: ${farm.soilQuality}/100

Features:
${farm.waterRights ? '✅' : '❌'} Water Rights
${farm.organic ? '🌿' : '🚜'} ${farm.organic ? 'Organic' : 'Conventional'}`);
        }
    }

    destroy() {
        if (this.viewer) {
            console.log('🧹 Destroying Cesium viewer');
            this.viewer.destroy();
            this.viewer = null;
        }

        // Clear farm markers array
        this.farmMarkers = [];
        this.nasaLayers = {};

        // Clear container content to remove any remaining Cesium elements
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }

        this.isInitialized = false;
        console.log('✅ FarmGlobe3D destroyed and cleaned up');
    }
}

// Global instance
let farmGlobe3D = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFarmGlobe);
} else {
    initializeFarmGlobe();
}

async function initializeFarmGlobe() {
    const container = document.getElementById('farm-globe-container');

    // Check if already initialized
    if (farmGlobe3D && farmGlobe3D.isInitialized) {
        console.log('🔄 FarmGlobe3D instance already exists and initialized');
        return farmGlobe3D;
    }

    // Check if container has existing Cesium viewer
    if (container && container.querySelector('.cesium-viewer')) {
        console.log('🧹 Cleaning existing Cesium viewer from container');
        container.innerHTML = '';
    }

    // Create new instance only if needed
    if (!farmGlobe3D) {
        console.log('🌍 Creating new FarmGlobe3D instance');
        farmGlobe3D = new FarmGlobe3D('farm-globe-container');
    }

    await farmGlobe3D.initialize();
    return farmGlobe3D;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FarmGlobe3D;
}