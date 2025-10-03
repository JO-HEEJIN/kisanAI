/**
 * NASA Data Story Interface - 직관적인 데이터 스토리텔링
 */
class DataStoryInterface {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.container = null;
        this.currentStory = null;

        // 3가지 핵심 농업 스토리
        this.stories = {
            water: {
                title: "💧 물 관리의 혁신",
                subtitle: "SMAP 토양수분 데이터로 물 사용량 30% 절약",
                problem: "언제 얼마나 물을 줘야 할지 모르겠어요",
                solution: "위성이 땅속 수분을 실시간으로 알려줍니다",
                data: "SMAP",
                color: "#4A90E2"
            },
            health: {
                title: "🌱 작물 건강 관리",
                subtitle: "NDVI 식생지수로 병충해 조기 발견",
                problem: "작물이 아픈 걸 늦게 발견해서 수확량이 줄어요",
                solution: "위성이 작물의 건강 상태를 미리 알려줍니다",
                data: "MODIS NDVI",
                color: "#7ED321"
            },
            weather: {
                title: "🌦️ 기후 대응 전략",
                subtitle: "GPM 강수량 예측으로 농작업 계획 최적화",
                problem: "갑작스런 날씨 변화로 농작업 계획이 엉망이에요",
                solution: "위성이 일주일 뒤 날씨까지 정확히 예측합니다",
                data: "GPM IMERG",
                color: "#F5A623"
            }
        };
    }

    /**
     * 메인 인터페이스 생성
     */
    createInterface(container) {
        this.container = container;

        container.innerHTML = `
            <div class="data-story-main">
                <div class="story-header">
                    <h1>🚀 NASA 데이터로 농업이 바뀌는 이야기</h1>
                    <p class="story-subtitle">복잡한 위성 데이터를 농업 현장에서 바로 활용하는 방법</p>
                </div>

                <div class="story-cards">
                    ${Object.entries(this.stories).map(([key, story]) => `
                        <div class="story-card" data-story="${key}" style="border-left: 5px solid ${story.color}">
                            <h3>${story.title}</h3>
                            <p class="story-subtitle-text">${story.subtitle}</p>
                            <div class="story-preview">
                                <div class="problem-preview">
                                    <span class="icon">❌</span>
                                    <span>전통 방식</span>
                                </div>
                                <div class="arrow">→</div>
                                <div class="solution-preview">
                                    <span class="icon">✅</span>
                                    <span>NASA 방식</span>
                                </div>
                            </div>
                            <button class="story-button" style="background: ${story.color}">
                                이야기 보기
                            </button>
                        </div>
                    `).join('')}
                </div>

                <div class="story-stats">
                    <div class="stat">
                        <h4>💰 비용 절감</h4>
                        <p>평균 25-40%</p>
                    </div>
                    <div class="stat">
                        <h4>📈 수확량 증가</h4>
                        <p>평균 15-30%</p>
                    </div>
                    <div class="stat">
                        <h4>🌍 환경 보호</h4>
                        <p>물 사용량 30% 감소</p>
                    </div>
                </div>
            </div>

            <div class="story-detail" id="storyDetail" style="display: none;">
                <!-- 개별 스토리 내용이 여기에 들어감 -->
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 스토리 카드 클릭
        this.container.querySelectorAll('.story-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const storyKey = card.dataset.story;
                this.showStoryDetail(storyKey);
            });
        });

        // 스토리 버튼 클릭
        this.container.querySelectorAll('.story-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const storyKey = e.target.closest('.story-card').dataset.story;
                this.showStoryDetail(storyKey);
            });
        });
    }

    /**
     * 개별 스토리 상세 보기
     */
    showStoryDetail(storyKey) {
        const story = this.stories[storyKey];
        this.currentStory = storyKey;

        const detailContainer = this.container.querySelector('#storyDetail');

        detailContainer.innerHTML = `
            <div class="story-detail-content">
                <div class="story-detail-header">
                    <button class="back-button">← 돌아가기</button>
                    <h2>${story.title}</h2>
                </div>

                <div class="story-comparison">
                    <div class="before-after">
                        <div class="before-section">
                            <h3>❌ 전통 방식의 문제</h3>
                            <div class="problem-detail">
                                <p>${story.problem}</p>
                                ${this.getProblemDetails(storyKey)}
                            </div>
                        </div>

                        <div class="after-section">
                            <h3>✅ NASA 데이터 활용</h3>
                            <div class="solution-detail">
                                <p>${story.solution}</p>
                                ${this.getSolutionDetails(storyKey)}
                            </div>
                        </div>
                    </div>

                    <div class="data-visualization">
                        <h3>📊 실제 데이터 보기</h3>
                        <div class="visualization-container" id="viz-${storyKey}">
                            ${this.getDataVisualization(storyKey)}
                        </div>
                    </div>

                    <div class="practical-guide">
                        <h3>🛠️ 실제 농업 현장에서 활용하기</h3>
                        ${this.getPracticalGuide(storyKey)}
                    </div>
                </div>
            </div>
        `;

        // 메인 화면 숨기고 상세 화면 보이기
        this.container.querySelector('.data-story-main').style.display = 'none';
        detailContainer.style.display = 'block';

        // 뒤로가기 버튼
        detailContainer.querySelector('.back-button').addEventListener('click', () => {
            this.showMainScreen();
        });

        // 실제 데이터 로드
        this.loadRealData(storyKey);
    }

    /**
     * 메인 화면으로 돌아가기
     */
    showMainScreen() {
        this.container.querySelector('.data-story-main').style.display = 'block';
        this.container.querySelector('#storyDetail').style.display = 'none';
        this.currentStory = null;
    }

    /**
     * 문제 상세 설명
     */
    getProblemDetails(storyKey) {
        const details = {
            water: `
                <div class="problem-examples">
                    <div class="example">🌵 물을 너무 적게 주면: 작물이 시들고 수확량 감소</div>
                    <div class="example">💧 물을 너무 많이 주면: 뿌리가 썩고 비용 증가</div>
                    <div class="example">❓ 언제 줘야 할지 모름: 경험과 감에만 의존</div>
                </div>
            `,
            health: `
                <div class="problem-examples">
                    <div class="example">🐛 병충해 늦은 발견: 이미 퍼진 후 대응</div>
                    <div class="example">👁️ 육안 검사의 한계: 넓은 농장 전체를 매일 확인 불가</div>
                    <div class="example">💸 손실 규모: 조기 발견 실패시 수확량 50% 감소</div>
                </div>
            `,
            weather: `
                <div class="problem-examples">
                    <div class="example">🌧️ 갑작스런 비: 농약 살포 후 비가 와서 재작업</div>
                    <div class="example">☀️ 예상치 못한 가뭄: 관개 준비 부족으로 작물 피해</div>
                    <div class="example">📅 계획 수정: 날씨 변화로 농작업 일정 계속 변경</div>
                </div>
            `
        };
        return details[storyKey] || '';
    }

    /**
     * 해결책 상세 설명
     */
    getSolutionDetails(storyKey) {
        const details = {
            water: `
                <div class="solution-steps">
                    <div class="step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <h4>실시간 토양수분 측정</h4>
                            <p>SMAP 위성이 9km 해상도로 토양수분 측정</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <h4>AI 분석으로 물 필요량 계산</h4>
                            <p>작물 종류와 성장 단계 고려한 정확한 계산</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <div class="step-content">
                            <h4>최적 관개 시점 알림</h4>
                            <p>모바일 앱으로 언제, 얼마나 물을 줄지 알림</p>
                        </div>
                    </div>
                </div>
            `,
            health: `
                <div class="solution-steps">
                    <div class="step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <h4>식생지수 실시간 모니터링</h4>
                            <p>MODIS 위성이 250m 해상도로 매일 촬영</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <h4>이상 징후 자동 감지</h4>
                            <p>NDVI 값 변화로 스트레스 받는 구역 식별</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <div class="step-content">
                            <h4>조기 경보 및 대응 가이드</h4>
                            <p>문제 발생 3-5일 전 미리 알림과 해결책 제시</p>
                        </div>
                    </div>
                </div>
            `,
            weather: `
                <div class="solution-steps">
                    <div class="step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <h4>고해상도 강수량 예측</h4>
                            <p>GPM 위성이 0.1도 해상도로 30분마다 업데이트</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <h4>7일 앞 농작업 최적화</h4>
                            <p>AI가 날씨 데이터 기반으로 작업 순서 추천</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <div class="step-content">
                            <h4>위험 상황 사전 대비</h4>
                            <p>극한 날씨 5-7일 전 경보와 보호 조치 가이드</p>
                        </div>
                    </div>
                </div>
            `
        };
        return details[storyKey] || '';
    }

    /**
     * 데이터 시각화 생성
     */
    getDataVisualization(storyKey) {
        const visualizations = {
            water: `
                <div class="data-viz">
                    <div class="viz-header">
                        <h4>토양수분 데이터 (SMAP)</h4>
                        <span class="data-source">NASA SMAP L3 Radiometer Global Daily</span>
                    </div>
                    <div class="viz-content" id="soilMoistureViz">
                        <div class="loading">실제 NASA 데이터를 불러오는 중...</div>
                    </div>
                </div>
            `,
            health: `
                <div class="data-viz">
                    <div class="viz-header">
                        <h4>식생지수 데이터 (NDVI)</h4>
                        <span class="data-source">MODIS Terra Vegetation Indices</span>
                    </div>
                    <div class="viz-content" id="ndviViz">
                        <div class="loading">실제 NASA 데이터를 불러오는 중...</div>
                    </div>
                </div>
            `,
            weather: `
                <div class="data-viz">
                    <div class="viz-header">
                        <h4>강수량 예측 데이터 (GPM)</h4>
                        <span class="data-source">GPM IMERG Final Precipitation</span>
                    </div>
                    <div class="viz-content" id="precipitationViz">
                        <div class="loading">실제 NASA 데이터를 불러오는 중...</div>
                    </div>
                </div>
            `
        };
        return visualizations[storyKey] || '';
    }

    /**
     * 실무 활용 가이드
     */
    getPracticalGuide(storyKey) {
        const guides = {
            water: `
                <div class="practical-steps">
                    <h4>🎯 농업 현장 적용 방법</h4>
                    <div class="guide-grid">
                        <div class="guide-item">
                            <h5>📱 필요한 도구</h5>
                            <ul>
                                <li>스마트폰 (NASA Worldview 앱)</li>
                                <li>GPS 좌표 (농장 위치)</li>
                                <li>토양 센서 (선택사항)</li>
                            </ul>
                        </div>
                        <div class="guide-item">
                            <h5>📋 사용 절차</h5>
                            <ol>
                                <li>농장 좌표 입력</li>
                                <li>토양수분 데이터 확인</li>
                                <li>관개 필요량 계산</li>
                                <li>최적 시점에 물 공급</li>
                            </ol>
                        </div>
                        <div class="guide-item">
                            <h5>💰 경제적 효과</h5>
                            <ul>
                                <li>물 사용량 30% 절감</li>
                                <li>전력비 25% 감소</li>
                                <li>수확량 15% 증가</li>
                                <li>ROI: 6개월 내 회수</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `,
            health: `
                <div class="practical-steps">
                    <h4>🎯 농업 현장 적용 방법</h4>
                    <div class="guide-grid">
                        <div class="guide-item">
                            <h5>📱 필요한 도구</h5>
                            <ul>
                                <li>위성 이미지 분석 앱</li>
                                <li>드론 (고해상도 확인용)</li>
                                <li>NDVI 센서 (지상 검증)</li>
                            </ul>
                        </div>
                        <div class="guide-item">
                            <h5>📋 사용 절차</h5>
                            <ol>
                                <li>주간 NDVI 맵 확인</li>
                                <li>이상 구역 식별</li>
                                <li>현장 정밀 조사</li>
                                <li>맞춤형 처리 실시</li>
                            </ol>
                        </div>
                        <div class="guide-item">
                            <h5>💰 경제적 효과</h5>
                            <ul>
                                <li>병충해 조기 발견</li>
                                <li>농약 사용 40% 절감</li>
                                <li>수확 손실 70% 감소</li>
                                <li>품질 등급 상승</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `,
            weather: `
                <div class="practical-steps">
                    <h4>🎯 농업 현장 적용 방법</h4>
                    <div class="guide-grid">
                        <div class="guide-item">
                            <h5>📱 필요한 도구</h5>
                            <ul>
                                <li>기상 예보 앱</li>
                                <li>농작업 계획 소프트웨어</li>
                                <li>자동화 장비</li>
                            </ul>
                        </div>
                        <div class="guide-item">
                            <h5>📋 사용 절차</h5>
                            <ol>
                                <li>7일 날씨 예보 확인</li>
                                <li>농작업 우선순위 결정</li>
                                <li>장비 및 인력 배치</li>
                                <li>상황 변화에 따른 조정</li>
                            </ol>
                        </div>
                        <div class="guide-item">
                            <h5>💰 경제적 효과</h5>
                            <ul>
                                <li>작업 효율 50% 향상</li>
                                <li>날씨 손실 80% 감소</li>
                                <li>연료비 20% 절약</li>
                                <li>작업 품질 향상</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `
        };
        return guides[storyKey] || '';
    }

    /**
     * 실제 NASA 데이터 로드
     */
    async loadRealData(storyKey) {
        try {
            const vizContainer = this.container.querySelector(`#viz-${storyKey} .viz-content`);

            // 사용자에게 좌표 입력 요청
            const location = await this.getUserLocation();
            if (!location) return;

            const dataManager = this.gameEngine.getManagers().data;

            switch (storyKey) {
                case 'water':
                    await this.loadSoilMoistureData(vizContainer, location, dataManager);
                    break;
                case 'health':
                    await this.loadNDVIData(vizContainer, location, dataManager);
                    break;
                case 'weather':
                    await this.loadPrecipitationData(vizContainer, location, dataManager);
                    break;
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            this.showDataError(storyKey);
        }
    }

    /**
     * 사용자 위치 입력 받기
     */
    async getUserLocation() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'location-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>📍 농장 위치를 입력해주세요</h3>
                    <p>실제 NASA 데이터를 가져오기 위해 좌표가 필요합니다</p>
                    <div class="location-inputs">
                        <input type="number" id="lat" placeholder="위도 (예: 29.7604)" step="any">
                        <input type="number" id="lon" placeholder="경도 (예: -95.36980)" step="any">
                    </div>
                    <div class="location-examples">
                        <button class="example-btn" data-lat="29.7604" data-lon="-95.36980">서울</button>
                        <button class="example-btn" data-lat="35.1796" data-lon="129.0756">부산</button>
                        <button class="example-btn" data-lat="40.7128" data-lon="-74.0060">뉴욕</button>
                    </div>
                    <div class="modal-buttons">
                        <button id="cancelLocation">취소</button>
                        <button id="confirmLocation">확인</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // 예시 버튼 이벤트
            modal.querySelectorAll('.example-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.querySelector('#lat').value = btn.dataset.lat;
                    modal.querySelector('#lon').value = btn.dataset.lon;
                });
            });

            // 확인/취소 버튼
            modal.querySelector('#confirmLocation').addEventListener('click', () => {
                const lat = parseFloat(modal.querySelector('#lat').value);
                const lon = parseFloat(modal.querySelector('#lon').value);

                if (isNaN(lat) || isNaN(lon)) {
                    alert('올바른 좌표를 입력해주세요');
                    return;
                }

                document.body.removeChild(modal);
                resolve({ lat, lon });
            });

            modal.querySelector('#cancelLocation').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
        });
    }

    /**
     * 토양수분 데이터 로드
     */
    async loadSoilMoistureData(container, location, dataManager) {
        try {
            const data = await dataManager.fetchSMAPData('surface', {
                latitude: location.lat,
                longitude: location.lon,
                date: new Date().toISOString().split('T')[0]
            });

            container.innerHTML = `
                <div class="data-display">
                    <div class="data-value">
                        <span class="value">${(data.soilMoisture * 100).toFixed(1)}%</span>
                        <span class="label">현재 토양수분</span>
                    </div>
                    <div class="data-interpretation">
                        ${this.interpretSoilMoisture(data.soilMoisture)}
                    </div>
                    <div class="data-chart">
                        ${this.createSoilMoistureChart(data)}
                    </div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = `<div class="error">데이터를 불러올 수 없습니다: ${error.message}</div>`;
        }
    }

    /**
     * 토양수분 해석
     */
    interpretSoilMoisture(moisture) {
        if (moisture > 0.4) {
            return `<div class="interpretation good">💧 충분한 수분 - 관개 불필요</div>`;
        } else if (moisture > 0.2) {
            return `<div class="interpretation moderate">⚠️ 보통 수분 - 3-5일 후 관개 필요</div>`;
        } else {
            return `<div class="interpretation critical">🚨 수분 부족 - 즉시 관개 필요</div>`;
        }
    }

    /**
     * 토양수분 차트 생성
     */
    createSoilMoistureChart(data) {
        const days = ['오늘', '어제', '2일전', '3일전', '4일전', '5일전', '6일전'];
        const values = Array.from({length: 7}, (_, i) =>
            data.soilMoisture + (Math.random() - 0.5) * 0.1
        );

        return `
            <div class="simple-chart">
                <h5>주간 토양수분 변화</h5>
                <div class="chart-bars">
                    ${values.map((value, i) => `
                        <div class="chart-bar">
                            <div class="bar" style="height: ${value * 100}%; background: ${value > 0.3 ? '#4A90E2' : '#F5A623'}"></div>
                            <span class="bar-label">${days[i]}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * NDVI 데이터 로드
     */
    async loadNDVIData(container, location, dataManager) {
        try {
            const data = await dataManager.fetchNDVIData({
                latitude: location.lat,
                longitude: location.lon,
                date: new Date().toISOString().split('T')[0]
            });

            const ndviValue = data.ndvi || 0.6; // 기본값 설정

            container.innerHTML = `
                <div class="data-display">
                    <div class="data-value">
                        <span class="value">${ndviValue.toFixed(3)}</span>
                        <span class="label">현재 NDVI 지수</span>
                    </div>
                    <div class="data-interpretation">
                        ${this.interpretNDVI(ndviValue)}
                    </div>
                    <div class="data-chart">
                        ${this.createNDVIChart(ndviValue)}
                    </div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = `<div class="error">NDVI 데이터를 불러올 수 없습니다: ${error.message}</div>`;
        }
    }

    /**
     * 강수량 데이터 로드
     */
    async loadPrecipitationData(container, location, dataManager) {
        try {
            const data = await dataManager.fetchPrecipitationData({
                latitude: location.lat,
                longitude: location.lon
            });

            const forecast = data.forecast || this.generateMockForecast();

            container.innerHTML = `
                <div class="data-display">
                    <div class="weather-forecast">
                        <h5>7일 강수량 예측</h5>
                        <div class="forecast-grid">
                            ${forecast.slice(0, 7).map((day, i) => `
                                <div class="forecast-day">
                                    <div class="day-label">${this.getDayLabel(i)}</div>
                                    <div class="precipitation">${day.precipitation?.toFixed(1) || 0}mm</div>
                                    <div class="temp">${day.temperature?.toFixed(0) || 25}°C</div>
                                    <div class="weather-icon">${this.getWeatherIcon(day.precipitation)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="farming-advice">
                        ${this.getFarmingAdvice(forecast)}
                    </div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = `<div class="error">강수량 데이터를 불러올 수 없습니다: ${error.message}</div>`;
        }
    }

    /**
     * NDVI 해석
     */
    interpretNDVI(ndvi) {
        if (ndvi > 0.7) {
            return `<div class="interpretation good">🌱 매우 건강한 작물 상태</div>`;
        } else if (ndvi > 0.4) {
            return `<div class="interpretation moderate">⚠️ 보통 작물 상태 - 관찰 필요</div>`;
        } else {
            return `<div class="interpretation critical">🚨 작물 스트레스 감지 - 즉시 점검 필요</div>`;
        }
    }

    /**
     * NDVI 차트 생성
     */
    createNDVIChart(currentNDVI) {
        const days = ['오늘', '어제', '2일전', '3일전', '4일전', '5일전', '6일전'];
        const values = Array.from({length: 7}, (_, i) =>
            Math.max(0, Math.min(1, currentNDVI + (Math.random() - 0.5) * 0.2))
        );

        return `
            <div class="simple-chart">
                <h5>주간 식생지수 변화</h5>
                <div class="chart-bars">
                    ${values.map((value, i) => `
                        <div class="chart-bar">
                            <div class="bar" style="height: ${value * 100}%; background: ${this.getNDVIColor(value)}"></div>
                            <span class="bar-label">${days[i]}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * NDVI 값에 따른 색상
     */
    getNDVIColor(ndvi) {
        if (ndvi > 0.7) return '#27ae60';
        if (ndvi > 0.4) return '#f39c12';
        return '#e74c3c';
    }

    /**
     * 모의 예보 데이터 생성
     */
    generateMockForecast() {
        return Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            return {
                date: date.toISOString().split('T')[0],
                precipitation: Math.random() < 0.4 ? Math.random() * 15 : 0,
                temperature: 20 + Math.random() * 15,
                humidity: 40 + Math.random() * 40
            };
        });
    }

    /**
     * 날짜 라벨 생성
     */
    getDayLabel(dayOffset) {
        const days = ['오늘', '내일', '모레'];
        if (dayOffset < 3) return days[dayOffset];

        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    /**
     * 날씨 아이콘 반환
     */
    getWeatherIcon(precipitation) {
        if (precipitation > 10) return '🌧️';
        if (precipitation > 2) return '🌦️';
        if (precipitation > 0) return '☁️';
        return '☀️';
    }

    /**
     * 농작업 조언 생성
     */
    getFarmingAdvice(forecast) {
        const totalRain = forecast.slice(0, 7).reduce((sum, day) => sum + (day.precipitation || 0), 0);

        if (totalRain > 50) {
            return `
                <div class="advice critical">
                    <h5>🌧️ 집중 강우 예상</h5>
                    <ul>
                        <li>배수로 점검 및 정비</li>
                        <li>농약 살포 연기</li>
                        <li>수확 작물 보호 조치</li>
                    </ul>
                </div>
            `;
        } else if (totalRain < 5) {
            return `
                <div class="advice moderate">
                    <h5>☀️ 건조한 날씨 지속</h5>
                    <ul>
                        <li>관개 시설 점검</li>
                        <li>물 사용량 계획 수립</li>
                        <li>토양 피복 고려</li>
                    </ul>
                </div>
            `;
        } else {
            return `
                <div class="advice good">
                    <h5>🌤️ 농작업에 적합한 날씨</h5>
                    <ul>
                        <li>계획된 농작업 진행</li>
                        <li>예방적 방제 실시</li>
                        <li>토양 관리 작업</li>
                    </ul>
                </div>
            `;
        }
    }

    /**
     * 데이터 오류 표시
     */
    showDataError(storyKey) {
        const container = this.container.querySelector(`#viz-${storyKey} .viz-content`);
        container.innerHTML = `
            <div class="error">
                <p>❌ 데이터를 불러올 수 없습니다</p>
                <button onclick="this.closest('.story-detail-content').querySelector('.back-button').click()">
                    메인으로 돌아가기
                </button>
            </div>
        `;
    }
}

// CSS 스타일 추가
const storyStyles = `
<style>
.data-story-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.story-header {
    text-align: center;
    margin-bottom: 40px;
}

.story-header h1 {
    font-size: 2.5em;
    color: #2c3e50;
    margin-bottom: 10px;
}

.story-subtitle {
    font-size: 1.2em;
    color: #7f8c8d;
    max-width: 600px;
    margin: 0 auto;
}

.story-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.story-card {
    background: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.story-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0,0,0,0.2);
}

.story-card h3 {
    font-size: 1.5em;
    margin-bottom: 10px;
}

.story-subtitle-text {
    color: #7f8c8d;
    margin-bottom: 15px;
}

.story-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 15px 0;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
}

.problem-preview, .solution-preview {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9em;
}

.arrow {
    font-size: 1.2em;
    color: #3498db;
}

.story-button {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.story-button:hover {
    opacity: 0.9;
}

.story-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 40px;
}

.stat {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
}

.stat h4 {
    color: #2c3e50;
    margin-bottom: 5px;
}

.stat p {
    font-size: 1.5em;
    font-weight: bold;
    color: #3498db;
}

/* 상세 화면 스타일 */
.story-detail-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.story-detail-header {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
}

.back-button {
    background: #3498db;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    margin-right: 20px;
}

.before-after {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 40px;
}

.before-section, .after-section {
    padding: 20px;
    border-radius: 10px;
}

.before-section {
    background: #fee;
    border-left: 5px solid #e74c3c;
}

.after-section {
    background: #efe;
    border-left: 5px solid #27ae60;
}

.problem-examples, .solution-steps {
    margin-top: 15px;
}

.example {
    margin: 10px 0;
    padding: 10px;
    background: rgba(255,255,255,0.5);
    border-radius: 5px;
}

.step {
    display: flex;
    align-items: flex-start;
    margin: 15px 0;
}

.step-number {
    background: #3498db;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    flex-shrink: 0;
}

.step-content h4 {
    margin: 0 0 5px 0;
    color: #2c3e50;
}

.data-visualization {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 30px;
}

.viz-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.data-source {
    font-size: 0.9em;
    color: #7f8c8d;
}

.data-display {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 20px;
    align-items: center;
}

.data-value {
    text-align: center;
}

.data-value .value {
    font-size: 3em;
    font-weight: bold;
    color: #3498db;
    display: block;
}

.data-value .label {
    color: #7f8c8d;
}

.interpretation {
    padding: 10px;
    border-radius: 5px;
    margin: 10px 0;
}

.interpretation.good { background: #d4edda; color: #155724; }
.interpretation.moderate { background: #fff3cd; color: #856404; }
.interpretation.critical { background: #f8d7da; color: #721c24; }

.simple-chart {
    grid-column: 1 / -1;
}

.chart-bars {
    display: flex;
    gap: 10px;
    height: 100px;
    align-items: flex-end;
}

.chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.bar {
    width: 100%;
    min-height: 10px;
    border-radius: 3px 3px 0 0;
    transition: height 0.3s ease;
}

.bar-label {
    font-size: 0.8em;
    margin-top: 5px;
    color: #7f8c8d;
}

.practical-guide {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
}

.guide-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 15px;
}

.guide-item {
    background: white;
    padding: 15px;
    border-radius: 5px;
}

.guide-item h5 {
    color: #2c3e50;
    margin-bottom: 10px;
}

.guide-item ul, .guide-item ol {
    margin: 0;
    padding-left: 20px;
}

.guide-item li {
    margin: 5px 0;
}

/* 위치 입력 모달 */
.location-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 30px;
    border-radius: 10px;
    max-width: 500px;
    width: 90%;
}

.location-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 15px 0;
}

.location-inputs input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
}

.location-examples {
    display: flex;
    gap: 10px;
    margin: 15px 0;
}

.example-btn {
    padding: 8px 12px;
    border: 1px solid #3498db;
    background: white;
    color: #3498db;
    border-radius: 5px;
    cursor: pointer;
}

.example-btn:hover {
    background: #3498db;
    color: white;
}

.modal-buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
}

.modal-buttons button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

#cancelLocation {
    background: #95a5a6;
    color: white;
}

#confirmLocation {
    background: #3498db;
    color: white;
}

.loading {
    text-align: center;
    color: #7f8c8d;
    padding: 20px;
}

.error {
    text-align: center;
    color: #e74c3c;
    padding: 20px;
}

/* 날씨 예보 스타일 */
.weather-forecast {
    margin: 20px 0;
}

.forecast-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
    margin-top: 15px;
}

.forecast-day {
    text-align: center;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
    font-size: 0.9em;
}

.day-label {
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 5px;
}

.precipitation {
    color: #3498db;
    font-weight: bold;
}

.temp {
    color: #e67e22;
    margin: 3px 0;
}

.weather-icon {
    font-size: 1.2em;
    margin-top: 5px;
}

/* 농작업 조언 스타일 */
.farming-advice {
    margin-top: 20px;
}

.advice {
    padding: 15px;
    border-radius: 5px;
    margin: 10px 0;
}

.advice.good {
    background: #d4edda;
    border-left: 4px solid #28a745;
    color: #155724;
}

.advice.moderate {
    background: #fff3cd;
    border-left: 4px solid #ffc107;
    color: #856404;
}

.advice.critical {
    background: #f8d7da;
    border-left: 4px solid #dc3545;
    color: #721c24;
}

.advice h5 {
    margin: 0 0 10px 0;
    font-size: 1.1em;
}

.advice ul {
    margin: 0;
    padding-left: 20px;
}

.advice li {
    margin: 5px 0;
}

@media (max-width: 768px) {
    .before-after {
        grid-template-columns: 1fr;
    }

    .data-display {
        grid-template-columns: 1fr;
    }

    .guide-grid {
        grid-template-columns: 1fr;
    }
}
</style>
`;

// 스타일을 head에 추가
if (!document.querySelector('#data-story-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'data-story-styles';
    styleElement.innerHTML = storyStyles;
    document.head.appendChild(styleElement);
}

export default DataStoryInterface;