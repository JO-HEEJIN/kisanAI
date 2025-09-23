/**
 * NASA Farm Navigators - Satellite Mission Timeline
 * Interactive visualization of Earth observation satellite missions
 * Shows historical context and future mission planning
 */

import { EventSystem } from '../utils/EventSystem.js';

class SatelliteMissionTimeline {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.container = null;
        this.eventSystem = gameEngine ? gameEngine.getEventSystem() : EventSystem.getInstance();

        // Timeline configuration
        this.timelineStart = 1970; // Start from early Earth observation missions
        this.timelineEnd = 2030; // Include planned future missions
        this.currentYear = new Date().getFullYear();

        // Mission data with comprehensive Earth observation history
        this.missions = {
            // Historical Pioneering Missions
            'LANDSAT1': {
                name: 'Landsat 1 (ERTS-1)',
                launch: '1972-07-23',
                end: '1978-01-06',
                status: 'completed',
                type: 'optical',
                significance: 'First civilian Earth observation satellite',
                resolution: '80m',
                achievements: ['Pioneered systematic Earth monitoring', 'Created global land use database'],
                color: '#8BC34A',
                category: 'historic'
            },
            'LANDSAT2': {
                name: 'Landsat 2',
                launch: '1975-01-22',
                end: '1982-02-25',
                status: 'completed',
                type: 'optical',
                significance: 'Extended global coverage capabilities',
                resolution: '80m',
                achievements: ['Improved temporal coverage', 'Enhanced agricultural monitoring'],
                color: '#689F38',
                category: 'historic'
            },
            'LANDSAT3': {
                name: 'Landsat 3',
                launch: '1978-03-05',
                end: '1983-03-31',
                status: 'completed',
                type: 'optical',
                significance: 'Added thermal infrared capability',
                resolution: '80m (optical), 240m (thermal)',
                achievements: ['First thermal Earth imaging', 'Water temperature mapping'],
                color: '#4CAF50',
                category: 'historic'
            },

            // Modern Operational Missions
            'TERRA': {
                name: 'Terra (EOS AM-1)',
                launch: '1999-12-18',
                end: null,
                status: 'operational',
                type: 'multispectral',
                significance: 'Flagship Earth Observing System mission',
                resolution: '250m-1km',
                achievements: ['Daily global vegetation monitoring', 'Climate change research'],
                instruments: ['MODIS', 'ASTER', 'CERES', 'MISR', 'MOPITT'],
                color: '#FF9800',
                category: 'operational'
            },
            'AQUA': {
                name: 'Aqua (EOS PM-1)',
                launch: '2002-05-04',
                end: null,
                status: 'operational',
                type: 'multispectral',
                significance: 'Water cycle and ocean monitoring',
                resolution: '250m-25km',
                achievements: ['Ocean color monitoring', 'Atmospheric water vapor mapping'],
                instruments: ['MODIS', 'AIRS', 'AMSU', 'CERES'],
                color: '#00BCD4',
                category: 'operational'
            },
            'LANDSAT7': {
                name: 'Landsat 7',
                launch: '1999-04-15',
                end: null,
                status: 'operational-degraded',
                type: 'optical',
                significance: 'Enhanced Thematic Mapper Plus',
                resolution: '15m-60m',
                achievements: ['Highest resolution land imaging', 'Continuous 16-day global coverage'],
                issues: ['Scan Line Corrector failure (2003)'],
                color: '#4CAF50',
                category: 'operational'
            },
            'LANDSAT8': {
                name: 'Landsat 8 (LDCM)',
                launch: '2013-02-11',
                end: null,
                status: 'operational',
                type: 'optical',
                significance: 'Operational Land Imager technology',
                resolution: '15m-100m',
                achievements: ['Improved radiometric resolution', 'Enhanced coastal/aerosol band'],
                instruments: ['OLI', 'TIRS'],
                color: '#66BB6A',
                category: 'operational'
            },
            'LANDSAT9': {
                name: 'Landsat 9',
                launch: '2021-09-27',
                end: null,
                status: 'operational',
                type: 'optical',
                significance: 'Continuation of Landsat data record',
                resolution: '15m-100m',
                achievements: ['50-year continuous Earth observation', '8-day repeat with Landsat 8'],
                instruments: ['OLI-2', 'TIRS-2'],
                color: '#4CAF50',
                category: 'operational'
            },
            'SMAP': {
                name: 'SMAP',
                launch: '2015-01-31',
                end: null,
                status: 'operational',
                type: 'microwave',
                significance: 'Global soil moisture monitoring',
                resolution: '9km-40km',
                achievements: ['Drought monitoring', 'Agricultural water management', 'Flood prediction'],
                instruments: ['L-band radiometer', 'L-band radar'],
                color: '#2196F3',
                category: 'operational'
            },
            'GPM': {
                name: 'GPM Core Observatory',
                launch: '2014-02-27',
                end: null,
                status: 'operational',
                type: 'precipitation',
                significance: 'Global precipitation measurement',
                resolution: '5km-25km',
                achievements: ['Global rainfall mapping', 'Storm tracking', 'Climate research'],
                instruments: ['GMI', 'DPR'],
                color: '#9C27B0',
                category: 'operational'
            },

            // International Partnerships
            'SENTINEL2A': {
                name: 'Sentinel-2A',
                launch: '2015-06-23',
                end: null,
                status: 'operational',
                type: 'optical',
                significance: 'European Copernicus program',
                resolution: '10m-60m',
                achievements: ['5-day global revisit', 'Open data policy', 'Agricultural monitoring'],
                agency: 'ESA',
                color: '#E91E63',
                category: 'international'
            },
            'SENTINEL2B': {
                name: 'Sentinel-2B',
                launch: '2017-03-07',
                end: null,
                status: 'operational',
                type: 'optical',
                significance: 'Twin satellite for continuous coverage',
                resolution: '10m-60m',
                achievements: ['Enhanced temporal resolution', 'Vegetation monitoring'],
                agency: 'ESA',
                color: '#C2185B',
                category: 'international'
            },

            // Future Planned Missions
            'LANDSAT_NEXT': {
                name: 'Landsat Next',
                launch: '2030-12-31',
                end: null,
                status: 'planned',
                type: 'hyperspectral',
                significance: 'Next generation hyperspectral imaging',
                resolution: '30m (20+ bands)',
                achievements: ['Hyperspectral agriculture', 'Advanced mineral mapping'],
                color: '#795548',
                category: 'future'
            },
            'NISAR': {
                name: 'NISAR',
                launch: '2024-03-15',
                end: null,
                status: 'development',
                type: 'SAR',
                significance: 'NASA-ISRO synthetic aperture radar',
                resolution: '3m-12m',
                achievements: ['All-weather imaging', 'Deformation monitoring', 'Biomass estimation'],
                agency: 'NASA-ISRO',
                color: '#607D8B',
                category: 'future'
            },
            'TEMPO': {
                name: 'TEMPO',
                launch: '2023-04-07',
                end: null,
                status: 'operational',
                type: 'atmospheric',
                significance: 'Tropospheric air quality monitoring',
                resolution: '2.1km x 4.4km',
                achievements: ['Hourly air quality mapping', 'Pollution source tracking'],
                color: '#FFC107',
                category: 'operational'
            },
            'SBG': {
                name: 'Surface Biology and Geology',
                launch: '2028-06-01',
                end: null,
                status: 'planned',
                type: 'hyperspectral',
                significance: 'Advanced ecosystem monitoring',
                resolution: '30m (285 bands)',
                achievements: ['Plant species identification', 'Biodiversity mapping', 'Geological surveying'],
                color: '#8E24AA',
                category: 'future'
            }
        };

        // Agriculture-focused mission categories
        this.agricultureRelevance = {
            'LANDSAT1': { score: 8, applications: ['Land use classification', 'Crop area mapping'] },
            'LANDSAT2': { score: 8, applications: ['Agricultural expansion monitoring', 'Crop phenology'] },
            'LANDSAT3': { score: 8, applications: ['Thermal stress detection', 'Irrigation mapping'] },
            'TERRA': { score: 9, applications: ['Daily vegetation monitoring', 'Crop condition assessment'] },
            'AQUA': { score: 7, applications: ['Water stress monitoring', 'Evapotranspiration'] },
            'LANDSAT7': { score: 9, applications: ['Field-level monitoring', 'Precision agriculture'] },
            'LANDSAT8': { score: 9, applications: ['Crop health mapping', 'Yield prediction'] },
            'LANDSAT9': { score: 9, applications: ['Continuous monitoring', 'Climate adaptation'] },
            'SMAP': { score: 10, applications: ['Soil moisture', 'Drought monitoring', 'Irrigation planning'] },
            'GPM': { score: 8, applications: ['Precipitation mapping', 'Flood risk', 'Water management'] },
            'SENTINEL2A': { score: 10, applications: ['High-frequency monitoring', 'CAP compliance'] },
            'SENTINEL2B': { score: 10, applications: ['Crop classification', 'Phenology tracking'] },
            'LANDSAT_NEXT': { score: 10, applications: ['Hyperspectral crop analysis', 'Disease detection'] },
            'NISAR': { score: 8, applications: ['Soil moisture', 'Crop structure', 'All-weather monitoring'] },
            'TEMPO': { score: 6, applications: ['Agricultural air quality', 'Emission monitoring'] },
            'SBG': { score: 10, applications: ['Crop species mapping', 'Stress detection', 'Biodiversity'] }
        };

        // Data acquisition planner state
        this.acquisitionPlan = {
            selectedMissions: new Set(),
            timeRange: { start: null, end: null },
            location: { lat: 33.4484, lon: -112.0740, name: 'Phoenix, Arizona' },
            requirements: {
                resolution: 'any',
                revisit: 'any',
                spectral: 'any',
                weather: 'any'
            }
        };

        // Initialize component
        this.isInitialized = false;
    }

    /**
     * Create the mission timeline interface
     */
    async createInterface(container) {
        this.container = container;
        this.initialize();
        return this.container;
    }

    /**
     * Initialize the timeline visualization
     */
    initialize() {
        if (!this.container || this.isInitialized) return;

        this.createTimelineInterface();
        this.setupEventListeners();
        this.renderTimeline();
        this.updateAcquisitionPlan();
        this.isInitialized = true;

        console.log('Satellite Mission Timeline initialized');
    }

    /**
     * Create the main timeline interface
     */
    createTimelineInterface() {
        this.container.innerHTML = `
            <div class="mission-timeline-container">
                <div class="timeline-header">
                    <h3>Earth Observation Mission Timeline</h3>
                    <div class="timeline-controls">
                        <div class="view-controls">
                            <button class="view-btn active" data-view="all">All Missions</button>
                            <button class="view-btn" data-view="agriculture">Agriculture Focus</button>
                            <button class="view-btn" data-view="operational">Currently Active</button>
                            <button class="view-btn" data-view="future">Future Missions</button>
                        </div>
                        <div class="year-range">
                            <input type="range" id="timelineStart" min="1970" max="2030" value="${this.timelineStart}">
                            <input type="range" id="timelineEnd" min="1970" max="2030" value="${this.timelineEnd}">
                            <div class="range-labels">
                                <span id="startLabel">${this.timelineStart}</span>
                                <span>to</span>
                                <span id="endLabel">${this.timelineEnd}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="timeline-main">
                    <div class="timeline-visualization" id="timelineViz">
                        <div class="timeline-axis" id="timelineAxis"></div>
                        <div class="mission-tracks" id="missionTracks"></div>
                        <div class="timeline-marker current-year" id="currentYearMarker">
                            <div class="marker-line"></div>
                            <div class="marker-label">Now (${this.currentYear})</div>
                        </div>
                    </div>
                </div>

                <div class="timeline-sidebar">
                    <div class="mission-details" id="missionDetails">
                        <h4>Select a Mission</h4>
                        <p>Click on any mission in the timeline to view detailed information.</p>
                    </div>

                    <div class="acquisition-planner">
                        <h4>Data Acquisition Planner</h4>
                        <div class="planner-controls">
                            <div class="location-selector">
                                <label>Target Location:</label>
                                <select id="locationSelect">
                                    <option value="">Select location...</option>
                                    <option value="custom">Enter custom coordinates</option>
                                </select>
                            </div>

                            <div class="requirements-selector">
                                <div class="requirement-group">
                                    <label>Resolution Required:</label>
                                    <select id="resolutionReq">
                                        <option value="any">Any Resolution</option>
                                        <option value="high">High (≤30m)</option>
                                        <option value="medium">Medium (30-250m)</option>
                                        <option value="low">Low (>250m)</option>
                                    </select>
                                </div>

                                <div class="requirement-group">
                                    <label>Revisit Frequency:</label>
                                    <select id="revisitReq">
                                        <option value="any">Any Frequency</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>

                                <div class="requirement-group">
                                    <label>Spectral Requirements:</label>
                                    <select id="spectralReq">
                                        <option value="any">Any Spectral</option>
                                        <option value="optical">Optical/Visible</option>
                                        <option value="multispectral">Multispectral</option>
                                        <option value="hyperspectral">Hyperspectral</option>
                                        <option value="thermal">Thermal Infrared</option>
                                        <option value="microwave">Microwave/SAR</option>
                                    </select>
                                </div>
                            </div>

                            <button id="generatePlan" class="generate-plan-btn">
                                Generate Acquisition Plan
                            </button>
                        </div>

                        <div class="plan-results" id="planResults">
                            <!-- Acquisition plan results will appear here -->
                        </div>
                    </div>

                    <div class="timeline-legend">
                        <h5>Mission Categories</h5>
                        <div class="legend-items">
                            <div class="legend-item">
                                <span class="legend-color historic"></span>
                                <span>Historic Pioneers</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color operational"></span>
                                <span>Currently Operational</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color international"></span>
                                <span>International Partners</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color future"></span>
                                <span>Future/Planned</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for timeline interaction
     */
    setupEventListeners() {
        // View control buttons
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.container.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterMissions(e.target.dataset.view);
            });
        });

        // Timeline range controls
        const startRange = this.container.querySelector('#timelineStart');
        const endRange = this.container.querySelector('#timelineEnd');
        const startLabel = this.container.querySelector('#startLabel');
        const endLabel = this.container.querySelector('#endLabel');

        startRange.addEventListener('input', (e) => {
            this.timelineStart = parseInt(e.target.value);
            startLabel.textContent = this.timelineStart;
            this.renderTimeline();
        });

        endRange.addEventListener('input', (e) => {
            this.timelineEnd = parseInt(e.target.value);
            endLabel.textContent = this.timelineEnd;
            this.renderTimeline();
        });

        // Acquisition planner controls
        this.container.querySelector('#locationSelect').addEventListener('change', (e) => {
            const [lat, lon] = e.target.value.split(',').map(parseFloat);
            const name = e.target.options[e.target.selectedIndex].text;
            this.acquisitionPlan.location = { lat, lon, name };
        });

        this.container.querySelector('#generatePlan').addEventListener('click', () => {
            this.generateAcquisitionPlan();
        });

        // Requirement selectors
        ['resolutionReq', 'revisitReq', 'spectralReq'].forEach(id => {
            this.container.querySelector(`#${id}`).addEventListener('change', (e) => {
                const key = id.replace('Req', '');
                this.acquisitionPlan.requirements[key] = e.target.value;
            });
        });
    }

    /**
     * Render the main timeline visualization
     */
    renderTimeline() {
        const timelineViz = this.container.querySelector('#timelineViz');
        const timelineAxis = this.container.querySelector('#timelineAxis');
        const missionTracks = this.container.querySelector('#missionTracks');
        const currentYearMarker = this.container.querySelector('#currentYearMarker');

        // Clear existing content
        timelineAxis.innerHTML = '';
        missionTracks.innerHTML = '';

        const timelineWidth = timelineViz.offsetWidth - 40; // Account for padding
        const yearRange = this.timelineEnd - this.timelineStart;
        const yearWidth = timelineWidth / yearRange;

        // Create year axis
        for (let year = this.timelineStart; year <= this.timelineEnd; year += 5) {
            const yearPos = ((year - this.timelineStart) / yearRange) * timelineWidth;
            const yearMark = document.createElement('div');
            yearMark.className = 'year-mark';
            yearMark.style.left = `${yearPos}px`;
            yearMark.innerHTML = `
                <div class="year-tick"></div>
                <div class="year-label">${year}</div>
            `;
            timelineAxis.appendChild(yearMark);
        }

        // Position current year marker
        const currentYearPos = ((this.currentYear - this.timelineStart) / yearRange) * timelineWidth;
        currentYearMarker.style.left = `${currentYearPos}px`;

        // Render mission tracks
        let trackIndex = 0;
        Object.entries(this.missions).forEach(([id, mission]) => {
            if (this.shouldShowMission(mission)) {
                this.renderMissionTrack(mission, trackIndex, yearRange, timelineWidth);
                trackIndex++;
            }
        });

        // Adjust container height based on number of tracks
        const trackHeight = 40; // Height of each mission track
        const totalHeight = Math.max(trackIndex * trackHeight + 60, 200);
        missionTracks.style.height = `${totalHeight}px`;
    }

    /**
     * Render a single mission track
     */
    renderMissionTrack(mission, trackIndex, yearRange, timelineWidth) {
        const missionTracks = this.container.querySelector('#missionTracks');
        const launchYear = new Date(mission.launch).getFullYear();
        const endYear = mission.end ? new Date(mission.end).getFullYear() : this.currentYear;

        const startPos = ((launchYear - this.timelineStart) / yearRange) * timelineWidth;
        const duration = endYear - launchYear;
        const width = (duration / yearRange) * timelineWidth;

        const track = document.createElement('div');
        track.className = `mission-track ${mission.category} ${mission.status}`;
        track.style.top = `${trackIndex * 40}px`;
        track.style.left = `${startPos}px`;
        track.style.width = `${Math.max(width, 20)}px`; // Minimum width for visibility
        track.dataset.mission = mission.name;

        track.innerHTML = `
            <div class="mission-bar" style="background-color: ${mission.color}">
                <div class="mission-label">${mission.name}</div>
                <div class="mission-years">${launchYear}${mission.end ? `-${endYear}` : '+'}</div>
            </div>
            <div class="agriculture-relevance" style="opacity: ${this.agricultureRelevance[Object.keys(this.missions).find(k => this.missions[k] === mission)] ? this.agricultureRelevance[Object.keys(this.missions).find(k => this.missions[k] === mission)].score / 10 : 0.5}">
                🌾
            </div>
        `;

        // Add click event for mission details
        track.addEventListener('click', () => {
            this.showMissionDetails(mission);
        });

        missionTracks.appendChild(track);
    }

    /**
     * Show detailed information about a selected mission
     */
    showMissionDetails(mission) {
        const missionDetails = this.container.querySelector('#missionDetails');
        const missionId = Object.keys(this.missions).find(k => this.missions[k] === mission);
        const agRelevance = this.agricultureRelevance[missionId];

        missionDetails.innerHTML = `
            <div class="mission-detail-header">
                <h4 style="color: ${mission.color}">${mission.name}</h4>
                <div class="mission-status status-${mission.status}">${mission.status.toUpperCase()}</div>
            </div>

            <div class="mission-info">
                <div class="info-row">
                    <span class="info-label">Launch Date:</span>
                    <span class="info-value">${new Date(mission.launch).toLocaleDateString()}</span>
                </div>
                ${mission.end ? `
                <div class="info-row">
                    <span class="info-label">End Date:</span>
                    <span class="info-value">${new Date(mission.end).toLocaleDateString()}</span>
                </div>
                ` : ''}
                <div class="info-row">
                    <span class="info-label">Mission Type:</span>
                    <span class="info-value">${mission.type}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Resolution:</span>
                    <span class="info-value">${mission.resolution}</span>
                </div>
                ${mission.agency ? `
                <div class="info-row">
                    <span class="info-label">Agency:</span>
                    <span class="info-value">${mission.agency}</span>
                </div>
                ` : ''}
            </div>

            <div class="mission-significance">
                <h5>Significance</h5>
                <p>${mission.significance}</p>
            </div>

            ${mission.instruments ? `
            <div class="mission-instruments">
                <h5>Key Instruments</h5>
                <div class="instrument-tags">
                    ${mission.instruments.map(inst => `<span class="instrument-tag">${inst}</span>`).join('')}
                </div>
            </div>
            ` : ''}

            <div class="mission-achievements">
                <h5>Key Achievements</h5>
                <ul>
                    ${mission.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                </ul>
            </div>

            ${agRelevance ? `
            <div class="agriculture-relevance-detail">
                <h5>Agricultural Relevance</h5>
                <div class="relevance-score">
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${agRelevance.score * 10}%; background: ${mission.color}"></div>
                    </div>
                    <span class="score-value">${agRelevance.score}/10</span>
                </div>
                <div class="ag-applications">
                    <h6>Primary Applications:</h6>
                    <ul>
                        ${agRelevance.applications.map(app => `<li>${app}</li>`).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}

            ${mission.issues ? `
            <div class="mission-issues">
                <h5>Known Issues</h5>
                <ul>
                    ${mission.issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            <button class="add-to-plan-btn" onclick="this.closest('.mission-timeline-container').querySelector('#generatePlan').click()">
                Add to Acquisition Plan
            </button>
        `;
    }

    /**
     * Filter missions based on selected view
     */
    filterMissions(view) {
        this.currentView = view;
        this.renderTimeline();
    }

    /**
     * Determine if a mission should be shown based on current filters
     */
    shouldShowMission(mission) {
        if (!this.currentView || this.currentView === 'all') return true;

        switch (this.currentView) {
            case 'agriculture':
                const missionId = Object.keys(this.missions).find(k => this.missions[k] === mission);
                return this.agricultureRelevance[missionId]?.score >= 7;
            case 'operational':
                return mission.status === 'operational' || mission.status === 'operational-degraded';
            case 'future':
                return mission.status === 'planned' || mission.status === 'development';
            default:
                return true;
        }
    }

    /**
     * Generate comprehensive data acquisition plan
     */
    generateAcquisitionPlan() {
        const planResults = this.container.querySelector('#planResults');
        const { location, requirements } = this.acquisitionPlan;

        // Filter missions based on requirements
        const suitableMissions = this.filterMissionsForPlan(requirements);

        // Generate acquisition schedule
        const acquisitionSchedule = this.generateAcquisitionSchedule(suitableMissions, location);

        // Calculate coverage statistics
        const coverageStats = this.calculateCoverageStatistics(suitableMissions);

        planResults.innerHTML = `
            <div class="plan-summary">
                <h5>Acquisition Plan Summary</h5>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-value">${suitableMissions.length}</span>
                        <span class="stat-label">Suitable Missions</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${coverageStats.revisitsPerYear}</span>
                        <span class="stat-label">Revisits/Year</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${coverageStats.bestResolution}</span>
                        <span class="stat-label">Best Resolution</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${coverageStats.dataVolume}</span>
                        <span class="stat-label">GB/Year Est.</span>
                    </div>
                </div>
            </div>

            <div class="recommended-missions">
                <h5>Recommended Mission Combination</h5>
                ${suitableMissions.slice(0, 5).map(mission => `
                    <div class="recommended-mission">
                        <div class="mission-header">
                            <span class="mission-indicator" style="background: ${mission.color}"></span>
                            <strong>${mission.name}</strong>
                            <span class="mission-match">${this.calculateMissionMatch(mission, requirements)}% match</span>
                        </div>
                        <div class="mission-benefits">
                            ${this.getMissionBenefits(mission, requirements).map(benefit =>
                                `<span class="benefit-tag">${benefit}</span>`
                            ).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="acquisition-calendar">
                <h5>Next 30 Days Acquisition Opportunities</h5>
                ${acquisitionSchedule.slice(0, 10).map(opp => `
                    <div class="acquisition-opportunity">
                        <div class="opp-date">${opp.date}</div>
                        <div class="opp-mission" style="color: ${opp.mission.color}">${opp.mission.name}</div>
                        <div class="opp-details">${opp.details}</div>
                        <div class="opp-quality quality-${opp.quality}">${opp.quality}</div>
                    </div>
                `).join('')}
            </div>

            <div class="plan-recommendations">
                <h5>💡 Recommendations</h5>
                <ul>
                    ${this.generateRecommendations(suitableMissions, coverageStats).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * Filter missions based on acquisition requirements
     */
    filterMissionsForPlan(requirements) {
        return Object.values(this.missions)
            .filter(mission => mission.status === 'operational' || mission.status === 'operational-degraded')
            .filter(mission => {
                // Resolution filtering
                if (requirements.resolution !== 'any') {
                    const resolutionValue = this.parseResolution(mission.resolution);
                    switch (requirements.resolution) {
                        case 'high':
                            if (resolutionValue > 30) return false;
                            break;
                        case 'medium':
                            if (resolutionValue <= 30 || resolutionValue > 250) return false;
                            break;
                        case 'low':
                            if (resolutionValue <= 250) return false;
                            break;
                    }
                }

                // Spectral filtering
                if (requirements.spectral !== 'any') {
                    const missionType = mission.type.toLowerCase();
                    if (!missionType.includes(requirements.spectral.toLowerCase()) &&
                        requirements.spectral !== 'optical' && !missionType.includes('multispectral')) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => {
                // Sort by agricultural relevance
                const aId = Object.keys(this.missions).find(k => this.missions[k] === a);
                const bId = Object.keys(this.missions).find(k => this.missions[k] === b);
                const aScore = this.agricultureRelevance[aId]?.score || 0;
                const bScore = this.agricultureRelevance[bId]?.score || 0;
                return bScore - aScore;
            });
    }

    /**
     * Generate acquisition schedule for next 30 days
     */
    generateAcquisitionSchedule(missions, location) {
        const schedule = [];
        const today = new Date();

        for (let day = 0; day < 30; day++) {
            const date = new Date(today);
            date.setDate(today.getDate() + day);

            missions.forEach(mission => {
                // Simulate acquisition opportunities
                const revisitDays = this.getRevisitDays(mission);
                if (day % revisitDays === 0) {
                    schedule.push({
                        date: date.toLocaleDateString(),
                        mission: mission,
                        details: this.getAcquisitionDetails(mission, location),
                        quality: this.getAcquisitionQuality(mission, date)
                    });
                }
            });
        }

        return schedule.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Calculate coverage statistics for selected missions
     */
    calculateCoverageStatistics(missions) {
        let totalRevisits = 0;
        let bestRes = 1000;
        let totalDataVolume = 0;

        missions.forEach(mission => {
            const revisitDays = this.getRevisitDays(mission);
            totalRevisits += Math.floor(365 / revisitDays);

            const res = this.parseResolution(mission.resolution);
            if (res < bestRes) bestRes = res;

            // Estimate data volume (simplified)
            totalDataVolume += this.estimateDataVolume(mission);
        });

        return {
            revisitsPerYear: totalRevisits,
            bestResolution: `${bestRes}m`,
            dataVolume: Math.round(totalDataVolume)
        };
    }

    /**
     * Calculate mission match percentage for requirements
     */
    calculateMissionMatch(mission, requirements) {
        let score = 0;
        let total = 0;

        // Resolution match
        if (requirements.resolution !== 'any') {
            total += 25;
            const resValue = this.parseResolution(mission.resolution);
            switch (requirements.resolution) {
                case 'high':
                    score += resValue <= 30 ? 25 : 10;
                    break;
                case 'medium':
                    score += (resValue > 30 && resValue <= 250) ? 25 : 10;
                    break;
                case 'low':
                    score += resValue > 250 ? 25 : 15;
                    break;
            }
        }

        // Spectral match
        if (requirements.spectral !== 'any') {
            total += 25;
            const missionType = mission.type.toLowerCase();
            score += missionType.includes(requirements.spectral.toLowerCase()) ? 25 : 10;
        }

        // Agricultural relevance
        total += 50;
        const missionId = Object.keys(this.missions).find(k => this.missions[k] === mission);
        const agScore = this.agricultureRelevance[missionId]?.score || 5;
        score += (agScore / 10) * 50;

        return total > 0 ? Math.round((score / total) * 100) : 50;
    }

    /**
     * Get mission benefits for display
     */
    getMissionBenefits(mission, requirements) {
        const benefits = [];
        const missionId = Object.keys(this.missions).find(k => this.missions[k] === mission);
        const agRelevance = this.agricultureRelevance[missionId];

        if (agRelevance) {
            benefits.push(...agRelevance.applications.slice(0, 2));
        }

        const resValue = this.parseResolution(mission.resolution);
        if (resValue <= 30) benefits.push('High Resolution');
        if (resValue <= 100) benefits.push('Field Level');

        const revisit = this.getRevisitDays(mission);
        if (revisit <= 5) benefits.push('Frequent Revisit');

        return benefits.slice(0, 3);
    }

    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(missions, coverageStats) {
        const recommendations = [];

        if (missions.length === 0) {
            recommendations.push('No operational missions match your criteria. Consider broadening your requirements.');
            return recommendations;
        }

        if (coverageStats.revisitsPerYear < 12) {
            recommendations.push('Consider adding more frequent-revisit missions for better temporal coverage.');
        }

        if (parseInt(coverageStats.bestResolution) > 100) {
            recommendations.push('For field-level monitoring, consider including Landsat or Sentinel-2 missions.');
        }

        const hasSoilMoisture = missions.some(m => m.name.includes('SMAP'));
        if (!hasSoilMoisture) {
            recommendations.push('Add SMAP for critical soil moisture monitoring capabilities.');
        }

        const hasOptical = missions.some(m => m.type.includes('optical'));
        const hasRadar = missions.some(m => m.type.includes('SAR'));

        if (hasOptical && !hasRadar) {
            recommendations.push('Consider adding SAR missions for all-weather monitoring capability.');
        }

        if (missions.length > 5) {
            recommendations.push('Consider prioritizing 3-5 core missions to optimize cost and data management.');
        }

        return recommendations;
    }

    /**
     * Helper methods for calculations
     */
    parseResolution(resolutionStr) {
        const match = resolutionStr.match(/(\d+)m/);
        return match ? parseInt(match[1]) : 1000;
    }

    getRevisitDays(mission) {
        if (mission.name.includes('MODIS') || mission.name.includes('Terra') || mission.name.includes('Aqua')) return 1;
        if (mission.name.includes('Sentinel-2')) return 5;
        if (mission.name.includes('Landsat')) return 16;
        if (mission.name.includes('SMAP')) return 3;
        return 7; // default
    }

    estimateDataVolume(mission) {
        const resValue = this.parseResolution(mission.resolution);
        const revisitDays = this.getRevisitDays(mission);
        const yearlyAcquisitions = 365 / revisitDays;

        // Simplified volume estimation (GB per acquisition)
        let volumePerAcq = 1;
        if (resValue <= 30) volumePerAcq = 5;
        else if (resValue <= 100) volumePerAcq = 2;
        else volumePerAcq = 0.5;

        return yearlyAcquisitions * volumePerAcq;
    }

    getAcquisitionDetails(mission, location) {
        const details = [];
        if (Math.random() > 0.7) details.push('Cloud-free');
        if (Math.random() > 0.8) details.push('High sun angle');
        if (Math.random() > 0.6) details.push('Optimal viewing');
        return details.join(', ') || 'Standard acquisition';
    }

    getAcquisitionQuality(mission, date) {
        // Simulate quality based on various factors
        const random = Math.random();
        if (random > 0.8) return 'excellent';
        if (random > 0.6) return 'good';
        if (random > 0.4) return 'fair';
        return 'poor';
    }

    updateAcquisitionPlan() {
        // This would integrate with real mission planning APIs
        console.log('Acquisition plan updated');
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.isInitialized = false;
    }
}

export { SatelliteMissionTimeline };