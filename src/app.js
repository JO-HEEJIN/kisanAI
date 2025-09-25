/**
 * NASA Farm Navigators - Main Application Entry Point
 * Initializes and coordinates all system components
 */

import { GameEngine } from './core/GameEngine.js';
import { IntegrationTestSuite } from './tests/integration.test.js';
// Farm game modules will be dynamically imported when needed
 
class NASAFarmNavigatorsApp {
    constructor() {
        this.gameEngine = null;
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        this.debugMode = this.getDebugMode();
        this.offlineManager = null;

        // UI elements will be populated on DOM ready
        this.ui = {
            loadingScreen: null,
            mainContainer: null,
            authButton: null,
            statusDisplay: null,
            resolutionControls: null,
            dataDisplay: null,
            educationPanel: null
        };

        // Default location (fallback)
        this.defaultLocation = { lat: 37.5665, lon: 126.978 }; // Seoul
        this.userLocation = null;

        // Bind methods
        this.handleAuthClick = this.handleAuthClick.bind(this);
        this.handleResolutionChange = this.handleResolutionChange.bind(this);
        this.handleOnlineStatusChange = this.handleOnlineStatusChange.bind(this);
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('NASA Farm Navigators Starting...');

            // Show loading screen
            this.showLoadingScreen();

            // Initialize service worker for offline support
            await this.initializeServiceWorker();

            // Initialize offline manager for mobile-first capabilities
            await this.initializeOfflineManager();

            // Initialize game engine
            this.gameEngine = GameEngine.getInstance();
            await this.gameEngine.initialize({
                earthdataClientId: 'nasa_farm_navigators',
                defaultContext: 'tutorial',
                cacheSize: 100
            });

            // Set up event listeners
            this.setupEventListeners();

            // Initialize UI
            await this.initializeUI();

            // Run tests in debug mode
            if (this.debugMode) {
                await this.runTests();
            }

            // Hide loading screen and show main app
            this.hideLoadingScreen();
            this.showMainApp();

            // Initialize authentication status
            this.updateAuthenticationStatus();

            // Initialize user location
            await this.initializeUserLocation();

            // Check for initial setup and show welcome popup if needed
            this.checkInitialSetup();

            // Make app globally accessible for tab switching
            window.app = this;

            this.isInitialized = true;
            console.log('NASA Farm Navigators Ready!');

        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showErrorScreen(error);
        }
    }

    /**
     * Initialize service worker for offline functionality
     */
    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration.scope);

                // Listen for service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            this.showUpdateNotification();
                        }
                    });
                });

            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Initialize offline manager for mobile-first capabilities
     */
    async initializeOfflineManager() {
        try {
            if (typeof OfflineManager !== 'undefined') {
                this.offlineManager = new OfflineManager();
                await this.offlineManager.initializeOfflineCapabilities();
                console.log('📱 Offline Manager initialized for mobile-first experience');

                // Set up data caching hooks
                this.setupOfflineDataCaching();

                // Enable offline status monitoring
                this.setupOfflineStatusMonitoring();
            } else {
                console.warn('OfflineManager not available - some offline features may be limited');
            }
        } catch (error) {
            console.warn('Offline Manager initialization failed:', error);
        }
    }

    /**
     * Set up offline data caching for NASA data
     */
    setupOfflineDataCaching() {
        if (!this.offlineManager) return;

        // Hook into data fetching to cache NASA data
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                const url = args[0];

                // Cache NASA data for offline use
                if (typeof url === 'string' && url.includes('/api/')) {
                    const clonedResponse = response.clone();
                    const data = await clonedResponse.json();

                    // Determine location from URL or use user/default location
                    const location = this.extractLocationFromURL(url) || this.userLocation || this.defaultLocation;

                    await this.offlineManager.cacheNASAData(location, data, this.getDataTypeFromURL(url));
                }

                return response;
            } catch (error) {
                // If network fails, try offline cache
                if (!navigator.onLine && this.offlineManager) {
                    const location = this.extractLocationFromURL(args[0]) || this.userLocation || this.defaultLocation;
                    const dataType = this.getDataTypeFromURL(args[0]);
                    const cachedData = await this.offlineManager.getCachedNASAData(location, dataType);

                    if (cachedData) {
                        return new Response(JSON.stringify(cachedData), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
                throw error;
            }
        };
    }

    /**
     * Set up offline status monitoring
     */
    setupOfflineStatusMonitoring() {
        if (!this.offlineManager) return;

        // Add offline status indicators to UI
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) {
            const offlineIndicator = document.createElement('div');
            offlineIndicator.id = 'offline-indicator';
            offlineIndicator.style.cssText = `
                display: none;
                background: linear-gradient(90deg, #dc3545, #c82333);
                color: white;
                padding: 4px 12px;
                border-radius: 15px;
                font-size: 12px;
                margin-left: 10px;
            `;
            offlineIndicator.textContent = '📴 Offline';
            statusDisplay.appendChild(offlineIndicator);

            // Update indicator based on connection status
            const updateOfflineIndicator = () => {
                const status = this.offlineManager.getOfflineStatus();
                offlineIndicator.style.display = status.isOnline ? 'none' : 'inline-block';
            };

            window.addEventListener('online', updateOfflineIndicator);
            window.addEventListener('offline', updateOfflineIndicator);
            updateOfflineIndicator(); // Initial check
        }
    }

    /**
     * Extract location from URL parameters
     */
    extractLocationFromURL(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            const lat = urlObj.searchParams.get('lat');
            const lon = urlObj.searchParams.get('lon');

            if (lat && lon) {
                return { lat: parseFloat(lat), lon: parseFloat(lon) };
            }
        } catch (error) {
            console.warn('Failed to extract location from URL:', error);
        }
        return null;
    }

    /**
     * Determine data type from URL
     */
    getDataTypeFromURL(url) {
        if (!url || typeof url !== 'string') return 'general';

        if (url.includes('smap') || url.includes('soil-moisture')) return 'smap';
        if (url.includes('modis') || url.includes('ndvi')) return 'modis';
        if (url.includes('landsat')) return 'landsat';
        if (url.includes('power') || url.includes('weather')) return 'weather';
        if (url.includes('gpm') || url.includes('precipitation')) return 'gpm';
        if (url.includes('ecostress') || url.includes('thermal')) return 'ecostress';

        return 'general';
    }

    /**
     * Set up application event listeners
     */
    setupEventListeners() {
        // Game engine events
        this.gameEngine.on('authStateChanged', (data) => {
            this.updateAuthUI(data.isAuthenticated, data.userInfo);
        });

        this.gameEngine.on('dataFetched', (data) => {
            this.updateDataDisplay(data);
        });

        this.gameEngine.on('achievementUnlocked', (data) => {
            this.showAchievementNotification(data.achievement);
        });

        this.gameEngine.on('educationProgress', (data) => {
            this.updateEducationProgress(data);
        });

        // Network status events
        window.addEventListener('online', this.handleOnlineStatusChange);
        window.addEventListener('offline', this.handleOnlineStatusChange);

        // Visibility API for performance optimization
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.gameEngine.pauseNonEssentialProcesses();
            } else {
                this.gameEngine.resumeProcesses();
            }
        });

        // Tab switching event listeners
        this.setupTabSwitching();

        // Settings modal event listeners
        this.setupSettingsModal();

        // Force show settings button
        this.forceShowSettingsButton();

        // Location input change listeners - connect to Farm Game
        this.setupLocationInputListeners();
    }

    /**
     * Initialize user location using Geolocation API
     */
    async initializeUserLocation() {
        console.log('🌍 Initializing user location...');

        try {
            // Check if geolocation is supported
            if (!navigator.geolocation) {
                console.warn('Geolocation not supported, using default location');
                this.setLocationInputs(this.defaultLocation);
                return;
            }

            // Get current position with timeout
            const position = await this.getCurrentPosition();
            this.userLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };

            console.log(`📍 User location detected: ${this.userLocation.lat.toFixed(4)}, ${this.userLocation.lon.toFixed(4)}`);

            // Update location inputs with user's location
            this.setLocationInputs(this.userLocation);

            // Show notification
            this.showNotification(
                `📍 Location auto-detected: ${this.userLocation.lat.toFixed(2)}°, ${this.userLocation.lon.toFixed(2)}°`,
                'success'
            );

        } catch (error) {
            console.warn('Failed to get user location:', error.message);

            // Use default location as fallback
            this.setLocationInputs(this.defaultLocation);

            // Show notification about fallback
            this.showNotification(
                'Using default location (Seoul). You can change coordinates manually.',
                'info'
            );
        }
    }

    /**
     * Get current position using Promise-based API
     */
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: true,
                timeout: 10000, // 10 seconds timeout
                maximumAge: 300000 // Accept cached position up to 5 minutes old
            };

            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    }

    /**
     * Set location input values
     */
    setLocationInputs(location) {
        // Set location inputs when they become available
        const setInputs = () => {
            const latInput = document.getElementById('latInput');
            const lonInput = document.getElementById('lonInput');

            if (latInput && lonInput) {
                latInput.value = location.lat.toFixed(4);
                lonInput.value = location.lon.toFixed(4);
                console.log(`🔧 Location inputs set to: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`);
            } else {
                // Retry after a short delay if inputs aren't ready yet
                setTimeout(setInputs, 500);
            }
        };

        setInputs();
    }

    /**
     * Check if initial setup is needed and show welcome popup
     */
    checkInitialSetup() {
        const hasNASAToken = localStorage.getItem('nasa_earthdata_token');
        const hasOpenAIKey = localStorage.getItem('openai_api_key');
        const hasSeenWelcome = localStorage.getItem('welcome_shown');

        // Show welcome popup if user hasn't seen it or missing essential tokens
        if (!hasSeenWelcome || !hasNASAToken) {
            setTimeout(() => {
                this.showWelcomeSetupModal();
            }, 2000); // Show after 2 seconds to let the app fully load
        }
    }

    /**
     * Show welcome setup modal with token configuration
     */
    showWelcomeSetupModal() {
        const modal = document.createElement('div');
        modal.className = 'setup-modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(7, 23, 63, 0.9);
            backdrop-filter: blur(10px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'setup-modal-content';
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #2c3e50, #667eea);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            color: white;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const hasNASAToken = localStorage.getItem('nasa_earthdata_token');
        const hasOpenAIKey = localStorage.getItem('openai_api_key');

        // Default NASA token for easy setup
        const defaultNASAToken = 'eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6ImphbmdfYW1lcnkiLCJleHAiOjE3NjMwNzgzOTksImlhdCI6MTc1NzgyNzAwMCwiaXNzIjoiaHR0cHM6Ly91cnMuZWFydGhkYXRhLm5hc2EuZ292IiwiaWRlbnRpdHlfcHJvdmlkZXIiOiJlZGxfb3BzIiwiYWNyIjoiZWRsIiwiYXNzdXJhbmNlX2xldmVsIjozfQ.sExaSzrCShT33AHjikx2nCGWAX9bqkoUgO2s09EToZ9yzZrA7dwK_2J8216VwZbdTesbwVYg2ysOV3eNqtxzlU2ALWbrmjSh06xaLSET_xiOICKnjeSgfn_VR6Ew4Dedg6uyDknW1WExZNgJ1lNO6L2a41W5B9plAJqxXeV5rdle-rRCzR51VAAj0vzA5mtFXCLDNgb2or7dOxvJpRjv12_x57Az1i7Y3SQhVQmqgfiP9Hdan-wVu5eR6JCs2ewqJYtKPlec4WGmn2nQ1IHDbabiKVPZhtZqb8nzeDVBkf-4zLTWRRBzt8ZquBWl3l-0P9p0-6A_msif53I-F4pNIw';

        modalContent.innerHTML = `
            <div class="setup-header">
                <h1 style="color: #EAFE07; font-size: 28px; margin-bottom: 10px; text-align: center;">
                    🚀 Welcome to NASA Farm Navigators!
                </h1>
                <p style="text-align: center; font-size: 16px; margin-bottom: 30px; opacity: 0.9; color: white !important;">
                    Get started with real NASA satellite data and AI-powered agricultural insights
                </p>
            </div>

            <div class="setup-sections">
                <div class="setup-section" style="margin-bottom: 30px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 12px;">
                    <h3 style="color: #EAFE07; margin-bottom: 15px; display: flex; align-items: center;">
                        <span style="margin-right: 10px;">${hasNASAToken ? '✅' : '📡'}</span>
                        NASA Earthdata Token ${hasNASAToken ? '(Configured)' : '(Required)'}
                    </h3>
                    <p style="margin-bottom: 15px; line-height: 1.6; color: white !important;">
                        Access real satellite data from SMAP, MODIS, and Landsat missions.
                        <br><strong style="color: #EAFE07;">A demo token is pre-filled for quick start!</strong>
                    </p>
                    <div class="token-instructions" style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px; color: white;">
                        <p style="color: #EAFE07; margin: 0 0 10px 0;"><strong>🚀 Ready to go!</strong> A demo token is already provided below.</p>
                        <details style="color: white;">
                            <summary style="cursor: pointer; color: white; margin-bottom: 10px;">Want your own token? Click to expand...</summary>
                            <ol style="margin: 10px 0 0 20px; line-height: 1.6; color: white !important;">
                                <li style="color: white !important;">Visit <a href="https://urs.earthdata.nasa.gov/profile" target="_blank" style="color: #EAFE07;">NASA Earthdata URS</a></li>
                                <li style="color: white !important;">Create a free account or sign in</li>
                                <li style="color: white !important;">Go to "Applications" → "Authorized Apps"</li>
                                <li style="color: white !important;">Generate new application token</li>
                                <li style="color: white !important;">Replace the token below</li>
                            </ol>
                        </details>
                    </div>
                    <input type="password" id="setupNasaToken" placeholder="Paste your NASA Earthdata token here..."
                           value="${hasNASAToken || defaultNASAToken}"
                           style="width: 100%; padding: 12px; border: none; border-radius: 8px; background: rgba(255,255,255,0.9); color: #333;">
                </div>

                <div class="setup-section" style="margin-bottom: 30px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 12px;">
                    <h3 style="color: #EAFE07; margin-bottom: 15px; display: flex; align-items: center;">
                        <span style="margin-right: 10px;">${hasOpenAIKey ? '✅' : '🤖'}</span>
                        OpenAI API Key ${hasOpenAIKey ? '(Configured)' : '(Optional)'}
                    </h3>
                    <p style="margin-bottom: 15px; line-height: 1.6; color: white !important;">
                        Enable AI-powered agricultural insights and conversational assistance.
                    </p>
                    <div class="token-instructions" style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px; color: white;">
                        <strong style="color: white;">How to get your OpenAI API key:</strong>
                        <ol style="margin: 10px 0 0 20px; line-height: 1.8; color: white !important;">
                            <li style="color: white !important;">Visit <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #EAFE07;">OpenAI API Keys</a></li>
                            <li style="color: white !important;">Sign in to your OpenAI account</li>
                            <li style="color: white !important;">Click "Create new secret key"</li>
                            <li style="color: white !important;">Copy the key (you won't see it again!)</li>
                            <li style="color: white !important;">Paste it below</li>
                        </ol>
                    </div>
                    <input type="password" id="setupOpenaiKey" placeholder="Paste your OpenAI API key here (optional)..."
                           value="${hasOpenAIKey || ''}"
                           style="width: 100%; padding: 12px; border: none; border-radius: 8px; background: rgba(255,255,255,0.9); color: #333;">
                </div>

                <div class="setup-features" style="margin-bottom: 30px; padding: 20px; background: rgba(228, 55, 0, 0.1); border-radius: 12px; border: 1px solid rgba(228, 55, 0, 0.3);">
                    <h3 style="color: #E43700; margin-bottom: 15px;">🌟 What you'll get:</h3>
                    <ul style="margin-left: 20px; line-height: 1.8; color: white !important;">
                        <li style="color: white !important;">Real-time soil moisture data from NASA SMAP satellite</li>
                        <li style="color: white !important;">Vegetation health insights from MODIS</li>
                        <li style="color: white !important;">High-resolution crop analysis from Landsat</li>
                        <li style="color: white !important;">AI-powered farming recommendations</li>
                        <li style="color: white !important;">Interactive 3D globe visualization</li>
                        <li style="color: white !important;">ROI calculator for farm investments</li>
                    </ul>
                </div>
            </div>

            <div class="setup-actions" style="display: flex; gap: 15px; justify-content: center;">
                <button id="setupSave" style="
                    background: linear-gradient(45deg, #E43700, #8E1100);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(228, 55, 0, 0.3);
                ">
                    🚀 Start Exploring
                </button>
                <button id="setupLater" style="
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Skip for Now
                </button>
            </div>

            <p style="text-align: center; margin-top: 20px; font-size: 14px; opacity: 0.7;">
                You can always change these settings later in the Settings panel ⚙️
            </p>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add event listeners
        const saveBtn = modal.querySelector('#setupSave');
        const laterBtn = modal.querySelector('#setupLater');
        const nasaTokenInput = modal.querySelector('#setupNasaToken');
        const openaiKeyInput = modal.querySelector('#setupOpenaiKey');

        saveBtn.addEventListener('click', () => {
            const nasaToken = nasaTokenInput.value.trim();
            const openaiKey = openaiKeyInput.value.trim();

            if (nasaToken) {
                localStorage.setItem('nasa_earthdata_token', nasaToken);
                this.updateAuthenticationStatus();
            }

            if (openaiKey) {
                localStorage.setItem('openai_api_key', openaiKey);
                // Reinitialize ConversationalAI if it exists
                if (window.conversationalAI) {
                    window.conversationalAI.loadAPIKey();
                }
            }

            localStorage.setItem('welcome_shown', 'true');

            this.showNotification('🚀 Setup complete! Ready to explore NASA satellite data!', 'success');
            document.body.removeChild(modal);
        });

        laterBtn.addEventListener('click', () => {
            localStorage.setItem('welcome_shown', 'true');
            this.showNotification('You can configure tokens anytime in Settings ⚙️', 'info');
            document.body.removeChild(modal);
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                laterBtn.click();
            }
        });

        // Add hover effects
        saveBtn.addEventListener('mouseenter', () => {
            saveBtn.style.transform = 'translateY(-2px)';
            saveBtn.style.boxShadow = '0 6px 20px rgba(228, 55, 0, 0.4)';
        });

        saveBtn.addEventListener('mouseleave', () => {
            saveBtn.style.transform = 'translateY(0)';
            saveBtn.style.boxShadow = '0 4px 15px rgba(228, 55, 0, 0.3)';
        });

        laterBtn.addEventListener('mouseenter', () => {
            laterBtn.style.background = 'rgba(255,255,255,0.2)';
        });

        laterBtn.addEventListener('mouseleave', () => {
            laterBtn.style.background = 'rgba(255,255,255,0.1)';
        });
    }

    /**
     * Set up location input listeners to connect Real-Time Satellite Data with Farm Game
     */
    setupLocationInputListeners() {
        const latInput = document.getElementById('latInput');
        const lonInput = document.getElementById('lonInput');

        if (latInput && lonInput) {
            // Update farm location when latitude changes
            latInput.addEventListener('change', () => {
                this.updateFarmLocation();
            });

            // Update farm location when longitude changes
            lonInput.addEventListener('change', () => {
                this.updateFarmLocation();
            });

            // Also listen for 'input' events for real-time updates
            latInput.addEventListener('input', this.debounce(() => {
                this.updateFarmLocation();
            }, 1000)); // Wait 1 second after user stops typing

            lonInput.addEventListener('input', this.debounce(() => {
                this.updateFarmLocation();
            }, 1000));

            console.log('🌍 Location input listeners set up for Farm Game integration');
        } else {
            console.warn('⚠️ Location inputs not found - Farm Game location sync disabled');
        }
    }

    /**
     * Update Farm Game location based on Real-Time Satellite Data inputs
     */
    async updateFarmLocation() {
        const latInput = document.getElementById('latInput');
        const lonInput = document.getElementById('lonInput');

        if (!latInput || !lonInput) return;

        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);

        // Validate coordinates
        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            console.warn('Invalid coordinates:', { lat, lon });
            return;
        }

        // Update farm location in game engine
        console.log('🔍 Debug: Attempting to get farm game from engine');
        const farmGame = this.gameEngine.getFarmGame();
        console.log('🔍 Debug: Farm game instance:', farmGame ? 'Found' : 'Not found');

        if (farmGame && farmGame.farmSimulation) {
            console.log('🔍 Debug: Farm simulation found, updating location');
            try {
                // farmGame is FarmGameUI, farmGame.farmSimulation is FarmSimulationEngine
                await farmGame.farmSimulation.updateFarmLocation(lat, lon);
                console.log(`🌍 Farm location updated to: ${lat}, ${lon}`);

                // Show notification to user
                this.showNotification(
                    `📍 Farm location updated to ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                    'info'
                );
            } catch (error) {
                console.error('❌ Failed to update farm location:', error);
            }
        } else {
            console.warn('⚠️ Farm Game not available for location update');
            console.log('🔍 Debug: GameEngine:', this.gameEngine ? 'Exists' : 'Missing');
            console.log('🔍 Debug: getFarmGame method:', typeof this.gameEngine?.getFarmGame);
            console.log('🔍 Debug: FarmGame instance:', farmGame ? 'Exists' : 'Missing');

            if (farmGame) {
                console.log('🔍 Debug: FarmGame.farmSimulation:', farmGame.farmSimulation ? 'Exists' : 'Missing');
            }

            // Try to initialize Farm Game if not available
            console.log('🔍 Attempting to initialize Farm Game for location update...');
            await this.initializeFarmGame();

            // Retry after initialization
            const retryFarmGame = this.gameEngine.getFarmGame();
            if (retryFarmGame && retryFarmGame.farmSimulation) {
                console.log('🔍 Retry: Farm Game now available, updating location');
                try {
                    await retryFarmGame.farmSimulation.updateFarmLocation(lat, lon);
                    console.log(`🌍 Farm location updated to: ${lat}, ${lon}`);
                    this.showNotification(
                        `📍 Farm location updated to ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                        'info'
                    );
                } catch (error) {
                    console.error('❌ Failed to update farm location on retry:', error);
                }
            } else {
                console.error('❌ Farm Game still not available after initialization attempt');
            }
        }
    }

    /**
     * Debounce helper function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Set up tab switching functionality
     */
    setupTabSwitching() {
        // Add click event listeners to all tab buttons
        document.querySelectorAll('.tab[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    /**
     * Set up settings modal event listeners
     */
    setupSettingsModal() {
        const settingsButton = document.getElementById('settingsButton');
        const settingsModal = document.getElementById('settingsModal');
        const settingsClose = document.getElementById('settingsClose');
        const saveSettingsBtn = document.getElementById('saveSettings');
        const resetSettingsBtn = document.getElementById('resetSettings');
        const openaiApiKeyInput = document.getElementById('openaiApiKey');
        const nasaTokenInput = document.getElementById('nasaTokenInput');

        // Open settings modal
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                this.openSettingsModal();
            });
        }

        // Close settings modal
        if (settingsClose) {
            settingsClose.addEventListener('click', () => {
                this.closeSettingsModal();
            });
        }

        // Close modal when clicking outside
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.closeSettingsModal();
                }
            });
        }

        // Save settings
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Reset settings
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Real-time validation for API keys
        if (openaiApiKeyInput) {
            openaiApiKeyInput.addEventListener('input', () => {
                this.validateApiKey(openaiApiKeyInput.value);
            });
        }

        if (nasaTokenInput) {
            nasaTokenInput.addEventListener('input', () => {
                this.validateNasaToken(nasaTokenInput.value);
            });
        }
    }

    /**
     * Switch to specified tab
     */
    switchTab(tabName) {
        console.log(`Switching to tab: ${tabName}`);

        // Remove active class from all tabs and tab contents
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Add active class to selected tab and content
        const selectedTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
        const selectedContent = document.querySelector(`.tab-content[data-tab="${tabName}"]`);

        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        if (selectedContent) {
            selectedContent.classList.add('active');
        }

        // Handle special tab initialization
        switch (tabName) {
            case 'farm-game':
                this.initializeFarmGame();
                break;
            case 'ai-copilot':
                this.initializeAICopilot();
                break;
            case 'farm-globe-3d':
                this.initializeFarmGlobe3D();
                break;
            case 'data':
                // Data tab is already initialized
                break;
            case 'education':
                // Education panel is already initialized
                break;
            case 'achievements':
                this.displayNASAAchievements();
                break;
            // Add other tab cases as needed
        }
    }

    /**
     * Initialize user interface
     */
    async initializeUI() {
        console.log('Initializing UI...');


        // Get UI elements
        this.ui.loadingScreen = document.getElementById('loadingScreen');
        this.ui.mainContainer = document.getElementById('mainContainer');
        this.ui.authButton = document.getElementById('authButton');
        this.ui.statusDisplay = document.getElementById('statusDisplay');
        this.ui.resolutionControls = document.getElementById('resolutionControls');
        this.ui.dataDisplay = document.getElementById('dataDisplay');
        this.ui.educationPanel = document.getElementById('educationPanel');

        // Log which elements were found
        console.log('UI Elements found:', {
            loadingScreen: !!this.ui.loadingScreen,
            mainContainer: !!this.ui.mainContainer,
            authButton: !!this.ui.authButton,
            statusDisplay: !!this.ui.statusDisplay,
            resolutionControls: !!this.ui.resolutionControls,
            dataDisplay: !!this.ui.dataDisplay,
            educationPanel: !!this.ui.educationPanel
        });

        // Set up UI event listeners
        if (this.ui.authButton) {
            this.ui.authButton.addEventListener('click', this.handleAuthClick);
        }

        if (this.ui.resolutionControls) {
            this.ui.resolutionControls.addEventListener('change', this.handleResolutionChange);
        }

        try {
            // Set up navigation to advanced components
            this.setupAdvancedNavigation();
        } catch (error) {
            console.warn('Failed to setup advanced navigation:', error);
        }

        try {
            // Initialize education panel
            await this.initializeEducationPanel();
        } catch (error) {
            console.warn('❌ Failed to initialize education panel:', error);
        }

        try {
            // Initialize data visualization
            await this.initializeDataVisualization();
        } catch (error) {
            console.warn('❌ Failed to initialize data visualization:', error);
        }

        try {
            // Set initial UI state
            this.updateConnectionStatus();

            // Check if authentication methods exist before calling
            if (this.gameEngine && typeof this.gameEngine.isAuthenticated === 'function') {
                const isAuth = this.gameEngine.isAuthenticated();
                const user = this.gameEngine.getCurrentUser ? this.gameEngine.getCurrentUser() : null;
                this.updateAuthUI(isAuth, user);
            }
        } catch (error) {
            console.warn('Failed to update UI state:', error);
        }
    }

    /**
     * Initialize education panel
     */
    async initializeEducationPanel() {
        if (!this.ui.educationPanel) {
            console.warn('Education panel element not found');
            return;
        }

        const educationEngine = this.gameEngine.getManagers().education;
        const learningState = educationEngine?.getLearningState ? educationEngine.getLearningState() : { progress: {} };

        // Create education panel HTML
        this.ui.educationPanel.innerHTML = `
            <div class="panel-header">
                <h3>Understanding Satellite Pixels</h3>
                <button class="close-panel-btn" aria-label="Close panel">×</button>
            </div>

            <div class="panel-content">
                <div class="pixel-definition">
                    <h4>What is a Pixel?</h4>
                    <p>A pixel is the smallest unit of a satellite image. Think of it as a colored square that represents an area on Earth. Each pixel contains information about the surface conditions within that area.</p>
                </div>

                <div class="learning-objectives">
                    <h4>Learning Objectives:</h4>
                    <ul>
                        <li>Define what a satellite pixel represents</li>
                        <li>Understand the relationship between pixel size and detail</li>
                        <li>Recognize how resolution affects agricultural monitoring</li>
                        <li>Compare different satellite sensor resolutions</li>
                    </ul>
                </div>

                <div class="pixel-examples-container">
                    <h4>Pixel Size Examples:</h4>

                    <div class="pixel-examples">
                        <div class="example-item">
                            <h4>Landsat 8</h4>
                            <div class="pixel-size">30m × 30m</div>
                            <div class="example-description">High detail - individual fields</div>
                        </div>

                        <div class="example-item">
                            <h4>MODIS</h4>
                            <div class="pixel-size">250m × 250m</div>
                            <div class="example-description">Medium detail - farm regions</div>
                        </div>

                        <div class="example-item">
                            <h4>SMAP</h4>
                            <div class="pixel-size">9km × 9km</div>
                            <div class="example-description">Low detail - large areas</div>
                        </div>
                    </div>
                </div>


                <button class="start-lesson-btn" data-module="pixel_awareness">Start Interactive Lesson</button>
            </div>
        `;

        // Add module event listeners
        this.ui.educationPanel.querySelectorAll('.start-lesson-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('Starting Interactive Lesson');

                // Start the pixel_awareness module
                const educationEngine = this.gameEngine.getManagers().education;
                if (educationEngine && typeof educationEngine.startModule === 'function') {
                    try {
                        const result = await educationEngine.startModule('pixel_awareness');
                        if (result.status === 'started') {
                            this.showResolutionComparisonLesson(result.firstLesson);
                        } else if (result.status === 'prerequisites_required') {
                            console.log('Prerequisites required:', result.missing);
                            // For now, just show the lesson anyway for demo purposes
                            this.showResolutionComparisonLesson({ title: 'Understanding Satellite Pixels' });
                        }
                    } catch (error) {
                        console.error('Failed to start education module:', error);
                        // Fallback: Show the lesson anyway for demo purposes
                        this.showResolutionComparisonLesson({ title: 'Understanding Satellite Pixels' });
                    }
                } else {
                    console.warn('Education engine not available, showing lesson directly');
                    // Fallback: Show the lesson directly
                    this.showResolutionComparisonLesson({ title: 'Understanding Satellite Pixels' });
                }
            });
        });

        // Add close panel event listener
        const closePanelBtn = this.ui.educationPanel.querySelector('.close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                // Switch to data visualization tab
                const dataTab = document.querySelector('.tab[data-tab="data"]');
                if (dataTab) {
                    dataTab.click();
                }
            });
        }

        // Update achievements display
        this.updateAchievements();
    }

    /**
     * Show resolution comparison lesson
     */
    showResolutionComparisonLesson(lessonData) {
        if (!this.ui.educationPanel) {
            console.warn('Education panel not found');
            return;
        }

        // Store original content for going back
        if (!this.originalEducationContent) {
            this.originalEducationContent = this.ui.educationPanel.innerHTML;
        }

        // Show the resolution comparison lesson
        this.ui.educationPanel.innerHTML = `
            <div class="panel-header">
                <h3>Interactive Pixel Lesson</h3>
                <button class="close-panel-btn" aria-label="Close lesson">×</button>
            </div>

            <div class="panel-content">
                <div class="lesson-intro">
                    <h4>${lessonData?.title || 'Understanding Satellite Pixels'}</h4>
                    <p>Great! Now let's explore how different satellite resolutions affect what we can see from space.</p>
                </div>

                <div class="resolution-comparison">
                    <h4>Compare Resolutions:</h4>
                    <p>Click on each resolution example to see how satellite pixel size affects what we can observe:</p>

                    <div class="comparison-grid">
                        <div class="comparison-item" data-resolution="high">
                            <div class="pixel-demo high-res"></div>
                            <h5>High Resolution (10-30m)</h5>
                            <p>Perfect for monitoring individual fields and crop health</p>
                            <button class="explore-btn" data-resolution="landsat">Explore Landsat</button>
                        </div>
                        <div class="comparison-item" data-resolution="medium">
                            <div class="pixel-demo medium-res"></div>
                            <h5>Medium Resolution (250m-1km)</h5>
                            <p>Good for regional agricultural monitoring</p>
                            <button class="explore-btn" data-resolution="modis">Explore MODIS</button>
                        </div>
                        <div class="comparison-item" data-resolution="low">
                            <div class="pixel-demo low-res"></div>
                            <h5>Low Resolution (1km+)</h5>
                            <p>Useful for large-scale climate and weather patterns</p>
                            <button class="explore-btn" data-resolution="smap">Explore SMAP</button>
                        </div>
                    </div>
                </div>

                <div class="lesson-navigation">
                    <button class="back-btn">Back to Overview</button>
                    <div class="lesson-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 33%"></div>
                        </div>
                        <span>Lesson 1 of 3</span>
                    </div>
                    <button class="next-btn">Next: Pixel Hunt</button>
                </div>
            </div>
        `;

        // Add event listeners for the new content
        this.attachLessonEventListeners();
    }

    /**
     * Attach event listeners for lesson content
     */
    attachLessonEventListeners() {
        // Close button
        const closePanelBtn = this.ui.educationPanel.querySelector('.close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                this.goBackToPixelOverview();
            });
        }

        // Back button
        const backBtn = this.ui.educationPanel.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.goBackToPixelOverview();
            });
        }

        // Explore buttons
        this.ui.educationPanel.querySelectorAll('.explore-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resolution = e.target.dataset.resolution;
                this.exploreResolution(resolution);
            });
        });

        // Next button
        const nextBtn = this.ui.educationPanel.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.showNextLesson();
            });
        }
    }

    /**
     * Go back to pixel overview
     */
    goBackToPixelOverview() {
        if (this.originalEducationContent && this.ui.educationPanel) {
            this.ui.educationPanel.innerHTML = this.originalEducationContent;
            // Re-attach the original event listeners
            this.attachEducationEventListeners();
        }
    }

    /**
     * Attach original education panel event listeners
     */
    attachEducationEventListeners() {
        // Re-attach start lesson button listeners
        this.ui.educationPanel.querySelectorAll('.start-lesson-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('Starting Interactive Lesson');

                // Start the pixel_awareness module
                const educationEngine = this.gameEngine.getManagers().education;
                if (educationEngine && typeof educationEngine.startModule === 'function') {
                    try {
                        const result = await educationEngine.startModule('pixel_awareness');
                        if (result.status === 'started') {
                            this.showResolutionComparisonLesson(result.firstLesson);
                        } else if (result.status === 'prerequisites_required') {
                            console.log('Prerequisites required:', result.missing);
                            // For now, just show the lesson anyway for demo purposes
                            this.showResolutionComparisonLesson({ title: 'Understanding Satellite Pixels' });
                        }
                    } catch (error) {
                        console.error('Failed to start education module:', error);
                        // Fallback: Show the lesson anyway for demo purposes
                        this.showResolutionComparisonLesson({ title: 'Understanding Satellite Pixels' });
                    }
                } else {
                    console.warn('Education engine not available, showing lesson directly');
                    // Fallback: Show the lesson directly
                    this.showResolutionComparisonLesson({ title: 'Understanding Satellite Pixels' });
                }
            });
        });

        // Re-attach close panel listener
        const closePanelBtn = this.ui.educationPanel.querySelector('.close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                // Switch to data visualization tab
                const dataTab = document.querySelector('.tab[data-tab="data"]');
                if (dataTab) {
                    dataTab.click();
                }
            });
        }
    }

    /**
     * Explore specific resolution
     */
    exploreResolution(resolution) {
        console.log(`Exploring ${resolution} resolution`);

        // Create detailed exploration content based on the satellite
        const satelliteData = {
            landsat: {
                name: 'Landsat 8/9',
                resolution: '30m × 30m',
                coverage: '185km × 185km',
                revisit: '16 days',
                description: 'Perfect for monitoring individual farm fields and crop health',
                applications: ['Field boundary mapping', 'Crop type classification', 'Irrigation monitoring', 'Yield prediction'],
                advantages: ['High spatial detail', 'Long data record since 1972', 'Free and open data'],
                limitations: ['16-day revisit time', 'Cloud cover issues', 'Limited spectral bands compared to hyperspectral']
            },
            modis: {
                name: 'MODIS Terra/Aqua',
                resolution: '250m × 250m',
                coverage: '2330km × 2330km',
                revisit: '1-2 days',
                description: 'Ideal for regional agricultural monitoring and vegetation trends',
                applications: ['Regional crop monitoring', 'Drought assessment', 'Vegetation phenology', 'Fire detection'],
                advantages: ['Daily global coverage', 'Multiple spectral bands', 'Long-term consistent data'],
                limitations: ['Coarser spatial resolution', 'Mixed pixels in heterogeneous areas', 'Atmospheric interference']
            },
            smap: {
                name: 'SMAP (Soil Moisture)',
                resolution: '9km × 9km',
                coverage: 'Global',
                revisit: '2-3 days',
                description: 'Essential for large-scale soil moisture and agricultural water management',
                applications: ['Soil moisture mapping', 'Drought monitoring', 'Irrigation planning', 'Flood prediction'],
                advantages: ['Penetrates through vegetation', 'All-weather capability', 'Root zone estimates'],
                limitations: ['Very coarse resolution', 'Limited to soil moisture', 'Shorter data record (2015+)']
            }
        };

        const data = satelliteData[resolution];
        if (data) {
            this.showSatelliteDetailModal(data);
        }
    }

    /**
     * Show detailed satellite information modal
     */
    showSatelliteDetailModal(satelliteData) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'satellite-detail-modal';
        modalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${satelliteData.name}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="satellite-specs">
                        <h4>Technical Specifications</h4>
                        <div class="spec-grid">
                            <div class="spec-item">
                                <span class="spec-label">Resolution:</span>
                                <span class="spec-value">${satelliteData.resolution}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Coverage:</span>
                                <span class="spec-value">${satelliteData.coverage}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Revisit Time:</span>
                                <span class="spec-value">${satelliteData.revisit}</span>
                            </div>
                        </div>
                    </div>

                    <div class="satellite-description">
                        <h4>Agricultural Applications</h4>
                        <p>${satelliteData.description}</p>
                        <ul class="applications-list">
                            ${satelliteData.applications.map(app => `<li>${app}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="pros-cons">
                        <div class="advantages">
                            <h4>Advantages</h4>
                            <ul>
                                ${satelliteData.advantages.map(adv => `<li>${adv}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="limitations">
                            <h4>Limitations</h4>
                            <ul>
                                ${satelliteData.limitations.map(lim => `<li>${lim}</li>`).join('')}
                            </ul>
                        </div>
                    </div>

                    <div class="real-time-data">
                        <h4>Real-Time Status</h4>
                        <div class="satellite-status">
                            <div class="status-item">
                                <span class="status-label">Current Status:</span>
                                <span class="status-value operational">Operational</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Last Data Update:</span>
                                <span class="status-value">${this.getRecentDataTime()}</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Next Pass Over Area:</span>
                                <span class="status-value">${this.getNextPassTime(satelliteData.name)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="educational-insights">
                        <h4>Educational Insights</h4>
                        <div class="insight-cards">
                            ${this.generateEducationalInsights(satelliteData.name)}
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button class="try-demo-btn">Try Interactive Demo</button>
                        <button class="learn-more-btn">Learn More</button>
                        <button class="track-satellite-btn">Track Live Position</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to document
        document.body.appendChild(modalOverlay);

        // Add event listeners
        const closeModal = () => {
            document.body.removeChild(modalOverlay);
        };

        modalOverlay.querySelector('.modal-close').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        modalOverlay.querySelector('.try-demo-btn').addEventListener('click', () => {
            this.startInteractiveDemo(satelliteData.name);
            closeModal();
        });

        modalOverlay.querySelector('.learn-more-btn').addEventListener('click', () => {
            this.showNASAResources(satelliteData.name);
            closeModal();
        });

        modalOverlay.querySelector('.track-satellite-btn').addEventListener('click', () => {
            this.showSatelliteTracker(satelliteData.name);
            closeModal();
        });
    }

    /**
     * Start interactive demo for specific satellite
     */
    startInteractiveDemo(satelliteName) {
        console.log(`Starting interactive demo for ${satelliteName}`);
        // This could integrate with the ResolutionManager for pixel hunt challenges
        alert(`Interactive Demo: ${satelliteName}\n\nIn a full implementation, this would start:\n• Pixel identification challenges\n• Resolution comparison exercises\n• Real data exploration tools`);
    }

    /**
     * Show NASA learning resources
     */
    showNASAResources(satelliteName) {
        console.log(`Showing NASA resources for ${satelliteName}`);
        // This could link to actual NASA educational materials
        alert(`NASA Learning Resources: ${satelliteName}\n\nIn a full implementation, this would link to:\n• NASA mission pages\n• Educational datasets\n• Technical documentation\n• Interactive tutorials`);
    }

    /**
     * Get recent data time (simulated)
     */
    getRecentDataTime() {
        const now = new Date();
        const recentTime = new Date(now.getTime() - Math.random() * 6 * 60 * 60 * 1000); // Within last 6 hours
        return recentTime.toLocaleString();
    }

    /**
     * Get next satellite pass time (simulated)
     */
    getNextPassTime(satelliteName) {
        const now = new Date();
        const nextPass = new Date(now.getTime() + Math.random() * 24 * 60 * 60 * 1000); // Within next 24 hours

        const passData = {
            'Landsat 8/9': {
                duration: '8-12 minutes',
                elevation: '70-85°'
            },
            'MODIS Terra/Aqua': {
                duration: '5-8 minutes',
                elevation: '60-90°'
            },
            'SMAP (Soil Moisture)': {
                duration: '6-10 minutes',
                elevation: '45-75°'
            }
        };

        const data = passData[satelliteName] || passData['Landsat 8/9'];
        return `${nextPass.toLocaleString()} (${data.duration}, ${data.elevation} elevation)`;
    }

    /**
     * Generate educational insights for satellite
     */
    generateEducationalInsights(satelliteName) {
        const insights = {
            'Landsat 8/9': [
                {
                    icon: '',
                    title: 'Perfect for Field-Level Analysis',
                    text: 'At 30m resolution, you can see individual crop fields and monitor their health over time.'
                },
                {
                    icon: '',
                    title: 'Historical Trends',
                    text: 'Landsat provides the longest continuous Earth observation record, dating back to 1972.'
                },
                {
                    icon: '',
                    title: 'Precision Agriculture',
                    text: 'Ideal for variable rate application mapping and yield prediction at field scale.'
                }
            ],
            'MODIS Terra/Aqua': [
                {
                    icon: '',
                    title: 'Regional Monitoring',
                    text: 'Best for tracking large-scale agricultural patterns and regional crop conditions.'
                },
                {
                    icon: '',
                    title: 'Daily Updates',
                    text: 'Provides near real-time monitoring with daily global coverage for rapid change detection.'
                },
                {
                    icon: '',
                    title: 'Environmental Alerts',
                    text: 'Excellent for detecting fires, floods, and other environmental hazards affecting crops.'
                }
            ],
            'SMAP (Soil Moisture)': [
                {
                    icon: '',
                    title: 'Soil Water Content',
                    text: 'Measures soil moisture from surface (0-5cm) to root zone (0-100cm) depths.'
                },
                {
                    icon: '',
                    title: 'Weather Independence',
                    text: 'Works through clouds and vegetation using microwave technology.'
                },
                {
                    icon: '',
                    title: 'Irrigation Planning',
                    text: 'Essential for optimizing irrigation timing and water resource management.'
                }
            ]
        };

        const satelliteInsights = insights[satelliteName] || insights['Landsat 8/9'];
        return satelliteInsights.map(insight => `
            <div class="insight-card">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h5>${insight.title}</h5>
                    <p>${insight.text}</p>
                </div>
            </div>
        `).join('');
    }

    /**
     * Show satellite tracker interface
     */
    showSatelliteTracker(satelliteName) {
        console.log(`Showing satellite tracker for ${satelliteName}`);

        // Create satellite tracker interface
        const trackerInfo = {
            features: [
                '• Real-time orbital position tracking',
                '• 3D Earth visualization with satellite paths',
                '• Pass prediction calculator for your location',
                '• Coverage area visualization',
                '• Ground track mapping',
                '• Data acquisition schedules'
            ],
            apiIntegration: [
                '• NASA HORIZONS API for precise orbital data',
                '• Cesium.js for 3D Earth visualization',
                '• Real-time TLE (Two-Line Element) updates',
                '• Ground station visibility calculations'
            ],
            educationalValue: [
                '• Understanding orbital mechanics',
                '• Learning about satellite coverage patterns',
                '• Connecting orbit to data collection',
                '• Visualizing the "satellite constellation" concept'
            ]
        };

        alert(`Live Satellite Tracker: ${satelliteName}\n\nFeatures:\n${trackerInfo.features.join('\n')}\n\nTechnical Integration:\n${trackerInfo.apiIntegration.join('\n')}\n\nEducational Value:\n${trackerInfo.educationalValue.join('\n')}\n\nTrack satellites as they orbit Earth in real-time!`);
    }

    /**
     * Show next lesson
     */
    showNextLesson() {
        console.log('Advancing to next lesson');

        // Show pixel hunt introduction
        this.ui.educationPanel.innerHTML = `
            <div class="panel-header">
                <h3>Pixel Hunt Training</h3>
                <button class="close-panel-btn" aria-label="Close lesson">×</button>
            </div>

            <div class="panel-content">
                <div class="lesson-intro">
                    <h4>Ready for the Pixel Hunt Training?</h4>
                    <p>Now that you understand satellite resolutions, let's test your skills! In this challenge, you'll identify features in satellite images at different resolutions.</p>
                </div>

                <div class="challenge-overview">
                    <h4>Training Overview</h4>
                    <div class="challenge-grid">
                        <div class="challenge-level">
                            <div class="level-badge beginner">Step 1</div>
                            <h5>Landsat (30m)</h5>
                            <p>🌾 Identify individual crop fields using high-resolution Landsat imagery</p>
                            <div class="challenge-stats">
                                <span>Resolution: 30m per pixel</span>
                                <span>🎯 Focus: Field boundaries</span>
                            </div>
                        </div>

                        <div class="challenge-level">
                            <div class="level-badge intermediate">Step 2</div>
                            <h5>MODIS (250m)</h5>
                            <p>🗺️ Identify agricultural regions using medium-resolution MODIS data</p>
                            <div class="challenge-stats">
                                <span>Resolution: 250m per pixel</span>
                                <span>🎯 Focus: Regional patterns</span>
                            </div>
                        </div>

                        <div class="challenge-level">
                            <div class="level-badge advanced">Step 3</div>
                            <h5>SMAP (9km)</h5>
                            <p>🏜️ Identify dry/desert regions using low-resolution soil moisture data</p>
                            <div class="challenge-stats">
                                <span>Resolution: 9km per pixel</span>
                                <span>🎯 Focus: Moisture patterns</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="achievements-preview">
                    <h4>Achievements to Unlock</h4>
                    <div class="achievement-list">
                        <div class="achievement-item">
                            <span class="achievement-icon">🌾</span>
                            <div class="achievement-text">
                                <strong>Field Expert</strong>
                                <p>Successfully identify crop fields in Landsat imagery</p>
                            </div>
                        </div>
                        <div class="achievement-item">
                            <span class="achievement-icon">🗺️</span>
                            <div class="achievement-text">
                                <strong>Regional Analyst</strong>
                                <p>Correctly identify agricultural regions in MODIS data</p>
                            </div>
                        </div>
                        <div class="achievement-item">
                            <span class="achievement-icon">🏜️</span>
                            <div class="achievement-text">
                                <strong>Moisture Detective</strong>
                                <p>Identify dry regions using SMAP soil moisture data</p>
                            </div>
                        </div>
                        <div class="achievement-item">
                            <span class="achievement-icon">🎯</span>
                            <div class="achievement-text">
                                <strong>Resolution Master</strong>
                                <p>Complete all three resolution training steps</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lesson-navigation">
                    <button class="back-btn">Back to Comparison</button>
                    <div class="lesson-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 66%"></div>
                        </div>
                        <span>Lesson 2 of 3</span>
                    </div>
                    <button class="start-challenge-btn">Start Challenge!</button>
                </div>
            </div>
        `;

        // Attach event listeners for the challenge interface
        this.attachChallengeEventListeners();
    }

    /**
     * Attach event listeners for challenge interface
     */
    attachChallengeEventListeners() {
        // Close button
        const closePanelBtn = this.ui.educationPanel.querySelector('.close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                this.goBackToPixelOverview();
            });
        }

        // Back button
        const backBtn = this.ui.educationPanel.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // Go back to resolution comparison lesson
                this.showResolutionComparisonLesson({ title: 'Understanding Satellite Pixels' });
            });
        }

        // Start challenge button
        const startChallengeBtn = this.ui.educationPanel.querySelector('.start-challenge-btn');
        if (startChallengeBtn) {
            startChallengeBtn.addEventListener('click', () => {
                this.startPixelHuntChallenge();
            });
        }
    }

    /**
     * Start the pixel hunt challenge
     */
    startPixelHuntChallenge() {
        console.log('Starting pixel hunt challenge');

        // This would integrate with the ResolutionManager
        const challengeInfo = {
            title: 'Pixel Hunt Training',
            description: 'Test your satellite image interpretation skills!',
            features: [
                '• Interactive satellite image viewer',
                '• Multiple difficulty levels',
                '• Real-time scoring system',
                '• Educational feedback',
                '• Achievement tracking',
                '• Performance analytics'
            ],
            integration: [
                '• ResolutionManager for pixel hunt games',
                '• Real satellite imagery from NASA APIs',
                '• Adaptive difficulty based on performance',
                '• Educational explanations for each answer'
            ]
        };

        // Create interactive pixel hunt demo
        this.showPixelHuntDemo();
    }

    /**
     * Show interactive pixel hunt demo
     */
    showPixelHuntDemo() {
        // Create full-screen pixel hunt interface
        this.ui.educationPanel.innerHTML = `
            <div class="panel-header">
                <h3>Pixel Hunt Training - Live Demo</h3>
                <button class="close-panel-btn" aria-label="Close demo">×</button>
            </div>

            <div class="panel-content">
                <div class="demo-interface">
                    <div class="challenge-instructions">
                        <h4>Interactive Training: Find the Farm Fields!</h4>
                        <p>Look at the satellite images below and identify the farm fields. Each resolution shows different levels of detail.</p>
                        <div class="score-display">
                            <span class="score-label">Score:</span>
                            <span class="score-value" id="hunt-score">0</span>
                            <span class="score-total">/ 100</span>
                        </div>
                    </div>

                    <div class="pixel-hunt-grid">
                        <div class="hunt-scenario" data-resolution="landsat" data-answer="field">
                            <div class="scenario-header">
                                <h5>Landsat (30m) - High Resolution</h5>
                                <p>Can you spot the individual crop fields?</p>
                            </div>
                            <div class="hunt-image">
                                <canvas class="real-satellite-preview" width="300" height="300" data-resolution="landsat" data-lat="33.4484" data-lon="-112.0740"></canvas>
                                <div class="preview-overlay">
                                    <div class="preview-instruction">This is the same Arizona farm region you'll analyze in the Pixel Hunt Challenge!</div>
                                    <div class="preview-tips">
                                        <strong>Landsat Tips:</strong>
                                        <ul>
                                            <li>Look for rectangular field patterns</li>
                                            <li>Green areas indicate healthy crops</li>
                                            <li>Brown areas may be fallow fields</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="hunt-actions">
                                <button class="hunt-marker-btn" data-correct="true" data-type="field">
                                    🌾 Identify Crop Field
                                </button>
                                <button class="hunt-marker-btn" data-correct="false" data-type="wrong">
                                    🏠 Identify Buildings
                                </button>
                            </div>
                            <div class="hunt-feedback" id="landsat-feedback"></div>
                        </div>

                        <div class="hunt-scenario" data-resolution="modis" data-answer="region">
                            <div class="scenario-header">
                                <h5>MODIS (250m) - Medium Resolution</h5>
                                <p>Identify the agricultural regions</p>
                            </div>
                            <div class="hunt-image">
                                <canvas class="real-satellite-preview" width="300" height="300" data-resolution="modis" data-lat="33.4484" data-lon="-112.0740"></canvas>
                                <div class="preview-overlay">
                                    <div class="preview-instruction">MODIS view of the same region - notice how individual fields merge into larger patterns!</div>
                                    <div class="preview-tips">
                                        <strong>MODIS Tips:</strong>
                                        <ul>
                                            <li>Focus on general vegetation patterns</li>
                                            <li>Look for large agricultural zones</li>
                                            <li>NDVI values help identify crop health</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="hunt-actions">
                                <button class="hunt-marker-btn" data-correct="true" data-type="region">
                                    🗺️ Identify Agricultural Region
                                </button>
                                <button class="hunt-marker-btn" data-correct="false" data-type="wrong">
                                    🏔️ Identify Mountains
                                </button>
                            </div>
                            <div class="hunt-feedback" id="modis-feedback"></div>
                        </div>

                        <div class="hunt-scenario" data-resolution="smap" data-answer="moisture">
                            <div class="scenario-header">
                                <h5>SMAP (9km) - Low Resolution</h5>
                                <p>Identify the dry/desert regions</p>
                            </div>
                            <div class="hunt-image">
                                <canvas class="real-satellite-preview" width="300" height="300" data-resolution="smap" data-lat="33.4484" data-lon="-112.0740"></canvas>
                                <div class="preview-overlay">
                                    <div class="preview-instruction">SMAP soil moisture data - perfect for understanding irrigation patterns!</div>
                                    <div class="preview-tips">
                                        <strong>SMAP Tips:</strong>
                                        <ul>
                                            <li>Red areas = dry soil/desert regions</li>
                                            <li>This region shows low soil moisture</li>
                                            <li>Indicates arid/semi-arid conditions</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="hunt-actions">
                                <button class="hunt-marker-btn" data-correct="false" data-type="wrong">
                                    💧 Identify High Soil Moisture
                                </button>
                                <button class="hunt-marker-btn" data-correct="true" data-type="desert">
                                    🏜️ Identify Desert Areas
                                </button>
                            </div>
                            <div class="hunt-feedback" id="smap-feedback"></div>
                        </div>
                    </div>

                    <div class="demo-results">
                        <div class="progress-indicator">
                            <div class="progress-ring">
                                <div class="progress-fill" id="demo-progress" style="width: 0%"></div>
                            </div>
                            <span class="progress-text">0% Complete</span>
                        </div>
                        <div class="results-summary" id="results-summary" style="display: none;">
                            <h4>Training Complete!</h4>
                            <p>You've learned how different satellite resolutions reveal different agricultural information.</p>
                            <div class="key-learnings">
                                <div class="learning-point">
                                    <strong>High Resolution (Landsat):</strong> See individual fields and boundaries
                                </div>
                                <div class="learning-point">
                                    <strong>Medium Resolution (MODIS):</strong> Regional patterns and large-scale monitoring
                                </div>
                                <div class="learning-point">
                                    <strong>Low Resolution (SMAP):</strong> Soil moisture over large areas
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="lesson-navigation">
                        <button class="back-btn">Back to Challenge</button>
                        <div class="demo-controls">
                            <button class="reset-demo-btn">Reset Demo</button>
                            <button class="next-lesson-btn" style="display: none;">Complete Lesson</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize the pixel hunt demo
        this.initializePixelHuntDemo();
    }

    /**
     * Initialize pixel hunt demo interactions
     */
    initializePixelHuntDemo() {
        let score = 0;
        let totalClicks = 0;
        let correctClicks = 0;

        // Add click handlers for markers
        const markers = this.ui.educationPanel.querySelectorAll('[data-correct]');
        markers.forEach(marker => {
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                totalClicks++;

                const isCorrect = marker.dataset.correct === 'true';
                const scenario = marker.closest('.hunt-scenario');
                const resolution = scenario.dataset.resolution;
                const feedbackElement = document.getElementById(`${resolution}-feedback`);

                if (isCorrect) {
                    correctClicks++;
                    score += 10;
                    marker.classList.add('correct-click');
                    feedbackElement.innerHTML = `<span class="correct">Correct! Good identification!</span>`;

                    // Award individual achievement based on resolution
                    this.awardIndividualAchievement(resolution);
                } else {
                    score = Math.max(0, score - 5);
                    marker.classList.add('incorrect-click');
                    feedbackElement.innerHTML = `<span class="incorrect">Not quite right. Try again!</span>`;
                }

                document.getElementById('hunt-score').textContent = score;
                this.updateDemoProgress(correctClicks, totalClicks);
            });
        });

        // Add navigation event listeners
        this.attachDemoEventListeners();

        // Load real satellite data previews
        console.log('📡 About to load satellite previews in demo...');
        setTimeout(() => {
            console.log('📡 Timeout triggered, calling loadSatellitePreviews() in demo');
            this.loadSatellitePreviews();
        }, 500);
    }

    /**
     * Update demo progress
     */
    updateDemoProgress(correct, total) {
        const maxCorrect = 3; // 1 correct answer per scenario (3 scenarios total)
        const progress = Math.min(100, (correct / maxCorrect) * 100);

        document.getElementById('demo-progress').style.width = progress + '%';
        document.querySelector('.progress-text').textContent = Math.round(progress) + '% Complete';

        if (correct >= maxCorrect) {
            setTimeout(() => {
                document.getElementById('results-summary').style.display = 'block';
                document.querySelector('.next-lesson-btn').style.display = 'inline-block';

                // Award Resolution Master achievement
                this.awardPixelHuntAchievements();
            }, 500);
        }
    }

    /**
     * Attach demo event listeners
     */
    attachDemoEventListeners() {
        // Close button
        const closePanelBtn = this.ui.educationPanel.querySelector('.close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                this.goBackToPixelOverview();
            });
        }

        // Back button
        const backBtn = this.ui.educationPanel.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showNextLesson(); // Go back to challenge overview
            });
        }

        // Reset demo button
        const resetBtn = this.ui.educationPanel.querySelector('.reset-demo-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.showPixelHuntDemo(); // Restart the demo
            });
        }

        // Complete lesson button
        const nextLessonBtn = this.ui.educationPanel.querySelector('.next-lesson-btn');
        if (nextLessonBtn) {
            nextLessonBtn.addEventListener('click', () => {
                this.showLessonCompletion();
            });
        }
    }

    /**
     * Show lesson completion and progress to next lesson
     */
    showLessonCompletion() {
        // Show completion screen with achievements and next steps
        this.ui.educationPanel.innerHTML = `
            <div class="panel-header">
                <h3>Lesson Complete!</h3>
                <button class="close-panel-btn" aria-label="Close panel">×</button>
            </div>
            <div class="panel-content lesson-completion">
                <div class="completion-animation">
                    <div class="success-icon"></div>
                    <h2>Training Complete!</h2>
                </div>

                <div class="achievements-earned">
                    <h4>Achievements Unlocked</h4>
                    <div class="achievement-list">
                        <div class="achievement-item">
                            <span class="achievement-icon">🌾</span>
                            <div class="achievement-info">
                                <h5>Field Expert</h5>
                                <p>Successfully identify crop fields in Landsat imagery</p>
                            </div>
                        </div>
                        <div class="achievement-item">
                            <span class="achievement-icon">🗺️</span>
                            <div class="achievement-info">
                                <h5>Regional Analyst</h5>
                                <p>Correctly identify agricultural regions in MODIS data</p>
                            </div>
                        </div>
                        <div class="achievement-item">
                            <span class="achievement-icon">🏜️</span>
                            <div class="achievement-info">
                                <h5>Moisture Detective</h5>
                                <p>Identify dry regions using SMAP soil moisture data</p>
                            </div>
                        </div>
                        <div class="achievement-item">
                            <span class="achievement-icon">🎯</span>
                            <div class="achievement-info">
                                <h5>Resolution Master</h5>
                                <p>Complete all three resolution training steps</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lesson-summary">
                    <h4>What You Learned</h4>
                    <ul class="learning-points">
                        <li>How satellite pixels represent real-world areas on Earth</li>
                        <li>The difference between Landsat (30m), MODIS (250m), and SMAP (9km) resolutions</li>
                        <li>When to use different satellite resolutions for agricultural monitoring</li>
                        <li>How to identify agricultural features in satellite imagery</li>
                    </ul>
                </div>

                <div class="next-steps">
                    <h4>Next Steps</h4>
                    <p>You're now ready to explore advanced satellite data analysis!</p>

                    <div class="completion-actions">
                        <button class="game-start-btn start-game-btn">
                            🎮 Start Pixel Hunt Challenge!
                        </button>
                        <button class="primary-btn continue-learning-btn">
                            Continue to Advanced Lessons
                        </button>
                        <button class="secondary-btn explore-data-btn">
                            Explore Real Satellite Data
                        </button>
                        <button class="secondary-btn return-overview-btn">
                            Return to Overview
                        </button>
                    </div>
                </div>

                <div class="progress-indicator">
                    <div class="progress-text">Pixel Awareness Training: Complete</div>
                    <div class="overall-progress">
                        <span>Overall Progress: </span>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: 25%"></div>
                        </div>
                        <span>25%</span>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for completion actions
        this.attachCompletionEventListeners();

        // Log completion achievement
        console.log('Pixel Awareness Training completed!');

        // Emit completion event for tracking
        if (this.gameEngine && this.gameEngine.getEventSystem) {
            this.gameEngine.getEventSystem().emit('lesson:completed', {
                lessonType: 'pixel_awareness',
                achievements: ['pixel_detective', 'resolution_master', 'agricultural_analyst'],
                completedAt: new Date()
            });
        }
    }

    /**
     * Attach event listeners for lesson completion actions
     */
    attachCompletionEventListeners() {
        // Close panel button
        const closePanelBtn = this.ui.educationPanel.querySelector('.close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                // Switch to data visualization tab
                const dataTab = document.querySelector('.tab[data-tab="data"]');
                if (dataTab) {
                    dataTab.click();
                }
            });
        }

        // Continue Learning button - proceed to next lesson module
        const continueLearningBtn = this.ui.educationPanel.querySelector('.continue-learning-btn');
        if (continueLearningBtn) {
            continueLearningBtn.addEventListener('click', () => {
                this.proceedToNextModule();
            });
        }

        // Explore Real Data button - open data visualization
        const exploreDataBtn = this.ui.educationPanel.querySelector('.explore-data-btn');
        if (exploreDataBtn) {
            exploreDataBtn.addEventListener('click', () => {
                // Switch to data tab and highlight data exploration
                const dataTab = document.querySelector('.tab[data-tab="data"]');
                if (dataTab) {
                    dataTab.click();
                    // Show data exploration guidance
                    setTimeout(() => {
                        this.showDataExplorationGuide();
                    }, 500);
                }
            });
        }

        // Start Game button - go to Pixel Hunt game
        const startGameBtn = this.ui.educationPanel.querySelector('.start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                // Find the pixel hunt tab button (not content)
                const pixelHuntTabBtn = document.querySelector('.tab[data-tab="pixel-hunt"]');
                if (pixelHuntTabBtn) {
                    pixelHuntTabBtn.click();
                } else {
                    console.log('Pixel Hunt tab button not found');
                    // Alternative: try to activate the tab content directly
                    const pixelHuntContent = document.getElementById('pixelHuntTab');
                    if (pixelHuntContent) {
                        // Hide all other tab contents
                        document.querySelectorAll('.tab-content').forEach(tab => {
                            tab.classList.remove('active');
                        });
                        // Show pixel hunt content
                        pixelHuntContent.classList.add('active');
                        // Update tab buttons
                        document.querySelectorAll('.tab').forEach(tab => {
                            tab.classList.remove('active');
                        });
                        const pixelHuntBtn = document.querySelector('.tab[data-tab="pixel-hunt"]');
                        if (pixelHuntBtn) {
                            pixelHuntBtn.classList.add('active');
                        }
                    }
                }
            });
        }

        // Return to Overview button - go back to education overview
        const returnOverviewBtn = this.ui.educationPanel.querySelector('.return-overview-btn');
        if (returnOverviewBtn) {
            returnOverviewBtn.addEventListener('click', () => {
                this.goBackToPixelOverview();
            });
        }
    }

    /**
     * Proceed to next education module
     */
    async proceedToNextModule() {
        try {
            console.log('Proceeding to next education module...');

            // Try to get next lesson from education engine
            const educationEngine = this.gameEngine.getManagers().education;
            if (educationEngine && typeof educationEngine.getNextModule === 'function') {
                const nextModule = await educationEngine.getNextModule('pixel_awareness');
                if (nextModule) {
                    this.showModuleContent(nextModule);
                    return;
                }
            }

            // Fallback: Show next available lesson
            this.showNextAvailableLesson();

        } catch (error) {
            console.error('Failed to proceed to next module:', error);
            this.showNextAvailableLesson();
        }
    }

    /**
     * Show next available lesson or module selection
     */
    showNextAvailableLesson() {
        this.ui.educationPanel.innerHTML = `
            <div class="panel-header">
                <h3>Choose Your Next Learning Path</h3>
                <button class="close-panel-btn" aria-label="Close panel">×</button>
            </div>
            <div class="panel-content next-lessons">
                <div class="intro-text">
                    <p>Great job completing the Pixel Awareness Training! Choose your next learning adventure:</p>
                </div>

                <div class="lesson-modules">
                    <div class="module-card" data-module="temporal_analysis">
                        <div class="module-icon"></div>
                        <h4>Temporal Analysis</h4>
                        <p>Learn how satellite data changes over time to monitor crop growth and seasonal patterns.</p>
                        <div class="module-difficulty">Difficulty: Intermediate</div>
                        <div class="module-duration">Duration: ~15 minutes</div>
                        <button class="start-module-btn" data-module="temporal_analysis">Start Module</button>
                    </div>

                    <div class="module-card" data-module="spectral_analysis">
                        <div class="module-icon"></div>
                        <h4>Spectral Band Analysis</h4>
                        <p>Discover how different spectral bands reveal crop health, water stress, and soil conditions.</p>
                        <div class="module-difficulty">Difficulty: Advanced</div>
                        <div class="module-duration">Duration: ~20 minutes</div>
                        <button class="start-module-btn" data-module="spectral_analysis">Start Module</button>
                    </div>

                    <div class="module-card" data-module="data_integration">
                        <div class="module-icon"></div>
                        <h4>Multi-Source Data Integration</h4>
                        <p>Learn to combine data from multiple satellites for comprehensive agricultural monitoring.</p>
                        <div class="module-difficulty">Difficulty: Advanced</div>
                        <div class="module-duration">Duration: ~25 minutes</div>
                        <button class="start-module-btn" data-module="data_integration">Start Module</button>
                    </div>

                    <div class="module-card" data-module="practical_applications">
                        <div class="module-icon"></div>
                        <h4>Practical Farm Applications</h4>
                        <p>Apply your knowledge to real-world farming scenarios and decision-making processes.</p>
                        <div class="module-difficulty">Difficulty: Intermediate</div>
                        <div class="module-duration">Duration: ~30 minutes</div>
                        <button class="start-module-btn" data-module="practical_applications">Start Module</button>
                    </div>
                </div>

                <div class="navigation-options">
                    <button class="secondary-btn return-overview-btn">Return to Education Overview</button>
                    <button class="secondary-btn explore-tools-btn">Explore Advanced Tools</button>
                </div>
            </div>
        `;

        // Attach event listeners for module selection
        this.attachModuleSelectionListeners();

        // Load real satellite data previews
        console.log('📡 About to load satellite previews...');
        setTimeout(() => {
            console.log('📡 Timeout triggered, calling loadSatellitePreviews()');
            this.loadSatellitePreviews();
        }, 500);
    }

    /**
     * Show data exploration guide for new learners
     */
    showDataExplorationGuide() {
        // Create a temporary overlay guide
        const guide = document.createElement('div');
        guide.className = 'data-exploration-guide';
        guide.innerHTML = `
            <div class="guide-content">
                <h3>Ready to Explore Real Satellite Data!</h3>
                <p>Now that you understand satellite pixels, try these data exploration activities:</p>
                <ul>
                    <li>🗺️ Use the farm canvas to see different resolution views</li>
                    <li>Check the data tablet for real agricultural metrics</li>
                    <li>Try switching between Landsat, MODIS, and SMAP data</li>
                    <li>Look for patterns in vegetation indices and soil moisture</li>
                </ul>
                <button class="got-it-btn">Got it!</button>
            </div>
        `;

        document.body.appendChild(guide);

        // Auto-remove guide after user clicks or 10 seconds
        const gotItBtn = guide.querySelector('.got-it-btn');
        const removeGuide = () => {
            if (guide.parentNode) {
                guide.parentNode.removeChild(guide);
            }
        };

        gotItBtn.addEventListener('click', removeGuide);
        setTimeout(removeGuide, 10000);
    }

    /**
     * Attach event listeners for module selection
     */
    attachModuleSelectionListeners() {
        // Close panel button
        const closePanelBtn = this.ui.educationPanel.querySelector('.close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                const dataTab = document.querySelector('.tab[data-tab="data"]');
                if (dataTab) dataTab.click();
            });
        }

        // Module start buttons
        this.ui.educationPanel.querySelectorAll('.start-module-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.target.dataset.module;
                this.startEducationModule(moduleId);
            });
        });

        // Navigation buttons
        const returnOverviewBtn = this.ui.educationPanel.querySelector('.return-overview-btn');
        if (returnOverviewBtn) {
            returnOverviewBtn.addEventListener('click', () => {
                this.goBackToPixelOverview();
            });
        }

        const exploreToolsBtn = this.ui.educationPanel.querySelector('.explore-tools-btn');
        if (exploreToolsBtn) {
            exploreToolsBtn.addEventListener('click', () => {
                // Show advanced tools dropdown
                const navButton = document.querySelector('.nav-button');
                if (navButton) {
                    navButton.click();
                }
            });
        }
    }

    /**
     * Start a specific education module
     */
    startEducationModule(moduleId) {
        console.log(`🎓 Starting education module: ${moduleId}`);

        // For now, show a placeholder for the requested module
        this.ui.educationPanel.innerHTML = `
            <div class="panel-header">
                <h3>🚧 Module Coming Soon</h3>
                <button class="close-panel-btn" aria-label="Close panel">×</button>
            </div>
            <div class="panel-content module-placeholder">
                <div class="construction-notice">
                    <div class="construction-icon">🚧</div>
                    <h2>${this.getModuleName(moduleId)}</h2>
                    <p>This advanced learning module is currently under development.</p>
                </div>

                <div class="coming-soon-features">
                    <h4>Coming Soon:</h4>
                    <ul>
                        ${this.getModuleFeatures(moduleId).map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>

                <div class="alternative-actions">
                    <h4>In the meantime, try:</h4>
                    <button class="primary-btn explore-data-btn">Explore Real Satellite Data</button>
                    <button class="secondary-btn try-advanced-tools-btn">Try Advanced Visualization Tools</button>
                    <button class="secondary-btn return-overview-btn">Return to Education Overview</button>
                </div>
            </div>
        `;

        // Attach placeholder event listeners
        this.attachPlaceholderListeners();
    }

    /**
     * Get module name for display
     */
    getModuleName(moduleId) {
        const names = {
            'temporal_analysis': 'Temporal Analysis Module',
            'spectral_analysis': 'Spectral Band Analysis Module',
            'data_integration': 'Multi-Source Data Integration Module',
            'practical_applications': 'Practical Farm Applications Module'
        };
        return names[moduleId] || 'Advanced Learning Module';
    }

    /**
     * Get module features for display
     */
    getModuleFeatures(moduleId) {
        const features = {
            'temporal_analysis': [
                'Interactive time-series analysis tools',
                'Crop growth stage identification',
                'Seasonal pattern recognition exercises',
                'Drought and flood impact assessment'
            ],
            'spectral_analysis': [
                'Interactive spectral signature explorer',
                'NDVI and other vegetation indices',
                'Water stress detection techniques',
                'Soil composition analysis methods'
            ],
            'data_integration': [
                'Multi-satellite data fusion techniques',
                'Cross-platform data calibration',
                'Complementary sensor combinations',
                'Integrated decision-making workflows'
            ],
            'practical_applications': [
                'Real farm scenario simulations',
                'Economic impact calculations',
                'Precision agriculture workflows',
                'ROI analysis for satellite data use'
            ]
        };
        return features[moduleId] || ['Advanced interactive lessons', 'Hands-on exercises', 'Real-world applications'];
    }

    /**
     * Attach event listeners for module placeholders
     */
    attachPlaceholderListeners() {
        // Close panel
        const closePanelBtn = this.ui.educationPanel.querySelector('.close-panel-btn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                const dataTab = document.querySelector('.tab[data-tab="data"]');
                if (dataTab) dataTab.click();
            });
        }

        // Explore data button
        const exploreDataBtn = this.ui.educationPanel.querySelector('.explore-data-btn');
        if (exploreDataBtn) {
            exploreDataBtn.addEventListener('click', () => {
                const dataTab = document.querySelector('.tab[data-tab="data"]');
                if (dataTab) {
                    dataTab.click();
                    setTimeout(() => this.showDataExplorationGuide(), 500);
                }
            });
        }

        // Try advanced tools button
        const tryAdvancedBtn = this.ui.educationPanel.querySelector('.try-advanced-tools-btn');
        if (tryAdvancedBtn) {
            tryAdvancedBtn.addEventListener('click', () => {
                const navButton = document.querySelector('.nav-button');
                if (navButton) navButton.click();
            });
        }

        // Return to overview
        const returnOverviewBtn = this.ui.educationPanel.querySelector('.return-overview-btn');
        if (returnOverviewBtn) {
            returnOverviewBtn.addEventListener('click', () => {
                this.goBackToPixelOverview();
            });
        }
    }

    /**
     * Initialize data visualization
     */
    async initializeDataVisualization() {
        console.log('🔄 Initializing data visualization - NEW LAYOUT');

        if (!this.ui.dataDisplay) {
            console.warn('Data display element not found');
            return;
        }

        console.log('Data display element found:', this.ui.dataDisplay);

        // Initialize data visualization with new vertical scroll layout
        this.ui.dataDisplay.innerHTML = `
            <div class="satellite-data-tab">
                <!-- 섹션 1: 상단 영역 -->
                <div class="top-section">
                    <div class="data-controls">
                        <div class="data-controls-header">
                            <h3 class="data-controls-title">Real-Time Satellite Data</h3>
                            <div class="data-controls-buttons">
                                <button id="autoRefreshBtn" class="btn-secondary">
                                    <span class="btn-icon">🔄</span>
                                    <span class="btn-text">Auto Refresh</span>
                                </button>
                                <button id="exportDataBtn" class="btn-primary">
                                    <span class="btn-text">Export</span>
                                </button>
                                <button id="mlPredictBtn" class="btn-primary">
                                    <span class="btn-text">🟢 ML Predict</span>
                                </button>
                                <button id="mlAnomalyBtn" class="btn-secondary">
                                    <span class="btn-text">🔴 Anomaly Check</span>
                                </button>
                            </div>
                        </div>

                        <div class="location-section">
                            <label>Location:</label>
                            <div class="location-inputs">
                                <input type="number" id="latInput" placeholder="Latitude" value="" step="0.0001" style="width: 130px; padding: 7px; font-size: 13px;">
                                <input type="number" id="lonInput" placeholder="Longitude" value="" step="0.0001" style="width: 130px; padding: 7px; font-size: 13px;">
                            </div>
                            <label>Resolution:</label>
                            <select id="resolutionSelect" style="width: 100%; padding: 8px; font-size: 14px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="9000">SMAP 9km - Soil Moisture</option>
                                <option value="250">MODIS 250m - Vegetation</option>
                                <option value="30">Landsat 30m - High Detail</option>
                            </select>
                            <button id="fetchDataBtn" class="btn-primary fetch-data-btn">
                                <span class="btn-text">Fetch Data</span>
                            </button>
                            <div class="status-bar">
                                <span class="status" id="dataStatus">🔴 Ready to fetch data</span>
                                <span class="last-update" id="lastUpdate">Last update: Never</span>
                            </div>
                        </div>

                        <div class="anomaly-section">
                            <div class="section-header" onclick="app.toggleAnomalySection(this)">
                                <span>🔴 Anomaly Detection Results</span>
                                <span class="toggle-icon">▼</span>
                            </div>
                            <div class="section-content" id="anomalyContent">
                                <p style="text-align: center; color: #757575; font-size: 14px; padding: 20px;">
                                    Click "🔴 Anomaly Check" button to run anomaly detection
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="chart-section">
                        <div class="chart-header">
                            <h4>Data Overview</h4>
                            <div class="chart-controls">
                                <select id="chartTypeSelect">
                                    <option value="line">Line Chart</option>
                                    <option value="bar">Bar Chart</option>
                                    <option value="radar">Radar Chart</option>
                                </select>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="dataChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <!-- 섹션 2: 데이터 카드들 -->
                <div class="data-cards-container">
                    <h3>Satellite Data Cards</h3>
                    <div class="data-cards-grid">
                        <div class="data-card enhanced" id="smapCard" data-sensor="smap">
                            <div class="card-header">
                                <h4>SMAP Soil Moisture</h4>
                                <div class="card-badges">
                                    <div class="fusion-badge" title="Enhanced with Multi-Sensor Fusion">🔬 Fusion</div>
                                    <div class="card-status" id="smapStatus">📶</div>
                                </div>
                            </div>
                            <div class="data-content" id="smapContent">
                                <div class="no-data-message">Click "Fetch Data" to load satellite data</div>
                            </div>
                            <div class="mini-chart-container">
                                <canvas id="smapChart" width="200" height="100"></canvas>
                            </div>
                        </div>

                        <div class="data-card enhanced" id="modisCard" data-sensor="modis">
                            <div class="card-header">
                                <h4>MODIS Vegetation</h4>
                                <div class="card-badges">
                                    <div class="fusion-badge" title="Enhanced with Multi-Sensor Fusion">🔬 Fusion</div>
                                    <div class="card-status" id="modisStatus">📶</div>
                                </div>
                            </div>
                            <div class="data-content" id="modisContent">
                                <div class="no-data-message">Click "Fetch Data" to load satellite data</div>
                            </div>
                            <div class="mini-chart-container">
                                <canvas id="modisChart" width="200" height="100"></canvas>
                            </div>
                        </div>

                        <div class="data-card enhanced" id="landsatCard" data-sensor="landsat">
                            <div class="card-header">
                                <h4>Landsat Imagery</h4>
                                <div class="card-badges">
                                    <div class="fusion-badge" title="Enhanced with Multi-Sensor Fusion">🔬 Fusion</div>
                                    <div class="card-status" id="landsatStatus">📶</div>
                                </div>
                            </div>
                            <div class="data-content" id="landsatContent">
                                <div class="no-data-message">Click "Fetch Data" to load satellite data</div>
                            </div>
                            <div class="mini-chart-container">
                                <canvas id="landsatChart" width="200" height="100"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 섹션 3: 히스토리컬 데이터 -->
                <div class="historical-section">
                    <h3>Historical Data Trends</h3>
                    <div class="historical-header">
                        <div class="time-range-selector">
                            <select id="timeRangeSelect">
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 3 months</option>
                            </select>
                        </div>
                    </div>
                    <div class="historical-chart-container">
                        <canvas id="historicalChart" width="800" height="300"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Initialize charts and event listeners
        this.initializeCharts();
        this.setupDataVisualizationEvents();

        // Initialize with sample historical data
        this.initializeHistoricalData();
    }

    /**
     * Initialize all charts for data visualization
     */
    initializeCharts() {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded yet, retrying...');
            // Add timeout to prevent infinite retries
            if (!this.chartRetryCount) this.chartRetryCount = 0;
            this.chartRetryCount++;

            if (this.chartRetryCount > 10) {
                console.error('Chart.js failed to load after 10 retries, skipping charts');
                return;
            }

            setTimeout(() => this.initializeCharts(), 500);
            return;
        }

        console.log('✅ Chart.js is available, initializing charts');

        // Initialize main data chart
        this.initializeMainChart();

        // Initialize mini charts for each data source
        this.initializeMiniCharts();

        // Initialize historical chart
        this.initializeHistoricalChart();
    }

    /**
     * Initialize main data overview chart
     */
    initializeMainChart() {
        const ctx = document.getElementById('dataChart');
        if (!ctx) {
            console.warn('dataChart canvas element not found');
            return;
        }

        try {
            this.mainChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['SMAP Surface', 'SMAP Root Zone', 'MODIS NDVI', 'MODIS EVI', 'Landsat NDVI', 'Landsat Temp'],
                datasets: [{
                    label: 'Current Values',
                    data: [0, 0, 0, 0, 0, 0],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Satellite Data Overview',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
        } catch (error) {
            console.error('❌ Failed to initialize main chart:', error);
        }
    }

    /**
     * Initialize mini charts for each data card
     */
    initializeMiniCharts() {
        try {
            // SMAP mini chart
            const smapCtx = document.getElementById('smapChart');
            if (smapCtx) {
                this.smapMiniChart = new Chart(smapCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Surface Moisture',
                        data: [],
                        borderColor: '#2980b9',
                        backgroundColor: 'rgba(41, 128, 185, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Root Zone Moisture',
                        data: [],
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        }

        // MODIS mini chart
        const modisCtx = document.getElementById('modisChart');
        if (modisCtx) {
            this.modisMiniChart = new Chart(modisCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'NDVI',
                        data: [],
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        }

        // Landsat mini chart
        const landsatCtx = document.getElementById('landsatChart');
        if (landsatCtx) {
            this.landsatMiniChart = new Chart(landsatCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'NDVI',
                        data: [],
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        }
        } catch (error) {
            console.error('❌ Failed to initialize mini charts:', error);
        }
    }

    /**
     * Initialize historical trends chart
     */
    initializeHistoricalChart() {
        const ctx = document.getElementById('historicalChart');
        if (!ctx) return;

        try {
            this.historicalChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'SMAP Surface Moisture',
                    data: [],
                    borderColor: '#2980b9',
                    backgroundColor: 'rgba(41, 128, 185, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }, {
                    label: 'MODIS NDVI',
                    data: [],
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }, {
                    label: 'Landsat NDVI',
                    data: [],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Historical Data Trends',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 1,
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        } catch (error) {
            console.error('❌ Failed to initialize historical chart:', error);
        }
    }

    /**
     * Setup event listeners for data visualization
     */
    setupDataVisualizationEvents() {
        console.log('Setting up data visualization events');

        // Use setTimeout to ensure DOM is fully ready
        setTimeout(() => {
            // Fetch data button
            const fetchDataBtn = document.getElementById('fetchDataBtn');
            console.log('fetchDataBtn element found:', !!fetchDataBtn);

            if (fetchDataBtn) {
                // Remove any existing listeners first
                const newFetchBtn = fetchDataBtn.cloneNode(true);
                fetchDataBtn.parentNode.replaceChild(newFetchBtn, fetchDataBtn);

                newFetchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('🖱️ fetchDataBtn clicked - calling fetchSampleData');
                    try {
                        this.fetchSampleData();
                    } catch (error) {
                        console.error('❌ Error calling fetchSampleData:', error);
                    }
                });
                console.log('fetchDataBtn event listener attached');
            } else {
                console.error('fetchDataBtn element not found');
                // Retry after a short delay
                setTimeout(() => {
                    this.setupDataVisualizationEvents();
                }, 500);
                return;
            }

            // Auto refresh toggle
            const autoRefreshBtn = document.getElementById('autoRefreshBtn');
            if (autoRefreshBtn) {
                autoRefreshBtn.addEventListener('click', () => {
                    this.toggleAutoRefresh();
                });
            }

            // Export data button
            const exportDataBtn = document.getElementById('exportDataBtn');
            if (exportDataBtn) {
                exportDataBtn.addEventListener('click', () => {
                    this.exportData();
                });
            }

            // ML Prediction button
            const mlPredictBtn = document.getElementById('mlPredictBtn');
            if (mlPredictBtn) {
                mlPredictBtn.addEventListener('click', () => {
                    this.runMLPrediction();
                });
            }

            // ML Anomaly Detection button
            const mlAnomalyBtn = document.getElementById('mlAnomalyBtn');
            if (mlAnomalyBtn) {
                mlAnomalyBtn.addEventListener('click', () => {
                    this.runAnomalyDetection();
                });
            }

            // Chart type selector
            const chartTypeSelect = document.getElementById('chartTypeSelect');
            if (chartTypeSelect) {
                chartTypeSelect.addEventListener('change', (e) => {
                    this.changeChartType(e.target.value);
                });
            }

            // Time range selector for historical data
            const timeRangeSelect = document.getElementById('timeRangeSelect');
            if (timeRangeSelect) {
                timeRangeSelect.addEventListener('change', (e) => {
                    this.updateHistoricalData(parseInt(e.target.value));
                });
            }

            // Resolution change listener
            const resolutionSelect = document.getElementById('resolutionSelect');
            if (resolutionSelect) {
                resolutionSelect.addEventListener('change', (e) => {
                    this.handleResolutionChange(e);
                });
            }

        }, 100); // End setTimeout
    }

    /**
     * Initialize historical data with sample data
     */
    initializeHistoricalData() {
        const days = 30;
        const labels = [];
        const smapData = [];
        const modisData = [];
        const landsatData = [];

        // Generate sample historical data
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toISOString().split('T')[0]);

            // Generate realistic sample data with some variation
            smapData.push(0.2 + Math.sin(i * 0.1) * 0.1 + Math.random() * 0.05);
            modisData.push(0.6 + Math.sin(i * 0.15) * 0.2 + Math.random() * 0.1);
            landsatData.push(0.7 + Math.sin(i * 0.12) * 0.15 + Math.random() * 0.08);
        }

        // Update historical chart
        if (this.historicalChart) {
            this.historicalChart.data.labels = labels;
            this.historicalChart.data.datasets[0].data = smapData;
            this.historicalChart.data.datasets[1].data = modisData;
            this.historicalChart.data.datasets[2].data = landsatData;
            this.historicalChart.update();
        }
    }

    /**
     * Start an education module
     */
    async startEducationModule(moduleId) {
        try {
            const educationEngine = this.gameEngine.getManagers().education;
            const result = await educationEngine.startModule(moduleId, {
                experience: 'beginner',
                farmingContext: 'tutorial'
            });

            if (result.status === 'started') {
                this.showEducationModule(result.session, result.firstLesson);
            } else if (result.status === 'prerequisites_required') {
                this.showPrerequisiteMessage(result.missing, result.recommendations);
            }
        } catch (error) {
            console.error('Failed to start education module:', error);
            this.showErrorMessage('Failed to start learning module');
        }
    }

    /**
     * Show education module interface
     */
    showEducationModule(session, firstLesson) {
        const educationPanel = document.getElementById('educationPanel');
        if (!educationPanel) {
            console.warn('Education panel not found');
            return;
        }

        // Check if lesson content already exists to prevent duplicates
        if (document.querySelector('.education-session')) {
            console.log('Education session already exists, not creating duplicate');
            return;
        }

        // Store original content if not already stored
        if (!this.originalEducationContent) {
            this.originalEducationContent = educationPanel.innerHTML;
        }

        // Extract description from lesson content based on lesson structure
        let lessonDescription;
        if (firstLesson.content?.explanation) {
            lessonDescription = firstLesson.content.explanation;
        } else if (firstLesson.description) {
            lessonDescription = firstLesson.description;
        } else {
            // Create module-specific descriptions
            switch (session.id) {
                case 'depth_analysis':
                    lessonDescription = 'Learn about soil moisture at different depths and how SMAP L3 and L4 data help farmers understand water availability.';
                    break;
                case 'satellite_systems':
                    lessonDescription = 'Explore NASA\'s Earth observation satellites and understand how they work together to monitor our planet.';
                    break;
                case 'pixel_awareness':
                default:
                    lessonDescription = 'Learn the fundamentals of satellite imagery and pixel understanding.';
                    break;
            }
        }

        educationPanel.innerHTML = `
            <div class="education-session">
                <div class="panel-header">
                    <h3>📚 ${session.title}</h3>
                    <button class="close-panel-btn" onclick="app.closeEducationModule()">×</button>
                </div>
                <div class="lesson-content">
                    <h4>${firstLesson.title}</h4>
                    <p>${lessonDescription}</p>
                    <div class="lesson-objectives">
                        <h5>Learning Objectives:</h5>
                        <ul>
                            ${(firstLesson.learningObjectives || []).map(obj => `<li>${obj}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="lesson-progress">
                        <div class="progress-bar" style="width: 0%"></div>
                    </div>
                    <button class="start-lesson-btn" onclick="app.startLesson('${firstLesson.id}')">
                        Start Lesson
                    </button>
                </div>
            </div>
        `;
        educationPanel.style.display = 'block';
    }

    /**
     * Show prerequisite message
     */
    showPrerequisiteMessage(missing, recommendations) {
        const educationPanel = document.getElementById('educationPanel');
        if (!educationPanel) {
            console.warn('Education panel not found');
            return;
        }

        // Store original content if not already stored
        if (!this.originalEducationContent) {
            this.originalEducationContent = educationPanel.innerHTML;
        }

        educationPanel.innerHTML = `
            <div class="prerequisite-message">
                <div class="panel-header">
                    <h3>📋 Prerequisites Required</h3>
                    <button class="close-panel-btn" onclick="app.closeEducationModule()">×</button>
                </div>
                <div class="prerequisite-content">
                    <p>Please complete the following modules first:</p>
                    <ul class="missing-prerequisites">
                        ${missing.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                    <div class="recommendations">
                        <h4>Recommended Path:</h4>
                        <ol>
                            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ol>
                    </div>
                    <button class="understand-btn" onclick="app.closeEducationModule()">
                        I Understand
                    </button>
                </div>
            </div>
        `;
        educationPanel.style.display = 'block';
    }

    /**
     * Close education module
     */
    closeEducationModule() {
        const educationPanel = document.getElementById('educationPanel');
        if (educationPanel) {
            // Remove any lesson content or education sessions
            const existingLesson = document.querySelector('.lesson-content');
            const existingSession = document.querySelector('.education-session');

            if (existingLesson) {
                existingLesson.remove();
            }
            if (existingSession) {
                existingSession.remove();
            }

            // Restore original content instead of just hiding
            if (this.originalEducationContent) {
                educationPanel.innerHTML = this.originalEducationContent;
                // Re-attach event listeners for the original content
                this.attachEducationEventListeners();
            }
            educationPanel.style.display = 'block';
        }
    }

    /**
     * Re-attach event listeners to education panel
     */
    attachEducationEventListeners() {
        const educationPanel = document.getElementById('educationPanel');
        if (!educationPanel) return;

        // Add module event listeners
        educationPanel.querySelectorAll('.start-module-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleCard = e.target.closest('.module-card');
                const moduleId = moduleCard.dataset.module;
                this.startEducationModule(moduleId);
            });
        });

        // Update achievements display
        this.updateAchievements();
    }

    /**
     * Start a specific lesson
     */
    async startLesson(lessonId) {
        try {
            const educationEngine = this.gameEngine.getManagers().education;
            const result = await educationEngine.startLesson(lessonId);

            if (result.status === 'started') {
                // Update lesson interface
                this.showLessonContent(result.lesson);
            }
        } catch (error) {
            console.error('Failed to start lesson:', error);
            this.showErrorMessage('Failed to start lesson');
        }
    }

    /**
     * Show lesson content
     */
    showLessonContent(lesson) {
        const educationPanel = document.getElementById('educationPanel');
        if (!educationPanel) return;

        const lessonContent = educationPanel.querySelector('.lesson-content');
        if (lessonContent) {
            // Properly render lesson content based on its structure
            let contentHtml = '';

            if (lesson.content && typeof lesson.content === 'object') {
                // Handle structured content object
                if (lesson.content.explanation) {
                    contentHtml += `<p class="lesson-explanation">${lesson.content.explanation}</p>`;
                }

                if (lesson.content.visualization) {
                    contentHtml += this.createVisualization(lesson.content.visualization, lesson.id);
                }

                if (lesson.content.interactives && lesson.content.interactives.length > 0) {
                    contentHtml += `
                        <div class="lesson-interactives">
                            <h5>Interactive Elements</h5>
                            <ul class="interactives-list">
                                ${lesson.content.interactives.map(interactive =>
                                    `<li>${interactive.replace('_', ' ').toUpperCase()}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    `;
                }

                if (lesson.content.datasets) {
                    contentHtml += `
                        <div class="lesson-datasets">
                            <h5>Datasets Used</h5>
                            <ul class="datasets-list">
                                ${lesson.content.datasets.map(dataset =>
                                    `<li>${dataset.replace('_', ' ').toUpperCase()}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    `;
                }

                if (lesson.content.satellites) {
                    contentHtml += `
                        <div class="lesson-satellites">
                            <h5>Satellites Featured</h5>
                            <ul class="satellites-list">
                                ${lesson.content.satellites.map(satellite =>
                                    `<li>${satellite}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    `;
                }
            } else if (typeof lesson.content === 'string') {
                // Handle simple string content
                contentHtml = `<p class="lesson-explanation">${lesson.content}</p>`;
            } else {
                // Fallback content
                contentHtml = `<p class="lesson-explanation">Interactive lesson content for ${lesson.title}</p>`;
            }

            lessonContent.innerHTML = `
                <h4>${lesson.title}</h4>
                <div class="lesson-body">
                    ${contentHtml}
                </div>
                <div class="lesson-progress">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
                <div class="lesson-controls">
                    ${lesson.hasNext ? `<button class="next-lesson-btn" onclick="app.nextLesson()">Next</button>` : ''}
                    <button class="complete-lesson-btn" onclick="app.completeLesson('${lesson.id}')">Complete</button>
                </div>
            `;

            // Initialize any visualizations that were just added
            setTimeout(() => this.initializeVisualizations(lesson), 100);
        }
    }

    /**
     * Initialize visualizations after they're added to DOM
     */
    initializeVisualizations(lesson) {
        if (lesson.content?.visualization === 'pixel_grid') {
            const gridId = `pixel-grid-${lesson.id}`;
            // Initialize the pixel grid with default values
            this.updatePixelGrid(gridId, 2, 250);
        }
    }

    /**
     * Create visualization based on type
     */
    createVisualization(visualizationType, lessonId) {
        switch (visualizationType) {
            case 'pixel_grid':
                return this.createPixelGridVisualization(lessonId);
            case 'soil_profile_3d':
                return this.createSoilProfileVisualization(lessonId);
            case 'satellite_launch_history':
                return this.createSatelliteTimelineVisualization(lessonId);
            default:
                return `
                    <div class="lesson-visualization">
                        <h5>Interactive Visualization</h5>
                        <div class="visualization-placeholder">
                            <p>${visualizationType.replace('_', ' ').toUpperCase()} visualization would appear here</p>
                        </div>
                    </div>
                `;
        }
    }

    /**
     * Create interactive pixel grid visualization
     */
    createPixelGridVisualization(lessonId) {
        const gridId = `pixel-grid-${lessonId}`;
        const zoomId = `zoom-control-${lessonId}`;
        const sizeId = `size-control-${lessonId}`;

        return `
            <div class="lesson-visualization pixel-grid-container">
                <h5>Interactive Pixel Grid Visualization</h5>

                <div class="visualization-controls">
                    <div class="control-group">
                        <label for="${zoomId}">Zoom Level:</label>
                        <input type="range" id="${zoomId}" min="1" max="4" value="2" step="1"
                               onchange="app.updatePixelGrid('${gridId}', this.value, document.getElementById('${sizeId}').value)">
                        <span id="${zoomId}-value">2x</span>
                    </div>

                    <div class="control-group">
                        <label for="${sizeId}">Pixel Size (m):</label>
                        <select id="${sizeId}" onchange="app.updatePixelGrid('${gridId}', document.getElementById('${zoomId}').value, this.value)">
                            <option value="30">30m (Landsat)</option>
                            <option value="250" selected>250m (MODIS)</option>
                            <option value="500">500m (MODIS)</option>
                            <option value="1000">1km (MODIS)</option>
                            <option value="9000">9km (SMAP)</option>
                        </select>
                    </div>
                </div>

                <div class="grid-comparison">
                    <div class="grid-section">
                        <h6>Satellite View</h6>
                        <div id="${gridId}" class="pixel-grid-canvas"></div>
                        <div class="grid-info">
                            <span class="pixel-count">Grid: <span id="${gridId}-count">16x16</span></span>
                            <span class="coverage-area">Area: <span id="${gridId}-area">4km²</span></span>
                        </div>
                    </div>

                    <div class="resolution-comparison">
                        <h6>Resolution Comparison</h6>
                        <div class="resolution-examples">
                            <div class="resolution-example landsat">
                                <div class="example-grid landsat-grid"></div>
                                <span>Landsat 30m</span>
                            </div>
                            <div class="resolution-example modis">
                                <div class="example-grid modis-grid"></div>
                                <span>MODIS 250m</span>
                            </div>
                            <div class="resolution-example smap">
                                <div class="example-grid smap-grid"></div>
                                <span>SMAP 9km</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="educational-insights">
                    <h6>💡 Key Insights</h6>
                    <ul class="insights-list">
                        <li><strong>Pixel Size:</strong> Larger pixels cover more area but show less detail</li>
                        <li><strong>Trade-off:</strong> Higher resolution = more detail but smaller coverage</li>
                        <li><strong>Application:</strong> Choose resolution based on what you want to monitor</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Create soil profile visualization
     */
    createSoilProfileVisualization(lessonId) {
        const profileId = `soil-profile-${lessonId}`;

        return `
            <div class="lesson-visualization soil-profile-container">
                <h5>3D Soil Profile Visualization</h5>

                <div class="soil-profile-display" id="${profileId}">
                    <div class="soil-layers">
                        <div class="soil-layer surface-layer" data-depth="0-5cm">
                            <div class="layer-content">
                                <span class="layer-label">Surface Layer (0-5cm)</span>
                                <span class="smap-indicator">SMAP L3 measures here</span>
                                <div class="moisture-indicator surface-moisture"></div>
                            </div>
                        </div>

                        <div class="soil-layer root-zone-layer" data-depth="0-100cm">
                            <div class="layer-content">
                                <span class="layer-label">Root Zone (0-100cm)</span>
                                <span class="smap-indicator">SMAP L4 estimates here</span>
                                <div class="moisture-indicator root-moisture"></div>
                            </div>
                        </div>

                        <div class="soil-layer deep-layer" data-depth="100cm+">
                            <div class="layer-content">
                                <span class="layer-label">Deep Soil (100cm+)</span>
                                <span class="description">Groundwater influence</span>
                            </div>
                        </div>
                    </div>

                    <div class="plant-root-system">
                        <div class="plant-above-ground"></div>
                        <div class="root-network"></div>
                    </div>
                </div>

                <div class="moisture-controls">
                    <h6>💧 Moisture Simulation</h6>
                    <button onclick="app.simulateRainfall('${profileId}')" class="simulation-btn">
                        🌧️ Simulate Rainfall
                    </button>
                    <button onclick="app.simulateDrought('${profileId}')" class="simulation-btn">
                        ☀️ Simulate Drought
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create satellite timeline visualization
     */
    createSatelliteTimelineVisualization(lessonId) {
        const timelineId = `satellite-timeline-${lessonId}`;

        return `
            <div class="lesson-visualization timeline-container">
                <h5>NASA Earth Observation Timeline</h5>

                <div class="timeline-display" id="${timelineId}">
                    <div class="timeline-track">
                        <div class="timeline-event" data-year="1972" style="left: 10%;">
                            <div class="event-marker landsat"></div>
                            <div class="event-info">
                                <span class="satellite-name">Landsat 1</span>
                                <span class="launch-year">1972</span>
                            </div>
                        </div>

                        <div class="timeline-event" data-year="1999" style="left: 40%;">
                            <div class="event-marker modis"></div>
                            <div class="event-info">
                                <span class="satellite-name">Terra/MODIS</span>
                                <span class="launch-year">1999</span>
                            </div>
                        </div>

                        <div class="timeline-event" data-year="2014" style="left: 70%;">
                            <div class="event-marker smap"></div>
                            <div class="event-info">
                                <span class="satellite-name">SMAP</span>
                                <span class="launch-year">2015</span>
                            </div>
                        </div>

                        <div class="timeline-event" data-year="2014" style="left: 85%;">
                            <div class="event-marker gpm"></div>
                            <div class="event-info">
                                <span class="satellite-name">GPM</span>
                                <span class="launch-year">2014</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="satellite-details">
                    <div class="satellite-card active" data-satellite="landsat">
                        <h6>Landsat Series</h6>
                        <p>Longest-running Earth observation program</p>
                        <ul>
                            <li>Resolution: 30m</li>
                            <li>Revisit: 16 days</li>
                            <li>Bands: Visible, NIR, SWIR, Thermal</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update pixel grid visualization
     */
    updatePixelGrid(gridId, zoom, pixelSize) {
        const grid = document.getElementById(gridId);
        const zoomValue = document.getElementById(gridId.replace('pixel-grid', 'zoom-control') + '-value');
        const countSpan = document.getElementById(gridId + '-count');
        const areaSpan = document.getElementById(gridId + '-area');

        if (!grid) return;

        // Update zoom display
        if (zoomValue) zoomValue.textContent = zoom + 'x';

        // Calculate grid parameters
        const baseSize = 16;
        const gridSize = Math.floor(baseSize / zoom);
        const totalArea = Math.pow(gridSize * parseInt(pixelSize), 2) / 1000000; // km²

        // Update info displays
        if (countSpan) countSpan.textContent = `${gridSize}x${gridSize}`;
        if (areaSpan) areaSpan.textContent = `${totalArea.toFixed(1)}km²`;

        // Generate grid HTML
        let gridHtml = '';
        for (let i = 0; i < gridSize * gridSize; i++) {
            const hue = Math.random() * 120 + 60; // Green to yellow range
            const saturation = 50 + Math.random() * 30;
            const lightness = 40 + Math.random() * 20;
            gridHtml += `<div class="pixel" style="background: hsl(${hue}, ${saturation}%, ${lightness}%); width: ${100/gridSize}%; height: ${100/gridSize}%;" title="Pixel ${i + 1}: ${pixelSize}m resolution"></div>`;
        }

        grid.innerHTML = gridHtml;
        grid.style.display = 'flex';
        grid.style.flexWrap = 'wrap';
        grid.style.width = '300px';
        grid.style.height = '300px';
        grid.style.border = '2px solid #333';
        grid.style.backgroundColor = '#000';
    }

    /**
     * Simulate rainfall on soil profile
     */
    simulateRainfall(profileId) {
        const profile = document.getElementById(profileId);
        if (!profile) return;

        // Add rainfall animation
        profile.classList.add('rainfall-simulation');

        // Animate moisture levels
        const surfaceMoisture = profile.querySelector('.surface-moisture');
        const rootMoisture = profile.querySelector('.root-moisture');

        if (surfaceMoisture) {
            surfaceMoisture.style.width = '80%';
            surfaceMoisture.style.backgroundColor = '#2196F3';
        }

        setTimeout(() => {
            if (rootMoisture) {
                rootMoisture.style.width = '60%';
                rootMoisture.style.backgroundColor = '#42A5F5';
            }
        }, 1000);

        setTimeout(() => {
            profile.classList.remove('rainfall-simulation');
        }, 3000);
    }

    /**
     * Simulate drought conditions
     */
    simulateDrought(profileId) {
        const profile = document.getElementById(profileId);
        if (!profile) return;

        const surfaceMoisture = profile.querySelector('.surface-moisture');
        const rootMoisture = profile.querySelector('.root-moisture');

        if (surfaceMoisture) {
            surfaceMoisture.style.width = '20%';
            surfaceMoisture.style.backgroundColor = '#FF5722';
        }

        if (rootMoisture) {
            rootMoisture.style.width = '30%';
            rootMoisture.style.backgroundColor = '#FF7043';
        }
    }

    /**
     * Go to next lesson
     */
    async nextLesson() {
        try {
            const educationEngine = this.gameEngine.getManagers().education;
            const result = await educationEngine.getNextLesson();

            if (result && result.lesson) {
                this.showLessonContent(result.lesson);
            } else {
                this.showErrorMessage('No next lesson available');
            }
        } catch (error) {
            console.error('Failed to get next lesson:', error);
            this.showErrorMessage('Failed to load next lesson');
        }
    }

    /**
     * Complete current lesson
     */
    async completeLesson(lessonId) {
        try {
            const educationEngine = this.gameEngine.getManagers().education;
            const result = await educationEngine.completeLesson(lessonId);

            if (result.status === 'completed') {
                // Show completion message
                this.showSuccessMessage('Lesson completed successfully!');

                // Update progress display
                this.updateLearningProgress();

                // Close education module after a short delay
                setTimeout(() => {
                    this.closeEducationModule();
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to complete lesson:', error);
            this.showErrorMessage('Failed to complete lesson');
        }
    }

    /**
     * Update learning progress display
     */
    updateLearningProgress() {
        try {
            const educationEngine = this.gameEngine.getManagers().education;
            const progress = educationEngine.getProgress();

            // Update progress indicators if they exist
            const progressElements = document.querySelectorAll('.learning-progress-bar');
            progressElements.forEach(element => {
                element.style.width = `${progress.overallProgress * 100}%`;
            });

            // Update achievements
            this.updateAchievements();
        } catch (error) {
            console.error('Failed to update learning progress:', error);
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        const statusDisplay = document.getElementById('statusDisplay');
        if (statusDisplay) {
            statusDisplay.innerHTML = `<div class="success-message">${message}</div>`;
            setTimeout(() => {
                statusDisplay.innerHTML = '';
            }, 3000);
        }
    }

    /**
     * Fetch sample satellite data
     */
    async fetchSampleData() {
        console.log('🔍 fetchSampleData called - starting data fetch process');

        const latInput = document.getElementById('latInput');
        const lonInput = document.getElementById('lonInput');
        const resolutionSelect = document.getElementById('resolutionSelect');

        console.log('DOM elements found:', {
            latInput: !!latInput,
            lonInput: !!lonInput,
            resolutionSelect: !!resolutionSelect
        });

        if (!latInput || !lonInput || !resolutionSelect) {
            console.error('Required input elements not found');
            this.showNotification('❌ Error: Input elements not found', 'error');
            return;
        }

        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);
        const resolution = resolutionSelect.value;

        console.log('Input values:', { lat, lon, resolution });

        if (isNaN(lat) || isNaN(lon)) {
            console.error('Invalid coordinates:', { lat, lon });
            this.showErrorMessage('Please enter valid coordinates');
            return;
        }

        // Check for authentication token
        const token = this.getNASAToken();
        console.log('🔑 Token check:', { hasToken: !!token, tokenLength: token?.length });

        if (!token) {
            console.log('⚠️ No token found, showing sample data instead');
            this.showNotification('⚠️ No token found. Showing sample data. Authenticate for real NASA data.', 'info');
            this.showSampleData();
            return;
        }

        try {
            // Show loading state
            this.showDataLoading();
            this.showNotification('Fetching real satellite data...', 'info');

            // Fetch real NASA data with authentication
            const promises = [
                this.fetchSMAPData(lat, lon, token),
                this.fetchMODISData(lat, lon, token),
                this.fetchLandsatData(lat, lon, token)
            ];

            const [smapData, modisData, landsatData] = await Promise.allSettled(promises);

            // Check if any data was successfully fetched
            const hasValidData = smapData.status === 'fulfilled' ||
                                modisData.status === 'fulfilled' ||
                                landsatData.status === 'fulfilled';

            if (hasValidData) {
                // Update display with real data
                this.updateDataCards({
                    smap: smapData.status === 'fulfilled' ? smapData.value : null,
                    modis: modisData.status === 'fulfilled' ? modisData.value : null,
                    landsat: landsatData.status === 'fulfilled' ? landsatData.value : null
                });

                this.showNotification('✅ Real satellite data loaded!', 'success');
            } else {
                console.log('⚠️ All API requests failed, showing sample data');
                this.showNotification('⚠️ API requests failed. Showing sample data.', 'info');
                this.showSampleData();
            }

        } catch (error) {
            console.error('Data fetch failed:', error);
            this.showErrorMessage('Failed to fetch satellite data');

            // Show sample data as fallback
            this.showSampleData();
        }
    }

    /**
     * Fetch real SMAP data from NASA API
     */
    async fetchSMAPData(lat, lon, token) {
        try {
            console.log(`🛰️ Fetching SMAP data for ${lat}, ${lon} with token: ${token.substring(0, 8)}...`);

            // Use proxy server for CORS handling
            const response = await fetch(`http://localhost:3001/api/smap/soil-moisture?lat=${lat}&lon=${lon}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`SMAP API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ SMAP data received:', data);

            return data;
        } catch (error) {
            console.error('SMAP data fetch failed:', error);
            throw error;
        }
    }

    /**
     * Fetch real MODIS data from NASA API
     */
    async fetchMODISData(lat, lon, token) {
        try {
            console.log(`🌿 Fetching MODIS data for ${lat}, ${lon} with token: ${token.substring(0, 8)}...`);

            // Use proxy server for CORS handling
            const response = await fetch(`http://localhost:3001/api/modis/ndvi?lat=${lat}&lon=${lon}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`MODIS API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ MODIS data received:', data);

            return data;
        } catch (error) {
            console.error('MODIS data fetch failed:', error);
            throw error;
        }
    }

    /**
     * Fetch real Landsat data from NASA API
     */
    async fetchLandsatData(lat, lon, token) {
        try {
            console.log(`🛰️ Fetching Landsat data for ${lat}, ${lon} with token: ${token.substring(0, 8)}...`);

            // Use proxy server for CORS handling
            const response = await fetch(`http://localhost:3001/api/landsat/imagery?lat=${lat}&lon=${lon}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Landsat API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Landsat data received:', data);

            return data;
        } catch (error) {
            console.error('Landsat data fetch failed:', error);
            throw error;
        }
    }

    /**
     * Show sample data as fallback
     */
    showSampleData() {
        const sampleData = {
            smap: {
                surface_moisture: 0.25,
                root_zone_moisture: 0.18,
                source: 'Sample Data',
                timestamp: new Date().toISOString(),
                resolution: '9km'
            },
            modis: {
                ndvi: 0.65,
                evi: 0.55,
                source: 'Sample Data',
                timestamp: new Date().toISOString(),
                resolution: '250m'
            },
            landsat: {
                ndvi: 0.72,
                temperature: 22.5,
                source: 'Sample Data',
                timestamp: new Date().toISOString(),
                resolution: '30m'
            }
        };

        this.updateDataCards(sampleData);
        this.showNotification('Showing sample data (authenticate for real data)', 'info');
    }

    /**
     * Toggle auto refresh functionality
     */
    toggleAutoRefresh() {
        const btn = document.getElementById('autoRefreshBtn');
        if (!btn) {
            console.error('Auto refresh button not found');
            return;
        }

        const icon = btn.querySelector('.btn-icon');
        const text = btn.querySelector('.btn-text');

        if (this.autoRefreshInterval) {
            // Stop auto refresh
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            btn.classList.remove('active');
            if (icon) icon.textContent = '🔄';
            if (text) text.textContent = 'Auto Refresh';
            this.showNotification('Auto refresh disabled', 'info');
        } else {
            // Start auto refresh
            this.autoRefreshInterval = setInterval(() => {
                if (this.getNASAToken()) {
                    this.fetchSampleData();
                }
            }, 30000); // Refresh every 30 seconds

            btn.classList.add('active');
            if (icon) icon.textContent = '⏸️';
            if (text) text.textContent = 'Stop Refresh';
            this.showNotification('Auto refresh enabled (30s interval)', 'success');
        }
    }

    /**
     * Export current data to JSON/CSV
     */
    exportData() {
        if (!this.currentData) {
            this.showNotification('No data to export. Fetch data first.', 'error');
            return;
        }

        try {
            // Prepare export data
            const exportData = {
                timestamp: new Date().toISOString(),
                location: {
                    latitude: parseFloat(document.getElementById('latInput').value),
                    longitude: parseFloat(document.getElementById('lonInput').value)
                },
                data: this.currentData,
                metadata: {
                    source: 'NASA Farm Navigators',
                    version: '2.0.0',
                    exported_by: this.isTokenAuthenticated() ? 'Authenticated User' : 'Guest'
                }
            };

            // Create downloadable file
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            // Download file
            const link = document.createElement('a');
            link.href = url;
            link.download = `satellite_data_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Export failed', 'error');
        }
    }

    /**
     * Run ML-powered predictions for soil moisture and crop yield
     */
    async runMLPrediction() {
        try {
            this.showNotification('🟢 Running ML predictions...', 'info');

            const latInput = document.getElementById('latInput');
            const lonInput = document.getElementById('lonInput');

            if (!latInput?.value || !lonInput?.value) {
                this.showNotification('Please enter location coordinates first', 'error');
                return;
            }

            const locationData = {
                lat: parseFloat(latInput.value),
                lon: parseFloat(lonInput.value)
            };

            // Get temporal analysis tools from game engine
            const components = this.gameEngine.getAdvancedComponents();
            const temporalTools = components.temporalAnalysisTools;

            if (!temporalTools) {
                this.showNotification('ML service not available', 'error');
                return;
            }

            // Generate mock historical data for prediction
            const historicalData = this.generateMockHistoricalData();

            // Run soil moisture prediction
            const soilPrediction = await temporalTools.predictSoilMoisture(locationData, historicalData);

            // Mock satellite data for crop yield prediction
            const satelliteData = {
                soilMoisture: 0.3 + Math.random() * 0.4,
                ndvi: 0.5 + Math.random() * 0.4,
                temperature: 20 + Math.random() * 15,
                precipitation: Math.random() * 100
            };

            // Run crop yield prediction (assuming corn)
            const yieldPrediction = await temporalTools.predictCropYield('corn', locationData, satelliteData);

            // Display results
            this.displayMLPredictionResults(soilPrediction, yieldPrediction);
            this.showNotification('🟢 ML predictions completed successfully!', 'success');

        } catch (error) {
            console.error('ML prediction failed:', error);
            this.showNotification('ML prediction failed: ' + error.message, 'error');
        }
    }

    /**
     * Run ML-powered anomaly detection
     */
    async runAnomalyDetection() {
        try {
            this.showNotification('🔴 Running anomaly detection...', 'info');

            // Get temporal analysis tools
            const components = this.gameEngine.getAdvancedComponents();
            const temporalTools = components.temporalAnalysisTools;

            if (!temporalTools) {
                this.showNotification('ML service not available', 'error');
                return;
            }

            // Generate mock time series data for anomaly detection
            const timeSeriesData = this.generateMockTimeSeriesData();

            // Run anomaly detection
            const anomalies = await temporalTools.detectAnomalies(timeSeriesData);

            // Display results
            this.displayAnomalyResults(anomalies);
            this.showNotification(`🔴 Found ${anomalies.anomalies.length} anomalies!`, 'success');

        } catch (error) {
            console.error('Anomaly detection failed:', error);
            this.showNotification('Anomaly detection failed: ' + error.message, 'error');
        }
    }

    /**
     * Generate mock historical data for ML predictions
     */
    generateMockHistoricalData() {
        const data = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // 30 days of history

        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            data.push({
                date: date.toISOString().split('T')[0],
                value: 0.2 + Math.random() * 0.6, // Soil moisture 0.2-0.8
                temperature: 15 + Math.random() * 20, // 15-35°C
                precipitation: Math.random() * 10 // 0-10mm
            });
        }

        return data;
    }

    /**
     * Generate mock time series data for anomaly detection
     */
    generateMockTimeSeriesData() {
        const data = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 60); // 60 days of data

        for (let i = 0; i < 60; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            let value = 0.4 + 0.2 * Math.sin(i * 0.1) + Math.random() * 0.1; // Normal pattern

            // Add some anomalies
            if (i === 15 || i === 35 || i === 50) {
                value += Math.random() > 0.5 ? 0.4 : -0.3; // Random anomalies
            }

            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.max(0, Math.min(1, value))
            });
        }

        return data;
    }

    /**
     * Display ML prediction results in the chart section
     */
    displayMLPredictionResults(soilPrediction, yieldPrediction) {
        const chartContainer = document.querySelector('.chart-section .chart-container');
        if (!chartContainer) return;

        chartContainer.innerHTML = `
            <div class="ml-results-container">
                <h3>🟢 ML Prediction Results</h3>

                <div class="prediction-cards">
                    <div class="prediction-card soil-moisture">
                        <h4>Soil Moisture Forecast</h4>
                        <div class="prediction-summary">
                            <p><strong>Model:</strong> ${soilPrediction.model || 'Statistical Fallback'}</p>
                            <p><strong>Accuracy:</strong> ${(soilPrediction.accuracy * 100).toFixed(0)}%</p>
                            <p><strong>Next 7 days:</strong> ${soilPrediction.predictions?.slice(0, 7).map(p => p.soilMoisture.toFixed(2)).join(', ') || 'Stable conditions'}</p>
                        </div>
                    </div>

                    <div class="prediction-card crop-yield">
                        <h4>Crop Yield Prediction</h4>
                        <div class="prediction-summary">
                            <p><strong>Predicted Yield:</strong> ${yieldPrediction.predictedYield.toFixed(1)} bushels/acre</p>
                            <p><strong>Confidence:</strong> ${(yieldPrediction.confidence * 100).toFixed(0)}%</p>
                            <p><strong>Method:</strong> ${yieldPrediction.method || 'ML-enhanced estimation'}</p>
                        </div>
                    </div>
                </div>

                <div class="ml-info">
                    <p><small>Predictions based on satellite data, weather patterns, and machine learning models.
                    Results are educational and should be validated with ground truth data.</small></p>
                </div>
            </div>
        `;
    }

    /**
     * Toggle anomaly section visibility
     */
    toggleAnomalySection(headerElement) {
        const content = headerElement.nextElementSibling;
        const toggleIcon = headerElement.querySelector('.toggle-icon');

        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            headerElement.classList.remove('collapsed');
            toggleIcon.textContent = '▼';
        } else {
            content.classList.add('collapsed');
            headerElement.classList.add('collapsed');
            toggleIcon.textContent = '▶';
        }
    }

    /**
     * Display anomaly detection results
     */
    displayAnomalyResults(anomalies) {
        const anomalyContent = document.getElementById('anomalyContent');
        if (!anomalyContent) return;

        const anomalyList = anomalies.anomalies.map(a =>
            `<li>Date: ${a.date}, Value: ${a.value.toFixed(3)}, Severity: ${(a.severity * 100).toFixed(0)}% (${a.type})</li>`
        ).join('');

        anomalyContent.innerHTML = `
            <div class="anomaly-summary">
                <div class="summary-stats">
                    <p><strong>Anomalies Found:</strong> ${anomalies.anomalies.length}</p>
                    <p><strong>Detection Method:</strong> ${anomalies.method}</p>
                    <p><strong>Confidence:</strong> ${(anomalies.confidence * 100).toFixed(0)}%</p>
                </div>
            </div>

            ${anomalies.anomalies.length > 0 ? `
                <div class="anomaly-list">
                    <h4>Detected Anomalies:</h4>
                    <ul>
                        ${anomalyList}
                    </ul>
                </div>
            ` : `
                <div class="no-anomalies">
                    <p>✅ No significant anomalies detected in the data.</p>
                    <p>Conditions appear stable and within normal parameters.</p>
                </div>
            `}

            <div class="anomaly-info">
                <p><small>Anomaly detection helps identify unusual patterns that may require farmer attention.
                High severity anomalies should be investigated immediately.</small></p>
            </div>
        `;

        // Automatically expand the section when results are displayed
        const sectionHeader = document.querySelector('.section-header');
        const sectionContent = document.getElementById('anomalyContent');
        if (sectionHeader && sectionContent) {
            sectionContent.classList.remove('collapsed');
            sectionHeader.classList.remove('collapsed');
            sectionHeader.querySelector('.toggle-icon').textContent = '▼';
        }
    }

    /**
     * Change chart type for main chart
     */
    changeChartType(type) {
        if (!this.mainChart) return;

        try {
            // Destroy current chart and create new one with different type
            const data = this.mainChart.data;
            const options = this.mainChart.options;

            this.mainChart.destroy();

            // Adjust options for different chart types
            if (type === 'radar') {
                options.scales = {
                    r: {
                        beginAtZero: true,
                        max: 1
                    }
                };
            } else {
                options.scales = {
                    y: {
                        beginAtZero: true,
                        max: 1
                    }
                };
            }

            // Create new chart
            const ctx = document.getElementById('dataChart');
            this.mainChart = new Chart(ctx, {
                type: type,
                data: data,
                options: options
            });

            this.showNotification(`Chart type changed to ${type}`, 'success');
        } catch (error) {
            console.error('Failed to change chart type:', error);
            this.showNotification('Failed to change chart type', 'error');
        }
    }

    /**
     * Update historical data for different time ranges
     */
    updateHistoricalData(days) {
        if (!this.historicalChart) return;

        const labels = [];
        const smapData = [];
        const modisData = [];
        const landsatData = [];

        // Generate data for the selected time range
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toISOString().split('T')[0]);

            // Generate realistic sample data with seasonal patterns
            const seasonalFactor = Math.sin((365 - i) * 2 * Math.PI / 365);
            smapData.push(Math.max(0, 0.2 + seasonalFactor * 0.1 + Math.random() * 0.05));
            modisData.push(Math.max(0, 0.6 + seasonalFactor * 0.2 + Math.random() * 0.1));
            landsatData.push(Math.max(0, 0.7 + seasonalFactor * 0.15 + Math.random() * 0.08));
        }

        // Update chart
        this.historicalChart.data.labels = labels;
        this.historicalChart.data.datasets[0].data = smapData;
        this.historicalChart.data.datasets[1].data = modisData;
        this.historicalChart.data.datasets[2].data = landsatData;
        this.historicalChart.update();

        this.showNotification(`Historical data updated (${days} days)`, 'success');
    }

    /**
     * Update data display cards
     */
    updateDataCards(data) {
        console.log('updateDataCards called with data:', data);
        // Store current data for export functionality
        this.currentData = data;

        // Update data status
        this.updateDataStatus(data);

        // Update SMAP card
        const smapContent = document.getElementById('smapContent');
        const smapStatus = document.getElementById('smapStatus');
        if (smapContent) {
            if (data.smap) {
                smapContent.innerHTML = `
                    <div class="data-value">Surface: ${data.smap.surface_moisture?.toFixed(3) || 'N/A'}</div>
                    <div class="data-value">Root Zone: ${data.smap.root_zone_moisture?.toFixed(3) || 'N/A'}</div>
                    <div class="data-meta">Source: ${data.smap.source || 'Unknown'}</div>
                    <div class="data-meta">Time: ${new Date(data.smap.timestamp).toLocaleString()}</div>
                    <div class="data-meta">Resolution: ${data.smap.resolution || 'Unknown'}</div>
                `;
                if (smapStatus) smapStatus.textContent = '✅';
            } else {
                smapContent.innerHTML = '<div class="error-message">Failed to load SMAP data</div>';
                if (smapStatus) smapStatus.textContent = '❌';
            }
        }

        // Update MODIS card
        const modisContent = document.getElementById('modisContent');
        const modisStatus = document.getElementById('modisStatus');
        if (modisContent) {
            if (data.modis) {
                modisContent.innerHTML = `
                    <div class="data-value">NDVI: ${data.modis.ndvi?.toFixed(3) || 'N/A'}</div>
                    ${data.modis.evi ? `<div class="data-value">EVI: ${data.modis.evi.toFixed(3)}</div>` : ''}
                    <div class="data-meta">Source: ${data.modis.source || 'Unknown'}</div>
                    <div class="data-meta">Time: ${new Date(data.modis.timestamp).toLocaleString()}</div>
                    <div class="data-meta">Resolution: ${data.modis.resolution || 'Unknown'}</div>
                `;
                if (modisStatus) modisStatus.textContent = '✅';
            } else {
                modisContent.innerHTML = '<div class="error-message">Failed to load MODIS data</div>';
                if (modisStatus) modisStatus.textContent = '❌';
            }
        }

        // Update Landsat card
        const landsatContent = document.getElementById('landsatContent');
        const landsatStatus = document.getElementById('landsatStatus');
        if (landsatContent) {
            if (data.landsat) {
                landsatContent.innerHTML = `
                    <div class="data-value">NDVI: ${data.landsat.ndvi?.toFixed(3) || 'N/A'}</div>
                    ${data.landsat.temperature ? `<div class="data-value">🌡️ Temp: ${data.landsat.temperature.toFixed(1)}°C</div>` : ''}
                    <div class="data-meta">Source: ${data.landsat.source || 'Unknown'}</div>
                    <div class="data-meta">Time: ${new Date(data.landsat.timestamp).toLocaleString()}</div>
                    <div class="data-meta">Resolution: ${data.landsat.resolution || 'Unknown'}</div>
                `;
                if (landsatStatus) landsatStatus.textContent = '✅';
            } else {
                landsatContent.innerHTML = '<div class="error-message">Failed to load Landsat data</div>';
                if (landsatStatus) landsatStatus.textContent = '❌';
            }
        }

        // Update all charts with new data
        this.updateCharts(data);
    }

    /**
     * Update data status indicators
     */
    updateDataStatus(data) {
        const dataStatus = document.getElementById('dataStatus');
        const lastUpdate = document.getElementById('lastUpdate');

        if (dataStatus) {
            const successCount = Object.values(data).filter(d => d !== null).length;
            const totalCount = Object.keys(data).length;

            if (successCount === totalCount) {
                dataStatus.textContent = '🟢 All data loaded successfully';
            } else if (successCount > 0) {
                dataStatus.textContent = '🟡 Partial data loaded';
            } else {
                dataStatus.textContent = '🔴 Data loading failed';
            }
        }

        if (lastUpdate) {
            lastUpdate.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
        }
    }

    /**
     * Update all charts with new data
     */
    updateCharts(data) {
        // Update main chart
        if (this.mainChart && data) {
            const chartData = [
                data.smap?.surface_moisture || 0,
                data.smap?.root_zone_moisture || 0,
                data.modis?.ndvi || 0,
                data.modis?.evi || 0,
                data.landsat?.ndvi || 0,
                data.landsat?.temperature ? data.landsat.temperature / 50 : 0 // Normalize temperature
            ];

            this.mainChart.data.datasets[0].data = chartData;
            this.mainChart.update('active');
        }

        // Update mini charts with sample time series data
        this.updateMiniCharts(data);
    }

    /**
     * Update mini charts with time series data
     */
    updateMiniCharts(data) {
        const now = new Date();
        const timeLabels = [];
        for (let i = 9; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60000); // Last 10 minutes
            timeLabels.push(time.toLocaleTimeString());
        }

        // Update SMAP mini chart
        if (this.smapMiniChart && data.smap) {
            // Add some historical variation to current values
            const surfaceData = [];
            const rootZoneData = [];
            const baseValues = {
                surface: data.smap.surface_moisture,
                rootZone: data.smap.root_zone_moisture
            };

            for (let i = 0; i < 10; i++) {
                surfaceData.push(baseValues.surface + (Math.random() - 0.5) * 0.02);
                rootZoneData.push(baseValues.rootZone + (Math.random() - 0.5) * 0.015);
            }

            this.smapMiniChart.data.labels = timeLabels;
            this.smapMiniChart.data.datasets[0].data = surfaceData;
            this.smapMiniChart.data.datasets[1].data = rootZoneData;
            this.smapMiniChart.update('none');
        }

        // Update MODIS mini chart
        if (this.modisMiniChart && data.modis) {
            const ndviData = [];
            const baseNDVI = data.modis.ndvi;

            for (let i = 0; i < 10; i++) {
                ndviData.push(baseNDVI + (Math.random() - 0.5) * 0.05);
            }

            this.modisMiniChart.data.labels = timeLabels;
            this.modisMiniChart.data.datasets[0].data = ndviData;
            this.modisMiniChart.update('none');
        }

        // Update Landsat mini chart
        if (this.landsatMiniChart && data.landsat) {
            const ndviData = [];
            const baseNDVI = data.landsat.ndvi;

            for (let i = 0; i < 10; i++) {
                ndviData.push(baseNDVI + (Math.random() - 0.5) * 0.03);
            }

            this.landsatMiniChart.data.labels = timeLabels;
            this.landsatMiniChart.data.datasets[0].data = ndviData;
            this.landsatMiniChart.update('none');
        }
    }

    /**
     * Handle authentication button click
     */
    async handleAuthClick() {
        try {
            if (this.isTokenAuthenticated()) {
                // User is authenticated - show logout/token management
                this.showTokenManagementModal();
            } else {
                // User is not authenticated - open NASA Earthdata and show token modal
                this.openNASAEarthdataLogin();
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showErrorMessage('Authentication failed');
        }
    }

    /**
     * Open NASA Earthdata login in new tab and show token modal
     */
    openNASAEarthdataLogin() {
        // Open NASA Earthdata login in new tab
        window.open('https://urs.earthdata.nasa.gov/', '_blank');

        // Show token input modal
        setTimeout(() => {
            this.showTokenManagementModal();
        }, 1000);
    }

    /**
     * Show token management modal
     */
    showTokenManagementModal() {
        const modal = document.getElementById('tokenModal');
        if (!modal) {
            console.error('Token modal not found');
            return;
        }

        // Update modal content with current token status
        this.updateTokenModalStatus();

        // Show modal
        modal.style.display = 'flex';

        // Set up modal event listeners if not already set
        if (!this.tokenModalListenersSet) {
            this.setupTokenModalListeners();
            this.tokenModalListenersSet = true;
        }
    }

    /**
     * Setup token modal event listeners
     */
    setupTokenModalListeners() {
        // Close modal button
        const closeTokenModal = document.getElementById('closeTokenModal');
        if (closeTokenModal) {
            closeTokenModal.addEventListener('click', () => {
                const tokenModal = document.getElementById('tokenModal');
                if (tokenModal) tokenModal.style.display = 'none';
            });
        } else {
            console.log('⚠️ closeTokenModal button not found');
        }

        // Click outside to close
        const tokenModal = document.getElementById('tokenModal');
        if (tokenModal) {
            tokenModal.addEventListener('click', (e) => {
                if (e.target.id === 'tokenModal') {
                    tokenModal.style.display = 'none';
                }
            });
        } else {
            console.log('⚠️ tokenModal not found');
        }

        // Toggle token visibility
        const toggleTokenVisibility = document.getElementById('toggleTokenVisibility');
        if (toggleTokenVisibility) {
            toggleTokenVisibility.addEventListener('click', () => {
                const tokenInput = document.getElementById('tokenInput');
                const toggleBtn = document.getElementById('toggleTokenVisibility');

                if (tokenInput && toggleBtn) {
                    if (tokenInput.type === 'password') {
                        tokenInput.type = 'text';
                        toggleBtn.textContent = '🙈';
                        toggleBtn.title = 'Hide token';
                    } else {
                        tokenInput.type = 'password';
                        toggleBtn.textContent = '👁️';
                        toggleBtn.title = 'Show token';
                    }
                }
            });
        } else {
            console.log('⚠️ toggleTokenVisibility button not found');
        }

        // Save token button
        const saveTokenBtn = document.getElementById('saveToken');
        if (saveTokenBtn) {
            saveTokenBtn.addEventListener('click', () => {
                this.saveNASAToken();
            });
        } else {
            console.log('⚠️ saveToken button not found');
        }

        // Clear token button
        const clearTokenBtn = document.getElementById('clearToken');
        if (clearTokenBtn) {
            clearTokenBtn.addEventListener('click', () => {
                this.clearNASAToken();
            });
        } else {
            console.log('⚠️ clearToken button not found');
        }

        // Test connection button
        document.getElementById('testConnection').addEventListener('click', () => {
            this.testNASAConnection();
        });

        // Auto-save on Enter key
        document.getElementById('tokenInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveNASAToken();
            }
        });
    }

    /**
     * Save NASA token to local storage
     */
    saveNASAToken() {
        const tokenInput = document.getElementById('tokenInput');
        const token = tokenInput.value.trim();

        if (!token) {
            this.showNotification('Please enter a valid token', 'error');
            return;
        }

        try {
            // Save token to local storage
            localStorage.setItem('nasa_earthdata_token', token);

            // Update UI
            this.updateAuthenticationStatus();
            this.updateTokenModalStatus();

            // Show success message
            this.showNotification('Token saved successfully!', 'success');

            // Clear input for security
            tokenInput.value = '';

            console.log('NASA Earthdata token saved');
        } catch (error) {
            console.error('Failed to save token:', error);
            this.showNotification('Failed to save token', 'error');
        }
    }

    /**
     * Clear NASA token from local storage
     */
    clearNASAToken() {
        try {
            localStorage.removeItem('nasa_earthdata_token');

            // Update UI
            this.updateAuthenticationStatus();
            this.updateTokenModalStatus();

            // Clear input
            document.getElementById('tokenInput').value = '';

            // Show success message
            this.showNotification('🗑️ Token cleared', 'success');

            console.log('NASA Earthdata token cleared');
        } catch (error) {
            console.error('Failed to clear token:', error);
            this.showNotification('Failed to clear token', 'error');
        }
    }

    /**
     * Test NASA connection
     */
    async testNASAConnection() {
        const token = this.getNASAToken();

        if (!token) {
            this.showNotification('⚠️ No token found. Please save a token first.', 'error');
            return;
        }

        try {
            this.showNotification('🧪 Testing connection...', 'info');

            // Test connection with a simple API call
            const response = await fetch('https://cmr.earthdata.nasa.gov/search/collections', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.showNotification('Connection successful!', 'success');
            } else {
                this.showNotification('Connection failed. Please check your token.', 'error');
            }
        } catch (error) {
            console.error('Connection test failed:', error);
            this.showNotification('Connection test failed', 'error');
        }
    }

    /**
     * Get NASA token from local storage
     */
    getNASAToken() {
        const token = localStorage.getItem('nasa_earthdata_token');
        console.log('getNASAToken called:', {
            hasToken: !!token,
            tokenLength: token?.length,
            tokenPreview: token ? `${token.substring(0, 8)}...${token.substring(token.length - 4)}` : 'null'
        });
        return token;
    }

    /**
     * Check if user is token authenticated
     */
    isTokenAuthenticated() {
        const token = this.getNASAToken();
        return token && token.length > 0;
    }

    /**
     * Update token modal status display
     */
    updateTokenModalStatus() {
        const token = this.getNASAToken();
        const statusIndicator = document.querySelector('#currentTokenDisplay .token-status-indicator');
        const statusText = document.querySelector('#currentTokenDisplay .token-status-text');

        if (token) {
            statusIndicator.textContent = '🟢';
            statusText.textContent = `Token stored (${token.substring(0, 8)}...${token.substring(token.length - 4)})`;
        } else {
            statusIndicator.textContent = '🔴';
            statusText.textContent = 'No token stored';
        }
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 3000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Update authentication status in UI
     */
    updateAuthenticationStatus(isAuthenticated = null, userInfo = null) {
        // Check token authentication if not explicitly provided
        if (isAuthenticated === null) {
            isAuthenticated = this.isTokenAuthenticated();
        }

        if (this.ui.authButton) {
            if (isAuthenticated) {
                this.ui.authButton.textContent = 'Manage Token';
                this.ui.authButton.className = 'auth-button authenticated';
            } else {
                this.ui.authButton.textContent = 'Login to NASA Earthdata';
                this.ui.authButton.className = 'auth-button';
            }
        }

        // Update header token status
        const tokenStatus = document.getElementById('tokenStatus');
        if (tokenStatus) {
            const indicator = tokenStatus.querySelector('.status-indicator');
            const text = tokenStatus.querySelector('.status-text');

            if (isAuthenticated) {
                indicator.textContent = '🟢';
                text.textContent = 'Token active';
            } else {
                indicator.textContent = '🔴';
                text.textContent = 'No token';
            }
        }
    }

    /**
     * Handle resolution change
     */
    handleResolutionChange(event) {
        const resolution = parseInt(event.target.value);
        const resolutionManager = this.gameEngine.getManagers().resolution;
        resolutionManager.setCurrentResolution(resolution);

        // Update game state
        const gameState = this.gameEngine.getGameState();
        gameState.currentResolution = resolution;

        this.showInfoMessage(`Resolution changed to ${resolution}m`);
    }

    /**
     * Handle online status change
     */
    handleOnlineStatusChange() {
        this.isOnline = navigator.onLine;
        this.updateConnectionStatus();

        if (this.isOnline) {
            this.showInfoMessage('Connection restored');
            // Trigger sync if needed
            this.gameEngine.syncOfflineChanges();
        } else {
            this.showInfoMessage('Working offline');
        }
    }

    /**
     * Set up navigation to advanced components
     */
    setupAdvancedNavigation() {
        const navItems = [
            { id: 'navAICopilot', component: 'aiCopilot', title: 'AI Farm Navigator' },
            { id: 'navFarmGlobe3D', component: 'farmGlobe3D', title: '3D Farm Globe' },
            { id: 'navMultiResolution', component: 'multiResolutionVisualizer', title: 'Multi-Resolution Visualizer' },
            { id: 'navRealTimeComparison', component: 'realTimeComparison', title: 'Real-Time Comparison' },
            { id: 'navROICalculator', component: 'roiCalculator', title: 'ROI Calculator' },
            { id: 'navClimateRisk', component: 'climateRisk', title: 'Climate Risk Assessment' },
            { id: 'navSatelliteOrbit', component: 'satelliteOrbitVisualization', title: 'Satellite Orbit Visualization' },
            { id: 'navMissionTimeline', component: 'satelliteMissionTimeline', title: 'Mission Timeline & Data Planner' },
            { id: 'navTemporalAnalysis', component: 'temporalAnalysisTools', title: 'Temporal Analysis Tools' },
            { id: 'navTutorial', component: 'interactiveTutorial', title: 'Interactive Tutorial' },
            { id: 'navDemoScenarios', component: 'demoScenarios', title: 'Demo Scenarios' }
        ];

        navItems.forEach(item => {
            const element = document.getElementById(item.id);
            if (element) {
                element.addEventListener('click', () => {
                    this.showAdvancedComponent(item.component, item.title);
                });
            }
        });

        // Add close/back button handler
        this.setupBackNavigation();
    }

    /**
     * Show an advanced component
     */
    async showAdvancedComponent(componentName, title) {
        try {
            const advancedContainer = document.getElementById('advancedComponentsContainer');
            const tabContent = document.getElementById('tabContent');

            // Hide tab content and show advanced container
            if (tabContent) {
                tabContent.style.display = 'none';
            }
            if (advancedContainer) {
                advancedContainer.style.display = 'block';
            }

            // Clear previous content
            advancedContainer.innerHTML = `
                <div class="advanced-component-header">
                    <button class="back-button" id="backToMain">← Back to Main</button>
                    <h2>${title}</h2>
                    <div class="component-info">Advanced NASA Farm Navigators Feature</div>
                </div>
                <div class="component-content" id="componentContent">
                    <div class="loading-component">
                        <div class="loading-spinner"></div>
                        <p>Loading ${title}...</p>
                    </div>
                </div>
            `;

            // Set up back button
            document.getElementById('backToMain').addEventListener('click', () => {
                this.showDefaultLayout();
            });

            // Get the component instance and render it
            const components = this.gameEngine.getAdvancedComponents();
            const component = components[componentName];

            if (component && typeof component.createInterface === 'function') {
                const contentContainer = document.getElementById('componentContent');
                await component.createInterface(contentContainer);

                // Make component globally accessible for interface interactions
                window[componentName] = component;
            } else if (component && typeof component.createAnalysisInterface === 'function') {
                // Handle temporal analysis tools which use createAnalysisInterface
                const contentContainer = document.getElementById('componentContent');
                await component.createAnalysisInterface(contentContainer);
                window[componentName] = component;
            } else if (component && typeof component.createDemoInterface === 'function') {
                // Handle demo scenarios which use createDemoInterface
                const contentContainer = document.getElementById('componentContent');
                await component.createDemoInterface(contentContainer);
                window[componentName] = component;
            } else if (componentName === 'roiCalculator') {
                // Handle ROI Calculator
                const contentContainer = document.getElementById('componentContent');
                if (typeof ROICalculatorUI !== 'undefined') {
                    const roiCalculatorUI = new ROICalculatorUI(window.roiCalculator);
                    await roiCalculatorUI.renderCalculator(contentContainer);
                    window.roiCalculatorUI = roiCalculatorUI;

                    // Create global function to show ROI Calculator with farm data
                    window.showROICalculator = (farm) => {
                        // First navigate to ROI Calculator tab
                        this.showAdvancedComponent('roiCalculator', 'ROI Calculator').then(() => {
                            // Pre-populate form with farm data
                            this.populateROICalculatorWithFarmData(farm);
                        });
                    };
                } else {
                    throw new Error('ROI Calculator not loaded');
                }
            } else if (componentName === 'climateRisk') {
                // Handle Climate Risk Assessment
                const contentContainer = document.getElementById('componentContent');
                if (typeof ClimateRiskUI !== 'undefined') {
                    const climateRiskUI = new ClimateRiskUI();
                    await climateRiskUI.renderInterface(contentContainer);
                    window.climateRiskUI = climateRiskUI;
                } else {
                    throw new Error('Climate Risk Assessment not loaded');
                }
            } else if (componentName === 'aiCopilot') {
                // Handle AI Copilot
                const contentContainer = document.getElementById('componentContent');
                if (typeof AICopilotUI !== 'undefined') {
                    const aiCopilot = new AICopilotUI('componentContent');
                    window.aiCopilot = aiCopilot;
                } else {
                    throw new Error('AI Copilot not loaded');
                }
            } else if (componentName === 'farmGlobe3D') {
                // Handle 3D Farm Globe
                const contentContainer = document.getElementById('componentContent');
                if (typeof FarmGlobe3D !== 'undefined') {
                    // Create a container div for the 3D globe
                    const globeContainer = document.createElement('div');
                    globeContainer.id = 'farm-globe-container-advanced';
                    globeContainer.style.width = '100%';
                    globeContainer.style.height = '600px';
                    contentContainer.innerHTML = '';
                    contentContainer.appendChild(globeContainer);

                    // Initialize the 3D Farm Globe
                    const farmGlobe = new FarmGlobe3D('farm-globe-container-advanced');
                    await farmGlobe.initialize();
                    window.farmGlobe3D = farmGlobe;
                } else {
                    throw new Error('3D Farm Globe not loaded');
                }
            } else {
                throw new Error(`Component ${componentName} not available or doesn't have a supported interface method`);
            }

            this.showInfoMessage(`Opened ${title}`);
        } catch (error) {
            console.error(`Failed to load ${componentName}:`, error);
            this.showErrorMessage(`Failed to load ${title}: ${error.message}`);
            this.showDefaultLayout();
        }
    }

    /**
     * Show default layout
     */
    showDefaultLayout() {
        const advancedContainer = document.getElementById('advancedComponentsContainer');
        const tabContent = document.getElementById('tabContent');

        if (advancedContainer) {
            advancedContainer.style.display = 'none';
        }
        if (tabContent) {
            tabContent.style.display = 'block';
        }
    }

    /**
     * Populate ROI Calculator with farm data from Farm Globe
     */
    populateROICalculatorWithFarmData(farm) {
        setTimeout(() => {
            // Map farm data to ROI Calculator fields
            const farmAcres = document.getElementById('farmAcres');
            const currentYield = document.getElementById('currentYield');
            const inputCosts = document.getElementById('inputCosts');
            const location = document.getElementById('location');
            const cropType = document.getElementById('cropType');

            if (farmAcres) {
                farmAcres.value = farm.acres || 100;
            }
            if (currentYield) {
                // Estimate yield based on NDVI and soil quality
                const estimatedYield = Math.round(150 * (farm.ndvi || 0.7) * (farm.soilQuality || 80) / 80);
                currentYield.value = estimatedYield;
            }
            if (inputCosts) {
                // Base input costs on farm size and type
                const baseCost = farm.acres > 300 ? 400 : 450;
                inputCosts.value = baseCost;
            }
            if (location) {
                location.value = 'default';
            }
            if (cropType) {
                // Map crop type from farm data
                const cropMapping = {
                    'corn': 'corn',
                    'corn/soybean': 'corn',
                    'corn/soybean rotation': 'corn',
                    'soybeans': 'soybeans',
                    'wheat': 'wheat',
                    'organic vegetables': 'vegetables',
                    'vegetables': 'vegetables',
                    'cotton': 'cotton',
                    'rice': 'rice'
                };
                const mappedCrop = cropMapping[farm.cropType?.toLowerCase()] || 'corn';
                cropType.value = mappedCrop;
            }

            // Set NASA data checkboxes (all enabled by default with farm data)
            const smapCheckbox = document.getElementById('useSMAP');
            const modisCheckbox = document.getElementById('useMODIS');
            const gpmCheckbox = document.getElementById('useGPM');
            const ecostressCheckbox = document.getElementById('useECOSTRESS');
            const powerCheckbox = document.getElementById('usePOWER');

            if (smapCheckbox) smapCheckbox.checked = true;
            if (modisCheckbox) modisCheckbox.checked = true;
            if (gpmCheckbox) gpmCheckbox.checked = true;
            if (ecostressCheckbox) ecostressCheckbox.checked = true;
            if (powerCheckbox) powerCheckbox.checked = true;

            // Auto-calculate ROI after populating
            if (window.roiCalculatorUI) {
                setTimeout(() => {
                    window.roiCalculatorUI.calculateROI();
                }, 500);
            }

            // Show a toast notification
            this.showInfoMessage(`📊 ROI Calculator loaded with ${farm.name} data`);
        }, 300); // Give time for UI to render
    }

    /**
     * Setup back navigation from advanced components
     */
    setupBackNavigation() {
        // Add keyboard shortcut for going back (Escape key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const advancedContainer = document.getElementById('advancedComponentsContainer');
                if (advancedContainer.style.display !== 'none') {
                    this.showDefaultLayout();
                }
            }
        });
    }

    /**
     * Update authentication UI
     */
    updateAuthUI(isAuthenticated, userInfo) {
        if (this.ui.authButton) {
            if (isAuthenticated) {
                this.ui.authButton.textContent = `Logout (${userInfo?.first_name || 'User'})`;
                this.ui.authButton.className = 'auth-button authenticated';
            } else {
                this.ui.authButton.textContent = 'Login to NASA Earthdata';
                this.ui.authButton.className = 'auth-button';
            }
        }
    }

    /**
     * Update connection status display
     */
    updateConnectionStatus() {
        if (this.ui.statusDisplay) {
            this.ui.statusDisplay.innerHTML = `
                <div class="status-item">
                    <span class="status-label">Connection:</span>
                    <span class="status-value ${this.isOnline ? 'online' : 'offline'}">
                        ${this.isOnline ? '🟢 Online' : '🔴 Offline'}
                    </span>
                </div>
                <div class="status-item">
                    <span class="status-label">Cache:</span>
                    <span class="status-value">
                        ${this.gameEngine ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                </div>
            `;
        }
    }

    /**
     * Update achievements display
     */
    updateAchievements() {
        const achievementList = document.getElementById('achievementList');
        if (!achievementList) return;

        const educationEngine = this.gameEngine.getManagers().education;
        const achievements = educationEngine.getUnlockedAchievements();

        if (achievements.length === 0) {
            achievementList.innerHTML = '<p>No achievements unlocked yet</p>';
        } else {
            achievementList.innerHTML = achievements.map(achievement => `
                <div class="achievement-item">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            `).join('');
        }
    }

    /**
     * Run integration tests
     */
    async runTests() {
        console.log('🧪 Running integration tests...');
        const testSuite = new IntegrationTestSuite();
        const results = await testSuite.runAllTests();

        if (results.failed === 0) {
            this.showInfoMessage('All tests passed! 🎉');
        } else {
            this.showErrorMessage(`${results.failed} tests failed`);
        }
    }

    /**
     * Get debug mode from URL or localStorage
     */
    getDebugMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('debug') || localStorage.getItem('debug_mode') === 'true';
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        if (this.ui.loadingScreen) {
            this.ui.loadingScreen.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        if (this.ui.loadingScreen) {
            this.ui.loadingScreen.style.display = 'none';
        }
    }

    /**
     * Show main application
     */
    showMainApp() {
        if (this.ui.mainContainer) {
            this.ui.mainContainer.style.display = 'block';
        }
    }

    /**
     * Show error screen
     */
    showErrorScreen(error) {
        // Only show error screen if body exists
        if (!document.body) {
            console.error('Critical error: document.body not available');
            return;
        }

        document.body.innerHTML = `
            <div class="error-screen">
                <h1>Application Error</h1>
                <p>NASA Farm Navigators failed to initialize:</p>
                <pre>${error.message}</pre>
                <button onclick="location.reload()">Reload Application</button>
            </div>
        `;
    }

    /**
     * Show notification methods
     */
    showInfoMessage(message) {
        this.showNotification(message, 'info');
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showAchievementNotification(achievement) {
        this.showNotification(`🏆 Achievement Unlocked: ${achievement.title}`, 'achievement');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showDataLoading() {
        // Update status bar to show loading
        const dataStatus = document.getElementById('dataStatus');
        if (dataStatus) {
            dataStatus.textContent = '🔄 Loading satellite data...';
        }

        // Update data cards if they exist
        const cards = ['smapContent', 'modisContent', 'landsatContent'];
        cards.forEach(cardId => {
            const element = document.getElementById(cardId);
            if (element) {
                element.innerHTML = '<div class="loading">Loading...</div>';
            }
        });
    }


    /**
     * Initialize resolution explorer
     */
    initializeResolutionExplorer() {
        const resolutionRange = document.getElementById('resolutionRange');
        if (resolutionRange) {
            resolutionRange.addEventListener('input', (e) => {
                this.updateResolutionDisplay(e.target.value);
            });
            // Initialize with default value
            this.updateResolutionDisplay(resolutionRange.value);
        }
    }

    /**
     * Update resolution display
     */
    updateResolutionDisplay(value) {
        const resolutions = ['30m (Landsat)', '250m (MODIS)', '500m (MODIS)', '9km (SMAP)'];
        const currentResolution = document.getElementById('currentResolution');
        if (currentResolution) {
            currentResolution.textContent = resolutions[value] || resolutions[2];
        }

        // Update resolution grid visualization
        this.updateResolutionGrid(parseInt(value));
    }

    /**
     * Update resolution grid
     */
    updateResolutionGrid(resolutionIndex) {
        const grid = document.getElementById('resolutionGrid');
        if (!grid) return;

        const gridSizes = [16, 8, 4, 2]; // Grid size for each resolution
        const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];
        const gridSize = gridSizes[resolutionIndex] || 8;
        const color = colors[resolutionIndex] || '#2196F3';

        let gridHTML = '';
        for (let i = 0; i < gridSize * gridSize; i++) {
            gridHTML += `<div class="grid-pixel" style="background-color: ${color}; opacity: ${0.5 + Math.random() * 0.5};"></div>`;
        }

        grid.innerHTML = gridHTML;
        grid.style.display = 'grid';
        grid.style.gridTemplate = `repeat(${gridSize}, 1fr) / repeat(${gridSize}, 1fr)`;
        grid.style.width = '300px';
        grid.style.height = '300px';
        grid.style.gap = '1px';
        grid.style.backgroundColor = '#333';
        grid.style.border = '2px solid #666';
        grid.style.margin = '20px auto';
    }

    /**
     * Initialize advanced tools
     */
    initializeAdvancedTools() {
        // Advanced tools are already rendered, just ensure they're interactive
        console.log('Advanced tools panel initialized');
    }

    /**
     * Launch advanced tool
     */
    async launchAdvancedTool(toolId) {
        try {
            console.log(`Launching advanced tool: ${toolId}`);

            const managers = this.gameEngine.getManagers();
            const advancedComponents = this.gameEngine.getAdvancedComponents();

            const toolContainer = document.getElementById('advancedComponentsContainer');
            if (!toolContainer) return;

            switch (toolId) {
                case 'aiCopilot':
                    // Switch to the AI Copilot tab
                    this.switchTab('ai-copilot');
                    break;
                case 'farmGlobe3D':
                    // Switch to the 3D Farm Globe tab
                    this.switchTab('farm-globe-3d');
                    break;
                case 'multiResolution':
                    if (advancedComponents.multiResolutionVisualizer) {
                        await advancedComponents.multiResolutionVisualizer.createInterface(toolContainer);
                    }
                    break;
                case 'realTimeComparison':
                    if (advancedComponents.realTimeComparison) {
                        await advancedComponents.realTimeComparison.createInterface(toolContainer);
                    }
                    break;
                case 'satelliteOrbit':
                    if (advancedComponents.satelliteOrbitVisualization) {
                        await advancedComponents.satelliteOrbitVisualization.createInterface(toolContainer);
                    }
                    break;
                case 'missionTimeline':
                    if (advancedComponents.satelliteMissionTimeline) {
                        await advancedComponents.satelliteMissionTimeline.createInterface(toolContainer);
                    }
                    break;
                case 'temporalAnalysis':
                    if (advancedComponents.temporalAnalysisTools) {
                        await advancedComponents.temporalAnalysisTools.createAnalysisInterface(toolContainer);
                    }
                    break;
                case 'demoScenarios':
                    if (advancedComponents.demoScenarios) {
                        await advancedComponents.demoScenarios.createDemoInterface(toolContainer);
                    }
                    break;
            }
        } catch (error) {
            console.error(`Failed to launch ${toolId}:`, error);
        }
    }

    /**
     * Initialize farm game when tab is activated (using dynamic imports)
     */
    async initializeFarmGame() {
        try {
            if (!this.farmSimulation) {
                const { FarmSimulationEngine } = await import('./game/FarmSimulationEngine.js');
                this.farmSimulation = new FarmSimulationEngine();
            }
            const farmGameContainer = document.getElementById('farmGameContainer');
            if (!this.farmGameUI && farmGameContainer) {
                const { FarmGameUI } = await import('./game/FarmGameUI.js');
                this.farmGameUI = new FarmGameUI(this.farmSimulation, farmGameContainer);
                // Make farmGameUI globally accessible
                window.farmGameUI = this.farmGameUI;

                // Register Farm Game with GameEngine for location integration
                if (this.gameEngine && this.gameEngine.setFarmGame) {
                    this.gameEngine.setFarmGame(this.farmGameUI);
                    console.log('🚜 Farm Game registered with GameEngine during initialization');
                }
            }
        } catch (error) {
            console.error('Failed to initialize farm game:', error);
            const farmGameContainer = document.getElementById('farmGameContainer');
            if (farmGameContainer) {
                farmGameContainer.innerHTML = '<div class="error-message">Farm game failed to load. Please refresh the page.</div>';
            }
        }
    }

    /**
     * Initialize AI Copilot when tab is activated
     */
    async initializeAICopilot() {
        try {
            const aiCopilotContainer = document.getElementById('ai-copilot-interface');

            if (!aiCopilotContainer) {
                console.error('AI Copilot container not found');
                return;
            }

            // Check if already initialized
            if (this.aiCopilotUI) {
                console.log('🤖 AI Copilot already initialized');
                return;
            }

            // Initialize AI Copilot UI
            if (typeof AICopilotUI !== 'undefined') {
                this.aiCopilotUI = new AICopilotUI('ai-copilot-interface');
                console.log('🤖 AI Copilot initialized successfully');

                // Make globally accessible
                window.aiCopilotUI = this.aiCopilotUI;
            } else {
                console.error('AICopilotUI class not available');
                aiCopilotContainer.innerHTML = `
                    <div class="error-message">
                        <h3>AI Copilot Unavailable</h3>
                        <p>The AI Copilot component failed to load. Please refresh the page.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to initialize AI Copilot:', error);
            const aiCopilotContainer = document.getElementById('ai-copilot-interface');
            if (aiCopilotContainer) {
                aiCopilotContainer.innerHTML = '<div class="error-message">AI Copilot failed to load. Please refresh the page.</div>';
            }
        }
    }

    /**
     * Initialize 3D Farm Globe when tab is activated
     */
    async initializeFarmGlobe3D() {
        try {
            const farmGlobeContainer = document.getElementById('farm-globe-container');

            if (!farmGlobeContainer) {
                console.error('Farm globe container not found');
                return;
            }

            // Check if CesiumJS is available
            if (typeof Cesium === 'undefined') {
                console.log('Loading CesiumJS library...');
                const cesiumScript = document.createElement('script');
                cesiumScript.src = 'https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Cesium.js';

                return new Promise((resolve, reject) => {
                    cesiumScript.onload = async () => {
                        console.log('CesiumJS loaded successfully');
                        await this.createFarmGlobe3D(farmGlobeContainer);
                        resolve();
                    };
                    cesiumScript.onerror = () => {
                        console.error('Failed to load CesiumJS');
                        farmGlobeContainer.innerHTML = `
                            <div class="error-message">
                                <h3>3D Globe Unavailable</h3>
                                <p>Unable to load the 3D globe viewer. Please check your internet connection.</p>
                            </div>
                        `;
                        reject(new Error('CesiumJS loading failed'));
                    };
                    document.head.appendChild(cesiumScript);
                });
            } else {
                // CesiumJS already loaded
                await this.createFarmGlobe3D(farmGlobeContainer);
            }
        } catch (error) {
            console.error('Failed to initialize 3D Farm Globe:', error);
            const farmGlobeContainer = document.getElementById('farm-globe-container');
            if (farmGlobeContainer) {
                farmGlobeContainer.innerHTML = '<div class="error-message">3D Farm Globe failed to load. Please refresh the page.</div>';
            }
        }
    }

    /**
     * Create and initialize the 3D Farm Globe
     */
    async createFarmGlobe3D(container) {
        try {
            // Check if global instance exists first to prevent duplicates
            if (window.farmGlobe3D && window.farmGlobe3D.isInitialized) {
                this.farmGlobe3D = window.farmGlobe3D;
                console.log('🔄 Using existing FarmGlobe3D instance');
            } else if (!this.farmGlobe3D && typeof FarmGlobe3D !== 'undefined') {
                this.farmGlobe3D = new FarmGlobe3D('farm-globe-container');
                await this.farmGlobe3D.initialize();
                window.farmGlobe3D = this.farmGlobe3D;
                console.log('🌍 3D Farm Globe initialized successfully');
            } else if (!this.farmGlobe3D) {
                console.error('FarmGlobe3D class not available');
                container.innerHTML = `
                    <div class="error-message">
                        <h3>3D Globe Component Missing</h3>
                        <p>The 3D Globe component is not loaded. Please refresh the page.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error creating 3D Farm Globe:', error);
            container.innerHTML = `
                <div class="error-message">
                    <h3>3D Globe Error</h3>
                    <p>An error occurred while initializing the 3D globe: ${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Load real satellite data previews for training section
     */
    async loadSatellitePreviews() {
        console.log('🛰️ Loading satellite previews...');
        const previews = document.querySelectorAll('.real-satellite-preview');
        console.log(`Found ${previews.length} preview canvases`);

        for (const canvas of previews) {
            const resolution = canvas.dataset.resolution;
            const lat = canvas.dataset.lat;
            const lon = canvas.dataset.lon;

            try {
                // Use the same API endpoint as Pixel Hunt Challenge
                const response = await fetch(`http://localhost:3001/api/pixel-hunt/data?lat=${lat}&lon=${lon}&resolution=${resolution}`);
                const data = await response.json();

                if (data.pixels && data.pixels.length > 0) {
                    this.renderSatellitePreview(canvas, data.pixels, resolution);
                } else {
                    this.renderPreviewPlaceholder(canvas, resolution);
                }
            } catch (error) {
                console.error(`Failed to load ${resolution} preview:`, error);
                this.renderPreviewPlaceholder(canvas, resolution);
            }
        }
    }

    /**
     * Render satellite data on preview canvas
     */
    renderSatellitePreview(canvas, pixels, resolution) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Calculate grid size based on resolution
        const gridSize = Math.sqrt(pixels.length);
        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;

        // Render pixels
        for (let i = 0; i < pixels.length; i++) {
            const pixel = pixels[i];
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;

            const x = col * cellWidth;
            const y = row * cellHeight;

            // Color based on data type and values
            let color = this.getPixelColor(pixel, resolution);

            ctx.fillStyle = color;
            ctx.fillRect(x, y, cellWidth, cellHeight);
        }

        // Add resolution label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${resolution.toUpperCase()} Data`, 10, 25);
    }

    /**
     * Get pixel color based on resolution and data values
     */
    getPixelColor(pixel, resolution) {
        switch (resolution) {
            case 'landsat':
                // Use NDVI for vegetation mapping
                const ndvi = pixel.ndvi || 0;
                if (ndvi > 0.6) return '#228B22'; // Dark green - healthy crops
                if (ndvi > 0.3) return '#32CD32'; // Light green - moderate vegetation
                if (ndvi > 0.1) return '#90EE90'; // Very light green - sparse vegetation
                return '#8B4513'; // Brown - bare soil

            case 'modis':
                // Use NDVI with broader categories
                const modisNdvi = pixel.ndvi || 0;
                if (modisNdvi > 0.5) return '#006400'; // Dark green
                if (modisNdvi > 0.2) return '#228B22'; // Medium green
                return '#DEB887'; // Tan - non-vegetated

            case 'smap':
                // Use soil moisture data
                const moisture = pixel.soilMoisture || pixel.surface_moisture || 0;
                if (moisture > 0.4) return '#0000FF'; // Blue - high moisture
                if (moisture > 0.25) return '#4169E1'; // Royal blue - medium moisture
                if (moisture > 0.15) return '#87CEEB'; // Sky blue - low moisture
                return '#FF4500'; // Red-orange - very dry

            default:
                return '#808080'; // Gray fallback
        }
    }

    /**
     * Render placeholder when data loading fails
     */
    renderPreviewPlaceholder(canvas, resolution) {
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw placeholder text
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${resolution.toUpperCase()} Preview`, canvas.width/2, canvas.height/2 - 10);
        ctx.fillText('Loading...', canvas.width/2, canvas.height/2 + 10);
    }

    /**
     * Award individual achievements based on resolution training completion
     */
    awardIndividualAchievement(resolution) {
        console.log(`🏆 Awarding individual achievement for ${resolution}`);
        const achievementKey = `pixelHunt_${resolution}`;

        // Check if already awarded
        if (this.hasAchievement(achievementKey)) {
            console.log(`🏆 Achievement ${achievementKey} already awarded`);
            return;
        }

        let achievementData = {};
        switch (resolution) {
            case 'landsat':
                achievementData = {
                    name: 'Field Expert',
                    description: 'Successfully identify crop fields in Landsat imagery',
                    icon: '🌾',
                    points: 25
                };
                break;
            case 'modis':
                achievementData = {
                    name: 'Regional Analyst',
                    description: 'Correctly identify agricultural regions in MODIS data',
                    icon: '🗺️',
                    points: 25
                };
                break;
            case 'smap':
                achievementData = {
                    name: 'Moisture Detective',
                    description: 'Identify dry regions using SMAP soil moisture data',
                    icon: '🏜️',
                    points: 25
                };
                break;
        }

        this.unlockAchievement(achievementKey, achievementData);
    }

    /**
     * Award completion achievement for finishing all pixel hunt training
     */
    awardPixelHuntAchievements() {
        const masterKey = 'pixelHunt_master';

        if (this.hasAchievement(masterKey)) return;

        const achievementData = {
            name: 'Resolution Master',
            description: 'Complete all three resolution training steps',
            icon: '🎯',
            points: 100
        };

        this.unlockAchievement(masterKey, achievementData);
    }

    /**
     * Check if user has specific achievement
     */
    hasAchievement(achievementKey) {
        const achievements = JSON.parse(localStorage.getItem('pixelHuntAchievements') || '{}');
        return achievements[achievementKey] !== undefined;
    }

    /**
     * Clear all achievements for testing
     */
    clearAchievements() {
        console.log('🧹 Clearing all achievements for testing');
        localStorage.removeItem('pixelHuntAchievements');
        console.log('✅ Achievements cleared from localStorage');

        // Also refresh Farm Game UI if available
        if (window.farmGameUI && typeof window.farmGameUI.refreshAchievements === 'function') {
            console.log('🎮 Refreshing Farm Game UI achievements');
            window.farmGameUI.refreshAchievements();
        }
    }

    /**
     * Unlock achievement and show notification
     */
    unlockAchievement(achievementKey, achievementData) {
        console.log(`🏆 Unlocking achievement: ${achievementKey}`, achievementData);

        // Save to localStorage
        const achievements = JSON.parse(localStorage.getItem('pixelHuntAchievements') || '{}');
        achievements[achievementKey] = {
            ...achievementData,
            unlockedAt: new Date().toISOString()
        };
        localStorage.setItem('pixelHuntAchievements', JSON.stringify(achievements));
        console.log(`💾 Saved achievements to localStorage:`, achievements);

        // Show notification
        console.log(`🔔 Showing achievement notification for: ${achievementData.name}`);
        this.showAchievementNotification(achievementData);

        // Update farm game achievements if available
        this.updateFarmGameAchievements(achievementKey, achievementData);
    }

    /**
     * Show achievement notification
     */
    showAchievementNotification(achievement) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <h4>🏆 Achievement Unlocked!</h4>
                    <h5>${achievement.name}</h5>
                    <p>${achievement.description}</p>
                    <span class="points">+${achievement.points} points</span>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Update farm game achievements if the farm game UI is available
     */
    updateFarmGameAchievements(achievementKey, achievementData) {
        console.log(`🎮 Updating farm game achievements for: ${achievementKey}`);

        // Check if farm game UI exists and update it
        if (window.farmGameUI && typeof window.farmGameUI.awardCustomAchievement === 'function') {
            console.log(`🎮 Farm Game UI found, calling awardCustomAchievement`);
            window.farmGameUI.awardCustomAchievement(achievementKey, achievementData);
        } else {
            console.log(`🎮 Farm Game UI not available:`, {
                farmGameUIExists: !!window.farmGameUI,
                methodExists: window.farmGameUI ? typeof window.farmGameUI.awardCustomAchievement : 'N/A'
            });
        }
    }

    /**
     * Display pixel hunt achievements in main app achievements tab
     */
    displayPixelHuntAchievements() {
        console.log('🏆 Displaying pixel hunt achievements in main app');
        const achievementList = document.getElementById('achievementList');

        if (!achievementList) {
            console.log('🏆 Achievement list element not found');
            return;
        }

        // Get achievements from localStorage
        const pixelHuntData = JSON.parse(localStorage.getItem('pixelHuntAchievements') || '{}');
        console.log('🏆 Pixel hunt data from localStorage:', pixelHuntData);

        // Define achievement templates (same as Farm Game UI)
        const achievementTemplates = {
            'pixelHunt_landsat': {
                name: 'Field Expert',
                description: 'Successfully identify crop fields in Landsat imagery',
                icon: '🌾'
            },
            'pixelHunt_modis': {
                name: 'Regional Analyst',
                description: 'Master agricultural region identification in MODIS data',
                icon: '🗺️'
            },
            'pixelHunt_smap': {
                name: 'Moisture Detective',
                description: 'Identify dry desert regions using SMAP moisture data',
                icon: '💧'
            },
            'pixelHunt_master': {
                name: 'Resolution Master',
                description: 'Complete all three resolution training steps',
                icon: '🎯'
            }
        };

        let achievementHTML = '<h3>🏆 Pixel Hunt Training Achievements</h3>';
        let hasAchievements = false;

        // Process each achievement
        Object.keys(achievementTemplates).forEach(key => {
            const template = achievementTemplates[key];
            const achievementData = pixelHuntData[key];
            const isUnlocked = achievementData !== undefined;

            hasAchievements = hasAchievements || isUnlocked;

            achievementHTML += `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${template.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${template.name}</div>
                        <div class="achievement-description">${template.description}</div>
                        ${isUnlocked ? `<div class="achievement-date">Unlocked: ${new Date(achievementData.unlockedAt).toLocaleDateString()}</div>` : '<div class="achievement-status">Not yet unlocked</div>'}
                    </div>
                </div>
            `;
        });

        if (!hasAchievements) {
            achievementHTML += '<p>No achievements unlocked yet. Complete pixel hunt training scenarios to earn achievements!</p>';
        }

        achievementList.innerHTML = achievementHTML;
        console.log('🏆 Achievement display updated');
    }

    /**
     * Display NASA Achievement System in main app achievements tab
     */
    displayNASAAchievements() {
        console.log('🏆 Displaying NASA achievements in main app');

        // Check if achievement system and UI are available
        if (!window.achievementSystem || !window.achievementUI) {
            console.log('⚠️ NASA Achievement System not available yet');

            // Show loading message
            const tabContent = document.querySelector('[data-tab="achievements"].tab-content');
            if (tabContent) {
                tabContent.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <h3>🛰️ Loading NASA Achievement System...</h3>
                        <p style="color: #8E96AA; margin-top: 20px;">Please wait while the achievement system initializes...</p>
                    </div>
                `;
            }

            // Retry after a delay
            setTimeout(() => this.displayNASAAchievements(), 1000);
            return;
        }

        // Get the achievements tab content area
        const tabContent = document.querySelector('[data-tab="achievements"].tab-content');
        if (!tabContent) {
            console.error('Achievement tab content not found');
            return;
        }

        // Get player level
        const playerLevel = window.achievementSystem.getPlayerLevel();
        const totalPoints = window.achievementSystem.getTotalPoints();

        // Get all achievements
        const achievements = window.achievementSystem.getAllAchievements();

        // Build the achievements display
        let achievementHTML = `
            <div class="achievements-panel" style="padding: 20px;">
                <h2>🏆 NASA Farm Navigator Achievements</h2>

                <div class="player-info" style="background: linear-gradient(135deg, #2c3e50, #667eea); color: white; padding: 20px; border-radius: 15px; margin: 20px 0;">
                    <h3>Level ${playerLevel.level}: ${playerLevel.title}</h3>
                    <p>Total Points: ${totalPoints.toLocaleString()}</p>
                </div>

                <div class="achievements-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
        `;

        // Add each achievement
        achievements.forEach(achievement => {
            const progress = window.achievementSystem.getAchievementProgress(achievement.id);
            const isCompleted = achievement.currentLevel === achievement.levels.length;
            const progressPercent = progress.completed ? 100 :
                (progress.progress / progress.maxProgress) * 100;

            achievementHTML += `
                <div class="achievement-card" style="
                    background: ${isCompleted ? 'linear-gradient(135deg, #2E96F5, #0960E1)' : '#1a252f'};
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    border: 2px solid ${isCompleted ? '#EAFE07' : 'rgba(234, 254, 7, 0.3)'};
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <span style="font-size: 32px; margin-right: 15px;">${achievement.icon}</span>
                        <div>
                            <h4 style="margin: 0; color: #EAFE07;">${achievement.name}</h4>
                            <p style="margin: 5px 0; font-size: 14px; opacity: 0.9;">${achievement.description}</p>
                        </div>
                    </div>

                    <div class="progress-section">
                        <div style="background: rgba(0,0,0,0.3); border-radius: 10px; height: 8px; overflow: hidden; margin: 10px 0;">
                            <div style="background: #EAFE07; height: 100%; width: ${progressPercent}%; transition: width 0.5s ease;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px;">
                            <span>Level ${achievement.currentLevel}/${achievement.levels.length}</span>
                            <span>${progress.completed ? 'MASTERED!' : `${progress.totalProgress}/${progress.nextRequirement || 'Max'}`}</span>
                        </div>
                    </div>

                    ${isCompleted ? '<div style="position: absolute; top: 10px; right: 10px; background: #EAFE07; color: #07173F; padding: 5px 10px; border-radius: 5px; font-weight: bold; font-size: 12px;">MASTERED</div>' : ''}
                </div>
            `;
        });

        achievementHTML += `
                </div>

                <div style="margin-top: 30px; padding: 20px; background: rgba(46, 150, 245, 0.1); border-radius: 10px; border: 1px solid #2E96F5;">
                    <h4 style="color: #2E96F5; margin-bottom: 10px;">🎯 Quick Stats</h4>
                    <p>Keep using NASA satellite data in your farming decisions to unlock more achievements!</p>
                    <ul style="list-style: none; padding: 0;">
                        <li>💧 Water crops to progress in Water Wizard</li>
                        <li>🌱 Plant crops to advance Seed Master</li>
                        <li>🛰️ Use satellite data to level up Satellite Sage</li>
                        <li>🌾 Harvest crops to become a Harvest Hero</li>
                    </ul>
                </div>
            </div>
        `;

        tabContent.innerHTML = achievementHTML;
        console.log('🏆 NASA Achievement display updated');
    }

    /**
     * Enhance satellite data cards with fusion capabilities
     */
    enhanceSatelliteCards() {
        // Add fusion badge styles
        const style = document.createElement('style');
        style.id = 'fusion-card-styles';
        style.textContent = `
            .card-badges {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .fusion-badge {
                background: linear-gradient(90deg, #667eea, #764ba2);
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                animation: fusionPulse 2s infinite;
            }

            .fusion-badge:hover {
                transform: scale(1.05);
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
            }

            @keyframes fusionPulse {
                0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
                100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
            }

            .data-card.fusion-enhanced {
                border: 2px solid transparent;
                background: linear-gradient(white, white) padding-box,
                           linear-gradient(45deg, #667eea, #764ba2) border-box;
                transition: all 0.3s ease;
            }

            .data-card.fusion-enhanced:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
            }

            .fusion-tooltip {
                position: absolute;
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 1000;
                top: -40px;
                left: 50%;
                transform: translateX(-50%);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s;
            }

            .fusion-tooltip:after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: #333 transparent transparent transparent;
            }

            .fusion-badge:hover .fusion-tooltip {
                opacity: 1;
            }

            .fusion-insight-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                z-index: 2000;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }

            .fusion-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1999;
            }
        `;

        if (!document.getElementById('fusion-card-styles')) {
            document.head.appendChild(style);
        }

        // Enhance cards with click handlers
        const cards = document.querySelectorAll('.data-card[data-sensor]');
        cards.forEach(card => {
            // Add fusion enhanced class
            card.classList.add('fusion-enhanced');

            // Add click handler to fusion badge
            const fusionBadge = card.querySelector('.fusion-badge');
            if (fusionBadge) {
                fusionBadge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showFusionInsights(card.dataset.sensor);
                });

                // Add tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'fusion-tooltip';
                tooltip.textContent = 'Click to see fusion analysis';
                fusionBadge.appendChild(tooltip);
            }

            // Add card click handler
            card.addEventListener('click', () => {
                this.showSensorDetails(card.dataset.sensor);
            });
        });

        console.log('🔬 Satellite cards enhanced with fusion capabilities');
    }

    /**
     * Show fusion insights for a specific sensor
     */
    async showFusionInsights(sensorType) {
        if (!window.sensorFusionDashboard || !window.sensorFusionDashboard.fusionData) {
            this.showMessage('Sensor fusion data not available. Please navigate to Sensor Fusion Analysis first.', 'warning');
            return;
        }

        const fusionData = window.sensorFusionDashboard.fusionData;
        let insights = {};

        switch(sensorType) {
            case 'smap':
                insights = {
                    title: '🛰️ SMAP Fusion Insights',
                    data: fusionData.rawData.smap,
                    metrics: [
                        { label: 'Soil Moisture', value: `${fusionData.rawData.smap.soilMoisture.toFixed(3)} m³/m³` },
                        { label: 'Quality Flag', value: fusionData.rawData.smap.qualityFlag },
                        { label: 'Vegetation Water Content', value: `${fusionData.rawData.smap.vegetationWaterContent.toFixed(2)} kg/m²` },
                        { label: 'Water Stress Index', value: `${fusionData.waterStressIndex.toFixed(0)}/100` }
                    ],
                    edgeCases: fusionData.rawData.smap.edgeCases || []
                };
                break;

            case 'modis':
                insights = {
                    title: '🌍 MODIS Fusion Insights',
                    data: fusionData.rawData.modis,
                    metrics: [
                        { label: 'NDVI', value: fusionData.rawData.modis.ndvi.toFixed(3) },
                        { label: 'EVI', value: fusionData.rawData.modis.evi.toFixed(3) },
                        { label: 'Land Surface Temperature', value: `${fusionData.rawData.modis.landSurfaceTemp.toFixed(1)} K` },
                        { label: 'Vegetation Stress Index', value: `${fusionData.vegetationStressIndex.toFixed(0)}/100` }
                    ],
                    anomalies: fusionData.rawData.modis.anomalies || []
                };
                break;

            case 'landsat':
                insights = {
                    title: '🛰️ Landsat Integration',
                    data: { note: 'Landsat data is integrated through high-resolution analysis' },
                    metrics: [
                        { label: 'Farm Health Score', value: `${fusionData.farmHealthScore.toFixed(0)}/100` },
                        { label: 'Overall Confidence', value: `${(fusionData.confidence * 100).toFixed(0)}%` },
                        { label: 'Data Quality', value: fusionData.confidence > 0.8 ? 'Excellent' : 'Good' }
                    ],
                    features: [
                        'High-resolution field analysis',
                        'SWIR band water content detection',
                        'Within-field variation mapping'
                    ]
                };
                break;
        }

        this.showFusionPopup(insights);
    }

    /**
     * Show sensor details (existing functionality)
     */
    showSensorDetails(sensorType) {
        console.log(`📊 Showing details for ${sensorType} sensor`);
        // Could expand this to show detailed sensor information
    }

    /**
     * Show fusion insights popup
     */
    showFusionPopup(insights) {
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'fusion-backdrop';

        // Create popup
        const popup = document.createElement('div');
        popup.className = 'fusion-insight-popup';

        popup.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #333;">${insights.title}</h3>
                <button onclick="this.parentElement.parentElement.parentElement.remove(); document.querySelector('.fusion-backdrop').remove();"
                        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">×</button>
            </div>

            ${insights.metrics ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #667eea; margin: 0 0 10px 0;">Key Metrics:</h4>
                    <div style="display: grid; gap: 8px;">
                        ${insights.metrics.map(metric => `
                            <div style="display: flex; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 5px;">
                                <span style="color: #666;">${metric.label}:</span>
                                <strong style="color: #333;">${metric.value}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${insights.edgeCases && insights.edgeCases.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #ff9800; margin: 0 0 10px 0;">Edge Cases Detected:</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${insights.edgeCases.map(edgeCase => `
                            <div style="padding: 8px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 3px;">
                                <strong>${edgeCase.replace('_', ' ').toUpperCase()}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${insights.anomalies && insights.anomalies.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #f44336; margin: 0 0 10px 0;">Anomalies Detected:</h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${insights.anomalies.map(anomaly => `
                            <div style="padding: 8px; background: #ffebee; border-left: 4px solid #f44336; border-radius: 3px;">
                                <strong>${anomaly.replace('_', ' ').toUpperCase()}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${insights.features ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #4caf50; margin: 0 0 10px 0;">Advanced Features:</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${insights.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div style="text-align: center; margin-top: 20px;">
                <button onclick="document.getElementById('navSensorFusion').click(); this.parentElement.parentElement.parentElement.remove(); document.querySelector('.fusion-backdrop').remove();"
                        style="background: linear-gradient(90deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-weight: 600;">
                    View Full Fusion Dashboard
                </button>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(backdrop);
        document.body.appendChild(popup);

        // Close on backdrop click
        backdrop.addEventListener('click', () => {
            popup.remove();
            backdrop.remove();
        });
    }

    /**
     * Show simple message
     */
    showMessage(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#4caf50'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        alertDiv.textContent = message;

        document.body.appendChild(alertDiv);

        setTimeout(() => alertDiv.remove(), 5000);
    }

    /**
     * Open settings modal and load current settings
     */
    openSettingsModal() {
        const settingsModal = document.getElementById('settingsModal');
        const openaiApiKeyInput = document.getElementById('openaiApiKey');
        const nasaTokenInput = document.getElementById('nasaTokenInput');

        // Load current settings
        const openaiKey = localStorage.getItem('openai_api_key') || '';
        const nasaToken = localStorage.getItem('nasa_earthdata_token') || '';

        if (openaiApiKeyInput) {
            openaiApiKeyInput.value = openaiKey;
            this.validateApiKey(openaiKey);
        }

        if (nasaTokenInput) {
            nasaTokenInput.value = nasaToken;
            this.validateNasaToken(nasaToken);
        }

        if (settingsModal) {
            settingsModal.style.display = 'flex';
        }
    }

    /**
     * Close settings modal
     */
    closeSettingsModal() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        const openaiApiKeyInput = document.getElementById('openaiApiKey');
        const nasaTokenInput = document.getElementById('nasaTokenInput');

        try {
            // Save OpenAI API key
            if (openaiApiKeyInput) {
                const apiKey = openaiApiKeyInput.value.trim();
                if (apiKey) {
                    localStorage.setItem('openai_api_key', apiKey);
                    this.showAlert('✅ OpenAI API key saved successfully!', 'success');

                    // Reinitialize ConversationalAI if it exists
                    if (window.conversationalAI) {
                        window.conversationalAI.loadAPIKey();
                    }
                } else {
                    localStorage.removeItem('openai_api_key');
                }
            }

            // Save NASA token
            if (nasaTokenInput) {
                const nasaToken = nasaTokenInput.value.trim();
                if (nasaToken) {
                    localStorage.setItem('nasa_earthdata_token', nasaToken);
                    this.showAlert('✅ NASA Earthdata token saved successfully!', 'success');

                    // Update token status in header
                    this.updateAuthenticationStatus();
                } else {
                    localStorage.removeItem('nasa_earthdata_token');
                }
            }

            this.closeSettingsModal();

        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showAlert('❌ Failed to save settings. Please try again.', 'error');
        }
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings? This will remove your API keys.')) {
            try {
                // Clear all stored keys
                localStorage.removeItem('openai_api_key');
                localStorage.removeItem('nasa_earthdata_token');

                // Clear input fields
                const openaiApiKeyInput = document.getElementById('openaiApiKey');
                const nasaTokenInput = document.getElementById('nasaTokenInput');

                if (openaiApiKeyInput) {
                    openaiApiKeyInput.value = '';
                    this.validateApiKey('');
                }

                if (nasaTokenInput) {
                    nasaTokenInput.value = '';
                    this.validateNasaToken('');
                }

                // Update UI
                this.updateAuthenticationStatus();

                // Reinitialize ConversationalAI
                if (window.conversationalAI) {
                    window.conversationalAI.loadAPIKey();
                }

                this.showAlert('🔄 Settings reset to defaults', 'info');
                this.closeSettingsModal();

            } catch (error) {
                console.error('Failed to reset settings:', error);
                this.showAlert('❌ Failed to reset settings. Please try again.', 'error');
            }
        }
    }

    /**
     * Validate OpenAI API key format
     */
    validateApiKey(apiKey) {
        const statusDiv = document.getElementById('apiKeyStatus');
        const statusIndicator = statusDiv?.querySelector('.status-indicator');
        const statusText = statusDiv?.querySelector('.status-text');

        if (!statusDiv || !statusIndicator || !statusText) return;

        if (!apiKey.trim()) {
            statusIndicator.textContent = '🔴';
            statusText.textContent = 'Not configured';
        } else if (apiKey.startsWith('sk-') && apiKey.length > 20) {
            statusIndicator.textContent = '🟢';
            statusText.textContent = 'Valid format';
        } else {
            statusIndicator.textContent = '🟡';
            statusText.textContent = 'Invalid format';
        }
    }

    /**
     * Validate NASA token format
     */
    validateNasaToken(nasaToken) {
        const statusDiv = document.getElementById('nasaTokenStatus');
        const statusIndicator = statusDiv?.querySelector('.status-indicator');
        const statusText = statusDiv?.querySelector('.status-text');

        if (!statusDiv || !statusIndicator || !statusText) return;

        if (!nasaToken.trim()) {
            statusIndicator.textContent = '🔴';
            statusText.textContent = 'Not configured';
        } else if (nasaToken.length > 10) {
            statusIndicator.textContent = '🟢';
            statusText.textContent = 'Token provided';
        } else {
            statusIndicator.textContent = '🟡';
            statusText.textContent = 'Token too short';
        }
    }

    /**
     * Show alert message to user
     */
    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(400px);
            transition: transform 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // Set background color based on type
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            info: '#3B82F6',
            warning: '#F59E0B'
        };

        alertDiv.style.background = colors[type] || colors.info;
        alertDiv.textContent = message;

        // Add to page
        document.body.appendChild(alertDiv);

        // Animate in
        setTimeout(() => {
            alertDiv.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            alertDiv.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Force show settings button with JavaScript
     */
    forceShowSettingsButton() {
        setTimeout(() => {
            const settingsButton = document.getElementById('settingsButton');
            if (settingsButton) {
                console.log('Found settings button, forcing visibility');

                // Remove any hidden classes or styles
                settingsButton.classList.remove('hidden');
                settingsButton.style.display = 'inline-block';
                settingsButton.style.visibility = 'visible';
                settingsButton.style.opacity = '1';
                settingsButton.style.position = 'relative';
                settingsButton.style.zIndex = '99999';
                settingsButton.style.background = 'rgba(102, 126, 234, 0.3)';
                settingsButton.style.border = '2px solid #667eea';
                settingsButton.style.borderRadius = '50%';
                settingsButton.style.padding = '8px';
                settingsButton.style.margin = '0 10px';
                settingsButton.style.fontSize = '18px';
                settingsButton.style.color = '#667eea';
                settingsButton.style.cursor = 'pointer';
                settingsButton.style.minWidth = '40px';
                settingsButton.style.minHeight = '40px';

                console.log('Settings button styles applied:', settingsButton.style.display);
            } else {
                console.error('Settings button not found!');

                // Create the button manually if it doesn't exist
                const headerRight = document.querySelector('.header-right');
                if (headerRight) {
                    const newSettingsButton = document.createElement('button');
                    newSettingsButton.id = 'settingsButton';
                    newSettingsButton.className = 'settings-button';
                    newSettingsButton.title = 'Settings';
                    newSettingsButton.textContent = '⚙️';
                    newSettingsButton.style.cssText = `
                        display: inline-block !important;
                        background: rgba(102, 126, 234, 0.3) !important;
                        border: 2px solid #667eea !important;
                        border-radius: 50%;
                        padding: 8px !important;
                        margin: 0 10px !important;
                        font-size: 18px;
                        color: #667eea;
                        cursor: pointer;
                        position: relative;
                        z-index: 99999;
                        min-width: 40px;
                        min-height: 40px;
                    `;

                    headerRight.appendChild(newSettingsButton);
                    console.log('Settings button created manually');

                    // Set up event listeners for the new button
                    this.setupSettingsModal();
                }
            }
        }, 1000); // Wait 1 second to ensure DOM is fully loaded
    }

}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new NASAFarmNavigatorsApp();
    // Make app instance globally available for button handlers
    window.app = app;
    app.initialize().catch(error => {
        console.error('Application failed to start:', error);
    });

    // Initialize Achievement System
    setTimeout(() => {
        if (window.achievementSystem && window.achievementUI) {
            console.log('🎮 Initializing Achievement System...');
            window.achievementUI.init();

            // Setup achievements button
            const achievementsBtn = document.getElementById('achievementsBtn');
            if (achievementsBtn) {
                achievementsBtn.addEventListener('click', () => {
                    window.achievementUI.showInModal();
                });

                // Update achievement level display
                const updateAchievementLevel = () => {
                    const playerLevel = window.achievementSystem.getPlayerLevel();
                    const levelSpan = document.getElementById('achievementLevel');
                    if (levelSpan) {
                        levelSpan.textContent = `Lv${playerLevel.level}`;
                    }
                };

                updateAchievementLevel();

                // Update level when achievements change
                window.achievementSystem.on('onLevelUp', updateAchievementLevel);
            }

            // Add global debug functions
            window.debugAchievements = {
                reset: () => {
                    window.achievementSystem.resetAllProgress();
                    location.reload(); // Reload to see changes
                },
                debug: (achievementId) => {
                    window.achievementSystem.debugAchievementStatus(achievementId);
                },
                testWaterWizard: () => {
                    console.log('🧪 Testing Water Wizard achievement...');
                    for (let i = 0; i < 3; i++) {
                        window.achievementSystem.trackAction('irrigation_decision', 1);
                    }
                    window.achievementSystem.debugAchievementStatus('water_wizard');
                },
                status: () => {
                    const level = window.achievementSystem.getPlayerLevel();
                    const points = window.achievementSystem.getTotalPoints();
                    console.log('🏆 Achievement Status:', { level, points });

                    Object.values(window.achievementSystem.achievements).forEach(achievement => {
                        if (achievement.progress > 0 || achievement.currentLevel > 0) {
                            console.log(`${achievement.name}:`, {
                                progress: achievement.progress,
                                level: achievement.currentLevel,
                                maxLevel: achievement.levels.length
                            });
                        }
                    });
                }
            };

            console.log('🔧 Debug functions available: window.debugAchievements.reset(), .debug(id), .testWaterWizard(), .status()');

            // Track initial NASA data usage
            window.achievementSystem.trackAction('nasa_data_check', 1);
        }
    }, 1500);

    // Enhance satellite cards with fusion capabilities after initialization
    setTimeout(() => {
        app.enhanceSatelliteCards();
    }, 2000);
});

// Export for testing
export { NASAFarmNavigatorsApp };
