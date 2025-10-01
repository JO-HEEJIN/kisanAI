/**
 * MindAR Implementation for NASA Farm Navigator
 * Better iOS compatibility than AR.js/WebXR
 */

class MindARManager {
    constructor() {
        this.mindarThree = null;
        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.isRunning = false;
        this.nasaDataGroup = null;
        this.aiAnalysisGroup = null;
    }

    async initialize() {
        try {
            console.log('🎯 Initializing MindAR...');

            // Load required scripts
            await this.loadRequiredScripts();

            // Check if MindAR is loaded
            if (typeof window.MindARThree === 'undefined') {
                throw new Error('MindARThree not loaded. Check script tags.');
            }

            console.log('✅ MindARThree library loaded');

            // Create AR container
            this.createARContainer();

            // Initialize MindAR with Three.js
            await this.setupMindAR();

            console.log('✅ MindAR initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ MindAR initialization failed:', error);
            return false;
        }
    }

    async loadRequiredScripts() {
        console.log('🔍 Checking script dependencies...');

        // Check Three.js
        if (typeof THREE === 'undefined') {
            console.log('📦 Loading Three.js...');
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        } else {
            console.log('✅ Three.js already loaded');
        }

        // Check existing global variables
        console.log('🔍 Global objects check:');
        console.log('- window.MINDAR:', typeof window.MINDAR);
        console.log('- window.MindARThree:', typeof window.MindARThree);

        // Load MindAR if not available
        if (typeof window.MindARThree === 'undefined') {
            console.log('📦 Loading MindAR scripts...');

            try {
                await this.loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js');
                console.log('✅ mindar-image.prod.js loaded');

                await this.loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js');
                console.log('✅ mindar-image-three.prod.js loaded');

                // Wait for scripts to initialize
                console.log('⏳ Waiting for MindAR initialization...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Check again
                console.log('🔍 After loading - window.MindARThree:', typeof window.MindARThree);
                console.log('🔍 After loading - window.MINDAR:', typeof window.MINDAR);

            } catch (error) {
                console.error('❌ Failed to load MindAR scripts:', error);
                throw error;
            }
        } else {
            console.log('✅ MindAR already loaded');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    createARContainer() {
        // Remove existing container if any
        const existing = document.getElementById('mindar-container');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.id = 'mindar-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10000;
            background: black;
        `;
        document.body.appendChild(container);
        return container;
    }

    async setupMindAR() {
        const container = document.getElementById('mindar-container');

        // 공식 MindAR Three.js 예제 방식 사용
        this.mindarThree = new window.MindARThree({
            container: container,
            imageTargetSrc: "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind"
        });

        const {renderer, scene, camera} = this.mindarThree;
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // Anchor 추가 (공식 예제 방식)
        const anchor = this.mindarThree.addAnchor(0);

        // 기본 평면 추가 (공식 예제와 동일)
        const geometry = new THREE.PlaneGeometry(1, 0.55);
        const material = new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.5});
        const plane = new THREE.Mesh(geometry, material);
        anchor.group.add(plane);

        // NASA 데이터 표시용 추가 객체들
        this.createARObjects(anchor);

        // MindAR 시작
        await this.mindarThree.start();
        this.isRunning = true;

        // 렌더링 루프
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });
    }

    createARObjects(anchor) {
        // NASA 데이터 패널 (앵커에 부착)
        const nasaPanelGeometry = new THREE.PlaneGeometry(0.8, 0.4);
        const nasaPanelMaterial = new THREE.MeshBasicMaterial({
            color: 0x07173F,
            transparent: true,
            opacity: 0.8
        });
        const nasaPanel = new THREE.Mesh(nasaPanelGeometry, nasaPanelMaterial);
        nasaPanel.position.set(0, 0.3, 0.1);
        anchor.group.add(nasaPanel);

        // AI 분석 패널 (앵커에 부착)
        const aiPanelGeometry = new THREE.PlaneGeometry(0.8, 0.3);
        const aiPanelMaterial = new THREE.MeshBasicMaterial({
            color: 0x0960E1,
            transparent: true,
            opacity: 0.8
        });
        const aiPanel = new THREE.Mesh(aiPanelGeometry, aiPanelMaterial);
        aiPanel.position.set(0, -0.2, 0.1);
        anchor.group.add(aiPanel);

        // 농업 아이콘 (앵커에 부착)
        const iconGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        const iconMaterial = new THREE.MeshBasicMaterial({
            color: 0xEAFE07
        });
        const icon = new THREE.Mesh(iconGeometry, iconMaterial);
        icon.position.set(0, 0, 0.2);
        anchor.group.add(icon);

        // 회전 애니메이션
        const animate = () => {
            if (this.isRunning) {
                icon.rotation.y += 0.02;
                requestAnimationFrame(animate);
            }
        };
        animate();

        this.nasaPanel = nasaPanel;
        this.aiPanel = aiPanel;
        this.icon = icon;
    }

    updateNASAData(data) {
        // NASA 데이터 업데이트 (HTML 오버레이로 처리)
        console.log('📡 Updating NASA data in MindAR:', data);
    }

    stop() {
        if (this.mindarThree) {
            this.mindarThree.stop();
            this.mindarThree = null;
        }

        this.isRunning = false;

        const container = document.getElementById('mindar-container');
        if (container) container.remove();

        console.log('🛑 MindAR stopped');
    }
}

// 전역 사용 가능하도록 설정
window.MindARManager = MindARManager;