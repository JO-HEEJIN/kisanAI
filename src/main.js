// Main application initialization
let gameEngine, farmView, dataTablet, nasaDataService, nasaRealTimeService;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing TerraData: Sustainable Frontier...');

    try {
        // Initialize services
        nasaDataService = new NASADataService();

        // Initialize real-time NASA service with authentication
        nasaRealTimeService = new NASARealTimeService();
        console.log('NASA Real-Time Service initialized with Earthdata authentication');

        // Wait for game engine to be available
        if (typeof window.gameEngine === 'undefined') {
            console.log('Waiting for game engine...');
            await new Promise(resolve => {
                const checkEngine = () => {
                    if (window.gameEngine) {
                        resolve();
                    } else {
                        setTimeout(checkEngine, 100);
                    }
                };
                checkEngine();
            });
        }

        gameEngine = window.gameEngine;

        // Initialize components
        farmView = new FarmView('farm-canvas', gameEngine);
        dataTablet = new DataTablet(gameEngine, nasaDataService);

        // Load initial NASA data
        await loadInitialSatelliteData();

        // Set up periodic data updates
        // More frequent updates for real-time NASA data
        const updateFrequency = nasaRealTimeService ? 30000 : 5 * 60 * 1000; // 30 seconds with real-time, 5 minutes otherwise
        setInterval(updateSatelliteData, updateFrequency);

        // Set up PWA features
        setupPWAFeatures();

        // Show welcome message
        showWelcomeMessage();

        console.log('TerraData initialization complete!');

    } catch (error) {
        console.error('Failed to initialize TerraData:', error);
        showErrorMessage('Failed to initialize the game. Please refresh the page.');
    }
});

async function loadInitialSatelliteData() {
    const farmData = gameEngine.getFarmData();
    const coordinates = farmData.location;

    try {
        console.log('Loading NASA real-time satellite data...');

        // Use real-time NASA service if available
        if (nasaRealTimeService) {
            const realTimeData = await nasaRealTimeService.getCombinedData(
                coordinates.lat,
                coordinates.lng || coordinates.lon
            );

            // Convert real-time data format to game format
            const satelliteData = {
                ndvi: realTimeData.vegetation,
                soilMoisture: realTimeData.soil,
                precipitation: realTimeData.precipitation,
                indices: realTimeData.agricultural_indices
            };

            integrateSatelliteData(satelliteData);
            console.log('NASA real-time data loaded with authentication');

            // Show authentication status
            if (realTimeData.authentication_status.token_active) {
                console.log('✓ NASA Earthdata Token Active - Using Real NASA Data Patterns');

                // Show NASA status indicator in UI
                const nasaStatus = document.getElementById('nasa-status');
                if (nasaStatus) {
                    nasaStatus.style.display = 'inline-block';
                    nasaStatus.title = 'Connected to NASA Earthdata - Real-time satellite data active';
                }
            }
        } else {
            // Fallback to standard NASA service
            const satelliteData = await nasaDataService.getLatestData(coordinates);
            integrateSatelliteData(satelliteData);
            console.log('Satellite data loaded successfully');
        }
    } catch (error) {
        console.warn('Could not load real satellite data, using enhanced simulation:', error);
    }
}

function integrateSatelliteData(satelliteData) {
    const farmData = gameEngine.getFarmData();

    // Handle real-time NASA data format
    if (satelliteData.ndvi && typeof satelliteData.ndvi.ndvi === 'number') {
        // Apply real-time NDVI to zones with variation
        const baseNDVI = satelliteData.ndvi.ndvi;
        farmData.zones.forEach((zone, index) => {
            const variation = (Math.random() - 0.5) * 0.1;
            zone.ndvi = Math.max(0.1, Math.min(1.0, baseNDVI + variation));
        });
    } else if (satelliteData.ndvi && satelliteData.ndvi.values) {
        // Map NDVI values to farm zones (old format)
        satelliteData.ndvi.values.forEach((dataPoint, index) => {
            if (farmData.zones[index]) {
                farmData.zones[index].ndvi = Math.max(0, dataPoint.ndvi);
            }
        });
    }

    // Handle real-time soil moisture data
    if (satelliteData.soilMoisture && typeof satelliteData.soilMoisture.moisture === 'number') {
        // Apply real-time moisture to zones with variation
        const baseMoisture = satelliteData.soilMoisture.moisture;
        farmData.zones.forEach((zone, index) => {
            const variation = (Math.random() - 0.5) * 0.05;
            zone.soilMoisture = Math.max(0.05, Math.min(0.6, baseMoisture + variation));
        });
    } else if (satelliteData.soilMoisture && satelliteData.soilMoisture.values) {
        // Map soil moisture values to farm zones (old format)
        satelliteData.soilMoisture.values.forEach((dataPoint, index) => {
            if (farmData.zones[index]) {
                farmData.zones[index].soilMoisture = Math.max(0, dataPoint.soilMoisture);
            }
        });
    }

    // Add stress levels based on agricultural indices if available
    if (satelliteData.indices) {
        const stressLevel = satelliteData.indices.crop_stress_index.category;
        farmData.zones.forEach(zone => {
            if (stressLevel === 'high' && zone.soilMoisture < 0.2) {
                zone.stressLevel = 'high';
            } else if (stressLevel === 'moderate' && zone.soilMoisture < 0.3) {
                zone.stressLevel = 'moderate';
            }
        });
    }

    // Update farm view to reflect new data
    if (farmView) {
        farmView.render();
    }

    // Update data tablet display
    if (dataTablet) {
        dataTablet.updateDisplay();
    }
}

async function updateSatelliteData() {
    if (!gameEngine || gameEngine.state.isPaused) return;

    try {
        const farmData = gameEngine.getFarmData();
        const coordinates = farmData.location;

        // Use real-time NASA service for continuous updates
        if (nasaRealTimeService) {
            const realTimeData = await nasaRealTimeService.getCombinedData(
                coordinates.lat,
                coordinates.lng || coordinates.lon
            );

            // Convert and apply real-time data
            const satelliteData = {
                ndvi: realTimeData.vegetation,
                soilMoisture: realTimeData.soil,
                precipitation: realTimeData.precipitation,
                indices: realTimeData.agricultural_indices
            };

            integrateSatelliteData(satelliteData);

            // Log the update with real-time indicators
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] NASA real-time data updated - NDVI: ${realTimeData.vegetation.ndvi.toFixed(3)}, Moisture: ${realTimeData.soil.moisture.toFixed(3)}`);
        } else {
            const satelliteData = await nasaDataService.getLatestData(coordinates);
            integrateSatelliteData(satelliteData);
            console.log('Satellite data updated');
        }
    } catch (error) {
        console.warn('Failed to update satellite data:', error);
    }
}

function setupPWAFeatures() {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }

    // Handle app installation
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        deferredPrompt = e;

        // Show install button
        showInstallButton();
    });

    // Handle successful installation
    window.addEventListener('appinstalled', (evt) => {
        console.log('TerraData has been installed');
        hideInstallButton();
    });
}

function showInstallButton() {
    // Create install button if it doesn't exist
    let installButton = document.getElementById('install-btn');
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.id = 'install-btn';
        installButton.textContent = 'Install App';
        installButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: var(--primary-green);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            z-index: 1000;
        `;

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to install prompt: ${outcome}`);
                deferredPrompt = null;
            }
        });

        document.body.appendChild(installButton);
    }

    installButton.style.display = 'block';
}

function hideInstallButton() {
    const installButton = document.getElementById('install-btn');
    if (installButton) {
        installButton.style.display = 'none';
    }
}

function showWelcomeMessage() {
    // Show initial game instructions
    setTimeout(() => {
        gameEngine.showDrVegaMessage(
            "Welcome to your farm in Arizona! Use satellite data to make smart farming decisions. Click the Data Tablet to see your field's health from space, then use the tools to irrigate, fertilize, or manage livestock. Your goal is to maximize yield while maintaining sustainability!"
        );
    }, 1000);
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #f44336;
        color: white;
        padding: 2rem;
        border-radius: 8px;
        text-align: center;
        z-index: 9999;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    errorDiv.innerHTML = `
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="
            background: white;
            color: #f44336;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
            font-weight: bold;
        ">Reload Page</button>
    `;

    document.body.appendChild(errorDiv);
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);

    // Don't show error message for minor issues
    if (event.error && event.error.message &&
        !event.error.message.includes('Script error') &&
        !event.error.message.includes('ResizeObserver')) {

        showErrorMessage('An error occurred. The game may not function properly.');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// Export global functions for debugging
window.TerraData = {
    gameEngine,
    farmView,
    dataTablet,
    nasaDataService,
    version: '1.0.0',

    // Debug functions
    debug: {
        showAllZoneInfo: () => {
            const farmData = gameEngine.getFarmData();
            console.table(farmData.zones.map(z => ({
                id: z.id,
                ndvi: z.ndvi.toFixed(3),
                moisture: z.soilMoisture.toFixed(3),
                stress: z.stressLevel
            })));
        },

        irrigateAllStressedZones: () => {
            const stressedZones = gameEngine.getStressedZones();
            stressedZones.forEach(zone => gameEngine.applyIrrigationToZone(zone));
            farmView.render();
        },

        setWeek: (week) => {
            gameEngine.state.currentWeek = week;
            gameEngine.updateUI();
        },

        addWater: (amount) => {
            gameEngine.state.waterBudget += amount;
            gameEngine.updateUI();
        }
    }
};

console.log('TerraData main script loaded. Debug tools available at window.TerraData.debug');