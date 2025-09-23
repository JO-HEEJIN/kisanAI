/**
 * NASA Farm Navigators - Multi-Resolution Visualizer
 * Advanced visualization component for comparing satellite data at different resolutions
 * Demonstrates the impact of pixel size on agricultural monitoring
 */

import { EventSystem } from '../utils/EventSystem.js';

class MultiResolutionVisualizer {
    constructor(gameEngine) {
        // Accept gameEngine instead of container to match other components
        this.gameEngine = gameEngine;
        this.container = null; // Will be set when createInterface is called
        this.eventSystem = gameEngine ? gameEngine.getEventSystem() : EventSystem.getInstance();

        // Visualization state
        this.currentLocation = null; // Must be set by user
        this.currentDate = '2024-01-01';
        this.activeResolutions = ['30m', '250m', '9km', '11km'];
        this.comparisonMode = 'side-by-side'; // 'side-by-side', 'overlay', 'animated'

        // Data storage
        this.resolutionData = new Map();
        this.visualizationCache = new Map();

        // Canvas contexts for different visualizations
        this.canvases = new Map();

        // Animation state
        this.animationFrame = null;
        this.isAnimating = false;

        // Don't initialize immediately in case we're in Node.js environment
        this.isInitialized = false;
    }

    /**
     * Initialize the visualizer
     */
    initialize() {
        if (!this.container) {
            console.warn('Container not set, skipping initialization');
            return;
        }
        this.createVisualizationInterface();
        this.setupEventListeners();
        this.generateSampleData();
        this.isInitialized = true;
    }

    /**
     * Create interface - Main entry point for navigation system
     */
    async createInterface(container) {
        this.container = container;
        this.initialize();
        return this.container;
    }

    /**
     * Create the visualization interface
     */
    createVisualizationInterface() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="multi-res-visualizer">
                <div class="visualizer-header">
                    <h3>Multi-Resolution Satellite Comparison</h3>
                    <div class="controls">
                        <div class="location-controls">
                            <label>Location:</label>
                            <input type="number" id="latInput" value="${this.currentLocation.latitude}" step="0.001" placeholder="Latitude">
                            <input type="number" id="lonInput" value="${this.currentLocation.longitude}" step="0.001" placeholder="Longitude">
                            <button id="updateLocation">Update</button>
                        </div>

                        <div class="comparison-mode">
                            <label>View Mode:</label>
                            <select id="comparisonMode">
                                <option value="side-by-side">Side by Side</option>
                                <option value="overlay">Overlay</option>
                                <option value="animated">Animated Transition</option>
                            </select>
                        </div>

                        <div class="data-type">
                            <label>Data Type:</label>
                            <select id="dataType">
                                <option value="ndvi">NDVI (Vegetation)</option>
                                <option value="moisture">Soil Moisture</option>
                                <option value="temperature">Land Temperature</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="visualization-area" id="visualizationArea">
                    <!-- Dynamic content will be inserted here -->
                </div>

                <div class="resolution-info">
                    <div class="info-grid">
                        <div class="resolution-card" data-resolution="30m">
                            <h4>Landsat 30m</h4>
                            <div class="pixel-info">
                                <div class="pixel-size">30m × 30m</div>
                                <div class="coverage">0.09 hectares per pixel</div>
                                <div class="revisit">16 days</div>
                            </div>
                            <div class="capabilities">
                                <span class="capability">Individual trees</span>
                                <span class="capability">Field boundaries</span>
                                <span class="capability">Small buildings</span>
                            </div>
                        </div>

                        <div class="resolution-card" data-resolution="250m">
                            <h4>MODIS 250m</h4>
                            <div class="pixel-info">
                                <div class="pixel-size">250m × 250m</div>
                                <div class="coverage">6.25 hectares per pixel</div>
                                <div class="revisit">1-2 days</div>
                            </div>
                            <div class="capabilities">
                                <span class="capability">Large fields</span>
                                <span class="capability">Forest patches</span>
                                <span class="capability">Water bodies</span>
                            </div>
                        </div>

                        <div class="resolution-card" data-resolution="9km">
                            <h4>SMAP 9km</h4>
                            <div class="pixel-info">
                                <div class="pixel-size">9km × 9km</div>
                                <div class="coverage">8,100 hectares per pixel</div>
                                <div class="revisit">2-3 days</div>
                            </div>
                            <div class="capabilities">
                                <span class="capability">Regional patterns</span>
                                <span class="capability">Soil moisture</span>
                                <span class="capability">Climate zones</span>
                            </div>
                        </div>

                        <div class="resolution-card" data-resolution="11km">
                            <h4>GPM 11km</h4>
                            <div class="pixel-info">
                                <div class="pixel-size">11km × 11km</div>
                                <div class="coverage">12,100 hectares per pixel</div>
                                <div class="revisit">Every 3 hours</div>
                            </div>
                            <div class="capabilities">
                                <span class="capability">Precipitation</span>
                                <span class="capability">Weather systems</span>
                                <span class="capability">Regional climate</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="educational-insights">
                    <h4>📚 Educational Insights</h4>
                    <div id="insightContent" class="insight-content">
                        Select a comparison mode to see how different satellite resolutions reveal different aspects of the same agricultural area.
                    </div>
                </div>
            </div>
        `;

        this.setupVisualizationArea();
    }

    /**
     * Setup the main visualization area based on comparison mode
     */
    setupVisualizationArea() {
        const visualizationArea = document.getElementById('visualizationArea');

        switch (this.comparisonMode) {
            case 'side-by-side':
                this.createSideBySideView(visualizationArea);
                break;
            case 'overlay':
                this.createOverlayView(visualizationArea);
                break;
            case 'animated':
                this.createAnimatedView(visualizationArea);
                break;
        }
    }

    /**
     * Create side-by-side comparison view
     */
    createSideBySideView(container) {
        container.innerHTML = `
            <div class="side-by-side-container">
                ${this.activeResolutions.map(resolution => `
                    <div class="resolution-panel" data-resolution="${resolution}">
                        <div class="panel-header">
                            <h4>${this.getResolutionDisplayName(resolution)}</h4>
                            <div class="pixel-scale">${this.getPixelScale(resolution)}</div>
                        </div>
                        <canvas
                            id="canvas-${resolution}"
                            class="visualization-canvas"
                            width="300"
                            height="300">
                        </canvas>
                        <div class="data-info" id="info-${resolution}">
                            Loading data...
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Initialize canvases
        this.activeResolutions.forEach(resolution => {
            const canvas = document.getElementById(`canvas-${resolution}`);
            this.canvases.set(resolution, canvas.getContext('2d'));
        });

        this.renderSideBySideData();
    }

    /**
     * Create overlay comparison view
     */
    createOverlayView(container) {
        container.innerHTML = `
            <div class="overlay-container">
                <div class="main-canvas-container">
                    <canvas id="overlayCanvas" width="600" height="600"></canvas>
                    <div class="overlay-controls">
                        <div class="resolution-toggles">
                            ${this.activeResolutions.map(resolution => `
                                <label class="resolution-toggle">
                                    <input type="checkbox" data-resolution="${resolution}" checked>
                                    <span>${this.getResolutionDisplayName(resolution)}</span>
                                </label>
                            `).join('')}
                        </div>
                        <div class="opacity-control">
                            <label>Layer Opacity:</label>
                            <input type="range" id="opacitySlider" min="0" max="100" value="70">
                        </div>
                    </div>
                </div>
                <div class="overlay-legend">
                    <h4>Layer Legend</h4>
                    <div id="overlayLegend" class="legend-content"></div>
                </div>
            </div>
        `;

        const canvas = document.getElementById('overlayCanvas');
        this.canvases.set('overlay', canvas.getContext('2d'));
        this.renderOverlayData();
    }

    /**
     * Create animated transition view
     */
    createAnimatedView(container) {
        container.innerHTML = `
            <div class="animated-container">
                <div class="main-animation-area">
                    <canvas id="animationCanvas" width="600" height="600"></canvas>
                    <div class="animation-info">
                        <div id="currentResolution" class="current-resolution">
                            Current: Landsat 30m
                        </div>
                        <div class="zoom-indicator">
                            <div class="zoom-bar">
                                <div id="zoomProgress" class="zoom-progress"></div>
                            </div>
                            <div class="zoom-labels">
                                <span>High Detail</span>
                                <span>Regional View</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="animation-controls">
                    <button id="playAnimation" class="control-btn">
                        ▶️ Play Resolution Animation
                    </button>
                    <button id="pauseAnimation" class="control-btn" disabled>
                        Pause
                    </button>
                    <button id="resetAnimation" class="control-btn">
                        Reset
                    </button>
                    <div class="speed-control">
                        <label>Speed:</label>
                        <input type="range" id="animationSpeed" min="1" max="5" value="2">
                    </div>
                </div>
            </div>
        `;

        const canvas = document.getElementById('animationCanvas');
        this.canvases.set('animation', canvas.getContext('2d'));
        this.setupAnimationControls();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Location update
        document.getElementById('updateLocation')?.addEventListener('click', () => {
            this.updateLocation();
        });

        // Comparison mode change
        document.getElementById('comparisonMode')?.addEventListener('change', (e) => {
            this.comparisonMode = e.target.value;
            this.setupVisualizationArea();
        });

        // Data type change
        document.getElementById('dataType')?.addEventListener('change', (e) => {
            this.refreshVisualization();
        });
    }

    /**
     * Generate sample data for different resolutions
     */
    generateSampleData() {
        const dataTypes = ['ndvi', 'moisture', 'temperature'];

        this.activeResolutions.forEach(resolution => {
            const data = new Map();

            dataTypes.forEach(dataType => {
                data.set(dataType, this.generateResolutionSpecificData(resolution, dataType));
            });

            this.resolutionData.set(resolution, data);
        });
    }

    /**
     * Generate resolution-specific sample data
     */
    generateResolutionSpecificData(resolution, dataType) {
        const pixelSize = this.getPixelSizeMeters(resolution);
        const gridSize = Math.min(20, Math.max(5, 1000 / pixelSize)); // Adaptive grid size

        const data = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                let value;

                switch (dataType) {
                    case 'ndvi':
                        // Simulate vegetation patterns
                        value = 0.3 + 0.5 * (Math.sin(i * 0.3) + Math.cos(j * 0.3)) / 2;
                        break;
                    case 'moisture':
                        // Simulate soil moisture patterns
                        value = 0.2 + 0.3 * Math.random();
                        break;
                    case 'temperature':
                        // Simulate temperature patterns
                        value = 20 + 15 * Math.random();
                        break;
                    default:
                        value = Math.random();
                }

                data.push({
                    x: i,
                    y: j,
                    value: value,
                    pixelSize: pixelSize
                });
            }
        }

        return {
            gridSize: gridSize,
            data: data,
            statistics: this.calculateStatistics(data)
        };
    }

    /**
     * Render side-by-side comparison data
     */
    renderSideBySideData() {
        const dataType = document.getElementById('dataType')?.value || 'ndvi';

        this.activeResolutions.forEach(resolution => {
            const canvas = this.canvases.get(resolution);
            const data = this.resolutionData.get(resolution)?.get(dataType);

            if (canvas && data) {
                this.renderDataToCanvas(canvas, data, resolution, dataType);
                this.updateDataInfo(resolution, data);
            }
        });

        this.updateEducationalInsights();
    }

    /**
     * Render data to a specific canvas
     */
    renderDataToCanvas(ctx, data, resolution, dataType) {
        const canvasSize = 300;
        const pixelSize = canvasSize / data.gridSize;

        ctx.clearRect(0, 0, canvasSize, canvasSize);

        data.data.forEach(point => {
            const color = this.getColorForDataType(point.value, dataType);
            ctx.fillStyle = color;
            ctx.fillRect(
                point.x * pixelSize,
                point.y * pixelSize,
                pixelSize,
                pixelSize
            );
        });

        // Add pixel grid for high resolution
        if (resolution === '30m') {
            this.drawPixelGrid(ctx, data.gridSize, canvasSize);
        }
    }

    /**
     * Draw pixel grid overlay
     */
    drawPixelGrid(ctx, gridSize, canvasSize) {
        const pixelSize = canvasSize / gridSize;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 0.5;

        for (let i = 0; i <= gridSize; i++) {
            const pos = i * pixelSize;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, canvasSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(canvasSize, pos);
            ctx.stroke();
        }
    }

    /**
     * Get color for data type and value
     */
    getColorForDataType(value, dataType) {
        switch (dataType) {
            case 'ndvi':
                // Green scale for vegetation
                const green = Math.floor(255 * Math.max(0, Math.min(1, value)));
                return `rgb(${255 - green}, ${green}, 0)`;

            case 'moisture':
                // Blue scale for moisture
                const blue = Math.floor(255 * Math.max(0, Math.min(1, value)));
                return `rgb(${255 - blue}, ${255 - blue/2}, 255)`;

            case 'temperature':
                // Red-blue scale for temperature
                const normalized = (value - 20) / 15; // Normalize to 0-1
                const red = Math.floor(255 * Math.max(0, Math.min(1, normalized)));
                const blueTemp = Math.floor(255 * Math.max(0, Math.min(1, 1 - normalized)));
                return `rgb(${red}, 0, ${blueTemp})`;

            default:
                return `rgb(${Math.floor(255 * value)}, ${Math.floor(255 * value)}, ${Math.floor(255 * value)})`;
        }
    }

    /**
     * Update data information display
     */
    updateDataInfo(resolution, data) {
        const infoElement = document.getElementById(`info-${resolution}`);
        if (infoElement && data.statistics) {
            infoElement.innerHTML = `
                <div class="stat-row">
                    <span>Avg:</span>
                    <span>${data.statistics.mean.toFixed(3)}</span>
                </div>
                <div class="stat-row">
                    <span>Min:</span>
                    <span>${data.statistics.min.toFixed(3)}</span>
                </div>
                <div class="stat-row">
                    <span>Max:</span>
                    <span>${data.statistics.max.toFixed(3)}</span>
                </div>
                <div class="stat-row">
                    <span>Pixels:</span>
                    <span>${data.data.length}</span>
                </div>
            `;
        }
    }

    /**
     * Update educational insights
     */
    updateEducationalInsights() {
        const insightElement = document.getElementById('insightContent');
        const dataType = document.getElementById('dataType')?.value || 'ndvi';

        const insights = this.generateEducationalInsights(dataType);

        if (insightElement) {
            insightElement.innerHTML = `
                <div class="insight-section">
                    <h5>Key Observations:</h5>
                    <ul>
                        ${insights.observations.map(obs => `<li>${obs}</li>`).join('')}
                    </ul>
                </div>
                <div class="insight-section">
                    <h5>💡 Educational Points:</h5>
                    <ul>
                        ${insights.educational.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
                <div class="insight-section">
                    <h5>🚜 Agricultural Applications:</h5>
                    <ul>
                        ${insights.applications.map(app => `<li>${app}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    /**
     * Generate educational insights for the current comparison
     */
    generateEducationalInsights(dataType) {
        const insights = {
            observations: [],
            educational: [],
            applications: []
        };

        switch (dataType) {
            case 'ndvi':
                insights.observations = [
                    'Landsat 30m shows individual field boundaries and crop rows',
                    'MODIS 250m provides regional vegetation patterns',
                    'SMAP 9km captures landscape-scale vegetation health'
                ];
                insights.educational = [
                    'Higher resolution = more detail but smaller coverage area',
                    'Each pixel represents a different ground area',
                    'Resolution choice depends on your monitoring goals'
                ];
                insights.applications = [
                    'Use Landsat for precision field management',
                    'Use MODIS for regional crop condition monitoring',
                    'Use SMAP for landscape-scale agricultural planning'
                ];
                break;

            case 'moisture':
                insights.observations = [
                    'SMAP provides regional soil moisture patterns',
                    'Higher resolution shows more spatial variation',
                    'Different sensors complement each other'
                ];
                insights.educational = [
                    'Soil moisture varies at multiple spatial scales',
                    'Satellite resolution affects irrigation planning accuracy',
                    'Regional data helps understand larger weather patterns'
                ];
                insights.applications = [
                    'Use high resolution for field-specific irrigation',
                    'Use low resolution for drought monitoring',
                    'Combine resolutions for comprehensive moisture assessment'
                ];
                break;

            case 'temperature':
                insights.observations = [
                    'Temperature patterns vary by resolution',
                    'Local features create temperature variations',
                    'Regional climate patterns emerge at coarser resolutions'
                ];
                insights.educational = [
                    'Land surface temperature affects crop growth',
                    'Resolution impacts temperature measurement accuracy',
                    'Thermal patterns help identify crop stress'
                ];
                insights.applications = [
                    'Monitor crop stress with temperature data',
                    'Plan planting dates using thermal patterns',
                    'Assess irrigation effectiveness'
                ];
                break;
        }

        return insights;
    }

    /**
     * Helper methods
     */
    getResolutionDisplayName(resolution) {
        const names = {
            '30m': 'Landsat 30m',
            '250m': 'MODIS 250m',
            '9km': 'SMAP 9km',
            '11km': 'GPM 11km'
        };
        return names[resolution] || resolution;
    }

    getPixelScale(resolution) {
        const scales = {
            '30m': '30m × 30m (0.09 ha)',
            '250m': '250m × 250m (6.25 ha)',
            '9km': '9km × 9km (8,100 ha)',
            '11km': '11km × 11km (12,100 ha)'
        };
        return scales[resolution] || resolution;
    }

    getPixelSizeMeters(resolution) {
        const sizes = {
            '30m': 30,
            '250m': 250,
            '9km': 9000,
            '11km': 11000
        };
        return sizes[resolution] || 1000;
    }

    calculateStatistics(data) {
        const values = data.map(point => point.value);
        return {
            mean: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length
        };
    }

    updateLocation() {
        const lat = parseFloat(document.getElementById('latInput').value);
        const lon = parseFloat(document.getElementById('lonInput').value);

        if (!isNaN(lat) && !isNaN(lon)) {
            this.currentLocation = { latitude: lat, longitude: lon };
            this.generateSampleData(); // Regenerate data for new location
            this.refreshVisualization();
        }
    }

    refreshVisualization() {
        this.setupVisualizationArea();
    }

    /**
     * Animation control methods
     */
    setupAnimationControls() {
        document.getElementById('playAnimation')?.addEventListener('click', () => {
            this.startAnimation();
        });

        document.getElementById('pauseAnimation')?.addEventListener('click', () => {
            this.pauseAnimation();
        });

        document.getElementById('resetAnimation')?.addEventListener('click', () => {
            this.resetAnimation();
        });
    }

    startAnimation() {
        this.isAnimating = true;
        document.getElementById('playAnimation').disabled = true;
        document.getElementById('pauseAnimation').disabled = false;

        this.animateResolutionTransition();
    }

    pauseAnimation() {
        this.isAnimating = false;
        document.getElementById('playAnimation').disabled = false;
        document.getElementById('pauseAnimation').disabled = true;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    resetAnimation() {
        this.pauseAnimation();
        // Reset to initial state
        this.renderSideBySideData();
    }

    animateResolutionTransition() {
        // Implementation for smooth resolution transitions
        if (this.isAnimating) {
            this.animationFrame = requestAnimationFrame(() => {
                this.animateResolutionTransition();
            });
        }
    }
}

export { MultiResolutionVisualizer };