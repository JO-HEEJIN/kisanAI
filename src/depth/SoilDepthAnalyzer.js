/**
 * NASA Farm Navigators - Soil Depth Analyzer
 * Analyzes and educates about soil moisture depth differences (SMAP L3 vs L4)
 * Critical component for teaching depth awareness as required by NASA challenge
 */

class SoilDepthAnalyzer {
    constructor(options = {}) {
        this.supportedCrops = options.supportedCrops || [
            'corn', 'wheat', 'soybeans', 'cotton', 'almond', 'rice', 'tomatoes', 'lettuce'
        ];

        this.depthLayers = options.depthLayers || ['surface', 'rootZone', 'deep'];

        // Crop-specific root depth information
        this.cropRootDepths = new Map([
            ['corn', { shallow: 30, typical: 120, deep: 180, criticalDepth: 60 }],
            ['wheat', { shallow: 25, typical: 100, deep: 150, criticalDepth: 50 }],
            ['soybeans', { shallow: 20, typical: 80, deep: 120, criticalDepth: 40 }],
            ['cotton', { shallow: 30, typical: 150, deep: 200, criticalDepth: 75 }],
            ['almond', { shallow: 50, typical: 200, deep: 400, criticalDepth: 100 }],
            ['rice', { shallow: 15, typical: 40, deep: 60, criticalDepth: 25 }],
            ['tomatoes', { shallow: 20, typical: 60, deep: 100, criticalDepth: 30 }],
            ['lettuce', { shallow: 10, typical: 30, deep: 45, criticalDepth: 15 }]
        ]);

        // SMAP depth layer specifications
        this.smapLayers = {
            surface: {
                depth: '0-5cm',
                product: 'SMAP L3 Enhanced',
                description: 'Surface soil moisture from microwave brightness temperature',
                penetrationDepth: 5,
                revisitTime: '2-3 days',
                accuracy: '±0.04 m³/m³',
                bestFor: ['Recent precipitation detection', 'Irrigation timing', 'Surface conditions']
            },
            rootZone: {
                depth: '0-100cm',
                product: 'SMAP L4 Root Zone',
                description: 'Root zone soil moisture from data assimilation model',
                penetrationDepth: 100,
                revisitTime: 'Daily',
                accuracy: '±0.05 m³/m³',
                bestFor: ['Crop water stress', 'Irrigation planning', 'Drought monitoring']
            }
        };

        // Educational scenarios for depth understanding
        this.depthScenarios = [
            {
                id: 'surface_dry_roots_wet',
                title: 'Surface Dry, Roots Wet',
                surfaceMoisture: 0.15, // Dry
                rootZoneMoisture: 0.35, // Adequate
                crop: 'corn',
                situation: 'Recent irrigation reached deep soil, surface has dried',
                decision: 'no_irrigation',
                explanation: 'Surface appears dry but root zone has adequate moisture. Surface-only data would be misleading.',
                lesson: 'This demonstrates why root zone data is crucial for irrigation decisions'
            },
            {
                id: 'surface_wet_roots_dry',
                title: 'Surface Wet, Roots Dry',
                surfaceMoisture: 0.30, // Moist
                rootZoneMoisture: 0.15, // Dry
                crop: 'corn',
                situation: 'Light rain wetted surface, but deep soil remains dry',
                decision: 'deep_irrigation',
                explanation: 'Surface moisture masks deeper drought. Plants will soon stress despite wet surface.',
                lesson: 'Surface data alone can hide critical root zone drought conditions'
            },
            {
                id: 'depth_mismatch_shallow_crop',
                title: 'Shallow vs Deep Crop Needs',
                surfaceMoisture: 0.20, // Moderate
                rootZoneMoisture: 0.40, // Good
                crop: 'lettuce',
                situation: 'Shallow-rooted crop depends mainly on surface moisture',
                decision: 'light_irrigation',
                explanation: 'Lettuce roots mostly in top 30cm, so surface moisture is critical despite good deep moisture.',
                lesson: 'Crop rooting depth determines which moisture layer is most important'
            }
        ];

        this.currentAnalysis = null;
        this.educationMode = false;
        this.completedScenarios = [];
    }

    /**
     * Analyze soil moisture by depth for a specific location and crop
     * @param {number} depth - Depth in centimeters
     * @param {Object} moistureData - Moisture data from SMAP L3/L4
     * @param {string} crop - Crop type
     * @returns {Promise<Object>} Depth analysis results
     */
    async analyzeMoistureByDepth(depth, moistureData, crop = 'corn') {
        const cropInfo = this.cropRootDepths.get(crop);
        if (!cropInfo) {
            throw new Error(`Unsupported crop: ${crop}`);
        }

        // Determine which SMAP layer is most relevant for this depth
        const relevantLayer = this.determineRelevantLayer(depth, crop);

        // Extract moisture values
        const surfaceMoisture = moistureData.surface || 0.25;
        const rootZoneMoisture = moistureData.rootZone || 0.25;

        // Analyze depth-specific conditions
        const analysis = {
            targetDepth: depth,
            crop: crop,
            cropRootInfo: cropInfo,
            moistureProfile: {
                surface: {
                    value: surfaceMoisture,
                    depth: '0-5cm',
                    classification: this.classifyMoisture(surfaceMoisture),
                    source: 'SMAP L3'
                },
                rootZone: {
                    value: rootZoneMoisture,
                    depth: '0-100cm',
                    classification: this.classifyMoisture(rootZoneMoisture),
                    source: 'SMAP L4'
                }
            },
            relevantLayer: relevantLayer,
            depthSuitability: this.assessDepthSuitability(depth, crop),
            moistureAtDepth: this.estimateMoistureAtDepth(depth, surfaceMoisture, rootZoneMoisture),
            recommendation: this.generateDepthRecommendation(depth, surfaceMoisture, rootZoneMoisture, crop),
            educational: this.generateDepthEducation(depth, moistureData, crop)
        };

        this.currentAnalysis = analysis;
        return analysis;
    }

    /**
     * Recommend irrigation depth based on crop and conditions
     * @param {string} crop - Crop type
     * @param {Object} moistureData - Current moisture conditions
     * @returns {Object} Irrigation recommendation
     */
    recommendIrrigationDepth(crop, moistureData) {
        const cropInfo = this.cropRootDepths.get(crop);
        if (!cropInfo) {
            throw new Error(`Unsupported crop: ${crop}`);
        }

        const surfaceMoisture = moistureData.surface || 0.25;
        const rootZoneMoisture = moistureData.rootZone || 0.25;

        // Determine irrigation strategy based on moisture profile
        const strategy = this.determineIrrigationStrategy(surfaceMoisture, rootZoneMoisture, crop);

        return {
            crop: crop,
            rootDepthRange: `${cropInfo.shallow}-${cropInfo.deep}cm`,
            criticalDepth: cropInfo.criticalDepth,
            currentConditions: {
                surface: {
                    moisture: surfaceMoisture,
                    status: this.classifyMoisture(surfaceMoisture)
                },
                rootZone: {
                    moisture: rootZoneMoisture,
                    status: this.classifyMoisture(rootZoneMoisture)
                }
            },
            recommendation: strategy,
            educational: {
                explanation: this.explainIrrigationStrategy(strategy, crop),
                depthImportance: this.explainDepthImportance(crop),
                smapDataUsage: this.explainSMAPDataUsage(strategy)
            }
        };
    }

    /**
     * Create interactive depth profile visualization
     * @param {Object} moistureData - Moisture data at different depths
     * @param {string} crop - Crop type for context
     * @returns {Object} Visualization data
     */
    visualizeDepthProfile(moistureData, crop = 'corn') {
        const cropInfo = this.cropRootDepths.get(crop);

        // Create depth profile with moisture interpolation
        const depthProfile = this.createDepthProfile(moistureData, cropInfo);

        return {
            crop: crop,
            profile: depthProfile,
            visualization: {
                type: 'depth_profile',
                layers: this.createVisualizationLayers(depthProfile, crop),
                annotations: this.createDepthAnnotations(cropInfo),
                interactiveElements: this.createInteractiveElements(depthProfile)
            },
            educational: {
                title: `Soil Moisture Profile for ${crop}`,
                description: 'See how moisture varies with depth and how crops access water',
                interpretation: this.interpretDepthProfile(depthProfile, crop)
            }
        };
    }

    /**
     * Teach depth importance through interactive scenarios
     * @returns {Object} Educational content about depth importance
     */
    teachDepthImportance() {
        this.educationMode = true;

        return {
            title: 'Why Soil Depth Matters for Agriculture',
            introduction: 'Different crops have different rooting patterns, and soil moisture varies with depth. Understanding this is crucial for effective irrigation.',
            concepts: [
                {
                    id: 'rooting_patterns',
                    title: 'Crop Rooting Patterns',
                    content: 'Different crops explore soil at different depths',
                    interactive: true,
                    type: 'root_depth_comparison'
                },
                {
                    id: 'smap_layers',
                    title: 'SMAP L3 vs L4 Data',
                    content: 'Surface moisture (L3) vs root zone moisture (L4)',
                    interactive: true,
                    type: 'smap_comparison'
                },
                {
                    id: 'depth_scenarios',
                    title: 'Real-World Scenarios',
                    content: 'When surface and root zone moisture tell different stories',
                    interactive: true,
                    type: 'depth_scenarios'
                }
            ],
            practiceScenarios: this.depthScenarios,
            assessment: this.createDepthAssessment()
        };
    }

    /**
     * Start a depth scenario challenge
     * @param {string} scenarioId - Scenario ID or 'random'
     * @returns {Object} Scenario challenge data
     */
    startDepthScenario(scenarioId = 'random') {
        let scenario;

        if (scenarioId === 'random') {
            const available = this.depthScenarios.filter(s =>
                !this.completedScenarios.includes(s.id)
            );
            scenario = available.length > 0 ?
                available[Math.floor(Math.random() * available.length)] :
                this.depthScenarios[Math.floor(Math.random() * this.depthScenarios.length)];
        } else {
            scenario = this.depthScenarios.find(s => s.id === scenarioId);
        }

        if (!scenario) {
            throw new Error(`Depth scenario not found: ${scenarioId}`);
        }

        return {
            scenario: scenario,
            visualization: this.createScenarioVisualization(scenario),
            question: this.createScenarioQuestion(scenario),
            options: this.createScenarioOptions(scenario),
            educational: {
                smapData: this.explainSMAPDataForScenario(scenario),
                cropContext: this.explainCropContext(scenario)
            }
        };
    }

    /**
     * Submit answer for depth scenario
     * @param {string} scenarioId - Scenario ID
     * @param {string} selectedDecision - User's decision
     * @returns {Object} Result with feedback
     */
    submitDepthScenarioAnswer(scenarioId, selectedDecision) {
        const scenario = this.depthScenarios.find(s => s.id === scenarioId);
        if (!scenario) {
            throw new Error(`Scenario not found: ${scenarioId}`);
        }

        const correct = selectedDecision === scenario.decision;

        if (correct && !this.completedScenarios.includes(scenarioId)) {
            this.completedScenarios.push(scenarioId);
        }

        return {
            correct: correct,
            selectedDecision: selectedDecision,
            correctDecision: scenario.decision,
            explanation: scenario.explanation,
            lesson: scenario.lesson,
            detailedFeedback: this.generateDetailedFeedback(scenario, selectedDecision),
            educational: this.generateScenarioEducation(scenario, selectedDecision)
        };
    }

    /**
     * Classify moisture level
     * @param {number} moisture - Moisture value (0-1)
     * @returns {string} Classification
     */
    classifyMoisture(moisture) {
        if (moisture < 0.15) return 'very_dry';
        if (moisture < 0.25) return 'dry';
        if (moisture < 0.35) return 'moderate';
        if (moisture < 0.45) return 'moist';
        return 'wet';
    }

    /**
     * Determine relevant SMAP layer for depth and crop
     * @param {number} depth - Target depth in cm
     * @param {string} crop - Crop type
     * @returns {Object} Relevant layer information
     */
    determineRelevantLayer(depth, crop) {
        const cropInfo = this.cropRootDepths.get(crop);

        if (depth <= 5) {
            return {
                layer: 'surface',
                relevance: 'high',
                reason: 'SMAP L3 directly measures this depth range',
                ...this.smapLayers.surface
            };
        } else if (depth <= cropInfo.criticalDepth) {
            return {
                layer: 'rootZone',
                relevance: 'high',
                reason: 'Within critical root zone for this crop',
                ...this.smapLayers.rootZone
            };
        } else if (depth <= 100) {
            return {
                layer: 'rootZone',
                relevance: 'moderate',
                reason: 'SMAP L4 covers this depth but at lower resolution',
                ...this.smapLayers.rootZone
            };
        } else {
            return {
                layer: 'none',
                relevance: 'low',
                reason: 'Beyond SMAP measurement depth',
                description: 'Requires additional data sources or modeling'
            };
        }
    }

    /**
     * Assess depth suitability for analysis
     * @param {number} depth - Target depth
     * @param {string} crop - Crop type
     * @returns {Object} Suitability assessment
     */
    assessDepthSuitability(depth, crop) {
        const cropInfo = this.cropRootDepths.get(crop);

        let suitability = 'poor';
        let reason = '';

        if (depth <= cropInfo.shallow) {
            suitability = 'excellent';
            reason = 'Within shallow root zone - critical for early growth';
        } else if (depth <= cropInfo.criticalDepth) {
            suitability = 'good';
            reason = 'Within critical root zone - important for water uptake';
        } else if (depth <= cropInfo.typical) {
            suitability = 'moderate';
            reason = 'Within typical root zone - relevant for mature plants';
        } else if (depth <= cropInfo.deep) {
            suitability = 'fair';
            reason = 'Deep root zone - accessed during water stress';
        } else {
            suitability = 'poor';
            reason = 'Beyond typical root zone for this crop';
        }

        return {
            suitability: suitability,
            reason: reason,
            depth: depth,
            cropRootRange: `${cropInfo.shallow}-${cropInfo.deep}cm`
        };
    }

    /**
     * Estimate moisture at specific depth
     * @param {number} depth - Target depth in cm
     * @param {number} surfaceMoisture - Surface moisture (0-5cm)
     * @param {number} rootZoneMoisture - Root zone moisture (0-100cm)
     * @returns {number} Estimated moisture at depth
     */
    estimateMoistureAtDepth(depth, surfaceMoisture, rootZoneMoisture) {
        if (depth <= 5) {
            return surfaceMoisture;
        } else if (depth <= 100) {
            // Linear interpolation weighted toward root zone
            const weight = Math.min(1, depth / 100);
            return surfaceMoisture * (1 - weight) + rootZoneMoisture * weight;
        } else {
            // Assume moisture decreases beyond 100cm
            return rootZoneMoisture * 0.8;
        }
    }

    /**
     * Generate depth-specific recommendation
     * @param {number} depth - Target depth
     * @param {number} surfaceMoisture - Surface moisture
     * @param {number} rootZoneMoisture - Root zone moisture
     * @param {string} crop - Crop type
     * @returns {Object} Recommendation
     */
    generateDepthRecommendation(depth, surfaceMoisture, rootZoneMoisture, crop) {
        const estimatedMoisture = this.estimateMoistureAtDepth(depth, surfaceMoisture, rootZoneMoisture);
        const moistureClass = this.classifyMoisture(estimatedMoisture);
        const cropInfo = this.cropRootDepths.get(crop);

        let action = 'monitor';
        let urgency = 'low';
        let reason = '';

        if (depth <= cropInfo.criticalDepth) {
            if (moistureClass === 'very_dry' || moistureClass === 'dry') {
                action = 'irrigate';
                urgency = 'high';
                reason = 'Critical root zone is dry - immediate irrigation needed';
            } else if (moistureClass === 'moderate') {
                action = 'monitor';
                urgency = 'medium';
                reason = 'Critical root zone has adequate moisture but should be monitored';
            }
        } else if (depth <= cropInfo.typical) {
            if (moistureClass === 'very_dry') {
                action = 'plan_irrigation';
                urgency = 'medium';
                reason = 'Secondary root zone is dry - plan deeper irrigation';
            }
        }

        return {
            action: action,
            urgency: urgency,
            reason: reason,
            estimatedMoisture: estimatedMoisture,
            moistureClass: moistureClass,
            depth: depth,
            cropRelevance: depth <= cropInfo.deep ? 'relevant' : 'limited'
        };
    }

    /**
     * Generate educational content about depth analysis
     * @param {number} depth - Target depth
     * @param {Object} moistureData - Moisture data
     * @param {string} crop - Crop type
     * @returns {Object} Educational content
     */
    generateDepthEducation(depth, moistureData, crop) {
        const cropInfo = this.cropRootDepths.get(crop);

        return {
            depthContext: `Analyzing ${depth}cm depth for ${crop}`,
            cropRootInfo: {
                shallowRoots: `${cropInfo.shallow}cm - Early growth and surface feeding`,
                criticalDepth: `${cropInfo.criticalDepth}cm - Main water uptake zone`,
                typicalDepth: `${cropInfo.typical}cm - Full development depth`,
                deepRoots: `${cropInfo.deep}cm - Stress response depth`
            },
            smapComparison: {
                surface: {
                    data: `SMAP L3: ${moistureData.surface || 'N/A'} m³/m³`,
                    represents: 'Top 5cm of soil - recent precipitation and surface conditions',
                    limitations: 'May not represent root zone conditions'
                },
                rootZone: {
                    data: `SMAP L4: ${moistureData.rootZone || 'N/A'} m³/m³`,
                    represents: 'Top 100cm average - plant available water',
                    limitations: 'Averaged over large depth range'
                }
            },
            keyLearning: this.generateDepthKeyLearning(depth, crop),
            nextSteps: this.suggestDepthNextSteps(depth, crop)
        };
    }

    /**
     * Additional helper methods for creating visualizations, assessments, etc.
     */

    determineIrrigationStrategy(surfaceMoisture, rootZoneMoisture, crop) {
        const surfaceClass = this.classifyMoisture(surfaceMoisture);
        const rootZoneClass = this.classifyMoisture(rootZoneMoisture);

        if (rootZoneClass === 'very_dry' || rootZoneClass === 'dry') {
            return {
                type: 'deep_irrigation',
                amount: 'high',
                priority: 'urgent',
                reason: 'Root zone moisture is critically low'
            };
        } else if (surfaceClass === 'very_dry' && rootZoneClass === 'moderate') {
            return {
                type: 'light_irrigation',
                amount: 'low',
                priority: 'medium',
                reason: 'Surface dry but roots have access to deeper moisture'
            };
        } else if (surfaceClass === 'moist' && rootZoneClass === 'dry') {
            return {
                type: 'deep_irrigation',
                amount: 'medium',
                priority: 'high',
                reason: 'Surface moisture masks deeper drought'
            };
        } else {
            return {
                type: 'monitor',
                amount: 'none',
                priority: 'low',
                reason: 'Adequate moisture at relevant depths'
            };
        }
    }

    createDepthProfile(moistureData, cropInfo) {
        const depths = [0, 5, 15, 30, 50, 75, 100, 150];
        const profile = depths.map(depth => ({
            depth: depth,
            moisture: this.estimateMoistureAtDepth(depth, moistureData.surface, moistureData.rootZone),
            relevance: this.assessDepthRelevance(depth, cropInfo),
            smapCoverage: depth <= 5 ? 'L3_direct' : depth <= 100 ? 'L4_model' : 'extrapolated'
        }));

        return profile;
    }

    assessDepthRelevance(depth, cropInfo) {
        if (depth <= cropInfo.shallow) return 'critical';
        if (depth <= cropInfo.criticalDepth) return 'high';
        if (depth <= cropInfo.typical) return 'moderate';
        if (depth <= cropInfo.deep) return 'low';
        return 'minimal';
    }

    update(deltaTime) {
        // Update any time-based educational content
        if (this.educationMode) {
            // Handle educational timers, animations, etc.
        }
    }

    // Placeholder methods for additional functionality
    explainIrrigationStrategy(strategy, crop) { return `${strategy.type} recommended for ${crop}`; }
    explainDepthImportance(crop) { return `Depth matters for ${crop} because...`; }
    explainSMAPDataUsage(strategy) { return `SMAP data supports ${strategy.type}...`; }
    createVisualizationLayers(profile, crop) { return []; }
    createDepthAnnotations(cropInfo) { return []; }
    createInteractiveElements(profile) { return []; }
    interpretDepthProfile(profile, crop) { return `Profile shows...`; }
    createDepthAssessment() { return { questions: [] }; }
    createScenarioVisualization(scenario) { return {}; }
    createScenarioQuestion(scenario) { return scenario.title; }
    createScenarioOptions(scenario) { return []; }
    explainSMAPDataForScenario(scenario) { return `SMAP shows...`; }
    explainCropContext(scenario) { return `For ${scenario.crop}...`; }
    generateDetailedFeedback(scenario, selected) { return { feedback: 'Detailed feedback...' }; }
    generateScenarioEducation(scenario, selected) { return { education: 'Educational content...' }; }
    generateDepthKeyLearning(depth, crop) { return `Key learning for ${depth}cm and ${crop}...`; }
    suggestDepthNextSteps(depth, crop) { return ['Next step 1', 'Next step 2']; }
}

export { SoilDepthAnalyzer };