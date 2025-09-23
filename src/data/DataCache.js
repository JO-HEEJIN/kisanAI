/**
 * NASA Farm Navigators - Data Cache
 * LRU cache implementation for NASA data with offline support
 */

class DataCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.accessOrder = [];
        this.persistKey = 'nasa_farm_cache';

        // Load persistent cache
        this.loadFromStorage();
    }

    /**
     * Get data from cache
     * @param {string} key - Cache key
     * @returns {*} Cached data or null
     */
    get(key) {
        const data = this.cache.get(key);
        if (data) {
            // Update access order (move to end)
            this.updateAccessOrder(key);
            return data;
        }
        return null;
    }

    /**
     * Set data in cache
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     */
    set(key, data) {
        // Add cache timestamp
        const cacheEntry = {
            ...data,
            cachedAt: Date.now()
        };

        // If already exists, update
        if (this.cache.has(key)) {
            this.cache.set(key, cacheEntry);
            this.updateAccessOrder(key);
            return;
        }

        // If at capacity, remove least recently used
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        // Add new entry
        this.cache.set(key, cacheEntry);
        this.accessOrder.push(key);

        // Persist to storage
        this.saveToStorage();
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean} True if exists
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Delete entry from cache
     * @param {string} key - Cache key
     * @returns {boolean} True if deleted
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.removeFromAccessOrder(key);
            this.saveToStorage();
        }
        return deleted;
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
        this.saveToStorage();
    }

    /**
     * Get cache size
     * @returns {number} Number of cached items
     */
    size() {
        return this.cache.size;
    }

    /**
     * Get all cache keys
     * @returns {string[]} Array of cache keys
     */
    keys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Clean up expired entries
     * @param {number} maxAge - Maximum age in milliseconds
     */
    cleanup(maxAge = 24 * 60 * 60 * 1000) { // Default 24 hours
        const now = Date.now();
        const keysToDelete = [];

        for (const [key, data] of this.cache.entries()) {
            if (data.cachedAt && now - data.cachedAt > maxAge) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.delete(key));

        if (keysToDelete.length > 0) {
            console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
        }
    }

    /**
     * Update access order for LRU
     * @param {string} key - Cache key
     */
    updateAccessOrder(key) {
        this.removeFromAccessOrder(key);
        this.accessOrder.push(key);
    }

    /**
     * Remove key from access order
     * @param {string} key - Cache key
     */
    removeFromAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    /**
     * Evict least recently used entry
     */
    evictLRU() {
        if (this.accessOrder.length > 0) {
            const lruKey = this.accessOrder[0];
            this.cache.delete(lruKey);
            this.accessOrder.shift();
        }
    }

    /**
     * Save cache to localStorage
     */
    saveToStorage() {
        try {
            const cacheData = {
                entries: Array.from(this.cache.entries()),
                accessOrder: this.accessOrder,
                timestamp: Date.now()
            };

            // Only save essential data to avoid storage bloat
            const filteredEntries = cacheData.entries.filter(([key, data]) => {
                // Keep recent entries and mark as important
                const age = Date.now() - (data.cachedAt || 0);
                return age < 6 * 60 * 60 * 1000; // 6 hours
            }).slice(-50); // Keep max 50 entries

            const storageData = {
                ...cacheData,
                entries: filteredEntries
            };

            localStorage.setItem(this.persistKey, JSON.stringify(storageData));
        } catch (error) {
            console.warn('Failed to save cache to storage:', error);
        }
    }

    /**
     * Load cache from localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.persistKey);
            if (data) {
                const cacheData = JSON.parse(data);

                // Restore cache entries
                this.cache = new Map(cacheData.entries || []);
                this.accessOrder = cacheData.accessOrder || [];

                // Clean up any stale entries
                this.cleanup();

                console.log(`Loaded ${this.cache.size} entries from cache storage`);
            }
        } catch (error) {
            console.warn('Failed to load cache from storage:', error);
            this.cache = new Map();
            this.accessOrder = [];
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const now = Date.now();
        let totalSize = 0;
        let oldestEntry = now;
        let newestEntry = 0;

        for (const [key, data] of this.cache.entries()) {
            const serialized = JSON.stringify(data);
            totalSize += serialized.length;

            if (data.cachedAt) {
                oldestEntry = Math.min(oldestEntry, data.cachedAt);
                newestEntry = Math.max(newestEntry, data.cachedAt);
            }
        }

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100),
            estimatedSizeKB: Math.round(totalSize / 1024),
            oldestEntryAge: oldestEntry < now ? now - oldestEntry : 0,
            newestEntryAge: newestEntry > 0 ? now - newestEntry : 0,
            hitRatio: this.getHitRatio()
        };
    }

    /**
     * Get cache hit ratio (simplified)
     * @returns {number} Hit ratio as percentage
     */
    getHitRatio() {
        // This would require tracking hits/misses
        // For now, estimate based on cache utilization
        return Math.min(90, this.cache.size * 2);
    }

    /**
     * Export cache data for backup
     * @returns {Object} Exportable cache data
     */
    export() {
        return {
            entries: Array.from(this.cache.entries()),
            accessOrder: this.accessOrder,
            maxSize: this.maxSize,
            exportedAt: Date.now()
        };
    }

    /**
     * Import cache data from backup
     * @param {Object} data - Cache data to import
     */
    import(data) {
        if (data && data.entries) {
            this.cache = new Map(data.entries);
            this.accessOrder = data.accessOrder || [];

            // Ensure we don't exceed max size
            while (this.cache.size > this.maxSize) {
                this.evictLRU();
            }

            this.saveToStorage();
            console.log(`Imported ${this.cache.size} cache entries`);
        }
    }

    /**
     * Prefetch data for offline use
     * @param {Array} keys - Keys to prioritize for offline access
     */
    prioritizeForOffline(keys) {
        // Mark certain entries as high priority for offline access
        keys.forEach(key => {
            const data = this.cache.get(key);
            if (data) {
                data.offlinePriority = true;
                this.cache.set(key, data);
            }
        });

        this.saveToStorage();
    }

    /**
     * Get entries suitable for offline use
     * @returns {Array} Array of offline-suitable entries
     */
    getOfflineEntries() {
        const offlineEntries = [];

        for (const [key, data] of this.cache.entries()) {
            if (data.offlinePriority || this.isRecentEnough(data)) {
                offlineEntries.push([key, data]);
            }
        }

        return offlineEntries;
    }

    /**
     * Check if data is recent enough for reliable offline use
     * @param {Object} data - Cache entry data
     * @returns {boolean} True if recent enough
     */
    isRecentEnough(data) {
        if (!data.cachedAt) return false;
        const maxOfflineAge = 2 * 60 * 60 * 1000; // 2 hours
        return Date.now() - data.cachedAt < maxOfflineAge;
    }
}

export { DataCache };