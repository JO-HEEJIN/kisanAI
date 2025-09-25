/**
 * NASA Farm Navigators - ROI Calculator UI
 * Interactive interface for demonstrating quantifiable NASA data value
 */

class ROICalculatorUI {
    constructor(roiCalculator) {
        this.calculator = roiCalculator;
        this.container = null;
        this.currentResults = null;
        this.isCalculating = false;
    }

    init() {
        this.createUI();
        this.attachEventListeners();
        console.log('📊 ROI Calculator UI initialized');
    }

    /**
     * Render the calculator interface to a container
     * This method is expected by the advanced component loader
     */
    async renderCalculator(container) {
        if (container) {
            const calculatorElement = this.createUI();
            container.innerHTML = '';
            container.appendChild(calculatorElement);
            this.attachEventListeners();
            console.log('📊 ROI Calculator rendered to container');
        } else {
            this.init();
        }
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.className = 'roi-calculator-dashboard';
        this.container.innerHTML = this.getHTMLTemplate();

        return this.container;
    }

    getHTMLTemplate() {
        return `
            <div class="roi-header">
                <h2>🧮 NASA Data ROI Calculator</h2>
                <p>Quantify the value of NASA satellite data for your farm</p>
            </div>

            <div class="roi-content">
                <div class="farm-input-section">
                    <h3>Farm Information</h3>
                    <div class="input-grid">
                        <div class="input-group">
                            <label for="farmAcres">Farm Size (acres)</label>
                            <input type="number" id="farmAcres" value="100" min="1" max="10000">
                        </div>

                        <div class="input-group">
                            <label for="cropType">Primary Crop</label>
                            <select id="cropType">
                                <option value="corn">Corn</option>
                                <option value="soybeans">Soybeans</option>
                                <option value="wheat">Wheat</option>
                                <option value="cotton">Cotton</option>
                                <option value="rice">Rice</option>
                                <option value="vegetables">Vegetables</option>
                                <option value="fruits">Fruits</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label for="currentYield">Current Yield (bu/acre)</label>
                            <input type="number" id="currentYield" value="150" min="50" max="300">
                        </div>

                        <div class="input-group">
                            <label for="inputCosts">Input Costs ($/acre)</label>
                            <input type="number" id="inputCosts" value="450" min="100" max="1000">
                        </div>

                        <div class="input-group">
                            <label for="laborCosts">Labor Costs ($/acre)</label>
                            <input type="number" id="laborCosts" value="85" min="20" max="200">
                        </div>

                        <div class="input-group">
                            <label for="location">Location</label>
                            <select id="location">
                                <option value="default">Default Region</option>
                                <option value="Seoul">Seoul, South Korea</option>
                                <option value="Tokyo">Tokyo, Japan</option>
                                <option value="Beijing">Beijing, China</option>
                                <option value="Phoenix">Phoenix, USA</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="nasa-integration-section">
                    <h3>NASA Data Integration</h3>
                    <div class="dataset-checkboxes">
                        <div class="dataset-option">
                            <label class="checkbox-label">
                                <input type="checkbox" id="useSMAP" checked>
                                <span class="checkmark"></span>
                                <div class="dataset-info">
                                    <strong>🛰️ SMAP Soil Moisture</strong>
                                    <p>3-8% yield increase, 10-15% water cost savings</p>
                                </div>
                            </label>
                        </div>

                        <div class="dataset-option">
                            <label class="checkbox-label">
                                <input type="checkbox" id="useMODIS" checked>
                                <span class="checkmark"></span>
                                <div class="dataset-info">
                                    <strong>🌱 MODIS Vegetation</strong>
                                    <p>2-6% yield increase through early problem detection</p>
                                </div>
                            </label>
                        </div>

                        <div class="dataset-option">
                            <label class="checkbox-label">
                                <input type="checkbox" id="useGPM" checked>
                                <span class="checkmark"></span>
                                <div class="dataset-info">
                                    <strong>🌧️ GPM Precipitation</strong>
                                    <p>2-4% yield increase, 15-25% irrigation cost savings</p>
                                </div>
                            </label>
                        </div>

                        <div class="dataset-option">
                            <label class="checkbox-label">
                                <input type="checkbox" id="useECOSTRESS" checked>
                                <span class="checkmark"></span>
                                <div class="dataset-info">
                                    <strong>🌡️ ECOSTRESS Thermal</strong>
                                    <p>3-5% yield increase in heat-stressed areas</p>
                                </div>
                            </label>
                        </div>

                        <div class="dataset-option">
                            <label class="checkbox-label">
                                <input type="checkbox" id="usePOWER" checked>
                                <span class="checkmark"></span>
                                <div class="dataset-info">
                                    <strong>⚡ NASA POWER Weather</strong>
                                    <p>2-4% yield increase through timing optimization</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="investment-input">
                        <label for="investmentCost">Initial Investment ($)</label>
                        <input type="number" id="investmentCost" value="5000" min="1000" max="50000">
                        <small>Technology, training, and implementation costs</small>
                    </div>
                </div>

                <div class="calculate-section">
                    <button id="calculateROI" class="calculate-btn">
                        <span class="btn-text">Calculate ROI</span>
                        <span class="btn-loading" style="display: none;">
                            <div class="spinner"></div>
                            Calculating...
                        </span>
                    </button>
                </div>

                <div class="results-section" id="roiResults" style="display: none;">
                    <!-- Results will be populated here -->
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const calculateBtn = this.container.querySelector('#calculateROI');
        calculateBtn.addEventListener('click', () => this.calculateROI());

        // Auto-calculate when inputs change (debounced)
        const inputs = this.container.querySelectorAll('input, select');
        let debounceTimer;
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (this.currentResults) {
                        this.calculateROI();
                    }
                }, 500);
            });
        });

        // Market price update button
        this.addMarketUpdateButton();
    }

    addMarketUpdateButton() {
        const header = this.container.querySelector('.roi-header');
        const updateBtn = document.createElement('button');
        updateBtn.className = 'market-update-btn';
        updateBtn.innerHTML = '📈 Update Market Prices';
        updateBtn.onclick = () => this.updateMarketPrices();
        header.appendChild(updateBtn);
    }

    async calculateROI() {
        if (this.isCalculating) return;

        this.isCalculating = true;
        this.showCalculating(true);

        try {
            // Gather input data
            const farmData = this.gatherFarmData();
            const nasaIntegration = this.gatherNASAIntegration();

            // Perform calculation
            this.currentResults = this.calculator.calculateROI(farmData, nasaIntegration);

            // Run sensitivity analysis
            const sensitivityResults = this.calculator.runSensitivityAnalysis(farmData, nasaIntegration);

            // Display results
            this.displayResults(this.currentResults, sensitivityResults, farmData);

            // Track achievement for ROI calculation
            if (window.achievementSystem) {
                window.achievementSystem.trackAction('data_analysis', 2);
            }

        } catch (error) {
            console.error('ROI calculation failed:', error);
            this.showError('Calculation failed. Please check your inputs and try again.');
        } finally {
            this.isCalculating = false;
            this.showCalculating(false);
        }
    }

    gatherFarmData() {
        return {
            acres: parseFloat(this.container.querySelector('#farmAcres').value),
            cropType: this.container.querySelector('#cropType').value,
            currentYield: parseFloat(this.container.querySelector('#currentYield').value),
            inputCosts: parseFloat(this.container.querySelector('#inputCosts').value),
            laborCosts: parseFloat(this.container.querySelector('#laborCosts').value),
            equipmentCosts: 120, // Default
            location: this.container.querySelector('#location').value,
            investmentCost: parseFloat(this.container.querySelector('#investmentCost').value)
        };
    }

    gatherNASAIntegration() {
        return {
            soilMoisture: {
                enabled: this.container.querySelector('#useSMAP').checked,
                dataQuality: 'good',
                coverage: 0.95
            },
            ndvi: {
                enabled: this.container.querySelector('#useMODIS').checked,
                dataQuality: 'good',
                trendAnalysis: true
            },
            precipitation: {
                enabled: this.container.querySelector('#useGPM').checked,
                forecastAccuracy: 0.85,
                realTime: true
            },
            thermalStress: {
                enabled: this.container.querySelector('#useECOSTRESS').checked,
                resolution: '70m',
                stressDetection: true
            },
            weather: {
                enabled: this.container.querySelector('#usePOWER').checked,
                historicalDepth: 40,
                parameterCount: 300
            }
        };
    }

    displayResults(results, sensitivityResults, farmData) {
        const resultsContainer = this.container.querySelector('#roiResults');
        resultsContainer.style.display = 'block';

        resultsContainer.innerHTML = `
            <div class="results-header">
                <h3>📊 ROI Analysis Results</h3>
                <div class="quick-stats">
                    <div class="stat-card ${results.roi.roi > 20 ? 'positive' : 'neutral'}">
                        <div class="stat-value">${results.roi.roi.toFixed(1)}%</div>
                        <div class="stat-label">Annual ROI</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${results.paybackPeriod.years}.${(results.paybackPeriod.months % 12)}</div>
                        <div class="stat-label">Payback (years)</div>
                    </div>
                    <div class="stat-card profit">
                        <div class="stat-value">$${results.improvements.profitIncrease.absolute.toLocaleString()}</div>
                        <div class="stat-label">Annual Profit Increase</div>
                    </div>
                </div>
            </div>

            <div class="results-details">
                <div class="comparison-section">
                    <h4>Before vs After NASA Integration</h4>
                    <div class="comparison-grid">
                        <div class="comparison-item">
                            <div class="comparison-header">
                                <h5>Baseline Operation</h5>
                            </div>
                            <div class="metrics">
                                <div class="metric">
                                    <span class="metric-label">Yield per Acre:</span>
                                    <span class="metric-value">${results.baseline.yieldPerAcre.toFixed(1)} bu</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Total Revenue:</span>
                                    <span class="metric-value">$${results.baseline.totalRevenue.toLocaleString()}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Net Profit:</span>
                                    <span class="metric-value">$${results.baseline.netProfit.toLocaleString()}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Profit Margin:</span>
                                    <span class="metric-value">${results.baseline.profitMargin.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        <div class="comparison-item improved">
                            <div class="comparison-header">
                                <h5>With NASA Data</h5>
                                <div class="improvement-badge">+${results.improvements.profitIncrease.percentage.toFixed(1)}% profit</div>
                            </div>
                            <div class="metrics">
                                <div class="metric">
                                    <span class="metric-label">Yield per Acre:</span>
                                    <span class="metric-value">${results.withNASA.yieldPerAcre.toFixed(1)} bu</span>
                                    <span class="improvement">+${results.improvements.yieldIncrease.perAcre.toFixed(1)}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Total Revenue:</span>
                                    <span class="metric-value">$${results.withNASA.totalRevenue.toLocaleString()}</span>
                                    <span class="improvement">+$${(results.withNASA.totalRevenue - results.baseline.totalRevenue).toLocaleString()}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Net Profit:</span>
                                    <span class="metric-value">$${results.withNASA.netProfit.toLocaleString()}</span>
                                    <span class="improvement">+$${results.improvements.profitIncrease.absolute.toLocaleString()}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Profit Margin:</span>
                                    <span class="metric-value">${results.withNASA.profitMargin.toFixed(1)}%</span>
                                    <span class="improvement">+${(results.withNASA.profitMargin - results.baseline.profitMargin).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="benefits-breakdown">
                    <h4>NASA Dataset Benefits Breakdown</h4>
                    <div class="benefits-grid">
                        ${this.renderBenefitsBreakdown(results.withNASA.benefits)}
                    </div>
                </div>

                <div class="projection-section">
                    <h4>5-Year Financial Projection</h4>
                    <div class="projection-chart">
                        ${this.renderProjectionChart(results.fiveYearProjection)}
                    </div>
                    <div class="projection-summary">
                        <div class="projection-stat">
                            <span class="label">Total 5-Year Benefit:</span>
                            <span class="value">$${results.fiveYearProjection.totalFiveYearBenefit.toLocaleString()}</span>
                        </div>
                        <div class="projection-stat">
                            <span class="label">Average Annual Benefit:</span>
                            <span class="value">$${results.fiveYearProjection.averageAnnualBenefit.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="sensitivity-section">
                    <h4>Sensitivity Analysis</h4>
                    <p>ROI under different market conditions:</p>
                    <div class="sensitivity-grid">
                        ${this.renderSensitivityAnalysis(sensitivityResults)}
                    </div>
                </div>

                <div class="recommendation-section">
                    <h4>Recommendation</h4>
                    ${this.renderRecommendation(results, farmData)}
                </div>

                <div class="export-section">
                    <button class="export-btn" onclick="window.roiCalculatorUI.exportReport()">
                        📄 Export ROI Report
                    </button>
                    <button class="share-btn" onclick="window.roiCalculatorUI.shareResults()">
                        📤 Share Results
                    </button>
                </div>
            </div>
        `;
    }

    renderBenefitsBreakdown(benefits) {
        const benefitItems = Object.entries(benefits).map(([key, benefit]) => {
            const yieldPercent = (benefit.yieldIncrease * 100).toFixed(1);
            const costPercent = (benefit.costSavings * 100).toFixed(1);

            return `
                <div class="benefit-item">
                    <div class="benefit-header">
                        <h5>${this.getBenefitTitle(key)}</h5>
                        <div class="benefit-impact ${yieldPercent > 0 || costPercent > 0 ? 'positive' : 'inactive'}">
                            ${yieldPercent > 0 ? `+${yieldPercent}% yield` : ''}
                            ${costPercent > 0 ? `, -${costPercent}% costs` : ''}
                        </div>
                    </div>
                    <p class="benefit-description">${benefit.description}</p>
                </div>
            `;
        }).join('');

        return benefitItems;
    }

    getBenefitTitle(key) {
        const titles = {
            soilMoistureOptimization: '💧 Soil Moisture Optimization',
            vegetationMonitoring: '🌱 Vegetation Health Monitoring',
            precipitationOptimization: '🌧️ Precipitation Management',
            thermalStressReduction: '🌡️ Thermal Stress Reduction',
            weatherOptimization: '⚡ Weather Optimization',
            synergyBonus: '🔄 Multi-Dataset Synergy'
        };
        return titles[key] || key;
    }

    renderProjectionChart(projection) {
        const maxBenefit = Math.max(...projection.projections.map(p => p.cumulativeBenefit));

        return `
            <div class="projection-bars">
                ${projection.projections.map((year, index) => {
                    const height = (year.cumulativeBenefit / maxBenefit) * 100;
                    return `
                        <div class="projection-bar">
                            <div class="bar" style="height: ${height}%"></div>
                            <div class="bar-label">
                                <div class="year">Year ${year.year}</div>
                                <div class="amount">$${year.cumulativeBenefit.toLocaleString()}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderSensitivityAnalysis(sensitivityResults) {
        return Object.entries(sensitivityResults).map(([scenario, results]) => {
            const scenarioClass = scenario === 'conservative' ? 'conservative' :
                                scenario === 'optimistic' ? 'optimistic' : 'base';

            return `
                <div class="sensitivity-item ${scenarioClass}">
                    <div class="scenario-header">
                        <h5>${scenario.charAt(0).toUpperCase() + scenario.slice(1)}</h5>
                        <div class="scenario-roi">${results.roi.roi.toFixed(1)}% ROI</div>
                    </div>
                    <div class="scenario-details">
                        <span>Payback: ${results.paybackPeriod.years} years</span>
                        <span>Profit: +$${results.improvements.profitIncrease.absolute.toLocaleString()}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRecommendation(results, farmData) {
        const report = this.calculator.generateROIReport(results, farmData);
        const rec = report.recommendation;

        const categoryClass = rec.category.toLowerCase().replace(' ', '-');

        return `
            <div class="recommendation-card ${categoryClass}">
                <div class="rec-header">
                    <div class="rec-category">${rec.category}</div>
                    <div class="rec-confidence">Confidence: ${rec.confidence}</div>
                </div>
                <p class="rec-reason">${rec.reason}</p>

                <div class="key-metrics">
                    <div class="key-metric">
                        <span class="metric-icon">💰</span>
                        <span class="metric-text">${results.roi.roi.toFixed(0)}% Annual ROI</span>
                    </div>
                    <div class="key-metric">
                        <span class="metric-icon">⏱️</span>
                        <span class="metric-text">${results.paybackPeriod.years}-year payback</span>
                    </div>
                    <div class="key-metric">
                        <span class="metric-icon">📈</span>
                        <span class="metric-text">$${results.fiveYearProjection.totalFiveYearBenefit.toLocaleString()} 5-year value</span>
                    </div>
                </div>
            </div>
        `;
    }

    async updateMarketPrices() {
        const updateBtn = this.container.querySelector('.market-update-btn');
        updateBtn.disabled = true;
        updateBtn.textContent = '⏳ Updating...';

        try {
            await this.calculator.updateMarketPrices();

            // Recalculate if we have results
            if (this.currentResults) {
                await this.calculateROI();
            }

            updateBtn.textContent = '✅ Updated';
            setTimeout(() => {
                updateBtn.textContent = '📈 Update Market Prices';
                updateBtn.disabled = false;
            }, 2000);

        } catch (error) {
            updateBtn.textContent = '❌ Update Failed';
            setTimeout(() => {
                updateBtn.textContent = '📈 Update Market Prices';
                updateBtn.disabled = false;
            }, 2000);
        }
    }

    showCalculating(show) {
        const btnText = this.container.querySelector('.btn-text');
        const btnLoading = this.container.querySelector('.btn-loading');

        if (show) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
        }
    }

    showError(message) {
        const resultsContainer = this.container.querySelector('#roiResults');
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Calculation Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    exportReport() {
        if (!this.currentResults) return;

        const farmData = this.gatherFarmData();
        const report = this.calculator.generateROIReport(this.currentResults, farmData);

        // Create downloadable report
        const reportText = this.generateReportText(report);
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `NASA_Farm_ROI_Report_${new Date().toISOString().slice(0, 10)}.txt`;
        link.click();

        URL.revokeObjectURL(url);

        // Track achievement
        if (window.achievementSystem) {
            window.achievementSystem.trackAction('data_analysis', 3);
        }
    }

    generateReportText(report) {
        return `
NASA FARM NAVIGATORS - ROI ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

FARM SUMMARY:
- Size: ${report.summary.farmSize} acres
- Crop: ${report.summary.cropType}
- Location: ${report.summary.location}

INVESTMENT ANALYSIS:
- Initial Investment: $${report.investment.cost.toLocaleString()}
- Payback Period: ${report.investment.paybackPeriod} months
- Annual ROI: ${report.investment.roi.toFixed(1)}%

IMPROVEMENTS:
- Yield Increase: ${report.improvements.yieldIncrease.toFixed(1)}%
- Cost Reduction: ${report.improvements.costReduction.toFixed(1)}%
- Profit Increase: $${report.improvements.profitIncrease.toLocaleString()}

5-YEAR PROJECTION:
- Total Benefit: $${report.fiveYearProjection.toLocaleString()}

RECOMMENDATION: ${report.recommendation.category}
Reason: ${report.recommendation.reason}
Confidence: ${report.recommendation.confidence}

This report demonstrates the quantifiable value of NASA satellite data integration for precision agriculture.
        `;
    }

    shareResults() {
        if (!this.currentResults) return;

        const shareText = `🛰️ NASA Farm ROI: ${this.currentResults.roi.roi.toFixed(1)}% annual return with ${this.currentResults.paybackPeriod.years}-year payback! NASA satellite data delivers $${this.currentResults.improvements.profitIncrease.absolute.toLocaleString()} additional annual profit. #NASASpaceApps #PrecisionAgriculture`;

        if (navigator.share) {
            navigator.share({
                title: 'NASA Farm Navigator ROI Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText);
            this.showToast('Results copied to clipboard!');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    getContainer() {
        return this.container || this.createUI();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ROICalculatorUI;
}

// Initialize global instance
if (typeof window !== 'undefined' && window.roiCalculator) {
    window.roiCalculatorUI = new ROICalculatorUI(window.roiCalculator);
}