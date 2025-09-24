/**
 * NASA Data Tutorial System
 * Educational component to teach players about NASA satellite data
 */
class NASADataTutorial {
    constructor(farmGame) {
        this.farmGame = farmGame;
        this.currentStep = 0;
        this.completedModules = new Set();

        // Tutorial modules in order
        this.modules = [
            {
                id: 'smap-basics',
                title: 'SMAP: Measuring Soil Moisture from Space',
                description: 'Learn how NASA SMAP satellite measures soil moisture deep in the ground',
                difficulty: 'beginner'
            },
            {
                id: 'ndvi-vegetation',
                title: 'NDVI: Reading Crop Health Status',
                description: 'How to detect crop stress early using vegetation indices',
                difficulty: 'beginner'
            },
            {
                id: 'data-limitations',
                title: 'Data Limitations and Proper Interpretation',
                description: 'Why satellite data isn\'t perfect and how to use it wisely',
                difficulty: 'intermediate'
            },
            {
                id: 'conservation-applications',
                title: 'Applying Data to Conservation Agriculture',
                description: 'Sustainable farming methods that protect environment while increasing productivity',
                difficulty: 'advanced'
            }
        ];

        this.currentModule = null;
        this.isActive = false;
    }

    /**
     * Start the tutorial system
     */
    startTutorial(moduleId = null) {
        this.isActive = true;

        if (moduleId) {
            this.currentModule = this.modules.find(m => m.id === moduleId);
        } else {
            // Start with first incomplete module
            this.currentModule = this.modules.find(m => !this.completedModules.has(m.id)) || this.modules[0];
        }

        this.showTutorialInterface();
    }

    /**
     * Show main tutorial interface
     */
    showTutorialInterface() {
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'tutorial-modal';
        modal.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-header">
                    <h2>NASA Data Academy</h2>
                    <button class="close-btn" onclick="nasaDataTutorial.closeTutorial()">×</button>
                </div>

                <div class="tutorial-intro">
                    <p>Learn how to effectively use NASA satellite data in agriculture!</p>
                    <div class="progress-indicator">
                        <span>Completed: ${this.completedModules.size}/${this.modules.length}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.completedModules.size/this.modules.length)*100}%"></div>
                        </div>
                    </div>
                </div>

                <div class="module-selection">
                    ${this.modules.map(module => `
                        <div class="module-card ${this.completedModules.has(module.id) ? 'completed' : ''}"
                             onclick="nasaDataTutorial.startModule('${module.id}')">
                            <div class="module-header">
                                <h3>${module.title}</h3>
                                <span class="difficulty ${module.difficulty}">${module.difficulty}</span>
                                ${this.completedModules.has(module.id) ? '<span class="check">✓</span>' : ''}
                            </div>
                            <p>${module.description}</p>
                        </div>
                    `).join('')}
                </div>

                <div class="tutorial-footer">
                    <button onclick="nasaDataTutorial.startModule('${this.currentModule.id}')" class="start-btn">
                        ${this.completedModules.has(this.currentModule.id) ? 'Study Again' : 'Start Learning'}
                    </button>
                </div>
            </div>
        `;

        // 기존 모달이 있다면 제거
        const existingOverlay = document.querySelector('.tutorial-modal-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // 모달을 오버레이에 추가하고 body에 오버레이 추가
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // 강제로 중앙 정렬 스타일 적용 (즉시 + 지연)
        const applyModalStyles = () => {
            overlay.style.cssText = `
                position: fixed !important;
                inset: 0 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                z-index: 99999 !important;
                background: rgba(7, 23, 63, 0.85) !important;
                backdrop-filter: blur(8px) !important;
            `;

            modal.style.cssText = `
                position: static !important;
                transform: none !important;
                margin: auto !important;
                background: linear-gradient(135deg, #07173F, #0960E1) !important;
                border: 2px solid #0042A6 !important;
                border-radius: 16px !important;
                max-width: 800px !important;
                max-height: 90vh !important;
                width: 90vw !important;
                overflow: hidden !important;
                box-shadow: 0 25px 80px rgba(4, 66, 166, 0.4) !important;
                display: flex !important;
                flex-direction: column !important;
                color: #FFFFFF !important;
            `;
        };

        // 즉시 적용
        applyModalStyles();

        // 지연 후 재적용 (다른 스크립트가 덮어쓰는 경우 대비)
        setTimeout(applyModalStyles, 10);
        setTimeout(applyModalStyles, 100);
        setTimeout(applyModalStyles, 500);

        // Observer는 제거 (무한 루프 방지)

        window.nasaDataTutorial = this; // Global access for buttons
    }

    /**
     * Start specific tutorial module
     */
    startModule(moduleId) {
        this.currentModule = this.modules.find(m => m.id === moduleId);

        switch(moduleId) {
            case 'smap-basics':
                this.showSMAPTutorial();
                break;
            case 'ndvi-vegetation':
                this.showNDVITutorial();
                break;
            case 'data-limitations':
                this.showDataLimitationsTutorial();
                break;
            case 'conservation-applications':
                this.showConservationTutorial();
                break;
        }
    }

    /**
     * SMAP Tutorial Module
     */
    showSMAPTutorial() {
        this.showInteractiveLesson({
            title: 'SMAP: Soil Moisture Measurement Satellite',
            steps: [
                {
                    type: 'explanation',
                    title: 'What is SMAP?',
                    content: `
                        <div class="concept-visual">
                            <div class="satellite-demo">
                                <div class="satellite">SATELLITE</div>
                                <div class="signal-waves">SIGNALS</div>
                                <div class="earth">EARTH</div>
                            </div>
                            <p><strong>SMAP (Soil Moisture Active Passive)</strong> is NASA's soil moisture measurement satellite.</p>
                            <ul>
                                <li><strong>Principle:</strong> Measures soil moisture using L-band microwaves</li>
                                <li><strong>Resolution:</strong> 9km × 9km (suitable for large farms)</li>
                                <li><strong>Cycle:</strong> Revisits same area every 2-3 days</li>
                                <li><strong>Depth:</strong> Soil moisture at 5cm surface depth</li>
                            </ul>
                        </div>
                    `
                },
                {
                    type: 'interactive',
                    title: 'Interpreting Soil Moisture Values',
                    content: `
                        <div class="data-interpretation-game">
                            <h4>Try interpreting this SMAP data:</h4>
                            <div class="soil-moisture-slider">
                                <input type="range" min="0" max="50" value="25" id="moistureSlider"
                                       oninput="nasaDataTutorial.updateMoistureInterpretation(this.value)">
                                <div class="moisture-scale">
                                    <span>0% (Dry)</span>
                                    <span>25% (Normal)</span>
                                    <span>50% (Saturated)</span>
                                </div>
                            </div>
                            <div id="moistureResult" class="interpretation-result">
                                <!-- Dynamic content -->
                            </div>
                        </div>
                    `,
                    validation: () => true // Interactive, no specific validation needed
                },
                {
                    type: 'practical',
                    title: 'Real Agricultural Decision Making',
                    content: `
                        <div class="decision-scenario">
                            <h4>Scenario: Corn Farm Irrigation Decision</h4>
                            <div class="scenario-data">
                                <div class="data-box">
                                    <span class="data-label">SMAP Soil Moisture:</span>
                                    <span class="data-value">15%</span>
                                </div>
                                <div class="data-box">
                                    <span class="data-label">Weather Forecast:</span>
                                    <span class="data-value">3 days sunny</span>
                                </div>
                                <div class="data-box">
                                    <span class="data-label">Crop Growth Stage:</span>
                                    <span class="data-value">Grain filling</span>
                                </div>
                            </div>
                            <div class="decision-options">
                                <button onclick="nasaDataTutorial.makeDecision('irrigate')" class="decision-btn">
                                    Irrigate immediately
                                </button>
                                <button onclick="nasaDataTutorial.makeDecision('wait')" class="decision-btn">
                                    Wait 1-2 more days
                                </button>
                                <button onclick="nasaDataTutorial.makeDecision('light')" class="decision-btn">
                                    Light irrigation only
                                </button>
                            </div>
                            <div id="decisionResult" class="decision-feedback"></div>
                        </div>
                    `
                }
            ]
        });
    }

    /**
     * NDVI Tutorial Module
     */
    showNDVITutorial() {
        this.showInteractiveLesson({
            title: 'NDVI: Understanding Crop Health with Vegetation Index',
            steps: [
                {
                    type: 'explanation',
                    title: 'What is NDVI?',
                    content: `
                        <div class="ndvi-explanation">
                            <div class="ndvi-formula">
                                <h4>NDVI = (NIR - Red) / (NIR + Red)</h4>
                                <div class="formula-breakdown">
                                    <div class="wavelength near-infrared">
                                        <span>NIR (Near Infrared)</span>
                                        <div class="wavelength-bar nir"></div>
                                        <small>Healthy plants reflect more</small>
                                    </div>
                                    <div class="wavelength red">
                                        <span>Red (Red Light)</span>
                                        <div class="wavelength-bar red"></div>
                                        <small>Chlorophyll absorbs more</small>
                                    </div>
                                </div>
                            </div>
                            <div class="ndvi-scale">
                                <h4>NDVI Value Meanings:</h4>
                                <div class="scale-bar">
                                    <div class="scale-segment water" data-range="-1 ~ 0">Water/Soil</div>
                                    <div class="scale-segment sparse" data-range="0 ~ 0.3">Stressed</div>
                                    <div class="scale-segment moderate" data-range="0.3 ~ 0.7">Moderate</div>
                                    <div class="scale-segment healthy" data-range="0.7 ~ 1">Healthy</div>
                                </div>
                            </div>
                        </div>
                    `
                },
                {
                    type: 'interactive',
                    title: 'Learning NDVI Patterns by Crop Type',
                    content: `
                        <div class="crop-ndvi-game">
                            <h4>Observe NDVI changes for each crop:</h4>
                            <div class="crop-selector">
                                <button onclick="nasaDataTutorial.showCropNDVI('corn')" class="crop-btn">🌽 Corn</button>
                                <button onclick="nasaDataTutorial.showCropNDVI('wheat')" class="crop-btn">🌾 Wheat</button>
                                <button onclick="nasaDataTutorial.showCropNDVI('soybean')" class="crop-btn">🫛 Soybean</button>
                            </div>
                            <div id="cropNDVIChart" class="ndvi-chart">
                                <!-- Dynamic chart content -->
                            </div>
                            <div id="cropAnalysis" class="crop-analysis">
                                <!-- Dynamic analysis -->
                            </div>
                        </div>
                    `
                },
                {
                    type: 'challenge',
                    title: 'Diagnosing Problem Areas',
                    content: `
                        <div class="diagnostic-challenge">
                            <h4>Anomaly Detected!</h4>
                            <div class="satellite-image-sim">
                                <div class="field-grid">
                                    ${Array.from({length: 25}, (_, i) => {
                                        const ndvi = i < 5 || i > 19 ? Math.random() * 0.3 + 0.1 : Math.random() * 0.4 + 0.6;
                                        return `<div class="field-pixel" style="background-color: ${this.getNDVIColor(ndvi)}" data-ndvi="${ndvi.toFixed(2)}"></div>`;
                                    }).join('')}
                                </div>
                            </div>
                            <div class="diagnostic-question">
                                <p>Where are the problem areas in this NDVI map?</p>
                                <div class="diagnostic-options">
                                    <button onclick="nasaDataTutorial.diagnose('edges')" class="diagnostic-btn">Edge areas</button>
                                    <button onclick="nasaDataTutorial.diagnose('center')" class="diagnostic-btn">Center areas</button>
                                    <button onclick="nasaDataTutorial.diagnose('random')" class="diagnostic-btn">Random distribution</button>
                                </div>
                            </div>
                        </div>
                    `
                }
            ]
        });
    }

    /**
     * Data Limitations Tutorial
     */
    showDataLimitationsTutorial() {
        this.showInteractiveLesson({
            title: 'Satellite Data Limitations and Proper Interpretation',
            steps: [
                {
                    type: 'explanation',
                    title: 'Importance of Resolution',
                    content: `
                        <div class="resolution-demo">
                            <h4>Data Accuracy by Farm Size</h4>
                            <div class="farm-size-comparison">
                                <div class="farm-demo small">
                                    <div class="farm-boundary"></div>
                                    <div class="pixel-overlay smap"></div>
                                    <h5>Small Farm (1km²)</h5>
                                    <p class="accuracy low">SMAP Accuracy: ⭐⭐☆☆☆</p>
                                    <small>One 9km pixel contains 9 farms</small>
                                </div>
                                <div class="farm-demo large">
                                    <div class="farm-boundary large"></div>
                                    <div class="pixel-overlay smap"></div>
                                    <h5>Large Farm (100km²)</h5>
                                    <p class="accuracy high">SMAP Accuracy: ⭐⭐⭐⭐⭐</p>
                                    <small>Farm contains multiple SMAP pixels</small>
                                </div>
                            </div>
                            <div class="key-lesson">
                                <h5>🎯 Key Lesson:</h5>
                                <p>SMAP is suitable for large farms, while small farms should use it with ground sensors.</p>
                            </div>
                        </div>
                    `
                },
                {
                    type: 'interactive',
                    title: 'Understanding Cloud Effects',
                    content: `
                        <div class="cloud-effect-demo">
                            <h4>☁️ How Clouds Affect NDVI Data</h4>
                            <div class="cloud-scenario">
                                <div class="satellite-view">
                                    <div class="field-image clear" id="fieldView">
                                        <div class="vegetation healthy"></div>
                                    </div>
                                    <div class="cloud-layer" id="cloudLayer" style="opacity: 0;"></div>
                                </div>
                                <div class="cloud-controls">
                                    <label>Cloud Coverage:</label>
                                    <input type="range" min="0" max="100" value="0"
                                           oninput="nasaDataTutorial.adjustCloudCover(this.value)">
                                    <span id="cloudPercent">0%</span>
                                </div>
                                <div class="ndvi-reading">
                                    <span>Measured NDVI: </span>
                                    <span id="cloudAffectedNDVI">0.75</span>
                                </div>
                            </div>
                            <div class="lesson-explanation" id="cloudLesson">
                                When there are no clouds, accurate NDVI values can be obtained.
                            </div>
                        </div>
                    `
                },
                {
                    type: 'practical',
                    title: 'Making Smart Decisions with Incomplete Data',
                    content: `
                        <div class="incomplete-data-scenario">
                            <h4>Real Situation: When Data Isn't Perfect</h4>
                            <div class="data-status">
                                <div class="data-item">
                                    <span class="data-source">SMAP Soil Moisture:</span>
                                    <span class="data-value missing">❌ 3-day-old data (clouds)</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-source">MODIS NDVI:</span>
                                    <span class="data-value partial">⚠️ Partial data (50% clouds)</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-source">Ground Sensors:</span>
                                    <span class="data-value good">✅ Real-time data</span>
                                </div>
                            </div>
                            <div class="decision-framework">
                                <h5>Proper Approach:</h5>
                                <ol>
                                    <li>✅ Assess reliability of available data</li>
                                    <li>✅ Prioritize ground sensor data</li>
                                    <li>✅ Reference historical patterns and trends</li>
                                    <li>✅ Make conservative decisions</li>
                                </ol>
                            </div>
                        </div>
                    `
                }
            ]
        });
    }

    /**
     * Conservation Agriculture Tutorial
     */
    showConservationTutorial() {
        this.showInteractiveLesson({
            title: 'Conservation Agriculture and NASA Data Applications',
            steps: [
                {
                    type: 'explanation',
                    title: 'Three Principles of Conservation Agriculture',
                    content: `
                        <div class="conservation-principles">
                            <div class="principle">
                                <div class="principle-icon">SOIL</div>
                                <h4>Minimum Soil Disturbance</h4>
                                <p>Preserve soil structure with no-till or minimum tillage</p>
                                <div class="nasa-connection">
                                    <strong>NASA Data Use:</strong> Monitor soil moisture patterns with SMAP
                                </div>
                            </div>
                            <div class="principle">
                                <div class="principle-icon">COVER</div>
                                <h4>Permanent Soil Cover</h4>
                                <p>Protect soil with crop residue or cover crops</p>
                                <div class="nasa-connection">
                                    <strong>NASA Data Use:</strong> Monitor coverage levels with NDVI
                                </div>
                            </div>
                            <div class="principle">
                                <div class="principle-icon">ROTATE</div>
                                <h4>Crop Diversification</h4>
                                <p>Enhance biodiversity through rotation and intercropping</p>
                                <div class="nasa-connection">
                                    <strong>NASA Data Use:</strong> Track soil health with long-term NDVI trends
                                </div>
                            </div>
                        </div>
                    `
                },
                {
                    type: 'simulation',
                    title: '10-Year Farming Method Comparison Simulation',
                    content: `
                        <div class="farming-simulation">
                            <h4>Conventional vs Conservation Agriculture Long-term Comparison</h4>
                            <div class="simulation-controls">
                                <button onclick="nasaDataTutorial.runSimulation('conventional')" class="sim-btn">Run Conventional</button>
                                <button onclick="nasaDataTutorial.runSimulation('conservation')" class="sim-btn">Run Conservation</button>
                                <button onclick="nasaDataTutorial.runSimulation('both')" class="sim-btn">Compare Both</button>
                            </div>
                            <div id="simulationResults" class="simulation-results">
                                <!-- Dynamic simulation results -->
                            </div>
                        </div>
                    `
                },
                {
                    type: 'planning',
                    title: 'Create Your Conservation Agriculture Plan',
                    content: `
                        <div class="conservation-planner">
                            <h4>🎯 Conservation Agriculture Strategy for Your Farm</h4>
                            <div class="farm-assessment">
                                <div class="input-group">
                                    <label>Farm Size:</label>
                                    <select onchange="nasaDataTutorial.updateStrategy()">
                                        <option value="small">Small (1-10 hectares)</option>
                                        <option value="medium">Medium (10-100 hectares)</option>
                                        <option value="large">Large (100+ hectares)</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Main Crops:</label>
                                    <select onchange="nasaDataTutorial.updateStrategy()">
                                        <option value="grains">Grains</option>
                                        <option value="vegetables">Vegetables</option>
                                        <option value="mixed">Mixed cultivation</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Climate:</label>
                                    <select onchange="nasaDataTutorial.updateStrategy()">
                                        <option value="temperate">Temperate</option>
                                        <option value="arid">Arid</option>
                                        <option value="tropical">Tropical</option>
                                    </select>
                                </div>
                            </div>
                            <div id="customStrategy" class="strategy-output">
                                <!-- Personalized strategy -->
                            </div>
                        </div>
                    `
                }
            ]
        });
    }

    /**
     * Interactive lesson framework
     */
    showInteractiveLesson(lesson) {
        // Close existing modal
        this.closeTutorial();

        const overlay = document.createElement('div');
        overlay.className = 'tutorial-lesson-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'tutorial-lesson-modal';
        modal.innerHTML = `
            <div class="lesson-content">
                <div class="lesson-header">
                    <h2>${lesson.title}</h2>
                    <div class="lesson-progress">
                        <span>1 / ${lesson.steps.length}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(1/lesson.steps.length)*100}%"></div>
                        </div>
                    </div>
                    <button class="close-btn" onclick="nasaDataTutorial.closeTutorial()">✕</button>
                </div>

                <div class="lesson-body" id="lessonBody">
                    ${lesson.steps[0].content}
                </div>

                <div class="lesson-footer">
                    <button id="prevBtn" onclick="nasaDataTutorial.previousStep()" style="display: none;">Previous</button>
                    <button id="nextBtn" onclick="nasaDataTutorial.nextStep()">Next</button>
                    <button id="completeBtn" onclick="nasaDataTutorial.completeModule()" style="display: none;">Complete</button>
                </div>
            </div>
        `;

        // 기존 모달이 있다면 제거
        const existingOverlay = document.querySelector('.tutorial-lesson-modal-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // 모달을 오버레이에 추가하고 body에 오버레이 추가
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // 강제로 중앙 정렬 스타일 적용 (즉시 + 지연)
        const applyLessonModalStyles = () => {
            overlay.style.cssText = `
                position: fixed !important;
                inset: 0 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                z-index: 99999 !important;
                background: rgba(7, 23, 63, 0.85) !important;
                backdrop-filter: blur(8px) !important;
            `;

            modal.style.cssText = `
                position: static !important;
                transform: none !important;
                margin: auto !important;
                background: white !important;
                color: #333 !important;
                border-radius: 16px !important;
                padding: 0 !important;
                max-width: 900px !important;
                width: 90vw !important;
                max-height: 85vh !important;
                overflow: hidden !important;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4) !important;
            `;
        };

        // 즉시 적용
        applyLessonModalStyles();

        // 지연 후 재적용 (다른 스크립트가 덮어쓰는 경우 대비)
        setTimeout(applyLessonModalStyles, 10);
        setTimeout(applyLessonModalStyles, 100);
        setTimeout(applyLessonModalStyles, 500);

        this.currentLesson = lesson;
        this.currentStepIndex = 0;
    }

    /**
     * Navigation methods
     */
    nextStep() {
        if (this.currentStepIndex < this.currentLesson.steps.length - 1) {
            this.currentStepIndex++;
            this.updateLessonStep();
        }
    }

    previousStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.updateLessonStep();
        }
    }

    updateLessonStep() {
        const step = this.currentLesson.steps[this.currentStepIndex];
        const lessonBody = document.getElementById('lessonBody');
        const progressFill = document.querySelector('.lesson-progress .progress-fill');
        const progressText = document.querySelector('.lesson-progress span');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const completeBtn = document.getElementById('completeBtn');

        // Update content
        lessonBody.innerHTML = step.content;

        // Update progress
        const progress = ((this.currentStepIndex + 1) / this.currentLesson.steps.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${this.currentStepIndex + 1} / ${this.currentLesson.steps.length}`;

        // Update navigation buttons
        prevBtn.style.display = this.currentStepIndex > 0 ? 'inline-block' : 'none';

        if (this.currentStepIndex === this.currentLesson.steps.length - 1) {
            nextBtn.style.display = 'none';
            completeBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            completeBtn.style.display = 'none';
        }
    }

    /**
     * Interactive method implementations
     */
    updateMoistureInterpretation(value) {
        const result = document.getElementById('moistureResult');
        const moisture = parseInt(value);

        let interpretation, recommendation, color;

        if (moisture < 10) {
            interpretation = 'Very Dry';
            recommendation = 'Immediate irrigation needed';
            color = '#e74c3c';
        } else if (moisture < 20) {
            interpretation = 'Dry';
            recommendation = 'Irrigation recommended within 1-2 days';
            color = '#f39c12';
        } else if (moisture < 35) {
            interpretation = 'Adequate';
            recommendation = 'Maintain current status';
            color = '#27ae60';
        } else {
            interpretation = 'Excess';
            recommendation = 'Check drainage system';
            color = '#3498db';
        }

        result.innerHTML = `
            <div class="interpretation" style="border-left: 4px solid ${color};">
                <h5>Soil Moisture ${moisture}%</h5>
                <p><strong>Status:</strong> ${interpretation}</p>
                <p><strong>Recommendation:</strong> ${recommendation}</p>
            </div>
        `;
    }

    makeDecision(decision) {
        const result = document.getElementById('decisionResult');
        const decisions = {
            irrigate: {
                title: 'Correct Choice!',
                explanation: '15% soil moisture is too low for corn during grain filling. Immediate irrigation can prevent yield loss.',
                outcome: 'Yield achieved: 95%',
                color: '#27ae60'
            },
            wait: {
                title: 'Risky Choice',
                explanation: 'Corn during grain filling needs sufficient water. Waiting longer could cause problems with kernel formation.',
                outcome: 'Expected yield: 70%',
                color: '#f39c12'
            },
            light: {
                title: 'Insufficient Action',
                explanation: '15% soil moisture is a serious level. Light irrigation is insufficient; adequate amount is needed.',
                outcome: 'Expected yield: 80%',
                color: '#e67e22'
            }
        };

        const chosen = decisions[decision];
        result.innerHTML = `
            <div class="decision-outcome" style="border-left: 4px solid ${chosen.color};">
                <h5>${chosen.title}</h5>
                <p>${chosen.explanation}</p>
                <div class="outcome">${chosen.outcome}</div>
            </div>
        `;
    }

    getNDVIColor(ndvi) {
        if (ndvi < 0) return '#4A90E2'; // Water
        if (ndvi < 0.3) return '#E74C3C'; // Stressed
        if (ndvi < 0.7) return '#F39C12'; // Moderate
        return '#27AE60'; // Healthy
    }

    closeTutorial() {
        const overlays = document.querySelectorAll('.tutorial-modal-overlay, .tutorial-lesson-modal-overlay');
        overlays.forEach(overlay => overlay.remove());
        this.isActive = false;
    }

    completeModule() {
        this.completedModules.add(this.currentModule.id);
        this.closeTutorial();

        // Show completion celebration
        this.showCompletionCelebration();

        // Save progress
        this.saveProgress();
    }

    showCompletionCelebration() {
        // Simple completion notification
        alert(`🎉 "${this.currentModule.title}" module completed!`);
    }

    saveProgress() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('nasaTutorialProgress', JSON.stringify([...this.completedModules]));
        }
    }

    loadProgress() {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('nasaTutorialProgress');
            if (saved) {
                this.completedModules = new Set(JSON.parse(saved));
            }
        }
    }
}

// CSS Styles for Tutorial
const tutorialStyles = `
<style>
.tutorial-modal {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(7, 23, 63, 0.9) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 99999 !important;
    backdrop-filter: blur(8px);
    margin: 0 !important;
    padding: 0 !important;
}

.tutorial-lesson-modal {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 0, 0, 0.2) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 99999 !important;
    backdrop-filter: blur(3px);
    margin: 0 !important;
    padding: 0 !important;
}

.tutorial-content, .lesson-content {
    background: linear-gradient(135deg, #F8FBFF, #E8F4FD) !important;
    border-radius: 15px !important;
    max-width: 900px !important;
    width: 90% !important;
    max-height: 90vh !important;
    overflow-y: auto !important;
    box-shadow: 0 20px 60px rgba(0, 66, 166, 0.4) !important;
    border: 3px solid #0042A6 !important;
    position: relative !important;
    margin: 0 !important;
    transform: translateY(0) !important;
}

.tutorial-header, .lesson-header {
    background: linear-gradient(45deg, #0042A6, #2E96F5);
    color: white;
    padding: 20px 30px;
    border-radius: 12px 12px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Overpass', sans-serif;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    opacity: 0.8;
}

.close-btn:hover {
    opacity: 1;
}

.tutorial-intro {
    padding: 20px 30px;
    text-align: center;
    font-family: 'Overpass', sans-serif;
    color: #07173F;
}

.tutorial-intro p {
    color: #333;
    font-size: 1.1em;
    font-weight: 500;
}

.progress-indicator {
    margin-top: 15px;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #ECF0F1;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 8px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(45deg, #0042A6, #2E96F5);
    transition: width 0.3s ease;
}

.module-selection {
    padding: 0 30px;
}

.module-card {
    border: 2px solid #E8F4FD;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Overpass', sans-serif;
    background: #FAFBFC;
}

.module-card h3 {
    color: #07173F;
    margin-bottom: 8px;
}

.module-card p {
    color: #4A5568;
    margin: 0;
}

.module-card:hover {
    border-color: #0042A6;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 66, 166, 0.2);
    background: white;
}

.module-card.completed {
    background: #D5EDDA;
    border-color: #27AE60;
}

.module-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.difficulty {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
}

.difficulty.beginner { background: #D4EDDA; color: #155724; }
.difficulty.intermediate { background: #FFF3CD; color: #856404; }
.difficulty.advanced { background: #F8D7DA; color: #721C24; }

.check {
    color: #27AE60;
    font-size: 18px;
}

.tutorial-footer {
    padding: 20px 30px;
    text-align: center;
    border-top: 1px solid #ECF0F1;
}

.start-btn {
    background: linear-gradient(45deg, #0042A6, #2E96F5);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Overpass', sans-serif;
    font-weight: 600;
}

.start-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 66, 166, 0.3);
}

/* Interactive Elements */
.concept-visual {
    background: linear-gradient(135deg, #0042A6, #2E96F5) !important;
    color: white !important;
    padding: 20px;
    border-radius: 8px;
    margin: 15px 0;
    border: 2px solid #07173F;
    box-shadow: 0 4px 12px rgba(0, 66, 166, 0.3);
}

.concept-visual p, .concept-visual li {
    color: white !important;
    font-family: 'Overpass', sans-serif;
    font-weight: 500;
}

.concept-visual strong {
    color: #EAFE07 !important;
    font-weight: 700;
}

.satellite-demo {
    text-align: center;
    margin-bottom: 20px;
}

.soil-moisture-slider {
    margin: 20px 0;
}

.moisture-scale {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 12px;
    color: #666;
}

.interpretation-result {
    margin-top: 20px;
}

.interpretation {
    padding: 15px;
    border-radius: 8px;
    background: #F8F9FA;
}

.decision-scenario {
    background: #F8F9FA;
    padding: 20px;
    border-radius: 8px;
}

.scenario-data {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.data-box {
    background: white;
    padding: 15px;
    border-radius: 6px;
    text-align: center;
}

.data-label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
}

.data-value {
    font-size: 18px;
    font-weight: bold;
    color: #07173F;
    font-family: 'Overpass', sans-serif;
}

.decision-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.decision-btn {
    background: linear-gradient(45deg, #0042A6, #2E96F5);
    border: 2px solid #07173F;
    padding: 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Overpass', sans-serif;
    font-weight: 500;
    color: white !important;
}

.decision-btn:hover {
    background: linear-gradient(45deg, #2E96F5, #EAFE07);
    color: #07173F !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 66, 166, 0.3);
}

.lesson-footer {
    padding: 20px 30px;
    border-top: 1px solid #ECF0F1;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.lesson-footer button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
}

#prevBtn {
    background: #95A5A6;
    color: white;
}

#nextBtn, #completeBtn {
    background: linear-gradient(45deg, #0042A6, #2E96F5);
    color: white;
    font-family: 'Overpass', sans-serif;
    font-weight: 600;
    transition: all 0.3s ease;
}

#nextBtn:hover, #completeBtn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 66, 166, 0.3);
}

.lesson-body {
    padding: 25px;
    font-family: 'Overpass', sans-serif;
    line-height: 1.6;
    color: #07173F !important;
    background: white;
}

.lesson-body h3, .lesson-body h4, .lesson-body h5 {
    color: #0042A6 !important;
    font-family: 'Overpass', sans-serif;
}

.lesson-body p {
    color: #333 !important;
    font-weight: 500;
}

.lesson-body strong {
    color: #07173F !important;
}

@media (max-width: 768px) {
    .tutorial-content, .lesson-content {
        margin: 10px;
        max-width: calc(100% - 20px);
    }

    .tutorial-header, .lesson-header {
        padding: 15px 20px;
    }

    .tutorial-intro {
        padding: 15px 20px;
    }

    .module-selection {
        padding: 0 20px;
    }
}
</style>
`;

// Add styles to head
if (!document.querySelector('#nasa-tutorial-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'nasa-tutorial-styles';
    styleElement.innerHTML = tutorialStyles;
    document.head.appendChild(styleElement);
}

export default NASADataTutorial;