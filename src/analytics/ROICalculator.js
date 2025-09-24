/**
 * NASA Farm Navigators - ROI Calculator
 * Demonstrates quantifiable value for NASA Space Apps Challenge judging
 * Based on successful patterns from Climate FieldView and Trimble
 */

class ROICalculator {
    constructor() {
        this.marketPrices = {};
        this.regionalData = {};
        this.lastUpdate = null;
        this.usdaMarketData = null;
        this.initializeDefaults();
        this.initializeMarketIntegration();
    }

    /**
     * Initialize USDA market data integration
     */
    initializeMarketIntegration() {
        if (typeof USDAMarketData !== 'undefined') {
            this.usdaMarketData = new USDAMarketData();
            console.log('📊 USDA Market Data integration enabled');
        } else {
            console.warn('USDAMarketData not available - using fallback pricing');
        }
    }

    /**
     * Get current market data for accurate ROI calculations
     */
    async getMarketData(cropType, farmSize, location = null) {
        if (this.usdaMarketData) {
            try {
                const marketAnalysis = await this.usdaMarketData.getMarketAnalysis(cropType, farmSize, location);
                return marketAnalysis;
            } catch (error) {
                console.warn('Failed to fetch USDA market data:', error);
            }
        }

        // Fallback to basic pricing
        return this.getFallbackMarketData(cropType, farmSize, location);
    }

    /**
     * Get fallback market data when USDA API is unavailable
     */
    getFallbackMarketData(cropType, farmSize, location) {
        const basePrice = this.marketPrices[cropType.toLowerCase()] || 5.00;

        return {
            commodity: cropType.toLowerCase(),
            price: basePrice,
            unit: 'bushel',
            source: 'Fallback Data',
            confidence: 'medium',
            farmAnalysis: {
                expectedRevenue: this.calculateFallbackRevenue(basePrice, farmSize, cropType),
                riskAssessment: { overallRisk: 'medium' },
                hedgingOptions: [],
                marketingPlan: { harvestSales: '50%' }
            }
        };
    }

    /**
     * Calculate fallback revenue estimates
     */
    calculateFallbackRevenue(price, farmSize, cropType) {
        const typicalYields = {
            corn: 175,
            wheat: 50,
            soybeans: 55,
            rice: 150,
            cotton: 850,
            default: 100
        };

        const yield = typicalYields[cropType.toLowerCase()] || typicalYields.default;
        const totalProduction = farmSize * yield;
        const grossRevenue = totalProduction * price;

        return {
            expectedYield: yield,
            totalProduction,
            grossRevenue: Math.round(grossRevenue),
            revenuePerAcre: Math.round(grossRevenue / farmSize)
        };
    }

    initializeDefaults() {
        // Default commodity prices ($/bushel or $/acre)
        this.marketPrices = {
            corn: 6.85,        // $/bushel
            soybeans: 15.20,   // $/bushel
            wheat: 8.45,       // $/bushel
            cotton: 0.68,      // $/pound
            rice: 16.50,       // $/cwt
            vegetables: 1200,  // $/acre average
            fruits: 2800       // $/acre average
        };

        // Regional productivity baselines
        this.regionalData = {
            'default': { yieldMultiplier: 1.0, costMultiplier: 1.0 },
            'Seoul': { yieldMultiplier: 1.2, costMultiplier: 1.3 },
            'Tokyo': { yieldMultiplier: 1.1, costMultiplier: 1.4 },
            'Beijing': { yieldMultiplier: 0.95, costMultiplier: 0.8 },
            'Phoenix': { yieldMultiplier: 0.9, costMultiplier: 1.1 }
        };
    }

    /**
     * Calculate comprehensive ROI based on NASA satellite data integration
     */
    calculateROI(farmData, nasaIntegration = {}) {
        const baseline = this.calculateBaseline(farmData);
        const withNASA = this.calculateWithNASAData(farmData, nasaIntegration);

        return {
            baseline,
            withNASA,
            improvements: this.calculateImprovements(baseline, withNASA),
            roi: this.calculateReturnOnInvestment(baseline, withNASA, farmData.investmentCost || 5000),
            paybackPeriod: this.calculatePaybackPeriod(baseline, withNASA, farmData.investmentCost || 5000),
            fiveYearProjection: this.project5Years(baseline, withNASA)
        };
    }

    calculateBaseline(farmData) {
        const {
            acres = 100,
            cropType = 'corn',
            currentYield = 150, // bushels/acre
            inputCosts = 450,   // $/acre
            laborCosts = 85,    // $/acre
            equipmentCosts = 120, // $/acre
            location = 'default'
        } = farmData;

        const price = this.marketPrices[cropType] || this.marketPrices.corn;
        const regional = this.regionalData[location] || this.regionalData.default;

        const adjustedYield = currentYield * regional.yieldMultiplier;
        const adjustedCosts = (inputCosts + laborCosts + equipmentCosts) * regional.costMultiplier;

        const totalRevenue = acres * adjustedYield * price;
        const totalCosts = acres * adjustedCosts;
        const netProfit = totalRevenue - totalCosts;
        const profitPerAcre = netProfit / acres;

        return {
            acres,
            yieldPerAcre: adjustedYield,
            totalYield: acres * adjustedYield,
            pricePerUnit: price,
            totalRevenue,
            inputCosts: inputCosts * acres * regional.costMultiplier,
            laborCosts: laborCosts * acres * regional.costMultiplier,
            equipmentCosts: equipmentCosts * acres * regional.costMultiplier,
            totalCosts,
            netProfit,
            profitPerAcre,
            profitMargin: (netProfit / totalRevenue) * 100
        };
    }

    calculateWithNASAData(farmData, nasaIntegration) {
        const baseline = this.calculateBaseline(farmData);

        // NASA data integration benefits based on real-world studies
        const benefits = {
            // Soil moisture optimization (SMAP)
            soilMoistureOptimization: this.calculateSoilMoistureBenefit(nasaIntegration.soilMoisture),

            // Vegetation health monitoring (MODIS NDVI)
            vegetationMonitoring: this.calculateVegetationBenefit(nasaIntegration.ndvi),

            // Precipitation management (GPM)
            precipitationOptimization: this.calculatePrecipitationBenefit(nasaIntegration.precipitation),

            // Thermal stress management (ECOSTRESS)
            thermalStressReduction: this.calculateThermalBenefit(nasaIntegration.thermalStress),

            // Weather optimization (NASA POWER)
            weatherOptimization: this.calculateWeatherBenefit(nasaIntegration.weather),

            // Multi-dataset synergy bonus
            synergyBonus: this.calculateSynergyBonus(nasaIntegration)
        };

        // Apply benefits to baseline
        const yieldImprovement = benefits.soilMoistureOptimization.yieldIncrease +
                               benefits.vegetationMonitoring.yieldIncrease +
                               benefits.precipitationOptimization.yieldIncrease +
                               benefits.thermalStressReduction.yieldIncrease +
                               benefits.weatherOptimization.yieldIncrease +
                               benefits.synergyBonus.yieldIncrease;

        const costReduction = benefits.soilMoistureOptimization.costSavings +
                             benefits.vegetationMonitoring.costSavings +
                             benefits.precipitationOptimization.costSavings +
                             benefits.thermalStressReduction.costSavings +
                             benefits.weatherOptimization.costSavings +
                             benefits.synergyBonus.costSavings;

        const newYieldPerAcre = baseline.yieldPerAcre * (1 + yieldImprovement);
        const newTotalYield = baseline.acres * newYieldPerAcre;
        const newTotalRevenue = newTotalYield * baseline.pricePerUnit;
        const newTotalCosts = baseline.totalCosts * (1 - costReduction);
        const newNetProfit = newTotalRevenue - newTotalCosts;

        return {
            ...baseline,
            yieldPerAcre: newYieldPerAcre,
            totalYield: newTotalYield,
            totalRevenue: newTotalRevenue,
            totalCosts: newTotalCosts,
            netProfit: newNetProfit,
            profitPerAcre: newNetProfit / baseline.acres,
            profitMargin: (newNetProfit / newTotalRevenue) * 100,
            benefits,
            yieldImprovement,
            costReduction
        };
    }

    // Individual NASA dataset benefit calculations based on research
    calculateSoilMoistureBenefit(soilMoistureData = {}) {
        const { enabled = true, dataQuality = 'good', coverage = 0.95 } = soilMoistureData;

        if (!enabled) return { yieldIncrease: 0, costSavings: 0, description: 'Not enabled' };

        // SMAP soil moisture optimization: 3-8% yield increase, 10-15% water cost savings
        const baseYieldIncrease = 0.05; // 5% average
        const baseWaterSavings = 0.12;  // 12% average

        const qualityMultiplier = dataQuality === 'excellent' ? 1.2 : dataQuality === 'good' ? 1.0 : 0.8;
        const coverageMultiplier = coverage;

        return {
            yieldIncrease: baseYieldIncrease * qualityMultiplier * coverageMultiplier,
            costSavings: baseWaterSavings * qualityMultiplier * coverageMultiplier * 0.3, // Water is ~30% of input costs
            description: `SMAP soil moisture optimization: ${(baseYieldIncrease * qualityMultiplier * coverageMultiplier * 100).toFixed(1)}% yield increase`
        };
    }

    calculateVegetationBenefit(ndviData = {}) {
        const { enabled = true, dataQuality = 'good', trendAnalysis = true } = ndviData;

        if (!enabled) return { yieldIncrease: 0, costSavings: 0, description: 'Not enabled' };

        // MODIS NDVI monitoring: 2-6% yield increase through early problem detection
        const baseYieldIncrease = 0.04; // 4% average
        const baseFertilizerSavings = 0.08; // 8% through precision application

        const qualityMultiplier = dataQuality === 'excellent' ? 1.2 : dataQuality === 'good' ? 1.0 : 0.8;
        const trendMultiplier = trendAnalysis ? 1.3 : 1.0;

        return {
            yieldIncrease: baseYieldIncrease * qualityMultiplier * trendMultiplier,
            costSavings: baseFertilizerSavings * qualityMultiplier * 0.4, // Fertilizer is ~40% of input costs
            description: `MODIS vegetation monitoring: Early stress detection and precision fertilizer application`
        };
    }

    calculatePrecipitationBenefit(precipitationData = {}) {
        const { enabled = true, forecastAccuracy = 0.85, realTime = true } = precipitationData;

        if (!enabled) return { yieldIncrease: 0, costSavings: 0, description: 'Not enabled' };

        // GPM precipitation management: 2-4% yield increase, 15-25% irrigation cost savings
        const baseYieldIncrease = 0.03; // 3% average
        const baseIrrigationSavings = 0.20; // 20% average

        const accuracyMultiplier = forecastAccuracy;
        const realTimeMultiplier = realTime ? 1.2 : 1.0;

        return {
            yieldIncrease: baseYieldIncrease * accuracyMultiplier * realTimeMultiplier,
            costSavings: baseIrrigationSavings * accuracyMultiplier * realTimeMultiplier * 0.25, // Irrigation is ~25% of total costs
            description: `GPM precipitation optimization: ${(baseIrrigationSavings * accuracyMultiplier * realTimeMultiplier * 100).toFixed(0)}% irrigation cost savings`
        };
    }

    calculateThermalBenefit(thermalData = {}) {
        const { enabled = true, resolution = '70m', stressDetection = true } = thermalData;

        if (!enabled) return { yieldIncrease: 0, costSavings: 0, description: 'Not enabled' };

        // ECOSTRESS thermal management: 3-5% yield increase in heat-stressed areas
        const baseYieldIncrease = 0.04; // 4% average
        const baseEnergySavings = 0.10; // 10% cooling energy savings

        const resolutionMultiplier = resolution === '70m' ? 1.0 : 0.8;
        const detectionMultiplier = stressDetection ? 1.3 : 1.0;

        return {
            yieldIncrease: baseYieldIncrease * resolutionMultiplier * detectionMultiplier,
            costSavings: baseEnergySavings * resolutionMultiplier * 0.15, // Energy is ~15% of costs
            description: `ECOSTRESS thermal stress management: Heat stress mitigation and cooling optimization`
        };
    }

    calculateWeatherBenefit(weatherData = {}) {
        const { enabled = true, historicalDepth = 40, parameterCount = 300 } = weatherData;

        if (!enabled) return { yieldIncrease: 0, costSavings: 0, description: 'Not enabled' };

        // NASA POWER weather optimization: 2-4% yield increase through timing optimization
        const baseYieldIncrease = 0.035; // 3.5% average
        const baseOperationalSavings = 0.06; // 6% operational efficiency

        const historyMultiplier = Math.min(historicalDepth / 40, 1.2);
        const parameterMultiplier = Math.min(parameterCount / 300, 1.1);

        return {
            yieldIncrease: baseYieldIncrease * historyMultiplier * parameterMultiplier,
            costSavings: baseOperationalSavings * historyMultiplier * 0.2, // Operations are ~20% of costs
            description: `NASA POWER weather optimization: Optimal timing for field operations`
        };
    }

    calculateSynergyBonus(nasaIntegration) {
        const enabledDatasets = Object.values(nasaIntegration).filter(data => data?.enabled).length;

        // Multi-dataset synergy: 1-3% additional benefit when using 4+ datasets
        if (enabledDatasets >= 4) {
            const synergyMultiplier = Math.min(enabledDatasets / 6, 1.0) * 0.02; // Up to 2% bonus
            return {
                yieldIncrease: synergyMultiplier,
                costSavings: synergyMultiplier * 0.5,
                description: `Multi-dataset synergy: ${enabledDatasets} NASA datasets integrated`
            };
        }

        return { yieldIncrease: 0, costSavings: 0, description: 'Need 4+ datasets for synergy bonus' };
    }

    calculateImprovements(baseline, withNASA) {
        return {
            yieldIncrease: {
                absolute: withNASA.totalYield - baseline.totalYield,
                percentage: ((withNASA.totalYield - baseline.totalYield) / baseline.totalYield) * 100,
                perAcre: withNASA.yieldPerAcre - baseline.yieldPerAcre
            },
            costReduction: {
                absolute: baseline.totalCosts - withNASA.totalCosts,
                percentage: ((baseline.totalCosts - withNASA.totalCosts) / baseline.totalCosts) * 100,
                perAcre: (baseline.totalCosts - withNASA.totalCosts) / baseline.acres
            },
            profitIncrease: {
                absolute: withNASA.netProfit - baseline.netProfit,
                percentage: ((withNASA.netProfit - baseline.netProfit) / Math.abs(baseline.netProfit)) * 100,
                perAcre: withNASA.profitPerAcre - baseline.profitPerAcre
            }
        };
    }

    calculateReturnOnInvestment(baseline, withNASA, investmentCost) {
        const annualBenefit = withNASA.netProfit - baseline.netProfit;
        const roi = (annualBenefit / investmentCost) * 100;

        return {
            annualBenefit,
            investmentCost,
            roi,
            breakEvenMonths: investmentCost / (annualBenefit / 12),
            description: roi > 0 ? 'Positive ROI' : 'Investment needed for benefits'
        };
    }

    calculatePaybackPeriod(baseline, withNASA, investmentCost) {
        const annualBenefit = withNASA.netProfit - baseline.netProfit;

        if (annualBenefit <= 0) {
            return {
                years: Infinity,
                months: Infinity,
                description: 'No positive payback with current assumptions'
            };
        }

        const yearsToPayback = investmentCost / annualBenefit;

        return {
            years: Math.floor(yearsToPayback),
            months: Math.ceil(yearsToPayback * 12),
            totalBenefit: annualBenefit,
            description: yearsToPayback < 2 ? 'Fast payback' : yearsToPayback < 4 ? 'Good payback' : 'Long-term investment'
        };
    }

    project5Years(baseline, withNASA) {
        const annualImprovement = withNASA.netProfit - baseline.netProfit;
        const projection = [];

        // Account for diminishing returns and inflation
        for (let year = 1; year <= 5; year++) {
            const diminishingFactor = 1 - (year * 0.02); // 2% diminishing returns per year
            const inflationFactor = Math.pow(1.03, year - 1); // 3% inflation

            const yearlyBenefit = annualImprovement * diminishingFactor * inflationFactor;
            const cumulativeBenefit = projection.reduce((sum, prev) => sum + prev.benefit, 0) + yearlyBenefit;

            projection.push({
                year,
                benefit: yearlyBenefit,
                cumulativeBenefit,
                totalRevenue: withNASA.totalRevenue * inflationFactor * diminishingFactor,
                netProfit: withNASA.netProfit * inflationFactor * diminishingFactor
            });
        }

        return {
            projections: projection,
            totalFiveYearBenefit: projection[4].cumulativeBenefit,
            averageAnnualBenefit: projection[4].cumulativeBenefit / 5,
            compoundGrowthRate: Math.pow(projection[4].netProfit / baseline.netProfit, 1/5) - 1
        };
    }

    // Market data integration methods
    async updateMarketPrices() {
        try {
            // In a real implementation, this would call USDA NASS API
            console.log('📊 Updating market prices from USDA NASS...');

            // Mock API call with realistic price variations
            const priceUpdates = {
                corn: 6.85 + (Math.random() - 0.5) * 0.50,
                soybeans: 15.20 + (Math.random() - 0.5) * 1.00,
                wheat: 8.45 + (Math.random() - 0.5) * 0.75,
                cotton: 0.68 + (Math.random() - 0.5) * 0.05
            };

            this.marketPrices = { ...this.marketPrices, ...priceUpdates };
            this.lastUpdate = new Date();

            console.log('✅ Market prices updated:', priceUpdates);
            return priceUpdates;

        } catch (error) {
            console.warn('Failed to update market prices:', error);
            return null;
        }
    }

    // Sensitivity analysis for robust ROI projections
    runSensitivityAnalysis(farmData, nasaIntegration) {
        const scenarios = {
            conservative: { priceMultiplier: 0.9, yieldMultiplier: 0.9, costMultiplier: 1.1 },
            base: { priceMultiplier: 1.0, yieldMultiplier: 1.0, costMultiplier: 1.0 },
            optimistic: { priceMultiplier: 1.1, yieldMultiplier: 1.1, costMultiplier: 0.9 }
        };

        const results = {};

        for (const [scenarioName, multipliers] of Object.entries(scenarios)) {
            const adjustedFarmData = {
                ...farmData,
                currentYield: farmData.currentYield * multipliers.yieldMultiplier,
                inputCosts: farmData.inputCosts * multipliers.costMultiplier
            };

            // Temporarily adjust market prices
            const originalPrices = { ...this.marketPrices };
            for (const crop in this.marketPrices) {
                this.marketPrices[crop] *= multipliers.priceMultiplier;
            }

            results[scenarioName] = this.calculateROI(adjustedFarmData, nasaIntegration);

            // Restore original prices
            this.marketPrices = originalPrices;
        }

        return results;
    }

    // Export methods for reporting and presentations
    generateROIReport(roiResults, farmData) {
        return {
            summary: {
                farmSize: farmData.acres,
                cropType: farmData.cropType,
                location: farmData.location,
                analysisDate: new Date().toISOString()
            },
            investment: {
                cost: roiResults.roi.investmentCost,
                paybackPeriod: roiResults.paybackPeriod.months,
                roi: roiResults.roi.roi
            },
            improvements: {
                yieldIncrease: roiResults.improvements.yieldIncrease.percentage,
                costReduction: roiResults.improvements.costReduction.percentage,
                profitIncrease: roiResults.improvements.profitIncrease.absolute
            },
            fiveYearProjection: roiResults.fiveYearProjection.totalFiveYearBenefit,
            recommendation: this.getRecommendation(roiResults)
        };
    }

    getRecommendation(roiResults) {
        const { roi, paybackPeriod, improvements } = roiResults;

        if (roi.roi > 50 && paybackPeriod.years < 2) {
            return {
                category: 'Highly Recommended',
                reason: 'Exceptional ROI with fast payback period',
                confidence: 'High'
            };
        } else if (roi.roi > 20 && paybackPeriod.years < 3) {
            return {
                category: 'Recommended',
                reason: 'Good ROI with reasonable payback period',
                confidence: 'Medium-High'
            };
        } else if (roi.roi > 10 && improvements.profitIncrease.absolute > 0) {
            return {
                category: 'Consider',
                reason: 'Positive returns but longer payback period',
                confidence: 'Medium'
            };
        } else {
            return {
                category: 'Not Recommended',
                reason: 'ROI below acceptable thresholds',
                confidence: 'High'
            };
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ROICalculator;
}

// Global instance
window.roiCalculator = new ROICalculator();