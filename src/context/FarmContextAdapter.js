/**
 * NASA Farm Navigators - Farm Context Adapter
 * Adapts the application interface and functionality for different farming contexts
 * Supports smallholder and industrial farming scenarios as required by NASA challenge
 */

class FarmContextAdapter {
    constructor(options = {}) {
        this.contexts = options.contexts || ['smallholder', 'industrial'];
        this.defaultContext = options.defaultContext || 'tutorial';
        this.currentContext = null;

        // Context-specific configurations
        this.contextConfigs = new Map([
            ['smallholder', {
                name: 'Smallholder Farm',
                description: 'Small-scale farming operations (0.5-10 hectares)',
                farmSize: { min: 0.5, max: 10, typical: 2 },
                resources: {
                    budget: 'limited',
                    technology: 'basic',
                    water: 'constrained',
                    labor: 'family'
                },
                constraints: [
                    'Limited capital for precision equipment',
                    'Minimal technical infrastructure',
                    'Weather-dependent irrigation',
                    'Manual field monitoring'
                ],
                features: {
                    manualFieldDrawing: true,
                    basicIrrigation: true,
                    rainfallDependence: true,
                    simplifiedAnalytics: true,
                    mobileOptimized: true,
                    precisionEquipment: false,
                    variableRateApplication: false,
                    advancedAnalytics: false,
                    automatedSystems: false
                },
                dataGranularity: {
                    preferredResolution: 30, // High detail for small fields
                    spatialScale: 'field_level',
                    temporalFrequency: 'daily',
                    complexity: 'simplified'
                },
                objectives: [
                    'Maximize yield with minimal input costs',
                    'Reduce water usage through better timing',
                    'Identify stress areas early',
                    'Optimize manual labor efficiency'
                ],
                educationalFocus: [
                    'Understanding satellite data basics',
                    'Interpreting moisture patterns',
                    'Low-cost implementation strategies',
                    'Weather integration techniques'
                ]
            }],
            ['industrial', {
                name: 'Industrial Farm',
                description: 'Large-scale commercial farming operations (100+ hectares)',
                farmSize: { min: 100, max: 10000, typical: 500 },
                resources: {
                    budget: 'substantial',
                    technology: 'advanced',
                    water: 'managed',
                    labor: 'skilled_operators'
                },
                constraints: [
                    'High efficiency requirements',
                    'Regulatory compliance needs',
                    'Environmental sustainability pressure',
                    'Market competitiveness demands'
                ],
                features: {
                    automatedFieldMapping: true,
                    centerPivotIrrigation: true,
                    variableRateTechnology: true,
                    prescriptionMaps: true,
                    yieldMonitors: true,
                    financialAnalytics: true,
                    gpsGuidance: true,
                    soilSampling: true,
                    manualFieldDrawing: false,
                    basicIrrigation: false
                },
                dataGranularity: {
                    preferredResolution: 250, // Balance detail with coverage
                    spatialScale: 'management_zones',
                    temporalFrequency: 'real_time',
                    complexity: 'advanced'
                },
                objectives: [
                    'Maximize return on investment (ROI)',
                    'Achieve sustainability targets',
                    'Optimize resource efficiency',
                    'Minimize environmental impact',
                    'Maintain competitive advantage'
                ],
                educationalFocus: [
                    'Advanced data interpretation',
                    'Multi-source data fusion',
                    'Precision agriculture techniques',
                    'Economic optimization strategies'
                ]
            }],
            ['tutorial', {
                name: 'Tutorial Mode',
                description: 'Guided learning environment for new users',
                farmSize: { min: 1, max: 5, typical: 2 },
                resources: {
                    budget: 'educational',
                    technology: 'simulated',
                    water: 'unlimited',
                    labor: 'guided'
                },
                constraints: ['Learning objectives', 'Progressive complexity'],
                features: {
                    guidedTutorials: true,
                    stepByStepInstructions: true,
                    interactiveExamples: true,
                    progressTracking: true,
                    hintSystem: true,
                    allToolsAvailable: true,
                    safeExperimentation: true
                },
                dataGranularity: {
                    preferredResolution: 'variable', // Changes based on lesson
                    spatialScale: 'educational',
                    temporalFrequency: 'lesson_based',
                    complexity: 'progressive'
                },
                objectives: [
                    'Understand resolution concepts',
                    'Learn depth analysis',
                    'Practice context switching',
                    'Master data interpretation'
                ],
                educationalFocus: [
                    'Foundational concepts',
                    'Hands-on practice',
                    'Critical thinking development',
                    'Real-world application'
                ]
            }]
        ]);

        // UI/UX modifications for each context
        this.uiAdaptations = new Map([
            ['smallholder', {
                layout: 'mobile_first',
                navigation: 'simplified',
                controls: 'touch_optimized',
                dataDisplay: 'essential_only',
                language: 'non_technical',
                helpLevel: 'extensive',
                colorScheme: 'high_contrast'
            }],
            ['industrial', {
                layout: 'desktop_optimized',
                navigation: 'full_featured',
                controls: 'precision_oriented',
                dataDisplay: 'comprehensive',
                language: 'technical',
                helpLevel: 'contextual',
                colorScheme: 'professional'
            }],
            ['tutorial', {
                layout: 'guided',
                navigation: 'sequential',
                controls: 'highlighted',
                dataDisplay: 'explanatory',
                language: 'educational',
                helpLevel: 'comprehensive',
                colorScheme: 'learning_friendly'
            }]
        ]);

        this.currentModifiers = null;
    }

    /**
     * Adapt to smallholder farming context
     * @returns {Object} Smallholder-specific gameplay modifiers
     */
    adaptToSmallholder() {
        this.currentContext = 'smallholder';
        const config = this.contextConfigs.get('smallholder');
        const uiConfig = this.uiAdaptations.get('smallholder');

        this.currentModifiers = {
            context: 'smallholder',
            farmSize: this.generateSmallholderFarmSize(),
            availableTools: this.getSmallholderTools(),
            constraints: this.getSmallholderConstraints(),
            objectives: config.objectives,
            ui: this.createSmallholderUI(uiConfig),
            dataSettings: this.configureSmallholderData(config.dataGranularity),
            educational: this.createSmallholderEducation(config.educationalFocus),
            economics: this.createSmallholderEconomics()
        };

        return this.currentModifiers;
    }

    /**
     * Adapt to industrial farming context
     * @returns {Object} Industrial-specific gameplay modifiers
     */
    adaptToIndustrial() {
        this.currentContext = 'industrial';
        const config = this.contextConfigs.get('industrial');
        const uiConfig = this.uiAdaptations.get('industrial');

        this.currentModifiers = {
            context: 'industrial',
            farmSize: this.generateIndustrialFarmSize(),
            availableTools: this.getIndustrialTools(),
            constraints: this.getIndustrialConstraints(),
            objectives: config.objectives,
            ui: this.createIndustrialUI(uiConfig),
            dataSettings: this.configureIndustrialData(config.dataGranularity),
            educational: this.createIndustrialEducation(config.educationalFocus),
            economics: this.createIndustrialEconomics()
        };

        return this.currentModifiers;
    }

    /**
     * Adapt to tutorial context
     * @returns {Object} Tutorial-specific modifiers
     */
    adaptToTutorial() {
        this.currentContext = 'tutorial';
        const config = this.contextConfigs.get('tutorial');
        const uiConfig = this.uiAdaptations.get('tutorial');

        this.currentModifiers = {
            context: 'tutorial',
            farmSize: { width: 200, height: 200 }, // Fixed small size
            availableTools: this.getTutorialTools(),
            constraints: ['Progressive learning'],
            objectives: config.objectives,
            ui: this.createTutorialUI(uiConfig),
            dataSettings: this.configureTutorialData(config.dataGranularity),
            educational: this.createTutorialEducation(config.educationalFocus),
            progression: this.createTutorialProgression()
        };

        return this.currentModifiers;
    }

    /**
     * Adjust data granularity based on farm scale
     * @param {string} scale - Farm scale context
     * @returns {Object} Data configuration
     */
    adjustDataGranularity(scale) {
        const config = this.contextConfigs.get(scale);
        if (!config) {
            throw new Error(`Unknown farm scale: ${scale}`);
        }

        return {
            resolution: config.dataGranularity.preferredResolution,
            spatialExtent: this.calculateSpatialExtent(scale),
            temporalRange: this.calculateTemporalRange(scale),
            dataTypes: this.selectDataTypes(scale),
            processingLevel: this.selectProcessingLevel(scale),
            visualization: this.configureVisualization(scale)
        };
    }

    /**
     * Customize objectives based on context
     * @param {string} context - Farming context
     * @returns {Object} Customized objectives
     */
    customizeObjectives(context) {
        const config = this.contextConfigs.get(context);
        if (!config) {
            throw new Error(`Unknown context: ${context}`);
        }

        return {
            primary: config.objectives,
            secondary: this.generateSecondaryObjectives(context),
            constraints: config.constraints,
            successMetrics: this.defineSuccessMetrics(context),
            educational: this.defineEducationalObjectives(context)
        };
    }

    /**
     * Get context-specific tools and features
     * @param {string} context - Context name
     * @returns {Object} Available tools
     */
    getContextTools(context) {
        const config = this.contextConfigs.get(context);
        if (!config) return {};

        return config.features;
    }

    /**
     * Create context-specific user interface modifications
     * @param {string} context - Context name
     * @returns {Object} UI modifications
     */
    createContextUI(context) {
        const uiConfig = this.uiAdaptations.get(context);
        if (!uiConfig) return {};

        return {
            layout: this.createLayoutModifications(uiConfig),
            styling: this.createStylingModifications(uiConfig),
            interactions: this.createInteractionModifications(uiConfig),
            content: this.createContentModifications(uiConfig)
        };
    }

    /**
     * Generate farm size based on context
     * @param {string} context - Context type
     * @returns {Object} Farm dimensions
     */
    generateFarmSize(context) {
        const config = this.contextConfigs.get(context);
        if (!config) return { width: 100, height: 100 };

        const hectares = config.farmSize.min +
            Math.random() * (config.farmSize.max - config.farmSize.min);

        // Convert hectares to approximate field dimensions (assuming square field)
        const sideLength = Math.sqrt(hectares * 10000); // 1 hectare = 10,000 m²

        return {
            hectares: hectares,
            width: Math.round(sideLength),
            height: Math.round(sideLength),
            context: context
        };
    }

    /**
     * Context-specific helper methods
     */

    generateSmallholderFarmSize() {
        return this.generateFarmSize('smallholder');
    }

    generateIndustrialFarmSize() {
        return this.generateFarmSize('industrial');
    }

    getSmallholderTools() {
        return {
            irrigation: 'manual',
            fertilizer: 'broadcast',
            monitoring: 'visual',
            planning: 'seasonal',
            equipment: ['hand_tools', 'basic_sprayer'],
            precision: false,
            automation: false
        };
    }

    getIndustrialTools() {
        return {
            irrigation: 'center_pivot',
            fertilizer: 'variable_rate',
            monitoring: 'sensor_network',
            planning: 'precision_maps',
            equipment: ['gps_tractor', 'yield_monitor', 'soil_sensor'],
            precision: true,
            automation: true
        };
    }

    getTutorialTools() {
        return {
            irrigation: 'educational',
            fertilizer: 'guided',
            monitoring: 'interactive',
            planning: 'tutorial',
            equipment: ['all_simulated'],
            precision: 'variable',
            automation: 'demonstrated'
        };
    }

    getSmallholderConstraints() {
        return {
            budget: { water: 100, fertilizer: 50, equipment: 0 },
            technology: 'basic',
            labor: 'limited',
            timeConstraints: 'seasonal',
            weatherDependence: 'high'
        };
    }

    getIndustrialConstraints() {
        return {
            budget: { water: 10000, fertilizer: 5000, equipment: 50000 },
            technology: 'advanced',
            labor: 'skilled',
            timeConstraints: 'optimization',
            weatherDependence: 'managed',
            regulations: 'strict',
            sustainability: 'required'
        };
    }

    createSmallholderUI(uiConfig) {
        return {
            simplifiedControls: true,
            largeButtons: true,
            minimalText: true,
            pictorialInstructions: true,
            offlineCapable: true,
            lowBandwidth: true
        };
    }

    createIndustrialUI(uiConfig) {
        return {
            comprehensiveData: true,
            multipleViews: true,
            advancedControls: true,
            realTimeUpdates: true,
            analyticalTools: true,
            reportGeneration: true
        };
    }

    createTutorialUI(uiConfig) {
        return {
            guidedInterface: true,
            progressIndicators: true,
            helpOverlays: true,
            interactiveHints: true,
            stepByStep: true,
            safeMode: true
        };
    }

    configureSmallholderData(granularity) {
        return {
            resolution: 30, // High detail for small fields
            updateFrequency: 'weekly',
            dataTypes: ['ndvi', 'moisture', 'weather'],
            complexity: 'basic',
            storage: 'local'
        };
    }

    configureIndustrialData(granularity) {
        return {
            resolution: 250, // Balance of detail and coverage
            updateFrequency: 'daily',
            dataTypes: ['ndvi', 'moisture', 'weather', 'yield', 'soil'],
            complexity: 'advanced',
            storage: 'cloud'
        };
    }

    configureTutorialData(granularity) {
        return {
            resolution: 'variable', // Changes based on lesson
            updateFrequency: 'educational',
            dataTypes: ['educational_samples'],
            complexity: 'progressive',
            storage: 'demo'
        };
    }

    createSmallholderEducation(focus) {
        return {
            topics: focus,
            delivery: 'visual',
            language: 'simple',
            examples: 'local',
            practice: 'hands_on'
        };
    }

    createIndustrialEducation(focus) {
        return {
            topics: focus,
            delivery: 'analytical',
            language: 'technical',
            examples: 'case_studies',
            practice: 'optimization'
        };
    }

    createTutorialEducation(focus) {
        return {
            topics: focus,
            delivery: 'interactive',
            language: 'educational',
            examples: 'step_by_step',
            practice: 'guided'
        };
    }

    createSmallholderEconomics() {
        return {
            costModel: 'input_minimization',
            roi: 'survival',
            risktolerance: 'low',
            timeHorizon: 'season',
            decisionFactors: ['cost', 'simplicity', 'reliability']
        };
    }

    createIndustrialEconomics() {
        return {
            costModel: 'profit_maximization',
            roi: 'competitive',
            riskTolerance: 'calculated',
            timeHorizon: 'multi_year',
            decisionFactors: ['efficiency', 'sustainability', 'compliance', 'roi']
        };
    }

    createTutorialProgression() {
        return {
            levels: ['beginner', 'intermediate', 'advanced'],
            unlocks: 'progressive',
            assessment: 'continuous',
            certification: 'available'
        };
    }

    // Additional helper methods
    calculateSpatialExtent(scale) {
        const config = this.contextConfigs.get(scale);
        return {
            typical: config.farmSize.typical,
            min: config.farmSize.min,
            max: config.farmSize.max
        };
    }

    calculateTemporalRange(scale) {
        const ranges = {
            smallholder: '1_month',
            industrial: '1_year',
            tutorial: 'lesson_based'
        };
        return ranges[scale] || '1_month';
    }

    selectDataTypes(scale) {
        const types = {
            smallholder: ['ndvi', 'precipitation', 'basic_moisture'],
            industrial: ['ndvi', 'precipitation', 'soil_moisture', 'temperature', 'yield'],
            tutorial: ['educational_examples']
        };
        return types[scale] || ['ndvi'];
    }

    selectProcessingLevel(scale) {
        const levels = {
            smallholder: 'simplified',
            industrial: 'advanced',
            tutorial: 'educational'
        };
        return levels[scale] || 'basic';
    }

    configureVisualization(scale) {
        const viz = {
            smallholder: { type: 'simple', colors: 'intuitive', labels: 'minimal' },
            industrial: { type: 'analytical', colors: 'professional', labels: 'detailed' },
            tutorial: { type: 'educational', colors: 'learning', labels: 'explanatory' }
        };
        return viz[scale] || viz.smallholder;
    }

    generateSecondaryObjectives(context) {
        // Implementation for secondary objectives
        return [];
    }

    defineSuccessMetrics(context) {
        // Implementation for success metrics
        return {};
    }

    defineEducationalObjectives(context) {
        // Implementation for educational objectives
        return [];
    }

    createLayoutModifications(uiConfig) {
        // Implementation for layout modifications
        return {};
    }

    createStylingModifications(uiConfig) {
        // Implementation for styling modifications
        return {};
    }

    createInteractionModifications(uiConfig) {
        // Implementation for interaction modifications
        return {};
    }

    createContentModifications(uiConfig) {
        // Implementation for content modifications
        return {};
    }

    /**
     * Get current context information
     * @returns {Object} Current context details
     */
    getCurrentContext() {
        return {
            context: this.currentContext,
            config: this.contextConfigs.get(this.currentContext),
            modifiers: this.currentModifiers
        };
    }

    /**
     * Check if context supports a feature
     * @param {string} feature - Feature name
     * @returns {boolean} True if supported
     */
    supportsFeature(feature) {
        if (!this.currentContext) return false;
        const config = this.contextConfigs.get(this.currentContext);
        return config && config.features && config.features[feature] === true;
    }
}

export { FarmContextAdapter };