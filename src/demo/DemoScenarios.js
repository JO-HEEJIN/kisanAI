class DemoScenarios {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.container = null;
        this.eventSystem = gameEngine ? gameEngine.getEventSystem() : null;
        this.currentScenario = null;
        this.demoState = {
            isRunning: false,
            currentStep: 0,
            totalSteps: 0,
            autoAdvance: true,
            speed: 'normal'
        };

        this.scenarios = {
            comprehensive_showcase: {
                id: 'comprehensive_showcase',
                title: 'NASA Farm Navigators - Complete Feature Showcase',
                description: 'Comprehensive demonstration of all NASA Farm Navigators capabilities',
                duration: '15-20 minutes',
                category: 'showcase',
                difficulty: 'intermediate',
                location: {
                    latitude: 40.7589,
                    longitude: -96.6917,
                    name: 'Nebraska Agricultural Research Center',
                    cropType: 'corn',
                    farmSize: '500 hectares'
                },
                objectives: [
                    'Demonstrate multi-resolution satellite data integration',
                    'Showcase educational pixel awareness training',
                    'Exhibit SMAP L3/L4 soil moisture depth analysis',
                    'Display real-time data comparison capabilities',
                    'Present temporal analysis for agricultural insights',
                    'Show satellite orbit visualization and pass predictions',
                    'Highlight offline functionality and PWA capabilities'
                ],
                steps: [
                    {
                        id: 'intro',
                        title: 'Welcome to NASA Farm Navigators',
                        duration: 60,
                        components: ['welcome_screen'],
                        actions: ['show_overview', 'highlight_features'],
                        narration: 'Welcome to NASA Farm Navigators, the comprehensive agricultural monitoring platform using NASA satellite data.'
                    },
                    {
                        id: 'data_integration',
                        title: 'NASA Data Integration Demo',
                        duration: 180,
                        components: ['data_tablet', 'multi_resolution'],
                        actions: ['fetch_modis', 'fetch_landsat', 'fetch_smap', 'show_comparison'],
                        narration: 'Experience real-time integration of multiple NASA satellite datasets with different resolutions and capabilities.'
                    },
                    {
                        id: 'pixel_awareness',
                        title: 'Pixel Resolution Education',
                        duration: 120,
                        components: ['resolution_manager', 'pixel_hunt'],
                        actions: ['start_pixel_hunt', 'demonstrate_scales', 'compare_resolutions'],
                        narration: 'Learn how satellite pixel size affects agricultural monitoring through interactive challenges.'
                    },
                    {
                        id: 'soil_depth_analysis',
                        title: 'SMAP Depth Analysis',
                        duration: 150,
                        components: ['depth_analyzer', 'soil_profile'],
                        actions: ['compare_l3_l4', 'show_root_zones', 'crop_specific_analysis'],
                        narration: 'Explore the difference between surface (L3) and root zone (L4) soil moisture for precision agriculture.'
                    },
                    {
                        id: 'temporal_analysis',
                        title: 'Time-Series Analysis',
                        duration: 240,
                        components: ['temporal_tools', 'trend_analysis'],
                        actions: ['run_drought_scenario', 'show_seasonal_patterns', 'predict_trends'],
                        narration: 'Analyze agricultural patterns over time to understand crop development and environmental changes.'
                    },
                    {
                        id: 'orbit_visualization',
                        title: 'Satellite Orbit Tracking',
                        duration: 120,
                        components: ['orbit_visualizer', '3d_globe'],
                        actions: ['show_satellite_passes', 'predict_overpasses', 'explain_coverage'],
                        narration: 'Understand satellite coverage patterns and optimize data collection timing.'
                    },
                    {
                        id: 'real_time_comparison',
                        title: 'Multi-Source Data Fusion',
                        duration: 180,
                        components: ['comparison_tools', 'data_fusion'],
                        actions: ['correlate_datasets', 'validate_sources', 'integrate_analysis'],
                        narration: 'Compare and validate findings across multiple NASA data sources for comprehensive insights.'
                    },
                    {
                        id: 'offline_demo',
                        title: 'Offline Capabilities',
                        duration: 90,
                        components: ['offline_manager', 'cache_viewer'],
                        actions: ['simulate_offline', 'show_cache', 'demonstrate_sync'],
                        narration: 'Experience 72-hour offline operation with intelligent data caching and background synchronization.'
                    },
                    {
                        id: 'achievements',
                        title: 'Educational Achievements',
                        duration: 60,
                        components: ['achievement_system', 'progress_tracker'],
                        actions: ['show_progress', 'unlock_badges', 'display_mastery'],
                        narration: 'Track your learning progress through NASA Farm Navigators\' comprehensive achievement system.'
                    }
                ]
            },

            quick_demo: {
                id: 'quick_demo',
                title: '⚡ Quick Feature Tour',
                description: 'Fast-paced overview of key NASA Farm Navigators features',
                duration: '5-7 minutes',
                category: 'overview',
                difficulty: 'beginner',
                location: {
                    latitude: 39.7391,
                    longitude: -104.9847,
                    name: 'Colorado Agricultural Test Site',
                    cropType: 'wheat',
                    farmSize: '200 hectares'
                },
                objectives: [
                    'Quick tour of NASA data integration',
                    'Basic pixel awareness demonstration',
                    'Simple soil moisture analysis',
                    'Highlight educational components'
                ],
                steps: [
                    {
                        id: 'quick_intro',
                        title: 'NASA Farm Navigators Overview',
                        duration: 30,
                        components: ['welcome_screen'],
                        actions: ['show_logo', 'highlight_nasa_apis'],
                        narration: 'NASA Farm Navigators: Agriculture meets satellite technology.'
                    },
                    {
                        id: 'data_demo',
                        title: 'Satellite Data in Action',
                        duration: 90,
                        components: ['data_tablet'],
                        actions: ['quick_data_fetch', 'show_multiple_sources'],
                        narration: 'Real NASA satellite data at your fingertips.'
                    },
                    {
                        id: 'pixel_demo',
                        title: 'Resolution Matters',
                        duration: 60,
                        components: ['multi_resolution'],
                        actions: ['compare_30m_250m_9km', 'show_coverage_difference'],
                        narration: 'See how pixel size affects what you can observe.'
                    },
                    {
                        id: 'education_demo',
                        title: 'Learn by Doing',
                        duration: 45,
                        components: ['education_engine'],
                        actions: ['mini_pixel_hunt', 'show_achievements'],
                        narration: 'Interactive learning makes satellite data accessible.'
                    },
                    {
                        id: 'conclusion',
                        title: 'Ready to Explore',
                        duration: 15,
                        components: ['call_to_action'],
                        actions: ['show_full_features', 'start_tutorial'],
                        narration: 'Start your journey into satellite-powered agriculture.'
                    }
                ]
            },

            technical_deep_dive: {
                id: 'technical_deep_dive',
                title: 'Technical Architecture Demo',
                description: 'In-depth exploration of technical implementation and NASA API integrations',
                duration: '20-25 minutes',
                category: 'technical',
                difficulty: 'advanced',
                location: {
                    latitude: 36.7783,
                    longitude: -119.4179,
                    name: 'Central Valley California Research Station',
                    cropType: 'almonds',
                    farmSize: '1000 hectares'
                },
                objectives: [
                    'Demonstrate NASA API integration architecture',
                    'Show real-time data processing capabilities',
                    'Exhibit caching and offline functionality',
                    'Display technical performance metrics',
                    'Showcase PWA and service worker implementation'
                ],
                steps: [
                    {
                        id: 'architecture_overview',
                        title: 'System Architecture',
                        duration: 120,
                        components: ['architecture_diagram', 'component_viewer'],
                        actions: ['show_singleton_pattern', 'display_dependency_injection', 'highlight_event_system'],
                        narration: 'Explore the robust architecture powering NASA Farm Navigators.'
                    },
                    {
                        id: 'api_integration',
                        title: 'NASA API Deep Dive',
                        duration: 180,
                        components: ['api_monitor', 'data_flow_viewer'],
                        actions: ['live_appeears_call', 'real_smap_fetch', 'worldview_imagery', 'show_error_handling'],
                        narration: 'See live NASA API calls and data processing in action.'
                    },
                    {
                        id: 'performance_metrics',
                        title: 'Performance Analysis',
                        duration: 90,
                        components: ['performance_dashboard', 'metrics_viewer'],
                        actions: ['show_load_times', 'display_memory_usage', 'cache_efficiency'],
                        narration: 'Performance metrics demonstrating optimized satellite data handling.'
                    },
                    {
                        id: 'offline_architecture',
                        title: 'Offline System Design',
                        duration: 150,
                        components: ['service_worker_viewer', 'cache_inspector'],
                        actions: ['show_72_hour_capability', 'demonstrate_background_sync', 'cache_strategies'],
                        narration: 'Advanced caching strategies enable 72-hour offline operation.'
                    },
                    {
                        id: 'pwa_features',
                        title: 'Progressive Web App',
                        duration: 90,
                        components: ['pwa_manager', 'install_prompt'],
                        actions: ['show_installability', 'demonstrate_native_features', 'offline_first'],
                        narration: 'Native app experience through progressive web app technology.'
                    }
                ]
            },

            education_focused: {
                id: 'education_focused',
                title: '🎓 Educational Experience Demo',
                description: 'Comprehensive demonstration of learning features and gamification',
                duration: '12-15 minutes',
                category: 'education',
                difficulty: 'beginner',
                location: {
                    latitude: 41.2524,
                    longitude: -95.9980,
                    name: 'University of Nebraska Agricultural Extension',
                    cropType: 'soybeans',
                    farmSize: '300 hectares'
                },
                objectives: [
                    'Complete pixel awareness training program',
                    'Master SMAP depth analysis concepts',
                    'Experience adaptive learning system',
                    'Earn educational achievements',
                    'Understand real-world agricultural applications'
                ],
                steps: [
                    {
                        id: 'learning_path',
                        title: 'Personalized Learning Journey',
                        duration: 90,
                        components: ['education_engine', 'progress_tracker'],
                        actions: ['assess_knowledge', 'create_learning_path', 'show_adaptive_content'],
                        narration: 'Your personalized path through satellite agriculture education.'
                    },
                    {
                        id: 'pixel_mastery',
                        title: 'Pixel Resolution Mastery',
                        duration: 240,
                        components: ['pixel_hunt_advanced', 'resolution_challenges'],
                        actions: ['complete_pixel_hunts', 'master_scale_concepts', 'real_world_scenarios'],
                        narration: 'Master the critical concept of satellite resolution through interactive challenges.'
                    },
                    {
                        id: 'depth_expertise',
                        title: 'Soil Moisture Depth Analysis',
                        duration: 180,
                        components: ['depth_analyzer_tutorial', 'soil_profile_explorer'],
                        actions: ['learn_l3_vs_l4', 'crop_root_analysis', 'irrigation_planning'],
                        narration: 'Become an expert in SMAP soil moisture depth interpretation.'
                    },
                    {
                        id: 'practical_application',
                        title: 'Real-World Applications',
                        duration: 150,
                        components: ['scenario_simulator', 'decision_maker'],
                        actions: ['drought_response', 'irrigation_optimization', 'crop_monitoring'],
                        narration: 'Apply your satellite data knowledge to real agricultural decisions.'
                    },
                    {
                        id: 'achievement_showcase',
                        title: 'Learning Achievement',
                        duration: 60,
                        components: ['achievement_gallery', 'certification_viewer'],
                        actions: ['unlock_expert_badges', 'generate_certificate', 'share_achievements'],
                        narration: 'Celebrate your mastery of satellite-powered agriculture.'
                    }
                ]
            },

            nasa_compliance: {
                id: 'nasa_compliance',
                title: '🏆 NASA Space Apps Challenge Compliance',
                description: 'Demonstrate full compliance with NASA Space Apps Challenge requirements',
                duration: '10-12 minutes',
                category: 'compliance',
                difficulty: 'intermediate',
                location: {
                    latitude: 38.9072,
                    longitude: -77.0369,
                    name: 'NASA Goddard Space Flight Center Demo Area',
                    cropType: 'demonstration',
                    farmSize: '100 hectares'
                },
                objectives: [
                    'Verify multi-resolution satellite support',
                    'Confirm educational effectiveness',
                    'Validate NASA data integration',
                    'Demonstrate offline capabilities',
                    'Show technical innovation'
                ],
                steps: [
                    {
                        id: 'multi_resolution_compliance',
                        title: 'Multi-Resolution Requirements ✅',
                        duration: 120,
                        components: ['resolution_validator', 'data_sources'],
                        actions: ['verify_landsat_30m', 'confirm_modis_250m', 'validate_smap_9km'],
                        narration: 'Full compliance with multi-resolution satellite data requirements.'
                    },
                    {
                        id: 'educational_effectiveness',
                        title: 'Educational Impact ✅',
                        duration: 150,
                        components: ['education_metrics', 'learning_analytics'],
                        actions: ['demonstrate_pixel_learning', 'show_engagement_metrics', 'validate_knowledge_transfer'],
                        narration: 'Proven educational effectiveness through interactive learning experiences.'
                    },
                    {
                        id: 'nasa_integration',
                        title: 'NASA API Integration ✅',
                        duration: 120,
                        components: ['api_validator', 'authentication_demo'],
                        actions: ['live_appeears_demo', 'real_smap_data', 'worldview_integration', 'oauth_flow'],
                        narration: 'Authentic NASA data integration with proper authentication and APIs.'
                    },
                    {
                        id: 'offline_validation',
                        title: '72-Hour Offline Operation ✅',
                        duration: 90,
                        components: ['offline_validator', 'cache_monitor'],
                        actions: ['simulate_72_hour_test', 'verify_full_functionality', 'demonstrate_sync'],
                        narration: 'Complete offline functionality for 72-hour independent operation.'
                    },
                    {
                        id: 'innovation_showcase',
                        title: 'Technical Innovation 🌟',
                        duration: 90,
                        components: ['innovation_highlights', 'bonus_features'],
                        actions: ['show_pwa_capabilities', 'advanced_caching', 'context_adaptation', 'real_time_sync'],
                        narration: 'Technical innovations that exceed NASA Space Apps Challenge requirements.'
                    }
                ]
            }
        };

        this.componentRegistry = new Map();
        this.init();
    }

    init() {
        console.log('Initializing Demo Scenarios...');
        this.setupEventListeners();
        this.registerComponents();
    }

    setupEventListeners() {
        if (!this.eventSystem) return;

        this.eventSystem.on('demo-start-requested', this.handleDemoStart.bind(this));
        this.eventSystem.on('demo-step-complete', this.handleStepComplete.bind(this));
        this.eventSystem.on('demo-pause-requested', this.pauseDemo.bind(this));
        this.eventSystem.on('demo-resume-requested', this.resumeDemo.bind(this));
        this.eventSystem.on('demo-stop-requested', this.stopDemo.bind(this));
    }

    registerComponents() {
        // Register all available components for demo scenarios
        this.componentRegistry.set('welcome_screen', this.createWelcomeScreen.bind(this));
        this.componentRegistry.set('data_tablet', this.createDataTablet.bind(this));
        this.componentRegistry.set('multi_resolution', this.createMultiResolution.bind(this));
        this.componentRegistry.set('resolution_manager', this.createResolutionManager.bind(this));
        this.componentRegistry.set('pixel_hunt', this.createPixelHunt.bind(this));
        this.componentRegistry.set('depth_analyzer', this.createDepthAnalyzer.bind(this));
        this.componentRegistry.set('soil_profile', this.createSoilProfile.bind(this));
        this.componentRegistry.set('temporal_tools', this.createTemporalTools.bind(this));
        this.componentRegistry.set('trend_analysis', this.createTrendAnalysis.bind(this));
        this.componentRegistry.set('orbit_visualizer', this.createOrbitVisualizer.bind(this));
        this.componentRegistry.set('3d_globe', this.create3DGlobe.bind(this));
        this.componentRegistry.set('comparison_tools', this.createComparisonTools.bind(this));
        this.componentRegistry.set('data_fusion', this.createDataFusion.bind(this));
        this.componentRegistry.set('offline_manager', this.createOfflineManager.bind(this));
        this.componentRegistry.set('cache_viewer', this.createCacheViewer.bind(this));
        this.componentRegistry.set('achievement_system', this.createAchievementSystem.bind(this));
        this.componentRegistry.set('progress_tracker', this.createProgressTracker.bind(this));
        this.componentRegistry.set('education_engine', this.createEducationEngine.bind(this));
        this.componentRegistry.set('call_to_action', this.createCallToAction.bind(this));
    }

    createDemoInterface(container) {
        this.container = container;
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="demo-scenarios-container">
                <div class="demo-header">
                    <h1>🎬 NASA Farm Navigators Demo Center</h1>
                    <p>Experience the complete NASA Farm Navigators platform through guided demonstrations</p>
                </div>

                <div class="demo-selection">
                    <h2>Choose Your Demo Experience</h2>
                    <div class="scenarios-grid">
                        ${Object.values(this.scenarios).map(scenario => `
                            <div class="scenario-card" data-scenario="${scenario.id}">
                                <div class="scenario-header">
                                    <h3>${scenario.title}</h3>
                                    <div class="scenario-meta">
                                        <span class="duration">⏱️ ${scenario.duration}</span>
                                        <span class="category">${scenario.category}</span>
                                        <span class="difficulty ${scenario.difficulty}">
                                            ${this.getDifficultyIcon(scenario.difficulty)} ${scenario.difficulty}
                                        </span>
                                    </div>
                                </div>

                                <p class="scenario-description">${scenario.description}</p>

                                <div class="scenario-details">
                                    <div class="location-info">
                                        <h4>Demo Location</h4>
                                        <p>${scenario.location.name}</p>
                                        <div class="location-meta">
                                            <span>Crop: ${scenario.location.cropType}</span>
                                            <span>Size: ${scenario.location.farmSize}</span>
                                        </div>
                                    </div>

                                    <div class="objectives-info">
                                        <h4>Demo Objectives</h4>
                                        <ul class="objectives-list">
                                            ${scenario.objectives.slice(0, 3).map(obj =>
                                                `<li>${obj}</li>`
                                            ).join('')}
                                            ${scenario.objectives.length > 3 ?
                                                `<li class="more-objectives">...and ${scenario.objectives.length - 3} more</li>`
                                                : ''
                                            }
                                        </ul>
                                    </div>

                                    <div class="steps-preview">
                                        <h4>📋 Demo Steps (${scenario.steps.length})</h4>
                                        <div class="steps-timeline">
                                            ${scenario.steps.map((step, index) => `
                                                <div class="step-preview" data-step="${step.id}">
                                                    <div class="step-number">${index + 1}</div>
                                                    <div class="step-info">
                                                        <div class="step-title">${step.title}</div>
                                                        <div class="step-duration">${step.duration}s</div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div class="scenario-actions">
                                    <button class="demo-btn start-demo" onclick="demoScenarios.startDemo('${scenario.id}')">
                                        ▶️ Start Demo
                                    </button>
                                    <button class="demo-btn preview-demo" onclick="demoScenarios.previewDemo('${scenario.id}')">
                                        👁️ Preview
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="demo-controls" id="demo-controls" style="display: none;">
                    <div class="controls-header">
                        <h3 id="current-demo-title">Demo Controls</h3>
                        <div class="demo-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="progress-fill"></div>
                            </div>
                            <span id="progress-text">0 / 0</span>
                        </div>
                    </div>

                    <div class="controls-content">
                        <div class="playback-controls">
                            <button class="control-btn" id="pause-btn" onclick="demoScenarios.pauseDemo()">Pause</button>
                            <button class="control-btn" id="resume-btn" onclick="demoScenarios.resumeDemo()" style="display: none;">▶️ Resume</button>
                            <button class="control-btn" id="stop-btn" onclick="demoScenarios.stopDemo()">⏹️ Stop</button>
                            <button class="control-btn" id="next-btn" onclick="demoScenarios.nextStep()">⏭️ Next</button>
                        </div>

                        <div class="speed-controls">
                            <label>Speed:</label>
                            <select id="demo-speed" onchange="demoScenarios.setSpeed(this.value)">
                                <option value="slow">🐌 Slow (1.5x time)</option>
                                <option value="normal" selected>⚡ Normal</option>
                                <option value="fast">Fast (0.5x time)</option>
                            </select>
                        </div>

                        <div class="auto-advance">
                            <label>
                                <input type="checkbox" id="auto-advance" checked onchange="demoScenarios.setAutoAdvance(this.checked)">
                                Auto-advance steps
                            </label>
                        </div>
                    </div>

                    <div class="current-step-info" id="current-step-info">
                        <!-- Current step information will be displayed here -->
                    </div>
                </div>

                <div class="demo-viewport" id="demo-viewport" style="display: none;">
                    <!-- Demo content will be rendered here -->
                </div>

                <div class="demo-features">
                    <h2>Demo Features</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🛰️</div>
                            <h3>Real NASA Data</h3>
                            <p>Live integration with MODIS, SMAP, Landsat, and GPM satellite data</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🎓</div>
                            <h3>Interactive Learning</h3>
                            <p>Gamified education with pixel hunts and achievement systems</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📱</div>
                            <h3>Offline Capable</h3>
                            <p>72-hour offline operation with PWA installation</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔬</div>
                            <h3>Advanced Analysis</h3>
                            <p>Temporal analysis, correlation studies, and predictive modeling</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners(container);
        return container;
    }

    getDifficultyIcon(difficulty) {
        switch (difficulty) {
            case 'beginner': return '🌱';
            case 'intermediate': return '🌿';
            case 'advanced': return '🌳';
            default: return '📊';
        }
    }

    attachEventListeners(container) {
        // Add hover effects and interactions
        const scenarioCards = container.querySelectorAll('.scenario-card');
        scenarioCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    async startDemo(scenarioId) {
        const scenario = this.scenarios[scenarioId];
        if (!scenario) {
            console.error('Scenario not found:', scenarioId);
            return;
        }

        console.log(`Starting demo: ${scenario.title}`);

        this.currentScenario = scenario;
        this.demoState = {
            isRunning: true,
            currentStep: 0,
            totalSteps: scenario.steps.length,
            autoAdvance: true,
            speed: 'normal'
        };

        this.showDemoControls();
        this.updateProgressDisplay();

        // Initialize demo viewport
        const viewport = document.getElementById('demo-viewport');
        viewport.style.display = 'block';
        viewport.innerHTML = '<div class="demo-loading">Initializing demo...</div>';

        // Start first step
        setTimeout(() => {
            this.executeStep(scenario.steps[0]);
        }, 1000);

        this.eventSystem.emit('demo-started', {
            scenario: scenario,
            timestamp: Date.now()
        });
    }

    async executeStep(step) {
        console.log(`Executing step: ${step.title}`);

        const viewport = document.getElementById('demo-viewport');
        const stepInfo = document.getElementById('current-step-info');

        // Update step information
        stepInfo.innerHTML = `
            <div class="step-display">
                <div class="step-header">
                    <h3>${step.title}</h3>
                    <div class="step-duration">Duration: ${step.duration}s</div>
                </div>
                <div class="step-narration">
                    <p>${step.narration}</p>
                </div>
                <div class="step-components">
                    <strong>Active Components:</strong> ${step.components.join(', ')}
                </div>
                <div class="step-actions">
                    <strong>Actions:</strong> ${step.actions.join(', ')}
                </div>
            </div>
        `;

        // Create step viewport content
        const stepContent = await this.createStepContent(step);
        viewport.innerHTML = stepContent;

        // Execute step actions
        for (const action of step.actions) {
            await this.executeAction(action, step);
        }

        // Auto-advance if enabled
        if (this.demoState.autoAdvance && this.demoState.isRunning) {
            const duration = this.getAdjustedDuration(step.duration);
            setTimeout(() => {
                this.nextStep();
            }, duration * 1000);
        }
    }

    async createStepContent(step) {
        let content = `<div class="step-content" data-step="${step.id}">`;

        // Create components for this step
        for (const componentId of step.components) {
            const componentCreator = this.componentRegistry.get(componentId);
            if (componentCreator) {
                const componentHTML = await componentCreator(step);
                content += `<div class="component-container" data-component="${componentId}">${componentHTML}</div>`;
            } else {
                content += `<div class="component-placeholder" data-component="${componentId}">
                    <p>Component: ${componentId}</p>
                    <p>This would render the ${componentId} component in the full implementation</p>
                </div>`;
            }
        }

        content += '</div>';
        return content;
    }

    async executeAction(action, step) {
        console.log(`Executing action: ${action} for step: ${step.id}`);

        // Simulate action execution with visual feedback
        const viewport = document.getElementById('demo-viewport');
        const actionIndicator = document.createElement('div');
        actionIndicator.className = 'action-indicator';
        actionIndicator.textContent = `Executing: ${action}`;
        viewport.appendChild(actionIndicator);

        // Simulate action delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Remove action indicator
        actionIndicator.remove();

        // Emit action completed event
        this.eventSystem.emit('demo-action-completed', {
            action: action,
            step: step.id,
            timestamp: Date.now()
        });
    }

    nextStep() {
        if (!this.demoState.isRunning || !this.currentScenario) return;

        this.demoState.currentStep++;

        if (this.demoState.currentStep >= this.demoState.totalSteps) {
            this.completeDemo();
            return;
        }

        this.updateProgressDisplay();
        const nextStep = this.currentScenario.steps[this.demoState.currentStep];
        this.executeStep(nextStep);
    }

    pauseDemo() {
        this.demoState.isRunning = false;
        document.getElementById('pause-btn').style.display = 'none';
        document.getElementById('resume-btn').style.display = 'inline-block';
        console.log('Demo paused');
    }

    resumeDemo() {
        this.demoState.isRunning = true;
        document.getElementById('pause-btn').style.display = 'inline-block';
        document.getElementById('resume-btn').style.display = 'none';
        console.log('Demo resumed');
    }

    stopDemo() {
        this.demoState.isRunning = false;
        this.currentScenario = null;
        this.hideDemoControls();
        document.getElementById('demo-viewport').style.display = 'none';
        console.log('Demo stopped');
    }

    completeDemo() {
        console.log(`Demo completed: ${this.currentScenario.title}`);

        const viewport = document.getElementById('demo-viewport');
        viewport.innerHTML = `
            <div class="demo-completion">
                <div class="completion-header">
                    <h2>🎉 Demo Complete!</h2>
                    <h3>${this.currentScenario.title}</h3>
                </div>
                <div class="completion-summary">
                    <p>You've successfully experienced all ${this.demoState.totalSteps} steps of this demonstration.</p>
                    <div class="completion-stats">
                        <div class="stat">
                            <span class="stat-value">${this.demoState.totalSteps}</span>
                            <span class="stat-label">Steps Completed</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${this.currentScenario.duration}</span>
                            <span class="stat-label">Demo Duration</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${this.currentScenario.objectives.length}</span>
                            <span class="stat-label">Objectives Achieved</span>
                        </div>
                    </div>
                </div>
                <div class="completion-actions">
                    <button class="demo-btn" onclick="demoScenarios.startTutorial()">
                        🎓 Start Interactive Tutorial
                    </button>
                    <button class="demo-btn" onclick="demoScenarios.exploreFeatures()">
                        Explore Full Platform
                    </button>
                    <button class="demo-btn" onclick="demoScenarios.selectNewDemo()">
                        🎬 Try Another Demo
                    </button>
                </div>
            </div>
        `;

        this.eventSystem.emit('demo-completed', {
            scenario: this.currentScenario,
            duration: this.getTotalDuration(),
            timestamp: Date.now()
        });

        setTimeout(() => {
            this.stopDemo();
        }, 5000);
    }

    previewDemo(scenarioId) {
        const scenario = this.scenarios[scenarioId];
        if (!scenario) return;

        const modal = document.createElement('div');
        modal.className = 'demo-preview-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${scenario.title}</h2>
                    <button class="modal-close" onclick="this.closest('.demo-preview-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="preview-details">
                        <div class="preview-meta">
                            <span class="duration">⏱️ ${scenario.duration}</span>
                            <span class="category">${scenario.category}</span>
                            <span class="difficulty ${scenario.difficulty}">
                                ${this.getDifficultyIcon(scenario.difficulty)} ${scenario.difficulty}
                            </span>
                        </div>
                        <p class="description">${scenario.description}</p>
                    </div>

                    <div class="preview-timeline">
                        <h3>Demo Timeline</h3>
                        <div class="timeline-container">
                            ${scenario.steps.map((step, index) => `
                                <div class="timeline-step">
                                    <div class="timeline-marker">${index + 1}</div>
                                    <div class="timeline-content">
                                        <h4>${step.title}</h4>
                                        <p class="timeline-narration">${step.narration}</p>
                                        <div class="timeline-meta">
                                            <span class="duration">${step.duration}s</span>
                                            <span class="components">${step.components.length} components</span>
                                            <span class="actions">${step.actions.length} actions</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="preview-objectives">
                        <h3>Learning Objectives</h3>
                        <ul>
                            ${scenario.objectives.map(obj => `<li>${obj}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="demo-btn" onclick="demoScenarios.startDemo('${scenarioId}'); this.closest('.demo-preview-modal').remove();">
                        ▶️ Start This Demo
                    </button>
                    <button class="demo-btn secondary" onclick="this.closest('.demo-preview-modal').remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showDemoControls() {
        document.getElementById('demo-controls').style.display = 'block';
        document.getElementById('current-demo-title').textContent = `Demo: ${this.currentScenario.title}`;
    }

    hideDemoControls() {
        document.getElementById('demo-controls').style.display = 'none';
    }

    updateProgressDisplay() {
        if (!this.currentScenario) return;

        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        const percentage = (this.demoState.currentStep / this.demoState.totalSteps) * 100;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${this.demoState.currentStep} / ${this.demoState.totalSteps}`;
    }

    setSpeed(speed) {
        this.demoState.speed = speed;
        console.log('Demo speed set to:', speed);
    }

    setAutoAdvance(enabled) {
        this.demoState.autoAdvance = enabled;
        console.log('Auto-advance set to:', enabled);
    }

    getAdjustedDuration(baseDuration) {
        const multipliers = {
            slow: 1.5,
            normal: 1.0,
            fast: 0.5
        };
        return baseDuration * multipliers[this.demoState.speed];
    }

    getTotalDuration() {
        if (!this.currentScenario) return 0;
        return this.currentScenario.steps.reduce((total, step) => total + step.duration, 0);
    }

    // Component creation methods
    async createWelcomeScreen(step) {
        return `
            <div class="welcome-screen">
                <div class="hero-section">
                    <div class="logo-animation">🚀🛰️🌱</div>
                    <h1>NASA Farm Navigators</h1>
                    <p class="tagline">Agricultural Intelligence from Space</p>
                    <div class="nasa-apis">
                        <span class="api-badge">MODIS</span>
                        <span class="api-badge">SMAP</span>
                        <span class="api-badge">Landsat</span>
                        <span class="api-badge">GPM</span>
                    </div>
                </div>
            </div>
        `;
    }

    async createDataTablet(step) {
        return `
            <div class="data-tablet-demo">
                <div class="tablet-interface">
                    <h3>Real-Time NASA Data Integration</h3>
                    <div class="data-sources">
                        <div class="data-source active" data-source="modis">
                            <h4>MODIS NDVI</h4>
                            <div class="data-value">0.75</div>
                            <div class="data-meta">250m resolution • Terra satellite</div>
                        </div>
                        <div class="data-source active" data-source="smap">
                            <h4>SMAP Soil Moisture</h4>
                            <div class="data-value">0.32</div>
                            <div class="data-meta">9km resolution • L3 surface</div>
                        </div>
                        <div class="data-source active" data-source="landsat">
                            <h4>Landsat 8 NDVI</h4>
                            <div class="data-value">0.78</div>
                            <div class="data-meta">30m resolution • OLI sensor</div>
                        </div>
                    </div>
                    <div class="live-indicator">
                        <div class="pulse"></div>
                        <span>Live NASA Data</span>
                    </div>
                </div>
            </div>
        `;
    }

    async createMultiResolution(step) {
        return `
            <div class="multi-resolution-demo">
                <h3>Pixel Resolution Comparison</h3>
                <div class="resolution-grid">
                    <div class="resolution-panel" data-resolution="30m">
                        <h4>Landsat 8 (30m)</h4>
                        <div class="pixel-visualization">
                            <div class="pixel-grid landsat"></div>
                        </div>
                        <p>High detail • Field-level analysis</p>
                    </div>
                    <div class="resolution-panel" data-resolution="250m">
                        <h4>MODIS (250m)</h4>
                        <div class="pixel-visualization">
                            <div class="pixel-grid modis"></div>
                        </div>
                        <p>Regional monitoring • Daily coverage</p>
                    </div>
                    <div class="resolution-panel" data-resolution="9km">
                        <h4>SMAP (9km)</h4>
                        <div class="pixel-visualization">
                            <div class="pixel-grid smap"></div>
                        </div>
                        <p>Landscape scale • Soil moisture</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Additional component creation methods would continue here...
    async createResolutionManager(step) {
        return `<div class="resolution-manager-demo">Resolution management component active</div>`;
    }

    async createPixelHunt(step) {
        return `<div class="pixel-hunt-demo">Pixel hunt challenge ready</div>`;
    }

    async createDepthAnalyzer(step) {
        return `<div class="depth-analyzer-demo">SMAP depth analyzer active</div>`;
    }

    async createSoilProfile(step) {
        return `<div class="soil-profile-demo">Soil profile visualization</div>`;
    }

    async createTemporalTools(step) {
        return `<div class="temporal-tools-demo">Temporal analysis tools ready</div>`;
    }

    async createTrendAnalysis(step) {
        return `<div class="trend-analysis-demo">Trend analysis in progress</div>`;
    }

    async createOrbitVisualizer(step) {
        return `<div class="orbit-visualizer-demo">3D satellite orbit visualization</div>`;
    }

    async create3DGlobe(step) {
        return `<div class="3d-globe-demo">Interactive 3D globe active</div>`;
    }

    async createComparisonTools(step) {
        return `<div class="comparison-tools-demo">Multi-source comparison tools</div>`;
    }

    async createDataFusion(step) {
        return `<div class="data-fusion-demo">Data fusion algorithms active</div>`;
    }

    async createOfflineManager(step) {
        return `<div class="offline-manager-demo">Offline capability demonstration</div>`;
    }

    async createCacheViewer(step) {
        return `<div class="cache-viewer-demo">Cache inspection interface</div>`;
    }

    async createAchievementSystem(step) {
        return `<div class="achievement-system-demo">Educational achievements unlocked</div>`;
    }

    async createProgressTracker(step) {
        return `<div class="progress-tracker-demo">Learning progress visualization</div>`;
    }

    async createEducationEngine(step) {
        return `<div class="education-engine-demo">Adaptive learning system active</div>`;
    }

    async createCallToAction(step) {
        return `
            <div class="call-to-action-demo">
                <h3>Ready to Start Your Agricultural Space Journey? 🚀</h3>
                <div class="action-buttons">
                    <button class="cta-btn primary">🎓 Start Tutorial</button>
                    <button class="cta-btn secondary">🚜 Explore Platform</button>
                </div>
            </div>
        `;
    }

    // Demo completion actions
    startTutorial() {
        console.log('Starting interactive tutorial...');
        // Would integrate with InteractiveTutorial component
    }

    exploreFeatures() {
        console.log('Exploring full platform...');
        // Would return to main application
    }

    selectNewDemo() {
        this.stopDemo();
        console.log('Returning to demo selection...');
    }

    // Event handlers
    handleDemoStart(data) {
        console.log('Demo start event:', data);
    }

    handleStepComplete(data) {
        console.log('Step complete event:', data);
    }
}

// Make available globally for demo interface interactions
if (typeof window !== 'undefined') {
    window.DemoScenarios = DemoScenarios;
}

// ES6 export
export { DemoScenarios };