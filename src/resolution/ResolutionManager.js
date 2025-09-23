/**
 * NASA Farm Navigators - Resolution Manager
 * Manages resolution switching and educational content about pixel sizes
 * Core component for teaching resolution awareness as required by NASA challenge
 */

class ResolutionManager {
    constructor(options = {}) {
        this.availableResolutions = options.availableResolutions || [30, 250, 9000, 11000];
        this.currentResolution = options.defaultResolution || 9000;

        // Resolution impact mapping for educational purposes
        this.resolutionImpacts = new Map([
            [30, {
                pixelSize: '30m × 30m',
                coverage: 'High detail, small coverage area',
                detectionCapability: ['Individual trees', 'Farm equipment', 'Small field boundaries', 'Buildings', 'Roads'],
                limitations: ['Smaller coverage area', 'Higher data volume', 'More processing required'],
                bestFor: ['Precision agriculture', 'Detailed field analysis', 'Infrastructure mapping'],
                satellite: 'Landsat 8/9',
                revisitTime: '16 days',
                example: 'Can see individual crop rows and small irrigation features'
            }],
            [250, {
                pixelSize: '250m × 250m',
                coverage: 'Moderate detail, good coverage',
                detectionCapability: ['Field boundaries', 'Large water bodies', 'Forest patches', 'Urban areas'],
                limitations: ['Cannot see small features', 'Averages within-field variation'],
                bestFor: ['Regional crop monitoring', 'Land use mapping', 'Vegetation trends'],
                satellite: 'MODIS Terra/Aqua',
                revisitTime: '1-2 days',
                example: 'Can distinguish crop fields but not individual plants'
            }],
            [9000, {
                pixelSize: '9km × 9km',
                coverage: 'Low detail, very large coverage',
                detectionCapability: ['Regional patterns', 'Large climate zones', 'Major water bodies'],
                limitations: ['Very coarse resolution', 'Averages across many fields', 'No field-level detail'],
                bestFor: ['Soil moisture monitoring', 'Regional climate studies', 'Continental trends'],
                satellite: 'SMAP',
                revisitTime: '2-3 days',
                example: 'Shows average conditions across hundreds of farms'
            }],
            [11000, {
                pixelSize: '11km × 11km',
                coverage: 'Low detail, global coverage',
                detectionCapability: ['Weather patterns', 'Large-scale precipitation', 'Regional climate'],
                limitations: ['Cannot resolve individual features', 'Extreme averaging effect'],
                bestFor: ['Weather monitoring', 'Climate studies', 'Precipitation tracking'],
                satellite: 'GPM',
                revisitTime: '30 minutes',
                example: 'Shows weather conditions over entire counties'
            }]
        ]);

        // Educational scenarios for pixel hunt games
        this.pixelHuntScenarios = [
            {
                id: 'pond_detection',
                title: 'Can you spot the farm pond?',
                description: 'A 50m wide pond needs to be detected for irrigation planning',
                feature: { type: 'pond', size: 50 },
                resolutions: [30, 250, 9000],
                correctAnswer: 30,
                explanation: 'Only 30m resolution can detect a 50m pond. 250m pixels are too large, and 9km pixels average across vast areas.'
            },
            {
                id: 'field_boundary',
                title: 'Where are the field boundaries?',
                description: 'Individual crop fields need to be mapped for precision agriculture',
                feature: { type: 'field', size: 200 },
                resolutions: [30, 250, 9000],
                correctAnswer: 30,
                explanation: '30m resolution shows clear field boundaries. 250m may show boundaries for very large fields, but 9km resolution averages across many fields.'
            },
            {
                id: 'regional_moisture',
                title: 'What resolution for regional soil moisture?',
                description: 'Monitor soil moisture patterns across a large agricultural region',
                feature: { type: 'moisture', scale: 'regional' },
                resolutions: [30, 250, 9000],
                correctAnswer: 9000,
                explanation: 'For regional soil moisture patterns, 9km SMAP data is ideal. It provides consistent global coverage optimized for moisture detection.'
            }
        ];

        this.currentScenario = null;
        this.completedScenarios = [];
        this.educationMode = false;
    }

    /**
     * Switch to a different resolution
     * @param {number} resolution - Target resolution in meters
     * @returns {Promise<Object>} Switch result with educational content
     */
    async switchResolution(resolution) {
        if (!this.availableResolutions.includes(resolution)) {
            throw new Error(`Resolution ${resolution}m is not available`);
        }

        const previousResolution = this.currentResolution;
        this.currentResolution = resolution;

        // Generate educational comparison
        const comparison = this.compareResolutions(previousResolution, resolution);

        return {
            success: true,
            from: previousResolution,
            to: resolution,
            comparison: comparison,
            impacts: this.getResolutionImpacts(resolution),
            educational: this.generateResolutionEducation(previousResolution, resolution)
        };
    }

    /**
     * Compare two resolutions for educational purposes
     * @param {number} r1 - First resolution
     * @param {number} r2 - Second resolution
     * @returns {Object} Detailed comparison
     */
    compareResolutions(r1, r2) {
        const impact1 = this.resolutionImpacts.get(r1);
        const impact2 = this.resolutionImpacts.get(r2);

        if (!impact1 || !impact2) {
            throw new Error('Invalid resolution for comparison');
        }

        const pixelRatio = Math.pow(r2 / r1, 2); // Area ratio

        return {
            resolution1: {
                value: r1,
                pixelSize: impact1.pixelSize,
                coverage: impact1.coverage,
                satellite: impact1.satellite
            },
            resolution2: {
                value: r2,
                pixelSize: impact2.pixelSize,
                coverage: impact2.coverage,
                satellite: impact2.satellite
            },
            pixelAreaRatio: pixelRatio,
            detailChange: r2 > r1 ? 'less_detail' : 'more_detail',
            coverageChange: r2 > r1 ? 'more_coverage' : 'less_coverage',
            dataVolumeChange: r2 > r1 ? 'less_data' : 'more_data',
            educational: {
                explanation: this.generateComparisonExplanation(r1, r2, pixelRatio),
                tradeoffs: this.generateTradeoffExplanation(r1, r2)
            }
        };
    }

    /**
     * Demonstrate pixel size visually
     * @param {number} resolution - Resolution to demonstrate
     * @param {Object} fieldSize - Field dimensions
     * @returns {Object} Pixel demonstration data
     */
    demonstratePixelSize(resolution, fieldSize = { width: 1000, height: 1000 }) {
        const impact = this.resolutionImpacts.get(resolution);
        if (!impact) {
            throw new Error(`Unknown resolution: ${resolution}`);
        }

        // Calculate how many pixels cover the field
        const pixelsWide = Math.ceil(fieldSize.width / resolution);
        const pixelsHigh = Math.ceil(fieldSize.height / resolution);
        const totalPixels = pixelsWide * pixelsHigh;

        // Calculate coverage area per pixel
        const pixelAreaHectares = (resolution * resolution) / 10000;

        return {
            resolution: resolution,
            pixelSize: impact.pixelSize,
            field: fieldSize,
            pixelGrid: {
                width: pixelsWide,
                height: pixelsHigh,
                total: totalPixels
            },
            pixelAreaHectares: pixelAreaHectares,
            visualization: this.createPixelVisualization(pixelsWide, pixelsHigh, resolution),
            educational: {
                explanation: `Each pixel represents ${impact.pixelSize} on the ground`,
                context: `Your ${fieldSize.width}m × ${fieldSize.height}m field is covered by ${totalPixels} pixels`,
                implication: totalPixels === 1 ?
                    'The entire field shows as one averaged value' :
                    `The field shows ${totalPixels} different values, allowing for spatial analysis`
            }
        };
    }

    /**
     * Get detection capability for a resolution
     * @param {number} resolution - Resolution in meters
     * @returns {Object} Detection capabilities
     */
    getDetectionCapability(resolution) {
        const impact = this.resolutionImpacts.get(resolution);
        if (!impact) {
            return {
                capabilities: ['Unknown resolution'],
                limitations: ['Resolution not recognized'],
                recommendedUse: 'Unknown'
            };
        }

        return {
            resolution: resolution,
            pixelSize: impact.pixelSize,
            capabilities: impact.detectionCapability,
            limitations: impact.limitations,
            bestFor: impact.bestFor,
            satellite: impact.satellite,
            revisitTime: impact.revisitTime,
            example: impact.example
        };
    }

    /**
     * Start an educational tutorial about resolution tradeoffs
     * @returns {Object} Tutorial configuration
     */
    educateResolutionTradeoffs() {
        this.educationMode = true;

        return {
            title: 'Understanding Satellite Resolution',
            introduction: 'Different satellites provide data at different resolutions. Each has advantages and limitations.',
            lessons: [
                {
                    id: 'pixel_basics',
                    title: 'What is a pixel?',
                    content: 'A pixel represents the smallest area measured by a satellite sensor. Smaller pixels = more detail.',
                    interactive: true,
                    type: 'pixel_demonstration'
                },
                {
                    id: 'resolution_comparison',
                    title: 'Comparing Resolutions',
                    content: 'See how the same area looks at different resolutions',
                    interactive: true,
                    type: 'resolution_comparison'
                },
                {
                    id: 'application_matching',
                    title: 'Choosing the Right Resolution',
                    content: 'Match the resolution to the agricultural application',
                    interactive: true,
                    type: 'pixel_hunt'
                }
            ],
            assessment: {
                questions: this.generateAssessmentQuestions(),
                passingScore: 80
            }
        };
    }

    /**
     * Start a pixel hunt mini-game
     * @param {string} scenarioId - Scenario ID or 'random'
     * @returns {Object} Pixel hunt game data
     */
    startPixelHunt(scenarioId = 'random') {
        let scenario;

        if (scenarioId === 'random') {
            const available = this.pixelHuntScenarios.filter(s =>
                !this.completedScenarios.includes(s.id)
            );
            scenario = available.length > 0 ?
                available[Math.floor(Math.random() * available.length)] :
                this.pixelHuntScenarios[Math.floor(Math.random() * this.pixelHuntScenarios.length)];
        } else {
            scenario = this.pixelHuntScenarios.find(s => s.id === scenarioId);
        }

        if (!scenario) {
            throw new Error(`Pixel hunt scenario not found: ${scenarioId}`);
        }

        this.currentScenario = scenario;

        return {
            scenario: scenario,
            instructions: this.generatePixelHuntInstructions(scenario),
            visualizations: this.generatePixelHuntVisualizations(scenario),
            interactiveElements: this.createPixelHuntInteraction(scenario)
        };
    }

    /**
     * Submit answer for pixel hunt
     * @param {number} selectedResolution - User's selected resolution
     * @returns {Object} Result with feedback
     */
    submitPixelHuntAnswer(selectedResolution) {
        if (!this.currentScenario) {
            throw new Error('No active pixel hunt scenario');
        }

        const correct = selectedResolution === this.currentScenario.correctAnswer;

        if (correct && !this.completedScenarios.includes(this.currentScenario.id)) {
            this.completedScenarios.push(this.currentScenario.id);
        }

        const result = {
            correct: correct,
            selectedResolution: selectedResolution,
            correctResolution: this.currentScenario.correctAnswer,
            explanation: this.currentScenario.explanation,
            feedback: this.generatePixelHuntFeedback(selectedResolution, this.currentScenario),
            educational: this.generateDetailedExplanation(this.currentScenario, selectedResolution)
        };

        // Clear current scenario
        this.currentScenario = null;

        return result;
    }

    /**
     * Get current resolution impacts
     * @param {number} resolution - Resolution to analyze
     * @returns {Object} Resolution impacts
     */
    getResolutionImpacts(resolution) {
        return this.resolutionImpacts.get(resolution) || null;
    }

    /**
     * Generate resolution education content
     * @param {number} fromRes - Previous resolution
     * @param {number} toRes - New resolution
     * @returns {Object} Educational content
     */
    generateResolutionEducation(fromRes, toRes) {
        const comparison = this.compareResolutions(fromRes, toRes);

        return {
            title: `Switching from ${fromRes}m to ${toRes}m resolution`,
            keyChanges: [
                `Pixel size: ${comparison.resolution1.pixelSize} → ${comparison.resolution2.pixelSize}`,
                `Detail level: ${comparison.detailChange.replace('_', ' ')}`,
                `Coverage: ${comparison.coverageChange.replace('_', ' ')}`,
                `Data volume: ${comparison.dataVolumeChange.replace('_', ' ')}`
            ],
            practicalImplications: this.generatePracticalImplications(fromRes, toRes),
            recommendedApplications: this.getResolutionApplications(toRes),
            nextLearningSteps: this.suggestNextLearningSteps(toRes)
        };
    }

    /**
     * Create pixel visualization grid
     * @param {number} pixelsWide - Width in pixels
     * @param {number} pixelsHigh - Height in pixels
     * @param {number} resolution - Resolution in meters
     * @returns {Object} Visualization data
     */
    createPixelVisualization(pixelsWide, pixelsHigh, resolution) {
        const grid = [];

        for (let y = 0; y < pixelsHigh; y++) {
            for (let x = 0; x < pixelsWide; x++) {
                grid.push({
                    x: x,
                    y: y,
                    id: `pixel_${x}_${y}`,
                    realWorldX: x * resolution,
                    realWorldY: y * resolution,
                    realWorldWidth: resolution,
                    realWorldHeight: resolution,
                    value: Math.random() // Synthetic data value
                });
            }
        }

        return {
            grid: grid,
            dimensions: { width: pixelsWide, height: pixelsHigh },
            pixelSize: resolution,
            totalPixels: pixelsWide * pixelsHigh,
            renderingHints: {
                showGrid: pixelsWide <= 20 && pixelsHigh <= 20,
                showLabels: pixelsWide <= 10 && pixelsHigh <= 10,
                colorScheme: 'viridis'
            }
        };
    }

    /**
     * Generate comparison explanation
     * @param {number} r1 - First resolution
     * @param {number} r2 - Second resolution
     * @param {number} ratio - Area ratio
     * @returns {string} Explanation text
     */
    generateComparisonExplanation(r1, r2, ratio) {
        if (r2 > r1) {
            return `Each ${r2}m pixel covers ${ratio.toFixed(1)} times more area than a ${r1}m pixel. ` +
                   `This means ${r2}m resolution shows average conditions over larger areas, ` +
                   `providing less spatial detail but broader regional coverage.`;
        } else {
            return `Each ${r2}m pixel covers ${(1/ratio).toFixed(1)} times less area than a ${r1}m pixel. ` +
                   `This means ${r2}m resolution can detect smaller features and variations, ` +
                   `providing more spatial detail but requiring more data storage and processing.`;
        }
    }

    /**
     * Generate tradeoff explanation
     * @param {number} r1 - First resolution
     * @param {number} r2 - Second resolution
     * @returns {Object} Tradeoff explanation
     */
    generateTradeoffExplanation(r1, r2) {
        const higherRes = Math.min(r1, r2);
        const lowerRes = Math.max(r1, r2);

        return {
            higherResolution: {
                advantages: ['More spatial detail', 'Can detect smaller features', 'Better for precision applications'],
                disadvantages: ['Smaller coverage area', 'More data to process', 'Higher storage requirements']
            },
            lowerResolution: {
                advantages: ['Larger coverage area', 'Less data volume', 'Faster processing', 'Better for regional trends'],
                disadvantages: ['Less spatial detail', 'Cannot detect small features', 'Averages local variations']
            },
            recommendation: this.getResolutionRecommendation(r1, r2)
        };
    }

    /**
     * Generate assessment questions
     * @returns {Array} Assessment questions
     */
    generateAssessmentQuestions() {
        return [
            {
                id: 'q1',
                question: 'A farmer wants to map individual crop rows. Which resolution is most appropriate?',
                options: ['30m', '250m', '9km'],
                correct: '30m',
                explanation: '30m resolution can detect features as small as crop rows, while larger pixels would average across multiple rows.'
            },
            {
                id: 'q2',
                question: 'For monitoring soil moisture across a large agricultural region, which resolution provides the best coverage?',
                options: ['30m', '250m', '9km'],
                correct: '9km',
                explanation: '9km SMAP data is specifically designed for soil moisture monitoring and provides consistent global coverage.'
            },
            {
                id: 'q3',
                question: 'What happens when pixel size is larger than the feature you want to detect?',
                options: [
                    'The feature becomes more visible',
                    'The feature gets averaged with surrounding area',
                    'The feature appears larger than it actually is'
                ],
                correct: 'The feature gets averaged with surrounding area',
                explanation: 'When pixels are larger than features, the sensor averages the feature with its surroundings, making it difficult or impossible to detect.'
            }
        ];
    }

    /**
     * Update method called by GameEngine
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Update any animations or time-based educational content
        if (this.educationMode) {
            // Update educational timers, animations, etc.
        }
    }

    /**
     * Generate various helper methods...
     */

    generatePixelHuntInstructions(scenario) {
        return {
            title: scenario.title,
            description: scenario.description,
            task: 'Select the best resolution for this application',
            hint: 'Consider what size features need to be detected'
        };
    }

    generatePixelHuntVisualizations(scenario) {
        return scenario.resolutions.map(res => ({
            resolution: res,
            visualization: this.createPixelVisualization(10, 10, res),
            detectionResult: this.simulateFeatureDetection(scenario.feature, res)
        }));
    }

    createPixelHuntInteraction(scenario) {
        return {
            type: 'resolution_selector',
            options: scenario.resolutions.map(res => ({
                value: res,
                label: `${res}m resolution`,
                description: this.resolutionImpacts.get(res)?.pixelSize || `${res}m × ${res}m`
            }))
        };
    }

    generatePixelHuntFeedback(selected, scenario) {
        const correct = selected === scenario.correctAnswer;

        if (correct) {
            return {
                type: 'success',
                message: 'Correct! You understand how resolution affects feature detection.',
                details: `${selected}m resolution is indeed the best choice for ${scenario.feature.type} detection.`
            };
        } else {
            return {
                type: 'incorrect',
                message: 'Not quite right. Let\'s explore why.',
                details: `${selected}m resolution has limitations for this application. ${scenario.correctAnswer}m would be better.`
            };
        }
    }

    generateDetailedExplanation(scenario, selected) {
        const selectedImpact = this.resolutionImpacts.get(selected);
        const correctImpact = this.resolutionImpacts.get(scenario.correctAnswer);

        return {
            selectedResolution: {
                resolution: selected,
                pixelSize: selectedImpact?.pixelSize,
                capabilities: selectedImpact?.detectionCapability,
                limitations: selectedImpact?.limitations
            },
            correctResolution: {
                resolution: scenario.correctAnswer,
                pixelSize: correctImpact?.pixelSize,
                whyBetter: this.explainWhyBetter(scenario, selected, scenario.correctAnswer)
            }
        };
    }

    simulateFeatureDetection(feature, resolution) {
        const canDetect = feature.size >= resolution * 2; // Simple detection rule

        return {
            canDetect: canDetect,
            confidence: canDetect ? Math.min(1, feature.size / resolution) : 0,
            explanation: canDetect ?
                `Feature is ${feature.size}m, which is detectable by ${resolution}m pixels` :
                `Feature is ${feature.size}m, too small for ${resolution}m pixels to resolve clearly`
        };
    }

    generatePracticalImplications(fromRes, toRes) {
        // Implementation for practical implications
        return [`Switching from ${fromRes}m to ${toRes}m affects your ability to detect different agricultural features`];
    }

    getResolutionApplications(resolution) {
        const impact = this.resolutionImpacts.get(resolution);
        return impact ? impact.bestFor : [];
    }

    suggestNextLearningSteps(resolution) {
        return [
            'Try comparing this resolution with others',
            'Explore what features can be detected',
            'Practice with pixel hunt scenarios'
        ];
    }

    getResolutionRecommendation(r1, r2) {
        return `Choose based on your specific needs: ${Math.min(r1, r2)}m for detail, ${Math.max(r1, r2)}m for coverage`;
    }

    explainWhyBetter(scenario, selected, correct) {
        return `${correct}m resolution is better suited for ${scenario.feature.type} detection compared to ${selected}m`;
    }
}

export { ResolutionManager };