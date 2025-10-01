/**
 * MindAR NASA Data Overlay System
 * HTML overlays for displaying NASA satellite data in AR view
 */

class MindARNASAOverlay {
    constructor() {
        this.container = null;
        this.nasaPanel = null;
        this.aiPanel = null;
        this.controlPanel = null;
    }

    create() {
        // Create overlay container
        this.container = document.createElement('div');
        this.container.id = 'mindar-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;

        // Create NASA data panel
        this.createNASAPanel();

        // Create AI analysis panel
        this.createAIPanel();

        // Create control panel
        this.createControlPanel();

        document.body.appendChild(this.container);
    }

    createNASAPanel() {
        this.nasaPanel = document.createElement('div');
        this.nasaPanel.className = 'nasa-data-panel';
        this.nasaPanel.style.cssText = `
            position: absolute;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(7, 23, 63, 0.95), rgba(46, 150, 245, 0.9));
            color: white;
            padding: 20px;
            border-radius: 15px;
            min-width: 280px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(234, 254, 7, 0.5);
        `;

        this.nasaPanel.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #EAFE07; text-align: center; font-size: 18px;">
                📡 NASA Satellite Data
            </h3>
            <div class="data-grid" style="display: grid; gap: 10px;">
                <div class="data-item" style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <span>💧 Soil Moisture</span>
                    <strong id="nasa-moisture">--</strong>
                </div>
                <div class="data-item" style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <span>🌿 NDVI</span>
                    <strong id="nasa-ndvi">--</strong>
                </div>
                <div class="data-item" style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <span>🌡️ Temperature</span>
                    <strong id="nasa-temp">--</strong>
                </div>
                <div class="data-item" style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <span>📍 Location</span>
                    <strong id="nasa-location">--</strong>
                </div>
            </div>
        `;

        this.container.appendChild(this.nasaPanel);
    }

    createAIPanel() {
        this.aiPanel = document.createElement('div');
        this.aiPanel.className = 'ai-analysis-panel';
        this.aiPanel.style.cssText = `
            position: absolute;
            bottom: 140px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(9, 96, 225, 0.95), rgba(234, 254, 7, 0.9));
            color: white;
            padding: 20px;
            border-radius: 15px;
            min-width: 280px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.3);
        `;

        this.aiPanel.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #07173F; text-align: center; font-size: 18px;">
                🤖 AI Soil Analysis
            </h3>
            <div class="data-grid" style="display: grid; gap: 10px;">
                <div class="data-item" style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                    <span>🌱 Crop Type</span>
                    <strong id="ai-crop">--</strong>
                </div>
                <div class="data-item" style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                    <span>❤️ Health</span>
                    <strong id="ai-health">--</strong>
                </div>
                <div class="data-item" style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                    <span>💡 Recommendation</span>
                    <strong id="ai-recommendation" style="font-size: 12px;">--</strong>
                </div>
            </div>
        `;

        this.container.appendChild(this.aiPanel);
    }

    createControlPanel() {
        this.controlPanel = document.createElement('div');
        this.controlPanel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(228, 55, 0, 0.95);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            pointer-events: auto;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;
        this.controlPanel.innerHTML = '✕ Exit AR';
        this.controlPanel.onclick = () => window.stopARScene();

        this.controlPanel.onmouseover = () => {
            this.controlPanel.style.transform = 'scale(1.05)';
        };
        this.controlPanel.onmouseout = () => {
            this.controlPanel.style.transform = 'scale(1)';
        };

        this.container.appendChild(this.controlPanel);
    }

    updateNASAData(data) {
        if (!data) return;

        const updates = {
            'nasa-moisture': data.moisture ? `${data.moisture.toFixed(1)}%` : '--',
            'nasa-ndvi': data.ndvi ? data.ndvi.toFixed(3) : '--',
            'nasa-temp': data.temperature ? `${data.temperature.toFixed(1)}°C` : '--',
            'nasa-location': data.location || 'GPS Acquiring...'
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updateAIAnalysis(data) {
        if (!data) return;

        const cropType = data.cropType || data.type || '--';
        const health = data.health ? `${data.health}%` : '--';
        const recommendation = this.getRecommendation(data);

        const updates = {
            'ai-crop': cropType,
            'ai-health': health,
            'ai-recommendation': recommendation
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    getRecommendation(data) {
        if (!data || !data.health) return 'Analyzing...';

        const health = parseFloat(data.health);
        if (health > 80) return 'Excellent condition';
        if (health > 60) return 'Monitor moisture';
        if (health > 40) return 'Irrigation needed';
        return 'Immediate attention';
    }

    remove() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

// 전역 사용 가능하도록 설정
window.MindARNASAOverlay = MindARNASAOverlay;