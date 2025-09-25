/**
 * NASA Farm Navigators - Farm Simulation Engine
 * Core gameplay mechanics for agricultural decision-making simulation
 */

/**
 * NASA Real-Time Data Service is loaded via HTML script tag
 * Available as window.NASARealTimeService
 */

class FarmSimulationEngine {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.farmState = this.initializeFarmState();
        this.gameTimer = null;
        this.listeners = new Map();

        // Initialize NASA Data Service for satellite data integration
        this.nasaDataService = null;
        this.initializeNASADataService();

        // Game configuration
        this.config = {
            timeSpeed: 1000, // 1 real second = 1 game hour
            hoursPerDay: 24,
            daysPerWeek: 7,
            weeksPerSeason: 13,
            seasonsPerYear: 4
        };

        // Crop growth stages - comprehensive data for all crop types
        this.cropStages = this.getComprehensiveCropStages();

        // Environmental factors
        this.weatherPatterns = {
            spring: { temp_range: [10, 20], rain_probability: 0.4, growth_modifier: 1.2 },
            summer: { temp_range: [20, 35], rain_probability: 0.2, growth_modifier: 1.0 },
            fall: { temp_range: [5, 18], rain_probability: 0.5, growth_modifier: 0.8 },
            winter: { temp_range: [-5, 8], rain_probability: 0.3, growth_modifier: 0.3 }
        };

        // Initialize farm type-based land sizes
        this.setFarmTypeLandSize();
    }

    initializeFarmState() {
        return {
            // Time tracking
            currentWeek: 1,
            currentSeason: 'spring',
            currentYear: 1,
            gameStartTime: Date.now(),

            // Farm properties - will be set based on farm type
            farmSize: 100, // hectares - total farm size (will be updated by setFarmTypeLandSize)
            availableLand: 100, // hectares - currently available for planting
            totalLand: 100, // hectares - total farm land including recovering land
            farmType: 'smallholder', // smallholder, industrial, organic
            location: null, // Must be set by user

            // NASA Satellite Data Integration
            environmentalData: {
                soilMoisture: 0.5, // SMAP data (0.0 - 1.0)
                vegetationHealth: 0.5, // NDVI data (-1.0 - 1.0)
                waterConsumptionMultiplier: 1.0, // Dynamic based on SMAP
                nutrientConsumptionMultiplier: 1.0, // Dynamic based on NDVI
                lastUpdated: Date.now(),
                dataQuality: 'initializing'
            },

            // Land recovery system
            deadLandPlots: [], // { area: number, deathTime: timestamp, recoveryTime: timestamp }
            harvestedLandPlots: [], // { area: number, harvestTime: timestamp, recoveryTime: timestamp, cropType: string }

            // Resources
            resources: {
                water: 100,
                fertilizer: 50,
                seeds: 30,
                money: 10000,
                fuel: 80
            },

            // Harvested crops inventory - dynamic object that grows as crops are harvested
            harvestedCrops: {},

            // Crops - will be populated based on location and satellite data
            crops: [],

            // Livestock (simplified)
            livestock: {
                cattle: { count: 20, health: 0.9, feed_level: 0.8 },
                sheep: { count: 35, health: 0.87, feed_level: 0.75 },
                chickens: { count: 100, health: 0.85, feed_level: 0.7 }
            },

            // Player stats
            playerStats: {
                totalScore: 0,
                decisionsCount: 0,
                successfulDecisions: 0,
                totalYield: 0,
                totalProfit: 0,
                sustainabilityScore: 100,
                // Achievement tracking
                cropScore: 0,
                livestockScore: 0,
                waterScore: 0,
                nasaScore: 0,
                nasaAlignments: 0,
                waterEfficiency: 0.5,
                livestockHealthWeeks: 0
            },

            // Decision history
            decisions: [],

            // Current challenges/alerts
            activeAlerts: [],

            // NASA data integration
            satelliteData: {
                lastUpdate: null,
                soilMoisture: null,
                ndvi: null,
                temperature: null,
                precipitation: null
            }
        };
    }

    /**
     * Start the game simulation
     */
    startSimulation() {
        console.log('🚜 Starting Farm Simulation...');

        // Clear any existing timer - time advancement is now controlled by UI
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }

        // Time advancement is now controlled by FarmGameUI's speed system
        // This method now just marks simulation as ready
        console.log('⏰ Time advancement controlled by UI speed system');
        this.emit('simulationStarted', this.farmState);
    }

    /**
     * Pause the simulation
     */
    pauseSimulation() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        this.emit('simulationPaused', this.farmState);
    }

    /**
     * Advance game time by one hour
     */
    advanceTime() {
        const hoursPerWeek = this.config.hoursPerDay * this.config.daysPerWeek;
        const currentHour = Math.floor((Date.now() - this.farmState.gameStartTime) / this.config.timeSpeed);

        // Calculate current week and season
        const weekProgress = Math.floor(currentHour / hoursPerWeek) + 1;
        const previousSeason = this.farmState.currentSeason;

        if (weekProgress > this.farmState.currentWeek) {
            this.farmState.currentWeek = weekProgress;
            this.processWeeklyUpdate();
        }

        // Update season based on week
        const seasonWeek = ((this.farmState.currentWeek - 1) % 52) + 1;
        const previousSeasonName = this.farmState.currentSeason;

        if (seasonWeek <= 13) this.farmState.currentSeason = 'spring';
        else if (seasonWeek <= 26) this.farmState.currentSeason = 'summer';
        else if (seasonWeek <= 39) this.farmState.currentSeason = 'fall';
        else this.farmState.currentSeason = 'winter';

        // Check for season change and trigger seasonal events
        if (previousSeasonName !== this.farmState.currentSeason) {
            this.processSeasonChange(previousSeasonName, this.farmState.currentSeason);
        }

        // Update year based on season cycles
        const newYear = Math.floor((this.farmState.currentWeek - 1) / 52) + 1;
        if (newYear > this.farmState.currentYear) {
            this.farmState.currentYear = newYear;
            this.processYearChange();
        }

        // Process daily updates (every 24 game hours)
        const dayOfWeek = Math.floor((currentHour % hoursPerWeek) / this.config.hoursPerDay) + 1;
        const previousDay = this.farmState.currentDay || 1;
        this.farmState.currentDay = dayOfWeek;

        if (dayOfWeek !== previousDay) {
            this.processDailyUpdate();
        }

        // Update environmental data every 3 days (more realistic for satellite data)
        // Real NASA data: SMAP every 2-3 days, NDVI every 8-16 days
        if (this.farmState.currentWeek % 1 === 0 && currentHour === 0) { // Once per week
            this.updateEnvironmentalData();
        }

        // Always update crops on every time advance for real-time feedback
        this.updateCropGrowth();

        // Emit time update
        this.emit('timeAdvanced', {
            week: this.farmState.currentWeek,
            season: this.farmState.currentSeason,
            year: this.farmState.currentYear,
            day: dayOfWeek,
            hour: currentHour % 24
        });
    }

    /**
     * Process weekly farm updates
     */
    processWeeklyUpdate() {
        console.log(`📅 Week ${this.farmState.currentWeek} - ${this.farmState.currentSeason} (Year ${this.farmState.currentYear})`);

        // Update crop growth
        this.updateCropGrowth();

        // Update environmental conditions
        this.updateEnvironmentalConditions();

        // Process weekly market fluctuations
        this.updateMarketPrices();

        // Check for random events and challenges
        this.checkForRandomEvents();

        // Check for scheduled alerts and challenges
        this.checkForAlerts();

        // Update livestock
        this.updateLivestock();

        // Calculate weekly costs and income
        this.calculateWeeklyCosts();
        this.calculateWeeklyIncome();

        // Update seasonal progression milestones
        this.checkSeasonalMilestones();

        // Generate weekly summary
        this.generateWeeklySummary();

        this.emit('weeklyUpdate', this.farmState);
    }

    /**
     * Process season change events
     */
    processSeasonChange(previousSeason, newSeason) {
        console.log(`🌱 Season changed from ${previousSeason} to ${newSeason}`);

        // Seasonal transition events
        const seasonEvents = this.getSeasonalEvents(newSeason);

        seasonEvents.forEach(event => {
            this.farmState.seasonalEvents = this.farmState.seasonalEvents || [];
            this.farmState.seasonalEvents.push({
                ...event,
                week: this.farmState.currentWeek,
                season: newSeason
            });
        });

        // Update seasonal modifiers
        this.updateSeasonalModifiers(newSeason);

        // Trigger seasonal activities
        this.triggerSeasonalActivities(newSeason);

        this.emit('seasonChanged', {
            previousSeason,
            newSeason,
            events: seasonEvents,
            week: this.farmState.currentWeek
        });
    }

    /**
     * Process yearly progression
     */
    processYearChange() {
        console.log(`🎊 New Year! Starting Year ${this.farmState.currentYear}`);

        // Calculate annual performance metrics
        const yearlyMetrics = this.calculateYearlyMetrics();

        // Reset seasonal progress
        this.farmState.seasonalProgress = {
            spring: { completed: false, milestones: [] },
            summer: { completed: false, milestones: [] },
            fall: { completed: false, milestones: [] },
            winter: { completed: false, milestones: [] }
        };

        // Apply yearly improvements based on experience
        this.applyYearlyImprovements();

        this.emit('yearChanged', {
            year: this.farmState.currentYear,
            metrics: yearlyMetrics,
            week: this.farmState.currentWeek
        });
    }

    /**
     * Process daily updates
     */
    processDailyUpdate() {
        // Daily weather changes
        this.updateDailyWeather();

        // Daily resource consumption
        this.processDailyResourceConsumption();

        // Update crop growth and natural consumption
        this.updateCropGrowth();

        // Check for urgent alerts
        this.checkUrgentAlerts();

        this.emit('dailyUpdate', {
            day: this.farmState.currentDay,
            week: this.farmState.currentWeek,
            weather: this.farmState.currentWeather
        });
    }

    /**
     * Update crop growth and health
     */
    updateCropGrowth() {
        this.farmState.crops.forEach(crop => {
            const cropConfig = this.cropStages[crop.type];
            if (!cropConfig) {
                console.warn(`No crop stages found for ${crop.type}, using default`);
                return; // Skip this crop if no config
            }
            const currentStageConfig = cropConfig[crop.current_stage];

            if (currentStageConfig) {
                // Calculate growth progress
                const weeksSincePlanting = this.farmState.currentWeek - crop.planted_week;
                const waterFactor = Math.min(crop.water_level / currentStageConfig.water_need, 1.0);
                const nutrientFactor = Math.min(crop.nutrient_level / currentStageConfig.nutrient_need, 1.0);
                const seasonalModifier = this.weatherPatterns[this.farmState.currentSeason].growth_modifier;

                // Update growth progress
                const growthIncrement = (waterFactor * nutrientFactor * seasonalModifier) * 0.1;
                crop.growth_progress = Math.min(crop.growth_progress + growthIncrement, 1.0);

                // Update health based on conditions
                const newHealth = (waterFactor + nutrientFactor) / 2;
                const oldHealth = crop.health;
                crop.health = newHealth;

                // Log health changes for debugging
                if (Math.abs(oldHealth - newHealth) > 0.1) {
                    console.log(`🌱 ${crop.type} health: ${oldHealth.toFixed(2)} → ${newHealth.toFixed(2)} (water: ${crop.water_level.toFixed(2)}, nutrients: ${crop.nutrient_level.toFixed(2)})`);
                }

                // Check for stage advancement
                if (crop.growth_progress >= 1.0) {
                    this.advanceCropStage(crop);
                }

                // Decrease water and nutrients over time with NASA satellite data influence
                const waterMultiplier = this.farmState.environmentalData.waterConsumptionMultiplier;
                const nutrientMultiplier = this.farmState.environmentalData.nutrientConsumptionMultiplier;

                // Base consumption rates adjusted by NASA SMAP/NDVI data and satellite configuration
                const satelliteWaterMultiplier = this.farmState.environmentalData.waterConsumptionMultiplier || 1.0;
                const waterConsumption = 0.02 * waterMultiplier * satelliteWaterMultiplier;
                const nutrientConsumption = 0.01 * nutrientMultiplier;

                crop.water_level = Math.max(crop.water_level - waterConsumption, 0);
                crop.nutrient_level = Math.max(crop.nutrient_level - nutrientConsumption, 0);

                // Check for crop death (only health at 0)
                if (crop.health <= 0) {
                    crop.isDead = true;
                    crop.deathTime = Date.now();
                    crop.deathCause = 'poor_health';

                    console.log(`💀 CROP DEATH DETECTED: ${crop.type} died from ${crop.deathCause}! Water: ${crop.water_level.toFixed(2)}, Nutrients: ${crop.nutrient_level.toFixed(2)}, Health: ${crop.health.toFixed(2)}`);
                }
            }
        });

        // Remove dead crops and make their land unavailable for 20 minutes
        this.processCropDeaths();
    }

    /**
     * Process crop deaths and land recovery
     */
    processCropDeaths() {
        const deadCrops = this.farmState.crops.filter(crop => crop.isDead);

        if (deadCrops.length > 0) {
            console.log(`💀 Processing ${deadCrops.length} dead crops...`);
        }

        deadCrops.forEach(crop => {
            console.log(`💀 Crop died: ${crop.type} (${crop.area}ha) - Cause: ${crop.deathCause}`);
            // Add dead land to recovery system (20 minutes = 1200000ms)
            const recoveryTime = Date.now() + (20 * 60 * 1000);
            this.farmState.deadLandPlots.push({
                area: crop.area,
                deathTime: crop.deathTime,
                recoveryTime: recoveryTime,
                previousCrop: crop.type,
                deathCause: crop.deathCause
            });

            // Reduce available land
            this.farmState.availableLand = Math.max(0, this.farmState.availableLand - crop.area);

            // Emit death event
            this.emit('cropDied', {
                crop: crop,
                cause: crop.deathCause,
                landLost: crop.area,
                availableLand: this.farmState.availableLand
            });
        });

        // Remove dead crops from active crops
        this.farmState.crops = this.farmState.crops.filter(crop => !crop.isDead);

        // Check for recovered land
        this.processLandRecovery();
    }

    /**
     * Check and process land recovery (both dead and harvested land)
     */
    processLandRecovery() {
        const now = Date.now();

        // Process dead land recovery (20 minutes)
        const recoveredDeadPlots = this.farmState.deadLandPlots.filter(plot => now >= plot.recoveryTime);

        recoveredDeadPlots.forEach(plot => {
            // Restore land
            this.farmState.availableLand = Math.min(
                this.farmState.farmSize,
                this.farmState.availableLand + plot.area
            );

            console.log(`🌱 Dead land recovered: +${plot.area}ha (was dead for ${((now - plot.deathTime) / 60000).toFixed(1)} minutes)`);

            // Emit recovery event
            this.emit('landRecovered', {
                area: plot.area,
                totalAvailable: this.farmState.availableLand,
                recoveryType: 'death',
                recoveryDuration: '20 minutes'
            });
        });

        // Process harvested land recovery (10 minutes)
        const recoveredHarvestedPlots = this.farmState.harvestedLandPlots.filter(plot => now >= plot.recoveryTime);

        recoveredHarvestedPlots.forEach(plot => {
            // Restore land
            this.farmState.availableLand = Math.min(
                this.farmState.farmSize,
                this.farmState.availableLand + plot.area
            );

            console.log(`🌾 Harvested land recovered: +${plot.area}ha (from ${plot.cropType}, rested for ${((now - plot.harvestTime) / 60000).toFixed(1)} minutes)`);

            // Emit recovery event
            this.emit('landRecovered', {
                area: plot.area,
                totalAvailable: this.farmState.availableLand,
                recoveryType: 'harvest',
                recoveryDuration: '10 minutes',
                cropType: plot.cropType
            });
        });

        // Remove recovered plots from both lists
        this.farmState.deadLandPlots = this.farmState.deadLandPlots.filter(
            plot => now < plot.recoveryTime
        );
        this.farmState.harvestedLandPlots = this.farmState.harvestedLandPlots.filter(
            plot => now < plot.recoveryTime
        );
    }

    /**
     * Advance crop to next growth stage
     */
    advanceCropStage(crop) {
        const cropConfig = this.cropStages[crop.type];
        if (!cropConfig) {
            console.warn(`No crop stages found for ${crop.type}, cannot advance stage`);
            return;
        }
        const stages = Object.keys(cropConfig);
        const currentIndex = stages.indexOf(crop.current_stage);

        if (currentIndex < stages.length - 1) {
            crop.current_stage = stages[currentIndex + 1];
            crop.growth_progress = 0;

            this.emit('cropStageAdvanced', {
                cropType: crop.type,
                newStage: crop.current_stage,
                week: this.farmState.currentWeek
            });
        } else {
            // Crop is ready for harvest
            this.markCropForHarvest(crop);
        }
    }

    /**
     * Mark crop as ready for harvest
     */
    markCropForHarvest(crop) {
        crop.ready_for_harvest = true;
        this.farmState.activeAlerts.push({
            type: 'harvest_ready',
            message: `${crop.type} is ready for harvest! (${crop.area} hectares)`,
            urgency: 'medium',
            week: this.farmState.currentWeek
        });

        this.emit('harvestReady', { crop, week: this.farmState.currentWeek });
    }

    /**
     * Player decision: Irrigate crops
     */
    irrigateCrops(cropType, amount = 'medium') {
        const waterCost = {
            light: { cost: 10, effectiveness: 0.3 },
            medium: { cost: 25, effectiveness: 0.6 },
            heavy: { cost: 50, effectiveness: 1.0 }
        };

        const irrigation = waterCost[amount];

        if (this.farmState.resources.water < irrigation.cost) {
            return this.createDecisionResult(false, 'Insufficient water reserves!', 0);
        }

        // Apply irrigation to crops
        this.farmState.crops
            .filter(crop => !cropType || crop.type === cropType)
            .forEach(crop => {
                crop.water_level = Math.min(crop.water_level + irrigation.effectiveness, 1.0);
            });

        // Deduct resources
        this.farmState.resources.water -= irrigation.cost;
        this.farmState.resources.money -= irrigation.cost * 2; // Operating costs

        // Record decision
        const decision = {
            type: 'irrigation',
            week: this.farmState.currentWeek,
            amount: amount,
            cost: irrigation.cost,
            cropType: cropType || 'all'
        };

        this.recordDecision(decision);

        return this.createDecisionResult(true,
            `Applied ${amount} irrigation to ${cropType || 'all crops'}`,
            this.calculateDecisionScore(decision)
        );
    }

    /**
     * Player decision: Apply fertilizer
     */
    applyFertilizer(cropType, fertilizerType = 'balanced') {
        const fertilizerCost = {
            nitrogen: { cost: 30, nutrient_boost: 0.8, money_cost: 150 },
            phosphorus: { cost: 25, nutrient_boost: 0.6, money_cost: 120 },
            balanced: { cost: 35, nutrient_boost: 0.7, money_cost: 180 }
        };

        const fertilizer = fertilizerCost[fertilizerType];

        if (this.farmState.resources.fertilizer < fertilizer.cost) {
            return this.createDecisionResult(false, 'Insufficient fertilizer!', 0);
        }

        if (this.farmState.resources.money < fertilizer.money_cost) {
            return this.createDecisionResult(false, 'Insufficient funds for fertilizer!', 0);
        }

        // Apply fertilizer to crops
        this.farmState.crops
            .filter(crop => !cropType || crop.type === cropType)
            .forEach(crop => {
                crop.nutrient_level = Math.min(crop.nutrient_level + fertilizer.nutrient_boost, 1.0);
            });

        // Deduct resources
        this.farmState.resources.fertilizer -= fertilizer.cost;
        this.farmState.resources.money -= fertilizer.money_cost;

        const decision = {
            type: 'fertilization',
            week: this.farmState.currentWeek,
            fertilizerType: fertilizerType,
            cost: fertilizer.cost,
            cropType: cropType || 'all'
        };

        this.recordDecision(decision);

        return this.createDecisionResult(true,
            `Applied ${fertilizerType} fertilizer to ${cropType || 'all crops'}`,
            this.calculateDecisionScore(decision)
        );
    }

    /**
     * Player decision: Harvest crop
     */
    harvestCrop(cropType) {
        const cropToHarvest = this.farmState.crops.find(crop =>
            crop.type === cropType && crop.ready_for_harvest
        );

        if (!cropToHarvest) {
            return this.createDecisionResult(false, 'Crop not ready for harvest!', 0);
        }

        // Calculate yield based on health and area (bushels per hectare)
        const baseYield = {
            // Default crops
            wheat: 60,
            corn: 180,
            tomatoes: 400,
            carrots: 350,

            // Tropical crops
            rice: 70,
            sugarcane: 800,
            banana: 200,
            coffee: 15,

            // Temperate crops
            soybean: 45,
            soybeans: 45, // alias for soybean
            potato: 450,

            // Arid/Desert crops
            sorghum: 55,
            millet: 50,
            dates: 40,
            cactus: 100,

            // High precipitation crops
            tea: 25,
            cocoa: 20,

            // Cold climate crops
            barley: 65,
            oats: 58,
            rye: 55,

            // Specialty crops
            vegetables: 300,
            fruits: 150
        };

        // Fallback yield for unknown crop types
        const yieldPerHectare = baseYield[cropType] || 100; // Default 100 bushels per hectare
        const harvestYield = yieldPerHectare * cropToHarvest.area * cropToHarvest.health;
        const marketPrice = this.getMarketPrice(cropType);
        const revenue = harvestYield * marketPrice;
        const harvestCost = cropToHarvest.area * 50; // Cost per hectare

        // Store harvested crops in inventory instead of immediately selling
        if (!this.farmState.harvestedCrops) {
            this.farmState.harvestedCrops = {};
        }

        // Initialize crop type if it doesn't exist
        if (!this.farmState.harvestedCrops[cropType]) {
            this.farmState.harvestedCrops[cropType] = 0;
        }

        this.farmState.harvestedCrops[cropType] += harvestYield;
        console.log(`📦 Added ${harvestYield} ${cropType} to inventory. Total: ${this.farmState.harvestedCrops[cropType]}`);
        this.farmState.playerStats.totalYield += harvestYield;

        // Pay harvest cost
        this.farmState.resources.money -= harvestCost;

        // Remove harvested crop from field
        this.farmState.crops = this.farmState.crops.filter(crop => crop !== cropToHarvest);

        // Add harvested land to recovery system (10 minutes = 600000ms)
        // Land needs time to rest and be prepared for next planting
        const recoveryTime = Date.now() + (10 * 60 * 1000);
        this.farmState.harvestedLandPlots.push({
            area: cropToHarvest.area,
            harvestTime: Date.now(),
            recoveryTime: recoveryTime,
            cropType: cropType
        });

        console.log(`🌾 Harvested ${cropType} (${cropToHarvest.area}ha) - Land added to recovery system`);
        console.log(`⏱️ Land will be available in 10 minutes`);
        console.log(`📍 Available land: ${this.farmState.availableLand}/${this.farmState.farmSize} hectares`);

        const decision = {
            type: 'harvest',
            week: this.farmState.currentWeek,
            cropType: cropType,
            yield: harvestYield,
            cost: harvestCost
        };

        this.recordDecision(decision);

        return this.createDecisionResult(true,
            `Harvested ${harvestYield.toFixed(1)} bushels of ${cropType}. Cost: $${harvestCost.toFixed(0)}. Ready to sell!`,
            this.calculateDecisionScore(decision)
        );
    }

    /**
     * Player decision: Sell harvested crops
     */
    sellProduce(cropType, amount) {
        if (!this.farmState.harvestedCrops) {
            this.farmState.harvestedCrops = {};
        }

        // Initialize crop type if it doesn't exist
        if (!this.farmState.harvestedCrops[cropType]) {
            this.farmState.harvestedCrops[cropType] = 0;
        }

        const availableAmount = this.farmState.harvestedCrops[cropType] || 0;

        if (availableAmount <= 0) {
            return this.createDecisionResult(false, `No ${cropType} available to sell!`, 0);
        }

        // Limit sell amount to available inventory
        const sellAmount = Math.min(amount, availableAmount);

        // Calculate revenue
        const marketPrice = this.getMarketPrice(cropType);
        const revenue = sellAmount * marketPrice;

        // Update inventory and money
        this.farmState.harvestedCrops[cropType] -= sellAmount;
        this.farmState.resources.money += revenue;
        this.farmState.playerStats.totalProfit += revenue;

        // Record decision
        const decision = {
            type: 'sell_produce',
            week: this.farmState.currentWeek,
            cropType: cropType,
            amount: sellAmount,
            revenue: revenue,
            marketPrice: marketPrice
        };

        this.recordDecision(decision);

        return this.createDecisionResult(true,
            `Sold ${sellAmount.toFixed(1)} bushels of ${cropType} for $${revenue.toFixed(0)} ($${marketPrice.toFixed(2)}/bushel)`,
            this.calculateDecisionScore(decision)
        );
    }

    /**
     * Player decision: Plant new crop
     */
    plantCrop(cropType, area = null) {
        // Update land recovery first
        this.processLandRecovery();

        // Get comprehensive crop costs and data
        const cropCosts = this.getComprehensiveCropCosts();
        const costPerHectare = cropCosts[cropType] || 50;

        // Crop data configuration
        const cropData = this.getComprehensiveCropConfig();

        const cropConfig = cropData[cropType] || { emoji: '🌾', defaultArea: 15 };
        const plantingArea = area || cropConfig.defaultArea;

        // Check if requested area is available
        if (plantingArea > this.farmState.availableLand) {
            return this.createDecisionResult(false,
                `Not enough available land! Requested: ${plantingArea} hectares, Available: ${this.farmState.availableLand} hectares`, 0);
        }

        // Calculate total cost based on area
        const totalCost = costPerHectare * (plantingArea / cropConfig.defaultArea);

        // Check if player has enough money
        if (this.farmState.resources.money < totalCost) {
            return this.createDecisionResult(false,
                `Not enough money to plant ${plantingArea} hectares of ${cropType}. Need $${totalCost.toFixed(0)}, have $${this.farmState.resources.money.toFixed(0)}`, 0);
        }

        // Deduct cost and reduce available land
        this.farmState.resources.money -= totalCost;
        this.farmState.availableLand -= plantingArea;

        // Get the correct first stage for this crop type
        const cropStageConfig = this.cropStages[cropType];
        const firstStage = cropStageConfig ? Object.keys(cropStageConfig)[0] : 'germination';

        // Create new crop with complete data structure
        const newCrop = {
            type: cropType,
            emoji: cropConfig.emoji,
            area: plantingArea,
            planted_week: this.farmState.currentWeek,
            current_stage: firstStage,
            health: 1.0,
            growth_progress: 0.0,
            water_level: 0.8,
            nutrient_level: 0.5,
            pest_pressure: 0.0,
            disease_risk: 0.0,
            ready_for_harvest: false
        };

        // Add crop to farm state
        this.farmState.crops.push(newCrop);

        // Record decision
        const decision = {
            type: 'planting',
            week: this.farmState.currentWeek,
            cropType: cropType,
            area: plantingArea,
            cost: totalCost
        };

        this.recordDecision(decision);

        // Emit event
        this.emit('cropPlanted', {
            crop: newCrop,
            week: this.farmState.currentWeek,
            availableLand: this.farmState.availableLand
        });

        return this.createDecisionResult(true,
            `Successfully planted ${cropType} on ${plantingArea} hectares. Cost: $${totalCost.toFixed(0)}. Available land: ${this.farmState.availableLand} hectares`,
            this.calculateDecisionScore(decision)
        );
    }

    /**
     * Update environmental conditions based on NASA data
     */
    updateEnvironmentalConditions() {
        // Simulate environmental changes or use real NASA data
        const weather = this.weatherPatterns[this.farmState.currentSeason];

        // Simulate rainfall
        if (Math.random() < weather.rain_probability) {
            const rainfall = Math.random() * 30; // mm
            this.farmState.crops.forEach(crop => {
                crop.water_level = Math.min(crop.water_level + (rainfall / 100), 1.0);
            });

            this.farmState.activeAlerts.push({
                type: 'weather',
                message: `Rainfall: ${rainfall.toFixed(1)}mm - crops received natural irrigation`,
                urgency: 'low',
                week: this.farmState.currentWeek
            });
        }

        // Check for drought conditions
        const avgWaterLevel = this.farmState.crops.reduce((sum, crop) => sum + crop.water_level, 0) / this.farmState.crops.length;
        if (avgWaterLevel < 0.3) {
            this.farmState.activeAlerts.push({
                type: 'drought',
                message: 'Drought conditions detected! Consider irrigation.',
                urgency: 'high',
                week: this.farmState.currentWeek
            });
        }
    }

    /**
     * Check for alerts and challenges
     */
    checkForAlerts() {
        // Clear old alerts (older than 2 weeks)
        this.farmState.activeAlerts = this.farmState.activeAlerts.filter(
            alert => this.farmState.currentWeek - alert.week < 2
        );

        // Check for low resources
        Object.entries(this.farmState.resources).forEach(([resource, amount]) => {
            if (amount < 20 && resource !== 'money') {
                this.farmState.activeAlerts.push({
                    type: 'low_resource',
                    message: `Low ${resource} levels! Consider restocking.`,
                    urgency: 'medium',
                    week: this.farmState.currentWeek
                });
            }
        });
    }

    /**
     * Update livestock status
     */
    updateLivestock() {
        Object.entries(this.farmState.livestock).forEach(([animal, data]) => {
            // Decrease feed levels over time
            data.feed_level = Math.max(data.feed_level - 0.1, 0);

            // Health depends on feed level
            data.health = Math.min(data.feed_level + 0.1, 1.0);

            if (data.feed_level < 0.3) {
                this.farmState.activeAlerts.push({
                    type: 'livestock_feed',
                    message: `${animal} need feeding!`,
                    urgency: 'high',
                    week: this.farmState.currentWeek
                });
            }
        });
    }

    /**
     * Calculate weekly operating costs
     */
    calculateWeeklyCosts() {
        const operatingCosts = {
            farmMaintenance: 100,
            equipmentFuel: 50,
            livestock: Object.values(this.farmState.livestock).reduce((sum, animal) => sum + animal.count * 2, 0)
        };

        const totalCosts = Object.values(operatingCosts).reduce((sum, cost) => sum + cost, 0);
        this.farmState.resources.money -= totalCosts;

        if (this.farmState.resources.money < 0) {
            this.farmState.activeAlerts.push({
                type: 'financial',
                message: 'Running low on funds! Consider selling crops or livestock.',
                urgency: 'high',
                week: this.farmState.currentWeek
            });
        }
    }

    /**
     * Get current market price for crops
     */
    getMarketPrice(cropType) {
        const basePrices = {
            corn: 5.5,
            wheat: 8.2,
            soybeans: 12.8,
            rye: 7.5,
            barley: 6.8,
            oats: 6.2,
            rice: 9.5,
            sugarcane: 4.2,
            banana: 15.0,
            coffee: 25.0,
            sorghum: 5.8,
            millet: 6.5,
            dates: 35.0,
            cactus: 8.0,
            tea: 18.0,
            cocoa: 28.0,
            potato: 7.2,
            potatoes: 7.2,
            soybean: 12.8
        };
        const seasonalModifier = {
            spring: 1.1,
            summer: 0.9,
            fall: 1.3, // Harvest season premium
            winter: 1.0
        };

        const marketVolatility = 0.8 + (Math.random() * 0.4); // ±20% volatility
        const basePrice = basePrices[cropType] || 8.0; // Default price for unknown crops
        return basePrice * seasonalModifier[this.farmState.currentSeason] * marketVolatility;
    }

    /**
     * Record player decision for scoring
     */
    recordDecision(decision) {
        this.farmState.decisions.push({
            ...decision,
            timestamp: Date.now()
        });

        this.farmState.playerStats.decisionsCount++;
    }

    /**
     * Calculate decision score based on timing and effectiveness
     */
    calculateDecisionScore(decision) {
        let score = 50; // Base score

        // Timing bonus
        if (decision.type === 'irrigation') {
            const avgWaterLevel = this.farmState.crops.reduce((sum, crop) => sum + crop.water_level, 0) / this.farmState.crops.length;
            if (avgWaterLevel < 0.4) score += 30; // Good timing
            else if (avgWaterLevel > 0.8) score -= 20; // Wasteful
        }

        // Efficiency bonus
        if (decision.amount === 'medium' || decision.fertilizerType === 'balanced') {
            score += 20; // Balanced approach
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Create standardized decision result
     */
    createDecisionResult(success, message, score) {
        if (success) {
            this.farmState.playerStats.successfulDecisions++;
            this.farmState.playerStats.totalScore += score;
        }

        return {
            success,
            message,
            score,
            farmState: this.getFarmState()
        };
    }

    /**
     * Get current farm state
     */
    getFarmState() {
        return { ...this.farmState };
    }

    /**
     * Set farm type-based default land sizes
     */
    setFarmTypeLandSize() {
        const landSizes = {
            smallholder: {
                farmSize: 100,
                totalLand: 100,
                availableLand: 100
            },
            industrial: {
                farmSize: 500,
                totalLand: 500,
                availableLand: 500
            },
            organic: {
                farmSize: 250,
                totalLand: 250,
                availableLand: 250
            }
        };

        const currentType = this.farmState.farmType;
        const sizes = landSizes[currentType] || landSizes.smallholder;

        // Update farm state with appropriate land sizes
        this.farmState.farmSize = sizes.farmSize;
        this.farmState.totalLand = sizes.totalLand;
        this.farmState.availableLand = sizes.availableLand;

        console.log(`🏞️ Farm Type: ${currentType} | Land Size: ${sizes.totalLand} hectares`);
    }

    /**
     * Initialize NASA Data Service
     */
    async initializeNASADataService() {
        try {
            // Check if NASARealTimeService is available
            if (typeof window !== 'undefined' && window.NASARealTimeService) {
                this.nasaDataService = new window.NASARealTimeService();
                console.log('🛰️ NASA Real-Time Data Service initialized from window');

                // Initial data fetch
                await this.updateEnvironmentalData();
            } else {
                // Wait a bit for scripts to load, then try again
                setTimeout(async () => {
                    if (window.NASARealTimeService) {
                        this.nasaDataService = new window.NASARealTimeService();
                        console.log('🛰️ NASA Real-Time Data Service initialized after delay');
                        await this.updateEnvironmentalData();
                    } else {
                        console.warn('⚠️ NASARealTimeService not available, using mock data');
                        this.createMockNASAService();
                    }
                }, 2000);

                // Create temporary mock service until real service loads
                this.createMockNASAService();
            }
        } catch (error) {
            console.error('❌ Failed to initialize NASA Data Service:', error);
            this.createMockNASAService();
        }
    }

    createMockNASAService() {
        // Store realistic satellite state for gradual changes
        if (!this.mockSatelliteState) {
            this.mockSatelliteState = {
                soilMoisture: 0.5,
                ndvi: 0.6,
                temperature: 25,
                lastUpdate: Date.now()
            };
        }

        this.nasaDataService = {
            fetchRealTimeNDVI: async (lat, lon) => {
                // Gradual NDVI changes (±2% per update, realistic for vegetation)
                const change = (Math.random() - 0.5) * 0.04; // ±2% change
                this.mockSatelliteState.ndvi = Math.max(0.1, Math.min(0.9, this.mockSatelliteState.ndvi + change));

                console.log(`🛰️ NDVI Mock Data: ${this.mockSatelliteState.ndvi.toFixed(3)} (gradual change)`);

                return {
                    ndvi: this.mockSatelliteState.ndvi,
                    value: this.mockSatelliteState.ndvi,
                    timestamp: Date.now(),
                    quality: 'mock_realistic',
                    location: { lat, lon }
                };
            },
            fetchRealTimeSoilMoisture: async (lat, lon) => {
                // Gradual soil moisture changes (±5% per update)
                const moistureChange = (Math.random() - 0.5) * 0.1; // ±5% change
                this.mockSatelliteState.soilMoisture = Math.max(0.1, Math.min(0.9, this.mockSatelliteState.soilMoisture + moistureChange));

                // Seasonal temperature variation
                const season = this.farmState.currentSeason;
                let baseTempRange = { summer: [25, 35], spring: [15, 25], fall: [10, 20], winter: [0, 15] };
                let [minTemp, maxTemp] = baseTempRange[season] || [15, 25];
                const tempChange = (Math.random() - 0.5) * 2; // ±1°C change
                this.mockSatelliteState.temperature = Math.max(minTemp, Math.min(maxTemp, this.mockSatelliteState.temperature + tempChange));

                console.log(`🛰️ SMAP Mock Data: ${(this.mockSatelliteState.soilMoisture * 100).toFixed(1)}% (gradual change)`);

                return {
                    moisture: this.mockSatelliteState.soilMoisture,
                    soilMoisture: this.mockSatelliteState.soilMoisture,
                    surface_temperature: this.mockSatelliteState.temperature,
                    temperature: this.mockSatelliteState.temperature,
                    timestamp: Date.now(),
                    quality: 'mock_realistic',
                    location: { lat, lon }
                };
            }
        };
        console.log('🔧 Using mock NASA Real-Time Data Service');
    }

    /**
     * Update environmental data from NASA satellites
     */
    async updateEnvironmentalData() {
        if (!this.nasaDataService) {
            console.warn('⚠️ NASA Data Service not available');
            return;
        }

        try {
            const { lat, lon } = this.farmState.location;
            const currentDate = new Date().toISOString().split('T')[0];

            // Fetch real-time data from NASA services
            const [ndviData, soilData] = await Promise.all([
                this.nasaDataService.fetchRealTimeNDVI(lat, lon, currentDate),
                this.nasaDataService.fetchRealTimeSoilMoisture(lat, lon, currentDate)
            ]);

            // Calculate consumption multipliers based on real data
            const soilMoisture = soilData.moisture || soilData.soilMoisture || 0.5;
            const ndviValue = ndviData.ndvi || ndviData.value || 0.5;
            const temperature = soilData.surface_temperature || soilData.temperature || 25;

            // Water consumption: Lower soil moisture = higher consumption
            const waterMultiplier = Math.max(0.5, Math.min(2.5, 2.0 - (soilMoisture * 1.5)));

            // Nutrient consumption: Lower NDVI = higher consumption
            let nutrientMultiplier;
            if (ndviValue >= 0.7) {
                nutrientMultiplier = 0.6; // Healthy vegetation
            } else if (ndviValue >= 0.5) {
                nutrientMultiplier = 0.8;
            } else if (ndviValue >= 0.3) {
                nutrientMultiplier = 1.2;
            } else if (ndviValue >= 0.1) {
                nutrientMultiplier = 1.6;
            } else {
                nutrientMultiplier = 2.0; // Very stressed vegetation
            }

            // Update farm state with new environmental data
            this.farmState.environmentalData = {
                soilMoisture: soilMoisture,
                vegetationHealth: ndviValue,
                temperature: temperature,
                waterConsumptionMultiplier: waterMultiplier,
                nutrientConsumptionMultiplier: nutrientMultiplier,
                lastUpdated: Date.now(),
                dataQuality: `${soilData.quality || 'real'}/${ndviData.quality || 'real'}`
            };

            console.log('🌍 Environmental data updated from NASA:', {
                soilMoisture: `${(soilMoisture * 100).toFixed(1)}%`,
                ndvi: ndviValue.toFixed(3),
                temperature: `${temperature.toFixed(1)}°C`,
                waterMultiplier: `${waterMultiplier.toFixed(2)}x`,
                nutrientMultiplier: `${nutrientMultiplier.toFixed(2)}x`,
                dataQuality: `${soilData.quality || 'real'}/${ndviData.quality || 'real'}`,
                updateFrequency: 'Weekly (realistic for satellite data)'
            });

            // Emit environmental update event
            this.emit('environmentalUpdate', {
                environmentalData: this.farmState.environmentalData
            });

        } catch (error) {
            console.error('❌ Failed to update environmental data:', error);
        }
    }

    /**
     * Update farm location and refresh environmental data
     */
    async updateFarmLocation(lat, lon) {
        console.log(`🌍 Updating farm location to ${lat}, ${lon}`);

        this.farmState.location = { lat, lon };

        // Immediately update environmental data for the new location
        await this.updateEnvironmentalData();

        // Emit location update event
        this.emit('locationUpdated', {
            location: this.farmState.location,
            environmentalData: this.farmState.environmentalData
        });
    }

    /**
     * Apply environmental data from satellite sources
     */
    applyEnvironmentalData(data) {
        console.log('🛰️ Applying satellite environmental data to farm');

        // Update location if provided
        if (data.coordinates) {
            this.farmState.location = {
                lat: data.coordinates.lat,
                lon: data.coordinates.lon
            };
        }

        // Update water efficiency based on satellite data
        if (data.waterEfficiency) {
            const baseWaterRate = data.waterEfficiency.rate || 100;
            // Convert L/hour/hectare to consumption multiplier
            this.farmState.environmentalData.waterConsumptionMultiplier = baseWaterRate / 100;
            this.farmState.waterEfficiency = data.waterEfficiency;
            console.log(`💧 Water consumption rate updated: ${baseWaterRate} L/hour/hectare`);
        }

        // Update available crop varieties based on region
        if (data.availableCrops) {
            this.farmState.availableCrops = data.availableCrops;

            // Update crop stages for new crop types if needed
            data.availableCrops.forEach(crop => {
                if (!this.cropStages[crop.type]) {
                    // Add default stages for new crop types
                    this.cropStages[crop.type] = {
                        germination: { weeks: 2, water_need: 0.7, nutrient_need: 0.4 },
                        vegetative: { weeks: 6, water_need: crop.waterNeed === 'high' ? 0.9 : 0.6, nutrient_need: 0.6 },
                        reproductive: { weeks: 5, water_need: crop.waterNeed === 'high' ? 0.8 : 0.5, nutrient_need: 0.5 },
                        maturation: { weeks: 3, water_need: 0.4, nutrient_need: 0.3 }
                    };
                }
            });
            console.log(`🌱 Available crops updated: ${data.availableCrops.map(c => c.name).join(', ')}`);
        }

        // Update environmental metrics
        if (data.soilMoisture !== undefined) {
            this.farmState.environmentalData.soilMoisture = data.soilMoisture / 100; // Convert to 0-1 scale
        }

        if (data.temperature !== undefined) {
            this.farmState.environmentalData.temperature = data.temperature;
        }

        if (data.precipitation !== undefined) {
            this.farmState.environmentalData.precipitation = data.precipitation;
        }

        if (data.vegetationHealth !== undefined) {
            this.farmState.environmentalData.vegetationHealth = data.vegetationHealth;
            this.farmState.environmentalData.nutrientConsumptionMultiplier = 0.5 + data.vegetationHealth;
        }

        // Set initial crops based on location if provided
        if (data.initialCrops && Array.isArray(data.initialCrops)) {
            console.log(`🌱 Setting location-based initial crops: ${data.initialCrops.length} crops`);
            this.farmState.crops = [...data.initialCrops];

            if (data.initialCrops.length === 0) {
                console.log(`🧊 No crops can survive in this extreme climate`);
            } else {
                data.initialCrops.forEach(crop => {
                    console.log(`  - ${crop.type}: ${crop.acres} acres, health: ${Math.round(crop.health * 100)}%`);
                });
            }
        }

        // Update data quality status
        this.farmState.environmentalData.dataQuality = 'satellite-loaded';
        this.farmState.environmentalData.lastUpdated = Date.now();

        // Emit update event
        this.emit('environmentalDataApplied', {
            location: this.farmState.location,
            environmentalData: this.farmState.environmentalData,
            availableCrops: this.farmState.availableCrops
        });

        console.log('✅ Satellite data successfully applied to farm simulation');
    }

    /**
     * Get comprehensive crop costs for all crop types
     */
    getComprehensiveCropCosts() {
        return {
            // Default crops
            wheat: 50, corn: 75, tomatoes: 100, carrots: 40,
            // Tropical crops
            rice: 80, sugarcane: 120, banana: 200, coffee: 150,
            // Temperate crops
            soybean: 60, potato: 45,
            // Arid/Desert crops
            sorghum: 35, millet: 30, dates: 300, cactus: 20,
            // High precipitation crops
            tea: 180, cocoa: 250,
            // Cold climate crops
            barley: 40, oats: 45, rye: 35,
            // Specialty crops
            vegetables: 90, fruits: 180
        };
    }

    /**
     * Get comprehensive crop configuration for all crop types
     */
    getComprehensiveCropConfig() {
        return {
            // Default crops
            wheat: { emoji: '🌾', defaultArea: 20 },
            corn: { emoji: '🌽', defaultArea: 30 },
            tomatoes: { emoji: '🍅', defaultArea: 15 },
            carrots: { emoji: '🥕', defaultArea: 25 },

            // Tropical crops
            rice: { emoji: '🌾', defaultArea: 25 },
            sugarcane: { emoji: '🎋', defaultArea: 20 },
            banana: { emoji: '🍌', defaultArea: 15 },
            coffee: { emoji: '☕', defaultArea: 18 },

            // Temperate crops
            soybean: { emoji: '🫘', defaultArea: 25 },
            potato: { emoji: '🥔', defaultArea: 22 },

            // Arid/Desert crops
            sorghum: { emoji: '🌾', defaultArea: 30 },
            millet: { emoji: '🌾', defaultArea: 28 },
            dates: { emoji: '🌴', defaultArea: 10 },
            cactus: { emoji: '🌵', defaultArea: 15 },

            // High precipitation crops
            tea: { emoji: '🍵', defaultArea: 12 },
            cocoa: { emoji: '🍫', defaultArea: 10 },

            // Cold climate crops
            barley: { emoji: '🌾', defaultArea: 24 },
            oats: { emoji: '🌾', defaultArea: 22 },
            rye: { emoji: '🌾', defaultArea: 26 },

            // Specialty crops
            vegetables: { emoji: '🥬', defaultArea: 18 },
            fruits: { emoji: '🍎', defaultArea: 12 }
        };
    }

    /**
     * Change farm type and update land sizes accordingly
     */
    changeFarmType(newFarmType) {
        const validTypes = ['smallholder', 'industrial', 'organic'];

        if (!validTypes.includes(newFarmType)) {
            return {
                success: false,
                message: `❌ Invalid farm type. Choose from: ${validTypes.join(', ')}`
            };
        }

        // Store old values for comparison
        const oldType = this.farmState.farmType;
        const oldLandSize = this.farmState.totalLand;

        // Update farm type
        this.farmState.farmType = newFarmType;

        // Update land sizes based on new type
        this.setFarmTypeLandSize();

        return {
            success: true,
            message: `🏞️ Farm type changed from ${oldType} to ${newFarmType}`,
            oldLandSize,
            newLandSize: this.farmState.totalLand
        };
    }

    /**
     * Get game progress summary
     */
    getGameProgress() {
        const totalPossibleScore = this.farmState.playerStats.decisionsCount * 100;
        const efficiency = totalPossibleScore > 0 ?
            (this.farmState.playerStats.totalScore / totalPossibleScore) * 100 : 0;

        return {
            week: this.farmState.currentWeek,
            season: this.farmState.currentSeason,
            totalScore: this.farmState.playerStats.totalScore,
            efficiency: efficiency.toFixed(1),
            successRate: this.farmState.playerStats.decisionsCount > 0 ?
                (this.farmState.playerStats.successfulDecisions / this.farmState.playerStats.decisionsCount * 100).toFixed(1) : 0,
            totalProfit: this.farmState.playerStats.totalProfit,
            sustainabilityScore: this.farmState.playerStats.sustainabilityScore
        };
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in farm simulation listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Integrate NASA satellite data
     */
    integrateSatelliteData(nasaData) {
        this.farmState.satelliteData = {
            ...nasaData,
            lastUpdate: Date.now()
        };

        // Update crop conditions based on real NASA data
        if (nasaData.soilMoisture !== null) {
            this.farmState.crops.forEach(crop => {
                // Convert NASA soil moisture to crop water level
                crop.water_level = Math.min(nasaData.soilMoisture, 1.0);
            });
        }

        this.emit('nasaDataIntegrated', nasaData);
    }

    /**
     * Get seasonal events for the new season
     */
    getSeasonalEvents(season) {
        const seasonalEvents = {
            spring: [
                {
                    type: 'planting_season',
                    title: '🌱 Spring Planting Season',
                    description: 'Optimal time for planting most crops. Soil temperature is warming up.',
                    benefits: ['15% faster germination', 'Reduced seed cost'],
                    recommendations: ['Plant corn and soybeans', 'Monitor soil moisture with NASA SMAP data']
                },
                {
                    type: 'equipment_maintenance',
                    title: '🔧 Equipment Preparation',
                    description: 'Time to prepare and maintain farming equipment for the growing season.',
                    benefits: ['Prevent equipment failures', 'Maintain optimal efficiency'],
                    recommendations: ['Service tractors', 'Calibrate irrigation systems']
                }
            ],
            summer: [
                {
                    type: 'peak_growth',
                    title: '☀️ Peak Growth Season',
                    description: 'Crops are in active growth phase. Monitor water needs carefully.',
                    benefits: ['Maximum growth rates', 'High photosynthesis activity'],
                    recommendations: ['Increase irrigation frequency', 'Watch for pest activity']
                },
                {
                    type: 'heat_stress_warning',
                    title: '🌡️ Heat Stress Alert',
                    description: 'High temperatures may stress crops and livestock.',
                    benefits: ['Early warning system', 'Protective measures available'],
                    recommendations: ['Provide livestock shade', 'Increase water availability']
                }
            ],
            fall: [
                {
                    type: 'harvest_season',
                    title: '🌾 Harvest Season',
                    description: 'Time to harvest mature crops and prepare for winter.',
                    benefits: ['Crop income generation', 'Inventory management'],
                    recommendations: ['Harvest ready crops', 'Prepare winter feed storage']
                },
                {
                    type: 'winter_prep',
                    title: '❄️ Winter Preparation',
                    description: 'Prepare farm infrastructure and livestock for winter conditions.',
                    benefits: ['Prevent winter losses', 'Maintain animal health'],
                    recommendations: ['Insulate animal shelters', 'Stock winter feed supplies']
                }
            ],
            winter: [
                {
                    type: 'planning_season',
                    title: '📋 Planning Season',
                    description: 'Use winter months for crop planning and learning.',
                    benefits: ['Strategic planning time', 'Equipment maintenance'],
                    recommendations: ['Plan next year crops', 'Review NASA agricultural resources']
                },
                {
                    type: 'livestock_care',
                    title: '🐄 Intensive Livestock Care',
                    description: 'Livestock require extra attention during cold months.',
                    benefits: ['Maintain animal health', 'Prepare for spring breeding'],
                    recommendations: ['Monitor animal health daily', 'Ensure adequate nutrition']
                }
            ]
        };

        return seasonalEvents[season] || [];
    }

    /**
     * Update seasonal modifiers
     */
    updateSeasonalModifiers(season) {
        const seasonalModifiers = {
            spring: {
                cropGrowthRate: 1.2,
                waterConsumption: 0.8,
                animalHealthBonus: 0.1,
                marketPriceModifier: 1.0
            },
            summer: {
                cropGrowthRate: 1.5,
                waterConsumption: 1.3,
                animalHealthBonus: -0.1,
                marketPriceModifier: 0.9
            },
            fall: {
                cropGrowthRate: 0.8,
                waterConsumption: 0.7,
                animalHealthBonus: 0.0,
                marketPriceModifier: 1.2
            },
            winter: {
                cropGrowthRate: 0.3,
                waterConsumption: 0.5,
                animalHealthBonus: -0.2,
                marketPriceModifier: 1.1
            }
        };

        this.farmState.seasonalModifiers = seasonalModifiers[season];
    }

    /**
     * Trigger seasonal activities
     */
    triggerSeasonalActivities(season) {
        // Initialize seasonal progress if not exists
        if (!this.farmState.seasonalProgress) {
            this.farmState.seasonalProgress = {};
        }

        this.farmState.seasonalProgress[season] = {
            completed: false,
            milestones: [],
            activities: this.getSeasonalActivities(season),
            startWeek: this.farmState.currentWeek
        };
    }

    /**
     * Get activities for each season
     */
    getSeasonalActivities(season) {
        const activities = {
            spring: [
                { id: 'plant_crops', name: 'Plant primary crops', completed: false, week: null },
                { id: 'fertilize_fields', name: 'Apply spring fertilizer', completed: false, week: null },
                { id: 'equipment_check', name: 'Complete equipment maintenance', completed: false, week: null }
            ],
            summer: [
                { id: 'pest_management', name: 'Implement pest control', completed: false, week: null },
                { id: 'irrigation_optimization', name: 'Optimize irrigation schedule', completed: false, week: null },
                { id: 'livestock_breeding', name: 'Manage breeding programs', completed: false, week: null }
            ],
            fall: [
                { id: 'harvest_crops', name: 'Harvest mature crops', completed: false, week: null },
                { id: 'soil_testing', name: 'Conduct soil analysis', completed: false, week: null },
                { id: 'winter_preparation', name: 'Prepare for winter', completed: false, week: null }
            ],
            winter: [
                { id: 'plan_next_year', name: 'Plan next year strategy', completed: false, week: null },
                { id: 'maintain_equipment', name: 'Winter equipment maintenance', completed: false, week: null },
                { id: 'livestock_care', name: 'Intensive livestock care', completed: false, week: null }
            ]
        };

        return activities[season] || [];
    }

    /**
     * Update market prices weekly
     */
    updateMarketPrices() {
        if (!this.farmState.marketPrices) {
            this.farmState.marketPrices = {
                corn: 180,    // $/ton
                wheat: 220,   // $/ton
                soybeans: 400, // $/ton
                cattle: 1200, // $/head
                pork: 80,     // $/cwt
                milk: 0.35    // $/liter
            };
        }

        // Apply random market fluctuations (±5-15%)
        Object.keys(this.farmState.marketPrices).forEach(commodity => {
            const fluctuation = (Math.random() - 0.5) * 0.3; // ±15%
            const seasonalModifier = this.farmState.seasonalModifiers?.marketPriceModifier || 1.0;

            this.farmState.marketPrices[commodity] *= (1 + fluctuation) * seasonalModifier;
            this.farmState.marketPrices[commodity] = Math.round(this.farmState.marketPrices[commodity] * 100) / 100;
        });
    }

    /**
     * Check for random events
     */
    checkForRandomEvents() {
        const eventChance = Math.random();

        if (eventChance < 0.1) { // 10% chance per week
            const randomEvents = [
                {
                    type: 'equipment_breakdown',
                    title: '⚠️ Equipment Breakdown',
                    description: 'A piece of farm equipment requires unexpected repairs.',
                    cost: Math.floor(Math.random() * 500) + 200,
                    urgency: 'high'
                },
                {
                    type: 'beneficial_weather',
                    title: '🌤️ Perfect Weather',
                    description: 'Ideal weather conditions boost crop growth this week.',
                    benefit: 'growth_boost',
                    urgency: 'low'
                },
                {
                    type: 'market_opportunity',
                    title: '💰 Market Opportunity',
                    description: 'Sudden demand spike for your primary crops.',
                    benefit: 'price_boost',
                    urgency: 'medium'
                },
                {
                    type: 'neighbor_help',
                    title: '🤝 Neighbor Assistance',
                    description: 'A neighboring farmer offers help with equipment sharing.',
                    benefit: 'cost_reduction',
                    urgency: 'low'
                }
            ];

            const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
            event.week = this.farmState.currentWeek;

            this.farmState.randomEvents = this.farmState.randomEvents || [];
            this.farmState.randomEvents.push(event);

            this.emit('randomEvent', event);
        }
    }

    /**
     * Calculate weekly income
     */
    calculateWeeklyIncome() {
        let weeklyIncome = 0;

        // Income from crop sales (if any harvested)
        this.farmState.crops.forEach(crop => {
            if (crop.harvested_this_week) {
                const marketPrice = this.farmState.marketPrices[crop.type] || 200;
                const yield_per_hectare = crop.health * 5; // tons per hectare
                const income = crop.area * yield_per_hectare * marketPrice;
                weeklyIncome += income;
                crop.harvested_this_week = false; // Reset flag
            }
        });

        // Income from livestock products
        if (this.farmState.livestock) {
            const cattle = this.farmState.livestock.cattle || { count: 0, health: 0 };
            const milkProduction = cattle.count * cattle.health * 25; // liters per week
            weeklyIncome += milkProduction * (this.farmState.marketPrices.milk || 0.35);
        }

        this.farmState.resources.money += weeklyIncome;
        this.farmState.weeklyIncome = weeklyIncome;
    }

    /**
     * Check seasonal milestones
     */
    checkSeasonalMilestones() {
        const season = this.farmState.currentSeason;
        const seasonProgress = this.farmState.seasonalProgress?.[season];

        if (seasonProgress && !seasonProgress.completed) {
            // Check if any activities were completed
            const completedActivities = seasonProgress.activities.filter(activity => activity.completed);

            // Award milestones for completion percentage
            const completionRate = completedActivities.length / seasonProgress.activities.length;

            if (completionRate >= 0.5 && !seasonProgress.milestones.includes('halfway')) {
                seasonProgress.milestones.push('halfway');
                this.farmState.playerStats.totalScore += 50;

                this.emit('milestoneReached', {
                    season,
                    milestone: 'halfway',
                    week: this.farmState.currentWeek
                });
            }

            if (completionRate >= 1.0 && !seasonProgress.completed) {
                seasonProgress.completed = true;
                seasonProgress.milestones.push('completed');
                this.farmState.playerStats.totalScore += 100;

                this.emit('seasonCompleted', {
                    season,
                    week: this.farmState.currentWeek,
                    completionWeek: this.farmState.currentWeek - seasonProgress.startWeek
                });
            }
        }
    }

    /**
     * Generate weekly summary
     */
    generateWeeklySummary() {
        const summary = {
            week: this.farmState.currentWeek,
            season: this.farmState.currentSeason,
            year: this.farmState.currentYear,
            income: this.farmState.weeklyIncome || 0,
            expenses: this.farmState.weeklyCosts || 0,
            netProfit: (this.farmState.weeklyIncome || 0) - (this.farmState.weeklyCosts || 0),
            cropStatus: this.farmState.crops.map(crop => ({
                type: crop.type,
                stage: crop.current_stage,
                health: Math.round(crop.health * 100)
            })),
            alerts: this.farmState.activeAlerts?.length || 0,
            events: this.farmState.randomEvents?.filter(e => e.week === this.farmState.currentWeek).length || 0
        };

        this.farmState.weeklySummary = summary;
    }

    /**
     * Update daily weather
     */
    updateDailyWeather() {
        const seasonWeather = this.weatherPatterns[this.farmState.currentSeason];

        this.farmState.currentWeather = {
            temperature: seasonWeather.temp_range[0] +
                Math.random() * (seasonWeather.temp_range[1] - seasonWeather.temp_range[0]),
            precipitation: Math.random() < seasonWeather.rain_probability ? Math.random() * 15 : 0,
            humidity: 0.4 + Math.random() * 0.4,
            windSpeed: Math.random() * 20
        };
    }

    /**
     * Process daily resource consumption
     */
    processDailyResourceConsumption() {
        // Daily fuel consumption for farm operations
        const dailyFuelConsumption = this.farmState.farmSize * 0.02;
        this.farmState.resources.fuel = Math.max(0, this.farmState.resources.fuel - dailyFuelConsumption);

        // Daily water consumption (if no rain) - adjusted by satellite data
        if (this.farmState.currentWeather?.precipitation < 1) {
            const satelliteWaterMultiplier = this.farmState.environmentalData.waterConsumptionMultiplier || 1.0;
            const dailyWaterConsumption = this.farmState.farmSize * 0.5 * satelliteWaterMultiplier;
            this.farmState.resources.water = Math.max(0, this.farmState.resources.water - dailyWaterConsumption);

            if (satelliteWaterMultiplier !== 1.0) {
                console.log(`💧 Satellite-adjusted water consumption: ${dailyWaterConsumption.toFixed(1)} units (multiplier: ${satelliteWaterMultiplier.toFixed(2)})`);
            }
        }
    }

    /**
     * Check urgent alerts
     */
    checkUrgentAlerts() {
        // Check for resource shortages
        if (this.farmState.resources.water < 20) {
            this.addAlert({
                type: 'resource_shortage',
                message: '🚨 Water reserves critically low! Consider emergency water procurement.',
                urgency: 'critical'
            });
        }

        if (this.farmState.resources.fuel < 10) {
            this.addAlert({
                type: 'resource_shortage',
                message: '⛽ Fuel running low. Farm operations may be affected.',
                urgency: 'high'
            });
        }
    }

    /**
     * Calculate yearly metrics
     */
    calculateYearlyMetrics() {
        return {
            totalIncome: this.farmState.playerStats.totalScore,
            averageEfficiency: this.farmState.playerStats.waterEfficiency,
            successRate: this.farmState.playerStats.decisionsCount > 0
                ? this.farmState.playerStats.successfulDecisions / this.farmState.playerStats.decisionsCount
                : 0,
            nasaAlignmentRate: this.farmState.playerStats.decisionsCount > 0
                ? this.farmState.playerStats.nasaAlignments / this.farmState.playerStats.decisionsCount
                : 0
        };
    }

    /**
     * Apply yearly improvements
     */
    applyYearlyImprovements() {
        // Increase efficiency based on experience
        const experienceBonus = Math.min(0.05 * this.farmState.currentYear, 0.2);

        // Apply to resource efficiency
        this.farmState.efficiencyModifiers = {
            water: 1 + experienceBonus,
            fuel: 1 + experienceBonus,
            fertilizer: 1 + experienceBonus
        };
    }

    /**
     * Add alert to active alerts
     */
    addAlert(alert) {
        this.farmState.activeAlerts = this.farmState.activeAlerts || [];
        alert.week = this.farmState.currentWeek;
        alert.id = Date.now() + Math.random();
        this.farmState.activeAlerts.push(alert);
    }

    /**
     * Update farm resources (money, water, seeds, fertilizer, etc.)
     */
    updateResources(resourceChanges) {
        console.log('🔄 Updating farm resources:', resourceChanges);

        // Ensure resources object exists
        if (!this.farmState.resources) {
            this.farmState.resources = {
                money: 10000,
                water: 100,
                fertilizer: 50,
                seeds: 100,
                feed: 50
            };
        }

        // Apply resource changes
        Object.entries(resourceChanges).forEach(([resource, change]) => {
            if (typeof change === 'number') {
                this.farmState.resources[resource] = (this.farmState.resources[resource] || 0) + change;

                // Ensure resources don't go below zero (except for money which can go negative for debt)
                if (resource !== 'money' && this.farmState.resources[resource] < 0) {
                    this.farmState.resources[resource] = 0;
                }
            }
        });

        console.log('✅ Resources updated:', this.farmState.resources);

        // Emit resource update event
        this.emit('resourcesUpdated', {
            resources: this.farmState.resources,
            changes: resourceChanges
        });

        return this.farmState.resources;
    }

    getComprehensiveCropStages() {
        return {
            // Default crops
            corn: {
                germination: { weeks: 1, water_need: 0.8, nutrient_need: 0.3 },
                vegetative: { weeks: 6, water_need: 0.7, nutrient_need: 0.8 },
                reproductive: { weeks: 6, water_need: 0.9, nutrient_need: 0.6 },
                maturation: { weeks: 4, water_need: 0.5, nutrient_need: 0.2 }
            },
            wheat: {
                germination: { weeks: 2, water_need: 0.6, nutrient_need: 0.4 },
                tillering: { weeks: 8, water_need: 0.5, nutrient_need: 0.7 },
                jointing: { weeks: 4, water_need: 0.8, nutrient_need: 0.9 },
                heading: { weeks: 3, water_need: 0.7, nutrient_need: 0.3 }
            },
            soybeans: {
                emergence: { weeks: 1, water_need: 0.7, nutrient_need: 0.2 },
                vegetative: { weeks: 7, water_need: 0.6, nutrient_need: 0.6 },
                flowering: { weeks: 4, water_need: 0.8, nutrient_need: 0.4 },
                pod_filling: { weeks: 6, water_need: 0.9, nutrient_need: 0.3 }
            },
            soybean: { // alias
                emergence: { weeks: 1, water_need: 0.7, nutrient_need: 0.2 },
                vegetative: { weeks: 7, water_need: 0.6, nutrient_need: 0.6 },
                flowering: { weeks: 4, water_need: 0.8, nutrient_need: 0.4 },
                pod_filling: { weeks: 6, water_need: 0.9, nutrient_need: 0.3 }
            },
            tomatoes: {
                germination: { weeks: 1, water_need: 0.8, nutrient_need: 0.4 },
                vegetative: { weeks: 4, water_need: 0.9, nutrient_need: 0.8 },
                flowering: { weeks: 3, water_need: 0.9, nutrient_need: 0.7 },
                fruiting: { weeks: 4, water_need: 0.8, nutrient_need: 0.5 }
            },
            carrots: {
                germination: { weeks: 1, water_need: 0.7, nutrient_need: 0.3 },
                vegetative: { weeks: 4, water_need: 0.6, nutrient_need: 0.7 },
                root_development: { weeks: 2, water_need: 0.5, nutrient_need: 0.6 },
                maturation: { weeks: 1, water_need: 0.4, nutrient_need: 0.3 }
            },

            // Tropical crops
            rice: {
                germination: { weeks: 2, water_need: 0.9, nutrient_need: 0.4 },
                tillering: { weeks: 6, water_need: 0.9, nutrient_need: 0.7 },
                reproductive: { weeks: 8, water_need: 0.8, nutrient_need: 0.8 },
                ripening: { weeks: 4, water_need: 0.6, nutrient_need: 0.2 }
            },
            sugarcane: {
                establishment: { weeks: 8, water_need: 0.8, nutrient_need: 0.6 },
                grand_growth: { weeks: 24, water_need: 0.7, nutrient_need: 0.7 },
                maturation: { weeks: 20, water_need: 0.5, nutrient_need: 0.4 }
            },
            banana: {
                establishment: { weeks: 12, water_need: 0.8, nutrient_need: 0.7 },
                vegetative: { weeks: 16, water_need: 0.8, nutrient_need: 0.8 },
                flowering: { weeks: 8, water_need: 0.9, nutrient_need: 0.6 },
                fruiting: { weeks: 4, water_need: 0.7, nutrient_need: 0.4 }
            },
            coffee: {
                establishment: { weeks: 12, water_need: 0.7, nutrient_need: 0.6 },
                vegetative: { weeks: 8, water_need: 0.6, nutrient_need: 0.7 },
                flowering: { weeks: 4, water_need: 0.8, nutrient_need: 0.8 },
                cherry_development: { weeks: 2, water_need: 0.6, nutrient_need: 0.5 }
            },

            // Temperate crops
            potato: {
                sprouting: { weeks: 2, water_need: 0.6, nutrient_need: 0.4 },
                vegetative: { weeks: 6, water_need: 0.7, nutrient_need: 0.8 },
                tuber_initiation: { weeks: 3, water_need: 0.8, nutrient_need: 0.7 },
                tuber_bulking: { weeks: 3, water_need: 0.9, nutrient_need: 0.6 }
            },

            // Arid/Desert crops
            sorghum: {
                emergence: { weeks: 1, water_need: 0.5, nutrient_need: 0.3 },
                vegetative: { weeks: 6, water_need: 0.4, nutrient_need: 0.6 },
                reproductive: { weeks: 6, water_need: 0.6, nutrient_need: 0.7 },
                maturation: { weeks: 3, water_need: 0.3, nutrient_need: 0.2 }
            },
            millet: {
                emergence: { weeks: 1, water_need: 0.4, nutrient_need: 0.3 },
                tillering: { weeks: 4, water_need: 0.4, nutrient_need: 0.6 },
                heading: { weeks: 6, water_need: 0.5, nutrient_need: 0.7 },
                maturation: { weeks: 3, water_need: 0.3, nutrient_need: 0.2 }
            },
            dates: {
                establishment: { weeks: 52, water_need: 0.5, nutrient_need: 0.5 },
                vegetative: { weeks: 26, water_need: 0.4, nutrient_need: 0.6 },
                flowering: { weeks: 16, water_need: 0.6, nutrient_need: 0.7 },
                fruiting: { weeks: 10, water_need: 0.5, nutrient_need: 0.4 }
            },
            cactus: {
                establishment: { weeks: 2, water_need: 0.2, nutrient_need: 0.3 },
                vegetative: { weeks: 4, water_need: 0.2, nutrient_need: 0.4 },
                maturation: { weeks: 2, water_need: 0.1, nutrient_need: 0.2 }
            },

            // High precipitation crops
            tea: {
                establishment: { weeks: 52, water_need: 0.8, nutrient_need: 0.6 },
                vegetative: { weeks: 52, water_need: 0.7, nutrient_need: 0.7 },
                production: { weeks: 52, water_need: 0.8, nutrient_need: 0.8 }
            },
            cocoa: {
                establishment: { weeks: 52, water_need: 0.8, nutrient_need: 0.7 },
                vegetative: { weeks: 26, water_need: 0.8, nutrient_need: 0.8 },
                flowering: { weeks: 16, water_need: 0.9, nutrient_need: 0.7 },
                pod_development: { weeks: 10, water_need: 0.7, nutrient_need: 0.5 }
            },

            // Cold climate crops
            barley: {
                germination: { weeks: 2, water_need: 0.5, nutrient_need: 0.4 },
                tillering: { weeks: 6, water_need: 0.4, nutrient_need: 0.7 },
                stem_elongation: { weeks: 4, water_need: 0.6, nutrient_need: 0.8 },
                heading: { weeks: 2, water_need: 0.5, nutrient_need: 0.3 }
            },
            oats: {
                germination: { weeks: 2, water_need: 0.6, nutrient_need: 0.4 },
                tillering: { weeks: 6, water_need: 0.5, nutrient_need: 0.7 },
                panicle_formation: { weeks: 4, water_need: 0.7, nutrient_need: 0.8 },
                ripening: { weeks: 4, water_need: 0.4, nutrient_need: 0.3 }
            },
            rye: {
                germination: { weeks: 2, water_need: 0.4, nutrient_need: 0.3 },
                tillering: { weeks: 6, water_need: 0.3, nutrient_need: 0.6 },
                stem_elongation: { weeks: 4, water_need: 0.5, nutrient_need: 0.7 },
                heading: { weeks: 2, water_need: 0.4, nutrient_need: 0.3 }
            },

            // Specialty crops
            vegetables: {
                germination: { weeks: 1, water_need: 0.7, nutrient_need: 0.5 },
                vegetative: { weeks: 4, water_need: 0.8, nutrient_need: 0.8 },
                reproductive: { weeks: 3, water_need: 0.8, nutrient_need: 0.7 },
                harvest: { weeks: 2, water_need: 0.6, nutrient_need: 0.4 }
            },
            fruits: {
                establishment: { weeks: 12, water_need: 0.7, nutrient_need: 0.6 },
                vegetative: { weeks: 8, water_need: 0.7, nutrient_need: 0.8 },
                flowering: { weeks: 6, water_need: 0.8, nutrient_need: 0.7 },
                fruiting: { weeks: 4, water_need: 0.8, nutrient_need: 0.5 }
            }
        };
    }
}

export { FarmSimulationEngine };