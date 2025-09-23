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
                title: '🛰️ SMAP: 토양수분을 우주에서 측정하기',
                description: 'NASA SMAP 위성이 어떻게 땅속 수분을 측정하는지 배워보세요',
                difficulty: 'beginner'
            },
            {
                id: 'ndvi-vegetation',
                title: '🌱 NDVI: 작물의 건강상태 읽기',
                description: '식생지수로 작물이 스트레스를 받는지 미리 알아내는 방법',
                difficulty: 'beginner'
            },
            {
                id: 'data-limitations',
                title: '⚠️ 데이터의 한계와 올바른 해석',
                description: '위성 데이터가 완벽하지 않은 이유와 현명하게 사용하는 방법',
                difficulty: 'intermediate'
            },
            {
                id: 'conservation-applications',
                title: '🌿 보존 농업에 데이터 활용하기',
                description: '환경을 보호하면서 생산성을 높이는 지속가능한 농법',
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
        const modal = document.createElement('div');
        modal.className = 'tutorial-modal';
        modal.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-header">
                    <h2>🎓 NASA 데이터 아카데미</h2>
                    <button class="close-btn" onclick="nasaDataTutorial.closeTutorial()">✕</button>
                </div>

                <div class="tutorial-intro">
                    <p>농업에서 NASA 위성 데이터를 효과적으로 활용하는 방법을 배워보세요!</p>
                    <div class="progress-indicator">
                        <span>완료: ${this.completedModules.size}/${this.modules.length}</span>
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
                        ${this.completedModules.has(this.currentModule.id) ? '다시 학습하기' : '시작하기'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
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
            title: '🛰️ SMAP: 토양수분 측정 위성',
            steps: [
                {
                    type: 'explanation',
                    title: 'SMAP이 뭔가요?',
                    content: `
                        <div class="concept-visual">
                            <div class="satellite-demo">
                                <div class="satellite">🛰️</div>
                                <div class="signal-waves">📡</div>
                                <div class="earth">🌍</div>
                            </div>
                            <p><strong>SMAP (Soil Moisture Active Passive)</strong>는 NASA의 토양수분 측정 위성입니다.</p>
                            <ul>
                                <li>🔬 <strong>원리:</strong> L-band 마이크로파로 토양 수분 측정</li>
                                <li>📏 <strong>해상도:</strong> 9km × 9km (큰 농장에 적합)</li>
                                <li>⏰ <strong>주기:</strong> 2-3일마다 같은 지역 재방문</li>
                                <li>📊 <strong>깊이:</strong> 지표면 5cm 토양수분</li>
                            </ul>
                        </div>
                    `
                },
                {
                    type: 'interactive',
                    title: '토양수분 값 해석하기',
                    content: `
                        <div class="data-interpretation-game">
                            <h4>다음 SMAP 데이터를 해석해보세요:</h4>
                            <div class="soil-moisture-slider">
                                <input type="range" min="0" max="50" value="25" id="moistureSlider"
                                       oninput="nasaDataTutorial.updateMoistureInterpretation(this.value)">
                                <div class="moisture-scale">
                                    <span>0% (건조)</span>
                                    <span>25% (보통)</span>
                                    <span>50% (포화)</span>
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
                    title: '실제 농업 의사결정',
                    content: `
                        <div class="decision-scenario">
                            <h4>🌾 시나리오: 옥수수 농장 관개 결정</h4>
                            <div class="scenario-data">
                                <div class="data-box">
                                    <span class="data-label">SMAP 토양수분:</span>
                                    <span class="data-value">15%</span>
                                </div>
                                <div class="data-box">
                                    <span class="data-label">날씨 예보:</span>
                                    <span class="data-value">3일간 맑음</span>
                                </div>
                                <div class="data-box">
                                    <span class="data-label">작물 성장 단계:</span>
                                    <span class="data-value">결실기</span>
                                </div>
                            </div>
                            <div class="decision-options">
                                <button onclick="nasaDataTutorial.makeDecision('irrigate')" class="decision-btn">
                                    💧 즉시 관개하기
                                </button>
                                <button onclick="nasaDataTutorial.makeDecision('wait')" class="decision-btn">
                                    ⏰ 1-2일 더 기다리기
                                </button>
                                <button onclick="nasaDataTutorial.makeDecision('light')" class="decision-btn">
                                    🌊 가벼운 관개만
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
            title: '🌱 NDVI: 식생지수로 작물 건강 파악하기',
            steps: [
                {
                    type: 'explanation',
                    title: 'NDVI가 무엇인가요?',
                    content: `
                        <div class="ndvi-explanation">
                            <div class="ndvi-formula">
                                <h4>NDVI = (NIR - Red) / (NIR + Red)</h4>
                                <div class="formula-breakdown">
                                    <div class="wavelength near-infrared">
                                        <span>NIR (근적외선)</span>
                                        <div class="wavelength-bar nir"></div>
                                        <small>건강한 식물이 많이 반사</small>
                                    </div>
                                    <div class="wavelength red">
                                        <span>Red (적색광)</span>
                                        <div class="wavelength-bar red"></div>
                                        <small>엽록소가 많이 흡수</small>
                                    </div>
                                </div>
                            </div>
                            <div class="ndvi-scale">
                                <h4>NDVI 값의 의미:</h4>
                                <div class="scale-bar">
                                    <div class="scale-segment water" data-range="-1 ~ 0">물/토양</div>
                                    <div class="scale-segment sparse" data-range="0 ~ 0.3">스트레스</div>
                                    <div class="scale-segment moderate" data-range="0.3 ~ 0.7">보통</div>
                                    <div class="scale-segment healthy" data-range="0.7 ~ 1">건강</div>
                                </div>
                            </div>
                        </div>
                    `
                },
                {
                    type: 'interactive',
                    title: '작물별 NDVI 패턴 학습',
                    content: `
                        <div class="crop-ndvi-game">
                            <h4>각 작물의 NDVI 변화를 관찰하세요:</h4>
                            <div class="crop-selector">
                                <button onclick="nasaDataTutorial.showCropNDVI('corn')" class="crop-btn">🌽 옥수수</button>
                                <button onclick="nasaDataTutorial.showCropNDVI('wheat')" class="crop-btn">🌾 밀</button>
                                <button onclick="nasaDataTutorial.showCropNDVI('soybean')" class="crop-btn">🫛 콩</button>
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
                    title: '문제 상황 진단하기',
                    content: `
                        <div class="diagnostic-challenge">
                            <h4>🚨 이상 상황 발견!</h4>
                            <div class="satellite-image-sim">
                                <div class="field-grid">
                                    ${Array.from({length: 25}, (_, i) => {
                                        const ndvi = i < 5 || i > 19 ? Math.random() * 0.3 + 0.1 : Math.random() * 0.4 + 0.6;
                                        return `<div class="field-pixel" style="background-color: ${this.getNDVIColor(ndvi)}" data-ndvi="${ndvi.toFixed(2)}"></div>`;
                                    }).join('')}
                                </div>
                            </div>
                            <div class="diagnostic-question">
                                <p>위 NDVI 맵에서 문제가 있는 구역은 어디인가요?</p>
                                <div class="diagnostic-options">
                                    <button onclick="nasaDataTutorial.diagnose('edges')" class="diagnostic-btn">가장자리 구역</button>
                                    <button onclick="nasaDataTutorial.diagnose('center')" class="diagnostic-btn">중앙 구역</button>
                                    <button onclick="nasaDataTutorial.diagnose('random')" class="diagnostic-btn">무작위 분포</button>
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
            title: '⚠️ 위성 데이터의 한계와 올바른 해석',
            steps: [
                {
                    type: 'explanation',
                    title: '해상도의 중요성',
                    content: `
                        <div class="resolution-demo">
                            <h4>농장 크기에 따른 데이터 정확도</h4>
                            <div class="farm-size-comparison">
                                <div class="farm-demo small">
                                    <div class="farm-boundary"></div>
                                    <div class="pixel-overlay smap"></div>
                                    <h5>소규모 농장 (1km²)</h5>
                                    <p class="accuracy low">SMAP 정확도: ⭐⭐☆☆☆</p>
                                    <small>9km 픽셀 하나에 농장 9개가 들어감</small>
                                </div>
                                <div class="farm-demo large">
                                    <div class="farm-boundary large"></div>
                                    <div class="pixel-overlay smap"></div>
                                    <h5>대규모 농장 (100km²)</h5>
                                    <p class="accuracy high">SMAP 정확도: ⭐⭐⭐⭐⭐</p>
                                    <small>농장에 SMAP 픽셀 여러 개가 포함</small>
                                </div>
                            </div>
                            <div class="key-lesson">
                                <h5>🎯 핵심 교훈:</h5>
                                <p>SMAP은 대규모 농장에 적합하고, 소규모 농장은 지상 센서와 함께 사용해야 합니다.</p>
                            </div>
                        </div>
                    `
                },
                {
                    type: 'interactive',
                    title: '구름의 영향 이해하기',
                    content: `
                        <div class="cloud-effect-demo">
                            <h4>☁️ 구름이 NDVI 데이터에 미치는 영향</h4>
                            <div class="cloud-scenario">
                                <div class="satellite-view">
                                    <div class="field-image clear" id="fieldView">
                                        <div class="vegetation healthy"></div>
                                    </div>
                                    <div class="cloud-layer" id="cloudLayer" style="opacity: 0;"></div>
                                </div>
                                <div class="cloud-controls">
                                    <label>구름 양:</label>
                                    <input type="range" min="0" max="100" value="0"
                                           oninput="nasaDataTutorial.adjustCloudCover(this.value)">
                                    <span id="cloudPercent">0%</span>
                                </div>
                                <div class="ndvi-reading">
                                    <span>측정된 NDVI: </span>
                                    <span id="cloudAffectedNDVI">0.75</span>
                                </div>
                            </div>
                            <div class="lesson-explanation" id="cloudLesson">
                                구름이 없을 때는 정확한 NDVI 값을 얻을 수 있습니다.
                            </div>
                        </div>
                    `
                },
                {
                    type: 'practical',
                    title: '불완전한 데이터로 현명한 결정하기',
                    content: `
                        <div class="incomplete-data-scenario">
                            <h4>🤔 실제 상황: 데이터가 완벽하지 않을 때</h4>
                            <div class="data-status">
                                <div class="data-item">
                                    <span class="data-source">SMAP 토양수분:</span>
                                    <span class="data-value missing">❌ 3일 전 데이터 (구름)</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-source">MODIS NDVI:</span>
                                    <span class="data-value partial">⚠️ 부분 데이터 (구름 50%)</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-source">지상 센서:</span>
                                    <span class="data-value good">✅ 실시간 데이터</span>
                                </div>
                            </div>
                            <div class="decision-framework">
                                <h5>올바른 접근법:</h5>
                                <ol>
                                    <li>✅ 가용한 데이터의 신뢰도 평가</li>
                                    <li>✅ 지상 센서 데이터 우선 활용</li>
                                    <li>✅ 과거 패턴과 트렌드 참고</li>
                                    <li>✅ 보수적인 의사결정</li>
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
            title: '🌿 보존 농업과 NASA 데이터 활용',
            steps: [
                {
                    type: 'explanation',
                    title: '보존 농업의 3대 원칙',
                    content: `
                        <div class="conservation-principles">
                            <div class="principle">
                                <div class="principle-icon">🌾</div>
                                <h4>최소 토양 교란</h4>
                                <p>무경운 또는 최소경운으로 토양 구조 보존</p>
                                <div class="nasa-connection">
                                    <strong>NASA 데이터 활용:</strong> SMAP으로 토양수분 패턴 모니터링
                                </div>
                            </div>
                            <div class="principle">
                                <div class="principle-icon">🛡️</div>
                                <h4>영구 토양 피복</h4>
                                <p>작물 잔여물이나 피복작물로 토양 보호</p>
                                <div class="nasa-connection">
                                    <strong>NASA 데이터 활용:</strong> NDVI로 피복 정도 모니터링
                                </div>
                            </div>
                            <div class="principle">
                                <div class="principle-icon">🔄</div>
                                <h4>작물 다양화</h4>
                                <p>윤작과 혼작으로 생물다양성 증진</p>
                                <div class="nasa-connection">
                                    <strong>NASA 데이터 활용:</strong> 장기 NDVI 트렌드로 토양 건강 추적
                                </div>
                            </div>
                        </div>
                    `
                },
                {
                    type: 'simulation',
                    title: '10년간 농법 비교 시뮬레이션',
                    content: `
                        <div class="farming-simulation">
                            <h4>관행농업 vs 보존농업 장기 비교</h4>
                            <div class="simulation-controls">
                                <button onclick="nasaDataTutorial.runSimulation('conventional')" class="sim-btn">관행농업 실행</button>
                                <button onclick="nasaDataTutorial.runSimulation('conservation')" class="sim-btn">보존농업 실행</button>
                                <button onclick="nasaDataTutorial.runSimulation('both')" class="sim-btn">동시 비교</button>
                            </div>
                            <div id="simulationResults" class="simulation-results">
                                <!-- Dynamic simulation results -->
                            </div>
                        </div>
                    `
                },
                {
                    type: 'planning',
                    title: '나만의 보존농업 계획 세우기',
                    content: `
                        <div class="conservation-planner">
                            <h4>🎯 당신의 농장에 맞는 보존농업 전략</h4>
                            <div class="farm-assessment">
                                <div class="input-group">
                                    <label>농장 크기:</label>
                                    <select onchange="nasaDataTutorial.updateStrategy()">
                                        <option value="small">소규모 (1-10 헥타르)</option>
                                        <option value="medium">중규모 (10-100 헥타르)</option>
                                        <option value="large">대규모 (100+ 헥타르)</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>주요 작물:</label>
                                    <select onchange="nasaDataTutorial.updateStrategy()">
                                        <option value="grains">곡물류</option>
                                        <option value="vegetables">채소류</option>
                                        <option value="mixed">혼합 재배</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>기후 조건:</label>
                                    <select onchange="nasaDataTutorial.updateStrategy()">
                                        <option value="temperate">온대</option>
                                        <option value="arid">건조</option>
                                        <option value="tropical">열대</option>
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
                    <button id="prevBtn" onclick="nasaDataTutorial.previousStep()" style="display: none;">이전</button>
                    <button id="nextBtn" onclick="nasaDataTutorial.nextStep()">다음</button>
                    <button id="completeBtn" onclick="nasaDataTutorial.completeModule()" style="display: none;">완료</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
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
            interpretation = '매우 건조';
            recommendation = '즉시 관개 필요';
            color = '#e74c3c';
        } else if (moisture < 20) {
            interpretation = '건조';
            recommendation = '1-2일 내 관개 권장';
            color = '#f39c12';
        } else if (moisture < 35) {
            interpretation = '적정';
            recommendation = '현재 상태 유지';
            color = '#27ae60';
        } else {
            interpretation = '과습';
            recommendation = '배수 점검 필요';
            color = '#3498db';
        }

        result.innerHTML = `
            <div class="interpretation" style="border-left: 4px solid ${color};">
                <h5>토양수분 ${moisture}%</h5>
                <p><strong>상태:</strong> ${interpretation}</p>
                <p><strong>권장사항:</strong> ${recommendation}</p>
            </div>
        `;
    }

    makeDecision(decision) {
        const result = document.getElementById('decisionResult');
        const decisions = {
            irrigate: {
                title: '✅ 올바른 선택!',
                explanation: '토양수분 15%는 옥수수 결실기에 너무 낮습니다. 즉시 관개로 수확량 손실을 방지할 수 있습니다.',
                outcome: '수확량 95% 달성',
                color: '#27ae60'
            },
            wait: {
                title: '⚠️ 위험한 선택',
                explanation: '결실기 옥수수는 충분한 수분이 필요합니다. 더 기다리면 알갱이 형성에 문제가 생길 수 있습니다.',
                outcome: '수확량 70% 예상',
                color: '#f39c12'
            },
            light: {
                title: '❌ 부족한 조치',
                explanation: '토양수분 15%는 심각한 수준입니다. 가벼운 관개로는 부족하며 충분한 양이 필요합니다.',
                outcome: '수확량 80% 예상',
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
        const modals = document.querySelectorAll('.tutorial-modal, .tutorial-lesson-modal');
        modals.forEach(modal => modal.remove());
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
        alert(`🎉 "${this.currentModule.title}" 모듈을 완료했습니다!`);
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
.tutorial-modal, .tutorial-lesson-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.tutorial-content, .lesson-content {
    background: white;
    border-radius: 15px;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.tutorial-header, .lesson-header {
    background: linear-gradient(135deg, #2C3E50, #3498DB);
    color: white;
    padding: 20px 30px;
    border-radius: 15px 15px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
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
    background: linear-gradient(90deg, #3498DB, #2ECC71);
    transition: width 0.3s ease;
}

.module-selection {
    padding: 0 30px;
}

.module-card {
    border: 2px solid #ECF0F1;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.module-card:hover {
    border-color: #3498DB;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(52,152,219,0.2);
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
    background: linear-gradient(135deg, #3498DB, #2ECC71);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.start-btn:hover {
    transform: translateY(-2px);
}

/* Interactive Elements */
.concept-visual {
    background: #F8F9FA;
    padding: 20px;
    border-radius: 8px;
    margin: 15px 0;
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
    color: #2C3E50;
}

.decision-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.decision-btn {
    background: white;
    border: 2px solid #3498DB;
    padding: 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.decision-btn:hover {
    background: #3498DB;
    color: white;
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
    background: #3498DB;
    color: white;
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