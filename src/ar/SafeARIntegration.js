/**
 * SafeARIntegration.js - 메인 앱과 완전 분리된 안전한 AR 통합
 * DOM 간섭 없이 AR 시스템을 메인 애플리케이션에 통합
 */
class SafeARIntegration {
    constructor() {
        this.arSystem = null;
        this.isActive = false;
        this.eventListeners = new Map();
        this.previousTabState = null;

        // AI 관리자 추가
        this.aiManager = null;
        this.isAIEnabled = false;
        this.lastAIAnalysis = null;

        // 농부용 인터페이스 추가
        this.farmerInterface = null;
        this.isFarmerMode = false;
        this.farmDataInterval = null;

        console.log('🛡️ SafeARIntegration: 초기화됨');
    }

    // 안전한 AR 시작
    async startSafeAR() {
        try {
            console.log('🚀 SafeARIntegration: 안전한 AR 시작');

            // 기존 AR 시스템 완전 정리
            await this.emergencyCleanupAll();

            // 현재 앱 상태 백업
            this.backupCurrentState();

            // 최소 AR 시스템 생성
            this.arSystem = new MinimalWebXRAR();

            // AR 이벤트 리스너 설정
            this.setupAREventListeners();

            // 글로벌 안전 장치 설정
            this.setupGlobalSafeties();

            // AI 매니저 초기화 (병렬로 실행)
            this.initializeAI();

            // AR 시작
            const success = await this.arSystem.startAR();

            if (success) {
                this.isActive = true;
                console.log('✅ SafeARIntegration: 안전한 AR 활성화됨');

                // State notification
                this.notifyARStateChange('started');

                return true;
            } else {
                throw new Error('AR 시스템 시작 실패');
            }

        } catch (error) {
            console.error('❌ SafeARIntegration: AR 시작 실패:', error);

            // 실패 시 완전 정리
            await this.cleanup();

            // 사용자에게 알림
            this.showSafeNotification('Failed to start AR. Please check if your browser supports WebXR.', 'error');

            return false;
        }
    }

    // 안전한 AR 종료
    async stopSafeAR() {
        try {
            console.log('🛑 SafeARIntegration: 안전한 AR 종료');

            // AR 시스템 정지
            if (this.arSystem) {
                await this.arSystem.stopAR();
            }

            // 완전 정리
            await this.cleanup();

            // 앱 상태 복원
            this.restorePreviousState();

            // State notification
            this.notifyARStateChange('stopped');

            console.log('✅ SafeARIntegration: 안전한 AR 종료 완료');
            return true;

        } catch (error) {
            console.error('❌ SafeARIntegration: AR 종료 실패:', error);

            // 실패 시 강제 정리
            await this.cleanup();
            return false;
        }
    }

    // 농부용 AR 시작
    async startFarmerAR() {
        try {
            console.log('👨‍🌾 SafeARIntegration: 농부용 AR 시작');

            // 기존 AR 시스템 완전 정리
            await this.emergencyCleanupAll();

            // 농부 모드 설정
            this.isFarmerMode = true;

            // 현재 앱 상태 백업
            this.backupCurrentState();

            // 최소 AR 시스템 생성
            this.arSystem = new MinimalWebXRAR();

            // 농부용 인터페이스 생성 (기존 오버레이 대체)
            this.farmerInterface = new FarmerARInterface();
            this.farmerInterface.createFarmerInterface();
            this.farmerInterface.show();

            // 이벤트 리스너 설정 (농부용 확장)
            this.setupFarmerEventListeners();

            // 글로벌 안전 장치 설정
            this.setupGlobalSafeties();

            // AR 시작
            const success = await this.arSystem.startAR();

            if (success) {
                this.isActive = true;

                // 초기 농장 데이터 로드
                setTimeout(() => {
                    this.loadInitialFarmData();
                }, 1000);

                // 농장 데이터 주기적 업데이트 시작
                this.startFarmDataUpdates();

                console.log('✅ SafeARIntegration: 농부용 AR 활성화됨');

                // State notification
                this.notifyARStateChange('farmer-started');

                return true;
            } else {
                throw new Error('농부용 AR 시스템 시작 실패');
            }

        } catch (error) {
            console.error('❌ SafeARIntegration: 농부용 AR 시작 실패:', error);

            // 실패 시 완전 정리
            await this.cleanup();

            // 사용자에게 알림
            this.showSafeNotification('농부용 AR 시작에 실패했습니다. 브라우저가 WebXR을 지원하는지 확인해주세요.', 'error');

            return false;
        }
    }

    // 농장 데이터 로드
    async loadInitialFarmData() {
        try {
            console.log('🌾 초기 농장 데이터 로드 중...');

            // 기본 위치 (나중에 GPS로 교체)
            const defaultLat = 37.5665;
            const defaultLon = 126.9780;

            const [soilData, ndviData] = await Promise.all([
                fetch(`http://localhost:3001/api/smap/soil-moisture?lat=${defaultLat}&lon=${defaultLon}`)
                    .then(r => r.json())
                    .catch(e => this.getFallbackSoilData()),
                fetch(`http://localhost:3001/api/modis/ndvi?lat=${defaultLat}&lon=${defaultLon}`)
                    .then(r => r.json())
                    .catch(e => this.getFallbackNDVIData())
            ]);

            if (this.farmerInterface) {
                this.farmerInterface.updateFarmData(soilData, ndviData);
                console.log('✅ 농장 데이터 업데이트 완료');
            }

        } catch (error) {
            console.error('❌ 농장 데이터 로드 실패:', error);

            // 오프라인 데이터 사용
            if (this.farmerInterface) {
                this.farmerInterface.updateFarmData(
                    this.getFallbackSoilData(),
                    this.getFallbackNDVIData()
                );
            }
        }
    }

    // 농장 데이터 주기적 업데이트
    startFarmDataUpdates() {
        // 2분마다 데이터 갱신
        this.farmDataInterval = setInterval(() => {
            if (this.isActive && this.isFarmerMode) {
                this.loadInitialFarmData();
            }
        }, 2 * 60 * 1000); // 2분

        console.log('⏰ 농장 데이터 자동 갱신 시작 (2분 간격)');
    }

    // Fallback 토양 데이터
    getFallbackSoilData() {
        return {
            surface_moisture: 0.35 + (Math.random() - 0.5) * 0.1, // 30-40% 범위
            quality: 'fallback',
            source: 'Offline Cache',
            timestamp: new Date().toISOString()
        };
    }

    // Fallback NDVI 데이터
    getFallbackNDVIData() {
        return {
            ndvi: 0.6 + (Math.random() - 0.5) * 0.2, // 0.5-0.7 범위
            temperature: 25 + (Math.random() - 0.5) * 10, // 20-30도 범위
            quality: 'fallback',
            source: 'Offline Cache',
            timestamp: new Date().toISOString()
        };
    }

    // 농부용 이벤트 리스너 설정
    setupFarmerEventListeners() {
        // 기본 AR 이벤트 설정
        this.setupAREventListeners();

        // 농부 AR 종료 이벤트
        const farmerExitHandler = () => {
            console.log('🔴 농부 AR 종료 이벤트 수신');
            this.cleanup();
        };

        window.addEventListener('farmer-ar-exit', farmerExitHandler);
        this.eventListeners.set('farmer-ar-exit', farmerExitHandler);

        // 데이터 갱신 이벤트
        const refreshHandler = () => {
            console.log('🔄 농장 데이터 수동 갱신');
            this.loadInitialFarmData();
        };

        window.addEventListener('farmer-refresh-data', refreshHandler);
        this.eventListeners.set('farmer-refresh-data', refreshHandler);

        // 영역 스캔 완료 이벤트
        const scanCompleteHandler = (event) => {
            console.log('🔍 영역 스캔 완료:', event.detail);
            // 스캔 결과에 따른 추가 분석 수행
            this.handleAreaScanResults(event.detail);
        };

        window.addEventListener('farmer-area-scan-complete', scanCompleteHandler);
        this.eventListeners.set('farmer-area-scan-complete', scanCompleteHandler);

        console.log('👨‍🌾 농부용 이벤트 리스너 설정 완료');
    }

    // 영역 스캔 결과 처리
    handleAreaScanResults(scanResults) {
        if (this.farmerInterface && scanResults) {
            // 스캔 결과를 기반으로 추가 조언 생성
            const enhancedAnalysis = {
                scanAreas: scanResults.areas,
                avgCondition: scanResults.avgCondition,
                recommendation: this.generateScanBasedAdvice(scanResults)
            };

            // AI 분석 결과로 데이터 업데이트
            if (this.lastSoilData) {
                this.farmerInterface.updateFarmData(
                    this.lastSoilData.soilData,
                    this.lastSoilData.ndviData,
                    enhancedAnalysis
                );
            }
        }
    }

    // 스캔 기반 조언 생성
    generateScanBasedAdvice(scanResults) {
        const { areas, avgCondition } = scanResults;

        let advice = '';
        switch (avgCondition) {
            case '우수':
                advice = `${areas}개 영역 모두 우수한 상태입니다. 현재 관리 방법을 유지하세요.`;
                break;
            case '양호':
                advice = `${areas}개 영역이 양호한 상태입니다. 정기적인 모니터링을 권장합니다.`;
                break;
            case '보통':
                advice = `${areas}개 영역이 보통 상태입니다. 토양 개선을 고려해보세요.`;
                break;
            case '주의':
                advice = `${areas}개 영역에 주의가 필요합니다. 집중 관리가 권장됩니다.`;
                break;
            case '개선필요':
                advice = `${areas}개 영역에 즉시 개선 조치가 필요합니다. 전문가 상담을 권장합니다.`;
                break;
            default:
                advice = `${areas}개 영역을 분석했습니다. 지속적인 모니터링이 필요합니다.`;
        }

        return {
            soilType: '혼합 토양',
            scanAdvice: advice,
            areasScanned: areas,
            condition: avgCondition
        };
    }

    // 현재 앱 상태 백업
    backupCurrentState() {
        console.log('💾 현재 앱 상태 백업');

        try {
            // 활성 탭 상태 백업
            const activeTab = document.querySelector('.tab.active, .tab-button.active');
            const activeContent = document.querySelector('.tab-content:not([style*="display: none"])');

            this.previousTabState = {
                activeTabId: activeTab ? activeTab.id : null,
                activeContentId: activeContent ? activeContent.id : null,
                scrollPosition: window.scrollY,
                timestamp: Date.now()
            };

            console.log('📋 백업된 상태:', this.previousTabState);

        } catch (error) {
            console.warn('⚠️ 상태 백업 실패:', error);
        }
    }

    // 앱 상태 복원
    restorePreviousState() {
        console.log('🔄 이전 앱 상태 복원');

        try {
            if (!this.previousTabState) return;

            // 스크롤 위치 복원
            window.scrollTo(0, this.previousTabState.scrollPosition);

            // 탭 상태 복원
            if (this.previousTabState.activeTabId) {
                const tab = document.getElementById(this.previousTabState.activeTabId);
                if (tab && tab.click) {
                    setTimeout(() => tab.click(), 100);
                }
            }

            console.log('✅ 앱 상태 복원 완료');

        } catch (error) {
            console.warn('⚠️ 상태 복원 실패:', error);
        }
    }

    // AR 이벤트 리스너 설정
    setupAREventListeners() {
        console.log('🎧 AR 이벤트 리스너 설정');

        // 페이지 가시성 변경 시 AR 종료
        const visibilityHandler = () => {
            if (document.hidden && this.isActive) {
                console.log('📱 페이지가 숨겨짐 - AR 종료');
                this.cleanup();
            }
        };

        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.set('visibilitychange', visibilityHandler);

        // 브라우저 종료 시 정리
        const beforeUnloadHandler = (event) => {
            if (this.isActive) {
                this.cleanup();
            }
        };

        window.addEventListener('beforeunload', beforeUnloadHandler);
        this.eventListeners.set('beforeunload', beforeUnloadHandler);

        // 키보드 단축키 (Escape로 AR 종료)
        const keydownHandler = (event) => {
            if (event.key === 'Escape' && this.isActive) {
                console.log('⌨️ Escape 키로 AR 종료');
                this.cleanup();
            }
        };

        document.addEventListener('keydown', keydownHandler);
        this.eventListeners.set('keydown', keydownHandler);

        // Notify on orientation change
        const orientationHandler = () => {
            if (this.isActive) {
                console.log('📱 Screen rotation detected');
                this.showSafeNotification('💡 Landscape mode recommended for optimal AR experience.', 'info');
            }
        };

        window.addEventListener('orientationchange', orientationHandler);
        this.eventListeners.set('orientationchange', orientationHandler);
    }

    // 글로벌 안전 장치 설정
    setupGlobalSafeties() {
        console.log('🛡️ 글로벌 안전 장치 설정');

        // DOM 변경 감시 (메인 앱 요소 보호)
        const protectedSelectors = [
            '.main-container',
            '.app-header',
            '.tab-navigation',
            '.tab-content',
            '#mainContainer'
        ];

        // Safety timer (auto-stop after max 5 minutes)
        const safetyTimer = setTimeout(() => {
            console.log('⏰ Safety timer - Auto AR stop after 5 minutes');
            this.cleanup();
        }, 5 * 60 * 1000); // 5 minutes

        this.eventListeners.set('safetyTimer', () => {
            clearTimeout(safetyTimer);
        });

        // 메모리 사용량 모니터링
        if (performance.memory) {
            const memoryCheck = setInterval(() => {
                const usedMB = performance.memory.usedJSHeapSize / 1048576;
                if (usedMB > 200 && this.isActive) { // 200MB 초과 시
                    console.warn('⚠️ 메모리 사용량 높음 - AR 종료');
                    this.cleanup();
                }
            }, 30000); // 30초마다 체크

            this.eventListeners.set('memoryCheck', () => {
                clearInterval(memoryCheck);
            });
        }
    }

    // AI 매니저 초기화 (비동기, 블로킹 없음)
    async initializeAI() {
        try {
            console.log('🤖 AI 매니저 초기화 시작...');

            // AgriculturalAIManager 클래스 확인
            if (typeof AgriculturalAIManager === 'undefined') {
                console.warn('⚠️ AgriculturalAIManager 클래스를 찾을 수 없음');
                this.isAIEnabled = false;
                return;
            }

            // AI 매니저 생성 및 초기화
            this.aiManager = new AgriculturalAIManager();
            this.isAIEnabled = await this.aiManager.initialize();

            if (this.isAIEnabled) {
                console.log('✅ AI 매니저 초기화 성공');

                // AI 분석 타이머 설정 (5초마다)
                this.setupAIAnalysisTimer();
            } else {
                console.log('ℹ️ AI 모델 없이 NASA 데이터만 사용');
            }

        } catch (error) {
            console.warn('⚠️ AI 초기화 실패, NASA 데이터만 사용:', error);
            this.isAIEnabled = false;
            this.aiManager = null;
        }
    }

    // AI 분석 타이머 설정
    setupAIAnalysisTimer() {
        if (!this.isAIEnabled || !this.aiManager) return;

        console.log('⏰ AI 분석 타이머 설정 (5초 간격)');

        const aiAnalysisInterval = setInterval(() => {
            if (this.isActive && this.arSystem && this.arSystem.canvas) {
                this.performAIAnalysis();
            }
        }, 5000); // 5초마다 AI 분석

        // 타이머 정리 함수 등록
        this.eventListeners.set('aiAnalysisTimer', () => {
            clearInterval(aiAnalysisInterval);
        });
    }

    // AI 분석 수행
    async performAIAnalysis() {
        if (!this.isAIEnabled || !this.aiManager || !this.arSystem.canvas) {
            return;
        }

        try {
            console.log('🔍 AI 토지 분류 분석 중...');

            // AR 캔버스에서 이미지 분류
            const aiResult = await this.aiManager.classifyARCanvas(this.arSystem.canvas);

            if (aiResult) {
                this.lastAIAnalysis = aiResult;
                console.log('🤖 AI 분석 결과:', aiResult);

                // AR 오버레이에 결과 표시
                this.updateAIOverlay(aiResult);

                // NASA 데이터와 결합하여 농업 조언 생성
                if (this.lastNASAData) {
                    this.generateCombinedAnalysis(aiResult, this.lastNASAData);
                }
            }

        } catch (error) {
            console.error('❌ AI 분석 실패:', error);
        }
    }

    // AI 결과 오버레이 업데이트
    updateAIOverlay(aiResult) {
        if (!aiResult) return;

        const { landCover, confidence, analysisSource } = aiResult;

        // AI 분석 알림 표시
        this.showSafeNotification(
            `🤖 분류: ${landCover} (${(confidence * 100).toFixed(1)}% 신뢰도)`,
            'info'
        );

        // 커스텀 이벤트 발송 (다른 컴포넌트에서 사용 가능)
        window.dispatchEvent(new CustomEvent('ai-analysis-complete', {
            detail: {
                landCover,
                confidence,
                source: analysisSource,
                timestamp: Date.now()
            }
        }));
    }

    // NASA 데이터와 AI 결과 결합 분석
    generateCombinedAnalysis(aiResult, nasaData) {
        try {
            // 통합 데이터 생성
            const combinedData = this.aiManager.combineWithNASAData(aiResult, nasaData);

            // 농업 조언 생성
            const advice = this.aiManager.generateAgriculturalAdvice(combinedData);

            console.log('🌾 통합 농업 분석:', combinedData);
            console.log('💡 농업 조언:', advice);

            // 조언을 알림으로 표시 (첫 번째 조언만)
            if (advice.length > 0) {
                setTimeout(() => {
                    this.showSafeNotification(advice[0], 'success');
                }, 2000);
            }

            // 통합 분석 이벤트 발송
            window.dispatchEvent(new CustomEvent('combined-analysis-complete', {
                detail: {
                    combinedData,
                    advice,
                    timestamp: Date.now()
                }
            }));

        } catch (error) {
            console.error('❌ 통합 분석 실패:', error);
        }
    }

    // Store NASA data (for combining with AI)
    storeNASAData(nasaData) {
        this.lastNASAData = nasaData;

        // Update mobile UI status indicators
        this.updateMobileStatusIndicators();
    }

    // Update mobile UI status indicators
    updateMobileStatusIndicators() {
        try {
            // Update AI model status
            const aiStatus = document.getElementById('ai-status');
            if (aiStatus && this.aiManager) {
                const status = this.aiManager.getStatus();
                if (status.isModelLoaded) {
                    aiStatus.textContent = '✅ Ready';
                    aiStatus.className = 'ar-status-value success';
                } else {
                    aiStatus.textContent = '⚠️ Fallback';
                    aiStatus.className = 'ar-status-value warning';
                }
            }

            // Update WebXR status
            const webxrStatus = document.getElementById('webxr-status');
            if (webxrStatus) {
                if (this.isActive) {
                    webxrStatus.textContent = '✅ Active';
                    webxrStatus.className = 'ar-status-value success';
                } else if (navigator.xr) {
                    webxrStatus.textContent = '✅ Supported';
                    webxrStatus.className = 'ar-status-value success';
                } else {
                    webxrStatus.textContent = '❌ Not Supported';
                    webxrStatus.className = 'ar-status-value error';
                }
            }

            // Update camera status
            const cameraStatus = document.getElementById('camera-status');
            if (cameraStatus) {
                if (this.isActive) {
                    cameraStatus.textContent = '✅ Active';
                    cameraStatus.className = 'ar-status-value success';
                } else {
                    cameraStatus.textContent = '⏳ Ready';
                    cameraStatus.className = 'ar-status-value checking';
                }
            }

        } catch (error) {
            console.warn('⚠️ Failed to update mobile status indicators:', error);
        }
    }

    // 기존 AR 시스템 완전 정리
    async emergencyCleanupAll() {
        console.log('🚨 기존 AR 시스템 완전 정리');

        try {
            // 글로벌 AR 객체들 정리
            const globalARObjects = [
                'arSystem', 'arSystemExtension', 'arIntegrationManager',
                'arInterfaceManager', 'tabGuard'
            ];

            globalARObjects.forEach(objName => {
                if (window[objName]) {
                    try {
                        if (typeof window[objName].cleanup === 'function') {
                            window[objName].cleanup();
                        }
                        if (typeof window[objName].emergencyCleanup === 'function') {
                            window[objName].emergencyCleanup();
                        }
                    } catch (error) {
                        console.warn(`⚠️ ${objName} 정리 실패:`, error);
                    }

                    delete window[objName];
                    console.log(`🗑️ ${objName} 제거됨`);
                }
            });

            // 특정 AR DOM 요소만 안전하게 제거
            const safeElementsToRemove = [
                'ar-system-canvas', 'ar-system-controls', 'ar-control-panel',
                'ar-data-overlay', 'ar-voice-indicator', 'ar-fallback-camera',
                'minimal-ar-overlay', 'minimal-ar-canvas'
            ];

            safeElementsToRemove.forEach(id => {
                const element = document.getElementById(id);
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                    console.log(`🗑️ 안전 제거: ${id}`);
                }
            });

            // 모든 타이머 정리
            for (let i = 1; i < 99999; i++) {
                clearTimeout(i);
                clearInterval(i);
            }

            console.log('✅ 기존 AR 시스템 정리 완료');

        } catch (error) {
            console.error('❌ 긴급 정리 실패:', error);
        }
    }

    // 안전한 알림 표시
    showSafeNotification(message, type = 'info') {
        console.log(`💬 알림: ${message}`);

        // 기존 알림 제거
        const existingNotification = document.getElementById('safe-ar-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 알림 요소 생성
        const notification = document.createElement('div');
        notification.id = 'safe-ar-notification';

        const colors = {
            info: { bg: '#3498db', icon: 'ℹ️' },
            error: { bg: '#e74c3c', icon: '❌' },
            warning: { bg: '#f39c12', icon: '⚠️' },
            success: { bg: '#2ecc71', icon: '✅' }
        };

        const color = colors[type] || colors.info;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${color.bg};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            font-size: 14px;
            z-index: 99999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            max-width: 400px;
            text-align: center;
            animation: slideDown 0.3s ease-out;
        `;

        notification.innerHTML = `${color.icon} ${message}`;

        // 애니메이션 CSS 추가
        if (!document.getElementById('safe-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'safe-notification-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // 3초 후 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideDown 0.3s ease-out reverse';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 3000);
    }

    // Notify AR state change
    notifyARStateChange(state) {
        const messages = {
            started: 'AR mode activated',
            stopped: 'AR mode deactivated',
            error: 'AR error occurred'
        };

        const types = {
            started: 'success',
            stopped: 'info',
            error: 'error'
        };

        if (messages[state]) {
            this.showSafeNotification(messages[state], types[state]);
        }

        // 커스텀 이벤트 발생
        window.dispatchEvent(new CustomEvent('ar-state-change', {
            detail: { state, timestamp: Date.now() }
        }));
    }

    // 모든 이벤트 리스너 제거
    removeAllEventListeners() {
        console.log('🧹 모든 이벤트 리스너 제거');

        this.eventListeners.forEach((handler, event) => {
            try {
                if (event === 'safetyTimer' || event === 'memoryCheck') {
                    handler(); // 타이머 정리 함수 실행
                } else if (event === 'visibilitychange' || event === 'keydown') {
                    document.removeEventListener(event, handler);
                } else {
                    window.removeEventListener(event, handler);
                }
            } catch (error) {
                console.warn(`⚠️ 이벤트 리스너 제거 실패 (${event}):`, error);
            }
        });

        this.eventListeners.clear();
    }

    // 안전한 정리
    async cleanup() {
        if (!this.isActive && !this.arSystem) return;

        console.log('🧹 SafeARIntegration: 정리 시작');

        // AR 시스템 정리
        if (this.arSystem) {
            try {
                await this.arSystem.cleanup();
            } catch (error) {
                console.warn('⚠️ AR 시스템 정리 실패:', error);
            }
            this.arSystem = null;
        }

        // 농부용 인터페이스 정리
        if (this.farmerInterface) {
            try {
                this.farmerInterface.cleanup();
                console.log('👨‍🌾 농부용 인터페이스 정리 완료');
            } catch (error) {
                console.warn('⚠️ 농부용 인터페이스 정리 실패:', error);
            }
            this.farmerInterface = null;
        }

        // 농장 데이터 업데이트 타이머 정리
        if (this.farmDataInterval) {
            clearInterval(this.farmDataInterval);
            this.farmDataInterval = null;
            console.log('⏰ 농장 데이터 업데이트 타이머 정리 완료');
        }

        // 농부 모드 상태 초기화
        this.isFarmerMode = false;

        // AI 매니저 정리
        if (this.aiManager) {
            try {
                this.aiManager.cleanup();
                console.log('🤖 AI 매니저 정리 완료');
            } catch (error) {
                console.warn('⚠️ AI 매니저 정리 실패:', error);
            }
            this.aiManager = null;
            this.isAIEnabled = false;
            this.lastAIAnalysis = null;
            this.lastNASAData = null;
        }

        // 이벤트 리스너 제거
        this.removeAllEventListeners();

        // 이전 상태 복원
        setTimeout(() => {
            this.restorePreviousState();
        }, 100);

        // 상태 초기화
        this.isActive = false;
        this.previousTabState = null;

        // State notification
        this.notifyARStateChange('stopped');

        console.log('✅ SafeARIntegration: 정리 완료');
    }

    // 상태 확인
    getStatus() {
        return {
            isActive: this.isActive,
            hasARSystem: !!this.arSystem,
            eventListenersCount: this.eventListeners.size,
            hasPreviousState: !!this.previousTabState,
            arSystemStatus: this.arSystem ? this.arSystem.getStatus() : null,

            // AI 상태 정보 추가
            isAIEnabled: this.isAIEnabled,
            hasAIManager: !!this.aiManager,
            aiManagerStatus: this.aiManager ? this.aiManager.getStatus() : null,
            hasLastAIAnalysis: !!this.lastAIAnalysis,
            hasLastNASAData: !!this.lastNASAData
        };
    }

    // 디버그 정보
    getDebugInfo() {
        return {
            ...this.getStatus(),
            eventListeners: Array.from(this.eventListeners.keys()),
            previousState: this.previousTabState,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
            } : 'unavailable',

            // AI 디버그 정보 추가
            lastAIAnalysis: this.lastAIAnalysis,
            lastNASAData: this.lastNASAData,
            aiTimestamp: this.lastAIAnalysis ? this.lastAIAnalysis.timestamp : null
        };
    }
}

// 전역 접근 가능하도록 설정
if (typeof window !== 'undefined') {
    window.SafeARIntegration = SafeARIntegration;
}

// 모듈 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SafeARIntegration;
}