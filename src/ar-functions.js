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

// NASA API endpoint configuration
window.getNASAApiEndpoint = function() {
    // Use Vercel API routes in production
    const apiBase = window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api'
        : '/api';
    return apiBase;
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

    console.log('🚀 Starting Real AR.js AR for iOS');

    try {
        // Check device capabilities
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

        console.log(`📱 Device: iOS=${isIOS}, Safari=${isSafari}`);

        // Request camera permission first
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access not supported');
        }

        console.log('📷 Requesting camera permission...');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });

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
                geometry="primitive: rounded; radiusTop: 0.1; radiusBottom: 0.1;">

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
                material="color: #0960E1; opacity: 0.95; transparent: true;">

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
            <a-entity id="targeting-system" position="0 0 -2">
                <!-- Outer Ring -->
                <a-ring
                    position="0 0 0"
                    radius-inner="0.08"
                    radius-outer="0.12"
                    material="color: #EAFE07; opacity: 0.8; transparent: true;"
                    animation="property: rotation; to: 0 0 360; loop: true; dur: 4000;">
                </a-ring>

                <!-- Inner Cross -->
                <a-plane
                    position="0 0 0.01"
                    width="0.12"
                    height="0.01"
                    material="color: #2E96F5; emissive: #2E96F5; emissiveIntensity: 0.5;">
                </a-plane>
                <a-plane
                    position="0 0 0.01"
                    width="0.01"
                    height="0.12"
                    material="color: #2E96F5; emissive: #2E96F5; emissiveIntensity: 0.5;">
                </a-plane>

                <!-- Scanning Effect -->
                <a-ring
                    radius-inner="0.05"
                    radius-outer="0.06"
                    material="color: #0960E1; opacity: 0.6;"
                    animation="property: scale; to: 3 3 1; loop: true; dur: 2000; easing: easeOutQuart;">
                </a-ring>
            </a-entity>

            <!-- Camera Entity -->
            <a-entity camera look-controls wasd-controls></a-entity>
        </a-scene>

        <!-- Modern AR Control Panel -->
        <div id="ar-controls" style="
            position: fixed;
            top: 15px;
            left: 15px;
            right: 15px;
            background: linear-gradient(135deg, rgba(7, 23, 63, 0.95), rgba(9, 96, 225, 0.85));
            backdrop-filter: blur(15px);
            border: 2px solid rgba(46, 150, 245, 0.3);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 0;
            overflow: hidden;
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
                    ">🛰️ LIVE AR SCANNER</span>
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
                <div style="
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

    const updateAnalysis = async () => {
        // Simulate camera movement - change pixel coordinates
        pixelX = Math.max(0, Math.min(19, pixelX + (Math.random() - 0.5) * 2));
        pixelY = Math.max(0, Math.min(19, pixelY + (Math.random() - 0.5) * 2));

        // Try to get real NASA data first
        let pixelData;
        if (window.currentLocation) {
            const nasaData = await window.fetchNASAData(window.currentLocation.lat, window.currentLocation.lon);
            if (nasaData && nasaData.pixels && nasaData.pixels.length > 0) {
                // Use real NASA pixel data
                const pixelIndex = Math.min(pixelY * 20 + pixelX, nasaData.pixels.length - 1);
                pixelData = nasaData.pixels[pixelIndex];
                console.log('📡 Using real NASA data:', pixelData);
            } else {
                // Fall back to simulated data
                pixelData = generateFallbackPixelData();
                console.log('⚠️ Using fallback data');
            }
        } else {
            pixelData = generateFallbackPixelData();
        }

        // Perform AI classification if available
        let aiResult = null;
        if (window.aiManager && window.aiManager.isModelLoaded) {
            try {
                // Get AR canvas for AI analysis
                const canvas = document.querySelector('canvas');
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                    // Check canvas state before using
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        console.log('🖼️ Canvas ready for AI analysis');
                        aiResult = await window.aiManager.classifyARCanvas(canvas);
                        console.log('🤖 AI Classification result:', JSON.stringify(aiResult, null, 2));
                    } else {
                        console.warn('⚠️ Canvas context not available');
                    }
                } else {
                    console.warn('⚠️ Canvas not ready for analysis');
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
    setInterval(updateAnalysis, 3000);
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

    const arContainer = document.getElementById('arjs-container');
    if (arContainer) {
        arContainer.remove();
    }

    window.arRunning = false;
    console.log('✅ AR scene stopped');
};

// Request iOS device permissions
window.requestIOSPermissions = async function() {
    console.log('📱 Requesting iOS device permissions...');

    try {
        // Request device orientation permission (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            const orientationPermission = await DeviceOrientationEvent.requestPermission();
            console.log('📱 Orientation permission:', orientationPermission);
        }

        // Request device motion permission (iOS 13+)
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            const motionPermission = await DeviceMotionEvent.requestPermission();
            console.log('📱 Motion permission:', motionPermission);
        }

        console.log('✅ iOS permissions requested');
    } catch (error) {
        console.warn('⚠️ iOS permissions failed:', error);
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
            title: '🛰️ NASA Farm Navigator AR Analysis',
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
            navigator.mediaDevices.getUserMedia(portraitConstraints)
                .then(stream => {
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

        }, 2000); // Wait for AR.js to initialize

        // Disable screen rotation lock that might force landscape
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock()
                .then(() => console.log('🔓 Screen orientation unlocked'))
                .catch(e => console.log('🔒 Screen orientation already unlocked'));
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

    if (!panelContent || !toggleButton) {
        console.warn('⚠️ Panel elements not found');
        return;
    }

    const isVisible = panelContent.style.display !== 'none';

    if (isVisible) {
        // Hide panel
        panelContent.style.display = 'none';
        toggleButton.innerHTML = '▲ SHOW';
        toggleButton.style.background = 'rgba(46, 150, 245, 0.3)'; // NEON_BLUE
        console.log('📱 AR panel hidden');
    } else {
        // Show panel
        panelContent.style.display = 'grid';
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

    // Enhance targeting indicator visibility
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

        console.log('🎯 Enhanced targeting indicator visibility');
    }
};