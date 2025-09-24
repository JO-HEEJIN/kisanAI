/**
 * Conservation Farming System
 * Implements sustainable and conservation-focused agricultural practices
 */
class ConservationFarmingSystem {
    constructor(farmSimulation) {
        this.farmSimulation = farmSimulation;

        // Conservation practices tracking
        this.practices = {
            noTill: {
                name: 'No-Till Farming',
                description: '최소 경운으로 토양 구조 보존',
                implemented: false,
                benefits: {
                    soilHealth: 0.15,
                    carbonStorage: 0.2,
                    waterRetention: 0.1,
                    fuelSavings: 0.3
                },
                requirements: {
                    initialCost: 5000,
                    maintenanceCost: 200,
                    cropYieldReduction: 0.05 // 첫 2년
                }
            },
            coverCrops: {
                name: 'Cover Crops',
                description: '피복작물로 토양 보호 및 영양분 보충',
                implemented: false,
                benefits: {
                    soilHealth: 0.2,
                    erosionControl: 0.4,
                    nitrogenFixation: 0.15,
                    pestControl: 0.1
                },
                requirements: {
                    seedCost: 50, // per hectare
                    laborCost: 30,
                    landUse: 0.1 // 10% of land for cover crops
                }
            },
            cropRotation: {
                name: 'Diverse Crop Rotation',
                description: '다양한 작물 순환으로 토양 건강 증진',
                implemented: false,
                benefits: {
                    soilHealth: 0.25,
                    pestResistance: 0.3,
                    nutrientCycling: 0.2,
                    biodiversity: 0.4
                },
                requirements: {
                    planningTime: 4, // seasons
                    knowledgeLevel: 'advanced',
                    yieldVariability: 0.1
                }
            },
            precisionAgriculture: {
                name: 'Precision Agriculture with NASA Data',
                description: 'NASA 위성 데이터를 활용한 정밀 농업',
                implemented: false,
                benefits: {
                    inputEfficiency: 0.3,
                    yieldOptimization: 0.15,
                    environmentalImpact: -0.25,
                    dataAccuracy: 0.4
                },
                requirements: {
                    technologyCost: 15000,
                    trainingCost: 2000,
                    subscriptionCost: 500 // annually
                }
            },
            agroforestry: {
                name: 'Agroforestry Integration',
                description: '농업과 임업의 결합으로 생태계 서비스 향상',
                implemented: false,
                benefits: {
                    carbonSequestration: 0.5,
                    biodiversity: 0.6,
                    windProtection: 0.3,
                    alternativeIncome: 0.2
                },
                requirements: {
                    establishmentCost: 8000,
                    timeToMaturity: 20, // seasons
                    landUse: 0.15,
                    longTermCommitment: true
                }
            }
        };

        // Environmental metrics tracking
        this.environmentalMetrics = {
            soilHealth: {
                current: 0.5,
                baseline: 0.5,
                trend: 0,
                factors: ['organicMatter', 'microbialActivity', 'structure']
            },
            carbonSequestration: {
                current: 0,
                accumulated: 0,
                potential: 0,
                rate: 0 // tons CO2/hectare/year
            },
            biodiversity: {
                current: 0.3,
                baseline: 0.3,
                indicators: ['soilMicrobes', 'beneficialInsects', 'plantDiversity']
            },
            waterQuality: {
                current: 0.7,
                nitrateLeaching: 0.3,
                runoffReduction: 0
            },
            erosionControl: {
                current: 0.6,
                soilLossRate: 2.5, // tons/hectare/year
                targetRate: 1.0
            }
        };

        // Long-term tracking (seasons)
        this.longTermData = {
            yieldTrends: [],
            costTrends: [],
            environmentalTrends: [],
            practiceAdoption: []
        };

        this.currentSeason = 0;
    }

    /**
     * Get available conservation practices
     */
    getAvailablePractices() {
        return Object.entries(this.practices).map(([id, practice]) => ({
            id,
            ...practice,
            canImplement: this.canImplementPractice(id),
            costBenefit: this.calculateCostBenefit(id)
        }));
    }

    /**
     * Check if practice can be implemented
     */
    canImplementPractice(practiceId) {
        const practice = this.practices[practiceId];
        const farmState = this.farmSimulation.getFarmState();

        if (practice.implemented) {
            return { possible: false, reason: 'Already implemented' };
        }

        // Check financial requirements
        if (practice.requirements.initialCost &&
            farmState.resources.money < practice.requirements.initialCost) {
            return {
                possible: false,
                reason: `Insufficient funds (need $${practice.requirements.initialCost})`
            };
        }

        // Check knowledge level requirements
        if (practice.requirements.knowledgeLevel === 'advanced' &&
            farmState.playerStats.totalScore < 1000) {
            return {
                possible: false,
                reason: 'Requires advanced farming experience'
            };
        }

        // Check land requirements
        if (practice.requirements.landUse) {
            const requiredLand = farmState.farmSize * practice.requirements.landUse;
            if (farmState.availableLand < requiredLand) {
                return {
                    possible: false,
                    reason: `Insufficient available land (need ${requiredLand} hectares)`
                };
            }
        }

        return { possible: true };
    }

    /**
     * Calculate cost-benefit analysis
     */
    calculateCostBenefit(practiceId) {
        const practice = this.practices[practiceId];
        const farmState = this.farmSimulation.getFarmState();
        const timeHorizon = 20; // seasons (5 years)

        let totalCosts = practice.requirements.initialCost || 0;
        let totalBenefits = 0;

        // Calculate ongoing costs
        for (let season = 1; season <= timeHorizon; season++) {
            // Maintenance costs
            if (practice.requirements.maintenanceCost) {
                totalCosts += practice.requirements.maintenanceCost;
            }

            // Seed/input costs
            if (practice.requirements.seedCost) {
                totalCosts += practice.requirements.seedCost * farmState.farmSize;
            }

            // Calculate benefits
            const seasonalBenefits = this.calculateSeasonalBenefits(practiceId, season);
            totalBenefits += seasonalBenefits;
        }

        const roi = totalBenefits > 0 ? ((totalBenefits - totalCosts) / totalCosts) * 100 : -100;
        const paybackPeriod = totalBenefits > 0 ? totalCosts / (totalBenefits / timeHorizon) : Infinity;

        return {
            totalCosts,
            totalBenefits,
            roi,
            paybackPeriod,
            environmentalValue: this.calculateEnvironmentalValue(practiceId)
        };
    }

    /**
     * Calculate seasonal benefits of a practice
     */
    calculateSeasonalBenefits(practiceId, season) {
        const practice = this.practices[practiceId];
        const farmState = this.farmSimulation.getFarmState();
        let benefits = 0;

        // Fuel savings
        if (practice.benefits.fuelSavings) {
            const fuelCostSaved = farmState.farmSize * 50 * practice.benefits.fuelSavings;
            benefits += fuelCostSaved;
        }

        // Input efficiency (fertilizer/pesticide savings)
        if (practice.benefits.inputEfficiency) {
            const inputSavings = farmState.farmSize * 100 * practice.benefits.inputEfficiency;
            benefits += inputSavings;
        }

        // Yield improvements (after initial adjustment period)
        if (season > 4 && practice.benefits.yieldOptimization) {
            const yieldIncrease = farmState.farmSize * 200 * practice.benefits.yieldOptimization;
            benefits += yieldIncrease;
        }

        // Alternative income streams
        if (practice.benefits.alternativeIncome && season > practice.requirements.timeToMaturity) {
            const altIncome = farmState.farmSize * practice.requirements.landUse * 500;
            benefits += altIncome;
        }

        return benefits;
    }

    /**
     * Calculate environmental value (for carbon credits, etc.)
     */
    calculateEnvironmentalValue(practiceId) {
        const practice = this.practices[practiceId];
        const farmState = this.farmSimulation.getFarmState();
        let value = 0;

        // Carbon sequestration value
        if (practice.benefits.carbonSequestration) {
            const carbonValue = farmState.farmSize * practice.benefits.carbonSequestration * 15; // $15/ton CO2
            value += carbonValue;
        }

        // Biodiversity credits
        if (practice.benefits.biodiversity) {
            const biodiversityValue = farmState.farmSize * practice.benefits.biodiversity * 10;
            value += biodiversityValue;
        }

        // Water quality improvement value
        if (practice.benefits.erosionControl) {
            const waterValue = farmState.farmSize * practice.benefits.erosionControl * 5;
            value += waterValue;
        }

        return value;
    }

    /**
     * Implement a conservation practice
     */
    implementPractice(practiceId) {
        const practice = this.practices[practiceId];
        const canImplement = this.canImplementPractice(practiceId);

        if (!canImplement.possible) {
            return {
                success: false,
                message: canImplement.reason
            };
        }

        const farmState = this.farmSimulation.getFarmState();

        // Deduct costs
        if (practice.requirements.initialCost) {
            farmState.resources.money -= practice.requirements.initialCost;
        }

        // Update land use
        if (practice.requirements.landUse) {
            const usedLand = farmState.farmSize * practice.requirements.landUse;
            farmState.availableLand -= usedLand;
        }

        // Mark as implemented
        practice.implemented = true;
        practice.implementationSeason = this.currentSeason;

        // Apply immediate benefits
        this.applyPracticeBenefits(practiceId);

        // Track implementation
        this.longTermData.practiceAdoption.push({
            season: this.currentSeason,
            practice: practiceId,
            cost: practice.requirements.initialCost || 0
        });

        return {
            success: true,
            message: `Successfully implemented ${practice.name}`,
            practice: practice
        };
    }

    /**
     * Apply benefits of implemented practice
     */
    applyPracticeBenefits(practiceId) {
        const practice = this.practices[practiceId];

        // Update environmental metrics
        Object.entries(practice.benefits).forEach(([benefit, value]) => {
            switch(benefit) {
                case 'soilHealth':
                    this.environmentalMetrics.soilHealth.current = Math.min(1.0,
                        this.environmentalMetrics.soilHealth.current + value);
                    break;
                case 'carbonSequestration':
                    this.environmentalMetrics.carbonSequestration.rate += value;
                    break;
                case 'biodiversity':
                    this.environmentalMetrics.biodiversity.current = Math.min(1.0,
                        this.environmentalMetrics.biodiversity.current + value);
                    break;
                case 'erosionControl':
                    this.environmentalMetrics.erosionControl.current = Math.min(1.0,
                        this.environmentalMetrics.erosionControl.current + value);
                    break;
            }
        });
    }

    /**
     * Update system each season
     */
    updateSeason() {
        this.currentSeason++;

        // Update environmental metrics
        this.updateEnvironmentalMetrics();

        // Apply ongoing benefits
        this.applyOngoingBenefits();

        // Record seasonal data
        this.recordSeasonalData();

        // Check for natural improvements
        this.processNaturalProgression();
    }

    /**
     * Update environmental metrics based on implemented practices
     */
    updateEnvironmentalMetrics() {
        const implementedPractices = Object.values(this.practices).filter(p => p.implemented);

        // Soil health progression
        let soilHealthChange = 0;
        implementedPractices.forEach(practice => {
            if (practice.benefits.soilHealth) {
                const ageBonus = Math.min(this.currentSeason - practice.implementationSeason, 8) * 0.01;
                soilHealthChange += practice.benefits.soilHealth * 0.1 + ageBonus;
            }
        });

        this.environmentalMetrics.soilHealth.current = Math.min(1.0,
            this.environmentalMetrics.soilHealth.current + soilHealthChange);

        // Carbon accumulation
        if (this.environmentalMetrics.carbonSequestration.rate > 0) {
            this.environmentalMetrics.carbonSequestration.accumulated +=
                this.environmentalMetrics.carbonSequestration.rate;
        }

        // Biodiversity changes
        implementedPractices.forEach(practice => {
            if (practice.benefits.biodiversity &&
                this.currentSeason - practice.implementationSeason > 2) {
                const diversityBoost = practice.benefits.biodiversity * 0.05;
                this.environmentalMetrics.biodiversity.current = Math.min(1.0,
                    this.environmentalMetrics.biodiversity.current + diversityBoost);
            }
        });
    }

    /**
     * Apply ongoing benefits to farm state
     */
    applyOngoingBenefits() {
        const farmState = this.farmSimulation.getFarmState();
        const implementedPractices = Object.values(this.practices).filter(p => p.implemented);

        implementedPractices.forEach(practice => {
            // Reduce input costs
            if (practice.benefits.inputEfficiency) {
                const reduction = practice.benefits.inputEfficiency * 0.1;
                farmState.resources.fertilizer *= (1 + reduction);
            }

            // Improve water efficiency
            if (practice.benefits.waterRetention) {
                const waterEfficiency = practice.benefits.waterRetention * 0.1;
                farmState.environmentalData.waterConsumptionMultiplier *= (1 - waterEfficiency);
            }
        });
    }

    /**
     * Record seasonal data for long-term analysis
     */
    recordSeasonalData() {
        const farmState = this.farmSimulation.getFarmState();

        this.longTermData.yieldTrends.push({
            season: this.currentSeason,
            yield: this.calculateAverageYield(),
            practices: Object.keys(this.practices).filter(id => this.practices[id].implemented)
        });

        this.longTermData.environmentalTrends.push({
            season: this.currentSeason,
            soilHealth: this.environmentalMetrics.soilHealth.current,
            carbonStored: this.environmentalMetrics.carbonSequestration.accumulated,
            biodiversity: this.environmentalMetrics.biodiversity.current
        });

        this.longTermData.costTrends.push({
            season: this.currentSeason,
            totalCosts: this.calculateSeasonalCosts(),
            savings: this.calculateSeasonalSavings()
        });
    }

    /**
     * Calculate average yield across all crops
     */
    calculateAverageYield() {
        const farmState = this.farmSimulation.getFarmState();
        const crops = farmState.crops;

        if (crops.length === 0) return 0;

        const totalYield = crops.reduce((sum, crop) => {
            return sum + (crop.area * crop.expectedYield);
        }, 0);

        return totalYield / farmState.farmSize;
    }

    /**
     * Calculate seasonal costs for conservation practices
     */
    calculateSeasonalCosts() {
        let costs = 0;
        Object.values(this.practices).forEach(practice => {
            if (practice.implemented) {
                costs += practice.requirements.maintenanceCost || 0;
                costs += practice.requirements.subscriptionCost || 0;
            }
        });
        return costs;
    }

    /**
     * Calculate seasonal savings from conservation practices
     */
    calculateSeasonalSavings() {
        const farmState = this.farmSimulation.getFarmState();
        let savings = 0;

        Object.values(this.practices).forEach(practice => {
            if (practice.implemented) {
                // Fuel savings
                if (practice.benefits.fuelSavings) {
                    savings += farmState.farmSize * 50 * practice.benefits.fuelSavings;
                }

                // Input savings
                if (practice.benefits.inputEfficiency) {
                    savings += farmState.farmSize * 30 * practice.benefits.inputEfficiency;
                }
            }
        });

        return savings;
    }

    /**
     * Process natural environmental progression
     */
    processNaturalProgression() {
        // Natural soil degradation without conservation
        const conservationScore = this.getConservationScore();

        if (conservationScore < 0.3) {
            // Significant degradation
            this.environmentalMetrics.soilHealth.current *= 0.98;
            this.environmentalMetrics.erosionControl.current *= 0.97;
        } else if (conservationScore < 0.6) {
            // Moderate degradation
            this.environmentalMetrics.soilHealth.current *= 0.995;
        }
        // No degradation if conservation score > 0.6
    }

    /**
     * Calculate overall conservation score
     */
    getConservationScore() {
        const totalPractices = Object.keys(this.practices).length;
        const implementedCount = Object.values(this.practices).filter(p => p.implemented).length;

        return implementedCount / totalPractices;
    }

    /**
     * Get comprehensive sustainability report
     */
    getSustainabilityReport() {
        const farmState = this.farmSimulation.getFarmState();
        const conservationScore = this.getConservationScore();

        return {
            overall: {
                conservationScore,
                sustainabilityGrade: this.getGrade(conservationScore),
                timespan: this.currentSeason
            },
            environmental: {
                soilHealth: {
                    current: this.environmentalMetrics.soilHealth.current,
                    change: this.environmentalMetrics.soilHealth.current - this.environmentalMetrics.soilHealth.baseline,
                    trend: this.calculateTrend('soilHealth')
                },
                carbonImpact: {
                    sequestered: this.environmentalMetrics.carbonSequestration.accumulated,
                    rate: this.environmentalMetrics.carbonSequestration.rate,
                    equivalent: this.environmentalMetrics.carbonSequestration.accumulated * 2.2 // cars off road
                },
                biodiversity: {
                    current: this.environmentalMetrics.biodiversity.current,
                    change: this.environmentalMetrics.biodiversity.current - this.environmentalMetrics.biodiversity.baseline
                }
            },
            economic: {
                totalInvestment: this.calculateTotalInvestment(),
                annualSavings: this.calculateAnnualSavings(),
                roi: this.calculateOverallROI(),
                carbonCredits: this.environmentalMetrics.carbonSequestration.accumulated * 15
            },
            practices: {
                implemented: Object.values(this.practices).filter(p => p.implemented).map(p => p.name),
                recommended: this.getRecommendations()
            },
            trends: {
                yield: this.longTermData.yieldTrends.slice(-10),
                environmental: this.longTermData.environmentalTrends.slice(-10),
                costs: this.longTermData.costTrends.slice(-10)
            }
        };
    }

    /**
     * Calculate trend for environmental metric
     */
    calculateTrend(metric) {
        const data = this.longTermData.environmentalTrends.slice(-5);
        if (data.length < 2) return 0;

        const recent = data[data.length - 1][metric];
        const past = data[0][metric];
        return (recent - past) / data.length;
    }

    /**
     * Get sustainability grade
     */
    getGrade(score) {
        if (score >= 0.9) return 'A+';
        if (score >= 0.8) return 'A';
        if (score >= 0.7) return 'B+';
        if (score >= 0.6) return 'B';
        if (score >= 0.5) return 'C+';
        if (score >= 0.4) return 'C';
        return 'D';
    }

    /**
     * Calculate total investment in conservation
     */
    calculateTotalInvestment() {
        return Object.values(this.practices)
            .filter(p => p.implemented)
            .reduce((sum, p) => sum + (p.requirements.initialCost || 0), 0);
    }

    /**
     * Calculate annual savings
     */
    calculateAnnualSavings() {
        return this.longTermData.costTrends.slice(-4).reduce((sum, data) => sum + data.savings, 0);
    }

    /**
     * Calculate overall ROI
     */
    calculateOverallROI() {
        const investment = this.calculateTotalInvestment();
        const savings = this.calculateAnnualSavings();
        return investment > 0 ? (savings / investment) * 100 : 0;
    }

    /**
     * Get practice recommendations
     */
    getRecommendations() {
        const farmState = this.farmSimulation.getFarmState();
        const recommendations = [];

        Object.entries(this.practices).forEach(([id, practice]) => {
            if (!practice.implemented) {
                const costBenefit = this.calculateCostBenefit(id);
                const canImplement = this.canImplementPractice(id);

                if (canImplement.possible && costBenefit.roi > 20) {
                    recommendations.push({
                        practice: practice.name,
                        priority: costBenefit.roi > 50 ? 'high' : 'medium',
                        reason: `Expected ROI: ${costBenefit.roi.toFixed(0)}%`,
                        payback: `${costBenefit.paybackPeriod.toFixed(1)} seasons`
                    });
                }
            }
        });

        return recommendations.sort((a, b) =>
            (a.priority === 'high' ? 1 : 0) - (b.priority === 'high' ? 1 : 0));
    }

    /**
     * Get active conservation practices
     */
    getActivePractices() {
        const activePractices = {};
        Object.entries(this.practices).forEach(([id, practice]) => {
            if (practice.adopted) {
                activePractices[id] = true;
            }
        });
        return activePractices;
    }

    /**
     * Generate conservation report for dashboard
     */
    generateReport() {
        // Get current year/season from farm simulation
        const farmState = this.farmSimulation?.getFarmState();
        const currentYear = farmState?.currentYear || 1;
        const currentSeason = farmState?.currentSeason || 'spring';

        // Process practices data
        const processedPractices = {};
        Object.entries(this.practices).forEach(([id, practice]) => {
            processedPractices[id] = {
                name: practice.name,
                adopted: practice.adopted || false,
                requirements: {
                    initialCost: practice.requirements?.initialCost || 1000,
                    timeToROI: Math.ceil((practice.requirements?.initialCost || 1000) / 500)
                },
                totalBenefits: practice.adopted ? (practice.benefits?.fuelSavings || 0.1) * 2000 : 0,
                environmentalImpact: practice.adopted ? (practice.benefits?.soilHealth || 0.1) * 10 : 0
            };
        });

        // Environmental metrics
        const environmentalMetrics = {
            soilHealth: {
                current: 0.75 + (Object.values(this.practices).filter(p => p.adopted).length * 0.05),
                trend: 0.02
            },
            carbonSequestration: {
                accumulated: currentYear * 2.5,
                rate: 2.5
            },
            biodiversityIndex: {
                current: 0.65 + (Object.values(this.practices).filter(p => p.adopted).length * 0.03),
                trend: 0.015
            }
        };

        // Economic summary
        const adoptedPractices = Object.values(processedPractices).filter(p => p.adopted);
        const economicSummary = {
            totalSavings: adoptedPractices.reduce((sum, p) => sum + p.totalBenefits, 0),
            averageROI: adoptedPractices.length > 0 ? 0.15 : 0,
            sustainabilityScore: Math.min(10, 6 + adoptedPractices.length * 0.8)
        };

        return {
            practices: processedPractices,
            environmentalMetrics,
            economicSummary
        };
    }

    /**
     * Adopt a conservation practice
     */
    adoptPractice(practiceId) {
        const practice = this.practices[practiceId];
        if (!practice) {
            return { success: false, message: 'Practice not found' };
        }

        if (practice.adopted) {
            return { success: false, message: 'Practice already adopted' };
        }

        const farmState = this.farmSimulation?.getFarmState();
        const cost = practice.requirements?.initialCost || 1000;

        if (farmState && farmState.resources.money < cost) {
            return {
                success: false,
                message: `Not enough money. Need $${cost}, have $${farmState.resources.money}`
            };
        }

        // Adopt the practice
        practice.adopted = true;

        // Deduct cost if farm simulation is available
        if (farmState) {
            farmState.resources.money -= cost;
        }

        return {
            success: true,
            practice: {
                name: practice.name,
                cost: cost
            }
        };
    }
}

// Export for both ES6 modules and global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConservationFarmingSystem;
}
if (typeof window !== 'undefined') {
    window.ConservationFarmingSystem = ConservationFarmingSystem;
}