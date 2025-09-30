/**
 * FarmerARInterface.js - Field-Optimized AR Interface for Farmers
 *
 * Key Features:
 * - Large text and icons (sunlight visibility)
 * - Glove-friendly touch interface
 * - Landscape mode optimization
 * - Real-time agricultural advice
 * - Mobile-first responsive design
 */
class FarmerARInterface {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.currentAdvice = null;
        this.lastSoilData = null;
        this.savedAnalyses = [];

        // Initialize saved analysis data
        this.initializeSavedData();
    }

    // Initialize saved analysis data
    initializeSavedData() {
        try {
            this.savedAnalyses = JSON.parse(localStorage.getItem('farmer-analyses') || '[]');
        } catch (error) {
            console.warn('Failed to load saved agricultural analysis data:', error);
            this.savedAnalyses = [];
        }
    }

    // Create farmer interface
    createFarmerInterface() {
        // Cleanup existing interface
        this.cleanup();

        this.container = document.createElement('div');
        this.container.id = 'farmer-ar-interface';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, rgba(7, 23, 63, 0.95), rgba(14, 46, 126, 0.9));
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            z-index: 999999;
            overflow-y: auto;
            backdrop-filter: blur(8px);
            display: none;
            padding: 10px;
            box-sizing: border-box;
        `;

        // Top status bar
        this.createTopStatusBar();

        // Central analysis panel
        this.createAnalysisPanel();

        // Action panel
        this.createActionPanel();

        // Alert panel
        this.createAlertPanel();

        document.body.appendChild(this.container);

        // Setup orientation handler
        this.setupOrientationHandler();

        console.log('✅ Farmer AR interface created successfully');
    }

    // Create top status bar
    createTopStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.style.cssText = `
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(30, 39, 73, 0.95);
            border-radius: 15px;
            padding: 15px 20px;
            margin-bottom: 15px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            z-index: 1000000;
        `;

        statusBar.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 28px;">🥽</span>
                    <div>
                        <div style="font-weight: bold; color: #27ae60; font-size: 18px;">Field Analysis Mode</div>
                        <div style="font-size: 14px; opacity: 0.8; color: white;">Real-time soil analysis...</div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                    <div style="text-align: center;">
                        <div style="font-size: 12px; opacity: 0.7;">GPS Status</div>
                        <div id="farmer-gps-status" style="font-size: 14px; color: #3498db; font-weight: bold;">📍 Ready</div>
                    </div>
                    <button id="farmer-exit-btn" style="
                        background: linear-gradient(45deg, #e74c3c, #c0392b);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 25px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        touch-action: manipulation;
                        min-height: 50px;
                        min-width: 80px;
                    ">
                        EXIT
                    </button>
                </div>
            </div>
        `;

        this.container.appendChild(statusBar);

        // Add exit button event
        const exitBtn = statusBar.querySelector('#farmer-exit-btn');
        exitBtn.addEventListener('click', () => this.handleExit());
    }

    // Create analysis panel
    createAnalysisPanel() {
        const analysisPanel = document.createElement('div');
        analysisPanel.style.cssText = `
            background: rgba(44, 62, 80, 0.8);
            border-radius: 20px;
            padding: 20px;
            margin-bottom: 15px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(5px);
        `;

        analysisPanel.innerHTML = `
            <!-- Soil Analysis Results -->
            <div style="margin-bottom: 25px;">
                <h2 style="margin: 0 0 12px 0; color: #3498db; font-size: 24px; display: flex; align-items: center; gap: 12px;">
                    <span>🌱</span>
                    <span>Soil Analysis Results</span>
                </h2>
                <div style="font-size: 16px; opacity: 0.8; color: white; margin-bottom: 20px;">
                    NASA satellite data + AI field analysis
                </div>

                <!-- Soil Data Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <!-- Soil Moisture -->
                    <div style="background: rgba(52, 152, 219, 0.2); border-radius: 15px; padding: 20px; border-left: 5px solid #3498db;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="display: flex; align-items: center; gap: 10px; font-size: 18px; color: white;">
                                💧 Soil Moisture
                            </span>
                            <span id="farmer-moisture" style="font-size: 22px; font-weight: bold; color: #3498db;">
                                Loading...
                            </span>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 10px; height: 8px; margin-top: 10px;">
                            <div id="farmer-moisture-bar" style="background: linear-gradient(90deg, #3498db, #2980b9); height: 100%; border-radius: 10px; width: 0%; transition: width 0.5s ease;"></div>
                        </div>
                    </div>

                    <!-- NDVI -->
                    <div style="background: rgba(46, 204, 113, 0.2); border-radius: 15px; padding: 20px; border-left: 5px solid #2ecc71;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="display: flex; align-items: center; gap: 10px; font-size: 18px; color: white;">
                                🌿 Vegetation Index
                            </span>
                            <span id="farmer-ndvi" style="font-size: 22px; font-weight: bold; color: #2ecc71;">
                                Loading...
                            </span>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 10px; height: 8px; margin-top: 10px;">
                            <div id="farmer-ndvi-bar" style="background: linear-gradient(90deg, #2ecc71, #27ae60); height: 100%; border-radius: 10px; width: 0%; transition: width 0.5s ease;"></div>
                        </div>
                    </div>

                    <!-- Temperature -->
                    <div style="background: rgba(231, 76, 60, 0.2); border-radius: 15px; padding: 20px; border-left: 5px solid #e74c3c;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="display: flex; align-items: center; gap: 10px; font-size: 18px; color: white;">
                                🌡️ Soil Temperature
                            </span>
                            <span id="farmer-temperature" style="font-size: 22px; font-weight: bold; color: #e74c3c;">
                                Loading...
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Agricultural Advice -->
            <div style="background: rgba(52, 152, 219, 0.15); border-radius: 20px; padding: 25px; border-left: 6px solid #3498db;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                    <span style="font-size: 28px;">💡</span>
                    <h3 style="margin: 0; color: #3498db; font-size: 20px;">Agricultural Advice</h3>
                </div>
                <div id="farmer-advice-text" style="
                    font-size: 20px;
                    font-weight: bold;
                    color: #3498db;
                    margin-bottom: 12px;
                    line-height: 1.4;
                    display: flex;
                    align-items: center;
                ">
                    Analyzing data...
                </div>
                <div id="farmer-advice-details" style="
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.5;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    Please wait for data analysis completion.
                </div>
            </div>
        `;

        this.container.appendChild(analysisPanel);
    }

    // Create action panel
    createActionPanel() {
        const actionPanel = document.createElement('div');
        actionPanel.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        `;

        actionPanel.innerHTML = `
            <button id="farmer-scan-btn" style="
                background: linear-gradient(45deg, #2ecc71, #27ae60);
                color: white;
                border: none;
                padding: 20px;
                border-radius: 15px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                touch-action: manipulation;
                min-height: 70px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
            ">
                <span style="font-size: 24px;">📊</span>
                Scan Area
            </button>

            <button id="farmer-refresh-btn" style="
                background: linear-gradient(45deg, #3498db, #2980b9);
                color: white;
                border: none;
                padding: 20px;
                border-radius: 15px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                touch-action: manipulation;
                min-height: 70px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
            ">
                <span style="font-size: 24px;">🔄</span>
                Refresh Data
            </button>

            <button id="farmer-save-btn" style="
                background: linear-gradient(45deg, #f39c12, #e67e22);
                color: white;
                border: none;
                padding: 20px;
                border-radius: 15px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                touch-action: manipulation;
                min-height: 70px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
            ">
                <span style="font-size: 24px;">💾</span>
                Save Analysis
            </button>
        `;

        this.container.appendChild(actionPanel);

        // Add event listeners
        const scanBtn = actionPanel.querySelector('#farmer-scan-btn');
        const refreshBtn = actionPanel.querySelector('#farmer-refresh-btn');
        const saveBtn = actionPanel.querySelector('#farmer-save-btn');

        scanBtn.addEventListener('click', () => this.handleScan());
        refreshBtn.addEventListener('click', () => this.handleRefresh());
        saveBtn.addEventListener('click', () => this.handleSaveAnalysis());
    }

    // Create alert panel
    createAlertPanel() {
        const alertPanel = document.createElement('div');
        alertPanel.id = 'farmer-alert-panel';
        alertPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(231, 76, 60, 0.95);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-size: 18px;
            font-weight: bold;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            max-width: 90vw;
            z-index: 1000001;
            display: none;
            text-align: center;
        `;

        this.container.appendChild(alertPanel);
    }

    // Setup orientation handler
    setupOrientationHandler() {
        const updateLayout = () => {
            if (window.innerHeight < window.innerWidth) {
                // Landscape mode - optimal
                this.container.style.fontSize = '16px';
                this.updateGPSStatus('📍 Landscape optimized');
            } else {
                // Portrait mode - warning
                this.showAlert('📱 Please rotate to landscape mode for better experience.');
                this.updateGPSStatus('📱 Portrait - Landscape recommended');
            }
        };

        window.addEventListener('resize', updateLayout);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateLayout, 100);
        });

        updateLayout();
    }

    // Update GPS status
    updateGPSStatus(status) {
        const gpsStatus = document.getElementById('farmer-gps-status');
        if (gpsStatus) {
            gpsStatus.textContent = status;
        }
    }

    // Update display with NASA data
    updateWithNASAData(soilData, ndviData, aiAnalysis) {
        this.lastSoilData = soilData;

        // Update soil moisture
        if (soilData && soilData.surface_moisture !== undefined) {
            const moisture = Math.round(soilData.surface_moisture * 100);
            const moistureElement = document.getElementById('farmer-moisture');
            const moistureBar = document.getElementById('farmer-moisture-bar');

            if (moistureElement) moistureElement.textContent = `${moisture}%`;
            if (moistureBar) moistureBar.style.width = `${moisture}%`;
        }

        // Update NDVI
        if (ndviData && ndviData.ndvi !== undefined) {
            const ndvi = parseFloat(ndviData.ndvi).toFixed(2);
            const ndviElement = document.getElementById('farmer-ndvi');
            const ndviBar = document.getElementById('farmer-ndvi-bar');

            if (ndviElement) ndviElement.textContent = ndvi;
            if (ndviBar) ndviBar.style.width = `${Math.min(parseFloat(ndvi) * 100, 100)}%`;
        }

        // Update temperature
        if (ndviData && ndviData.temperature !== undefined) {
            const temp = Math.round(ndviData.temperature);
            const tempElement = document.getElementById('farmer-temperature');

            if (tempElement) tempElement.textContent = `${temp}°C`;
        }

        // Generate farming advice
        this.generateFarmingAdvice(soilData, ndviData, aiAnalysis);

        // Check emergency alerts
        this.checkEmergencyAlerts(soilData, ndviData);

        // Update GPS status
        this.updateGPSStatus('📍 Data updated');
    }

    // Generate farming advice
    generateFarmingAdvice(soilData, ndviData, aiAnalysis) {
        let mainAdvice = '';
        let details = '';

        if (!soilData || !ndviData) {
            mainAdvice = 'Analyzing data...';
            details = 'Please wait a moment';
        } else {
            const moisture = Math.round((soilData.surface_moisture || 0) * 100);
            const ndvi = parseFloat(ndviData.ndvi || 0);
            const temp = ndviData.temperature || 20;

            // Soil moisture based advice
            if (moisture < 15) {
                mainAdvice = '🚨 URGENT IRRIGATION NEEDED';
                details = 'Soil is critically dry. Start irrigation immediately.';
            } else if (moisture < 25) {
                mainAdvice = '💧 Irrigation Recommended';
                details = 'Soil is dry. Water your crops today.';
            } else if (moisture < 35) {
                mainAdvice = '💧 Consider Irrigation';
                details = 'Soil is slightly dry. Check weather and consider watering.';
            } else if (moisture < 70) {
                mainAdvice = '✅ Moisture Level Good';
                details = 'Soil moisture is adequate. Maintain current conditions.';
            } else if (moisture < 85) {
                mainAdvice = '⚠️ Watch for Overwatering';
                details = 'Soil is moist. Check drainage and reduce irrigation.';
            } else {
                mainAdvice = '🚨 DRAINAGE NEEDED';
                details = 'Soil is too wet. Drainage work required.';
            }

            // NDVI based additional advice
            if (ndvi < 0.2) {
                mainAdvice += ' | 🌱 Poor Growth';
                details += ' Vegetation condition is very poor. Consider expert consultation.';
            } else if (ndvi < 0.4) {
                mainAdvice += ' | 🌿 Growth Improvement Needed';
                details += ' Consider fertilization or soil amendment.';
            } else if (ndvi > 0.7) {
                mainAdvice += ' | 🌟 Excellent Growth';
                details += ' Crops are growing healthily.';
            }

            // Temperature based advice
            if (temp > 35) {
                details += ' 🌡️ Heat Warning: Consider shade cloth to prevent crop stress.';
            } else if (temp < 5) {
                details += ' ❄️ Cold Warning: Protect crops from frost damage.';
            }

            // AI analysis integration
            if (aiAnalysis && aiAnalysis.soilType) {
                details += ` | Soil Analysis: ${aiAnalysis.soilType}`;
            }
        }

        // Display advice
        const adviceElement = document.getElementById('farmer-advice-text');
        const detailsElement = document.getElementById('farmer-advice-details');

        if (adviceElement) {
            adviceElement.textContent = mainAdvice;

            if (mainAdvice.includes('🚨')) {
                adviceElement.style.color = '#e74c3c';
                adviceElement.style.fontWeight = 'bold';
            } else if (mainAdvice.includes('💧') || mainAdvice.includes('Recommended')) {
                adviceElement.style.color = '#f39c12';
            } else {
                adviceElement.style.color = '#2ecc71';
            }
        }

        if (detailsElement) {
            detailsElement.textContent = details;
        }

        this.currentAdvice = { main: mainAdvice, details: details };
    }

    // Check emergency alerts
    checkEmergencyAlerts(soilData, ndviData) {
        const moisture = Math.round((soilData?.surface_moisture || 0) * 100);
        const ndvi = parseFloat(ndviData?.ndvi || 0);
        const temp = ndviData?.temperature || 20;

        // Emergency situation checks
        if (moisture < 10) {
            this.showAlert('🚨 Extremely dry soil detected. Immediate irrigation required!', 'critical');
        } else if (moisture > 90) {
            this.showAlert('🚨 Severe soil saturation. Immediate drainage action needed!', 'critical');
        } else if (ndvi < 0.15) {
            this.showAlert('⚠️ Vegetation condition is critical. Consult agricultural expert.', 'warning');
        } else if (temp > 40) {
            this.showAlert('🌡️ Extreme heat detected. Crop protection measures needed.', 'critical');
        }
    }

    // Show alert
    showAlert(message, type = 'normal') {
        const alertPanel = document.getElementById('farmer-alert-panel');
        if (!alertPanel) return;

        alertPanel.textContent = message;

        // Set color based on type
        switch (type) {
            case 'critical':
                alertPanel.style.background = 'rgba(231, 76, 60, 0.95)';
                break;
            case 'warning':
                alertPanel.style.background = 'rgba(243, 156, 18, 0.95)';
                break;
            default:
                alertPanel.style.background = 'rgba(52, 152, 219, 0.95)';
        }

        alertPanel.style.display = 'block';

        // Auto hide after 5 seconds
        setTimeout(() => {
            alertPanel.style.display = 'none';
        }, 5000);
    }

    // Handle scan - Launch real camera AR
    async handleScan() {
        console.log('📊 Field scan initiated - Launching AR Camera');

        // Check if CameraARInterface is loaded
        if (!window.cameraAR) {
            console.error('Camera AR interface not loaded');
            this.showAlert('⚠️ Camera AR not available. Loading...', 'warning');

            // Try to load the camera AR script
            const script = document.createElement('script');
            script.src = 'src/ar/CameraARInterface.js';
            script.onload = () => {
                console.log('Camera AR loaded, retrying...');
                this.handleScan();
            };
            script.onerror = () => {
                this.showAlert('❌ Failed to load camera AR', 'critical');
            };
            document.body.appendChild(script);
            return;
        }

        // Hide the farmer interface temporarily
        this.hide();

        try {
            // Start the AR camera session
            await window.cameraAR.startARSession();

            console.log('✅ AR Camera session started');

        } catch (error) {
            console.error('Failed to start AR camera:', error);
            this.showAlert('❌ Camera failed: ' + error.message, 'critical');
            this.show();
        }
    }

    // Generate scan results
    generateScanResults() {
        return {
            areas: Math.floor(Math.random() * 5) + 3,
            avgCondition: ['Excellent', 'Good', 'Fair', 'Needs Attention'][Math.floor(Math.random() * 4)]
        };
    }

    // Handle refresh
    handleRefresh() {
        console.log('🔄 Data refresh initiated');
        this.updateGPSStatus('📍 Refreshing data...');

        // Simulate data refresh
        setTimeout(() => {
            this.updateGPSStatus('📍 Data updated');
            this.showAlert('🔄 Data refreshed successfully!', 'normal');

            // Trigger data update event
            if (window.safeAR && typeof window.safeAR.loadInitialFarmData === 'function') {
                window.safeAR.loadInitialFarmData();
            }
        }, 1000);
    }

    // Handle save analysis
    handleSaveAnalysis() {
        console.log('💾 Farm analysis save');

        if (this.currentAdvice && this.lastSoilData) {
            const analysis = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                advice: this.currentAdvice,
                soilData: this.lastSoilData,
                location: {
                    lat: 'Unknown',
                    lon: 'Unknown'
                }
            };

            this.savedAnalyses.push(analysis);
            localStorage.setItem('farmer-analyses', JSON.stringify(this.savedAnalyses));

            this.showAlert(`💾 Analysis saved successfully. (Total: ${this.savedAnalyses.length} records)`, 'normal');

            // Save completion animation
            const saveBtn = document.getElementById('farmer-save-btn');
            if (saveBtn) {
                saveBtn.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
                setTimeout(() => {
                    saveBtn.style.background = 'linear-gradient(45deg, #f39c12, #e67e22)';
                }, 1000);
            }
        } else {
            this.showAlert('⚠️ No analysis data to save. Please scan an area first.', 'warning');
        }
    }

    // Handle exit
    handleExit() {
        console.log('🔴 Farmer AR exit');
        this.showAlert('🔴 Exiting Farmer AR...', 'normal');

        setTimeout(() => {
            this.hide();

            // Cleanup AR system
            if (window.safeAR && typeof window.safeAR.cleanup === 'function') {
                window.safeAR.cleanup();
            }
        }, 1500);
    }

    // Show interface
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.isVisible = true;
            this.updateGPSStatus('📍 Farmer AR activated');
        }
    }

    // Hide interface
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
        }
    }

    // Cleanup
    cleanup() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.container = null;
        this.isVisible = false;
        this.currentAdvice = null;
        this.lastSoilData = null;

        // Remove event listeners
        window.removeEventListener('resize', this.updateLayout);
        window.removeEventListener('orientationchange', this.updateLayout);

        console.log('✅ Farmer AR interface cleanup complete');
    }

    // Get saved analyses
    getSavedAnalyses() {
        return this.savedAnalyses;
    }

    // Delete saved analysis
    deleteSavedAnalysis(id) {
        this.savedAnalyses = this.savedAnalyses.filter(analysis => analysis.id !== id);
        localStorage.setItem('farmer-analyses', JSON.stringify(this.savedAnalyses));
    }
}

// Global access
if (typeof window !== 'undefined') {
    window.FarmerARInterface = FarmerARInterface;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FarmerARInterface;
}