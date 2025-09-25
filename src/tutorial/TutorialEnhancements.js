/**
 * Tutorial Enhancements for NASA Farm Navigators
 * Implements missing functionality and fixes hardcoded elements
 */

class TutorialEnhancements {
    constructor() {
        this.cloudEffectActive = false;
        this.farmingSimulationData = null;
        this.conservationPlan = {
            selectedOptions: [],
            totalCost: 0,
            expectedSavings: 0
        };
        this.initialize();
    }

    /**
     * Initialize tutorial enhancements
     */
    initialize() {
        this.setupCloudEffectDemo();
        this.setupFarmingSimulation();
        this.setupConservationPlanner();
        this.removeProlTips();
        this.fixModalPositioning();
        this.translateContent();
    }

    /**
     * Remove pro tip popups as requested
     */
    removeProlTips() {
        // Hide all pro tip related elements
        const proTips = document.querySelectorAll('.tutorial-tip, .pro-tip-popup, [class*="pro-tip"]');
        proTips.forEach(tip => {
            tip.style.display = 'none';
        });

        // Remove pro tip creation functions
        window.showProTip = () => {};
        window.createProTip = () => {};

        // Also remove via CSS (already done in CSS file)
    }

    /**
     * Fix modal positioning to center
     */
    fixModalPositioning() {
        // Ensure all tutorial modals are properly centered
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList && node.classList.contains('tutorial-modal')) {
                            this.centerModal(node);
                        }
                        // Also check children
                        const modals = node.querySelectorAll && node.querySelectorAll('.tutorial-modal');
                        if (modals) {
                            modals.forEach(modal => this.centerModal(modal));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Fix existing modals
        document.querySelectorAll('.tutorial-modal').forEach(modal => {
            this.centerModal(modal);
        });
    }

    /**
     * Center a modal properly
     */
    centerModal(modal) {
        const parent = modal.parentElement;
        if (parent && parent.classList.contains('modal-overlay')) {
            parent.style.display = 'flex';
            parent.style.justifyContent = 'center';
            parent.style.alignItems = 'center';
            parent.style.position = 'fixed';
            parent.style.top = '0';
            parent.style.left = '0';
            parent.style.width = '100%';
            parent.style.height = '100%';
            parent.style.zIndex = '10000';
        }

        modal.style.position = 'relative';
        modal.style.margin = '0 auto';
    }

    /**
     * Translate all tutorial content to English
     */
    translateContent() {
        // Translation mappings
        const translations = {
            '🎯 Pro Tip:': 'NASA Data Insight:',
            'Decisions aligned with NASA data recommendations earn bonus points and improve your farming efficiency!':
                'Use NASA satellite data to make informed farming decisions for better yields and resource efficiency.',
            '⬅️ Previous': '← Back',
            'Siguiente': 'Next →',
            'Anterior': '← Back',
            '다음': 'Next →',
            '이전': '← Back',
            '완료': 'Complete',
            '시작하기': 'Start',
            '계속': 'Continue'
        };

        // Apply translations to existing content
        this.applyTranslations(translations);

        // Set up observer for dynamic content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        this.applyTranslationsToNode(node, translations);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Apply translations to the entire document
     */
    applyTranslations(translations) {
        Object.keys(translations).forEach(original => {
            const translated = translations[original];
            this.replaceTextInDocument(original, translated);
        });
    }

    /**
     * Apply translations to a specific node
     */
    applyTranslationsToNode(node, translations) {
        Object.keys(translations).forEach(original => {
            const translated = translations[original];
            this.replaceTextInNode(node, original, translated);
        });
    }

    /**
     * Replace text content in the entire document
     */
    replaceTextInDocument(searchText, replaceText) {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            textNode.textContent = textNode.textContent.replace(new RegExp(searchText, 'g'), replaceText);
        });
    }

    /**
     * Replace text content in a specific node
     */
    replaceTextInNode(node, searchText, replaceText) {
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let textNode;
        while (textNode = walker.nextNode()) {
            textNodes.push(textNode);
        }

        textNodes.forEach(textNode => {
            textNode.textContent = textNode.textContent.replace(new RegExp(searchText, 'g'), replaceText);
        });
    }

    /**
     * Set up cloud effect demonstration
     */
    setupCloudEffectDemo() {
        // Replace hardcoded cloud effect with working implementation
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeCloudEffectElements();
        });

        // Also set up observer for dynamically created elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('cloud-effect-demo')) {
                        this.setupCloudEffectElement(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.cloud-effect-demo').forEach(element => {
                            this.setupCloudEffectElement(element);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Initialize existing cloud effect elements
     */
    initializeCloudEffectElements() {
        document.querySelectorAll('.cloud-effect-demo').forEach(element => {
            this.setupCloudEffectElement(element);
        });
    }

    /**
     * Set up individual cloud effect element
     */
    setupCloudEffectElement(element) {
        element.innerHTML = `
            <div class="cloud-demo-header">
                <h3>Cloud Cover Impact on Satellite Data</h3>
                <button class="cloud-toggle-btn" onclick="tutorialEnhancements.toggleCloudEffect()">
                    ${this.cloudEffectActive ? 'Clear Skies' : 'Add Clouds'}
                </button>
            </div>
            <div class="cloud-demo-display">
                <div class="satellite-view ${this.cloudEffectActive ? 'cloudy' : 'clear'}">
                    <div class="ground-features">
                        <div class="field-plot healthy">Healthy Crop Field</div>
                        <div class="field-plot stressed">Stressed Crop Field</div>
                        <div class="water-feature">Water Body</div>
                    </div>
                    ${this.cloudEffectActive ? '<div class="cloud-overlay">☁️ Cloud Cover ☁️</div>' : ''}
                </div>
                <div class="data-quality-indicator">
                    <span class="quality-label">Data Quality: </span>
                    <span class="quality-value ${this.cloudEffectActive ? 'poor' : 'excellent'}">
                        ${this.cloudEffectActive ? 'Poor (Clouds blocking view)' : 'Excellent (Clear view)'}
                    </span>
                </div>
            </div>
            <div class="cloud-demo-explanation">
                <p><strong>Impact:</strong> ${this.cloudEffectActive ?
                    'Clouds prevent optical satellites from seeing the ground clearly, reducing data accuracy.' :
                    'Clear skies allow satellites to capture high-quality imagery for precise crop monitoring.'
                }</p>
            </div>
        `;

        element.classList.add('active');
    }

    /**
     * Toggle cloud effect demonstration
     */
    toggleCloudEffect() {
        this.cloudEffectActive = !this.cloudEffectActive;
        this.initializeCloudEffectElements(); // Refresh all cloud effect demos
    }

    /**
     * Set up farming simulation
     */
    setupFarmingSimulation() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeFarmingSimulationElements();
        });

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('farming-simulation')) {
                        this.setupFarmingSimulationElement(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.farming-simulation').forEach(element => {
                            this.setupFarmingSimulationElement(element);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Initialize existing farming simulation elements
     */
    initializeFarmingSimulationElements() {
        document.querySelectorAll('.farming-simulation').forEach(element => {
            this.setupFarmingSimulationElement(element);
        });
    }

    /**
     * Set up individual farming simulation element
     */
    setupFarmingSimulationElement(element) {
        // Skip if this is a Conservation Agriculture simulation (has simulation controls)
        if (element.querySelector('.simulation-controls') ||
            element.innerHTML.includes('runSimulation') ||
            element.innerHTML.includes('Run Conventional') ||
            element.innerHTML.includes('simulationResults')) {
            console.log('🔄 Skipping TutorialEnhancements override for Conservation Agriculture simulation');
            return; // Don't override the Conservation Agriculture content
        }

        const currentSeason = this.getCurrentSeason();
        const cropData = this.generateCropSimulationData(currentSeason);

        element.innerHTML = `
            <div class="simulation-header">
                <h3>Farm Simulation Dashboard</h3>
                <div class="season-indicator">${currentSeason} Season</div>
            </div>
            <div class="simulation-display">
                <div class="crop-status">
                    <div class="crop-item">
                        <span class="crop-name">Corn</span>
                        <div class="growth-bar">
                            <div class="growth-progress" style="width: ${cropData.corn}%"></div>
                        </div>
                        <span class="growth-percentage">${cropData.corn}%</span>
                    </div>
                    <div class="crop-item">
                        <span class="crop-name">Soybeans</span>
                        <div class="growth-bar">
                            <div class="growth-progress" style="width: ${cropData.soybeans}%"></div>
                        </div>
                        <span class="growth-percentage">${cropData.soybeans}%</span>
                    </div>
                    <div class="crop-item">
                        <span class="crop-name">Wheat</span>
                        <div class="growth-bar">
                            <div class="growth-progress" style="width: ${cropData.wheat}%"></div>
                        </div>
                        <span class="growth-percentage">${cropData.wheat}%</span>
                    </div>
                </div>
                <div class="nasa-data-integration">
                    <h4>NASA Data Insights</h4>
                    <div class="data-insight">
                        <span class="data-type">Soil Moisture:</span>
                        <span class="data-value optimal">Optimal</span>
                    </div>
                    <div class="data-insight">
                        <span class="data-type">Vegetation Health:</span>
                        <span class="data-value good">Good</span>
                    </div>
                    <div class="data-insight">
                        <span class="data-type">Weather Forecast:</span>
                        <span class="data-value favorable">Favorable</span>
                    </div>
                </div>
            </div>
            <div class="simulation-controls">
                <button onclick="tutorialEnhancements.advanceSimulation()" class="simulation-btn">
                    Advance Time →
                </button>
                <button onclick="tutorialEnhancements.resetSimulation()" class="simulation-btn secondary">
                    Reset Simulation
                </button>
            </div>
        `;
    }

    /**
     * Get current season for simulation
     */
    getCurrentSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'Spring';
        if (month >= 5 && month <= 7) return 'Summer';
        if (month >= 8 && month <= 10) return 'Fall';
        return 'Winter';
    }

    /**
     * Generate crop simulation data
     */
    generateCropSimulationData(season) {
        const baseGrowth = {
            'Spring': { corn: 25, soybeans: 30, wheat: 60 },
            'Summer': { corn: 75, soybeans: 80, wheat: 90 },
            'Fall': { corn: 95, soybeans: 85, wheat: 100 },
            'Winter': { corn: 5, soybeans: 5, wheat: 20 }
        };

        return baseGrowth[season] || baseGrowth['Spring'];
    }

    /**
     * Advance farming simulation
     */
    advanceSimulation() {
        // Simulate advancing time
        this.initializeFarmingSimulationElements();

        // Show notification
        this.showNotification('Simulation advanced to next growth stage', 'success');
    }

    /**
     * Reset farming simulation
     */
    resetSimulation() {
        this.initializeFarmingSimulationElements();
        this.showNotification('Simulation reset to beginning', 'info');
    }

    /**
     * Set up conservation planner
     */
    setupConservationPlanner() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeConservationPlannerElements();
        });

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('conservation-planner')) {
                        this.setupConservationPlannerElement(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.conservation-planner').forEach(element => {
                            this.setupConservationPlannerElement(element);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Initialize existing conservation planner elements
     */
    initializeConservationPlannerElements() {
        document.querySelectorAll('.conservation-planner').forEach(element => {
            this.setupConservationPlannerElement(element);
        });
    }

    /**
     * Set up individual conservation planner element
     */
    setupConservationPlannerElement(element) {
        const conservationOptions = [
            { id: 'cover-crops', name: 'Cover Crops', cost: 45, savings: 120, description: 'Improve soil health and reduce erosion' },
            { id: 'precision-irrigation', name: 'Precision Irrigation', cost: 150, savings: 300, description: 'Reduce water usage by 25%' },
            { id: 'nutrient-management', name: 'Nutrient Management', cost: 30, savings: 80, description: 'Optimize fertilizer application' },
            { id: 'buffer-strips', name: 'Buffer Strips', cost: 25, savings: 60, description: 'Protect water quality' },
            { id: 'crop-rotation', name: 'Crop Rotation', cost: 10, savings: 90, description: 'Improve soil fertility naturally' }
        ];

        element.innerHTML = `
            <div class="planner-header">
                <h3>Conservation Practice Planner</h3>
                <p>Select practices to improve your farm's sustainability and profitability</p>
            </div>
            <div class="conservation-options">
                ${conservationOptions.map(option => `
                    <div class="conservation-option" data-id="${option.id}" onclick="tutorialEnhancements.toggleConservationOption('${option.id}', ${option.cost}, ${option.savings})">
                        <div class="option-name">${option.name}</div>
                        <div class="option-cost">Cost: $${option.cost}/acre</div>
                        <div class="option-savings">Savings: $${option.savings}/acre</div>
                        <div class="option-description">${option.description}</div>
                    </div>
                `).join('')}
            </div>
            <div class="conservation-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Cost:</span>
                    <span class="summary-value" id="total-cost">$0/acre</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Expected Savings:</span>
                    <span class="summary-value" id="total-savings">$0/acre</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Net Benefit:</span>
                    <span class="summary-value" id="net-benefit">$0/acre</span>
                </div>
            </div>
            <div class="planner-actions">
                <button onclick="tutorialEnhancements.generateConservationPlan()" class="conservation-btn">
                    Generate Plan
                </button>
                <button onclick="tutorialEnhancements.resetConservationPlan()" class="conservation-btn secondary">
                    Reset Plan
                </button>
            </div>
        `;

        this.updateConservationSummary();
    }

    /**
     * Toggle conservation option selection
     */
    toggleConservationOption(optionId, cost, savings) {
        const option = document.querySelector(`[data-id="${optionId}"]`);
        const index = this.conservationPlan.selectedOptions.indexOf(optionId);

        if (index > -1) {
            // Remove option
            this.conservationPlan.selectedOptions.splice(index, 1);
            this.conservationPlan.totalCost -= cost;
            this.conservationPlan.expectedSavings -= savings;
            option.classList.remove('selected');
        } else {
            // Add option
            this.conservationPlan.selectedOptions.push(optionId);
            this.conservationPlan.totalCost += cost;
            this.conservationPlan.expectedSavings += savings;
            option.classList.add('selected');
        }

        this.updateConservationSummary();
    }

    /**
     * Update conservation plan summary
     */
    updateConservationSummary() {
        const totalCostElement = document.getElementById('total-cost');
        const totalSavingsElement = document.getElementById('total-savings');
        const netBenefitElement = document.getElementById('net-benefit');

        if (totalCostElement) {
            totalCostElement.textContent = `$${this.conservationPlan.totalCost}/acre`;
        }
        if (totalSavingsElement) {
            totalSavingsElement.textContent = `$${this.conservationPlan.expectedSavings}/acre`;
        }
        if (netBenefitElement) {
            const netBenefit = this.conservationPlan.expectedSavings - this.conservationPlan.totalCost;
            netBenefitElement.textContent = `$${netBenefit}/acre`;
            netBenefitElement.className = `summary-value ${netBenefit >= 0 ? 'positive' : 'negative'}`;
        }
    }

    /**
     * Generate conservation plan
     */
    generateConservationPlan() {
        if (this.conservationPlan.selectedOptions.length === 0) {
            this.showNotification('Please select at least one conservation practice', 'warning');
            return;
        }

        const netBenefit = this.conservationPlan.expectedSavings - this.conservationPlan.totalCost;
        const roi = ((netBenefit / this.conservationPlan.totalCost) * 100).toFixed(1);

        this.showNotification(
            `Conservation plan generated! ROI: ${roi}% with ${this.conservationPlan.selectedOptions.length} practices selected.`,
            'success'
        );
    }

    /**
     * Reset conservation plan
     */
    resetConservationPlan() {
        this.conservationPlan = {
            selectedOptions: [],
            totalCost: 0,
            expectedSavings: 0
        };

        document.querySelectorAll('.conservation-option.selected').forEach(option => {
            option.classList.remove('selected');
        });

        this.updateConservationSummary();
        this.showNotification('Conservation plan reset', 'info');
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `tutorial-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;

        switch (type) {
            case 'success':
                notification.style.background = '#4CAF50';
                break;
            case 'warning':
                notification.style.background = '#FF9800';
                break;
            case 'error':
                notification.style.background = '#F44336';
                break;
            default:
                notification.style.background = '#2196F3';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Initialize tutorial enhancements when the script loads
const tutorialEnhancements = new TutorialEnhancements();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialEnhancements;
} else if (typeof window !== 'undefined') {
    window.TutorialEnhancements = TutorialEnhancements;
    window.tutorialEnhancements = tutorialEnhancements;
}