/**
 * NASA Farm Navigators - Achievement System
 * Gamification for agricultural practices using NASA satellite data
 * Inspired by John Deere's 20+ app ecosystem success
 */

class AchievementSystem {
    constructor() {
        this.achievements = this.initializeAchievements();
        this.userProgress = this.loadUserProgress();
        this.callbacks = {};

        console.log('🏆 Achievement System initialized with', Object.keys(this.achievements).length, 'achievements');
    }

    initializeAchievements() {
        return {
            // NASA Data Mastery
            'satellite_sage': {
                id: 'satellite_sage',
                name: '🛰️ Satellite Sage',
                description: 'Master NASA satellite data interpretation',
                category: 'nasa_expertise',
                levels: [
                    { level: 1, requirement: 10, points: 100, title: 'Data Explorer', description: 'Check NASA data 10 times' },
                    { level: 2, requirement: 50, points: 300, title: 'Data Analyst', description: 'Analyze 50 satellite datasets' },
                    { level: 3, requirement: 200, points: 1000, title: 'Satellite Sage', description: 'Expert in 200+ NASA observations' }
                ],
                currentLevel: 0,
                progress: 0,
                icon: '🛰️',
                rewards: ['NASA data insights badge', 'Priority data access', 'Advanced analytics unlock']
            },

            'water_wizard': {
                id: 'water_wizard',
                name: '💧 Water Wizard',
                description: 'Master irrigation management using SMAP + GPM data',
                category: 'irrigation',
                levels: [
                    { level: 1, requirement: 5, points: 150, title: 'Irrigation Novice', description: 'Make 5 irrigation decisions based on satellite data' },
                    { level: 2, requirement: 25, points: 500, title: 'Water Manager', description: 'Successfully manage water for 25 cycles' },
                    { level: 3, requirement: 100, points: 2000, title: 'Water Wizard', description: 'Expert water conservation with satellite precision' }
                ],
                currentLevel: 0,
                progress: 0,
                icon: '💧',
                rewards: ['Smart irrigation tips', 'Water efficiency metrics', 'Drought prediction alerts']
            },

            'seed_master': {
                id: 'seed_master',
                name: '🌱 Seed Master',
                description: 'Perfect planting timing using MODIS + weather data',
                category: 'planting',
                levels: [
                    { level: 1, requirement: 3, points: 200, title: 'Planting Beginner', description: 'Plant 3 crops using optimal satellite timing' },
                    { level: 2, requirement: 15, points: 600, title: 'Timing Expert', description: 'Achieve 15 successful plantings with MODIS guidance' },
                    { level: 3, requirement: 50, points: 1500, title: 'Seed Master', description: 'Master of seasonal timing and satellite-guided planting' }
                ],
                currentLevel: 0,
                progress: 0,
                icon: '🌱',
                rewards: ['Planting calendar', 'Crop selection guide', 'Weather pattern insights']
            },

            'harvest_hero': {
                id: 'harvest_hero',
                name: '🌾 Harvest Hero',
                description: 'Maximize yield using comprehensive NASA datasets',
                category: 'harvest',
                levels: [
                    { level: 1, requirement: 1000, points: 300, title: 'Yield Improver', description: 'Increase yield by 10% using satellite data' },
                    { level: 2, requirement: 5000, points: 800, title: 'Productivity Pro', description: 'Boost total productivity by 25%' },
                    { level: 3, requirement: 15000, points: 2500, title: 'Harvest Hero', description: 'Legendary yields with NASA precision agriculture' }
                ],
                currentLevel: 0,
                progress: 0,
                icon: '🌾',
                rewards: ['Yield optimization tips', 'Market timing advice', 'Quality assessment tools']
            },

            'climate_guardian': {
                id: 'climate_guardian',
                name: '🌍 Climate Guardian',
                description: 'Adapt to climate change using ECOSTRESS + POWER data',
                category: 'sustainability',
                levels: [
                    { level: 1, requirement: 10, points: 250, title: 'Climate Aware', description: 'Make 10 climate-adaptive decisions' },
                    { level: 2, requirement: 40, points: 750, title: 'Adaptation Expert', description: 'Successfully adapt to 40 climate events' },
                    { level: 3, requirement: 150, points: 2200, title: 'Climate Guardian', description: 'Champion of climate-smart agriculture' }
                ],
                currentLevel: 0,
                progress: 0,
                icon: '🌍',
                rewards: ['Climate risk alerts', 'Adaptation strategies', 'Carbon footprint tracking']
            },

            'data_detective': {
                id: 'data_detective',
                name: '🔍 Data Detective',
                description: 'Discover insights across all 6 NASA datasets',
                category: 'analysis',
                levels: [
                    { level: 1, requirement: 50, points: 400, title: 'Pattern Spotter', description: 'Identify 50 data patterns' },
                    { level: 2, requirement: 200, points: 1000, title: 'Insight Hunter', description: 'Uncover 200 agricultural insights' },
                    { level: 3, requirement: 500, points: 3000, title: 'Data Detective', description: 'Master investigator of satellite agriculture data' }
                ],
                currentLevel: 0,
                progress: 0,
                icon: '🔍',
                rewards: ['Advanced analytics', 'Predictive modeling', 'Custom data queries']
            }
        };
    }

    // Progress tracking methods
    trackAction(actionType, value = 1, context = {}) {
        console.log(`🎮 Tracking action: ${actionType} (value: ${value})`);

        const actionMappings = {
            'nasa_data_check': ['satellite_sage'],
            'irrigation_decision': ['water_wizard'],
            'planting_action': ['seed_master'],
            'yield_increase': ['harvest_hero'],
            'climate_adaptation': ['climate_guardian'],
            'data_analysis': ['data_detective'],
            'comprehensive_query': ['satellite_sage', 'data_detective']
        };

        const relevantAchievements = actionMappings[actionType] || [];

        relevantAchievements.forEach(achievementId => {
            this.updateProgress(achievementId, value, context);
        });
    }

    updateProgress(achievementId, value, context = {}) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return;

        const oldProgress = achievement.progress;
        const oldLevel = achievement.currentLevel;

        achievement.progress += value;

        // Check for level up
        const levels = achievement.levels;
        for (let i = levels.length - 1; i >= 0; i--) {
            if (achievement.progress >= levels[i].requirement && achievement.currentLevel < i + 1) {
                achievement.currentLevel = i + 1;
                this.onLevelUp(achievementId, i + 1, context);
                break;
            }
        }

        // Save progress
        this.saveUserProgress();

        console.log(`📊 ${achievement.name}: ${oldProgress} → ${achievement.progress} (Level ${achievement.currentLevel})`);
    }

    onLevelUp(achievementId, newLevel, context = {}) {
        const achievement = this.achievements[achievementId];
        const levelData = achievement.levels[newLevel - 1];

        console.log(`🎉 LEVEL UP! ${achievement.name} → Level ${newLevel}: ${levelData.title}`);

        // Award points
        this.awardPoints(levelData.points);

        // Show achievement notification
        this.showAchievementNotification(achievement, levelData);

        // Trigger callbacks
        if (this.callbacks.onLevelUp) {
            this.callbacks.onLevelUp(achievementId, newLevel, levelData, context);
        }

        // Special rewards for max level
        if (newLevel === achievement.levels.length) {
            this.unlockMasterRewards(achievementId);
        }
    }

    showAchievementNotification(achievement, levelData) {
        // Create achievement notification
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-popup">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <h3>🎉 Achievement Unlocked!</h3>
                    <h4>${achievement.name}</h4>
                    <p>${levelData.title}</p>
                    <div class="achievement-points">+${levelData.points} points</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 500);
        }, 4000);

        // Play achievement sound (if available)
        this.playAchievementSound();
    }

    playAchievementSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H...');
            audio.volume = 0.3;
            audio.play().catch(() => {}); // Ignore audio errors
        } catch (error) {
            // Audio not supported, silent fail
        }
    }

    // Gamification metrics
    getTotalPoints() {
        return this.userProgress.totalPoints || 0;
    }

    getPlayerLevel() {
        const points = this.getTotalPoints();
        if (points < 1000) return { level: 1, title: 'Farm Apprentice', next: 1000 };
        if (points < 3000) return { level: 2, title: 'Agricultural Technician', next: 3000 };
        if (points < 7000) return { level: 3, title: 'Satellite Farmer', next: 7000 };
        if (points < 15000) return { level: 4, title: 'Precision Agriculture Expert', next: 15000 };
        return { level: 5, title: 'NASA Farm Navigator Master', next: null };
    }

    getAchievementProgress(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return null;

        const currentLevel = achievement.currentLevel;
        const nextLevel = currentLevel < achievement.levels.length ? currentLevel + 1 : null;

        if (!nextLevel) {
            return {
                completed: true,
                level: currentLevel,
                progress: achievement.progress,
                maxProgress: achievement.levels[currentLevel - 1]?.requirement || 0
            };
        }

        const nextRequirement = achievement.levels[nextLevel - 1].requirement;
        const currentRequirement = currentLevel > 0 ? achievement.levels[currentLevel - 1].requirement : 0;

        return {
            completed: false,
            level: currentLevel,
            nextLevel: nextLevel,
            progress: achievement.progress - currentRequirement,
            maxProgress: nextRequirement - currentRequirement,
            totalProgress: achievement.progress,
            nextRequirement: nextRequirement
        };
    }

    // NASA-specific achievements
    trackNASADataUsage(datasets) {
        this.trackAction('nasa_data_check', datasets.length);

        if (datasets.includes('comprehensive')) {
            this.trackAction('comprehensive_query', 2); // Bonus for comprehensive queries
        }
    }

    trackIrrigationDecision(soilMoisture, precipitation, decision) {
        this.trackAction('irrigation_decision');

        // Bonus for smart water conservation
        if ((soilMoisture > 0.4 && decision === 'skip') ||
            (precipitation > 5 && decision === 'delay')) {
            this.trackAction('climate_adaptation');
        }
    }

    trackPlantingSuccess(ndvi, timing, success) {
        if (success) {
            this.trackAction('planting_action');

            if (ndvi > 0.7) { // Excellent vegetation response
                this.trackAction('data_analysis', 2);
            }
        }
    }

    // Utility methods
    awardPoints(points) {
        this.userProgress.totalPoints = (this.userProgress.totalPoints || 0) + points;
        this.saveUserProgress();
    }

    loadUserProgress() {
        try {
            const saved = localStorage.getItem('nasa_farm_achievements');
            return saved ? JSON.parse(saved) : { totalPoints: 0 };
        } catch (error) {
            return { totalPoints: 0 };
        }
    }

    saveUserProgress() {
        try {
            localStorage.setItem('nasa_farm_achievements', JSON.stringify(this.userProgress));
        } catch (error) {
            console.warn('Could not save achievement progress');
        }
    }

    unlockMasterRewards(achievementId) {
        console.log(`🌟 Master rewards unlocked for ${achievementId}!`);
        // Could unlock special features, advanced analytics, etc.
    }

    // Event callbacks
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    // Public API for UI integration
    getAllAchievements() {
        return Object.values(this.achievements);
    }

    getAchievementsByCategory(category) {
        return Object.values(this.achievements).filter(a => a.category === category);
    }

    getLeaderboardData() {
        return {
            playerLevel: this.getPlayerLevel(),
            totalPoints: this.getTotalPoints(),
            achievements: this.getAllAchievements().map(a => ({
                id: a.id,
                name: a.name,
                currentLevel: a.currentLevel,
                maxLevel: a.levels.length,
                progress: this.getAchievementProgress(a.id)
            }))
        };
    }

    // Integration with farming actions
    onFarmingAction(action, data) {
        switch (action) {
            case 'irrigation_check':
                this.trackIrrigationDecision(data.soilMoisture, data.precipitation, data.decision);
                break;
            case 'plant_crop':
                this.trackPlantingSuccess(data.ndvi, data.timing, data.success);
                break;
            case 'harvest_crop':
                if (data.yieldIncrease > 0) {
                    this.trackAction('yield_increase', data.yieldIncrease);
                }
                break;
            case 'climate_adaptation':
                this.trackAction('climate_adaptation');
                break;
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementSystem;
}

// Global instance
window.achievementSystem = new AchievementSystem();