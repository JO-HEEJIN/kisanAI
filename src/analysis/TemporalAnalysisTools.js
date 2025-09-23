import { MLPredictionService } from '../ml/MLPredictionService.js';

class TemporalAnalysisTools {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.container = null;
        this.analysisResults = new Map();
        this.activeTimeseries = new Map();
        this.eventSystem = gameEngine ? gameEngine.getEventSystem() : null;
        this.mlService = new MLPredictionService({
            fallbackMode: true,
            cacheEnabled: true
        });

        this.analysisTypes = {
            trend: {
                name: 'Trend Analysis',
                description: 'Identify long-term patterns in satellite data',
                methods: ['linear', 'polynomial', 'seasonal']
            },
            anomaly: {
                name: 'Anomaly Detection',
                description: 'Detect unusual patterns or outliers',
                methods: ['statistical', 'seasonal', 'contextual']
            },
            seasonal: {
                name: 'Seasonal Analysis',
                description: 'Analyze seasonal variations and cycles',
                methods: ['decomposition', 'fourier', 'wavelet']
            },
            correlation: {
                name: 'Cross-Correlation',
                description: 'Compare relationships between different data sources',
                methods: ['pearson', 'spearman', 'lag_correlation']
            },
            forecast: {
                name: 'Predictive Analysis',
                description: 'Generate short-term forecasts based on historical patterns',
                methods: ['arima', 'exponential_smoothing', 'ml_ensemble']
            },
            ml_prediction: {
                name: 'Machine Learning Prediction',
                description: 'Advanced ML-powered predictions for soil moisture and crop yield',
                methods: ['soil_moisture_forecast', 'crop_yield_prediction', 'anomaly_detection', 'irrigation_optimization']
            }
        };

        this.timeRanges = {
            '7d': { days: 7, label: '1 Week', interval: 'daily' },
            '30d': { days: 30, label: '1 Month', interval: 'daily' },
            '90d': { days: 90, label: '3 Months', interval: 'weekly' },
            '365d': { days: 365, label: '1 Year', interval: 'monthly' },
            'custom': { days: null, label: 'Custom Range', interval: 'adaptive' }
        };

        this.satelliteCharacteristics = {
            'MODIS_TERRA': { revisit: 1, temporal_resolution: 'daily' },
            'MODIS_AQUA': { revisit: 1, temporal_resolution: 'daily' },
            'LANDSAT_8': { revisit: 16, temporal_resolution: '16-day' },
            'LANDSAT_9': { revisit: 16, temporal_resolution: '16-day' },
            'SMAP': { revisit: 3, temporal_resolution: '3-day' },
            'GPM': { revisit: 0.5, temporal_resolution: '12-hour' }
        };

        this.educationalScenarios = [
            {
                id: 'drought_monitoring',
                title: 'Drought Monitoring with Multi-Temporal SMAP',
                description: 'Track soil moisture decline over time to identify drought conditions',
                dataType: 'soil_moisture',
                timeRange: '90d',
                analysisType: 'trend',
                location: { latitude: 39.7391, longitude: -104.9847, name: 'Colorado Agricultural Region' },
                expectedOutcome: 'Declining soil moisture trend indicating drought onset'
            },
            {
                id: 'crop_phenology',
                title: 'Crop Growth Cycle Analysis with MODIS NDVI',
                description: 'Monitor vegetation development through growing season',
                dataType: 'vegetation_index',
                timeRange: '365d',
                analysisType: 'seasonal',
                location: { latitude: 41.2524, longitude: -95.9980, name: 'Nebraska Corn Belt' },
                expectedOutcome: 'Seasonal NDVI cycle showing planting, growth, and harvest'
            },
            {
                id: 'irrigation_impact',
                title: 'Irrigation Effectiveness Assessment',
                description: 'Analyze soil moisture response to irrigation events',
                dataType: 'soil_moisture',
                timeRange: '30d',
                analysisType: 'anomaly',
                location: { latitude: 36.7783, longitude: -119.4179, name: 'Central Valley California' },
                expectedOutcome: 'Moisture spikes correlated with irrigation timing'
            },
            {
                id: 'climate_correlation',
                title: 'Climate-Vegetation Relationship Analysis',
                description: 'Examine correlation between precipitation and vegetation health',
                dataType: 'multi_source',
                timeRange: '365d',
                analysisType: 'correlation',
                location: { latitude: 45.5017, longitude: -73.5673, name: 'Quebec Agricultural Region' },
                expectedOutcome: 'Positive correlation between precipitation and NDVI with lag'
            }
        ];

        this.init();
    }

    init() {
        console.log('Initializing Temporal Analysis Tools...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.eventSystem) return;

        this.eventSystem.on('temporal-analysis-requested', this.handleAnalysisRequest.bind(this));
        this.eventSystem.on('timeseries-data-updated', this.handleTimeseriesUpdate.bind(this));
        this.eventSystem.on('scenario-selected', this.handleScenarioSelection.bind(this));
    }

    async createAnalysisInterface(container) {
        this.container = container;
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="temporal-analysis-container">
                <div class="analysis-header">
                    <h2>🕒 Temporal Analysis Tools</h2>
                    <p>Analyze satellite data patterns over time to understand agricultural dynamics</p>
                </div>

                <div class="analysis-tabs">
                    <button class="tab-btn active" data-tab="scenarios">Educational Scenarios</button>
                    <button class="tab-btn" data-tab="custom">Custom Analysis</button>
                    <button class="tab-btn" data-tab="compare">Multi-Source Comparison</button>
                    <button class="tab-btn" data-tab="forecast">Predictive Models</button>
                </div>

                <div class="tab-content">
                    <div class="tab-panel active" id="scenarios-panel">
                        <div class="scenarios-grid">
                            ${this.educationalScenarios.map(scenario => `
                                <div class="scenario-card" data-scenario="${scenario.id}">
                                    <div class="scenario-header">
                                        <h3>${scenario.title}</h3>
                                        <span class="scenario-type">${scenario.analysisType}</span>
                                    </div>
                                    <p class="scenario-description">${scenario.description}</p>
                                    <div class="scenario-details">
                                        <div class="detail-item">
                                            <span class="detail-label">Location:</span>
                                            <span class="detail-value">${scenario.location.name}</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Time Range:</span>
                                            <span class="detail-value">${this.timeRanges[scenario.timeRange].label}</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Expected:</span>
                                            <span class="detail-value">${scenario.expectedOutcome}</span>
                                        </div>
                                    </div>
                                    <button class="scenario-btn" onclick="temporalAnalysis.runScenario('${scenario.id}')">
                                        Run Analysis
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="tab-panel" id="custom-panel">
                        <div class="custom-analysis-form">
                            <div class="form-section">
                                <h3>Data Source Configuration</h3>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="data-type">Data Type:</label>
                                        <select id="data-type">
                                            <option value="soil_moisture">Soil Moisture (SMAP)</option>
                                            <option value="vegetation_index">Vegetation Index (MODIS)</option>
                                            <option value="precipitation">Precipitation (GPM)</option>
                                            <option value="land_surface_temperature">Temperature (MODIS)</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="time-range">Time Range:</label>
                                        <select id="time-range">
                                            ${Object.entries(this.timeRanges).map(([key, range]) =>
                                                `<option value="${key}">${range.label}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="analysis-type">Analysis Type:</label>
                                        <select id="analysis-type">
                                            ${Object.entries(this.analysisTypes).map(([key, type]) =>
                                                `<option value="${key}">${type.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="location-input">Location:</label>
                                        <input type="text" id="location-input" placeholder="Enter coordinates or click map">
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3>Analysis Parameters</h3>
                                <div id="analysis-parameters">
                                    <!-- Dynamic parameters based on analysis type -->
                                </div>
                            </div>

                            <button class="analysis-btn" onclick="temporalAnalysis.runCustomAnalysis()">
                                Start Analysis
                            </button>
                        </div>
                    </div>

                    <div class="tab-panel" id="compare-panel">
                        <div class="multi-source-interface">
                            <h3>Multi-Source Temporal Comparison</h3>
                            <div class="source-selection">
                                ${Object.entries(this.satelliteCharacteristics).map(([satellite, chars]) => `
                                    <div class="source-card">
                                        <input type="checkbox" id="source-${satellite}" class="source-checkbox">
                                        <label for="source-${satellite}" class="source-label">
                                            <div class="source-info">
                                                <h4>${satellite.replace('_', ' ')}</h4>
                                                <p>Revisit: ${chars.revisit} day${chars.revisit !== 1 ? 's' : ''}</p>
                                                <p>Resolution: ${chars.temporal_resolution}</p>
                                            </div>
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="compare-btn" onclick="temporalAnalysis.compareMultipleSources()">
                                Compare Selected Sources
                            </button>
                        </div>
                    </div>

                    <div class="tab-panel" id="forecast-panel">
                        <div class="forecast-interface">
                            <h3>Predictive Analysis Dashboard</h3>
                            <div class="forecast-options">
                                <div class="forecast-type">
                                    <h4>Forecast Type</h4>
                                    <div class="radio-group">
                                        <label><input type="radio" name="forecast-type" value="short-term" checked> Short-term (7 days)</label>
                                        <label><input type="radio" name="forecast-type" value="seasonal"> Seasonal (3 months)</label>
                                        <label><input type="radio" name="forecast-type" value="annual"> Annual (12 months)</label>
                                    </div>
                                </div>
                                <div class="forecast-method">
                                    <h4>Method</h4>
                                    <select id="forecast-method">
                                        <option value="arima">ARIMA Model</option>
                                        <option value="exponential">Exponential Smoothing</option>
                                        <option value="ensemble">ML Ensemble</option>
                                    </select>
                                </div>
                            </div>
                            <button class="forecast-btn" onclick="temporalAnalysis.generateForecast()">
                                Generate Forecast
                            </button>
                        </div>
                    </div>
                </div>

                <div class="analysis-results" id="analysis-results">
                    <!-- Results will be displayed here -->
                </div>
            </div>
        `;

        this.setupTabSwitching(container);
        this.setupDynamicParameters(container);

        return container;
    }

    setupTabSwitching(container) {
        const tabButtons = container.querySelectorAll('.tab-btn');
        const tabPanels = container.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));

                button.classList.add('active');
                container.querySelector(`#${targetTab}-panel`).classList.add('active');
            });
        });
    }

    setupDynamicParameters(container) {
        const analysisTypeSelect = container.querySelector('#analysis-type');
        const parametersContainer = container.querySelector('#analysis-parameters');

        analysisTypeSelect.addEventListener('change', () => {
            const analysisType = analysisTypeSelect.value;
            this.updateAnalysisParameters(parametersContainer, analysisType);
        });

        this.updateAnalysisParameters(parametersContainer, 'trend');
    }

    updateAnalysisParameters(container, analysisType) {
        const type = this.analysisTypes[analysisType];

        container.innerHTML = `
            <div class="parameter-group">
                <label for="method-select">Analysis Method:</label>
                <select id="method-select">
                    ${type.methods.map(method => `
                        <option value="${method}">${this.formatMethodName(method)}</option>
                    `).join('')}
                </select>
            </div>

            ${this.getSpecificParameters(analysisType)}

            <div class="parameter-group">
                <label>
                    <input type="checkbox" id="include-educational" checked>
                    Include Educational Explanations
                </label>
            </div>
        `;
    }

    getSpecificParameters(analysisType) {
        switch (analysisType) {
            case 'trend':
                return `
                    <div class="parameter-group">
                        <label for="trend-window">Analysis Window (days):</label>
                        <input type="number" id="trend-window" value="30" min="7" max="365">
                    </div>
                    <div class="parameter-group">
                        <label for="confidence-level">Confidence Level:</label>
                        <select id="confidence-level">
                            <option value="0.9">90%</option>
                            <option value="0.95" selected>95%</option>
                            <option value="0.99">99%</option>
                        </select>
                    </div>
                `;

            case 'anomaly':
                return `
                    <div class="parameter-group">
                        <label for="sensitivity">Sensitivity:</label>
                        <select id="sensitivity">
                            <option value="low">Low (Conservative)</option>
                            <option value="medium" selected>Medium (Balanced)</option>
                            <option value="high">High (Sensitive)</option>
                        </select>
                    </div>
                    <div class="parameter-group">
                        <label for="baseline-period">Baseline Period (days):</label>
                        <input type="number" id="baseline-period" value="60" min="14" max="365">
                    </div>
                `;

            case 'seasonal':
                return `
                    <div class="parameter-group">
                        <label for="season-period">Season Period:</label>
                        <select id="season-period">
                            <option value="365">Annual (365 days)</option>
                            <option value="90">Quarterly (90 days)</option>
                            <option value="30">Monthly (30 days)</option>
                        </select>
                    </div>
                `;

            case 'correlation':
                return `
                    <div class="parameter-group">
                        <label for="lag-window">Maximum Lag (days):</label>
                        <input type="number" id="lag-window" value="14" min="1" max="60">
                    </div>
                    <div class="parameter-group">
                        <label for="correlation-threshold">Significance Threshold:</label>
                        <input type="number" id="correlation-threshold" value="0.05" min="0.01" max="0.1" step="0.01">
                    </div>
                `;

            case 'forecast':
                return `
                    <div class="parameter-group">
                        <label for="forecast-horizon">Forecast Horizon (days):</label>
                        <input type="number" id="forecast-horizon" value="14" min="1" max="90">
                    </div>
                    <div class="parameter-group">
                        <label for="uncertainty-bands">Include Uncertainty:</label>
                        <input type="checkbox" id="uncertainty-bands" checked>
                    </div>
                `;

            default:
                return '';
        }
    }

    formatMethodName(method) {
        return method.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    async runScenario(scenarioId) {
        const scenario = this.educationalScenarios.find(s => s.id === scenarioId);
        if (!scenario) {
            console.error('Scenario not found:', scenarioId);
            return;
        }

        console.log(`Running scenario: ${scenario.title}`);

        const resultsContainer = document.getElementById('analysis-results');
        resultsContainer.innerHTML = `
            <div class="analysis-loading">
                <div class="loading-spinner"></div>
                <h3>Running Analysis: ${scenario.title}</h3>
                <p>Collecting temporal data and performing ${scenario.analysisType} analysis...</p>
            </div>
        `;

        try {
            const timeseriesData = await this.collectTimeseriesData(scenario);
            const analysisResult = await this.performAnalysis(scenario.analysisType, timeseriesData, scenario);

            this.displayAnalysisResults(resultsContainer, analysisResult, scenario);

            this.eventSystem.emit('temporal-analysis-completed', {
                scenario: scenario,
                results: analysisResult
            });

        } catch (error) {
            console.error('Analysis failed:', error);
            this.displayAnalysisError(resultsContainer, error, scenario);
        }
    }

    async collectTimeseriesData(scenario) {
        const dataManager = this.gameEngine.getManagers().data;
        const timeRange = this.timeRanges[scenario.timeRange];
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (timeRange.days * 24 * 60 * 60 * 1000));

        const timePoints = this.generateTimePoints(startDate, endDate, timeRange.interval);
        const data = [];

        for (const timePoint of timePoints) {
            try {
                let dataPoint;

                switch (scenario.dataType) {
                    case 'soil_moisture':
                        dataPoint = await dataManager.fetchSMAPData('surface', {
                            latitude: scenario.location.latitude,
                            longitude: scenario.location.longitude,
                            date: timePoint.toISOString().split('T')[0]
                        });
                        break;

                    case 'vegetation_index':
                        dataPoint = await dataManager.fetchMODISData({
                            latitude: scenario.location.latitude,
                            longitude: scenario.location.longitude,
                            date: timePoint.toISOString().split('T')[0],
                            product: 'NDVI'
                        });
                        break;

                    default:
                        dataPoint = await this.generateSyntheticData(scenario.dataType, timePoint, scenario);
                }

                data.push({
                    timestamp: timePoint,
                    value: this.extractDataValue(dataPoint, scenario.dataType),
                    metadata: dataPoint.metadata || {},
                    source: dataPoint.source || 'synthetic'
                });

            } catch (error) {
                console.warn(`Failed to fetch data for ${timePoint}:`, error);
                data.push({
                    timestamp: timePoint,
                    value: null,
                    metadata: { error: error.message },
                    source: 'error'
                });
            }
        }

        return {
            scenario: scenario,
            data: data,
            startDate: startDate,
            endDate: endDate,
            location: scenario.location
        };
    }

    generateTimePoints(startDate, endDate, interval) {
        const points = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            points.push(new Date(current));

            switch (interval) {
                case 'daily':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'weekly':
                    current.setDate(current.getDate() + 7);
                    break;
                case 'monthly':
                    current.setMonth(current.getMonth() + 1);
                    break;
                case 'adaptive':
                    const days = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24 * 50)));
                    current.setDate(current.getDate() + days);
                    break;
            }
        }

        return points;
    }

    extractDataValue(dataPoint, dataType) {
        if (!dataPoint || typeof dataPoint !== 'object') {
            return null;
        }

        switch (dataType) {
            case 'soil_moisture':
                return dataPoint.surface_moisture || dataPoint.value || null;
            case 'vegetation_index':
                return dataPoint.ndvi || dataPoint.value || null;
            case 'precipitation':
                return dataPoint.precipitation || dataPoint.value || null;
            case 'land_surface_temperature':
                return dataPoint.temperature || dataPoint.value || null;
            default:
                return dataPoint.value || null;
        }
    }

    async generateSyntheticData(dataType, timePoint, scenario) {
        const dayOfYear = this.getDayOfYear(timePoint);
        const noise = (Math.random() - 0.5) * 0.1;

        let baseValue;

        switch (dataType) {
            case 'soil_moisture':
                baseValue = 0.3 + 0.2 * Math.sin(2 * Math.PI * dayOfYear / 365) + noise;
                if (scenario.id === 'drought_monitoring') {
                    const droughtEffect = Math.max(0, (dayOfYear - 180) / 365) * 0.3;
                    baseValue -= droughtEffect;
                }
                break;

            case 'vegetation_index':
                baseValue = 0.4 + 0.3 * Math.sin(2 * Math.PI * (dayOfYear - 100) / 365) + noise;
                baseValue = Math.max(0, Math.min(1, baseValue));
                break;

            case 'precipitation':
                baseValue = 2 + 3 * Math.sin(2 * Math.PI * dayOfYear / 365) + noise * 5;
                baseValue = Math.max(0, baseValue);
                break;

            default:
                baseValue = 0.5 + noise;
        }

        return {
            value: baseValue,
            timestamp: timePoint.toISOString(),
            source: 'synthetic',
            metadata: {
                synthetic: true,
                scenario: scenario.id
            }
        };
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    async performAnalysis(analysisType, timeseriesData, scenario) {
        const validData = timeseriesData.data.filter(point => point.value !== null);

        if (validData.length < 3) {
            throw new Error('Insufficient data points for analysis');
        }

        const values = validData.map(point => point.value);
        const timestamps = validData.map(point => point.timestamp);

        let result;

        switch (analysisType) {
            case 'trend':
                result = this.performTrendAnalysis(values, timestamps, scenario);
                break;
            case 'anomaly':
                result = this.performAnomalyDetection(values, timestamps, scenario);
                break;
            case 'seasonal':
                result = this.performSeasonalAnalysis(values, timestamps, scenario);
                break;
            case 'correlation':
                result = await this.performCorrelationAnalysis(timeseriesData, scenario);
                break;
            case 'forecast':
                result = this.performForecastAnalysis(values, timestamps, scenario);
                break;
            default:
                throw new Error(`Unknown analysis type: ${analysisType}`);
        }

        return {
            ...result,
            metadata: {
                analysisType: analysisType,
                scenario: scenario,
                dataPoints: validData.length,
                timeRange: {
                    start: timeseriesData.startDate,
                    end: timeseriesData.endDate
                }
            }
        };
    }

    performTrendAnalysis(values, timestamps, scenario) {
        const n = values.length;
        const x = values.map((_, i) => i);
        const y = values;

        // Linear regression
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R-squared
        const yMean = sumY / n;
        const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const residualSumSquares = y.reduce((sum, yi, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + Math.pow(yi - predicted, 2);
        }, 0);
        const rSquared = 1 - (residualSumSquares / totalSumSquares);

        // Determine trend direction and significance
        const trendDirection = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
        const trendMagnitude = Math.abs(slope);
        const isSignificant = rSquared > 0.3; // Simple threshold

        return {
            type: 'trend',
            slope: slope,
            intercept: intercept,
            rSquared: rSquared,
            direction: trendDirection,
            magnitude: trendMagnitude,
            significant: isSignificant,
            interpretation: this.interpretTrend(scenario, trendDirection, trendMagnitude, isSignificant),
            visualization: this.generateTrendVisualization(values, timestamps, slope, intercept)
        };
    }

    performAnomalyDetection(values, timestamps, scenario) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        const threshold = 2 * stdDev; // 2-sigma rule
        const anomalies = [];

        values.forEach((value, index) => {
            const deviation = Math.abs(value - mean);
            if (deviation > threshold) {
                anomalies.push({
                    index: index,
                    timestamp: timestamps[index],
                    value: value,
                    deviation: deviation,
                    severity: deviation > 3 * stdDev ? 'high' : 'moderate'
                });
            }
        });

        return {
            type: 'anomaly',
            mean: mean,
            standardDeviation: stdDev,
            threshold: threshold,
            anomalies: anomalies,
            anomalyCount: anomalies.length,
            anomalyRate: anomalies.length / values.length,
            interpretation: this.interpretAnomalies(scenario, anomalies, values.length),
            visualization: this.generateAnomalyVisualization(values, timestamps, anomalies, mean, threshold)
        };
    }

    performSeasonalAnalysis(values, timestamps, scenario) {
        // Simple seasonal decomposition
        const period = this.estimateSeasonalPeriod(timestamps);
        const seasonalComponents = this.extractSeasonalComponent(values, period);
        const trendComponents = this.extractTrendComponent(values, period);
        const residuals = values.map((val, i) => val - seasonalComponents[i] - trendComponents[i]);

        // Calculate seasonal strength
        const seasonalVariance = this.calculateVariance(seasonalComponents);
        const residualVariance = this.calculateVariance(residuals);
        const seasonalStrength = seasonalVariance / (seasonalVariance + residualVariance);

        return {
            type: 'seasonal',
            period: period,
            seasonalStrength: seasonalStrength,
            components: {
                seasonal: seasonalComponents,
                trend: trendComponents,
                residual: residuals
            },
            interpretation: this.interpretSeasonal(scenario, period, seasonalStrength),
            visualization: this.generateSeasonalVisualization(values, timestamps, seasonalComponents, trendComponents)
        };
    }

    async performCorrelationAnalysis(timeseriesData, scenario) {
        // For demonstration, we'll correlate with a synthetic secondary dataset
        const primaryData = timeseriesData.data.filter(point => point.value !== null);
        const secondaryData = await this.generateCorrelationData(primaryData, scenario);

        const correlation = this.calculatePearsonCorrelation(
            primaryData.map(p => p.value),
            secondaryData.map(p => p.value)
        );

        const lagCorrelations = this.calculateLagCorrelations(
            primaryData.map(p => p.value),
            secondaryData.map(p => p.value),
            14 // Max lag of 14 periods
        );

        const bestLag = lagCorrelations.reduce((best, current, index) =>
            Math.abs(current) > Math.abs(lagCorrelations[best]) ? index : best, 0);

        return {
            type: 'correlation',
            primaryData: primaryData.map(p => ({ timestamp: p.timestamp, value: p.value })),
            secondaryData: secondaryData,
            correlation: correlation,
            lagCorrelations: lagCorrelations,
            bestLag: bestLag,
            bestLagCorrelation: lagCorrelations[bestLag],
            interpretation: this.interpretCorrelation(scenario, correlation, bestLag, lagCorrelations[bestLag]),
            visualization: this.generateCorrelationVisualization(primaryData, secondaryData, lagCorrelations)
        };
    }

    performForecastAnalysis(values, timestamps, scenario) {
        // Simple exponential smoothing forecast
        const alpha = 0.3; // Smoothing parameter
        const forecastHorizon = 14; // 14 periods ahead

        let smoothed = [values[0]];
        for (let i = 1; i < values.length; i++) {
            smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
        }

        const lastSmoothed = smoothed[smoothed.length - 1];
        const forecast = new Array(forecastHorizon).fill(lastSmoothed);

        // Simple trend adjustment
        const recentTrend = (values[values.length - 1] - values[Math.max(0, values.length - 5)]) / 5;
        forecast.forEach((_, i) => {
            forecast[i] += recentTrend * (i + 1);
        });

        // Generate forecast timestamps
        const lastTimestamp = new Date(timestamps[timestamps.length - 1]);
        const forecastTimestamps = [];
        for (let i = 1; i <= forecastHorizon; i++) {
            const forecastDate = new Date(lastTimestamp);
            forecastDate.setDate(forecastDate.getDate() + i);
            forecastTimestamps.push(forecastDate);
        }

        return {
            type: 'forecast',
            historical: values,
            forecast: forecast,
            forecastTimestamps: forecastTimestamps,
            smoothingParameter: alpha,
            horizon: forecastHorizon,
            interpretation: this.interpretForecast(scenario, forecast, recentTrend),
            visualization: this.generateForecastVisualization(values, timestamps, forecast, forecastTimestamps)
        };
    }

    // Analysis interpretation methods
    interpretTrend(scenario, direction, magnitude, significant) {
        const dataType = scenario.dataType;
        let interpretation = `The analysis shows a ${direction} trend in ${dataType}. `;

        if (significant) {
            interpretation += `This trend is statistically significant (R² > 0.3), indicating a clear pattern. `;
        } else {
            interpretation += `This trend is not statistically significant, suggesting high variability. `;
        }

        // Scenario-specific interpretations
        if (scenario.id === 'drought_monitoring' && direction === 'decreasing') {
            interpretation += `This declining soil moisture trend aligns with drought development patterns. `;
            interpretation += `Consider implementing water conservation measures and drought-resistant crops.`;
        } else if (scenario.id === 'crop_phenology' && direction === 'increasing') {
            interpretation += `This increasing NDVI trend indicates healthy crop development during the growing season.`;
        }

        return interpretation;
    }

    interpretAnomalies(scenario, anomalies, totalPoints) {
        const anomalyRate = (anomalies.length / totalPoints * 100).toFixed(1);
        let interpretation = `Detected ${anomalies.length} anomalies out of ${totalPoints} data points (${anomalyRate}%). `;

        if (anomalies.length === 0) {
            interpretation += `No significant anomalies detected, indicating stable conditions.`;
        } else if (anomalyRate > 10) {
            interpretation += `High anomaly rate suggests significant variability or changing conditions.`;
        } else {
            interpretation += `Moderate anomaly rate is typical for natural agricultural systems.`;
        }

        const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
        if (highSeverityCount > 0) {
            interpretation += ` ${highSeverityCount} high-severity anomalies require immediate attention.`;
        }

        return interpretation;
    }

    interpretSeasonal(scenario, period, strength) {
        let interpretation = `Seasonal analysis reveals a dominant period of ${period} time units. `;

        if (strength > 0.7) {
            interpretation += `Strong seasonal pattern (strength: ${(strength * 100).toFixed(1)}%) dominates the data. `;
        } else if (strength > 0.3) {
            interpretation += `Moderate seasonal pattern (strength: ${(strength * 100).toFixed(1)}%) is present. `;
        } else {
            interpretation += `Weak seasonal pattern (strength: ${(strength * 100).toFixed(1)}%) suggests other factors dominate. `;
        }

        if (scenario.id === 'crop_phenology') {
            interpretation += `This seasonal cycle reflects the natural crop growth pattern from planting through harvest.`;
        }

        return interpretation;
    }

    interpretCorrelation(scenario, correlation, bestLag, bestLagCorrelation) {
        const corrStrength = Math.abs(correlation);
        let interpretation = `Correlation analysis shows ${correlation > 0 ? 'positive' : 'negative'} relationship (r=${correlation.toFixed(3)}). `;

        if (corrStrength > 0.7) {
            interpretation += `Strong correlation indicates a robust relationship between variables. `;
        } else if (corrStrength > 0.3) {
            interpretation += `Moderate correlation suggests some relationship exists. `;
        } else {
            interpretation += `Weak correlation indicates limited direct relationship. `;
        }

        if (bestLag > 0) {
            interpretation += `Best correlation occurs with ${bestLag}-period lag (r=${bestLagCorrelation.toFixed(3)}), `;
            interpretation += `suggesting delayed response between variables.`;
        }

        return interpretation;
    }

    interpretForecast(scenario, forecast, trend) {
        const avgForecast = forecast.reduce((sum, val) => sum + val, 0) / forecast.length;
        let interpretation = `Forecast predicts average value of ${avgForecast.toFixed(3)} over the next ${forecast.length} periods. `;

        if (Math.abs(trend) > 0.01) {
            interpretation += `${trend > 0 ? 'Upward' : 'Downward'} trend of ${Math.abs(trend).toFixed(4)} per period is expected to continue. `;
        } else {
            interpretation += `Stable conditions are expected with minimal trend. `;
        }

        interpretation += `This forecast is based on exponential smoothing and should be updated as new data becomes available.`;

        return interpretation;
    }

    // Utility methods for calculations
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }

    calculatePearsonCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    calculateLagCorrelations(x, y, maxLag) {
        const correlations = [];

        for (let lag = 0; lag <= maxLag; lag++) {
            if (lag >= x.length) break;

            const xLagged = x.slice(0, x.length - lag);
            const yLagged = y.slice(lag);

            if (xLagged.length < 3) break;

            correlations.push(this.calculatePearsonCorrelation(xLagged, yLagged));
        }

        return correlations;
    }

    estimateSeasonalPeriod(timestamps) {
        // Simple heuristic based on data span
        const span = timestamps.length;
        if (span > 300) return Math.floor(span / 12); // Monthly for yearly data
        if (span > 50) return Math.floor(span / 4);   // Quarterly for multi-month data
        return Math.floor(span / 7);                  // Weekly for shorter periods
    }

    extractSeasonalComponent(values, period) {
        const seasonal = new Array(values.length).fill(0);

        for (let i = 0; i < values.length; i++) {
            const seasonIndex = i % period;
            const seasonValues = [];

            for (let j = seasonIndex; j < values.length; j += period) {
                seasonValues.push(values[j]);
            }

            seasonal[i] = seasonValues.reduce((sum, val) => sum + val, 0) / seasonValues.length;
        }

        return seasonal;
    }

    extractTrendComponent(values, period) {
        const trend = [];
        const windowSize = Math.max(3, Math.floor(period / 2));

        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(values.length, i + Math.floor(windowSize / 2) + 1);
            const window = values.slice(start, end);
            const trendValue = window.reduce((sum, val) => sum + val, 0) / window.length;
            trend.push(trendValue);
        }

        return trend;
    }

    async generateCorrelationData(primaryData, scenario) {
        // Generate synthetic secondary data with some correlation to primary
        const correlationFactor = 0.7; // Moderate positive correlation

        return primaryData.map(point => {
            const correlated = correlationFactor * point.value + (1 - correlationFactor) * Math.random();
            return {
                timestamp: point.timestamp,
                value: correlated,
                source: 'synthetic_secondary'
            };
        });
    }

    // Visualization generation methods
    generateTrendVisualization(values, timestamps, slope, intercept) {
        const trendLine = values.map((_, i) => slope * i + intercept);

        return {
            type: 'line_chart',
            data: {
                timestamps: timestamps,
                actual: values,
                trend: trendLine
            },
            config: {
                title: 'Trend Analysis',
                xLabel: 'Time',
                yLabel: 'Value',
                showTrendLine: true
            }
        };
    }

    generateAnomalyVisualization(values, timestamps, anomalies, mean, threshold) {
        return {
            type: 'anomaly_chart',
            data: {
                timestamps: timestamps,
                values: values,
                anomalies: anomalies,
                mean: mean,
                upperThreshold: mean + threshold,
                lowerThreshold: mean - threshold
            },
            config: {
                title: 'Anomaly Detection',
                xLabel: 'Time',
                yLabel: 'Value',
                highlightAnomalies: true
            }
        };
    }

    generateSeasonalVisualization(values, timestamps, seasonal, trend) {
        return {
            type: 'decomposition_chart',
            data: {
                timestamps: timestamps,
                original: values,
                seasonal: seasonal,
                trend: trend
            },
            config: {
                title: 'Seasonal Decomposition',
                xLabel: 'Time',
                yLabel: 'Value',
                subplots: ['original', 'trend', 'seasonal']
            }
        };
    }

    generateCorrelationVisualization(primaryData, secondaryData, lagCorrelations) {
        return {
            type: 'correlation_chart',
            data: {
                primary: primaryData,
                secondary: secondaryData,
                lagCorrelations: lagCorrelations
            },
            config: {
                title: 'Cross-Correlation Analysis',
                xLabel: 'Time / Lag',
                yLabel: 'Value / Correlation',
                showScatter: true
            }
        };
    }

    generateForecastVisualization(historical, timestamps, forecast, forecastTimestamps) {
        return {
            type: 'forecast_chart',
            data: {
                historical: {
                    timestamps: timestamps,
                    values: historical
                },
                forecast: {
                    timestamps: forecastTimestamps,
                    values: forecast
                }
            },
            config: {
                title: 'Predictive Forecast',
                xLabel: 'Time',
                yLabel: 'Value',
                showConfidenceBands: true
            }
        };
    }

    displayAnalysisResults(container, results, scenario) {
        container.innerHTML = `
            <div class="analysis-results-container">
                <div class="results-header">
                    <h3>Analysis Results: ${scenario.title}</h3>
                    <div class="analysis-meta">
                        <span class="meta-item">Type: ${results.type.toUpperCase()}</span>
                        <span class="meta-item">Data Points: ${results.metadata.dataPoints}</span>
                        <span class="meta-item">Location: ${scenario.location.name}</span>
                    </div>
                </div>

                <div class="results-content">
                    <div class="interpretation-panel">
                        <h4>🎓 Educational Interpretation</h4>
                        <p class="interpretation-text">${results.interpretation}</p>
                    </div>

                    <div class="metrics-panel">
                        <h4>Key Metrics</h4>
                        <div class="metrics-grid">
                            ${this.generateMetricsHTML(results)}
                        </div>
                    </div>

                    <div class="visualization-panel">
                        <h4>Visualization</h4>
                        <div class="chart-container" id="analysis-chart">
                            ${this.renderVisualizationPlaceholder(results.visualization)}
                        </div>
                    </div>

                    <div class="educational-panel">
                        <h4>Learning Objectives Achieved</h4>
                        <ul class="learning-objectives">
                            ${this.generateLearningObjectives(scenario, results)}
                        </ul>
                    </div>
                </div>

                <div class="results-actions">
                    <button class="action-btn" onclick="temporalAnalysis.exportResults('${scenario.id}')">
                        📄 Export Report
                    </button>
                    <button class="action-btn" onclick="temporalAnalysis.runAnotherAnalysis()">
                        Run Another Analysis
                    </button>
                    <button class="action-btn" onclick="temporalAnalysis.showDetailedBreakdown('${scenario.id}')">
                        Detailed Breakdown
                    </button>
                </div>
            </div>
        `;
    }

    generateMetricsHTML(results) {
        let metricsHTML = '';

        switch (results.type) {
            case 'trend':
                metricsHTML = `
                    <div class="metric-card">
                        <div class="metric-label">Trend Direction</div>
                        <div class="metric-value ${results.direction}">${results.direction.toUpperCase()}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">R² Value</div>
                        <div class="metric-value">${results.rSquared.toFixed(3)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Slope</div>
                        <div class="metric-value">${results.slope.toFixed(6)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Significance</div>
                        <div class="metric-value ${results.significant ? 'significant' : 'not-significant'}">
                            ${results.significant ? 'SIGNIFICANT' : 'NOT SIGNIFICANT'}
                        </div>
                    </div>
                `;
                break;

            case 'anomaly':
                metricsHTML = `
                    <div class="metric-card">
                        <div class="metric-label">Anomalies Found</div>
                        <div class="metric-value">${results.anomalyCount}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Anomaly Rate</div>
                        <div class="metric-value">${(results.anomalyRate * 100).toFixed(1)}%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Detection Threshold</div>
                        <div class="metric-value">${results.threshold.toFixed(3)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Standard Deviation</div>
                        <div class="metric-value">${results.standardDeviation.toFixed(3)}</div>
                    </div>
                `;
                break;

            case 'seasonal':
                metricsHTML = `
                    <div class="metric-card">
                        <div class="metric-label">Seasonal Period</div>
                        <div class="metric-value">${results.period} periods</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Seasonal Strength</div>
                        <div class="metric-value">${(results.seasonalStrength * 100).toFixed(1)}%</div>
                    </div>
                `;
                break;

            case 'correlation':
                metricsHTML = `
                    <div class="metric-card">
                        <div class="metric-label">Correlation (r)</div>
                        <div class="metric-value">${results.correlation.toFixed(3)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Best Lag</div>
                        <div class="metric-value">${results.bestLag} periods</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Best Lag Correlation</div>
                        <div class="metric-value">${results.bestLagCorrelation.toFixed(3)}</div>
                    </div>
                `;
                break;

            case 'forecast':
                const avgForecast = results.forecast.reduce((sum, val) => sum + val, 0) / results.forecast.length;
                metricsHTML = `
                    <div class="metric-card">
                        <div class="metric-label">Forecast Horizon</div>
                        <div class="metric-value">${results.horizon} periods</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Average Forecast</div>
                        <div class="metric-value">${avgForecast.toFixed(3)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Smoothing Parameter</div>
                        <div class="metric-value">${results.smoothingParameter}</div>
                    </div>
                `;
                break;
        }

        return metricsHTML;
    }

    renderVisualizationPlaceholder(visualization) {
        return `
            <div class="chart-placeholder">
                <div class="chart-info">
                    <h5>${visualization.config.title}</h5>
                    <p>Chart Type: ${visualization.type.replace('_', ' ').toUpperCase()}</p>
                    <p>Interactive visualization would render here in full implementation</p>
                </div>
                <div class="chart-preview">
                    <svg width="400" height="200" viewBox="0 0 400 200">
                        <rect width="400" height="200" fill="#f8f9fa" stroke="#dee2e6"/>
                        <text x="200" y="100" text-anchor="middle" fill="#6c757d">
                            ${visualization.config.title} Visualization
                        </text>
                    </svg>
                </div>
            </div>
        `;
    }

    generateLearningObjectives(scenario, results) {
        const objectives = [];

        // Base objectives for all scenarios
        objectives.push(`Successfully analyzed ${results.metadata.dataPoints} data points using ${results.type} analysis`);
        objectives.push(`Interpreted satellite data temporal patterns for ${scenario.location.name}`);

        // Scenario-specific objectives
        switch (scenario.id) {
            case 'drought_monitoring':
                objectives.push('Learned to identify drought onset through soil moisture trends');
                objectives.push('Understood SMAP data temporal resolution and monitoring capabilities');
                break;

            case 'crop_phenology':
                objectives.push('Analyzed seasonal vegetation cycles using MODIS NDVI');
                objectives.push('Connected satellite observations to crop growth stages');
                break;

            case 'irrigation_impact':
                objectives.push('Detected irrigation events in soil moisture time series');
                objectives.push('Evaluated irrigation effectiveness using anomaly detection');
                break;

            case 'climate_correlation':
                objectives.push('Explored relationships between multiple environmental variables');
                objectives.push('Analyzed time-lagged correlations in agricultural systems');
                break;
        }

        return objectives.map(obj => `<li>${obj}</li>`).join('');
    }

    displayAnalysisError(container, error, scenario) {
        container.innerHTML = `
            <div class="analysis-error">
                <div class="error-icon">⚠️</div>
                <h3>Analysis Error</h3>
                <p>Failed to complete analysis for "${scenario.title}"</p>
                <div class="error-details">
                    <strong>Error:</strong> ${error.message}
                </div>
                <div class="error-actions">
                    <button class="action-btn" onclick="temporalAnalysis.retryAnalysis('${scenario.id}')">
                        Retry Analysis
                    </button>
                    <button class="action-btn" onclick="temporalAnalysis.reportIssue('${scenario.id}', '${error.message}')">
                        📞 Report Issue
                    </button>
                </div>
            </div>
        `;
    }

    async runCustomAnalysis() {
        console.log('Running custom temporal analysis...');
        // Implementation would collect form data and run custom analysis
    }

    async compareMultipleSources() {
        console.log('Comparing multiple satellite sources...');
        // Implementation would handle multi-source comparison
    }

    async generateForecast() {
        console.log('Generating forecast...');
        // Implementation would handle forecast generation
    }

    exportResults(scenarioId) {
        const results = this.analysisResults.get(scenarioId);
        if (results) {
            console.log('Exporting analysis results:', results);
            // Implementation would generate and download report
        }
    }

    runAnotherAnalysis() {
        // Reset interface for new analysis
        const resultsContainer = document.getElementById('analysis-results');
        resultsContainer.innerHTML = '';
        console.log('Ready for another analysis');
    }

    showDetailedBreakdown(scenarioId) {
        console.log('Showing detailed breakdown for:', scenarioId);
        // Implementation would show detailed analysis breakdown
    }

    retryAnalysis(scenarioId) {
        this.runScenario(scenarioId);
    }

    reportIssue(scenarioId, errorMessage) {
        console.log('Reporting issue for scenario:', scenarioId, 'Error:', errorMessage);
        // Implementation would handle issue reporting
    }

    handleAnalysisRequest(data) {
        console.log('Handling analysis request:', data);
    }

    handleTimeseriesUpdate(data) {
        console.log('Handling timeseries update:', data);
    }

    handleScenarioSelection(data) {
        console.log('Handling scenario selection:', data);
    }

    /**
     * ML-powered soil moisture forecasting
     */
    async predictSoilMoisture(locationData, historicalData) {
        try {
            const inputData = {
                historicalData,
                weather: await this.getWeatherForecast(locationData),
                location: locationData
            };

            const prediction = await this.mlService.predictSoilMoisture(inputData);

            // Store result for display
            this.analysisResults.set('soil_moisture_prediction', {
                type: 'ml_prediction',
                method: 'soil_moisture_forecast',
                result: prediction,
                timestamp: new Date().toISOString(),
                location: locationData
            });

            return prediction;
        } catch (error) {
            console.error('Soil moisture prediction failed:', error);
            throw error;
        }
    }

    /**
     * ML-powered crop yield prediction
     */
    async predictCropYield(cropType, locationData, satelliteData) {
        try {
            const prediction = await this.mlService.predictCropYield(cropType, locationData, satelliteData);

            this.analysisResults.set('crop_yield_prediction', {
                type: 'ml_prediction',
                method: 'crop_yield_prediction',
                result: prediction,
                timestamp: new Date().toISOString(),
                cropType,
                location: locationData
            });

            return prediction;
        } catch (error) {
            console.error('Crop yield prediction failed:', error);
            throw error;
        }
    }

    /**
     * ML-powered anomaly detection
     */
    async detectAnomalies(timeSeriesData, contextData = {}) {
        try {
            const anomalies = await this.mlService.detectAnomalies(timeSeriesData, contextData);

            this.analysisResults.set('anomaly_detection', {
                type: 'ml_prediction',
                method: 'anomaly_detection',
                result: anomalies,
                timestamp: new Date().toISOString(),
                dataPoints: timeSeriesData.length
            });

            return anomalies;
        } catch (error) {
            console.error('Anomaly detection failed:', error);
            throw error;
        }
    }

    /**
     * ML-powered irrigation optimization
     */
    async optimizeIrrigation(fieldData, cropInfo) {
        try {
            const weatherForecast = await this.getWeatherForecast(fieldData.location);
            const recommendation = await this.mlService.optimizeIrrigation(fieldData, weatherForecast, cropInfo);

            this.analysisResults.set('irrigation_optimization', {
                type: 'ml_prediction',
                method: 'irrigation_optimization',
                result: recommendation,
                timestamp: new Date().toISOString(),
                fieldData,
                cropInfo
            });

            return recommendation;
        } catch (error) {
            console.error('Irrigation optimization failed:', error);
            throw error;
        }
    }

    /**
     * Get weather forecast data (mock implementation)
     */
    async getWeatherForecast(location) {
        // Mock weather forecast - in production, this would call a weather API
        const forecast = [];
        for (let i = 1; i <= 14; i++) {
            forecast.push({
                day: i,
                temperature: 20 + Math.random() * 15, // 20-35°C
                precipitation: Math.random() * 20,     // 0-20mm
                humidity: 40 + Math.random() * 40      // 40-80%
            });
        }
        return forecast;
    }

    /**
     * Get ML prediction results
     */
    getMLPredictionResults() {
        const mlResults = new Map();

        for (const [key, value] of this.analysisResults.entries()) {
            if (value.type === 'ml_prediction') {
                mlResults.set(key, value);
            }
        }

        return mlResults;
    }

    /**
     * Get ML service information
     */
    getMLServiceInfo() {
        return {
            models: this.mlService.getModelInfo(),
            cache: this.mlService.getCacheStats(),
            serviceStatus: 'active'
        };
    }
}

if (typeof window !== 'undefined') {
    window.TemporalAnalysisTools = TemporalAnalysisTools;
}

export { TemporalAnalysisTools };