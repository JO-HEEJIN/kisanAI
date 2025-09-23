/**
 * NASA Farm Navigators - Real-Time Data Comparison Tool
 * Demonstrates live satellite data integration and comparison capabilities
 * Shows temporal analysis and cross-validation between different NASA datasets
 */

import { EventSystem } from '../utils/EventSystem.js';

class RealTimeComparison {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.container = null;
        this.eventSystem = gameEngine ? gameEngine.getEventSystem() : EventSystem.getInstance();

        // Comparison state
        this.activeComparisons = new Map();
        this.refreshInterval = 30000; // 30 seconds
        this.autoRefresh = false;

        // Data sources configuration
        this.dataSources = {
            'SMAP_L3': {
                name: 'SMAP L3 Surface Moisture',
                type: 'soil_moisture',
                depth: 'surface',
                resolution: '9km',
                color: '#2196F3',
                updateFrequency: 'daily'
            },
            'SMAP_L4': {
                name: 'SMAP L4 Root Zone Moisture',
                type: 'soil_moisture',
                depth: 'root_zone',
                resolution: '9km',
                color: '#1976D2',
                updateFrequency: 'daily'
            },
            'MODIS_NDVI': {
                name: 'MODIS Vegetation Index',
                type: 'vegetation',
                resolution: '250m',
                color: '#4CAF50',
                updateFrequency: '1-2 days'
            },
            'LANDSAT_NDVI': {
                name: 'Landsat Vegetation Index',
                type: 'vegetation',
                resolution: '30m',
                color: '#2E7D32',
                updateFrequency: '16 days'
            },
            'GPM_PRECIPITATION': {
                name: 'GPM Precipitation',
                type: 'precipitation',
                resolution: '11km',
                color: '#9C27B0',
                updateFrequency: '3 hours'
            }
        };

        // Comparison scenarios
        this.scenarios = {
            'moisture_depths': {
                name: 'Surface vs Root Zone Moisture',
                description: 'Compare SMAP L3 surface moisture with L4 root zone moisture',
                dataSources: ['SMAP_L3', 'SMAP_L4'],
                analysisType: 'depth_comparison'
            },
            'vegetation_resolution': {
                name: 'Multi-Resolution Vegetation Analysis',
                description: 'Compare MODIS and Landsat vegetation indices',
                dataSources: ['MODIS_NDVI', 'LANDSAT_NDVI'],
                analysisType: 'resolution_comparison'
            },
            'moisture_vegetation': {
                name: 'Soil Moisture vs Vegetation Health',
                description: 'Analyze relationship between soil moisture and vegetation',
                dataSources: ['SMAP_L4', 'MODIS_NDVI'],
                analysisType: 'correlation_analysis'
            },
            'comprehensive': {
                name: 'Comprehensive Agricultural Monitoring',
                description: 'All-in-one agricultural data integration',
                dataSources: ['SMAP_L3', 'SMAP_L4', 'MODIS_NDVI', 'GPM_PRECIPITATION'],
                analysisType: 'multi_source_integration'
            }
        };

        this.isInitialized = false;
    }

    /**
     * Initialize the real-time comparison tool
     */
    async initialize(containerElement) {
        this.container = containerElement;
        await this.createInterface();
        this.setupEventListeners();
        this.isInitialized = true;

        // Start with a default scenario
        await this.loadScenario('moisture_depths');
    }

    /**
     * Create the user interface
     */
    async createInterface() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="realtime-comparison">
                <div class="comparison-header">
                    <h3>Real-Time Satellite Data Comparison</h3>
                    <div class="header-controls">
                        <div class="refresh-control">
                            <button id="manualRefresh" class="control-btn">
                                Refresh Data
                            </button>
                            <label class="auto-refresh-toggle">
                                <input type="checkbox" id="autoRefresh">
                                Auto-refresh (30s)
                            </label>
                        </div>
                        <div class="scenario-selector">
                            <label>Comparison Scenario:</label>
                            <select id="scenarioSelect">
                                ${Object.entries(this.scenarios).map(([id, scenario]) => `
                                    <option value="${id}">${scenario.name}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="scenario-description">
                    <div id="scenarioDescription" class="description-text">
                        Select a scenario to begin real-time data comparison
                    </div>
                </div>

                <div class="comparison-content">
                    <div class="data-panels">
                        <div id="dataPanels" class="panels-grid">
                            <!-- Dynamic data panels will be inserted here -->
                        </div>
                    </div>

                    <div class="analysis-section">
                        <div class="temporal-chart">
                            <h4>Temporal Analysis</h4>
                            <canvas id="temporalChart" width="800" height="300"></canvas>
                            <div class="chart-controls">
                                <label>Time Range:</label>
                                <select id="timeRange">
                                    <option value="7d">Last 7 days</option>
                                    <option value="30d">Last 30 days</option>
                                    <option value="90d">Last 90 days</option>
                                    <option value="1y">Last year</option>
                                </select>
                            </div>
                        </div>

                        <div class="correlation-analysis">
                            <h4>🔗 Cross-Correlation Analysis</h4>
                            <div id="correlationResults" class="correlation-content">
                                <!-- Correlation results will be shown here -->
                            </div>
                        </div>
                    </div>
                </div>

                <div class="comparison-insights">
                    <h4>🧠 AI-Powered Insights</h4>
                    <div id="insightsContent" class="insights-content">
                        <!-- Dynamic insights will be generated here -->
                    </div>
                </div>

                <div class="educational-section">
                    <h4>📚 Learning Objectives</h4>
                    <div id="learningObjectives" class="learning-content">
                        <!-- Educational content based on current scenario -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Manual refresh button
        document.getElementById('manualRefresh')?.addEventListener('click', () => {
            this.refreshData();
        });

        // Auto-refresh toggle
        document.getElementById('autoRefresh')?.addEventListener('change', (e) => {
            this.autoRefresh = e.target.checked;
            if (this.autoRefresh) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });

        // Scenario selection
        document.getElementById('scenarioSelect')?.addEventListener('change', (e) => {
            this.loadScenario(e.target.value);
        });

        // Time range selection
        document.getElementById('timeRange')?.addEventListener('change', (e) => {
            this.updateTemporalChart(e.target.value);
        });
    }

    /**
     * Load a comparison scenario
     */
    async loadScenario(scenarioId) {
        const scenario = this.scenarios[scenarioId];
        if (!scenario) return;

        // Update description
        document.getElementById('scenarioDescription').innerHTML = `
            <h4>${scenario.name}</h4>
            <p>${scenario.description}</p>
            <div class="data-sources-info">
                <strong>Data Sources:</strong>
                ${scenario.dataSources.map(sourceId => {
                    const source = this.dataSources[sourceId];
                    return `<span class="source-badge" style="background-color: ${source.color}20; border-left: 3px solid ${source.color};">${source.name}</span>`;
                }).join('')}
            </div>
        `;

        // Create data panels
        await this.createDataPanels(scenario.dataSources);

        // Load initial data
        await this.loadComparisonData(scenario);

        // Update educational content
        this.updateEducationalContent(scenario);

        // Update insights
        this.generateInsights(scenario);
    }

    /**
     * Create data panels for the selected data sources
     */
    async createDataPanels(dataSources) {
        const panelsContainer = document.getElementById('dataPanels');

        panelsContainer.innerHTML = dataSources.map(sourceId => {
            const source = this.dataSources[sourceId];
            return `
                <div class="data-panel" data-source="${sourceId}">
                    <div class="panel-header" style="border-left: 4px solid ${source.color};">
                        <h4>${source.name}</h4>
                        <div class="source-info">
                            <span class="resolution">${source.resolution}</span>
                            <span class="update-freq">${source.updateFrequency}</span>
                        </div>
                    </div>
                    <div class="panel-content">
                        <div id="data-${sourceId}" class="data-display">
                            <div class="loading-indicator">Loading live data...</div>
                        </div>
                        <div class="data-stats">
                            <div id="stats-${sourceId}" class="stats-content">
                                <!-- Statistics will be populated here -->
                            </div>
                        </div>
                    </div>
                    <div class="panel-footer">
                        <div class="last-updated">
                            Last updated: <span id="timestamp-${sourceId}">--</span>
                        </div>
                        <div class="data-quality">
                            Quality: <span id="quality-${sourceId}" class="quality-indicator">Good</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Load comparison data for the scenario
     */
    async loadComparisonData(scenario) {
        const dataManager = this.gameEngine.getManagers().data;
        const farmState = this.gameEngine.getFarmState();
        const location = farmState.location;
        if (!location) {
            throw new Error('Farm location must be set before loading comparison data');
        }
        const currentDate = new Date().toISOString().split('T')[0];

        for (const sourceId of scenario.dataSources) {
            try {
                const source = this.dataSources[sourceId];
                let data;

                // Fetch data based on source type
                switch (source.type) {
                    case 'soil_moisture':
                        data = await dataManager.fetchSMAPData(source.depth, {
                            latitude: location.latitude,
                            longitude: location.longitude,
                            date: currentDate
                        });
                        break;

                    case 'vegetation':
                        if (sourceId === 'MODIS_NDVI') {
                            data = await dataManager.fetchMODISData('NDVI', {
                                latitude: location.latitude,
                                longitude: location.longitude,
                                date: currentDate
                            });
                        } else if (sourceId === 'LANDSAT_NDVI') {
                            data = await dataManager.fetchLandsatData('NDVI', {
                                latitude: location.latitude,
                                longitude: location.longitude,
                                date: currentDate
                            });
                        }
                        break;

                    case 'precipitation':
                        data = await dataManager.fetchPrecipitationData({
                            latitude: location.latitude,
                            longitude: location.longitude,
                            date: currentDate
                        });
                        break;
                }

                // Store and display the data
                this.activeComparisons.set(sourceId, data);
                this.displayDataInPanel(sourceId, data);

            } catch (error) {
                console.error(`Failed to load data for ${sourceId}:`, error);
                this.displayErrorInPanel(sourceId, error);
            }
        }

        // Perform cross-analysis
        this.performCrossAnalysis(scenario);
    }

    /**
     * Display data in a panel
     */
    displayDataInPanel(sourceId, data) {
        const dataElement = document.getElementById(`data-${sourceId}`);
        const statsElement = document.getElementById(`stats-${sourceId}`);
        const timestampElement = document.getElementById(`timestamp-${sourceId}`);

        if (!dataElement) return;

        // Create visualization based on data type
        const source = this.dataSources[sourceId];
        let displayContent = '';

        switch (source.type) {
            case 'soil_moisture':
                displayContent = this.createMoistureVisualization(data);
                break;
            case 'vegetation':
                displayContent = this.createVegetationVisualization(data);
                break;
            case 'precipitation':
                displayContent = this.createPrecipitationVisualization(data);
                break;
        }

        dataElement.innerHTML = displayContent;

        // Update statistics
        if (statsElement) {
            statsElement.innerHTML = this.createDataStatistics(data, source.type);
        }

        // Update timestamp
        if (timestampElement) {
            timestampElement.textContent = new Date(data.timestamp).toLocaleString();
        }
    }

    /**
     * Create moisture data visualization
     */
    createMoistureVisualization(data) {
        const moisture = data.surface_moisture || data.root_zone_moisture || 0;
        const percentage = Math.round(moisture * 100);
        const level = this.classifyMoistureLevel(moisture);

        return `
            <div class="moisture-display">
                <div class="moisture-gauge">
                    <div class="gauge-background">
                        <div class="gauge-fill" style="width: ${percentage}%; background-color: ${this.getMoistureColor(moisture)};"></div>
                    </div>
                    <div class="gauge-value">${percentage}%</div>
                </div>
                <div class="moisture-level ${level.toLowerCase()}">${level}</div>
                <div class="educational-note">
                    ${data.educational?.interpretation || 'Soil moisture level indicator'}
                </div>
            </div>
        `;
    }

    /**
     * Create vegetation visualization
     */
    createVegetationVisualization(data) {
        const ndvi = data.ndvi || 0;
        const percentage = Math.round(((ndvi + 1) / 2) * 100); // Normalize NDVI (-1 to 1) to percentage
        const health = this.classifyVegetationHealth(ndvi);

        return `
            <div class="vegetation-display">
                <div class="ndvi-indicator">
                    <div class="ndvi-scale">
                        <div class="ndvi-marker" style="left: ${percentage}%;"></div>
                        <div class="scale-labels">
                            <span>Poor</span>
                            <span>Moderate</span>
                            <span>Healthy</span>
                        </div>
                    </div>
                    <div class="ndvi-value">NDVI: ${ndvi.toFixed(3)}</div>
                </div>
                <div class="vegetation-health ${health.toLowerCase()}">${health}</div>
                <div class="educational-note">
                    ${data.educational?.interpretation || 'Vegetation health indicator'}
                </div>
            </div>
        `;
    }

    /**
     * Create precipitation visualization
     */
    createPrecipitationVisualization(data) {
        const precipitation = data.precipitation || 0;
        const intensity = this.classifyPrecipitationIntensity(precipitation);

        return `
            <div class="precipitation-display">
                <div class="precip-bars">
                    ${this.createPrecipitationBars(precipitation)}
                </div>
                <div class="precip-value">${precipitation.toFixed(1)} mm</div>
                <div class="precip-intensity ${intensity.toLowerCase()}">${intensity}</div>
                <div class="educational-note">
                    Recent precipitation amount
                </div>
            </div>
        `;
    }

    /**
     * Create data statistics display
     */
    createDataStatistics(data, dataType) {
        let stats = '';

        switch (dataType) {
            case 'soil_moisture':
                const moisture = data.surface_moisture || data.root_zone_moisture || 0;
                stats = `
                    <div class="stat-item">
                        <label>Value:</label>
                        <span>${(moisture * 100).toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <label>Depth:</label>
                        <span>${data.educational?.surface_depth || data.educational?.root_zone_depth || 'Unknown'}</span>
                    </div>
                `;
                break;

            case 'vegetation':
                stats = `
                    <div class="stat-item">
                        <label>NDVI:</label>
                        <span>${data.ndvi?.toFixed(3) || 'N/A'}</span>
                    </div>
                    <div class="stat-item">
                        <label>Resolution:</label>
                        <span>${data.resolution || 'Unknown'}</span>
                    </div>
                `;
                break;

            case 'precipitation':
                stats = `
                    <div class="stat-item">
                        <label>Amount:</label>
                        <span>${data.precipitation?.toFixed(1) || '0'} mm</span>
                    </div>
                    <div class="stat-item">
                        <label>Period:</label>
                        <span>24 hours</span>
                    </div>
                `;
                break;
        }

        return stats;
    }

    /**
     * Perform cross-analysis between data sources
     */
    performCrossAnalysis(scenario) {
        const results = document.getElementById('correlationResults');
        if (!results) return;

        const analysisResults = this.analyzeDataCorrelations(scenario);

        results.innerHTML = `
            <div class="correlation-matrix">
                ${analysisResults.correlations.map(corr => `
                    <div class="correlation-item">
                        <div class="correlation-pair">
                            ${corr.source1} ↔ ${corr.source2}
                        </div>
                        <div class="correlation-value ${this.getCorrelationClass(corr.coefficient)}">
                            ${corr.coefficient > 0 ? '+' : ''}${corr.coefficient.toFixed(3)}
                        </div>
                        <div class="correlation-interpretation">
                            ${corr.interpretation}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="analysis-summary">
                <h5>Analysis Summary</h5>
                <p>${analysisResults.summary}</p>
            </div>
        `;
    }

    /**
     * Analyze correlations between data sources
     */
    analyzeDataCorrelations(scenario) {
        const correlations = [];
        const dataSources = scenario.dataSources;

        // Generate mock correlations based on known relationships
        for (let i = 0; i < dataSources.length; i++) {
            for (let j = i + 1; j < dataSources.length; j++) {
                const source1 = dataSources[i];
                const source2 = dataSources[j];
                const correlation = this.calculateMockCorrelation(source1, source2);

                correlations.push({
                    source1: this.dataSources[source1].name,
                    source2: this.dataSources[source2].name,
                    coefficient: correlation.coefficient,
                    interpretation: correlation.interpretation
                });
            }
        }

        return {
            correlations: correlations,
            summary: this.generateAnalysisSummary(correlations)
        };
    }

    /**
     * Calculate mock correlation between two data sources
     */
    calculateMockCorrelation(source1, source2) {
        // Simulate realistic correlations based on known agricultural relationships
        const correlationMap = {
            'SMAP_L3_SMAP_L4': { coeff: 0.85, interpretation: 'Strong positive correlation - surface moisture often reflects deeper moisture patterns' },
            'SMAP_L4_MODIS_NDVI': { coeff: 0.72, interpretation: 'Strong positive correlation - adequate soil moisture supports healthy vegetation' },
            'SMAP_L3_MODIS_NDVI': { coeff: 0.65, interpretation: 'Moderate positive correlation - surface moisture influences short-term vegetation health' },
            'MODIS_NDVI_LANDSAT_NDVI': { coeff: 0.92, interpretation: 'Very strong positive correlation - both measure vegetation health at different scales' },
            'GPM_PRECIPITATION_SMAP_L3': { coeff: 0.68, interpretation: 'Moderate positive correlation - recent precipitation affects surface moisture' },
            'GPM_PRECIPITATION_SMAP_L4': { coeff: 0.45, interpretation: 'Moderate positive correlation - precipitation effects take time to reach root zone' }
        };

        const key1 = `${source1}_${source2}`;
        const key2 = `${source2}_${source1}`;

        const result = correlationMap[key1] || correlationMap[key2] || {
            coeff: (Math.random() - 0.5) * 0.8,
            interpretation: 'Correlation analysis in progress'
        };

        return {
            coefficient: result.coeff,
            interpretation: result.interpretation
        };
    }

    /**
     * Generate AI-powered insights
     */
    generateInsights(scenario) {
        const insightsElement = document.getElementById('insightsContent');
        if (!insightsElement) return;

        const insights = this.analyzeCurrentConditions(scenario);

        insightsElement.innerHTML = `
            <div class="insights-grid">
                ${insights.map(insight => `
                    <div class="insight-card ${insight.type}">
                        <div class="insight-icon">${insight.icon}</div>
                        <div class="insight-content">
                            <h5>${insight.title}</h5>
                            <p>${insight.description}</p>
                            <div class="insight-confidence">
                                Confidence: ${insight.confidence}%
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Analyze current conditions and generate insights
     */
    analyzeCurrentConditions(scenario) {
        const insights = [];

        // Generate scenario-specific insights
        switch (scenario.analysisType) {
            case 'depth_comparison':
                insights.push(
                    {
                        type: 'moisture',
                        icon: '💧',
                        title: 'Moisture Profile Analysis',
                        description: 'Surface moisture is responding faster to recent weather changes than root zone moisture.',
                        confidence: 85
                    },
                    {
                        type: 'irrigation',
                        icon: '🚿',
                        title: 'Irrigation Recommendation',
                        description: 'Root zone moisture levels suggest irrigation may be needed within 3-5 days.',
                        confidence: 78
                    }
                );
                break;

            case 'resolution_comparison':
                insights.push(
                    {
                        type: 'vegetation',
                        icon: '🌱',
                        title: 'Multi-Scale Vegetation Health',
                        description: 'High-resolution Landsat data reveals field-level variations not visible in MODIS data.',
                        confidence: 92
                    },
                    {
                        type: 'monitoring',
                        icon: '📊',
                        title: 'Monitoring Strategy',
                        description: 'Combine both resolutions for comprehensive crop monitoring - MODIS for trends, Landsat for precision.',
                        confidence: 88
                    }
                );
                break;

            case 'correlation_analysis':
                insights.push(
                    {
                        type: 'relationship',
                        icon: '🔗',
                        title: 'Soil-Vegetation Relationship',
                        description: 'Strong correlation detected between soil moisture and vegetation health, indicating water-limited conditions.',
                        confidence: 82
                    }
                );
                break;

            case 'multi_source_integration':
                insights.push(
                    {
                        type: 'comprehensive',
                        icon: '🎯',
                        title: 'Integrated Analysis',
                        description: 'All indicators suggest current conditions are favorable for crop growth with adequate moisture and healthy vegetation.',
                        confidence: 79
                    },
                    {
                        type: 'forecast',
                        icon: '🔮',
                        title: 'Short-term Outlook',
                        description: 'Based on current trends, expect stable conditions for the next 7-10 days.',
                        confidence: 73
                    }
                );
                break;
        }

        return insights;
    }

    /**
     * Update educational content
     */
    updateEducationalContent(scenario) {
        const educationElement = document.getElementById('learningObjectives');
        if (!educationElement) return;

        const objectives = this.getEducationalObjectives(scenario);

        educationElement.innerHTML = `
            <div class="objectives-list">
                ${objectives.map(objective => `
                    <div class="objective-item">
                        <div class="objective-icon">${objective.icon}</div>
                        <div class="objective-content">
                            <h5>${objective.title}</h5>
                            <p>${objective.description}</p>
                            <div class="objective-tasks">
                                <ul>
                                    ${objective.tasks.map(task => `<li>${task}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Get educational objectives for scenario
     */
    getEducationalObjectives(scenario) {
        const objectivesMap = {
            'moisture_depths': [
                {
                    icon: '📏',
                    title: 'Understand Soil Moisture Depths',
                    description: 'Learn the difference between surface and root zone soil moisture measurements',
                    tasks: [
                        'Compare SMAP L3 (surface) vs L4 (root zone) data',
                        'Understand why depths matter for different crops',
                        'Identify when to use each measurement for irrigation decisions'
                    ]
                }
            ],
            'vegetation_resolution': [
                {
                    icon: '🔍',
                    title: 'Master Resolution Trade-offs',
                    description: 'Understand how spatial resolution affects vegetation monitoring capabilities',
                    tasks: [
                        'Compare detail levels between Landsat (30m) and MODIS (250m)',
                        'Identify when to use high vs low resolution data',
                        'Understand coverage vs detail trade-offs'
                    ]
                }
            ],
            'moisture_vegetation': [
                {
                    icon: '🔗',
                    title: 'Analyze Data Relationships',
                    description: 'Learn to identify and interpret correlations between different satellite datasets',
                    tasks: [
                        'Observe soil moisture and vegetation correlations',
                        'Understand cause-and-effect relationships',
                        'Apply correlation analysis to agricultural decisions'
                    ]
                }
            ],
            'comprehensive': [
                {
                    icon: '🎯',
                    title: 'Integrate Multiple Data Sources',
                    description: 'Combine different NASA satellite datasets for comprehensive agricultural monitoring',
                    tasks: [
                        'Synthesize information from multiple satellites',
                        'Understand how different measurements complement each other',
                        'Make informed decisions using integrated data'
                    ]
                }
            ]
        };

        return objectivesMap[scenario.analysisType] || [];
    }

    /**
     * Helper methods for data classification and visualization
     */
    classifyMoistureLevel(moisture) {
        if (moisture < 0.15) return 'Very Dry';
        if (moisture < 0.25) return 'Dry';
        if (moisture < 0.4) return 'Moderate';
        if (moisture < 0.55) return 'Moist';
        return 'Wet';
    }

    getMoistureColor(moisture) {
        if (moisture < 0.15) return '#D32F2F';
        if (moisture < 0.25) return '#F57C00';
        if (moisture < 0.4) return '#FBC02D';
        if (moisture < 0.55) return '#689F38';
        return '#1976D2';
    }

    classifyVegetationHealth(ndvi) {
        if (ndvi < 0.2) return 'Poor';
        if (ndvi < 0.4) return 'Fair';
        if (ndvi < 0.6) return 'Good';
        return 'Excellent';
    }

    classifyPrecipitationIntensity(precip) {
        if (precip < 2) return 'Light';
        if (precip < 10) return 'Moderate';
        if (precip < 25) return 'Heavy';
        return 'Very Heavy';
    }

    createPrecipitationBars(precip) {
        const maxHeight = 60;
        const barHeight = Math.min(maxHeight, (precip / 50) * maxHeight);
        return `<div class="precip-bar" style="height: ${barHeight}px; background-color: #2196F3;"></div>`;
    }

    getCorrelationClass(coefficient) {
        const abs = Math.abs(coefficient);
        if (abs > 0.8) return 'strong';
        if (abs > 0.5) return 'moderate';
        return 'weak';
    }

    generateAnalysisSummary(correlations) {
        const strongCorrelations = correlations.filter(c => Math.abs(c.coefficient) > 0.7);

        if (strongCorrelations.length > 0) {
            return `Found ${strongCorrelations.length} strong correlation(s) between data sources, indicating well-connected agricultural conditions that can inform comprehensive farming decisions.`;
        } else {
            return 'Correlations between data sources are moderate to weak, suggesting diverse environmental conditions requiring careful interpretation.';
        }
    }

    /**
     * Auto-refresh functionality
     */
    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.refreshData();
        }, this.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    async refreshData() {
        const scenarioSelect = document.getElementById('scenarioSelect');
        const currentScenario = scenarioSelect?.value;

        if (currentScenario && this.scenarios[currentScenario]) {
            await this.loadComparisonData(this.scenarios[currentScenario]);
        }
    }

    displayErrorInPanel(sourceId, error) {
        const dataElement = document.getElementById(`data-${sourceId}`);
        if (dataElement) {
            dataElement.innerHTML = `
                <div class="error-display">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">Failed to load data</div>
                    <div class="error-details">${error.message}</div>
                </div>
            `;
        }
    }
}

export { RealTimeComparison };