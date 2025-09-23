/**
 * Environmental Impact Tracking System
 * Tracks long-term environmental changes and sustainability metrics
 * Integrates with NASA data and conservation practices for educational purposes
 */

class EnvironmentalImpactTracker {
    constructor(farmSimulation) {
        this.farmSimulation = farmSimulation;

        // Historical tracking - stores data by season/year
        this.historicalData = {
            soilHealth: [],
            carbonStorage: [],
            biodiversity: [],
            waterUsage: [],
            cropYields: [],
            nasaDataAccuracy: []
        };

        // Current impact metrics
        this.currentMetrics = {
            soilErosion: {
                rate: 0.1, // tons/hectare/year
                baseline: 0.1,
                trend: 0,
                nasaDataSource: 'SMAP + MODIS'
            },
            carbonFootprint: {
                emissions: 0, // tons CO2/year
                sequestration: 0, // tons CO2/year
                netBalance: 0,
                trend: 0
            },
            waterEfficiency: {
                usage: 0, // liters/hectare
                efficiency: 1.0, // usage vs optimal
                conservationImpact: 0,
                nasaDataSource: 'SMAP Soil Moisture'
            },
            biodiversityIndex: {
                current: 0.5, // 0-1 scale
                baseline: 0.5,
                speciesCount: 10,
                habitatQuality: 0.5
            },
            climateResilience: {
                droughtTolerance: 0.5,
                extremeWeatherPrep: 0.5,
                adaptabilityScore: 0.5
            }
        };

        // Environmental milestones for education
        this.milestones = {
            carbonNeutral: { achieved: false, threshold: 0, season: null },
            soilHealthImproved: { achieved: false, threshold: 0.7, season: null },
            waterEfficiencyOptimal: { achieved: false, threshold: 1.5, season: null },
            biodiversityThriving: { achieved: false, threshold: 0.8, season: null },
            climateResilient: { achieved: false, threshold: 0.8, season: null }
        };

        // NASA data integration points
        this.nasaDataIntegration = {
            smap: {
                lastUpdate: null,
                soilMoisture: 0,
                coverage: 9, // km resolution
                accuracy: 0.95
            },
            modis: {
                lastUpdate: null,
                ndvi: 0,
                coverage: 0.25, // km resolution
                landCoverChange: 0
            },
            gpm: {
                lastUpdate: null,
                precipitation: 0,
                coverage: 0.1, // degree resolution
                forecastAccuracy: 0.85
            }
        };

        // Educational insights and lessons
        this.educationalInsights = [];

        this.season = 0;
        this.year = 0;
    }

    /**
     * Update environmental metrics each season
     */
    updateSeasonalMetrics(gameData) {
        this.season++;
        if (this.season >= 4) {
            this.season = 0;
            this.year++;
        }

        // Update current metrics based on farm actions and NASA data
        this.updateSoilHealth(gameData);
        this.updateCarbonImpact(gameData);
        this.updateWaterEfficiency(gameData);
        this.updateBiodiversity(gameData);
        this.updateClimateResilience(gameData);

        // Store historical data
        this.recordHistoricalData();

        // Check for milestones
        this.checkMilestones();

        // Generate educational insights
        this.generateEducationalInsights();

        // Update NASA data integration
        this.updateNASADataAccuracy();
    }

    /**
     * Update soil health metrics using SMAP and MODIS data
     */
    updateSoilHealth(gameData) {
        const soilHealth = this.currentMetrics.soilErosion;
        const conservationPractices = gameData.conservationPractices || {};

        // Base erosion rate from land use
        let erosionRate = 0.1;

        // Conservation practice impacts
        if (conservationPractices.noTill) {
            erosionRate *= 0.3; // No-till reduces erosion by 70%
        }
        if (conservationPractices.coverCrops) {
            erosionRate *= 0.4; // Cover crops reduce erosion by 60%
        }
        if (conservationPractices.cropRotation) {
            erosionRate *= 0.8; // Crop rotation reduces erosion by 20%
        }

        // NASA SMAP soil moisture impact
        const soilMoisture = this.nasaDataIntegration.smap.soilMoisture;
        if (soilMoisture < 0.3) {
            erosionRate *= 1.5; // Dry soil more prone to erosion
        } else if (soilMoisture > 0.7) {
            erosionRate *= 1.2; // Very wet soil also prone to erosion
        }

        // Update metrics
        const previousRate = soilHealth.rate;
        soilHealth.rate = erosionRate;
        soilHealth.trend = (previousRate - erosionRate) / previousRate;

        // Educational insight
        if (Math.abs(soilHealth.trend) > 0.1) {
            this.addEducationalInsight('soil',
                `Soil erosion rate ${soilHealth.trend > 0 ? 'decreased' : 'increased'} by ${Math.abs(soilHealth.trend * 100).toFixed(1)}% this season`,
                `NASA SMAP data shows soil moisture at ${(soilMoisture * 100).toFixed(1)}%, affecting erosion patterns.`
            );
        }
    }

    /**
     * Update carbon impact metrics
     */
    updateCarbonImpact(gameData) {
        const carbon = this.currentMetrics.carbonFootprint;
        const conservationPractices = gameData.conservationPractices || {};

        // Base emissions from farming activities
        let emissions = 2.5; // tons CO2/hectare/year
        let sequestration = 0.5; // base sequestration

        // Conservation practice impacts on carbon
        if (conservationPractices.noTill) {
            emissions *= 0.7; // Reduce fuel use
            sequestration += 0.8; // Increase soil carbon storage
        }
        if (conservationPractices.coverCrops) {
            sequestration += 1.2; // Significant carbon sequestration
        }
        if (conservationPractices.agroforestry) {
            sequestration += 2.0; // Trees store large amounts of carbon
        }

        // Update metrics
        carbon.emissions = emissions;
        carbon.sequestration = sequestration;
        carbon.netBalance = sequestration - emissions;
        carbon.trend = carbon.netBalance > 0 ? 1 : -1;

        if (carbon.netBalance > 0 && !this.milestones.carbonNeutral.achieved) {
            this.milestones.carbonNeutral.achieved = true;
            this.milestones.carbonNeutral.season = `Year ${this.year}, Season ${this.season}`;
        }
    }

    /**
     * Update water efficiency metrics using NASA SMAP data
     */
    updateWaterEfficiency(gameData) {
        const water = this.currentMetrics.waterEfficiency;
        const conservationPractices = gameData.conservationPractices || {};

        // Base water usage
        let waterUsage = 500; // liters/hectare/day

        // NASA SMAP soil moisture optimization
        const soilMoisture = this.nasaDataIntegration.smap.soilMoisture;
        if (soilMoisture > 0.6) {
            waterUsage *= 0.7; // Reduce irrigation when soil is moist
        } else if (soilMoisture < 0.3) {
            waterUsage *= 1.3; // Increase irrigation for dry soil
        }

        // Conservation practice impacts
        if (conservationPractices.precisionAgriculture) {
            waterUsage *= 0.6; // Smart irrigation reduces usage by 40%
        }
        if (conservationPractices.coverCrops) {
            waterUsage *= 0.8; // Cover crops improve water retention
        }

        // Calculate efficiency (lower usage = higher efficiency)
        const optimalUsage = 300; // liters/hectare/day
        water.usage = waterUsage;
        water.efficiency = optimalUsage / waterUsage;
        water.conservationImpact = conservationPractices.precisionAgriculture ? 0.4 : 0;

        if (water.efficiency > 1.5 && !this.milestones.waterEfficiencyOptimal.achieved) {
            this.milestones.waterEfficiencyOptimal.achieved = true;
            this.milestones.waterEfficiencyOptimal.season = `Year ${this.year}, Season ${this.season}`;
        }
    }

    /**
     * Update biodiversity metrics using MODIS land cover data
     */
    updateBiodiversity(gameData) {
        const biodiversity = this.currentMetrics.biodiversityIndex;
        const conservationPractices = gameData.conservationPractices || {};

        // Base biodiversity
        let index = 0.5;
        let speciesCount = 10;

        // Conservation practice impacts
        if (conservationPractices.agroforestry) {
            index += 0.3;
            speciesCount += 15;
        }
        if (conservationPractices.cropRotation) {
            index += 0.1;
            speciesCount += 5;
        }
        if (conservationPractices.coverCrops) {
            index += 0.15;
            speciesCount += 8;
        }

        // NASA MODIS vegetation health impact
        const ndvi = this.nasaDataIntegration.modis.ndvi;
        if (ndvi > 0.7) {
            index += 0.1; // Healthy vegetation supports more biodiversity
        }

        // Update metrics
        biodiversity.current = Math.min(index, 1.0);
        biodiversity.speciesCount = speciesCount;
        biodiversity.habitatQuality = biodiversity.current;

        if (biodiversity.current > 0.8 && !this.milestones.biodiversityThriving.achieved) {
            this.milestones.biodiversityThriving.achieved = true;
            this.milestones.biodiversityThriving.season = `Year ${this.year}, Season ${this.season}`;
        }
    }

    /**
     * Update climate resilience metrics using NASA weather data
     */
    updateClimateResilience(gameData) {
        const resilience = this.currentMetrics.climateResilience;
        const conservationPractices = gameData.conservationPractices || {};

        // Base resilience
        let droughtTolerance = 0.5;
        let extremeWeatherPrep = 0.5;

        // Conservation practice impacts
        if (conservationPractices.coverCrops) {
            droughtTolerance += 0.2; // Better water retention
        }
        if (conservationPractices.agroforestry) {
            extremeWeatherPrep += 0.3; // Trees provide windbreaks
            droughtTolerance += 0.1;
        }
        if (conservationPractices.cropRotation) {
            droughtTolerance += 0.1; // Diverse crops more resilient
        }

        // NASA GPM precipitation patterns
        const precipitation = this.nasaDataIntegration.gpm.precipitation;
        if (precipitation < 20) { // Low precipitation
            droughtTolerance = Math.max(0, droughtTolerance - 0.1);
        }

        resilience.droughtTolerance = Math.min(droughtTolerance, 1.0);
        resilience.extremeWeatherPrep = Math.min(extremeWeatherPrep, 1.0);
        resilience.adaptabilityScore = (resilience.droughtTolerance + resilience.extremeWeatherPrep) / 2;

        if (resilience.adaptabilityScore > 0.8 && !this.milestones.climateResilient.achieved) {
            this.milestones.climateResilient.achieved = true;
            this.milestones.climateResilient.season = `Year ${this.year}, Season ${this.season}`;
        }
    }

    /**
     * Record historical data for trend analysis
     */
    recordHistoricalData() {
        const timestamp = `Year ${this.year}, Season ${this.season}`;

        this.historicalData.soilHealth.push({
            timestamp,
            erosionRate: this.currentMetrics.soilErosion.rate,
            trend: this.currentMetrics.soilErosion.trend
        });

        this.historicalData.carbonStorage.push({
            timestamp,
            emissions: this.currentMetrics.carbonFootprint.emissions,
            sequestration: this.currentMetrics.carbonFootprint.sequestration,
            netBalance: this.currentMetrics.carbonFootprint.netBalance
        });

        this.historicalData.waterUsage.push({
            timestamp,
            usage: this.currentMetrics.waterEfficiency.usage,
            efficiency: this.currentMetrics.waterEfficiency.efficiency
        });

        this.historicalData.biodiversity.push({
            timestamp,
            index: this.currentMetrics.biodiversityIndex.current,
            speciesCount: this.currentMetrics.biodiversityIndex.speciesCount
        });

        // Keep only last 20 records to prevent memory issues
        Object.keys(this.historicalData).forEach(key => {
            if (this.historicalData[key].length > 20) {
                this.historicalData[key] = this.historicalData[key].slice(-20);
            }
        });
    }

    /**
     * Check and update milestone achievements
     */
    checkMilestones() {
        // Check if all major milestones are achieved
        const achievedCount = Object.values(this.milestones).filter(m => m.achieved).length;
        const totalCount = Object.keys(this.milestones).length;

        if (achievedCount === totalCount) {
            this.addEducationalInsight('achievement',
                '🏆 Sustainability Master!',
                'You have achieved all environmental milestones! Your farm is now a model of sustainable agriculture using NASA data-driven decisions.'
            );
        }
    }

    /**
     * Generate educational insights based on current state
     */
    generateEducationalInsights() {
        // Analyze trends and provide educational content
        if (this.historicalData.soilHealth.length >= 3) {
            const recent = this.historicalData.soilHealth.slice(-3);
            const improvementTrend = recent.every((data, i) =>
                i === 0 || data.erosionRate < recent[i-1].erosionRate
            );

            if (improvementTrend) {
                this.addEducationalInsight('trend',
                    'Positive Soil Health Trend 📈',
                    'Your conservation practices are working! NASA SMAP data shows consistent soil improvement over the last 3 seasons.'
                );
            }
        }

        // NASA data accuracy insights
        if (this.season % 4 === 0) { // Yearly insight
            const avgAccuracy = (
                this.nasaDataIntegration.smap.accuracy +
                this.nasaDataIntegration.modis.accuracy +
                this.nasaDataIntegration.gpm.forecastAccuracy
            ) / 3;

            this.addEducationalInsight('nasa-data',
                'NASA Data Reliability Report 🛰️',
                `This year, NASA satellite data averaged ${(avgAccuracy * 100).toFixed(1)}% accuracy. Higher resolution data (like MODIS at 250m) provides more precise field-level insights than lower resolution data (like SMAP at 9km).`
            );
        }
    }

    /**
     * Update NASA data integration and accuracy
     */
    updateNASADataAccuracy() {
        // Simulate NASA data updates with realistic accuracy
        this.nasaDataIntegration.smap.lastUpdate = new Date();
        this.nasaDataIntegration.smap.soilMoisture = 0.3 + Math.random() * 0.4;
        this.nasaDataIntegration.smap.accuracy = 0.92 + Math.random() * 0.06;

        this.nasaDataIntegration.modis.lastUpdate = new Date();
        this.nasaDataIntegration.modis.ndvi = 0.4 + Math.random() * 0.4;
        this.nasaDataIntegration.modis.accuracy = 0.88 + Math.random() * 0.08;

        this.nasaDataIntegration.gpm.lastUpdate = new Date();
        this.nasaDataIntegration.gpm.precipitation = Math.random() * 100;
        this.nasaDataIntegration.gpm.forecastAccuracy = 0.75 + Math.random() * 0.15;
    }

    /**
     * Add educational insight
     */
    addEducationalInsight(category, title, description) {
        this.educationalInsights.unshift({
            id: Date.now(),
            category,
            title,
            description,
            timestamp: `Year ${this.year}, Season ${this.season}`,
            seen: false
        });

        // Keep only last 10 insights
        this.educationalInsights = this.educationalInsights.slice(0, 10);
    }

    /**
     * Generate comprehensive environmental report
     */
    generateEnvironmentalReport() {
        return {
            currentMetrics: this.currentMetrics,
            historicalData: this.historicalData,
            milestones: this.milestones,
            nasaDataIntegration: this.nasaDataIntegration,
            educationalInsights: this.educationalInsights,
            sustainabilityScore: this.calculateSustainabilityScore(),
            projections: this.generateProjections(),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Calculate overall sustainability score
     */
    calculateSustainabilityScore() {
        const soilScore = Math.max(0, 1 - this.currentMetrics.soilErosion.rate);
        const carbonScore = this.currentMetrics.carbonFootprint.netBalance > 0 ? 1 : 0.5;
        const waterScore = Math.min(1, this.currentMetrics.waterEfficiency.efficiency);
        const biodiversityScore = this.currentMetrics.biodiversityIndex.current;
        const resilienceScore = this.currentMetrics.climateResilience.adaptabilityScore;

        return (soilScore + carbonScore + waterScore + biodiversityScore + resilienceScore) / 5;
    }

    /**
     * Generate future projections based on current trends
     */
    generateProjections() {
        const projections = {
            soilHealth: { trend: 'stable', confidence: 0.8 },
            carbonBalance: { trend: 'improving', confidence: 0.7 },
            waterEfficiency: { trend: 'stable', confidence: 0.9 },
            biodiversity: { trend: 'improving', confidence: 0.6 }
        };

        // Analyze historical trends for projections
        if (this.historicalData.soilHealth.length >= 3) {
            const recent = this.historicalData.soilHealth.slice(-3);
            const avgTrend = recent.reduce((sum, data) => sum + data.trend, 0) / recent.length;
            projections.soilHealth.trend = avgTrend > 0.1 ? 'improving' : avgTrend < -0.1 ? 'declining' : 'stable';
        }

        return projections;
    }

    /**
     * Generate recommendations for improvement
     */
    generateRecommendations() {
        const recommendations = [];

        // Soil health recommendations
        if (this.currentMetrics.soilErosion.rate > 0.05) {
            recommendations.push({
                category: 'soil',
                priority: 'high',
                title: 'Reduce Soil Erosion',
                description: 'Consider adopting no-till farming and cover crops. NASA SMAP data shows current soil moisture levels that could benefit from these practices.',
                nasaData: 'SMAP soil moisture monitoring'
            });
        }

        // Carbon recommendations
        if (this.currentMetrics.carbonFootprint.netBalance < 0) {
            recommendations.push({
                category: 'carbon',
                priority: 'medium',
                title: 'Improve Carbon Sequestration',
                description: 'Agroforestry and cover crops can significantly increase carbon storage while maintaining productivity.',
                nasaData: 'MODIS vegetation monitoring'
            });
        }

        // Water efficiency recommendations
        if (this.currentMetrics.waterEfficiency.efficiency < 1.2) {
            recommendations.push({
                category: 'water',
                priority: 'medium',
                title: 'Optimize Water Usage',
                description: 'Precision agriculture techniques combined with NASA SMAP soil moisture data can reduce water usage by 30-40%.',
                nasaData: 'SMAP soil moisture + GPM precipitation'
            });
        }

        return recommendations;
    }

    /**
     * Mark insight as seen
     */
    markInsightAsSeen(insightId) {
        const insight = this.educationalInsights.find(i => i.id === insightId);
        if (insight) {
            insight.seen = true;
        }
    }

    /**
     * Get unseen insights count
     */
    getUnseenInsightsCount() {
        return this.educationalInsights.filter(i => !i.seen).length;
    }
}

// Export for both ES6 modules and global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvironmentalImpactTracker;
}
if (typeof window !== 'undefined') {
    window.EnvironmentalImpactTracker = EnvironmentalImpactTracker;
}

export default EnvironmentalImpactTracker;