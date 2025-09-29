/**
 * MinimalWebXRAR.js - DOM 간섭 없는 최소 WebXR AR 시스템
 * 참고: https://github.com/immersive-web/dom-overlays
 * 참고: https://immersive-web.github.io/webxr-test-api/
 */
class MinimalWebXRAR {
    constructor() {
        this.isActive = false;
        this.session = null;
        this.canvas = null;
        this.gl = null;
        this.overlayElement = null;
        this.animationId = null;
        this.cleanupCallbacks = [];

        console.log('🛡️ MinimalWebXRAR: 초기화됨');
    }

    // WebXR 지원 확인
    async checkWebXRSupport() {
        if (!navigator.xr) {
            console.warn('⚠️ WebXR이 지원되지 않습니다');
            return false;
        }

        try {
            const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
            console.log(`🔍 WebXR AR 지원: ${isSupported ? '✅' : '❌'}`);
            return isSupported;
        } catch (error) {
            console.error('❌ WebXR 지원 확인 실패:', error);
            return false;
        }
    }

    // Start AR session
    async startAR() {
        try {
            console.log('🚀 MinimalWebXRAR: AR start requested');

            // WebXR 지원 확인
            const supported = await this.checkWebXRSupport();
            if (!supported) {
                throw new Error('WebXR AR이 지원되지 않습니다');
            }

            // 기존 세션 정리
            await this.cleanup();

            // DOM 오버레이 생성
            this.createDOMOverlay();

            // Request AR session
            await this.requestARSession();

            // Setup rendering
            await this.setupRendering();

            // 애니메이션 루프 시작
            this.startAnimationLoop();

            this.isActive = true;
            console.log('✅ MinimalWebXRAR: AR session activated');

            return true;

        } catch (error) {
            console.error('❌ MinimalWebXRAR: AR start failed:', error);
            await this.cleanup();

            // Fallback 모드로 시작
            return this.startFallbackMode();
        }
    }

    // DOM 오버레이 생성 (WebXR DOM Overlay 스펙 준수)
    createDOMOverlay() {
        console.log('🎨 DOM 오버레이 생성');

        // 기존 오버레이 정리
        this.removeDOMOverlay();

        // 오버레이 컨테이너 생성
        this.overlayElement = document.createElement('div');
        this.overlayElement.id = 'minimal-ar-overlay';
        this.overlayElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 99999;
            pointer-events: none;
            background: transparent;
            display: none;
        `;

        // 컨트롤 UI 추가
        this.addControlUI();

        // 데이터 UI 추가
        this.addDataUI();

        // DOM에 추가
        document.body.appendChild(this.overlayElement);

        // 클린업 콜백 등록
        this.cleanupCallbacks.push(() => {
            this.removeDOMOverlay();
        });
    }

    // 컨트롤 UI 추가
    addControlUI() {
        const controlPanel = document.createElement('div');
        controlPanel.id = 'minimal-ar-controls';
        controlPanel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            color: white;
            padding: 16px;
            border-radius: 12px;
            pointer-events: auto;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        controlPanel.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; background: #00ff88; border-radius: 50%; margin-right: 8px;"></div>
                <strong>🥽 AR Active</strong>
            </div>
            <button id="minimal-ar-exit" style="
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                border: none;
                color: white;
                padding: 10px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s ease;
                width: 100%;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                ❌ Exit AR
            </button>
        `;

        this.overlayElement.appendChild(controlPanel);

        // Exit 버튼 이벤트
        const exitButton = controlPanel.querySelector('#minimal-ar-exit');
        const exitHandler = () => {
            console.log('🔴 Exit AR 버튼 클릭됨');
            this.cleanup();
        };

        exitButton.addEventListener('click', exitHandler);
        this.cleanupCallbacks.push(() => {
            exitButton.removeEventListener('click', exitHandler);
        });
    }

    // 데이터 UI 추가
    addDataUI() {
        const dataPanel = document.createElement('div');
        dataPanel.id = 'minimal-ar-data';
        dataPanel.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            color: white;
            padding: 16px;
            border-radius: 12px;
            pointer-events: auto;
            font-family: 'Segoe UI', system-ui, sans-serif;
            max-width: 320px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        dataPanel.innerHTML = `
            <div style="margin-bottom: 12px;">
                <strong>🛰️ NASA Satellite Data</strong>
            </div>
            <div style="display: grid; gap: 8px; font-size: 14px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>💧 Soil Moisture:</span>
                    <span id="minimal-moisture" style="color: #3498db;">Loading...</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>🌱 NDVI:</span>
                    <span id="minimal-ndvi" style="color: #2ecc71;">Loading...</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>🌡️ Temperature:</span>
                    <span id="minimal-temp" style="color: #f39c12;">Loading...</span>
                </div>
            </div>
            <button id="minimal-refresh" style="
                margin-top: 12px;
                background: linear-gradient(135deg, #3498db, #2980b9);
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                width: 100%;
                transition: all 0.2s ease;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                🔄 Refresh Data
            </button>
        `;

        this.overlayElement.appendChild(dataPanel);

        // Refresh button event
        const refreshButton = dataPanel.querySelector('#minimal-refresh');
        const refreshHandler = () => {
            console.log('🔄 Data refresh requested');
            this.updateNASAData();
        };

        refreshButton.addEventListener('click', refreshHandler);
        this.cleanupCallbacks.push(() => {
            refreshButton.removeEventListener('click', refreshHandler);
        });

        // Load initial data
        setTimeout(() => {
            this.updateNASAData();
        }, 1000);
    }

    // Request AR session
    async requestARSession() {
        console.log('📱 WebXR AR session request');

        const sessionInit = {
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['hit-test', 'anchors', 'hand-tracking'],
            domOverlay: {
                root: this.overlayElement
            }
        };

        this.session = await navigator.xr.requestSession('immersive-ar', sessionInit);

        // Session event handlers
        this.session.addEventListener('end', () => {
            console.log('🛑 WebXR session ended');
            this.cleanup();
        });

        console.log('✅ WebXR AR session created');
    }

    // Setup rendering
    async setupRendering() {
        console.log('🎨 WebGL rendering setup');

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'minimal-ar-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 99998;
            background: transparent;
            pointer-events: none;
        `;

        // WebGL 컨텍스트 생성
        this.gl = this.canvas.getContext('webgl2', {
            xrCompatible: true,
            alpha: true,
            antialias: true
        });

        if (!this.gl) {
            throw new Error('WebGL2 컨텍스트 생성 실패');
        }

        await this.gl.makeXRCompatible();

        // WebXR 레이어 설정
        const layer = new XRWebGLLayer(this.session, this.gl);
        await this.session.updateRenderState({
            baseLayer: layer
        });

        // 캔버스를 DOM에 추가
        document.body.appendChild(this.canvas);

        // 클린업 콜백 등록
        this.cleanupCallbacks.push(() => {
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        });

        console.log('✅ WebGL 렌더링 설정 완료');
    }

    // 애니메이션 루프 시작
    startAnimationLoop() {
        const animate = (time, frame) => {
            if (!this.session) return;

            // 다음 프레임 요청
            this.animationId = this.session.requestAnimationFrame(animate);

            // 프레임 렌더링
            this.renderFrame(frame);
        };

        this.animationId = this.session.requestAnimationFrame(animate);
        console.log('🎬 애니메이션 루프 시작됨');
    }

    // 프레임 렌더링
    renderFrame(frame) {
        if (!frame || !this.gl) return;

        const session = frame.session;
        const layer = session.renderState.baseLayer;

        // 뷰포트 설정
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, layer.framebuffer);
        this.gl.viewport(0, 0, layer.framebufferWidth, layer.framebufferHeight);

        // 화면 클리어 (투명 배경)
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // 여기에 실제 AR 콘텐츠 렌더링 로직 추가
        // 현재는 최소 구현으로 투명 배경만 유지
    }

    // Fallback 모드 (WebXR 미지원 시)
    async startFallbackMode() {
        console.log('📱 Fallback 모드로 시작');

        try {
            // DOM 오버레이만 표시
            this.createDOMOverlay();
            this.overlayElement.style.display = 'block';

            // 카메라 스트림 요청
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // 비디오 요소 생성
            const video = document.createElement('video');
            video.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                object-fit: cover;
                z-index: 99997;
            `;
            video.srcObject = stream;
            video.autoplay = true;
            video.playsInline = true;
            video.muted = true;

            document.body.appendChild(video);

            // 클린업 콜백 등록
            this.cleanupCallbacks.push(() => {
                stream.getTracks().forEach(track => track.stop());
                if (video.parentNode) {
                    video.parentNode.removeChild(video);
                }
            });

            this.isActive = true;
            console.log('✅ Fallback 모드 활성화됨');
            return true;

        } catch (error) {
            console.error('❌ Fallback 모드 실패:', error);
            return false;
        }
    }

    // Update NASA data
    async updateNASAData() {
        try {
            console.log('📡 NASA data update started');

            // Get current location (or use default values)
            const lat = 37.5674;
            const lon = 127.1873;

            // Request NASA data
            const [soilData, ndviData] = await Promise.all([
                fetch(`http://localhost:3001/api/smap/soil-moisture?lat=${lat}&lon=${lon}`)
                    .then(r => r.json())
                    .catch(() => ({ surface_moisture: 0.25 })),
                fetch(`http://localhost:3001/api/modis/ndvi?lat=${lat}&lon=${lon}`)
                    .then(r => r.json())
                    .catch(() => ({ ndvi: 0.65, temperature: 22.5 }))
            ]);

            // Update UI
            const moistureEl = document.getElementById('minimal-moisture');
            const ndviEl = document.getElementById('minimal-ndvi');
            const tempEl = document.getElementById('minimal-temp');

            if (moistureEl && soilData.surface_moisture !== undefined) {
                moistureEl.textContent = `${(soilData.surface_moisture * 100).toFixed(1)}%`;
            }

            if (ndviEl && ndviData.ndvi !== undefined) {
                ndviEl.textContent = ndviData.ndvi.toFixed(3);
            }

            if (tempEl && ndviData.temperature !== undefined) {
                tempEl.textContent = `${ndviData.temperature.toFixed(1)}°C`;
            }

            console.log('✅ NASA data update complete');

        } catch (error) {
            console.error('❌ NASA data update failed:', error);

            // Show default values on error
            const moistureEl = document.getElementById('minimal-moisture');
            const ndviEl = document.getElementById('minimal-ndvi');
            const tempEl = document.getElementById('minimal-temp');

            if (moistureEl) moistureEl.textContent = 'Offline';
            if (ndviEl) ndviEl.textContent = 'Offline';
            if (tempEl) tempEl.textContent = 'Offline';
        }
    }

    // Remove DOM overlay
    removeDOMOverlay() {
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
            this.overlayElement = null;
        }
    }

    // Stop AR session
    async stopAR() {
        console.log('🛑 AR session stop requested');

        if (this.session) {
            try {
                await this.session.end();
            } catch (error) {
                console.warn('⚠️ Warning during AR session stop:', error);
            }
        }

        this.cleanup();
    }

    // Safe cleanup
    async cleanup() {
        if (!this.isActive && !this.session) return;

        console.log('🧹 MinimalWebXRAR: Cleanup started');

        // Stop animation loop
        if (this.animationId && this.session) {
            this.session.cancelAnimationFrame(this.animationId);
        }

        // Execute cleanup callbacks
        this.cleanupCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.warn('⚠️ Cleanup callback execution failed:', error);
            }
        });

        // Reset state
        this.isActive = false;
        this.session = null;
        this.canvas = null;
        this.gl = null;
        this.overlayElement = null;
        this.animationId = null;
        this.cleanupCallbacks = [];

        console.log('✅ MinimalWebXRAR: 정리 완료');
    }

    // 상태 확인
    getStatus() {
        return {
            isActive: this.isActive,
            hasSession: !!this.session,
            hasCanvas: !!this.canvas,
            hasOverlay: !!this.overlayElement
        };
    }
}

// 전역 접근 가능하도록 설정
if (typeof window !== 'undefined') {
    window.MinimalWebXRAR = MinimalWebXRAR;
}

// 모듈 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MinimalWebXRAR;
}