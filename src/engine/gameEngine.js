class GameEngine {
    constructor() {
        this.state = {
            currentWeek: 1,
            maxWeeks: 20,
            waterBudget: 1000,
            fertilizerBudget: 500,
            sustainabilityScore: 0,
            gameMode: 'tutorial',
            selectedTool: 'inspect',
            isPaused: false
        };

        this.listeners = new Map();
        this.currentScenario = null;
        this.farmSimulation = null;
        this.nasaDataService = null;

        this.init();
    }

    init() {
        console.log('Initializing TerraData Game Engine...');
        this.bindEvents();
        this.loadGameData();
        this.startTutorial();
    }

    bindEvents() {
        document.getElementById('advance-week').addEventListener('click', () => this.advanceWeek());
        document.getElementById('pause-game').addEventListener('click', () => this.togglePause());
        document.getElementById('data-tablet-btn').addEventListener('click', () => this.toggleDataTablet());

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTool(e.target.dataset.tool));
        });
    }

    loadGameData() {
        this.farmData = {
            location: { lat: 33.4484, lng: -112.0740 }, // Phoenix, AZ
            soilType: 'sandy-loam',
            cropType: 'corn',
            fieldSize: 100, // acres
            zones: this.generateFieldZones()
        };

        this.updateUI();
    }

    generateFieldZones() {
        const zones = [];
        const gridSize = 10;

        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                zones.push({
                    id: `zone_${x}_${y}`,
                    x: x * 80,
                    y: y * 60,
                    width: 80,
                    height: 60,
                    ndvi: 0.3 + Math.random() * 0.4, // Random initial NDVI 0.3-0.7
                    soilMoisture: 0.2 + Math.random() * 0.3, // Random moisture 0.2-0.5
                    hasIrrigation: false,
                    hasFertilizer: false,
                    stressLevel: 'none'
                });
            }
        }

        return zones;
    }

    selectTool(toolName) {
        console.log('Tool selected:', toolName); // Debug log
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${toolName}"]`).classList.add('active');
        this.state.selectedTool = toolName;

        // Show feedback for fertilize tool
        if (toolName === 'fertilize') {
            console.log('Fertilize tool selected - budget:', this.state.fertilizerBudget);
            this.showDrVegaMessage(`Fertilize tool selected! You have ${this.state.fertilizerBudget}kg of fertilizer. Drag to select zones to apply nitrogen fertilizer (10kg per zone).`);
        }

        this.emit('toolChanged', { tool: toolName });
    }

    advanceWeek() {
        if (this.state.isPaused) return;

        this.state.currentWeek++;

        if (this.farmSimulation) {
            this.farmSimulation.processWeeklyUpdate();
        }

        this.updateFarmData();
        this.updateUI();
        this.checkScenarioObjectives();

        this.emit('weekAdvanced', { week: this.state.currentWeek });
    }

    updateFarmData() {
        this.farmData.zones.forEach(zone => {
            // Handle irrigation effects
            if (zone.hasIrrigation) {
                zone.soilMoisture = Math.min(1.0, zone.soilMoisture + 0.3);
                zone.ndvi = Math.min(1.0, zone.ndvi + 0.1);
                zone.hasIrrigation = false;
            } else {
                zone.soilMoisture = Math.max(0.1, zone.soilMoisture - 0.1);
                if (zone.soilMoisture < 0.3) {
                    zone.ndvi = Math.max(0.2, zone.ndvi - 0.05);
                    zone.stressLevel = zone.soilMoisture < 0.2 ? 'high' : 'moderate';
                } else {
                    zone.stressLevel = 'none';
                }
            }

            // Handle fertilizer effects over time
            if (zone.hasFertilizer) {
                const weeksSinceFertilizer = this.state.currentWeek - (zone.fertilizerAppliedWeek || 0);

                if (weeksSinceFertilizer <= 2) {
                    // First 2 weeks - strong effect
                    zone.ndvi = Math.min(1.0, zone.ndvi + 0.02);
                } else if (weeksSinceFertilizer <= 4) {
                    // Weeks 3-4 - moderate effect
                    zone.ndvi = Math.min(1.0, zone.ndvi + 0.01);
                } else if (weeksSinceFertilizer > 6) {
                    // After 6 weeks, fertilizer effect wears off
                    zone.hasFertilizer = false;
                    delete zone.fertilizerAppliedWeek;
                }
            }
        });
    }

    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        const btn = document.getElementById('pause-game');
        btn.textContent = this.state.isPaused ? 'Resume' : 'Pause';

        this.emit('gameStateChanged', { paused: this.state.isPaused });
    }

    toggleDataTablet() {
        const tablet = document.getElementById('data-tablet');
        const isHidden = tablet.classList.contains('hidden');

        if (isHidden) {
            tablet.classList.remove('hidden');
            this.emit('dataTabletOpened');
        } else {
            tablet.classList.add('hidden');
            this.emit('dataTabletClosed');
        }
    }

    updateUI() {
        document.getElementById('week-counter').textContent = `Week ${this.state.currentWeek}`;
        document.getElementById('water-budget').textContent = `Water: ${this.state.waterBudget}L`;
        document.getElementById('sustainability-score').textContent = `Sustainability: ${Math.round(this.state.sustainabilityScore)}`;

        // Update fertilizer display if it exists
        const fertilizerDisplay = document.getElementById('fertilizer-budget');
        if (fertilizerDisplay) {
            fertilizerDisplay.textContent = `Fertilizer: ${this.state.fertilizerBudget}kg`;
        }

        // Update game objectives progress
        this.updateProgressDisplay();
    }

    updateProgressDisplay() {
        const healthyCropsSpan = document.getElementById('healthy-crops');
        const waterUsedSpan = document.getElementById('water-used');
        const sustainabilitySpan = document.getElementById('sustainability');

        if (healthyCropsSpan && waterUsedSpan && sustainabilitySpan) {
            const healthyZones = this.farmData.zones.filter(z => z.ndvi > 0.5).length;
            const healthyPercentage = Math.round((healthyZones / this.farmData.zones.length) * 100);
            const waterUsed = 1000 - this.state.waterBudget;

            healthyCropsSpan.textContent = `${healthyPercentage}%`;
            healthyCropsSpan.style.color = healthyPercentage >= 60 ? '#4CAF50' : '#FF5722';

            waterUsedSpan.textContent = `${waterUsed}L / 1000L`;
            waterUsedSpan.style.color = waterUsed <= 800 ? '#4CAF50' : waterUsed <= 950 ? '#FF9800' : '#FF5722';

            sustainabilitySpan.textContent = Math.round(this.state.sustainabilityScore);
            sustainabilitySpan.style.color = this.state.sustainabilityScore >= 70 ? '#4CAF50' : '#FF9800';

            // Show win/lose status
            if (this.state.currentWeek >= 20) {
                this.checkGameEnd(healthyPercentage, waterUsed);
            }
        }
    }

    checkGameEnd(healthyPercentage, waterUsed) {
        const success = healthyPercentage >= 60 && waterUsed <= 1000 && this.state.sustainabilityScore >= 50;

        if (success) {
            this.showDrVegaMessage(`VICTORY! You saved your farm! Final Stats: ${healthyPercentage}% healthy crops, ${waterUsed}L water used, ${Math.round(this.state.sustainabilityScore)} sustainability score. You're a precision agriculture expert!`);
        } else {
            let failReason = '';
            if (healthyPercentage < 60) failReason += `Only ${healthyPercentage}% crops survived (need 60%). `;
            if (waterUsed > 1000) failReason += `Used ${waterUsed}L water (budget was 1000L). `;
            if (this.state.sustainabilityScore < 50) failReason += `Sustainability too low (${Math.round(this.state.sustainabilityScore)}). `;

            this.showDrVegaMessage(`Farm Failed! ${failReason}Try again with better water management and precision agriculture!`);
        }
    }

    startTutorial() {
        this.currentScenario = {
            name: 'Arizona Farm Crisis: Water Emergency',
            description: 'Phoenix is facing severe drought. Your farm needs to survive 20 weeks while conserving water and maintaining crop yield.',
            objectives: [
                'GOAL: Keep at least 60% of your crops healthy (NDVI > 0.5)',
                'CHALLENGE: Don\'t exceed your water budget (1000L total)',
                'BONUS: Use fertilizer wisely on struggling zones only',
                'TARGET: Achieve sustainability score > 70'
            ],
            currentObjective: 0,
            isComplete: false,
            weeklyTargets: {
                healthyCrops: 60, // 60% of zones should have NDVI > 0.5
                waterUsed: 0,
                maxWater: 1000,
                targetSustainability: 70
            }
        };

        this.showGameObjectives();
        this.showDrVegaMessage("CRISIS ALERT! Arizona drought threatens your farm. Use NASA satellite data to make smart decisions. Your goal: Keep 60% of crops healthy while conserving water. Ready to save your farm?");
    }

    showGameObjectives() {
        const objectives = document.createElement('div');
        objectives.id = 'game-objectives';
        objectives.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #2E7D32, #4CAF50);
            color: white;
            padding: 15px;
            border-radius: 10px;
            max-width: 300px;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999;
        `;

        objectives.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #FFF;">${this.currentScenario.name}</h3>
            <p style="margin: 0 0 10px 0; font-size: 12px; opacity: 0.9;">${this.currentScenario.description}</p>
            ${this.currentScenario.objectives.map(obj => `<div style="margin: 5px 0;">${obj}</div>`).join('')}
            <hr style="margin: 10px 0; border: 1px solid rgba(255,255,255,0.3);">
            <div id="progress-display">
                <div>Week: ${this.state.currentWeek}/20</div>
                <div>Healthy Crops: <span id="healthy-crops">0%</span></div>
                <div>Water Used: <span id="water-used">${1000 - this.state.waterBudget}L / 1000L</span></div>
                <div>Sustainability: <span id="sustainability">${Math.round(this.state.sustainabilityScore)}</span></div>
            </div>
        `;

        document.body.appendChild(objectives);
    }

    showDrVegaMessage(message, callback = null) {
        const panel = document.getElementById('dr-vega-panel');
        const text = document.getElementById('vega-text');
        const continueBtn = document.getElementById('vega-continue');

        text.textContent = message;
        panel.classList.remove('hidden');

        continueBtn.onclick = () => {
            panel.classList.add('hidden');
            if (callback) callback();
        };
    }

    checkScenarioObjectives() {
        if (!this.currentScenario || this.currentScenario.isComplete) return;

        const stressedZones = this.farmData.zones.filter(z => z.stressLevel !== 'none');
        const irrigatedThisWeek = this.farmData.zones.filter(z => z.hasIrrigation).length;

        if (this.currentScenario.currentObjective === 0 && irrigatedThisWeek > 0) {
            this.currentScenario.currentObjective++;
            this.showDrVegaMessage("Excellent! You've applied precision irrigation. Notice how your water usage stayed low while improving crop health!");
        }

        if (this.state.sustainabilityScore > 50 && !this.currentScenario.isComplete) {
            this.currentScenario.isComplete = true;
            this.showDrVegaMessage("Congratulations! You've completed the tutorial and learned the basics of data-driven farming!");
        }
    }

    applyIrrigationToZone(zone) {
        if (this.state.waterBudget >= 25) {
            zone.hasIrrigation = true;
            this.state.waterBudget -= 25;
            this.state.sustainabilityScore += 5; // Precision irrigation is sustainable
            this.updateUI();

            this.emit('irrigationApplied', { zone: zone });
            return true;
        }
        return false;
    }

    applyFertilizerToZone(zone) {
        const fertilizerCost = 10; // 10kg per zone

        if (this.state.fertilizerBudget >= fertilizerCost) {
            zone.hasFertilizer = true;
            zone.fertilizerAppliedWeek = this.state.currentWeek;
            this.state.fertilizerBudget -= fertilizerCost;

            // Fertilizer improves NDVI immediately
            zone.ndvi = Math.min(1.0, zone.ndvi + 0.15);

            // Slight sustainability penalty for chemical fertilizer, but less if used sparingly
            if (zone.ndvi < 0.4) {
                // Good use of fertilizer on struggling crops
                this.state.sustainabilityScore += 3;
            } else {
                // Overuse of fertilizer
                this.state.sustainabilityScore -= 1;
            }

            this.updateUI();
            this.emit('fertilizerApplied', { zone: zone });
            return true;
        }
        return false;
    }

    getStressedZones() {
        return this.farmData.zones.filter(zone => zone.stressLevel !== 'none');
    }

    calculateSustainabilityScore() {
        let score = 0;
        const totalZones = this.farmData.zones.length;
        const healthyZones = this.farmData.zones.filter(z => z.ndvi > 0.6).length;
        const waterEfficiency = Math.max(0, 1000 - this.state.waterBudget) / 1000;

        score += (healthyZones / totalZones) * 50; // Crop health component
        score += (1 - waterEfficiency) * 30; // Water conservation component
        score += Math.min(20, this.state.currentWeek * 2); // Time component

        this.state.sustainabilityScore = Math.max(0, Math.min(100, score));
        return this.state.sustainabilityScore;
    }

    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data = {}) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    // Public API methods
    getGameState() {
        return { ...this.state };
    }

    getFarmData() {
        return { ...this.farmData };
    }

    getCurrentScenario() {
        return this.currentScenario;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});
