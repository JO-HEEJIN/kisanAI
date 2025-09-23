/**
 * NASA Farm Navigators - Event System
 * Centralized event management for the application
 */

class EventSystem {
    constructor() {
        // Singleton pattern
        if (EventSystem.instance) {
            return EventSystem.instance;
        }

        this.listeners = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 1000;

        EventSystem.instance = this;
    }

    /**
     * Get the singleton instance
     * @returns {EventSystem} The EventSystem instance
     */
    static getInstance() {
        if (!EventSystem.instance) {
            EventSystem.instance = new EventSystem();
        }
        return EventSystem.instance;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @param {Object} options - Options (once, priority)
     */
    on(event, callback, options = {}) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0,
            id: Math.random().toString(36).substr(2, 9)
        };

        const listeners = this.listeners.get(event);
        listeners.push(listener);

        // Sort by priority (higher priority first)
        listeners.sort((a, b) => b.priority - a.priority);

        return listener.id;
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     */
    once(event, callback) {
        return this.on(event, callback, { once: true });
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {string|Function} callbackOrId - Callback function or listener ID
     */
    off(event, callbackOrId) {
        if (!this.listeners.has(event)) return false;

        const listeners = this.listeners.get(event);
        let index = -1;

        if (typeof callbackOrId === 'string') {
            // Remove by ID
            index = listeners.findIndex(listener => listener.id === callbackOrId);
        } else {
            // Remove by callback function
            index = listeners.findIndex(listener => listener.callback === callbackOrId);
        }

        if (index > -1) {
            listeners.splice(index, 1);
            return true;
        }

        return false;
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data = {}) {
        // Add to event history
        this.addToHistory(event, data);

        if (!this.listeners.has(event)) return 0;

        const listeners = this.listeners.get(event);
        const toRemove = [];
        let count = 0;

        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];

            try {
                listener.callback(data, event);
                count++;

                if (listener.once) {
                    toRemove.push(i);
                }
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        }

        // Remove one-time listeners (in reverse order to maintain indices)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            listeners.splice(toRemove[i], 1);
        }

        return count;
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get all event names that have listeners
     * @returns {string[]} Array of event names
     */
    getEventNames() {
        return Array.from(this.listeners.keys());
    }

    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        return this.listeners.has(event) ? this.listeners.get(event).length : 0;
    }

    /**
     * Add event to history
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    addToHistory(event, data) {
        this.eventHistory.push({
            event,
            data,
            timestamp: Date.now()
        });

        // Limit history size
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * Get event history
     * @param {string} event - Optional event filter
     * @param {number} limit - Optional limit
     * @returns {Array} Event history
     */
    getHistory(event = null, limit = 100) {
        let history = this.eventHistory;

        if (event) {
            history = history.filter(entry => entry.event === event);
        }

        return history.slice(-limit);
    }

    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }

    /**
     * Create a promise that resolves when an event is emitted
     * @param {string} event - Event name
     * @param {number} timeout - Optional timeout in ms
     * @returns {Promise} Promise that resolves with event data
     */
    waitFor(event, timeout = null) {
        return new Promise((resolve, reject) => {
            let timeoutId = null;

            const listenerId = this.once(event, (data) => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(data);
            });

            if (timeout) {
                timeoutId = setTimeout(() => {
                    this.off(event, listenerId);
                    reject(new Error(`Event ${event} timeout after ${timeout}ms`));
                }, timeout);
            }
        });
    }

    /**
     * Create an event emitter for a specific namespace
     * @param {string} namespace - Namespace prefix
     * @returns {Object} Namespaced event emitter
     */
    namespace(namespace) {
        return {
            on: (event, callback, options) => this.on(`${namespace}:${event}`, callback, options),
            once: (event, callback) => this.once(`${namespace}:${event}`, callback),
            off: (event, callbackOrId) => this.off(`${namespace}:${event}`, callbackOrId),
            emit: (event, data) => this.emit(`${namespace}:${event}`, data),
            waitFor: (event, timeout) => this.waitFor(`${namespace}:${event}`, timeout)
        };
    }

    /**
     * Get debugging information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        const info = {
            totalEvents: this.listeners.size,
            totalListeners: 0,
            eventBreakdown: {},
            recentEvents: this.getHistory(null, 10)
        };

        for (const [event, listeners] of this.listeners.entries()) {
            info.totalListeners += listeners.length;
            info.eventBreakdown[event] = listeners.length;
        }

        return info;
    }
}

export { EventSystem };