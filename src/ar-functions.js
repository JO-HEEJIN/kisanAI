// AR Functions - Separate file for better compatibility
console.log('🔄 Loading AR functions...');

// Initialize AR running state
window.arRunning = false;
window.aiManager = null;

// Real AR.js Implementation for iOS compatibility
window.launchRealAR = async function() {
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

        // Stop the stream immediately as AR.js will handle it
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

    // Create A-Frame scene with AR.js - Force camera display
    arContainer.innerHTML = `
        <a-scene
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
            arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; trackingMethod: best; sourceWidth: 480; sourceHeight: 640; displayWidth: 480; displayHeight: 640; cameraParametersUrl: none;"
            renderer="logarithmicDepthBuffer: true; antialias: false; alpha: true; precision: mediump; preserveDrawingBuffer: true"
            embedded
            style="height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; z-index: 1; background: transparent;">

            <!-- Assets -->
            <a-assets>
                <a-mixin id="text-style"
                    text="color: white; align: center; width: 6; shader: msdf; font: roboto">
                </a-mixin>
            </a-assets>

            <!-- NASA Data Panel -->
            <a-box
                id="nasa-data-panel"
                position="0 0.4 -1.3"
                width="1.2"
                height="0.6"
                depth="0.02"
                material="color: #07173F; opacity: 0.9;">

                <a-text
                    mixin="text-style"
                    position="0 0.2 0.05"
                    value="📡 NASA Data"
                    text="width: 3; fontSize: 16; color: #2E96F5;">
                </a-text>

                <a-text
                    id="pixel-info-text"
                    mixin="text-style"
                    position="0 0.05 0.05"
                    value="Pixel [0, 0]"
                    text="width: 2.5; fontSize: 10; color: #EAFE07;">
                </a-text>

                <!-- NASA Data Grid -->
                <a-text
                    id="moisture-text"
                    mixin="text-style"
                    position="-0.25 -0.08 0.05"
                    value="💧 --"
                    text="width: 2; fontSize: 9; color: #FFFFFF;">
                </a-text>

                <a-text
                    id="ndvi-text"
                    mixin="text-style"
                    position="0.25 -0.08 0.05"
                    value="🌿 --"
                    text="width: 2; fontSize: 9; color: #FFFFFF;">
                </a-text>

                <a-text
                    id="temp-text"
                    mixin="text-style"
                    position="-0.25 -0.18 0.05"
                    value="🌡️ --"
                    text="width: 2; fontSize: 9; color: #FFFFFF;">
                </a-text>

                <a-text
                    id="health-text"
                    mixin="text-style"
                    position="0.25 -0.18 0.05"
                    value="❤️ --"
                    text="width: 2; fontSize: 9; color: #FFFFFF;">
                </a-text>
            </a-box>

            <!-- AI Classification Panel -->
            <a-box
                id="ai-classification-panel"
                position="0 -0.1 -1.3"
                width="1.2"
                height="0.5"
                depth="0.02"
                material="color: #0960E1; opacity: 0.9;">

                <a-text
                    mixin="text-style"
                    position="0 0.15 0.05"
                    value="🤖 AI Analysis"
                    text="width: 3; fontSize: 16; color: #EAFE07;">
                </a-text>

                <a-text
                    id="ai-landcover-text"
                    mixin="text-style"
                    position="0 -0.05 0.05"
                    value="Land: --"
                    text="width: 2.5; fontSize: 12; color: #FFFFFF;">
                </a-text>

                <a-text
                    id="ai-confidence-text"
                    mixin="text-style"
                    position="0 -0.15 0.05"
                    value="Confidence: --"
                    text="width: 2.5; fontSize: 10; color: #FFFFFF;">
                </a-text>
            </a-box>

            <!-- Health Status Indicator (Center) -->
            <a-circle
                id="health-indicator"
                position="0 -0.2 -1.3"
                radius="0.12"
                material="color: #2E96F5; opacity: 0.8"
                animation="property: rotation; to: 0 0 360; loop: true; dur: 4000;">
            </a-circle>

            <!-- Inner Health Ring -->
            <a-ring
                id="health-ring"
                position="0 -0.2 -1.29"
                radius-inner="0.08"
                radius-outer="0.12"
                material="color: #2E96F5; opacity: 0.6">
            </a-ring>

            <!-- 3D Crosshair (Smaller) -->
            <a-ring
                position="0 0 -1.5"
                radius-inner="0.03"
                radius-outer="0.05"
                material="color: #EAFE07; opacity: 0.7"
                animation="property: rotation; to: 0 0 360; loop: true; dur: 3000;">
            </a-ring>

            <!-- Camera - iOS optimized -->
            <a-camera
                gps-camera
                rotation-reader
                arjs-device-orientation-controls
                look-controls="enabled: false"
                wasd-controls="enabled: false"
                cursor="rayOrigin: mouse">
            </a-camera>
        </a-scene>

        <!-- AR Control Panel -->
        <div id="ar-controls" style="
            position: fixed;
            top: 20px;
            left: 20px;
            right: 20px;
            background: rgba(7, 23, 63, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 10001;
            font-family: Arial, sans-serif;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; font-size: 18px;">🥽 AR Farm Scanner</h3>
                    <p style="margin: 5px 0; font-size: 14px; opacity: 0.8;">Real AR.js Implementation</p>
                </div>
                <button onclick="window.stopARScene()" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                ">Exit AR</button>
            </div>
        </div>
    `;

    document.body.appendChild(arContainer);

    // Load A-Frame and AR.js scripts
    await window.loadARScripts();

    // Force camera initialization after AR.js loads
    setTimeout(() => {
        window.forceARCameraInit();
    }, 1000);

    // Start real-time soil analysis
    setTimeout(() => {
        window.startSoilAnalysis();
    }, 3000);

    console.log('✅ AR.js scene created successfully');

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

// Load A-Frame and AR.js scripts dynamically with conflict prevention
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
                arjsScript.src = 'https://raw.githack.com/AR-js-org/AR.js/3.4.5/aframe/build/aframe-ar.js';
                arjsScript.onload = () => {
                    console.log('✅ AR.js loaded');
                    // Wait for AR.js to fully initialize
                    setTimeout(resolve, 1000);
                };
                arjsScript.onerror = () => {
                    reject(new Error('Failed to load AR.js'));
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

            // Start continuous analysis with AI
            window.startContinuousAnalysis();
        },
        (error) => {
            console.warn('GPS failed:', error);
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
    // Simulate real-time pixel analysis (integrate with actual Pixel Hunt system)
    let pixelX = Math.floor(Math.random() * 20);
    let pixelY = Math.floor(Math.random() * 20);

    const updateAnalysis = async () => {
        // Simulate camera movement - change pixel coordinates
        pixelX = Math.max(0, Math.min(19, pixelX + (Math.random() - 0.5) * 2));
        pixelY = Math.max(0, Math.min(19, pixelY + (Math.random() - 0.5) * 2));

        // Get pixel data (connect to actual Pixel Hunt data system)
        const pixelData = window.getPixelData ? window.getPixelData(Math.floor(pixelX), Math.floor(pixelY)) : generateFallbackPixelData();

        // Perform AI classification if available
        let aiResult = null;
        if (window.aiManager && window.aiManager.isModelLoaded) {
            try {
                // Get AR canvas for AI analysis
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    aiResult = await window.aiManager.classifyARCanvas(canvas);
                    console.log('🤖 AI Classification:', aiResult);
                }
            } catch (error) {
                console.warn('⚠️ AI classification failed:', error);
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
    console.log('🔍 Updating AR analysis:', {pixelX, pixelY, nasaData, aiResult});

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
};

// Fetch NASA data (reusing existing function)
window.fetchNASAData = async function(lat, lon) {
    try {
        const apiBase = window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : 'https://nasa-proxy.herokuapp.com';

        console.log(`🛰️ Fetching NASA data from: ${apiBase}`);

        const soilResponse = await fetch(
            `${apiBase}/api/smap/soil-moisture?lat=${lat}&lon=${lon}`
        );
        const soilData = await soilResponse.json();

        const ndviResponse = await fetch(
            `${apiBase}/api/modis/ndvi?lat=${lat}&lon=${lon}`
        );
        const ndviData = await ndviResponse.json();

        return {
            soilMoisture: Math.round((soilData.surface_moisture || 0) * 100),
            ndvi: parseFloat(ndviData.ndvi || 0).toFixed(2)
        };
    } catch (error) {
        console.warn('🌐 NASA API unavailable, using realistic fallback data');

        // Generate realistic data based on location and season
        const soilMoisture = 15 + Math.random() * 40; // 15-55%
        const ndvi = 0.2 + Math.random() * 0.5; // 0.2-0.7

        return {
            soilMoisture: Math.round(soilMoisture),
            ndvi: ndvi.toFixed(2)
        };
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
console.log('✅ AR functions loaded successfully. Available:', {
    launchRealAR: typeof window.launchRealAR,
    createARScene: typeof window.createARScene,
    stopARScene: typeof window.stopARScene
});

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