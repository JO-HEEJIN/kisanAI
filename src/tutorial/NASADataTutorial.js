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

        // 강제로 중앙 정렬 스타일 적용 (즉시 + 지연) - CSS 변수 사용
        const applyModalStyles = () => {
            overlay.style.cssText = `
                position: fixed !important;
                inset: 0 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                z-index: 99999 !important;
                background: var(--modal-backdrop, rgba(7, 23, 63, 0.9)) !important;
                backdrop-filter: blur(12px) !important;
                padding: 1rem !important;
                box-sizing: border-box !important;
            `;

            modal.style.cssText = `
                position: static !important;
                transform: none !important;
                margin: auto !important;
                background: white !important;
                border: 2px solid var(--modal-border-color, #0042A6) !important;
                border-radius: var(--modal-border-radius, 20px) !important;
                max-width: var(--modal-max-width, 850px) !important;
                width: 95vw !important;
                max-height: 90vh !important;
                overflow: hidden !important;
                box-shadow: var(--modal-shadow, 0 25px 80px rgba(4, 66, 166, 0.4)) !important;
                display: flex !important;
                flex-direction: column !important;
                color: #333 !important;
                animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
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
                                <button onclick="nasaDataTutorial.showCropNDVI('corn')" class="crop-btn">Corn</button>
                                <button onclick="nasaDataTutorial.showCropNDVI('wheat')" class="crop-btn">Wheat</button>
                                <button onclick="nasaDataTutorial.showCropNDVI('soybean')" class="crop-btn">Soybean</button>
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
                                <h5>Key Lesson:</h5>
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
                            <h4>Conservation Agriculture Strategy for Your Farm</h4>
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

        // 강제로 중앙 정렬 스타일 적용 (즉시 + 지연) - CSS 변수 사용
        const applyLessonModalStyles = () => {
            overlay.style.cssText = `
                position: fixed !important;
                inset: 0 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                z-index: 99999 !important;
                background: var(--modal-backdrop, rgba(7, 23, 63, 0.9)) !important;
                backdrop-filter: blur(12px) !important;
                padding: 1rem !important;
                box-sizing: border-box !important;
            `;

            modal.style.cssText = `
                position: static !important;
                transform: none !important;
                margin: auto !important;
                background: var(--nasa-white, white) !important;
                border: 2px solid var(--modal-border-color, #0042A6) !important;
                border-radius: var(--modal-border-radius, 20px) !important;
                padding: 0 !important;
                max-width: calc(var(--modal-max-width, 850px) + 100px) !important;
                width: 95vw !important;
                max-height: 88vh !important;
                overflow: hidden !important;
                box-shadow: var(--modal-shadow, 0 25px 80px rgba(0, 0, 0, 0.4)) !important;
                display: flex !important;
                flex-direction: column !important;
                color: var(--nasa-deep-blue, #333) !important;
                animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
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

        // Ensure global instance is available for button clicks
        window.nasaDataTutorial = this;
        console.log('🌐 Global nasaDataTutorial instance set for lesson:', lesson.title);
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

    /**
     * Show NDVI changes for specific crop type
     */
    showCropNDVI(cropType) {
        console.log(`📊 Showing NDVI data for ${cropType}`);

        // NDVI data patterns for different crops (simulated realistic seasonal data)
        const cropNDVIData = {
            corn: {
                months: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                values: [0.2, 0.4, 0.7, 0.85, 0.9, 0.6, 0.3],
                color: '#FFA500',
                description: 'Corn shows rapid NDVI growth from May-August, peaking in late summer',
                characteristics: [
                    'Fast initial growth (May-June)',
                    'Peak NDVI: 0.85-0.9 (July-August)',
                    'Gradual decline during senescence',
                    'Harvest typically in September-October'
                ]
            },
            wheat: {
                months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                values: [0.3, 0.6, 0.8, 0.85, 0.4, 0.2, 0.15],
                color: '#DAA520',
                description: 'Wheat has earlier peak NDVI and faster decline compared to corn',
                characteristics: [
                    'Early season growth (March-May)',
                    'Peak NDVI: 0.8-0.85 (May-June)',
                    'Rapid senescence in July',
                    'Earlier harvest than corn'
                ]
            },
            soybean: {
                months: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
                values: [0.25, 0.5, 0.75, 0.82, 0.8, 0.5, 0.25],
                color: '#228B22',
                description: 'Soybean shows gradual NDVI increase and maintains high values longer',
                characteristics: [
                    'Slower initial growth than corn',
                    'Peak NDVI: 0.8-0.82 (July-August)',
                    'Maintains high NDVI through September',
                    'Later harvest season'
                ]
            }
        };

        const data = cropNDVIData[cropType];
        if (!data) {
            console.error(`No NDVI data available for crop: ${cropType}`);
            return;
        }

        // Update chart container
        const chartContainer = document.getElementById('cropNDVIChart');
        if (!chartContainer) {
            console.error('cropNDVIChart container not found');
            return;
        }

        // Create NDVI chart visualization
        chartContainer.innerHTML = `
            <div class="ndvi-chart-container">
                <h5>🌿 ${cropType.charAt(0).toUpperCase() + cropType.slice(1)} NDVI Seasonal Pattern</h5>
                <div class="chart-wrapper">
                    <canvas id="ndviCanvas" width="400" height="200"></canvas>
                </div>
                <div class="ndvi-legend">
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: ${data.color}"></span>
                        <span>${cropType.charAt(0).toUpperCase() + cropType.slice(1)} NDVI</span>
                    </div>
                </div>
            </div>
        `;

        // Draw the chart
        setTimeout(() => {
            this.drawNDVIChart(data);
        }, 100);

        // Update analysis panel
        const analysisContainer = document.getElementById('cropAnalysis');
        if (analysisContainer) {
            analysisContainer.innerHTML = `
                <div class="crop-analysis-content">
                    <h5>📈 Analysis: ${cropType.charAt(0).toUpperCase() + cropType.slice(1)}</h5>
                    <p class="analysis-description">${data.description}</p>

                    <div class="characteristics">
                        <h6>Key Characteristics:</h6>
                        <ul>
                            ${data.characteristics.map(char => `<li>${char}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="nasa-insight">
                        <h6>🛰️ NASA Farming Insight:</h6>
                        <p>Understanding crop-specific NDVI patterns helps farmers optimize planting timing,
                           predict harvest dates, and detect crop stress early for better yields.</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Draw NDVI chart on canvas
     */
    drawNDVIChart(data) {
        const canvas = document.getElementById('ndviCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Chart dimensions
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const y = padding + (chartHeight * i / 4);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw NDVI data
        ctx.strokeStyle = data.color;
        ctx.fillStyle = data.color;
        ctx.lineWidth = 3;

        const xStep = chartWidth / (data.values.length - 1);
        const maxNDVI = 1.0;

        // Draw line
        ctx.beginPath();
        data.values.forEach((value, index) => {
            const x = padding + index * xStep;
            const y = height - padding - (value / maxNDVI) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw data points
        data.values.forEach((value, index) => {
            const x = padding + index * xStep;
            const y = height - padding - (value / maxNDVI) * chartHeight;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        // X-axis labels (months)
        data.months.forEach((month, index) => {
            const x = padding + index * xStep;
            ctx.fillText(month, x, height - padding + 20);
        });

        // Y-axis labels (NDVI values)
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const value = (i / 4).toFixed(1);
            const y = height - padding - (i / 4) * chartHeight;
            ctx.fillText(value, padding - 10, y + 4);
        }

        // Chart title
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('NDVI Values Throughout Growing Season', width / 2, 20);
    }

    /**
     * Get color representation for NDVI value
     */
    getNDVIColor(ndvi) {
        // NDVI color scale from red (low) to green (high)
        // Typical NDVI values: -1 to 1, but for vegetation usually 0.1 to 0.9

        if (ndvi < 0.2) {
            // Very low/poor vegetation - Red tones
            return `rgb(${Math.floor(139 + (ndvi * 300))}, 0, 0)`;
        } else if (ndvi < 0.4) {
            // Low vegetation - Orange to yellow
            const red = 255;
            const green = Math.floor(165 * (ndvi - 0.2) / 0.2);
            return `rgb(${red}, ${green}, 0)`;
        } else if (ndvi < 0.6) {
            // Moderate vegetation - Yellow to yellow-green
            const red = Math.floor(255 * (0.6 - ndvi) / 0.2);
            const green = 255;
            return `rgb(${red}, ${green}, 0)`;
        } else if (ndvi < 0.8) {
            // Good vegetation - Green tones
            const green = Math.floor(200 + (55 * (ndvi - 0.6) / 0.2));
            return `rgb(0, ${green}, 0)`;
        } else {
            // Excellent vegetation - Dark green
            return `rgb(0, ${Math.floor(100 + (55 * Math.min(ndvi, 1.0)))}, 0)`;
        }
    }

    /**
     * Diagnose problem areas in NDVI map
     */
    diagnose(answer) {
        console.log(`🔍 User diagnosed: ${answer}`);

        const diagnosticQuestion = document.querySelector('.diagnostic-question');
        if (!diagnosticQuestion) {
            console.error('Diagnostic question container not found');
            return;
        }

        // The correct answer is 'edges' based on the field grid generation logic
        const correctAnswer = 'edges';
        const isCorrect = answer === correctAnswer;

        // Highlight problem areas on the map
        this.highlightProblemAreas(correctAnswer);

        // Show detailed feedback
        const feedbackHTML = `
            <div class="diagnosis-result ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="result-header">
                    <h5>${isCorrect ? '✅ Correct!' : '❌ Not quite right'}</h5>
                    <p class="result-explanation">
                        ${isCorrect
                            ? 'You correctly identified the problem areas!'
                            : 'The correct answer is "Edge areas". Let me show you why.'}
                    </p>
                </div>

                <div class="detailed-analysis">
                    <h6>🛰️ NDVI Analysis Results:</h6>
                    <div class="analysis-points">
                        <div class="analysis-point">
                            <span class="point-indicator problem">🔴</span>
                            <strong>Problem Areas (Low NDVI < 0.4):</strong>
                            Edge regions show signs of crop stress, possibly due to:
                            <ul>
                                <li>Water drainage issues at field boundaries</li>
                                <li>Soil compaction from machinery traffic</li>
                                <li>Nutrient depletion at field edges</li>
                                <li>Pest or disease pressure from neighboring areas</li>
                            </ul>
                        </div>

                        <div class="analysis-point">
                            <span class="point-indicator healthy">🟢</span>
                            <strong>Healthy Areas (NDVI > 0.6):</strong>
                            Center regions show optimal vegetation health with:
                            <ul>
                                <li>Consistent water distribution</li>
                                <li>Proper nutrient levels</li>
                                <li>Minimal edge effects</li>
                                <li>Protected from external stressors</li>
                            </ul>
                        </div>
                    </div>

                    <div class="recommended-actions">
                        <h6>📋 Recommended Actions:</h6>
                        <div class="action-list">
                            <div class="action-item priority-high">
                                <strong>🚨 Immediate (1-2 days):</strong>
                                <ul>
                                    <li>Inspect edge areas for visible signs of stress</li>
                                    <li>Check irrigation coverage at field boundaries</li>
                                    <li>Test soil moisture levels in problem areas</li>
                                </ul>
                            </div>

                            <div class="action-item priority-medium">
                                <strong>⚡ Short-term (1 week):</strong>
                                <ul>
                                    <li>Apply targeted fertilization to low-NDVI areas</li>
                                    <li>Adjust irrigation patterns for edge coverage</li>
                                    <li>Consider pest management if infestation detected</li>
                                </ul>
                            </div>

                            <div class="action-item priority-low">
                                <strong>📈 Long-term (next season):</strong>
                                <ul>
                                    <li>Plan field buffer zones to minimize edge effects</li>
                                    <li>Implement precision agriculture for variable-rate applications</li>
                                    <li>Monitor with regular satellite imagery updates</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="nasa-learning">
                        <h6>🎓 NASA Learning Point:</h6>
                        <p>This exercise demonstrates how NASA MODIS and Landsat satellites help farmers detect crop stress patterns that aren't visible to the naked eye. Early detection through satellite monitoring can improve yields by 15-20%!</p>
                    </div>
                </div>

                <button onclick="nasaDataTutorial.resetDiagnostic()" class="reset-btn">
                    🔄 Try Another Field
                </button>
            </div>
        `;

        // Replace the question with detailed feedback
        diagnosticQuestion.innerHTML = feedbackHTML;

        // Track this interaction for achievement progress
        if (window.achievementSystem) {
            window.achievementSystem.trackAction('data_analysis', 1);
        }
    }

    /**
     * Highlight problem areas on the NDVI map
     */
    highlightProblemAreas(correctAnswer) {
        const fieldPixels = document.querySelectorAll('.field-pixel');
        if (!fieldPixels || fieldPixels.length === 0) {
            console.error('Field pixels not found for highlighting');
            return;
        }

        fieldPixels.forEach((pixel, index) => {
            const ndvi = parseFloat(pixel.dataset.ndvi);

            // Remove any existing highlighting
            pixel.classList.remove('problem-area', 'healthy-area', 'highlighted');

            // Add appropriate highlighting based on NDVI value
            if (ndvi < 0.4) {
                pixel.classList.add('problem-area', 'highlighted');
                pixel.title = `Problem Area - NDVI: ${ndvi} (Low vegetation health)`;
            } else if (ndvi > 0.6) {
                pixel.classList.add('healthy-area');
                pixel.title = `Healthy Area - NDVI: ${ndvi} (Good vegetation health)`;
            } else {
                pixel.title = `Moderate Area - NDVI: ${ndvi} (Average vegetation health)`;
            }
        });

        // Add visual pulsing effect to problem areas
        setTimeout(() => {
            const problemAreas = document.querySelectorAll('.field-pixel.problem-area');
            problemAreas.forEach((area, index) => {
                setTimeout(() => {
                    area.style.boxShadow = '0 0 10px #ff4444, inset 0 0 10px #ff6666';
                    area.style.border = '2px solid #ff0000';
                    area.style.transform = 'scale(1.1)';
                }, index * 100);
            });
        }, 500);
    }

    /**
     * Reset the diagnostic challenge with new random field data
     */
    resetDiagnostic() {
        console.log('🔄 Resetting diagnostic challenge...');

        const diagnosticChallenge = document.querySelector('.diagnostic-challenge');
        if (!diagnosticChallenge) {
            console.error('Diagnostic challenge container not found');
            return;
        }

        // Generate new field data
        const newFieldHTML = `
            <h4>Anomaly Detected!</h4>
            <div class="satellite-image-sim">
                <div class="field-grid">
                    ${Array.from({length: 25}, (_, i) => {
                        // Create different problem patterns
                        let ndvi;
                        const patterns = ['edges', 'center', 'diagonal', 'random'];
                        const pattern = patterns[Math.floor(Math.random() * patterns.length)];

                        const row = Math.floor(i / 5);
                        const col = i % 5;

                        switch(pattern) {
                            case 'edges':
                                ndvi = (row === 0 || row === 4 || col === 0 || col === 4)
                                    ? Math.random() * 0.3 + 0.1
                                    : Math.random() * 0.4 + 0.6;
                                break;
                            case 'center':
                                ndvi = (row >= 1 && row <= 3 && col >= 1 && col <= 3)
                                    ? Math.random() * 0.3 + 0.1
                                    : Math.random() * 0.4 + 0.6;
                                break;
                            case 'diagonal':
                                ndvi = (row === col || row + col === 4)
                                    ? Math.random() * 0.3 + 0.1
                                    : Math.random() * 0.4 + 0.6;
                                break;
                            default: // random
                                ndvi = Math.random() < 0.3
                                    ? Math.random() * 0.3 + 0.1
                                    : Math.random() * 0.4 + 0.6;
                        }

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
        `;

        diagnosticChallenge.innerHTML = newFieldHTML;
    }

    /**
     * Conservation Agriculture Simulation
     */
    runSimulation(type) {
        console.log('🚀 Running simulation:', type);
        const resultsDiv = document.getElementById('simulationResults');
        if (!resultsDiv) {
            console.error('❌ simulationResults div not found!');
            return;
        }
        console.log('✅ Found simulationResults div:', resultsDiv);

        resultsDiv.innerHTML = '<div class="loading">🌱 Running simulation...</div>';

        // Simulate processing delay
        setTimeout(() => {
            const simulationData = this.generateSimulationData(type);
            resultsDiv.innerHTML = this.renderSimulationResults(simulationData);
        }, 1500);
    }

    generateSimulationData(type) {
        const baseData = {
            conventional: {
                name: 'Conventional Agriculture',
                color: '#E43700',
                years: Array.from({length: 10}, (_, i) => i + 1),
                soilHealth: [100, 95, 88, 82, 75, 68, 62, 55, 48, 42],
                yieldStability: [100, 98, 95, 92, 88, 85, 82, 78, 75, 71],
                costs: [100, 105, 112, 118, 125, 133, 140, 148, 156, 165],
                profit: [100, 102, 98, 95, 91, 87, 83, 78, 74, 69],
                carbonFootprint: [100, 103, 107, 111, 115, 120, 125, 130, 136, 142]
            },
            conservation: {
                name: 'Conservation Agriculture',
                color: '#228B22',
                years: Array.from({length: 10}, (_, i) => i + 1),
                soilHealth: [100, 102, 106, 112, 119, 127, 136, 146, 157, 169],
                yieldStability: [100, 98, 102, 107, 113, 120, 128, 137, 147, 158],
                costs: [100, 95, 92, 88, 85, 82, 79, 76, 73, 70],
                profit: [100, 97, 103, 110, 118, 127, 137, 148, 160, 173],
                carbonFootprint: [100, 92, 85, 78, 71, 65, 58, 52, 46, 40]
            }
        };

        if (type === 'both') {
            return {
                conventional: baseData.conventional,
                conservation: baseData.conservation,
                comparison: true
            };
        }

        return { [type]: baseData[type] };
    }

    renderSimulationResults(data) {
        if (data.comparison) {
            return this.renderComparisonResults(data);
        }

        const method = Object.keys(data)[0];
        const methodData = data[method];

        return `
            <div class="simulation-dashboard">
                <div class="dashboard-header">
                    <h3 style="color: ${methodData.color}">
                        📊 ${methodData.name} - 10 Year Analysis
                    </h3>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-icon">🌱</span>
                            <h4>Soil Health</h4>
                        </div>
                        <div class="metric-trend">
                            ${this.renderTrendChart(methodData.soilHealth, methodData.color)}
                        </div>
                        <div class="metric-summary">
                            <strong>${methodData.soilHealth[0]}% → ${methodData.soilHealth[9]}%</strong>
                            <span class="${methodData.soilHealth[9] > methodData.soilHealth[0] ? 'positive' : 'negative'}">
                                ${methodData.soilHealth[9] > methodData.soilHealth[0] ? '📈' : '📉'}
                                ${Math.abs(methodData.soilHealth[9] - methodData.soilHealth[0])}%
                            </span>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-icon">🌾</span>
                            <h4>Yield Stability</h4>
                        </div>
                        <div class="metric-trend">
                            ${this.renderTrendChart(methodData.yieldStability, methodData.color)}
                        </div>
                        <div class="metric-summary">
                            <strong>${methodData.yieldStability[0]}% → ${methodData.yieldStability[9]}%</strong>
                            <span class="${methodData.yieldStability[9] > methodData.yieldStability[0] ? 'positive' : 'negative'}">
                                ${methodData.yieldStability[9] > methodData.yieldStability[0] ? '📈' : '📉'}
                                ${Math.abs(methodData.yieldStability[9] - methodData.yieldStability[0])}%
                            </span>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-icon">💰</span>
                            <h4>Profit Index</h4>
                        </div>
                        <div class="metric-trend">
                            ${this.renderTrendChart(methodData.profit, methodData.color)}
                        </div>
                        <div class="metric-summary">
                            <strong>${methodData.profit[0]}% → ${methodData.profit[9]}%</strong>
                            <span class="${methodData.profit[9] > methodData.profit[0] ? 'positive' : 'negative'}">
                                ${methodData.profit[9] > methodData.profit[0] ? '📈' : '📉'}
                                ${Math.abs(methodData.profit[9] - methodData.profit[0])}%
                            </span>
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-header">
                            <span class="metric-icon">🌍</span>
                            <h4>Carbon Footprint</h4>
                        </div>
                        <div class="metric-trend">
                            ${this.renderTrendChart(methodData.carbonFootprint, methodData.color, true)}
                        </div>
                        <div class="metric-summary">
                            <strong>${methodData.carbonFootprint[0]}% → ${methodData.carbonFootprint[9]}%</strong>
                            <span class="${methodData.carbonFootprint[9] < methodData.carbonFootprint[0] ? 'positive' : 'negative'}">
                                ${methodData.carbonFootprint[9] < methodData.carbonFootprint[0] ? '📉' : '📈'}
                                ${Math.abs(methodData.carbonFootprint[9] - methodData.carbonFootprint[0])}%
                            </span>
                        </div>
                    </div>
                </div>

                <div class="nasa-insights">
                    <h4>🛰️ NASA Data Insights</h4>
                    <div class="insights-content">
                        ${this.getNASAInsights(method)}
                    </div>
                </div>
            </div>
        `;
    }

    renderComparisonResults(data) {
        const conv = data.conventional;
        const cons = data.conservation;

        return `
            <div class="comparison-dashboard">
                <div class="dashboard-header">
                    <h3>⚡ Conventional vs Conservation Agriculture - 10 Year Comparison</h3>
                </div>

                <div class="comparison-summary">
                    <div class="method-summary conventional">
                        <h4 style="color: ${conv.color}">🏭 Conventional</h4>
                        <div class="summary-stats">
                            <div class="stat">Soil Health: <span class="negative">-${100 - conv.soilHealth[9]}%</span></div>
                            <div class="stat">Profit: <span class="negative">-${100 - conv.profit[9]}%</span></div>
                            <div class="stat">Carbon: <span class="negative">+${conv.carbonFootprint[9] - 100}%</span></div>
                        </div>
                    </div>

                    <div class="vs-indicator">VS</div>

                    <div class="method-summary conservation">
                        <h4 style="color: ${cons.color}">🌱 Conservation</h4>
                        <div class="summary-stats">
                            <div class="stat">Soil Health: <span class="positive">+${cons.soilHealth[9] - 100}%</span></div>
                            <div class="stat">Profit: <span class="positive">+${cons.profit[9] - 100}%</span></div>
                            <div class="stat">Carbon: <span class="positive">-${100 - cons.carbonFootprint[9]}%</span></div>
                        </div>
                    </div>
                </div>

                <div class="comparison-charts">
                    <div class="chart-container">
                        <h4>📊 Side-by-Side Comparison</h4>
                        <div class="dual-chart">
                            <div class="chart-section">
                                <h5 style="color: ${conv.color}">Conventional</h5>
                                ${this.renderTrendChart(conv.profit, conv.color)}
                            </div>
                            <div class="chart-section">
                                <h5 style="color: ${cons.color}">Conservation</h5>
                                ${this.renderTrendChart(cons.profit, cons.color)}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="winner-analysis">
                    <div class="winner-card">
                        <h4>🏆 Long-term Winner: Conservation Agriculture</h4>
                        <div class="winner-details">
                            <div class="advantage">
                                <strong>Profit Advantage:</strong> +${cons.profit[9] - conv.profit[9]}% after 10 years
                            </div>
                            <div class="advantage">
                                <strong>Environmental Benefit:</strong> ${100 - cons.carbonFootprint[9]}% less carbon footprint
                            </div>
                            <div class="advantage">
                                <strong>Sustainability:</strong> ${cons.soilHealth[9] - 100}% improvement in soil health
                            </div>
                        </div>
                    </div>
                </div>

                <div class="nasa-insights">
                    <h4>🛰️ NASA Data Supporting Evidence</h4>
                    <div class="insights-content">
                        <div class="insight-item">
                            <strong>SMAP Soil Moisture:</strong> Conservation practices improve water retention by 25-40%
                        </div>
                        <div class="insight-item">
                            <strong>MODIS NDVI:</strong> Cover crops maintain vegetation health year-round
                        </div>
                        <div class="insight-item">
                            <strong>ECOSTRESS:</strong> No-till systems reduce heat stress by 3-5°C
                        </div>
                        <div class="insight-item">
                            <strong>GPM Precipitation:</strong> Better rainfall utilization with conservation practices
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTrendChart(data, color, inverted = false) {
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min;

        const points = data.map((value, index) => {
            const x = (index / (data.length - 1)) * 200;
            const y = inverted ?
                50 - ((value - min) / range) * 40 + 5 :
                50 - ((value - min) / range) * 40 + 5;
            return `${x},${y}`;
        }).join(' ');

        return `
            <svg width="220" height="60" class="trend-chart">
                <polyline points="${points}"
                          fill="none"
                          stroke="${color}"
                          stroke-width="3"
                          stroke-linecap="round"
                          stroke-linejoin="round"/>
                ${data.map((value, index) => {
                    const x = (index / (data.length - 1)) * 200;
                    const y = inverted ?
                        50 - ((value - min) / range) * 40 + 5 :
                        50 - ((value - min) / range) * 40 + 5;
                    return `<circle cx="${x}" cy="${y}" r="3" fill="${color}" opacity="0.8"/>`;
                }).join('')}
            </svg>
        `;
    }

    getNASAInsights(method) {
        const insights = {
            conventional: [
                "🛰️ SMAP data shows declining soil moisture retention over time",
                "📡 MODIS NDVI indicates reduced vegetation health in monoculture areas",
                "🌡️ ECOSTRESS reveals increasing heat stress due to bare soil exposure",
                "☔ GPM data suggests poor precipitation utilization efficiency"
            ],
            conservation: [
                "🛰️ SMAP demonstrates improved soil water storage capacity",
                "📡 MODIS NDVI shows consistent vegetation cover year-round",
                "🌡️ ECOSTRESS indicates lower surface temperatures with cover crops",
                "☔ GPM analysis reveals better rainfall infiltration and retention"
            ]
        };

        return insights[method].map(insight =>
            `<div class="insight-item">${insight}</div>`
        ).join('');
    }
}

// CSS Styles for Tutorial with NASA Space Apps Branding
const tutorialStyles = `
<style>
:root {
    /* NASA Space Apps Challenge Brand Colors */
    --nasa-blue-yonder: #2E96F5;
    --nasa-neon-blue: #0960E1;
    --nasa-electric-blue: #0042A6;
    --nasa-deep-blue: #07173F;
    --nasa-rocket-red: #E43700;
    --nasa-martian-red: #8E1100;
    --nasa-neon-yellow: #EAFE07;
    --nasa-white: #FFFFFF;

    /* Tutorial Modal Variables */
    --modal-bg-gradient: linear-gradient(135deg, var(--nasa-deep-blue), var(--nasa-neon-blue));
    --modal-border-color: var(--nasa-electric-blue);
    --modal-shadow: 0 25px 80px rgba(4, 66, 166, 0.4);
    --modal-backdrop: rgba(7, 23, 63, 0.9);
    --modal-border-radius: 20px;
    --modal-max-width: 850px;
    --modal-padding: 2rem;

    /* Interactive Elements */
    --button-primary: linear-gradient(135deg, var(--nasa-rocket-red), var(--nasa-martian-red));
    --button-secondary: linear-gradient(135deg, var(--nasa-blue-yonder), var(--nasa-electric-blue));
    --button-hover-transform: translateY(-2px);
    --button-border-radius: 12px;

    /* Typography */
    --text-primary: var(--nasa-white);
    --text-secondary: rgba(255, 255, 255, 0.85);
    --text-muted: rgba(255, 255, 255, 0.65);
}

.tutorial-modal-overlay {
    position: fixed !important;
    inset: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 99999 !important;
    background: var(--modal-backdrop) !important;
    backdrop-filter: blur(12px) !important;
    margin: 0 !important;
    padding: 1rem !important;
    box-sizing: border-box !important;
}

.tutorial-modal {
    position: static !important;
    transform: none !important;
    margin: auto !important;
    background: white !important;
    border: 2px solid var(--modal-border-color) !important;
    border-radius: var(--modal-border-radius) !important;
    max-width: var(--modal-max-width) !important;
    width: 95vw !important;
    max-height: 90vh !important;
    overflow: hidden !important;
    box-shadow: var(--modal-shadow) !important;
    display: flex !important;
    flex-direction: column !important;
    color: #333 !important;
    animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.tutorial-lesson-modal-overlay {
    position: fixed !important;
    inset: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 99999 !important;
    background: var(--modal-backdrop) !important;
    backdrop-filter: blur(12px) !important;
    padding: 1rem !important;
    box-sizing: border-box !important;
}

.tutorial-lesson-modal {
    position: static !important;
    transform: none !important;
    margin: auto !important;
    background: var(--nasa-white) !important;
    border: 2px solid var(--modal-border-color) !important;
    border-radius: var(--modal-border-radius) !important;
    max-width: calc(var(--modal-max-width) + 100px) !important;
    width: 95vw !important;
    max-height: 88vh !important;
    overflow: hidden !important;
    box-shadow: var(--modal-shadow) !important;
    display: flex !important;
    flex-direction: column !important;
    color: var(--nasa-deep-blue) !important;
    animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.tutorial-content {
    padding: var(--modal-padding) !important;
    height: 100% !important;
    overflow-y: auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 1.5rem !important;
}

.lesson-content {
    padding: 2rem !important;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
    height: 100% !important;
    overflow-y: auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 1.5rem !important;
    border-radius: 20px !important;
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    backdrop-filter: blur(10px) !important;
    position: relative !important;
}

.tutorial-header, .lesson-header {
    background: var(--button-secondary) !important;
    color: var(--text-primary) !important;
    padding: 1.5rem var(--modal-padding) !important;
    margin: calc(-1 * var(--modal-padding)) calc(-1 * var(--modal-padding)) 0 calc(-1 * var(--modal-padding)) !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    border-bottom: 2px solid var(--modal-border-color) !important;

.tutorial-header h2, .lesson-header h2 {
    margin: 0 !important;
    font-size: 1.75rem !important;
    font-weight: 600 !important;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
}

.close-btn {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 2px solid rgba(255, 255, 255, 0.2) !important;
    color: var(--text-primary) !important;
    font-size: 1.25rem !important;
    width: 3rem !important;
    height: 3rem !important;
    border-radius: 50% !important;
    cursor: pointer !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 600 !important;
}

.close-btn:hover {
    background: rgba(232, 67, 0, 0.9) !important;
    border-color: var(--nasa-rocket-red) !important;
    transform: var(--button-hover-transform) !important;
    box-shadow: 0 4px 12px rgba(232, 67, 0, 0.4) !important;
}

.tutorial-intro {
    padding: 0 !important;
    text-align: center !important;
}

.tutorial-intro p {
    font-size: 1.1rem !important;
    color: #666 !important;
    margin: 0 0 1.5rem 0 !important;
    line-height: 1.6 !important;
}

.progress-indicator {
    background: rgba(0, 66, 166, 0.1) !important;
    padding: 1rem !important;
    border-radius: var(--button-border-radius) !important;
    border: 1px solid rgba(0, 66, 166, 0.2) !important;
}

.progress-indicator span {
    color: #0042A6 !important;
    font-weight: 600 !important;
    font-size: 0.9rem !important;
}

.progress-bar {
    background: rgba(0, 66, 166, 0.2) !important;
    height: 8px !important;
    border-radius: 4px !important;
    margin-top: 0.5rem !important;
    overflow: hidden !important;
}

.progress-fill {
    background: var(--button-primary) !important;
    height: 100% !important;
    border-radius: 4px !important;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.module-selection {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
    gap: 1rem !important;
}

.module-card {
    background: rgba(0, 66, 166, 0.05) !important;
    border: 2px solid rgba(0, 66, 166, 0.15) !important;
    border-radius: var(--button-border-radius) !important;
    padding: 1.5rem !important;
    cursor: pointer !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    backdrop-filter: blur(10px) !important;
}

.module-card:hover {
    background: rgba(0, 66, 166, 0.1) !important;
    border-color: var(--nasa-blue-yonder) !important;
    transform: var(--button-hover-transform) !important;
    box-shadow: 0 8px 25px rgba(46, 150, 245, 0.3) !important;
}

.module-card.completed {
    background: rgba(234, 254, 7, 0.1) !important;
    border-color: var(--nasa-neon-yellow) !important;
}

.module-card.completed:hover {
    background: rgba(234, 254, 7, 0.15) !important;
}

.module-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    margin-bottom: 0.75rem !important;
}

.module-header h3 {
    margin: 0 !important;
    color: #333 !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
}

.difficulty {
    padding: 0.25rem 0.5rem !important;
    border-radius: 12px !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
}

.difficulty.beginner {
    background: rgba(39, 174, 96, 0.2) !important;
    color: #27AE60 !important;
}

.difficulty.intermediate {
    background: rgba(243, 156, 18, 0.2) !important;
    color: #F39C12 !important;
}

.difficulty.advanced {
    background: rgba(232, 67, 0, 0.2) !important;
    color: var(--nasa-rocket-red) !important;
}

.check {
    color: var(--nasa-neon-yellow) !important;
    font-size: 1.5rem !important;
    font-weight: bold !important;
}

.module-card p {
    color: #666 !important;
    font-size: 0.95rem !important;
    line-height: 1.5 !important;
    margin: 0 !important;
}

.tutorial-footer {
    text-align: center !important;
    border-top: 2px solid rgba(0, 66, 166, 0.1) !important;
    padding-top: 1.5rem !important;
    margin-top: 1.5rem !important;
}

.start-btn, .lesson-footer button {
    background: var(--button-primary) !important;
    border: none !important;
    color: var(--text-primary) !important;
    padding: 0.875rem 2rem !important;
    border-radius: var(--button-border-radius) !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    margin: 0 0.5rem !important;
    box-shadow: 0 4px 15px rgba(232, 67, 0, 0.3) !important;
}

.start-btn:hover, .lesson-footer button:hover {
    transform: var(--button-hover-transform) !important;
    box-shadow: 0 6px 20px rgba(232, 67, 0, 0.5) !important;
}

#nextBtn, #completeBtn {
    background: var(--button-secondary) !important;
    box-shadow: 0 4px 15px rgba(46, 150, 245, 0.3) !important;
}

#nextBtn:hover, #completeBtn:hover {
    box-shadow: 0 6px 20px rgba(46, 150, 245, 0.5) !important;
}

#prevBtn {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 2px solid rgba(255, 255, 255, 0.2) !important;
    box-shadow: none !important;
}

#prevBtn:hover {
    background: rgba(255, 255, 255, 0.15) !important;
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2) !important;
}

/* NDVI Chart Styles */
.crop-ndvi-game {
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
    margin: 15px 0;
}

.crop-selector {
    display: flex;
    gap: 10px;
    margin: 15px 0;
    justify-content: center;
}

.crop-btn {
    background: linear-gradient(135deg, var(--nasa-neon-blue), var(--nasa-electric-blue));
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.crop-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(9, 96, 225, 0.4);
}

.ndvi-chart {
    margin: 20px 0;
    min-height: 300px;
}

.ndvi-chart-container {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin: 15px 0;
}

.ndvi-chart-container h5 {
    color: var(--nasa-electric-blue);
    text-align: center;
    margin-bottom: 20px;
    font-size: 1.2em;
}

.chart-wrapper {
    text-align: center;
    margin: 15px 0;
}

.ndvi-legend {
    display: flex;
    justify-content: center;
    margin-top: 15px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 15px;
    background: #f8f9fa;
    border-radius: 15px;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.crop-analysis {
    margin: 20px 0;
}

.crop-analysis-content {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.crop-analysis-content h5 {
    color: var(--nasa-electric-blue);
    margin-bottom: 15px;
}

.analysis-description {
    color: #333;
    font-size: 1.1em;
    margin-bottom: 20px;
    font-style: italic;
}

.characteristics {
    margin: 15px 0;
}

.characteristics h6 {
    color: var(--nasa-neon-blue);
    margin-bottom: 10px;
}

.characteristics ul {
    list-style-type: none;
    padding-left: 0;
}

.characteristics li {
    padding: 5px 0;
    padding-left: 20px;
    position: relative;
}

.characteristics li::before {
    content: "🌿";
    position: absolute;
    left: 0;
}

.nasa-insight {
    background: linear-gradient(135deg, rgba(46, 150, 245, 0.1), rgba(0, 66, 166, 0.1));
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid var(--nasa-neon-blue);
    margin-top: 20px;
}

.nasa-insight h6 {
    color: var(--nasa-electric-blue);
    margin-bottom: 10px;
}

.nasa-insight p {
    color: #333;
    margin: 0;
}

/* NDVI Anomaly Detection Styles */
.diagnostic-challenge {
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
    margin: 15px 0;
}

.diagnostic-challenge h4 {
    color: #dc3545;
    text-align: center;
    font-size: 1.3em;
    margin-bottom: 20px;
    text-shadow: 0 1px 2px rgba(220, 53, 69, 0.3);
}

.satellite-image-sim {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin: 15px 0;
}

.field-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    max-width: 300px;
    margin: 0 auto;
    padding: 10px;
    background: #333;
    border-radius: 8px;
}

.field-pixel {
    width: 50px;
    height: 50px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.field-pixel:hover {
    transform: scale(1.05);
    z-index: 10;
}

.field-pixel.problem-area {
    animation: pulse-problem 2s infinite;
}

.field-pixel.healthy-area {
    border: 2px solid #28a745;
}

@keyframes pulse-problem {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.8;
    }
}

.diagnostic-question {
    text-align: center;
    margin: 20px 0;
}

.diagnostic-question p {
    font-size: 1.1em;
    color: #333;
    margin-bottom: 20px;
    font-weight: 600;
}

.diagnostic-options {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}

.diagnostic-btn {
    background: linear-gradient(135deg, var(--nasa-neon-blue), var(--nasa-electric-blue));
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 140px;
}

.diagnostic-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(9, 96, 225, 0.4);
}

/* Diagnosis Result Styles */
.diagnosis-result {
    background: white;
    padding: 25px;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin: 20px 0;
}

.diagnosis-result.correct {
    border-left: 6px solid #28a745;
}

.diagnosis-result.incorrect {
    border-left: 6px solid #dc3545;
}

.result-header h5 {
    font-size: 1.3em;
    margin-bottom: 10px;
}

.diagnosis-result.correct .result-header h5 {
    color: #28a745;
}

.diagnosis-result.incorrect .result-header h5 {
    color: #dc3545;
}

.result-explanation {
    font-size: 1.1em;
    color: #333;
    margin-bottom: 20px;
}

.detailed-analysis {
    margin-top: 25px;
}

.detailed-analysis h6 {
    color: var(--nasa-electric-blue);
    font-size: 1.1em;
    margin: 20px 0 15px 0;
}

.analysis-points {
    margin: 15px 0;
}

.analysis-point {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 10px;
    margin: 15px 0;
    border-left: 4px solid #dee2e6;
}

.analysis-point strong {
    color: #333;
    display: block;
    margin-bottom: 10px;
}

.point-indicator {
    font-size: 1.2em;
    margin-right: 8px;
}

.analysis-point ul {
    margin: 10px 0;
    padding-left: 20px;
}

.analysis-point li {
    margin: 5px 0;
    color: #666;
}

.recommended-actions {
    background: linear-gradient(135deg, rgba(46, 150, 245, 0.05), rgba(0, 66, 166, 0.05));
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
}

.action-list {
    margin-top: 15px;
}

.action-item {
    background: white;
    padding: 15px;
    border-radius: 8px;
    margin: 10px 0;
    border-left: 4px solid #ddd;
}

.action-item.priority-high {
    border-left-color: #dc3545;
    background: rgba(220, 53, 69, 0.05);
}

.action-item.priority-medium {
    border-left-color: #ffc107;
    background: rgba(255, 193, 7, 0.05);
}

.action-item.priority-low {
    border-left-color: #28a745;
    background: rgba(40, 167, 69, 0.05);
}

.action-item strong {
    color: #333;
    display: block;
    margin-bottom: 8px;
}

.action-item ul {
    margin: 8px 0;
    padding-left: 20px;
}

.action-item li {
    margin: 4px 0;
    color: #555;
}

.nasa-learning {
    background: linear-gradient(135deg, rgba(46, 150, 245, 0.1), rgba(0, 66, 166, 0.1));
    padding: 20px;
    border-radius: 10px;
    border: 2px solid rgba(46, 150, 245, 0.2);
    margin: 20px 0;
}

.nasa-learning h6 {
    color: var(--nasa-electric-blue);
    margin-bottom: 10px;
}

.nasa-learning p {
    color: #333;
    font-style: italic;
    margin: 0;
    line-height: 1.6;
}

.reset-btn {
    background: linear-gradient(135deg, var(--nasa-neon-yellow), #f39c12);
    color: #333;
    border: none;
    padding: 12px 25px;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 20px;
    display: block;
    margin-left: auto;
    margin-right: auto;
}

.reset-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(234, 254, 7, 0.4);
}

/* Mobile responsive adjustments for diagnostic challenge */
@media (max-width: 768px) {
    .field-grid {
        max-width: 250px;
    }

    .field-pixel {
        width: 40px;
        height: 40px;
    }

    .diagnostic-options {
        flex-direction: column;
        align-items: center;
    }

    .diagnostic-btn {
        min-width: 200px;
    }
}

/* Responsive Design */
@media (max-width: 768px) {
    .tutorial-modal, .tutorial-lesson-modal {
        width: 98vw !important;
        max-height: 95vh !important;
        margin: 0.5rem !important;
    }

    .tutorial-header, .lesson-header {
        padding: 1rem !important;
        margin: -1rem -1rem 0 -1rem !important;
    }

    .tutorial-header h2, .lesson-header h2 {
        font-size: 1.4rem !important;
    }

    .module-selection {
        grid-template-columns: 1fr !important;
        gap: 0.75rem !important;
    }

    .module-card {
        padding: 1rem !important;
    }

    .close-btn {
        width: 2.5rem !important;
        height: 2.5rem !important;
        font-size: 1rem !important;
    }

    .start-btn, .lesson-footer button {
        padding: 0.75rem 1.5rem !important;
        font-size: 0.9rem !important;
    }
}

.lesson-progress {
    display: flex !important;
    align-items: center !important;
    gap: 1rem !important;
    font-size: 0.9rem !important;
    color: var(--text-secondary) !important;
}

.lesson-progress .progress-bar {
    width: 200px !important;
    background: rgba(255, 255, 255, 0.2) !important;
}

.lesson-body {
    flex: 1 !important;
    overflow-y: auto !important;
    padding: 1.5rem var(--modal-padding) !important;
    color: var(--nasa-deep-blue) !important;
}

.lesson-footer {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 1.5rem var(--modal-padding) !important;
    background: rgba(0, 66, 166, 0.05) !important;
    border-top: 2px solid var(--modal-border-color) !important;
    margin-top: auto !important;
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

/* Farm Simulation Dashboard Styles */
.farming-simulation {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
    padding: 25px !important;
    border-radius: 15px !important;
    margin: 20px 0 !important;
    border: 2px solid rgba(46, 150, 245, 0.2) !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
    display: flex !important;
    flex-direction: column !important;
    min-height: 600px !important;
    width: 100% !important;
    position: static !important;
}

.farming-simulation h4 {
    color: var(--nasa-deep-blue);
    text-align: center;
    font-size: 1.4em;
    margin-bottom: 25px;
    text-shadow: 0 2px 4px rgba(7, 23, 63, 0.3);
}

.simulation-controls {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 25px 0;
    flex-wrap: wrap;
}

.sim-btn {
    background: linear-gradient(135deg, var(--nasa-electric-blue), var(--nasa-neon-blue));
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 160px;
    font-size: 0.95rem;
    box-shadow: 0 4px 15px rgba(9, 96, 225, 0.3);
}

.sim-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(9, 96, 225, 0.4);
    background: linear-gradient(135deg, var(--nasa-neon-blue), var(--nasa-electric-blue));
}

.simulation-results {
    min-height: 400px !important;
    padding: 20px !important;
    background: white !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
    margin-top: 25px !important;
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: visible !important;
}

.loading {
    text-align: center;
    font-size: 1.2em;
    color: var(--nasa-electric-blue);
    padding: 40px 0;
    animation: pulse 2s infinite;
}

.simulation-dashboard {
    animation: slideIn 0.6s ease-out;
}

.dashboard-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 2px solid rgba(7, 23, 63, 0.1);
}

.dashboard-header h3 {
    margin: 0;
    font-size: 1.5em;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin: 25px 0;
}

.metric-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border-left: 4px solid var(--nasa-neon-blue);
    transition: all 0.3s ease;
}

.metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.metric-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
}

.metric-icon {
    font-size: 1.8em;
}

.metric-header h4 {
    margin: 0;
    color: var(--nasa-deep-blue);
    font-size: 1.1em;
    font-weight: 600;
}

.metric-trend {
    margin: 15px 0;
    display: flex;
    justify-content: center;
}

.trend-chart {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    padding: 5px;
}

.metric-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 15px;
}

.metric-summary strong {
    color: var(--nasa-deep-blue);
    font-size: 1.1em;
}

.positive {
    color: #16a085;
    font-weight: 600;
}

.negative {
    color: #e74c3c;
    font-weight: 600;
}

/* Comparison Dashboard Styles */
.comparison-dashboard {
    animation: slideIn 0.6s ease-out;
}

.comparison-summary {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 20px;
    align-items: center;
    margin: 25px 0;
}

.method-summary {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.method-summary h4 {
    margin: 0 0 15px 0;
    font-size: 1.2em;
    font-weight: 700;
}

.summary-stats {
    display: grid;
    gap: 8px;
}

.stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f1f3f4;
    font-size: 0.9rem;
}

.vs-indicator {
    background: linear-gradient(135deg, var(--nasa-rocket-red), var(--nasa-martian-red));
    color: white;
    padding: 15px 20px;
    border-radius: 50%;
    font-weight: 800;
    font-size: 1.1em;
    text-align: center;
    box-shadow: 0 4px 15px rgba(232, 67, 0, 0.4);
}

.comparison-charts {
    margin: 30px 0 60px 0;
}

.chart-container {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    overflow: visible;
    min-height: 200px;
}

.chart-container h4 {
    text-align: center;
    color: var(--nasa-deep-blue);
    margin-bottom: 20px;
    font-size: 1.3em;
}

.dual-chart {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
}

.chart-section {
    text-align: center;
}

.chart-section h5 {
    margin: 0 0 15px 0;
    font-size: 1.1em;
    font-weight: 600;
}

.winner-analysis {
    margin: 30px 0 !important;
    clear: both !important;
    display: block !important;
    position: relative !important;
    z-index: 100 !important;
    width: 100% !important;
}

.winner-card {
    background: linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(46, 204, 113, 0.05));
    padding: 25px;
    border-radius: 15px;
    border: 2px solid rgba(39, 174, 96, 0.3);
    box-shadow: 0 8px 25px rgba(39, 174, 96, 0.2);
}

.winner-card h4 {
    color: #27ae60;
    text-align: center;
    font-size: 1.4em;
    margin-bottom: 20px;
    text-shadow: 0 2px 4px rgba(39, 174, 96, 0.3);
}

.winner-details {
    display: grid;
    gap: 12px;
}

.advantage {
    background: white;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #27ae60;
    font-size: 0.95rem;
    line-height: 1.4;
}

.advantage strong {
    color: #27ae60;
}

/* Conservation Principles Styles */
.conservation-principles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 25px 0;
}

.principle {
    background: white;
    padding: 25px;
    border-radius: 15px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border-top: 4px solid var(--nasa-neon-blue);
}

.principle:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.principle-icon {
    background: linear-gradient(135deg, var(--nasa-electric-blue), var(--nasa-neon-blue));
    color: white;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.9rem;
    margin: 0 auto 15px auto;
    box-shadow: 0 4px 15px rgba(9, 96, 225, 0.4);
}

.principle h4 {
    color: var(--nasa-deep-blue);
    text-align: center;
    margin: 15px 0;
    font-size: 1.1em;
    font-weight: 600;
}

.principle p {
    color: #666;
    text-align: center;
    line-height: 1.5;
    margin-bottom: 15px;
    font-size: 0.95rem;
}

.nasa-connection {
    background: linear-gradient(135deg, rgba(46, 150, 245, 0.1), rgba(0, 66, 166, 0.05));
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid var(--nasa-neon-blue);
    margin-top: 15px;
}

.nasa-connection strong {
    color: var(--nasa-electric-blue);
    display: block;
    margin-bottom: 8px;
    font-size: 0.9rem;
}

.nasa-connection p {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.4;
    text-align: left;
    color: #555;
}

/* Animations */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Mobile Responsive for Farm Simulation */
@media (max-width: 768px) {
    .comparison-summary {
        grid-template-columns: 1fr;
        gap: 15px;
    }

    .vs-indicator {
        padding: 10px 15px;
        font-size: 0.9rem;
    }

    .dual-chart {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .metrics-grid {
        grid-template-columns: 1fr;
    }

    .simulation-controls {
        flex-direction: column;
        align-items: center;
    }

    .sim-btn {
        width: 100%;
        max-width: 250px;
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

// Make class globally available
if (typeof window !== 'undefined') {
    window.NASADataTutorial = NASADataTutorial;
    // Also make instance globally available for button clicks
    window.nasaDataTutorial = window.nasaDataTutorial || null;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NASADataTutorial;
}