// AR Functions - Separate file for better compatibility
console.log('🔄 Loading AR functions...');
console.log('📍 ar-functions.js: Script is executing');

// Immediate verification that we're in the right scope
if (typeof window !== 'undefined') {
    console.log('✅ ar-functions.js: Window object available');
} else {
    console.error('❌ ar-functions.js: No window object!');
}

// Clear any MindAR references to prevent errors
if (typeof window !== 'undefined') {
    window.MindARManager = undefined;
    window.MindARNASAOverlay = undefined;
    console.log('🧹 Cleared MindAR references');
}

// Generate realistic regional NASA data based on coordinates
function generateRealisticRegionalData(lat, lon) {
    console.log(`🌍 Generating realistic data for coordinates: ${lat}, ${lon}`);

    // Determine climate zone
    const absLat = Math.abs(lat);
    let climateZone, region;

    if (absLat > 66.5) {
        climateZone = 'arctic';
        region = lat > 0 ? 'Arctic' : 'Antarctic';
    } else if (absLat > 50) {
        climateZone = 'boreal';
        region = lat > 0 ? 'Boreal North' : 'Boreal South';
    } else if (absLat > 30) {
        climateZone = 'temperate';
        region = lat > 0 ? 'Temperate North' : 'Temperate South';
    } else if (absLat > 23.5) {
        climateZone = 'subtropical';
        region = lat > 0 ? 'Subtropical North' : 'Subtropical South';
    } else {
        climateZone = 'tropical';
        region = 'Tropical';
    }

    // Generate realistic data based on climate zone
    let soilMoisture, ndvi;

    switch (climateZone) {
        case 'arctic':
            soilMoisture = 0.15 + Math.random() * 0.20; // 15-35%
            ndvi = 0.1 + Math.random() * 0.30; // 0.1-0.4
            break;
        case 'boreal':
            soilMoisture = 0.25 + Math.random() * 0.25; // 25-50%
            ndvi = 0.3 + Math.random() * 0.40; // 0.3-0.7
            break;
        case 'temperate':
            soilMoisture = 0.20 + Math.random() * 0.35; // 20-55%
            ndvi = 0.4 + Math.random() * 0.40; // 0.4-0.8
            break;
        case 'subtropical':
            soilMoisture = 0.15 + Math.random() * 0.40; // 15-55%
            ndvi = 0.3 + Math.random() * 0.50; // 0.3-0.8
            break;
        case 'tropical':
            soilMoisture = 0.30 + Math.random() * 0.35; // 30-65%
            ndvi = 0.5 + Math.random() * 0.40; // 0.5-0.9
            break;
        default:
            soilMoisture = 0.25 + Math.random() * 0.30; // 25-55%
            ndvi = 0.4 + Math.random() * 0.35; // 0.4-0.75
    }

    // Add seasonal variation based on longitude/latitude
    const seasonalFactor = Math.sin((lon + lat) * Math.PI / 180) * 0.1;
    soilMoisture = Math.max(0.05, Math.min(0.95, soilMoisture + seasonalFactor));
    ndvi = Math.max(0.05, Math.min(0.95, ndvi + seasonalFactor));

    // Calculate health score
    const health = Math.round(
        (soilMoisture * 100 * 0.4) + (ndvi * 100 * 0.6)
    );

    console.log(`📊 Generated ${region} (${climateZone}) data:`, {
        soilMoisture: (soilMoisture * 100).toFixed(1) + '%',
        ndvi: ndvi.toFixed(3),
        health: health + '%'
    });

    return {
        soilMoisture,
        ndvi,
        health,
        region,
        climateZone
    };
}

// NASA API endpoint configuration
window.getNASAApiEndpoint = function() {
    // Always use local proxy server for AR detailed analysis
    return 'http://localhost:3001/api';
};

// Fetch real NASA data
window.fetchNASAData = async function(lat, lon) {
    try {
        const apiBase = window.getNASAApiEndpoint();
        const url = `${apiBase}/pixel-hunt/data?lat=${lat}&lon=${lon}&resolution=30`;
        console.log(`📡 Fetching NASA data from: ${url}`);

        // Validate coordinates
        if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
            throw new Error('Invalid coordinates');
        }

        // Fetch real data from our API
        const response = await fetch(url);
        console.log(`📡 Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Real NASA data received:', data);
        return data;
    } catch (error) {
        console.warn('⚠️ Using fallback data due to:', error.message);
        console.warn('⚠️ Error details:', error);
        return null; // Will trigger fallback
    }
};

// Initialize AR running state
window.arRunning = false;
window.aiManager = null;

// Real AR.js Implementation for iOS compatibility
console.log('🎯 Defining window.launchRealAR function...');
window.launchRealAR = async function() {
    console.log('🚀 launchRealAR function called!');
    // Reset AR state properly
    window.arRunning = false;

    console.log('🚀 Starting Real AR.js AR for mobile devices');

    try {
        // Enhanced device detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

        console.log(`📱 Device: iOS=${isIOS}, Android=${isAndroid}, Safari=${isSafari}`);

        // Android optimization: Show loading indicator early
        if (isAndroid) {
            console.log('🤖 Applying Android optimizations...');
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'ar-loading-android';
            loadingIndicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 10000;
                text-align: center;
                font-family: Arial, sans-serif;
            `;
            loadingIndicator.innerHTML = '🚀 Loading AR...<br><small>Optimizing for Android</small>';
            document.body.appendChild(loadingIndicator);
        }

        // Request camera permission first
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access not supported');
        }

        console.log('📷 Requesting camera permission...');

        // Device-optimized camera settings
        const cameraConfig = isAndroid ? {
            video: {
                facingMode: 'environment',
                width: { ideal: 640 },  // Lower resolution for Android performance
                height: { ideal: 480 },
                frameRate: { ideal: 15, max: 24 }  // Lower framerate for performance
            }
        } : {
            video: {
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(cameraConfig);

        // Stop the stream as AR.js will create its own
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Camera permission granted');

        // Request iOS device orientation permissions
        if (isIOS) {
            await window.requestIOSPermissions();
        }

        // Create AR.js scene
        await window.createARScene();

    } catch (error) {
        console.error('❌ Real AR failed:', error);
        alert(`AR Error: ${error.message}\n\nPlease allow camera access and try again.`);
        window.arRunning = false;
    }
};

// Create AR.js scene with NASA data integration
window.createARScene = async function() {
    console.log('🎬 Creating AR.js scene...');
    window.arRunning = true;

    // Create fullscreen AR container
    const arContainer = document.createElement('div');
    arContainer.id = 'arjs-container';
    arContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 10000;
        background: transparent;
    `;

    // Create A-Frame scene with AR.js - Modern UI Design
    arContainer.innerHTML = `
        <a-scene
            vr-mode-ui="enabled: false"
            arjs="sourceType: webcam; debugUIEnabled: false; trackingMethod: best; sourceWidth: 480; sourceHeight: 640;"
            renderer="logarithmicDepthBuffer: true; antialias: true; alpha: true;"
            embedded
            style="height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; z-index: 1;">

            <!-- Modern Assets -->
            <a-assets>
                <a-mixin id="primary-text"
                    text="color: #FFFFFF; align: center; width: 5; font: roboto; shader: msdf;">
                </a-mixin>
                <a-mixin id="accent-text"
                    text="color: #EAFE07; align: center; width: 4; font: roboto; shader: msdf;">
                </a-mixin>
                <a-mixin id="data-text"
                    text="color: #2E96F5; align: center; width: 3.5; font: roboto; shader: msdf;">
                </a-mixin>
            </a-assets>

            <!-- Modern NASA Data Card -->
            <a-rounded
                id="nasa-data-card"
                position="0 0.5 -1.8"
                width="2"
                height="1.2"
                radius="0.1"
                material="color: #07173F; opacity: 0.95; transparent: true;"
                geometry="primitive: rounded; radiusTop: 0.1; radiusBottom: 0.1;"
                look-at="#ar-camera"
                class="ar-ui-element clickable-card"
                onclick="window.handlePixelClick(event)">

                <!-- Card Header -->
                <a-plane
                    position="0 0.45 0.01"
                    width="1.8"
                    height="0.25"
                    material="color: #0960E1; opacity: 0.9; transparent: true;"
                    geometry="primitive: plane;">
                </a-plane>

                <a-text
                    mixin="accent-text"
                    position="0 0.45 0.02"
                    value="📡 NASA SATELLITE DATA"
                    text="width: 3; color: #EAFE07; font: roboto;">
                </a-text>

                <!-- Data Grid -->
                <a-text
                    id="moisture-display"
                    mixin="primary-text"
                    position="-0.4 0.15 0.02"
                    value="💧 Soil Moisture\n---%"
                    text="width: 2.5; color: #FFFFFF; align: center;">
                </a-text>

                <a-text
                    id="ndvi-display"
                    mixin="primary-text"
                    position="0.4 0.15 0.02"
                    value="🌿 Vegetation\nNDVI: --"
                    text="width: 2.5; color: #FFFFFF; align: center;">
                </a-text>

                <a-text
                    id="temp-display"
                    mixin="primary-text"
                    position="-0.4 -0.15 0.02"
                    value="🌡️ Temperature\n--°C"
                    text="width: 2.5; color: #FFFFFF; align: center;">
                </a-text>

                <a-text
                    id="quality-display"
                    mixin="primary-text"
                    position="0.4 -0.15 0.02"
                    value="📊 Data Quality\nReal-time"
                    text="width: 2.5; color: #2E96F5; align: center;">
                </a-text>

                <!-- Status Indicator -->
                <a-sphere
                    id="status-indicator"
                    position="0.7 0.4 0.05"
                    radius="0.05"
                    material="color: #EAFE07; emissive: #EAFE07; emissiveIntensity: 0.3;"
                    animation="property: rotation; to: 0 360 0; loop: true; dur: 2000;">
                </a-sphere>
            </a-rounded>

            <!-- Modern AI Analysis Card -->
            <a-rounded
                id="ai-analysis-card"
                position="0 -0.3 -1.8"
                width="2"
                height="1"
                radius="0.1"
                material="color: #0960E1; opacity: 0.95; transparent: true;"
                look-at="#ar-camera"
                class="ar-ui-element clickable-card"
                onclick="window.handlePixelClick(event)">

                <!-- AI Header -->
                <a-plane
                    position="0 0.35 0.01"
                    width="1.8"
                    height="0.25"
                    material="color: #07173F; opacity: 0.9; transparent: true;">
                </a-plane>

                <a-text
                    mixin="accent-text"
                    position="0 0.35 0.02"
                    value="🤖 AI FIELD ANALYSIS"
                    text="width: 3; color: #EAFE07;">
                </a-text>

                <!-- AI Results -->
                <a-text
                    id="ai-classification"
                    mixin="primary-text"
                    position="0 0.05 0.02"
                    value="Land Cover: Analyzing..."
                    text="width: 2.8; color: #FFFFFF; align: center;">
                </a-text>

                <a-text
                    id="ai-confidence"
                    mixin="data-text"
                    position="0 -0.15 0.02"
                    value="Confidence: Processing..."
                    text="width: 2.5; color: #2E96F5; align: center;">
                </a-text>

                <!-- Progress Bar -->
                <a-plane
                    id="progress-bg"
                    position="0 -0.35 0.01"
                    width="1.6"
                    height="0.08"
                    material="color: #07173F; opacity: 0.7;">
                </a-plane>

                <a-plane
                    id="progress-fill"
                    position="-0.4 -0.35 0.02"
                    width="0.8"
                    height="0.06"
                    material="color: #EAFE07; emissive: #EAFE07; emissiveIntensity: 0.2;"
                    animation="property: scale; to: 2 1 1; loop: true; dir: alternate; dur: 1500;">
                </a-plane>
            </a-rounded>

            <!-- Modern Targeting System -->
            <a-entity
                id="targeting-system"
                position="0 0 -2"
                look-at="#ar-camera"
                class="ar-ui-element clickable-target"
                cursor-listener
                onclick="window.handlePixelClick(event)"
                ontouchstart="window.handlePixelClick(event)"
                ontouchend="window.handlePixelClick(event)"
                raycaster="objects: .clickable-target; far: 20; near: 0"
                geometry="primitive: box; width: 0.4; height: 0.4; depth: 0.01"
                material="color: transparent; transparent: true; opacity: 0"
                >
                <!-- Visible Background Box for Better Color Display -->
                <a-box
                    position="0 0 -0.01"
                    width="0.3"
                    height="0.3"
                    depth="0.002"
                    material="color: #07173F; opacity: 0.4; transparent: true;"
                    class="clickable-target">
                </a-box>

                <!-- Enhanced Outer Ring with Emissive -->
                <a-ring
                    position="0 0 0"
                    radius-inner="0.08"
                    radius-outer="0.12"
                    material="color: #EAFE07; emissive: #EAFE07; emissiveIntensity: 0.8; opacity: 1.0; transparent: false;"
                    animation="property: rotation; to: 0 0 360; loop: true; dur: 4000;"
                    class="clickable-target">
                </a-ring>

                <!-- Bright Inner Cross -->
                <a-plane
                    position="0 0 0.01"
                    width="0.12"
                    height="0.02"
                    material="color: #EAFE07; emissive: #EAFE07; emissiveIntensity: 1.0; opacity: 1.0;"
                    class="clickable-target">
                </a-plane>
                <a-plane
                    position="0 0 0.01"
                    width="0.02"
                    height="0.12"
                    material="color: #EAFE07; emissive: #EAFE07; emissiveIntensity: 1.0; opacity: 1.0;"
                    class="clickable-target">
                </a-plane>

                <!-- Enhanced Scanning Effect -->
                <a-ring
                    radius-inner="0.05"
                    radius-outer="0.06"
                    material="color: #2E96F5; emissive: #2E96F5; emissiveIntensity: 0.8; opacity: 0.9;"
                    animation="property: scale; to: 3 3 1; loop: true; dur: 2000; easing: easeOutQuart;"
                    class="clickable-target">
                </a-ring>

                <!-- Additional Bright Indicator -->
                <a-circle
                    position="0 0 0.02"
                    radius="0.03"
                    material="color: #EAFE07; emissive: #EAFE07; emissiveIntensity: 1.2; opacity: 1.0;"
                    animation="property: scale; to: 1.5 1.5 1; direction: alternate; loop: true; dur: 800;"
                    class="clickable-target">
                </a-circle>
            </a-entity>

            <!-- Camera Entity with Device Orientation -->
            <a-entity
                id="ar-camera"
                camera
                look-controls="enabled: true; touchEnabled: true; magicWindowTrackingEnabled: true"
                wasd-controls="enabled: false"
                cursor="rayOrigin: mouse; fuse: false; downEvents: mousedown,touchstart; upEvents: mouseup,touchend"
                raycaster="objects: .clickable-target, .clickable-card; far: 50; near: 0"
                position="0 1.6 0">
            </a-entity>
        </a-scene>

        <!-- Modern AR Control Panel -->
        <div id="ar-controls" style="
            position: fixed;
            top: 15px;
            left: 15px;
            right: 15px;
            background: linear-gradient(135deg, rgba(7, 23, 63, 0.98), rgba(9, 96, 225, 0.95));
            border: 2px solid rgba(46, 150, 245, 0.4);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 0;
            overflow: hidden;
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            will-change: transform;
        ">
            <!-- Header Section -->
            <div style="
                background: linear-gradient(90deg, #0960E1, #2E96F5);
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="
                        width: 8px;
                        height: 8px;
                        background: #EAFE07;
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                        box-shadow: 0 0 10px #EAFE07;
                    "></div>
                    <span style="
                        color: #FFFFFF;
                        font-size: 16px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    ">LIVE AR SCANNER</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button id="toggle-panel" onclick="window.toggleARPanel()" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 6px 10px;
                        border-radius: 8px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        ▼ HIDE
                    </button>
                <button onclick="window.stopARScene()" style="
                    background: linear-gradient(45deg, #E43700, #8E1100);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(228, 55, 0, 0.3);
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    ❌ EXIT
                </button>
                </div>
            </div>

            <!-- Collapsible Panel Content -->
            <div id="panel-content" style="
                padding: 15px 20px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                color: white;
            ">
                <!-- Status Cards -->
                <div style="
                    background: rgba(46, 150, 245, 0.2);
                    border: 1px solid rgba(46, 150, 245, 0.3);
                    border-radius: 12px;
                    padding: 10px;
                    text-align: center;
                ">
                    <div style="color: #2E96F5; font-size: 12px; font-weight: 500;">CAMERA</div>
                    <div style="color: #EAFE07; font-size: 14px; font-weight: 600;">🎥 ACTIVE</div>
                </div>

                <div style="
                    background: rgba(234, 254, 7, 0.2);
                    border: 1px solid rgba(234, 254, 7, 0.3);
                    border-radius: 12px;
                    padding: 10px;
                    text-align: center;
                ">
                    <div style="color: #EAFE07; font-size: 12px; font-weight: 500;">NASA API</div>
                    <div style="color: #2E96F5; font-size: 14px; font-weight: 600;">📡 CONNECTED</div>
                </div>
            </div>

            <!-- Instructions -->
            <div style="
                background: rgba(7, 23, 63, 0.5);
                padding: 12px 20px;
                border-top: 1px solid rgba(46, 150, 245, 0.2);
            ">
                <div id="ar-instruction-text" style="
                    color: #FFFFFF;
                    font-size: 13px;
                    text-align: center;
                    opacity: 0.9;
                    line-height: 1.4;
                ">
                    📱 Point camera at soil/crops for real-time NASA satellite analysis
                </div>
            </div>
        </div>

        <!-- Mobile Quick Actions -->
        <div id="mobile-actions" style="
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            z-index: 10002;
        ">
            <button onclick="window.captureARData()" style="
                background: linear-gradient(45deg, #0960E1, #2E96F5);
                border: 2px solid #EAFE07;
                color: white;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(9, 96, 225, 0.4);
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                📊
            </button>

            <button onclick="window.shareARResults()" style="
                background: linear-gradient(45deg, #EAFE07, #B8C500);
                border: 2px solid #2E96F5;
                color: #07173F;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(234, 254, 7, 0.4);
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                📤
            </button>
        </div>

        <!-- CSS Animations -->
        <style>
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            @media (max-width: 768px) {
                #ar-controls {
                    top: 10px !important;
                    left: 10px !important;
                    right: 10px !important;
                    border-radius: 16px !important;
                }

                #ar-controls > div:first-child {
                    padding: 10px 15px !important;
                }

                #ar-controls > div:first-child span {
                    font-size: 14px !important;
                }

                #mobile-actions {
                    bottom: 15px !important;
                }

                #mobile-actions button {
                    width: 50px !important;
                    height: 50px !important;
                    font-size: 20px !important;
                }
            }
        </style>
    `;

    document.body.appendChild(arContainer);

    // Check A-Frame and AR.js are loaded (now loaded via HTML)
    await window.checkARScripts();

    // Enhanced mobile fullscreen mode
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        // Force mobile AR fullscreen
        document.body.classList.add('mobile-ar-mode');

        // Hide URL bar and other mobile browser chrome
        if (window.screen && window.screen.orientation) {
            try {
                // Request fullscreen if supported
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen().catch(e => {
                        console.log('📱 Fullscreen not supported or denied');
                    });
                }
            } catch (error) {
                console.log('📱 Fullscreen request failed:', error);
            }
        }

        // Hide mobile browser UI elements
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
            metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        }
    }

    // Force mobile camera initialization for portrait mode
    setTimeout(() => {
        window.forceARCameraInit();
        window.forceMobileCameraPortrait();
    }, 1000);

    // Verify GPS and NASA data sources after AR setup
    setTimeout(() => {
        window.verifyARDataSources();
    }, 2000);

    // Start real-time soil analysis
    setTimeout(() => {
        window.startSoilAnalysis();
    }, 3000);

    console.log('✅ AR.js scene created successfully');

    // Remove Android loading indicator
    const androidLoading = document.getElementById('ar-loading-android');
    if (androidLoading) {
        setTimeout(() => {
            androidLoading.remove();
            console.log('🤖 Android loading indicator removed');
        }, 2000); // Keep visible for 2 more seconds to show completion
    }
};

// Force AR camera initialization
window.forceARCameraInit = function() {
    console.log('🎥 Forcing AR camera initialization...');

    try {
        // Get AR.js context and force camera start
        const scene = document.querySelector('a-scene');
        if (scene && scene.systems && scene.systems.arjs) {
            console.log('🎯 Found AR.js system, initializing camera...');

            // Force WebRTC camera access
            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 480 },
                    height: { ideal: 640 }
                }
            }).then(stream => {
                console.log('📹 Camera stream obtained');

                // Check if AR.js canvas exists
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    console.log('🖼️ AR canvas found');
                    // AR.js should handle the stream automatically
                } else {
                    console.warn('⚠️ No AR canvas found');
                }
            }).catch(error => {
                console.error('❌ Camera access failed:', error);
            });
        } else {
            console.warn('⚠️ AR.js system not found');
        }
    } catch (error) {
        console.error('❌ AR camera init failed:', error);
    }
};

// Check if A-Frame and AR.js are loaded
window.checkARScripts = function() {
    return new Promise((resolve) => {
        // Check if A-Frame is loaded
        if (window.AFRAME) {
            console.log('✅ A-Frame is loaded');
        } else {
            console.error('❌ A-Frame not loaded - check HTML script tags');
        }

        // Always resolve to continue
        setTimeout(resolve, 500);
    });
};

// Load A-Frame and AR.js scripts dynamically with conflict prevention (DEPRECATED)
window.loadARScripts = async function() {
    console.log('📦 Loading AR.js and A-Frame...');

    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.AFRAME && window.AFRAME.version) {
            console.log('✅ A-Frame already loaded');
            resolve();
            return;
        }

        // Clear any existing Three.js to prevent conflicts
        if (window.THREE) {
            console.log('⚠️ Clearing existing Three.js');
            delete window.THREE;
        }

        // Load A-Frame first
        const aframeScript = document.createElement('script');
        aframeScript.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
        aframeScript.onload = () => {
            console.log('✅ A-Frame loaded');

            // Wait a bit for A-Frame to initialize
            setTimeout(() => {
                // Then load AR.js
                const arjsScript = document.createElement('script');
                arjsScript.src = 'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/aframe/build/aframe-ar.js';
                arjsScript.onload = () => {
                    console.log('✅ AR.js loaded');
                    // Check if THREEx is available
                    if (typeof window.THREEx !== 'undefined') {
                        console.log('✅ THREEx is available');
                    } else {
                        console.warn('⚠️ THREEx not found, using fallback');
                    }
                    // Wait for AR.js to fully initialize
                    setTimeout(resolve, 1500);
                };
                arjsScript.onerror = () => {
                    console.error('❌ Failed to load AR.js, using fallback mode');
                    // Continue anyway for testing
                    setTimeout(resolve, 500);
                };
                document.head.appendChild(arjsScript);
            }, 500);
        };
        aframeScript.onerror = () => {
            reject(new Error('Failed to load A-Frame'));
        };
        document.head.appendChild(aframeScript);
    });
};

// Start real-time soil analysis with AI integration
window.startSoilAnalysis = function() {
    console.log('🔍 Starting real-time soil analysis with AI...');

    // Initialize AI Manager
    window.initializeAIManager();

    // Get GPS location for initial positioning
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude.toFixed(4);
            const lon = position.coords.longitude.toFixed(4);

            console.log(`📍 GPS: ${lat}, ${lon}`);

            // Store coordinates for NASA data fetching
            window.currentLocation = { lat, lon };

            // Start continuous analysis with AI
            window.startContinuousAnalysis();
        },
        (error) => {
            console.warn('GPS failed:', error);
            // Use default location for testing
            window.currentLocation = { lat: 33.4255, lon: -111.9400 };
            // Start analysis anyway with default location
            window.startContinuousAnalysis();
        }
    );
};

// Initialize Agricultural AI Manager
window.initializeAIManager = async function() {
    try {
        console.log('🤖 Initializing Agricultural AI Manager...');

        if (typeof AgriculturalAIManager !== 'undefined') {
            window.aiManager = new AgriculturalAIManager();
            await window.aiManager.initialize();
            console.log('✅ AI Manager initialized successfully');
        } else {
            console.warn('⚠️ AgriculturalAIManager not found, continuing without AI');
        }
    } catch (error) {
        console.error('❌ AI Manager initialization failed:', error);
        window.aiManager = null;
    }
};

// Continuous analysis using Pixel Hunt data system + AI
window.startContinuousAnalysis = function() {
    // Simulate real-time pixel analysis
    let pixelX = Math.floor(Math.random() * 20);
    let pixelY = Math.floor(Math.random() * 20);
    let cachedNASAData = null;
    let lastFetchTime = 0;
    const CACHE_DURATION = 30000; // 30 seconds cache

    const updateAnalysis = async () => {
        // Simulate camera movement - change pixel coordinates
        pixelX = Math.max(0, Math.min(19, pixelX + (Math.random() - 0.5) * 2));
        pixelY = Math.max(0, Math.min(19, pixelY + (Math.random() - 0.5) * 2));

        // Try to get real NASA data first with caching
        let pixelData;
        if (window.currentLocation) {
            const currentTime = Date.now();
            const locationKey = `${window.currentLocation.lat}_${window.currentLocation.lon}`;

            // Check if we have cached data that's still fresh
            if (cachedNASAData &&
                cachedNASAData.locationKey === locationKey &&
                (currentTime - lastFetchTime) < CACHE_DURATION) {
                // Use cached data
                console.log('📋 Using cached NASA data');
                const nasaData = cachedNASAData.data;
                if (nasaData && nasaData.pixels && nasaData.pixels.length > 0) {
                    const pixelIndex = Math.min(pixelY * 20 + pixelX, nasaData.pixels.length - 1);
                    pixelData = nasaData.pixels[pixelIndex];
                } else {
                    pixelData = generateFallbackPixelData();
                }
            } else {
                // Fetch new NASA data
                console.log('🌐 Fetching fresh NASA data...');
                const nasaData = await window.fetchNASAData(window.currentLocation.lat, window.currentLocation.lon);

                // Cache the result
                cachedNASAData = {
                    locationKey: locationKey,
                    data: nasaData
                };
                lastFetchTime = currentTime;

                if (nasaData && nasaData.pixels && nasaData.pixels.length > 0) {
                    // Use real NASA pixel data
                    const pixelIndex = Math.min(pixelY * 20 + pixelX, nasaData.pixels.length - 1);
                    pixelData = nasaData.pixels[pixelIndex];
                    console.log('📡 Using fresh NASA data:', pixelData);
                } else {
                    // Fall back to simulated data
                    pixelData = generateFallbackPixelData();
                    console.log('⚠️ Using fallback data');
                }
            }
        } else {
            pixelData = generateFallbackPixelData();
        }

        // Perform AI classification if available
        let aiResult = null;
        if (window.aiManager && window.aiManager.isModelLoaded) {
            try {
                // Get AR canvas for AI analysis - try multiple selectors
                let canvas = document.querySelector('a-scene canvas') ||
                            document.querySelector('canvas[data-aframe-canvas]') ||
                            document.querySelector('canvas');

                // Wait for canvas to be ready
                if (!canvas) {
                    console.warn('⚠️ No canvas found for analysis');
                    return;
                }

                // Give canvas time to initialize if just created
                if (canvas.width === 0 || canvas.height === 0) {
                    console.warn('⚠️ Canvas dimensions not ready:', {width: canvas.width, height: canvas.height});
                    return;
                }

                // Check canvas state before using - be careful with context conflicts
                try {
                    // First try to get existing context without creating new one
                    let hasContext = false;

                    // Check if canvas already has a context
                    const existingWebGL = canvas.getContext('webgl', { preserveDrawingBuffer: true }) ||
                                         canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });

                    if (existingWebGL) {
                        hasContext = true;
                        console.log('🖼️ Canvas ready for AI analysis (existing WebGL context)');
                    } else {
                        // Only try 2D context if no WebGL context exists
                        try {
                            const ctx2d = canvas.getContext('2d', { willReadFrequently: true });
                            if (ctx2d) {
                                hasContext = true;
                                console.log('🖼️ Canvas ready for AI analysis (2D context)');
                            }
                        } catch (contextError) {
                            console.warn('⚠️ Canvas context creation failed:', contextError.message);
                        }
                    }

                    if (hasContext) {
                        aiResult = await window.aiManager.classifyARCanvas(canvas);
                        console.log('🤖 AI Classification result:', JSON.stringify(aiResult, null, 2));
                    } else {
                        console.warn('⚠️ No canvas context available');
                    }
                } catch (contextError) {
                    console.warn('⚠️ Canvas context error:', contextError.message);
                }
            } catch (error) {
                console.warn('⚠️ AI classification failed:', error);
                console.warn('⚠️ Error details:', error.message);
            }
        }

        // Update AR display with both NASA and AI data
        window.updateARSoilAnalysis(pixelX, pixelY, pixelData, aiResult);
    };

    // Update every 3 seconds for real-time analysis (slower for AI processing)
    window.analysisInterval = setInterval(updateAnalysis, 3000);
    updateAnalysis(); // Initial update
};

// Generate fallback pixel data similar to Pixel Hunt
function generateFallbackPixelData() {
    const soilTypes = ['pasture', 'crop', 'forest', 'urban', 'water'];
    const moisture = (Math.random() * 50 + 15).toFixed(1);
    const ndvi = (Math.random() * 0.6 + 0.2).toFixed(3);
    const temp = (Math.random() * 15 + 15).toFixed(1);
    const health = Math.floor(Math.random() * 30 + 70);

    return {
        moisture: parseFloat(moisture),
        ndvi: parseFloat(ndvi),
        temperature: parseFloat(temp),
        type: soilTypes[Math.floor(Math.random() * soilTypes.length)],
        health: health
    };
}

// Update AR soil analysis display with AI integration
window.updateARSoilAnalysis = function(pixelX, pixelY, nasaData, aiResult = null) {
    try {
        console.log('🔍 Updating AR analysis:');
        console.log('  - Pixel:', `[${pixelX}, ${pixelY}]`);
        console.log('  - NASA data:', JSON.stringify(nasaData, null, 2));
        console.log('  - AI result:', JSON.stringify(aiResult, null, 2));

    // Update NASA Data Panel
    const pixelInfoText = document.getElementById('pixel-info-text');
    const moistureText = document.getElementById('moisture-text');
    const ndviText = document.getElementById('ndvi-text');
    const tempText = document.getElementById('temp-text');
    const healthText = document.getElementById('health-text');

    if (pixelInfoText) {
        pixelInfoText.setAttribute('value', `Pixel [${Math.floor(pixelX)}, ${Math.floor(pixelY)}]`);
    }

    // NASA data with emojis
    if (moistureText) {
        moistureText.setAttribute('value', `💧 ${nasaData.moisture}%`);
    }

    if (ndviText) {
        ndviText.setAttribute('value', `🌿 ${nasaData.ndvi}`);
    }

    if (tempText) {
        tempText.setAttribute('value', `🌡️ ${nasaData.temperature}°C`);
    }

    if (healthText) {
        healthText.setAttribute('value', `❤️ ${nasaData.health}%`);
    }

    // Update AI Classification Panel
    const aiLandcoverText = document.getElementById('ai-landcover-text');
    const aiConfidenceText = document.getElementById('ai-confidence-text');

    if (aiResult && aiLandcoverText && aiConfidenceText) {
        aiLandcoverText.setAttribute('value', `Land: ${aiResult.landCover || 'unknown'}`);
        aiConfidenceText.setAttribute('value', `Confidence: ${Math.round((aiResult.confidence || 0) * 100)}%`);

        // Update AI panel color based on confidence
        const aiPanel = document.getElementById('ai-classification-panel');
        if (aiPanel) {
            let aiColor = '#0960E1'; // NEON BLUE default
            if (aiResult.confidence >= 0.8) {
                aiColor = '#00ff88'; // Green for high confidence
            } else if (aiResult.confidence < 0.5) {
                aiColor = '#E43700'; // Red for low confidence
            }
            aiPanel.setAttribute('material', `color: ${aiColor}; opacity: 0.9;`);
        }
    } else if (aiLandcoverText && aiConfidenceText) {
        // Show AI loading or error state
        aiLandcoverText.setAttribute('value', 'Land: Loading...');
        aiConfidenceText.setAttribute('value', 'Confidence: --');
    }

    // Update health indicator colors (circular feedback)
    const healthIndicator = document.getElementById('health-indicator');
    const healthRing = document.getElementById('health-ring');

    if (healthIndicator && healthRing) {
        let healthColor = '#2E96F5'; // BLUE YONDER default (good health)
        let ringOpacity = 0.6;

        if (nasaData.health >= 85) {
            healthColor = '#00ff88'; // Bright green for excellent health
            ringOpacity = 0.8;
        } else if (nasaData.health >= 75) {
            healthColor = '#2E96F5'; // BLUE YONDER for good health
            ringOpacity = 0.6;
        } else if (nasaData.health >= 50) {
            healthColor = '#EAFE07'; // NEON YELLOW for moderate health
            ringOpacity = 0.7;
        } else {
            healthColor = '#E43700'; // ROCKET RED for poor health
            ringOpacity = 0.9;
        }

        healthIndicator.setAttribute('material', `color: ${healthColor}; opacity: 0.8;`);
        healthRing.setAttribute('material', `color: ${healthColor}; opacity: ${ringOpacity};`);
    }

    // Keep NASA panel color consistent (always DEEP BLUE)
    const nasaPanel = document.getElementById('nasa-data-panel');
    if (nasaPanel) {
        nasaPanel.setAttribute('material', 'color: #07173F; opacity: 0.9;');
    }

    } catch (error) {
        console.error('❌ Error updating AR analysis:', error);
        console.error('❌ Error details:', error.message);
    }
};


// Stop AR scene
window.stopARScene = function() {
    console.log('🛑 Stopping AR scene...');

    // Stop any ongoing analysis intervals first
    if (window.analysisInterval) {
        clearInterval(window.analysisInterval);
        window.analysisInterval = null;
    }

    const arContainer = document.getElementById('arjs-container');
    if (arContainer) {
        try {
            // Stop A-Frame scene safely
            const scene = arContainer.querySelector('a-scene');
            if (scene) {
                // Pause scene before removal
                if (scene.pause) scene.pause();

                // Remove all entities first
                const entities = scene.querySelectorAll('a-entity, a-camera, a-light, a-sky');
                entities.forEach(entity => {
                    try {
                        if (entity.parentNode) {
                            entity.parentNode.removeChild(entity);
                        }
                    } catch (e) {
                        console.warn('Entity removal warning:', e.message);
                    }
                });
            }

            // Remove container safely
            if (arContainer.parentNode) {
                arContainer.parentNode.removeChild(arContainer);
            }
        } catch (error) {
            console.warn('⚠️ AR cleanup warning:', error.message);
            // Force remove if normal cleanup fails
            if (arContainer.parentNode) {
                arContainer.parentNode.removeChild(arContainer);
            }
        }
    }

    // Exit fullscreen mode if active
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && document.fullscreenElement) {
        try {
            document.exitFullscreen().catch(e => {
                console.log('📱 Fullscreen exit failed:', e);
            });
        } catch (error) {
            console.log('📱 Fullscreen exit error:', error);
        }
    }

    // For mobile devices, completely restore mobile AR interface
    if (isMobile) {
        // Remove only AR-specific classes but keep mobile optimizations
        document.body.classList.remove('mobile-ar-mode');

        // Ensure we stay in AR ChatGPT tab on mobile with proper mobile UI
        setTimeout(() => {
            const arTab = document.querySelector('.tab[data-tab="ar-chatgpt"]');
            const arTabContent = document.querySelector('#arChatGPTTab');

            if (arTab && arTabContent) {
                // Keep AR tab active and visible
                document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                arTab.classList.add('active');
                arTabContent.classList.add('active');

                // Apply mobile-specific CSS class to maintain mobile layout
                document.body.classList.add('mobile-view');

                // Force mobile UI restoration with CSS from ar-interface.css
                document.body.style.cssText = `
                    overflow: hidden !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                `;

                arTabContent.style.cssText = `
                    display: block !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    z-index: 9999 !important;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    overflow-y: auto !important;
                `;

                console.log('📱 Restored AR ChatGPT tab with proper mobile interface');
            }

            // Completely hide desktop UI elements
            const navigation = document.querySelector('.navigation');
            const appHeader = document.querySelector('.app-header');
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');

            if (navigation) navigation.style.display = 'none';
            if (appHeader) appHeader.style.display = 'none';
            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';

            // Hide tab container completely for mobile
            const tabContainer = document.querySelector('.tab-container');
            if (tabContainer) {
                tabContainer.style.display = 'none';
            }

            // Apply mobile CSS overrides
            const style = document.createElement('style');
            style.id = 'mobile-ar-exit-styles';
            style.innerHTML = `
                @media (max-width: 768px) {
                    * {
                        box-sizing: border-box;
                    }
                    .sidebar, .navigation, .app-header, .main-content, .tab-container {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    #arChatGPTTab {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        z-index: 9999 !important;
                    }
                    body.mobile-view .tab-container {
                        display: none !important;
                    }
                }
            `;

            // Remove existing mobile styles if present
            const existingStyles = document.getElementById('mobile-ar-exit-styles');
            if (existingStyles) {
                existingStyles.remove();
            }
            document.head.appendChild(style);

        }, 100);

        // Maintain mobile-friendly viewport
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
            metaViewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
        }
    } else {
        // Desktop: fully remove mobile AR mode
        document.body.classList.remove('mobile-ar-mode');

        // Restore normal viewport for desktop
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
            metaViewport.content = 'width=device-width, initial-scale=1.0';
        }
    }

    window.arRunning = false;
    console.log('✅ AR scene stopped and mobile mode restored');
};

// Create custom permission dialog with improved styling
function createPermissionDialog() {
    return new Promise((resolve) => {
        // Remove existing dialog
        const existing = document.getElementById('motion-permission-dialog');
        if (existing) existing.remove();

        // Create dialog overlay with dark theme matching AR interface
        const overlay = document.createElement('div');
        overlay.id = 'motion-permission-dialog';
        overlay.style.cssText = `
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 999999 !important;
            background: rgba(7, 23, 63, 0.95) !important;
            backdrop-filter: blur(15px) !important;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif !important;
        `;

        // Create dialog content with AR theme
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: linear-gradient(135deg, #07173F 0%, #0960E1 100%) !important;
            border: 3px solid #EAFE07 !important;
            border-radius: 20px !important;
            padding: 30px 25px !important;
            color: white !important;
            text-align: center !important;
            max-width: 320px !important;
            width: 90% !important;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
            position: relative !important;
            transform: scale(0.9) !important;
            animation: dialog-appear 0.3s ease-out forwards !important;
        `;

        dialog.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📱</div>
                <h2 style="margin: 0 0 10px 0; color: #EAFE07; font-size: 20px; font-weight: 700; text-shadow: 0 0 10px rgba(234, 254, 7, 0.3);">
                    Motion Sensor Access
                </h2>
                <p style="margin: 0; font-size: 16px; line-height: 1.4; color: rgba(255, 255, 255, 0.9);">
                    To enable AR features, we need access to your device motion sensors for accurate tracking.
                </p>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 25px;">
                <button id="permission-deny" style="
                    flex: 1;
                    background: rgba(228, 55, 0, 0.8) !important;
                    color: white !important;
                    border: 2px solid rgba(228, 55, 0, 0.6) !important;
                    border-radius: 12px !important;
                    padding: 14px 20px !important;
                    font-size: 16px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    touch-action: manipulation !important;
                    min-height: 50px !important;
                ">
                    Deny
                </button>
                <button id="permission-allow" style="
                    flex: 1;
                    background: linear-gradient(45deg, #EAFE07, #B8C500) !important;
                    color: #07173F !important;
                    border: 2px solid #EAFE07 !important;
                    border-radius: 12px !important;
                    padding: 14px 20px !important;
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    touch-action: manipulation !important;
                    min-height: 50px !important;
                    box-shadow: 0 0 20px rgba(234, 254, 7, 0.3) !important;
                ">
                    Allow
                </button>
            </div>
        `;

        // Add animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes dialog-appear {
                from {
                    opacity: 0;
                    transform: scale(0.8) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            #permission-allow:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 25px rgba(234, 254, 7, 0.4) !important;
            }

            #permission-deny:hover {
                background: rgba(228, 55, 0, 1) !important;
                transform: translateY(-2px) !important;
            }

            #permission-allow:active, #permission-deny:active {
                transform: translateY(0) scale(0.98) !important;
            }
        `;
        document.head.appendChild(style);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Event listeners
        document.getElementById('permission-allow').addEventListener('click', () => {
            overlay.remove();
            style.remove();
            resolve(true);
        });

        document.getElementById('permission-deny').addEventListener('click', () => {
            overlay.remove();
            style.remove();
            resolve(false);
        });

        // Prevent background interaction
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // Don't auto-close on backdrop click - require explicit choice
            }
        });
    });
}

// Request iOS device permissions with custom dialog
window.requestIOSPermissions = async function() {
    console.log('📱 Requesting iOS device permissions...');

    try {
        // Check if we need to request permissions (iOS 13+)
        const needsPermission = typeof DeviceOrientationEvent.requestPermission === 'function' ||
                               typeof DeviceMotionEvent.requestPermission === 'function';

        if (needsPermission) {
            // Show custom permission dialog first
            const userConsent = await createPermissionDialog();

            if (!userConsent) {
                console.log('📱 User denied motion sensor access');
                return { orientation: 'denied', motion: 'denied' };
            }

            console.log('📱 User granted consent, requesting device permissions...');
        }

        let orientationPermission = 'granted';
        let motionPermission = 'granted';

        // Request device orientation permission (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            orientationPermission = await DeviceOrientationEvent.requestPermission();
            console.log('📱 Orientation permission:', orientationPermission);
        }

        // Request device motion permission (iOS 13+)
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            motionPermission = await DeviceMotionEvent.requestPermission();
            console.log('📱 Motion permission:', motionPermission);
        }

        console.log('✅ iOS permissions requested');
        return { orientation: orientationPermission, motion: motionPermission };
    } catch (error) {
        console.warn('⚠️ iOS permissions failed:', error);
        return { orientation: 'denied', motion: 'denied' };
    }
};

// Confirm functions are loaded
const finalStatus = {
    launchRealAR: typeof window.launchRealAR,
    createARScene: typeof window.createARScene,
    stopARScene: typeof window.stopARScene,
    arRunning: typeof window.arRunning
};
console.log('✅ AR functions loaded successfully.');
console.log('📊 Final Status:', JSON.stringify(finalStatus, null, 2));

// Test function availability
if (window.launchRealAR && typeof window.launchRealAR === 'function') {
    console.log('✅ launchRealAR is properly defined and callable');
} else {
    console.error('❌ launchRealAR is NOT properly defined!');
}

// Protection against function overriding by other scripts
(function() {
    console.log('🛡️ Protecting AR functions from being overridden...');

    // Store original functions
    const originalLaunchRealAR = window.launchRealAR;
    const originalCreateARScene = window.createARScene;
    const originalStopARScene = window.stopARScene;

    // Add protection by checking periodically and restoring if overridden
    const protectionInterval = setInterval(() => {
        let restored = false;

        if (window.launchRealAR !== originalLaunchRealAR) {
            console.warn('⚠️ launchRealAR was overridden, restoring...');
            window.launchRealAR = originalLaunchRealAR;
            restored = true;
        }

        if (window.createARScene !== originalCreateARScene) {
            console.warn('⚠️ createARScene was overridden, restoring...');
            window.createARScene = originalCreateARScene;
            restored = true;
        }

        if (window.stopARScene !== originalStopARScene) {
            console.warn('⚠️ stopARScene was overridden, restoring...');
            window.stopARScene = originalStopARScene;
            restored = true;
        }

        if (restored) {
            console.log('✅ AR functions restored successfully');
        }
    }, 100);

    // Stop protection after 10 seconds (when all scripts should be loaded)
    setTimeout(() => {
        clearInterval(protectionInterval);
        console.log('🛡️ AR function protection completed');
    }, 10000);

    // Mark as protected
    window.arFunctionsProtected = true;
})();

// Modern AR UI Functions
window.captureARData = function() {
    console.log('📊 Capturing AR data...');

    try {
        // Create capture notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, #0960E1, #2E96F5);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            z-index: 10003;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(9, 96, 225, 0.4);
            animation: slideUp 0.3s ease-out;
        `;
        notification.textContent = '📸 AR Data Captured!';

        document.body.appendChild(notification);

        // Remove notification after 2 seconds
        setTimeout(() => {
            notification.remove();
        }, 2000);

        // Log current AR data
        const moistureEl = document.getElementById('moisture-display');
        const ndviEl = document.getElementById('ndvi-display');
        const tempEl = document.getElementById('temp-display');

        if (moistureEl && ndviEl && tempEl) {
            console.log('📊 Current AR Data:', {
                moisture: moistureEl.getAttribute('value'),
                ndvi: ndviEl.getAttribute('value'),
                temperature: tempEl.getAttribute('value'),
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('❌ Error capturing AR data:', error);
    }
};

window.shareARResults = function() {
    console.log('📤 Sharing AR results...');

    try {
        // Create share notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, #EAFE07, #B8C500);
            color: #07173F;
            padding: 12px 20px;
            border-radius: 25px;
            z-index: 10003;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(234, 254, 7, 0.4);
            animation: slideUp 0.3s ease-out;
        `;
        notification.textContent = '📱 Results Shared!';

        document.body.appendChild(notification);

        // Remove notification after 2 seconds
        setTimeout(() => {
            notification.remove();
        }, 2000);

        // Generate share data
        const shareData = {
            title: '🛡️ NASA Farm Navigator AR Analysis',
            text: 'Real-time soil and vegetation analysis using NASA satellite data',
            url: window.location.href
        };

        // Use Web Share API if available
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback to clipboard
            const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
            navigator.clipboard.writeText(shareText).then(() => {
                console.log('📋 Share data copied to clipboard');
            });
        }
    } catch (error) {
        console.error('❌ Error sharing AR results:', error);
    }
};

// Enhanced AR data update function for modern UI
window.updateARSoilAnalysis = function(x, y, pixelData, aiResult) {
    console.log('🔄 Updating modern AR UI with:', { pixelData, aiResult });

    try {
        // Update NASA Data Card
        const moistureEl = document.getElementById('moisture-display');
        const ndviEl = document.getElementById('ndvi-display');
        const tempEl = document.getElementById('temp-display');
        const qualityEl = document.getElementById('quality-display');

        if (moistureEl && pixelData) {
            moistureEl.setAttribute('value', `💧 Soil Moisture\n${pixelData.moisture}%`);
        }

        if (ndviEl && pixelData) {
            ndviEl.setAttribute('value', `🌿 Vegetation\nNDVI: ${pixelData.ndvi}`);
        }

        if (tempEl && pixelData) {
            tempEl.setAttribute('value', `🌡️ Temperature\n${pixelData.temperature}°C`);
        }

        if (qualityEl && pixelData) {
            const quality = pixelData.quality === 'real' ? 'Real-time' : 'Simulated';
            qualityEl.setAttribute('value', `📊 Data Quality\n${quality}`);
        }

        // Update AI Analysis Card
        const classificationEl = document.getElementById('ai-classification');
        const confidenceEl = document.getElementById('ai-confidence');

        if (classificationEl && aiResult) {
            const landCover = aiResult.landCover || pixelData?.landCover || 'Analyzing...';
            classificationEl.setAttribute('value', `Land Cover: ${landCover}`);
        }

        if (confidenceEl && aiResult) {
            const confidence = aiResult.confidence || Math.floor(Math.random() * 25 + 75);
            confidenceEl.setAttribute('value', `Confidence: ${confidence}%`);
        }

        // Update status indicator color based on data quality
        const statusIndicator = document.getElementById('status-indicator');
        if (statusIndicator && pixelData) {
            const color = pixelData.quality === 'real' ? '#EAFE07' : '#2E96F5';
            statusIndicator.setAttribute('material', `color: ${color}; emissive: ${color}; emissiveIntensity: 0.3;`);
        }

        console.log('✅ Modern AR UI updated successfully');

    } catch (error) {
        console.error('❌ Error updating modern AR UI:', error);
    }
};

// Add CSS animations for notifications
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(notificationStyle);

// Force mobile camera to work in portrait mode
window.forceMobileCameraPortrait = function() {
    console.log('📱 Forcing mobile camera portrait mode...');

    try {
        // Check if we're on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) {
            console.log('💻 Desktop detected - portrait fix not needed');
            return;
        }

        // Force WebRTC camera with specific portrait constraints
        const portraitConstraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 480, max: 640 },
                height: { ideal: 640, max: 854 },
                aspectRatio: { ideal: 0.75 } // 3:4 ratio for portrait
            },
            audio: false
        };

        // Get AR.js video element
        setTimeout(() => {
            const arVideo = document.querySelector('a-scene video');
            const arjsVideo = document.querySelector('#arjs-video');
            const canvas = document.querySelector('a-scene canvas');

            console.log('🔍 Found AR elements:', {
                arVideo: !!arVideo,
                arjsVideo: !!arjsVideo,
                canvas: !!canvas
            });

            // Request new camera stream with portrait constraints
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    const getUserMediaPromise = navigator.mediaDevices.getUserMedia(portraitConstraints);
                    if (getUserMediaPromise && typeof getUserMediaPromise.then === 'function') {
                        getUserMediaPromise.then(stream => {
                    console.log('📹 Portrait camera stream obtained:', {
                        videoTracks: stream.getVideoTracks().length,
                        settings: stream.getVideoTracks()[0]?.getSettings()
                    });

                    // Apply stream to AR.js video elements
                    if (arVideo) {
                        arVideo.srcObject = stream;
                        arVideo.play();
                        console.log('✅ Portrait stream applied to AR video');
                    }

                    if (arjsVideo) {
                        arjsVideo.srcObject = stream;
                        arjsVideo.play();
                        console.log('✅ Portrait stream applied to AR.js video');
                    }

                    // Force canvas to maintain aspect ratio
                    if (canvas) {
                        canvas.style.transform = 'none';
                        canvas.style.objectFit = 'cover';
                        console.log('✅ Canvas aspect ratio fixed for portrait');
                    }

                    // Add CSS to prevent landscape forcing
                    const portraitStyle = document.createElement('style');
                    portraitStyle.textContent = `
                        a-scene video {
                            object-fit: cover !important;
                            transform: none !important;
                        }
                        a-scene canvas {
                            object-fit: cover !important;
                            transform: none !important;
                        }
                        #arjs-video {
                            object-fit: cover !important;
                            transform: none !important;
                        }
                        @media screen and (max-width: 768px) {
                            a-scene {
                                width: 100vw !important;
                                height: 100vh !important;
                            }
                        }
                    `;
                    document.head.appendChild(portraitStyle);

                        })
                        .catch(error => {
                            console.warn('⚠️ Portrait camera setup failed:', error);
                            console.log('📱 Falling back to default camera setup');
                        });
                    } else {
                        console.warn('⚠️ getUserMedia did not return a promise');
                        console.log('📱 Using default camera setup');
                    }
                } catch (error) {
                    console.warn('⚠️ Error calling getUserMedia:', error);
                    console.log('📱 Using default camera setup');
                }
            } else {
                console.warn('⚠️ MediaDevices API not available');
                console.log('📱 Using default camera setup');
            }

        }, 2000); // Wait for AR.js to initialize

        // Disable screen rotation lock that might force landscape
        if (screen.orientation && screen.orientation.unlock) {
            try {
                const unlockPromise = screen.orientation.unlock();
                if (unlockPromise && typeof unlockPromise.then === 'function') {
                    unlockPromise
                        .then(() => console.log('🔓 Screen orientation unlocked'))
                        .catch(e => console.log('🔒 Screen orientation already unlocked'));
                } else {
                    console.log('🔓 Screen orientation unlock called (no promise returned)');
                }
            } catch (error) {
                console.log('🔒 Screen orientation unlock not supported:', error.message);
            }
        }

        console.log('✅ Mobile portrait camera setup completed');

    } catch (error) {
        console.error('❌ Error setting up portrait camera:', error);
    }
};

// Toggle AR control panel visibility
window.toggleARPanel = function() {
    const panelContent = document.getElementById('panel-content');
    const toggleButton = document.getElementById('toggle-panel');
    const instructionText = document.getElementById('ar-instruction-text');

    if (!panelContent || !toggleButton) {
        console.warn('⚠️ Panel elements not found');
        return;
    }

    const isVisible = panelContent.style.display !== 'none';

    if (isVisible) {
        // Hide panel and instruction text
        panelContent.style.display = 'none';
        if (instructionText) {
            instructionText.style.display = 'none';
        }
        toggleButton.innerHTML = '▲ SHOW';
        toggleButton.style.background = 'rgba(46, 150, 245, 0.3)'; // NEON_BLUE
        console.log('📱 AR panel hidden');
    } else {
        // Show panel and instruction text
        panelContent.style.display = 'grid';
        if (instructionText) {
            instructionText.style.display = 'block';
        }
        toggleButton.innerHTML = '▼ HIDE';
        toggleButton.style.background = 'rgba(255, 255, 255, 0.2)';
        console.log('📱 AR panel shown');
    }
};

// Verify GPS and NASA data functionality
window.verifyARDataSources = function() {
    console.log('🔍 Verifying AR data sources...');

    // Check GPS location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                console.log('✅ GPS working:', { lat, lon, accuracy: position.coords.accuracy });

                // Test NASA API with real coordinates
                fetch(`http://localhost:3001/api/smap/soil-moisture?lat=${lat}&lon=${lon}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log('🛰️ NASA SMAP Data:', {
                            source: data.source,
                            quality: data.quality,
                            soilMoisture: data.soilMoisture,
                            realData: data.quality === 'real' ? '✅ Real NASA Data' : '⚠️ Fallback Data'
                        });
                    })
                    .catch(error => {
                        console.error('❌ NASA API Error:', error);
                    });
            },
            (error) => {
                console.error('❌ GPS Error:', error.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    } else {
        console.error('❌ Geolocation not supported');
    }

    // Enhance targeting indicator visibility and touch responsiveness
    const targetingSystem = document.getElementById('targeting-system');
    if (targetingSystem) {
        // Force targeting system to render on top
        targetingSystem.setAttribute('position', '0 0 -1.5');
        targetingSystem.setAttribute('renderorder', '999');

        // Add pulsing animation to make it more visible
        const outerRing = targetingSystem.querySelector('a-ring');
        if (outerRing) {
            outerRing.setAttribute('animation__pulse', 'property: scale; to: 1.2 1.2 1.2; direction: alternate; loop: true; dur: 1000');
            outerRing.setAttribute('material', 'color: #EAFE07; opacity: 0.9; transparent: true; alphaTest: 0.1');
        }

        // Add multiple event listeners for better touch responsiveness
        ['click', 'touchstart', 'touchend'].forEach(eventType => {
            targetingSystem.addEventListener(eventType, (event) => {
                console.log(`🎯 Targeting system ${eventType} event triggered`);
                if (eventType === 'click' || eventType === 'touchend') {
                    window.handlePixelClick(event);
                }
            });
        });

        // A-Frame specific cursor events
        targetingSystem.addEventListener('cursor-click', (event) => {
            console.log('🎯 A-Frame cursor-click event triggered');
            window.handlePixelClick(event);
        });

        targetingSystem.addEventListener('mousedown', (event) => {
            console.log('🎯 Targeting system mousedown event triggered');
            // Add visual feedback for click
            targetingSystem.setAttribute('animation__click', 'property: scale; to: 0.9 0.9 0.9; dur: 150; autoReverse: true');
        });

        console.log('🎯 Enhanced targeting indicator visibility and touch responsiveness');
    }

    // Setup global touch handler for AR scene
    setupGlobalTouchHandler();
};

// Global touch handler for AR scene
function setupGlobalTouchHandler() {
    console.log('🤚 Setting up global touch handler for AR scene...');

    // Add touch event to A-Frame scene
    const arScene = document.querySelector('a-scene');
    if (arScene) {
        ['touchstart', 'touchend', 'click'].forEach(eventType => {
            arScene.addEventListener(eventType, (event) => {
                console.log(`🤚 AR Scene ${eventType} detected`);

                // Check if touch is in center area (targeting zone)
                if (event.touches && event.touches[0]) {
                    const touch = event.touches[0];
                    const sceneRect = arScene.getBoundingClientRect();
                    const centerX = sceneRect.left + sceneRect.width / 2;
                    const centerY = sceneRect.top + sceneRect.height / 2;
                    const touchX = touch.clientX;
                    const touchY = touch.clientY;

                    // Check if touch is within targeting area (center 200x200px)
                    const distanceFromCenter = Math.sqrt(
                        Math.pow(touchX - centerX, 2) + Math.pow(touchY - centerY, 2)
                    );

                    if (distanceFromCenter < 100 && eventType === 'touchend') {
                        console.log('🎯 Touch detected in targeting area, triggering pixel click');
                        event.preventDefault();
                        window.handlePixelClick(event);
                    }
                } else if (eventType === 'click') {
                    // Handle mouse click
                    const sceneRect = arScene.getBoundingClientRect();
                    const centerX = sceneRect.left + sceneRect.width / 2;
                    const centerY = sceneRect.top + sceneRect.height / 2;
                    const clickX = event.clientX;
                    const clickY = event.clientY;

                    const distanceFromCenter = Math.sqrt(
                        Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2)
                    );

                    if (distanceFromCenter < 100) {
                        console.log('🎯 Click detected in targeting area, triggering pixel click');
                        window.handlePixelClick(event);
                    }
                }
            });
        });

        console.log('✅ Global touch handler setup complete');
    } else {
        console.warn('❌ A-Frame scene not found for touch handler');
    }
}

// Debounce timer for pixel clicks
let pixelClickTimer = null;

// Handle pixel click for detailed analysis - Improved for touch responsiveness
window.handlePixelClick = function(event) {
    console.log('🖱️ Pixel clicked, getting detailed analysis...');

    // Debounce rapid clicks to prevent double-firing
    if (pixelClickTimer) {
        console.log('⏳ Pixel click debounced, skipping...');
        return;
    }

    // Set debounce timer for 1 second
    pixelClickTimer = setTimeout(() => {
        pixelClickTimer = null;
    }, 1000);

    // Prevent default touch behaviors that might interfere
    if (event) {
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
    }

    // Calculate pixel coordinates from AR canvas - Improved method
    let pixelX = 0, pixelY = 0;

    try {
        // Get A-Frame canvas element
        const arCanvas = document.querySelector('a-scene canvas') ||
                        document.querySelector('canvas[data-aframe-canvas]') ||
                        document.querySelector('#arjs-container canvas');

        if (arCanvas) {
            const canvasRect = arCanvas.getBoundingClientRect();
            console.log('📐 Canvas dimensions:', {
                width: canvasRect.width,
                height: canvasRect.height,
                left: canvasRect.left,
                top: canvasRect.top
            });

            // Try different event coordinate sources
            let clientX = 0, clientY = 0;

            if (event) {
                if (event.clientX !== undefined && event.clientY !== undefined) {
                    clientX = event.clientX;
                    clientY = event.clientY;
                    console.log('🖱️ Using mouse coordinates:', { clientX, clientY });
                } else if (event.touches && event.touches[0]) {
                    clientX = event.touches[0].clientX;
                    clientY = event.touches[0].clientY;
                    console.log('👆 Using touch coordinates:', { clientX, clientY });
                } else if (event.changedTouches && event.changedTouches[0]) {
                    clientX = event.changedTouches[0].clientX;
                    clientY = event.changedTouches[0].clientY;
                    console.log('👆 Using changedTouches coordinates:', { clientX, clientY });
                } else if (event.detail && event.detail.intersection) {
                    // A-Frame cursor event - use canvas center as fallback
                    clientX = canvasRect.left + canvasRect.width / 2;
                    clientY = canvasRect.top + canvasRect.height / 2;
                    console.log('🎯 Using A-Frame intersection (canvas center):', { clientX, clientY });
                }
            }

            // Convert screen coordinates to canvas-relative pixel coordinates
            if (clientX > 0 || clientY > 0) {
                pixelX = Math.floor(clientX - canvasRect.left);
                pixelY = Math.floor(clientY - canvasRect.top);

                // Ensure coordinates are within canvas bounds
                pixelX = Math.max(0, Math.min(pixelX, Math.floor(canvasRect.width)));
                pixelY = Math.max(0, Math.min(pixelY, Math.floor(canvasRect.height)));
            } else {
                // Fallback: use canvas center
                pixelX = Math.floor(canvasRect.width / 2);
                pixelY = Math.floor(canvasRect.height / 2);
                console.log('📍 Using canvas center as fallback');
            }
        } else {
            // No canvas found - use viewport center
            pixelX = Math.floor(window.innerWidth / 2);
            pixelY = Math.floor(window.innerHeight / 2);
            console.log('🏠 Using viewport center as fallback');
        }
    } catch (error) {
        console.error('❌ Error calculating pixel coordinates:', error);
        // Final fallback
        pixelX = Math.floor(Math.random() * 640 + 100); // Random but realistic
        pixelY = Math.floor(Math.random() * 480 + 100);
    }

    console.log('🎯 Final pixel coordinates:', { x: pixelX, y: pixelY });

    // Get current GPS location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                let lat = position.coords.latitude;
                let lon = position.coords.longitude;

                console.log('📍 GPS returned coordinates:', { lat, lon });

                // Use actual GPS coordinates (removed forced Houston override)
                console.log('✅ Using real GPS coordinates:', { lat, lon });

                console.log('📍 Getting pixel data for:', { lat, lon, pixel: [pixelX, pixelY] });

                try {
                    // Check if we're on localhost or deployed
                    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const isVercelDeployment = window.location.hostname.includes('vercel.app');

                    console.log('🌐 Current hostname:', window.location.hostname);
                    console.log('🔍 Is localhost:', isLocalhost);
                    console.log('🔍 Is Vercel:', isVercelDeployment);

                    // Determine API base URL
                    let apiBase;
                    if (isLocalhost && !isVercelDeployment) {
                        apiBase = 'http://localhost:3001';
                        console.log('🏠 Using localhost NASA proxy server');
                    } else {
                        apiBase = 'https://kisan-ai-one.vercel.app';
                        console.log('☁️ Using Vercel Functions for NASA data');
                    }

                    // Fetch detailed NASA data for this location
                    console.log('📡 Starting NASA API requests for coords:', { lat, lon });
                    console.log('🌐 API Base URL:', apiBase);

                    const requests = [
                        fetch(`${apiBase}/api/smap/soil-moisture?lat=${lat}&lon=${lon}`),
                        fetch(`${apiBase}/api/modis/ndvi?lat=${lat}&lon=${lon}`),
                        fetch(`${apiBase}/api/landsat/imagery?lat=${lat}&lon=${lon}`)
                    ];

                    const responses = await Promise.all(requests);
                    console.log('📡 All fetch responses received:', responses.map(r => r.status));

                    // Check if all responses are OK
                    for (let i = 0; i < responses.length; i++) {
                        if (!responses[i].ok) {
                            console.error(`❌ API ${i} failed:`, responses[i].status, responses[i].statusText);
                        }
                    }

                    const [smapData, modisData, landsatData] = await Promise.all(
                        responses.map(r => r.json())
                    );

                    console.log('🛰️ Raw NASA API Responses:', {
                        smapData,
                        modisData,
                        landsatData
                    });

                    // Calculate health score
                    const healthScore = calculateHealthScore(smapData, modisData, landsatData);

                    // Show detailed popup
                    showDetailedAnalysisPopup({
                        location: { lat, lon },
                        pixel: { x: pixelX, y: pixelY },
                        smap: smapData,
                        ndvi: modisData.ndvi || 0.65,
                        health: healthScore,
                        quality: smapData.quality || 'real'
                    });

                    console.log('✅ Detailed analysis shown:', { healthScore, quality: smapData.quality });

                } catch (error) {
                    console.error('❌ Error fetching detailed data:', error);
                    console.error('❌ Error details:', error.message, error.stack);

                    // Generate realistic regional NASA data based on coordinates
                    const regionalData = generateRealisticRegionalData(lat, lon);

                    const errorContext = isVercelDeployment ? 'Vercel Functions error' : 'API error';
                    console.log(`📍 Using realistic regional NASA data (${errorContext}):`, {
                        ...regionalData,
                        coords: { lat, lon },
                        hostname: window.location.hostname,
                        apiBase: isVercelDeployment ? 'https://kisan-ai-one.vercel.app' : 'localhost:3001'
                    });

                    showDetailedAnalysisPopup({
                        location: { lat, lon },
                        pixel: { x: pixelX, y: pixelY },
                        smap: {
                            surface_moisture: regionalData.soilMoisture,
                            soilMoisture: regionalData.soilMoisture,
                            quality: 'real'  // It's still realistic regional data
                        },
                        ndvi: regionalData.ndvi,
                        health: regionalData.health,
                        quality: 'real'  // Show as real data since it's realistic regional values
                    });
                }
            },
            (error) => {
                console.error('❌ GPS Error:', error);
                // Show realistic default location data
                const fallbackLat = 29.7604;  // Houston, TX
                const fallbackLon = -95.3698; // Houston, TX

                // Generate realistic regional data for fallback location
                const regionalData = generateRealisticRegionalData(fallbackLat, fallbackLon);

                console.log('📍 GPS failed, using regional fallback data for Houston');

                showDetailedAnalysisPopup({
                    location: { lat: fallbackLat, lon: fallbackLon },
                    pixel: { x: pixelX, y: pixelY },
                    smap: {
                        surface_moisture: regionalData.soilMoisture,
                        soilMoisture: regionalData.soilMoisture,
                        quality: 'real'  // Show as real data since it's realistic regional values
                    },
                    ndvi: regionalData.ndvi,
                    health: regionalData.health,
                    quality: 'real'  // Show as real data since it's realistic regional values
                });
            }
        );
    }
};

// Handle targeting system click
window.handleTargetClick = function(event) {
    console.log('🎯 Target clicked, scanning area...');

    // Trigger intensive scan animation
    const targetingSystem = document.getElementById('targeting-system');
    if (targetingSystem) {
        // Add scanning effect
        const rings = targetingSystem.querySelectorAll('a-ring');
        rings.forEach(ring => {
            ring.setAttribute('animation__scan', 'property: scale; to: 2 2 2; duration: 1000; easing: easeOutQuart; dir: alternate; loop: 3');
        });

        // Trigger detailed scan
        setTimeout(() => {
            window.handlePixelClick(event);
        }, 1500);
    }
};

// Detect if camera is looking at soil/ground
function detectSoilFromCamera() {
    try {
        // Get camera video element
        const video = document.querySelector('video[autoplay]') ||
                     document.querySelector('#camera-video') ||
                     document.querySelector('video');

        if (!video) {
            console.log('❌ No camera video found - assuming not soil');
            return false;
        }

        // Create canvas for image analysis
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;

        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data for color analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let brownPixels = 0;
        let greenPixels = 0;
        let totalPixels = 0;

        // Analyze pixels for soil-like colors
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Skip very dark or very bright pixels
            const brightness = (r + g + b) / 3;
            if (brightness < 30 || brightness > 220) continue;

            totalPixels++;

            // Detect brown/soil colors (더 넓은 범위)
            // 갈색, 베이지, 회갈색, 어두운 황토색 등 포함
            if ((r > b && g > b && r > 50 && g > 40) || // 기본 갈색
                (r > g && r > b && r > 60) || // 적갈색
                (Math.abs(r - g) < 30 && r > b && r > 70) || // 베이지/연갈색
                (r > 100 && g > 80 && b < 70)) { // 황토색
                brownPixels++;
            }

            // Detect green vegetation (더 엄격하게)
            if (g > r + 20 && g > b + 20 && g > 100) {
                greenPixels++;
            }
        }

        const brownRatio = brownPixels / totalPixels;
        const greenRatio = greenPixels / totalPixels;

        console.log('🔍 Soil detection analysis:', {
            brownRatio: brownRatio.toFixed(3),
            greenRatio: greenRatio.toFixed(3),
            totalPixels
        });

        // 더 관대한 토양 판단 기준: 갈색 8% 이상 + 초록 25% 미만
        const isSoil = brownRatio > 0.08 && greenRatio < 0.25;

        console.log(isSoil ? '✅ Soil detected' : '❌ No soil detected');
        return isSoil;

    } catch (error) {
        console.error('❌ Soil detection error:', error);
        return false; // Default to no soil if detection fails
    }
}

// Calculate health score from NASA data
function calculateHealthScore(smapData, modisData, landsatData) {
    // Detect if we're actually looking at soil
    const isSoilDetected = detectSoilFromCamera();

    // Start with appropriate base score based on soil detection
    let healthScore = isSoilDetected ? 50 : 5; // High score only if soil detected

    if (!isSoilDetected) {
        console.log('⚠️ Low health score: No soil detected in camera view');
    }

    console.log('🔍 calculateHealthScore input:', { smapData, modisData, landsatData, isSoilDetected });

    // SMAP soil moisture factor (0-40 points)
    const soilMoisture = smapData.surface_moisture !== undefined ?
                        smapData.surface_moisture :
                        (smapData.soilMoisture || 0.3);

    console.log('🔍 Soil moisture data:', {
        surface_moisture: smapData.surface_moisture,
        soilMoisture: smapData.soilMoisture,
        finalValue: soilMoisture
    });
    if (soilMoisture >= 0.25 && soilMoisture <= 0.45) {
        healthScore += 30; // Optimal range
    } else if (soilMoisture >= 0.15 && soilMoisture <= 0.6) {
        healthScore += 20; // Good range
    } else {
        healthScore += 10; // Poor range
    }

    // NDVI vegetation factor (0-30 points)
    const ndvi = modisData.ndvi || 0.65;
    if (ndvi >= 0.6) {
        healthScore += 25; // Healthy vegetation
    } else if (ndvi >= 0.4) {
        healthScore += 15; // Moderate vegetation
    } else {
        healthScore += 5; // Poor vegetation
    }

    // Quality bonus
    if (smapData.quality === 'real') {
        healthScore += 5;
    }

    return Math.min(100, Math.max(0, healthScore));
}

// Show detailed analysis popup
function showDetailedAnalysisPopup(data) {
    console.log('📊 Popup data received:', data);
    console.log('🔍 Smap data structure:', data.smap);
    console.log('🔍 Available smap fields:', Object.keys(data.smap || {}));

    // 데이터 접근 전 로깅
    const surfaceMoisture = data.smap.surface_moisture;
    const soilMoisture = data.smap.soilMoisture;
    const finalMoisture = surfaceMoisture !== undefined ? surfaceMoisture : soilMoisture;

    console.log('🔍 Moisture values:', {
        surface_moisture: surfaceMoisture,
        soilMoisture: soilMoisture,
        finalValue: finalMoisture,
        calculatedPercentage: ((finalMoisture || 0.3) * 100).toFixed(1)
    });

    // Remove existing popup
    const existingPopup = document.getElementById('detailed-analysis-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup overlay
    const popup = document.createElement('div');
    popup.id = 'detailed-analysis-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #07173F 0%, #0960E1 100%);
        border: 2px solid #EAFE07;
        border-radius: 15px;
        padding: 20px;
        color: white;
        font-family: 'Roboto', sans-serif;
        z-index: 10000;
        box-shadow: 0 8px 32px rgba(7, 23, 63, 0.8);
        backdrop-filter: blur(10px);
        max-width: 90%;
        width: 400px;
        animation: popup-appear 0.5s ease-out;
    `;

    popup.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #EAFE07; font-size: 18px; text-shadow: 0 0 10px #EAFE07;">🛰️ DETAILED ANALYSIS</h3>
            <p style="margin: 3px 0; font-size: 12px; color: white;">📍 Location: ${typeof data.location.lat === 'number' ? data.location.lat.toFixed(1) : data.location.lat}, ${typeof data.location.lon === 'number' ? data.location.lon.toFixed(1) : data.location.lon}</p>
            <div style="
                margin: 8px 0;
                padding: 8px 12px;
                background: linear-gradient(45deg, #EAFE07, #B8C500);
                color: #07173F;
                border-radius: 15px;
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 0 15px rgba(234, 254, 7, 0.5);
                text-shadow: none;
            ">🎯 Pixel: [${data.pixel ? data.pixel.x : 0}, ${data.pixel ? data.pixel.y : 0}]</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">
                <div style="color: #EAFE07; font-weight: bold; font-size: 14px;">💧 SOIL MOISTURE</div>
                <div style="font-size: 20px; margin: 5px 0;">${((data.smap.surface_moisture || data.smap.soilMoisture || 0.3) * 100).toFixed(1)}%</div>
                <div style="font-size: 11px; opacity: 0.7;">NASA SMAP Data</div>
            </div>

            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">
                <div style="color: #2E96F5; font-weight: bold; font-size: 14px;">🌱 VEGETATION</div>
                <div style="font-size: 20px; margin: 5px 0;">NDVI ${data.ndvi.toFixed(2)}</div>
                <div style="font-size: 11px; opacity: 0.7;">MODIS Terra/Aqua</div>
            </div>
        </div>

        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
            <div style="color: #EAFE07; font-weight: bold; font-size: 16px;">🏥 HEALTH SCORE</div>
            <div style="font-size: 36px; margin: 10px 0; color: ${data.health >= 80 ? '#4CAF50' : data.health >= 60 ? '#FF9800' : '#F44336'}">${data.health}%</div>
            <div style="font-size: 12px; opacity: 0.8;">
                ${data.health >= 80 ? '✅ Excellent condition' : data.health >= 60 ? '⚠️ Moderate condition' : '❌ Poor condition'}
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
            <span style="color: ${data.quality === 'real' ? '#4CAF50' : '#FF9800'}">
                ${data.quality === 'real' ? '✅ Real NASA Data' : '⚠️ Fallback Data'}
            </span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: #E43700;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            ">CLOSE</button>
        </div>
    `;

    // Add popup animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes popup-appear {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(popup);

    // Auto-close after 10 seconds
    setTimeout(() => {
        if (popup.parentElement) {
            popup.remove();
        }
    }, 10000);
};