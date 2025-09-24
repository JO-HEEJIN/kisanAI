/**
 * Climate Risk Assessment UI for NASA Farm Navigators
 * Interactive dashboard for visualizing climate risks and adaptation strategies
 */

class ClimateRiskUI {
    constructor() {
        this.climateRiskAssessment = new ClimateRiskAssessment();
        this.currentAssessment = null;
        this.charts = {};
    }

    /**
     * Render the climate risk assessment interface
     */
    async renderInterface(container) {
        container.innerHTML = `
            <div class="climate-risk-dashboard">
                <div class="dashboard-header">
                    <h2>🌍 Climate Risk Assessment</h2>
                    <p class="subtitle">Comprehensive climate analysis using NASA data & IPCC scenarios</p>
                </div>

                <div class="risk-input-section">
                    <div class="input-grid">
                        <div class="input-group">
                            <label for="farmLatitude">Latitude:</label>
                            <input type="number" id="farmLatitude" value="37.5665" step="0.001" min="-90" max="90">
                        </div>
                        <div class="input-group">
                            <label for="farmLongitude">Longitude:</label>
                            <input type="number" id="farmLongitude" value="126.978" step="0.001" min="-180" max="180">
                        </div>
                        <div class="input-group">
                            <label for="cropType">Primary Crop:</label>
                            <select id="cropType">
                                <option value="wheat">Wheat</option>
                                <option value="corn">Corn</option>
                                <option value="rice" selected>Rice</option>
                                <option value="soybean">Soybean</option>
                                <option value="potato">Potato</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="farmSize">Farm Size (hectares):</label>
                            <input type="number" id="farmSize" value="100" min="1" max="10000">
                        </div>
                    </div>
                    <button id="analyzeClimateRisk" class="analyze-btn">🔍 Analyze Climate Risk</button>
                </div>

                <div id="resultsContainer" class="results-container" style="display: none;">
                    <div class="assessment-overview">
                        <div class="risk-summary-cards">
                            <div class="risk-card current-risk">
                                <h3>Current Risk Level</h3>
                                <div class="risk-score" id="currentRiskScore">--</div>
                                <div class="risk-label" id="currentRiskLabel">Analyzing...</div>
                            </div>
                            <div class="risk-card future-risk">
                                <h3>2050 Projection</h3>
                                <div class="risk-score" id="futureRiskScore">--</div>
                                <div class="risk-label" id="futureRiskLabel">Analyzing...</div>
                            </div>
                            <div class="risk-card adaptation-needed">
                                <h3>Adaptation Priority</h3>
                                <div class="risk-score" id="adaptationScore">--</div>
                                <div class="risk-label" id="adaptationLabel">Analyzing...</div>
                            </div>
                        </div>
                    </div>

                    <div class="ipcc-scenarios-section">
                        <h3>IPCC Climate Scenarios Analysis</h3>
                        <div class="scenarios-grid" id="scenariosGrid">
                            <!-- Dynamic scenario cards will be inserted here -->
                        </div>
                    </div>

                    <div class="risk-breakdown-section">
                        <h3>Risk Factor Analysis</h3>
                        <div class="risk-charts">
                            <div class="chart-container">
                                <canvas id="riskBreakdownChart"></canvas>
                            </div>
                            <div class="chart-container">
                                <canvas id="timelineChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="yield-impact-section">
                        <h3>Projected Yield Impact</h3>
                        <div class="yield-visualization">
                            <canvas id="yieldImpactChart"></canvas>
                        </div>
                    </div>

                    <div class="recommendations-section">
                        <h3>Adaptation Recommendations</h3>
                        <div class="recommendations-tabs">
                            <button class="tab-btn active" data-tab="immediate">Immediate Actions</button>
                            <button class="tab-btn" data-tab="short-term">Short-term (1-3 years)</button>
                            <button class="tab-btn" data-tab="long-term">Long-term (3+ years)</button>
                            <button class="tab-btn" data-tab="financial">Financial Planning</button>
                        </div>
                        <div class="recommendations-content">
                            <div class="tab-content active" id="immediate-tab">
                                <!-- Immediate recommendations -->
                            </div>
                            <div class="tab-content" id="short-term-tab">
                                <!-- Short-term recommendations -->
                            </div>
                            <div class="tab-content" id="long-term-tab">
                                <!-- Long-term recommendations -->
                            </div>
                            <div class="tab-content" id="financial-tab">
                                <!-- Financial recommendations -->
                            </div>
                        </div>
                    </div>

                    <div class="data-sources-section">
                        <h3>Data Sources & Methodology</h3>
                        <div class="data-sources">
                            <div class="source-card">
                                <div class="source-icon">🛰️</div>
                                <div class="source-info">
                                    <h4>NASA POWER</h4>
                                    <p>Historical weather and climate data</p>
                                </div>
                            </div>
                            <div class="source-card">
                                <div class="source-icon">🌡️</div>
                                <div class="source-info">
                                    <h4>IPCC AR6</h4>
                                    <p>Climate projection scenarios</p>
                                </div>
                            </div>
                            <div class="source-card">
                                <div class="source-icon">📊</div>
                                <div class="source-info">
                                    <h4>Agricultural Models</h4>
                                    <p>Crop-specific impact assessments</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="export-section">
                        <button id="exportReport" class="export-btn">📄 Export Risk Assessment Report</button>
                        <button id="shareAssessment" class="share-btn">🔗 Share Assessment</button>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Attach event listeners for user interactions
     */
    attachEventListeners() {
        const analyzeBtn = document.getElementById('analyzeClimateRisk');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.performClimateAnalysis());
        }

        const exportBtn = document.getElementById('exportReport');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }

        const shareBtn = document.getElementById('shareAssessment');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareAssessment());
        }

        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    /**
     * Perform climate risk analysis
     */
    async performClimateAnalysis() {
        try {
            // Get input values
            const farmData = {
                lat: parseFloat(document.getElementById('farmLatitude').value),
                lon: parseFloat(document.getElementById('farmLongitude').value),
                cropType: document.getElementById('cropType').value,
                farmSize: parseInt(document.getElementById('farmSize').value)
            };

            // Show loading state
            this.showLoadingState();

            // Perform analysis
            this.currentAssessment = await this.climateRiskAssessment.analyzeClimateRisk(farmData);

            // Display results
            await this.displayResults(this.currentAssessment);

            // Show results container
            document.getElementById('resultsContainer').style.display = 'block';
            document.getElementById('resultsContainer').scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Climate analysis failed:', error);
            this.showError('Failed to analyze climate risk. Please try again.');
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const analyzeBtn = document.getElementById('analyzeClimateRisk');
        analyzeBtn.textContent = '🔄 Analyzing...';
        analyzeBtn.disabled = true;

        // Reset risk scores
        document.getElementById('currentRiskScore').textContent = '...';
        document.getElementById('currentRiskLabel').textContent = 'Analyzing...';
        document.getElementById('futureRiskScore').textContent = '...';
        document.getElementById('futureRiskLabel').textContent = 'Analyzing...';
        document.getElementById('adaptationScore').textContent = '...';
        document.getElementById('adaptationLabel').textContent = 'Analyzing...';
    }

    /**
     * Display analysis results
     */
    async displayResults(assessment) {
        // Update overview cards
        this.updateRiskOverview(assessment);

        // Display IPCC scenarios
        this.displayIPCCScenarios(assessment.riskProjections);

        // Create charts
        await this.createCharts(assessment);

        // Display recommendations
        this.displayRecommendations(assessment.recommendations);

        // Reset analyze button
        const analyzeBtn = document.getElementById('analyzeClimateRisk');
        analyzeBtn.textContent = '🔍 Analyze Climate Risk';
        analyzeBtn.disabled = false;
    }

    /**
     * Update risk overview cards
     */
    updateRiskOverview(assessment) {
        // Current risk (baseline)
        const currentRisk = assessment.baseline.extremeEventRisk || 40;
        document.getElementById('currentRiskScore').textContent = currentRisk;
        document.getElementById('currentRiskLabel').textContent = this.getRiskLabel(currentRisk);

        // Future risk (SSP245 scenario)
        const futureRisk = assessment.riskProjections.SSP245?.risks.overallScore || 65;
        document.getElementById('futureRiskScore').textContent = futureRisk;
        document.getElementById('futureRiskLabel').textContent = this.getRiskLabel(futureRisk);

        // Adaptation need
        const adaptationNeed = futureRisk - currentRisk;
        document.getElementById('adaptationScore').textContent = `+${adaptationNeed}`;
        document.getElementById('adaptationLabel').textContent =
            adaptationNeed > 30 ? 'Critical' : adaptationNeed > 15 ? 'High' : 'Moderate';

        // Apply color classes
        this.applyRiskColors();
    }

    /**
     * Display IPCC scenarios
     */
    displayIPCCScenarios(riskProjections) {
        const scenariosGrid = document.getElementById('scenariosGrid');
        scenariosGrid.innerHTML = '';

        Object.entries(riskProjections).forEach(([scenario, data]) => {
            const scenarioCard = document.createElement('div');
            scenarioCard.className = 'scenario-card';
            scenarioCard.innerHTML = `
                <div class="scenario-header">
                    <h4>${data.name}</h4>
                    <div class="warming-badge">+${data.warming}°C</div>
                </div>
                <div class="scenario-content">
                    <div class="risk-score large">${data.risks.overallScore}</div>
                    <div class="risk-level ${data.risks.riskLevel.toLowerCase().replace(' ', '-')}">${data.risks.riskLevel}</div>
                    <div class="yield-impact">
                        <span class="impact-label">Yield Impact:</span>
                        <span class="impact-value ${data.yieldImpact.percentChange < 0 ? 'negative' : 'positive'}">
                            ${data.yieldImpact.percentChange > 0 ? '+' : ''}${data.yieldImpact.percentChange}%
                        </span>
                    </div>
                    <div class="scenario-description">${data.description}</div>
                </div>
            `;
            scenariosGrid.appendChild(scenarioCard);
        });
    }

    /**
     * Create visualization charts
     */
    async createCharts(assessment) {
        await this.createRiskBreakdownChart(assessment.riskProjections.SSP245.risks);
        await this.createTimelineChart(assessment.riskProjections);
        await this.createYieldImpactChart(assessment.riskProjections);
    }

    /**
     * Create risk breakdown chart
     */
    async createRiskBreakdownChart(risks) {
        const ctx = document.getElementById('riskBreakdownChart').getContext('2d');

        const riskFactors = {
            'Drought': risks.drought.score,
            'Heat Stress': risks.heatStress.score,
            'Water Scarcity': risks.waterScarcity.score,
            'Pest Pressure': risks.pestPressure.score,
            'Extreme Weather': risks.extremeWeather.score
        };

        this.charts.riskBreakdown = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: Object.keys(riskFactors),
                datasets: [{
                    label: 'Risk Score',
                    data: Object.values(riskFactors),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Climate Risk Breakdown'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    /**
     * Create timeline chart
     */
    async createTimelineChart(riskProjections) {
        const ctx = document.getElementById('timelineChart').getContext('2d');

        const scenarios = Object.entries(riskProjections).map(([key, data]) => ({
            x: data.warming,
            y: data.risks.overallScore,
            label: data.name
        }));

        this.charts.timeline = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Risk vs Warming',
                    data: scenarios,
                    backgroundColor: scenarios.map(s =>
                        s.y > 70 ? 'rgba(220, 53, 69, 0.8)' :
                        s.y > 40 ? 'rgba(255, 193, 7, 0.8)' :
                        'rgba(40, 167, 69, 0.8)'
                    ),
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Risk Projection Timeline'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const point = scenarios[context.dataIndex];
                                return `${point.label}: ${point.y}% risk at +${point.x}°C`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Global Warming (°C)'
                        },
                        min: 1,
                        max: 5
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Risk Score'
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    /**
     * Create yield impact chart
     */
    async createYieldImpactChart(riskProjections) {
        const ctx = document.getElementById('yieldImpactChart').getContext('2d');

        const yieldData = Object.entries(riskProjections).map(([key, data]) => ({
            scenario: data.name,
            impact: data.yieldImpact.percentChange,
            warming: data.warming
        }));

        this.charts.yieldImpact = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: yieldData.map(d => d.scenario),
                datasets: [{
                    label: 'Yield Impact (%)',
                    data: yieldData.map(d => d.impact),
                    backgroundColor: yieldData.map(d =>
                        d.impact < -15 ? 'rgba(220, 53, 69, 0.8)' :
                        d.impact < -8 ? 'rgba(255, 193, 7, 0.8)' :
                        d.impact < 0 ? 'rgba(255, 152, 0, 0.8)' :
                        'rgba(40, 167, 69, 0.8)'
                    ),
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Projected Yield Impact by Scenario'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Yield Change (%)'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Display recommendations in tabs
     */
    displayRecommendations(recommendations) {
        this.displayRecommendationTab('immediate', recommendations.immediate);
        this.displayRecommendationTab('short-term', recommendations.shortTerm);
        this.displayRecommendationTab('long-term', recommendations.longTerm);
        this.displayRecommendationTab('financial', recommendations.financial);
    }

    /**
     * Display recommendations for a specific tab
     */
    displayRecommendationTab(tabId, recommendationsList) {
        const tabContent = document.getElementById(`${tabId}-tab`);
        if (!tabContent || !recommendationsList) return;

        tabContent.innerHTML = recommendationsList.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <h4>${rec.action || rec.type}</h4>
                    ${rec.priority ? `<span class="priority-badge ${rec.priority.toLowerCase()}">${rec.priority}</span>` : ''}
                </div>
                <p class="recommendation-description">${rec.description}</p>
                ${rec.timeline ? `<div class="timeline">Timeline: ${rec.timeline}</div>` : ''}
                ${rec.cost ? `<div class="cost">Cost: ${rec.cost}</div>` : ''}
            </div>
        `).join('');
    }

    /**
     * Switch between recommendation tabs
     */
    switchTab(tabId) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }

    /**
     * Get risk label based on score
     */
    getRiskLabel(score) {
        if (score >= 80) return 'Critical';
        if (score >= 60) return 'High';
        if (score >= 40) return 'Moderate';
        if (score >= 20) return 'Low';
        return 'Very Low';
    }

    /**
     * Apply color classes based on risk levels
     */
    applyRiskColors() {
        const riskCards = document.querySelectorAll('.risk-card');
        riskCards.forEach((card, index) => {
            const scoreElement = card.querySelector('.risk-score');
            const score = parseInt(scoreElement.textContent) || 0;

            card.className = card.className.replace(/(^|\s)risk-\w+/g, '');

            if (score >= 80) card.classList.add('risk-critical');
            else if (score >= 60) card.classList.add('risk-high');
            else if (score >= 40) card.classList.add('risk-moderate');
            else card.classList.add('risk-low');
        });
    }

    /**
     * Export assessment report
     */
    exportReport() {
        if (!this.currentAssessment) {
            alert('Please perform an analysis first');
            return;
        }

        const reportData = {
            timestamp: new Date().toISOString(),
            assessment: this.currentAssessment,
            location: {
                lat: document.getElementById('farmLatitude').value,
                lon: document.getElementById('farmLongitude').value
            },
            crop: document.getElementById('cropType').value,
            farmSize: document.getElementById('farmSize').value
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)],
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `climate-risk-assessment-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Share assessment (copy link to clipboard)
     */
    shareAssessment() {
        const params = new URLSearchParams({
            lat: document.getElementById('farmLatitude').value,
            lon: document.getElementById('farmLongitude').value,
            crop: document.getElementById('cropType').value,
            size: document.getElementById('farmSize').value
        });

        const shareUrl = `${window.location.origin}${window.location.pathname}?${params}`;

        navigator.clipboard.writeText(shareUrl).then(() => {
            // Show temporary success message
            const shareBtn = document.getElementById('shareAssessment');
            const originalText = shareBtn.textContent;
            shareBtn.textContent = '✅ Link Copied!';
            setTimeout(() => {
                shareBtn.textContent = originalText;
            }, 2000);
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create or update error display
        let errorDiv = document.querySelector('.climate-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'climate-error';
            document.querySelector('.climate-risk-dashboard').prepend(errorDiv);
        }

        errorDiv.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClimateRiskUI;
} else if (typeof window !== 'undefined') {
    window.ClimateRiskUI = ClimateRiskUI;
}