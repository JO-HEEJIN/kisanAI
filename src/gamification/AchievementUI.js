/**
 * NASA Farm Navigators - Achievement UI Component
 * Interactive dashboard for gamified agricultural learning
 */

class AchievementUI {
    constructor(achievementSystem) {
        this.achievementSystem = achievementSystem;
        this.currentCategory = 'all';
        this.container = null;

        // Listen for achievement updates
        this.achievementSystem.on('onLevelUp', this.onAchievementLevelUp.bind(this));
    }

    init() {
        // Add CSS if not already added
        if (!document.getElementById('achievements-styles')) {
            const link = document.createElement('link');
            link.id = 'achievements-styles';
            link.rel = 'stylesheet';
            link.href = 'styles/achievements.css';
            document.head.appendChild(link);
        }

        this.createUI();
        this.updateUI();

        console.log('🎮 Achievement UI initialized');
    }

    createUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'achievements-dashboard';
        this.container.className = 'achievements-dashboard';
        this.container.innerHTML = this.getHTMLTemplate();

        // Add event listeners
        this.attachEventListeners();

        return this.container;
    }

    getHTMLTemplate() {
        const playerLevel = this.achievementSystem.getPlayerLevel();
        const totalPoints = this.achievementSystem.getTotalPoints();

        return `
            <div class="achievements-header">
                <h2>🏆 NASA Farm Navigator Achievements</h2>
                <div class="player-level">
                    <div class="level-info">
                        <h3>Level ${playerLevel.level}: ${playerLevel.title}</h3>
                        <p>Master farmer using NASA satellite data</p>
                    </div>
                    <div class="total-points">${totalPoints.toLocaleString()} pts</div>
                </div>
            </div>

            <div class="category-filters">
                <button class="category-filter active" data-category="all">🌟 All</button>
                <button class="category-filter" data-category="nasa_expertise">🛰️ NASA Expertise</button>
                <button class="category-filter" data-category="irrigation">💧 Irrigation</button>
                <button class="category-filter" data-category="planting">🌱 Planting</button>
                <button class="category-filter" data-category="harvest">🌾 Harvest</button>
                <button class="category-filter" data-category="sustainability">🌍 Sustainability</button>
                <button class="category-filter" data-category="analysis">🔍 Analysis</button>
            </div>

            <div class="achievements-grid" id="achievements-grid">
                <!-- Achievement cards will be populated here -->
            </div>
        `;
    }

    updateUI() {
        if (!this.container) return;

        const grid = this.container.querySelector('#achievements-grid');
        if (!grid) return;

        const achievements = this.currentCategory === 'all'
            ? this.achievementSystem.getAllAchievements()
            : this.achievementSystem.getAchievementsByCategory(this.currentCategory);

        grid.innerHTML = achievements.map(achievement => this.createAchievementCard(achievement)).join('');
    }

    createAchievementCard(achievement) {
        const progress = this.achievementSystem.getAchievementProgress(achievement.id);
        const isCompleted = achievement.currentLevel === achievement.levels.length;

        const progressPercent = progress.completed ? 100 :
            (progress.progress / progress.maxProgress) * 100;

        return `
            <div class="achievement-card ${isCompleted ? 'completed' : ''}" data-achievement="${achievement.id}">
                <div class="achievement-header">
                    <div class="icon">${achievement.icon}</div>
                    <div class="achievement-details">
                        <h3>${achievement.name}</h3>
                        <p>${achievement.description}</p>
                    </div>
                </div>

                <div class="achievement-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>Level ${achievement.currentLevel}/${achievement.levels.length}</span>
                        <span>${progress.completed ? 'MASTERED!' : `${progress.totalProgress}/${progress.nextRequirement || 'Max'}`}</span>
                    </div>
                </div>

                <div class="achievement-levels">
                    ${achievement.levels.map((level, index) => {
                        const levelNum = index + 1;
                        const status = levelNum <= achievement.currentLevel ? 'completed' :
                                     levelNum === achievement.currentLevel + 1 ? 'current' : '';
                        return `<div class="level-badge ${status}" title="${level.description}">${level.title}</div>`;
                    }).join('')}
                </div>

                ${isCompleted ? '<div class="completion-badge">🎉 MASTERED</div>' : ''}
            </div>
        `;
    }

    attachEventListeners() {
        if (!this.container) return;

        // Category filter buttons
        const filterButtons = this.container.querySelectorAll('.category-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active state
                filterButtons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');

                // Update current category
                this.currentCategory = button.dataset.category;

                // Refresh UI
                this.updateUI();
            });
        });

        // Achievement card interactions
        this.container.addEventListener('click', (e) => {
            const card = e.target.closest('.achievement-card');
            if (card) {
                this.showAchievementDetails(card.dataset.achievement);
            }
        });
    }

    showAchievementDetails(achievementId) {
        const achievement = this.achievementSystem.achievements[achievementId];
        if (!achievement) return;

        const progress = this.achievementSystem.getAchievementProgress(achievementId);

        // Create detailed view
        const modal = document.createElement('div');
        modal.className = 'achievement-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${achievement.icon} ${achievement.name}</h2>
                        <button class="close-btn">&times;</button>
                    </div>

                    <div class="modal-body">
                        <p class="description">${achievement.description}</p>

                        <div class="level-details">
                            <h3>Progress Levels</h3>
                            ${achievement.levels.map((level, index) => {
                                const levelNum = index + 1;
                                const isCompleted = levelNum <= achievement.currentLevel;
                                const isCurrent = levelNum === achievement.currentLevel + 1;

                                return `
                                    <div class="level-detail ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                                        <div class="level-number">${levelNum}</div>
                                        <div class="level-content">
                                            <h4>${level.title} (${level.points} pts)</h4>
                                            <p>${level.description}</p>
                                            ${isCompleted ? '<span class="completed-check">✓</span>' : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <div class="rewards-section">
                            <h3>Rewards</h3>
                            <ul>
                                ${achievement.rewards.map(reward => `<li>${reward}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-btn');
        const overlay = modal.querySelector('.modal-overlay');

        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Close on escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    onAchievementLevelUp(achievementId, newLevel, levelData, context) {
        // The achievement system already shows notifications
        // Here we can update the UI immediately
        this.updateUI();

        // Could also trigger special effects, sounds, etc.
        console.log('🎊 UI updated for achievement level up:', achievementId, newLevel);
    }

    // Integration methods for NASA Farm Navigators
    trackSatelliteDataUsage(datasets) {
        this.achievementSystem.trackNASADataUsage(datasets);
    }

    trackIrrigationDecision(soilMoisture, precipitation, decision) {
        this.achievementSystem.trackIrrigationDecision(soilMoisture, precipitation, decision);

        // Show contextual tips based on achievement progress
        this.showContextualTip('irrigation', decision);
    }

    trackPlantingAction(ndviData, success) {
        this.achievementSystem.trackPlantingSuccess(ndviData.ndvi, ndviData.timing, success);
    }

    trackYieldIncrease(amount) {
        this.achievementSystem.trackAction('yield_increase', amount);
    }

    showContextualTip(context, data) {
        // Show helpful tips based on user's achievement progress
        const tips = {
            irrigation: {
                beginner: "💡 Tip: Check soil moisture levels regularly using SMAP data!",
                intermediate: "💡 Tip: Combine soil moisture with precipitation forecasts for optimal timing!",
                expert: "💡 Tip: Factor in evapotranspiration data for precision water management!"
            }
        };

        const userLevel = this.achievementSystem.getPlayerLevel().level;
        const tipLevel = userLevel <= 2 ? 'beginner' : userLevel <= 4 ? 'intermediate' : 'expert';
        const tip = tips[context]?.[tipLevel];

        if (tip) {
            this.showTip(tip);
        }
    }

    showTip(message) {
        const tip = document.createElement('div');
        tip.className = 'contextual-tip';
        tip.innerHTML = `
            <div class="tip-content">
                ${message}
                <button class="tip-close">&times;</button>
            </div>
        `;

        document.body.appendChild(tip);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (document.body.contains(tip)) {
                document.body.removeChild(tip);
            }
        }, 5000);

        // Manual close
        tip.querySelector('.tip-close').addEventListener('click', () => {
            document.body.removeChild(tip);
        });
    }

    // Public API
    getContainer() {
        return this.container || this.createUI();
    }

    refresh() {
        this.updateUI();
    }

    showInModal() {
        const modal = document.createElement('div');
        modal.className = 'achievements-modal-container';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="achievements-modal-content">
                    <button class="close-achievements-modal">&times;</button>
                    <div id="achievements-container"></div>
                </div>
            </div>
        `;

        const container = modal.querySelector('#achievements-container');
        container.appendChild(this.getContainer());

        document.body.appendChild(modal);

        // Close functionality
        const closeBtn = modal.querySelector('.close-achievements-modal');
        const overlay = modal.querySelector('.modal-overlay');

        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementUI;
}

// Initialize global instance
if (typeof window !== 'undefined' && window.achievementSystem) {
    window.achievementUI = new AchievementUI(window.achievementSystem);
}