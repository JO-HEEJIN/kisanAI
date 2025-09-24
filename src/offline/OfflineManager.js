/**
 * Offline Manager for NASA Farm Navigators
 * Comprehensive offline capabilities for mobile-first farming solutions
 */

class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.cacheVersion = 'nasa-farm-navigators-v2.1';
        this.criticalCaches = {
            static: `${this.cacheVersion}-static`,
            dynamic: `${this.cacheVersion}-dynamic`,
            nasaData: `${this.cacheVersion}-nasa-data`,
            userData: `${this.cacheVersion}-user-data`
        };

        this.offlineQueue = [];
        this.syncInProgress = false;
        this.lastSyncTime = null;
        this.offlineMode = false;

        // Critical offline data storage
        this.offlineData = {
            farmProfiles: [],
            cropData: [],
            weatherCache: [],
            satelliteCache: [],
            recommendations: [],
            achievements: [],
            settings: {}
        };

        this.initializeOfflineCapabilities();
    }

    /**
     * Initialize comprehensive offline capabilities
     */
    async initializeOfflineCapabilities() {
        try {
            // Register service worker if available
            if ('serviceWorker' in navigator) {
                await this.registerServiceWorker();
            }

            // Initialize IndexedDB for complex data storage
            await this.initializeIndexedDB();

            // Load cached data
            await this.loadOfflineData();

            // Set up connection monitoring
            this.setupConnectionMonitoring();

            // Set up background sync if supported
            this.setupBackgroundSync();

            // Pre-cache critical resources
            await this.preCacheCriticalResources();

            console.log('🔄 Offline Manager initialized successfully');

        } catch (error) {
            console.error('Failed to initialize offline capabilities:', error);
            this.handleOfflineInitializationError(error);
        }
    }

    /**
     * Register service worker for offline functionality
     */
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('📱 Service Worker registered:', registration.scope);

            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateAvailableNotification();
                    }
                });
            });

            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }

    /**
     * Initialize IndexedDB for complex offline data storage
     */
    async initializeIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('NASAFarmNavigators', 3);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.db = request.result;
                console.log('📦 IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores for different data types
                const stores = [
                    'farmProfiles',
                    'cropData',
                    'weatherCache',
                    'satelliteCache',
                    'recommendations',
                    'achievements',
                    'offlineQueue',
                    'settings'
                ];

                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });

                        // Add indexes for common queries
                        if (storeName === 'farmProfiles') {
                            store.createIndex('userId', 'userId', { unique: false });
                            store.createIndex('location', 'location', { unique: false });
                        } else if (storeName === 'satelliteCache') {
                            store.createIndex('coordinates', 'coordinates', { unique: false });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                        } else if (storeName === 'weatherCache') {
                            store.createIndex('location', 'location', { unique: false });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                        }
                    }
                });
            };
        });
    }

    /**
     * Pre-cache critical resources for offline use
     */
    async preCacheCriticalResources() {
        try {
            const cache = await caches.open(this.criticalCaches.static);

            const criticalResources = [
                '/',
                '/index.html',
                '/styles/main.css',
                '/styles/farm-game.css',
                '/styles/roi-calculator.css',
                '/styles/climate-risk.css',
                '/src/app.js',
                '/src/analytics/ROICalculator.js',
                '/src/climate/ClimateRiskAssessment.js',
                '/src/offline/OfflineManager.js',
                '/assets/data/logo.png',
                '/manifest.json',
                // Critical crop data
                '/data/crops/wheat.json',
                '/data/crops/rice.json',
                '/data/crops/corn.json',
                // Offline fallback pages
                '/offline.html'
            ];

            // Cache critical resources
            await Promise.allSettled(
                criticalResources.map(resource =>
                    cache.add(resource).catch(err =>
                        console.warn(`Failed to cache ${resource}:`, err)
                    )
                )
            );

            console.log('📥 Critical resources pre-cached for offline use');

        } catch (error) {
            console.warn('Failed to pre-cache resources:', error);
        }
    }

    /**
     * Cache NASA satellite data for offline access
     */
    async cacheNASAData(location, data, dataType = 'general') {
        try {
            const cacheKey = `${dataType}-${location.lat}-${location.lon}-${Date.now()}`;

            // Store in IndexedDB
            await this.storeInIndexedDB('satelliteCache', {
                id: cacheKey,
                coordinates: `${location.lat},${location.lon}`,
                dataType,
                data,
                timestamp: Date.now(),
                quality: data.quality || 'cached'
            });

            // Also store in Cache API for quick access
            const cache = await caches.open(this.criticalCaches.nasaData);
            await cache.put(
                `/cache/nasa/${cacheKey}`,
                new Response(JSON.stringify(data), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'max-age=86400' // 24 hours
                    }
                })
            );

            console.log(`🛰️ NASA data cached: ${dataType} for ${location.lat}, ${location.lon}`);

        } catch (error) {
            console.error('Failed to cache NASA data:', error);
        }
    }

    /**
     * Retrieve cached NASA data when offline
     */
    async getCachedNASAData(location, dataType = 'general') {
        try {
            // First try IndexedDB for most recent data
            const cachedData = await this.getFromIndexedDB('satelliteCache', 'coordinates', `${location.lat},${location.lon}`);

            if (cachedData && cachedData.length > 0) {
                // Filter by data type and get most recent
                const filtered = cachedData
                    .filter(item => item.dataType === dataType)
                    .sort((a, b) => b.timestamp - a.timestamp);

                if (filtered.length > 0) {
                    const mostRecent = filtered[0];
                    // Check if data is still valid (within 24 hours for most data)
                    const maxAge = dataType === 'weather' ? 3600000 : 86400000; // 1 hour for weather, 24 hours for satellite

                    if (Date.now() - mostRecent.timestamp < maxAge) {
                        console.log(`📡 Retrieved cached NASA data: ${dataType}`);
                        return {
                            ...mostRecent.data,
                            cached: true,
                            cacheAge: Date.now() - mostRecent.timestamp
                        };
                    }
                }
            }

            // Fallback to reasonable estimates based on location
            return this.generateOfflineFallbackData(location, dataType);

        } catch (error) {
            console.error('Failed to retrieve cached NASA data:', error);
            return this.generateOfflineFallbackData(location, dataType);
        }
    }

    /**
     * Generate reasonable offline fallback data based on location
     */
    generateOfflineFallbackData(location, dataType) {
        const { lat, lon } = location;

        // Climate-based estimates
        const isNorthern = lat > 23.5;
        const isTropical = Math.abs(lat) < 23.5;
        const isCoastal = Math.abs(lon) % 30 < 5; // Rough coastal approximation

        switch (dataType) {
            case 'smap':
                return {
                    soilMoisture: isTropical ? 0.4 : isNorthern ? 0.25 : 0.35,
                    quality: 'estimated',
                    source: 'Offline Climate Model',
                    cached: true,
                    note: 'Estimated from geographic patterns'
                };

            case 'modis':
                return {
                    ndvi: isTropical ? 0.7 : isNorthern ? 0.5 : 0.6,
                    evi: isTropical ? 0.6 : isNorthern ? 0.4 : 0.5,
                    quality: 'estimated',
                    source: 'Offline Vegetation Model',
                    cached: true
                };

            case 'weather':
                const baseTemp = 15 + Math.sin(lat * Math.PI / 180) * 20;
                return {
                    temperature: baseTemp + (Math.random() - 0.5) * 10,
                    humidity: isCoastal ? 70 + Math.random() * 20 : 50 + Math.random() * 30,
                    precipitation: isTropical ? 150 : isNorthern ? 50 : 80,
                    quality: 'estimated',
                    source: 'Offline Weather Model',
                    cached: true
                };

            default:
                return {
                    message: 'Offline data not available',
                    quality: 'unavailable',
                    cached: true
                };
        }
    }

    /**
     * Store data in IndexedDB
     */
    async storeInIndexedDB(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Retrieve data from IndexedDB
     */
    async getFromIndexedDB(storeName, indexName = null, value = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);

            let request;
            if (indexName && value) {
                const index = store.index(indexName);
                request = index.getAll(value);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Set up connection monitoring
     */
    setupConnectionMonitoring() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.offlineMode = false;
            console.log('🌐 Connection restored - initiating sync');
            this.syncOfflineData();
            this.showConnectionStatus('online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.offlineMode = true;
            console.log('📴 Connection lost - switching to offline mode');
            this.showConnectionStatus('offline');
        });

        // Periodic connection testing
        setInterval(() => {
            this.testConnection();
        }, 30000); // Test every 30 seconds
    }

    /**
     * Test actual internet connectivity
     */
    async testConnection() {
        try {
            const response = await fetch('/api/health', {
                method: 'HEAD',
                cache: 'no-store',
                timeout: 5000
            });

            if (response.ok && !this.isOnline) {
                this.isOnline = true;
                this.offlineMode = false;
                this.syncOfflineData();
            }
        } catch (error) {
            if (this.isOnline) {
                this.isOnline = false;
                this.offlineMode = true;
                this.showConnectionStatus('offline');
            }
        }
    }

    /**
     * Set up background sync for when connection is restored
     */
    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                return registration.sync.register('background-sync');
            });
        }
    }

    /**
     * Queue operations for when back online
     */
    queueOfflineOperation(operation) {
        this.offlineQueue.push({
            ...operation,
            timestamp: Date.now(),
            id: Date.now() + Math.random()
        });

        // Store in IndexedDB as well
        this.storeInIndexedDB('offlineQueue', {
            id: operation.id,
            operation: operation,
            timestamp: Date.now()
        });

        console.log(`📋 Queued offline operation: ${operation.type}`);
    }

    /**
     * Sync offline data when connection is restored
     */
    async syncOfflineData() {
        if (this.syncInProgress || !this.isOnline) {
            return;
        }

        this.syncInProgress = true;
        console.log('🔄 Starting offline data sync...');

        try {
            // Get queued operations
            const queuedOps = await this.getFromIndexedDB('offlineQueue');

            if (queuedOps.length === 0) {
                console.log('✅ No queued operations to sync');
                this.syncInProgress = false;
                return;
            }

            // Process queued operations
            const results = await Promise.allSettled(
                queuedOps.map(item => this.processQueuedOperation(item.operation))
            );

            // Clear processed operations
            await this.clearProcessedOperations(queuedOps);

            // Update last sync time
            this.lastSyncTime = Date.now();
            await this.storeInIndexedDB('settings', {
                id: 'lastSync',
                value: this.lastSyncTime
            });

            console.log(`✅ Sync completed: ${results.length} operations processed`);
            this.showSyncStatus('completed');

        } catch (error) {
            console.error('Sync failed:', error);
            this.showSyncStatus('failed');
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Process a queued operation
     */
    async processQueuedOperation(operation) {
        switch (operation.type) {
            case 'farmProfile':
                return await this.syncFarmProfile(operation.data);
            case 'cropData':
                return await this.syncCropData(operation.data);
            case 'achievement':
                return await this.syncAchievement(operation.data);
            case 'feedback':
                return await this.syncFeedback(operation.data);
            default:
                console.warn(`Unknown operation type: ${operation.type}`);
                return false;
        }
    }

    /**
     * Load offline data on startup
     */
    async loadOfflineData() {
        try {
            // Load each data type from IndexedDB
            this.offlineData.farmProfiles = await this.getFromIndexedDB('farmProfiles');
            this.offlineData.cropData = await this.getFromIndexedDB('cropData');
            this.offlineData.achievements = await this.getFromIndexedDB('achievements');
            this.offlineData.settings = await this.getFromIndexedDB('settings');

            console.log('📂 Offline data loaded successfully');
        } catch (error) {
            console.error('Failed to load offline data:', error);
        }
    }

    /**
     * Save farm profile for offline use
     */
    async saveOfflineFarmProfile(profile) {
        try {
            await this.storeInIndexedDB('farmProfiles', {
                ...profile,
                lastModified: Date.now(),
                offlineId: `farm_${Date.now()}`
            });

            if (!this.isOnline) {
                this.queueOfflineOperation({
                    type: 'farmProfile',
                    data: profile
                });
            }

            console.log('🏡 Farm profile saved for offline use');
        } catch (error) {
            console.error('Failed to save farm profile offline:', error);
        }
    }

    /**
     * Enable/disable offline mode manually
     */
    setOfflineMode(enabled) {
        this.offlineMode = enabled;
        if (enabled) {
            console.log('📴 Manual offline mode enabled');
            this.showConnectionStatus('offline-manual');
        } else {
            console.log('🌐 Manual offline mode disabled');
            if (this.isOnline) {
                this.showConnectionStatus('online');
            }
        }
    }

    /**
     * Show connection status to user
     */
    showConnectionStatus(status) {
        // Disabled - no connection status indicator
        console.log(`Connection status: ${status}`);
    }

    /**
     * Show sync status
     */
    showSyncStatus(status) {
        // Show temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            color: white;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;

        switch (status) {
            case 'completed':
                notification.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
                notification.innerHTML = '✅ Data synced successfully';
                break;
            case 'failed':
                notification.style.background = 'linear-gradient(90deg, #dc3545, #c82333)';
                notification.innerHTML = '❌ Sync failed - will retry later';
                break;
        }

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    /**
     * Show update available notification
     */
    showUpdateAvailableNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">🚀 Update Available</h3>
            <p style="margin: 0 0 15px 0;">A new version of Farm Navigators is available!</p>
            <button onclick="window.location.reload()" style="
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                margin-right: 10px;
            ">Update Now</button>
            <button onclick="this.parentElement.remove()" style="
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
            ">Later</button>
        `;

        document.body.appendChild(notification);
    }

    /**
     * Handle offline initialization errors gracefully
     */
    handleOfflineInitializationError(error) {
        console.warn('Offline capabilities limited due to:', error.message);

        // Fallback to localStorage for basic offline functionality
        this.useFallbackStorage = true;

        // Show user-friendly message
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(90deg, #ffc107, #e0a800);
            color: #333;
            padding: 15px;
            border-radius: 10px;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;

        notification.innerHTML = `
            <strong>⚠️ Limited Offline Mode</strong><br>
            Some offline features may be unavailable. App will still work with basic caching.
            <button onclick="this.parentElement.remove()" style="
                float: right;
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                margin: -5px 0 0 10px;
            ">×</button>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 10000);
    }

    /**
     * Clear processed operations from queue
     */
    async clearProcessedOperations(operations) {
        const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
        const store = transaction.objectStore('offlineQueue');

        for (const op of operations) {
            await store.delete(op.id);
        }
    }

    /**
     * Get offline capability status
     */
    getOfflineStatus() {
        return {
            isOnline: this.isOnline,
            offlineMode: this.offlineMode,
            lastSyncTime: this.lastSyncTime,
            queuedOperations: this.offlineQueue.length,
            serviceWorkerReady: 'serviceWorker' in navigator,
            indexedDBReady: !!this.db,
            cacheSupported: 'caches' in window
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineManager;
} else if (typeof window !== 'undefined') {
    window.OfflineManager = OfflineManager;
}