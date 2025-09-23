/**
 * NASA Farm Navigators - Education Engine
 * Orchestrates educational content delivery and progress tracking
 * Integrates all educational components into cohesive learning experiences
 */

import { EventSystem } from '../utils/EventSystem.js';

class EducationEngine {
    constructor() {
        this.eventSystem = EventSystem.getInstance();

        // Learning progress tracking
        this.learningProgress = {
            resolutionAwareness: {
                pixelHuntCompletions: 0,
                conceptsUnderstood: new Set(),
                difficultyLevel: 'beginner'
            },
            depthUnderstanding: {
                scenariosCompleted: new Set(),
                L3vsL4Mastery: false,
                cropDepthKnowledge: new Map()
            },
            satelliteKnowledge: {
                datasetsExplored: new Set(),
                temporalUnderstanding: 0,
                spatialUnderstanding: 0
            },
            overallProgress: 0
        };

        // Educational content modules
        this.modules = new Map([
            ['pixel_awareness', {
                id: 'pixel_awareness',
                title: 'Understanding Satellite Pixels',
                description: 'Learn how pixel size affects what you can see from space',
                prerequisites: [],
                lessons: this.initializePixelLessons(),
                assessments: this.initializePixelAssessments(),
                estimatedTime: 15
            }],
            ['depth_analysis', {
                id: 'depth_analysis',
                title: 'Soil Moisture Depths',
                description: 'Understand surface vs root zone soil moisture',
                prerequisites: ['pixel_awareness'],
                lessons: this.initializeDepthLessons(),
                assessments: this.initializeDepthAssessments(),
                estimatedTime: 20
            }],
            ['satellite_systems', {
                id: 'satellite_systems',
                title: 'NASA Earth Observation Systems',
                description: 'Explore different NASA satellites and their capabilities',
                prerequisites: ['pixel_awareness'],
                lessons: this.initializeSatelliteLessons(),
                assessments: this.initializeSatelliteAssessments(),
                estimatedTime: 25
            }],
            ['farm_applications', {
                id: 'farm_applications',
                title: 'Agricultural Applications',
                description: 'Apply satellite data to real farming decisions',
                prerequisites: ['depth_analysis', 'satellite_systems'],
                lessons: this.initializeFarmLessons(),
                assessments: this.initializeFarmAssessments(),
                estimatedTime: 30
            }]
        ]);

        // Adaptive learning parameters
        this.adaptiveLearning = {
            repetitionThreshold: 3,
            masteryScore: 0.8,
            hintSystem: true,
            personalizedPacing: true
        };

        // Achievement system
        this.achievements = {
            'pixel_detective': {
                title: 'Pixel Detective',
                description: 'Complete 5 pixel hunt challenges',
                requirement: () => this.learningProgress.resolutionAwareness.pixelHuntCompletions >= 5,
                unlocked: false
            },
            'depth_master': {
                title: 'Depth Master',
                description: 'Master L3 vs L4 soil moisture concepts',
                requirement: () => this.learningProgress.depthUnderstanding.L3vsL4Mastery,
                unlocked: false
            },
            'satellite_explorer': {
                title: 'Satellite Explorer',
                description: 'Explore all major NASA satellite datasets',
                requirement: () => this.learningProgress.satelliteKnowledge.datasetsExplored.size >= 4,
                unlocked: false
            },
            'farm_advisor': {
                title: 'Farm Advisor',
                description: 'Complete advanced farm application scenarios',
                requirement: () => this.learningProgress.depthUnderstanding.scenariosCompleted.size >= 10,
                unlocked: false
            }
        };

        this.setupEventHandlers();
    }

    /**
     * Initialize pixel awareness lessons
     * @returns {Array} Lesson configurations
     */
    initializePixelLessons() {
        return [
            {
                id: 'pixel_basics',
                title: 'What is a Pixel?',
                type: 'interactive',
                content: {
                    explanation: 'A pixel is the smallest unit of a satellite image. Think of it as a colored square that represents an area on Earth.',
                    visualization: 'pixel_grid',
                    interactives: ['zoom_demo', 'pixel_size_slider']
                },
                learningObjectives: [
                    'Define what a satellite pixel represents',
                    'Understand the relationship between pixel size and detail',
                    'Recognize how resolution affects agricultural monitoring'
                ]
            },
            {
                id: 'resolution_comparison',
                title: 'Comparing Satellite Resolutions',
                type: 'comparison',
                content: {
                    datasets: ['landsat_30m', 'modis_250m', 'smap_9km'],
                    comparisonTool: 'side_by_side_viewer',
                    scenarios: ['crop_field', 'forest_edge', 'urban_agriculture']
                },
                learningObjectives: [
                    'Compare images at different resolutions',
                    'Identify what features are visible at each resolution',
                    'Choose appropriate resolution for specific tasks'
                ]
            },
            {
                id: 'pixel_hunt_introduction',
                title: 'Pixel Hunt Challenge',
                type: 'game',
                content: {
                    gameType: 'pixel_hunt',
                    difficulty: 'beginner',
                    scenarios: ['find_farm_building', 'identify_crop_type', 'measure_field_size']
                },
                learningObjectives: [
                    'Apply resolution knowledge in practical scenarios',
                    'Develop visual skills for satellite image interpretation',
                    'Understand limitations of different resolutions'
                ]
            }
        ];
    }

    /**
     * Initialize depth understanding lessons
     * @returns {Array} Lesson configurations
     */
    initializeDepthLessons() {
        return [
            {
                id: 'soil_layers',
                title: 'Understanding Soil Layers',
                type: 'interactive',
                content: {
                    visualization: 'soil_profile_3d',
                    layers: ['surface', 'root_zone', 'deep_soil'],
                    interactives: ['layer_explorer', 'moisture_flow_animation']
                },
                learningObjectives: [
                    'Identify different soil layers',
                    'Understand moisture movement through soil',
                    'Connect soil layers to plant root systems'
                ]
            },
            {
                id: 'smap_l3_vs_l4',
                title: 'SMAP L3 vs L4 Data',
                type: 'comparison',
                content: {
                    dataProducts: {
                        'L3': { depth: '0-5cm', frequency: 'daily', resolution: '9km' },
                        'L4': { depth: '0-100cm', frequency: '3-hourly', resolution: '9km' }
                    },
                    scenarios: ['drought_detection', 'irrigation_planning', 'crop_stress']
                },
                learningObjectives: [
                    'Distinguish between SMAP L3 and L4 products',
                    'Understand when to use surface vs root zone data',
                    'Apply depth knowledge to agricultural decisions'
                ]
            },
            {
                id: 'crop_root_systems',
                title: 'Crop Root Systems and Moisture',
                type: 'exploration',
                content: {
                    cropDatabase: ['corn', 'wheat', 'soybeans', 'cotton', 'rice'],
                    rootVisualizations: true,
                    moistureSimulator: true
                },
                learningObjectives: [
                    'Learn about different crop root depths',
                    'Connect root systems to moisture needs',
                    'Understand crop-specific moisture monitoring'
                ]
            }
        ];
    }

    /**
     * Initialize satellite systems lessons
     * @returns {Array} Lesson configurations
     */
    initializeSatelliteLessons() {
        return [
            {
                id: 'nasa_earth_fleet',
                title: 'NASA\'s Earth Observation Fleet',
                type: 'exploration',
                content: {
                    satellites: ['SMAP', 'Landsat', 'MODIS', 'GPM'],
                    timeline: 'satellite_launch_history',
                    interactives: ['orbit_visualizer', 'coverage_map']
                },
                learningObjectives: [
                    'Identify major NASA Earth observation satellites',
                    'Understand satellite orbits and coverage',
                    'Learn about satellite mission objectives'
                ]
            },
            {
                id: 'temporal_resolution',
                title: 'When Satellites Take Pictures',
                type: 'interactive',
                content: {
                    revisitPatterns: {
                        'Landsat': '16 days',
                        'MODIS': '1-2 days',
                        'SMAP': '2-3 days'
                    },
                    scheduler: 'satellite_pass_predictor'
                },
                learningObjectives: [
                    'Understand satellite revisit times',
                    'Plan data collection around satellite schedules',
                    'Balance temporal vs spatial resolution needs'
                ]
            }
        ];
    }

    /**
     * Initialize farm application lessons
     * @returns {Array} Lesson configurations
     */
    initializeFarmLessons() {
        return [
            {
                id: 'irrigation_decisions',
                title: 'Using Satellite Data for Irrigation',
                type: 'scenario',
                content: {
                    farmScenarios: ['corn_farm_midwest', 'rice_farm_california', 'wheat_farm_kansas'],
                    decisionPoints: ['when_to_irrigate', 'how_much_water', 'field_prioritization'],
                    dataIntegration: ['smap_moisture', 'precipitation_forecast', 'crop_stage']
                },
                learningObjectives: [
                    'Apply soil moisture data to irrigation decisions',
                    'Integrate multiple data sources',
                    'Optimize water use efficiency'
                ]
            },
            {
                id: 'crop_monitoring',
                title: 'Monitoring Crop Health',
                type: 'scenario',
                content: {
                    healthIndicators: ['NDVI', 'soil_moisture', 'precipitation'],
                    alertSystems: ['drought_stress', 'flood_risk', 'growth_anomalies'],
                    actionPlans: true
                },
                learningObjectives: [
                    'Monitor crop health using satellite indicators',
                    'Set up early warning systems',
                    'Develop response strategies for crop stress'
                ]
            }
        ];
    }

    /**
     * Initialize assessment frameworks
     * @returns {Array} Assessment configurations
     */
    initializePixelAssessments() {
        return [
            {
                type: 'quiz',
                questions: [
                    {
                        question: 'What can you see in a 30m Landsat pixel that you cannot see in a 250m MODIS pixel?',
                        type: 'multiple_choice',
                        options: ['Individual trees', 'Large lakes', 'Mountains', 'Clouds'],
                        correct: 0,
                        explanation: 'Landsat\'s 30m resolution allows you to see individual trees and small features that would be averaged out in MODIS\' 250m pixels.'
                    }
                ]
            },
            {
                type: 'practical',
                task: 'pixel_hunt_assessment',
                scenarios: ['advanced_feature_identification'],
                passingScore: 0.8
            }
        ];
    }

    initializeDepthAssessments() {
        return [
            {
                type: 'scenario',
                scenario: 'drought_analysis',
                task: 'Compare L3 and L4 data to assess drought conditions',
                evaluation: 'depth_understanding_rubric'
            }
        ];
    }

    initializeSatelliteAssessments() {
        return [
            {
                type: 'project',
                task: 'mission_planning',
                description: 'Plan a crop monitoring strategy using multiple satellite datasets'
            }
        ];
    }

    initializeFarmAssessments() {
        return [
            {
                type: 'capstone',
                task: 'farm_advisory_simulation',
                description: 'Provide data-driven recommendations for a virtual farm operation'
            }
        ];
    }

    /**
     * Start a learning module
     * @param {string} moduleId - Module identifier
     * @param {Object} userProfile - User learning profile
     * @returns {Object} Module session data
     */
    async startModule(moduleId, userProfile = {}) {
        const module = this.modules.get(moduleId);
        if (!module) {
            throw new Error(`Module ${moduleId} not found`);
        }

        // Check prerequisites
        const missingPrereqs = this.checkPrerequisites(module.prerequisites);
        if (missingPrereqs.length > 0) {
            return {
                status: 'prerequisites_required',
                missing: missingPrereqs,
                recommendations: this.getPrerequisiteRecommendations(missingPrereqs)
            };
        }

        // Personalize content based on user profile
        const personalizedModule = this.personalizeContent(module, userProfile);

        // Create learning session
        const session = {
            moduleId: moduleId,
            startTime: Date.now(),
            currentLesson: 0,
            progress: 0,
            attempts: new Map(),
            hints: new Map(),
            personalizedContent: personalizedModule
        };

        this.eventSystem.emit('module_started', {
            moduleId: moduleId,
            session: session
        });

        return {
            status: 'started',
            session: session,
            firstLesson: personalizedModule.lessons[0]
        };
    }

    /**
     * Process lesson completion
     * @param {string} sessionId - Learning session ID
     * @param {string} lessonId - Completed lesson ID
     * @param {Object} results - Lesson completion results
     * @returns {Object} Next steps
     */
    async completLesson(sessionId, lessonId, results) {
        // Update progress
        this.updateLearningProgress(lessonId, results);

        // Determine next action based on performance
        const nextAction = this.determineNextAction(results);

        // Update achievements
        this.checkAndUnlockAchievements();

        this.eventSystem.emit('lesson_completed', {
            sessionId: sessionId,
            lessonId: lessonId,
            results: results,
            nextAction: nextAction
        });

        return nextAction;
    }

    /**
     * Integrate with ResolutionManager pixel hunt
     * @param {Object} pixelHuntResults - Results from pixel hunt
     * @returns {Object} Educational analysis
     */
    integratePixelHuntResults(pixelHuntResults) {
        // Track completion
        this.learningProgress.resolutionAwareness.pixelHuntCompletions++;

        // Analyze performance patterns
        const analysis = this.analyzePixelHuntPerformance(pixelHuntResults);

        // Generate personalized feedback
        const feedback = this.generatePixelHuntFeedback(analysis);

        // Suggest next challenges
        const recommendations = this.suggestNextPixelChallenges(analysis);

        this.eventSystem.emit('pixel_hunt_integrated', {
            results: pixelHuntResults,
            analysis: analysis,
            feedback: feedback
        });

        return {
            feedback: feedback,
            recommendations: recommendations,
            progressUpdate: this.learningProgress.resolutionAwareness
        };
    }

    /**
     * Integrate with SoilDepthAnalyzer scenarios
     * @param {string} scenarioId - Completed scenario ID
     * @param {Object} analysisResults - Depth analysis results
     * @returns {Object} Educational insights
     */
    integrateDepthAnalysis(scenarioId, analysisResults) {
        // Track scenario completion
        this.learningProgress.depthUnderstanding.scenariosCompleted.add(scenarioId);

        // Assess L3 vs L4 understanding
        const l3l4Understanding = this.assessL3L4Understanding(analysisResults);
        if (l3l4Understanding.mastery) {
            this.learningProgress.depthUnderstanding.L3vsL4Mastery = true;
        }

        // Update crop depth knowledge
        if (analysisResults.crop) {
            this.learningProgress.depthUnderstanding.cropDepthKnowledge.set(
                analysisResults.crop,
                l3l4Understanding.score
            );
        }

        const insights = this.generateDepthInsights(analysisResults, l3l4Understanding);

        this.eventSystem.emit('depth_analysis_integrated', {
            scenarioId: scenarioId,
            results: analysisResults,
            insights: insights
        });

        return insights;
    }

    /**
     * Generate adaptive learning recommendations
     * @param {Object} userProgress - Current user progress
     * @returns {Object} Personalized recommendations
     */
    generateLearningRecommendations(userProgress) {
        const recommendations = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            reinforcement: []
        };

        // Analyze knowledge gaps
        const gaps = this.identifyKnowledgeGaps(userProgress);

        // Suggest immediate actions
        if (gaps.resolutionAwareness) {
            recommendations.immediate.push({
                action: 'pixel_hunt_practice',
                reason: 'Strengthen resolution awareness',
                estimatedTime: 10
            });
        }

        if (gaps.depthUnderstanding) {
            recommendations.immediate.push({
                action: 'depth_scenario_practice',
                reason: 'Improve soil moisture depth concepts',
                estimatedTime: 15
            });
        }

        // Suggest reinforcement activities
        const strengths = this.identifyStrengths(userProgress);
        if (strengths.includes('pixel_awareness')) {
            recommendations.reinforcement.push({
                action: 'advanced_pixel_challenges',
                reason: 'Build on strong pixel awareness foundation'
            });
        }

        return recommendations;
    }

    /**
     * Setup event handlers for integration with other systems
     */
    setupEventHandlers() {
        // Listen for pixel hunt completions
        this.eventSystem.on('pixel_hunt_completed', (data) => {
            this.integratePixelHuntResults(data.results);
        });

        // Listen for depth analysis completions
        this.eventSystem.on('depth_analysis_completed', (data) => {
            this.integrateDepthAnalysis(data.scenarioId, data.results);
        });

        // Listen for data exploration events
        this.eventSystem.on('dataset_explored', (data) => {
            this.learningProgress.satelliteKnowledge.datasetsExplored.add(data.dataset);
            this.checkAndUnlockAchievements();
        });
    }

    /**
     * Check prerequisites for a module
     * @param {Array} prerequisites - Required prerequisite modules
     * @returns {Array} Missing prerequisites
     */
    checkPrerequisites(prerequisites) {
        return prerequisites.filter(prereq => {
            // Check if prerequisite module is completed
            return !this.isModuleCompleted(prereq);
        });
    }

    /**
     * Personalize content based on user profile
     * @param {Object} module - Base module content
     * @param {Object} userProfile - User learning profile
     * @returns {Object} Personalized module
     */
    personalizeContent(module, userProfile) {
        const personalized = { ...module };

        // Adjust difficulty based on experience
        if (userProfile.experience === 'beginner') {
            personalized.lessons = personalized.lessons.map(lesson => ({
                ...lesson,
                additionalSupport: true,
                hintLevel: 'verbose'
            }));
        }

        // Adapt content for farming context
        if (userProfile.farmingContext) {
            personalized.lessons = personalized.lessons.map(lesson => ({
                ...lesson,
                examples: this.getContextualExamples(lesson, userProfile.farmingContext)
            }));
        }

        return personalized;
    }

    /**
     * Update learning progress based on activity
     * @param {string} activityId - Activity identifier
     * @param {Object} results - Activity results
     */
    updateLearningProgress(activityId, results) {
        // Update specific progress metrics based on activity type
        if (activityId.includes('pixel')) {
            this.learningProgress.resolutionAwareness.conceptsUnderstood.add(results.concept);
        }

        if (activityId.includes('depth')) {
            if (results.score > 0.8) {
                this.learningProgress.depthUnderstanding.L3vsL4Mastery = true;
            }
        }

        // Update overall progress
        this.calculateOverallProgress();
    }

    /**
     * Calculate overall learning progress
     */
    calculateOverallProgress() {
        const weights = {
            resolutionAwareness: 0.3,
            depthUnderstanding: 0.3,
            satelliteKnowledge: 0.2,
            applicationSkills: 0.2
        };

        let totalProgress = 0;

        // Resolution awareness progress (0-1)
        const resolutionProgress = Math.min(
            this.learningProgress.resolutionAwareness.pixelHuntCompletions / 5,
            1
        );
        totalProgress += resolutionProgress * weights.resolutionAwareness;

        // Depth understanding progress (0-1)
        const depthProgress = Math.min(
            this.learningProgress.depthUnderstanding.scenariosCompleted.size / 10,
            1
        );
        totalProgress += depthProgress * weights.depthUnderstanding;

        // Satellite knowledge progress (0-1)
        const satelliteProgress = Math.min(
            this.learningProgress.satelliteKnowledge.datasetsExplored.size / 4,
            1
        );
        totalProgress += satelliteProgress * weights.satelliteKnowledge;

        this.learningProgress.overallProgress = Math.round(totalProgress * 100);
    }

    /**
     * Check and unlock achievements
     */
    checkAndUnlockAchievements() {
        Object.entries(this.achievements).forEach(([achievementId, achievement]) => {
            if (!achievement.unlocked && achievement.requirement()) {
                achievement.unlocked = true;
                this.eventSystem.emit('achievement_unlocked', {
                    achievementId: achievementId,
                    achievement: achievement
                });
            }
        });
    }

    /**
     * Analyze pixel hunt performance patterns
     * @param {Object} results - Pixel hunt results
     * @returns {Object} Performance analysis
     */
    analyzePixelHuntPerformance(results) {
        return {
            accuracyTrend: this.calculateAccuracyTrend(results),
            speedImprovement: this.calculateSpeedImprovement(results),
            resolutionPreference: this.identifyResolutionPreference(results),
            commonMistakes: this.identifyCommonMistakes(results)
        };
    }

    /**
     * Generate personalized feedback for pixel hunt
     * @param {Object} analysis - Performance analysis
     * @returns {Object} Personalized feedback
     */
    generatePixelHuntFeedback(analysis) {
        const feedback = {
            strengths: [],
            improvements: [],
            nextSteps: []
        };

        if (analysis.accuracyTrend > 0.8) {
            feedback.strengths.push('Excellent accuracy in identifying features at different resolutions');
        }

        if (analysis.speedImprovement > 0.2) {
            feedback.strengths.push('Great improvement in recognition speed');
        }

        if (analysis.resolutionPreference.includes('high_res_bias')) {
            feedback.improvements.push('Practice identifying features in lower resolution imagery');
            feedback.nextSteps.push('Try MODIS-based challenges to develop coarse resolution skills');
        }

        return feedback;
    }

    /**
     * Get current learning state for external systems
     * @returns {Object} Current learning state
     */
    getLearningState() {
        return {
            progress: { ...this.learningProgress },
            availableModules: Array.from(this.modules.keys()),
            completedModules: this.getCompletedModules(),
            achievements: this.getUnlockedAchievements(),
            recommendations: this.generateLearningRecommendations(this.learningProgress)
        };
    }

    /**
     * Get completed modules
     * @returns {Array} Completed module IDs
     */
    getCompletedModules() {
        return Array.from(this.modules.keys()).filter(moduleId =>
            this.isModuleCompleted(moduleId)
        );
    }

    /**
     * Check if module is completed
     * @param {string} moduleId - Module identifier
     * @returns {boolean} True if completed
     */
    isModuleCompleted(moduleId) {
        // Implementation would check specific completion criteria
        // For now, simplified logic based on progress
        switch (moduleId) {
            case 'pixel_awareness':
                return this.learningProgress.resolutionAwareness.pixelHuntCompletions >= 3;
            case 'depth_analysis':
                return this.learningProgress.depthUnderstanding.L3vsL4Mastery;
            case 'satellite_systems':
                return this.learningProgress.satelliteKnowledge.datasetsExplored.size >= 3;
            default:
                return false;
        }
    }

    /**
     * Get unlocked achievements
     * @returns {Array} Unlocked achievement objects
     */
    getUnlockedAchievements() {
        return Object.entries(this.achievements)
            .filter(([, achievement]) => achievement.unlocked)
            .map(([id, achievement]) => ({ id, ...achievement }));
    }

    // Additional helper methods for analysis and personalization
    calculateAccuracyTrend(results) { return Math.random() * 0.4 + 0.6; }
    calculateSpeedImprovement(results) { return Math.random() * 0.5; }
    identifyResolutionPreference(results) { return ['high_res_bias']; }
    identifyCommonMistakes(results) { return ['scale_confusion']; }
    assessL3L4Understanding(results) { return { mastery: true, score: 0.85 }; }
    generateDepthInsights(results, understanding) { return { insights: ['Good depth differentiation'] }; }
    identifyKnowledgeGaps(progress) { return { resolutionAwareness: false }; }
    identifyStrengths(progress) { return ['pixel_awareness']; }
    getContextualExamples(lesson, context) { return lesson.examples || []; }
    determineNextAction(results) { return { action: 'continue', nextLesson: 'next_lesson_id' }; }
    getPrerequisiteRecommendations(missing) { return missing.map(m => `Complete ${m} first`); }

    /**
     * Get learning progress for auto-save
     */
    getProgress() {
        return {
            ...this.learningProgress,
            currentModules: Array.from(this.modules.keys()),
            lastActivity: Date.now(),
            totalTimeSpent: this.getTotalTimeSpent()
        };
    }

    /**
     * Start a learning module
     */
    async startModule(moduleId, options = {}) {
        const module = this.modules.get(moduleId);
        if (!module) {
            throw new Error(`Module ${moduleId} not found`);
        }

        // Check prerequisites
        const missing = this.checkPrerequisites(module.prerequisites);
        if (missing.length > 0) {
            return {
                status: 'prerequisites_required',
                missing: missing,
                recommendations: this.getPrerequisiteRecommendations(missing)
            };
        }

        // Start the module
        const session = {
            id: moduleId,
            title: module.title,
            description: module.description,
            startTime: Date.now()
        };

        const firstLesson = module.lessons[0];

        return {
            status: 'started',
            session: session,
            firstLesson: firstLesson
        };
    }

    /**
     * Start a specific lesson
     */
    async startLesson(lessonId) {
        // Find the lesson across all modules
        for (const [moduleId, module] of this.modules) {
            const lesson = module.lessons.find(l => l.id === lessonId);
            if (lesson) {
                return {
                    status: 'started',
                    lesson: {
                        ...lesson,
                        progress: this.getLessonProgress(lessonId),
                        hasNext: this.hasNextLesson(moduleId, lessonId)
                    }
                };
            }
        }

        throw new Error(`Lesson ${lessonId} not found`);
    }

    /**
     * Check if prerequisites are met
     */
    checkPrerequisites(prerequisites) {
        const missing = [];
        for (const prereq of prerequisites) {
            if (!this.isModuleCompleted(prereq)) {
                missing.push(prereq);
            }
        }
        return missing;
    }

    /**
     * Check if a module is completed
     */
    isModuleCompleted(moduleId) {
        // For demo purposes, allow all modules to be accessible
        // In real implementation would check detailed progress
        if (moduleId === 'pixel_awareness') {
            return true; // Always allow the first module
        }

        // For demo, allow other modules too
        return true;
    }

    /**
     * Get lesson progress
     */
    getLessonProgress(lessonId) {
        // Return 0 progress for new lessons
        return 0;
    }

    /**
     * Check if there's a next lesson
     */
    hasNextLesson(moduleId, currentLessonId) {
        const module = this.modules.get(moduleId);
        if (!module) return false;

        const currentIndex = module.lessons.findIndex(l => l.id === currentLessonId);
        return currentIndex >= 0 && currentIndex < module.lessons.length - 1;
    }

    /**
     * Get total time spent in learning
     */
    getTotalTimeSpent() {
        // Simple implementation - would track actual time in real app
        return Math.floor(Math.random() * 3600); // Random seconds
    }

    /**
     * Get next lesson in sequence
     */
    async getNextLesson() {
        // For demo purposes, return a sample next lesson
        return {
            lesson: {
                id: 'next_lesson',
                title: 'Advanced Pixel Concepts',
                content: 'Now that you understand pixels, let\'s explore advanced concepts...',
                progress: 0,
                hasNext: false
            }
        };
    }

    /**
     * Complete a lesson
     */
    async completeLesson(lessonId) {
        // Update progress tracking
        this.learningProgress.overallProgress = Math.min(1.0, this.learningProgress.overallProgress + 0.1);

        // Mark specific progress based on lesson
        if (lessonId.includes('pixel')) {
            this.learningProgress.resolutionAwareness.pixelHuntCompletions++;
            this.learningProgress.resolutionAwareness.conceptsUnderstood.add('basic_pixels');
        }

        return {
            status: 'completed',
            progress: this.learningProgress,
            achievements: this.checkForNewAchievements()
        };
    }

    /**
     * Check for new achievements
     */
    checkForNewAchievements() {
        const achievements = [];

        if (this.learningProgress.resolutionAwareness.pixelHuntCompletions >= 1) {
            achievements.push('first_lesson_complete');
        }

        if (this.learningProgress.overallProgress >= 0.5) {
            achievements.push('halfway_hero');
        }

        return achievements;
    }

    /**
     * Get unlocked achievements
     */
    getUnlockedAchievements() {
        // Return sample achievements based on progress
        const achievements = [];

        if (this.learningProgress.overallProgress > 0) {
            achievements.push({
                id: 'getting_started',
                title: 'Getting Started',
                description: 'Started your learning journey',
                icon: ''
            });
        }

        if (this.learningProgress.resolutionAwareness.pixelHuntCompletions > 0) {
            achievements.push({
                id: 'pixel_master',
                title: 'Pixel Master',
                description: 'Completed your first pixel lesson',
                icon: ''
            });
        }

        return achievements;
    }
}

export { EducationEngine };