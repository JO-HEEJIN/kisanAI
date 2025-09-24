/**
 * Advanced Data Dashboard Component
 * Displays multi-sensor fusion data with edge case detection and temporal intelligence
 */

class AdvancedDataDashboard {
    constructor(container) {
        this.container = container;
        this.analysisService = new AdvancedNASAAnalysis();
        this.currentLocation = null;
        this.fusionData = null;
        this.updateInterval = null;
        this.charts = {};

        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();

        // Start real-time updates if location is available
        if (window.app && window.app.gameEngine) {
            const location = window.app.gameEngine.getLocation();
            if (location) {
                this.setLocation(location);
            }
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="advanced-dashboard">
                <div class="dashboard-header">
                    <h2>🛰️ Advanced Multi-Sensor Analysis Dashboard</h2>
                    <div class="dashboard-controls">
                        <div class="location-picker">
                            <label>📍 Location:</label>
                            <select id="farmingRegionSelect" class="control-select">
                                <option value="custom">Custom Location</option>
                                <optgroup label="🌾 Major Farming Regions">
                                    <option value="33.43,-111.94">Arizona, USA (Desert Agriculture)</option>
                                    <option value="40.71,-74.00">New York, USA (Temperate)</option>
                                    <option value="52.52,13.41">Berlin, Germany (European)</option>
                                    <option value="28.61,77.20">New Delhi, India (Monsoon)</option>
                                    <option value="-23.55,-46.63">São Paulo, Brazil (Tropical)</option>
                                    <option value="-33.87,151.21">Sydney, Australia (Mediterranean)</option>
                                    <option value="1.29,103.85">Singapore (Equatorial)</option>
                                    <option value="64.84,-147.72">Alaska, USA (Arctic)</option>
                                </optgroup>
                                <optgroup label="🌽 Crop Specialized Regions">
                                    <option value="41.59,-93.62">Iowa, USA (Corn Belt)</option>
                                    <option value="38.91,-92.27">Missouri, USA (Soy Belt)</option>
                                    <option value="32.78,-96.80">Texas, USA (Cotton/Wheat)</option>
                                    <option value="50.45,30.52">Ukraine (Wheat)</option>
                                    <option value="22.32,114.17">Hong Kong (Rice Paddies)</option>
                                    <option value="-14.24,-51.93">Brazil (Coffee)</option>
                                </optgroup>
                            </select>
                            <div class="custom-coords" id="customCoords" style="display: none;">
                                <input type="number" id="customLat" placeholder="Latitude" step="0.01" style="width: 80px;">
                                <input type="number" id="customLon" placeholder="Longitude" step="0.01" style="width: 80px;">
                                <button id="applyCustomLocation" class="control-btn small">Apply</button>
                            </div>
                        </div>
                        <button id="refreshDataBtn" class="control-btn">
                            <span class="refresh-icon">🔄</span> Refresh Data
                        </button>
                        <button id="toggleAutoUpdateBtn" class="control-btn">
                            <span class="auto-icon">⏱️</span> Auto Update: OFF
                        </button>
                        <select id="analysisMode" class="control-select">
                            <option value="fusion">Sensor Fusion</option>
                            <option value="edge">Edge Cases</option>
                            <option value="temporal">Temporal Analysis</option>
                            <option value="sentinel">High Resolution</option>
                        </select>
                        <button id="exportReportBtn" class="control-btn">
                            <span>📊</span> Export Report
                        </button>
                    </div>
                </div>

                <!-- Main Fusion Display -->
                <div class="fusion-panel">
                    <div class="fusion-header">
                        <h3>🔬 Sensor Fusion Analysis</h3>
                        <span class="confidence-badge" id="confidenceScore">Confidence: --</span>
                    </div>

                    <div class="fusion-grid">
                        <!-- Water Stress Index -->
                        <div class="metric-card water-stress">
                            <div class="metric-header">
                                <span class="metric-icon">💧</span>
                                <span class="metric-title">Water Stress Index</span>
                            </div>
                            <div class="metric-value" id="waterStressValue">--</div>
                            <div class="metric-gauge" id="waterStressGauge"></div>
                            <div class="metric-details" id="waterStressDetails"></div>
                        </div>

                        <!-- Vegetation Health -->
                        <div class="metric-card vegetation-health">
                            <div class="metric-header">
                                <span class="metric-icon">🌱</span>
                                <span class="metric-title">Vegetation Health</span>
                            </div>
                            <div class="metric-value" id="vegetationValue">--</div>
                            <div class="metric-gauge" id="vegetationGauge"></div>
                            <div class="metric-details" id="vegetationDetails"></div>
                        </div>

                        <!-- Farm Health Score -->
                        <div class="metric-card farm-health">
                            <div class="metric-header">
                                <span class="metric-icon">🚜</span>
                                <span class="metric-title">Overall Farm Health</span>
                            </div>
                            <div class="metric-value" id="farmHealthValue">--</div>
                            <div class="metric-ring" id="farmHealthRing"></div>
                            <div class="metric-breakdown" id="farmHealthBreakdown"></div>
                        </div>
                    </div>
                </div>

                <!-- Multi-Sensor Data Grid -->
                <div class="sensor-grid">
                    <!-- SMAP Panel -->
                    <div class="sensor-panel smap-panel">
                        <h4>📡 SMAP (Soil Moisture)</h4>
                        <div class="sensor-content">
                            <div class="data-row">
                                <span class="data-label">Soil Moisture:</span>
                                <span class="data-value" id="smapMoisture">-- m³/m³</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Surface Temp:</span>
                                <span class="data-value" id="smapTemp">-- K</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Vegetation Water:</span>
                                <span class="data-value" id="smapVWC">-- kg/m²</span>
                            </div>
                            <div class="data-row quality-row">
                                <span class="data-label">Quality:</span>
                                <span class="data-value quality-indicator" id="smapQuality">--</span>
                            </div>
                            <div class="edge-cases" id="smapEdgeCases"></div>
                        </div>
                    </div>

                    <!-- MODIS Panel -->
                    <div class="sensor-panel modis-panel">
                        <h4>🌍 MODIS (Vegetation)</h4>
                        <div class="sensor-content">
                            <div class="data-row">
                                <span class="data-label">NDVI:</span>
                                <span class="data-value" id="modisNDVI">--</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">EVI:</span>
                                <span class="data-value" id="modisEVI">--</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Land Surface Temp:</span>
                                <span class="data-value" id="modisLST">-- K</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Pixel Quality:</span>
                                <span class="data-value" id="modisPixelQuality">--</span>
                            </div>
                            <div class="anomalies" id="modisAnomalies"></div>
                        </div>
                    </div>

                    <!-- GPM Panel -->
                    <div class="sensor-panel gpm-panel">
                        <h4>🌧️ GPM (Precipitation)</h4>
                        <div class="sensor-content">
                            <div class="data-row">
                                <span class="data-label">Precip Rate:</span>
                                <span class="data-value" id="gpmRate">-- mm/hr</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Confidence:</span>
                                <span class="data-value" id="gpmConfidence">--%</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Liquid Probability:</span>
                                <span class="data-value" id="gpmLiquid">--%</span>
                            </div>
                            <div class="forecast-mini" id="gpmForecast"></div>
                            <div class="risk-indicators">
                                <span class="risk-badge" id="floodRisk">Flood Risk: --</span>
                                <span class="risk-badge" id="droughtRisk">Drought Risk: --</span>
                            </div>
                        </div>
                    </div>

                    <!-- Sentinel-2 Panel -->
                    <div class="sensor-panel sentinel-panel">
                        <h4>🔍 Sentinel-2 (10m Resolution)</h4>
                        <div class="sensor-content">
                            <div class="data-row">
                                <span class="data-label">High-Res NDVI:</span>
                                <span class="data-value" id="sentinelNDVI">--</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Water Content Index:</span>
                                <span class="data-value" id="sentinelWater">--</span>
                            </div>
                            <div class="data-row">
                                <span class="data-label">Cloud Coverage:</span>
                                <span class="data-value" id="sentinelCloud">--%</span>
                            </div>
                            <div class="field-analysis" id="sentinelField"></div>
                            <div class="variations" id="sentinelVariations"></div>
                        </div>
                    </div>
                </div>

                <!-- Alerts and Edge Cases -->
                <div class="alerts-panel" id="alertsPanel">
                    <h3>⚠️ Alerts & Edge Cases</h3>
                    <div class="alerts-container" id="alertsContainer">
                        <!-- Dynamic alerts will be inserted here -->
                    </div>
                </div>

                <!-- Temporal Intelligence Panel -->
                <div class="temporal-panel" id="temporalPanel" style="display: none;">
                    <h3>📊 Temporal Intelligence & Predictions</h3>
                    <div class="temporal-content">
                        <!-- Trends Analysis -->
                        <div class="temporal-section">
                            <h4>📈 Historical Trends</h4>
                            <div id="trendsAnalysis"></div>
                        </div>

                        <!-- Predictions -->
                        <div class="temporal-section">
                            <h4>🔮 Future Predictions</h4>
                            <div class="predictions-grid">
                                <div class="prediction-panel">
                                    <div id="irrigationPrediction"></div>
                                </div>
                                <div class="prediction-panel">
                                    <div id="harvestPrediction"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Anomaly Detection -->
                        <div class="temporal-section">
                            <h4>⚠️ Anomaly Detection</h4>
                            <div id="anomaliesAnalysis"></div>
                        </div>

                        <!-- Seasonal Patterns -->
                        <div class="temporal-section">
                            <h4>🗓️ Seasonal Patterns</h4>
                            <div id="seasonalPatterns"></div>
                        </div>

                        <!-- Optimal Actions -->
                        <div class="temporal-section">
                            <h4>⚡ Optimal Actions</h4>
                            <div id="optimalActions"></div>
                        </div>

                        <!-- AI Recommendations -->
                        <div class="temporal-section">
                            <h4>🤖 AI Recommendations</h4>
                            <div id="temporalRecommendations"></div>
                        </div>
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="dashboard-status">
                    <span class="status-item">📍 Location: <span id="locationDisplay">Not Set</span></span>
                    <span class="status-item">🕒 Last Update: <span id="lastUpdate">Never</span></span>
                    <span class="status-item">📡 Data Sources: <span id="dataSources">0/4</span></span>
                    <span class="status-item quality-status">Quality: <span id="overallQuality">--</span></span>
                </div>
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        if (!document.getElementById('advanced-dashboard-styles')) {
            const style = document.createElement('style');
            style.id = 'advanced-dashboard-styles';
            style.textContent = `
                .advanced-dashboard {
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.3);
                }

                .dashboard-header h2 {
                    margin: 0;
                    color: #1a1a1a;
                    font-size: 28px;
                    font-weight: 800;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                }

                .dashboard-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .control-btn {
                    background: white;
                    border: 2px solid #4a90e2;
                    border-radius: 8px;
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .control-btn:hover {
                    background: #4a90e2;
                    color: white;
                }

                .control-select {
                    padding: 8px;
                    border-radius: 8px;
                    border: 2px solid #4a90e2;
                }

                .fusion-panel {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                }

                .fusion-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .fusion-header h3 {
                    margin: 0;
                    color: #1a1a1a;
                    font-size: 22px;
                    font-weight: 700;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                }

                .confidence-badge {
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                }

                .fusion-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }

                .metric-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 20px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }

                .metric-card.water-stress {
                    background: linear-gradient(135deg, #1e90ff 0%, #00bfff 100%);
                }

                .metric-card.vegetation-health {
                    background: linear-gradient(135deg, #228b22 0%, #90ee90 100%);
                }

                .metric-card.farm-health {
                    background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
                }

                .metric-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .metric-icon {
                    font-size: 24px;
                }

                .metric-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #fff;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                }

                .metric-value {
                    font-size: 36px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }

                .metric-gauge {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 10px;
                }

                .metric-gauge::after {
                    content: '';
                    display: block;
                    height: 100%;
                    background: white;
                    width: var(--gauge-value, 0%);
                    transition: width 0.5s ease;
                }

                .sensor-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .sensor-panel {
                    background: white;
                    border-radius: 10px;
                    padding: 15px;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
                }

                .sensor-panel h4 {
                    margin: 0 0 15px 0;
                    color: #333;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 8px;
                }

                .data-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 5px;
                    border-radius: 5px;
                    transition: background 0.2s;
                }

                .data-row:hover {
                    background: #f5f5f5;
                }

                .data-label {
                    color: #444;
                    font-size: 16px;
                    font-weight: 500;
                }

                .data-value {
                    font-weight: 600;
                    color: #222;
                    font-size: 18px;
                }

                .quality-indicator {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                }

                .quality-indicator.good {
                    background: #4caf50;
                    color: white;
                }

                .quality-indicator.medium {
                    background: #ff9800;
                    color: white;
                }

                .quality-indicator.poor {
                    background: #f44336;
                    color: white;
                }

                .edge-cases, .anomalies {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #eee;
                }

                .edge-case-item, .anomaly-item {
                    background: #fff3e0;
                    border-left: 4px solid #ff9800;
                    padding: 5px 10px;
                    margin: 5px 0;
                    border-radius: 3px;
                    font-size: 13px;
                }

                .alerts-panel {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .alerts-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .alert-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 15px;
                    border-radius: 8px;
                    animation: slideIn 0.3s ease;
                }

                .alert-item.high {
                    background: #ffebee;
                    border-left: 5px solid #f44336;
                }

                .alert-item.medium {
                    background: #fff3e0;
                    border-left: 5px solid #ff9800;
                }

                .alert-item.low {
                    background: #e8f5e9;
                    border-left: 5px solid #4caf50;
                }

                .alert-icon {
                    font-size: 24px;
                }

                .alert-content h5 {
                    margin: 0 0 5px 0;
                    color: #333;
                }

                .alert-recommendations {
                    margin-top: 8px;
                    padding-left: 20px;
                }

                .alert-recommendations li {
                    color: #666;
                    margin: 3px 0;
                }

                .temporal-panel {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .temporal-content {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }

                .temporal-section {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    border-left: 4px solid #667eea;
                }

                .temporal-section h4 {
                    margin: 0 0 15px 0;
                    color: #333;
                    font-size: 16px;
                    font-weight: 600;
                }

                /* Trends Styles */
                .trends-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                }

                .trend-card {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                .trend-card h5 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: #555;
                }

                .trend-indicator {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-weight: 600;
                }

                .trend-indicator.increasing {
                    background: #d4edda;
                    color: #155724;
                }

                .trend-indicator.decreasing {
                    background: #f8d7da;
                    color: #721c24;
                }

                .trend-indicator.improving {
                    background: #d4edda;
                    color: #155724;
                }

                .trend-indicator.declining {
                    background: #f8d7da;
                    color: #721c24;
                }

                .trend-indicator.warming {
                    background: #fff3cd;
                    color: #856404;
                }

                .trend-indicator.cooling {
                    background: #cce5ff;
                    color: #004085;
                }

                .trend-indicator.stable {
                    background: #e2e3e5;
                    color: #495057;
                }

                .trend-details {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .trend-details small {
                    font-size: 12px;
                    color: #666;
                }

                /* Predictions Styles */
                .predictions-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .prediction-panel {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                .prediction-content h5 {
                    margin: 0 0 15px 0;
                    color: #333;
                    font-size: 14px;
                    font-weight: 600;
                }

                .prediction-metric {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }

                .prediction-label {
                    font-size: 13px;
                    color: #666;
                }

                .prediction-value {
                    font-weight: 600;
                    color: #333;
                }

                .prediction-value.stress-high {
                    color: #dc3545;
                }

                .prediction-value.stress-moderate {
                    color: #fd7e14;
                }

                .prediction-value.stress-low {
                    color: #28a745;
                }

                .prediction-alert {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 4px;
                    padding: 10px;
                    margin-top: 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .action-items {
                    margin-top: 15px;
                }

                .action-items h6 {
                    margin: 0 0 10px 0;
                    font-size: 13px;
                    color: #dc3545;
                }

                .action-items ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .action-items li {
                    background: white;
                    border-radius: 4px;
                    padding: 8px 12px;
                    margin: 5px 0;
                    border-left: 3px solid #ccc;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .action-items li.action-immediate {
                    border-left-color: #dc3545;
                    background: #ffebee;
                }

                .action-items li.action-high {
                    border-left-color: #fd7e14;
                    background: #fff8e1;
                }

                .action-items li.action-moderate {
                    border-left-color: #28a745;
                    background: #e8f5e8;
                }

                .action-items li small {
                    font-size: 12px;
                    color: #666;
                }

                /* Optimal Actions Styles */
                .optimal-actions-content {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                }

                .action-timeframe {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                .action-timeframe h6 {
                    margin: 0 0 12px 0;
                    color: #333;
                    font-size: 14px;
                    font-weight: 600;
                }

                .action-timeframe ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .action-item {
                    background: #f8f9fa;
                    border-radius: 4px;
                    padding: 10px 12px;
                    margin: 8px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    border-left: 3px solid #ccc;
                }

                .action-item.priority-critical {
                    border-left-color: #dc3545;
                    background: #ffebee;
                }

                .action-item.priority-high {
                    border-left-color: #fd7e14;
                    background: #fff8e1;
                }

                .action-item.priority-moderate {
                    border-left-color: #28a745;
                    background: #e8f5e8;
                }

                .action-item small {
                    font-size: 12px;
                    color: #666;
                }

                .strategy-item {
                    background: #e3f2fd;
                    border-radius: 4px;
                    padding: 8px 12px;
                    margin: 5px 0;
                    border-left: 3px solid #2196f3;
                    font-size: 13px;
                    color: #1565c0;
                }

                /* Anomalies Styles */
                .anomalies-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .anomaly-item {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    border-left: 4px solid #ff9800;
                }

                .anomaly-item.severity-extreme {
                    border-left-color: #f44336;
                    background: #ffebee;
                }

                .anomaly-item.severity-moderate {
                    border-left-color: #ff9800;
                    background: #fff8e1;
                }

                .anomaly-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }

                .anomaly-type {
                    font-weight: 600;
                    color: #333;
                    font-size: 13px;
                }

                .anomaly-severity {
                    background: #ff9800;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    text-transform: uppercase;
                }

                .anomaly-item.severity-extreme .anomaly-severity {
                    background: #f44336;
                }

                .anomaly-description {
                    font-size: 13px;
                    color: #555;
                    margin-bottom: 5px;
                }

                .anomaly-deviation {
                    font-size: 12px;
                    color: #666;
                    font-style: italic;
                }

                /* Seasonal Styles */
                .seasonal-insights {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .seasonal-metric {
                    background: white;
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .metric-label {
                    font-size: 13px;
                    color: #666;
                }

                .metric-value {
                    font-weight: 600;
                    color: #333;
                    font-size: 14px;
                }

                .seasonal-recommendations h6 {
                    margin: 0 0 10px 0;
                    color: #333;
                    font-size: 14px;
                }

                .seasonal-recommendations ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .seasonal-rec {
                    background: white;
                    border-radius: 4px;
                    padding: 10px 12px;
                    margin: 8px 0;
                    border-left: 3px solid #4caf50;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .seasonal-rec.category-planting {
                    border-left-color: #4caf50;
                    background: #e8f5e8;
                }

                .seasonal-rec.category-water_management {
                    border-left-color: #2196f3;
                    background: #e3f2fd;
                }

                .seasonal-rec small {
                    font-size: 12px;
                    color: #666;
                }

                /* Recommendations Styles */
                .recommendations-groups {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .recommendations-group {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                .recommendations-group h6 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    font-weight: 600;
                }

                .recommendations-group.priority-critical {
                    border-left: 4px solid #dc3545;
                    background: #ffebee;
                }

                .recommendations-group.priority-critical h6 {
                    color: #dc3545;
                }

                .recommendations-group.priority-high {
                    border-left: 4px solid #fd7e14;
                    background: #fff8e1;
                }

                .recommendations-group.priority-high h6 {
                    color: #fd7e14;
                }

                .recommendations-group.priority-moderate {
                    border-left: 4px solid #28a745;
                    background: #e8f5e8;
                }

                .recommendations-group.priority-moderate h6 {
                    color: #28a745;
                }

                .recommendations-group.priority-low {
                    border-left: 4px solid #6c757d;
                    background: #f8f9fa;
                }

                .recommendations-group.priority-low h6 {
                    color: #6c757d;
                }

                .recommendations-group ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .recommendation-item {
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 4px;
                    padding: 12px;
                    margin: 8px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .rec-action {
                    font-size: 14px;
                }

                .rec-timeframe, .rec-reason {
                    font-size: 12px;
                    color: #666;
                }

                .info-text {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                /* Enhanced Mobile Responsiveness */
                @media (max-width: 768px) {
                    .advanced-dashboard {
                        padding: 10px;
                    }

                    .dashboard-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 15px;
                    }

                    .dashboard-controls {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .location-picker {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .control-select, .control-btn {
                        width: 100%;
                        padding: 12px;
                        font-size: 16px; /* Prevent zoom on iOS */
                    }

                    .fusion-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }

                    .metric-card {
                        padding: 15px;
                    }

                    .metric-value {
                        font-size: 24px;
                    }

                    .data-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }

                    .sensor-panel {
                        padding: 12px;
                    }

                    .temporal-content {
                        gap: 15px;
                    }

                    .temporal-section {
                        padding: 15px;
                    }

                    .trends-grid {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }

                    .predictions-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }

                    .optimal-actions-content {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }

                    .seasonal-insights {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }

                    .alerts-container {
                        gap: 8px;
                    }

                    .alert-item {
                        padding: 12px;
                        flex-direction: column;
                        align-items: stretch;
                    }

                    /* Touch-friendly interactions */
                    .control-btn:hover {
                        transform: none;
                    }

                    .control-btn:active {
                        transform: scale(0.98);
                    }

                    /* Improved readability on mobile */
                    .metric-details, .data-row {
                        font-size: 13px;
                    }

                    .trend-details small,
                    .seasonal-rec small,
                    .action-item small {
                        font-size: 11px;
                    }
                }

                @media (max-width: 480px) {
                    .advanced-dashboard {
                        padding: 8px;
                    }

                    .dashboard-header h2 {
                        font-size: 18px;
                    }

                    .fusion-header h3 {
                        font-size: 16px;
                    }

                    .temporal-section h4 {
                        font-size: 14px;
                    }

                    .metric-card {
                        padding: 12px;
                    }

                    .metric-value {
                        font-size: 20px;
                    }

                    .control-btn, .control-select {
                        padding: 10px;
                        font-size: 14px;
                    }

                    /* Compact layout for very small screens */
                    .confidence-badge {
                        font-size: 12px;
                        padding: 4px 8px;
                    }

                    .dashboard-status {
                        flex-direction: column;
                        gap: 5px;
                        text-align: center;
                    }

                    .status-item {
                        font-size: 12px;
                    }

                    /* Ensure touch targets are at least 44px */
                    .control-btn {
                        min-height: 44px;
                    }

                    .control-select {
                        min-height: 44px;
                    }

                    /* Stack custom coordinates inputs */
                    .custom-coords {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .custom-coords input {
                        width: 100% !important;
                    }
                }

                /* Landscape orientation optimizations */
                @media (max-width: 768px) and (orientation: landscape) {
                    .dashboard-header {
                        flex-direction: row;
                    }

                    .dashboard-controls {
                        flex-direction: row;
                        flex-wrap: wrap;
                    }

                    .fusion-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .trends-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                /* High DPI displays */
                @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                    .metric-gauge, .trend-indicator {
                        image-rendering: -webkit-optimize-contrast;
                        image-rendering: crisp-edges;
                    }
                }

                /* Accessibility improvements */
                @media (prefers-reduced-motion: reduce) {
                    .alert-item {
                        animation: none;
                    }

                    .control-btn {
                        transition: none;
                    }

                    .data-row {
                        transition: none;
                    }
                }

                /* High contrast mode support */
                @media (prefers-contrast: high) {
                    .advanced-dashboard {
                        background: white;
                        border: 2px solid black;
                    }

                    .metric-card, .sensor-panel, .temporal-section {
                        border: 1px solid black;
                    }

                    .control-btn {
                        border: 2px solid black;
                    }
                }

                /* Dark mode support (if system preference) */
                @media (prefers-color-scheme: dark) {
                    .advanced-dashboard {
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                        color: #e4e4e7;
                    }

                    .metric-card, .sensor-panel, .temporal-section {
                        background: #27272a;
                        color: #e4e4e7;
                    }

                    .control-btn {
                        background: #3f3f46;
                        color: #e4e4e7;
                        border-color: #52525b;
                    }

                    .control-select {
                        background: #3f3f46;
                        color: #e4e4e7;
                        border-color: #52525b;
                    }

                    .info-text {
                        background: #374151;
                        color: #d1d5db;
                    }
                }

                .risk-indicators {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                }

                .risk-badge {
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .risk-badge.high-risk {
                    background: #f44336;
                    color: white;
                }

                .risk-badge.low-risk {
                    background: #4caf50;
                    color: white;
                }

                .dashboard-status {
                    display: flex;
                    justify-content: space-between;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.9);
                    border-radius: 8px;
                    margin-top: 20px;
                }

                .status-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 14px;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                .auto-updating {
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    attachEventListeners() {
        // Refresh button
        document.getElementById('refreshDataBtn')?.addEventListener('click', () => {
            this.refreshData();
        });

        // Auto update toggle
        document.getElementById('toggleAutoUpdateBtn')?.addEventListener('click', (e) => {
            this.toggleAutoUpdate(e.target);
        });

        // Analysis mode selector
        document.getElementById('analysisMode')?.addEventListener('change', (e) => {
            this.switchAnalysisMode(e.target.value);
        });

        // Location picker
        document.getElementById('farmingRegionSelect')?.addEventListener('change', (e) => {
            this.handleLocationChange(e.target.value);
        });

        // Custom location inputs
        document.getElementById('applyCustomLocation')?.addEventListener('click', () => {
            this.applyCustomLocation();
        });

        // Export report
        document.getElementById('exportReportBtn')?.addEventListener('click', () => {
            this.exportFusionReport();
        });
    }

    async setLocation(location) {
        this.currentLocation = location;
        document.getElementById('locationDisplay').textContent =
            `${location.lat.toFixed(2)}°, ${location.lon.toFixed(2)}°`;

        await this.refreshData();
    }

    async refreshData() {
        if (!this.currentLocation) {
            console.warn('No location set for advanced dashboard');
            return;
        }

        try {
            // Show loading state
            this.showLoading();

            // Perform sensor fusion analysis
            this.fusionData = await this.analysisService.performSensorFusion(this.currentLocation);

            // Get additional data
            const [gpmData, sentinel2Data] = await Promise.all([
                this.analysisService.getEnhancedGPMData(this.currentLocation),
                this.analysisService.getSentinel2Analysis(this.currentLocation)
            ]);

            // Detect edge cases
            const edgeCases = this.analysisService.detectEdgeCases(this.fusionData);

            // Update all displays
            this.updateFusionDisplay(this.fusionData);
            this.updateSensorPanels(this.fusionData, gpmData, sentinel2Data);
            this.updateAlerts(this.fusionData.alerts, edgeCases);
            this.updateStatus();

            // Hide loading state
            this.hideLoading();

        } catch (error) {
            console.error('Failed to refresh advanced dashboard data:', error);
            this.showError(error);
        }
    }

    updateFusionDisplay(data) {
        // Water Stress Index
        const waterStress = document.getElementById('waterStressValue');
        const waterGauge = document.getElementById('waterStressGauge');
        if (waterStress) {
            waterStress.textContent = data.waterStressIndex.toFixed(0);
            waterGauge.style.setProperty('--gauge-value', `${100 - data.waterStressIndex}%`);
        }

        // Vegetation Health
        const vegetation = document.getElementById('vegetationValue');
        const vegGauge = document.getElementById('vegetationGauge');
        if (vegetation) {
            const vegHealth = 100 - data.vegetationStressIndex;
            vegetation.textContent = vegHealth.toFixed(0);
            vegGauge.style.setProperty('--gauge-value', `${vegHealth}%`);
        }

        // Farm Health Score
        const farmHealth = document.getElementById('farmHealthValue');
        if (farmHealth) {
            farmHealth.textContent = data.farmHealthScore.toFixed(0);
            this.updateFarmHealthRing(data.farmHealthScore);
        }

        // Confidence Score
        const confidence = document.getElementById('confidenceScore');
        if (confidence) {
            confidence.textContent = `Confidence: ${(data.confidence * 100).toFixed(0)}%`;
        }
    }

    updateSensorPanels(fusionData, gpmData, sentinel2Data) {
        // SMAP Panel
        const smapData = fusionData.rawData.smap;
        document.getElementById('smapMoisture').textContent =
            `${smapData.soilMoisture.toFixed(3)} m³/m³`;
        document.getElementById('smapTemp').textContent =
            `${smapData.surfaceTemperature.toFixed(1)} K`;
        document.getElementById('smapVWC').textContent =
            `${smapData.vegetationWaterContent.toFixed(2)} kg/m²`;

        const smapQuality = document.getElementById('smapQuality');
        smapQuality.textContent = smapData.qualityFlag;
        smapQuality.className = `data-value quality-indicator ${
            smapData.qualityFlag === 'good_quality' ? 'good' : 'medium'
        }`;

        // Display SMAP edge cases
        const smapEdgeCases = document.getElementById('smapEdgeCases');
        if (smapData.edgeCases.length > 0) {
            smapEdgeCases.innerHTML = smapData.edgeCases.map(ec =>
                `<div class="edge-case-item">${ec}</div>`
            ).join('');
        }

        // MODIS Panel
        const modisData = fusionData.rawData.modis;
        document.getElementById('modisNDVI').textContent = modisData.ndvi.toFixed(3);
        document.getElementById('modisEVI').textContent = modisData.evi.toFixed(3);
        document.getElementById('modisLST').textContent = `${modisData.landSurfaceTemp.toFixed(1)} K`;
        document.getElementById('modisPixelQuality').textContent = modisData.pixelReliability;

        // Display MODIS anomalies
        const modisAnomalies = document.getElementById('modisAnomalies');
        if (modisData.anomalies.length > 0) {
            modisAnomalies.innerHTML = modisData.anomalies.map(a =>
                `<div class="anomaly-item">${a}</div>`
            ).join('');
        }

        // GPM Panel
        document.getElementById('gpmRate').textContent =
            `${gpmData.precipitationCal.toFixed(2)} mm/hr`;
        document.getElementById('gpmConfidence').textContent =
            `${(gpmData.confidence * 100).toFixed(0)}%`;
        document.getElementById('gpmLiquid').textContent =
            `${(gpmData.probabilityLiquidPrecipitation * 100).toFixed(0)}%`;

        // Risk indicators
        const floodRisk = document.getElementById('floodRisk');
        const droughtRisk = document.getElementById('droughtRisk');
        floodRisk.textContent = `Flood Risk: ${gpmData.floodRisk ? 'HIGH' : 'LOW'}`;
        floodRisk.className = `risk-badge ${gpmData.floodRisk ? 'high-risk' : 'low-risk'}`;
        droughtRisk.textContent = `Drought Risk: ${gpmData.droughtRisk ? 'HIGH' : 'LOW'}`;
        droughtRisk.className = `risk-badge ${gpmData.droughtRisk ? 'high-risk' : 'low-risk'}`;

        // Sentinel-2 Panel
        document.getElementById('sentinelNDVI').textContent =
            sentinel2Data.ndvi_highres.toFixed(3);
        document.getElementById('sentinelWater').textContent =
            sentinel2Data.waterContentIndex.toFixed(3);
        document.getElementById('sentinelCloud').textContent =
            `${sentinel2Data.cloudCoverage.toFixed(1)}%`;

        // Field variations
        if (sentinel2Data.variations) {
            const variations = document.getElementById('sentinelVariations');
            variations.innerHTML = `
                <div class="variation-info">
                    Dry Patches: ${sentinel2Data.variations.dryPatches} |
                    Waterlogged: ${sentinel2Data.variations.waterloggedAreas} |
                    Healthy: ${sentinel2Data.variations.healthyZones.toFixed(0)}%
                </div>
            `;
        }
    }

    updateAlerts(fusionAlerts, edgeCases) {
        const container = document.getElementById('alertsContainer');
        container.innerHTML = '';

        // Add fusion alerts
        fusionAlerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert-item ${alert.priority}`;
            alertDiv.innerHTML = `
                <span class="alert-icon">⚠️</span>
                <div class="alert-content">
                    <h5>${alert.type.replace('_', ' ').toUpperCase()}</h5>
                    <p>${alert.message}</p>
                </div>
            `;
            container.appendChild(alertDiv);
        });

        // Add edge cases
        edgeCases.forEach(edgeCase => {
            const caseDiv = document.createElement('div');
            caseDiv.className = `alert-item ${edgeCase.severity}`;
            caseDiv.innerHTML = `
                <span class="alert-icon">🔍</span>
                <div class="alert-content">
                    <h5>${edgeCase.type.replace('_', ' ').toUpperCase()}</h5>
                    <p>${edgeCase.description}</p>
                    <ul class="alert-recommendations">
                        ${edgeCase.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            `;
            container.appendChild(caseDiv);
        });

        if (fusionAlerts.length === 0 && edgeCases.length === 0) {
            container.innerHTML = '<p style="color: #4caf50;">✓ No alerts or edge cases detected</p>';
        }
    }

    updateFarmHealthRing(score) {
        const ring = document.getElementById('farmHealthRing');
        if (ring) {
            // Create a simple SVG ring chart
            const radius = 40;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (score / 100) * circumference;

            ring.innerHTML = `
                <svg width="100" height="100" style="transform: rotate(-90deg);">
                    <circle cx="50" cy="50" r="${radius}"
                            stroke="#e0e0e0" stroke-width="8" fill="none"/>
                    <circle cx="50" cy="50" r="${radius}"
                            stroke="#4caf50" stroke-width="8" fill="none"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"
                            style="transition: stroke-dashoffset 0.5s;"/>
                </svg>
            `;
        }
    }

    toggleAutoUpdate(button) {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            button.innerHTML = '<span class="auto-icon">⏱️</span> Auto Update: OFF';
            this.container.classList.remove('auto-updating');
        } else {
            this.updateInterval = setInterval(() => this.refreshData(), 30000); // Update every 30 seconds
            button.innerHTML = '<span class="auto-icon">⏱️</span> Auto Update: ON';
            this.container.classList.add('auto-updating');
        }
    }

    switchAnalysisMode(mode) {
        // Hide all mode-specific panels
        document.getElementById('temporalPanel').style.display = 'none';

        switch(mode) {
            case 'temporal':
                document.getElementById('temporalPanel').style.display = 'block';
                this.loadTemporalAnalysis();
                break;
            case 'edge':
                // Focus on edge cases panel
                document.getElementById('alertsPanel').scrollIntoView({ behavior: 'smooth' });
                break;
            case 'sentinel':
                // Could load a detailed Sentinel-2 view
                this.loadSentinelDetailed();
                break;
            default:
                // Fusion mode - default view
                break;
        }
    }

    async loadTemporalAnalysis() {
        if (!this.fusionData) return;

        // Generate mock historical data for demonstration
        const historicalData = this.generateMockHistoricalData();

        // Extract current data from fusion results
        const currentData = {
            soilMoisture: this.fusionData.rawData.smap.soilMoisture,
            ndvi: this.fusionData.rawData.modis.ndvi,
            temperature: this.fusionData.rawData.modis.landSurfaceTemp,
            precipitation: Math.random() * 5, // mm/day
            waterStressIndex: this.fusionData.waterStressIndex,
            timestamp: new Date().toISOString()
        };

        // Generate comprehensive temporal intelligence
        const temporal = await this.analysisService.generateTemporalIntelligence(
            historicalData,
            currentData
        );

        this.updateTemporalDisplay(temporal, currentData);
    }

    generateMockHistoricalData() {
        const data = [];
        const now = new Date();

        // Generate 90 days of historical data
        for (let i = 90; i > 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Add seasonal variation and trends
            const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
            const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 0.3;

            // Add slight declining trend for soil moisture (demonstrating drought conditions)
            const trendFactor = (90 - i) / 1000;

            data.push({
                timestamp: date.toISOString(),
                soilMoisture: Math.max(0.1, 0.35 + seasonalFactor - trendFactor + (Math.random() - 0.5) * 0.1),
                ndvi: Math.max(0.2, 0.6 + seasonalFactor * 0.5 + (Math.random() - 0.5) * 0.1),
                temperature: 288 + seasonalFactor * 15 + (Math.random() - 0.5) * 5, // Kelvin
                precipitation: Math.max(0, 2 + seasonalFactor * 3 + (Math.random() - 0.5) * 4)
            });
        }

        return data;
    }

    updateTemporalDisplay(temporal, currentData) {
        // Update trends section
        this.updateTrendsDisplay(temporal.trends);

        // Update predictions section
        this.updatePredictionsDisplay(temporal.predictions);

        // Update anomalies section
        this.updateAnomaliesDisplay(temporal.anomalies);

        // Update seasonal patterns
        this.updateSeasonalDisplay(temporal.seasonalPatterns);

        // Update recommendations
        this.updateRecommendationsDisplay(temporal.recommendations);
    }

    updateTrendsDisplay(trends) {
        const trendsContainer = document.getElementById('trendsAnalysis');
        if (!trendsContainer) return;

        if (trends.insufficient_data) {
            trendsContainer.innerHTML = '<p class="info-text">📊 Insufficient historical data for trend analysis</p>';
            return;
        }

        let trendsHtml = '<div class="trends-grid">';

        // Soil Moisture Trend
        trendsHtml += `
            <div class="trend-card">
                <h5>💧 Soil Moisture Trend</h5>
                <div class="trend-indicator ${trends.soilMoisture.direction}">
                    <span class="trend-direction">${trends.soilMoisture.direction === 'increasing' ? '📈' : '📉'}</span>
                    <span class="trend-text">${trends.soilMoisture.direction}</span>
                </div>
                <div class="trend-details">
                    <small>Weekly change: ${trends.soilMoisture.weeklyChange > 0 ? '+' : ''}${trends.soilMoisture.weeklyChange.toFixed(1)}%</small>
                    <small>Confidence: ${(trends.soilMoisture.confidence * 100).toFixed(0)}%</small>
                </div>
            </div>
        `;

        // Vegetation Trend
        trendsHtml += `
            <div class="trend-card">
                <h5>🌱 Vegetation Health</h5>
                <div class="trend-indicator ${trends.vegetation.direction}">
                    <span class="trend-direction">${trends.vegetation.direction === 'improving' ? '🌱' : trends.vegetation.direction === 'declining' ? '🍂' : '📊'}</span>
                    <span class="trend-text">${trends.vegetation.healthStatus}</span>
                </div>
                <div class="trend-details">
                    <small>Status: ${trends.vegetation.healthStatus}</small>
                    <small>Confidence: ${(trends.vegetation.confidence * 100).toFixed(0)}%</small>
                </div>
            </div>
        `;

        // Temperature Trend
        trendsHtml += `
            <div class="trend-card">
                <h5>🌡️ Temperature Pattern</h5>
                <div class="trend-indicator ${trends.temperature.direction}">
                    <span class="trend-direction">${trends.temperature.direction === 'warming' ? '🔥' : '❄️'}</span>
                    <span class="trend-text">${trends.temperature.direction}</span>
                </div>
                <div class="trend-details">
                    <small>Extreme events: ${trends.temperature.extremeEvents}</small>
                    <small>Confidence: ${(trends.temperature.confidence * 100).toFixed(0)}%</small>
                </div>
            </div>
        `;

        // Precipitation Trend
        trendsHtml += `
            <div class="trend-card">
                <h5>🌧️ Precipitation Pattern</h5>
                <div class="trend-indicator ${trends.precipitation.direction}">
                    <span class="trend-direction">${trends.precipitation.direction === 'increasing' ? '🌧️' : '☀️'}</span>
                    <span class="trend-text">${trends.precipitation.direction}</span>
                </div>
                <div class="trend-details">
                    <small>Drought risk: ${trends.precipitation.droughtRisk}</small>
                    <small>Confidence: ${(trends.precipitation.confidence * 100).toFixed(0)}%</small>
                </div>
            </div>
        `;

        trendsHtml += '</div>';
        trendsContainer.innerHTML = trendsHtml;
    }

    updatePredictionsDisplay(predictions) {
        // Update irrigation prediction with enhanced data
        const irrigationDiv = document.getElementById('irrigationPrediction');
        if (irrigationDiv) {
            let irrigationHtml = `
                <div class="prediction-content">
                    <h5>💧 2-Week Water Stress Prediction</h5>
                    <div class="prediction-metric">
                        <span class="prediction-label">Predicted Stress Level:</span>
                        <span class="prediction-value stress-${predictions.waterStress.riskLevel}">${predictions.waterStress.predicted.toFixed(0)}%</span>
                    </div>
                    <div class="prediction-metric">
                        <span class="prediction-label">Risk Level:</span>
                        <span class="prediction-value">${predictions.waterStress.riskLevel}</span>
                    </div>
            `;

            if (predictions.waterStress.actionNeeded && predictions.waterStress.actionNeeded.length > 0) {
                irrigationHtml += `
                    <div class="action-items">
                        <h6>🚨 Actions Needed:</h6>
                        <ul>
                `;
                predictions.waterStress.actionNeeded.forEach(action => {
                    irrigationHtml += `
                        <li class="action-${action.urgency}">
                            <strong>${action.action}</strong> (${action.urgency})
                            <small>${action.reason}</small>
                        </li>
                    `;
                });
                irrigationHtml += `</ul></div>`;
            }

            irrigationHtml += `</div>`;
            irrigationDiv.innerHTML = irrigationHtml;
        }

        // Update harvest prediction with enhanced data
        const harvestDiv = document.getElementById('harvestPrediction');
        if (harvestDiv) {
            let harvestHtml = `
                <div class="prediction-content">
                    <h5>🌾 Crop Predictions</h5>
                    <div class="prediction-metric">
                        <span class="prediction-label">Soil Moisture (14 days):</span>
                        <span class="prediction-value">${(predictions.soilMoisture.predicted * 100).toFixed(0)}%</span>
                    </div>
                    <div class="prediction-metric">
                        <span class="prediction-label">NDVI (14 days):</span>
                        <span class="prediction-value">${predictions.vegetation.predicted.toFixed(2)}</span>
                    </div>
            `;

            if (predictions.vegetation.alert) {
                harvestHtml += `
                    <div class="prediction-alert">
                        <span class="alert-icon">⚠️</span>
                        <span class="alert-text">Vegetation decline alert - monitor closely</span>
                    </div>
                `;
            }

            harvestHtml += `</div>`;
            harvestDiv.innerHTML = harvestHtml;
        }

        // Update optimal actions display
        this.updateOptimalActionsDisplay(predictions.optimalActions);
    }

    updateOptimalActionsDisplay(optimalActions) {
        const actionsDiv = document.getElementById('optimalActions');
        if (!actionsDiv) return;

        let actionsHtml = '<div class="optimal-actions-content">';

        // Next week recommendations
        if (optimalActions.nextWeek && optimalActions.nextWeek.length > 0) {
            actionsHtml += `
                <div class="action-timeframe">
                    <h6>📅 Next Week</h6>
                    <ul>
            `;
            optimalActions.nextWeek.forEach(action => {
                actionsHtml += `
                    <li class="action-item priority-${action.priority}">
                        <strong>${action.action}</strong>
                        <small>${action.benefit}</small>
                    </li>
                `;
            });
            actionsHtml += `</ul></div>`;
        }

        // Next month recommendations
        if (optimalActions.nextMonth && optimalActions.nextMonth.length > 0) {
            actionsHtml += `
                <div class="action-timeframe">
                    <h6>📆 Next Month</h6>
                    <ul>
            `;
            optimalActions.nextMonth.forEach(action => {
                actionsHtml += `
                    <li class="action-item priority-${action.priority}">
                        <strong>${action.action}</strong>
                        <small>${action.benefit}</small>
                    </li>
                `;
            });
            actionsHtml += `</ul></div>`;
        }

        // Seasonal strategy
        if (optimalActions.seasonalStrategy && optimalActions.seasonalStrategy.length > 0) {
            actionsHtml += `
                <div class="action-timeframe">
                    <h6>🗓️ Seasonal Strategy</h6>
                    <ul>
            `;
            optimalActions.seasonalStrategy.forEach(strategy => {
                actionsHtml += `<li class="strategy-item">${strategy}</li>`;
            });
            actionsHtml += `</ul></div>`;
        }

        actionsHtml += '</div>';
        actionsDiv.innerHTML = actionsHtml;
    }

    updateAnomaliesDisplay(anomalies) {
        const anomaliesDiv = document.getElementById('anomaliesAnalysis');
        if (!anomaliesDiv) return;

        if (anomalies.insufficient_data) {
            anomaliesDiv.innerHTML = '<p class="info-text">📊 Insufficient historical data for anomaly detection</p>';
            return;
        }

        if (!anomalies || anomalies.length === 0) {
            anomaliesDiv.innerHTML = '<p class="info-text">✅ No significant anomalies detected</p>';
            return;
        }

        let anomaliesHtml = '<div class="anomalies-list">';
        anomalies.forEach(anomaly => {
            anomaliesHtml += `
                <div class="anomaly-item severity-${anomaly.severity}">
                    <div class="anomaly-header">
                        <span class="anomaly-icon">${anomaly.severity === 'extreme' ? '🚨' : '⚠️'}</span>
                        <span class="anomaly-type">${anomaly.type.replace('_', ' ').toUpperCase()}</span>
                        <span class="anomaly-severity">${anomaly.severity}</span>
                    </div>
                    <div class="anomaly-description">${anomaly.description}</div>
                    <div class="anomaly-deviation">Deviation: ${anomaly.deviation}σ from historical mean</div>
                </div>
            `;
        });
        anomaliesHtml += '</div>';

        anomaliesDiv.innerHTML = anomaliesHtml;
    }

    updateSeasonalDisplay(seasonalPatterns) {
        const seasonalDiv = document.getElementById('seasonalPatterns');
        if (!seasonalDiv) return;

        if (seasonalPatterns.insufficient_data) {
            seasonalDiv.innerHTML = '<p class="info-text">📊 Insufficient historical data for seasonal analysis</p>';
            return;
        }

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let seasonalHtml = `
            <div class="seasonal-insights">
                <div class="seasonal-metric">
                    <span class="metric-label">🌱 Peak Growing Season:</span>
                    <span class="metric-value">${seasonalPatterns.seasonalTrends.peakGrowingSeason !== null ? monthNames[seasonalPatterns.seasonalTrends.peakGrowingSeason] : 'N/A'}</span>
                </div>
                <div class="seasonal-metric">
                    <span class="metric-label">☀️ Dry Season:</span>
                    <span class="metric-value">${seasonalPatterns.seasonalTrends.drySeason !== null ? monthNames[seasonalPatterns.seasonalTrends.drySeason] : 'N/A'}</span>
                </div>
                <div class="seasonal-metric">
                    <span class="metric-label">🌱 Optimal Planting:</span>
                    <span class="metric-value">${seasonalPatterns.seasonalTrends.optimalPlantingMonth !== null ? monthNames[seasonalPatterns.seasonalTrends.optimalPlantingMonth] : 'N/A'}</span>
                </div>
                <div class="seasonal-metric">
                    <span class="metric-label">🌾 Harvest Month:</span>
                    <span class="metric-value">${seasonalPatterns.seasonalTrends.harvestMonth !== null ? monthNames[seasonalPatterns.seasonalTrends.harvestMonth] : 'N/A'}</span>
                </div>
            </div>
        `;

        if (seasonalPatterns.recommendations && seasonalPatterns.recommendations.length > 0) {
            seasonalHtml += `
                <div class="seasonal-recommendations">
                    <h6>📋 Seasonal Recommendations</h6>
                    <ul>
            `;
            seasonalPatterns.recommendations.forEach(rec => {
                seasonalHtml += `
                    <li class="seasonal-rec category-${rec.category}">
                        <strong>${rec.action}</strong>
                        <small>${rec.benefit}</small>
                    </li>
                `;
            });
            seasonalHtml += `</ul></div>`;
        }

        seasonalDiv.innerHTML = seasonalHtml;
    }

    updateRecommendationsDisplay(recommendations) {
        const recDiv = document.getElementById('temporalRecommendations');
        if (!recDiv) return;

        if (!recommendations || recommendations.length === 0) {
            recDiv.innerHTML = '<p class="info-text">✅ No specific recommendations at this time</p>';
            return;
        }

        // Group recommendations by priority
        const grouped = recommendations.reduce((acc, rec) => {
            if (!acc[rec.priority]) acc[rec.priority] = [];
            acc[rec.priority].push(rec);
            return acc;
        }, {});

        let recHtml = '<div class="recommendations-groups">';

        // Display in priority order
        const priorities = ['critical', 'high', 'moderate', 'low'];
        priorities.forEach(priority => {
            if (grouped[priority]) {
                const priorityIcon = {
                    critical: '🚨',
                    high: '⚠️',
                    moderate: '💡',
                    low: 'ℹ️'
                }[priority];

                recHtml += `
                    <div class="recommendations-group priority-${priority}">
                        <h6>${priorityIcon} ${priority.toUpperCase()} Priority</h6>
                        <ul>
                `;

                grouped[priority].forEach(rec => {
                    recHtml += `
                        <li class="recommendation-item">
                            <div class="rec-action"><strong>${rec.action}</strong></div>
                            <div class="rec-timeframe"><small>⏰ ${rec.timeframe}</small></div>
                            <div class="rec-reason"><small>💬 ${rec.reason}</small></div>
                        </li>
                    `;
                });

                recHtml += `</ul></div>`;
            }
        });

        recHtml += '</div>';
        recDiv.innerHTML = recHtml;
    }

    loadSentinelDetailed() {
        // Could implement a detailed Sentinel-2 field analysis view
        console.log('Loading detailed Sentinel-2 analysis...');
    }

    updateStatus() {
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        document.getElementById('dataSources').textContent = '4/4';

        // Calculate overall quality
        if (this.fusionData) {
            const quality = this.fusionData.confidence > 0.8 ? 'Excellent' :
                           this.fusionData.confidence > 0.6 ? 'Good' :
                           this.fusionData.confidence > 0.4 ? 'Fair' : 'Poor';
            document.getElementById('overallQuality').textContent = quality;
        }
    }

    showLoading() {
        this.container.classList.add('loading');
    }

    hideLoading() {
        this.container.classList.remove('loading');
    }

    showError(error) {
        console.error('Dashboard error:', error);
        // Could show user-friendly error message
    }

    /**
     * Handle location picker change
     */
    handleLocationChange(value) {
        const customCoords = document.getElementById('customCoords');

        if (value === 'custom') {
            customCoords.style.display = 'flex';
            customCoords.style.gap = '8px';
            customCoords.style.alignItems = 'center';
        } else {
            customCoords.style.display = 'none';

            // Parse coordinates from selection
            const [lat, lon] = value.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lon)) {
                this.setLocation({ lat, lon });
                console.log(`🌍 Location changed to: ${lat}, ${lon}`);
            }
        }
    }

    /**
     * Apply custom location coordinates
     */
    applyCustomLocation() {
        const lat = parseFloat(document.getElementById('customLat').value);
        const lon = parseFloat(document.getElementById('customLon').value);

        if (isNaN(lat) || isNaN(lon)) {
            alert('Please enter valid latitude and longitude values');
            return;
        }

        if (lat < -90 || lat > 90) {
            alert('Latitude must be between -90 and 90');
            return;
        }

        if (lon < -180 || lon > 180) {
            alert('Longitude must be between -180 and 180');
            return;
        }

        this.setLocation({ lat, lon });
        console.log(`🎯 Custom location applied: ${lat}, ${lon}`);
    }

    /**
     * Export fusion report
     */
    exportFusionReport() {
        if (!this.fusionData) {
            alert('No fusion data available to export. Please load data first.');
            return;
        }

        const reportData = this.generateReportData();
        const reportHtml = this.generateReportHtml(reportData);

        // Create downloadable file
        const blob = new Blob([reportHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `fusion-report-${this.currentLocation.lat}-${this.currentLocation.lon}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📊 Fusion report exported');
    }

    /**
     * Generate report data
     */
    generateReportData() {
        const location = this.currentLocation;
        const fusion = this.fusionData;

        return {
            metadata: {
                location: `${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}°`,
                generatedAt: new Date().toISOString(),
                dataConfidence: (fusion.confidence * 100).toFixed(1) + '%'
            },
            metrics: {
                waterStressIndex: fusion.waterStressIndex.toFixed(1),
                vegetationStressIndex: fusion.vegetationStressIndex.toFixed(1),
                farmHealthScore: fusion.farmHealthScore.toFixed(1)
            },
            sensorData: {
                smap: {
                    soilMoisture: fusion.rawData.smap.soilMoisture.toFixed(3),
                    surfaceTemp: fusion.rawData.smap.surfaceTemperature.toFixed(1),
                    vegetationWater: fusion.rawData.smap.vegetationWaterContent.toFixed(2),
                    quality: fusion.rawData.smap.qualityFlag
                },
                modis: {
                    ndvi: fusion.rawData.modis.ndvi.toFixed(3),
                    evi: fusion.rawData.modis.evi.toFixed(3),
                    landSurfaceTemp: fusion.rawData.modis.landSurfaceTemp.toFixed(1),
                    pixelReliability: fusion.rawData.modis.pixelReliability
                }
            },
            alerts: fusion.alerts || [],
            edgeCases: this.analysisService.detectEdgeCases(fusion),
            recommendations: this.generateRecommendations(fusion)
        };
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations(fusionData) {
        const recommendations = [];

        // Water stress recommendations
        if (fusionData.waterStressIndex > 75) {
            recommendations.push({
                category: 'Water Management',
                priority: 'High',
                action: 'Immediate irrigation required',
                details: 'Critical water stress detected. Increase irrigation by 40-60%.'
            });
        } else if (fusionData.waterStressIndex > 50) {
            recommendations.push({
                category: 'Water Management',
                priority: 'Medium',
                action: 'Monitor and increase watering',
                details: 'Moderate water stress. Consider additional irrigation.'
            });
        }

        // Vegetation health recommendations
        if (fusionData.vegetationStressIndex > 70) {
            recommendations.push({
                category: 'Crop Health',
                priority: 'High',
                action: 'Investigate plant health issues',
                details: 'Poor vegetation health detected. Check for diseases, pests, or nutrient deficiencies.'
            });
        }

        // Farm health recommendations
        if (fusionData.farmHealthScore < 40) {
            recommendations.push({
                category: 'Overall Management',
                priority: 'Critical',
                action: 'Comprehensive farm review needed',
                details: 'Multiple issues detected. Review all farming operations and inputs.'
            });
        } else if (fusionData.farmHealthScore < 70) {
            recommendations.push({
                category: 'Overall Management',
                priority: 'Medium',
                action: 'Optimize farming practices',
                details: 'Farm performance could be improved. Focus on identified stress factors.'
            });
        }

        // Data confidence recommendations
        if (fusionData.confidence < 0.6) {
            recommendations.push({
                category: 'Data Quality',
                priority: 'Low',
                action: 'Verify data reliability',
                details: 'Low confidence in satellite data. Consider ground-truth verification.'
            });
        }

        return recommendations;
    }

    /**
     * Generate HTML report
     */
    generateReportHtml(data) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>NASA Sensor Fusion Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .report-container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .section { margin: 30px 0; }
        .section h3 { color: #222; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 20px; font-weight: 700; }
        .recommendation { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .recommendation.high { background: #ffebee; border-left-color: #f44336; }
        .recommendation.medium { background: #fff3e0; border-left-color: #ff9800; }
        .data-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .data-table th { background: #f2f2f2; }
        .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>🛰️ NASA Sensor Fusion Analysis Report</h1>
            <p><strong>Location:</strong> ${data.metadata.location}</p>
            <p><strong>Generated:</strong> ${new Date(data.metadata.generatedAt).toLocaleString()}</p>
            <p><strong>Data Confidence:</strong> ${data.metadata.dataConfidence}</p>
        </div>

        <div class="section">
            <h3>📊 Key Metrics</h3>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${data.metrics.waterStressIndex}</div>
                    <div>Water Stress Index</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${data.metrics.vegetationStressIndex}</div>
                    <div>Vegetation Stress</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${data.metrics.farmHealthScore}</div>
                    <div>Farm Health Score</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h3>🛰️ Satellite Data</h3>
            <h4>SMAP (Soil Moisture)</h4>
            <table class="data-table">
                <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                <tr><td>Soil Moisture</td><td>${data.sensorData.smap.soilMoisture}</td><td>m³/m³</td></tr>
                <tr><td>Surface Temperature</td><td>${data.sensorData.smap.surfaceTemp}</td><td>K</td></tr>
                <tr><td>Vegetation Water Content</td><td>${data.sensorData.smap.vegetationWater}</td><td>kg/m²</td></tr>
                <tr><td>Data Quality</td><td>${data.sensorData.smap.quality}</td><td>-</td></tr>
            </table>

            <h4>MODIS (Vegetation)</h4>
            <table class="data-table">
                <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                <tr><td>NDVI</td><td>${data.sensorData.modis.ndvi}</td><td>-</td></tr>
                <tr><td>EVI</td><td>${data.sensorData.modis.evi}</td><td>-</td></tr>
                <tr><td>Land Surface Temperature</td><td>${data.sensorData.modis.landSurfaceTemp}</td><td>K</td></tr>
                <tr><td>Pixel Reliability</td><td>${data.sensorData.modis.pixelReliability}</td><td>-</td></tr>
            </table>
        </div>

        ${data.recommendations.length > 0 ? `
        <div class="section">
            <h3>💡 Recommendations</h3>
            ${data.recommendations.map(rec => `
                <div class="recommendation ${rec.priority.toLowerCase()}">
                    <strong>${rec.category} - ${rec.priority} Priority</strong><br>
                    <strong>Action:</strong> ${rec.action}<br>
                    <strong>Details:</strong> ${rec.details}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.edgeCases.length > 0 ? `
        <div class="section">
            <h3>⚠️ Edge Cases Detected</h3>
            ${data.edgeCases.map(edge => `
                <div class="recommendation ${edge.severity.toLowerCase()}">
                    <strong>${edge.type.replace('_', ' ').toUpperCase()}</strong><br>
                    ${edge.description}<br>
                    <em>Recommendations: ${edge.recommendations.join(', ')}</em>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated by NASA Farm Navigators - Advanced Sensor Fusion Analysis</p>
            <p>Data sources: SMAP, MODIS, GPM, Sentinel-2 | NASA Space Apps Challenge 2025</p>
        </div>
    </div>
</body>
</html>`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedDataDashboard;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AdvancedDataDashboard = AdvancedDataDashboard;
}