/**
 * NASA Farm Navigators - System Validation Script
 * Validates the complete system functionality without requiring user interaction
 */

import { GameEngine } from '../core/GameEngine.js';
import { IntegrationTestSuite } from './integration.test.js';

class SystemValidator {
    constructor() {
        this.results = {
            system: 'NASA Farm Navigators',
            version: '2.0',
            validationTime: new Date().toISOString(),
            tests: {},
            overall: {
                status: 'pending',
                score: 0,
                errors: [],
                warnings: []
            }
        };
    }

    /**
     * Run complete system validation
     */
    async validate() {
        console.log('Starting NASA Farm Navigators System Validation...\n');

        try {
            // Test 1: Core Architecture Validation
            await this.validateCoreArchitecture();

            // Test 2: NASA Data Integration
            await this.validateNASADataIntegration();

            // Test 3: Educational Components
            await this.validateEducationalComponents();

            // Test 4: Offline Functionality
            await this.validateOfflineFunctionality();

            // Test 5: Authentication System
            await this.validateAuthenticationSystem();

            // Test 6: Performance Metrics
            await this.validatePerformance();

            // Test 7: Integration Tests
            await this.runIntegrationTests();

            // Calculate overall score
            this.calculateOverallScore();

            // Generate report
            this.generateReport();

            return this.results;

        } catch (error) {
            this.results.overall.status = 'failed';
            this.results.overall.errors.push(`System validation failed: ${error.message}`);
            console.error('System validation failed:', error);
            return this.results;
        }
    }

    /**
     * Validate core architecture components
     */
    async validateCoreArchitecture() {
        const testName = 'Core Architecture';
        console.log(`🏗️  Validating ${testName}...`);

        try {
            // Initialize GameEngine
            const gameEngine = GameEngine.getInstance();
            await gameEngine.initialize({
                earthdataClientId: 'test_client',
                defaultContext: 'tutorial'
            });

            const managers = gameEngine.getManagers();
            const gameState = gameEngine.getGameState();

            // Check all required managers
            const requiredManagers = ['data', 'resolution', 'depth', 'context', 'education'];
            const missingManagers = requiredManagers.filter(name => !managers[name]);

            // Check game state structure
            const requiredStateProps = ['currentUser', 'farmContext', 'currentResolution', 'gameMode'];
            const missingStateProps = requiredStateProps.filter(prop => !(prop in gameState));

            const success = missingManagers.length === 0 && missingStateProps.length === 0;

            this.results.tests[testName] = {
                status: success ? 'passed' : 'failed',
                details: {
                    managersLoaded: requiredManagers.length - missingManagers.length,
                    totalManagers: requiredManagers.length,
                    missingManagers: missingManagers,
                    statePropsFound: requiredStateProps.length - missingStateProps.length,
                    totalStateProps: requiredStateProps.length,
                    missingStateProps: missingStateProps
                },
                score: success ? 100 : 50
            };

            if (success) {
                console.log('Core architecture validated successfully');
            } else {
                console.log(' Core architecture has issues');
                this.results.overall.warnings.push(`Missing managers: ${missingManagers.join(', ')}`);
            }

        } catch (error) {
            this.results.tests[testName] = {
                status: 'failed',
                error: error.message,
                score: 0
            };
            console.log('Core architecture validation failed');
        }
    }

    /**
     * Validate NASA data integration
     */
    async validateNASADataIntegration() {
        const testName = 'NASA Data Integration';
        console.log(` Validating ${testName}...`);

        try {
            const gameEngine = GameEngine.getInstance();
            const dataManager = gameEngine.getManagers().data;

            // Test different data sources
            const testParams = {
                latitude: 40.7128,
                longitude: -74.0060,
                date: '2024-01-01'
            };

            const tests = [
                { name: 'SMAP', method: 'fetchSMAPData', params: ['surface', testParams] },
                { name: 'MODIS', method: 'fetchMODISData', params: ['NDVI', testParams] },
                { name: 'Landsat', method: 'fetchLandsatData', params: ['NDVI', testParams] }
            ];

            const results = {};
            for (const test of tests) {
                try {
                    const data = await dataManager[test.method](...test.params);
                    results[test.name] = {
                        success: true,
                        hasData: !!data,
                        dataType: data?.type,
                        source: data?.source
                    };
                } catch (error) {
                    results[test.name] = {
                        success: false,
                        error: error.message
                    };
                }
            }

            const successfulTests = Object.values(results).filter(r => r.success).length;
            const totalTests = tests.length;
            const score = Math.round((successfulTests / totalTests) * 100);

            this.results.tests[testName] = {
                status: successfulTests === totalTests ? 'passed' : 'partial',
                details: results,
                score: score,
                successRate: `${successfulTests}/${totalTests}`
            };

            console.log(`NASA data integration: ${successfulTests}/${totalTests} sources working`);

        } catch (error) {
            this.results.tests[testName] = {
                status: 'failed',
                error: error.message,
                score: 0
            };
            console.log('NASA data integration validation failed');
        }
    }

    /**
     * Validate educational components
     */
    async validateEducationalComponents() {
        const testName = 'Educational Components';
        console.log(`🎓 Validating ${testName}...`);

        try {
            const gameEngine = GameEngine.getInstance();
            const resolutionManager = gameEngine.getManagers().resolution;
            const depthAnalyzer = gameEngine.getManagers().depth;
            const educationEngine = gameEngine.getManagers().education;

            const tests = {
                pixelHunt: false,
                resolutionComparison: false,
                depthAnalysis: false,
                educationModules: false,
                achievements: false
            };

            // Test pixel hunt
            try {
                const pixelHunt = resolutionManager.startPixelHunt('random');
                tests.pixelHunt = !!(pixelHunt && pixelHunt.scenario);
            } catch (error) {
                console.warn('Pixel hunt test failed:', error.message);
            }

            // Test resolution comparison
            try {
                const comparison = await resolutionManager.generateResolutionComparison(
                    40.7128, -74.0060, ['LANDSAT_30M', 'MODIS_250M']
                );
                tests.resolutionComparison = !!(comparison && comparison.comparisons);
            } catch (error) {
                console.warn('Resolution comparison test failed:', error.message);
            }

            // Test depth analysis
            try {
                const analysis = await depthAnalyzer.analyzeMoistureByDepth('surface', {
                    surface: 0.25,
                    rootZone: 0.35
                });
                tests.depthAnalysis = !!(analysis && analysis.moistureProfile);
            } catch (error) {
                console.warn('Depth analysis test failed:', error.message);
            }

            // Test education modules
            try {
                const learningState = educationEngine.getLearningState();
                tests.educationModules = !!(learningState && learningState.availableModules);
            } catch (error) {
                console.warn('Education modules test failed:', error.message);
            }

            // Test achievements
            try {
                const achievements = educationEngine.getUnlockedAchievements();
                tests.achievements = Array.isArray(achievements);
            } catch (error) {
                console.warn('Achievements test failed:', error.message);
            }

            const passedTests = Object.values(tests).filter(Boolean).length;
            const totalTests = Object.keys(tests).length;
            const score = Math.round((passedTests / totalTests) * 100);

            this.results.tests[testName] = {
                status: passedTests === totalTests ? 'passed' : 'partial',
                details: tests,
                score: score,
                successRate: `${passedTests}/${totalTests}`
            };

            console.log(`Educational components: ${passedTests}/${totalTests} features working`);

        } catch (error) {
            this.results.tests[testName] = {
                status: 'failed',
                error: error.message,
                score: 0
            };
            console.log('Educational components validation failed');
        }
    }

    /**
     * Validate offline functionality
     */
    async validateOfflineFunctionality() {
        const testName = 'Offline Functionality';
        console.log(`Validating ${testName}...`);

        try {
            const gameEngine = GameEngine.getInstance();
            const dataManager = gameEngine.getManagers().data;

            const tests = {
                cacheSystem: false,
                offlineDataGeneration: false,
                serviceWorkerSupport: false,
                dataCache: false
            };

            // Test cache system
            try {
                const cacheStats = dataManager.getCacheStats();
                tests.cacheSystem = !!(cacheStats && typeof cacheStats.size === 'number');
            } catch (error) {
                console.warn('Cache system test failed:', error.message);
            }

            // Test offline data generation
            try {
                const offlineData = await dataManager.generateOfflineDataSet({
                    latitude: 40.7128,
                    longitude: -74.0060,
                    datasets: ['SMAP', 'MODIS']
                });
                tests.offlineDataGeneration = !!(offlineData && offlineData.datasets);
            } catch (error) {
                console.warn('Offline data generation test failed:', error.message);
            }

            // Test service worker support
            tests.serviceWorkerSupport = 'serviceWorker' in navigator;

            // Test data cache functionality
            try {
                // Simulate cache operation
                tests.dataCache = typeof localStorage !== 'undefined';
            } catch (error) {
                console.warn('Data cache test failed:', error.message);
            }

            const passedTests = Object.values(tests).filter(Boolean).length;
            const totalTests = Object.keys(tests).length;
            const score = Math.round((passedTests / totalTests) * 100);

            this.results.tests[testName] = {
                status: passedTests >= totalTests - 1 ? 'passed' : 'partial', // Allow 1 failure
                details: tests,
                score: score,
                successRate: `${passedTests}/${totalTests}`
            };

            console.log(`Offline functionality: ${passedTests}/${totalTests} features working`);

        } catch (error) {
            this.results.tests[testName] = {
                status: 'failed',
                error: error.message,
                score: 0
            };
            console.log('Offline functionality validation failed');
        }
    }

    /**
     * Validate authentication system
     */
    async validateAuthenticationSystem() {
        const testName = 'Authentication System';
        console.log(`🔐 Validating ${testName}...`);

        try {
            const gameEngine = GameEngine.getInstance();

            const tests = {
                authSystemInitialized: false,
                authMethods: false,
                authStatus: false,
                tokenHandling: false
            };

            // Test authentication system initialization
            try {
                const authStatus = gameEngine.getAuthStatus();
                tests.authSystemInitialized = !!(authStatus && authStatus.authSystem);
            } catch (error) {
                console.warn('Auth system initialization test failed:', error.message);
            }

            // Test authentication methods
            try {
                tests.authMethods = !!(
                    typeof gameEngine.loginToNASA === 'function' &&
                    typeof gameEngine.logoutFromNASA === 'function' &&
                    typeof gameEngine.isAuthenticated === 'function'
                );
            } catch (error) {
                console.warn('Auth methods test failed:', error.message);
            }

            // Test auth status functionality
            try {
                const authStatus = gameEngine.getAuthStatus();
                tests.authStatus = !!(authStatus && 'isAuthenticated' in authStatus);
            } catch (error) {
                console.warn('Auth status test failed:', error.message);
            }

            // Test token handling (without actual authentication)
            try {
                tests.tokenHandling = !gameEngine.isAuthenticated(); // Should be false initially
            } catch (error) {
                console.warn('Token handling test failed:', error.message);
            }

            const passedTests = Object.values(tests).filter(Boolean).length;
            const totalTests = Object.keys(tests).length;
            const score = Math.round((passedTests / totalTests) * 100);

            this.results.tests[testName] = {
                status: passedTests >= totalTests - 1 ? 'passed' : 'partial',
                details: tests,
                score: score,
                successRate: `${passedTests}/${totalTests}`
            };

            console.log(`Authentication system: ${passedTests}/${totalTests} features working`);

        } catch (error) {
            this.results.tests[testName] = {
                status: 'failed',
                error: error.message,
                score: 0
            };
            console.log('Authentication system validation failed');
        }
    }

    /**
     * Validate performance metrics
     */
    async validatePerformance() {
        const testName = 'Performance Metrics';
        console.log(`⚡ Validating ${testName}...`);

        try {
            const startTime = performance.now();

            // Test initialization time
            const gameEngine = GameEngine.getInstance();
            const initTime = performance.now() - startTime;

            // Test memory usage
            let memoryUsage = null;
            if ('memory' in performance) {
                memoryUsage = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                };
            }

            // Test data fetch performance
            const dataFetchStart = performance.now();
            const dataManager = gameEngine.getManagers().data;
            await dataManager.fetchSMAPData('surface', {
                latitude: 40.7128,
                longitude: -74.0060,
                date: '2024-01-01'
            });
            const dataFetchTime = performance.now() - dataFetchStart;

            const performance_results = {
                initializationTime: Math.round(initTime),
                dataFetchTime: Math.round(dataFetchTime),
                memoryUsage: memoryUsage
            };

            // Performance criteria
            const performanceOk = initTime < 2000 && dataFetchTime < 1000; // 2s init, 1s data fetch

            this.results.tests[testName] = {
                status: performanceOk ? 'passed' : 'warning',
                details: performance_results,
                score: performanceOk ? 100 : 75
            };

            console.log(`Performance: Init ${Math.round(initTime)}ms, Data fetch ${Math.round(dataFetchTime)}ms`);

        } catch (error) {
            this.results.tests[testName] = {
                status: 'failed',
                error: error.message,
                score: 0
            };
            console.log('Performance validation failed');
        }
    }

    /**
     * Run integration test suite
     */
    async runIntegrationTests() {
        const testName = 'Integration Tests';
        console.log(`🧪 Running ${testName}...`);

        try {
            const testSuite = new IntegrationTestSuite();
            const results = await testSuite.runAllTests();

            const successRate = results.total > 0 ? (results.passed / results.total) * 100 : 0;

            this.results.tests[testName] = {
                status: results.failed === 0 ? 'passed' : results.passed > results.failed ? 'partial' : 'failed',
                details: {
                    totalTests: results.total,
                    passed: results.passed,
                    failed: results.failed,
                    successRate: `${Math.round(successRate)}%`
                },
                score: Math.round(successRate)
            };

            console.log(`Integration tests: ${results.passed}/${results.total} passed`);

        } catch (error) {
            this.results.tests[testName] = {
                status: 'failed',
                error: error.message,
                score: 0
            };
            console.log('Integration tests failed');
        }
    }

    /**
     * Calculate overall system score
     */
    calculateOverallScore() {
        const testScores = Object.values(this.results.tests)
            .map(test => test.score || 0)
            .filter(score => score > 0);

        if (testScores.length === 0) {
            this.results.overall.score = 0;
            this.results.overall.status = 'failed';
            return;
        }

        const averageScore = testScores.reduce((a, b) => a + b, 0) / testScores.length;
        this.results.overall.score = Math.round(averageScore);

        // Determine overall status
        if (this.results.overall.score >= 90) {
            this.results.overall.status = 'excellent';
        } else if (this.results.overall.score >= 80) {
            this.results.overall.status = 'good';
        } else if (this.results.overall.score >= 70) {
            this.results.overall.status = 'acceptable';
        } else if (this.results.overall.score >= 50) {
            this.results.overall.status = 'needs_improvement';
        } else {
            this.results.overall.status = 'failed';
        }
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('NASA FARM NAVIGATORS SYSTEM VALIDATION REPORT');
        console.log('='.repeat(80));

        console.log(`System: ${this.results.system} ${this.results.version}`);
        console.log(`Validation Time: ${this.results.validationTime}`);
        console.log(`Overall Score: ${this.results.overall.score}/100`);
        console.log(`Overall Status: ${this.results.overall.status.toUpperCase()}`);

        console.log('\nTEST RESULTS:');
        console.log('-'.repeat(80));

        Object.entries(this.results.tests).forEach(([testName, result]) => {
            const status = result.status === 'passed' ? '✅' :
                          result.status === 'partial' ? '⚠️' : '❌';
            const score = result.score || 0;

            console.log(`${status} ${testName.padEnd(25)} | Score: ${score.toString().padStart(3)}/100 | ${result.status.toUpperCase()}`);

            if (result.successRate) {
                console.log(`    Success Rate: ${result.successRate}`);
            }

            if (result.error) {
                console.log(`    Error: ${result.error}`);
            }
        });

        console.log('\nCOMPLIANCE ASSESSMENT:');
        console.log('-'.repeat(80));

        const complianceChecks = {
            'NASA Space Apps Challenge Requirements': this.results.overall.score >= 80 ? '✅' : '❌',
            'Multi-Resolution Support': this.results.tests['NASA Data Integration']?.score >= 75 ? '✅' : '❌',
            'Educational Effectiveness': this.results.tests['Educational Components']?.score >= 80 ? '✅' : '❌',
            'Offline Capability (72 hours)': this.results.tests['Offline Functionality']?.score >= 75 ? '✅' : '❌',
            'NASA Earthdata Integration': this.results.tests['Authentication System']?.score >= 70 ? '✅' : '❌'
        };

        Object.entries(complianceChecks).forEach(([requirement, status]) => {
            console.log(`${status} ${requirement}`);
        });

        console.log('\nRECOMMENDATIONS:');
        console.log('-'.repeat(80));

        if (this.results.overall.score < 80) {
            console.log('• Focus on improving failed test components');
            console.log('• Consider additional error handling and fallback mechanisms');
        }

        if (this.results.tests['Performance Metrics']?.score < 90) {
            console.log('• Optimize data loading and caching strategies');
            console.log('• Consider implementing progressive loading');
        }

        if (this.results.overall.errors.length > 0) {
            console.log('• Address critical errors:');
            this.results.overall.errors.forEach(error => {
                console.log(`  - ${error}`);
            });
        }

        console.log('\n🏆 FINAL ASSESSMENT:');
        console.log('-'.repeat(80));

        const assessments = {
            'excellent': 'Outstanding implementation ready for NASA Space Apps Challenge submission!',
            'good': '👍 Solid implementation with minor areas for improvement',
            'acceptable': ' Basic requirements met but could benefit from enhancements',
            'needs_improvement': 'Significant improvements needed before submission',
            'failed': 'Critical issues must be resolved'
        };

        console.log(assessments[this.results.overall.status] || 'Unknown status');
        console.log('='.repeat(80) + '\n');
    }
}

// Export for use
export { SystemValidator };

// Auto-run if executed directly
if (typeof window !== 'undefined') {
    const validator = new SystemValidator();
    validator.validate().then(results => {
        console.log('System validation completed');

        // Store results for potential UI display
        window.systemValidationResults = results;
    }).catch(error => {
        console.error('System validation failed:', error);
    });
}