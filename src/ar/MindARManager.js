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
        // Load Three.js if not available
        if (typeof THREE === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        }

        // Load MindAR if not available
        if (typeof window.MINDAR === 'undefined') {
            await this.loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js');
            await this.loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js');
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

        // 실제 MindAR 설정 - 간단한 타겟 이미지 사용
        this.mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: container,
            uiLoading: "no",
            uiScanning: "no",
            imageTargetSrc: 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind',
            maxTrack: 1,
            filterMinCF: 0.0001,
            filterBeta: 1000,
            warmupTolerance: 5,
            missTolerance: 5
        });

        const {renderer, scene, camera} = this.mindarThree;
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // 조명 추가
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        light.position.set(0.5, 1, 0.25);
        scene.add(light);

        // NASA 데이터 오버레이 생성
        this.createDataOverlays();

        // MindAR 시작
        await this.mindarThree.start();
        this.isRunning = true;

        // 렌더링 루프
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });
    }

    createDataOverlays() {
        // NASA 데이터 그룹
        this.nasaDataGroup = new THREE.Group();
        this.nasaDataGroup.position.set(0, 0.5, -2);
        this.scene.add(this.nasaDataGroup);

        // 배경 패널
        const panelGeometry = new THREE.PlaneGeometry(1.5, 0.8);
        const panelMaterial = new THREE.MeshBasicMaterial({
            color: 0x07173F,
            transparent: true,
            opacity: 0.8
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        this.nasaDataGroup.add(panel);

        // AI 분석 그룹
        this.aiAnalysisGroup = new THREE.Group();
        this.aiAnalysisGroup.position.set(0, -0.5, -2);
        this.scene.add(this.aiAnalysisGroup);

        const aiPanelGeometry = new THREE.PlaneGeometry(1.5, 0.6);
        const aiPanelMaterial = new THREE.MeshBasicMaterial({
            color: 0x0960E1,
            transparent: true,
            opacity: 0.8
        });
        const aiPanel = new THREE.Mesh(aiPanelGeometry, aiPanelMaterial);
        this.aiAnalysisGroup.add(aiPanel);

        // 크로스헤어
        const ringGeometry = new THREE.RingGeometry(0.05, 0.08, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xEAFE07,
            transparent: true,
            opacity: 0.8
        });
        const crosshair = new THREE.Mesh(ringGeometry, ringMaterial);
        crosshair.position.set(0, 0, -1);
        this.scene.add(crosshair);

        // 회전 애니메이션
        const animate = () => {
            if (this.isRunning) {
                crosshair.rotation.z += 0.02;
                requestAnimationFrame(animate);
            }
        };
        animate();
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