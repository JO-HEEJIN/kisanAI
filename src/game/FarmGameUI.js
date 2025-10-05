/**
 * NASA Farm Navigators - Farm Game UI
 * User interface for farm simulation gameplay
 */

class FarmGameUI {
    constructor(farmSimulation, container) {
        this.farmSimulation = farmSimulation;
        this.container = container;
        this.currentView = 'overview';

        // Register with GameEngine for location integration (with delay)
        if (typeof window !== 'undefined') {
            // Try immediate registration
            this.tryRegisterWithGameEngine();

            // Also try after a short delay in case GameEngine isn't ready yet
            setTimeout(() => {
                this.tryRegisterWithGameEngine();
            }, 1000);
        }
        this.farmContextSelected = false;

        // Initialize game control states
        this.gameSpeed = 1;
        this.isPaused = false;
        this.speedTimer = null;

        // Initialize satellite data state
        this.satelliteDataLoaded = false;
        this.currentLocation = null;

        // Make this instance globally available for satellite data integration
        if (typeof window !== 'undefined') {
            window.farmGameUI = this;

            // Connect to sensor fusion if available
            this.connectToSensorFusion();
        }

        // Initialize NASA Data Tutorial System
        this.initializeTutorialSystem();

        // Initialize Conservation Farming System
        this.initializeConservationSystem();

        // Initialize Environmental Impact Tracker
        this.initializeEnvironmentalTracker();

        // Initialize NASA Achievement System integration
        this.initializeAchievementSystem();

        this.setupEventListeners();
        this.render();
    }

    /**
     * Try to register with GameEngine - handles timing issues
     */
    tryRegisterWithGameEngine() {
        if (window.app && window.app.gameEngine && typeof window.app.gameEngine.setFarmGame === 'function') {
            window.app.gameEngine.setFarmGame(this);
            console.log('🚜 Farm Game successfully registered with GameEngine');
            return true;
        } else {
            console.log('⏳ GameEngine not ready yet for Farm Game registration');
            return false;
        }
    }

    /**
     * Connect to Sensor Fusion system
     */
    connectToSensorFusion() {
        // Set up interval to check for fusion insights
        this.fusionCheckInterval = setInterval(() => {
            this.applyFusionInsights();
        }, 30000); // Check every 30 seconds

        // Apply insights immediately if available
        setTimeout(() => this.applyFusionInsights(), 5000);
    }

    /**
     * Apply sensor fusion insights to farm simulation
     */
    async applyFusionInsights() {
        if (!window.sensorFusionDashboard || !window.sensorFusionDashboard.fusionData) {
            return; // No fusion data available
        }

        const fusionData = window.sensorFusionDashboard.fusionData;
        console.log('🔬 Applying sensor fusion insights to farm:', fusionData);

        // Update environmental multipliers based on fusion data
        this.farmSimulation.farmState.environmentalData = {
            ...this.farmSimulation.farmState.environmentalData,
            waterConsumptionMultiplier: this.calculateWaterMultiplier(fusionData),
            nutrientConsumptionMultiplier: this.calculateNutrientMultiplier(fusionData),
            cropGrowthMultiplier: this.calculateGrowthMultiplier(fusionData),
            lastFusionUpdate: Date.now(),
            fusionConfidence: fusionData.confidence
        };

        // Show specific alerts based on fusion insights
        this.showFusionAlerts(fusionData);

        // Apply edge case recommendations
        this.handleEdgeCases(fusionData);

        // Update UI to reflect changes
        this.updateResourcesDisplay();
        this.updateCropDisplay();

        // Emit event for other components
        this.farmSimulation.emit('fusionInsightsApplied', {
            fusionData,
            appliedAt: Date.now()
        });
    }

    /**
     * Calculate water consumption multiplier based on fusion data
     */
    calculateWaterMultiplier(fusionData) {
        // Higher water stress = more water needed
        const stressMultiplier = 1 + (fusionData.waterStressIndex / 100);

        // Edge case adjustments
        const edgeCases = fusionData.edgeCases || [];
        let edgeMultiplier = 1;

        if (edgeCases.includes('severe_drought')) {
            edgeMultiplier = 2.0; // Double water consumption in drought
        } else if (edgeCases.includes('flood_conditions')) {
            edgeMultiplier = 0.3; // Reduce watering during floods
        }

        return Math.max(0.2, Math.min(3.0, stressMultiplier * edgeMultiplier));
    }

    /**
     * Calculate nutrient consumption multiplier
     */
    calculateNutrientMultiplier(fusionData) {
        // Poor vegetation health needs more nutrients
        const vegStress = fusionData.vegetationStressIndex / 100;
        return 1 + (vegStress * 0.5);
    }

    /**
     * Calculate crop growth multiplier
     */
    calculateGrowthMultiplier(fusionData) {
        // Farm health directly affects growth rate
        return fusionData.farmHealthScore / 100;
    }

    /**
     * Show fusion-based alerts
     */
    showFusionAlerts(fusionData) {
        // Water stress alerts
        if (fusionData.waterStressIndex > 75) {
            this.showNotification(
                '💧 Critical water stress detected! Increase irrigation immediately.',
                'error'
            );
        } else if (fusionData.waterStressIndex > 50) {
            this.showNotification(
                '⚠️ Moderate water stress detected. Consider additional watering.',
                'warning'
            );
        }

        // Vegetation health alerts
        if (fusionData.vegetationStressIndex > 70) {
            this.showNotification(
                '🌱 Poor vegetation health detected. Check for diseases or pests.',
                'warning'
            );
        }

        // Farm health alerts
        if (fusionData.farmHealthScore < 40) {
            this.showNotification(
                '🚨 Critical farm health! Multiple issues detected. Review all systems.',
                'error'
            );
        }

        // Confidence warnings
        if (fusionData.confidence < 0.4) {
            this.showNotification(
                '📡 Low data confidence. Satellite data may be unreliable.',
                'info'
            );
        }
    }

    /**
     * Handle edge cases from sensor fusion
     */
    handleEdgeCases(fusionData) {
        if (!window.AdvancedNASAAnalysis) return;

        const analysis = new window.AdvancedNASAAnalysis();
        const edgeCases = analysis.detectEdgeCases(fusionData);

        edgeCases.forEach(edgeCase => {
            switch(edgeCase.type) {
                case 'post_flood':
                    this.showNotification(
                        '🌊 Post-flood conditions detected. Delay planting and improve drainage.',
                        'warning'
                    );
                    // Reduce planting success rate temporarily
                    this.farmSimulation.farmState.plantingSuccessModifier = 0.5;
                    break;

                case 'salinity_stress':
                    this.showNotification(
                        '🧂 Soil salinity detected. Consider salt-tolerant crop varieties.',
                        'warning'
                    );
                    // Increase fertilizer needs
                    this.farmSimulation.farmState.environmentalData.nutrientConsumptionMultiplier *= 1.3;
                    break;

                case 'desertification_risk':
                    this.showNotification(
                        '🏜️ Severe desertification risk! Immediate soil conservation needed.',
                        'error'
                    );
                    // Dramatically increase water and fertilizer needs
                    this.farmSimulation.farmState.environmentalData.waterConsumptionMultiplier *= 1.8;
                    break;

                case 'thermal_stress':
                    this.showNotification(
                        '🌡️ Temperature anomaly detected. Monitor crops closely.',
                        'info'
                    );
                    break;
            }

            // Show recommendations
            if (edgeCase.recommendations && edgeCase.recommendations.length > 0) {
                const recommendation = edgeCase.recommendations[0];
                this.showNotification(`💡 Recommendation: ${recommendation}`, 'info');
            }
        });
    }

    setupEventListeners() {
        // Listen to farm simulation events
        this.farmSimulation.on('weeklyUpdate', (farmState) => {
            this.updateFarmStatus(farmState);
        });

        this.farmSimulation.on('harvestReady', (data) => {
            this.showNotification(`🌾 ${data.crop.type} is ready for harvest!`, 'success');
        });

        this.farmSimulation.on('timeAdvanced', (timeData) => {
            this.updateTimeDisplay(timeData);
        });

        this.farmSimulation.on('cropPlanted', (data) => {
            this.showNotification(`🌱 ${data.crop.type} planted successfully! Area: ${data.crop.area} hectares`, 'success');
            // Force UI update after planting
            this.updateCropDisplay();
            this.updateResourcesDisplay();
        });

        this.farmSimulation.on('cropDied', (data) => {
            this.showNotification(`💀 ${data.crop.type} died from ${data.cause}! Lost ${data.landLost} hectares for 20 minutes`, 'error');
            // Update UI after crop death
            this.updateCropDisplay();
            this.updateResourcesDisplay();
        });

        this.farmSimulation.on('landRecovered', (data) => {
            const message = data.recoveryType === 'harvest'
                ? `🌾 ${data.area} hectares recovered from ${data.cropType} harvest! Total available: ${data.totalAvailable} hectares`
                : `🌱 ${data.area} hectares recovered from dead land! Total available: ${data.totalAvailable} hectares`;
            this.showNotification(message, 'success');
            this.updateResourcesDisplay();
        });

        this.farmSimulation.on('environmentalUpdate', (data) => {
            console.log('🌍 Environmental data updated from satellites:', data.environmentalData);
            this.updateResourcesDisplay();
        });
    }

    render() {
        if (!this.farmContextSelected) {
            this.showFarmContextSelection();
            return;
        }

        // Check if this is the first time playing and show tutorial
        if (!this.hasSeenTutorial()) {
            this.showGameTutorial();
        }

        this.container.innerHTML = `
            <div class="farm-game-container">
                <!-- Game Header -->
                <div class="game-header">
                    <!-- Top row: Time info and controls -->
                    <div class="header-top">
                        <div class="time-section">
                            <div class="current-time">
                                <span class="week">Week <span id="currentWeek">1</span></span>
                                <span class="season" id="currentSeason">Spring</span>
                                <span class="year">Year <span id="currentYear">1</span></span>
                            </div>
                            <button id="importSatelliteBtn" class="game-btn primary satellite-import-btn" onclick="farmGameUI.loadFromSatelliteData()">Import Satellite Data</button>
                        </div>
                        ${this.satelliteDataLoaded ? `
                        <div class="satellite-location-info">
                            <span class="location-badge">${this.currentLocation ? `${this.currentLocation.lat.toFixed(2)}°, ${this.currentLocation.lon.toFixed(2)}°` : 'Loading...'}</span>
                        </div>` : ''}
                        <div class="game-controls">
                            <button id="pauseBtn" class="game-btn secondary">Pause</button>
                            <button id="speedBtn" class="game-btn secondary">Speed</button>
                        </div>
                    </div>

                    <!-- Stats section -->
                    <div class="farm-stats">
                        <div class="stat-item">
                            <span class="stat-label">Score</span>
                            <span class="stat-value" id="totalScore">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Money</span>
                            <span class="stat-value" id="totalMoney">$10,000</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Efficiency</span>
                            <span class="stat-value" id="efficiency">0%</span>
                        </div>
                    </div>

                    <!-- Level Progress Bar -->
                    <div class="level-progress-container">
                        <div class="level-progress-header">
                            <span class="level-badge">Lv<span id="currentPlayerLevel">1</span></span>
                            <span class="level-title" id="currentPlayerTitle">Farm Apprentice</span>
                            <span class="level-points"><span id="currentPoints">0</span> / <span id="nextLevelPoints">1,000</span> pts</span>
                        </div>
                        <div class="level-progress-bar">
                            <div class="level-progress-fill" id="levelProgressFill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                    <!-- NASA data section -->
                    <div class="nasa-live-data">
                        <div class="nasa-stat">
                            <span class="nasa-label">Soil</span>
                            <span class="nasa-value" id="soilMoistureValue">--</span>
                        </div>
                        <div class="nasa-stat">
                            <span class="nasa-label">NDVI</span>
                            <span class="nasa-value" id="ndviValue">--</span>
                        </div>
                        <div class="nasa-stat">
                            <span class="nasa-label">Temp</span>
                            <span class="nasa-value" id="tempValue">--</span>
                        </div>
                    </div>
                </div>

                <!-- Main Game Layout -->
                <div class="game-layout">
                    <div class="game-main-area">
                        <!-- Navigation Tabs -->
                        <div class="game-nav">
                            <button class="nav-tab active" data-view="overview">🏠 Farm Overview</button>
                            <button class="nav-tab" data-view="crops">🌾 Crops</button>
                            <button class="nav-tab" data-view="livestock">🐄 Livestock</button>
                            <button class="nav-tab" data-view="resources">📦 Resources</button>
                            <button class="nav-tab" data-view="seasonal">📅 Seasonal Progress</button>
                            <button class="nav-tab" data-view="achievements">🏆 Achievements</button>
                            <button class="nav-tab" data-view="alerts">⚠️ Alerts</button>
                        </div>

                        <!-- Tab Content Area -->
                        <div class="game-content">
                            <div id="game-view-overview" class="game-view active">
                                ${this.renderOverviewView()}
                            </div>

                            <div id="game-view-crops" class="game-view">
                                ${this.renderCropsView()}
                            </div>

                            <div id="game-view-livestock" class="game-view">
                                ${this.renderLivestockView()}
                            </div>

                            <div id="game-view-resources" class="game-view">
                                ${this.renderResourcesView()}
                            </div>

                            <div id="game-view-seasonal" class="game-view">
                                ${this.renderSeasonalProgressView()}
                            </div>

                            <div id="game-view-achievements" class="game-view">
                                ${this.renderAchievementsView()}
                            </div>

                            <div id="game-view-alerts" class="game-view">
                                ${this.renderAlertsView()}
                            </div>
                        </div>
                    </div>

                    <!-- Universal Decision Panel -->
                    <div class="universal-decision-panel">
                        <div class="decision-panel fixed-panel">
                            <div class="decision-header">
                                <h3>Farm Decisions</h3>
                                <button class="help-btn" onclick="farmGameUI.showGameTutorial()" title="Show Tutorial">❓</button>
                            </div>
                            <div class="decision-buttons" id="decisionButtons">
                                <!-- Dynamic content based on active tab -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Game Instructions Panel -->
                <!-- Game instructions panel removed -->
                <div class="game-instructions-panel" style="display: none;">
                    <div class="instructions-header">
                        <h4>🎮 How to Play</h4>
                        <button class="toggle-instructions" onclick="farmGameUI.toggleInstructions()">📖</button>
                    </div>
                    <div class="instructions-content" id="instructionsContent" style="display: ${this.hasSeenTutorial() ? 'none' : 'block'}; ">
                        <div class="instruction-step">
                            <h5 style="color: white;">Getting Started</h5>
                            <p style="color: white;">Welcome to NASA Farm Navigators! You're managing a farm using real NASA satellite data to make informed decisions.</p>
                            <p style="color: white;"><strong>Key Resources:</strong> Money, Water, Crop Health, Season Progress</p>
                        </div>
                        <div class="instruction-step">
                            <h5>🎯 Your Goal</h5>
                            <p>Make smart farming decisions to maximize crop yield, sustainability, and profits while managing limited resources.</p>
                            <p><strong>Success Metrics:</strong> High harvest yields, efficient resource use, responding well to crises</p>
                        </div>
                        <div class="instruction-step">
                            <h5>🔄 Game Flow</h5>
                            <ol>
                                <li><strong>Monitor:</strong> Check your farm status and NASA satellite data</li>
                                <li><strong>Decide:</strong> Use the Farm Decisions buttons to take actions</li>
                                <li><strong>Learn:</strong> Each decision shows NASA data recommendations</li>
                                <li><strong>Adapt:</strong> React to seasonal changes and crisis events</li>
                            </ol>
                        </div>
                        <div class="instruction-step">
                            <h5>📊 Key Metrics</h5>
                            <ul>
                                <li><strong>Money:</strong> Needed for all farm operations</li>
                                <li><strong>Water:</strong> Critical for crop health</li>
                                <li><strong>Crop Health:</strong> Affects harvest yield</li>
                                <li><strong>Sustainability:</strong> Long-term farm viability</li>
                            </ul>
                        </div>
                        <div class="instruction-step">
                            <h5>🛰️ How NASA Data Works</h5>
                            <p><strong>In Each Decision:</strong> NASA satellite data provides specific recommendations</p>
                            <ul>
                                <li><strong>💧 Irrigation:</strong> SMAP soil moisture tells you when crops need water</li>
                                <li><strong>🌱 Fertilizer:</strong> MODIS vegetation index shows crop health</li>
                                <li><strong>🌾 Harvest:</strong> Weather forecasts help optimize timing</li>
                                <li><strong>🚨 Crisis:</strong> Early warning systems help prepare for droughts/floods</li>
                            </ul>
                            <p><strong>Follow NASA recommendations (⭐)</strong> for better results and higher scores!</p>
                        </div>
                        <div class="instruction-step">
                            <h5>🎮 Quick Start Guide</h5>
                            <p><strong>1.</strong> Click any Farm Decision button (💧🌱🌾🐄)</p>
                            <p><strong>2.</strong> Read the NASA satellite analysis</p>
                            <p><strong>3.</strong> Choose the option marked with ⭐ NASA Recommended</p>
                            <p><strong>4.</strong> Watch your farm improve with data-driven decisions!</p>
                        </div>
                    </div>
                </div>

                <!-- NASA Data Integration Panel (hidden - data now in header) -->
                <div class="nasa-data-panel" id="nasaDataPanel" style="display: none;">
                    <div class="nasa-panel-header">
                        <h4>📡 NASA Satellite Data</h4>
                        <button class="toggle-nasa-panel" onclick="farmGameUI.toggleNASAPanel()" title="Toggle NASA Data Panel">
                            <span id="nasaPanelToggleIcon">📌</span>
                        </button>
                    </div>
                    <div class="nasa-panel-content" id="nasaPanelContent">
                        <div class="nasa-data-display">
                            <div class="data-item">
                                <span class="data-label">Soil Moisture:</span>
                                <span class="data-value" id="soilMoistureValue">--</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">NDVI:</span>
                                <span class="data-value" id="ndviValue">--</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">Temperature:</span>
                                <span class="data-value" id="temperatureValue">--</span>
                            </div>
                        </div>
                        <button class="nasa-update-btn" onclick="farmGameUI.updateNASAData()">
                            🔄 Update NASA Data
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal Dialogs -->
            <div id="gameModal" class="game-modal">
                <div class="modal-content">
                    <span class="modal-close" onclick="farmGameUI.closeModal()">&times;</span>
                    <div id="modalBody"></div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.updateFarmStatus(this.farmSimulation.getFarmState());

        // Initialize NASA data if not present
        this.initializeNASAData();

        // Update NASA data display
        setTimeout(() => {
            this.updateNASADataDisplay();
        }, 100);

        // Initialize NASA panel as collapsed for better UX
        setTimeout(() => {
            this.initializeNASAPanelState();
        }, 200);

        // Initialize draggable functionality after UI is rendered
        setTimeout(() => {
            if (window.makePanelsDraggable) {
                window.makePanelsDraggable();
            }
        }, 300);

        // Show welcome guidance for new players
        if (!this.hasSeenTutorial()) {
            setTimeout(() => {
                this.showWelcomeGuidance();
            }, 500);

            // Show NASA panel usage tip after a delay
            setTimeout(() => {
                this.showNotification('💡 Click the 📡 button (bottom-right) to view NASA satellite data anytime!', 'info');
            }, 3000);
        }
    }

    renderOverviewView() {
        return `
            <div class="overview-container">
                <div class="weather-conditions-strip">
                    <h4>🌤️ Current Conditions</h4>
                    <div class="weather-display-horizontal" id="weatherDisplay">
                        <div class="weather-item">
                            <span class="weather-label">Season:</span>
                            <span class="weather-value" id="weatherSeason">Spring</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">Temperature:</span>
                            <span class="weather-value" id="weatherTemp">18°C</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">Rain Chance:</span>
                            <span class="weather-value" id="rainChance">40%</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">Humidity:</span>
                            <span class="weather-value" id="humidity">65%</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">Wind:</span>
                            <span class="weather-value" id="windSpeed">12 km/h</span>
                        </div>
                    </div>
                </div>

                <div class="nasa-satellite-data-strip">
                    <h4>🛰️ NASA Satellite Data</h4>
                    <div class="satellite-data-horizontal">
                        <div class="satellite-item">
                            <span class="satellite-label">💧 Soil:</span>
                            <span class="satellite-value soil-moisture-value" data-display="soilMoisture">51.2%</span>
                        </div>
                        <div class="satellite-item">
                            <span class="satellite-label">🌿 NDVI:</span>
                            <span class="satellite-value ndvi-value" data-display="vegetationHealth">0.797</span>
                        </div>
                        <div class="satellite-item">
                            <span class="satellite-label">🌡️ Temp:</span>
                            <span class="satellite-value temperature-value" id="satelliteTemp">25.3°C</span>
                        </div>
                        <div class="satellite-item">
                            <span class="satellite-label">💧 Rate:</span>
                            <span class="satellite-value water-multiplier-value" data-display="waterMultiplier">1.2x</span>
                        </div>
                        <div class="satellite-item">
                            <span class="satellite-label">🌱 Rate:</span>
                            <span class="satellite-value nutrient-multiplier-value" data-display="nutrientMultiplier">0.8x</span>
                        </div>
                    </div>
                </div>

                <div class="farm-map">
                    <h4>🗺️ Farm Layout</h4>
                    <div class="field-grid" id="farmFields">
                        <!-- Fields will be rendered dynamically -->
                    </div>
                </div>

                <div class="recent-activities">
                    <h4>📝 Recent Activities</h4>
                    <div class="activity-log" id="activityLog">
                        <p>Game started - Welcome to your farm!</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderCropsView() {
        const farmState = this.farmSimulation.getFarmState();
        const crops = farmState.crops || [];

        return `
            <div class="crops-container">
                <h4>🌾 Crop Management</h4>
                <div class="crops-grid" id="cropsGrid">
                    ${crops.length > 0 ? crops.map((crop, index) => `
                        <div class="crop-card" data-crop-id="${index}">
                            <div class="crop-header">
                                <span class="crop-icon">${this.getCropEmoji(crop.type)}</span>
                                <h5>${crop.type ? crop.type.charAt(0).toUpperCase() + crop.type.slice(1) : 'Unknown'}</h5>
                                <span class="crop-stage ${crop.current_stage}">${crop.current_stage || 'Growing'}</span>
                            </div>
                            <div class="crop-stats">
                                <div class="stat">💧 Water: ${Math.round((crop.water_level || 0) * 100)}%</div>
                                <div class="stat">🌿 Nutrients: ${Math.round((crop.nutrient_level || 0) * 100)}%</div>
                                <div class="stat">❤️ Health: ${Math.round((crop.health || 0) * 100)}%</div>
                                <div class="stat">📈 Growth: ${Math.round((crop.growth_progress || 0) * 100)}%</div>
                            </div>
                            <div class="crop-individual-actions">
                                <button class="mini-action-btn" onclick="farmGameUI.irrigateSingleCrop(${index})" title="Water this crop">
                                    💧
                                </button>
                                <button class="mini-action-btn" onclick="farmGameUI.fertilizeSingleCrop(${index})" title="Fertilize this crop">
                                    🌿
                                </button>
                                <button class="mini-action-btn" onclick="farmGameUI.showCropDetails(${index})" title="View details">
                                    📊
                                </button>
                            </div>
                        </div>
                    `).join('') : '<p>No crops planted yet. Plant some crops to get started!</p>'}
                </div>

                <div class="crop-actions">
                    <h5>Available Actions:</h5>
                    <button class="action-btn" onclick="farmGameUI.plantNewCrop()">🌱 Plant New Crop</button>
                    <button class="action-btn" onclick="farmGameUI.showCropAnalysis()">📊 Crop Analysis</button>
                    <button class="action-btn" onclick="farmGameUI.irrigateAllCrops()">💧 Water All Crops</button>
                    <button class="action-btn" onclick="farmGameUI.fertilizeAllCrops()">🌿 Fertilize All Crops</button>
                </div>
            </div>
        `;
    }

    renderLivestockView() {
        return `
            <div class="livestock-container">
                <h4>Livestock Management</h4>
                <div class="livestock-grid" id="livestockGrid">
                    <!-- Livestock will be rendered dynamically -->
                </div>

                <div class="livestock-actions">
                    <h5>Available Actions:</h5>
                    <button class="action-btn" onclick="console.log('🔥 Feed button clicked!'); farmGameUI.feedAnimals()">Feed Animals</button>
                    <button class="action-btn" onclick="farmGameUI.veterinaryCheck()">Health Check</button>
                    <button class="action-btn" onclick="farmGameUI.breedLivestock()">Breed Animals</button>
                    <button class="action-btn" onclick="farmGameUI.sellLivestock()">Sell Livestock</button>
                </div>
            </div>
        `;
    }

    renderResourcesView() {
        return `
            <div class="resources-container">
                <h4>📦 Resource Management</h4>
                <div class="resources-grid" id="resourcesGrid">
                    <!-- Resources will be rendered dynamically -->
                </div>

                <div class="resource-actions">
                    <h5>Market & Supplies:</h5>
                    <button class="action-btn" onclick="farmGameUI.buySupplies()">🛒 Buy Supplies</button>
                    <button class="action-btn" onclick="farmGameUI.sellProduce()">💰 Sell Produce</button>
                </div>
            </div>
        `;
    }

    renderAchievementsView() {
        return `
            <div class="achievements-container">
                <h4>🏆 Achievements & Progress</h4>

                <div class="score-summary">
                    <div class="total-score">
                        <h3>Total Score: <span id="totalScore">0</span></h3>
                        <div class="player-level">
                            <span>Level: </span><span id="playerLevel">1</span>
                            <span> - </span><span id="playerTitle">Data Explorer</span>
                        </div>
                        <div class="score-breakdown">
                            <div class="score-item">
                                <span>🌾 Crop Decisions:</span>
                                <span id="cropScore">0</span>
                            </div>
                            <div class="score-item">
                                <span>🐄 Livestock Management:</span>
                                <span id="livestockScore">0</span>
                            </div>
                            <div class="score-item">
                                <span>💧 Water Efficiency:</span>
                                <span id="waterScore">0</span>
                            </div>
                            <div class="score-item">
                                <span>🌟 NASA Data Alignment:</span>
                                <span id="nasaScore">0</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="achievements-grid" id="achievementsGrid">
                    <!-- NASA + Farm achievements will be rendered here -->
                </div>

                <div class="leaderboard-section">
                    <h5>🎯 Current Goals</h5>
                    <div class="progress-goals" id="progressGoals">
                        <!-- Progress goals will be rendered dynamically -->
                    </div>
                </div>
            </div>
        `;
    }

    renderAlertsView() {
        return `
            <div class="alerts-container">
                <h4>⚠️ Farm Alerts & Notifications</h4>
                <div class="alerts-list" id="alertsList">
                    <!-- Alerts will be rendered dynamically -->
                </div>
            </div>
        `;
    }

    renderSeasonalProgressView() {
        const farmState = this.farmSimulation.getFarmState();
        const currentSeason = farmState.currentSeason;
        const seasonProgress = farmState.seasonalProgress?.[currentSeason];
        const weeklySummary = farmState.weeklySummary;

        return `
            <div class="seasonal-progress-container">
                <!-- Season Overview -->
                <div class="season-overview">
                    <div class="season-header">
                        <h3>📅 ${this.getSeasonIcon(currentSeason)} ${this.capitalize(currentSeason)} Progress</h3>
                        <div class="season-meta">
                            <span class="season-week">Week ${farmState.currentWeek}</span>
                            <span class="season-year">Year ${farmState.currentYear}</span>
                        </div>
                    </div>

                    <div class="season-description">
                        ${this.getSeasonDescription(currentSeason)}
                    </div>
                </div>

                <!-- Seasonal Activities -->
                <div class="seasonal-activities">
                    <h4>🎯 Seasonal Activities</h4>
                    <div class="activities-grid">
                        ${seasonProgress ? seasonProgress.activities.map(activity => `
                            <div class="activity-card ${activity.completed ? 'completed' : 'pending'}">
                                <div class="activity-icon">
                                    ${activity.completed ? '✅' : '🔄'}
                                </div>
                                <div class="activity-content">
                                    <h5>${activity.name}</h5>
                                    <p class="activity-status">
                                        ${activity.completed ? `Completed Week ${activity.week}` : 'Not yet completed'}
                                    </p>
                                </div>
                                ${!activity.completed ? `
                                    <button class="activity-btn" onclick="farmGameUI.completeActivity('${activity.id}')">
                                        Complete
                                    </button>
                                ` : ''}
                            </div>
                        `).join('') : '<p>No activities defined for this season.</p>'}
                    </div>
                </div>

                <!-- Season Timeline -->
                <div class="season-timeline">
                    <h4>📊 Season Timeline</h4>
                    <div class="timeline-container">
                        <div class="timeline-progress">
                            <div class="timeline-bar">
                                <div class="timeline-fill" style="width: ${this.getSeasonProgress(farmState)}%"></div>
                            </div>
                            <div class="timeline-labels">
                                <span class="timeline-start">Week 1</span>
                                <span class="timeline-end">Week 13</span>
                            </div>
                        </div>
                        <div class="timeline-milestones">
                            ${seasonProgress && seasonProgress.milestones.length > 0 ? `
                                <div class="milestones-list">
                                    ${seasonProgress.milestones.map(milestone => `
                                        <div class="milestone-achieved">
                                            🏆 ${milestone === 'halfway' ? 'Halfway Milestone' : 'Season Completed'}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Weekly Summary -->
                ${weeklySummary ? `
                    <div class="weekly-summary">
                        <h4>📈 This Week's Summary</h4>
                        <div class="summary-grid">
                            <div class="summary-card income">
                                <div class="summary-icon">💰</div>
                                <div class="summary-content">
                                    <h5>Income</h5>
                                    <p class="summary-value">$${weeklySummary.income.toFixed(2)}</p>
                                </div>
                            </div>
                            <div class="summary-card expenses">
                                <div class="summary-icon">💸</div>
                                <div class="summary-content">
                                    <h5>Expenses</h5>
                                    <p class="summary-value">$${weeklySummary.expenses.toFixed(2)}</p>
                                </div>
                            </div>
                            <div class="summary-card profit ${weeklySummary.netProfit >= 0 ? 'positive' : 'negative'}">
                                <div class="summary-icon">${weeklySummary.netProfit >= 0 ? '📈' : '📉'}</div>
                                <div class="summary-content">
                                    <h5>Net Profit</h5>
                                    <p class="summary-value">$${weeklySummary.netProfit.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <div class="crop-summary">
                            <h5>🌾 Crop Status</h5>
                            <div class="crop-status-grid">
                                ${weeklySummary.cropStatus.map(crop => `
                                    <div class="crop-status-item">
                                        <span class="crop-type">${this.capitalize(crop.type)}</span>
                                        <span class="crop-stage">${this.capitalize(crop.stage.replace('_', ' '))}</span>
                                        <div class="crop-health-bar">
                                            <div class="health-fill" style="width: ${crop.health}%"></div>
                                        </div>
                                        <span class="health-value">${crop.health}%</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Market Prices -->
                ${farmState.marketPrices ? `
                    <div class="market-prices">
                        <h4>📊 Current Market Prices</h4>
                        <div class="prices-grid">
                            ${Object.entries(farmState.marketPrices).map(([commodity, price]) => `
                                <div class="price-item">
                                    <span class="commodity-name">${this.capitalize(commodity)}</span>
                                    <span class="commodity-price">$${price.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Seasonal Events -->
                ${farmState.seasonalEvents && farmState.seasonalEvents.length > 0 ? `
                    <div class="seasonal-events">
                        <h4>🌟 Seasonal Events</h4>
                        <div class="events-list">
                            ${farmState.seasonalEvents.filter(event => event.season === currentSeason).map(event => `
                                <div class="event-card">
                                    <div class="event-header">
                                        <h5>${event.title}</h5>
                                        <span class="event-week">Week ${event.week}</span>
                                    </div>
                                    <p class="event-description">${event.description}</p>
                                    <div class="event-benefits">
                                        <strong>Benefits:</strong>
                                        <ul>
                                            ${(event.benefits || []).map(benefit => `<li>${benefit || ''}</li>`).join('')}
                                        </ul>
                                    </div>
                                    <div class="event-recommendations">
                                        <strong>Recommendations:</strong>
                                        <ul>
                                            ${(event.recommendations || []).map(rec => `<li>${rec || ''}</li>`).join('')}
                                        </ul>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    attachEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
                this.updateDecisionPanel(e.target.dataset.view);
            });
        });

        // Initialize decision panel for overview
        this.updateDecisionPanel('overview');

        // Initial UI update
        setTimeout(() => {
            this.updateDisplay();
        }, 500);

        // Game controls
        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('speedBtn')?.addEventListener('click', () => {
            this.changeSpeed();
        });

        // Modal click-outside-to-close functionality
        const gameModal = document.getElementById('gameModal');
        if (gameModal) {
            gameModal.addEventListener('click', (e) => {
                if (e.target === gameModal) {
                    this.closeModal();
                }
            });
        }
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.game-view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`game-view-${viewName}`).classList.add('active');

        this.currentView = viewName;
        this.updateCurrentView();
    }

    updateCurrentView() {
        const farmState = this.farmSimulation.getFarmState();

        switch (this.currentView) {
            case 'overview':
                this.updateOverviewView(farmState);
                break;
            case 'crops':
                this.updateCropsView(farmState);
                break;
            case 'livestock':
                this.updateLivestockView(farmState);
                break;
            case 'resources':
                this.updateResourcesView(farmState);
                break;
            case 'achievements':
                this.updateAchievementsView(farmState);
                break;
            case 'alerts':
                this.updateAlertsView(farmState);
                break;
        }
    }

    updateFarmStatus(farmState) {
        // Update header stats
        const progress = this.farmSimulation.getGameProgress();

        document.getElementById('currentWeek').textContent = farmState.currentWeek;
        document.getElementById('currentSeason').textContent =
            farmState.currentSeason.charAt(0).toUpperCase() + farmState.currentSeason.slice(1);
        document.getElementById('totalScore').textContent = progress.totalScore;
        document.getElementById('totalMoney').textContent = `$${farmState.resources.money.toLocaleString()}`;
        document.getElementById('efficiency').textContent = `${progress.efficiency}%`;

        // Update level progress bar
        this.updateLevelProgressBar();

        // Update current view
        this.updateCurrentView();
    }

    /**
     * Update level progress bar in header
     */
    updateLevelProgressBar() {
        if (!this.achievementSystem) return;

        const playerLevel = this.achievementSystem.getPlayerLevel();
        const totalPoints = this.achievementSystem.getTotalPoints();

        // Update level badge and title
        const levelElement = document.getElementById('currentPlayerLevel');
        const titleElement = document.getElementById('currentPlayerTitle');
        const currentPointsElement = document.getElementById('currentPoints');
        const nextLevelPointsElement = document.getElementById('nextLevelPoints');
        const progressFill = document.getElementById('levelProgressFill');

        if (levelElement) {
            levelElement.textContent = playerLevel.level;
        }
        if (titleElement) {
            titleElement.textContent = playerLevel.title;
        }
        if (currentPointsElement) {
            currentPointsElement.textContent = totalPoints.toLocaleString();
        }
        if (nextLevelPointsElement && playerLevel.next) {
            nextLevelPointsElement.textContent = playerLevel.next.toLocaleString();
        } else if (nextLevelPointsElement) {
            nextLevelPointsElement.textContent = 'MAX';
        }

        // Calculate and update progress bar
        if (progressFill && playerLevel.next) {
            const previousLevelPoints = this.getPreviousLevelPoints(playerLevel.level);
            const pointsInCurrentLevel = totalPoints - previousLevelPoints;
            const pointsNeededForNextLevel = playerLevel.next - previousLevelPoints;
            const progressPercentage = Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100);

            progressFill.style.width = `${progressPercentage}%`;
        } else if (progressFill) {
            progressFill.style.width = '100%'; // Max level
        }
    }

    /**
     * Get points required for previous level
     */
    getPreviousLevelPoints(currentLevel) {
        const levels = [0, 1000, 3000, 7000, 15000];
        return levels[currentLevel - 1] || 0;
    }

    updateTimeDisplay(timeData) {
        document.getElementById('currentWeek').textContent = timeData.week;
        document.getElementById('currentSeason').textContent =
            timeData.season.charAt(0).toUpperCase() + timeData.season.slice(1);
    }

    updateOverviewView(farmState) {
        // Update farm fields display
        const fieldsContainer = document.getElementById('farmFields');
        if (fieldsContainer) {
            fieldsContainer.innerHTML = farmState.crops.map(crop => `
                <div class="field-tile ${crop.type}">
                    <div class="crop-info">
                        <span class="crop-type">${crop.type}</span>
                        <span class="crop-stage">${crop.current_stage}</span>
                    </div>
                    <div class="crop-health">
                        <div class="health-bar">
                            <div class="health-fill" style="width: ${crop.health * 100}%"></div>
                        </div>
                        <span class="health-text">${(crop.health * 100).toFixed(0)}%</span>
                    </div>
                </div>
            `).join('');
        }

        // Update weather display
        document.getElementById('weatherSeason').textContent =
            farmState.currentSeason.charAt(0).toUpperCase() + farmState.currentSeason.slice(1);
    }

    updateCropsView(farmState) {
        const cropsContainer = document.getElementById('cropsGrid');
        if (cropsContainer) {
            cropsContainer.innerHTML = farmState.crops.map(crop => `
                <div class="crop-card">
                    <div class="crop-header">
                        <span class="crop-name">${crop.emoji || '🌾'} ${crop.type.charAt(0).toUpperCase() + crop.type.slice(1)}</span>
                        <span class="crop-area">${crop.area} hectares</span>
                    </div>

                    <div class="crop-stats">
                        <div class="stat-row">
                            <span class="stat-label">Growth:</span>
                            <div class="stat-bar">
                                <div class="stat-fill growth" style="width: ${crop.growth_progress * 100}%"></div>
                            </div>
                            <span class="stat-value">${(crop.growth_progress * 100).toFixed(0)}%</span>
                        </div>

                        <div class="stat-row">
                            <span class="stat-label">Water:</span>
                            <div class="stat-bar">
                                <div class="stat-fill water" style="width: ${crop.water_level * 100}%"></div>
                            </div>
                            <span class="stat-value">${(crop.water_level * 100).toFixed(0)}%</span>
                        </div>

                        <div class="stat-row">
                            <span class="stat-label">Nutrients:</span>
                            <div class="stat-bar">
                                <div class="stat-fill nutrients" style="width: ${crop.nutrient_level * 100}%"></div>
                            </div>
                            <span class="stat-value">${(crop.nutrient_level * 100).toFixed(0)}%</span>
                        </div>

                        <div class="stat-row">
                            <span class="stat-label">Health:</span>
                            <div class="stat-bar">
                                <div class="stat-fill health" style="width: ${crop.health * 100}%"></div>
                            </div>
                            <span class="stat-value">${(crop.health * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    <div class="crop-footer">
                        <span class="crop-stage">Stage: ${crop.current_stage}</span>
                        <span class="crop-health">${crop.ready_for_harvest ? '✅ Ready to Harvest!' : crop.health > 0.8 ? '💚 Excellent' : crop.health > 0.5 ? '💛 Good' : '❤️ Needs Care'}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    updateResourcesView(farmState) {
        const resourcesContainer = document.getElementById('resourcesGrid');
        if (resourcesContainer) {
            resourcesContainer.innerHTML = Object.entries(farmState.resources).map(([resource, amount]) => `
                <div class="resource-card">
                    <div class="resource-icon">${this.getResourceIcon(resource)}</div>
                    <div class="resource-info">
                        <h5>${resource.charAt(0).toUpperCase() + resource.slice(1)}</h5>
                        <span class="resource-amount">${resource === 'money' ? '$' + amount.toLocaleString() : amount}</span>
                    </div>
                    <div class="resource-status ${amount < 20 ? 'low' : amount < 50 ? 'medium' : 'good'}">
                        ${amount < 20 ? 'Low' : amount < 50 ? 'Medium' : 'Good'}
                    </div>
                </div>
            `).join('');
        }
    }

    updateLivestockView(farmState) {
        console.log('🐄 updateLivestockView called with farmState.livestock:', farmState.livestock);
        const livestockContainer = document.getElementById('livestockGrid');
        if (livestockContainer) {
            const livestock = farmState.livestock || {};
            console.log('📊 Livestock data for display:', JSON.stringify(livestock, null, 2));
            const livestockEntries = Object.entries(livestock);

            if (livestockEntries.length === 0) {
                livestockContainer.innerHTML = `
                    <div class="no-livestock">
                        <h4>No Livestock Yet</h4>
                        <p>Purchase livestock from the Buy Supplies section to start animal farming!</p>
                    </div>
                `;
            } else {
                livestockContainer.innerHTML = livestockEntries
                    .filter(([type, data]) => data && typeof data.count !== 'undefined' && data.count > 0)
                    .map(([type, data]) => {
                        // Ensure data has valid values
                        const count = data.count || 0;
                        const health = data.health || 0;
                        const feedLevel = data.feed_level || 0;

                        // Convert to percentage if needed (handle both 0-1 and 0-100 ranges)
                        const healthPercent = health <= 1 ? Math.round(health * 100) : Math.round(health);
                        const feedPercent = feedLevel <= 1 ? Math.round(feedLevel * 100) : Math.round(feedLevel);

                        return `
                            <div class="livestock-card">
                                <div class="livestock-icon">${this.getLivestockIcon(type)}</div>
                                <div class="livestock-info">
                                    <h5>${type.charAt(0).toUpperCase() + type.slice(1)}</h5>
                                    <span class="livestock-count">Count: ${count}</span>

                                    <div class="stat-row">
                                        <span class="stat-label">Health:</span>
                                        <div class="progress-bar">
                                            <div class="progress-fill health-bar" style="width: ${healthPercent}%"></div>
                                        </div>
                                        <span class="stat-value">${healthPercent}%</span>
                                    </div>

                                    <div class="stat-row">
                                        <span class="stat-label">Feed:</span>
                                        <div class="progress-bar">
                                            <div class="progress-fill feed-bar" style="width: ${feedPercent}%"></div>
                                        </div>
                                        <span class="stat-value">${feedPercent}%</span>
                                    </div>
                                </div>
                                <div class="livestock-status ${healthPercent > 80 ? 'good' : healthPercent > 50 ? 'medium' : 'low'}">
                                    ${healthPercent > 80 ? 'Healthy' : healthPercent > 50 ? 'Fair' : 'Needs Care'}
                                </div>
                            </div>
                        `;
                    }).join('');
            }
        }
    }

    getLivestockIcon(type) {
        const icons = {
            cattle: '🐄',
            sheep: '🐑',
            chicken: '🐓',
            pig: '🐷',
            goat: '🐐'
        };
        return icons[type] || '🐄';
    }

    updateAchievementsView(farmState) {
        // Update score display
        this.updateScoreDisplay(farmState);

        // Update NASA achievements mixed with farm achievements
        this.updateMixedAchievementsGrid(farmState);

        // Update progress goals
        this.updateProgressGoals(farmState);

        // Update NASA player level
        this.updateNASAPlayerLevel();
    }

    updateScoreDisplay(farmState) {
        const scoreElements = {
            totalScore: document.getElementById('totalScore'),
            cropScore: document.getElementById('cropScore'),
            livestockScore: document.getElementById('livestockScore'),
            waterScore: document.getElementById('waterScore'),
            nasaScore: document.getElementById('nasaScore')
        };

        if (scoreElements.totalScore) {
            const scores = this.calculateDetailedScores(farmState);
            scoreElements.totalScore.textContent = scores.total.toLocaleString();
            scoreElements.cropScore.textContent = scores.crop;
            scoreElements.livestockScore.textContent = scores.livestock;
            scoreElements.waterScore.textContent = scores.water;
            scoreElements.nasaScore.textContent = scores.nasa;
        }
    }

    calculateDetailedScores(farmState) {
        return {
            total: farmState.playerStats.totalScore || 0,
            crop: farmState.playerStats.cropScore || 0,
            livestock: farmState.playerStats.livestockScore || 0,
            water: farmState.playerStats.waterScore || 0,
            nasa: farmState.playerStats.nasaScore || 0
        };
    }

    updateAchievementsGrid(farmState) {
        console.log('🎮 updateAchievementsGrid called');
        const achievementsGrid = document.getElementById('achievementsGrid');
        if (!achievementsGrid) {
            console.log('🎮 achievementsGrid element not found!');
            return;
        }
        console.log('🎮 achievementsGrid element found');

        const achievements = this.getAchievements(farmState);
        console.log(`🎮 Total achievements returned: ${achievements.length}`, achievements);

        achievementsGrid.innerHTML = achievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h5>${achievement.name}</h5>
                    <p>${achievement.description}</p>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                        </div>
                        <span class="progress-text">${achievement.progress}%</span>
                    </div>
                </div>
                ${achievement.unlocked ? '<div class="achievement-badge">✓ Unlocked</div>' : ''}
            </div>
        `).join('');
    }

    getAchievements(farmState) {
        const stats = farmState.playerStats;

        // Get pixel hunt achievements from localStorage
        const pixelHuntAchievements = this.getPixelHuntAchievements();

        return [
            ...pixelHuntAchievements,
            {
                name: "First Steps",
                description: "Make your first farming decision",
                icon: "🌱",
                progress: Math.min(100, stats.decisionsCount > 0 ? 100 : 0),
                unlocked: stats.decisionsCount > 0
            },
            {
                name: "NASA Navigator",
                description: "Follow NASA recommendations 10 times",
                icon: "🛰️",
                progress: Math.min(100, (stats.nasaAlignments || 0) * 10),
                unlocked: (stats.nasaAlignments || 0) >= 10
            },
            {
                name: "Water Wise",
                description: "Achieve 80% irrigation efficiency",
                icon: "💧",
                progress: Math.min(100, (stats.waterEfficiency || 0) * 100),
                unlocked: (stats.waterEfficiency || 0) >= 0.8
            },
            {
                name: "Green Thumb",
                description: "Successfully harvest 50 crops",
                icon: "🌾",
                progress: Math.min(100, (stats.totalYield / 50) * 100),
                unlocked: stats.totalYield >= 50
            },
            {
                name: "Livestock Expert",
                description: "Maintain 90% livestock health for 4 weeks",
                icon: "🐄",
                progress: Math.min(100, (stats.livestockHealthWeeks || 0) * 25),
                unlocked: (stats.livestockHealthWeeks || 0) >= 4
            },
            {
                name: "Sustainable Farmer",
                description: "Maintain sustainability score above 80",
                icon: "♻️",
                progress: Math.min(100, stats.sustainabilityScore || 0),
                unlocked: (stats.sustainabilityScore || 0) >= 80
            },
            {
                name: "Profit Master",
                description: "Earn $10,000 in total profit",
                icon: "💰",
                progress: Math.min(100, (stats.totalProfit / 10000) * 100),
                unlocked: (stats.totalProfit || 0) >= 10000
            },
            {
                name: "Season Survivor",
                description: "Complete a full year of farming",
                icon: "🌍",
                progress: Math.min(100, ((farmState.currentWeek || 0) / 52) * 100),
                unlocked: (farmState.currentWeek || 0) >= 52
            }
        ];
    }

    updateProgressGoals(farmState) {
        const progressGoals = document.getElementById('progressGoals');
        if (!progressGoals) return;

        const currentGoals = this.getCurrentGoals(farmState);

        progressGoals.innerHTML = currentGoals.map(goal => `
            <div class="progress-goal">
                <div class="goal-header">
                    <span class="goal-icon">${goal.icon}</span>
                    <span class="goal-title">${goal.title}</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                    <span class="progress-text">${goal.current}/${goal.target}</span>
                </div>
            </div>
        `).join('');
    }

    getCurrentGoals(farmState) {
        const stats = farmState.playerStats;

        return [
            {
                title: "Weekly Decisions",
                icon: "🎯",
                current: stats.decisionsCount || 0,
                target: 20,
                progress: Math.min(100, ((stats.decisionsCount || 0) / 20) * 100)
            },
            {
                title: "NASA Alignment",
                icon: "📡",
                current: stats.nasaAlignments || 0,
                target: 10,
                progress: Math.min(100, ((stats.nasaAlignments || 0) / 10) * 100)
            },
            {
                title: "Crop Yield",
                icon: "🌾",
                current: Math.round(stats.totalYield || 0),
                target: 100,
                progress: Math.min(100, ((stats.totalYield || 0) / 100) * 100)
            }
        ];
    }

    updateAlertsView(farmState) {
        const alertsContainer = document.getElementById('alertsList');
        if (alertsContainer) {
            if (farmState.activeAlerts.length === 0) {
                alertsContainer.innerHTML = '<p class="no-alerts">No active alerts - your farm is running smoothly! 🌟</p>';
            } else {
                alertsContainer.innerHTML = farmState.activeAlerts.map(alert => `
                    <div class="alert-card ${alert.urgency}">
                        <div class="alert-icon">${this.getAlertIcon(alert.type)}</div>
                        <div class="alert-content">
                            <h5>${alert.type.replace('_', ' ').toUpperCase()}</h5>
                            <p>${alert.message}</p>
                            <span class="alert-time">Week ${alert.week}</span>
                        </div>
                        <div class="alert-urgency ${alert.urgency}">
                            ${alert.urgency.toUpperCase()}
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    // Decision dialogs
    showIrrigationDialog() {
        const farmState = this.farmSimulation.getFarmState();

        // Generate realistic NASA data scenario
        const nasaScenario = this.generateNASAIrrigationScenario(farmState);
        this.currentNasaScenario = nasaScenario; // Store for click handlers

        const content = `
            <div class="modal-header">
                <h3>💧 Irrigation Decision - Week ${farmState.currentWeek} (${farmState.currentSeason})</h3>
            </div>

            <div class="nasa-data-panel">
                <h4>📡 NASA Satellite Analysis</h4>
                <div class="satellite-metrics">
                    <div class="metric">
                        <strong>SMAP Soil Moisture:</strong> <span class="${nasaScenario.soilMoisture < 30 ? 'critical' : nasaScenario.soilMoisture < 60 ? 'warning' : 'good'}">${nasaScenario.soilMoisture}%</span>
                    </div>
                    <div class="metric">
                        <strong>MODIS Vegetation Index:</strong> <span class="${nasaScenario.vegetationHealth < 0.4 ? 'poor' : nasaScenario.vegetationHealth < 0.7 ? 'fair' : 'good'}">${(nasaScenario.vegetationHealth * 100).toFixed(0)}%</span>
                    </div>
                    <div class="metric">
                        <strong>Weather Forecast:</strong> <span class="${nasaScenario.rainForecast < 20 ? 'dry' : nasaScenario.rainForecast < 60 ? 'moderate' : 'wet'}">${nasaScenario.rainForecast}% chance rain next 7 days</span>
                    </div>
                    <div class="metric">
                        <strong>Temperature Trend:</strong> <span class="${nasaScenario.temperatureTrend === 'rising' ? 'warming' : nasaScenario.temperatureTrend === 'stable' ? 'stable' : 'cooling'}">${nasaScenario.temperatureTrend} (${nasaScenario.temperature}°C avg)</span>
                    </div>
                </div>
                <div class="nasa-recommendation-box">
                    <strong>📊 NASA Recommendation:</strong>
                    <p class="recommendation-text">${nasaScenario.recommendation}</p>
                </div>
            </div>

            <div class="current-conditions">
                <h4>Current Crop Status:</h4>
                ${farmState.crops.map(crop => {
                    const stressLevel = this.calculateCropStress(crop, nasaScenario);
                    return `
                    <div class="condition-item">
                        <span>${crop.type} (${crop.growth_stage}):</span>
                        <div class="water-indicator ${crop.water_level < 0.3 ? 'low' : crop.water_level < 0.6 ? 'medium' : 'good'}">
                            ${(crop.water_level * 100).toFixed(0)}% water
                        </div>
                        <div class="stress-indicator ${stressLevel}">
                            ${stressLevel} stress
                        </div>
                    </div>
                `;
                }).join('')}
            </div>

            <div class="irrigation-options">
                <div class="option-card ${nasaScenario.recommendedAction === 'light' ? 'recommended' : ''}" data-action="light" data-type="irrigation">
                    <h5>💧 Light Irrigation</h5>
                    <p>Cost: 10 water units, $20</p>
                    <p>Effect: +30% water level</p>
                    <p>Best for: ${nasaScenario.soilMoisture > 50 ? 'Maintenance when soil moisture is adequate' : 'Not recommended for current dry conditions'}</p>
                    ${nasaScenario.recommendedAction === 'light' ? '<div class="nasa-badge">🌟 NASA Recommended</div>' : ''}
                </div>

                <div class="option-card ${nasaScenario.recommendedAction === 'medium' ? 'recommended' : ''}" data-action="medium" data-type="irrigation">
                    <h5>💧💧 Medium Irrigation</h5>
                    <p>Cost: 25 water units, $50</p>
                    <p>Effect: +60% water level</p>
                    <p>Best for: ${nasaScenario.soilMoisture < 60 && nasaScenario.rainForecast < 70 ? 'Current conditions with low rain forecast' : 'May be excessive given current conditions'}</p>
                    ${nasaScenario.recommendedAction === 'medium' ? '<div class="nasa-badge">🌟 NASA Recommended</div>' : ''}
                </div>

                <div class="option-card ${nasaScenario.recommendedAction === 'heavy' ? 'recommended' : ''}" data-action="heavy" data-type="irrigation">
                    <h5>💧💧💧 Heavy Irrigation</h5>
                    <p>Cost: 50 water units, $100</p>
                    <p>Effect: +100% water level</p>
                    <p>Best for: ${nasaScenario.soilMoisture < 30 ? 'Critical drought conditions like current situation' : 'Overkill for current moisture levels'}</p>
                    ${nasaScenario.recommendedAction === 'heavy' ? '<div class="nasa-badge">🌟 NASA Recommended</div>' : ''}
                </div>

                <div class="option-card ${nasaScenario.recommendedAction === 'wait' ? 'recommended' : ''}" data-action="wait" data-type="irrigation">
                    <h5>⏳ Wait for Rain</h5>
                    <p>Cost: $0</p>
                    <p>Effect: No immediate irrigation</p>
                    <p>Best for: ${nasaScenario.rainForecast > 70 ? 'High rain probability in forecast' : 'Risky with current low rain forecast'}</p>
                    ${nasaScenario.recommendedAction === 'wait' ? '<div class="nasa-badge">🌟 NASA Recommended</div>' : ''}
                </div>
            </div>
        `;

        this.showModal(content);

        // Setup option card handlers after modal is shown
        // Use MutationObserver to detect DOM updates completion
        const modalBody = document.querySelector('#modalBody');
        if (modalBody) {
            const observer = new MutationObserver(() => {
                this.setupOptionCardHandlers();
                observer.disconnect();
            });

            observer.observe(modalBody, { childList: true, subtree: true });
        } else {
            // Fallback to setTimeout if modalBody not found
            setTimeout(() => {
                this.setupOptionCardHandlers();
            }, 100);
        }
    }

    makeIrrigationDecision(amount, nasaScenario = null) {
        try {
            let result;

            if (amount === 'wait') {
                // Handle waiting for rain
                result = {
                    success: true,
                    message: 'Decided to wait for natural rainfall',
                    score: nasaScenario && nasaScenario.rainForecast > 70 ? 15 : -5,
                    efficiency: nasaScenario && nasaScenario.rainForecast > 70 ? 'optimal' : 'risky',
                    nasaAlignment: nasaScenario && nasaScenario.recommendedAction === 'wait'
                };
            } else {
                result = this.farmSimulation.irrigateCrops(null, amount);

                // Add NASA data scoring bonus
                if (nasaScenario && nasaScenario.recommendedAction === amount) {
                    result.score = (result.score || 0) + 10;
                    result.nasaAlignment = true;
                    result.message += ' (NASA recommendation followed!)';
                } else if (nasaScenario) {
                    result.score = (result.score || 0) - 5;
                    result.nasaAlignment = false;
                    result.message += ' (Did not follow NASA recommendation)';
                }
            }

            this.showEnhancedDecisionResult(result, nasaScenario);
            // Note: Modal will be closed by the event handler automatically

        } catch (error) {
            console.error('❌ Error in makeIrrigationDecision:', error);
            console.error('Error message:', error.message);

            // Show user-friendly error message instead of throwing
            this.showNotification('Irrigation application failed. Please try again.', 'error');

            // Don't re-throw to prevent breaking the event handler
            return false;
        }
    }

    showEnhancedDecisionResult(result, scenario) {
        // Show comprehensive feedback dialog
        this.showDecisionFeedback(result, scenario, null, 'farming');

        // Update scores in farm simulation
        this.updatePlayerScores(result, scenario);
        this.updateCropDisplay();
    }

    showDecisionFeedback(result, scenario, decision, decisionType) {
        const feedbackData = this.generateLearningOutcomes(result, scenario, decision, decisionType);

        this.showModal(`
            <div class="decision-feedback-dialog">
                <div class="feedback-header">
                    <h3>📊 Decision Results & Learning Outcomes</h3>
                    <button class="close-btn" onclick="farmGameUI.closeModal()">×</button>
                </div>

                <div class="feedback-content">
                    <!-- Immediate Results -->
                    <div class="feedback-section result-summary">
                        <div class="section-header">
                            <div class="result-icon ${result.success ? 'success' : 'warning'}">
                                ${result.success ? '✅' : '⚠️'}
                            </div>
                            <h4>${result.success ? 'Good Decision!' : 'Learning Opportunity'}</h4>
                        </div>
                        <p class="result-message">${result.message}</p>
                        ${result.score ? `<div class="score-change">Score: ${result.score > 0 ? '+' : ''}${result.score}</div>` : ''}
                    </div>

                    <!-- NASA Data Insights -->
                    <div class="feedback-section nasa-insights">
                        <h4>🛰️ NASA Data Insights</h4>
                        <div class="nasa-alignment ${result.nasaAlignment ? 'aligned' : 'misaligned'}">
                            ${result.nasaAlignment
                                ? '🌟 Your decision aligns with NASA satellite data recommendations!'
                                : '📡 NASA data suggests a different approach might be more effective.'
                            }
                        </div>
                        <div class="nasa-learning">
                            ${feedbackData.nasaLearning}
                        </div>
                    </div>

                    <!-- Learning Outcomes -->
                    <div class="feedback-section learning-outcomes">
                        <h4>📚 What You Learned</h4>
                        <ul class="learning-points">
                            ${(feedbackData.learningPoints || []).map(point => `<li>${point || ''}</li>`).join('')}
                        </ul>
                    </div>

                    <!-- Real-World Context -->
                    <div class="feedback-section real-world-context">
                        <h4>🌍 Real-World Application</h4>
                        <p>${feedbackData.realWorldContext}</p>
                    </div>

                    <!-- Recommendations -->
                    <div class="feedback-section recommendations">
                        <h4>💡 Recommendations for Next Time</h4>
                        <ul class="recommendation-list">
                            ${(feedbackData.recommendations || []).map(rec => `<li>${rec || ''}</li>`).join('')}
                        </ul>
                    </div>

                    <!-- Progress Tracking -->
                    <div class="feedback-section progress-tracking">
                        <h4>📈 Your Progress</h4>
                        <div class="progress-stats">
                            <div class="progress-item">
                                <span class="progress-label">Decision Success Rate</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${feedbackData.successRate}%"></div>
                                </div>
                                <span class="progress-value">${feedbackData.successRate}%</span>
                            </div>
                            <div class="progress-item">
                                <span class="progress-label">NASA Alignment</span>
                                <div class="progress-bar">
                                    <div class="progress-fill nasa" style="width: ${feedbackData.nasaAlignmentRate}%"></div>
                                </div>
                                <span class="progress-value">${feedbackData.nasaAlignmentRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feedback-actions">
                    <button class="game-btn primary" onclick="farmGameUI.closeModal()">
                        Continue Farming
                    </button>
                    <button class="game-btn secondary" onclick="farmGameUI.showDetailedNASAData('${decisionType}')"
                        View NASA Data Details
                    </button>
                </div>
            </div>
        `);
    }

    generateLearningOutcomes(result, scenario, decision, decisionType) {
        const farmState = this.farmSimulation.getFarmState();
        const stats = farmState.playerStats;

        // Calculate success and NASA alignment rates
        const successRate = stats.decisionsCount > 0
            ? Math.round((stats.successfulDecisions / stats.decisionsCount) * 100)
            : 0;
        const nasaAlignmentRate = stats.decisionsCount > 0
            ? Math.round((stats.nasaAlignments / stats.decisionsCount) * 100)
            : 0;

        // Generate context-specific learning content
        let learningPoints = [];
        let nasaLearning = '';
        let realWorldContext = '';
        let recommendations = [];

        if (decisionType === 'farming') {
            if (scenario && scenario.soilMoisture !== undefined) {
                // Irrigation decision
                learningPoints = [
                    `Soil moisture levels of ${scenario.soilMoisture}% ${result.success ? 'were appropriate' : 'needed different action'} for optimal crop growth`,
                    `SMAP satellite data provides real-time soil moisture measurements at 9km resolution`,
                    `Proper irrigation timing can ${result.success ? 'increase' : 'significantly impact'} crop yields by 15-30%`
                ];

                nasaLearning = result.nasaAlignment
                    ? 'NASA SMAP data confirmed your soil moisture assessment was accurate for irrigation timing.'
                    : 'NASA SMAP data suggested different soil moisture conditions than your assessment indicated.';

                realWorldContext = 'Farmers worldwide use NASA soil moisture data to optimize irrigation schedules, reducing water waste while maximizing crop productivity. This is especially critical in drought-prone regions.';

                recommendations = result.success
                    ? ['Continue monitoring SMAP data for irrigation decisions', 'Consider seasonal patterns in soil moisture']
                    : ['Check NASA SMAP data before irrigation decisions', 'Account for recent precipitation in soil moisture assessments'];

            } else if (scenario && scenario.soilTemp !== undefined) {
                // Fertilization decision
                learningPoints = [
                    `Soil temperature of ${scenario.soilTemp}°C ${result.success ? 'was optimal' : 'may not have been ideal'} for nutrient uptake`,
                    `Landsat thermal imagery helps farmers time fertilizer applications for maximum effectiveness`,
                    `Temperature affects microbial activity and nutrient availability in soil`
                ];

                nasaLearning = result.nasaAlignment
                    ? 'NASA Landsat thermal data supported your fertilization timing decision.'
                    : 'NASA Landsat data indicated different soil temperature conditions for optimal fertilization.';

                realWorldContext = 'Agricultural extension services increasingly use NASA satellite thermal data to provide farmers with optimal fertilization windows, improving nutrient efficiency and reducing environmental impact.';

                recommendations = result.success
                    ? ['Monitor seasonal temperature patterns for fertilization', 'Consider combining with soil moisture data']
                    : ['Use NASA thermal data for fertilization timing', 'Account for weather forecasts in fertilizer planning'];
            } else {
                // Default fertilizer learning (when no scenario provided)
                learningPoints = [
                    `Fertilizer application ${result.success ? 'was effective' : 'needs optimization'} for current crop conditions`,
                    `NASA satellite data can help determine optimal fertilization timing and reduce waste`,
                    `Proper fertilization timing can increase crop yields by 20-40% while reducing environmental impact`
                ];

                nasaLearning = result.success
                    ? 'Your fertilization decision aligns with sustainable farming practices.'
                    : 'NASA soil and temperature monitoring could improve fertilization efficiency.';

                realWorldContext = 'Modern precision agriculture increasingly relies on satellite data to optimize fertilizer application, reducing costs and environmental impact while maximizing crop productivity.';

                recommendations = result.success
                    ? ['Continue monitoring crop nutrient needs', 'Consider soil testing for precision fertilization']
                    : ['Use satellite soil data for fertilization timing', 'Consider nutrient requirements by crop growth stage'];
            }
        } else if (decisionType === 'crisis') {
            // Crisis response learning
            learningPoints = [
                `Crisis response strategies ${result.success ? 'effectively mitigated' : 'may need adjustment for'} the environmental challenge`,
                `NASA Earth observation data provides early warning systems for agricultural crises`,
                `Rapid response decisions can ${result.success ? 'prevent' : 'help minimize'} significant crop and livestock losses`
            ];

            nasaLearning = result.nasaAlignment
                ? 'NASA satellite monitoring systems would have provided similar crisis response recommendations.'
                : 'NASA early warning systems suggested alternative crisis response strategies.';

            realWorldContext = 'NASA\'s Harvest program and other agricultural monitoring systems help farmers and governments prepare for and respond to droughts, floods, and pest outbreaks globally.';

            recommendations = result.success
                ? ['Maintain emergency response preparedness', 'Monitor NASA hazard alerts regularly']
                : ['Develop comprehensive crisis response plans', 'Subscribe to NASA agricultural hazard monitoring'];
        }

        return {
            successRate,
            nasaAlignmentRate,
            learningPoints,
            nasaLearning,
            realWorldContext,
            recommendations
        };
    }

    showDetailedNASAData(decisionType) {
        // Show detailed NASA data explanation modal
        this.showModal(`
            <div class="nasa-data-dialog">
                <div class="nasa-header">
                    <h3>🛰️ NASA Agricultural Data Systems</h3>
                    <button class="close-btn" onclick="farmGameUI.closeModal()">×</button>
                </div>

                <div class="nasa-content">
                    <div class="nasa-system">
                        <h4>SMAP - Soil Moisture Active Passive</h4>
                        <p>Provides global soil moisture measurements every 2-3 days at 9km resolution. Critical for irrigation timing and drought monitoring.</p>
                        <div class="data-specs">
                            <span class="spec">Resolution: 9km</span>
                            <span class="spec">Frequency: 2-3 days</span>
                            <span class="spec">Depth: 0-5cm</span>
                        </div>
                    </div>

                    <div class="nasa-system">
                        <h4>Landsat - Land Remote Sensing</h4>
                        <p>Thermal and optical imagery for crop health, soil temperature, and vegetation monitoring with 16-day revisit cycle.</p>
                        <div class="data-specs">
                            <span class="spec">Resolution: 30m</span>
                            <span class="spec">Frequency: 16 days</span>
                            <span class="spec">Bands: 11 spectral</span>
                        </div>
                    </div>

                    <div class="nasa-system">
                        <h4>MODIS - Moderate Resolution Imaging</h4>
                        <p>Daily vegetation index and crop condition monitoring for large-scale agricultural assessment.</p>
                        <div class="data-specs">
                            <span class="spec">Resolution: 250m-1km</span>
                            <span class="spec">Frequency: Daily</span>
                            <span class="spec">Coverage: Global</span>
                        </div>
                    </div>
                </div>

                <div class="nasa-actions">
                    <button class="game-btn primary" onclick="farmGameUI.closeModal()">
                        Back to Game
                    </button>
                </div>
            </div>
        `);
    }

    updatePlayerScores(result, scenario) {
        const farmState = this.farmSimulation.getFarmState();
        const stats = farmState.playerStats;

        // Update total score
        if (result.score) {
            stats.totalScore += result.score;
        }

        // Update decision count
        stats.decisionsCount++;

        // Update category-specific scores based on decision type
        if (result.score > 0) {
            stats.successfulDecisions++;

            // Categorize the score based on context
            if (scenario && scenario.soilMoisture !== undefined) {
                // Irrigation decision
                stats.waterScore += Math.max(0, result.score);
            } else if (scenario && scenario.pastureQuality !== undefined) {
                // Livestock decision
                stats.livestockScore += Math.max(0, result.score);
            } else if (scenario && scenario.soilTemp !== undefined) {
                // Fertilizer decision
                stats.cropScore += Math.max(0, result.score);
            }
        }

        // Track NASA alignment
        if (result.nasaAlignment === true) {
            stats.nasaAlignments++;
            stats.nasaScore += 5;
        }

        // Update efficiency metrics
        this.updateEfficiencyMetrics(farmState);

        // Check for new achievements
        this.checkNewAchievements(farmState);

        // Force update UI displays
        this.updateScoreDisplay(farmState);
        this.updateResourcesDisplay(farmState);

        // Show visual feedback for changes
        if (result.score && result.score !== 0) {
            this.showScoreChange(result.score);
        }

        console.log('Updated player scores:', {
            totalScore: stats.totalScore,
            decisionsCount: stats.decisionsCount,
            money: farmState.resources.money,
            water: farmState.resources.water
        });
    }

    updateEfficiencyMetrics(farmState) {
        const stats = farmState.playerStats;

        // Calculate water efficiency based on decisions and outcomes
        if (stats.decisionsCount > 0) {
            stats.waterEfficiency = Math.min(1.0, stats.successfulDecisions / stats.decisionsCount);
        }

        // Check livestock health for achievement tracking
        const avgLivestockHealth = this.calculateAverageLivestockHealth(farmState);
        if (avgLivestockHealth > 0.9) {
            stats.livestockHealthWeeks = (stats.livestockHealthWeeks || 0) + 1;
        } else {
            stats.livestockHealthWeeks = 0; // Reset if health drops
        }
    }

    calculateAverageLivestockHealth(farmState) {
        const livestock = farmState.livestock;
        const healthValues = Object.values(livestock).map(animal => animal.health);
        return healthValues.reduce((sum, health) => sum + health, 0) / healthValues.length;
    }

    checkNewAchievements(farmState) {
        const achievements = this.getAchievements(farmState);
        const newlyUnlocked = achievements.filter(achievement =>
            achievement.unlocked && !this.hasSeenAchievement(achievement.name)
        );

        newlyUnlocked.forEach(achievement => {
            this.showAchievementNotification(achievement);
            this.markAchievementAsSeen(achievement.name);
        });
    }

    hasSeenAchievement(achievementName) {
        const seen = localStorage.getItem('seenAchievements');
        return seen ? JSON.parse(seen).includes(achievementName) : false;
    }

    markAchievementAsSeen(achievementName) {
        const seen = localStorage.getItem('seenAchievements');
        const seenList = seen ? JSON.parse(seen) : [];
        if (!seenList.includes(achievementName)) {
            seenList.push(achievementName);
            localStorage.setItem('seenAchievements', JSON.stringify(seenList));
        }
    }

    showAchievementNotification(achievement) {
        const message = `🏆 Achievement Unlocked!\n${achievement.name}\n${achievement.description}`;
        this.showNotification(message, 'success');
    }

    showDecisionResult(result) {
        const message = `${result.success ? '✅' : '❌'} ${result.message}`;
        if (result.success) {
            message += ` (Score: +${result.score})`;
        }
        this.showNotification(message, result.success ? 'success' : 'error');
    }

    generateNASAIrrigationAdvice() {
        const farmState = this.farmSimulation.getFarmState();
        const avgWaterLevel = farmState.crops.reduce((sum, crop) => sum + crop.water_level, 0) / farmState.crops.length;

        let advice = "";
        if (avgWaterLevel < 0.3) {
            advice = "🚨 SMAP data shows critically low soil moisture. Heavy irrigation recommended immediately.";
        } else if (avgWaterLevel < 0.6) {
            advice = "⚠️ SMAP data indicates below-optimal soil moisture. Medium irrigation suggested.";
        } else {
            advice = "✅ SMAP data shows adequate soil moisture. Light irrigation or wait for natural precipitation.";
        }

        document.getElementById('nasaIrrigationAdvice').textContent = advice;
    }

    // Utility functions
    getResourceIcon(resource) {
        const icons = {
            water: '💧',
            fertilizer: '🌱',
            seeds: '🌰',
            money: '💰',
            fuel: '⛽'
        };
        return icons[resource] || '📦';
    }

    getAlertIcon(type) {
        const icons = {
            drought: '🌵',
            harvest_ready: '🌾',
            low_resource: '📦',
            livestock_feed: '🐄',
            financial: '💰',
            weather: '🌤️'
        };
        return icons[type] || '⚠️';
    }

    showModal(content = '') {
        let modalElement = document.getElementById('gameModal');

        // Create modal if it doesn't exist
        if (!modalElement) {
            modalElement = document.createElement('div');
            modalElement.id = 'gameModal';
            modalElement.className = 'modal';
            modalElement.innerHTML = `
                <div class="modal-content">
                    <div class="modal-body" id="modalBody">
                        ${content}
                    </div>
                </div>
            `;
            document.body.appendChild(modalElement);
        } else {
            // Update existing modal content
            const modalBody = modalElement.querySelector('#modalBody');
            if (modalBody) {
                modalBody.innerHTML = content;
            }
        }

        modalElement.style.display = 'block';

        // Add click outside to close
        modalElement.onclick = (e) => {
            if (e.target === modalElement) {
                this.closeModal();
            }
        };

        // Setup option card click handlers for irrigation decisions using MutationObserver
        const modalBody = document.querySelector('#modalBody');
        if (modalBody) {
            const observer = new MutationObserver(() => {
                this.setupOptionCardHandlers();
                observer.disconnect();
            });

            observer.observe(modalBody, { childList: true, subtree: true });
        } else {
            // Fallback to setTimeout if modalBody not found
            setTimeout(() => {
                this.setupOptionCardHandlers();
            }, 50);
        }
    }

    closeModal() {
        const modal = document.getElementById('gameModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Enhanced cleanup of processing states from option cards
        const processingCards = document.querySelectorAll('.option-card.processing');
        console.log(`Cleaning up ${processingCards.length} processing cards on modal close`);

        processingCards.forEach((card, index) => {
            console.log(`Removing processing state from card ${index}`);
            card.classList.remove('processing');
        });

        // Clean up event handlers to prevent memory leaks
        const modalContent = document.querySelector('.modal-content');
        if (modalContent && modalContent.optionCardHandler) {
            modalContent.removeEventListener('click', modalContent.optionCardHandler);
            modalContent.optionCardHandler = null;
            console.log('🧹 Cleaned up modal-content event handler');
        }
    }

    setupOptionCardHandlers() {
        console.log('🔧 Setting up event delegation on modal-content...');

        const modalContent = document.querySelector('.modal-content');
        if (!modalContent) {
            console.error('❌ Modal content not found!');
            return;
        }

        // Remove existing handler if it exists
        if (modalContent.optionCardHandler) {
            modalContent.removeEventListener('click', modalContent.optionCardHandler);
        }

        // Create new handler function with improved event delegation
        modalContent.optionCardHandler = (e) => {
            const card = e.target.closest('.option-card');
            if (!card) return;

            // Prevent multiple clicks
            if (card.classList.contains('processing')) {
                console.log('Card already processing, ignoring click');
                return;
            }

            const action = card.dataset.action;
            const type = card.dataset.type;

            console.log(`Option card clicked: ${type} - ${action}`);

            if (!action || !type) {
                console.warn('Missing action or type data attributes');
                console.log('Card attributes:', [...card.attributes].map(attr => `${attr.name}="${attr.value}"`).join(', '));
                return;
            }

            // Add processing state
            card.classList.add('processing');

            try {
                switch (type) {
                    case 'irrigation':
                        this.makeIrrigationDecision(action, this.currentNasaScenario);
                        break;
                    case 'fertilizer':
                        this.makeFertilizerDecision(action, this.currentNasaScenario);
                        break;
                    case 'livestock':
                        this.makeLivestockDecision(action, null);
                        break;
                    case 'crisis':
                        this.makeCrisisDecision(action, null);
                        break;
                    default:
                        console.warn(`Unknown option card type: ${type}`);
                        card.classList.remove('processing');
                        return;
                }

                // Automatic modal close after successful decision processing
                setTimeout(() => {
                    // Safely remove processing state if card still exists in DOM
                    if (card && card.parentNode) {
                        card.classList.remove('processing');
                        console.log(`Processing state removed from ${type} - ${action} card`);
                    }

                    // Check if modal is still open before closing
                    const modal = document.getElementById('gameModal');
                    if (modal && modal.style.display !== 'none') {
                        console.log('Auto-closing modal after decision processing');
                        this.closeModal();
                    }
                }, 1500);

            } catch (error) {
                console.error('Error handling option card click:', error);
                card.classList.remove('processing');

                // Show user-friendly error message
                this.showNotification('An error occurred processing your decision. Please try again.', 'error');
            }
        };

        // Add the event listener to modal-content
        modalContent.addEventListener('click', modalContent.optionCardHandler);
        console.log('✅ Event delegation handler attached to modal-content');

        // Validation
        const optionCards = modalContent.querySelectorAll('.option-card');
        console.log(`Found ${optionCards.length} option cards in modal-content`);
    }

    updateCropDisplay() {
        const farmState = this.farmSimulation.getFarmState();

        // Update crop cards in the crops view
        const cropsContainer = document.querySelector('#game-view-crops .crops-grid');
        if (cropsContainer && farmState.crops) {
            cropsContainer.innerHTML = farmState.crops.map(crop => {
                // Calculate derived properties safely
                const cropAge = farmState.currentWeek - (crop.planted_week || 0);
                const cropName = crop.type ? crop.type.charAt(0).toUpperCase() + crop.type.slice(1) : 'Unknown';
                const growthProgress = (crop.growth_progress || 0) * 100;
                const waterLevel = (crop.water_level || 0) * 100;
                const nutrientLevel = (crop.nutrient_level || 0) * 100;
                const healthLevel = (crop.health || 0) * 100;

                // Estimate weeks to harvest based on growth stage
                const weeksToHarvest = crop.ready_for_harvest ? 0 :
                    crop.current_stage === 'mature' ? 1 :
                    crop.current_stage === 'flowering' ? 2 :
                    crop.current_stage === 'vegetative' ? 4 :
                    crop.current_stage === 'germination' ? 6 : 3;

                return `
                <div class="crop-card">
                    <div class="crop-header">
                        <span class="crop-name">${crop.emoji || '🌾'} ${cropName}</span>
                        <span class="crop-area">${crop.area || 10} hectares</span>
                    </div>

                    <div class="crop-stats">
                        <div class="stat-row">
                            <span class="stat-label">Growth:</span>
                            <div class="stat-bar">
                                <div class="stat-fill growth" style="width: ${growthProgress}%"></div>
                            </div>
                            <span class="stat-value">${growthProgress.toFixed(0)}%</span>
                        </div>

                        <div class="stat-row">
                            <span class="stat-label">Water:</span>
                            <div class="stat-bar">
                                <div class="stat-fill water" style="width: ${waterLevel}%"></div>
                            </div>
                            <span class="stat-value">${waterLevel.toFixed(0)}%</span>
                        </div>

                        <div class="stat-row">
                            <span class="stat-label">Nutrients:</span>
                            <div class="stat-bar">
                                <div class="stat-fill nutrients" style="width: ${nutrientLevel}%"></div>
                            </div>
                            <span class="stat-value">${nutrientLevel.toFixed(0)}%</span>
                        </div>

                        <div class="stat-row">
                            <span class="stat-label">Health:</span>
                            <div class="stat-bar">
                                <div class="stat-fill health" style="width: ${healthLevel}%"></div>
                            </div>
                            <span class="stat-value">${healthLevel.toFixed(0)}%</span>
                        </div>
                    </div>

                    <div class="crop-footer">
                        <span class="crop-stage">Stage: ${crop.current_stage || 'Unknown'}</span>
                        <span class="crop-health">${crop.ready_for_harvest ? '✅ Ready to Harvest!' : `🕒 ${weeksToHarvest} weeks to harvest`}</span>
                    </div>
                </div>
                `;
            }).join('');
        }

        // Update score displays
        this.updateScoreDisplay(farmState);
    }

    updateResourcesDisplay(farmState) {
        if (!farmState) {
            farmState = this.farmSimulation.getFarmState();
        }

        // Ensure resources exist with fallback values
        const resources = farmState.resources || {};
        const money = resources.money || 0;
        const water = resources.water || 0;
        const fertilizer = resources.fertilizer || 0;
        const fuel = resources.fuel || 0;
        const seeds = resources.seeds || 0;

        // Update money and water displays in the UI
        const totalMoneyElement = document.getElementById('totalMoney');
        const moneyElements = document.querySelectorAll('[data-display="money"], .money-value, #farmMoney');
        const waterElements = document.querySelectorAll('[data-display="water"], .water-value, #farmWater');

        // Update the main money display in header
        if (totalMoneyElement) {
            totalMoneyElement.textContent = `$${money.toLocaleString()}`;
        }

        // Update other money displays
        moneyElements.forEach(element => {
            if (element) {
                element.textContent = `$${money.toLocaleString()}`;
            }
        });

        // Update water displays
        waterElements.forEach(element => {
            if (element) {
                element.textContent = `${water} units`;
            }
        });

        // Update all resource displays
        const resourceElements = document.querySelectorAll('[data-display="fertilizer"], .fertilizer-value');
        resourceElements.forEach(element => {
            if (element) {
                element.textContent = `${fertilizer} units`;
            }
        });

        // Update efficiency display
        const efficiencyElement = document.getElementById('efficiency');
        if (efficiencyElement && farmState.playerStats) {
            const efficiency = farmState.playerStats.waterEfficiency || 0;
            efficiencyElement.textContent = `${(efficiency * 100).toFixed(0)}%`;
        }

        // Update resource bars if they exist
        const moneyBar = document.querySelector('.money-bar .progress-fill');
        const waterBar = document.querySelector('.water-bar .progress-fill');

        if (moneyBar) {
            const maxMoney = 10000; // Assume max money for percentage calculation
            const moneyPercent = Math.min(100, (money / maxMoney) * 100);
            moneyBar.style.width = `${moneyPercent}%`;
        }

        if (waterBar) {
            const maxWater = 1000; // Assume max water for percentage calculation
            const waterPercent = Math.min(100, (water / maxWater) * 100);
            waterBar.style.width = `${waterPercent}%`;
        }

        // Update NASA environmental data display
        this.updateEnvironmentalDataDisplay(farmState);

        console.log('UI updated with resources:', {
            money: money,
            water: water,
            fertilizer: fertilizer,
            totalMoneyElement: totalMoneyElement?.textContent
        });
    }

    /**
     * Update environmental data display from NASA satellites
     */
    updateEnvironmentalDataDisplay(farmState) {
        const envData = farmState.environmentalData || {};

        // Update SMAP soil moisture - INCLUDING the header NASA Live Data
        const soilMoistureValueElement = document.getElementById('soilMoistureValue');
        if (soilMoistureValueElement) {
            const moisturePercent = ((envData.soilMoisture || 0.5) * 100).toFixed(1);
            soilMoistureValueElement.textContent = `${moisturePercent}%`;
        }

        // Also update other soil moisture elements
        const soilMoistureElements = document.querySelectorAll('[data-display="soilMoisture"], .soil-moisture-value');
        soilMoistureElements.forEach(element => {
            if (element && element.id !== 'soilMoistureValue') {
                const moisturePercent = ((envData.soilMoisture || 0.5) * 100).toFixed(1);
                element.textContent = `${moisturePercent}%`;
            }
        });

        // Update NDVI vegetation health - INCLUDING the header NASA Live Data
        const ndviValueElement = document.getElementById('ndviValue');
        if (ndviValueElement) {
            const ndviValue = (envData.vegetationHealth || 0.5).toFixed(3);
            ndviValueElement.textContent = ndviValue;
        }

        // Also update other NDVI elements
        const ndviElements = document.querySelectorAll('[data-display="vegetationHealth"], .ndvi-value');
        ndviElements.forEach(element => {
            if (element && element.id !== 'ndviValue') {
                const ndviValue = (envData.vegetationHealth || 0.5).toFixed(3);
                element.textContent = ndviValue;
            }
        });

        // Update temperature - INCLUDING the header NASA Live Data
        const tempValueElement = document.getElementById('tempValue');
        if (tempValueElement) {
            const tempValue = (envData.temperature || 25).toFixed(1);
            tempValueElement.textContent = `${tempValue}°C`;
        }

        // Also update other temperature elements
        const temperatureElements = document.querySelectorAll('#satelliteTemp, .temperature-value');
        temperatureElements.forEach(element => {
            if (element && element.id !== 'tempValue') {
                const tempValue = (envData.temperature || 25).toFixed(1);
                element.textContent = `${tempValue}°C`;
            }
        });

        // Update consumption multipliers
        const waterMultiplierElements = document.querySelectorAll('[data-display="waterMultiplier"], .water-multiplier-value');
        waterMultiplierElements.forEach(element => {
            if (element) {
                const multiplier = (envData.waterConsumptionMultiplier || 1.0).toFixed(2);
                element.textContent = `${multiplier}x`;
            }
        });

        const nutrientMultiplierElements = document.querySelectorAll('[data-display="nutrientMultiplier"], .nutrient-multiplier-value');
        nutrientMultiplierElements.forEach(element => {
            if (element) {
                const multiplier = (envData.nutrientConsumptionMultiplier || 1.0).toFixed(2);
                element.textContent = `${multiplier}x`;
            }
        });

        // Update environmental data bars if they exist
        const soilMoistureBar = document.querySelector('.soil-moisture-bar .progress-fill');
        const ndviBar = document.querySelector('.ndvi-bar .progress-fill');

        if (soilMoistureBar) {
            const moisturePercent = (envData.soilMoisture || 0.5) * 100;
            soilMoistureBar.style.width = `${moisturePercent}%`;

            // Color coding: red for low, yellow for medium, green for high
            if (moisturePercent < 30) {
                soilMoistureBar.style.background = 'linear-gradient(90deg, #dc3545, #ff6b6b)';
            } else if (moisturePercent < 70) {
                soilMoistureBar.style.background = 'linear-gradient(90deg, #ffc107, #ffeb3b)';
            } else {
                soilMoistureBar.style.background = 'linear-gradient(90deg, #28a745, #4caf50)';
            }
        }

        if (ndviBar) {
            // Convert NDVI (-1 to 1) to percentage (0-100%)
            const ndviPercent = ((envData.vegetationHealth || 0.5) + 1) * 50;
            ndviBar.style.width = `${ndviPercent}%`;

            // Color coding: brown for poor, yellow for fair, green for good
            if (ndviPercent < 40) {
                ndviBar.style.background = 'linear-gradient(90deg, #8b4513, #cd853f)';
            } else if (ndviPercent < 70) {
                ndviBar.style.background = 'linear-gradient(90deg, #ffa500, #ffb347)';
            } else {
                ndviBar.style.background = 'linear-gradient(90deg, #228b22, #32cd32)';
            }
        }

        console.log('🛰️ Environmental data updated:', {
            soilMoisture: `${((envData.soilMoisture || 0.5) * 100).toFixed(1)}%`,
            vegetationHealth: (envData.vegetationHealth || 0.5).toFixed(3),
            waterMultiplier: `${(envData.waterConsumptionMultiplier || 1.0).toFixed(2)}x`,
            nutrientMultiplier: `${(envData.nutrientConsumptionMultiplier || 1.0).toFixed(2)}x`
        });
    }

    updateScoreDisplay(farmState) {
        // Update scores in the header or score panel
        const scoreElements = {
            totalScore: document.querySelector('#totalScore'),
            sustainabilityScore: document.querySelector('#sustainabilityScore'),
            dataScore: document.querySelector('#dataScore')
        };

        const stats = farmState.playerStats || {};

        if (scoreElements.totalScore) {
            scoreElements.totalScore.textContent = stats.totalScore || 0;
        }
        if (scoreElements.sustainabilityScore) {
            scoreElements.sustainabilityScore.textContent = stats.sustainabilityScore || 0;
        }
        if (scoreElements.dataScore) {
            scoreElements.dataScore.textContent = stats.nasaScore || 0;
        }

        // Update any score displays in the current view
        const currentScoreElements = document.querySelectorAll('[data-display="score"], .score-value, .total-score');
        currentScoreElements.forEach(element => {
            if (element) {
                element.textContent = stats.totalScore || 0;
            }
        });
    }

    showScoreChange(scoreChange) {
        const scoreElement = document.querySelector('#totalScore, [data-display="score"], .score-value');
        if (scoreElement) {
            // Create floating score change indicator
            const changeIndicator = document.createElement('div');
            changeIndicator.className = `score-change ${scoreChange > 0 ? 'positive' : 'negative'}`;
            changeIndicator.textContent = `${scoreChange > 0 ? '+' : ''}${scoreChange}`;
            changeIndicator.style.cssText = `
                position: absolute;
                top: 0;
                right: -40px;
                color: ${scoreChange > 0 ? '#4CAF50' : '#F44336'};
                font-weight: bold;
                font-size: 1.2em;
                opacity: 1;
                transform: translateY(0);
                transition: all 0.8s ease;
                pointer-events: none;
                z-index: 1000;
            `;

            // Position relative to score element
            const rect = scoreElement.getBoundingClientRect();
            changeIndicator.style.position = 'fixed';
            changeIndicator.style.top = `${rect.top}px`;
            changeIndicator.style.left = `${rect.right + 10}px`;

            document.body.appendChild(changeIndicator);

            // Animate the change indicator
            setTimeout(() => {
                changeIndicator.style.transform = 'translateY(-30px)';
                changeIndicator.style.opacity = '0';
            }, 100);

            // Remove after animation
            setTimeout(() => {
                changeIndicator.remove();
            }, 900);

            // Add brief highlight to score element
            scoreElement.style.transition = 'all 0.3s ease';
            scoreElement.style.backgroundColor = scoreChange > 0 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
            setTimeout(() => {
                scoreElement.style.backgroundColor = '';
            }, 600);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    togglePause() {
        // Toggle pause state
        this.isPaused = !this.isPaused;

        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            if (this.isPaused) {
                pauseBtn.textContent = '▶️ Resume';
                this.stopSpeedTimer();
                this.showNotification('⏸️ Game paused', 'info');
            } else {
                pauseBtn.textContent = '⏸️ Pause';
                if (this.gameSpeed) {
                    this.startSpeedTimer();
                }
                this.showNotification('▶️ Game resumed', 'info');
            }
        }
    }

    changeSpeed() {
        // Cycle through different speed modes
        if (!this.gameSpeed) this.gameSpeed = 1;

        // Stop current timer if running
        if (this.speedTimer) {
            clearInterval(this.speedTimer);
            this.speedTimer = null;
        }

        this.gameSpeed = this.gameSpeed === 1 ? 2 : this.gameSpeed === 2 ? 4 : 1;

        const speedBtn = document.getElementById('speedBtn');
        if (speedBtn) {
            const speedTexts = {
                1: '⏩ Speed',
                2: '⏩⏩ Fast',
                4: '⏩⏩⏩ Ultra'
            };
            speedBtn.textContent = speedTexts[this.gameSpeed];
        }

        // Start continuous time advancement based on speed (only if not paused)
        if (!this.isPaused) {
            this.startSpeedTimer();
        }

        this.showNotification(`Game speed set to ${this.gameSpeed}x`, 'info');
    }

    startSpeedTimer() {
        if (this.speedTimer) {
            clearInterval(this.speedTimer);
        }

        // Speed intervals: 1x = 3 seconds, 2x = 1.5 seconds, 4x = 0.75 seconds
        const intervals = {
            1: 3000,
            2: 1500,
            4: 750
        };

        const interval = intervals[this.gameSpeed || 1];
        console.log(`🚀 Starting speed timer with interval: ${interval}ms at speed ${this.gameSpeed}x`);

        this.speedTimer = setInterval(() => {
            console.log('⏰ Speed timer tick - advancing time...');

            // Advance time and update crops
            this.farmSimulation.advanceTime();

            // Update all UI displays
            this.updateDisplay();
            this.updateCropDisplay();

            const farmState = this.farmSimulation.getFarmState();
            this.updateResourcesDisplay(farmState);

            console.log(`📊 Current week: ${farmState.currentWeek}, season: ${farmState.currentSeason}`);

        }, interval);

        console.log(`✅ Speed timer started successfully with ID: ${this.speedTimer}`);
    }

    stopSpeedTimer() {
        if (this.speedTimer) {
            clearInterval(this.speedTimer);
            this.speedTimer = null;
        }
    }

    // Cleanup function for when the component is destroyed
    destroy() {
        this.stopSpeedTimer();
        // Clear any other timers or event listeners if needed
    }

    async updateNASAData() {
        try {
            // Show loading notification
            this.showNotification('📡 Updating NASA satellite data...', 'info');

            // Check if main app is available
            if (window.app && typeof window.app.fetchSampleData === 'function') {
                // Use the main app's fetch data function
                await window.app.fetchSampleData();
                this.showNotification('✅ NASA data updated successfully!', 'success');
            } else if (window.TerraData && window.TerraData.updateSatelliteData) {
                // Alternative: use the global TerraData updateSatelliteData function
                await window.TerraData.updateSatelliteData();
                this.showNotification('✅ NASA satellite data updated!', 'success');
            } else {
                // Fallback: simulate data update with realistic delay
                await new Promise(resolve => setTimeout(resolve, 2000));
                this.generateNewNASAData();
                this.showNotification('✅ NASA data simulation updated!', 'success');
            }

            // Update farm state with new data
            this.refreshFarmDisplay();

        } catch (error) {
            console.error('Failed to update NASA data:', error);
            this.showNotification('❌ Failed to update NASA data. Using cached data.', 'error');
        }
    }

    generateNewNASAData() {
        // Generate new realistic NASA data for the farm simulation
        const farmState = this.farmSimulation.getFarmState();

        // Update farm state with new simulated NASA data
        farmState.nasaData = {
            lastUpdate: new Date().toISOString(),
            soilMoisture: Math.random() * 100,
            vegetationIndex: Math.random() * 0.8 + 0.2,
            temperature: 15 + Math.random() * 20,
            rainfall: Math.random() * 100,
            updated: true
        };

        console.log('Generated new NASA data:', farmState.nasaData);
    }

    refreshFarmDisplay() {
        // Refresh the farm display with new data
        const farmStatusElement = document.querySelector('.farm-status');
        if (farmStatusElement) {
            const farmState = this.farmSimulation.getFarmState();
            const lastUpdate = farmState.nasaData?.lastUpdate || new Date().toISOString();
            const updateTime = new Date(lastUpdate).toLocaleTimeString();

            // Update the NASA data display
            const nasaDataElement = farmStatusElement.querySelector('.nasa-data-timestamp');
            if (nasaDataElement) {
                nasaDataElement.textContent = `Last NASA update: ${updateTime}`;
            }
        }

        // Trigger display update
        this.updateDisplay();
    }

    updateDecisionPanel(activeView) {
        const decisionButtons = document.getElementById('decisionButtons');
        if (!decisionButtons) return;

        const buttonConfigs = {
            overview: [
                { text: '💧 Irrigate Crops', onclick: 'farmGameUI.showIrrigationDialog()' },
                { text: '🌱 Apply Fertilizer', onclick: 'farmGameUI.showFertilizerDialog()' },
                { text: '🌾 Harvest Crops', onclick: 'farmGameUI.showHarvestDialog()' },
                { text: '🎓 NASA Tutorial', onclick: 'farmGameUI.startNASATutorial()' },
                { text: '🌿 Conservation', onclick: 'farmGameUI.showConservationDashboard()' },
                { text: '🧠 NASA Challenge', onclick: 'farmGameUI.showNASADecisionChallenge()' },
                { text: '🐄 Manage Livestock', onclick: 'farmGameUI.showLivestockDialog()' }
            ],
            crops: [
                { text: '💧 Irrigate Crops', onclick: 'farmGameUI.showIrrigationDialog()' },
                { text: '🌱 Apply Fertilizer', onclick: 'farmGameUI.showFertilizerDialog()' },
                { text: '🌾 Harvest Crops', onclick: 'farmGameUI.showHarvestDialog()' },
                { text: '🌱 Plant New Crop', onclick: 'farmGameUI.plantNewCrop()' },
                { text: '📊 Crop Analysis', onclick: 'farmGameUI.showCropAnalysis()' },
                { text: '🌿 Conservation', onclick: 'farmGameUI.showConservationDashboard()' }
            ],
            livestock: [
                { text: '🐄 Manage Livestock', onclick: 'farmGameUI.showLivestockDialog()' },
                { text: '🥛 Feed Animals', onclick: 'farmGameUI.feedAnimals()' },
                { text: '🏥 Veterinary Care', onclick: 'farmGameUI.showVeterinaryDialog()' },
                { text: '🐣 Breeding Program', onclick: 'farmGameUI.showBreedingDialog()' }
            ],
            resources: [
                { text: '💰 Financial Planning', onclick: 'farmGameUI.showFinancialDialog()' },
                { text: '📦 Manage Inventory', onclick: 'farmGameUI.showInventoryDialog()' },
                { text: '🛒 Purchase Supplies', onclick: 'farmGameUI.showSupplyDialog()' },
                { text: '📊 Resource Analysis', onclick: 'farmGameUI.showResourceAnalysis()' }
            ],
            seasonal: [
                { text: '📅 Plan Season', onclick: 'farmGameUI.showSeasonPlanDialog()' },
                { text: '🌦️ Weather Response', onclick: 'farmGameUI.showWeatherDialog()' },
                { text: '🎯 Set Goals', onclick: 'farmGameUI.showGoalsDialog()' },
                { text: '📈 Progress Review', onclick: 'farmGameUI.showProgressDialog()' }
            ],
            achievements: [
                { text: '🏆 View Achievements', onclick: 'farmGameUI.showAchievementsDialog()' },
                { text: '🎯 Set New Goals', onclick: 'farmGameUI.showGoalsDialog()' },
                { text: '📊 Performance Stats', onclick: 'farmGameUI.showStatsDialog()' },
                { text: '🔓 Unlock Challenges', onclick: 'farmGameUI.showChallengesDialog()' }
            ],
            alerts: [
                { text: '⚠️ Address Alerts', onclick: 'farmGameUI.addressActiveAlerts()' },
                { text: '🔔 Configure Alerts', onclick: 'farmGameUI.showAlertSettings()' },
                { text: '📱 Notification Settings', onclick: 'farmGameUI.showNotificationSettings()' },
                { text: '🚨 Emergency Response', onclick: 'farmGameUI.showEmergencyDialog()' }
            ]
        };

        const buttons = buttonConfigs[activeView] || buttonConfigs.overview;

        decisionButtons.innerHTML = buttons.map(button => `
            <button class="decision-btn" onclick="${button.onclick}">
                ${button.text}
            </button>
        `).join('');
    }

    updateDisplay() {
        // Update NASA data display values
        this.updateNASADataDisplay();

        // Update farm status display
        this.updateFarmStatus(this.farmSimulation.getFarmState());
    }

    initializeNASAData() {
        const farmState = this.farmSimulation.getFarmState();

        // Initialize NASA data if not present
        if (!farmState.nasaData) {
            farmState.nasaData = {
                lastUpdate: new Date().toISOString(),
                soilMoisture: 45 + Math.random() * 30, // 45-75%
                vegetationIndex: 0.4 + Math.random() * 0.4, // 0.4-0.8
                temperature: 18 + Math.random() * 12, // 18-30°C
                rainfall: Math.random() * 50,
                updated: true
            };
            console.log('Initialized NASA data:', farmState.nasaData);
        }
    }

    updateNASADataDisplay() {
        const farmState = this.farmSimulation.getFarmState();
        const nasaData = farmState.nasaData || {};

        // Update soil moisture
        const soilMoistureElement = document.getElementById('soilMoistureValue');
        if (soilMoistureElement) {
            const soilMoisture = nasaData.soilMoisture || (Math.random() * 100);
            soilMoistureElement.textContent = `${soilMoisture.toFixed(1)}%`;
            soilMoistureElement.className = `data-value ${soilMoisture < 30 ? 'critical' : soilMoisture < 60 ? 'warning' : 'good'}`;
        }

        // Update NDVI
        const ndviElement = document.getElementById('ndviValue');
        if (ndviElement) {
            const ndvi = nasaData.vegetationIndex || (Math.random() * 0.8 + 0.2);
            ndviElement.textContent = ndvi.toFixed(3);
            ndviElement.className = `data-value ${ndvi < 0.4 ? 'critical' : ndvi < 0.7 ? 'warning' : 'good'}`;
        }

        // Update temperature
        const temperatureElement = document.getElementById('temperatureValue');
        if (temperatureElement) {
            const temperature = nasaData.temperature || (15 + Math.random() * 20);
            temperatureElement.textContent = `${temperature.toFixed(1)}°C`;
            temperatureElement.className = `data-value ${temperature < 5 ? 'critical' : temperature > 35 ? 'warning' : 'good'}`;
        }
    }

    toggleInstructions() {
        const instructionsContent = document.getElementById('instructionsContent');
        const toggleBtn = document.querySelector('.toggle-instructions');

        if (instructionsContent.style.display === 'none') {
            instructionsContent.style.display = 'block';
            toggleBtn.textContent = '📖';
            toggleBtn.title = 'Hide instructions';
        } else {
            instructionsContent.style.display = 'none';
            toggleBtn.textContent = '❓';
            toggleBtn.title = 'Show instructions';
        }
    }

    showWelcomeGuidance() {
        this.showNotification('Welcome to NASA Farm Navigators! Click any Farm Decision button to start using real satellite data.', 'success');

        // Highlight the decision panel for new users
        const decisionPanel = document.querySelector('.decision-panel');
        if (decisionPanel) {
            decisionPanel.style.animation = 'pulse 2s ease-in-out 3';
            setTimeout(() => {
                decisionPanel.style.animation = '';
            }, 6000);
        }
    }

    initializeNASAPanelState() {
        // Start with NASA panel collapsed to reduce screen clutter
        const content = document.getElementById('nasaPanelContent');
        const toggleIcon = document.getElementById('nasaPanelToggleIcon');
        const panel = document.getElementById('nasaDataPanel');

        if (content && toggleIcon && panel) {
            content.style.display = 'none';
            toggleIcon.textContent = '📡';
            panel.classList.add('collapsed');
        }
    }

    toggleNASAPanel() {
        const panel = document.getElementById('nasaDataPanel');
        const content = document.getElementById('nasaPanelContent');
        const toggleIcon = document.getElementById('nasaPanelToggleIcon');

        if (content.style.display === 'none') {
            // Show panel
            content.style.display = 'block';
            toggleIcon.textContent = '📌';
            panel.classList.remove('collapsed');
            this.showNotification('📡 NASA Data panel expanded', 'info');
        } else {
            // Hide panel
            content.style.display = 'none';
            toggleIcon.textContent = '📡';
            panel.classList.add('collapsed');
            this.showNotification('📡 NASA Data panel collapsed', 'info');
        }
    }

    /**
     * Generate realistic NASA irrigation scenario based on farm state
     */
    generateNASAIrrigationScenario(farmState) {
        const season = farmState.currentSeason;
        const week = farmState.currentWeek;

        // Generate realistic seasonal data
        let baseTemperature, baseSoilMoisture, baseRainChance;

        switch (season) {
            case 'spring':
                baseTemperature = 15 + Math.random() * 10;
                baseSoilMoisture = 60 + Math.random() * 20;
                baseRainChance = 50 + Math.random() * 30;
                break;
            case 'summer':
                baseTemperature = 25 + Math.random() * 10;
                baseSoilMoisture = 30 + Math.random() * 30;
                baseRainChance = 20 + Math.random() * 40;
                break;
            case 'fall':
                baseTemperature = 10 + Math.random() * 15;
                baseSoilMoisture = 50 + Math.random() * 30;
                baseRainChance = 40 + Math.random() * 40;
                break;
            case 'winter':
                baseTemperature = 0 + Math.random() * 10;
                baseSoilMoisture = 70 + Math.random() * 20;
                baseRainChance = 60 + Math.random() * 30;
                break;
            default:
                baseTemperature = 15;
                baseSoilMoisture = 50;
                baseRainChance = 50;
        }

        // Add some variability based on week
        const weekVariability = Math.sin((week % 52) * 0.12) * 0.2;

        const scenario = {
            soilMoisture: Math.max(0, Math.min(100, Math.round(baseSoilMoisture + weekVariability * 20))),
            vegetationHealth: Math.max(0.1, Math.min(1.0, 0.6 + weekVariability * 0.3)),
            rainForecast: Math.max(0, Math.min(100, Math.round(baseRainChance + weekVariability * 20))),
            temperature: Math.round(baseTemperature + weekVariability * 5),
            temperatureTrend: weekVariability > 0.1 ? 'rising' : weekVariability < -0.1 ? 'falling' : 'stable'
        };

        // Determine recommended action based on conditions
        if (scenario.soilMoisture < 30 && scenario.rainForecast < 30) {
            scenario.recommendedAction = 'heavy';
            scenario.recommendation = 'Critical soil moisture levels detected. Heavy irrigation recommended to prevent crop stress.';
        } else if (scenario.soilMoisture < 50 && scenario.rainForecast < 50) {
            scenario.recommendedAction = 'medium';
            scenario.recommendation = 'Moderate drought conditions. Medium irrigation will maintain optimal growing conditions.';
        } else if (scenario.soilMoisture > 70 || scenario.rainForecast > 70) {
            scenario.recommendedAction = 'wait';
            scenario.recommendation = 'Adequate soil moisture and/or high rain probability. Consider waiting to avoid overwatering.';
        } else {
            scenario.recommendedAction = 'light';
            scenario.recommendation = 'Stable conditions. Light irrigation will maintain crop health efficiently.';
        }

        return scenario;
    }

    /**
     * Calculate crop stress level based on conditions
     */
    calculateCropStress(crop, nasaScenario) {
        let stressScore = 0;

        // Water stress
        if (crop.water_level < 0.3) stressScore += 2;
        else if (crop.water_level < 0.6) stressScore += 1;

        // Soil moisture stress
        if (nasaScenario.soilMoisture < 30) stressScore += 2;
        else if (nasaScenario.soilMoisture < 50) stressScore += 1;

        // Temperature stress
        if (nasaScenario.temperature > 35 || nasaScenario.temperature < 5) stressScore += 2;
        else if (nasaScenario.temperature > 30 || nasaScenario.temperature < 10) stressScore += 1;

        // Vegetation health factor
        if (nasaScenario.vegetationHealth < 0.4) stressScore += 1;

        if (stressScore >= 4) return 'high';
        if (stressScore >= 2) return 'medium';
        return 'low';
    }

    /**
     * Show fertilization dialog with seasonal timing considerations
     */
    showFertilizerDialog() {
        const farmState = this.farmSimulation.getFarmState();

        // Generate seasonal fertilization scenario
        const fertilizerScenario = this.generateFertilizerScenario(farmState);

        const content = `
            <div class="modal-header">
                <h3>🌱 Fertilization Decision - Week ${farmState.currentWeek} (${farmState.currentSeason})</h3>
            </div>
            <p>Choose the right fertilization strategy based on seasonal cycles and crop needs:</p>

            <div class="nasa-data-panel">
                <h4>🌾 Seasonal Growing Conditions</h4>
                <div class="satellite-metrics">
                    <div class="metric">
                        <strong>Season Status:</strong> <span class="${fertilizerScenario.seasonOptimal ? 'good' : 'warning'}">${fertilizerScenario.seasonStatus}</span>
                    </div>
                    <div class="metric">
                        <strong>Soil Temperature:</strong> <span class="${fertilizerScenario.soilTemp < 10 ? 'poor' : fertilizerScenario.soilTemp > 25 ? 'warning' : 'good'}">${fertilizerScenario.soilTemp}°C</span>
                    </div>
                    <div class="metric">
                        <strong>Nutrient Absorption:</strong> <span class="${fertilizerScenario.absorptionRate < 0.4 ? 'poor' : fertilizerScenario.absorptionRate < 0.7 ? 'fair' : 'good'}">${(fertilizerScenario.absorptionRate * 100).toFixed(0)}% efficiency</span>
                    </div>
                    <div class="metric">
                        <strong>Growth Phase:</strong> <span class="${fertilizerScenario.growthPhase === 'optimal' ? 'good' : fertilizerScenario.growthPhase === 'moderate' ? 'warning' : 'poor'}">${fertilizerScenario.growthPhase}</span>
                    </div>
                </div>
                <div class="nasa-recommendation-box">
                    <strong>🧪 Agronomy Recommendation:</strong>
                    <p class="recommendation-text">${fertilizerScenario.recommendation}</p>
                </div>
            </div>

            <div class="current-conditions">
                <h4>Current Crop Nutrition Status:</h4>
                ${farmState.crops.map(crop => {
                    const nutritionStatus = this.assessCropNutrition(crop, fertilizerScenario);
                    return `
                    <div class="condition-item">
                        <span>${crop.type} (${crop.growth_stage}):</span>
                        <div class="nutrition-indicators">
                            <div class="nutrient-bar">
                                <span>N:</span>
                                <div class="bar ${nutritionStatus.nitrogen < 0.3 ? 'low' : nutritionStatus.nitrogen < 0.6 ? 'medium' : 'good'}" style="width: ${nutritionStatus.nitrogen * 100}%"></div>
                            </div>
                            <div class="nutrient-bar">
                                <span>P:</span>
                                <div class="bar ${nutritionStatus.phosphorus < 0.3 ? 'low' : nutritionStatus.phosphorus < 0.6 ? 'medium' : 'good'}" style="width: ${nutritionStatus.phosphorus * 100}%"></div>
                            </div>
                            <div class="nutrient-bar">
                                <span>K:</span>
                                <div class="bar ${nutritionStatus.potassium < 0.3 ? 'low' : nutritionStatus.potassium < 0.6 ? 'medium' : 'good'}" style="width: ${nutritionStatus.potassium * 100}%"></div>
                            </div>
                        </div>
                    </div>
                `;
                }).join('')}
            </div>

            <div class="irrigation-options">
                <div class="option-card ${fertilizerScenario.recommendedAction === 'organic' ? 'recommended' : ''}" data-action="organic" data-type="fertilizer">
                    <h5>🌿 Organic Fertilizer</h5>
                    <p>Cost: $30</p>
                    <p>Effect: Slow release, improves soil health</p>
                    <p>Best for: ${fertilizerScenario.seasonOptimal ? 'Long-term soil building in current season' : 'May not provide immediate nutrients when needed'}</p>
                    ${fertilizerScenario.recommendedAction === 'organic' ? '<div class="nasa-badge">🌟 Recommended</div>' : ''}
                </div>

                <div class="option-card ${fertilizerScenario.recommendedAction === 'synthetic' ? 'recommended' : ''}" data-action="synthetic" data-type="fertilizer">
                    <h5>⚗️ Synthetic NPK</h5>
                    <p>Cost: $50</p>
                    <p>Effect: Fast release, immediate nutrient boost</p>
                    <p>Best for: ${fertilizerScenario.growthPhase === 'optimal' ? 'Rapid growth phase like current crops' : 'May be too strong for current growth stage'}</p>
                    ${fertilizerScenario.recommendedAction === 'synthetic' ? '<div class="nasa-badge">🌟 Recommended</div>' : ''}
                </div>

                <div class="option-card ${fertilizerScenario.recommendedAction === 'targeted' ? 'recommended' : ''}" data-action="targeted" data-type="fertilizer">
                    <h5>🎯 Targeted Nutrients</h5>
                    <p>Cost: $75</p>
                    <p>Effect: Addresses specific deficiencies</p>
                    <p>Best for: ${fertilizerScenario.hasDeficiency ? 'Correcting specific nutrient deficiencies detected' : 'May be unnecessary with current balanced nutrition'}</p>
                    ${fertilizerScenario.recommendedAction === 'targeted' ? '<div class="nasa-badge">🌟 Recommended</div>' : ''}
                </div>

                <div class="option-card ${fertilizerScenario.recommendedAction === 'wait' ? 'recommended' : ''}" data-action="wait" data-type="fertilizer">
                    <h5>⏳ Delay Fertilization</h5>
                    <p>Cost: $0</p>
                    <p>Effect: Wait for better timing</p>
                    <p>Best for: ${!fertilizerScenario.seasonOptimal ? 'Poor seasonal conditions for nutrient absorption' : 'May miss optimal fertilization window'}</p>
                    ${fertilizerScenario.recommendedAction === 'wait' ? '<div class="nasa-badge">🌟 Recommended</div>' : ''}
                </div>
            </div>
        `;

        this.showModal(content);
    }

    /**
     * Show harvest dialog
     */
    showHarvestDialog() {
        const farmState = this.farmSimulation.getFarmState();

        // Check for ready crops
        const readyCrops = farmState.crops.filter(crop =>
            crop.ready_for_harvest ||
            crop.current_stage === 'mature' ||
            crop.growth_progress >= 0.9
        );

        if (readyCrops.length === 0) {
            this.showNotification('❌ No crops are ready for harvest yet!', 'error');
            return;
        }

        const content = `
            <div class="modal-header">
                <h3>🌾 Harvest Crops - Week ${farmState.currentWeek} (${farmState.currentSeason})</h3>
            </div>

            <div class="harvest-overview">
                <h4>🚜 Ready for Harvest</h4>
                <p>Choose which crops to harvest. Good timing maximizes yield and profit!</p>

                <div class="ready-crops">
                    ${readyCrops.map(crop => {
                        const expectedYield = this.calculateExpectedYield(crop);
                        const marketPrice = this.getMarketPrice(crop.type);
                        const revenue = expectedYield * marketPrice;
                        const harvestCost = crop.area * 25; // $25 per hectare
                        const profit = revenue - harvestCost;

                        return `
                        <div class="harvest-crop-card" onclick="farmGameUI.harvestCrop('${crop.type}')">
                            <div class="crop-header">
                                <h5>${crop.emoji || '🌾'} ${crop.type.charAt(0).toUpperCase() + crop.type.slice(1)}</h5>
                                <span class="crop-status ${crop.ready_for_harvest ? 'ready' : 'almost-ready'}">
                                    ${crop.ready_for_harvest ? '✅ Ready' : '⚠️ Almost Ready'}
                                </span>
                            </div>

                            <div class="harvest-details">
                                <div class="harvest-metric">
                                    <span>📏 Area:</span>
                                    <span>${crop.area} hectares</span>
                                </div>
                                <div class="harvest-metric">
                                    <span>🌾 Expected Yield:</span>
                                    <span>${expectedYield.toFixed(1)} tons</span>
                                </div>
                                <div class="harvest-metric">
                                    <span>💰 Market Price:</span>
                                    <span>$${marketPrice}/ton</span>
                                </div>
                                <div class="harvest-metric">
                                    <span>💵 Revenue:</span>
                                    <span>$${revenue.toFixed(0)}</span>
                                </div>
                                <div class="harvest-metric">
                                    <span>💸 Harvest Cost:</span>
                                    <span>$${harvestCost}</span>
                                </div>
                                <div class="harvest-metric profit">
                                    <span>📈 Profit:</span>
                                    <span class="${profit > 0 ? 'positive' : 'negative'}">$${profit.toFixed(0)}</span>
                                </div>
                            </div>

                            <div class="harvest-quality">
                                <span>Health: ${(crop.health * 100).toFixed(0)}%</span>
                                <span>Water: ${(crop.water_level * 100).toFixed(0)}%</span>
                                <span>Nutrients: ${(crop.nutrient_level * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>

                <div class="harvest-actions">
                    <button class="action-btn primary" onclick="farmGameUI.harvestAllReady()">
                        🚜 Harvest All Ready Crops
                    </button>
                    <button class="action-btn secondary" onclick="farmGameUI.closeModal()">
                        ⏳ Wait Longer
                    </button>
                </div>
            </div>
        `;

        this.showModal(content);
    }

    calculateExpectedYield(crop) {
        // Base yield per hectare for different crops
        const baseYields = {
            corn: 8.5,
            wheat: 6.2,
            tomatoes: 45.0,
            carrots: 35.0
        };

        const baseYield = baseYields[crop.type] || 5.0;
        const healthFactor = crop.health || 0.8;
        const waterFactor = Math.min(crop.water_level / 0.6, 1.0);
        const nutrientFactor = Math.min(crop.nutrient_level / 0.5, 1.0);

        return baseYield * crop.area * healthFactor * waterFactor * nutrientFactor;
    }

    getMarketPrice(cropType) {
        // Market prices per ton
        const prices = {
            corn: 180,
            wheat: 220,
            tomatoes: 850,
            carrots: 420
        };
        return prices[cropType] || 150;
    }

    harvestCrop(cropType) {
        const result = this.farmSimulation.harvestCrop(cropType);

        if (result.success) {
            this.updateResourcesDisplay();
            this.updateCropDisplay();
            this.closeModal();
            this.showNotification(result.message, 'success');

            // Show harvest results
            setTimeout(() => {
                this.showHarvestResults(result);
            }, 1000);
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    harvestAllReady() {
        const farmState = this.farmSimulation.getFarmState();
        const readyCrops = farmState.crops.filter(crop =>
            crop.ready_for_harvest ||
            crop.current_stage === 'mature' ||
            crop.growth_progress >= 0.9
        );

        let totalYield = 0;
        let harvestedCount = 0;

        readyCrops.forEach(crop => {
            const result = this.farmSimulation.harvestCrop(crop.type);
            if (result.success) {
                totalYield += result.yield || 0;
                harvestedCount++;
            }
        });

        this.updateResourcesDisplay();
        this.updateCropDisplay();
        this.closeModal();

        if (harvestedCount > 0) {
            this.showNotification(`🎉 Harvested ${harvestedCount} crops! Total yield: ${totalYield.toFixed(1)} bushels. Ready to sell!`, 'success');
        }
    }

    showHarvestResults(result) {
        const content = `
            <div class="modal-header">
                <h3>🎉 Harvest Complete!</h3>
            </div>

            <div class="harvest-results">
                <div class="result-summary">
                    <h4>📊 Harvest Summary</h4>
                    <div class="result-metrics">
                        <div class="metric">
                            <span class="metric-label">🌾 Crop:</span>
                            <span class="metric-value">${result.cropType}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">⚖️ Yield:</span>
                            <span class="metric-value">${result.yield?.toFixed(1) || 'N/A'} tons</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">💰 Revenue:</span>
                            <span class="metric-value">$${result.revenue?.toFixed(0) || 0}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">📈 Profit:</span>
                            <span class="metric-value profit ${(result.profit || 0) > 0 ? 'positive' : 'negative'}">
                                $${result.profit?.toFixed(0) || 0}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="next-steps">
                    <h4>🚀 What's Next?</h4>
                    <div class="suggestions">
                        <button class="suggestion-btn" onclick="farmGameUI.closeModal(); farmGameUI.plantNewCrop();">
                            🌱 Plant New Crops
                        </button>
                        <button class="suggestion-btn" onclick="farmGameUI.closeModal(); farmGameUI.showFinancialDialog();">
                            💰 Financial Planning
                        </button>
                        <button class="suggestion-btn" onclick="farmGameUI.closeModal();">
                            📊 Continue Managing Farm
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.showModal(content);
    }

    /**
     * Show crop area selection dialog
     */
    showCropAreaDialog(cropType) {
        const farmState = this.farmSimulation.getFarmState();
        const availableLand = farmState.availableLand || farmState.totalLand;

        if (availableLand <= 0) {
            this.showNotification('❌ No land available! Wait for dead crop land to recover.', 'error');
            return;
        }

        // Get comprehensive crop data including satellite-based crops
        const cropData = this.getComprehensiveCropData();

        const crop = cropData[cropType];
        if (!crop) {
            this.showNotification('❌ Invalid crop type selected!', 'error');
            return;
        }

        const maxArea = Math.min(availableLand, crop.defaultArea * 3);
        const minArea = Math.min(crop.defaultArea / 2, availableLand);

        const content = `
            <div class="modal-header">
                <h3>${crop.emoji} Plant ${cropType.charAt(0).toUpperCase() + cropType.slice(1)}</h3>
            </div>

            <div class="crop-area-selection">
                <div class="crop-info">
                    <h4>🌱 Crop Information</h4>
                    <div class="crop-details">
                        <div class="detail-item">
                            <span>💰 Cost per area:</span>
                            <span>$${crop.cost}/${crop.defaultArea}ha</span>
                        </div>
                        <div class="detail-item">
                            <span>🌍 Best seasons:</span>
                            <span>${crop.seasons.join(', ')}</span>
                        </div>
                        <div class="detail-item">
                            <span>⏱️ Growth time:</span>
                            <span>${crop.growthWeeks} weeks</span>
                        </div>
                    </div>
                </div>

                <div class="land-status">
                    <h4>🏞️ Land Status</h4>
                    <div class="land-metrics">
                        <div class="metric">
                            <span>📏 Total Land:</span>
                            <span>${farmState.totalLand} hectares</span>
                        </div>
                        <div class="metric">
                            <span>✅ Available:</span>
                            <span class="available">${availableLand} hectares</span>
                        </div>
                        ${((farmState.deadLandPlots && farmState.deadLandPlots.length > 0) || (farmState.harvestedLandPlots && farmState.harvestedLandPlots.length > 0)) ? `
                        <div class="metric">
                            <span>⏳ Recovering:</span>
                            <span class="recovering">${
                                (farmState.deadLandPlots ? farmState.deadLandPlots.reduce((sum, plot) => sum + plot.area, 0) : 0) +
                                (farmState.harvestedLandPlots ? farmState.harvestedLandPlots.reduce((sum, plot) => sum + plot.area, 0) : 0)
                            } hectares</span>
                        </div>
                        ${farmState.deadLandPlots && farmState.deadLandPlots.length > 0 ? `
                        <div class="metric-detail">
                            <span>💀 Dead (20min):</span>
                            <span class="dead-land">${farmState.deadLandPlots.reduce((sum, plot) => sum + plot.area, 0)} hectares</span>
                        </div>
                        ` : ''}
                        ${farmState.harvestedLandPlots && farmState.harvestedLandPlots.length > 0 ? `
                        <div class="metric-detail">
                            <span>🌾 Harvested (10min):</span>
                            <span class="harvested-land">${farmState.harvestedLandPlots.reduce((sum, plot) => sum + plot.area, 0)} hectares</span>
                        </div>
                        ` : ''}
                        ` : ''}
                    </div>
                </div>

                <div class="area-selector">
                    <h4>📐 Select Planting Area</h4>
                    <div class="area-input-group">
                        <label for="cropArea">Hectares to plant:</label>
                        <input type="number"
                               id="cropArea"
                               min="${minArea}"
                               max="${maxArea}"
                               value="${Math.min(crop.defaultArea, availableLand)}"
                               step="5">
                        <span class="area-range">Range: ${minArea} - ${maxArea} ha</span>
                    </div>

                    <div class="cost-calculator" id="costCalculator">
                        <div class="cost-breakdown">
                            <div class="cost-item">
                                <span>🌱 Planting cost:</span>
                                <span id="plantingCost">$${(crop.cost * Math.min(crop.defaultArea, availableLand) / crop.defaultArea).toFixed(0)}</span>
                            </div>
                            <div class="cost-item total">
                                <span>💰 Total cost:</span>
                                <span id="totalCost">$${(crop.cost * Math.min(crop.defaultArea, availableLand) / crop.defaultArea).toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="farmGameUI.confirmPlantCrop('${cropType}')">
                        🌱 Plant ${cropType.charAt(0).toUpperCase() + cropType.slice(1)}
                    </button>
                    <button class="btn btn-secondary" onclick="farmGameUI.closeModal()">
                        ❌ Cancel
                    </button>
                </div>
            </div>

            <script>
                const areaInput = document.getElementById('cropArea');
                const plantingCostSpan = document.getElementById('plantingCost');
                const totalCostSpan = document.getElementById('totalCost');

                areaInput.addEventListener('input', function() {
                    const area = parseInt(this.value) || 0;
                    const costPerHa = ${crop.cost} / ${crop.defaultArea};
                    const plantingCost = Math.round(area * costPerHa);

                    plantingCostSpan.textContent = '$' + plantingCost;
                    totalCostSpan.textContent = '$' + plantingCost;
                });
            </script>
        `;

        this.showModal(content);
    }

    /**
     * Confirm crop planting with selected area
     */
    confirmPlantCrop(cropType) {
        const areaInput = document.getElementById('cropArea');
        const area = parseInt(areaInput.value) || 0;

        if (area <= 0) {
            this.showNotification('❌ Please enter a valid area!', 'error');
            return;
        }

        const result = this.farmSimulation.plantCrop(cropType, area);

        if (result.success) {
            this.closeModal();
            this.showNotification(result.message, 'success');

            // Force complete UI refresh to ensure new crops are displayed
            setTimeout(() => {
                const updatedFarmState = this.farmSimulation.getFarmState();
                this.updateResourcesDisplay(updatedFarmState);
                this.updateCropDisplay();
                this.updateDisplay();

                // Also update the main game view if it's crops view
                if (document.querySelector('#game-view-crops')) {
                    const cropsView = this.renderCropsView();
                    document.querySelector('#game-view-crops').innerHTML = cropsView;
                }

                console.log('✅ Planted new crop and refreshed UI');
                console.log('Updated crops:', updatedFarmState.crops);
            }, 100);
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    /**
     * Generate fertilizer scenario based on seasonal cycles
     */
    generateFertilizerScenario(farmState) {
        const season = farmState.currentSeason;
        const week = farmState.currentWeek;

        // Seasonal growing conditions
        let seasonOptimal, soilTemp, absorptionRate, growthPhase;

        switch (season) {
            case 'spring':
                seasonOptimal = true;
                soilTemp = 12 + Math.random() * 8;
                absorptionRate = 0.7 + Math.random() * 0.2;
                growthPhase = 'optimal';
                break;
            case 'summer':
                seasonOptimal = week < 35; // Early to mid summer
                soilTemp = 20 + Math.random() * 10;
                absorptionRate = 0.6 + Math.random() * 0.3;
                growthPhase = week < 30 ? 'optimal' : 'moderate';
                break;
            case 'fall':
                seasonOptimal = week < 45; // Early fall
                soilTemp = 8 + Math.random() * 12;
                absorptionRate = 0.4 + Math.random() * 0.4;
                growthPhase = week < 42 ? 'moderate' : 'poor';
                break;
            case 'winter':
                seasonOptimal = false;
                soilTemp = 2 + Math.random() * 8;
                absorptionRate = 0.2 + Math.random() * 0.3;
                growthPhase = 'poor';
                break;
            default:
                seasonOptimal = true;
                soilTemp = 15;
                absorptionRate = 0.6;
                growthPhase = 'moderate';
        }

        // Check for nutrient deficiencies
        const hasDeficiency = Math.random() < 0.3; // 30% chance of deficiency

        const scenario = {
            seasonOptimal,
            seasonStatus: seasonOptimal ? 'Optimal growing season' : 'Suboptimal conditions',
            soilTemp: Math.round(soilTemp),
            absorptionRate: Math.min(0.9, absorptionRate),
            growthPhase,
            hasDeficiency
        };

        // Determine recommended action
        if (!seasonOptimal && soilTemp < 10) {
            scenario.recommendedAction = 'wait';
            scenario.recommendation = 'Soil temperature too low for effective nutrient uptake. Wait for warmer conditions.';
        } else if (hasDeficiency) {
            scenario.recommendedAction = 'targeted';
            scenario.recommendation = 'Specific nutrient deficiencies detected. Targeted fertilization will address these efficiently.';
        } else if (growthPhase === 'optimal' && seasonOptimal) {
            scenario.recommendedAction = 'synthetic';
            scenario.recommendation = 'Optimal growing conditions. Fast-acting synthetic fertilizer will maximize growth.';
        } else if (seasonOptimal && absorptionRate > 0.6) {
            scenario.recommendedAction = 'organic';
            scenario.recommendation = 'Good soil conditions for slow-release organic fertilizer. Best for long-term soil health.';
        } else {
            scenario.recommendedAction = 'wait';
            scenario.recommendation = 'Current conditions not ideal for fertilization. Consider waiting for better timing.';
        }

        return scenario;
    }

    /**
     * Assess crop nutrition status
     */
    assessCropNutrition(crop, scenario) {
        // Base nutrition levels with some randomness
        const baseNutrition = {
            nitrogen: 0.4 + Math.random() * 0.4,
            phosphorus: 0.5 + Math.random() * 0.3,
            potassium: 0.3 + Math.random() * 0.5
        };

        // Adjust based on crop growth stage
        if (crop.growth_stage === 'flowering' || crop.growth_stage === 'fruiting') {
            baseNutrition.phosphorus *= 0.7; // Higher P demand
            baseNutrition.potassium *= 0.8; // Higher K demand
        }

        // Apply deficiency if scenario indicates it
        if (scenario.hasDeficiency) {
            const deficientNutrient = ['nitrogen', 'phosphorus', 'potassium'][Math.floor(Math.random() * 3)];
            baseNutrition[deficientNutrient] *= 0.4;
        }

        return baseNutrition;
    }

    /**
     * Handle fertilizer decision
     */
    makeFertilizerDecision(type, scenario = null) {
        console.log('🔹 makeFertilizerDecision called with:', type, scenario);
        let result;

        try {
            // Check if farmSimulation and applyFertilizer method exist
            if (!this.farmSimulation) {
                console.error('farmSimulation is not available');
                return;
            }
            console.log('✅ farmSimulation exists');

            if (typeof this.farmSimulation.applyFertilizer !== 'function') {
                console.error('applyFertilizer method is not available');
                return;
            }
            console.log('✅ applyFertilizer method exists');

            // Apply actual fertilizer using the engine based on type
            console.log('🔹 Processing fertilizer type:', type);
            switch (type) {
                case 'organic':
                    console.log('Applying organic fertilizer...');
                    result = this.farmSimulation.applyFertilizer(null, 'balanced');
                    console.log('Organic fertilizer result:', result);
                    if (result.success) {
                        result.score = scenario && scenario.recommendedAction === 'organic' ? 15 : 8;
                        result.message = 'Applied organic fertilizer';
                    }
                    break;
                case 'synthetic':
                    console.log('Applying synthetic fertilizer...');
                    result = this.farmSimulation.applyFertilizer(null, 'nitrogen');
                    console.log('Synthetic fertilizer result:', result);
                    if (result.success) {
                        result.score = scenario && scenario.recommendedAction === 'synthetic' ? 15 : 10;
                        result.message = 'Applied synthetic NPK fertilizer';
                    }
                    break;
                case 'targeted':
                    console.log('Applying targeted fertilizer...');
                    result = this.farmSimulation.applyFertilizer(null, 'phosphorus');
                    console.log('Targeted fertilizer result:', result);
                    if (result.success) {
                        result.score = scenario && scenario.recommendedAction === 'targeted' ? 20 : 12;
                        result.message = 'Applied targeted nutrient treatment';
                    }
                    break;
                case 'wait':
                    console.log('Waiting on fertilizer...');
                    result = {
                        success: true,
                        message: 'Delayed fertilization for better timing',
                        score: scenario && scenario.recommendedAction === 'wait' ? 10 : -3,
                        cost: 0
                    };
                    console.log('Wait fertilizer result:', result);
                    break;
                default:
                    console.log('Invalid fertilizer type:', type);
                    result = {
                        success: false,
                        message: 'Invalid fertilization choice',
                        score: -5,
                        cost: 0
                    };
            }

            console.log('🔹 Processing scenario alignment...');
            // Add scenario alignment bonus/penalty
            if (scenario) {
                if (scenario.recommendedAction === type) {
                    result.score += 5;
                    result.message += ' (Optimal timing!)';
                    result.nasaAlignment = true;
                } else {
                    result.score -= 3;
                    result.message += ' (Suboptimal timing)';
                    result.nasaAlignment = false;
                }
            }

            console.log('🔹 Updating UI displays...');
            // Update UI to reflect resource changes
            const updatedFarmState = this.farmSimulation.getFarmState();
            console.log('Updated farm state retrieved');

            this.updateResourcesDisplay(updatedFarmState);
            console.log('Resources display updated');

            this.updateCropDisplay();
            console.log('Crop display updated');

            console.log('🔹 Showing decision result...');
            this.showEnhancedDecisionResult(result, scenario);
            console.log('Decision result shown');

            // Note: Modal will be closed by the event handler automatically
            console.log('✅ makeFertilizerDecision completed successfully');

        } catch (error) {
            console.error('❌ Error in makeFertilizerDecision:', error);
            console.error('Error message:', error.message);
            console.error('Stack trace:', error.stack);

            // Show user-friendly error message instead of throwing
            this.showNotification('Fertilizer application failed. Please try again.', 'error');

            // Don't re-throw to prevent breaking the event handler
            return false;
        }
    }

    /**
     * Show livestock management dialog
     */
    showLivestockDialog() {
        const farmState = this.farmSimulation.getFarmState();

        // Generate livestock scenario
        const livestockScenario = this.generateLivestockScenario(farmState);

        const content = `
            <div class="modal-header">
                <h3>🐄 Livestock Management - Week ${farmState.currentWeek} (${farmState.currentSeason})</h3>
            </div>
            <p>Make decisions about your livestock based on current conditions and feed availability:</p>

            <div class="nasa-data-panel">
                <h4>🌾 Feed & Pasture Conditions</h4>
                <div class="satellite-metrics">
                    <div class="metric">
                        <strong>Pasture Quality:</strong> <span class="${livestockScenario.pastureQuality < 0.4 ? 'poor' : livestockScenario.pastureQuality < 0.7 ? 'fair' : 'good'}">${(livestockScenario.pastureQuality * 100).toFixed(0)}%</span>
                    </div>
                    <div class="metric">
                        <strong>Feed Cost Index:</strong> <span class="${livestockScenario.feedCost > 1.5 ? 'critical' : livestockScenario.feedCost > 1.2 ? 'warning' : 'good'}">${livestockScenario.feedCost.toFixed(1)}x baseline</span>
                    </div>
                    <div class="metric">
                        <strong>Weather Stress:</strong> <span class="${livestockScenario.weatherStress > 0.7 ? 'high' : livestockScenario.weatherStress > 0.4 ? 'medium' : 'low'}">${(livestockScenario.weatherStress * 100).toFixed(0)}%</span>
                    </div>
                    <div class="metric">
                        <strong>Disease Risk:</strong> <span class="${livestockScenario.diseaseRisk > 0.6 ? 'high' : livestockScenario.diseaseRisk > 0.3 ? 'medium' : 'low'}">${(livestockScenario.diseaseRisk * 100).toFixed(0)}%</span>
                    </div>
                </div>
                <div class="nasa-recommendation-box">
                    <strong>🐮 Veterinary Recommendation:</strong>
                    <p class="recommendation-text">${livestockScenario.recommendation}</p>
                </div>
            </div>

            <div class="current-conditions">
                <h4>Current Livestock Status:</h4>
                <div class="livestock-status">
                    <div class="livestock-item">
                        <span>🐄 Cattle (${farmState.livestock?.cattle || 0})</span>
                        <div class="health-indicator ${livestockScenario.cattleHealth < 0.6 ? 'poor' : livestockScenario.cattleHealth < 0.8 ? 'fair' : 'good'}">
                            Health: ${(livestockScenario.cattleHealth * 100).toFixed(0)}%
                        </div>
                        <div class="production-indicator">
                            Milk: ${livestockScenario.milkProduction.toFixed(1)}L/day
                        </div>
                    </div>
                    <div class="livestock-item">
                        <span>🐑 Sheep (${farmState.livestock?.sheep || 0})</span>
                        <div class="health-indicator ${livestockScenario.sheepHealth < 0.6 ? 'poor' : livestockScenario.sheepHealth < 0.8 ? 'fair' : 'good'}">
                            Health: ${(livestockScenario.sheepHealth * 100).toFixed(0)}%
                        </div>
                        <div class="production-indicator">
                            Wool: ${livestockScenario.woolProduction.toFixed(1)}kg/month
                        </div>
                    </div>
                    <div class="livestock-item">
                        <span>🐔 Chickens (${farmState.livestock?.chickens || 0})</span>
                        <div class="health-indicator ${livestockScenario.chickenHealth < 0.6 ? 'poor' : livestockScenario.chickenHealth < 0.8 ? 'fair' : 'good'}">
                            Health: ${(livestockScenario.chickenHealth * 100).toFixed(0)}%
                        </div>
                        <div class="production-indicator">
                            Eggs: ${livestockScenario.eggProduction.toFixed(0)}/day
                        </div>
                    </div>
                </div>
            </div>

            <div class="irrigation-options">
                <div class="option-card ${livestockScenario.recommendedAction === 'supplement' ? 'recommended' : ''}" data-action="supplement" data-type="livestock">
                    <h5>🌾 Feed Supplements</h5>
                    <p>Cost: $${livestockScenario.supplementCost}</p>
                    <p>Effect: Boost nutrition and health</p>
                    <p>Best for: ${livestockScenario.pastureQuality < 0.5 ? 'Poor pasture conditions like current situation' : 'May be unnecessary with good pasture quality'}</p>
                    ${livestockScenario.recommendedAction === 'supplement' ? '<div class="nasa-badge">🌟 Recommended</div>' : ''}
                </div>

                <div class="option-card ${livestockScenario.recommendedAction === 'veterinary' ? 'recommended' : ''}" data-action="veterinary" data-type="livestock">
                    <h5>🩺 Veterinary Care</h5>
                    <p>Cost: $${livestockScenario.veterinaryCost}</p>
                    <p>Effect: Prevent disease, improve health</p>
                    <p>Best for: ${livestockScenario.diseaseRisk > 0.4 ? 'High disease risk conditions detected' : 'Preventive care when risk is low'}</p>
                    ${livestockScenario.recommendedAction === 'veterinary' ? '<div class="nasa-badge">🌟 Recommended</div>' : ''}
                </div>

                <div class="option-card ${livestockScenario.recommendedAction === 'shelter' ? 'recommended' : ''}" data-action="shelter" data-type="livestock">
                    <h5>🏠 Improved Shelter</h5>
                    <p>Cost: $${livestockScenario.shelterCost}</p>
                    <p>Effect: Reduce weather stress</p>
                    <p>Best for: ${livestockScenario.weatherStress > 0.5 ? 'High weather stress like current conditions' : 'May be excessive for current mild weather'}</p>
                    ${livestockScenario.recommendedAction === 'shelter' ? '<div class="nasa-badge">🌟 Recommended</div>' : ''}
                </div>

                <div class="option-card ${livestockScenario.recommendedAction === 'pasture' ? 'recommended' : ''}" data-action="pasture" data-type="livestock">
                    <h5>🌱 Pasture Rotation</h5>
                    <p>Cost: $${livestockScenario.pastureCost}</p>
                    <p>Effect: Improve grazing efficiency</p>
                    <p>Best for: ${livestockScenario.pastureQuality > 0.6 ? 'Good pasture conditions for rotation management' : 'Limited benefit with poor pasture quality'}</p>
                    ${livestockScenario.recommendedAction === 'pasture' ? '<div class="nasa-badge">🌟 Recommended</div>' : ''}
                </div>

                <div class="option-card ${livestockScenario.recommendedAction === 'maintain' ? 'recommended' : ''}" data-action="maintain" data-type="livestock">
                    <h5>⏸️ Maintain Current Care</h5>
                    <p>Cost: $${livestockScenario.maintenanceCost}</p>
                    <p>Effect: Continue existing management</p>
                    <p>Best for: ${livestockScenario.overallCondition > 0.7 ? 'Stable conditions requiring minimal intervention' : 'May need active management for current issues'}</p>
                    ${livestockScenario.recommendedAction === 'maintain' ? '<div class="nasa-badge">🌟 Recommended</div>' : ''}
                </div>
            </div>
        `;

        this.showModal(content);
    }

    /**
     * Generate livestock scenario based on seasonal and environmental conditions
     */
    generateLivestockScenario(farmState) {
        const season = farmState.currentSeason;
        const week = farmState.currentWeek;

        // Seasonal baseline conditions
        let basePastureQuality, baseFeedCost, baseWeatherStress, baseDiseaseRisk;

        switch (season) {
            case 'spring':
                basePastureQuality = 0.8 + Math.random() * 0.15;
                baseFeedCost = 0.9 + Math.random() * 0.2;
                baseWeatherStress = 0.2 + Math.random() * 0.3;
                baseDiseaseRisk = 0.3 + Math.random() * 0.2;
                break;
            case 'summer':
                basePastureQuality = 0.6 + Math.random() * 0.25;
                baseFeedCost = 1.1 + Math.random() * 0.4;
                baseWeatherStress = 0.4 + Math.random() * 0.4;
                baseDiseaseRisk = 0.2 + Math.random() * 0.3;
                break;
            case 'fall':
                basePastureQuality = 0.5 + Math.random() * 0.3;
                baseFeedCost = 1.0 + Math.random() * 0.3;
                baseWeatherStress = 0.3 + Math.random() * 0.3;
                baseDiseaseRisk = 0.4 + Math.random() * 0.3;
                break;
            case 'winter':
                basePastureQuality = 0.2 + Math.random() * 0.3;
                baseFeedCost = 1.3 + Math.random() * 0.5;
                baseWeatherStress = 0.6 + Math.random() * 0.3;
                baseDiseaseRisk = 0.5 + Math.random() * 0.3;
                break;
            default:
                basePastureQuality = 0.6;
                baseFeedCost = 1.0;
                baseWeatherStress = 0.3;
                baseDiseaseRisk = 0.3;
        }

        // Week-based variations
        const weekVariation = Math.sin((week % 52) * 0.12) * 0.1;

        const scenario = {
            pastureQuality: Math.max(0.1, Math.min(1.0, basePastureQuality + weekVariation)),
            feedCost: Math.max(0.5, Math.min(2.0, baseFeedCost + weekVariation)),
            weatherStress: Math.max(0.0, Math.min(1.0, baseWeatherStress + Math.abs(weekVariation))),
            diseaseRisk: Math.max(0.0, Math.min(1.0, baseDiseaseRisk + weekVariation))
        };

        // Generate livestock health and production
        scenario.cattleHealth = 0.6 + Math.random() * 0.3 - (scenario.weatherStress * 0.2) - (scenario.diseaseRisk * 0.15);
        scenario.sheepHealth = 0.7 + Math.random() * 0.25 - (scenario.weatherStress * 0.15) - (scenario.diseaseRisk * 0.1);
        scenario.chickenHealth = 0.6 + Math.random() * 0.35 - (scenario.weatherStress * 0.1) - (scenario.diseaseRisk * 0.2);

        scenario.milkProduction = Math.max(0, 15 + (scenario.cattleHealth - 0.7) * 20 + (scenario.pastureQuality - 0.5) * 10);
        scenario.woolProduction = Math.max(0, 3 + (scenario.sheepHealth - 0.7) * 5 + (scenario.pastureQuality - 0.5) * 2);
        scenario.eggProduction = Math.max(0, 8 + (scenario.chickenHealth - 0.7) * 10 + (scenario.weatherStress < 0.5 ? 2 : -3));

        // Calculate costs
        scenario.supplementCost = Math.round(80 * scenario.feedCost);
        scenario.veterinaryCost = Math.round(120 * (1 + scenario.diseaseRisk * 0.5));
        scenario.shelterCost = Math.round(200 * (1 + scenario.weatherStress * 0.3));
        scenario.pastureCost = Math.round(150 * scenario.pastureQuality);
        scenario.maintenanceCost = Math.round(50 * scenario.feedCost);

        // Overall condition assessment
        scenario.overallCondition = (scenario.cattleHealth + scenario.sheepHealth + scenario.chickenHealth) / 3;

        // Determine recommended action
        if (scenario.diseaseRisk > 0.6) {
            scenario.recommendedAction = 'veterinary';
            scenario.recommendation = 'High disease risk detected. Immediate veterinary intervention recommended to prevent outbreaks.';
        } else if (scenario.weatherStress > 0.7) {
            scenario.recommendedAction = 'shelter';
            scenario.recommendation = 'Severe weather conditions. Improved shelter will protect livestock from stress.';
        } else if (scenario.pastureQuality < 0.4) {
            scenario.recommendedAction = 'supplement';
            scenario.recommendation = 'Poor pasture quality requires nutritional supplements to maintain livestock health.';
        } else if (scenario.pastureQuality > 0.7 && scenario.overallCondition > 0.6) {
            scenario.recommendedAction = 'pasture';
            scenario.recommendation = 'Excellent pasture conditions. Rotation management will optimize grazing efficiency.';
        } else if (scenario.overallCondition > 0.75) {
            scenario.recommendedAction = 'maintain';
            scenario.recommendation = 'Livestock in good condition. Maintain current management practices.';
        } else {
            scenario.recommendedAction = 'supplement';
            scenario.recommendation = 'Moderate conditions suggest supplemental feeding to improve livestock performance.';
        }

        return scenario;
    }

    /**
     * Handle livestock management decision
     */
    makeLivestockDecision(action, scenario = null) {
        let result;

        switch (action) {
            case 'supplement':
                result = {
                    success: true,
                    message: 'Provided feed supplements to livestock',
                    score: scenario && scenario.recommendedAction === 'supplement' ? 18 : 12,
                    cost: scenario?.supplementCost || 80
                };
                break;
            case 'veterinary':
                result = {
                    success: true,
                    message: 'Arranged veterinary care and health checks',
                    score: scenario && scenario.recommendedAction === 'veterinary' ? 20 : 14,
                    cost: scenario?.veterinaryCost || 120
                };
                break;
            case 'shelter':
                result = {
                    success: true,
                    message: 'Improved shelter and weather protection',
                    score: scenario && scenario.recommendedAction === 'shelter' ? 16 : 10,
                    cost: scenario?.shelterCost || 200
                };
                break;
            case 'pasture':
                result = {
                    success: true,
                    message: 'Implemented pasture rotation system',
                    score: scenario && scenario.recommendedAction === 'pasture' ? 15 : 8,
                    cost: scenario?.pastureCost || 150
                };
                break;
            case 'maintain':
                result = {
                    success: true,
                    message: 'Maintained current livestock management',
                    score: scenario && scenario.recommendedAction === 'maintain' ? 12 : 6,
                    cost: scenario?.maintenanceCost || 50
                };
                break;
            default:
                result = {
                    success: false,
                    message: 'Invalid livestock management choice',
                    score: -5,
                    cost: 0
                };
        }

        // Add scenario alignment bonus/penalty
        if (scenario) {
            if (scenario.recommendedAction === action) {
                result.score += 7;
                result.message += ' (Optimal management!)';
                result.nasaAlignment = true;
            } else {
                result.score -= 4;
                result.message += ' (Suboptimal for current conditions)';
                result.nasaAlignment = false;
            }
        }

        this.showEnhancedDecisionResult(result, scenario);
        this.closeModal();
    }

    /**
     * Show crisis response dialog
     */
    showCrisisDialog(crisisType) {
        const farmState = this.farmSimulation.getFarmState();

        // Generate crisis scenario
        const crisisScenario = this.generateCrisisScenario(crisisType, farmState);

        const content = `
            <div class="modal-header">
                <h3>${crisisScenario.icon} Crisis Response - ${crisisScenario.title}</h3>
            </div>
            <div class="crisis-alert">
                <p><strong>⚠️ Emergency Situation:</strong> ${crisisScenario.description}</p>
            </div>

            <div class="nasa-data-panel crisis-panel">
                <h4>📊 Crisis Assessment</h4>
                <div class="satellite-metrics">
                    <div class="metric">
                        <strong>Severity Level:</strong> <span class="${crisisScenario.severity === 'high' ? 'critical' : crisisScenario.severity === 'medium' ? 'warning' : 'good'}">${crisisScenario.severity.toUpperCase()}</span>
                    </div>
                    <div class="metric">
                        <strong>Affected Area:</strong> <span class="${crisisScenario.affectedArea > 70 ? 'critical' : crisisScenario.affectedArea > 40 ? 'warning' : 'good'}">${crisisScenario.affectedArea}% of farm</span>
                    </div>
                    <div class="metric">
                        <strong>Time Remaining:</strong> <span class="${crisisScenario.timeRemaining < 24 ? 'critical' : crisisScenario.timeRemaining < 72 ? 'warning' : 'good'}">${crisisScenario.timeRemaining} hours</span>
                    </div>
                    <div class="metric">
                        <strong>Expected Loss:</strong> <span class="${crisisScenario.expectedLoss > 60 ? 'critical' : crisisScenario.expectedLoss > 30 ? 'warning' : 'good'}">$${crisisScenario.expectedLoss.toLocaleString()}</span>
                    </div>
                </div>
                <div class="nasa-recommendation-box">
                    <strong>🚨 Emergency Recommendation:</strong>
                    <p class="recommendation-text">${crisisScenario.recommendation}</p>
                </div>
            </div>

            <div class="current-conditions">
                <h4>Current Impact Assessment:</h4>
                <div class="crisis-impact">
                    ${crisisScenario.impacts.map(impact => `
                        <div class="impact-item ${impact.severity}">
                            <span class="impact-icon">${impact.icon}</span>
                            <div class="impact-details">
                                <strong>${impact.category}:</strong>
                                <span>${impact.description}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="irrigation-options crisis-options">
                ${crisisScenario.responses.map(response => `
                    <div class="option-card ${response.effectiveness === 'high' ? 'recommended' : ''}" data-action="${response.id}" data-type="crisis">
                        <h5>${response.title}</h5>
                        <p><strong>Cost:</strong> $${response.cost.toLocaleString()}</p>
                        <p><strong>Time:</strong> ${response.timeRequired} hours</p>
                        <p><strong>Effectiveness:</strong> ${response.effectiveness}</p>
                        <p>${response.description}</p>
                        <div class="response-outcomes">
                            <small><strong>Expected Outcome:</strong> ${response.expectedOutcome}</small>
                        </div>
                        ${response.effectiveness === 'high' ? '<div class="nasa-badge">🌟 Recommended</div>' : ''}
                    </div>
                `).join('')}
            </div>
        `;

        this.showModal(content);
    }

    /**
     * Generate crisis scenario based on type and farm conditions
     */
    generateCrisisScenario(crisisType, farmState) {
        const week = farmState.currentWeek || 1;
        const season = farmState.currentSeason || 'spring';

        switch (crisisType) {
            case 'drought':
                return this.generateDroughtScenario(farmState, week, season);
            case 'flood':
                return this.generateFloodScenario(farmState, week, season);
            case 'pest':
                return this.generatePestScenario(farmState, week, season);
            default:
                return this.generateRandomCrisis(farmState);
        }
    }

    generateDroughtScenario(farmState, week, season) {
        const severity = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
        const affectedArea = severity === 'high' ? 80 + Math.random() * 20 :
                            severity === 'medium' ? 50 + Math.random() * 30 :
                            20 + Math.random() * 30;

        return {
            icon: '🌵',
            title: 'Severe Drought Warning',
            type: 'drought',
            severity,
            affectedArea: Math.round(affectedArea),
            timeRemaining: severity === 'high' ? 12 + Math.random() * 24 : 48 + Math.random() * 72,
            expectedLoss: Math.round(affectedArea * (severity === 'high' ? 1000 : 500)),
            description: `Extended drought conditions detected. Soil moisture has dropped to critical levels across ${Math.round(affectedArea)}% of your farm. Immediate action required to prevent crop failure.`,
            recommendation: severity === 'high' ?
                'Emergency irrigation and water conservation measures required immediately. Consider drought-resistant crop varieties.' :
                'Implement water conservation strategies and increase irrigation frequency.',
            impacts: [
                {
                    icon: '🌾',
                    category: 'Crops',
                    description: `${severity === 'high' ? 'Severe wilting' : 'Moderate stress'} observed in ${Math.round(affectedArea * 0.8)}% of crops`,
                    severity: severity === 'high' ? 'critical' : 'warning'
                },
                {
                    icon: '💧',
                    category: 'Water Reserves',
                    description: `Water levels at ${100 - affectedArea}% capacity`,
                    severity: severity === 'high' ? 'critical' : 'warning'
                },
                {
                    icon: '🐄',
                    category: 'Livestock',
                    description: `Increased stress and reduced feed quality affecting ${Math.round(affectedArea * 0.6)}% of animals`,
                    severity: severity === 'medium' ? 'warning' : 'good'
                }
            ],
            responses: [
                {
                    id: 'emergency_irrigation',
                    title: '🚨 Emergency Irrigation',
                    cost: 5000,
                    timeRequired: 6,
                    effectiveness: 'high',
                    description: 'Deploy emergency irrigation systems across affected areas',
                    expectedOutcome: 'Prevent 80% of potential crop loss, high water cost'
                },
                {
                    id: 'water_conservation',
                    title: '💧 Water Conservation',
                    cost: 1500,
                    timeRequired: 12,
                    effectiveness: severity === 'high' ? 'medium' : 'high',
                    description: 'Implement drip irrigation and mulching',
                    expectedOutcome: 'Reduce water usage by 40%, prevent 60% of crop loss'
                },
                {
                    id: 'drought_insurance',
                    title: '📋 Claim Insurance',
                    cost: 500,
                    timeRequired: 48,
                    effectiveness: 'medium',
                    description: 'File drought insurance claims and wait for compensation',
                    expectedOutcome: 'Recover 50% of losses, slow response'
                },
                {
                    id: 'emergency_harvest',
                    title: '⚡ Emergency Harvest',
                    cost: 2000,
                    timeRequired: 24,
                    effectiveness: severity === 'high' ? 'low' : 'medium',
                    description: 'Harvest remaining crops immediately to salvage what possible',
                    expectedOutcome: 'Save 30% of current yield, prevent total loss'
                }
            ]
        };
    }

    generateFloodScenario(farmState, week, season) {
        const severity = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
        const affectedArea = severity === 'high' ? 60 + Math.random() * 40 :
                            severity === 'medium' ? 30 + Math.random() * 40 :
                            10 + Math.random() * 30;

        return {
            icon: '🌊',
            title: 'Flash Flood Alert',
            type: 'flood',
            severity,
            affectedArea: Math.round(affectedArea),
            timeRemaining: severity === 'high' ? 6 + Math.random() * 12 : 18 + Math.random() * 30,
            expectedLoss: Math.round(affectedArea * (severity === 'high' ? 1200 : 700)),
            description: `Heavy rainfall has caused flooding across ${Math.round(affectedArea)}% of your farm. Water levels rising rapidly with risk of crop damage and soil erosion.`,
            recommendation: severity === 'high' ?
                'Immediate evacuation of livestock and emergency drainage required. Prepare for crop salvage operations.' :
                'Implement drainage systems and protect vulnerable areas.',
            impacts: [
                {
                    icon: '🌾',
                    category: 'Crops',
                    description: `Waterlogged soil affecting ${Math.round(affectedArea * 0.9)}% of planted areas`,
                    severity: severity === 'high' ? 'critical' : 'warning'
                },
                {
                    icon: '🚜',
                    category: 'Equipment',
                    description: `Farm equipment at risk in flooded areas`,
                    severity: severity === 'high' ? 'warning' : 'good'
                },
                {
                    icon: '🐄',
                    category: 'Livestock',
                    description: `Animals require relocation from flooded pastures`,
                    severity: severity === 'high' ? 'critical' : 'warning'
                }
            ],
            responses: [
                {
                    id: 'emergency_drainage',
                    title: '🚨 Emergency Drainage',
                    cost: 4000,
                    timeRequired: 8,
                    effectiveness: 'high',
                    description: 'Deploy pumps and create emergency drainage channels',
                    expectedOutcome: 'Prevent 75% of crop loss, protect infrastructure'
                },
                {
                    id: 'livestock_evacuation',
                    title: '🚁 Livestock Evacuation',
                    cost: 2500,
                    timeRequired: 4,
                    effectiveness: 'high',
                    description: 'Move animals to higher ground immediately',
                    expectedOutcome: 'Save all livestock, prevent health issues'
                },
                {
                    id: 'flood_barriers',
                    title: '🛡️ Temporary Barriers',
                    cost: 3000,
                    timeRequired: 12,
                    effectiveness: severity === 'high' ? 'medium' : 'high',
                    description: 'Build sandbag barriers around critical areas',
                    expectedOutcome: 'Protect 60% of vulnerable areas'
                },
                {
                    id: 'insurance_claim',
                    title: '📋 Flood Insurance',
                    cost: 200,
                    timeRequired: 72,
                    effectiveness: 'medium',
                    description: 'Document damage and file insurance claims',
                    expectedOutcome: 'Recover 70% of documented losses'
                }
            ]
        };
    }

    generatePestScenario(farmState, week, season) {
        const pestTypes = ['locusts', 'aphids', 'root_rot', 'fungal_disease'];
        const pestType = pestTypes[Math.floor(Math.random() * pestTypes.length)];
        const severity = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
        const affectedArea = severity === 'high' ? 40 + Math.random() * 50 :
                            severity === 'medium' ? 20 + Math.random() * 40 :
                            5 + Math.random() * 25;

        const pestInfo = {
            locusts: { icon: '🦗', name: 'Locust Swarm' },
            aphids: { icon: '🐛', name: 'Aphid Infestation' },
            root_rot: { icon: '🦠', name: 'Root Rot Disease' },
            fungal_disease: { icon: '🍄', name: 'Fungal Outbreak' }
        };

        return {
            icon: pestInfo[pestType].icon,
            title: `${pestInfo[pestType].name} Outbreak`,
            type: 'pest',
            severity,
            affectedArea: Math.round(affectedArea),
            timeRemaining: severity === 'high' ? 18 + Math.random() * 24 : 36 + Math.random() * 48,
            expectedLoss: Math.round(affectedArea * (severity === 'high' ? 800 : 400)),
            description: `${pestInfo[pestType].name} detected spreading across ${Math.round(affectedArea)}% of crops. ${severity === 'high' ? 'Aggressive treatment required' : 'Moderate intervention needed'} to prevent further spread.`,
            recommendation: severity === 'high' ?
                'Immediate application of targeted treatment and quarantine of affected areas required.' :
                'Deploy integrated pest management and monitor spread carefully.',
            impacts: [
                {
                    icon: '🌾',
                    category: 'Crop Health',
                    description: `${severity === 'high' ? 'Severe damage' : 'Moderate damage'} to ${Math.round(affectedArea * 0.8)}% of affected crops`,
                    severity: severity === 'high' ? 'critical' : 'warning'
                },
                {
                    icon: '📈',
                    category: 'Spread Rate',
                    description: `${severity === 'high' ? 'Rapid' : 'Slow'} spread to neighboring areas`,
                    severity: severity === 'high' ? 'warning' : 'good'
                },
                {
                    icon: '💰',
                    category: 'Yield Impact',
                    description: `Expected ${Math.round(affectedArea * (severity === 'high' ? 0.6 : 0.3))}% yield reduction`,
                    severity: severity === 'high' ? 'critical' : 'warning'
                }
            ],
            responses: [
                {
                    id: 'chemical_treatment',
                    title: '🧪 Chemical Treatment',
                    cost: 2000,
                    timeRequired: 6,
                    effectiveness: 'high',
                    description: 'Apply targeted pesticides/fungicides to affected areas',
                    expectedOutcome: 'Eliminate 85% of pests, may affect beneficial insects'
                },
                {
                    id: 'biological_control',
                    title: '🐞 Biological Control',
                    cost: 1200,
                    timeRequired: 24,
                    effectiveness: severity === 'high' ? 'medium' : 'high',
                    description: 'Release beneficial insects and natural predators',
                    expectedOutcome: 'Sustainable 70% reduction, environmentally friendly'
                },
                {
                    id: 'quarantine',
                    title: '🚧 Quarantine Areas',
                    cost: 800,
                    timeRequired: 12,
                    effectiveness: 'medium',
                    description: 'Isolate affected areas to prevent spread',
                    expectedOutcome: 'Prevent 60% of spread, protect healthy crops'
                },
                {
                    id: 'crop_rotation',
                    title: '🔄 Emergency Rotation',
                    cost: 3000,
                    timeRequired: 48,
                    effectiveness: 'high',
                    description: 'Replace affected crops with resistant varieties',
                    expectedOutcome: 'Long-term solution, recover 80% of productivity'
                }
            ]
        };
    }

    /**
     * Handle crisis management decision
     */
    makeCrisisDecision(responseId, scenario) {
        const response = scenario.responses.find(r => r.id === responseId);
        if (!response) return;

        let effectivenessMultiplier = 1.0;
        switch (response.effectiveness) {
            case 'high': effectivenessMultiplier = 1.5; break;
            case 'medium': effectivenessMultiplier = 1.0; break;
            case 'low': effectivenessMultiplier = 0.6; break;
        }

        const baseScore = 30;
        const timeBonus = response.timeRequired < 12 ? 10 : response.timeRequired < 24 ? 5 : 0;
        const effectivenessBonus = Math.round(effectivenessMultiplier * 20);

        const result = {
            success: true,
            message: `Deployed ${response.title} for ${scenario.title}`,
            score: baseScore + timeBonus + effectivenessBonus,
            cost: response.cost,
            crisisResponse: true,
            crisisType: scenario.type,
            effectiveness: response.effectiveness
        };

        // Add special bonuses for optimal crisis response
        if (response.effectiveness === 'high' && response.timeRequired <= 12) {
            result.score += 15;
            result.message += ' (Excellent crisis management!)';
            result.nasaAlignment = true;
        }

        this.showEnhancedDecisionResult(result, scenario);
        this.closeModal();

        // Update farm state to reflect crisis response
        this.applyCrisisResponse(scenario, response);
    }

    applyCrisisResponse(scenario, response) {
        // This would integrate with FarmSimulationEngine to apply the effects
        // For now, just show a follow-up notification
        setTimeout(() => {
            this.showNotification(`Crisis response deployed: ${response.expectedOutcome}`, 'info');
        }, 1000);
    }

    /**
     * Trigger random crisis events based on conditions
     */
    checkForCrisisEvents(farmState) {
        const crisisChance = this.calculateCrisisChance(farmState);

        if (Math.random() < crisisChance) {
            const crisisTypes = ['drought', 'flood', 'pest'];
            const randomCrisis = crisisTypes[Math.floor(Math.random() * crisisTypes.length)];

            setTimeout(() => {
                this.showCrisisDialog(randomCrisis);
            }, 2000);
        }
    }

    calculateCrisisChance(farmState) {
        let baseChance = 0.1; // 10% base chance per week

        // Seasonal modifiers
        const season = farmState.currentSeason;
        if (season === 'summer') baseChance += 0.05; // Higher drought risk
        if (season === 'spring') baseChance += 0.03; // Higher flood risk

        // Sustainability score effect
        const sustainability = farmState.playerStats.sustainabilityScore || 100;
        if (sustainability < 60) baseChance += 0.1;

        return Math.min(0.3, baseChance); // Cap at 30%
    }

    /**
     * Show crisis test menu for demonstration purposes
     */
    showCrisisTestMenu() {

        const content = `
            <div class="modal-header">
                <h3>🚨 Crisis Simulation Menu</h3>
            </div>
            <p>Select a crisis type to simulate and test your response capabilities:</p>

            <div class="crisis-test-options">
                <div class="option-card" onclick="farmGameUI.showCrisisDialog('drought')">
                    <h5>🌵 Drought Crisis</h5>
                    <p>Simulate severe drought conditions affecting crops and livestock</p>
                </div>

                <div class="option-card" onclick="farmGameUI.showCrisisDialog('flood')">
                    <h5>🌊 Flood Emergency</h5>
                    <p>Simulate flash flooding with immediate response requirements</p>
                </div>

                <div class="option-card" onclick="farmGameUI.showCrisisDialog('pest')">
                    <h5>🦗 Pest Outbreak</h5>
                    <p>Simulate pest infestation requiring targeted treatment</p>
                </div>

                <div class="option-card" onclick="farmGameUI.testRandomCrisis()">
                    <h5>🎲 Random Crisis</h5>
                    <p>Generate a random crisis event based on current conditions</p>
                </div>
            </div>

            <div class="crisis-info">
                <h5>📋 Crisis Response Features:</h5>
                <ul>
                    <li>Real-time severity assessment</li>
                    <li>Multiple response strategies</li>
                    <li>Cost-effectiveness analysis</li>
                    <li>Time-sensitive decisions</li>
                    <li>Achievement tracking for crisis management</li>
                </ul>
            </div>
        `;

        this.showModal(content);
    }

    testRandomCrisis() {
        const farmState = this.farmSimulation.getFarmState();
        const crisisTypes = ['drought', 'flood', 'pest'];
        const randomCrisis = crisisTypes[Math.floor(Math.random() * crisisTypes.length)];
        this.showCrisisDialog(randomCrisis);
    }

    /**
     * Load satellite data and apply to farm simulation
     */
    loadFromSatelliteData() {
        console.log('📡 Loading satellite data for farm configuration');

        // Show loading indicator
        this.showLoadingModal();

        // Get coordinates from Satellite Data Visualization tab
        const latInput = document.getElementById('latInput');
        const lonInput = document.getElementById('lonInput');

        if (!latInput || !lonInput) {
            // Try to get from GameEngine
            if (window.app && window.app.gameEngine) {
                const coords = window.app.gameEngine.getCurrentCoordinates();
                if (coords) {
                    this.applySatelliteDataToFarm(coords.lat, coords.lon);
                    return;
                }
            }

            this.closeModal();
            this.showNotification('❌ Please visit the Satellite Data Visualization tab first to set coordinates', 'error');
            return;
        }

        if (!latInput.value || !lonInput.value) {
            this.closeModal();
            this.showNotification('⚠️ Please enter coordinates in the Satellite Data Visualization tab first', 'warning');
            return;
        }

        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);

        this.applySatelliteDataToFarm(lat, lon);
    }

    /**
     * Apply satellite data to farm simulation
     */
    applySatelliteDataToFarm(lat, lon) {
        // Get NASA data for the location
        this.fetchNASADataForLocation(lat, lon).then(nasaData => {
            console.log('🛰️ NASA Data received:', nasaData);

            // Clear loading interval
            if (this.loadingInterval) {
                clearInterval(this.loadingInterval);
                this.loadingInterval = null;
            }

            // Calculate water rate based on satellite data
            const waterRate = this.calculateWaterRateFromSatelliteData(nasaData);

            // Determine available crop varieties based on region
            const cropVarieties = this.determineCropVarietiesFromNASAData(nasaData, lat, lon);

            // Set location-appropriate starting crops
            const initialCrops = this.getLocationBasedStartingCrops(lat, lon, nasaData);

            // Apply configurations to farm simulation
            this.farmSimulation.applyEnvironmentalData({
                coordinates: { lat, lon },
                waterEfficiency: waterRate,
                availableCrops: cropVarieties,
                soilMoisture: nasaData.soilMoisture || 50,
                temperature: nasaData.temperature || 25,
                precipitation: nasaData.precipitation || 50,
                vegetationHealth: nasaData.ndvi || 0.6,
                initialCrops: initialCrops
            });

            // Show configuration summary
            this.showSatelliteDataConfiguration(nasaData, waterRate, cropVarieties, lat, lon);

            // Store configuration
            this.satelliteDataLoaded = true;
            this.currentLocation = { lat, lon };

        }).catch(error => {
            console.error('Error loading satellite data:', error);

            // Clear loading interval on error
            if (this.loadingInterval) {
                clearInterval(this.loadingInterval);
                this.loadingInterval = null;
            }

            // Close loading modal
            this.closeModal();

            this.showNotification('⚠️ Using default data due to connection issues', 'warning');
        });
    }

    /**
     * Calculate water consumption rate based on satellite data
     */
    calculateWaterRateFromSatelliteData(nasaData) {
        // Base water rate (liters per hour per hectare)
        const baseRate = 100;

        // Factors from satellite data
        const soilMoisture = nasaData.soilMoisture || 50; // 0-100%
        const temperature = nasaData.temperature || 25; // Celsius
        const precipitation = nasaData.precipitation || 50; // mm/month
        const ndvi = nasaData.ndvi || 0.6; // 0-1 (vegetation health)
        const evapotranspiration = nasaData.evapotranspiration || 4; // mm/day

        // Calculate multipliers
        const moistureMultiplier = 1 - (soilMoisture / 100) * 0.3; // Less water needed with higher moisture
        const tempMultiplier = 1 + Math.max(0, (temperature - 25) / 25); // More water needed in heat
        const precipMultiplier = 1 - (precipitation / 200) * 0.4; // Less water with more rain
        const vegetationMultiplier = 0.7 + (ndvi * 0.6); // Healthy vegetation needs consistent water
        const evapMultiplier = 0.8 + (evapotranspiration / 10); // Higher ET = more water loss

        // Combined formula
        const waterRate = baseRate * moistureMultiplier * tempMultiplier *
                         precipMultiplier * vegetationMultiplier * evapMultiplier;

        return {
            rate: Math.round(waterRate),
            factors: {
                soilMoisture: moistureMultiplier,
                temperature: tempMultiplier,
                precipitation: precipMultiplier,
                vegetation: vegetationMultiplier,
                evapotranspiration: evapMultiplier
            }
        };
    }

    /**
     * Determine crop varieties based on NASA data and location
     */
    determineCropVarietiesFromNASAData(nasaData, lat, lon) {
        const crops = [];

        // Temperature zones
        const avgTemp = nasaData.temperature || 25;
        const precipitation = nasaData.precipitation || 50;
        const growingDegreeDays = nasaData.growingDegreeDays || 2500;

        // Tropical crops (lat between -23.5 and 23.5)
        if (Math.abs(lat) < 23.5) {
            crops.push(
                { type: 'rice', name: 'Rice', waterNeed: 'high', tempRange: [20, 35], emoji: '🌾' },
                { type: 'sugarcane', name: 'Sugarcane', waterNeed: 'high', tempRange: [20, 35], emoji: '🎋' },
                { type: 'banana', name: 'Banana', waterNeed: 'high', tempRange: [20, 30], emoji: '🍌' },
                { type: 'coffee', name: 'Coffee', waterNeed: 'medium', tempRange: [15, 25], emoji: '☕' }
            );
        }

        // Temperate crops (lat between 23.5 and 66.5)
        if (Math.abs(lat) >= 23.5 && Math.abs(lat) < 66.5) {
            crops.push(
                { type: 'wheat', name: 'Wheat', waterNeed: 'medium', tempRange: [10, 25], emoji: '🌾' },
                { type: 'corn', name: 'Corn', waterNeed: 'medium', tempRange: [15, 30], emoji: '🌽' },
                { type: 'soybean', name: 'Soybean', waterNeed: 'medium', tempRange: [15, 28], emoji: '🫘' },
                { type: 'potato', name: 'Potato', waterNeed: 'medium', tempRange: [10, 25], emoji: '🥔' }
            );
        }

        // Arid/Desert adapted crops (low precipitation areas)
        if (precipitation < 30) {
            crops.push(
                { type: 'sorghum', name: 'Sorghum', waterNeed: 'low', tempRange: [20, 35], emoji: '🌾' },
                { type: 'millet', name: 'Millet', waterNeed: 'low', tempRange: [20, 35], emoji: '🌾' },
                { type: 'dates', name: 'Date Palm', waterNeed: 'low', tempRange: [20, 40], emoji: '🌴' },
                { type: 'cactus', name: 'Prickly Pear', waterNeed: 'very-low', tempRange: [15, 40], emoji: '🌵' }
            );
        }

        // High precipitation crops
        if (precipitation > 100) {
            crops.push(
                { type: 'tea', name: 'Tea', waterNeed: 'high', tempRange: [15, 25], emoji: '🍵' },
                { type: 'cocoa', name: 'Cocoa', waterNeed: 'high', tempRange: [20, 30], emoji: '🍫' }
            );
        }

        // Cold climate crops
        if (avgTemp < 15) {
            crops.push(
                { type: 'barley', name: 'Barley', waterNeed: 'low', tempRange: [5, 20], emoji: '🌾' },
                { type: 'oats', name: 'Oats', waterNeed: 'medium', tempRange: [5, 20], emoji: '🌾' },
                { type: 'rye', name: 'Rye', waterNeed: 'low', tempRange: [0, 20], emoji: '🌾' }
            );
        }

        // Add specialty crops based on NDVI (vegetation health)
        if (nasaData.ndvi > 0.7) {
            crops.push(
                { type: 'vegetables', name: 'Mixed Vegetables', waterNeed: 'medium', tempRange: [10, 30], emoji: '🥬' },
                { type: 'fruits', name: 'Orchard Fruits', waterNeed: 'medium', tempRange: [10, 30], emoji: '🍎' }
            );
        }

        return crops;
    }

    /**
     * Fetch NASA data for location
     */
    async fetchNASADataForLocation(lat, lon) {
        try {
            console.log(`🛰️ Fetching real NASA data for Farm Game: lat=${lat}, lon=${lon}`);

            // Get user token from localStorage
            const token = localStorage.getItem('nasa_earthdata_token');

            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Fetch real NASA data from our proxy server
            const [smapResponse, modisResponse, landsatResponse] = await Promise.all([
                fetch(`http://localhost:3001/api/smap/soil-moisture?lat=${lat}&lon=${lon}`, { headers }),
                fetch(`http://localhost:3001/api/modis/ndvi?lat=${lat}&lon=${lon}`, { headers }),
                fetch(`http://localhost:3001/api/landsat/imagery?lat=${lat}&lon=${lon}`, { headers })
            ]);

            const smapData = await smapResponse.json();
            const modisData = await modisResponse.json();
            const landsatData = await landsatResponse.json();

            console.log('🛰️ Real NASA data for Farm Game:', { smapData, modisData, landsatData });

            // Convert NASA data to Farm Game format
            const nasaData = {
                soilMoisture: (smapData.surface_moisture || 0.2) * 100, // Convert to percentage
                temperature: landsatData.surface_temperature || smapData.surface_temperature || 15,
                precipitation: landsatData.precipitation || 50, // Default if not available
                ndvi: modisData.ndvi || landsatData.ndvi || 0.1,
                evapotranspiration: smapData.evapotranspiration || 2,
                growingDegreeDays: this.calculateGrowingDegreeDays(landsatData.surface_temperature || smapData.surface_temperature || 15),
                solarRadiation: landsatData.solar_radiation || 15,
                // Additional NASA metadata
                sources: {
                    smap: smapData.source,
                    modis: modisData.source,
                    landsat: landsatData.source
                },
                quality: smapData.quality || 'real'
            };

            console.log('🛰️ Converted NASA data for Farm Game:', nasaData);
            return nasaData;

        } catch (error) {
            console.error('❌ Failed to fetch real NASA data for Farm Game:', error);

            // Fallback to location-realistic data (better than random)
            return this.generateLocationRealisticData(lat, lon);
        }
    }

    // Helper method to calculate growing degree days
    calculateGrowingDegreeDays(temperature) {
        const baseTemp = 10; // Base temperature for crop growth
        const avgTemp = temperature || 15;
        const annualGDD = Math.max(0, (avgTemp - baseTemp) * 365);
        return Math.round(annualGDD);
    }

    // Helper method to generate location-realistic fallback data
    generateLocationRealisticData(lat, lon) {
        console.log(`🌍 Generating location-realistic fallback data for lat=${lat}, lon=${lon}`);

        const absLat = Math.abs(lat);

        // Antarctic/Arctic conditions (|lat| > 70)
        if (absLat > 70) {
            return {
                soilMoisture: 5 + Math.random() * 15, // Very low, mostly frozen
                temperature: -20 + Math.random() * 15, // Very cold
                precipitation: 5 + Math.random() * 15, // Very low
                ndvi: 0.01 + Math.random() * 0.05, // Almost no vegetation
                evapotranspiration: 0.1 + Math.random() * 0.5,
                growingDegreeDays: 0, // No crop growth
                solarRadiation: 5 + Math.random() * 5,
                quality: 'location-realistic'
            };
        }

        // Sub-polar conditions (60 < |lat| <= 70)
        else if (absLat > 60) {
            return {
                soilMoisture: 15 + Math.random() * 25,
                temperature: -5 + Math.random() * 15,
                precipitation: 20 + Math.random() * 30,
                ndvi: 0.1 + Math.random() * 0.3,
                evapotranspiration: 0.5 + Math.random() * 1.5,
                growingDegreeDays: 200 + Math.random() * 800,
                solarRadiation: 8 + Math.random() * 7,
                quality: 'location-realistic'
            };
        }

        // Temperate conditions (23.5 < |lat| <= 60)
        else if (absLat > 23.5) {
            return {
                soilMoisture: 25 + Math.random() * 35,
                temperature: 10 + Math.random() * 20,
                precipitation: 40 + Math.random() * 60,
                ndvi: 0.3 + Math.random() * 0.4,
                evapotranspiration: 2 + Math.random() * 4,
                growingDegreeDays: 1000 + Math.random() * 2000,
                solarRadiation: 12 + Math.random() * 8,
                quality: 'location-realistic'
            };
        }

        // Tropical conditions (|lat| <= 23.5)
        else {
            return {
                soilMoisture: 40 + Math.random() * 40,
                temperature: 20 + Math.random() * 15,
                precipitation: 80 + Math.random() * 120,
                ndvi: 0.5 + Math.random() * 0.4,
                evapotranspiration: 4 + Math.random() * 4,
                growingDegreeDays: 2500 + Math.random() * 2000,
                solarRadiation: 18 + Math.random() * 7,
                quality: 'location-realistic'
            };
        }
    }

    /**
     * Get location-based starting crops
     */
    getLocationBasedStartingCrops(lat, lon, nasaData) {
        // Don't automatically plant any crops - let the player choose what to plant
        console.log(`🌍 Location: ${lat.toFixed(2)}°, ${lon.toFixed(2)}° - No automatic crops planted. Player will choose what to plant.`);
        return [];
    }

    /**
     * Show satellite data configuration summary
     */
    showSatelliteDataConfiguration(nasaData, waterRate, cropVarieties, lat, lon) {
        const content = `
            <div class="modal-header">
                <h3>🛰️ Satellite Data Applied to Farm</h3>
            </div>

            <div class="location-info">
                <h4>📍 Location: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°</h4>
            </div>

            <div class="nasa-data-panel">
                <h4>🌍 Environmental Conditions</h4>
                <div class="satellite-metrics">
                    <div class="metric">
                        <strong>Soil Moisture:</strong>
                        <span class="${nasaData.soilMoisture < 30 ? 'poor' : nasaData.soilMoisture > 60 ? 'good' : 'fair'}">
                            ${nasaData.soilMoisture.toFixed(1)}%
                        </span>
                    </div>
                    <div class="metric">
                        <strong>Temperature:</strong>
                        <span>${nasaData.temperature.toFixed(1)}°C</span>
                    </div>
                    <div class="metric">
                        <strong>Precipitation:</strong>
                        <span>${nasaData.precipitation.toFixed(1)} mm/month</span>
                    </div>
                    <div class="metric">
                        <strong>Vegetation Health (NDVI):</strong>
                        <span class="${nasaData.ndvi < 0.3 ? 'poor' : nasaData.ndvi > 0.6 ? 'good' : 'fair'}">
                            ${nasaData.ndvi.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <div class="crop-varieties">
                <h4>🌱 Available Crop Varieties for Your Region</h4>
                <div class="crop-grid">
                    ${cropVarieties.map(crop => `
                        <div class="crop-option">
                            <span class="crop-emoji">${crop.emoji}</span>
                            <span class="crop-name">${crop.name}</span>
                            <span class="water-need water-${crop.waterNeed}">💧 ${crop.waterNeed}</span>
                            <span class="temp-range">🌡️ ${crop.tempRange[0]}-${crop.tempRange[1]}°C</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="water-rate-config">
                <h4>💧 Water Consumption Rate Calculation</h4>
                <div class="rate-formula">
                    <div class="formula-result">
                        <strong>Calculated Rate:</strong> ${waterRate.rate} L/hour/hectare
                    </div>
                    <div class="formula-factors">
                        <h5>Adjustment Factors:</h5>
                        <ul>
                            <li>Soil Moisture: ×${waterRate.factors.soilMoisture.toFixed(2)}</li>
                            <li>Temperature: ×${waterRate.factors.temperature.toFixed(2)}</li>
                            <li>Precipitation: ×${waterRate.factors.precipitation.toFixed(2)}</li>
                            <li>Vegetation: ×${waterRate.factors.vegetation.toFixed(2)}</li>
                            <li>Evapotranspiration: ×${waterRate.factors.evapotranspiration.toFixed(2)}</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="expected-benefits">
                <h4>📈 NASA Data Impact</h4>
                <div class="impact-numbers">
                    <div class="impact-card">
                        <div class="big-number" style="color: #2E8B57; font-weight: bold;">+35%</div>
                        <div class="impact-label" style="color: #333; font-weight: 500;">Higher Yield</div>
                    </div>
                    <div class="impact-card">
                        <div class="big-number" style="color: #1E90FF; font-weight: bold;">-30%</div>
                        <div class="impact-label" style="color: #333; font-weight: 500;">Water Usage</div>
                    </div>
                    <div class="impact-card">
                        <div class="big-number" style="color: #FF6347; font-weight: bold;">$2,500</div>
                        <div class="impact-label" style="color: #333; font-weight: 500;">Avg. Annual Savings</div>
                    </div>
                </div>
                <p class="impact-summary" style="color: #555; text-align: center; margin-top: 15px;">🛰️ Real NASA satellite data vs traditional guesswork</p>
            </div>

            <div class="modal-actions">
                <button onclick="window.farmGameUI.confirmSatelliteData()" class="action-btn primary">
                    ✅ Apply NASA-Powered Configuration
                </button>
                <button onclick="window.farmGameUI.closeModal()" class="action-btn secondary">
                    ❌ Use Traditional Methods
                </button>
            </div>
        `;

        this.showModal(content);
    }

    /**
     * Show NASA Decision Challenge - critical decision scenarios
     */
    showNASADecisionChallenge() {
        const scenario = this.generateCriticalScenario();

        const content = `
            <div class="modal-header">
                <h3>🧠 NASA Decision Challenge</h3>
                <p class="scenario-subtitle">Critical farming decision using real NASA data</p>
            </div>

            <div class="scenario-setup">
                <div class="crisis-alert">
                    <h4>🚨 ${scenario.title}</h4>
                    <p class="situation">${scenario.situation}</p>
                </div>

                <div class="nasa-data-panel">
                    <h4>📡 Current NASA Data</h4>
                    <div class="data-grid">
                        ${scenario.nasaData.map(data => `
                            <div class="data-item">
                                <span class="data-label">${data.source}:</span>
                                <span class="data-value ${data.status}">${data.value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="decision-options">
                <h4>🤔 What will you do?</h4>

                <div class="option-card traditional" onclick="farmGameUI.selectDecisionOption('traditional', '${scenario.id}')">
                    <div class="option-header">
                        <span class="option-icon">👴</span>
                        <span class="option-title">Traditional Approach</span>
                    </div>
                    <p class="option-description">${scenario.traditional.description}</p>
                    <div class="cost-estimate">Estimated cost: <strong>${scenario.traditional.cost}</strong></div>
                </div>

                <div class="option-card nasa-powered" onclick="farmGameUI.selectDecisionOption('nasa', '${scenario.id}')">
                    <div class="option-header">
                        <span class="option-icon">🛰️</span>
                        <span class="option-title">NASA Data-Driven</span>
                    </div>
                    <p class="option-description">${scenario.nasa.description}</p>
                    <div class="cost-estimate">Estimated cost: <strong>${scenario.nasa.cost}</strong></div>
                </div>
            </div>

            <div class="modal-actions">
                <button onclick="farmGameUI.closeModal()" class="action-btn secondary">
                    ❌ Skip Challenge
                </button>
            </div>
        `;

        this.showModal(content);
    }

    /**
     * Generate a critical farming scenario
     */
    generateCriticalScenario() {
        const scenarios = [
            {
                id: 'drought_response',
                title: 'Drought Emergency Response',
                situation: 'Your wheat crops are showing stress symptoms. Leaves are yellowing and growth has slowed. You need to decide how to respond quickly.',
                nasaData: [
                    { source: 'SMAP Soil Moisture', value: '12%', status: 'critical' },
                    { source: 'GPM Precipitation Forecast', value: '0mm next 10 days', status: 'poor' },
                    { source: 'MODIS NDVI', value: '0.28', status: 'poor' },
                    { source: 'Landsat Temperature', value: '38°C', status: 'critical' }
                ],
                traditional: {
                    description: 'Apply emergency irrigation to entire field immediately. Better safe than sorry.',
                    cost: '$2,500',
                    result: { savings: -500, effectiveness: 60, message: 'Over-irrigated healthy areas, wasted water, some crop recovery' }
                },
                nasa: {
                    description: 'Use SMAP data to target only the driest 40% of field. GPM shows rain in 5 days - minimal irrigation.',
                    cost: '$800',
                    result: { savings: 1700, effectiveness: 90, message: 'Precise irrigation, maximum efficiency, full crop recovery' }
                }
            },
            {
                id: 'fertilizer_timing',
                title: 'Fertilizer Application Decision',
                situation: 'Spring planting season. Your corn needs nutrients but timing is everything. Wrong timing could waste $1,000s.',
                nasaData: [
                    { source: 'SMAP Soil Moisture', value: '85%', status: 'high' },
                    { source: 'GPM Rain Forecast', value: '25mm in 2 days', status: 'good' },
                    { source: 'MODIS NDVI', value: '0.15', status: 'fair' },
                    { source: 'Soil Temperature', value: '8°C', status: 'poor' }
                ],
                traditional: {
                    description: 'Apply fertilizer now - spring is the right time according to the calendar.',
                    cost: '$1,200',
                    result: { savings: -400, effectiveness: 30, message: 'Heavy rain washed away 60% of fertilizer into groundwater' }
                },
                nasa: {
                    description: 'Wait 5 days. Soil too wet + incoming rain = fertilizer runoff. Apply after rain stops.',
                    cost: '$1,200',
                    result: { savings: 800, effectiveness: 95, message: 'Perfect timing, maximum nutrient uptake, no waste' }
                }
            },
            {
                id: 'frost_protection',
                title: 'Frost Damage Prevention',
                situation: 'Your tomato plants are flowering. Weather feels fine but you notice some concerning signs.',
                nasaData: [
                    { source: 'Landsat Night Temperature', value: '2°C predicted', status: 'critical' },
                    { source: 'MODIS Cloud Cover', value: '15% (clear skies)', status: 'poor' },
                    { source: 'Humidity', value: '45%', status: 'fair' },
                    { source: 'Wind Speed', value: '5 km/h', status: 'poor' }
                ],
                traditional: {
                    description: 'Looks fine to me. Maybe cover a few plants just in case.',
                    cost: '$50',
                    result: { savings: -2000, effectiveness: 20, message: 'Lost 80% of flowering tomatoes to frost damage' }
                },
                nasa: {
                    description: 'Landsat shows frost risk! Deploy full frost protection: covers + heaters tonight.',
                    cost: '$300',
                    result: { savings: 1750, effectiveness: 98, message: 'Saved entire crop, prevented $2,000 loss' }
                }
            }
        ];

        // Return random scenario
        return scenarios[Math.floor(Math.random() * scenarios.length)];
    }

    /**
     * Handle decision option selection
     */
    selectDecisionOption(option, scenarioId) {
        // Find the scenario
        const scenario = this.generateCriticalScenario(); // In real implementation, store current scenario
        const result = option === 'traditional' ? scenario.traditional.result : scenario.nasa.result;

        this.showDecisionResult(option, result, scenario);
    }

    /**
     * Show decision result comparison
     */
    showDecisionResult(chosenOption, result, scenario) {
        const isNASA = chosenOption === 'nasa';
        const otherOption = isNASA ? scenario.traditional : scenario.nasa;
        const otherResult = isNASA ? scenario.traditional.result : scenario.nasa.result;

        const content = `
            <div class="modal-header">
                <h3>📊 Decision Results</h3>
            </div>

            <div class="result-comparison">
                <div class="chosen-result ${isNASA ? 'nasa-choice' : 'traditional-choice'}">
                    <h4>✅ Your Choice: ${isNASA ? '🛰️ NASA Data-Driven' : '👴 Traditional'}</h4>
                    <div class="result-details">
                        <div class="result-item">
                            <span class="result-label">Financial Impact:</span>
                            <span class="result-value ${result.savings > 0 ? 'positive' : 'negative'}">
                                ${result.savings > 0 ? '+' : ''}$${Math.abs(result.savings)}
                            </span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Effectiveness:</span>
                            <span class="result-value">${result.effectiveness}%</span>
                        </div>
                        <div class="result-outcome">${result.message}</div>
                    </div>
                </div>

                <div class="comparison-result">
                    <h4>📈 vs. Alternative Approach</h4>
                    <div class="alternative-outcome">
                        <p><strong>${isNASA ? 'Traditional' : 'NASA'} method would have:</strong></p>
                        <div class="result-item">
                            <span class="result-label">Financial Impact:</span>
                            <span class="result-value ${otherResult.savings > 0 ? 'positive' : 'negative'}">
                                ${otherResult.savings > 0 ? '+' : ''}$${Math.abs(otherResult.savings)}
                            </span>
                        </div>
                        <p class="alternative-message">${otherResult.message}</p>
                    </div>
                </div>

            </div>

            <div class="modal-actions">
                <button onclick="farmGameUI.showNASADecisionChallenge()" class="action-btn primary">
                    🔄 Try Another Challenge
                </button>
                <button onclick="farmGameUI.closeModal()" class="action-btn secondary">
                    ✅ Done
                </button>
            </div>
        `;

        this.showModal(content);
    }


    /**
     * Confirm and apply satellite data configuration
     */
    confirmSatelliteData() {
        this.closeModal();
        this.farmContextSelected = true;

        // Mark satellite data as loaded and store in window for global access
        window.farmGameUI = this;

        // Configure farm with satellite-based settings
        this.selectFarmContext('satellite-based');

        // Re-render UI to show location info
        this.render();
        this.updateDisplay();

        this.showNotification('🛰️ Farm configured with satellite data!', 'success');
    }

    /**
     * Show farm context selection screen
     */
    showFarmContextSelection() {
        this.container.innerHTML = `
            <div class="farm-context-selection">
                <div class="selection-header">
                    <h2>🌾 Choose Your Farm Type</h2>
                    <p>Select the type of farm that matches your learning goals and interests:</p>
                </div>

                <div class="farm-type-grid">
                    <div class="farm-type-card smallholder" data-farm-type="smallholder">
                        <div class="farm-type-icon">👨‍🌾</div>
                        <h3>Smallholder Farm</h3>
                        <div class="farm-type-stats">
                            <div class="stat">🌾 5-10 acres</div>
                            <div class="stat">💰 $10,000 budget</div>
                            <div class="stat">🐄 20 cattle, 50 chickens</div>
                            <div class="stat">👥 Family-operated</div>
                        </div>
                        <div class="farm-type-description">
                            <p><strong>Focus:</strong> Sustainable practices, community resilience, diverse crops</p>
                            <p><strong>Challenges:</strong> Limited resources, weather vulnerability, market access</p>
                            <p><strong>Learning Goals:</strong> Resource optimization, risk management, sustainable agriculture</p>
                        </div>
                        <div class="farm-type-features">
                            <h5>Key Features:</h5>
                            <ul>
                                <li>Higher dependency on weather and NASA data</li>
                                <li>Focus on crop diversity and rotation</li>
                                <li>Community-based decision making</li>
                                <li>Emphasis on sustainability over profit</li>
                            </ul>
                        </div>
                    </div>

                    <div class="farm-type-card industrial" data-farm-type="industrial">
                        <div class="farm-type-icon">🏭</div>
                        <h3>Industrial Farm</h3>
                        <div class="farm-type-stats">
                            <div class="stat">🌾 500+ acres</div>
                            <div class="stat">💰 $500,000 budget</div>
                            <div class="stat">🐄 1000 cattle, 5000 chickens</div>
                            <div class="stat">👥 Corporate-operated</div>
                        </div>
                        <div class="farm-type-description">
                            <p><strong>Focus:</strong> Scale efficiency, technology integration, market optimization</p>
                            <p><strong>Challenges:</strong> Environmental impact, regulatory compliance, market volatility</p>
                            <p><strong>Learning Goals:</strong> Technology adoption, supply chain management, environmental stewardship</p>
                        </div>
                        <div class="farm-type-features">
                            <h5>Key Features:</h5>
                            <ul>
                                <li>Advanced technology and automation</li>
                                <li>Large-scale crop management</li>
                                <li>Data-driven decision making</li>
                                <li>Focus on efficiency and yield optimization</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="context-comparison">
                    <h4>📊 Comparison Overview</h4>
                    <div class="comparison-table">
                        <div class="comparison-row">
                            <div class="comparison-category">Decision Complexity</div>
                            <div class="smallholder-value">Moderate - Focus on survival</div>
                            <div class="industrial-value">High - Strategic optimization</div>
                        </div>
                        <div class="comparison-row">
                            <div class="comparison-category">NASA Data Usage</div>
                            <div class="smallholder-value">Critical for survival</div>
                            <div class="industrial-value">Competitive advantage</div>
                        </div>
                        <div class="comparison-row">
                            <div class="comparison-category">Crisis Impact</div>
                            <div class="smallholder-value">Severe - Limited recovery options</div>
                            <div class="industrial-value">Manageable - More resources</div>
                        </div>
                        <div class="comparison-row">
                            <div class="comparison-category">Achievement Focus</div>
                            <div class="smallholder-value">Sustainability & Community</div>
                            <div class="industrial-value">Efficiency & Scale</div>
                        </div>
                    </div>
                </div>

                <div class="selection-footer">
                    <p><em>💡 You can change farm type later in the game settings</em></p>
                </div>
            </div>
        `;

        // Add event listeners for farm type selection
        setTimeout(() => {
            this.container.querySelectorAll('.farm-type-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const farmType = e.currentTarget.dataset.farmType;
                    if (farmType) {
                        this.selectFarmContext(farmType);
                    }
                });
            });
        }, 100);
    }

    /**
     * Select and configure farm context
     */
    selectFarmContext(contextType) {
        this.farmContextSelected = true;

        // Configure farm simulation based on context
        this.configureFarmSimulation(contextType);

        // Show brief introduction
        this.showFarmContextIntroduction(contextType);

        // Re-render with selected context immediately after intro
        setTimeout(() => {
            console.log('🎯 Starting game initialization after context selection...');
            this.render();
            this.updateDisplay();

            // Start the game with 1x speed automatically
            this.gameSpeed = 1;
            this.isPaused = false;
            console.log(`🎮 Setting initial game speed to ${this.gameSpeed}x, paused: ${this.isPaused}`);

            // Update speed button text
            const speedBtn = document.getElementById('speedBtn');
            if (speedBtn) {
                speedBtn.textContent = '⏩ Speed';
                console.log('✅ Speed button text updated');
            } else {
                console.error('❌ Speed button not found!');
            }

            console.log('🚀 Starting automatic speed timer...');
            this.startSpeedTimer();

            this.showNotification('🎮 Game started! Time will advance automatically. Use Speed button to adjust pace.', 'success');
        }, 1500);
    }

    configureFarmSimulation(contextType) {
        const farmState = this.farmSimulation.getFarmState();

        if (contextType === 'smallholder') {
            // Configure smallholder farm
            farmState.farmContext = 'smallholder';
            farmState.farmSize = 7; // acres
            farmState.resources.money = 10000;
            farmState.resources.water = 80;
            farmState.resources.fertilizer = 30;
            farmState.resources.feed = 50;
            farmState.resources.fuel = 40;

            // Smaller livestock numbers
            farmState.livestock.cattle.count = 15;
            farmState.livestock.sheep.count = 25;
            farmState.livestock.chickens.count = 60;

            // Crops will be set based on location when satellite data is loaded
            farmState.crops = [];

        } else if (contextType === 'industrial') {
            // Configure industrial farm
            farmState.farmContext = 'industrial';
            farmState.farmSize = 750; // acres
            farmState.resources.money = 500000;
            farmState.resources.water = 2000;
            farmState.resources.fertilizer = 800;
            farmState.resources.feed = 1500;
            farmState.resources.fuel = 1000;

            // Larger livestock numbers
            farmState.livestock.cattle.count = 800;
            farmState.livestock.sheep.count = 400;
            farmState.livestock.chickens.count = 4000;

            // Crops will be set based on location when satellite data is loaded
            farmState.crops = [];
        }

        // Set context-specific parameters
        farmState.contextModifiers = this.getContextModifiers(contextType);
    }

    getContextModifiers(contextType) {
        if (contextType === 'smallholder') {
            return {
                crisisVulnerability: 1.5, // More vulnerable to crises
                resourceEfficiency: 0.8, // Less efficient resource usage
                nasaDependency: 1.3, // Higher dependency on NASA data
                sustainabilityFocus: 1.4, // Higher sustainability requirements
                decisionImpact: 1.2, // Decisions have bigger relative impact
                weatherSensitivity: 1.3 // More sensitive to weather changes
            };
        } else if (contextType === 'industrial') {
            return {
                crisisVulnerability: 0.7, // More resilient to crises
                resourceEfficiency: 1.3, // More efficient resource usage
                nasaDependency: 1.0, // Standard NASA data usage
                sustainabilityFocus: 0.8, // Lower sustainability pressure
                decisionImpact: 0.9, // Decisions have smaller relative impact
                weatherSensitivity: 0.8 // Less sensitive to weather changes
            };
        }

        return {}; // Default modifiers
    }

    showFarmContextIntroduction(contextType) {
        const introductions = {
            smallholder: {
                title: "",
                message: "",
                tips: []
            },
            industrial: {
                title: "",
                message: "",
                tips: []
            }
        };

        const intro = introductions[contextType];
        this.showNotification(
            `${intro.title}\n\n${intro.message}\n\nKey Focus Areas:\n${intro.tips.map(tip => `• ${tip}`).join('\n')}`,
            'info'
        );
    }

    // Helper methods for seasonal progress view

    getSeasonIcon(season) {
        const icons = {
            spring: '🌱',
            summer: '☀️',
            fall: '🍂',
            winter: '❄️'
        };
        return icons[season] || '📅';
    }

    getSeasonDescription(season) {
        const descriptions = {
            spring: 'Spring is the season of growth and renewal. Perfect time for planting crops and preparing equipment for the growing season.',
            summer: 'Summer brings peak growing conditions with longer days and warmer temperatures. Monitor crops closely for water needs and pest activity.',
            fall: 'Fall is harvest season! Time to gather crops and prepare for winter. Plan your crop storage and livestock winter preparations.',
            winter: 'Winter is the planning season. Focus on farm maintenance, livestock care, and planning next year\'s crop strategy.'
        };
        return descriptions[season] || 'A season of farming activity and growth.';
    }

    getSeasonProgress(farmState) {
        const seasonWeek = ((farmState.currentWeek - 1) % 52) + 1;
        let seasonStartWeek = 1;

        if (farmState.currentSeason === 'summer') seasonStartWeek = 14;
        else if (farmState.currentSeason === 'fall') seasonStartWeek = 27;
        else if (farmState.currentSeason === 'winter') seasonStartWeek = 40;

        const weekInSeason = seasonWeek - seasonStartWeek + 1;
        return Math.min((weekInSeason / 13) * 100, 100);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    completeActivity(activityId) {
        const farmState = this.farmSimulation.getFarmState();
        const currentSeason = farmState.currentSeason;
        const seasonProgress = farmState.seasonalProgress?.[currentSeason];

        if (seasonProgress) {
            const activity = seasonProgress.activities.find(a => a.id === activityId);
            if (activity && !activity.completed) {
                activity.completed = true;
                activity.week = farmState.currentWeek;

                // Award points for completing activity
                farmState.playerStats.totalScore += 25;

                this.showNotification(
                    `✅ Activity completed: ${activity.name}! (+25 points)`,
                    'success'
                );

                // Refresh the seasonal view
                this.updateDisplay();
            }
        }
    }

    updateTimeDisplay(timeData) {
        const weekElement = document.getElementById('currentWeek');
        const seasonElement = document.getElementById('currentSeason');
        const yearElement = document.getElementById('currentYear');

        if (weekElement) weekElement.textContent = timeData.week;
        if (seasonElement) seasonElement.textContent = this.capitalize(timeData.season);
        if (yearElement) yearElement.textContent = timeData.year;
    }

    // Tutorial and Onboarding System

    hasSeenTutorial() {
        return localStorage.getItem('farmNavigatorsTutorialCompleted') === 'true';
    }

    markTutorialComplete() {
        localStorage.setItem('farmNavigatorsTutorialCompleted', 'true');
    }

    showGameTutorial() {
        this.tutorialStep = 0;
        this.tutorialSteps = this.getTutorialSteps();
        this.displayTutorialStep();
    }

    getTutorialSteps() {
        return [
            {
                title: "Helper",
                content: `
                    <div class="tutorial-welcome">
                        <div class="tutorial-hero">
                            <h2 style="color: #667eea;">Welcome to NASA Farm Navigators!</h2>
                            <p class="tutorial-subtitle" style="color: white;">Learn to farm smarter using real NASA satellite data</p>
                        </div>

                        <div class="tutorial-intro">
                            <p style="color: white;">You're about to embark on an agricultural journey where you'll:</p>
                            <ul class="tutorial-benefits">
                                <li style="color: white;">Manage crops through seasonal cycles</li>
                                <li style="color: white;">Use real NASA satellite data for farming decisions</li>
                                <li style="color: white;">Optimize irrigation with SMAP soil moisture data</li>
                                <li style="color: white;">Track your progress and achieve farming milestones</li>
                                <li style="color: white;">Learn real-world agricultural practices</li>
                            </ul>
                        </div>

                        <div class="tutorial-farmtype">
                            <p style="color: white;"><strong>Farm Context:</strong> ${this.farmSimulation.getFarmState().farmContext || 'Mixed Agriculture'}</p>
                            <p class="tutorial-context-desc" style="color: white;">Your farming strategy will be tailored to this agricultural context.</p>
                        </div>
                    </div>
                `,
                target: null,
                highlight: false,
                actions: [
                    { text: "Let's Start Learning!", action: "next", primary: true }
                ]
            },
            {
                title: "📅 Understanding Time and Seasons",
                content: `
                    <div class="tutorial-time">
                        <h3>Time Flows in Your Farm</h3>
                        <p>Your farm operates on a realistic time cycle:</p>

                        <div class="time-breakdown">
                            <div class="time-unit">
                                <strong>Real-time:</strong> 1 second = 1 hour in game
                            </div>
                            <div class="time-unit">
                                <strong>Weeks:</strong> 7 days (168 real seconds)
                            </div>
                            <div class="time-unit">
                                <strong>Seasons:</strong> 13 weeks each (Spring → Summer → Fall → Winter)
                            </div>
                            <div class="time-unit">
                                <strong>Year:</strong> 52 weeks (about 2.4 real hours)
                            </div>
                        </div>

                    </div>
                `,
                target: ".time-display",
                highlight: true,
                actions: [
                    { text: "⬅️ Previous", action: "prev", primary: false },
                    { text: "Continue Learning 📚", action: "next", primary: true }
                ]
            },
            {
                title: "🌾 Farm Overview and Navigation",
                content: `
                    <div class="tutorial-navigation">
                        <h3>🗺️ Navigate Your Farm</h3>
                        <p>Use these tabs to manage different aspects of your farming operation:</p>

                        <div class="nav-explanations">
                            <div class="nav-item">
                                <span class="nav-icon">🏠</span>
                                <div class="nav-details">
                                    <strong>Farm Overview:</strong> Central dashboard showing crop status, livestock, and recent activities
                                </div>
                            </div>
                            <div class="nav-item">
                                <span class="nav-icon">🌾</span>
                                <div class="nav-details">
                                    <strong>Crops:</strong> Detailed crop management, growth stages, and harvest planning
                                </div>
                            </div>
                            <div class="nav-item">
                                <span class="nav-icon">🐄</span>
                                <div class="nav-details">
                                    <strong>Livestock:</strong> Animal health, feeding, and breeding management
                                </div>
                            </div>
                            <div class="nav-item">
                                <span class="nav-icon">📦</span>
                                <div class="nav-details">
                                    <strong>Resources:</strong> Monitor water, fertilizer, fuel, and financial resources
                                </div>
                            </div>
                            <div class="nav-item">
                                <span class="nav-icon">📅</span>
                                <div class="nav-details">
                                    <strong>Seasonal Progress:</strong> Track seasonal activities, market prices, and yearly goals
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                target: ".game-nav",
                highlight: true,
                actions: [
                    { text: "⬅️ Previous", action: "prev", primary: false },
                    { text: "Show Me NASA Data! 🛰️", action: "next", primary: true }
                ]
            },
            {
                title: "🛰️ NASA Satellite Data Integration",
                content: `
                    <div class="tutorial-nasa">
                        <h3>📡 Real NASA Data at Your Fingertips</h3>
                        <p>This isn't just a game - you're using actual NASA satellite data to make farming decisions!</p>

                        <div class="nasa-systems">
                            <div class="nasa-system-info">
                                <h4>🌍 SMAP - Soil Moisture Active Passive</h4>
                                <p><strong>What it does:</strong> Measures soil moisture every 2-3 days at 9km resolution</p>
                                <p><strong>How you use it:</strong> Optimize irrigation timing and water conservation</p>
                            </div>

                            <div class="nasa-system-info">
                                <h4>🌡️ Landsat - Thermal & Optical Imagery</h4>
                                <p><strong>What it does:</strong> Provides crop health and soil temperature data</p>
                                <p><strong>How you use it:</strong> Perfect timing for fertilizer application and pest detection</p>
                            </div>

                            <div class="nasa-system-info">
                                <h4>🌿 MODIS - Vegetation Monitoring</h4>
                                <p><strong>What it does:</strong> Daily vegetation index and crop condition monitoring</p>
                                <p><strong>How you use it:</strong> Track crop health and predict yield outcomes</p>
                            </div>
                        </div>

                    </div>
                `,
                target: ".overview-container",
                highlight: true,
                actions: [
                    { text: "⬅️ Previous", action: "prev", primary: false },
                    { text: "Learn Decision Making 🎯", action: "next", primary: true }
                ]
            },
            {
                title: "🎯 Making Farm Decisions",
                content: `
                    <div class="tutorial-decisions">
                        <h3>⚡ Smart Farming Decisions</h3>
                        <p>Every decision you make affects your farm's success. Here's how to make informed choices:</p>

                        <div class="decision-types">
                            <div class="decision-example">
                                <h4>💧 Irrigation Decisions</h4>
                                <p><strong>Data Source:</strong> NASA SMAP soil moisture measurements</p>
                                <p><strong>Consider:</strong> Current soil moisture, weather forecast, crop growth stage</p>
                                <p><strong>Impact:</strong> Water efficiency, crop yield, resource costs</p>
                            </div>

                            <div class="decision-example">
                                <h4>🌱 Fertilizer Timing</h4>
                                <p><strong>Data Source:</strong> Landsat thermal imagery and soil temperature</p>
                                <p><strong>Consider:</strong> Soil temperature, nutrient levels, crop development</p>
                                <p><strong>Impact:</strong> Nutrient efficiency, environmental responsibility, crop health</p>
                            </div>

                            <div class="decision-example">
                                <h4>🌾 Harvest Planning</h4>
                                <p><strong>Data Source:</strong> MODIS vegetation index and growth monitoring</p>
                                <p><strong>Consider:</strong> Crop maturity, weather conditions, market prices</p>
                                <p><strong>Impact:</strong> Crop quality, market timing, storage needs</p>
                            </div>
                        </div>

                        <div class="tutorial-scoring">
                            <h4>📊 Decision Scoring System</h4>
                            <ul>
                                <li>✅ <strong>NASA Aligned:</strong> +15 points + efficiency bonus</li>
                                <li>⚠️ <strong>Partially Aligned:</strong> +8 points</li>
                                <li>❌ <strong>Misaligned:</strong> +3 points (you still learn!)</li>
                            </ul>
                        </div>
                    </div>
                `,
                target: ".decision-panel",
                highlight: true,
                actions: [
                    { text: "⬅️ Previous", action: "prev", primary: false },
                    { text: "Try Making a Decision! 🚀", action: "next", primary: true }
                ]
            },
            {
                title: "🎮 Your First Decision - Interactive Tutorial",
                content: `
                    <div class="tutorial-interactive">
                        <h3>Practice Time: Make Your First Decision!</h3>
                        <p>Let's practice with a real farming scenario using NASA data.</p>

                        <div class="scenario-setup">
                            <h4>Current Situation:</h4>
                            <ul>
                                <li>Your crops are adapting to local conditions</li>
                                <li>NASA SMAP provides real soil moisture data</li>
                                <li>Weather patterns vary by your location</li>
                                <li>Water needs depend on climate and crop type</li>
                            </ul>
                        </div>

                        <div class="tutorial-question">
                            <h4>❓ What should you do?</h4>
                            <p>This is exactly the type of decision you'll make throughout the game. NASA data helps you make the optimal choice!</p>
                        </div>

                        <div class="tutorial-hint">
                            <p><strong>💡 Hint:</strong> Different crops thrive in different climates. NASA satellite data tells you what's possible in your specific location - from Arctic research stations to tropical farms!</p>
                        </div>
                    </div>
                `,
                target: ".decision-buttons",
                highlight: true,
                actions: [
                    { text: "⬅️ Previous", action: "prev", primary: false },
                    { text: "Plant New Crops 🌱", action: "interactive_crops", primary: true }
                ]
            },
            {
                title: "📚 Learning and Feedback System",
                content: `
                    <div class="tutorial-feedback">
                        <h3>🎓 Continuous Learning Experience</h3>
                        <p>Every decision you make becomes a learning opportunity with detailed feedback.</p>

                        <div class="feedback-features">
                            <div class="feedback-feature">
                                <h4>📊 Immediate Results</h4>
                                <p>See the immediate impact of your decisions on crops, livestock, and resources</p>
                            </div>

                            <div class="feedback-feature">
                                <h4>🛰️ NASA Data Insights</h4>
                                <p>Learn how your choice compares to NASA data recommendations</p>
                            </div>

                            <div class="feedback-feature">
                                <h4>💡 Learning Outcomes</h4>
                                <p>Understand the science behind each decision with educational explanations</p>
                            </div>

                            <div class="feedback-feature">
                                <h4>🌍 Real-World Context</h4>
                                <p>Discover how farmers worldwide use similar data and techniques</p>
                            </div>

                            <div class="feedback-feature">
                                <h4>📈 Progress Tracking</h4>
                                <p>Monitor your success rate and NASA data alignment over time</p>
                            </div>
                        </div>

                        <div class="tutorial-achievement">
                            <h4>🏆 Achievement System</h4>
                            <p>Unlock achievements as you master different aspects of data-driven farming!</p>
                        </div>
                    </div>
                `,
                target: ".achievements-grid",
                highlight: false,
                actions: [
                    { text: "⬅️ Previous", action: "prev", primary: false },
                    { text: "Learn About Progression 📅", action: "next", primary: true }
                ]
            },
            {
                title: "📅 Seasonal Progression and Long-term Strategy",
                content: `
                    <div class="tutorial-progression">
                        <h3>🗓️ Master the Agricultural Calendar</h3>
                        <p>Success in farming requires thinking beyond individual decisions to seasonal and yearly strategies.</p>

                        <div class="seasonal-guide">
                            <div class="season-guide">
                                <h4>🌱 Spring Strategy</h4>
                                <ul>
                                    <li>Plan crop planting based on soil temperature data</li>
                                    <li>Prepare equipment and infrastructure</li>
                                    <li>Monitor soil moisture for optimal germination</li>
                                </ul>
                            </div>

                            <div class="season-guide">
                                <h4>☀️ Summer Management</h4>
                                <ul>
                                    <li>Intensive crop monitoring and irrigation</li>
                                    <li>Pest and disease management</li>
                                    <li>Livestock care during heat stress</li>
                                </ul>
                            </div>

                            <div class="season-guide">
                                <h4>🍂 Fall Harvest</h4>
                                <ul>
                                    <li>Optimal harvest timing using vegetation indices</li>
                                    <li>Market timing and storage planning</li>
                                    <li>Winter preparation activities</li>
                                </ul>
                            </div>

                            <div class="season-guide">
                                <h4>❄️ Winter Planning</h4>
                                <ul>
                                    <li>Strategic planning for next year</li>
                                    <li>Equipment maintenance and repairs</li>
                                    <li>Intensive livestock care</li>
                                </ul>
                            </div>
                        </div>

                        <div class="progression-rewards">
                            <h4>🎯 Progression Rewards</h4>
                            <p>Complete seasonal activities and achieve milestones to unlock:</p>
                            <ul>
                                <li>Advanced farming techniques</li>
                                <li>Efficiency improvements</li>
                                <li>New agricultural insights</li>
                                <li>Historical performance analysis</li>
                            </ul>
                        </div>
                    </div>
                `,
                target: "#game-view-seasonal",
                highlight: false,
                actions: [
                    { text: "⬅️ Previous", action: "prev", primary: false },
                    { text: "Ready to Farm! 🚜", action: "complete", primary: true }
                ]
            }
        ];
    }

    displayTutorialStep() {
        const step = this.tutorialSteps[this.tutorialStep];

        // Create tutorial overlay
        const tutorialHTML = `
            <div class="tutorial-overlay" id="tutorialOverlay">
                <div class="tutorial-modal">
                    <div class="tutorial-header">
                        <h2>${step.title}</h2>
                        <div class="tutorial-progress">
                            <span class="tutorial-step">${this.tutorialStep + 1} of ${this.tutorialSteps.length}</span>
                            <div class="tutorial-progress-bar">
                                <div class="tutorial-progress-fill" style="width: ${((this.tutorialStep + 1) / this.tutorialSteps.length) * 100}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="tutorial-content">
                        ${step.content}
                    </div>

                    <div class="tutorial-actions">
                        ${step.actions.map(action => `
                            <button class="tutorial-btn ${action.primary ? 'primary' : 'secondary'}"
                                    onclick="farmGameUI.handleTutorialAction('${action.action}')">
                                ${action.text}
                            </button>
                        `).join('')}
                    </div>

                    <div class="tutorial-skip">
                        <button class="tutorial-skip-btn" onclick="farmGameUI.skipTutorial()">
                            Skip Tutorial
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add tutorial to page
        document.body.insertAdjacentHTML('beforeend', tutorialHTML);

        // Add highlight to target element if specified
        if (step.target && step.highlight) {
            this.highlightElement(step.target);
        }
    }

    handleTutorialAction(action) {
        switch (action) {
            case 'next':
                this.nextTutorialStep();
                break;
            case 'prev':
                this.prevTutorialStep();
                break;
            case 'interactive_crops':
                this.closeTutorial();
                this.activateCropsSection(); // Navigate to crops section
                break;
            case 'complete':
                this.completeTutorial();
                break;
        }
    }

    nextTutorialStep() {
        this.closeTutorial();
        if (this.tutorialStep < this.tutorialSteps.length - 1) {
            this.tutorialStep++;
            this.displayTutorialStep();
        } else {
            this.completeTutorial();
        }
    }

    prevTutorialStep() {
        this.closeTutorial();
        if (this.tutorialStep > 0) {
            this.tutorialStep--;
            this.displayTutorialStep();
        }
    }

    skipTutorial() {
        this.closeTutorial();
        this.markTutorialComplete();
        this.showNotification('Tutorial skipped. You can restart it anytime from the help menu!', 'info');
    }

    completeTutorial() {
        this.closeTutorial();
        this.markTutorialComplete();
        this.showNotification('🎉 Tutorial completed! You\'re ready to become a NASA-powered farmer!', 'success');

        // Award tutorial completion achievement
        const farmState = this.farmSimulation.getFarmState();
        farmState.playerStats.totalScore += 100;

        this.showTutorialCompletionDialog();
    }

    closeTutorial() {
        const overlay = document.getElementById('tutorialOverlay');
        if (overlay) {
            overlay.remove();
        }
        this.removeAllHighlights();
    }

    activateCropsSection() {
        // Switch to crops view
        this.switchView('crops');
        this.updateDecisionPanel('crops');

        // Highlight the crops tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.view === 'crops') {
                tab.classList.add('active');
            }
        });

        // Show a notification to guide the user
        this.showNotification('🌱 Now click "Plant New Crop" to start growing your first crop with NASA satellite data!', 'info');

        // Optional: Briefly highlight the Plant New Crop button
        setTimeout(() => {
            const plantBtn = document.querySelector('button[onclick*="plantNewCrop"]');
            if (plantBtn) {
                plantBtn.style.animation = 'pulse 2s ease-in-out 3';
                plantBtn.style.boxShadow = '0 0 20px rgba(46, 150, 245, 0.8)';
                setTimeout(() => {
                    plantBtn.style.animation = '';
                    plantBtn.style.boxShadow = '';
                }, 6000);
            }
        }, 500);
    }

    highlightElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('tutorial-highlight-element');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    removeAllHighlights() {
        document.querySelectorAll('.tutorial-highlight-element').forEach(el => {
            el.classList.remove('tutorial-highlight-element');
        });
    }

    showTutorialCompletionDialog() {
        this.showModal(`
            <div class="tutorial-completion-dialog">
                <div class="completion-header">
                    <h2>🎉 Congratulations, Farm Navigator!</h2>
                    <div class="completion-badge">
                        <div class="badge-icon">🏆</div>
                        <div class="badge-text">Tutorial Master</div>
                    </div>
                </div>

                <div class="completion-content">
                    <div class="completion-summary">
                        <h3>🌟 You've Earned:</h3>
                        <ul class="completion-rewards">
                            <li>📊 +100 Tutorial Completion Points</li>
                            <li>🏆 Tutorial Master Achievement</li>
                            <li>🛰️ NASA Data Certification</li>
                            <li>🌱 Access to Advanced Farming Features</li>
                        </ul>
                    </div>

                    <div class="next-steps">
                        <h3>🎯 What's Next?</h3>
                        <div class="next-step-cards">
                            <div class="next-step-card">
                                <span class="step-icon">💧</span>
                                <div class="step-content">
                                    <h4>Make Your First Decision</h4>
                                    <p>Start with irrigation management using real NASA SMAP data</p>
                                </div>
                            </div>
                            <div class="next-step-card">
                                <span class="step-icon">📅</span>
                                <div class="step-content">
                                    <h4>Explore Seasonal Progress</h4>
                                    <p>Check your seasonal activities and current farm status</p>
                                </div>
                            </div>
                            <div class="next-step-card">
                                <span class="step-icon">🏆</span>
                                <div class="step-content">
                                    <h4>Track Achievements</h4>
                                    <p>Monitor your progress and unlock new farming milestones</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="tutorial-resources">
                        <h3>📚 Additional Resources</h3>
                        <p>Need help? Access the tutorial anytime by clicking the help button in the game menu.</p>
                    </div>
                </div>

                <div class="completion-actions">
                    <button class="game-btn primary" onclick="farmGameUI.closeModal()">
                        Start Farming! 🚜
                    </button>
                    <button class="game-btn secondary" onclick="farmGameUI.showGameTutorial()">
                        Review Tutorial 📖
                    </button>
                </div>
            </div>
        `);
    }

    // Quick help system for returning players
    showQuickHelp() {
        this.showModal(`
            <div class="quick-help-dialog">
                <div class="help-header">
                    <h2>🆘 Quick Help Guide</h2>
                    <button class="close-btn" onclick="farmGameUI.closeModal()">×</button>
                </div>

                <div class="help-content">
                    <div class="help-section">
                        <h3>🛰️ NASA Data Sources</h3>
                        <ul>
                            <li><strong>SMAP:</strong> Soil moisture for irrigation decisions</li>
                            <li><strong>Landsat:</strong> Soil temperature for fertilizer timing</li>
                            <li><strong>MODIS:</strong> Vegetation health for harvest planning</li>
                        </ul>
                    </div>

                    <div class="help-section">
                        <h3>🎯 Decision Making</h3>
                        <ul>
                            <li>Higher NASA alignment = better scores</li>
                            <li>Consider seasonal context and weather</li>
                            <li>Monitor resource levels before decisions</li>
                        </ul>
                    </div>

                    <div class="help-section">
                        <h3>📅 Seasonal Focus</h3>
                        <ul>
                            <li><strong>Spring:</strong> Planting and equipment prep</li>
                            <li><strong>Summer:</strong> Growth monitoring and pest control</li>
                            <li><strong>Fall:</strong> Harvest timing and winter prep</li>
                            <li><strong>Winter:</strong> Planning and livestock care</li>
                        </ul>
                    </div>
                </div>

                <div class="help-actions">
                    <button class="game-btn primary" onclick="farmGameUI.closeModal()">
                        Got It! 👍
                    </button>
                    <button class="game-btn secondary" onclick="farmGameUI.showGameTutorial()">
                        Full Tutorial 📖
                    </button>
                </div>
            </div>
        `);
    }

    // Available Actions functions
    // Helper method to get crop emoji
    getCropEmoji(cropType) {
        const emojiMap = {
            'wheat': '🌾',
            'corn': '🌽',
            'tomatoes': '🍅',
            'carrots': '🥕',
            'rice': '🌾',
            'potatoes': '🥔',
            'rye': '🌾',
            'barley': '🌾',
            'oats': '🌾',
            'soybean': '🫘',
            'soybeans': '🫘',
            'sugarcane': '🎋',
            'banana': '🍌',
            'coffee': '☕',
            'sorghum': '🌾',
            'millet': '🌾',
            'dates': '🌴',
            'cactus': '🌵',
            'tea': '🍵',
            'cocoa': '🍫',
            'potato': '🥔',
            'vegetables': '🥬',
            'fruits': '🍎'
        };
        return emojiMap[cropType] || '🌱';
    }

    getCropEmojis() {
        return {
            'wheat': '🌾',
            'corn': '🌽',
            'tomatoes': '🍅',
            'carrots': '🥕',
            'rice': '🌾',
            'potatoes': '🥔',
            'rye': '🌾',
            'barley': '🌾',
            'oats': '🌾',
            'soybean': '🫘',
            'soybeans': '🫘',
            'sugarcane': '🎋',
            'banana': '🍌',
            'coffee': '☕',
            'sorghum': '🌾',
            'millet': '🌾',
            'dates': '🌴',
            'cactus': '🌵',
            'tea': '🍵',
            'cocoa': '🍫',
            'potato': '🥔',
            'vegetables': '🥬',
            'fruits': '🍎'
        };
    }

    getCropNames() {
        return {
            'wheat': 'Wheat',
            'corn': 'Corn',
            'tomatoes': 'Tomatoes',
            'carrots': 'Carrots',
            'rice': 'Rice',
            'potatoes': 'Potatoes',
            'rye': 'Rye',
            'barley': 'Barley',
            'oats': 'Oats',
            'soybean': 'Soybean',
            'soybeans': 'Soybeans',
            'sugarcane': 'Sugarcane',
            'banana': 'Banana',
            'coffee': 'Coffee',
            'sorghum': 'Sorghum',
            'millet': 'Millet',
            'dates': 'Dates',
            'cactus': 'Cactus',
            'tea': 'Tea',
            'cocoa': 'Cocoa',
            'potato': 'Potato',
            'vegetables': 'Vegetables',
            'fruits': 'Fruits'
        };
    }

    // Irrigate a single crop
    irrigateSingleCrop(cropIndex) {
        const farmState = this.farmSimulation.getFarmState();
        const crop = farmState.crops[cropIndex];

        if (!crop) {
            this.showNotification('❌ Crop not found!', 'error');
            return;
        }

        // Apply water to specific crop
        const result = this.farmSimulation.irrigateCrops(cropIndex, 'medium');

        if (result.success) {
            // Track irrigation achievement
            console.log('🔍 [waterCrop] Checking achievement system:', {
                hasAchievementSystem: !!this.achievementSystem,
                hasWindow: typeof window !== 'undefined',
                hasGlobalAchievementSystem: !!(window && window.achievementSystem)
            });

            // Try both local and global achievement system
            const achievementSys = this.achievementSystem || (window && window.achievementSystem);

            if (achievementSys) {
                const farmState = this.farmSimulation.getFarmState();
                const soilMoisture = farmState.environmentalData?.soilMoisture || 0.5;
                const precipitation = farmState.environmentalData?.precipitation || 0.3;

                console.log('💧 [waterCrop] Tracking irrigation for', crop.type);

                // Use direct trackAction which we know works
                achievementSys.trackAction('irrigation_decision', 1);

                console.log('💧 [waterCrop] Called trackAction for irrigation_decision');

                // Check current progress
                const waterWizard = achievementSys.achievements['water_wizard'];
                if (waterWizard) {
                    console.log('💧 [waterCrop] Water Wizard progress:', {
                        currentLevel: waterWizard.currentLevel,
                        progress: waterWizard.progress,
                        nextRequirement: waterWizard.levels[waterWizard.currentLevel]?.requirement
                    });
                }

                // Force update achievements view if on that tab
                if (this.currentView === 'achievements') {
                    const farmState = this.farmSimulation.getFarmState();
                    this.updateAchievementsView(farmState);
                }
            } else {
                console.warn('⚠️ [waterCrop] Achievement system not available');
            }

            this.showNotification(`💧 Watered ${crop.type} successfully!`, 'success');
            this.updateDisplay();
            this.updateCropDisplay();
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    // Fertilize a single crop
    fertilizeSingleCrop(cropIndex) {
        const farmState = this.farmSimulation.getFarmState();
        const crop = farmState.crops[cropIndex];

        if (!crop) {
            this.showNotification('❌ Crop not found!', 'error');
            return;
        }

        // Show fertilizer options for this specific crop
        this.showSingleCropFertilizerDialog(cropIndex);
    }

    // Show fertilizer dialog for single crop
    showSingleCropFertilizerDialog(cropIndex) {
        const farmState = this.farmSimulation.getFarmState();
        const crop = farmState.crops[cropIndex];

        const content = `
            <div class="modal-header">
                <h3>🌿 Fertilize ${crop.type}</h3>
            </div>

            <div class="crop-fertilizer-options">
                <div class="crop-current-status">
                    <h4>Current Crop Status:</h4>
                    <p>🌱 Type: ${crop.type}</p>
                    <p>🌿 Nutrient Level: ${Math.round((crop.nutrient_level || 0) * 100)}%</p>
                    <p>❤️ Health: ${Math.round((crop.health || 0) * 100)}%</p>
                </div>

                <div class="fertilizer-choices">
                    <button class="fertilizer-btn" onclick="farmGameUI.applySingleCropFertilizer(${cropIndex}, 'balanced')">
                        ⚖️ Balanced Fertilizer
                        <span>Cost: $30 | +20% nutrients</span>
                    </button>
                    <button class="fertilizer-btn" onclick="farmGameUI.applySingleCropFertilizer(${cropIndex}, 'nitrogen')">
                        🌿 Nitrogen Boost
                        <span>Cost: $40 | +30% growth</span>
                    </button>
                    <button class="fertilizer-btn" onclick="farmGameUI.applySingleCropFertilizer(${cropIndex}, 'organic')">
                        🍃 Organic Compost
                        <span>Cost: $20 | +15% health</span>
                    </button>
                </div>
            </div>
        `;

        this.showModal(content);
    }

    // Apply fertilizer to single crop
    applySingleCropFertilizer(cropIndex, fertilizerType) {
        const result = this.farmSimulation.applyFertilizer(cropIndex, fertilizerType);

        if (result.success) {
            this.closeModal();
            const crop = this.farmSimulation.getFarmState().crops[cropIndex];
            this.showNotification(`🌿 Applied ${fertilizerType} fertilizer to ${crop.type}!`, 'success');
            this.updateDisplay();
            this.updateCropDisplay();
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    // Show detailed information about a single crop
    showCropDetails(cropIndex) {
        const farmState = this.farmSimulation.getFarmState();
        const crop = farmState.crops[cropIndex];

        if (!crop) {
            this.showNotification('❌ Crop not found!', 'error');
            return;
        }

        const content = `
            <div class="modal-header">
                <h3>${this.getCropEmoji(crop.type)} ${crop.type} Details</h3>
            </div>

            <div class="crop-details-panel">
                <div class="detail-section">
                    <h4>📊 Current Status</h4>
                    <ul>
                        <li>Growth Stage: ${crop.current_stage}</li>
                        <li>Growth Progress: ${Math.round((crop.growth_progress || 0) * 100)}%</li>
                        <li>Area: ${crop.area} hectares</li>
                        <li>Planted Week: ${crop.planted_week}</li>
                        <li>Age: ${farmState.currentWeek - crop.planted_week} weeks</li>
                    </ul>
                </div>

                <div class="detail-section">
                    <h4>🌱 Vital Signs</h4>
                    <ul>
                        <li>💧 Water Level: ${Math.round((crop.water_level || 0) * 100)}%</li>
                        <li>🌿 Nutrient Level: ${Math.round((crop.nutrient_level || 0) * 100)}%</li>
                        <li>❤️ Health: ${Math.round((crop.health || 0) * 100)}%</li>
                        <li>🌾 Expected Yield: ${Math.round(crop.area * 2.5 * crop.health)} units</li>
                    </ul>
                </div>

                <div class="detail-section">
                    <h4>📈 Recommendations</h4>
                    <ul>
                        ${crop.water_level < 0.3 ? '<li>⚠️ Low water - irrigate soon!</li>' : ''}
                        ${crop.nutrient_level < 0.4 ? '<li>⚠️ Low nutrients - apply fertilizer!</li>' : ''}
                        ${crop.health < 0.5 ? '<li>⚠️ Poor health - needs attention!</li>' : ''}
                        ${crop.growth_progress > 0.9 ? '<li>✅ Ready for harvest soon!</li>' : ''}
                    </ul>
                </div>
            </div>
        `;

        this.showModal(content);
    }

    // Irrigate all crops at once
    irrigateAllCrops() {
        const result = this.farmSimulation.irrigateCrops(null, 'medium');

        if (result.success) {
            // Track irrigation achievement
            console.log('🔍 Checking achievement system:', {
                hasAchievementSystem: !!this.achievementSystem,
                hasWindow: typeof window !== 'undefined',
                hasGlobalAchievementSystem: !!(window && window.achievementSystem)
            });

            // Try both local and global achievement system
            const achievementSys = this.achievementSystem || (window && window.achievementSystem);

            if (achievementSys) {
                const farmState = this.farmSimulation.getFarmState();
                const soilMoisture = farmState.environmentalData?.soilMoisture || 0.5;
                const precipitation = farmState.environmentalData?.precipitation || 0.3;

                console.log('💧 Calling trackIrrigationDecision with:', {
                    soilMoisture,
                    precipitation,
                    decision: 'water'
                });

                achievementSys.trackIrrigationDecision(
                    soilMoisture,
                    precipitation,
                    'water'
                );

                // Also try direct trackAction call
                achievementSys.trackAction('irrigation_decision', 1);

                console.log('💧 Tracked irrigation decision for Water Wizard achievement');

                // Check current progress
                const waterWizard = achievementSys.achievements['water_wizard'];
                if (waterWizard) {
                    console.log('💧 Water Wizard progress:', {
                        currentLevel: waterWizard.currentLevel,
                        progress: waterWizard.progress,
                        nextRequirement: waterWizard.levels[waterWizard.currentLevel]?.requirement
                    });
                }

                // Force update achievements view if on that tab
                if (this.currentView === 'achievements') {
                    const farmState = this.farmSimulation.getFarmState();
                    this.updateAchievementsView(farmState);
                }
            } else {
                console.warn('⚠️ Achievement system not available for tracking irrigation');
            }

            this.showNotification('💧 Watered all crops successfully!', 'success');
            this.updateDisplay();
            this.updateCropDisplay();
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    // Show fertilizer dialog for all crops
    fertilizeAllCrops() {
        this.showFertilizerDialog();
    }

    // === LIVESTOCK ACTIONS ===

    // Feed all livestock
    feedLivestock() {
        console.log('🥛 Feed Livestock action started');
        const farmState = this.farmSimulation.getFarmState();
        const livestock = farmState.livestock || {};

        console.log('📊 Current livestock state before feeding:', JSON.stringify(livestock, null, 2));

        const livestockCount = Object.values(livestock).reduce((sum, data) => sum + data.count, 0);

        if (livestockCount === 0) {
            this.showNotification('No livestock to feed!', 'warning');
            return;
        }

        const feedCost = livestockCount * 5; // $5 per animal
        if (farmState.resources.money < feedCost) {
            this.showNotification(`Not enough money! Need $${feedCost} to feed all animals.`, 'error');
            return;
        }

        // Update livestock feed levels and deduct cost
        Object.entries(livestock).forEach(([type, data]) => {
            const oldFeedLevel = data.feed_level;
            data.feed_level = Math.min(data.feed_level + 0.5, 1.0); // Increased from 0.4 to 0.5
            console.log(`🥛 ${type}: feed_level ${oldFeedLevel.toFixed(2)} → ${data.feed_level.toFixed(2)}`);
        });

        farmState.resources.money -= feedCost;
        farmState.playerStats.livestockScore += 10;

        console.log('📊 Current livestock state after feeding:', JSON.stringify(livestock, null, 2));

        this.showNotification(`Fed all livestock for $${feedCost}. Feed levels increased!`, 'success');
        this.updateDisplay();
        this.updateCurrentView(); // Update the current view to reflect changes

        console.log('🔄 Feed Livestock action completed, UI updated');
    }

    // Veterinary health check for all livestock
    veterinaryCheck() {
        const farmState = this.farmSimulation.getFarmState();
        const livestock = farmState.livestock || {};
        const livestockCount = Object.values(livestock).reduce((sum, data) => sum + data.count, 0);

        if (livestockCount === 0) {
            this.showNotification('No livestock for health check!', 'warning');
            return;
        }

        const vetCost = livestockCount * 10; // $10 per animal
        if (farmState.resources.money < vetCost) {
            this.showNotification(`Not enough money! Need $${vetCost} for veterinary service.`, 'error');
            return;
        }

        // Improve livestock health and deduct cost
        Object.values(livestock).forEach(data => {
            data.health = Math.min(data.health + 0.2, 1.0);
        });

        farmState.resources.money -= vetCost;
        farmState.playerStats.livestockScore += 20;

        this.showNotification(`Veterinary check completed for $${vetCost}. Animal health improved!`, 'success');
        this.updateDisplay();
        this.updateCurrentView(); // Update the current view to reflect changes
    }

    // Breed animals (increase count)
    breedLivestock() {
        const farmState = this.farmSimulation.getFarmState();
        const livestock = farmState.livestock || {};
        const livestockEntries = Object.entries(livestock);

        if (livestockEntries.length === 0) {
            this.showNotification('No livestock for breeding!', 'warning');
            return;
        }

        const breedingCost = 100; // Fixed cost for breeding program
        if (farmState.resources.money < breedingCost) {
            this.showNotification(`Not enough money! Need $${breedingCost} for breeding program.`, 'error');
            return;
        }

        // Only breed healthy animals (health > 0.7)
        const healthyAnimals = livestockEntries.filter(([type, data]) => data.health > 0.7);

        if (healthyAnimals.length === 0) {
            this.showNotification('No healthy animals for breeding! Improve animal health first.', 'warning');
            return;
        }

        // Increase count for healthy animals
        healthyAnimals.forEach(([type, data]) => {
            const increase = Math.max(1, Math.floor(data.count * 0.1)); // 10% increase, minimum 1
            data.count += increase;
        });

        farmState.resources.money -= breedingCost;
        farmState.playerStats.livestockScore += 50;

        this.showNotification(`Breeding successful for $${breedingCost}. Livestock count increased!`, 'success');
        this.updateDisplay();
        this.updateCurrentView(); // Update the current view to reflect changes
    }

    /**
     * Sell livestock modal and functionality
     */
    sellLivestock() {
        console.log('💰 Opening sell livestock modal');
        const farmState = this.farmSimulation.getFarmState();

        const fullContent = `
            <div class="modal-header">
                <h3>💰 Sell Livestock</h3>
            </div>
            ${this.renderSellLivestockModal(farmState)}
            <div class="modal-footer">
                <button class="secondary-btn" onclick="farmGameUI.closeModal()">❌ Close</button>
            </div>
        `;
        this.showModal(fullContent);
    }

    /**
     * Render the sell livestock modal content
     */
    renderSellLivestockModal(farmState) {
        const livestock = farmState.livestock || {};
        const availableLivestock = Object.entries(livestock).filter(([type, data]) => data.count > 0);

        if (availableLivestock.length === 0) {
            return `
                <div class="sell-livestock-modal">
                    <div class="empty-livestock">
                        <h4>🏃 No Livestock Available</h4>
                        <p>You don't have any livestock to sell yet.</p>
                        <p>Purchase some livestock first, then come back to sell them!</p>
                    </div>
                </div>
            `;
        }

        // Livestock pricing based on type and health
        const livestockPrices = {
            cattle: 400, // Base price for cattle
            sheep: 150,  // Base price for sheep
            chickens: 20 // Base price per chicken
        };

        return `
            <div class="sell-livestock-modal">
                <div class="current-livestock">
                    <h4>🐄 Current Livestock</h4>
                </div>

                <div class="livestock-market">
                    ${availableLivestock.map(([type, data]) => {
                        const basePrice = livestockPrices[type] || 50;

                        // Safely handle health and feed_level values
                        const health = data.health || 0;
                        const feedLevel = data.feed_level || 0;

                        // Convert to percentage if needed (handle both 0-1 and 0-100 ranges)
                        const healthPercent = health <= 1 ? Math.round(health * 100) : Math.round(health);
                        const feedPercent = feedLevel <= 1 ? Math.round(feedLevel * 100) : Math.round(feedLevel);

                        const healthMultiplier = Math.max(0.5, healthPercent / 100); // Health affects price
                        const finalPrice = Math.floor(basePrice * healthMultiplier);

                        return `
                            <div class="livestock-sell-item">
                                <div class="livestock-info">
                                    <h5>${type.charAt(0).toUpperCase() + type.slice(1)} (${data.count || 0} available)</h5>
                                    <p>Health: ${healthPercent}% | Feed Level: ${feedPercent}%</p>
                                    <div class="livestock-price">$${finalPrice} per ${type === 'chickens' ? 'bird' : 'head'}</div>
                                    <small>Health affects selling price</small>
                                </div>
                                <div class="livestock-sell-controls">
                                    <div class="quantity-controls">
                                        <button class="qty-btn" onclick="farmGameUI.changeLivestockQuantity('${type}', -1)">-</button>
                                        <input type="number" id="sell-qty-${type}" value="1" min="1" max="${data.count}" class="qty-input">
                                        <button class="qty-btn" onclick="farmGameUI.changeLivestockQuantity('${type}', 1)">+</button>
                                    </div>
                                    <button class="sell-btn" onclick="farmGameUI.executeLivestockSale('${type}', ${finalPrice})">
                                        Sell
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="sell-tips">
                    <h5>💡 Selling Tips:</h5>
                    <ul>
                        <li>🏥 Healthier animals sell for better prices</li>
                        <li>🌾 Keep some livestock for breeding and production</li>
                        <li>📈 Market prices are based on animal health and condition</li>
                        <li>⚠️ Sold animals cannot be recovered</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Change quantity controls for livestock selling
     */
    changeLivestockQuantity(livestockType, change) {
        const qtyInput = document.getElementById(`sell-qty-${livestockType}`);
        if (qtyInput) {
            const currentValue = parseInt(qtyInput.value);
            const maxValue = parseInt(qtyInput.max);
            const newValue = Math.max(1, Math.min(maxValue, currentValue + change));
            qtyInput.value = newValue;
        }
    }

    /**
     * Execute the livestock sale
     */
    executeLivestockSale(livestockType, unitPrice) {
        const qtyInput = document.getElementById(`sell-qty-${livestockType}`);
        const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
        const totalRevenue = unitPrice * quantity;

        const farmState = this.farmSimulation.getFarmState();
        const livestock = farmState.livestock || {};

        // Validate sale
        if (!livestock[livestockType] || livestock[livestockType].count < quantity) {
            this.showNotification('Not enough livestock to sell!', 'error');
            return;
        }

        // Execute sale
        livestock[livestockType].count -= quantity;
        farmState.resources.money += totalRevenue;

        // Add some livestock score (but less than breeding)
        this.farmSimulation.addLivestockScore(quantity * 3); // 3 points per sold animal

        // Show success notification
        const displayName = livestockType.charAt(0).toUpperCase() + livestockType.slice(1);
        this.showNotification(
            `✅ Sold ${quantity} ${displayName} for $${totalRevenue}! Money earned.`,
            'success'
        );

        // Refresh the modal with updated data
        const updatedFarmState = this.farmSimulation.getFarmState();
        const fullContent = `
            <div class="modal-header">
                <h3>💰 Sell Livestock</h3>
            </div>
            ${this.renderSellLivestockModal(updatedFarmState)}
            <div class="modal-footer">
                <button class="secondary-btn" onclick="farmGameUI.closeModal()">❌ Close</button>
            </div>
        `;
        this.showModal(fullContent);

        // Update UI displays
        this.updateCurrentView();
    }

    /**
     * Feed animals - wrapper for feedLivestock() method
     */
    feedAnimals() {
        console.log('🥛 Feed Animals clicked - calling feedLivestock()');
        console.log('📊 farmGameUI instance exists:', !!window.farmGameUI);
        console.log('📊 feedLivestock method exists:', typeof this.feedLivestock === 'function');
        console.log('📊 this context:', this.constructor.name);

        try {
            console.log('🔄 About to call this.feedLivestock()...');
            this.feedLivestock();
            console.log('✅ feedLivestock() call completed');
        } catch (error) {
            console.error('❌ Error calling feedLivestock():', error);
            console.error('Error stack:', error.stack);
        }
    }

    /**
     * Show veterinary dialog - wrapper for veterinaryCheck() method
     */
    showVeterinaryDialog() {
        console.log('🏥 Veterinary Dialog clicked - calling veterinaryCheck()');
        this.veterinaryCheck();
    }

    /**
     * Show breeding dialog - wrapper for breedLivestock() method
     */
    showBreedingDialog() {
        console.log('🐣 Breeding Dialog clicked - calling breedLivestock()');
        this.breedLivestock();
    }

    /**
     * Get available crops for planting based on satellite data or default
     */
    getAvailableCropsForPlanting(farmState) {
        // Use satellite-based crops if available, otherwise use default crops
        if (farmState.availableCrops && farmState.availableCrops.length > 0) {
            return farmState.availableCrops.map(crop => ({
                ...crop,
                cost: crop.cost || this.getCropCost(crop.type),
                area: crop.area || 20,
                weeks: crop.weeks || this.getCropWeeks(crop.type)
            }));
        }

        return this.getDefaultCrops();
    }

    /**
     * Get default cost for crop type
     */
    getCropCost(cropType) {
        const costs = {
            wheat: 50, corn: 75, tomatoes: 100, carrots: 40,
            rice: 80, sugarcane: 120, banana: 200, coffee: 150,
            soybean: 60, potato: 45, sorghum: 35, millet: 30,
            dates: 300, cactus: 20, tea: 180, cocoa: 250,
            barley: 40, oats: 45, rye: 35, vegetables: 90, fruits: 180
        };
        return costs[cropType] || 50;
    }

    /**
     * Get default growth weeks for crop type
     */
    getCropWeeks(cropType) {
        const weeks = {
            wheat: 16, corn: 18, tomatoes: 12, carrots: 8,
            rice: 20, sugarcane: 52, banana: 40, coffee: 26,
            soybean: 18, potato: 14, sorghum: 16, millet: 14,
            dates: 104, cactus: 8, tea: 156, cocoa: 104,
            barley: 14, oats: 16, rye: 14, vegetables: 10, fruits: 30
        };
        return weeks[cropType] || 16;
    }

    /**
     * Get default crops when satellite data is not available
     */
    getDefaultCrops() {
        return [
            { type: 'wheat', name: 'Wheat', emoji: '🌾', cost: 50, area: 20, weeks: 16, waterNeed: 'medium' },
            { type: 'corn', name: 'Corn', emoji: '🌽', cost: 75, area: 30, weeks: 18, waterNeed: 'medium' },
            { type: 'tomatoes', name: 'Tomatoes', emoji: '🍅', cost: 100, area: 15, weeks: 12, waterNeed: 'high' },
            { type: 'carrots', name: 'Carrots', emoji: '🥕', cost: 40, area: 25, weeks: 8, waterNeed: 'low' }
        ];
    }

    /**
     * Get comprehensive crop data for all possible crop types
     */
    getComprehensiveCropData() {
        return {
            // Default crops
            wheat: { emoji: '🌾', cost: 50, defaultArea: 20, seasons: ['Spring', 'Fall'], growthWeeks: 16 },
            corn: { emoji: '🌽', cost: 75, defaultArea: 30, seasons: ['Summer'], growthWeeks: 18 },
            tomatoes: { emoji: '🍅', cost: 100, defaultArea: 15, seasons: ['Spring', 'Summer'], growthWeeks: 12 },
            carrots: { emoji: '🥕', cost: 40, defaultArea: 25, seasons: ['Spring', 'Fall'], growthWeeks: 8 },

            // Tropical crops
            rice: { emoji: '🌾', cost: 80, defaultArea: 25, seasons: ['Summer'], growthWeeks: 20 },
            sugarcane: { emoji: '🎋', cost: 120, defaultArea: 20, seasons: ['Summer'], growthWeeks: 52 },
            banana: { emoji: '🍌', cost: 200, defaultArea: 15, seasons: ['All'], growthWeeks: 40 },
            coffee: { emoji: '☕', cost: 150, defaultArea: 18, seasons: ['Spring', 'Summer'], growthWeeks: 26 },

            // Temperate crops
            soybean: { emoji: '🫘', cost: 60, defaultArea: 25, seasons: ['Spring', 'Summer'], growthWeeks: 18 },
            potato: { emoji: '🥔', cost: 45, defaultArea: 22, seasons: ['Spring', 'Fall'], growthWeeks: 14 },

            // Arid/Desert crops
            sorghum: { emoji: '🌾', cost: 35, defaultArea: 30, seasons: ['Summer'], growthWeeks: 16 },
            millet: { emoji: '🌾', cost: 30, defaultArea: 28, seasons: ['Summer'], growthWeeks: 14 },
            dates: { emoji: '🌴', cost: 300, defaultArea: 10, seasons: ['All'], growthWeeks: 104 },
            cactus: { emoji: '🌵', cost: 20, defaultArea: 15, seasons: ['All'], growthWeeks: 8 },

            // High precipitation crops
            tea: { emoji: '🍵', cost: 180, defaultArea: 12, seasons: ['Spring', 'Summer'], growthWeeks: 156 },
            cocoa: { emoji: '🍫', cost: 250, defaultArea: 10, seasons: ['Summer'], growthWeeks: 104 },

            // Cold climate crops
            barley: { emoji: '🌾', cost: 40, defaultArea: 24, seasons: ['Spring', 'Fall'], growthWeeks: 14 },
            oats: { emoji: '🌾', cost: 45, defaultArea: 22, seasons: ['Spring', 'Fall'], growthWeeks: 16 },
            rye: { emoji: '🌾', cost: 35, defaultArea: 26, seasons: ['Fall', 'Winter'], growthWeeks: 14 },

            // Specialty crops
            vegetables: { emoji: '🥬', cost: 90, defaultArea: 18, seasons: ['Spring', 'Summer', 'Fall'], growthWeeks: 10 },
            fruits: { emoji: '🍎', cost: 180, defaultArea: 12, seasons: ['Spring', 'Summer'], growthWeeks: 30 }
        };
    }

    plantNewCrop() {
        const farmState = this.farmSimulation.getFarmState();

        const content = `
            <div class="modal-header">
                <h3>🌱 Plant New Crop</h3>
                ${this.satelliteDataLoaded ? `
                <div class="satellite-badge">
                    📡 Using satellite data for ${this.currentLocation ? `${this.currentLocation.lat.toFixed(2)}°, ${this.currentLocation.lon.toFixed(2)}°` : 'your location'}
                </div>` : ''}
            </div>

            <div class="plant-crop-options">
                <div class="land-status">
                    <h4>🏞️ Farm Land Status</h4>
                    <div class="land-metrics">
                        <div class="land-metric">
                            <span>🏡 Total Farm Size:</span>
                            <span>${farmState.farmSize} hectares</span>
                        </div>
                        <div class="land-metric">
                            <span>✅ Available Land:</span>
                            <span class="${farmState.availableLand < 20 ? 'warning' : 'good'}">${farmState.availableLand} hectares</span>
                        </div>
                        <div class="land-metric">
                            <span>💰 Current Money:</span>
                            <span>$${farmState.resources.money.toFixed(0)}</span>
                        </div>
                        ${((farmState.deadLandPlots && farmState.deadLandPlots.length > 0) || (farmState.harvestedLandPlots && farmState.harvestedLandPlots.length > 0)) ? `
                        <div class="land-metric recovering">
                            <span>⏳ Recovering Land:</span>
                            <span>${
                                (farmState.deadLandPlots ? farmState.deadLandPlots.reduce((sum, plot) => sum + plot.area, 0) : 0) +
                                (farmState.harvestedLandPlots ? farmState.harvestedLandPlots.reduce((sum, plot) => sum + plot.area, 0) : 0)
                            } hectares</span>
                        </div>
                        ${farmState.deadLandPlots && farmState.deadLandPlots.length > 0 ? `
                        <div class="land-metric dead-recovery">
                            <span>💀 Dead Land (20min):</span>
                            <span>${farmState.deadLandPlots.reduce((sum, plot) => sum + plot.area, 0)} hectares</span>
                        </div>
                        ` : ''}
                        ${farmState.harvestedLandPlots && farmState.harvestedLandPlots.length > 0 ? `
                        <div class="land-metric harvest-recovery">
                            <span>🌾 Harvested (10min):</span>
                            <span>${farmState.harvestedLandPlots.reduce((sum, plot) => sum + plot.area, 0)} hectares</span>
                        </div>
                        ` : ''}
                        ` : ''}
                    </div>
                </div>

                <p>Choose a crop to plant ${this.satelliteDataLoaded ? 'based on satellite data for your region:' : `based on current season (${farmState.currentSeason}) and available land:`}</p>

                <div class="crop-option-grid">
                    ${this.getAvailableCropsForPlanting(farmState).map(crop => `
                        <div class="crop-option" onclick="farmGameUI.showCropAreaDialog('${crop.type}')">
                            <div class="crop-icon">${crop.emoji || '🌱'}</div>
                            <h4>${crop.name}</h4>
                            <p>Cost: $${crop.cost || 50}/${crop.area || 20}ha | Water: ${crop.waterNeed || 'Medium'} | Growth: ${crop.weeks || 8} weeks</p>
                            ${crop.tempRange ? `<p>🌡️ Optimal: ${crop.tempRange[0]}-${crop.tempRange[1]}°C</p>` : ''}
                            <div class="suitability ${this.satelliteDataLoaded ? 'satellite' : 'good'}">
                                ${this.satelliteDataLoaded ? '📡 Satellite-optimized' : '✅ Season-appropriate'}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="resource-info">
                    <h4>Current Resources:</h4>
                    <p>💰 Money: $${farmState.resources.money}</p>
                    <p>💧 Water: ${farmState.resources.water} units</p>
                </div>
            </div>
        `;

        this.showModal(content);
    }

    selectCropToPlant(cropType) {
        // Use the farm simulation engine's plantCrop method
        const result = this.farmSimulation.plantCrop(cropType);

        if (result.success) {
            this.closeModal();
            // No need to show notification here, the event listener will handle it

            // Update UI displays with fresh farm state
            const updatedFarmState = this.farmSimulation.getFarmState();
            this.updateResourcesDisplay(updatedFarmState);
            this.updateCropDisplay();
            this.updateDisplay();
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    showCropAnalysis() {
        const farmState = this.farmSimulation.getFarmState();

        const content = `
            <div class="modal-header">
                <h3>📊 Crop Analysis</h3>
            </div>

            <div class="crop-analysis">
                <div class="analysis-summary">
                    <h4>Farm Overview</h4>
                    <p><strong>Total Crops:</strong> ${farmState.crops.length}</p>
                    <p><strong>Current Season:</strong> ${farmState.currentSeason} - Week ${farmState.currentWeek}</p>
                    <p><strong>Average Health:</strong> ${farmState.crops.length > 0 ? (farmState.crops.reduce((sum, crop) => sum + crop.health, 0) / farmState.crops.length * 100).toFixed(0) : 0}%</p>
                </div>

                <div class="crop-details">
                    <h4>Individual Crop Status</h4>
                    ${farmState.crops.length > 0 ?
                        farmState.crops.map((crop, index) => `
                            <div class="crop-detail-card">
                                <div class="crop-info">
                                    <strong>${crop.type.charAt(0).toUpperCase() + crop.type.slice(1)}</strong>
                                    <span class="growth-stage">(${crop.growth_stage})</span>
                                </div>
                                <div class="crop-metrics">
                                    <div class="metric">
                                        <span class="metric-label">Health:</span>
                                        <span class="metric-value ${crop.health > 0.7 ? 'good' : crop.health > 0.4 ? 'warning' : 'critical'}">
                                            ${(crop.health * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div class="metric">
                                        <span class="metric-label">Water:</span>
                                        <span class="metric-value ${crop.water_level > 0.6 ? 'good' : crop.water_level > 0.3 ? 'warning' : 'critical'}">
                                            ${(crop.water_level * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div class="metric">
                                        <span class="metric-label">Age:</span>
                                        <span class="metric-value">${farmState.currentWeek - crop.planted_week} weeks</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')
                        : '<p>No crops currently planted. Use "🌱 Plant New Crop" to get started!</p>'
                    }
                </div>

                <div class="recommendations">
                    <h4>🛰️ NASA Recommendations</h4>
                    ${this.generateCropRecommendations(farmState)}
                </div>

                <div class="decision-history">
                    <h4>📋 Decision History & NASA Alignment</h4>
                    ${this.generateDecisionHistory(farmState)}
                </div>
            </div>
        `;

        this.showModal(content);
    }

    generateCropRecommendations(farmState) {
        const recommendations = [];

        if (farmState.crops.length === 0) {
            recommendations.push("Start by planting crops suitable for the current season.");
        }

        const lowWaterCrops = farmState.crops.filter(crop => crop.water_level < 0.4);
        if (lowWaterCrops.length > 0) {
            recommendations.push(`${lowWaterCrops.length} crop(s) need immediate irrigation.`);
        }

        const unhealthyCrops = farmState.crops.filter(crop => crop.health < 0.5);
        if (unhealthyCrops.length > 0) {
            recommendations.push(`${unhealthyCrops.length} crop(s) have poor health - consider fertilizing.`);
        }

        if (farmState.currentSeason === 'Winter' && farmState.crops.length > 0) {
            recommendations.push("Winter season: Monitor crops carefully for cold damage.");
        }

        if (recommendations.length === 0) {
            recommendations.push("Your crops are in good condition! Keep monitoring NASA data for optimal care.");
        }

        return recommendations.map(rec => `<p>• ${rec}</p>`).join('');
    }

    generateDecisionHistory(farmState) {
        const decisions = farmState.decisions || [];

        if (decisions.length === 0) {
            return '<p class="no-decisions">No decisions recorded yet. Start making farming decisions to see your NASA alignment history!</p>';
        }

        // Sort decisions by timestamp (most recent first)
        const recentDecisions = decisions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10); // Show last 10 decisions

        // Calculate overall NASA alignment
        const totalDecisions = decisions.length;
        const totalScore = decisions.reduce((sum, decision) => sum + (decision.score || 0), 0);
        const avgAlignment = totalDecisions > 0 ? (totalScore / totalDecisions).toFixed(1) : 0;

        // Categorize alignment level
        let alignmentLevel = 'Poor';
        let alignmentColor = '#ff6b6b';
        if (avgAlignment >= 80) {
            alignmentLevel = 'Excellent';
            alignmentColor = '#28a745';
        } else if (avgAlignment >= 60) {
            alignmentLevel = 'Good';
            alignmentColor = '#28a745';
        } else if (avgAlignment >= 40) {
            alignmentLevel = 'Fair';
            alignmentColor = '#ffa726';
        }

        // Generate decision type summary
        const decisionTypes = {};
        decisions.forEach(decision => {
            decisionTypes[decision.type] = (decisionTypes[decision.type] || 0) + 1;
        });

        let content = `
            <div class="alignment-summary">
                <div class="alignment-score">
                    <span class="score-label">Overall NASA Alignment:</span>
                    <span class="score-value" style="color: ${alignmentColor}; font-weight: bold; font-size: 1.2em;">
                        ${avgAlignment}/100 (${alignmentLevel})
                    </span>
                </div>
                <div class="decision-stats">
                    <span>Total Decisions: ${totalDecisions}</span>
                    <span>Recent Period: Last ${Math.min(10, totalDecisions)} decisions</span>
                </div>
            </div>

            <div class="decision-type-summary">
                <h5>📊 Decision Breakdown</h5>
                <div class="decision-types">
                    ${Object.entries(decisionTypes).map(([type, count]) => {
                        const typeEmoji = {
                            'irrigation': '💧',
                            'fertilize': '🌿',
                            'plant_crop': '🌱',
                            'harvest': '🌾',
                            'sell_produce': '💰'
                        }[type] || '🔧';
                        return `<span class="decision-type-badge">${typeEmoji} ${type}: ${count}</span>`;
                    }).join('')}
                </div>
            </div>

            <div class="recent-decisions">
                <h5>🕐 Recent Decisions</h5>
                <div class="decisions-list">
                    ${recentDecisions.map(decision => {
                        const timeAgo = this.getTimeAgo(decision.timestamp);
                        const score = decision.score || 0;
                        const scoreColor = score >= 80 ? '#28a745' : score >= 60 ? '#28a745' : score >= 40 ? '#ffa726' : '#ff6b6b';
                        const actionEmoji = {
                            'irrigation': '💧',
                            'fertilize': '🌿',
                            'plant_crop': '🌱',
                            'harvest': '🌾',
                            'sell_produce': '💰'
                        }[decision.type] || '🔧';

                        return `
                            <div class="decision-entry">
                                <div class="decision-header">
                                    <span class="decision-action">${actionEmoji} ${decision.type.replace('_', ' ').toUpperCase()}</span>
                                    <span class="decision-time">${timeAgo}</span>
                                </div>
                                <div class="decision-details">
                                    ${decision.cropType ? `<span class="crop-type">Crop: ${decision.cropType}</span>` : ''}
                                    ${decision.amount ? `<span class="decision-amount">Amount: ${decision.amount}</span>` : ''}
                                    ${decision.cost ? `<span class="decision-cost">Cost: $${decision.cost.toFixed(0)}</span>` : ''}
                                    ${decision.revenue ? `<span class="decision-revenue">Revenue: $${decision.revenue.toFixed(0)}</span>` : ''}
                                </div>
                                <div class="decision-score">
                                    <span class="score-label">NASA Alignment:</span>
                                    <span class="score-badge" style="background-color: ${scoreColor}; color: white;">
                                        ${score.toFixed(0)}/100
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        return content;
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }



    /**
     * Get pixel hunt achievements from localStorage
     */
    getPixelHuntAchievements() {
        const pixelHuntData = JSON.parse(localStorage.getItem('pixelHuntAchievements') || '{}');
        console.log(`🎮 Getting pixel hunt achievements from localStorage:`, pixelHuntData);
        console.log(`🎮 Keys in pixelHuntData:`, Object.keys(pixelHuntData));
        const achievements = [];

        // Define achievement templates
        const achievementTemplates = {
            'pixelHunt_landsat': {
                name: 'Field Expert',
                description: 'Successfully identify crop fields in Landsat imagery',
                icon: '🌾'
            },
            'pixelHunt_modis': {
                name: 'Regional Analyst',
                description: 'Correctly identify agricultural regions in MODIS data',
                icon: '🗺️'
            },
            'pixelHunt_smap': {
                name: 'Moisture Detective',
                description: 'Identify dry regions using SMAP soil moisture data',
                icon: '🏜️'
            },
            'pixelHunt_master': {
                name: 'Resolution Master',
                description: 'Complete all three resolution training steps',
                icon: '🎯'
            }
        };

        // Convert localStorage data to achievement format
        Object.keys(achievementTemplates).forEach(key => {
            const template = achievementTemplates[key];
            const unlocked = pixelHuntData[key] !== undefined;

            achievements.push({
                name: template.name,
                description: template.description,
                icon: template.icon,
                progress: unlocked ? 100 : 0,
                unlocked: unlocked,
                category: 'pixel-hunt'
            });
        });

        console.log(`🎮 Returning pixel hunt achievements:`, achievements);
        return achievements;
    }

    /**
     * Refresh achievements display (called from main app clearAchievements)
     */
    refreshAchievements() {
        console.log('🎮 FarmGameUI.refreshAchievements called');
        const farmState = this.farmSimulation ? this.farmSimulation.getFarmState() : { playerStats: {} };
        this.updateAchievementsView(farmState);
    }

    /**
     * Award custom achievement (called from external modules)
     */
    awardCustomAchievement(achievementKey, achievementData) {
        console.log(`🎮 FarmGameUI.awardCustomAchievement called:`, { achievementKey, achievementData });

        // This method is called from the main app when pixel hunt achievements are unlocked
        // Force refresh of achievements display if we're currently on the achievements tab
        const achievementsTab = document.querySelector('[data-view="achievements"]');
        console.log(`🎮 Achievements tab status:`, {
            tabExists: !!achievementsTab,
            isActive: achievementsTab ? achievementsTab.classList.contains('active') : false
        });

        if (achievementsTab && achievementsTab.classList.contains('active')) {
            console.log(`🎮 Achievements tab is active, refreshing view`);
            // Refresh the achievements view
            setTimeout(() => {
                const farmState = this.farmSimulation ? this.farmSimulation.getFarmState() : { playerStats: {} };
                console.log(`🎮 Updating achievements view with farmState:`, farmState);
                this.updateAchievementsView(farmState);
            }, 100);
        } else {
            console.log(`🎮 Achievements tab not active, forcing refresh anyway`);
            // Force refresh even if tab is not active
            setTimeout(() => {
                const farmState = this.farmSimulation ? this.farmSimulation.getFarmState() : { playerStats: {} };
                this.updateAchievementsView(farmState);
            }, 100);
        }
    }

    /**
     * Open buy supplies modal
     */
    buySupplies() {
        console.log('🛒 Opening buy supplies modal');
        const farmState = this.farmSimulation.getFarmState();

        // Combine title and content into a single HTML string
        const fullContent = `
            <div class="modal-header">
                <h3>🛒 Buy Supplies</h3>
            </div>
            ${this.renderBuySuppliesModal(farmState)}
            <div class="modal-footer">
                <button class="secondary-btn" onclick="farmGameUI.closeModal()">❌ Close</button>
            </div>
        `;

        this.showModal(fullContent);
    }

    /**
     * Render buy supplies modal content
     */
    renderBuySuppliesModal(farmState) {
        const money = farmState.resources.money || 0;
        const water = farmState.resources.water || 0;

        // Define supply prices
        const supplies = [
            {
                id: 'water',
                name: '💧 Water',
                description: 'Essential for irrigation and livestock',
                price: 50,
                unit: 'per 100 units',
                icon: '💧',
                currentAmount: water
            },
            {
                id: 'seeds',
                name: '🌱 Seeds',
                description: 'High-quality crop seeds for planting',
                price: 75,
                unit: 'per packet',
                icon: '🌱',
                currentAmount: farmState.resources.seeds || 0
            },
            {
                id: 'fertilizer',
                name: '🧪 Fertilizer',
                description: 'Boost crop growth and yield',
                price: 100,
                unit: 'per bag',
                icon: '🧪',
                currentAmount: farmState.resources.fertilizer || 0
            },
            {
                id: 'feed',
                name: '🌾 Animal Feed',
                description: 'Nutritious feed for livestock',
                price: 60,
                unit: 'per bag',
                icon: '🌾',
                currentAmount: farmState.resources.feed || 0
            },
            {
                id: 'fuel',
                name: 'Fuel',
                description: 'Diesel fuel for tractors and farm equipment',
                price: 80,
                unit: 'per 50 liters',
                icon: '⛽',
                currentAmount: farmState.resources.fuel || 0
            },
            {
                id: 'cattle',
                name: 'Cattle',
                description: 'Dairy cattle for milk production',
                price: 500,
                unit: 'per head',
                icon: '🐄',
                currentAmount: farmState.livestock?.cattle?.count || 0,
                isLivestock: true
            },
            {
                id: 'sheep',
                name: 'Sheep',
                description: 'Sheep for wool and meat production',
                price: 200,
                unit: 'per head',
                icon: '🐑',
                currentAmount: farmState.livestock?.sheep?.count || 0,
                isLivestock: true
            },
            {
                id: 'chickens',
                name: 'Chickens',
                description: 'Chickens for eggs and meat production',
                price: 25,
                unit: 'per 5 birds',
                icon: '🐔',
                currentAmount: farmState.livestock?.chickens?.count || 0,
                isLivestock: true
            }
        ];

        return `
            <div class="buy-supplies-modal">
                <div class="current-money">
                    <h4>💰 Available Money: $${money.toLocaleString()}</h4>
                </div>

                <div class="supplies-grid">
                    ${supplies.map(supply => `
                        <div class="supply-item">
                            <div class="supply-icon">${supply.icon}</div>
                            <div class="supply-info">
                                <h5>${supply.name}</h5>
                                <p class="supply-description">${supply.description}</p>
                                <div class="supply-current">Current: ${supply.currentAmount}</div>
                                <div class="supply-price">$${supply.price} ${supply.unit}</div>
                            </div>
                            <div class="supply-purchase">
                                <div class="quantity-controls">
                                    <button class="qty-btn" onclick="farmGameUI.changeQuantity('${supply.id}', -1)">-</button>
                                    <input type="number" id="qty-${supply.id}" value="1" min="1" max="10" class="qty-input">
                                    <button class="qty-btn" onclick="farmGameUI.changeQuantity('${supply.id}', 1)">+</button>
                                </div>
                                <button class="buy-btn ${money >= supply.price ? '' : 'disabled'}"
                                        onclick="farmGameUI.purchaseSupply('${supply.id}', ${supply.price})"
                                        ${money >= supply.price ? '' : 'disabled'}>
                                    Buy
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="purchase-tips">
                    <h5>💡 Purchase Tips:</h5>
                    <ul>
                        <li>💧 Water is essential - always keep 200+ units in stock</li>
                        <li>🌱 Buy seeds based on your planting schedule</li>
                        <li>🧪 Fertilizer boosts crop yield by 20-30%</li>
                        <li>🌾 Animal feed keeps livestock healthy and productive</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Change quantity in purchase controls
     */
    changeQuantity(supplyId, change) {
        const qtyInput = document.getElementById(`qty-${supplyId}`);
        if (qtyInput) {
            const currentValue = parseInt(qtyInput.value);
            const newValue = Math.max(1, Math.min(10, currentValue + change));
            qtyInput.value = newValue;
        }
    }

    /**
     * Purchase a supply item
     */
    purchaseSupply(supplyId, unitPrice) {
        const qtyInput = document.getElementById(`qty-${supplyId}`);
        const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
        const totalCost = unitPrice * quantity;

        const farmState = this.farmSimulation.getFarmState();
        const currentMoney = farmState.resources.money || 0;

        if (currentMoney < totalCost) {
            this.showNotification(`Not enough money! Need $${totalCost}, have $${currentMoney}`, 'error');
            return;
        }

        // Calculate supply amounts based on type
        let supplyAmount = 0;
        let supplyName = '';

        switch (supplyId) {
            case 'water':
                supplyAmount = quantity * 100; // 100 units per purchase
                supplyName = 'Water';
                break;
            case 'seeds':
                supplyAmount = quantity * 50; // 50 seeds per packet
                supplyName = 'Seeds';
                break;
            case 'fertilizer':
                supplyAmount = quantity * 25; // 25 units per bag
                supplyName = 'Fertilizer';
                break;
            case 'feed':
                supplyAmount = quantity * 75; // 75 units per bag
                supplyName = 'Animal Feed';
                break;
            case 'fuel':
                supplyAmount = quantity * 50; // 50 liters per purchase
                supplyName = 'Fuel';
                break;
            case 'cattle':
                // Handle cattle purchase differently - update livestock object
                this.purchaseLivestock('cattle', quantity, totalCost);
                return; // Exit early since livestock is handled separately
            case 'sheep':
                // Handle sheep purchase differently - update livestock object
                this.purchaseLivestock('sheep', quantity, totalCost);
                return; // Exit early since livestock is handled separately
            case 'chickens':
                // Handle chickens purchase differently - update livestock object
                this.purchaseLivestock('chickens', quantity, totalCost);
                return; // Exit early since livestock is handled separately
        }

        // Update farm resources
        this.farmSimulation.updateResources({
            money: -totalCost,
            [supplyId]: supplyAmount
        });

        // Show success notification
        this.showNotification(
            `✅ Purchased ${quantity}x ${supplyName} for $${totalCost}! (+${supplyAmount} units)`,
            'success'
        );

        // Refresh the modal with updated data
        const updatedFarmState = this.farmSimulation.getFarmState();
        const fullContent = `
            <div class="modal-header">
                <h3>🛒 Buy Supplies</h3>
            </div>
            ${this.renderBuySuppliesModal(updatedFarmState)}
            <div class="modal-footer">
                <button class="secondary-btn" onclick="farmGameUI.closeModal()">❌ Close</button>
            </div>
        `;
        this.showModal(fullContent);

        // Update UI displays
        this.updateCurrentView();
    }

    /**
     * Purchase livestock - handles livestock differently from regular supplies
     */
    purchaseLivestock(livestockType, quantity, totalCost) {
        const farmState = this.farmSimulation.getFarmState();

        // Ensure livestock object exists and is properly initialized (using 0-1 range like Farm Engine)
        if (!farmState.livestock) {
            farmState.livestock = {
                cattle: { count: 0, health: 0.85, feed_level: 0.8 },
                sheep: { count: 0, health: 0.85, feed_level: 0.8 },
                chickens: { count: 0, health: 0.85, feed_level: 0.8 }
            };
        }

        // Initialize specific livestock type if it doesn't exist
        if (!farmState.livestock[livestockType]) {
            farmState.livestock[livestockType] = { count: 0, health: 0.85, feed_level: 0.8 };
        }

        // Determine actual quantity based on livestock type
        let actualQuantity = quantity;
        let displayName = '';

        switch (livestockType) {
            case 'cattle':
                actualQuantity = quantity; // 1 cattle per purchase
                displayName = 'Cattle';
                break;
            case 'sheep':
                actualQuantity = quantity; // 1 sheep per purchase
                displayName = 'Sheep';
                break;
            case 'chickens':
                actualQuantity = quantity * 5; // 5 chickens per purchase (as defined in supplies)
                displayName = 'Chickens';
                break;
        }

        // Update livestock count
        farmState.livestock[livestockType].count += actualQuantity;

        // Ensure health and feed levels are reasonable for new animals
        const currentCount = farmState.livestock[livestockType].count;
        if (currentCount > 0) {
            // New animals arrive healthy and well-fed (0-1 range)
            farmState.livestock[livestockType].health = Math.max(farmState.livestock[livestockType].health, 0.85);
            farmState.livestock[livestockType].feed_level = Math.max(farmState.livestock[livestockType].feed_level, 0.75);
        }

        // Deduct money
        this.farmSimulation.updateResources({ money: -totalCost });

        // Add livestock score for successful purchase
        this.farmSimulation.addLivestockScore(actualQuantity * 5); // 5 points per animal

        // Show success notification
        this.showNotification(
            `✅ Purchased ${actualQuantity} ${displayName} for $${totalCost}! They've joined your farm.`,
            'success'
        );

        // Refresh the modal with updated data
        const updatedFarmState = this.farmSimulation.getFarmState();
        const fullContent = `
            <div class="modal-header">
                <h3>🛒 Buy Supplies</h3>
            </div>
            ${this.renderBuySuppliesModal(updatedFarmState)}
            <div class="modal-footer">
                <button class="secondary-btn" onclick="farmGameUI.closeModal()">❌ Close</button>
            </div>
        `;
        this.showModal(fullContent);

        // Update UI displays
        this.updateCurrentView();
    }

    sellProduce() {
        console.log('💰 Opening sell produce modal');
        const farmState = this.farmSimulation.getFarmState();

        // Ensure harvestedCrops exists
        if (!farmState.harvestedCrops) {
            farmState.harvestedCrops = {};
        }

        const fullContent = `
            <div class="modal-header">
                <h3>💰 Sell Produce</h3>
            </div>
            ${this.renderSellProduceModal(farmState)}
            <div class="modal-footer">
                <button class="secondary-btn" onclick="farmGameUI.closeModal()">❌ Close</button>
            </div>
        `;
        this.showModal(fullContent);
    }

    renderSellProduceModal(farmState) {
        console.log('🔍 Debug: farmState.harvestedCrops =', farmState.harvestedCrops);
        const harvestedCrops = farmState.harvestedCrops || {};
        console.log('🔍 Debug: harvestedCrops after fallback =', harvestedCrops);
        const availableCrops = Object.entries(harvestedCrops).filter(([crop, amount]) => amount > 0);
        console.log('📦 Available crops for sale:', availableCrops);
        console.log('📦 All crops (including zero):', Object.entries(harvestedCrops));

        if (availableCrops.length === 0) {
            return `
                <div class="sell-produce-modal">
                    <div class="empty-inventory">
                        <h4>📦 No Produce Available</h4>
                        <p>You don't have any harvested crops to sell yet.</p>
                        <p>Harvest some crops first, then come back to sell them!</p>
                    </div>
                </div>
            `;
        }

        // Dynamic crop emojis and names - supports all crop types
        const cropEmojis = this.getCropEmojis();
        const cropNames = this.getCropNames();

        return `
            <div class="sell-produce-modal">
                <div class="current-inventory">
                    <h4>📦 Current Inventory</h4>
                    <div class="inventory-grid">
                        ${availableCrops.map(([cropType, amount]) => {
                            const marketPrice = this.farmSimulation.getMarketPrice(cropType);
                            const maxValue = amount * marketPrice;
                            return `
                                <div class="produce-item">
                                    <div class="produce-header">
                                        <h5>${cropEmojis[cropType] || '🌱'} ${cropNames[cropType] || cropType.charAt(0).toUpperCase() + cropType.slice(1)}</h5>
                                        <span class="produce-amount">${amount.toFixed(1)} bushels</span>
                                    </div>
                                    <div class="market-info">
                                        <div class="price-info">
                                            <span>Market Price: $${marketPrice.toFixed(2)}/bushel</span>
                                            <span class="max-value">Max Value: $${maxValue.toFixed(0)}</span>
                                        </div>
                                    </div>
                                    <div class="sell-controls">
                                        <label for="${cropType}-sell-amount">Amount to sell:</label>
                                        <div class="input-group">
                                            <input type="number"
                                                   id="${cropType}-sell-amount"
                                                   min="0"
                                                   max="${amount}"
                                                   step="0.1"
                                                   value="${amount}"
                                                   placeholder="0">
                                            <span class="unit">bushels</span>
                                        </div>
                                        <button class="sell-btn"
                                                onclick="farmGameUI.sellCropProduce('${cropType}')">
                                            💰 Sell ${cropNames[cropType]}
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="market-summary">
                    <h4>📈 Market Summary</h4>
                    <p>Current market conditions are favorable for selling. Prices update weekly based on supply and demand.</p>
                </div>
            </div>
        `;
    }

    sellCropProduce(cropType) {
        const amountInput = document.getElementById(`${cropType}-sell-amount`);
        const amount = parseFloat(amountInput.value) || 0;

        if (amount <= 0) {
            this.showNotification('⚠️ Please enter a valid amount to sell', 'error');
            return;
        }

        console.log(`💰 Selling ${amount} bushels of ${cropType}`);
        const result = this.farmSimulation.sellProduce(cropType, amount);

        if (result.success) {
            this.updateResourcesDisplay();
            this.showNotification(result.message, 'success');

            // Refresh the modal with updated inventory
            this.sellProduce();
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    /**
     * Initialize NASA Data Tutorial System
     */
    initializeTutorialSystem() {
        console.log('🎓 Initializing NASA Data Tutorial System...');

        // Load tutorial system dynamically
        this.loadTutorialScript().then(() => {
            if (typeof NASADataTutorial !== 'undefined') {
                try {
                    this.nasaDataTutorial = new NASADataTutorial(this);
                    // Make instance globally available for button clicks
                    window.nasaDataTutorial = this.nasaDataTutorial;
                    console.log('✅ NASA Data Tutorial System initialized successfully');
                    console.log('🌐 Tutorial instance available globally as window.nasaDataTutorial');
                } catch (error) {
                    console.error('❌ Error creating NASADataTutorial instance:', error);
                    this.nasaDataTutorial = null;
                }
            } else {
                console.warn('⚠️ NASADataTutorial class not available after loading');
                this.nasaDataTutorial = null;
            }
        }).catch(error => {
            console.error('❌ Tutorial loading error:', error);
            this.nasaDataTutorial = null;
        });
    }

    /**
     * Load tutorial script dynamically
     */
    async loadTutorialScript() {
        if (typeof NASADataTutorial !== 'undefined') {
            return; // Already loaded
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = './src/tutorial/NASADataTutorial.js';
            script.onload = () => {
                // Wait for script to execute and class to be available
                setTimeout(() => {
                    if (typeof NASADataTutorial !== 'undefined') {
                        console.log('✅ NASADataTutorial loaded successfully');
                        resolve();
                    } else {
                        console.error('❌ NASADataTutorial class not available after script load');
                        reject(new Error('Tutorial class not available'));
                    }
                }, 200);
            };
            script.onerror = (error) => {
                console.error('❌ Tutorial script failed to load:', error);
                reject(error);
            };
            document.head.appendChild(script);
            console.log('📥 Loading NASA Data Tutorial script...');
        });
    }

    /**
     * Start NASA Data Tutorial
     */
    startNASATutorial() {
        console.log('🚀 Starting NASA Tutorial...');

        if (this.nasaDataTutorial) {
            console.log('✅ Tutorial system ready, starting...');
            try {
                this.nasaDataTutorial.startTutorial();
            } catch (error) {
                console.error('❌ Error starting tutorial:', error);
                this.showNotification('Tutorial system encountered an error. Please refresh and try again.', 'error');
            }
        } else {
            console.log('⏳ Tutorial system not ready, attempting to initialize...');

            // Try to initialize and start
            this.initializeTutorialSystem();

            // Wait longer and provide more feedback
            let attempts = 0;
            const maxAttempts = 5;

            const checkAndStart = () => {
                attempts++;
                console.log(`🔍 Checking tutorial system (attempt ${attempts}/${maxAttempts})...`);

                if (this.nasaDataTutorial) {
                    console.log('✅ Tutorial system now ready!');
                    try {
                        this.nasaDataTutorial.startTutorial();
                    } catch (error) {
                        console.error('❌ Error starting tutorial:', error);
                        this.showNotification('Tutorial system encountered an error. Please refresh and try again.', 'error');
                    }
                } else if (attempts < maxAttempts) {
                    console.log(`⏳ Still loading... (${attempts}/${maxAttempts})`);
                    setTimeout(checkAndStart, 1000);
                } else {
                    console.error('❌ Tutorial system failed to load after multiple attempts');
                    this.showNotification('🔄 Tutorial system is having trouble loading. Please refresh the page and try again.', 'warning');
                }
            };

            setTimeout(checkAndStart, 500);
        }
    }

    /**
     * Start specific tutorial module
     */
    startTutorialModule(moduleId) {
        if (this.nasaDataTutorial) {
            this.nasaDataTutorial.startTutorial(moduleId);
        } else {
            this.startNASATutorial();
        }
    }

    /**
     * Initialize Conservation Farming System
     */
    initializeConservationSystem() {
        this.loadConservationScript().then(() => {
            if (typeof ConservationFarmingSystem !== 'undefined') {
                this.conservationSystem = new ConservationFarmingSystem(this.farmSimulation);
                console.log('🌱 Conservation Farming System initialized');
            } else {
                console.warn('⚠️ Conservation Farming System failed to load');
            }
        }).catch(error => {
            console.error('Failed to load Conservation Farming System:', error);
        });
    }

    /**
     * Load conservation script dynamically
     */
    async loadConservationScript() {
        if (typeof ConservationFarmingSystem !== 'undefined') {
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = '/src/systems/ConservationFarmingSystem.js';
            script.onload = () => {
                setTimeout(() => {
                    if (typeof ConservationFarmingSystem !== 'undefined') {
                        resolve();
                    } else {
                        import('/src/systems/ConservationFarmingSystem.js').then(module => {
                            window.ConservationFarmingSystem = module.default;
                            resolve();
                        }).catch(reject);
                    }
                }, 100);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Show Conservation Farming Dashboard
     */
    showConservationDashboard() {
        if (!this.conservationSystem) {
            this.showNotification('🔄 Conservation system is loading... Please try again in a moment', 'info');
            return;
        }

        const data = this.conservationSystem.generateReport();

        const content = `
            <div class="conservation-dashboard">
                <h2>🌱 Conservation Farming Dashboard</h2>

                <div class="conservation-practices">
                    <h3>🔧 Active Conservation Practices</h3>
                    <div class="practices-grid">
                        ${Object.entries(data.practices).map(([id, practice]) => `
                            <div class="practice-card ${practice.adopted ? 'adopted' : 'available'}">
                                <h4>${practice.name}</h4>
                                <div class="practice-status">
                                    ${practice.adopted ? '✅ Adopted' : '⭕ Available'}
                                </div>
                                ${practice.adopted ? `
                                    <div class="practice-benefits">
                                        <p><strong>Cost Savings:</strong> $${practice.totalBenefits.toFixed(2)}/season</p>
                                        <p><strong>Environmental Score:</strong> +${practice.environmentalImpact.toFixed(1)}</p>
                                    </div>
                                ` : `
                                    <div class="practice-requirements">
                                        <p><strong>Initial Cost:</strong> $${practice.requirements.initialCost}</p>
                                        <p><strong>ROI Period:</strong> ${practice.requirements.timeToROI} seasons</p>
                                        <button class="adopt-practice-btn" onclick="farmGameUI.adoptConservationPractice('${id}')">
                                            Adopt Practice
                                        </button>
                                    </div>
                                `}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="environmental-metrics">
                    <h3>🌍 Environmental Impact</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Soil Health</h4>
                            <div class="metric-value">${(data.environmentalMetrics.soilHealth.current * 100).toFixed(1)}%</div>
                            <div class="metric-trend ${data.environmentalMetrics.soilHealth.trend > 0 ? 'positive' : 'negative'}">
                                ${data.environmentalMetrics.soilHealth.trend > 0 ? '📈' : '📉'}
                                ${(data.environmentalMetrics.soilHealth.trend * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div class="metric-card">
                            <h4>Carbon Sequestration</h4>
                            <div class="metric-value">${data.environmentalMetrics.carbonSequestration.accumulated.toFixed(1)} tons</div>
                            <div class="metric-trend positive">
                                📈 ${data.environmentalMetrics.carbonSequestration.rate.toFixed(2)} tons/season
                            </div>
                        </div>
                        <div class="metric-card">
                            <h4>Biodiversity Index</h4>
                            <div class="metric-value">${(data.environmentalMetrics.biodiversityIndex.current * 100).toFixed(1)}%</div>
                            <div class="metric-trend ${data.environmentalMetrics.biodiversityIndex.trend > 0 ? 'positive' : 'negative'}">
                                ${data.environmentalMetrics.biodiversityIndex.trend > 0 ? '📈' : '📉'}
                                ${(data.environmentalMetrics.biodiversityIndex.trend * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                <div class="economic-summary">
                    <h3>💰 Economic Summary</h3>
                    <div class="economic-stats">
                        <div class="stat">
                            <strong>Total Savings This Season:</strong> $${data.economicSummary.totalSavings.toFixed(2)}
                        </div>
                        <div class="stat">
                            <strong>Average ROI:</strong> ${(data.economicSummary.averageROI * 100).toFixed(1)}%
                        </div>
                        <div class="stat">
                            <strong>Sustainability Score:</strong> ${data.economicSummary.sustainabilityScore.toFixed(1)}/10
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .conservation-dashboard {
                    max-height: 80vh;
                    overflow-y: auto;
                    padding: 20px;
                    color: #07173F;
                    background: linear-gradient(135deg, #F8FBFF, #E8F4FD);
                    border-radius: 12px;
                }

                .conservation-dashboard h2 {
                    color: #07173F;
                    text-align: center;
                    margin-bottom: 30px;
                    font-family: 'Overpass', sans-serif;
                }

                .conservation-dashboard h3 {
                    color: #0042A6;
                    border-bottom: 2px solid #2E96F5;
                    padding-bottom: 8px;
                    margin: 25px 0 15px 0;
                }

                .practices-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }

                .practice-card {
                    border: 2px solid #2E96F5;
                    border-radius: 12px;
                    padding: 20px;
                    background: white;
                    box-shadow: 0 4px 12px rgba(46, 150, 245, 0.1);
                    transition: all 0.3s ease;
                }

                .practice-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(46, 150, 245, 0.2);
                }

                .practice-card h4 {
                    color: #07173F;
                    margin-bottom: 10px;
                    font-weight: 600;
                }

                .practice-card.adopted {
                    border-color: #EAFE07;
                    background: linear-gradient(135deg, #FAFFFE, #F8FFF0);
                }

                .practice-card.available {
                    border-color: #0042A6;
                    background: linear-gradient(135deg, #F0F8FF, #E8F4FD);
                }

                .practice-status {
                    font-weight: bold;
                    margin-bottom: 15px;
                }

                .adopt-practice-btn {
                    background: linear-gradient(45deg, #0042A6, #2E96F5);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    font-family: 'Overpass', sans-serif;
                }

                .adopt-practice-btn:hover {
                    background: linear-gradient(45deg, #07173F, #0042A6);
                    transform: translateY(-1px);
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }

                .metric-card {
                    background: linear-gradient(135deg, #0042A6, #2E96F5);
                    color: white;
                    border-radius: 12px;
                    padding: 25px;
                    text-align: center;
                    box-shadow: 0 6px 20px rgba(0, 66, 166, 0.3);
                }

                .metric-card h4 {
                    color: white;
                    margin-bottom: 15px;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .metric-value {
                    font-size: 2.2em;
                    font-weight: bold;
                    color: #EAFE07;
                    margin: 10px 0;
                }

                .metric-trend.positive {
                    color: #EAFE07;
                    font-weight: bold;
                }

                .metric-trend.negative {
                    color: #E43700;
                    font-weight: bold;
                }

                .economic-stats {
                    background: linear-gradient(135deg, #EAFE07, #F5FF8A);
                    border-radius: 12px;
                    padding: 25px;
                    margin: 20px 0;
                    color: #07173F;
                    box-shadow: 0 4px 15px rgba(234, 254, 7, 0.3);
                }

                .economic-stats .stat {
                    margin-bottom: 12px;
                    font-size: 1.1rem;
                }

                .economic-stats strong {
                    color: #07173F;
                    font-weight: 600;
                }
                }

                .stat {
                    margin: 10px 0;
                    padding: 5px 0;
                    border-bottom: 1px solid #eee;
                }
            </style>
        `;

        this.showModal(content);
    }

    /**
     * Adopt a conservation practice
     */
    adoptConservationPractice(practiceId) {
        if (!this.conservationSystem) {
            this.showNotification('Conservation system not available', 'error');
            return;
        }

        const result = this.conservationSystem.adoptPractice(practiceId);

        if (result.success) {
            this.showNotification(`✅ ${result.practice.name} adopted successfully!`, 'success');
            this.showConservationDashboard(); // Refresh the dashboard

            // Update environmental impact tracker
            if (this.environmentalTracker) {
                this.environmentalTracker.updateSeasonalMetrics({
                    conservationPractices: this.conservationSystem.getActivePractices()
                });
            }
        } else {
            this.showNotification(`❌ ${result.message}`, 'error');
        }
    }

    /**
     * Initialize Environmental Impact Tracker
     */
    initializeEnvironmentalTracker() {
        this.loadEnvironmentalTrackerScript().then(() => {
            if (typeof EnvironmentalImpactTracker !== 'undefined') {
                this.environmentalTracker = new EnvironmentalImpactTracker(this.farmSimulation);
                console.log('🌍 Environmental Impact Tracker initialized');
            } else {
                console.warn('⚠️ Environmental Impact Tracker failed to load');
            }
        }).catch(error => {
            console.error('Failed to load Environmental Impact Tracker:', error);
        });
    }

    /**
     * Load environmental tracker script dynamically
     */
    async loadEnvironmentalTrackerScript() {
        if (typeof EnvironmentalImpactTracker !== 'undefined') {
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = '/src/systems/EnvironmentalImpactTracker.js';
            script.onload = () => {
                setTimeout(() => {
                    if (typeof EnvironmentalImpactTracker !== 'undefined') {
                        resolve();
                    } else {
                        import('/src/systems/EnvironmentalImpactTracker.js').then(module => {
                            window.EnvironmentalImpactTracker = module.default;
                            resolve();
                        }).catch(reject);
                    }
                }, 100);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Show Environmental Impact Dashboard
     */
    showEnvironmentalImpactDashboard() {
        if (!this.environmentalTracker) {
            this.showNotification('🔄 Environmental tracker is loading... Please try again in a moment', 'info');
            return;
        }

        const report = this.environmentalTracker.generateEnvironmentalReport();

        const content = `
            <div class="environmental-dashboard">
                <h2>🌍 Environmental Impact Dashboard</h2>

                <div class="sustainability-overview">
                    <div class="sustainability-score">
                        <h3>🎯 Sustainability Score</h3>
                        <div class="score-circle">
                            <span class="score-value">${(report.sustainabilityScore * 100).toFixed(1)}%</span>
                        </div>
                        <p>Overall environmental performance</p>
                    </div>
                </div>

                <div class="metrics-tabs">
                    <button class="tab-btn active" onclick="farmGameUI.showEnvironmentalTab('current')">Current Metrics</button>
                    <button class="tab-btn" onclick="farmGameUI.showEnvironmentalTab('trends')">Historical Trends</button>
                    <button class="tab-btn" onclick="farmGameUI.showEnvironmentalTab('milestones')">Milestones</button>
                    <button class="tab-btn" onclick="farmGameUI.showEnvironmentalTab('nasa')">NASA Data</button>
                    <button class="tab-btn" onclick="farmGameUI.showEnvironmentalTab('insights')">Insights (${this.environmentalTracker.getUnseenInsightsCount()})</button>
                </div>

                <div id="environmental-tab-content">
                    ${this.generateCurrentMetricsTab(report)}
                </div>
            </div>

            <style>
                .environmental-dashboard {
                    max-height: 80vh;
                    overflow-y: auto;
                    padding: 20px;
                }

                .sustainability-overview {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
                    border-radius: 10px;
                }

                .score-circle {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: conic-gradient(#27ae60 0deg ${report.sustainabilityScore * 360}deg, #ecf0f1 ${report.sustainabilityScore * 360}deg 360deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 20px auto;
                    position: relative;
                }

                .score-circle::before {
                    content: '';
                    position: absolute;
                    width: 80px;
                    height: 80px;
                    background: white;
                    border-radius: 50%;
                }

                .score-value {
                    position: relative;
                    z-index: 1;
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #2c3e50;
                }

                .metrics-tabs {
                    display: flex;
                    border-bottom: 2px solid #ddd;
                    margin-bottom: 20px;
                    overflow-x: auto;
                }

                .tab-btn {
                    padding: 10px 16px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    white-space: nowrap;
                }

                .tab-btn.active {
                    border-bottom-color: #27ae60;
                    background: #e8f5e8;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }

                .metric-card {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    border-left: 4px solid #3498db;
                }

                .metric-card.positive { border-left-color: #27ae60; }
                .metric-card.negative { border-left-color: #e74c3c; }
                .metric-card.neutral { border-left-color: #f39c12; }

                .metric-title {
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #2c3e50;
                }

                .metric-value {
                    font-size: 1.8em;
                    font-weight: bold;
                    margin: 10px 0;
                }

                .metric-description {
                    font-size: 0.9em;
                    color: #666;
                    margin-top: 8px;
                }

                .nasa-data-source {
                    background: #e3f2fd;
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-size: 0.8em;
                    color: #1976d2;
                    margin-top: 8px;
                    display: inline-block;
                }
            </style>
        `;

        this.showModal(content);
    }

    /**
     * Generate current metrics tab content
     */
    generateCurrentMetricsTab(report) {
        const metrics = report.currentMetrics;

        return `
            <div class="metrics-grid">
                <div class="metric-card ${metrics.soilErosion.rate < 0.05 ? 'positive' : 'negative'}">
                    <div class="metric-title">🏔️ Soil Health</div>
                    <div class="metric-value">${(metrics.soilErosion.rate * 100).toFixed(2)}%</div>
                    <div class="metric-description">Erosion rate (tons/hectare/year)</div>
                    <div class="nasa-data-source">📡 ${metrics.soilErosion.nasaDataSource}</div>
                </div>

                <div class="metric-card ${metrics.carbonFootprint.netBalance > 0 ? 'positive' : 'negative'}">
                    <div class="metric-title">🌱 Carbon Balance</div>
                    <div class="metric-value">${metrics.carbonFootprint.netBalance.toFixed(1)} tons</div>
                    <div class="metric-description">Net CO₂ sequestration vs emissions</div>
                    <div class="nasa-data-source">📡 MODIS Vegetation</div>
                </div>

                <div class="metric-card ${metrics.waterEfficiency.efficiency > 1.2 ? 'positive' : 'neutral'}">
                    <div class="metric-title">💧 Water Efficiency</div>
                    <div class="metric-value">${metrics.waterEfficiency.efficiency.toFixed(2)}x</div>
                    <div class="metric-description">Usage vs optimal (${metrics.waterEfficiency.usage.toFixed(0)} L/ha)</div>
                    <div class="nasa-data-source">📡 ${metrics.waterEfficiency.nasaDataSource}</div>
                </div>

                <div class="metric-card ${metrics.biodiversityIndex.current > 0.7 ? 'positive' : 'neutral'}">
                    <div class="metric-title">🦋 Biodiversity</div>
                    <div class="metric-value">${(metrics.biodiversityIndex.current * 100).toFixed(1)}%</div>
                    <div class="metric-description">${metrics.biodiversityIndex.speciesCount} species detected</div>
                    <div class="nasa-data-source">📡 MODIS Land Cover</div>
                </div>

                <div class="metric-card ${metrics.climateResilience.adaptabilityScore > 0.7 ? 'positive' : 'neutral'}">
                    <div class="metric-title">🛡️ Climate Resilience</div>
                    <div class="metric-value">${(metrics.climateResilience.adaptabilityScore * 100).toFixed(1)}%</div>
                    <div class="metric-description">Drought tolerance: ${(metrics.climateResilience.droughtTolerance * 100).toFixed(1)}%</div>
                    <div class="nasa-data-source">📡 GPM Precipitation</div>
                </div>
            </div>
        `;
    }

    /**
     * Show specific environmental tab
     */
    showEnvironmentalTab(tabName) {
        if (!this.environmentalTracker) return;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        const report = this.environmentalTracker.generateEnvironmentalReport();
        const contentDiv = document.getElementById('environmental-tab-content');

        switch (tabName) {
            case 'current':
                contentDiv.innerHTML = this.generateCurrentMetricsTab(report);
                break;
            case 'trends':
                contentDiv.innerHTML = this.generateTrendsTab(report);
                break;
            case 'milestones':
                contentDiv.innerHTML = this.generateMilestonesTab(report);
                break;
            case 'nasa':
                contentDiv.innerHTML = this.generateNASADataTab(report);
                break;
            case 'insights':
                contentDiv.innerHTML = this.generateInsightsTab(report);
                break;
        }
    }

    /**
     * Generate trends tab content
     */
    generateTrendsTab(report) {
        const historical = report.historicalData;

        return `
            <div class="trends-content">
                <h3>📈 Historical Trends</h3>
                ${Object.keys(historical).map(key => {
                    const data = historical[key];
                    if (data.length === 0) return '';

                    const latest = data[data.length - 1];
                    const earliest = data[0];

                    return `
                        <div class="trend-card">
                            <h4>${this.getTrendTitle(key)}</h4>
                            <div class="trend-summary">
                                <span>Latest: ${this.formatTrendValue(key, latest)}</span>
                                <span>Earliest: ${this.formatTrendValue(key, earliest)}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <style>
                .trend-card {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    border-left: 4px solid #3498db;
                }

                .trend-summary {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                    font-size: 0.9em;
                }
            </style>
        `;
    }

    /**
     * Generate milestones tab content
     */
    generateMilestonesTab(report) {
        const milestones = report.milestones;

        return `
            <div class="milestones-content">
                <h3>🏆 Environmental Milestones</h3>
                <div class="milestones-grid">
                    ${Object.entries(milestones).map(([key, milestone]) => `
                        <div class="milestone-card ${milestone.achieved ? 'achieved' : 'pending'}">
                            <div class="milestone-status">
                                ${milestone.achieved ? '✅' : '⏳'}
                            </div>
                            <h4>${this.getMilestoneTitle(key)}</h4>
                            <p>${this.getMilestoneDescription(key)}</p>
                            ${milestone.achieved ? `<div class="achievement-date">Achieved: ${milestone.season}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            <style>
                .milestones-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }

                .milestone-card {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    border: 2px solid #ddd;
                }

                .milestone-card.achieved {
                    background: #e8f5e8;
                    border-color: #27ae60;
                }

                .milestone-status {
                    font-size: 2em;
                    margin-bottom: 10px;
                }

                .achievement-date {
                    font-size: 0.8em;
                    color: #666;
                    margin-top: 10px;
                    font-style: italic;
                }
            </style>
        `;
    }

    /**
     * Generate NASA data tab content
     */
    generateNASADataTab(report) {
        const nasaData = report.nasaDataIntegration;

        return `
            <div class="nasa-data-content">
                <h3>🛰️ NASA Data Integration</h3>
                <div class="nasa-satellites">
                    ${Object.entries(nasaData).map(([satellite, data]) => `
                        <div class="satellite-card">
                            <h4>${satellite.toUpperCase()} Satellite</h4>
                            <div class="satellite-info">
                                <div class="data-point">
                                    <strong>Resolution:</strong> ${this.getSatelliteResolution(satellite)}
                                </div>
                                <div class="data-point">
                                    <strong>Accuracy:</strong> ${(data.accuracy * 100).toFixed(1)}%
                                </div>
                                <div class="data-point">
                                    <strong>Last Update:</strong> ${data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : 'Not available'}
                                </div>
                                <div class="data-point">
                                    <strong>Current Value:</strong> ${this.getCurrentSatelliteValue(satellite, data)}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="nasa-education">
                    <h4>📚 Understanding NASA Data</h4>
                    <p>Higher resolution data provides more precise measurements but covers smaller areas. Lower resolution data covers larger areas but may miss field-level details.</p>
                    <ul>
                        <li><strong>SMAP (9km):</strong> Great for regional soil moisture trends</li>
                        <li><strong>MODIS (250m):</strong> Perfect for individual field monitoring</li>
                        <li><strong>GPM (0.1°):</strong> Excellent for precipitation forecasting</li>
                    </ul>
                </div>
            </div>

            <style>
                .satellite-card {
                    background: #e3f2fd;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    border-left: 4px solid #1976d2;
                }

                .data-point {
                    margin: 8px 0;
                }

                .nasa-education {
                    background: #fff3e0;
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 20px;
                }

                .nasa-education ul {
                    margin-top: 15px;
                    padding-left: 20px;
                }

                .nasa-education li {
                    margin: 8px 0;
                }
            </style>
        `;
    }

    /**
     * Generate insights tab content
     */
    generateInsightsTab(report) {
        const insights = report.educationalInsights;

        // Mark all insights as seen when viewing this tab
        insights.forEach(insight => {
            this.environmentalTracker.markInsightAsSeen(insight.id);
        });

        return `
            <div class="insights-content">
                <h3>💡 Educational Insights</h3>
                ${insights.length === 0 ? '<p>No insights available yet. Keep farming to generate insights!</p>' : ''}
                <div class="insights-list">
                    ${insights.map(insight => `
                        <div class="insight-card ${insight.category}">
                            <div class="insight-header">
                                <h4>${insight.title}</h4>
                                <span class="insight-timestamp">${insight.timestamp}</span>
                            </div>
                            <p>${insight.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <style>
                .insight-card {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    border-left: 4px solid #3498db;
                }

                .insight-card.achievement { border-left-color: #f39c12; }
                .insight-card.trend { border-left-color: #27ae60; }
                .insight-card.nasa-data { border-left-color: #1976d2; }
                .insight-card.soil { border-left-color: #8b4513; }

                .insight-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .insight-timestamp {
                    font-size: 0.8em;
                    color: #666;
                }
            </style>
        `;
    }

    /**
     * Helper methods for formatting environmental data
     */
    getTrendTitle(key) {
        const titles = {
            soilHealth: '🏔️ Soil Health',
            carbonStorage: '🌱 Carbon Storage',
            waterUsage: '💧 Water Usage',
            biodiversity: '🦋 Biodiversity'
        };
        return titles[key] || key;
    }

    formatTrendValue(key, dataPoint) {
        switch (key) {
            case 'soilHealth':
                return `${(dataPoint.erosionRate * 100).toFixed(2)}% erosion`;
            case 'carbonStorage':
                return `${dataPoint.netBalance.toFixed(1)} tons CO₂`;
            case 'waterUsage':
                return `${dataPoint.efficiency.toFixed(2)}x efficiency`;
            case 'biodiversity':
                return `${(dataPoint.index * 100).toFixed(1)}% index`;
            default:
                return JSON.stringify(dataPoint);
        }
    }

    getMilestoneTitle(key) {
        const titles = {
            carbonNeutral: 'Carbon Neutral Farm',
            soilHealthImproved: 'Healthy Soil Achievement',
            waterEfficiencyOptimal: 'Water Efficiency Master',
            biodiversityThriving: 'Biodiversity Champion',
            climateResilient: 'Climate Resilience Expert'
        };
        return titles[key] || key;
    }

    getMilestoneDescription(key) {
        const descriptions = {
            carbonNeutral: 'Achieve net positive carbon sequestration',
            soilHealthImproved: 'Maintain soil health above 70%',
            waterEfficiencyOptimal: 'Achieve 1.5x water efficiency',
            biodiversityThriving: 'Reach 80% biodiversity index',
            climateResilient: 'Build 80% climate resilience'
        };
        return descriptions[key] || '';
    }

    getSatelliteResolution(satellite) {
        const resolutions = {
            smap: '9 km',
            modis: '250 m',
            gpm: '0.1 degrees (~11 km)'
        };
        return resolutions[satellite] || 'Unknown';
    }

    getCurrentSatelliteValue(satellite, data) {
        switch (satellite) {
            case 'smap':
                return `${(data.soilMoisture * 100).toFixed(1)}% soil moisture`;
            case 'modis':
                return `${data.ndvi.toFixed(3)} NDVI`;
            case 'gpm':
                return `${data.precipitation.toFixed(1)} mm precipitation`;
            default:
                return 'No data';
        }
    }

    /**
     * Show loading modal for satellite data
     */
    showLoadingModal() {
        const content = `
            <div class="modal-header">
                <h3>🛰️ Loading NASA Satellite Data</h3>
            </div>

            <div class="loading-content" style="text-align: center; padding: 30px;">
                <div class="satellite-loading-animation" style="margin: 20px auto;">
                    <div style="width: 60px; height: 60px; border: 4px solid rgba(234, 254, 7, 0.2); border-top-color: #EAFE07; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>

                <h4 style="color: #EAFE07; margin: 20px 0;">Fetching Real-Time Data...</h4>

                <div class="loading-steps" style="text-align: left; max-width: 400px; margin: 20px auto;">
                    <p id="loading-step-1" style="opacity: 0.5;">📡 Connecting to NASA servers...</p>
                    <p id="loading-step-2" style="opacity: 0.5;">🌍 Retrieving SMAP soil moisture data...</p>
                    <p id="loading-step-3" style="opacity: 0.5;">🌿 Analyzing MODIS vegetation index...</p>
                    <p id="loading-step-4" style="opacity: 0.5;">🛰️ Processing Landsat imagery...</p>
                    <p id="loading-step-5" style="opacity: 0.5;">📊 Calculating regional parameters...</p>
                </div>

                <p style="color: #8E96AA; margin-top: 20px; font-size: 14px;">
                    This may take 10-15 seconds depending on NASA server response times...
                </p>
            </div>

            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        this.showModal(content);

        // Animate loading steps
        let step = 1;
        this.loadingInterval = setInterval(() => {
            if (step <= 5) {
                const stepElement = document.getElementById(`loading-step-${step}`);
                if (stepElement) {
                    stepElement.style.opacity = '1';
                    stepElement.style.color = '#EAFE07';
                }
                step++;
            }
        }, 2000);
    }

    /**
     * Initialize NASA Achievement System integration
     */
    initializeAchievementSystem() {
        // Check if Achievement System is available
        if (typeof window !== 'undefined' && window.achievementSystem && window.achievementUI) {
            this.achievementSystem = window.achievementSystem;
            this.achievementUI = window.achievementUI;

            console.log('🏆 NASA Achievement System connected to Farm Game');

            // Debug: Check Water Wizard achievement status
            const waterWizard = this.achievementSystem.achievements['water_wizard'];
            console.log('💧 Water Wizard initial status:', {
                exists: !!waterWizard,
                currentLevel: waterWizard?.currentLevel,
                progress: waterWizard?.progress,
                levels: waterWizard?.levels
            });

            // Track initial actions
            this.achievementSystem.trackAction('nasa_data_check', 1);

            // Update level progress bar immediately
            this.updateLevelProgressBar();

            // Set up Farm Game specific achievement tracking
            this.setupAchievementTracking();

            // Force update achievements view if on that tab
            if (this.currentView === 'achievements') {
                const farmState = this.farmSimulation.getFarmState();
                this.updateAchievementsView(farmState);
            }
        } else {
            console.warn('⚠️ NASA Achievement System not available yet, will retry...');
            // Retry after a delay
            setTimeout(() => {
                this.initializeAchievementSystem();
            }, 2000);
        }
    }

    /**
     * Set up achievement tracking for farm game actions
     */
    setupAchievementTracking() {
        if (!this.achievementSystem) return;

        // Listen to achievement system events to update progress bar
        this.achievementSystem.on('onAchievementUnlock', () => {
            console.log('🎉 Achievement unlocked - updating progress bar');
            this.updateLevelProgressBar();
        });

        this.achievementSystem.on('onLevelUp', (data) => {
            console.log('⬆️ Level up - updating progress bar', data);
            this.updateLevelProgressBar();
        });

        // Also update on progress changes
        this.achievementSystem.on('onProgressUpdate', () => {
            this.updateLevelProgressBar();
        });

        // Track planting actions - this event exists
        this.farmSimulation.on('cropPlanted', (data) => {
            const farmState = this.farmSimulation.getFarmState();
            const ndvi = farmState.environmentalData?.ndvi || 0.7;

            this.achievementSystem.trackPlantingSuccess(
                ndvi,
                'optimal',
                true
            );
            console.log('🌱 Tracked planting action for Seed Master achievement');
        });

        // Track harvest - check for harvestReady event
        this.farmSimulation.on('harvestReady', (data) => {
            this.achievementSystem.trackAction('yield_increase', 100);
            console.log('🌾 Tracked harvest for Harvest Hero achievement');
        });

        // Track environmental updates
        this.farmSimulation.on('environmentalDataApplied', (data) => {
            this.achievementSystem.trackNASADataUsage(['SMAP', 'MODIS', 'Landsat']);
            console.log('🛰️ Tracked NASA data usage for Satellite Sage achievement');
        });

        // Track season changes for climate adaptation
        this.farmSimulation.on('seasonChanged', (data) => {
            this.achievementSystem.trackAction('climate_adaptation', 1);
            console.log('🌍 Tracked climate adaptation for Climate Guardian achievement');
        });

        // Note: Irrigation tracking is done directly in irrigateAllCrops and waterCrop methods

        console.log('🏆 Farm Game achievement tracking configured');
    }

    /**
     * Update mixed achievements grid with NASA and Farm achievements
     */
    updateMixedAchievementsGrid(farmState) {
        const achievementsGrid = document.getElementById('achievementsGrid');
        if (!achievementsGrid) return;

        const allAchievements = [];

        // Add NASA Achievements if available
        if (this.achievementSystem) {
            const nasaAchievements = this.achievementSystem.getAllAchievements();
            nasaAchievements.forEach(achievement => {
                const progress = this.achievementSystem.getAchievementProgress(achievement.id);
                const progressPercent = progress.completed ? 100 :
                    (progress.progress / progress.maxProgress) * 100;

                allAchievements.push({
                    name: achievement.name,
                    description: achievement.description,
                    icon: achievement.icon,
                    progress: progressPercent,
                    unlocked: progressPercent > 0,
                    progressText: `Level ${achievement.currentLevel}/${achievement.levels.length}`,
                    category: 'nasa'
                });
            });
        }

        // Add Farm-specific achievements
        const farmAchievements = this.getAchievements(farmState);
        allAchievements.push(...farmAchievements);

        // Render all achievements
        achievementsGrid.innerHTML = allAchievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                </div>
                <div class="achievement-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                    </div>
                    <span class="progress-text">${achievement.progressText || `${Math.round(achievement.progress)}%`}</span>
                </div>
                ${achievement.progress >= 100 ? '<div class="achievement-badge">✓</div>' : ''}
            </div>
        `).join('');
    }

    /**
     * Update NASA player level in score display
     */
    updateNASAPlayerLevel() {
        if (!this.achievementSystem) return;

        const playerLevel = this.achievementSystem.getPlayerLevel();
        const levelElement = document.getElementById('playerLevel');
        const titleElement = document.getElementById('playerTitle');

        if (levelElement) {
            levelElement.textContent = playerLevel.level;
        }
        if (titleElement) {
            titleElement.textContent = playerLevel.title;
        }
    }

    /**
     * Update NASA Achievement display
     */
    updateNASAAchievements() {
        if (!this.achievementSystem) return;

        const grid = document.getElementById('nasaAchievementsGrid');
        if (!grid) return;

        const achievements = this.achievementSystem.getAllAchievements();

        grid.innerHTML = achievements.map(achievement => {
            const progress = this.achievementSystem.getAchievementProgress(achievement.id);
            const isCompleted = achievement.currentLevel === achievement.levels.length;
            const progressPercent = progress.completed ? 100 : (progress.progress / progress.maxProgress) * 100;

            return `
                <div class="achievement-card ${isCompleted ? 'completed' : ''}" onclick="farmGameUI.showAchievementDetails('${achievement.id}')">
                    <div class="achievement-header">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-info">
                            <h4>${achievement.name}</h4>
                            <p>${achievement.description}</p>
                        </div>
                    </div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>Level ${achievement.currentLevel}/${achievement.levels.length}</span>
                            <span>${progress.completed ? 'MASTERED!' : `${progress.totalProgress}/${progress.nextRequirement || 'Max'}`}</span>
                        </div>
                    </div>
                    ${isCompleted ? '<div class="completion-badge">MASTERED</div>' : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Update player level display
     */
    updatePlayerLevel() {
        if (!this.achievementSystem) return;

        const playerLevel = this.achievementSystem.getPlayerLevel();
        const totalPoints = this.achievementSystem.getTotalPoints();

        const levelElement = document.getElementById('playerLevelTitle');
        const pointsElement = document.getElementById('totalAchievementPoints');

        if (levelElement) {
            levelElement.textContent = `Level ${playerLevel.level}: ${playerLevel.title}`;
        }

        if (pointsElement) {
            pointsElement.textContent = `${totalPoints.toLocaleString()} pts`;
        }
    }

    /**
     * Filter achievements by category
     */
    filterAchievements(category) {
        // Update active button
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Filter achievements
        if (!this.achievementSystem) return;

        const grid = document.getElementById('nasaAchievementsGrid');
        if (!grid) return;

        const achievements = category === 'all'
            ? this.achievementSystem.getAllAchievements()
            : this.achievementSystem.getAchievementsByCategory(category);

        // Reuse the same rendering logic
        grid.innerHTML = achievements.map(achievement => {
            const progress = this.achievementSystem.getAchievementProgress(achievement.id);
            const isCompleted = achievement.currentLevel === achievement.levels.length;
            const progressPercent = progress.completed ? 100 : (progress.progress / progress.maxProgress) * 100;

            return `
                <div class="achievement-card ${isCompleted ? 'completed' : ''}" onclick="farmGameUI.showAchievementDetails('${achievement.id}')">
                    <div class="achievement-header">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-info">
                            <h4>${achievement.name}</h4>
                            <p>${achievement.description}</p>
                        </div>
                    </div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>Level ${achievement.currentLevel}/${achievement.levels.length}</span>
                            <span>${progress.completed ? 'MASTERED!' : `${progress.totalProgress}/${progress.nextRequirement || 'Max'}`}</span>
                        </div>
                    </div>
                    ${isCompleted ? '<div class="completion-badge">MASTERED</div>' : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Show detailed achievement modal
     */
    showAchievementDetails(achievementId) {
        if (!this.achievementSystem || !this.achievementUI) return;

        // Use the existing AchievementUI modal functionality
        this.achievementUI.showAchievementDetails(achievementId);
    }

    /**
     * Update progress statistics
     */
    updateProgressStats(farmState) {
        const statsElement = document.getElementById('progressStats');
        if (!statsElement) return;

        const stats = farmState.playerStats || {};

        statsElement.innerHTML = `
            <div class="stat-card">
                <h6>🌱 Farm Operations</h6>
                <p>Crops Planted: ${stats.totalCropsPlanted || 0}</p>
                <p>Harvest Count: ${stats.totalHarvests || 0}</p>
                <p>Livestock Actions: ${stats.livestockActions || 0}</p>
            </div>
            <div class="stat-card">
                <h6>🛰️ NASA Data Usage</h6>
                <p>Data Queries: ${stats.nasaDataChecks || 0}</p>
                <p>Satellite Decisions: ${stats.satelliteDecisions || 0}</p>
                <p>Environmental Adaptations: ${stats.climateAdaptations || 0}</p>
            </div>
            <div class="stat-card">
                <h6>🎯 Performance</h6>
                <p>Average Yield: ${((stats.totalYield || 0) / Math.max(stats.totalHarvests || 1, 1)).toFixed(1)} bu/ha</p>
                <p>Water Efficiency: ${((stats.waterEfficiency || 0) * 100).toFixed(0)}%</p>
                <p>Sustainability Score: ${stats.sustainabilityScore || 0}</p>
            </div>
        `;
    }
}

export { FarmGameUI };