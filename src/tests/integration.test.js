/**
 * NASA Farm Navigators - Integration Test Suite
 * Comprehensive testing of all system components and their interactions
 */

import { GameEngine } from '../core/GameEngine.js';
import { NASADataIntegrator } from '../data/NASADataIntegrator.js';
import { ResolutionManager } from '../resolution/ResolutionManager.js';
import { SoilDepthAnalyzer } from '../depth/SoilDepthAnalyzer.js';
import { FarmContextAdapter } from '../context/FarmContextAdapter.js';
import { EducationEngine } from '../education/EducationEngine.js';
import { EarthdataAuth } from '../data/EarthdataAuth.js';

class IntegrationTestSuite {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };

        this.gameEngine = null;
        this.setupComplete = false;
    }

    /**
     * Run all integration tests
     * @returns {Promise<Object>} Test results
     */
    async runAllTests() {
        console.log('🧪 Starting NASA Farm Navigators Integration Tests...\n');

        try {
            await this.setupTestEnvironment();

            // Core system tests
            await this.testGameEngineInitialization();
            await this.testNASADataIntegration();
            await this.testResolutionManager();
            await this.testSoilDepthAnalysis();
            await this.testFarmContextAdapter();
            await this.testEducationEngine();

            // Integration tests
            await this.testSystemIntegration();
            await this.testOfflineFunctionality();
            await this.testAuthenticationFlow();
            await this.testEventSystem();

            // Performance tests
            await this.testCachingPerformance();
            await this.testMemoryUsage();

            this.printTestResults();
            return this.testResults;

        } catch (error) {
            console.error('Test suite failed:', error);
            this.recordTest('Test Suite Execution', false, error.message);
            return this.testResults;
        }
    }

    /**
     * Setup test environment
     */
    async setupTestEnvironment() {
        try {
            // Initialize GameEngine in test mode
            this.gameEngine = GameEngine.getInstance();
            await this.gameEngine.initialize({
                earthdataClientId: 'test_client',
                defaultContext: 'tutorial',
                cacheSize: 50
            });

            this.setupComplete = true;
            this.recordTest('Test Environment Setup', true, 'Environment initialized successfully');
        } catch (error) {
            this.recordTest('Test Environment Setup', false, error.message);
            throw error;
        }
    }

    /**
     * Test GameEngine initialization and singleton pattern
     */
    async testGameEngineInitialization() {
        try {
            // Test singleton pattern
            const engine1 = GameEngine.getInstance();
            const engine2 = GameEngine.getInstance();
            const isSingleton = engine1 === engine2;

            // Test initialization state
            const gameState = this.gameEngine.getGameState();
            const managers = this.gameEngine.getManagers();

            // Test manager availability
            const hasAllManagers = !!(
                managers.data &&
                managers.resolution &&
                managers.depth &&
                managers.context &&
                managers.education
            );

            this.recordTest('GameEngine Singleton', isSingleton,
                isSingleton ? 'Singleton pattern working correctly' : 'Multiple instances created');

            this.recordTest('GameEngine Initialization', hasAllManagers,
                hasAllManagers ? 'All managers initialized' : 'Missing managers');

            this.recordTest('Game State Structure',
                gameState.hasOwnProperty('currentUser') && gameState.hasOwnProperty('farmContext'),
                'Game state has required properties');

        } catch (error) {
            this.recordTest('GameEngine Initialization', false, error.message);
        }
    }

    /**
     * Test NASA data integration components
     */
    async testNASADataIntegration() {
        try {
            const dataManager = this.gameEngine.getManagers().data;

            // Test SMAP data fetching (synthetic mode)
            const smapData = await dataManager.fetchSMAPData('surface', {
                latitude: 40.7128,
                longitude: -74.0060,
                date: '2024-01-01'
            });

            const hasSmapData = smapData && smapData.type === 'soil_moisture';

            // Test MODIS data fetching
            const modisData = await dataManager.fetchMODISData('NDVI', {
                latitude: 40.7128,
                longitude: -74.0060,
                date: '2024-01-01'
            });

            const hasModisData = modisData && modisData.type === 'vegetation_index';

            // Test Landsat data fetching
            const landsatData = await dataManager.fetchLandsatData('NDVI', {
                latitude: 40.7128,
                longitude: -74.0060,
                date: '2024-01-01'
            });

            const hasLandsatData = landsatData && landsatData.type === 'optical_imagery';

            this.recordTest('SMAP Data Integration', hasSmapData,
                hasSmapData ? 'SMAP data fetched successfully' : 'SMAP data fetch failed');

            this.recordTest('MODIS Data Integration', hasModisData,
                hasModisData ? 'MODIS data fetched successfully' : 'MODIS data fetch failed');

            this.recordTest('Landsat Data Integration', hasLandsatData,
                hasLandsatData ? 'Landsat data fetched successfully' : 'Landsat data fetch failed');

            // Test multi-resolution support
            const resolutions = await dataManager.getAvailableResolutions();
            const hasMultipleResolutions = resolutions && resolutions.length >= 3;

            this.recordTest('Multi-Resolution Support', hasMultipleResolutions,
                hasMultipleResolutions ? `${resolutions.length} resolutions available` : 'Insufficient resolutions');

        } catch (error) {
            this.recordTest('NASA Data Integration', false, error.message);
        }
    }

    /**
     * Test ResolutionManager pixel education features
     */
    async testResolutionManager() {
        try {
            const resolutionManager = this.gameEngine.getManagers().resolution;

            // Test pixel hunt initialization
            const pixelHunt = resolutionManager.startPixelHunt('random');
            const hasPixelHunt = pixelHunt && pixelHunt.scenario;

            // Test resolution comparison
            const comparison = await resolutionManager.generateResolutionComparison(
                40.7128, -74.0060, ['LANDSAT_30M', 'MODIS_250M', 'SMAP_9KM']
            );
            const hasComparison = comparison && comparison.comparisons.length > 0;

            // Test educational content
            const pixelLessons = resolutionManager.getPixelEducationContent();
            const hasEducationalContent = pixelLessons && pixelLessons.lessons.length > 0;

            this.recordTest('Pixel Hunt Functionality', hasPixelHunt,
                hasPixelHunt ? 'Pixel hunt initialized successfully' : 'Pixel hunt failed');

            this.recordTest('Resolution Comparison', hasComparison,
                hasComparison ? 'Resolution comparison generated' : 'Comparison failed');

            this.recordTest('Pixel Education Content', hasEducationalContent,
                hasEducationalContent ? 'Educational content available' : 'No educational content');

        } catch (error) {
            this.recordTest('ResolutionManager Tests', false, error.message);
        }
    }

    /**
     * Test SoilDepthAnalyzer SMAP L3/L4 functionality
     */
    async testSoilDepthAnalysis() {
        try {
            const depthAnalyzer = this.gameEngine.getManagers().depth;

            // Test depth analysis
            const depthAnalysis = await depthAnalyzer.analyzeMoistureByDepth('surface', {
                surface: 0.25,
                rootZone: 0.35
            }, 'corn');

            const hasDepthAnalysis = depthAnalysis && depthAnalysis.moistureProfile;

            // Test L3 vs L4 comparison
            const comparison = await depthAnalyzer.compareL3vsL4Data({
                latitude: 40.7128,
                longitude: -74.0060,
                date: '2024-01-01'
            });

            const hasL3L4Comparison = comparison && comparison.educational;

            // Test crop-specific scenarios
            const scenarios = depthAnalyzer.getAvailableScenarios();
            const hasScenarios = scenarios && scenarios.length > 0;

            this.recordTest('Depth Analysis', hasDepthAnalysis,
                hasDepthAnalysis ? 'Depth analysis completed' : 'Depth analysis failed');

            this.recordTest('L3 vs L4 Comparison', hasL3L4Comparison,
                hasL3L4Comparison ? 'L3/L4 comparison generated' : 'Comparison failed');

            this.recordTest('Crop Scenarios', hasScenarios,
                hasScenarios ? `${scenarios.length} scenarios available` : 'No scenarios found');

        } catch (error) {
            this.recordTest('SoilDepthAnalyzer Tests', false, error.message);
        }
    }

    /**
     * Test FarmContextAdapter functionality
     */
    async testFarmContextAdapter() {
        try {
            const contextAdapter = this.gameEngine.getManagers().context;

            // Test smallholder context
            contextAdapter.adaptToSmallholder();
            const smallholderContext = contextAdapter.getCurrentContext();
            const isSmallholder = smallholderContext.type === 'smallholder';

            // Test industrial context
            contextAdapter.adaptToIndustrial();
            const industrialContext = contextAdapter.getCurrentContext();
            const isIndustrial = industrialContext.type === 'industrial';

            // Test context switching
            const contextHistory = contextAdapter.getContextHistory();
            const hasHistory = contextHistory && contextHistory.length >= 2;

            this.recordTest('Smallholder Context', isSmallholder,
                isSmallholder ? 'Smallholder context set' : 'Context switch failed');

            this.recordTest('Industrial Context', isIndustrial,
                isIndustrial ? 'Industrial context set' : 'Context switch failed');

            this.recordTest('Context History', hasHistory,
                hasHistory ? 'Context switching tracked' : 'History not maintained');

        } catch (error) {
            this.recordTest('FarmContextAdapter Tests', false, error.message);
        }
    }

    /**
     * Test EducationEngine learning system
     */
    async testEducationEngine() {
        try {
            const educationEngine = this.gameEngine.getManagers().education;

            // Test module initialization
            const pixelModule = await educationEngine.startModule('pixel_awareness', {
                experience: 'beginner'
            });
            const hasModule = pixelModule && pixelModule.status === 'started';

            // Test learning progress tracking
            const progress = educationEngine.getLearningState();
            const hasProgress = progress && progress.progress;

            // Test achievement system
            const achievements = educationEngine.getUnlockedAchievements();
            const hasAchievements = Array.isArray(achievements);

            this.recordTest('Education Module Startup', hasModule,
                hasModule ? 'Module started successfully' : 'Module startup failed');

            this.recordTest('Learning Progress Tracking', hasProgress,
                hasProgress ? 'Progress tracking active' : 'No progress tracking');

            this.recordTest('Achievement System', hasAchievements,
                hasAchievements ? 'Achievement system functional' : 'Achievement system failed');

        } catch (error) {
            this.recordTest('EducationEngine Tests', false, error.message);
        }
    }

    /**
     * Test system integration between components
     */
    async testSystemIntegration() {
        try {
            // Test pixel hunt integration with education engine
            const resolutionManager = this.gameEngine.getManagers().resolution;
            const educationEngine = this.gameEngine.getManagers().education;

            const pixelHunt = resolutionManager.startPixelHunt('beginner');
            const educationResponse = educationEngine.integratePixelHuntResults({
                scenario: 'test',
                score: 0.85,
                timeSpent: 120
            });

            const integrationWorks = educationResponse && educationResponse.feedback;

            // Test depth analysis integration
            const depthAnalyzer = this.gameEngine.getManagers().depth;
            const depthResults = await depthAnalyzer.analyzeMoistureByDepth('surface', {
                surface: 0.25,
                rootZone: 0.35
            });

            const depthEducation = educationEngine.integrateDepthAnalysis('test_scenario', depthResults);
            const depthIntegrationWorks = depthEducation && depthEducation.insights;

            this.recordTest('Pixel Hunt Integration', integrationWorks,
                integrationWorks ? 'Pixel hunt integrated with education' : 'Integration failed');

            this.recordTest('Depth Analysis Integration', depthIntegrationWorks,
                depthIntegrationWorks ? 'Depth analysis integrated' : 'Integration failed');

        } catch (error) {
            this.recordTest('System Integration', false, error.message);
        }
    }

    /**
     * Test offline functionality
     */
    async testOfflineFunctionality() {
        try {
            const dataManager = this.gameEngine.getManagers().data;

            // Test cache functionality
            const cacheStats = dataManager.getCacheStats();
            const hasCacheStats = cacheStats && typeof cacheStats.size === 'number';

            // Test offline data generation
            const offlineData = await dataManager.generateOfflineDataSet({
                latitude: 40.7128,
                longitude: -74.0060,
                datasets: ['SMAP', 'MODIS', 'LANDSAT']
            });

            const hasOfflineData = offlineData && offlineData.datasets.length > 0;

            this.recordTest('Cache Functionality', hasCacheStats,
                hasCacheStats ? `Cache has ${cacheStats.size} entries` : 'Cache stats unavailable');

            this.recordTest('Offline Data Generation', hasOfflineData,
                hasOfflineData ? 'Offline dataset generated' : 'Offline data generation failed');

        } catch (error) {
            this.recordTest('Offline Functionality', false, error.message);
        }
    }

    /**
     * Test authentication flow
     */
    async testAuthenticationFlow() {
        try {
            // Test auth status
            const authStatus = this.gameEngine.getAuthStatus();
            const hasAuthSystem = authStatus && authStatus.authSystem;

            // Test auth methods availability
            const hasLoginMethod = typeof this.gameEngine.loginToNASA === 'function';
            const hasLogoutMethod = typeof this.gameEngine.logoutFromNASA === 'function';

            this.recordTest('Authentication System', hasAuthSystem,
                hasAuthSystem ? 'Auth system initialized' : 'Auth system not available');

            this.recordTest('Authentication Methods', hasLoginMethod && hasLogoutMethod,
                hasLoginMethod && hasLogoutMethod ? 'Auth methods available' : 'Missing auth methods');

        } catch (error) {
            this.recordTest('Authentication Flow', false, error.message);
        }
    }

    /**
     * Test event system functionality
     */
    async testEventSystem() {
        try {
            let eventReceived = false;
            let eventData = null;

            // Set up event listener
            this.gameEngine.on('test_event', (data) => {
                eventReceived = true;
                eventData = data;
            });

            // Emit test event
            this.gameEngine.emit('test_event', { test: 'data' });

            // Wait a moment for event processing
            await new Promise(resolve => setTimeout(resolve, 10));

            this.recordTest('Event System', eventReceived && eventData?.test === 'data',
                eventReceived ? 'Event system working' : 'Event system failed');

        } catch (error) {
            this.recordTest('Event System', false, error.message);
        }
    }

    /**
     * Test caching performance
     */
    async testCachingPerformance() {
        try {
            const dataManager = this.gameEngine.getManagers().data;
            const startTime = performance.now();

            // Perform multiple data requests
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(dataManager.fetchSMAPData('surface', {
                    latitude: 40.7128 + (i * 0.01),
                    longitude: -74.0060 + (i * 0.01),
                    date: '2024-01-01'
                }));
            }

            await Promise.all(promises);
            const endTime = performance.now();
            const duration = endTime - startTime;

            // Performance should be reasonable (under 2 seconds for 5 requests)
            const performanceOk = duration < 2000;

            this.recordTest('Caching Performance', performanceOk,
                performanceOk ? `5 requests completed in ${duration.toFixed(2)}ms` : `Slow performance: ${duration.toFixed(2)}ms`);

        } catch (error) {
            this.recordTest('Caching Performance', false, error.message);
        }
    }

    /**
     * Test memory usage
     */
    async testMemoryUsage() {
        try {
            if ('memory' in performance) {
                const memoryInfo = performance.memory;
                const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
                const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024);

                // Memory usage should be reasonable (under 50% of limit)
                const memoryOk = usedMB < (limitMB * 0.5);

                this.recordTest('Memory Usage', memoryOk,
                    `Using ${usedMB}MB of ${limitMB}MB available (${((usedMB/limitMB)*100).toFixed(1)}%)`);
            } else {
                this.recordTest('Memory Usage', true, 'Memory API not available');
            }
        } catch (error) {
            this.recordTest('Memory Usage', false, error.message);
        }
    }

    /**
     * Record a test result
     * @param {string} testName - Name of the test
     * @param {boolean} passed - Whether test passed
     * @param {string} message - Additional details
     */
    recordTest(testName, passed, message = '') {
        this.testResults.total++;
        if (passed) {
            this.testResults.passed++;
        } else {
            this.testResults.failed++;
        }

        this.testResults.details.push({
            name: testName,
            passed: passed,
            message: message,
            timestamp: Date.now()
        });

        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}`);
    }

    /**
     * Print final test results
     */
    printTestResults() {
        const { passed, failed, total } = this.testResults;
        const successRate = ((passed / total) * 100).toFixed(1);

        console.log('\n' + '='.repeat(60));
        console.log('🧪 NASA FARM NAVIGATORS TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${successRate}%`);
        console.log('='.repeat(60));

        if (failed > 0) {
            console.log('\nFailed Tests:');
            this.testResults.details
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  • ${test.name}: ${test.message}`);
                });
        }

        console.log(`\nOverall Status: ${successRate > 90 ? 'EXCELLENT' : successRate > 80 ? 'GOOD' : successRate > 70 ? 'ACCEPTABLE' : 'NEEDS IMPROVEMENT'}`);
    }
}

// Export for use in other contexts
export { IntegrationTestSuite };

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
    const testSuite = new IntegrationTestSuite();
    testSuite.runAllTests().then(results => {
        console.log('Test suite completed:', results);
    }).catch(error => {
        console.error('Test suite failed:', error);
    });
}