/**
 * FarmerARInterface.js - 현장 농부를 위한 특화 AR 인터페이스
 *
 * 주요 특징:
 * - 큰 텍스트와 아이콘 (햇빛 가시성)
 * - 장갑 친화적 터치 인터페이스
 * - 가로모드 최적화
 * - 즉각적인 농업 조언
 * - 오프라인 데이터 캐싱
 */
class FarmerARInterface {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.currentAdvice = null;
        this.lastSoilData = null;
        this.savedAnalyses = [];
        this.initializeSavedData();
    }

    // 저장된 분석 데이터 초기화
    initializeSavedData() {
        try {
            this.savedAnalyses = JSON.parse(localStorage.getItem('farmer-analyses') || '[]');
        } catch (error) {
            console.warn('저장된 농업 분석 데이터 로드 실패:', error);
            this.savedAnalyses = [];
        }
    }

    // 농부용 인터페이스 생성
    createFarmerInterface() {
        // 기존 인터페이스 정리
        this.cleanup();

        // 메인 컨테이너 생성
        this.container = document.createElement('div');
        this.container.id = 'farmer-ar-interface';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10001;
            pointer-events: none;
            font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
            display: none;
            overflow: hidden;
        `;

        // 상단 상태 바
        this.createTopStatusBar();

        // 중앙 분석 패널
        this.createAnalysisPanel();

        // 하단 액션 패널
        this.createActionPanel();

        // 긴급 알림 패널
        this.createAlertPanel();

        document.body.appendChild(this.container);

        // 가로모드 감지
        this.setupOrientationHandler();

        console.log('👨‍🌾 농부용 AR 인터페이스 생성 완료');
    }

    // 상단 상태 바 생성
    createTopStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 15px;
            padding: 15px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            pointer-events: auto;
            border: 3px solid #27ae60;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        statusBar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 28px;">🥽</span>
                    <div>
                        <div style="font-weight: bold; color: #27ae60; font-size: 18px;">현장 분석 모드</div>
                        <div style="font-size: 14px; opacity: 0.8; color: white;">실시간 토양 분석 중...</div>
                    </div>
                </div>
                <div id="farmer-gps-status" style="display: flex; align-items: center; gap: 8px; color: white;">
                    <span style="font-size: 20px;">📍</span>
                    <span style="font-size: 14px;">위치 확인 중</span>
                </div>
            </div>
            <button id="farmer-exit-ar" style="
                background: #e74c3c;
                border: none;
                color: white;
                padding: 15px 25px;
                border-radius: 12px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                min-width: 100px;
                box-shadow: 0 2px 10px rgba(231,76,60,0.3);
                transition: all 0.2s ease;
            " onmouseover="this.style.background='#c0392b'" onmouseout="this.style.background='#e74c3c'">종료</button>
        `;

        this.container.appendChild(statusBar);

        // 종료 버튼 이벤트
        const exitBtn = statusBar.querySelector('#farmer-exit-ar');
        exitBtn.addEventListener('click', () => {
            this.handleExit();
        });

        // 터치 최적화
        exitBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            exitBtn.style.transform = 'scale(0.95)';
        });

        exitBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            exitBtn.style.transform = 'scale(1)';
            this.handleExit();
        });
    }

    // 중앙 분석 패널 생성
    createAnalysisPanel() {
        const analysisPanel = document.createElement('div');
        analysisPanel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 25px;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.92);
            border-radius: 25px;
            padding: 30px;
            pointer-events: auto;
            border: 4px solid #3498db;
            min-width: 380px;
            max-width: 450px;
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        `;

        analysisPanel.innerHTML = `
            <div style="margin-bottom: 25px;">
                <h2 style="margin: 0 0 12px 0; color: #3498db; font-size: 26px; display: flex; align-items: center; gap: 12px;">
                    <span>🌱</span>
                    <span>토양 분석 결과</span>
                </h2>
                <div style="font-size: 16px; opacity: 0.8; color: white;">
                    AI + NASA 위성 데이터 기반
                </div>
            </div>

            <!-- 주요 지표 -->
            <div style="display: grid; gap: 20px; margin-bottom: 30px;">
                <div class="data-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="display: flex; align-items: center; gap: 10px; font-size: 20px; color: white;">
                            💧 토양 수분
                        </span>
                        <span id="farmer-moisture" style="font-size: 24px; font-weight: bold; color: #3498db;">
                            --
                        </span>
                    </div>
                    <div style="height: 12px; background: rgba(255,255,255,0.2); border-radius: 6px;">
                        <div id="farmer-moisture-bar" style="height: 100%; background: linear-gradient(90deg, #3498db, #2980b9); border-radius: 6px; width: 0%; transition: width 0.8s ease;"></div>
                    </div>
                </div>

                <div class="data-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="display: flex; align-items: center; gap: 10px; font-size: 20px; color: white;">
                            🌿 식생 지수
                        </span>
                        <span id="farmer-ndvi" style="font-size: 24px; font-weight: bold; color: #27ae60;">
                            --
                        </span>
                    </div>
                    <div style="height: 12px; background: rgba(255,255,255,0.2); border-radius: 6px;">
                        <div id="farmer-ndvi-bar" style="height: 100%; background: linear-gradient(90deg, #27ae60, #229954); border-radius: 6px; width: 0%; transition: width 0.8s ease;"></div>
                    </div>
                </div>

                <div class="data-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="display: flex; align-items: center; gap: 10px; font-size: 20px; color: white;">
                            🌡️ 토양 온도
                        </span>
                        <span id="farmer-temperature" style="font-size: 24px; font-weight: bold; color: #e74c3c;">
                            --
                        </span>
                    </div>
                </div>
            </div>

            <!-- 농업 조언 -->
            <div style="background: rgba(52, 152, 219, 0.15); border-radius: 20px; padding: 25px; border-left: 6px solid #3498db;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                    <span style="font-size: 28px;">💡</span>
                    <h3 style="margin: 0; color: #3498db; font-size: 22px;">농업 조언</h3>
                </div>
                <div id="farmer-advice-text" style="
                    font-size: 18px;
                    line-height: 1.6;
                    color: white;
                    font-weight: 500;
                    min-height: 70px;
                    display: flex;
                    align-items: center;
                ">
                    데이터 분석 중...
                </div>
                <div id="farmer-advice-details" style="
                    font-size: 16px;
                    opacity: 0.9;
                    margin-top: 12px;
                    color: #bdc3c7;
                    line-height: 1.4;
                "></div>
            </div>
        `;

        this.container.appendChild(analysisPanel);
    }

    // 하단 액션 패널 생성
    createActionPanel() {
        const actionPanel = document.createElement('div');
        actionPanel.style.cssText = `
            position: absolute;
            bottom: 25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            border-radius: 25px;
            padding: 25px;
            pointer-events: auto;
            display: flex;
            gap: 20px;
            border: 3px solid #f39c12;
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        `;

        actionPanel.innerHTML = `
            <button id="farmer-scan-area" class="farmer-action-btn" style="
                background: linear-gradient(135deg, #27ae60, #229954);
                border: none;
                color: white;
                padding: 18px 30px;
                border-radius: 18px;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 180px;
                justify-content: center;
                box-shadow: 0 4px 15px rgba(39,174,96,0.3);
                transition: all 0.3s ease;
            ">
                <span style="font-size: 24px;">🔍</span>
                영역 스캔
            </button>

            <button id="farmer-refresh-data" class="farmer-action-btn" style="
                background: linear-gradient(135deg, #3498db, #2980b9);
                border: none;
                color: white;
                padding: 18px 30px;
                border-radius: 18px;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 180px;
                justify-content: center;
                box-shadow: 0 4px 15px rgba(52,152,219,0.3);
                transition: all 0.3s ease;
            ">
                <span style="font-size: 24px;">🔄</span>
                데이터 갱신
            </button>

            <button id="farmer-save-analysis" class="farmer-action-btn" style="
                background: linear-gradient(135deg, #9b59b6, #8e44ad);
                border: none;
                color: white;
                padding: 18px 30px;
                border-radius: 18px;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 180px;
                justify-content: center;
                box-shadow: 0 4px 15px rgba(155,89,182,0.3);
                transition: all 0.3s ease;
            ">
                <span style="font-size: 24px;">💾</span>
                분석 저장
            </button>
        `;

        this.container.appendChild(actionPanel);

        // 액션 버튼 이벤트 및 터치 최적화
        this.setupActionButtonEvents(actionPanel);
    }

    // 액션 버튼 이벤트 설정
    setupActionButtonEvents(actionPanel) {
        const buttons = actionPanel.querySelectorAll('.farmer-action-btn');

        buttons.forEach(button => {
            // 호버 효과
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px) scale(1.02)';
                button.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0) scale(1)';
                button.style.boxShadow = button.style.boxShadow.replace('25px', '15px');
            });

            // 터치 최적화
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.style.transform = 'scale(0.95)';
                // 진동 피드백
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                button.style.transform = 'scale(1)';
            });
        });

        // 개별 버튼 기능
        actionPanel.querySelector('#farmer-scan-area').addEventListener('click', () => {
            this.handleAreaScan();
        });

        actionPanel.querySelector('#farmer-refresh-data').addEventListener('click', () => {
            this.handleRefreshData();
        });

        actionPanel.querySelector('#farmer-save-analysis').addEventListener('click', () => {
            this.handleSaveAnalysis();
        });
    }

    // 긴급 알림 패널 생성
    createAlertPanel() {
        const alertPanel = document.createElement('div');
        alertPanel.id = 'farmer-alert-panel';
        alertPanel.style.cssText = `
            position: absolute;
            top: 90px;
            right: 25px;
            background: rgba(231, 76, 60, 0.95);
            border-radius: 20px;
            padding: 20px 25px;
            pointer-events: auto;
            border: 4px solid #c0392b;
            max-width: 320px;
            display: none;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 30px rgba(231,76,60,0.4);
            animation: alertSlideIn 0.3s ease;
        `;

        alertPanel.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <span style="font-size: 24px;">⚠️</span>
                <strong style="color: white; font-size: 18px;">긴급 알림</strong>
            </div>
            <div id="farmer-alert-text" style="color: white; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
                알림 내용이 여기에 표시됩니다.
            </div>
            <button id="farmer-alert-close" style="
                background: transparent;
                border: 2px solid white;
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s ease;
            ">확인</button>
        `;

        this.container.appendChild(alertPanel);

        // 알림 닫기 이벤트
        alertPanel.querySelector('#farmer-alert-close').addEventListener('click', () => {
            this.hideAlert();
        });

        // CSS 애니메이션 추가
        this.addAlertAnimations();
    }

    // 알림 애니메이션 CSS 추가
    addAlertAnimations() {
        if (!document.getElementById('farmer-alert-animations')) {
            const style = document.createElement('style');
            style.id = 'farmer-alert-animations';
            style.textContent = `
                @keyframes alertSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 가로모드 핸들러 설정
    setupOrientationHandler() {
        const updateLayout = () => {
            if (window.innerHeight < window.innerWidth) {
                // 가로모드 - 최적 상태
                this.container.style.fontSize = '16px';
                this.updateGPSStatus('📍 가로모드 최적화 활성');
            } else {
                // 세로모드 - 경고
                this.showAlert('📱 더 나은 사용을 위해 가로 모드로 회전해주세요.');
                this.updateGPSStatus('📱 세로모드 - 가로 권장');
            }
        };

        window.addEventListener('resize', updateLayout);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateLayout, 500); // 회전 완료 후 체크
        });

        // 초기 실행
        updateLayout();
    }

    // GPS 상태 업데이트
    updateGPSStatus(status) {
        const gpsStatus = document.getElementById('farmer-gps-status');
        if (gpsStatus) {
            gpsStatus.innerHTML = `
                <span style="font-size: 20px;">📍</span>
                <span style="font-size: 14px;">${status}</span>
            `;
        }
    }

    // 데이터 업데이트
    updateFarmData(soilData, ndviData, aiAnalysis = null) {
        this.lastSoilData = { soilData, ndviData, aiAnalysis, timestamp: new Date() };

        // NASA 데이터 표시
        if (soilData && soilData.surface_moisture !== undefined) {
            const moisturePercent = (soilData.surface_moisture * 100).toFixed(1);
            document.getElementById('farmer-moisture').textContent = `${moisturePercent}%`;
            document.getElementById('farmer-moisture-bar').style.width = `${moisturePercent}%`;
        }

        if (ndviData && ndviData.ndvi !== undefined) {
            document.getElementById('farmer-ndvi').textContent = ndviData.ndvi.toFixed(3);
            const ndviPercent = ((parseFloat(ndviData.ndvi) + 1) / 2) * 100;
            document.getElementById('farmer-ndvi-bar').style.width = `${ndviPercent}%`;
        }

        if (ndviData && ndviData.temperature !== undefined) {
            document.getElementById('farmer-temperature').textContent =
                `${ndviData.temperature.toFixed(1)}°C`;
        }

        // 농업 조언 생성
        this.generateFarmingAdvice(soilData, ndviData, aiAnalysis);

        // 긴급 알림 체크
        this.checkEmergencyAlerts(soilData, ndviData);

        // GPS 상태 업데이트
        this.updateGPSStatus('📍 데이터 업데이트 완료');
    }

    // 농업 조언 생성
    generateFarmingAdvice(soilData, ndviData, aiAnalysis) {
        let mainAdvice = '';
        let details = '';

        if (!soilData || !ndviData) {
            mainAdvice = '데이터를 분석 중입니다...';
            details = '잠시만 기다려주세요';
        } else {
            const moisture = soilData.surface_moisture * 100;
            const ndvi = parseFloat(ndviData.ndvi);
            const temp = ndviData.temperature;

            // 토양 수분 기반 주요 조언
            if (moisture < 15) {
                mainAdvice = '🚨 긴급 관수 필요';
                details = '토양이 심각하게 건조합니다. 즉시 관개 시설을 가동하세요.';
            } else if (moisture < 25) {
                mainAdvice = '💧 관수 권장';
                details = '토양이 건조합니다. 오늘 중으로 물을 주세요.';
            } else if (moisture < 35) {
                mainAdvice = '💧 관수 고려';
                details = '토양이 약간 건조합니다. 날씨를 확인 후 물 주기를 고려하세요.';
            } else if (moisture < 70) {
                mainAdvice = '✅ 수분 상태 양호';
                details = '토양 수분이 적절합니다. 현재 상태를 유지하세요.';
            } else if (moisture < 85) {
                mainAdvice = '⚠️ 과습 주의';
                details = '토양이 습합니다. 배수 상태를 확인하고 관수를 중단하세요.';
            } else {
                mainAdvice = '🚨 과습 위험';
                details = '토양이 너무 습합니다. 배수 작업이 필요합니다.';
            }

            // 식생 지수 기반 추가 조언
            if (ndvi < 0.2) {
                mainAdvice += ' | 🌱 생장 부진';
                details += ' 식생 상태가 매우 나쁩니다. 전문가 상담을 권장합니다.';
            } else if (ndvi < 0.4) {
                mainAdvice += ' | 🌿 생장 개선 필요';
                details += ' 비료 시비나 토양 개량을 고려하세요.';
            } else if (ndvi > 0.7) {
                mainAdvice += ' | 🌟 생장 활발';
                details += ' 작물이 건강하게 자라고 있습니다.';
            }

            // 온도 기반 조언
            if (temp > 35) {
                details += ' 🌡️ 고온 경고: 작물 스트레스 방지를 위해 차광막 설치를 고려하세요.';
            } else if (temp > 30) {
                details += ' 🌡️ 고온 주의: 오후 관수를 피하고 아침이나 저녁에 물을 주세요.';
            } else if (temp < 5) {
                details += ' ❄️ 저온 경고: 방한 조치가 필요합니다.';
            } else if (temp < 10) {
                details += ' ❄️ 저온 주의: 생장이 느려질 수 있습니다.';
            }

            // AI 분석 결과 통합
            if (aiAnalysis && aiAnalysis.soilType) {
                details += ` | 토양 분석: ${aiAnalysis.soilType}`;
            }
        }

        // 조언 표시
        const adviceElement = document.getElementById('farmer-advice-text');
        const detailsElement = document.getElementById('farmer-advice-details');

        if (adviceElement) {
            adviceElement.textContent = mainAdvice;
            // 중요도에 따라 색상 변경
            if (mainAdvice.includes('긴급') || mainAdvice.includes('🚨')) {
                adviceElement.style.color = '#e74c3c';
                adviceElement.style.fontWeight = 'bold';
            } else if (mainAdvice.includes('권장') || mainAdvice.includes('💧')) {
                adviceElement.style.color = '#f39c12';
            } else {
                adviceElement.style.color = 'white';
            }
        }

        if (detailsElement) {
            detailsElement.textContent = details;
        }

        this.currentAdvice = { mainAdvice, details };
    }

    // 긴급 알림 체크
    checkEmergencyAlerts(soilData, ndviData) {
        if (!soilData || !ndviData) return;

        const moisture = soilData.surface_moisture * 100;
        const ndvi = parseFloat(ndviData.ndvi);
        const temp = ndviData.temperature;

        // 긴급 상황 체크
        if (moisture < 10) {
            this.showAlert('🚨 극도로 건조한 토양이 감지되었습니다. 즉시 관개가 필요합니다!', 'critical');
        } else if (moisture > 90) {
            this.showAlert('🚨 토양 과습이 심각합니다. 배수 조치를 즉시 취하세요!', 'critical');
        } else if (ndvi < 0.15) {
            this.showAlert('⚠️ 식생 상태가 위험합니다. 농업 전문가와 상담하세요.', 'warning');
        } else if (temp > 40) {
            this.showAlert('🌡️ 극고온이 감지되었습니다. 작물 보호 조치가 필요합니다.', 'critical');
        } else if (temp < 0) {
            this.showAlert('❄️ 서리 위험이 감지되었습니다. 방한 조치를 취하세요.', 'critical');
        }
    }

    // 알림 표시 (강화된 버전)
    showAlert(message, priority = 'normal') {
        const alertPanel = document.getElementById('farmer-alert-panel');
        const alertText = document.getElementById('farmer-alert-text');

        if (!alertPanel || !alertText) return;

        alertText.textContent = message;
        alertPanel.style.display = 'block';

        // 우선순위에 따른 스타일 조정
        if (priority === 'critical') {
            alertPanel.style.background = 'rgba(231, 76, 60, 0.98)';
            alertPanel.style.borderColor = '#c0392b';
            alertPanel.style.animation = 'alertSlideIn 0.3s ease, pulse 1s infinite';

            // 강한 진동 피드백
            if (navigator.vibrate) {
                navigator.vibrate([300, 100, 300, 100, 300]);
            }
        } else if (priority === 'warning') {
            alertPanel.style.background = 'rgba(243, 156, 18, 0.95)';
            alertPanel.style.borderColor = '#e67e22';
            alertPanel.style.animation = 'alertSlideIn 0.3s ease';

            // 중간 진동 피드백
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        } else {
            alertPanel.style.background = 'rgba(52, 152, 219, 0.95)';
            alertPanel.style.borderColor = '#2980b9';
            alertPanel.style.animation = 'alertSlideIn 0.3s ease';

            // 약한 진동 피드백
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
        }

        // 자동 숨기기 시간 조정
        const hideTime = priority === 'critical' ? 15000 : priority === 'warning' ? 10000 : 7000;
        setTimeout(() => {
            this.hideAlert();
        }, hideTime);
    }

    // 알림 숨기기
    hideAlert() {
        const alertPanel = document.getElementById('farmer-alert-panel');
        if (alertPanel) {
            alertPanel.style.display = 'none';
            alertPanel.style.animation = '';
        }
    }

    // 영역 스캔 처리
    handleAreaScan() {
        console.log('🔍 농장 영역 스캔 시작');
        this.showAlert('📡 주변 영역을 스캔 중입니다... 카메라를 천천히 움직여주세요.', 'normal');

        // 스캔 애니메이션 효과
        const scanEffect = document.createElement('div');
        scanEffect.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent 48%, rgba(52, 152, 219, 0.4) 49%, rgba(52, 152, 219, 0.6) 50%, rgba(52, 152, 219, 0.4) 51%, transparent 52%);
            animation: scan 3s linear;
            pointer-events: none;
            z-index: 10002;
        `;

        document.body.appendChild(scanEffect);

        // 스캔 완료 처리
        setTimeout(() => {
            if (scanEffect.parentNode) {
                scanEffect.parentNode.removeChild(scanEffect);
            }

            // 가상의 스캔 결과 생성
            const scanResults = this.generateScanResults();
            this.showAlert(`✅ 스캔 완료! ${scanResults.areas}개 영역 분석, 평균 토양 상태: ${scanResults.avgCondition}`, 'normal');

            // 데이터 갱신 이벤트 발생
            window.dispatchEvent(new CustomEvent('farmer-area-scan-complete', {
                detail: scanResults
            }));
        }, 3000);
    }

    // 스캔 결과 생성 (시뮬레이션)
    generateScanResults() {
        const areas = Math.floor(Math.random() * 8) + 3; // 3-10개 영역
        const conditions = ['우수', '양호', '보통', '주의', '개선필요'];
        const avgCondition = conditions[Math.floor(Math.random() * conditions.length)];

        return {
            areas,
            avgCondition,
            timestamp: new Date()
        };
    }

    // 데이터 갱신 처리
    handleRefreshData() {
        console.log('🔄 농장 데이터 갱신');
        document.getElementById('farmer-advice-text').textContent = '데이터 갱신 중...';

        // 새로고침 애니메이션
        const refreshBtn = document.getElementById('farmer-refresh-data');
        const iconSpan = refreshBtn.querySelector('span');

        if (iconSpan) {
            iconSpan.style.animation = 'spin 1s linear infinite';
        }

        // CSS 애니메이션 추가
        if (!document.getElementById('refresh-animation')) {
            const style = document.createElement('style');
            style.id = 'refresh-animation';
            style.textContent = `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (iconSpan) {
                iconSpan.style.animation = '';
            }

            // 데이터 새로고침 이벤트 발생
            window.dispatchEvent(new CustomEvent('farmer-refresh-data'));
            this.showAlert('🔄 데이터가 성공적으로 갱신되었습니다.', 'normal');
        }, 1000);
    }

    // 분석 저장 처리
    handleSaveAnalysis() {
        console.log('💾 농장 분석 저장');

        if (this.currentAdvice && this.lastSoilData) {
            const analysisData = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                advice: this.currentAdvice,
                data: this.lastSoilData,
                location: this.getCurrentLocation(),
                farmInfo: {
                    size: '1.2 ha',
                    crop: '벼',
                    stage: '생장기'
                }
            };

            // 로컬 스토리지에 저장
            this.savedAnalyses.push(analysisData);
            localStorage.setItem('farmer-analyses', JSON.stringify(this.savedAnalyses));

            this.showAlert(`💾 분석 결과가 저장되었습니다. (총 ${this.savedAnalyses.length}건)`, 'normal');

            // 저장 완료 애니메이션
            const saveBtn = document.getElementById('farmer-save-analysis');
            const originalBg = saveBtn.style.background;
            saveBtn.style.background = 'linear-gradient(135deg, #27ae60, #229954)';

            setTimeout(() => {
                saveBtn.style.background = originalBg;
            }, 1000);
        } else {
            this.showAlert('⚠️ 저장할 분석 데이터가 없습니다. 먼저 영역을 스캔해주세요.', 'warning');
        }
    }

    // 위치 정보 가져오기 (GPS 시뮬레이션)
    getCurrentLocation() {
        // 실제 구현에서는 navigator.geolocation 사용
        return {
            lat: 37.5665 + (Math.random() - 0.5) * 0.01,
            lng: 126.9780 + (Math.random() - 0.5) * 0.01,
            accuracy: Math.floor(Math.random() * 20) + 5,
            timestamp: new Date().toISOString()
        };
    }

    // 종료 처리
    handleExit() {
        console.log('🔴 농부 AR 종료');
        this.showAlert('🔴 농부용 AR을 종료합니다...', 'normal');

        setTimeout(() => {
            this.cleanup();
            window.dispatchEvent(new CustomEvent('farmer-ar-exit'));
        }, 1000);
    }

    // 인터페이스 표시
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.isVisible = true;
            this.updateGPSStatus('📍 농부 AR 활성화');
        }
    }

    // 인터페이스 숨기기
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
        }
    }

    // 정리
    cleanup() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.isVisible = false;

        // 애니메이션 스타일 제거
        const styles = ['farmer-alert-animations', 'refresh-animation'];
        styles.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });

        console.log('✅ 농부 AR 인터페이스 정리 완료');
    }

    // 저장된 분석 기록 조회
    getSavedAnalyses() {
        return this.savedAnalyses;
    }

    // 분석 기록 삭제
    deleteSavedAnalysis(id) {
        this.savedAnalyses = this.savedAnalyses.filter(analysis => analysis.id !== id);
        localStorage.setItem('farmer-analyses', JSON.stringify(this.savedAnalyses));
        return this.savedAnalyses;
    }
}

// 전역 등록
window.FarmerARInterface = FarmerARInterface;

console.log('🌾 FarmerARInterface 클래스 로드 완료');