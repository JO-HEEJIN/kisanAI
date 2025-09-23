class DrVegaMentor {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.panel = document.getElementById('dr-vega-panel');
        this.textElement = document.getElementById('vega-text');
        this.continueButton = document.getElementById('vega-continue');

        this.currentTutorial = null;
        this.tutorialStep = 0;
        this.isVisible = false;

        this.tutorialMessages = this.initializeTutorialMessages();

        this.init();
    }

    init() {
        this.bindEvents();
        this.gameEngine.on('dataTabletOpened', () => this.onDataTabletOpened());
        this.gameEngine.on('irrigationApplied', (data) => this.onIrrigationApplied(data));
        this.gameEngine.on('weekAdvanced', (data) => this.onWeekAdvanced(data));
        this.gameEngine.on('toolChanged', (data) => this.onToolChanged(data));
    }

    bindEvents() {
        this.continueButton.addEventListener('click', () => {
            this.hide();
            this.processTutorialStep();
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isVisible &&
                !this.panel.contains(e.target) &&
                !e.target.classList.contains('mentor-trigger')) {
                this.hide();
            }
        });
    }

    initializeTutorialMessages() {
        return {
            welcome: {
                title: "Welcome to TerraData!",
                steps: [
                    "Hello! I'm Dr. Vega, a retired NASA agronomist. I'll teach you how to use satellite data for sustainable farming.",
                    "You've inherited a farm in Arizona, where water is precious and the climate is challenging. But with NASA's satellite data, we can farm smarter!",
                    "Let's start by understanding your field. Click the 'Data Tablet' button to see your farm from space!"
                ]
            },
            dataTabletIntro: {
                title: "Understanding Satellite Data",
                steps: [
                    "Excellent! This is your Data Tablet showing NDVI data from NASA's MODIS satellite. The colors represent vegetation health.",
                    "Green areas show healthy crops, while yellow and red areas indicate stressed vegetation that needs attention.",
                    "Try switching between the tabs to see different types of data: NDVI shows plant health, Soil Moisture shows water content, and Precipitation shows weather forecasts.",
                    "Now close the tablet and look at your farm. Can you spot the stressed areas that match the yellow zones on the satellite map?"
                ]
            },
            firstIrrigation: {
                title: "Precision Irrigation",
                steps: [
                    "Perfect! You can see the stressed areas in your field. Instead of watering the entire field (which wastes water), let's use precision irrigation.",
                    "Select the 'Irrigate' tool from the toolbar, then drag to select only the stressed yellow areas. This saves water while targeting the crops that need it most.",
                    "Watch your water budget in the top bar. Each zone costs 25 liters to irrigate, but precision irrigation can save you hundreds of liters compared to flooding the whole field!"
                ]
            },
            irrigationSuccess: {
                title: "Great Work!",
                steps: [
                    "Excellent! You've successfully applied precision irrigation. Notice how your sustainability score increased because you used water efficiently.",
                    "In real farming, this approach can save 40-60% of water while maintaining crop yields. That's the power of satellite-guided agriculture!",
                    "Now click 'Advance Week' to see how your targeted irrigation improved the crop health in those specific areas."
                ]
            },
            weekProgression: {
                title: "Data-Driven Results",
                steps: [
                    "Amazing! Look at your field now - the areas you irrigated have returned to healthy green colors. Your targeted intervention worked!",
                    "Your sustainability score reflects good water management. In real farming, this data helps farmers maintain profitability while protecting the environment.",
                    "As you progress, you'll face more complex challenges: fertilizer management, livestock rotation, and extreme weather events. But you now understand the basics!"
                ]
            },
            challengeIntroduction: {
                title: "Advanced Challenges",
                steps: [
                    "You're ready for bigger challenges! As the season progresses, you'll need to balance multiple factors:",
                    "Monitor NDVI for crop health, use soil moisture data for irrigation timing, and watch precipitation forecasts to plan ahead.",
                    "Your goal is to achieve a sustainability score above 75 while maintaining good crop yields. Remember: precision beats power every time!"
                ]
            }
        };
    }

    show(message, title = null, callback = null) {
        this.textElement.textContent = message;

        if (title) {
            // Update title if provided
            const titleElement = this.panel.querySelector('.mentor-message h4');
            if (titleElement) {
                titleElement.textContent = title;
            }
        }

        this.panel.classList.remove('hidden');
        this.isVisible = true;

        // Store callback for when user clicks continue
        this.continueCallback = callback;

        // Add visual emphasis
        AnimationUtils.fadeIn(this.panel, 300);
        this.addGlowEffect();

        // Auto-hide after 30 seconds if user doesn't interact
        this.autoHideTimer = setTimeout(() => {
            this.hide();
        }, 30000);
    }

    hide() {
        if (!this.isVisible) return;

        this.panel.classList.add('hidden');
        this.isVisible = false;
        this.removeGlowEffect();

        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }

        // Execute callback if provided
        if (this.continueCallback) {
            this.continueCallback();
            this.continueCallback = null;
        }
    }

    startTutorial(tutorialName) {
        this.currentTutorial = tutorialName;
        this.tutorialStep = 0;

        if (this.tutorialMessages[tutorialName]) {
            this.showTutorialStep();
        }
    }

    showTutorialStep() {
        if (!this.currentTutorial || !this.tutorialMessages[this.currentTutorial]) return;

        const tutorial = this.tutorialMessages[this.currentTutorial];
        const step = tutorial.steps[this.tutorialStep];

        if (step) {
            this.show(step, tutorial.title, () => {
                this.processTutorialStep();
            });
        } else {
            this.completeTutorial();
        }
    }

    processTutorialStep() {
        this.tutorialStep++;

        if (this.currentTutorial === 'welcome' && this.tutorialStep === 3) {
            // Wait for user to open data tablet
            this.waitingForDataTablet = true;
            return;
        }

        // Continue with next step after a short delay
        setTimeout(() => {
            this.showTutorialStep();
        }, 1000);
    }

    completeTutorial() {
        this.currentTutorial = null;
        this.tutorialStep = 0;
        this.waitingForDataTablet = false;

        // Show completion message
        this.show(
            "Tutorial complete! You're now ready to manage your farm using NASA satellite data. Good luck, and remember - sustainable farming is smart farming!",
            "Tutorial Complete"
        );

        // Update game state
        this.gameEngine.state.gameMode = 'normal';
    }

    // Event handlers
    onDataTabletOpened() {
        if (this.waitingForDataTablet) {
            this.waitingForDataTablet = false;
            this.startTutorial('dataTabletIntro');
        } else if (this.currentTutorial === 'dataTabletIntro' && this.tutorialStep >= 4) {
            // User has explored the data tablet, move to irrigation tutorial
            setTimeout(() => {
                this.startTutorial('firstIrrigation');
            }, 2000);
        }
    }

    onIrrigationApplied(data) {
        if (this.currentTutorial === 'firstIrrigation') {
            this.startTutorial('irrigationSuccess');
        }
    }

    onWeekAdvanced(data) {
        if (this.currentTutorial === 'irrigationSuccess' && data.week === 2) {
            setTimeout(() => {
                this.startTutorial('weekProgression');
            }, 1000);
        } else if (data.week === 5 && this.gameEngine.state.sustainabilityScore > 30) {
            this.startTutorial('challengeIntroduction');
        }
    }

    onToolChanged(data) {
        if (data.tool === 'irrigate' && this.currentTutorial === 'firstIrrigation') {
            this.show(
                "Good! Now drag across the yellow/red stressed areas to select them for irrigation. You can see the water cost before confirming.",
                "Irrigation Tool Selected"
            );
        }
    }

    // Contextual hints based on game state
    provideContextualHint() {
        const gameState = this.gameEngine.getGameState();
        const farmData = this.gameEngine.getFarmData();
        const stressedZones = this.gameEngine.getStressedZones();

        // Water running low
        if (gameState.waterBudget < 200) {
            this.show(
                "Your water budget is getting low! Focus on irrigating only the most stressed areas to maximize efficiency.",
                "Water Management Tip"
            );
            return;
        }

        // Many stressed zones
        if (stressedZones.length > 20) {
            this.show(
                "I see many stressed zones in your field. Check the soil moisture data to identify which areas need water versus those that might need fertilizer or other care.",
                "Field Management Tip"
            );
            return;
        }

        // High sustainability score
        if (gameState.sustainabilityScore > 70) {
            this.show(
                "Excellent sustainability score! You're farming like a pro. Keep using data to make informed decisions about resource use.",
                "Sustainability Achievement"
            );
            return;
        }

        // Week-specific advice
        if (gameState.currentWeek > 10 && gameState.currentWeek < 15) {
            this.show(
                "Mid-season is crucial for crop development. Monitor NDVI trends to catch problems early, and don't forget to check the weather forecast for irrigation planning.",
                "Mid-Season Guidance"
            );
        }
    }

    // Visual effects
    addGlowEffect() {
        this.panel.style.boxShadow = '0 0 20px rgba(25, 118, 210, 0.5)';
        this.panel.style.animation = 'pulse 2s infinite';
    }

    removeGlowEffect() {
        this.panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        this.panel.style.animation = 'none';
    }

    // Public methods
    triggerHint(topic) {
        const hints = {
            irrigation: "Remember: precision irrigation saves water and increases your sustainability score. Target only the areas that need water!",
            ndvi: "NDVI values range from -1 to 1. For crops, values above 0.5 indicate healthy vegetation, while values below 0.3 suggest stress.",
            moisture: "Soil moisture data helps distinguish between water stress and other problems. Red areas are too dry, blue areas might be waterlogged.",
            sustainability: "Sustainability score is based on water efficiency, crop health, and resource conservation. Aim for precision over quantity!"
        };

        if (hints[topic]) {
            this.show(hints[topic], "Dr. Vega's Tip");
        }
    }

    getCurrentTutorialProgress() {
        return {
            currentTutorial: this.currentTutorial,
            step: this.tutorialStep,
            isActive: this.isVisible,
            totalSteps: this.currentTutorial ? this.tutorialMessages[this.currentTutorial].steps.length : 0
        };
    }
}

// Add CSS for pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);