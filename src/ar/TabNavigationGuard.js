/**
 * TabNavigationGuard
 * Prevents AR sessions from blocking tab navigation
 */
class TabNavigationGuard {
    constructor() {
        this.isLocked = false;
        this.lockReason = null;
        this.originalTabHandler = null;
        this.callbacks = {
            onLock: [],
            onUnlock: [],
            onBlockedAttempt: []
        };

        console.log('🛡️ TabNavigationGuard: Initialized');
    }

    initialize(app) {
        try {
            this.app = app;

            // Store original tab switching method
            if (app && typeof app.switchTab === 'function') {
                this.originalTabHandler = app.switchTab.bind(app);

                // Override tab switching with guarded version
                app.switchTab = this.guardedSwitchTab.bind(this);

                console.log('✅ TabNavigationGuard: Tab switching protection active');
            } else {
                console.warn('⚠️ TabNavigationGuard: No app.switchTab method found');
            }

            return true;
        } catch (error) {
            console.error('❌ TabNavigationGuard: Initialization failed:', error);
            throw error;
        }
    }

    guardedSwitchTab(tabName) {
        try {
            console.log(`🔄 TabNavigationGuard: Tab switch request to '${tabName}'`);

            // If navigation is locked, check if it's allowed
            if (this.isLocked) {
                console.log(`🚫 TabNavigationGuard: Navigation locked (${this.lockReason})`);

                // Show user feedback
                this.showBlockedMessage(tabName);

                // Trigger blocked attempt callbacks
                this.triggerCallbacks('onBlockedAttempt', {
                    targetTab: tabName,
                    reason: this.lockReason
                });

                return false;
            }

            // Navigation is allowed, proceed with original handler
            if (this.originalTabHandler) {
                console.log(`✅ TabNavigationGuard: Allowing tab switch to '${tabName}'`);
                return this.originalTabHandler(tabName);
            } else {
                console.warn('⚠️ TabNavigationGuard: No original tab handler available');
                return false;
            }
        } catch (error) {
            console.error('❌ TabNavigationGuard: Error in guarded tab switch:', error);
            // In case of error, allow the switch to prevent total lockup
            if (this.originalTabHandler) {
                return this.originalTabHandler(tabName);
            }
            return false;
        }
    }

    lockNavigation(reason = 'Navigation locked') {
        try {
            console.log(`🔒 TabNavigationGuard: Locking navigation - ${reason}`);

            this.isLocked = true;
            this.lockReason = reason;

            // Add visual indicator
            this.addLockIndicator();

            this.triggerCallbacks('onLock', { reason });

            console.log('✅ TabNavigationGuard: Navigation locked');
        } catch (error) {
            console.error('❌ TabNavigationGuard: Error locking navigation:', error);
        }
    }

    unlockNavigation() {
        try {
            console.log('🔓 TabNavigationGuard: Unlocking navigation');

            this.isLocked = false;
            this.lockReason = null;

            // Remove visual indicator
            this.removeLockIndicator();

            this.triggerCallbacks('onUnlock', {});

            console.log('✅ TabNavigationGuard: Navigation unlocked');
        } catch (error) {
            console.error('❌ TabNavigationGuard: Error unlocking navigation:', error);
        }
    }

    forceUnlock() {
        console.log('🚨 TabNavigationGuard: Force unlock initiated');

        try {
            this.isLocked = false;
            this.lockReason = null;
            this.removeLockIndicator();
            this.triggerCallbacks('onUnlock', { forced: true });

            console.log('✅ TabNavigationGuard: Force unlock complete');
        } catch (error) {
            console.error('❌ TabNavigationGuard: Force unlock error:', error);
        }
    }

    addLockIndicator() {
        try {
            // Remove existing indicator
            this.removeLockIndicator();

            // Create lock indicator
            const indicator = document.createElement('div');
            indicator.id = 'tab-navigation-lock-indicator';
            indicator.innerHTML = `
                <div style="
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: rgba(231, 55, 0, 0.9);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 99999;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    backdrop-filter: blur(4px);
                ">
                    🔒 ${this.lockReason || 'Navigation Locked'}
                </div>
            `;

            document.body.appendChild(indicator);
        } catch (error) {
            console.warn('⚠️ TabNavigationGuard: Error adding lock indicator:', error);
        }
    }

    removeLockIndicator() {
        try {
            const indicator = document.getElementById('tab-navigation-lock-indicator');
            if (indicator) {
                indicator.remove();
            }
        } catch (error) {
            console.warn('⚠️ TabNavigationGuard: Error removing lock indicator:', error);
        }
    }

    showBlockedMessage(targetTab) {
        try {
            // Show temporary message
            const message = document.createElement('div');
            message.innerHTML = `
                <div style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(7, 23, 63, 0.95);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 8px;
                    font-size: 14px;
                    text-align: center;
                    z-index: 99999;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(46, 150, 245, 0.3);
                ">
                    <div style="font-weight: bold; margin-bottom: 8px;">
                        🚫 Navigation Blocked
                    </div>
                    <div style="margin-bottom: 12px;">
                        ${this.lockReason}
                    </div>
                    <div style="font-size: 12px; opacity: 0.8;">
                        Please stop the current AR session to continue
                    </div>
                </div>
            `;

            document.body.appendChild(message);

            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 3000);
        } catch (error) {
            console.warn('⚠️ TabNavigationGuard: Error showing blocked message:', error);
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
                    console.error(`❌ TabNavigationGuard: Callback error for ${event}:`, error);
                }
            });
        }
    }

    // Status methods
    getStatus() {
        return {
            isLocked: this.isLocked,
            lockReason: this.lockReason,
            hasOriginalHandler: !!this.originalTabHandler,
            hasApp: !!this.app
        };
    }

    isNavigationLocked() {
        return this.isLocked;
    }

    getLockReason() {
        return this.lockReason;
    }

    // Cleanup
    cleanup() {
        try {
            console.log('🧹 TabNavigationGuard: Cleaning up...');

            // Restore original tab handler
            if (this.app && this.originalTabHandler) {
                this.app.switchTab = this.originalTabHandler;
            }

            // Unlock navigation
            this.forceUnlock();

            // Clear callbacks
            this.callbacks = {
                onLock: [],
                onUnlock: [],
                onBlockedAttempt: []
            };

            this.originalTabHandler = null;
            this.app = null;

            console.log('✅ TabNavigationGuard: Cleanup complete');
        } catch (error) {
            console.error('❌ TabNavigationGuard: Cleanup error:', error);
        }
    }
}

// Export for global access
window.TabNavigationGuard = TabNavigationGuard;