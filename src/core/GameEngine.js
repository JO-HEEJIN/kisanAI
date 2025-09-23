/**
 * NASA Farm Navigators - Core Game Engine
 * Singleton pattern implementation for centralized game state management
 * Following UML specifications from NASA Space Apps Challenge documentation
 */

import { NASADataIntegrator } from '../data/NASADataIntegrator.js';
import { ResolutionManager } from '../resolution/ResolutionManager.js';
import { SoilDepthAnalyzer } from '../depth/SoilDepthAnalyzer.js';
import { FarmContextAdapter } from '../context/FarmContextAdapter.js';
import { EducationEngine } from '../education/EducationEngine.js';
import { EventSystem } from '../utils/EventSystem.js';
import { EarthdataAuth } from '../data/EarthdataAuth.js';
import { MultiResolutionVisualizer } from '../visualization/MultiResolutionVisualizer.js';
import { RealTimeComparison } from '../tools/RealTimeComparison.js';
import { InteractiveTutorial } from '../tutorial/InteractiveTutorial.js';
import { SatelliteOrbitVisualization } from '../visualization/SatelliteOrbitVisualization.js';
import { SatelliteMissionTimeline } from '../visualization/SatelliteMissionTimeline.js';
import { TemporalAnalysisTools } from '../analysis/TemporalAnalysisTools.js';
import { DemoScenarios } from '../demo/DemoScenarios.js';

class GameEngine {
    constructor() {
        if (GameEngine.instance) {
            return GameEngine.instance;
        }

        this.gameState = {
            currentUser: null,
            farmContext: null,
            currentResolution: 9000, // Start with SMAP 9km
            selectedTool: 'inspect',
            gameMode: 'tutorial',
            currentWeek: 1,
            maxWeeks: 20,
            isOnline: navigator.onLine,
            lastSyncTime: null,
            achievements: [],
            progressData: {},
            isAuthenticated: false,
            authError: null
        };

        this.dataManager = null;
        this.resolutionManager = null;
        this.depthAnalyzer = null;
        this.contextAdapter = null;
        this.educationEngine = null;
        this.earthdataAuth = null;
        this.eventSystem = new EventSystem();

        // Advanced visualization and analysis components
        this.multiResolutionVisualizer = null;
        this.realTimeComparison = null;
        this.interactiveTutorial = null;
        this.satelliteOrbitVisualization = null;
        this.satelliteMissionTimeline = null;
        this.temporalAnalysisTools = null;
        this.demoScenarios = null;

        this.listeners = new Map();
        this.isInitialized = false;

        GameEngine.instance = this;
    }

    static getInstance() {
        if (!GameEngine.instance) {
            GameEngine.instance = new GameEngine();
        }
        return GameEngine.instance;
    }

    async initialize(config = {}) {
        if (this.isInitialized) {
            console.log('GameEngine already initialized');
            return;
        }

        console.log('Initializing NASA Farm Navigators Game Engine...');

        try {
            // Initialize NASA Earthdata authentication
            this.earthdataAuth = new EarthdataAuth({
                clientId: config.earthdataClientId || 'nasa_farm_navigators',
                redirectUri: config.redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3000/auth/callback')
            });

            // Set up authentication event listeners
            this.earthdataAuth.onAuthStateChange((isAuthenticated, userInfo) => {
                this.gameState.isAuthenticated = isAuthenticated;
                this.gameState.currentUser = userInfo;
                this.emit('authStateChanged', { isAuthenticated, userInfo });
            });

            // Initialize core managers in dependency order
            this.dataManager = new NASADataIntegrator({
                earthdataAuth: this.earthdataAuth,
                cacheSize: config.cacheSize || 100,
                offlineMode: !this.gameState.isOnline
            });

            this.resolutionManager = new ResolutionManager({
                availableResolutions: [30, 250, 9000, 11000],
                defaultResolution: 9000
            });

            this.depthAnalyzer = new SoilDepthAnalyzer({
                supportedCrops: ['corn', 'wheat', 'soybeans', 'cotton', 'almond'],
                depthLayers: ['surface', 'rootZone', 'deep']
            });

            this.contextAdapter = new FarmContextAdapter({
                contexts: ['smallholder', 'industrial'],
                defaultContext: config.defaultContext || 'tutorial'
            });

            this.educationEngine = new EducationEngine({
                progressTracking: true,
                assessmentMode: true,
                adaptiveLearning: true
            });

            // Initialize advanced visualization and analysis components
            this.multiResolutionVisualizer = new MultiResolutionVisualizer(this);
            this.realTimeComparison = new RealTimeComparison(this);
            this.interactiveTutorial = new InteractiveTutorial(this);
            this.satelliteOrbitVisualization = new SatelliteOrbitVisualization(this);
            this.satelliteMissionTimeline = new SatelliteMissionTimeline(this);
            this.temporalAnalysisTools = new TemporalAnalysisTools(this);
            this.demoScenarios = new DemoScenarios(this);

            console.log('Advanced components initialized: Visualizers, Analysis Tools, Tutorial System, and Demo Scenarios');

            // Set up event listeners
            this.bindSystemEvents();

            // Initialize PWA capabilities
            await this.initializePWA();

            this.isInitialized = true;
            this.emit('gameEngineInitialized', { timestamp: Date.now() });

            console.log('✅ Game Engine initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Game Engine:', error);
            this.emit('gameEngineError', { error: error.message });
            throw error;
        }
    }

    bindSystemEvents() {
        // Network status monitoring
        window.addEventListener('online', () => {
            this.gameState.isOnline = true;
            this.emit('networkStatusChanged', { online: true });
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.gameState.isOnline = false;
            this.emit('networkStatusChanged', { online: false });
        });

        // Visibility API for resource management
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseNonEssentialProcesses();
            } else {
                this.resumeProcesses();
            }
        });

        // Periodic auto-save
        setInterval(() => {
            this.autoSave();
        }, 30000); // Every 30 seconds
    }

    async initializePWA() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                this.emit('pwaReady', { registration });
            } catch (error) {
                console.warn('⚠️ Service Worker registration failed:', error);
            }
        }
    }

    update(deltaTime) {
        if (!this.isInitialized) return;

        // Update all managers
        if (this.dataManager) this.dataManager.update(deltaTime);
        if (this.resolutionManager) this.resolutionManager.update(deltaTime);
        if (this.depthAnalyzer) this.depthAnalyzer.update(deltaTime);
        if (this.educationEngine) this.educationEngine.update(deltaTime);

        // Update advanced components
        if (this.multiResolutionVisualizer) this.multiResolutionVisualizer.update(deltaTime);
        if (this.realTimeComparison) this.realTimeComparison.update(deltaTime);
        if (this.satelliteOrbitVisualization) this.satelliteOrbitVisualization.update(deltaTime);

        // Emit update event
        this.emit('gameUpdate', { deltaTime, gameState: this.gameState });
    }

    async switchResolution(resolution) {
        if (!this.resolutionManager) {
            throw new Error('ResolutionManager not initialized');
        }

        const previousResolution = this.gameState.currentResolution;

        try {
            await this.resolutionManager.switchResolution(resolution);
            this.gameState.currentResolution = resolution;

            // Trigger educational content about resolution change
            await this.educationEngine.triggerResolutionEducation(previousResolution, resolution);

            this.emit('resolutionChanged', {
                from: previousResolution,
                to: resolution,
                impacts: this.resolutionManager.getResolutionImpacts(resolution)
            });

            return true;
        } catch (error) {
            console.error('Failed to switch resolution:', error);
            this.emit('resolutionError', { error: error.message });
            return false;
        }
    }

    async adaptToContext(context) {
        if (!this.contextAdapter) {
            throw new Error('FarmContextAdapter not initialized');
        }

        try {
            const contextConfig = await this.contextAdapter.adaptToContext(context);
            this.gameState.farmContext = context;

            // Apply context-specific UI changes
            this.emit('contextChanged', {
                context,
                config: contextConfig,
                availableFeatures: contextConfig.features
            });

            return contextConfig;
        } catch (error) {
            console.error('Failed to adapt to context:', error);
            this.emit('contextError', { error: error.message });
            throw error;
        }
    }

    async fetchNASAData(params) {
        if (!this.dataManager) {
            throw new Error('NASADataIntegrator not initialized');
        }

        try {
            const data = await this.dataManager.fetchData(params);

            // Validate data quality and provide educational context
            const validation = this.dataManager.validateDataAccuracy(data);
            if (!validation.isValid) {
                await this.educationEngine.explainDataLimitations(validation.limitations);
            }

            this.emit('nasaDataReceived', { data, validation, params });
            return data;
        } catch (error) {
            console.error('Failed to fetch NASA data:', error);
            this.emit('nasaDataError', { error: error.message, params });

            // Try to serve cached data if available
            return await this.dataManager.getCachedData(params);
        }
    }

    async analyzeDepth(location, crop) {
        if (!this.depthAnalyzer) {
            throw new Error('SoilDepthAnalyzer not initialized');
        }

        try {
            const analysis = await this.depthAnalyzer.analyzeLocation(location, crop);

            // Trigger educational content about depth importance
            if (analysis.hasSignificantDepthDifference) {
                await this.educationEngine.explainDepthImportance(analysis);
            }

            this.emit('depthAnalysisComplete', { analysis, location, crop });
            return analysis;
        } catch (error) {
            console.error('Failed to analyze depth:', error);
            this.emit('depthAnalysisError', { error: error.message });
            throw error;
        }
    }

    async syncOfflineData() {
        if (!this.gameState.isOnline) return;

        try {
            console.log('Syncing offline data...');

            // Get offline changes from local storage
            const offlineChanges = this.getOfflineChanges();

            if (offlineChanges.length > 0) {
                await this.dataManager.syncData(offlineChanges);
                this.clearOfflineChanges();
                this.gameState.lastSyncTime = Date.now();

                this.emit('dataSynced', {
                    changesCount: offlineChanges.length,
                    timestamp: this.gameState.lastSyncTime
                });
            }
        } catch (error) {
            console.error('Failed to sync offline data:', error);
            this.emit('syncError', { error: error.message });
        }
    }

    autoSave() {
        try {
            const saveData = {
                gameState: this.gameState,
                progress: this.educationEngine?.getProgress() || {},
                achievements: this.gameState.achievements,
                timestamp: Date.now()
            };

            localStorage.setItem('nasa_farm_navigators_save', JSON.stringify(saveData));
            this.emit('gameSaved', { timestamp: saveData.timestamp });
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    loadSaveData() {
        try {
            const saveData = localStorage.getItem('nasa_farm_navigators_save');
            if (saveData) {
                const parsed = JSON.parse(saveData);
                this.gameState = { ...this.gameState, ...parsed.gameState };

                if (this.educationEngine && parsed.progress) {
                    this.educationEngine.loadProgress(parsed.progress);
                }

                this.emit('gameLoaded', { timestamp: parsed.timestamp });
                return true;
            }
        } catch (error) {
            console.error('Failed to load save data:', error);
        }
        return false;
    }

    getOfflineChanges() {
        try {
            const changes = localStorage.getItem('nasa_farm_offline_changes');
            return changes ? JSON.parse(changes) : [];
        } catch (error) {
            console.error('Failed to get offline changes:', error);
            return [];
        }
    }

    clearOfflineChanges() {
        localStorage.removeItem('nasa_farm_offline_changes');
    }

    pauseNonEssentialProcesses() {
        // Pause non-critical updates when app is in background
        this.emit('processesPaused');
    }

    resumeProcesses() {
        // Resume all processes when app becomes visible
        this.emit('processesResumed');
    }

    // Authentication methods
    async loginToNASA() {
        try {
            if (!this.earthdataAuth) {
                throw new Error('Authentication system not initialized');
            }

            await this.earthdataAuth.login();
        } catch (error) {
            this.gameState.authError = error.message;
            this.emit('authError', { error: error.message });
            throw error;
        }
    }

    logoutFromNASA() {
        try {
            if (this.earthdataAuth) {
                this.earthdataAuth.logout();
            }

            this.gameState.isAuthenticated = false;
            this.gameState.currentUser = null;
            this.gameState.authError = null;

            this.emit('authStateChanged', {
                isAuthenticated: false,
                userInfo: null
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    isAuthenticated() {
        return this.gameState.isAuthenticated && this.earthdataAuth?.isAuthenticated();
    }

    getCurrentUser() {
        return this.gameState.currentUser;
    }

    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated(),
            user: this.getCurrentUser(),
            error: this.gameState.authError,
            authSystem: this.earthdataAuth?.getAuthStatus() || null
        };
    }

    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.earthdataAuth) {
            throw new Error('Authentication system not available');
        }

        return await this.earthdataAuth.authenticatedRequest(url, options);
    }

    // Event system methods
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data = {}) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Public API methods
    getGameState() {
        return { ...this.gameState };
    }

    getManagers() {
        return {
            data: this.dataManager,
            resolution: this.resolutionManager,
            depth: this.depthAnalyzer,
            context: this.contextAdapter,
            education: this.educationEngine
        };
    }

    /**
     * Get the event system instance
     * @returns {EventSystem} The event system
     */
    getEventSystem() {
        return this.eventSystem;
    }

    getAdvancedComponents() {
        return {
            multiResolutionVisualizer: this.multiResolutionVisualizer,
            realTimeComparison: this.realTimeComparison,
            interactiveTutorial: this.interactiveTutorial,
            satelliteOrbitVisualization: this.satelliteOrbitVisualization,
            satelliteMissionTimeline: this.satelliteMissionTimeline,
            temporalAnalysisTools: this.temporalAnalysisTools,
            demoScenarios: this.demoScenarios
        };
    }

    getAllComponents() {
        return {
            ...this.getManagers(),
            ...this.getAdvancedComponents(),
            eventSystem: this.eventSystem,
            authSystem: this.earthdataAuth
        };
    }

    isReady() {
        return this.isInitialized;
    }

    getSystemInfo() {
        return {
            isOnline: this.gameState.isOnline,
            lastSync: this.gameState.lastSyncTime,
            version: '2.0.0',
            buildDate: '2025-09-17',
            userAgent: navigator.userAgent,
            hasPWASupport: 'serviceWorker' in navigator
        };
    }

    /**
     * Register Farm Game instance
     */
    setFarmGame(farmGameInstance) {
        this.farmGame = farmGameInstance;
        console.log('🚜 Farm Game registered with GameEngine');
    }

    /**
     * Get Farm Game instance
     */
    getFarmGame() {
        return this.farmGame;
    }
}

export { GameEngine };