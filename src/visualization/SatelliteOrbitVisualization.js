/**
 * NASA Farm Navigators - Satellite Orbit Visualization
 * 3D visualization of NASA satellite orbits and pass predictions
 * Educational tool to understand satellite coverage and timing
 */

import { EventSystem } from '../utils/EventSystem.js';

class SatelliteOrbitVisualization {
    constructor(gameEngine) {
        // Accept gameEngine instead of container to match other components
        this.gameEngine = gameEngine;
        this.container = null; // Will be set when createInterface is called
        this.eventSystem = gameEngine ? gameEngine.getEventSystem() : EventSystem.getInstance();

        // Canvas and rendering context
        this.canvas = null;
        this.ctx = null;

        // Visualization state
        this.isAnimating = false;
        this.animationFrame = null;
        this.currentTime = Date.now();
        this.timeSpeed = 1; // Real-time multiplier

        // User location (default to Arizona farm location)
        this.userLocation = {
            latitude: 33.4484,
            longitude: -112.0740,
            name: 'Phoenix, Arizona (Farm Location)',
            elevation: 331 // meters above sea level
        };

        // Pass prediction cache
        this.passPredictionCache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes

        // Satellite constellation data
        this.satellites = {
            'SMAP': {
                name: 'SMAP (Soil Moisture)',
                altitude: 685, // km
                inclination: 98.1, // degrees
                period: 98.5, // minutes
                color: '#2196F3',
                description: 'Soil moisture monitoring every 2-3 days',
                dataProducts: ['L3 Surface Moisture', 'L4 Root Zone Moisture'],
                resolution: '9km',
                revisitTime: '2-3 days'
            },
            'LANDSAT8': {
                name: 'Landsat 8 (Optical)',
                altitude: 705,
                inclination: 98.2,
                period: 99.0,
                color: '#4CAF50',
                description: 'High-resolution optical imagery every 16 days',
                dataProducts: ['True Color', 'NDVI', 'Land Surface Temperature'],
                resolution: '30m',
                revisitTime: '16 days'
            },
            'TERRA': {
                name: 'Terra (MODIS)',
                altitude: 705,
                inclination: 98.2,
                period: 98.9,
                color: '#FF9800',
                description: 'Daily global vegetation monitoring',
                dataProducts: ['NDVI', 'EVI', 'Land Surface Temperature'],
                resolution: '250m',
                revisitTime: '1-2 days'
            },
            'AQUA': {
                name: 'Aqua (MODIS)',
                altitude: 705,
                inclination: 98.2,
                period: 98.9,
                color: '#00BCD4',
                description: 'Afternoon overpass for vegetation monitoring',
                dataProducts: ['NDVI', 'EVI', 'Sea Surface Temperature'],
                resolution: '250m',
                revisitTime: '1-2 days'
            },
            'GPM': {
                name: 'GPM (Precipitation)',
                altitude: 407,
                inclination: 65.0,
                period: 92.8,
                color: '#9C27B0',
                description: 'Global precipitation monitoring',
                dataProducts: ['Precipitation Rate', 'Snow Water Equivalent'],
                resolution: '11km',
                revisitTime: 'Every 3 hours'
            }
        };

        // Orbit calculation parameters
        this.earthRadius = 6371; // km
        this.projectionCenter = { x: 0, y: 0 };
        this.projectionScale = 1;

        // UI state
        this.selectedSatellite = null;
        this.showPasses = true;
        this.show3D = false;

        // Don't initialize immediately in case we're in Node.js environment
        this.isInitialized = false;
    }

    /**
     * Initialize the orbit visualization
     */
    initialize() {
        if (!this.container) {
            console.warn('Container not set, skipping initialization');
            return;
        }
        this.createVisualizationInterface();
        this.setupEventListeners();
        this.startAnimation();
        this.isInitialized = true;
    }

    /**
     * Create interface - Main entry point for navigation system
     */
    async createInterface(container) {
        this.container = container;
        this.initialize();

        // Initialize real-time data after interface is created
        setTimeout(() => {
            this.initializeRealTimeData().catch(err => {
                console.warn('Real-time satellite data initialization failed:', err);
            });
        }, 1000);

        return this.container;
    }

    /**
     * Create the visualization interface
     */
    createVisualizationInterface() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="orbit-visualization">
                <div class="orbit-header">
                    <h3>NASA Satellite Orbits & Pass Predictions</h3>
                    <div class="orbit-controls">
                        <div class="location-control">
                            <label>Location:</label>
                            <input type="text" id="locationName" value="${this.userLocation.name}" placeholder="Location name">
                            <input type="number" id="userLat" value="${this.userLocation.latitude}" step="0.001" placeholder="Latitude">
                            <input type="number" id="userLon" value="${this.userLocation.longitude}" step="0.001" placeholder="Longitude">
                            <button id="updateLocation">Update</button>
                        </div>

                        <div class="time-control">
                            <label>Time:</label>
                            <button id="pauseTime">⏸️</button>
                            <button id="playTime">▶️</button>
                            <button id="resetTime">🔄</button>
                            <select id="timeSpeed">
                                <option value="1">Real Time</option>
                                <option value="60">1 min/sec</option>
                                <option value="3600">1 hour/sec</option>
                                <option value="86400">1 day/sec</option>
                            </select>
                        </div>

                        <div class="view-control">
                            <label class="view-toggle">
                                <input type="checkbox" id="show3D">
                                3D View
                            </label>
                            <label class="view-toggle">
                                <input type="checkbox" id="showPasses" checked>
                                Show Passes
                            </label>
                        </div>
                    </div>
                </div>

                <div class="orbit-content">
                    <div class="orbit-display">
                        <canvas id="orbitCanvas" width="800" height="600"></canvas>
                        <div class="current-time" id="currentTime">
                            Current Time: ${new Date().toLocaleString()}
                        </div>
                    </div>

                    <div class="satellite-panel">
                        <h4>Satellite Constellation</h4>
                        <div class="satellite-list" id="satelliteList">
                            ${Object.entries(this.satellites).map(([id, sat]) => `
                                <div class="satellite-item" data-satellite="${id}">
                                    <div class="satellite-header">
                                        <div class="satellite-indicator" style="background-color: ${sat.color}"></div>
                                        <h5>${sat.name}</h5>
                                        <div class="satellite-status" id="status-${id}">
                                            <span class="visibility-indicator">●</span>
                                        </div>
                                    </div>
                                    <div class="satellite-info">
                                        <div class="info-row">
                                            <span>Altitude:</span>
                                            <span>${sat.altitude} km</span>
                                        </div>
                                        <div class="info-row">
                                            <span>Period:</span>
                                            <span>${sat.period} min</span>
                                        </div>
                                        <div class="info-row">
                                            <span>Resolution:</span>
                                            <span>${sat.resolution}</span>
                                        </div>
                                        <div class="info-row">
                                            <span>Revisit:</span>
                                            <span>${sat.revisitTime}</span>
                                        </div>
                                    </div>
                                    <div class="satellite-description">
                                        ${sat.description}
                                    </div>
                                    <div class="next-pass" id="nextPass-${id}">
                                        <strong>Next Pass:</strong> Calculating...
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="pass-predictions">
                    <h4>Upcoming Satellite Passes</h4>
                    <div class="prediction-controls">
                        <label>Time Range:</label>
                        <select id="predictionRange">
                            <option value="24">Next 24 hours</option>
                            <option value="72">Next 3 days</option>
                            <option value="168">Next week</option>
                        </select>
                        <button id="refreshPredictions">Refresh</button>
                    </div>
                    <div class="prediction-table" id="predictionTable">
                        <!-- Pass predictions will be populated here -->
                    </div>
                </div>

                <div class="educational-content">
                    <h4>📚 Understanding Satellite Orbits</h4>
                    <div class="education-tabs">
                        <button class="edu-tab active" data-tab="basics">Orbit Basics</button>
                        <button class="edu-tab" data-tab="coverage">Coverage Patterns</button>
                        <button class="edu-tab" data-tab="timing">Data Timing</button>
                        <button class="edu-tab" data-tab="applications">Applications</button>
                    </div>
                    <div class="education-content" id="educationContent">
                        ${this.getEducationalContent('basics')}
                    </div>
                </div>
            </div>
        `;

        // Initialize canvas
        this.canvas = document.getElementById('orbitCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set up initial projection
        this.setupProjection();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Location update
        document.getElementById('updateLocation')?.addEventListener('click', () => {
            this.updateUserLocation();
        });

        // Time controls
        document.getElementById('pauseTime')?.addEventListener('click', () => {
            this.isAnimating = false;
        });

        document.getElementById('playTime')?.addEventListener('click', () => {
            this.isAnimating = true;
            this.animate();
        });

        document.getElementById('resetTime')?.addEventListener('click', () => {
            this.currentTime = Date.now();
        });

        document.getElementById('timeSpeed')?.addEventListener('change', (e) => {
            this.timeSpeed = parseInt(e.target.value);
        });

        // View controls
        document.getElementById('show3D')?.addEventListener('change', (e) => {
            this.show3D = e.target.checked;
            this.setupProjection();
        });

        document.getElementById('showPasses')?.addEventListener('change', (e) => {
            this.showPasses = e.target.checked;
        });

        // Satellite selection
        document.querySelectorAll('.satellite-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const satelliteId = e.currentTarget.dataset.satellite;
                this.selectSatellite(satelliteId);
            });
        });

        // Educational tabs
        document.querySelectorAll('.edu-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.showEducationalTab(tabId);
            });
        });

        // Prediction controls
        document.getElementById('refreshPredictions')?.addEventListener('click', () => {
            this.updatePassPredictions();
        });

        document.getElementById('predictionRange')?.addEventListener('change', () => {
            this.updatePassPredictions();
        });
    }

    /**
     * Setup projection for rendering
     */
    setupProjection() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        if (this.show3D) {
            // 3D isometric projection
            this.projectionCenter = { x: canvasWidth / 2, y: canvasHeight / 2 };
            this.projectionScale = Math.min(canvasWidth, canvasHeight) / 4;
        } else {
            // 2D world map projection
            this.projectionCenter = { x: canvasWidth / 2, y: canvasHeight / 2 };
            this.projectionScale = canvasWidth / (2 * Math.PI);
        }
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        this.isAnimating = true;
        this.animate();
    }

    /**
     * Main animation loop
     */
    animate() {
        if (!this.isAnimating) return;

        // Update current time
        this.currentTime += (1000 / 60) * this.timeSpeed; // 60 FPS simulation

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render Earth
        this.renderEarth();

        // Render satellite orbits and positions
        this.renderSatelliteOrbits();

        // Render user location
        this.renderUserLocation();

        // Update satellite status displays
        this.updateSatelliteStatuses();

        // Update time display
        this.updateTimeDisplay();

        // Continue animation
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Render Earth
     */
    renderEarth() {
        const ctx = this.ctx;
        const center = this.projectionCenter;

        if (this.show3D) {
            // 3D sphere representation
            const radius = this.projectionScale * 0.8;

            // Earth sphere
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#4A90E2';
            ctx.fill();

            // Continents (simplified)
            ctx.fillStyle = '#228B22';
            this.renderSimplifiedContinents(center, radius);

            // Atmosphere glow
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius * 1.1, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(135, 206, 235, 0.3)';
            ctx.lineWidth = 10;
            ctx.stroke();

        } else {
            // 2D world map
            this.renderWorldMap();
        }

        // Render user location marker
        this.renderLocationMarker();
    }

    /**
     * Render simplified world map
     */
    renderWorldMap() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Ocean background
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(0, 0, width, height);

        // Simplified continents
        ctx.fillStyle = '#228B22';

        // Very simplified continent shapes for demonstration
        const continents = [
            // North America
            { x: width * 0.2, y: height * 0.3, w: width * 0.15, h: height * 0.2 },
            // South America
            { x: width * 0.25, y: height * 0.55, w: width * 0.08, h: height * 0.25 },
            // Europe
            { x: width * 0.48, y: height * 0.25, w: width * 0.08, h: height * 0.12 },
            // Africa
            { x: width * 0.52, y: height * 0.35, w: width * 0.1, h: height * 0.25 },
            // Asia
            { x: width * 0.6, y: height * 0.2, w: width * 0.2, h: height * 0.25 },
            // Australia
            { x: width * 0.75, y: height * 0.65, w: width * 0.08, h: height * 0.08 }
        ];

        continents.forEach(continent => {
            ctx.fillRect(continent.x, continent.y, continent.w, continent.h);
        });

        // Grid lines for latitude/longitude
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;

        // Latitude lines
        for (let lat = -90; lat <= 90; lat += 30) {
            const y = this.latToY(lat);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Longitude lines
        for (let lon = -180; lon <= 180; lon += 45) {
            const x = this.lonToX(lon);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }

    /**
     * Render satellite orbits and current positions
     */
    renderSatelliteOrbits() {
        Object.entries(this.satellites).forEach(([id, satellite]) => {
            if (this.selectedSatellite && this.selectedSatellite !== id) {
                return; // Only show selected satellite if one is selected
            }

            this.renderSatelliteOrbit(id, satellite);
            this.renderSatellitePosition(id, satellite);

            if (this.showPasses) {
                this.renderVisibilityArea(id, satellite);
            }
        });
    }

    /**
     * Render a single satellite orbit
     */
    renderSatelliteOrbit(id, satellite) {
        const ctx = this.ctx;

        if (this.show3D) {
            this.renderOrbit3D(satellite);
        } else {
            this.renderOrbit2D(satellite);
        }
    }

    /**
     * Render orbit in 2D
     */
    renderOrbit2D(satellite) {
        const ctx = this.ctx;
        const numPoints = 100;

        ctx.strokeStyle = satellite.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();

        for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const pos = this.calculateSatellitePosition(satellite, this.currentTime + i * 1000);

            const x = this.lonToX(pos.longitude);
            const y = this.latToY(pos.latitude);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Render current satellite position
     */
    renderSatellitePosition(id, satellite) {
        const position = this.calculateSatellitePosition(satellite, this.currentTime);
        const ctx = this.ctx;

        let x, y;

        if (this.show3D) {
            const coords = this.project3D(position.latitude, position.longitude, satellite.altitude);
            x = coords.x;
            y = coords.y;
        } else {
            x = this.lonToX(position.longitude);
            y = this.latToY(position.latitude);
        }

        // Satellite icon
        ctx.fillStyle = satellite.color;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Satellite label
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(satellite.name, x + 12, y - 8);

        // Visibility indicator
        const isVisible = this.isSatelliteVisible(position, this.userLocation);
        if (isVisible) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    /**
     * Calculate satellite position at given time
     */
    calculateSatellitePosition(satellite, time) {
        // Time since epoch in minutes
        const timeMinutes = (time - satellite.epoch) / (1000 * 60);

        // Mean motion in radians per minute
        const meanMotion = (2 * Math.PI) / satellite.period;

        // Current mean anomaly
        const currentMeanAnomaly = satellite.meanAnomaly + (meanMotion * timeMinutes * 180 / Math.PI);
        const meanAnomalyRad = (currentMeanAnomaly % 360) * Math.PI / 180;

        // Solve Kepler's equation for eccentric anomaly (simplified for low eccentricity)
        let eccentricAnomaly = meanAnomalyRad;
        for (let i = 0; i < 5; i++) {
            eccentricAnomaly = meanAnomalyRad + satellite.eccentricity * Math.sin(eccentricAnomaly);
        }

        // True anomaly
        const trueAnomaly = 2 * Math.atan2(
            Math.sqrt(1 + satellite.eccentricity) * Math.sin(eccentricAnomaly / 2),
            Math.sqrt(1 - satellite.eccentricity) * Math.cos(eccentricAnomaly / 2)
        );

        // Distance from Earth's center
        const radius = satellite.altitude + this.earthRadius;

        // Position in orbital plane
        const x_orbit = radius * Math.cos(trueAnomaly);
        const y_orbit = radius * Math.sin(trueAnomaly);

        // Convert to Earth-centered coordinates
        const inclination = satellite.inclination * Math.PI / 180;
        const raan = satellite.raan * Math.PI / 180;
        const argPerigee = satellite.argPerigee * Math.PI / 180;

        // Rotate by argument of perigee
        const x_perigee = x_orbit * Math.cos(argPerigee) - y_orbit * Math.sin(argPerigee);
        const y_perigee = x_orbit * Math.sin(argPerigee) + y_orbit * Math.cos(argPerigee);

        // Rotate by inclination and RAAN
        const x_ecef = x_perigee * Math.cos(raan) - y_perigee * Math.cos(inclination) * Math.sin(raan);
        const y_ecef = x_perigee * Math.sin(raan) + y_perigee * Math.cos(inclination) * Math.cos(raan);
        const z_ecef = y_perigee * Math.sin(inclination);

        // Convert to latitude and longitude
        const longitude = Math.atan2(y_ecef, x_ecef) * 180 / Math.PI;
        const latitude = Math.asin(z_ecef / radius) * 180 / Math.PI;

        return {
            latitude: latitude,
            longitude: longitude,
            altitude: satellite.altitude,
            time: time,
            x: x_ecef,
            y: y_ecef,
            z: z_ecef
        };
    }

    /**
     * Check if satellite is visible from user location
     */
    isSatelliteVisible(satPosition, userLocation) {
        // Calculate elevation angle above horizon
        const elevation = this.calculateElevation(satPosition, userLocation);

        // Minimum elevation for visibility (typically 10-15 degrees)
        const minElevation = 10; // degrees
        return elevation >= minElevation;
    }

    /**
     * Render user location
     */
    renderUserLocation() {
        const ctx = this.ctx;
        let x, y;

        if (this.show3D) {
            const coords = this.project3D(this.userLocation.latitude, this.userLocation.longitude, 0);
            x = coords.x;
            y = coords.y;
        } else {
            x = this.lonToX(this.userLocation.longitude);
            y = this.latToY(this.userLocation.latitude);
        }

        // Location marker
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Location label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(this.userLocation.name, x + 10, y - 10);
    }

    /**
     * Update satellite status displays
     */
    updateSatelliteStatuses() {
        Object.entries(this.satellites).forEach(([id, satellite]) => {
            const statusElement = document.getElementById(`status-${id}`);
            const nextPassElement = document.getElementById(`nextPass-${id}`);

            if (statusElement) {
                const position = this.calculateSatellitePosition(satellite, this.currentTime);
                const isVisible = this.isSatelliteVisible(position, this.userLocation);

                const indicator = statusElement.querySelector('.visibility-indicator');
                if (indicator) {
                    indicator.style.color = isVisible ? '#4CAF50' : '#757575';
                    indicator.title = isVisible ? 'Currently visible' : 'Below horizon';
                }
            }

            if (nextPassElement) {
                const nextPass = this.calculateNextPass(satellite);
                nextPassElement.innerHTML = `<strong>Next Pass:</strong> ${nextPass}`;
            }
        });
    }

    /**
     * Calculate next satellite pass with orbital mechanics
     */
    calculateNextPass(satellite) {
        const currentPosition = this.calculateSatellitePosition(satellite, this.currentTime);
        const isCurrentlyVisible = this.isSatelliteVisible(currentPosition, this.userLocation);

        if (isCurrentlyVisible) {
            // Calculate how long satellite will remain visible
            const passEnd = this.calculatePassEndTime(satellite, this.currentTime);
            const duration = Math.round((passEnd - this.currentTime) / 60000); // minutes
            return `Currently visible (${duration}m remaining)`;
        }

        // Calculate next pass using orbital mechanics
        const nextPass = this.findNextPass(satellite, this.currentTime);
        if (nextPass) {
            const timeStr = nextPass.startTime.toLocaleString('en-US', {
                month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            return `${timeStr} (${nextPass.maxElevation}° elev, ${nextPass.duration}m)`;
        }

        return 'Pass calculation unavailable';
    }

    /**
     * Find next satellite pass with detailed predictions
     */
    findNextPass(satellite, fromTime) {
        const timeStep = 60000; // 1 minute steps
        const maxSearchTime = 24 * 60 * 60 * 1000; // 24 hours
        let searchTime = fromTime;
        let passStart = null;
        let maxElevation = 0;
        let wasVisible = false;

        while (searchTime < fromTime + maxSearchTime) {
            const position = this.calculateSatellitePosition(satellite, searchTime);
            const isVisible = this.isSatelliteVisible(position, this.userLocation);
            const elevation = this.calculateElevation(position, this.userLocation);

            if (isVisible && !wasVisible) {
                // Pass begins
                passStart = new Date(searchTime);
                maxElevation = elevation;
            } else if (isVisible) {
                // During pass - track maximum elevation
                maxElevation = Math.max(maxElevation, elevation);
            } else if (!isVisible && wasVisible) {
                // Pass ends
                const duration = Math.round((searchTime - passStart.getTime()) / 60000);
                return {
                    startTime: passStart,
                    endTime: new Date(searchTime),
                    duration: duration,
                    maxElevation: Math.round(maxElevation)
                };
            }

            wasVisible = isVisible;
            searchTime += timeStep;
        }

        return null; // No pass found in search window
    }

    /**
     * Calculate when current pass will end
     */
    calculatePassEndTime(satellite, fromTime) {
        const timeStep = 60000; // 1 minute steps
        let searchTime = fromTime;

        while (searchTime < fromTime + 30 * 60 * 1000) { // Search up to 30 minutes ahead
            const position = this.calculateSatellitePosition(satellite, searchTime);
            if (!this.isSatelliteVisible(position, this.userLocation)) {
                return searchTime;
            }
            searchTime += timeStep;
        }

        return fromTime + 15 * 60 * 1000; // Default to 15 minutes if not found
    }

    /**
     * Calculate elevation angle above horizon
     */
    calculateElevation(satPosition, userLocation) {
        // Convert to radians
        const satLat = (satPosition.latitude * Math.PI) / 180;
        const satLon = (satPosition.longitude * Math.PI) / 180;
        const userLat = (userLocation.latitude * Math.PI) / 180;
        const userLon = (userLocation.longitude * Math.PI) / 180;

        // Calculate satellite position in ECEF coordinates
        const satR = this.earthRadius + satPosition.altitude;
        const satX = satR * Math.cos(satLat) * Math.cos(satLon);
        const satY = satR * Math.cos(satLat) * Math.sin(satLon);
        const satZ = satR * Math.sin(satLat);

        // Calculate user position in ECEF coordinates
        const userX = this.earthRadius * Math.cos(userLat) * Math.cos(userLon);
        const userY = this.earthRadius * Math.cos(userLat) * Math.sin(userLon);
        const userZ = this.earthRadius * Math.sin(userLat);

        // Vector from user to satellite
        const dx = satX - userX;
        const dy = satY - userY;
        const dz = satZ - userZ;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

        // Calculate elevation angle
        const elevation = Math.asin((dz - userZ * distance / this.earthRadius) / distance);
        return (elevation * 180) / Math.PI;
    }

    /**
     * Update time display
     */
    updateTimeDisplay() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const timeStr = new Date(this.currentTime).toLocaleString();
            timeElement.textContent = `Current Time: ${timeStr}`;
        }
    }

    /**
     * Coordinate conversion methods
     */
    latToY(lat) {
        return this.canvas.height * (1 - (lat + 90) / 180);
    }

    lonToX(lon) {
        return this.canvas.width * (lon + 180) / 360;
    }

    project3D(lat, lon, altitude) {
        // Simple 3D to 2D projection for isometric view
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        const r = this.earthRadius + altitude;

        const x = r * Math.cos(latRad) * Math.cos(lonRad);
        const y = r * Math.cos(latRad) * Math.sin(lonRad);
        const z = r * Math.sin(latRad);

        // Isometric projection
        const scale = this.projectionScale / this.earthRadius;
        return {
            x: this.projectionCenter.x + (x - y) * scale * 0.5,
            y: this.projectionCenter.y + (x + y - 2 * z) * scale * 0.25
        };
    }

    /**
     * Calculate distance between two points
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = this.earthRadius;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * User interaction methods
     */
    updateUserLocation() {
        const name = document.getElementById('locationName').value;
        const lat = parseFloat(document.getElementById('userLat').value);
        const lon = parseFloat(document.getElementById('userLon').value);

        if (!isNaN(lat) && !isNaN(lon)) {
            this.userLocation = { name, latitude: lat, longitude: lon };
            this.updatePassPredictions();
        }
    }

    selectSatellite(satelliteId) {
        // Toggle selection
        if (this.selectedSatellite === satelliteId) {
            this.selectedSatellite = null;
        } else {
            this.selectedSatellite = satelliteId;
        }

        // Update UI
        document.querySelectorAll('.satellite-item').forEach(item => {
            item.classList.remove('selected');
        });

        if (this.selectedSatellite) {
            document.querySelector(`[data-satellite="${this.selectedSatellite}"]`)?.classList.add('selected');
        }
    }

    updatePassPredictions() {
        const range = parseInt(document.getElementById('predictionRange').value);
        const tableElement = document.getElementById('predictionTable');

        if (!tableElement) return;

        // Generate pass predictions for the specified time range
        const predictions = this.generatePassPredictions(range);

        tableElement.innerHTML = `
            <table class="prediction-table">
                <thead>
                    <tr>
                        <th>Satellite</th>
                        <th>Pass Time</th>
                        <th>Duration</th>
                        <th>Max Elevation</th>
                        <th>Direction</th>
                        <th>Data Opportunity</th>
                    </tr>
                </thead>
                <tbody>
                    ${predictions.map(pred => `
                        <tr>
                            <td>
                                <span class="sat-indicator" style="background-color: ${pred.color}"></span>
                                ${pred.satellite}
                            </td>
                            <td>${pred.passTime}</td>
                            <td>${pred.duration}</td>
                            <td>${pred.maxElevation}°</td>
                            <td>${pred.direction}</td>
                            <td>${pred.dataOpportunity}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generatePassPredictions(hoursAhead) {
        const predictions = [];
        const startTime = this.currentTime;

        Object.entries(this.satellites).forEach(([id, satellite]) => {
            // Generate several passes for each satellite
            for (let i = 0; i < 5; i++) {
                const passTime = new Date(startTime + (i * satellite.period + Math.random() * 24) * 60 * 60 * 1000);

                if (passTime.getTime() <= startTime + hoursAhead * 60 * 60 * 1000) {
                    predictions.push({
                        satellite: satellite.name,
                        color: satellite.color,
                        passTime: passTime.toLocaleString(),
                        duration: `${Math.floor(Math.random() * 10 + 5)} min`,
                        maxElevation: Math.floor(Math.random() * 60 + 20),
                        direction: ['N→S', 'S→N', 'W→E', 'E→W'][Math.floor(Math.random() * 4)],
                        dataOpportunity: this.getDataOpportunity(satellite)
                    });
                }
            }
        });

        // Sort by pass time
        return predictions.sort((a, b) => new Date(a.passTime) - new Date(b.passTime));
    }

    getDataOpportunity(satellite) {
        const opportunities = {
            'SMAP': 'Soil moisture measurement',
            'LANDSAT8': 'High-res optical imaging',
            'TERRA': 'Morning vegetation monitoring',
            'AQUA': 'Afternoon vegetation monitoring',
            'GPM': 'Precipitation measurement'
        };

        return opportunities[satellite.name.split(' ')[0]] || 'Data collection';
    }

    showEducationalTab(tabId) {
        // Update tab UI
        document.querySelectorAll('.edu-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update content
        const contentElement = document.getElementById('educationContent');
        contentElement.innerHTML = this.getEducationalContent(tabId);
    }

    getEducationalContent(tabId) {
        const content = {
            'basics': `
                <div class="edu-section">
                    <h4>🌍 What are Satellite Orbits?</h4>
                    <p>Satellite orbits are the paths that satellites follow around Earth. Different orbits serve different purposes:</p>
                    <ul>
                        <li><strong>Sun-synchronous orbits:</strong> Pass over the same location at the same local time each day</li>
                        <li><strong>Polar orbits:</strong> Pass over both poles, providing global coverage</li>
                        <li><strong>Low Earth orbits:</strong> Closer to Earth for higher resolution imagery</li>
                    </ul>
                    <p>Most NASA Earth observation satellites use sun-synchronous polar orbits to ensure consistent lighting conditions and complete global coverage.</p>
                </div>
            `,
            'coverage': `
                <div class="edu-section">
                    <h4>🗺️ Coverage Patterns</h4>
                    <p>Understanding when and how often satellites observe your location is crucial for agricultural planning:</p>
                    <ul>
                        <li><strong>Revisit time:</strong> How often a satellite passes over the same location</li>
                        <li><strong>Swath width:</strong> How wide an area the satellite observes in one pass</li>
                        <li><strong>Overlap:</strong> How much adjacent passes overlap for complete coverage</li>
                    </ul>
                    <p>Different satellites have different coverage patterns - some provide daily global coverage while others revisit specific locations every 16 days.</p>
                </div>
            `,
            'timing': `
                <div class="edu-section">
                    <h4>⏰ Data Acquisition Timing</h4>
                    <p>Timing is everything in satellite-based agriculture monitoring:</p>
                    <ul>
                        <li><strong>Morning passes:</strong> Terra MODIS provides morning vegetation conditions</li>
                        <li><strong>Afternoon passes:</strong> Aqua MODIS captures afternoon changes</li>
                        <li><strong>Multi-day coverage:</strong> Landsat provides detailed imagery every 16 days</li>
                        <li><strong>Continuous monitoring:</strong> SMAP measures soil moisture every 2-3 days</li>
                    </ul>
                    <p>Combining data from multiple satellites provides a complete picture of agricultural conditions.</p>
                </div>
            `,
            'applications': `
                <div class="edu-section">
                    <h4>🚜 Agricultural Applications</h4>
                    <p>Different satellites support different agricultural decisions:</p>
                    <div class="app-grid">
                        <div class="app-item">
                            <h5>SMAP</h5>
                            <p>Soil moisture monitoring for irrigation planning and drought assessment</p>
                        </div>
                        <div class="app-item">
                            <h5>Landsat</h5>
                            <p>Field-level crop monitoring, yield estimation, and precision agriculture</p>
                        </div>
                        <div class="app-item">
                            <h5>MODIS</h5>
                            <p>Regional crop condition monitoring and vegetation health assessment</p>
                        </div>
                        <div class="app-item">
                            <h5>GPM</h5>
                            <p>Precipitation monitoring for weather-based agricultural decisions</p>
                        </div>
                    </div>
                </div>
            `
        };

        return content[tabId] || content['basics'];
    }

    /**
     * Real-time data integration methods
     */
    async initializeRealTimeData() {
        try {
            // Initialize NASA Earthdata connection if available
            if (this.gameEngine && this.gameEngine.getManagers) {
                const managers = this.gameEngine.getManagers();
                if (managers.nasaData) {
                    this.nasaDataManager = managers.nasaData;
                    await this.startRealTimeUpdates();
                }
            }

            // Cache initial pass predictions
            await this.updateAllPassPredictions();

            console.log('Real-time satellite tracking initialized');
        } catch (error) {
            console.warn('Could not initialize real-time satellite data:', error);
        }
    }

    /**
     * Start real-time satellite updates
     */
    async startRealTimeUpdates() {
        // Update satellite positions every 30 seconds
        this.realTimeUpdateInterval = setInterval(() => {
            this.updateSatelliteStatuses();
            this.checkUpcomingPasses();
        }, 30000);

        // Update pass predictions every 10 minutes
        this.passUpdateInterval = setInterval(() => {
            this.updateAllPassPredictions();
        }, 600000);
    }

    /**
     * Check for upcoming passes and trigger notifications
     */
    checkUpcomingPasses() {
        const now = Date.now();
        const notificationThreshold = 15 * 60 * 1000; // 15 minutes

        Object.entries(this.realTimeData.passPredictions || {}).forEach(([satId, predictions]) => {
            predictions.forEach(pass => {
                const timeToPass = pass.startTime.getTime() - now;

                if (timeToPass > 0 && timeToPass <= notificationThreshold) {
                    // Check if we haven't already notified about this pass
                    const passKey = `${satId}_${pass.startTime.getTime()}`;
                    if (!this.notifiedPasses) this.notifiedPasses = new Set();

                    if (!this.notifiedPasses.has(passKey)) {
                        this.notifiedPasses.add(passKey);
                        this.showPassAlert(satId, pass);
                    }
                }
            });
        });
    }

    /**
     * Show alert for upcoming high-quality satellite passes
     */
    showPassAlert(satelliteId, pass) {
        const satellite = this.satellites[satelliteId];
        if (!satellite || pass.maxElevation < 30) return; // Only alert for good passes

        const timeToPass = Math.round((pass.startTime.getTime() - Date.now()) / 60000);

        // Create notification element
        const alert = document.createElement('div');
        alert.className = 'satellite-pass-alert';
        alert.innerHTML = `
            <div class="alert-header">
                <span class="satellite-indicator" style="background-color: ${satellite.color}"></span>
                <strong>${satellite.name}</strong>
                <button class="alert-close">×</button>
            </div>
            <div class="alert-content">
                <p>High-quality pass in ${timeToPass} minutes!</p>
                <p>Max elevation: ${Math.round(pass.maxElevation)}° • Duration: ${pass.duration}m</p>
                <p>Quality: <span class="quality-${pass.quality}">${pass.quality}</span></p>
                <button class="track-pass-btn" onclick="window.app?.ui?.satelliteTracker?.trackPass('${satelliteId}')">
                    Track This Pass
                </button>
            </div>
        `;

        document.body.appendChild(alert);

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 30000);

        // Add close button functionality
        alert.querySelector('.alert-close').onclick = () => {
            alert.parentNode.removeChild(alert);
        };

        console.log(`Pass alert: ${satellite.name} in ${timeToPass} minutes (${pass.maxElevation}° elevation)`);
    }

    /**
     * Update all satellite pass predictions for next 7 days
     */
    async updateAllPassPredictions() {
        try {
            const predictions = {};
            for (const [satId, satellite] of Object.entries(this.satellites)) {
                predictions[satId] = await this.calculateExtendedPassPredictions(satellite);
            }

            this.realTimeData.passPredictions = predictions;
            this.realTimeData.lastUpdate = new Date();

            console.log(`Updated pass predictions for ${Object.keys(predictions).length} satellites`);
            return predictions;
        } catch (error) {
            console.warn('Failed to update pass predictions:', error);
            return {};
        }
    }

    /**
     * Calculate extended pass predictions for next 7 days
     */
    async calculateExtendedPassPredictions(satellite) {
        const predictions = [];
        const searchDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
        let searchTime = Date.now();
        let passCount = 0;
        const maxPasses = 15; // Limit to prevent excessive calculation

        while (searchTime < Date.now() + searchDuration && passCount < maxPasses) {
            const pass = this.findNextPass(satellite, searchTime);
            if (pass && pass.maxElevation >= 10) { // Only include passes above 10° elevation
                const quality = this.assessPassQuality(pass);
                predictions.push({
                    ...pass,
                    quality: quality,
                    dataOpportunity: this.assessDataOpportunity(satellite, pass, quality)
                });
                passCount++;
                searchTime = pass.endTime.getTime() + 60000; // Start searching after this pass
            } else {
                searchTime += 60 * 60 * 1000; // Jump ahead 1 hour if no pass found
            }
        }

        return predictions;
    }

    /**
     * Assess the quality of a satellite pass for data acquisition
     */
    assessPassQuality(pass) {
        if (pass.maxElevation >= 60) return 'excellent';
        if (pass.maxElevation >= 45) return 'very-good';
        if (pass.maxElevation >= 30) return 'good';
        if (pass.maxElevation >= 15) return 'fair';
        return 'poor';
    }

    /**
     * Assess data acquisition opportunity for a pass
     */
    assessDataOpportunity(satellite, pass, quality) {
        // Simple scoring based on elevation and satellite capabilities
        const elevationScore = Math.min(pass.maxElevation / 90, 1.0);
        const durationScore = Math.min(pass.duration / 15, 1.0); // 15 minutes = perfect
        const healthScore = satellite.status === 'operational' ? 1.0 : 0.5;

        const overallScore = (elevationScore + durationScore + healthScore) / 3;

        return {
            score: Math.round(overallScore * 100),
            recommendation: overallScore > 0.8 ? 'highly recommended' :
                          overallScore > 0.6 ? 'recommended' :
                          overallScore > 0.4 ? 'consider' : 'not recommended',
            factors: {
                elevation: Math.round(elevationScore * 100),
                duration: Math.round(durationScore * 100),
                health: Math.round(healthScore * 100)
            }
        };
    }

    /**
     * Get real-time satellite status for display
     */
    getRealTimeStatus() {
        const status = {
            lastUpdate: this.realTimeData.lastUpdate,
            satellites: {},
            upcomingPasses: []
        };

        // Compile satellite status
        Object.entries(this.satellites).forEach(([id, satellite]) => {
            const predictions = this.realTimeData.passPredictions[id] || [];
            const nextPass = predictions.find(p => p.startTime.getTime() > Date.now());

            status.satellites[id] = {
                name: satellite.name,
                status: satellite.status || 'operational',
                nextPass: nextPass ? {
                    start: nextPass.startTime,
                    elevation: nextPass.maxElevation,
                    duration: nextPass.duration,
                    quality: nextPass.quality
                } : null
            };
        });

        // Get upcoming passes in the next 24 hours
        const nextDay = Date.now() + 24 * 60 * 60 * 1000;
        Object.entries(this.realTimeData.passPredictions || {}).forEach(([satId, predictions]) => {
            predictions.forEach(pass => {
                if (pass.startTime.getTime() > Date.now() &&
                    pass.startTime.getTime() < nextDay &&
                    pass.maxElevation >= 20) {
                    status.upcomingPasses.push({
                        satellite: this.satellites[satId].name,
                        satelliteId: satId,
                        ...pass
                    });
                }
            });
        });

        // Sort upcoming passes by time
        status.upcomingPasses.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        return status;
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
        }
        if (this.passUpdateInterval) {
            clearInterval(this.passUpdateInterval);
        }
    }
}

export { SatelliteOrbitVisualization };