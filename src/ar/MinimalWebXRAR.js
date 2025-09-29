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

            // 모바일 환경 확인 및 최적화
            await this.prepareMobileEnvironment();

            // HTTPS 확인
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                console.warn('⚠️ WebXR requires HTTPS');
                return this.startFallbackMode('HTTPS required for WebXR');
            }

            // WebXR 지원 확인
            const supported = await this.checkWebXRSupport();
            if (!supported) {
                console.warn('⚠️ WebXR not supported, using fallback');
                return this.startFallbackMode('WebXR not supported');
            }

            // 기존 세션 정리
            await this.cleanup();

            // DOM 오버레이 생성
            this.createDOMOverlay();

            // Request AR session with user gesture
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
            return this.startFallbackMode(error.message);
        }
    }

    // 모바일 환경 최적화
    async prepareMobileEnvironment() {
        console.log('📱 Preparing mobile environment for AR');

        // 화면 회전 요청 (가로모드)
        try {
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape');
                console.log('🔄 Screen locked to landscape');
            } else if (screen.lockOrientation) {
                screen.lockOrientation('landscape');
                console.log('🔄 Screen locked to landscape (fallback)');
            }
        } catch (error) {
            console.warn('⚠️ Could not lock screen orientation:', error.message);

            // CSS로 회전 권장 메시지 표시
            this.showOrientationGuide();
        }

        // 모바일 브라우저 최적화
        if (this.isMobile()) {
            // 줌 비활성화
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }

            // 터치 이벤트 최적화
            document.body.style.touchAction = 'manipulation';
        }
    }

    // 모바일 디바이스 감지
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    // 화면 회전 가이드 표시
    showOrientationGuide() {
        const guide = document.createElement('div');
        guide.id = 'ar-orientation-guide';
        guide.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(46, 150, 245, 0.95);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 99999;
            font-size: 16px;
            max-width: 300px;
        `;
        guide.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">📱➡️📱</div>
            <div style="font-weight: bold; margin-bottom: 10px;">Better AR Experience</div>
            <div style="margin-bottom: 15px;">Please rotate your device to landscape mode for optimal AR experience</div>
            <button onclick="this.parentElement.remove()" style="
                background: white;
                color: #2E96F5;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">Continue</button>
        `;

        document.body.appendChild(guide);

        // 자동 제거
        setTimeout(() => {
            if (guide.parentNode) {
                guide.remove();
            }
        }, 8000);
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
    async startFallbackMode(reason = 'Unknown') {
        console.log('📱 Fallback 모드로 시작:', reason);

        try {
            // 모바일 환경 최적화 (화면 회전 등)
            await this.prepareMobileEnvironment();

            // DOM 오버레이 생성 및 표시
            this.createDOMOverlay();
            this.overlayElement.style.display = 'block';

            // 카메라 접근 권한 요청 및 스트림 시작
            await this.startCameraStream();

            // NASA 데이터 주기적 업데이트 시작
            this.startDataUpdateLoop();

            this.isActive = true;
            console.log('✅ Fallback AR 모드 활성화됨');

            // 사용자에게 Fallback 모드 알림
            this.showFallbackNotification(reason);

            return true;

        } catch (error) {
            console.error('❌ Fallback 모드 실패:', error);

            // 카메라 실패시 정적 AR 인터페이스 표시
            return this.startStaticARInterface(error.message);
        }
    }

    // 카메라 스트림 시작
    async startCameraStream() {
        try {
            console.log('📷 Starting camera stream...');

            const constraints = {
                video: {
                    facingMode: 'environment', // 후면 카메라 사용
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // 비디오 요소 생성
            const video = document.createElement('video');
            video.id = 'ar-camera-stream';
            video.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                object-fit: cover;
                z-index: 99997;
                background: #000;
            `;
            video.srcObject = stream;
            video.autoplay = true;
            video.playsInline = true;
            video.muted = true;

            // 비디오 로드 이벤트
            video.addEventListener('loadedmetadata', () => {
                console.log('📹 Camera stream loaded:', video.videoWidth, 'x', video.videoHeight);
            });

            document.body.appendChild(video);

            // 클린업 콜백 등록
            this.cleanupCallbacks.push(() => {
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('📷 Camera track stopped');
                });
                if (video.parentNode) {
                    video.parentNode.removeChild(video);
                }
            });

            console.log('✅ Camera stream started successfully');

        } catch (error) {
            console.error('❌ Camera stream failed:', error);
            throw new Error(`Camera access failed: ${error.message}`);
        }
    }

    // 정적 AR 인터페이스 (카메라 없이)
    async startStaticARInterface(reason) {
        console.log('🖼️ Starting static AR interface:', reason);

        try {
            // DOM 오버레이 생성
            this.createDOMOverlay();
            this.overlayElement.style.display = 'block';

            // 정적 배경 이미지 또는 그라디언트
            const background = document.createElement('div');
            background.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                z-index: 99997;
            `;

            // AR 시뮬레이션 오버레이
            const arSimulation = document.createElement('div');
            arSimulation.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(46, 150, 245, 0.1);
                border: 2px dashed #2E96F5;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                color: white;
                font-size: 18px;
                z-index: 99999;
                backdrop-filter: blur(10px);
            `;
            arSimulation.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 20px;">🌾📡</div>
                <div style="font-weight: bold; margin-bottom: 15px;">AR Field Analysis</div>
                <div style="margin-bottom: 20px; opacity: 0.8;">${reason}</div>
                <div style="font-size: 14px; opacity: 0.6;">Using satellite data simulation mode</div>
            `;

            document.body.appendChild(background);
            document.body.appendChild(arSimulation);

            // NASA 데이터 업데이트 시작
            this.startDataUpdateLoop();

            // 클린업 콜백
            this.cleanupCallbacks.push(() => {
                if (background.parentNode) background.parentNode.removeChild(background);
                if (arSimulation.parentNode) arSimulation.parentNode.removeChild(arSimulation);
            });

            this.isActive = true;
            console.log('✅ Static AR interface activated');
            return true;

        } catch (error) {
            console.error('❌ Static AR interface failed:', error);
            return false;
        }
    }

    // Fallback 모드 알림
    showFallbackNotification(reason) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 152, 0, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 99999;
            text-align: center;
            max-width: 90%;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        `;
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">📱 AR Simulation Mode</div>
            <div style="font-size: 12px; opacity: 0.9;">${reason}</div>
        `;

        document.body.appendChild(notification);

        // 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // 데이터 업데이트 루프 시작
    startDataUpdateLoop() {
        // 즉시 한번 업데이트
        this.updateNASAData();

        // 5초마다 업데이트
        this.dataUpdateInterval = setInterval(() => {
            this.updateNASAData();
        }, 5000);

        // 클린업 콜백 등록
        this.cleanupCallbacks.push(() => {
            if (this.dataUpdateInterval) {
                clearInterval(this.dataUpdateInterval);
                this.dataUpdateInterval = null;
            }
        });
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