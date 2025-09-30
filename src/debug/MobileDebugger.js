/**
 * MobileDebugger.js - On-screen console for mobile debugging
 * Shows logs directly on the screen for mobile devices
 */

class MobileDebugger {
    constructor() {
        this.debugPanel = null;
        this.logs = [];
        this.maxLogs = 20;
        this.isVisible = false;
    }

    // Initialize debug panel
    init() {
        // Create debug panel
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'mobile-debug-panel';
        this.debugPanel.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-height: 40vh;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: monospace;
            font-size: 11px;
            padding: 10px;
            overflow-y: auto;
            z-index: 999999;
            border-top: 2px solid #00ff00;
            display: none;
        `;

        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'debug-toggle';
        toggleBtn.textContent = '🐛 Debug';
        toggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.8);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            z-index: 999998;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        `;

        toggleBtn.addEventListener('click', () => this.toggle());

        // Add to page
        document.body.appendChild(this.debugPanel);
        document.body.appendChild(toggleBtn);

        // Override console methods
        this.overrideConsole();

        this.log('📱 Mobile Debugger initialized');
        this.log(`User Agent: ${navigator.userAgent}`);
        this.log(`Screen: ${window.innerWidth}x${window.innerHeight}`);
        this.log(`HTTPS: ${window.location.protocol === 'https:'}`);
    }

    // Override console methods
    overrideConsole() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            originalLog(...args);
            this.log('📝 ' + args.join(' '));
        };

        console.error = (...args) => {
            originalError(...args);
            this.log('❌ ' + args.join(' '), 'error');
        };

        console.warn = (...args) => {
            originalWarn(...args);
            this.log('⚠️ ' + args.join(' '), 'warning');
        };

        // Capture errors
        window.addEventListener('error', (event) => {
            this.log(`❌ Error: ${event.message} at ${event.filename}:${event.lineno}`, 'error');
        });

        // Capture promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.log(`❌ Promise rejected: ${event.reason}`, 'error');
        });
    }

    // Add log entry
    log(message, type = 'log') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message,
            type
        };

        this.logs.push(logEntry);

        // Keep only last N logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.updateDisplay();
    }

    // Update display
    updateDisplay() {
        if (!this.debugPanel) return;

        const html = this.logs.map(log => {
            let color = '#00ff00';
            if (log.type === 'error') color = '#ff0000';
            if (log.type === 'warning') color = '#ffff00';

            return `<div style="color: ${color}; margin: 2px 0; word-wrap: break-word;">
                [${log.timestamp}] ${this.escapeHtml(log.message)}
            </div>`;
        }).join('');

        this.debugPanel.innerHTML = html;

        // Auto-scroll to bottom
        this.debugPanel.scrollTop = this.debugPanel.scrollHeight;
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    // Toggle visibility
    toggle() {
        this.isVisible = !this.isVisible;
        this.debugPanel.style.display = this.isVisible ? 'block' : 'none';

        const toggleBtn = document.getElementById('debug-toggle');
        if (toggleBtn) {
            toggleBtn.style.background = this.isVisible ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        }
    }

    // Clear logs
    clear() {
        this.logs = [];
        this.updateDisplay();
    }
}

// Create and initialize global debugger
window.mobileDebugger = new MobileDebugger();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileDebugger.init();
    });
} else {
    window.mobileDebugger.init();
}

console.log('MobileDebugger.js loaded');