/**
 * Safe AR System Stub - 안전한 AR 시스템 대체재
 * DOM을 건드리지 않고 기본 기능만 제공
 */
class SafeARStub {
    constructor() {
        this.isActive = false;
        this.isInitialized = false;
        console.log('🛡️ Safe AR Stub: Initialized (DOM-safe mode)');
    }

    async initialize() {
        console.log('🛡️ Safe AR Stub: Initialize called (no-op)');
        this.isInitialized = true;
        return true;
    }

    async startAR() {
        console.log('🛡️ Safe AR Stub: Start AR requested');
        this.isActive = true;

        // 안전한 알림만 표시
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(46, 150, 245, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 16px;
            z-index: 9999;
            text-align: center;
        `;
        message.innerHTML = `
            🥽 AR functionality temporarily disabled<br>
            <small>Currently under maintenance for system stability</small><br><br>
            <button onclick="this.parentElement.remove()" style="
                background: white;
                color: #2E96F5;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
            ">OK</button>
        `;

        document.body.appendChild(message);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);

        return true;
    }

    async stopAR() {
        console.log('🛡️ Safe AR Stub: Stop AR called');
        this.isActive = false;
        return true;
    }

    async cleanup() {
        console.log('🛡️ Safe AR Stub: Cleanup called (safe mode)');
        this.isActive = false;
        this.isInitialized = false;
        return true;
    }

    async emergencyCleanup() {
        console.log('🛡️ Safe AR Stub: Emergency cleanup called (safe mode)');
        return this.cleanup();
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isActive: this.isActive,
            hasCanvas: false,
            hasEngine: false,
            hasScene: false,
            hasXR: false,
            mode: 'safe-stub'
        };
    }

    // 빈 메서드들 - 에러 방지용
    forceCleanupUI() { console.log('🛡️ Safe AR Stub: forceCleanupUI (no-op)'); }
    createCanvas() { console.log('🛡️ Safe AR Stub: createCanvas (no-op)'); }
    loadBabylonJS() { console.log('🛡️ Safe AR Stub: loadBabylonJS (no-op)'); return Promise.resolve(); }
}

// Safe AR Integration Manager
class SafeARIntegrationManager {
    constructor() {
        this.arSystem = new SafeARStub();
        this.isActive = () => false;
        console.log('🛡️ Safe AR Integration Manager: Initialized');
    }

    async initialize() {
        console.log('🛡️ Safe AR Integration Manager: Initialize called');
        return true;
    }

    async startAR() {
        console.log('🛡️ Safe AR Integration Manager: Start AR called');
        return this.arSystem.startAR();
    }

    async stopAR() {
        console.log('🛡️ Safe AR Integration Manager: Stop AR called');
        return this.arSystem.stopAR();
    }

    async cleanup() {
        console.log('🛡️ Safe AR Integration Manager: Cleanup called');
        return this.arSystem.cleanup();
    }
}

// Safe AR System Extension
class SafeARSystemExtension {
    constructor() {
        this.arSystem = new SafeARStub();
        console.log('🛡️ Safe AR System Extension: Initialized');
    }

    async extendARSystem() {
        console.log('🛡️ Safe AR System Extension: Extend AR System called');
        return true;
    }

    async startEnhancedAR() {
        console.log('🛡️ Safe AR System Extension: Start Enhanced AR called');
        return this.arSystem.startAR();
    }

    async stopEnhancedAR() {
        console.log('🛡️ Safe AR System Extension: Stop Enhanced AR called');
        return this.arSystem.stopAR();
    }

    async cleanup() {
        console.log('🛡️ Safe AR System Extension: Cleanup called');
        return this.arSystem.cleanup();
    }

    forceHideARPanels() {
        console.log('🛡️ Safe AR System Extension: forceHideARPanels (no-op)');
    }
}

// Safe Tab Navigation Guard
class SafeTabNavigationGuard {
    constructor() {
        this.isLocked = false;
        console.log('🛡️ Safe Tab Navigation Guard: Initialized');
    }

    async initialize() {
        console.log('🛡️ Safe Tab Navigation Guard: Initialize called');
        return true;
    }

    lockNavigation() {
        console.log('🛡️ Safe Tab Navigation Guard: Lock navigation (no-op)');
        this.isLocked = true;
    }

    unlockNavigation() {
        console.log('🛡️ Safe Tab Navigation Guard: Unlock navigation');
        this.isLocked = false;
    }

    async cleanup() {
        console.log('🛡️ Safe Tab Navigation Guard: Cleanup called');
        this.unlockNavigation();
        return true;
    }
}

// Safe AR Interface Manager
class SafeARInterfaceManager {
    constructor() {
        this.isActive = false;
        console.log('🛡️ Safe AR Interface Manager: Initialized');
    }

    async initialize() {
        console.log('🛡️ Safe AR Interface Manager: Initialize called');
        return true;
    }

    async activate() {
        console.log('🛡️ Safe AR Interface Manager: Activate called');
        this.isActive = true;
        return true;
    }

    async deactivate() {
        console.log('🛡️ Safe AR Interface Manager: Deactivate called');
        this.isActive = false;
        return true;
    }

    async cleanup() {
        console.log('🛡️ Safe AR Interface Manager: Cleanup called');
        return this.deactivate();
    }
}

// 전역 객체로 설정
if (typeof window !== 'undefined') {
    window.ARSystem = SafeARStub;
    window.ARIntegrationManager = SafeARIntegrationManager;
    window.ARSystemExtension = SafeARSystemExtension;
    window.TabNavigationGuard = SafeTabNavigationGuard;
    window.ARInterfaceManager = SafeARInterfaceManager;

    console.log('🛡️ Safe AR System: All classes registered globally');
}

// 모듈 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ARSystem: SafeARStub,
        ARIntegrationManager: SafeARIntegrationManager,
        ARSystemExtension: SafeARSystemExtension,
        TabNavigationGuard: SafeTabNavigationGuard,
        ARInterfaceManager: SafeARInterfaceManager
    };
}