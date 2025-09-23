/**
 * NASA Farm Navigators - Interactive Tutorial System
 * Comprehensive guided tour for new users
 * Teaches satellite data concepts through hands-on experience
 */

import { EventSystem } from '../utils/EventSystem.js';

class InteractiveTutorial {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.container = null;
        this.eventSystem = gameEngine ? gameEngine.getEventSystem() : EventSystem.getInstance();

        // Tutorial state
        this.currentStep = 0;
        this.isActive = false;
        this.userProgress = {
            completedSteps: new Set(),
            achievements: new Set(),
            timeSpent: 0,
            interactions: 0
        };

        // Tutorial configuration
        this.tutorial = {
            id: 'nasa_farm_navigators_intro',
            title: 'NASA Farm Navigators Tutorial',
            description: 'Learn to use satellite data for agricultural monitoring',
            estimatedTime: 15, // minutes
            difficulty: 'beginner',
            steps: [] // Will be initialized later
        };

        // UI elements
        this.overlay = null;
        this.tutorialBox = null;
        this.highlightElement = null;

        // Animation and interaction state
        this.animationFrame = null;
        this.highlightAnimation = null;
    }

    /**
     * Create interface - Main entry point for navigation system
     */
    async createInterface(container) {
        this.container = container;
        if (!this.container) return;

        // Initialize tutorial steps if not already done
        if (this.tutorial.steps.length === 0) {
            this.tutorial.steps = this.initializeTutorialSteps();
        }

        this.container.innerHTML = `
            <div class="tutorial-launcher">
                <div class="tutorial-hero">
                    <h2>🎓 Interactive NASA Farm Navigators Tutorial</h2>
                    <p>Learn to navigate satellite data and agricultural monitoring through our comprehensive guided tour.</p>

                    <div class="tutorial-options">
                        <div class="tutorial-card">
                            <h3>Full Tutorial</h3>
                            <p>Complete guided experience covering all NASA Farm Navigators features</p>
                            <button class="tutorial-btn" onclick="interactiveTutorial.startTutorial()">
                                Start Complete Tutorial
                            </button>
                        </div>

                        <div class="tutorial-card">
                            <h3>Quick Start</h3>
                            <p>Brief introduction to core concepts and navigation</p>
                            <button class="tutorial-btn" onclick="interactiveTutorial.startQuickTour()">
                                Quick Tour
                            </button>
                        </div>

                        <div class="tutorial-card">
                            <h3>Data Exploration</h3>
                            <p>Focus on satellite data interpretation and analysis</p>
                            <button class="tutorial-btn" onclick="interactiveTutorial.startDataTutorial()">
                                Data Tutorial
                            </button>
                        </div>
                    </div>

                    <div class="tutorial-progress">
                        <h4>Your Progress</h4>
                        <div class="progress-summary" id="tutorialProgress">
                            <p>Ready to begin your learning journey!</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load and display any existing progress
        this.displayProgressSummary();
        return container;
    }

    displayProgressSummary() {
        const progress = this.loadTutorialProgress();
        const progressElement = document.getElementById('tutorialProgress');

        if (progress.completedSteps && progress.completedSteps.length > 0) {
            progressElement.innerHTML = `
                <p>Progress: ${progress.completedSteps.length} of ${this.config.steps.length} steps completed</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(progress.completedSteps.length / this.config.steps.length) * 100}%"></div>
                </div>
                <button class="tutorial-btn secondary" onclick="interactiveTutorial.resumeTutorial()">
                    Resume Tutorial
                </button>
            `;
        }
    }

    startQuickTour() {
        // Start with just the first few essential steps
        const quickSteps = this.config.steps.slice(0, 3);
        this.config.steps = quickSteps;
        this.startTutorial();
    }

    startDataTutorial() {
        // Focus on data-related steps
        const dataSteps = this.config.steps.filter(step =>
            step.title.includes('Data') || step.title.includes('Resolution') || step.title.includes('Analysis')
        );
        this.config.steps = dataSteps;
        this.startTutorial();
    }

    resumeTutorial() {
        const progress = this.loadTutorialProgress();
        if (progress.currentStep !== undefined) {
            this.state.currentStepIndex = progress.currentStep;
        }
        this.startTutorial();
    }

    /**
     * Initialize tutorial steps
     */
    initializeTutorialSteps() {
        return [
            {
                id: 'welcome',
                title: 'Welcome to NASA Farm Navigators! 🚀',
                content: `
                    <div class="tutorial-welcome">
                        <div class="welcome-header">
                            <div class="nasa-logo-tutorial">NASA</div>
                            <h3>Farm Navigators</h3>
                        </div>
                        <p>Welcome to your journey into space-based agriculture! You'll learn how NASA satellites help farmers make better decisions.</p>
                        <div class="tutorial-features">
                            <div class="feature-item">
                                <span class="feature-icon">🛰️</span>
                                <span>Real NASA satellite data</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">🎓</span>
                                <span>Interactive learning</span>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">🌱</span>
                                <span>Agricultural applications</span>
                            </div>
                        </div>
                    </div>
                `,
                position: 'center',
                buttons: ['Start Tutorial'],
                highlight: null,
                action: 'introduction',
                duration: 30
            },
            {
                id: 'interface_overview',
                title: 'Platform Overview 📋',
                content: `
                    <p>Let's explore the main interface. NASA Farm Navigators has three key areas:</p>
                    <ul>
                        <li><strong>Left Panel:</strong> Educational modules and progress tracking</li>
                        <li><strong>Center Panel:</strong> Data visualization and analysis tools</li>
                        <li><strong>Right Panel:</strong> Depth analysis and farm context settings</li>
                    </ul>
                    <p>Take a moment to look around the interface.</p>
                `,
                position: 'center',
                buttons: ['Continue'],
                highlight: '.app-main',
                action: 'interface_tour',
                duration: 45
            },
            {
                id: 'resolution_concept',
                title: 'Understanding Satellite Resolution 🔍',
                content: `
                    <p>Satellite resolution determines how much detail you can see. Think of it like zoom levels on a camera:</p>
                    <div class="resolution-examples">
                        <div class="res-example">
                            <strong>Landsat 30m:</strong> Can see individual trees and small buildings
                        </div>
                        <div class="res-example">
                            <strong>MODIS 250m:</strong> Can see large fields and forest patches
                        </div>
                        <div class="res-example">
                            <strong>SMAP 9km:</strong> Can see regional patterns and climate zones
                        </div>
                    </div>
                    <p>Different resolutions are useful for different purposes!</p>
                `,
                position: 'left',
                buttons: ['Try Resolution Explorer'],
                highlight: '.resolution-controls',
                action: 'demo_resolution',
                duration: 60,
                interactive: true
            },
            {
                id: 'pixel_hunt_intro',
                title: 'Pixel Hunt Challenge 🎯',
                content: `
                    <p>Now let's practice with a Pixel Hunt! This mini-game helps you understand how resolution affects what you can identify in satellite images.</p>
                    <p>You'll be shown satellite images at different resolutions and asked to identify features like:</p>
                    <ul>
                        <li>Farm buildings</li>
                        <li>Field boundaries</li>
                        <li>Individual trees</li>
                        <li>Water bodies</li>
                    </ul>
                    <p>Ready to become a pixel detective?</p>
                `,
                position: 'right',
                buttons: ['Start Pixel Hunt'],
                highlight: '#pixelHuntArea',
                action: 'start_pixel_hunt',
                duration: 45,
                interactive: true
            },
            {
                id: 'smap_introduction',
                title: 'SMAP Soil Moisture Satellite 🛰️',
                content: `
                    <p>SMAP (Soil Moisture Active Passive) is NASA's soil moisture monitoring satellite. It provides two types of data:</p>
                    <div class="smap-info">
                        <div class="smap-product">
                            <h4>SMAP L3 - Surface Moisture</h4>
                            <p>Measures moisture in the top 5cm of soil</p>
                            <p>Good for: Seedling growth, surface irrigation planning</p>
                        </div>
                        <div class="smap-product">
                            <h4>SMAP L4 - Root Zone Moisture</h4>
                            <p>Estimates moisture down to 100cm depth</p>
                            <p>Good for: Mature crops, drought monitoring</p>
                        </div>
                    </div>
                `,
                position: 'left',
                buttons: ['Explore Soil Depth'],
                highlight: '#depthAnalysis',
                action: 'demo_depth_analysis',
                duration: 75,
                interactive: true
            },
            {
                id: 'depth_comparison',
                title: 'Surface vs Root Zone Analysis 🌱',
                content: `
                    <p>Let's compare surface and root zone moisture for the same location. This teaches you when to use each type of data.</p>
                    <div class="depth-guide">
                        <p><strong>Use Surface Data (L3) when:</strong></p>
                        <ul>
                            <li>Planning irrigation timing</li>
                            <li>Monitoring seedling establishment</li>
                            <li>Assessing immediate weather impacts</li>
                        </ul>
                        <p><strong>Use Root Zone Data (L4) when:</strong></p>
                        <ul>
                            <li>Monitoring mature crop water stress</li>
                            <li>Long-term drought assessment</li>
                            <li>Understanding plant-available water</li>
                        </ul>
                    </div>
                `,
                position: 'right',
                buttons: ['Try Depth Analysis'],
                highlight: '#depthSelect',
                action: 'interactive_depth_comparison',
                duration: 90,
                interactive: true
            },
            {
                id: 'farm_context',
                title: 'Farm Context Adaptation 🚜',
                content: `
                    <p>NASA Farm Navigators adapts to different farming contexts. Try switching between:</p>
                    <div class="context-info">
                        <div class="context-type">
                            <h4>Smallholder Farming</h4>
                            <p>• Focus on local, detailed analysis</p>
                            <p>• Simplified tools and interpretations</p>
                            <p>• Cost-effective recommendations</p>
                        </div>
                        <div class="context-type">
                            <h4>Industrial Farming</h4>
                            <p>• Regional-scale monitoring</p>
                            <p>• Advanced analytics and forecasting</p>
                            <p>• Fleet management integration</p>
                        </div>
                    </div>
                    <p>Notice how the interface changes to match your farming style!</p>
                `,
                position: 'right',
                buttons: ['Try Context Switch'],
                highlight: '#contextAdapter',
                action: 'demo_context_switching',
                duration: 60,
                interactive: true
            },
            {
                id: 'real_data_demo',
                title: 'Live NASA Data Integration 📡',
                content: `
                    <p>Now let's fetch real NASA satellite data! You'll see how the platform integrates multiple data sources:</p>
                    <ul>
                        <li><strong>SMAP:</strong> Soil moisture from space</li>
                        <li><strong>MODIS:</strong> Daily vegetation monitoring</li>
                        <li><strong>Landsat:</strong> High-resolution field analysis</li>
                        <li><strong>GPM:</strong> Precipitation tracking</li>
                    </ul>
                    <p>Click the button below to fetch live data for New York City (our demo location).</p>
                `,
                position: 'center',
                buttons: ['Fetch Live Data'],
                highlight: '#dataDisplay',
                action: 'fetch_demo_data',
                duration: 120,
                interactive: true
            },
            {
                id: 'offline_capabilities',
                title: 'Offline Functionality 📱',
                content: `
                    <p>NASA Farm Navigators works offline for up to 72 hours! This is crucial for:</p>
                    <ul>
                        <li>Remote farming locations with poor connectivity</li>
                        <li>Emergency response situations</li>
                        <li>Field work away from internet access</li>
                    </ul>
                    <p>The platform automatically:</p>
                    <ul>
                        <li>📦 Caches recent satellite data</li>
                        <li>Syncs when connection returns</li>
                        <li>Generates synthetic data for training</li>
                    </ul>
                `,
                position: 'center',
                buttons: ['Test Offline Mode'],
                highlight: '#offlineMode',
                action: 'demo_offline',
                duration: 45
            },
            {
                id: 'achievements_progress',
                title: 'Learning Progress & Achievements 🏆',
                content: `
                    <p>Track your learning journey with our achievement system:</p>
                    <div class="achievement-examples">
                        <div class="achievement-item">
                            <span>🔍</span>
                            <div>
                                <strong>Pixel Detective</strong>
                                <p>Complete 5 pixel hunt challenges</p>
                            </div>
                        </div>
                        <div class="achievement-item">
                            <span>🌱</span>
                            <div>
                                <strong>Depth Master</strong>
                                <p>Master L3 vs L4 soil moisture concepts</p>
                            </div>
                        </div>
                        <div class="achievement-item">
                            <span>🛰️</span>
                            <div>
                                <strong>Satellite Explorer</strong>
                                <p>Explore all NASA satellite datasets</p>
                            </div>
                        </div>
                    </div>
                `,
                position: 'right',
                buttons: ['View Achievements'],
                highlight: '#achievementDisplay',
                action: 'show_achievements',
                duration: 45
            },
            {
                id: 'nasa_earthdata_auth',
                title: 'NASA Earthdata Authentication 🔐',
                content: `
                    <p>For access to the latest NASA satellite data, you can optionally authenticate with NASA Earthdata:</p>
                    <div class="auth-benefits">
                        <ul>
                            <li>Access to real-time satellite data</li>
                            <li>Higher data quotas and priority access</li>
                            <li>Advanced research datasets</li>
                            <li>Historical data archives</li>
                        </ul>
                    </div>
                    <p>Authentication is optional - the platform works great with demo data too!</p>
                    <p class="auth-note">💡 <em>Creating a NASA Earthdata account is free and supports NASA's mission to share Earth science data.</em></p>
                `,
                position: 'top',
                buttons: ['Learn More', 'Skip'],
                highlight: '#authButton',
                action: 'explain_auth',
                duration: 60
            },
            {
                id: 'tutorial_complete',
                title: 'Congratulations! 🎉',
                content: `
                    <div class="completion-celebration">
                        <div class="celebration-icon">🚀</div>
                        <h3>Tutorial Complete!</h3>
                        <p>You've successfully learned the basics of NASA Farm Navigators!</p>

                        <div class="completion-stats">
                            <div class="stat-item">
                                <span class="stat-number" id="tutorialTimeSpent">--</span>
                                <span class="stat-label">Minutes Spent</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number" id="tutorialInteractions">--</span>
                                <span class="stat-label">Interactions</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${this.tutorial.steps.length}</span>
                                <span class="stat-label">Steps Completed</span>
                            </div>
                        </div>

                        <div class="next-steps">
                            <h4>What's Next?</h4>
                            <ul>
                                <li>Complete pixel hunt challenges</li>
                                <li>Explore depth analysis scenarios</li>
                                <li>Try the real-time comparison tool</li>
                                <li>🏆 Unlock all achievements</li>
                            </ul>
                        </div>
                    </div>
                `,
                position: 'center',
                buttons: ['Start Exploring!'],
                highlight: null,
                action: 'complete_tutorial',
                duration: 60
            }
        ];
    }

    /**
     * Start the tutorial
     */
    async startTutorial() {
        if (this.isActive) return;

        this.isActive = true;
        this.currentStep = 0;
        this.userProgress.timeSpent = 0;
        this.userProgress.interactions = 0;
        this.userProgress.completedSteps.clear();

        // Create tutorial overlay
        this.createTutorialOverlay();

        // Start with first step
        await this.showStep(0);

        // Start timing
        this.startTime = Date.now();

        // Emit event
        this.eventSystem.emit('tutorial_started', {
            tutorialId: this.tutorial.id,
            totalSteps: this.tutorial.steps.length
        });
    }

    /**
     * Create the tutorial overlay
     */
    createTutorialOverlay() {
        // Remove existing overlay if present
        this.removeTutorialOverlay();

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div class="tutorial-box" id="tutorialBox">
                <!-- Dynamic content -->
            </div>
            <div class="tutorial-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="tutorialProgress"></div>
                </div>
                <div class="progress-text">
                    <span id="progressText">Step 1 of ${this.tutorial.steps.length}</span>
                    <button class="tutorial-close" id="tutorialClose">×</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Setup close handler
        document.getElementById('tutorialClose').addEventListener('click', () => {
            this.exitTutorial();
        });
    }

    /**
     * Show a specific tutorial step
     */
    async showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.tutorial.steps.length) return;

        const step = this.tutorial.steps[stepIndex];
        this.currentStep = stepIndex;

        // Update progress bar
        this.updateProgress();

        // Remove previous highlights
        this.removeHighlight();

        // Add highlight if specified
        if (step.highlight) {
            this.addHighlight(step.highlight);
        }

        // Update tutorial box
        this.updateTutorialBox(step);

        // Position tutorial box
        this.positionTutorialBox(step.position, step.highlight);

        // Execute step action
        if (step.action) {
            await this.executeStepAction(step.action, step);
        }

        // Mark step as completed
        this.userProgress.completedSteps.add(step.id);

        // Auto-advance timer for non-interactive steps
        if (!step.interactive && step.duration) {
            this.setupAutoAdvance(step.duration);
        }

        // Emit step event
        this.eventSystem.emit('tutorial_step_shown', {
            stepId: step.id,
            stepIndex: stepIndex,
            isInteractive: step.interactive || false
        });
    }

    /**
     * Update tutorial box content
     */
    updateTutorialBox(step) {
        const tutorialBox = document.getElementById('tutorialBox');
        if (!tutorialBox) return;

        tutorialBox.innerHTML = `
            <div class="tutorial-header">
                <h3>${step.title}</h3>
            </div>
            <div class="tutorial-content">
                ${step.content}
            </div>
            <div class="tutorial-actions">
                ${step.buttons.map((button, index) => `
                    <button class="tutorial-btn" data-action="${index}">
                        ${button}
                    </button>
                `).join('')}
                ${this.currentStep > 0 ? '<button class="tutorial-btn tutorial-btn-secondary" data-action="back">← Back</button>' : ''}
            </div>
        `;

        // Setup button handlers
        tutorialBox.querySelectorAll('.tutorial-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleTutorialAction(action, step);
            });
        });
    }

    /**
     * Handle tutorial button actions
     */
    async handleTutorialAction(action, step) {
        this.userProgress.interactions++;

        if (action === 'back') {
            await this.previousStep();
        } else if (action === '0') {
            // Primary action - usually "Next" or step-specific action
            if (step.interactive) {
                await this.executeInteractiveAction(step);
            } else {
                await this.nextStep();
            }
        } else {
            // Secondary actions
            await this.executeStepAction(step.action, step);
        }
    }

    /**
     * Execute step-specific actions
     */
    async executeStepAction(action, step) {
        switch (action) {
            case 'introduction':
                // Setup welcome animation
                this.animateWelcome();
                break;

            case 'interface_tour':
                // Highlight different interface areas
                this.animateInterfaceTour();
                break;

            case 'demo_resolution':
                // Demonstrate resolution slider
                this.demoResolutionSlider();
                break;

            case 'start_pixel_hunt':
                // Start a guided pixel hunt
                await this.startGuidedPixelHunt();
                break;

            case 'demo_depth_analysis':
                // Demonstrate depth analysis
                await this.demoDepthAnalysis();
                break;

            case 'interactive_depth_comparison':
                // Interactive depth comparison
                await this.interactiveDepthComparison();
                break;

            case 'demo_context_switching':
                // Demonstrate context switching
                this.demoContextSwitching();
                break;

            case 'fetch_demo_data':
                // Fetch and display real data
                await this.fetchDemoData();
                break;

            case 'demo_offline':
                // Demonstrate offline capabilities
                this.demoOfflineMode();
                break;

            case 'show_achievements':
                // Show achievement system
                this.showAchievements();
                break;

            case 'explain_auth':
                // Explain NASA authentication
                this.explainAuthentication();
                break;

            case 'complete_tutorial':
                // Complete tutorial
                await this.completeTutorial();
                break;
        }
    }

    /**
     * Specific action implementations
     */
    animateWelcome() {
        const welcomeElement = document.querySelector('.tutorial-welcome');
        if (welcomeElement) {
            welcomeElement.style.animation = 'fadeInUp 1s ease-out';
        }
    }

    animateInterfaceTour() {
        const panels = ['.left-panel', '.center-panel', '.right-panel'];
        let currentPanel = 0;

        const highlightNextPanel = () => {
            // Remove previous highlight
            panels.forEach(panel => {
                const element = document.querySelector(panel);
                if (element) element.classList.remove('tutorial-panel-highlight');
            });

            // Add current highlight
            if (currentPanel < panels.length) {
                const element = document.querySelector(panels[currentPanel]);
                if (element) {
                    element.classList.add('tutorial-panel-highlight');
                    currentPanel++;
                    setTimeout(highlightNextPanel, 1500);
                }
            }
        };

        highlightNextPanel();
    }

    demoResolutionSlider() {
        const slider = document.getElementById('resolutionRange');
        if (slider) {
            // Animate slider through different positions
            const positions = [0, 1, 2, 3];
            let currentPos = 0;

            const animateSlider = () => {
                if (currentPos < positions.length) {
                    slider.value = positions[currentPos];
                    slider.dispatchEvent(new Event('change'));
                    currentPos++;
                    setTimeout(animateSlider, 1000);
                }
            };

            animateSlider();
        }
    }

    async startGuidedPixelHunt() {
        try {
            const resolutionManager = this.gameEngine.getManagers().resolution;
            const pixelHunt = resolutionManager.startPixelHunt('tutorial');

            // Display the pixel hunt in tutorial mode
            this.displayTutorialPixelHunt(pixelHunt);
        } catch (error) {
            console.warn('Could not start guided pixel hunt:', error);
        }
    }

    async demoDepthAnalysis() {
        try {
            const depthAnalyzer = this.gameEngine.getManagers().depth;
            const analysis = await depthAnalyzer.analyzeMoistureByDepth('surface', {
                surface: 0.25,
                rootZone: 0.35
            });

            this.displayTutorialDepthAnalysis(analysis);
        } catch (error) {
            console.warn('Could not demo depth analysis:', error);
        }
    }

    async fetchDemoData() {
        try {
            const dataManager = this.gameEngine.getManagers().data;

            // Show loading animation
            this.showDataLoadingAnimation();

            // Fetch demo data
            const smapData = await dataManager.fetchSMAPData('surface', {
                latitude: 40.7128,
                longitude: -74.0060,
                date: '2024-01-01'
            });

            // Display the data with explanation
            this.displayDemoDataResults(smapData);

        } catch (error) {
            console.warn('Could not fetch demo data:', error);
        }
    }

    /**
     * Navigation methods
     */
    async nextStep() {
        if (this.currentStep < this.tutorial.steps.length - 1) {
            await this.showStep(this.currentStep + 1);
        } else {
            await this.completeTutorial();
        }
    }

    async previousStep() {
        if (this.currentStep > 0) {
            await this.showStep(this.currentStep - 1);
        }
    }

    /**
     * Complete the tutorial
     */
    async completeTutorial() {
        // Update completion stats
        this.userProgress.timeSpent = Math.round((Date.now() - this.startTime) / 60000); // minutes

        // Update completion display
        const timeElement = document.getElementById('tutorialTimeSpent');
        const interactionsElement = document.getElementById('tutorialInteractions');

        if (timeElement) timeElement.textContent = this.userProgress.timeSpent;
        if (interactionsElement) interactionsElement.textContent = this.userProgress.interactions;

        // Award completion achievement
        const educationEngine = this.gameEngine.getManagers().education;
        educationEngine?.unlockAchievement('tutorial_complete');

        // Show completion animation
        this.showCompletionAnimation();

        // Save progress
        this.saveTutorialProgress();

        // Emit completion event
        this.eventSystem.emit('tutorial_completed', {
            tutorialId: this.tutorial.id,
            timeSpent: this.userProgress.timeSpent,
            interactions: this.userProgress.interactions,
            completedSteps: Array.from(this.userProgress.completedSteps)
        });

        // Auto-close after celebration
        setTimeout(() => {
            this.exitTutorial();
        }, 5000);
    }

    /**
     * Exit tutorial
     */
    exitTutorial() {
        this.isActive = false;
        this.removeHighlight();
        this.removeTutorialOverlay();

        // Stop any ongoing animations
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        // Emit exit event
        this.eventSystem.emit('tutorial_exited', {
            tutorialId: this.tutorial.id,
            completedSteps: Array.from(this.userProgress.completedSteps),
            wasCompleted: this.userProgress.completedSteps.size === this.tutorial.steps.length
        });
    }

    /**
     * Utility methods
     */
    updateProgress() {
        const progressFill = document.getElementById('tutorialProgress');
        const progressText = document.getElementById('progressText');

        if (progressFill) {
            const progress = ((this.currentStep + 1) / this.tutorial.steps.length) * 100;
            progressFill.style.width = `${progress}%`;
        }

        if (progressText) {
            progressText.textContent = `Step ${this.currentStep + 1} of ${this.tutorial.steps.length}`;
        }
    }

    addHighlight(selector) {
        const element = document.querySelector(selector);
        if (element) {
            this.highlightElement = element;
            element.classList.add('tutorial-highlight');
            this.animateHighlight(element);
        }
    }

    removeHighlight() {
        if (this.highlightElement) {
            this.highlightElement.classList.remove('tutorial-highlight');
            this.highlightElement = null;
        }

        // Remove all tutorial-specific classes
        document.querySelectorAll('.tutorial-panel-highlight').forEach(el => {
            el.classList.remove('tutorial-panel-highlight');
        });
    }

    animateHighlight(element) {
        // Pulse animation for highlighted elements
        element.style.animation = 'tutorialPulse 2s infinite';
    }

    positionTutorialBox(position, highlightSelector) {
        const tutorialBox = document.getElementById('tutorialBox');
        if (!tutorialBox) return;

        // Reset positioning classes
        tutorialBox.className = 'tutorial-box';

        // Add position-specific class
        tutorialBox.classList.add(`tutorial-${position}`);

        // Adjust position based on highlighted element
        if (highlightSelector) {
            const highlightedElement = document.querySelector(highlightSelector);
            if (highlightedElement) {
                const rect = highlightedElement.getBoundingClientRect();

                // Position tutorial box relative to highlighted element
                switch (position) {
                    case 'left':
                        tutorialBox.style.left = `${Math.max(20, rect.left - 320)}px`;
                        tutorialBox.style.top = `${rect.top}px`;
                        break;
                    case 'right':
                        tutorialBox.style.left = `${Math.min(window.innerWidth - 320, rect.right + 20)}px`;
                        tutorialBox.style.top = `${rect.top}px`;
                        break;
                    case 'top':
                        tutorialBox.style.left = `${rect.left}px`;
                        tutorialBox.style.top = `${Math.max(20, rect.top - 200)}px`;
                        break;
                    case 'bottom':
                        tutorialBox.style.left = `${rect.left}px`;
                        tutorialBox.style.top = `${rect.bottom + 20}px`;
                        break;
                }
            }
        }
    }

    removeTutorialOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    setupAutoAdvance(duration) {
        // Clear any existing timer
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
        }

        // Set new timer
        this.autoAdvanceTimer = setTimeout(() => {
            this.nextStep();
        }, duration * 1000);
    }

    saveTutorialProgress() {
        try {
            const progress = {
                tutorialId: this.tutorial.id,
                completedSteps: Array.from(this.userProgress.completedSteps),
                timeSpent: this.userProgress.timeSpent,
                interactions: this.userProgress.interactions,
                completedAt: Date.now()
            };

            localStorage.setItem('nasa_farm_tutorial_progress', JSON.stringify(progress));
        } catch (error) {
            console.warn('Could not save tutorial progress:', error);
        }
    }

    loadTutorialProgress() {
        try {
            const saved = localStorage.getItem('nasa_farm_tutorial_progress');
            if (saved) {
                const progress = JSON.parse(saved);
                this.userProgress.completedSteps = new Set(progress.completedSteps);
                return progress;
            }
        } catch (error) {
            console.warn('Could not load tutorial progress:', error);
        }
        return null;
    }

    showCompletionAnimation() {
        const celebrationIcon = document.querySelector('.celebration-icon');
        if (celebrationIcon) {
            celebrationIcon.style.animation = 'bounceIn 1s ease-out, rotate 2s infinite linear 1s';
        }
    }

    // Helper methods for specific demonstrations
    displayTutorialPixelHunt(pixelHunt) {
        // Implementation for showing pixel hunt in tutorial context
    }

    displayTutorialDepthAnalysis(analysis) {
        // Implementation for showing depth analysis results
    }

    showDataLoadingAnimation() {
        // Implementation for data loading animation
    }

    displayDemoDataResults(data) {
        // Implementation for displaying demo data results
    }
}

export { InteractiveTutorial };