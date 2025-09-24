class ARGamification {
    constructor() {
        this.initialized = false;
        this.userStats = {
            plantsIdentified: 0,
            arSessionsStarted: 0,
            questionsAsked: 0,
            fieldsAnalyzed: 0,
            achievementsUnlocked: [],
            totalPoints: 0,
            level: 1,
            experience: 0,
            joinDate: null
        };

        this.achievements = {
            'first_chat': {
                id: 'first_chat',
                name: 'Hello, AI!',
                description: 'Send your first message to the AI assistant',
                icon: '💬',
                points: 10,
                category: 'communication',
                unlocked: false
            },
            'first_ar_session': {
                id: 'first_ar_session',
                name: 'AR Pioneer',
                description: 'Start your first AR session',
                icon: '🥽',
                points: 25,
                category: 'ar',
                unlocked: false
            },
            'first_plant_id': {
                id: 'first_plant_id',
                name: 'Plant Detective',
                description: 'Identify your first plant using AI',
                icon: '🔍',
                points: 20,
                category: 'identification',
                unlocked: false
            },
            'voice_user': {
                id: 'voice_user',
                name: 'Voice Commander',
                description: 'Use voice commands for the first time',
                icon: '🎤',
                points: 15,
                category: 'interaction',
                unlocked: false
            },
            'plant_master': {
                id: 'plant_master',
                name: 'Plant Master',
                description: 'Identify 10 different plants',
                icon: '🌿',
                points: 50,
                category: 'identification',
                target: 10,
                unlocked: false
            },
            'chatty_farmer': {
                id: 'chatty_farmer',
                name: 'Chatty Farmer',
                description: 'Ask 25 questions to the AI assistant',
                icon: '🗣️',
                points: 40,
                category: 'communication',
                target: 25,
                unlocked: false
            },
            'ar_enthusiast': {
                id: 'ar_enthusiast',
                name: 'AR Enthusiast',
                description: 'Complete 5 AR sessions',
                icon: '🎯',
                points: 75,
                category: 'ar',
                target: 5,
                unlocked: false
            },
            'field_analyst': {
                id: 'field_analyst',
                name: 'Field Analyst',
                description: 'Analyze 3 different fields',
                icon: '📊',
                points: 60,
                category: 'analysis',
                target: 3,
                unlocked: false
            },
            'nasa_data_explorer': {
                id: 'nasa_data_explorer',
                name: 'NASA Data Explorer',
                description: 'View satellite data in AR mode',
                icon: '🛰️',
                points: 30,
                category: 'data',
                unlocked: false
            },
            'streak_champion': {
                id: 'streak_champion',
                name: 'Streak Champion',
                description: 'Use the app for 7 consecutive days',
                icon: '🏆',
                points: 100,
                category: 'engagement',
                target: 7,
                unlocked: false
            }
        };

        this.levels = [
            { level: 1, requiredXP: 0, title: 'Seedling Farmer' },
            { level: 2, requiredXP: 100, title: 'Growing Farmer' },
            { level: 3, requiredXP: 250, title: 'Experienced Farmer' },
            { level: 4, requiredXP: 500, title: 'AR Farmer' },
            { level: 5, requiredXP: 1000, title: 'Tech-Savvy Farmer' },
            { level: 6, requiredXP: 2000, title: 'Smart Agriculture Expert' },
            { level: 7, requiredXP: 3500, title: 'NASA Data Master' },
            { level: 8, requiredXP: 5000, title: 'Agricultural AI Guru' },
            { level: 9, requiredXP: 7500, title: 'Future Farming Pioneer' },
            { level: 10, requiredXP: 10000, title: 'Digital Agriculture Legend' }
        ];

        this.dailyChallenges = [
            {
                id: 'identify_plants',
                name: 'Plant Hunter',
                description: 'Identify 3 plants today',
                target: 3,
                progress: 0,
                points: 25,
                icon: '🌱'
            },
            {
                id: 'ask_questions',
                name: 'Curious Mind',
                description: 'Ask 5 questions to the AI',
                target: 5,
                progress: 0,
                points: 20,
                icon: '❓'
            },
            {
                id: 'ar_session',
                name: 'AR Explorer',
                description: 'Complete 1 AR session',
                target: 1,
                progress: 0,
                points: 30,
                icon: '🥽'
            }
        ];

        this.loadUserStats();
    }

    async initialize() {
        console.log('Initializing AR Gamification...');

        try {
            await this.loadUserStats();
            this.setupEventListeners();
            this.generateDailyChallenges();
            this.initialized = true;

            console.log('AR Gamification initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AR Gamification:', error);
        }
    }

    setupEventListeners() {
        // Listen for AR ChatGPT events
        document.addEventListener('ar-session-start', () => this.trackActivity('ar_session_started'));
        document.addEventListener('plant-identified', () => this.trackActivity('plant_identified'));
        document.addEventListener('voice-command', () => this.trackActivity('voice_used'));
        document.addEventListener('chat-message-sent', () => this.trackActivity('question_asked'));
        document.addEventListener('nasa-data-viewed', () => this.trackActivity('nasa_data_viewed'));
    }

    trackActivity(activity, data = {}) {
        console.log(`Tracking activity: ${activity}`, data);

        switch (activity) {
            case 'ar_session_started':
                this.userStats.arSessionsStarted++;
                this.checkAchievement('first_ar_session');
                this.checkAchievement('ar_enthusiast');
                this.updateDailyChallengeProgress('ar_session', 1);
                this.addExperience(10);
                break;

            case 'plant_identified':
                this.userStats.plantsIdentified++;
                this.checkAchievement('first_plant_id');
                this.checkAchievement('plant_master');
                this.updateDailyChallengeProgress('identify_plants', 1);
                this.addExperience(15);
                break;

            case 'question_asked':
                this.userStats.questionsAsked++;
                this.checkAchievement('first_chat');
                this.checkAchievement('chatty_farmer');
                this.updateDailyChallengeProgress('ask_questions', 1);
                this.addExperience(5);
                break;

            case 'voice_used':
                this.checkAchievement('voice_user');
                this.addExperience(10);
                break;

            case 'nasa_data_viewed':
                this.checkAchievement('nasa_data_explorer');
                this.addExperience(8);
                break;

            case 'field_analyzed':
                this.userStats.fieldsAnalyzed++;
                this.checkAchievement('field_analyst');
                this.addExperience(20);
                break;
        }

        this.saveUserStats();
        this.updateUI();
    }

    checkAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return;

        let shouldUnlock = false;

        switch (achievementId) {
            case 'first_chat':
                shouldUnlock = this.userStats.questionsAsked >= 1;
                break;
            case 'first_ar_session':
                shouldUnlock = this.userStats.arSessionsStarted >= 1;
                break;
            case 'first_plant_id':
                shouldUnlock = this.userStats.plantsIdentified >= 1;
                break;
            case 'voice_user':
                shouldUnlock = true; // Unlocked on first voice use
                break;
            case 'plant_master':
                shouldUnlock = this.userStats.plantsIdentified >= achievement.target;
                break;
            case 'chatty_farmer':
                shouldUnlock = this.userStats.questionsAsked >= achievement.target;
                break;
            case 'ar_enthusiast':
                shouldUnlock = this.userStats.arSessionsStarted >= achievement.target;
                break;
            case 'field_analyst':
                shouldUnlock = this.userStats.fieldsAnalyzed >= achievement.target;
                break;
            case 'nasa_data_explorer':
                shouldUnlock = true; // Unlocked on first NASA data view
                break;
        }

        if (shouldUnlock) {
            this.unlockAchievement(achievementId);
        }
    }

    unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return;

        achievement.unlocked = true;
        this.userStats.achievementsUnlocked.push(achievementId);
        this.userStats.totalPoints += achievement.points;
        this.addExperience(achievement.points);

        // Show achievement notification
        this.showAchievementNotification(achievement);

        console.log(`Achievement unlocked: ${achievement.name}`);
    }

    showAchievementNotification(achievement) {
        // Create achievement notification
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-details">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-points">+${achievement.points} points</div>
                </div>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            min-width: 300px;
            animation: slideInRight 0.5s ease-out, slideOutRight 0.5s ease-in 4.5s forwards;
        `;

        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    addExperience(xp) {
        this.userStats.experience += xp;

        // Check for level up
        const newLevel = this.calculateLevel(this.userStats.experience);
        if (newLevel > this.userStats.level) {
            this.levelUp(newLevel);
        }
    }

    calculateLevel(experience) {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (experience >= this.levels[i].requiredXP) {
                return this.levels[i].level;
            }
        }
        return 1;
    }

    levelUp(newLevel) {
        const oldLevel = this.userStats.level;
        this.userStats.level = newLevel;

        // Show level up notification
        const levelData = this.levels.find(l => l.level === newLevel);
        this.showLevelUpNotification(oldLevel, newLevel, levelData.title);
    }

    showLevelUpNotification(oldLevel, newLevel, title) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">🎉</div>
                <div class="level-up-details">
                    <div class="level-up-title">LEVEL UP!</div>
                    <div class="level-up-info">Level ${oldLevel} → Level ${newLevel}</div>
                    <div class="level-up-rank">${title}</div>
                </div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            z-index: 10001;
            text-align: center;
            min-width: 350px;
            animation: levelUpPop 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    updateDailyChallengeProgress(challengeId, progress) {
        const challenge = this.dailyChallenges.find(c => c.id === challengeId);
        if (challenge) {
            challenge.progress = Math.min(challenge.progress + progress, challenge.target);

            if (challenge.progress >= challenge.target) {
                this.completeDailyChallenge(challenge);
            }
        }
    }

    completeDailyChallenge(challenge) {
        this.addExperience(challenge.points);

        // Show completion notification
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="background: rgba(52, 199, 89, 0.9); color: white; padding: 15px; border-radius: 10px; margin: 10px 0;">
                ${challenge.icon} Daily Challenge Complete: ${challenge.name} (+${challenge.points} XP)
            </div>
        `;

        // Add to AR overlay or main UI
        const overlay = document.getElementById('ar-overlay') || document.body;
        overlay.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    generateDailyChallenges() {
        // Reset daily challenges (in a real app, this would be based on date)
        this.dailyChallenges.forEach(challenge => {
            challenge.progress = 0;
        });
    }

    getProgressStats() {
        return {
            level: this.userStats.level,
            experience: this.userStats.experience,
            totalPoints: this.userStats.totalPoints,
            nextLevelXP: this.getNextLevelXP(),
            progressToNextLevel: this.getProgressToNextLevel(),
            achievements: this.userStats.achievementsUnlocked.length,
            totalAchievements: Object.keys(this.achievements).length,
            title: this.getUserTitle()
        };
    }

    getNextLevelXP() {
        const nextLevel = this.levels.find(l => l.level > this.userStats.level);
        return nextLevel ? nextLevel.requiredXP : this.levels[this.levels.length - 1].requiredXP;
    }

    getProgressToNextLevel() {
        const currentLevelXP = this.levels.find(l => l.level === this.userStats.level)?.requiredXP || 0;
        const nextLevelXP = this.getNextLevelXP();
        const progressXP = this.userStats.experience - currentLevelXP;
        const totalXPNeeded = nextLevelXP - currentLevelXP;

        return Math.min(progressXP / totalXPNeeded, 1);
    }

    getUserTitle() {
        const levelData = this.levels.find(l => l.level === this.userStats.level);
        return levelData ? levelData.title : 'Farmer';
    }

    updateUI() {
        // Update any UI elements showing progress
        const progressStats = this.getProgressStats();

        // Dispatch event for UI updates
        document.dispatchEvent(new CustomEvent('gamification-update', {
            detail: progressStats
        }));
    }

    loadUserStats() {
        try {
            const saved = localStorage.getItem('ar_gamification_stats');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.userStats = { ...this.userStats, ...parsed };

                // Mark achievements as unlocked
                this.userStats.achievementsUnlocked.forEach(id => {
                    if (this.achievements[id]) {
                        this.achievements[id].unlocked = true;
                    }
                });
            } else {
                // First time user
                this.userStats.joinDate = new Date().toISOString();
            }
        } catch (error) {
            console.warn('Failed to load user stats:', error);
        }
    }

    saveUserStats() {
        try {
            localStorage.setItem('ar_gamification_stats', JSON.stringify(this.userStats));
        } catch (error) {
            console.warn('Failed to save user stats:', error);
        }
    }

    // Public API methods
    getUserStats() {
        return { ...this.userStats };
    }

    getAchievements() {
        return { ...this.achievements };
    }

    getDailyChallenges() {
        return [...this.dailyChallenges];
    }

    resetProgress() {
        this.userStats = {
            plantsIdentified: 0,
            arSessionsStarted: 0,
            questionsAsked: 0,
            fieldsAnalyzed: 0,
            achievementsUnlocked: [],
            totalPoints: 0,
            level: 1,
            experience: 0,
            joinDate: new Date().toISOString()
        };

        Object.values(this.achievements).forEach(achievement => {
            achievement.unlocked = false;
        });

        this.generateDailyChallenges();
        this.saveUserStats();
        this.updateUI();
    }
}

// Global instance
window.arGamification = new ARGamification();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ARGamification;
}