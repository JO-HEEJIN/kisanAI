/**
 * EnhancedARPixelView.js
 *
 * 통합 픽셀 시각화 시스템
 * - stagmate의 클래스 구조 활용
 * - 실제 카메라 색상 추출 기능 추가
 * - NASA 데이터와 융합
 *
 * Created: 2025-10-04
 * Authors: momo + stagmate collaboration
 */

class EnhancedARPixelView {
    constructor(sceneEl) {
        // 기본 설정 (stagmate 구조 유지)
        this.scene = sceneEl;
        this.camera = document.getElementById('ar-camera');
        this.gridEntity = null;
        this.dataPopup = null;
        this.dataGrid = [];
        this.realColorGrid = [];  // 실제 카메라 색상 저장

        // 그리드 설정 (우리는 12x12 선호)
        this.GRID_ROWS = 12;
        this.GRID_COLS = 12;
        this.PIXEL_SIZE = 0.2;  // 더 작게해서 12x12도 화면에 잘 맞도록

        // 업데이트 설정
        this.updateInterval = null;
        this.cameraUpdateInterval = null;

        // 디버깅 패널 참조
        this.debugPanel = null;

        console.log("✅ EnhancedARPixelView initialized (12x12 grid with camera extraction)");
    }

    /**
     * AR Pixel View 시작
     */
    async start() {
        console.log("🚀 Starting Enhanced AR Pixel View...");

        // 디버그 패널 생성
        this.createDebugPanel();

        // 픽셀 그리드 생성
        this.createPixelGrid();

        // 이벤트 리스너 연결
        this._attachEventListeners();

        // NASA 데이터 업데이트 (15초마다)
        this.updateInterval = setInterval(() => this.updateNASAData(), 15000);

        // 카메라 색상 업데이트 (500ms마다 - 우리 방식)
        this.cameraUpdateInterval = setInterval(() => this.updateCameraColors(), 500);

        // 초기 데이터 로드
        await this.updateNASAData();
        await this.updateCameraColors();

        // 초기 안내 메시지
        this.showDataPopup({
            instruction: "📸 실시간 카메라 + 🛸 NASA 데이터 융합 시각화"
        }, { x: 0, y: 1, z: -2 });
    }

    /**
     * AR Pixel View 중지 및 정리
     */
    stop() {
        console.log("🛑 Stopping Enhanced AR Pixel View...");

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.cameraUpdateInterval) {
            clearInterval(this.cameraUpdateInterval);
        }
        if (this.gridEntity) {
            this.gridEntity.parentNode.removeChild(this.gridEntity);
        }
        if (this.dataPopup) {
            this.dataPopup.parentNode.removeChild(this.dataPopup);
        }
        if (this.debugPanel) {
            this.debugPanel.remove();
        }

        this.gridEntity = null;
        this.dataPopup = null;
        this.debugPanel = null;
    }

    /**
     * 픽셀 그리드 생성 (stagmate 구조 유지)
     */
    createPixelGrid() {
        this.gridEntity = document.createElement('a-entity');
        this.gridEntity.setAttribute('id', 'enhanced-pixel-grid');
        this.gridEntity.setAttribute('position', '0 0 -2.5');
        this.gridEntity.setAttribute('look-at', '#ar-camera');

        const totalWidth = this.GRID_COLS * this.PIXEL_SIZE;
        const totalHeight = this.GRID_ROWS * this.PIXEL_SIZE;
        const startX = -totalWidth / 2 + this.PIXEL_SIZE / 2;
        const startY = -totalHeight / 2 + this.PIXEL_SIZE / 2;

        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                const pixel = document.createElement('a-plane');
                const posX = startX + col * this.PIXEL_SIZE;
                const posY = startY + row * this.PIXEL_SIZE;

                pixel.setAttribute('position', `${posX} ${posY} 0`);
                pixel.setAttribute('width', this.PIXEL_SIZE * 0.92);
                pixel.setAttribute('height', this.PIXEL_SIZE * 0.92);
                pixel.setAttribute('material', 'color: #FFF; opacity: 0.3; transparent: true;');
                pixel.setAttribute('class', 'enhanced-pixel clickable');

                // 그리드 위치 저장
                pixel.dataset.row = row;
                pixel.dataset.col = col;

                this.gridEntity.appendChild(pixel);
            }
        }

        this.scene.appendChild(this.gridEntity);
        console.log(`✅ Enhanced pixel grid (${this.GRID_ROWS}x${this.GRID_COLS}) created`);
    }

    /**
     * 실제 카메라 색상 추출 (우리 코드 통합)
     */
    async updateCameraColors() {
        try {
            // extractColorFromCanvas 함수 활용
            if (window.extractColorFromCanvas) {
                const colors = window.extractColorFromCanvas(this.GRID_ROWS);

                if (colors && colors.length > 0) {
                    this.realColorGrid = colors;
                    this.updateDebugPanel(`📸 카메라 색상 추출 성공: ${colors.length}x${colors[0].length}`);

                    // 융합 데이터로 그리드 업데이트
                    this._updateFusedGrid();
                    return true;
                }
            }

            this.updateDebugPanel(`📸 카메라 색상 추출 실패 - 재시도 중...`);
            return false;

        } catch (error) {
            console.error("Camera color extraction error:", error);
            this.updateDebugPanel(`❌ 카메라 추출 에러: ${error.message}`);
            return false;
        }
    }

    /**
     * NASA 데이터 업데이트 (stagmate 방식 유지)
     */
    async updateNASAData() {
        console.log("🔄 Fetching NASA data...");
        const location = await this._getGPSLocation();

        if (!location) {
            this.updateDebugPanel("📍 GPS 위치 획득 실패");
            return;
        }

        try {
            const apiBase = window.getNASAApiEndpoint();
            const response = await fetch(
                `${apiBase}/pixel-hunt/data?lat=${location.lat}&lon=${location.lon}&resolution=30`
            );
            const data = await response.json();

            if (data && data.pixels) {
                this.dataGrid = data.pixels;
                this.updateDebugPanel(`🛸 NASA 데이터 수신: ${data.pixels.length} pixels`);

                // 융합 데이터로 그리드 업데이트
                this._updateFusedGrid();
            }
        } catch (error) {
            console.error("NASA data fetch error:", error);
            this.updateDebugPanel(`❌ NASA 데이터 에러: ${error.message}`);
        }
    }

    /**
     * 카메라 색상과 NASA 데이터 융합
     */
    _updateFusedGrid() {
        const pixels = this.gridEntity.querySelectorAll('.enhanced-pixel');

        pixels.forEach(pixel => {
            const row = parseInt(pixel.dataset.row, 10);
            const col = parseInt(pixel.dataset.col, 10);

            // 실제 카메라 색상
            let realColor = null;
            if (this.realColorGrid[row] && this.realColorGrid[row][col]) {
                realColor = this.realColorGrid[row][col];
            }

            // NASA 데이터
            const index = row * this.GRID_COLS + col;
            let nasaData = null;
            if (this.dataGrid[index]) {
                nasaData = this.dataGrid[index];
            }

            // 색상 융합 알고리즘
            const fusedColor = this._fuseColorData(realColor, nasaData);

            // 픽셀 업데이트
            pixel.setAttribute('material', `color: ${fusedColor}; opacity: 0.7; transparent: true;`);

            // 융합 데이터 저장
            pixel.dataset.fusedData = JSON.stringify({
                real: realColor,
                nasa: nasaData,
                fused: fusedColor
            });
        });

        console.log("🎨 Grid updated with fused data");
    }

    /**
     * 색상 융합 알고리즘
     */
    _fuseColorData(realColor, nasaData) {
        // 둘 다 있으면 융합
        if (realColor && nasaData) {
            // NASA 데이터 기반 가중치
            const moistureWeight = nasaData.moisture || 0.5;

            // 실제 색상과 NASA 추천 색상 혼합
            const nasaColor = this._getColorForMoisture(nasaData.moisture);
            const nasaRGB = this._hexToRgb(nasaColor);

            const fusedR = Math.floor(realColor.r * (1 - moistureWeight) + nasaRGB.r * moistureWeight);
            const fusedG = Math.floor(realColor.g * (1 - moistureWeight) + nasaRGB.g * moistureWeight);
            const fusedB = Math.floor(realColor.b * (1 - moistureWeight) + nasaRGB.b * moistureWeight);

            return `rgb(${fusedR}, ${fusedG}, ${fusedB})`;
        }

        // 실제 색상만 있으면
        if (realColor) {
            return realColor.hex || `rgb(${realColor.r}, ${realColor.g}, ${realColor.b})`;
        }

        // NASA 데이터만 있으면
        if (nasaData) {
            return this._getColorForMoisture(nasaData.moisture);
        }

        // 둘 다 없으면 기본색
        return '#CCCCCC';
    }

    /**
     * 픽셀 클릭 처리 (향상된 정보 표시)
     */
    _handlePixelClick(targetEntity) {
        const row = parseInt(targetEntity.dataset.row, 10);
        const col = parseInt(targetEntity.dataset.col, 10);

        // 융합 데이터 가져오기
        const fusedData = JSON.parse(targetEntity.dataset.fusedData || '{}');

        console.log(`🖱️ Clicked enhanced pixel (${row}, ${col})`, fusedData);

        // 위치 계산
        const position = targetEntity.getAttribute('position');
        const worldPosition = this.gridEntity.object3D.localToWorld(position.clone());

        // 향상된 팝업 표시
        this.showEnhancedDataPopup(fusedData, worldPosition, row, col);
    }

    /**
     * 향상된 데이터 팝업 표시
     */
    showEnhancedDataPopup(data, position, row, col) {
        if (!this.dataPopup) {
            this.dataPopup = document.createElement('a-entity');
            this.dataPopup.setAttribute('id', 'enhanced-data-popup');
            this.scene.appendChild(this.dataPopup);
        }

        // 팝업 위치
        this.dataPopup.setAttribute('position', `${position.x} ${position.y + 0.4} ${position.z}`);
        this.dataPopup.setAttribute('look-at', '#ar-camera');

        // 융합 데이터 텍스트 생성
        let popupContent = `픽셀 (${row}, ${col})\\n`;

        if (data.real) {
            popupContent += `📸 카메라: RGB(${data.real.r}, ${data.real.g}, ${data.real.b})\\n`;
        }

        if (data.nasa) {
            popupContent += `🛸 NASA:\\n`;
            popupContent += `  💧 수분: ${(data.nasa.moisture * 100).toFixed(1)}%\\n`;
            popupContent += `  🌿 NDVI: ${data.nasa.ndvi?.toFixed(2) || 'N/A'}\\n`;
            popupContent += `  🌡️ 온도: ${data.nasa.temperature?.toFixed(1) || 'N/A'}°C`;
        }

        this.dataPopup.innerHTML = `
            <a-rounded width="1.8" height="0.8" radius="0.05" material="color: #0042A6; opacity: 0.95;">
                <a-text
                    value="${popupContent}"
                    color="#FFFFFF"
                    width="1.5"
                    align="left"
                    position="-0.8 0.2 0.02"
                    font="kelsonsans">
                </a-text>
            </a-rounded>
        `;

        // 10초 후 사라짐
        setTimeout(() => {
            if (this.dataPopup) {
                this.dataPopup.innerHTML = '';
            }
        }, 10000);
    }

    /**
     * 디버그 패널 생성 (모바일 디버깅용)
     */
    createDebugPanel() {
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'enhanced-debug-panel';
        this.debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            right: 10px;
            background: rgba(0, 66, 166, 0.9);
            color: #EAFE07;
            font-family: monospace;
            font-size: 11px;
            padding: 8px;
            border-radius: 5px;
            z-index: 9998;
            max-height: 100px;
            overflow-y: auto;
        `;
        document.body.appendChild(this.debugPanel);
        this.updateDebugPanel("Enhanced AR Pixel View 시작됨");
    }

    /**
     * 디버그 패널 업데이트
     */
    updateDebugPanel(message) {
        if (this.debugPanel) {
            const time = new Date().toLocaleTimeString();
            this.debugPanel.innerHTML = `[${time}] ${message}<br>` + this.debugPanel.innerHTML;

            // 최대 5줄만 유지
            const lines = this.debugPanel.innerHTML.split('<br>');
            if (lines.length > 5) {
                this.debugPanel.innerHTML = lines.slice(0, 5).join('<br>');
            }
        }
    }

    /**
     * 이벤트 리스너 연결
     */
    _attachEventListeners() {
        this.scene.addEventListener('click', (event) => {
            if (event.target.classList.contains('enhanced-pixel')) {
                this._handlePixelClick(event.target);
            }
        });
    }

    /**
     * GPS 위치 획득 (stagmate 코드 유지)
     */
    _getGPSLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn("Geolocation not supported, using fallback.");
                resolve({ lat: 33.4255, lon: -111.9400 });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude
                }),
                (err) => {
                    console.warn(`GPS Error: ${err.message}`);
                    resolve({ lat: 33.4255, lon: -111.9400 });
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
            );
        });
    }

    /**
     * 수분 데이터를 색상으로 변환 (stagmate 코드)
     */
    _getColorForMoisture(moisture) {
        if (moisture > 0.4) return '#2E96F5';  // 습함 (파랑)
        if (moisture > 0.25) return '#4CAF50'; // 적정 (초록)
        if (moisture > 0.15) return '#FFC107'; // 보통 (노랑)
        return '#E43700';                      // 건조 (빨강)
    }

    /**
     * HEX 색상을 RGB로 변환
     */
    _hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 128, g: 128, b: 128 };
    }
}

// 전역 참조
window.EnhancedARPixelView = EnhancedARPixelView;