class FarmSimulation {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.simulationState = {
            soilHealth: 0.7,
            overallMoisture: 0.4,
            pestPressure: 0.2,
            weatherStress: 0.0,
            seasonProgress: 0.0
        };

        this.cropParameters = {
            corn: {
                waterRequirement: 0.4, // Base water need per week
                nitrogenRequirement: 0.3,
                heatTolerance: 0.6,
                growthRate: 0.05,
                maturityWeeks: 16,
                optimalNDVI: 0.75
            }
        };

        this.weatherEvents = [];
        this.init();
    }

    init() {
        this.setupCropParameters();
        this.generateSeasonalWeatherPattern();

        this.gameEngine.on('weekAdvanced', () => this.processWeeklyUpdate());
        this.gameEngine.on('irrigationApplied', (data) => this.processIrrigation(data));
        this.gameEngine.on('fertilizerApplied', (data) => this.processFertilizer(data));
    }

    setupCropParameters() {
        const farmData = this.gameEngine.getFarmData();
        this.currentCrop = this.cropParameters[farmData.cropType] || this.cropParameters.corn;
    }

    generateSeasonalWeatherPattern() {
        // Generate weather events for the entire season
        this.weatherEvents = [];

        for (let week = 1; week <= 20; week++) {
            const event = this.generateWeatherEvent(week);
            this.weatherEvents.push(event);
        }
    }

    generateWeatherEvent(week) {
        const seasonalTemp = this.calculateSeasonalTemperature(week);
        const precipitation = this.calculatePrecipitation(week);

        return {
            week: week,
            temperature: seasonalTemp,
            precipitation: precipitation,
            humidity: 30 + Math.random() * 40, // 30-70% humidity typical for Arizona
            windSpeed: 5 + Math.random() * 15, // 5-20 mph winds
            isExtremeEvent: this.shouldGenerateExtremeEvent(week)
        };
    }

    calculateSeasonalTemperature(week) {
        // Arizona temperature pattern (growing season April-September)
        const baseTemp = 75; // Base temperature in Fahrenheit
        const seasonalVariation = 20 * Math.sin((week - 1) * Math.PI / 10); // Peaks mid-season
        const randomVariation = (Math.random() - 0.5) * 10;

        return baseTemp + seasonalVariation + randomVariation;
    }

    calculatePrecipitation(week) {
        // Arizona precipitation pattern (monsoon season mid-summer)
        if (week >= 8 && week <= 12) {
            // Monsoon season - higher chance of precipitation
            return Math.random() < 0.4 ? Math.random() * 2 : 0;
        } else {
            // Dry season
            return Math.random() < 0.1 ? Math.random() * 0.5 : 0;
        }
    }

    shouldGenerateExtremeEvent(week) {
        // 15% chance of extreme weather events
        if (Math.random() < 0.15) {
            return this.generateExtremeWeatherType(week);
        }
        return null;
    }

    generateExtremeWeatherType(week) {
        const events = ['heatwave', 'drought', 'flooding', 'hail', 'wind'];
        const eventType = events[Math.floor(Math.random() * events.length)];

        return {
            type: eventType,
            intensity: 0.5 + Math.random() * 0.5, // 0.5 to 1.0
            duration: 1 + Math.floor(Math.random() * 3) // 1-3 weeks
        };
    }

    processWeeklyUpdate() {
        const currentWeek = this.gameEngine.state.currentWeek;
        const currentWeather = this.weatherEvents[currentWeek - 1];

        // Update simulation state
        this.updateSeasonProgress();
        this.processWeatherEffects(currentWeather);
        this.processPlantGrowth();
        this.processNaturalStressors();
        this.updateZoneStates();

        // Trigger extreme weather events if needed
        if (currentWeather && currentWeather.isExtremeEvent) {
            this.handleExtremeWeatherEvent(currentWeather.isExtremeEvent);
        }

        // Update sustainability score
        this.gameEngine.calculateSustainabilityScore();

        // Check for scenario triggers
        this.checkScenarioTriggers(currentWeather);
    }

    updateSeasonProgress() {
        const currentWeek = this.gameEngine.state.currentWeek;
        this.simulationState.seasonProgress = Math.min(1.0, currentWeek / this.currentCrop.maturityWeeks);
    }

    processWeatherEffects(weather) {
        if (!weather) return;

        const farmData = this.gameEngine.getFarmData();

        // Temperature stress
        if (weather.temperature > 95) {
            this.simulationState.weatherStress += 0.1;
            this.applyHeatStress(farmData.zones, weather.temperature);
        } else if (weather.temperature < 60) {
            this.simulationState.weatherStress += 0.05;
            this.applyColdStress(farmData.zones, weather.temperature);
        }

        // Precipitation effects
        if (weather.precipitation > 0) {
            this.applyNaturalIrrigation(farmData.zones, weather.precipitation);
        }

        // Wind effects on evapotranspiration
        if (weather.windSpeed > 15) {
            this.increaseEvapotranspiration(farmData.zones, weather.windSpeed);
        }
    }

    applyHeatStress(zones, temperature) {
        const stressIntensity = Math.min(0.3, (temperature - 95) / 20);

        zones.forEach(zone => {
            zone.ndvi = Math.max(0.1, zone.ndvi - stressIntensity * 0.1);
            zone.soilMoisture = Math.max(0.1, zone.soilMoisture - stressIntensity * 0.15);

            if (zone.ndvi < 0.4) {
                zone.stressLevel = 'high';
            } else if (zone.ndvi < 0.5) {
                zone.stressLevel = 'moderate';
            }
        });

        // Show weather alert
        this.gameEngine.showDrVegaMessage(
            `Extreme heat warning! Temperature reached ${Math.round(temperature)}°F. Your crops are experiencing heat stress. Consider increasing irrigation frequency.`
        );
    }

    applyColdStress(zones, temperature) {
        const stressIntensity = Math.min(0.2, (60 - temperature) / 20);

        zones.forEach(zone => {
            zone.ndvi = Math.max(0.2, zone.ndvi - stressIntensity * 0.05);
            // Cold stress reduces growth but doesn't affect moisture as much
        });
    }

    applyNaturalIrrigation(zones, precipitation) {
        const waterBonus = Math.min(0.3, precipitation / 2); // Max 0.3 moisture increase

        zones.forEach(zone => {
            zone.soilMoisture = Math.min(1.0, zone.soilMoisture + waterBonus);

            // Natural water improves plant health slightly
            if (zone.soilMoisture > 0.4) {
                zone.ndvi = Math.min(1.0, zone.ndvi + 0.02);
            }
        });

        this.gameEngine.showDrVegaMessage(
            `Natural rainfall of ${precipitation.toFixed(1)}" has improved soil moisture across your field!`
        );
    }

    increaseEvapotranspiration(zones, windSpeed) {
        const evapotranspirationRate = Math.min(0.1, (windSpeed - 15) / 50);

        zones.forEach(zone => {
            zone.soilMoisture = Math.max(0.1, zone.soilMoisture - evapotranspirationRate);
        });
    }

    processPlantGrowth() {
        const farmData = this.gameEngine.getFarmData();
        const growthRate = this.currentCrop.growthRate;

        farmData.zones.forEach(zone => {
            // Growth is affected by water availability, nutrients, and stress
            let actualGrowthRate = growthRate;

            // Water factor
            if (zone.soilMoisture < 0.3) {
                actualGrowthRate *= 0.5; // Reduced growth with low water
            } else if (zone.soilMoisture > 0.7) {
                actualGrowthRate *= 0.8; // Slightly reduced growth with too much water
            }

            // Stress factor
            if (zone.stressLevel === 'high') {
                actualGrowthRate *= 0.3;
            } else if (zone.stressLevel === 'moderate') {
                actualGrowthRate *= 0.7;
            }

            // Apply growth
            zone.ndvi = Math.min(this.currentCrop.optimalNDVI, zone.ndvi + actualGrowthRate);
        });
    }

    processNaturalStressors() {
        const farmData = this.gameEngine.getFarmData();

        // Soil depletion over time
        this.simulationState.soilHealth -= 0.01;

        // Pest pressure increases during season
        this.simulationState.pestPressure += 0.005;

        // Apply natural moisture loss
        farmData.zones.forEach(zone => {
            // Base evapotranspiration
            let moistureLoss = 0.05;

            // Higher NDVI plants use more water
            moistureLoss += zone.ndvi * 0.03;

            // Apply loss
            zone.soilMoisture = Math.max(0.05, zone.soilMoisture - moistureLoss);

            // Update stress based on new moisture levels
            this.updateZoneStressLevel(zone);
        });
    }

    updateZoneStates() {
        const farmData = this.gameEngine.getFarmData();

        farmData.zones.forEach(zone => {
            this.updateZoneStressLevel(zone);
            this.updateZoneProductivity(zone);
        });
    }

    updateZoneStressLevel(zone) {
        const waterStress = zone.soilMoisture < 0.3 ? (0.3 - zone.soilMoisture) / 0.3 : 0;
        const healthStress = zone.ndvi < 0.4 ? (0.4 - zone.ndvi) / 0.4 : 0;

        const overallStress = Math.max(waterStress, healthStress);

        if (overallStress > 0.6) {
            zone.stressLevel = 'high';
        } else if (overallStress > 0.3) {
            zone.stressLevel = 'moderate';
        } else {
            zone.stressLevel = 'none';
        }
    }

    updateZoneProductivity(zone) {
        // Calculate potential yield based on NDVI and stress
        zone.productivity = zone.ndvi * 100; // Base productivity

        if (zone.stressLevel === 'high') {
            zone.productivity *= 0.6;
        } else if (zone.stressLevel === 'moderate') {
            zone.productivity *= 0.8;
        }

        // Soil health affects productivity
        zone.productivity *= this.simulationState.soilHealth;
    }

    processIrrigation(data) {
        const zone = data.zone;

        // Immediate effects of irrigation
        zone.soilMoisture = Math.min(1.0, zone.soilMoisture + 0.4);

        // Improved soil moisture helps plant health over time
        setTimeout(() => {
            if (zone.soilMoisture > 0.5) {
                zone.ndvi = Math.min(this.currentCrop.optimalNDVI, zone.ndvi + 0.05);
                this.updateZoneStressLevel(zone);
            }
        }, 2000); // Simulate delay for plant response
    }

    processFertilizer(data) {
        const zone = data.zone;

        // Fertilizer improves NDVI over time
        zone.ndvi = Math.min(this.currentCrop.optimalNDVI, zone.ndvi + 0.08);

        // Also improves soil health slightly
        this.simulationState.soilHealth = Math.min(1.0, this.simulationState.soilHealth + 0.02);
    }

    handleExtremeWeatherEvent(event) {
        const farmData = this.gameEngine.getFarmData();

        switch (event.type) {
            case 'heatwave':
                this.handleHeatwave(farmData.zones, event);
                break;
            case 'drought':
                this.handleDrought(farmData.zones, event);
                break;
            case 'flooding':
                this.handleFlooding(farmData.zones, event);
                break;
            case 'hail':
                this.handleHailstorm(farmData.zones, event);
                break;
            case 'wind':
                this.handleWindstorm(farmData.zones, event);
                break;
        }
    }

    handleHeatwave(zones, event) {
        const damage = event.intensity * 0.2;

        zones.forEach(zone => {
            zone.ndvi = Math.max(0.1, zone.ndvi - damage);
            zone.soilMoisture = Math.max(0.1, zone.soilMoisture - damage * 1.5);
            zone.stressLevel = 'high';
        });

        this.gameEngine.showDrVegaMessage(
            `Severe heatwave detected! Your crops have suffered significant stress. Immediate irrigation is recommended to minimize yield loss.`
        );
    }

    handleDrought(zones, event) {
        const moistureLoss = event.intensity * 0.3;

        zones.forEach(zone => {
            zone.soilMoisture = Math.max(0.05, zone.soilMoisture - moistureLoss);
            if (zone.soilMoisture < 0.2) {
                zone.ndvi = Math.max(0.2, zone.ndvi - 0.1);
                zone.stressLevel = 'high';
            }
        });

        this.gameEngine.showDrVegaMessage(
            `Drought conditions are affecting your region. Soil moisture levels are critically low. Consider water conservation strategies.`
        );
    }

    handleFlooding(zones, event) {
        const waterOverload = event.intensity;

        zones.forEach(zone => {
            zone.soilMoisture = Math.min(1.0, zone.soilMoisture + waterOverload);

            // Too much water can also stress plants
            if (zone.soilMoisture > 0.8) {
                zone.ndvi = Math.max(0.3, zone.ndvi - 0.05);
                zone.stressLevel = 'moderate';
            }
        });

        this.gameEngine.showDrVegaMessage(
            `Flash flooding has saturated your fields. Monitor for waterlogged conditions that may affect crop health.`
        );
    }

    handleHailstorm(zones, event) {
        const physicalDamage = event.intensity * 0.15;

        // Hail causes immediate physical damage to crops
        zones.forEach(zone => {
            zone.ndvi = Math.max(0.2, zone.ndvi - physicalDamage);
        });

        this.gameEngine.showDrVegaMessage(
            `Hailstorm has caused physical damage to your crops. NDVI readings show reduced vegetation coverage.`
        );
    }

    handleWindstorm(zones, event) {
        const evapLoss = event.intensity * 0.1;

        zones.forEach(zone => {
            zone.soilMoisture = Math.max(0.1, zone.soilMoisture - evapLoss);
        });

        this.gameEngine.showDrVegaMessage(
            `High winds are increasing evapotranspiration rates. Your crops may need additional water.`
        );
    }

    checkScenarioTriggers(weather) {
        const currentWeek = this.gameEngine.state.currentWeek;
        const stressedZones = this.gameEngine.getStressedZones();

        // Mid-season challenge
        if (currentWeek === 8 && stressedZones.length > 15) {
            this.gameEngine.showDrVegaMessage(
                "Mid-season check: You have many stressed zones. This is when your data interpretation skills really matter. Use the satellite data to identify the root causes."
            );
        }

        // Late season water conservation
        if (currentWeek === 15 && this.gameEngine.state.waterBudget < 300) {
            this.gameEngine.showDrVegaMessage(
                "Water resources are running low for the late season. Focus on the most productive zones to maximize your final yield."
            );
        }
    }

    // Public methods for external access
    getSimulationState() {
        return { ...this.simulationState };
    }

    getCurrentWeatherForecast() {
        const currentWeek = this.gameEngine.state.currentWeek;
        return this.weatherEvents.slice(currentWeek - 1, currentWeek + 6); // Current week + 6 weeks ahead
    }

    predictYield() {
        const farmData = this.gameEngine.getFarmData();
        const totalProductivity = farmData.zones.reduce((sum, zone) => sum + (zone.productivity || 0), 0);
        const avgProductivity = totalProductivity / farmData.zones.length;

        return {
            currentProjection: avgProductivity * farmData.fieldSize,
            potentialMax: this.currentCrop.optimalNDVI * 100 * farmData.fieldSize,
            efficiencyRating: avgProductivity / (this.currentCrop.optimalNDVI * 100)
        };
    }

    generateSeasonSummary() {
        const farmData = this.gameEngine.getFarmData();
        const gameState = this.gameEngine.getGameState();

        const healthyZones = farmData.zones.filter(z => z.ndvi > 0.6).length;
        const waterUsed = 1000 - gameState.waterBudget;
        const yieldPrediction = this.predictYield();

        return {
            cropHealth: (healthyZones / farmData.zones.length) * 100,
            waterEfficiency: ((1000 - waterUsed) / 1000) * 100,
            sustainabilityScore: gameState.sustainabilityScore,
            projectedYield: yieldPrediction.currentProjection,
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const farmData = this.gameEngine.getFarmData();
        const stressedZones = this.gameEngine.getStressedZones();
        const recommendations = [];

        if (stressedZones.length > 10) {
            recommendations.push("Consider more frequent monitoring of NDVI data to catch stress early");
        }

        if (this.gameEngine.state.waterBudget < 200) {
            recommendations.push("Implement more precise irrigation targeting to conserve water");
        }

        if (this.simulationState.soilHealth < 0.6) {
            recommendations.push("Consider crop rotation and soil amendment strategies for next season");
        }

        return recommendations;
    }

    /**
     * Update farm resources (money, water, seeds, fertilizer, etc.)
     */
    updateResources(resourceChanges) {
        console.log('🔄 Updating farm resources:', resourceChanges);
        const farmState = this.getFarmState();

        // Ensure resources object exists
        if (!farmState.resources) {
            farmState.resources = {};
        }

        // Apply resource changes
        Object.entries(resourceChanges).forEach(([resource, change]) => {
            if (typeof change === 'number') {
                farmState.resources[resource] = (farmState.resources[resource] || 0) + change;

                // Ensure resources don't go below zero (except for debt scenarios)
                if (resource !== 'money' && farmState.resources[resource] < 0) {
                    farmState.resources[resource] = 0;
                }
            }
        });

        // Update the game engine state
        this.gameEngine.updateFarmData({ resources: farmState.resources });

        console.log('✅ Resources updated:', farmState.resources);

        // Emit resource update event
        this.gameEngine.emit('resourcesUpdated', {
            resources: farmState.resources,
            changes: resourceChanges
        });

        return farmState.resources;
    }
}