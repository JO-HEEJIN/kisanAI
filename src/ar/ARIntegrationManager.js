/**
 * ARIntegrationManager
 * Manages AR system integration with the main application safely
 */
class ARIntegrationManager {
    constructor() {
        this.arSystem = null;
        this.isARActive = false;
        this.tabGuard = null;
        this.currentTab = null;
        this.callbacks = {
            onARStart: [],
            onARStop: [],
            onError: []
        };

        console.log('🔧 ARIntegrationManager: Initialized');
    }

    async initialize(tabGuard) {
        try {
            this.tabGuard = tabGuard;

            // Initialize AR system
            this.arSystem = new window.ARSystem();

            console.log('✅ ARIntegrationManager: Ready');
            return true;
        } catch (error) {
            console.error('❌ ARIntegrationManager: Initialization failed:', error);
            this.triggerError(error);
            throw error;
        }
    }

    async startAR(tabName = 'ar-chatgpt') {
        try {
            console.log('🚀 ARIntegrationManager: Starting AR for tab:', tabName);

            // Prevent tab switching during AR
            if (this.tabGuard) {
                this.tabGuard.lockNavigation('AR session active');
            }

            this.currentTab = tabName;
            this.isARActive = true;

            // Initialize and start AR system
            await this.arSystem.startAR();

            // Trigger callbacks
            this.triggerCallbacks('onARStart', { tab: tabName });

            console.log('✅ ARIntegrationManager: AR started successfully');
            return true;
        } catch (error) {
            console.error('❌ ARIntegrationManager: Failed to start AR:', error);
            await this.stopAR();
            this.triggerError(error);
            throw error;
        }
    }

    async stopAR() {
        try {
            console.log('🛑 ARIntegrationManager: Stopping AR...');

            const wasActive = this.isARActive;
            this.isARActive = false;

            // Stop AR system
            if (this.arSystem) {
                await this.arSystem.stopAR();
            }

            // Unlock navigation
            if (this.tabGuard) {
                this.tabGuard.unlockNavigation();
            }

            if (wasActive) {
                this.triggerCallbacks('onARStop', { tab: this.currentTab });
            }

            this.currentTab = null;

            console.log('✅ ARIntegrationManager: AR stopped successfully');
        } catch (error) {
            console.error('❌ ARIntegrationManager: Error stopping AR:', error);
            this.triggerError(error);
        }
    }

    async cleanup() {
        try {
            console.log('🧹 ARIntegrationManager: Starting cleanup...');

            // Stop AR if active
            if (this.isARActive) {
                await this.stopAR();
            }

            // Cleanup AR system
            if (this.arSystem) {
                await this.arSystem.cleanup();
                this.arSystem = null;
            }

            // Unlock navigation
            if (this.tabGuard) {
                this.tabGuard.unlockNavigation();
            }

            // Clear callbacks
            this.callbacks = {
                onARStart: [],
                onARStop: [],
                onError: []
            };

            this.isARActive = false;
            this.currentTab = null;

            console.log('✅ ARIntegrationManager: Cleanup complete');
        } catch (error) {
            console.error('❌ ARIntegrationManager: Cleanup error:', error);
        }
    }

    async emergencyCleanup() {
        console.log('🚨 ARIntegrationManager: Emergency cleanup initiated');

        try {
            // Force stop everything
            this.isARActive = false;
            this.currentTab = null;

            // Emergency cleanup AR system
            if (this.arSystem) {
                await this.arSystem.emergencyCleanup();
                this.arSystem = null;
            }

            // Force unlock navigation
            if (this.tabGuard) {
                this.tabGuard.forceUnlock();
            }

            // Clear all callbacks
            this.callbacks = {
                onARStart: [],
                onARStop: [],
                onError: []
            };

            console.log('✅ ARIntegrationManager: Emergency cleanup complete');
        } catch (error) {
            console.error('❌ ARIntegrationManager: Emergency cleanup error:', error);
        }
    }

    // Event system
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    triggerCallbacks(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ ARIntegrationManager: Callback error for ${event}:`, error);
                }
            });
        }
    }

    triggerError(error) {
        this.triggerCallbacks('onError', error);
    }

    // Status methods
    getStatus() {
        return {
            isARActive: this.isARActive,
            currentTab: this.currentTab,
            hasARSystem: !!this.arSystem,
            hasTabGuard: !!this.tabGuard,
            arSystemStatus: this.arSystem ? this.arSystem.getStatus() : null
        };
    }

    isActive() {
        return this.isARActive;
    }

    getCurrentTab() {
        return this.currentTab;
    }

    // Tab switching support
    async handleTabSwitch(fromTab, toTab) {
        try {
            console.log(`🔄 ARIntegrationManager: Tab switch ${fromTab} → ${toTab}`);

            // If leaving AR tab while AR is active, stop AR
            if (fromTab === 'ar-chatgpt' && this.isARActive) {
                console.log('🛑 ARIntegrationManager: Leaving AR tab, stopping AR...');
                await this.stopAR();
            }

            // If entering AR tab, prepare for AR
            if (toTab === 'ar-chatgpt') {
                console.log('🎯 ARIntegrationManager: Entering AR tab, preparing...');
                // AR will be started when user clicks "Launch AR" button
            }

            return true;
        } catch (error) {
            console.error('❌ ARIntegrationManager: Tab switch error:', error);
            await this.emergencyCleanup();
            return false;
        }
    }

    // Utility methods
    async safeExecute(operation, operationName) {
        try {
            console.log(`🔄 ARIntegrationManager: Executing ${operationName}...`);
            const result = await operation();
            console.log(`✅ ARIntegrationManager: ${operationName} successful`);
            return result;
        } catch (error) {
            console.error(`❌ ARIntegrationManager: ${operationName} failed:`, error);
            this.triggerError(error);
            throw error;
        }
    }
}

// Export for global access
window.ARIntegrationManager = ARIntegrationManager;