/**
 * NASA Farm Navigators - Service Worker
 * Enables offline functionality for 72-hour offline operation
 * Implements caching strategies for NASA data and educational content
 */

const CACHE_NAME = 'nasa-farm-navigators-v1.0';
const DATA_CACHE_NAME = 'nasa-data-cache-v1.0';
const OFFLINE_CACHE_NAME = 'offline-fallbacks-v1.0';

// Cache duration constants (in milliseconds)
const CACHE_DURATIONS = {
    STATIC_ASSETS: 7 * 24 * 60 * 60 * 1000, // 7 days
    NASA_DATA: 24 * 60 * 60 * 1000, // 24 hours for fresh data
    EDUCATIONAL_CONTENT: 7 * 24 * 60 * 60 * 1000, // 7 days
    FALLBACK_DATA: 72 * 60 * 60 * 1000 // 72 hours for offline fallbacks
};

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/core/GameEngine.js',
    '/src/data/NASADataIntegrator.js',
    '/src/data/DataCache.js',
    '/src/data/EarthdataAuth.js',
    '/src/resolution/ResolutionManager.js',
    '/src/depth/SoilDepthAnalyzer.js',
    '/src/context/FarmContextAdapter.js',
    '/src/education/EducationEngine.js',
    '/src/utils/EventSystem.js',
    '/src/data/clients/AppEEARSClient.js',
    '/src/data/clients/CropCASMAClient.js',
    '/src/data/clients/GLAMClient.js',
    '/src/data/clients/WorldviewClient.js',
    '/styles/main.css',
    '/src/main.js',
    '/assets/images/dr-vega.svg',
    '/offline.html'
];

// NASA API endpoints that should be cached for offline use
const NASA_API_PATTERNS = [
    /https:\/\/appeears\.earthdatacloud\.nasa\.gov\/api/,
    /https:\/\/smap\.jpl\.nasa\.gov\/api/,
    /https:\/\/glam1\.gsfc\.nasa\.gov/
];

// Problematic endpoints that cause CORS issues - bypass service worker
const CORS_BYPASS_PATTERNS = [
    /https:\/\/gibs\.earthdata\.nasa\.gov/,
    /https:\/\/gpm1\.gesdisc\.eosdis\.nasa\.gov/,
    /https:\/\/.*\.tile\.stamen\.com/,
    /https:\/\/.*\.tile\.openstreetmap\.org/,
    /https:\/\/cesiumjs\.org/,
    /https:\/\/ion\.cesium\.com/
];

// Educational content patterns
const EDUCATIONAL_PATTERNS = [
    /\/education\//,
    /\/tutorials\//,
    /\/lessons\//
];

self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install event');

    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(CACHE_NAME).then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),

            // Initialize offline fallback cache
            caches.open(OFFLINE_CACHE_NAME).then((cache) => {
                console.log('[ServiceWorker] Caching offline fallbacks');
                return cache.addAll([
                    '/offline.html'
                ]);
            })
        ])
    );

    // Skip waiting to activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate event');

    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME &&
                            cacheName !== DATA_CACHE_NAME &&
                            cacheName !== OFFLINE_CACHE_NAME) {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),

            // Take control of all clients
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Bypass service worker for CORS-problematic requests
    if (shouldBypassCORS(request)) {
        // Let these requests go directly through the network
        return;
    }

    // Handle different types of requests with different strategies
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isNASAAPIRequest(request)) {
        event.respondWith(handleNASAAPIRequest(request));
    } else if (isEducationalContent(request)) {
        event.respondWith(handleEducationalContent(request));
    } else if (request.mode === 'navigate') {
        event.respondWith(handleNavigation(request));
    } else {
        event.respondWith(handleOtherRequests(request));
    }
});

/**
 * Check if request is for static assets
 * @param {Request} request - Fetch request
 * @returns {boolean} True if static asset
 */
function isStaticAsset(request) {
    const url = new URL(request.url);
    return request.method === 'GET' && (
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.html')
    );
}

/**
 * Check if request is for NASA API
 * @param {Request} request - Fetch request
 * @returns {boolean} True if NASA API request
 */
function isNASAAPIRequest(request) {
    return NASA_API_PATTERNS.some(pattern => pattern.test(request.url));
}

/**
 * Check if request is for educational content
 * @param {Request} request - Fetch request
 * @returns {boolean} True if educational content
 */
function isEducationalContent(request) {
    return EDUCATIONAL_PATTERNS.some(pattern => pattern.test(request.url));
}

/**
 * Check if request should bypass service worker due to CORS issues
 * @param {Request} request - Fetch request
 * @returns {boolean} True if should bypass
 */
function shouldBypassCORS(request) {
    return CORS_BYPASS_PATTERNS.some(pattern => pattern.test(request.url));
}

/**
 * Handle static asset requests with cache-first strategy
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleStaticAsset(request) {
    try {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            // Check if cache is still fresh
            const cacheTime = await getCacheTimestamp(request.url);
            if (Date.now() - cacheTime < CACHE_DURATIONS.STATIC_ASSETS) {
                return cachedResponse;
            }
        }

        // Fetch fresh version
        const response = await fetch(request);

        if (response.ok && !request.url.startsWith('chrome-extension:')) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
            await setCacheTimestamp(request.url, Date.now());
        }

        return response;

    } catch (error) {
        console.log('[ServiceWorker] Static asset fetch failed, serving from cache:', error);
        return caches.match(request) || caches.match('/offline.html');
    }
}

/**
 * Handle NASA API requests with network-first, cache fallback strategy
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleNASAAPIRequest(request) {
    const cache = await caches.open(DATA_CACHE_NAME);

    try {
        // Try network first for fresh data
        const response = await fetch(request, {
            headers: {
                ...request.headers,
                'Cache-Control': 'no-cache'
            }
        });

        if (response.ok) {
            // Cache successful responses
            cache.put(request, response.clone());
            await setCacheTimestamp(request.url, Date.now());

            // Also store in IndexedDB for extended offline access
            await storeInIndexedDB(request.url, await response.clone().json());

            return response;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }

    } catch (error) {
        console.log('[ServiceWorker] NASA API fetch failed, trying cache:', error);

        // Try cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            const cacheTime = await getCacheTimestamp(request.url);
            if (Date.now() - cacheTime < CACHE_DURATIONS.NASA_DATA) {
                return cachedResponse;
            }
        }

        // Try IndexedDB for extended offline data
        const indexedDBData = await getFromIndexedDB(request.url);
        if (indexedDBData) {
            return new Response(JSON.stringify(indexedDBData), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fall back to synthetic data
        return generateFallbackResponse(request);
    }
}

/**
 * Handle educational content with cache-first strategy
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleEducationalContent(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;

    } catch (error) {
        console.log('[ServiceWorker] Educational content fetch failed:', error);
        return caches.match(request) || caches.match('/offline.html');
    }
}

/**
 * Handle navigation requests
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleNavigation(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        console.log('[ServiceWorker] Navigation failed, serving cached page:', error);
        return caches.match('/') || caches.match('/offline.html');
    }
}

/**
 * Handle other requests with network-first strategy
 * @param {Request} request - Fetch request
 * @returns {Promise<Response>} Response
 */
async function handleOtherRequests(request) {
    try {
        return await fetch(request);
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('Offline', { status: 503 });
    }
}

/**
 * Generate fallback response for failed NASA API requests
 * @param {Request} request - Original request
 * @returns {Promise<Response>} Fallback response
 */
async function generateFallbackResponse(request) {
    const url = new URL(request.url);

    // Determine data type from URL
    let fallbackData = null;

    if (url.href.includes('smap') || url.href.includes('moisture')) {
        fallbackData = await getFallbackSMAPData();
    } else if (url.href.includes('modis') || url.href.includes('ndvi')) {
        fallbackData = await getFallbackMODISData();
    } else if (url.href.includes('landsat')) {
        fallbackData = await getFallbackLandsatData();
    } else {
        fallbackData = {
            error: 'Data temporarily unavailable',
            offline: true,
            message: 'Using offline mode - some features may be limited'
        };
    }

    return new Response(JSON.stringify(fallbackData), {
        headers: {
            'Content-Type': 'application/json',
            'X-Offline-Response': 'true'
        }
    });
}

/**
 * Store data in IndexedDB for extended offline access
 * @param {string} url - Request URL
 * @param {Object} data - Data to store
 */
async function storeInIndexedDB(url, data) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['nasa_data'], 'readwrite');
        const store = transaction.objectStore('nasa_data');

        await store.put({
            url: url,
            data: data,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('[ServiceWorker] IndexedDB store failed:', error);
    }
}

/**
 * Retrieve data from IndexedDB
 * @param {string} url - Request URL
 * @returns {Promise<Object|null>} Stored data or null
 */
async function getFromIndexedDB(url) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['nasa_data'], 'readonly');
        const store = transaction.objectStore('nasa_data');

        const result = await store.get(url);

        if (result && Date.now() - result.timestamp < CACHE_DURATIONS.FALLBACK_DATA) {
            return result.data;
        }

        return null;

    } catch (error) {
        console.error('[ServiceWorker] IndexedDB get failed:', error);
        return null;
    }
}

/**
 * Open IndexedDB database
 * @returns {Promise<IDBDatabase>} Database instance
 */
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NASAFarmNavigatorsDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('nasa_data')) {
                const store = db.createObjectStore('nasa_data', { keyPath: 'url' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }

            if (!db.objectStoreNames.contains('cache_timestamps')) {
                db.createObjectStore('cache_timestamps', { keyPath: 'url' });
            }

            if (!db.objectStoreNames.contains('pending_requests')) {
                db.createObjectStore('pending_requests', { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get cache timestamp for URL
 * @param {string} url - URL to check
 * @returns {Promise<number>} Timestamp
 */
async function getCacheTimestamp(url) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['cache_timestamps'], 'readonly');
        const store = transaction.objectStore('cache_timestamps');
        const result = await store.get(url);
        return result ? result.timestamp : 0;
    } catch (error) {
        return 0;
    }
}

/**
 * Set cache timestamp for URL
 * @param {string} url - URL
 * @param {number} timestamp - Timestamp
 */
async function setCacheTimestamp(url, timestamp) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['cache_timestamps'], 'readwrite');
        const store = transaction.objectStore('cache_timestamps');
        await store.put({ url, timestamp });
    } catch (error) {
        console.error('[ServiceWorker] Failed to set cache timestamp:', error);
    }
}

/**
 * Get fallback SMAP data
 * @returns {Promise<Object>} Fallback SMAP data
 */
async function getFallbackSMAPData() {
    return {
        type: 'soil_moisture',
        source: 'SMAP_FALLBACK',
        offline: true,
        surface_moisture: 0.25 + Math.random() * 0.2, // 0.25-0.45
        root_zone_moisture: 0.3 + Math.random() * 0.15, // 0.3-0.45
        timestamp: new Date().toISOString(),
        educational: {
            note: 'This is simulated data for offline demonstration',
            surface_depth: '0-5cm',
            root_zone_depth: '0-100cm'
        }
    };
}

/**
 * Get fallback MODIS data
 * @returns {Promise<Object>} Fallback MODIS data
 */
async function getFallbackMODISData() {
    return {
        type: 'vegetation_index',
        source: 'MODIS_FALLBACK',
        offline: true,
        ndvi: 0.4 + Math.random() * 0.4, // 0.4-0.8
        resolution: '250m',
        timestamp: new Date().toISOString(),
        educational: {
            note: 'This is simulated data for offline demonstration',
            interpretation: 'NDVI values range from -1 to 1, with higher values indicating healthier vegetation'
        }
    };
}

/**
 * Get fallback Landsat data
 * @returns {Promise<Object>} Fallback Landsat data
 */
async function getFallbackLandsatData() {
    return {
        type: 'optical_imagery',
        source: 'LANDSAT_FALLBACK',
        offline: true,
        ndvi: 0.5 + Math.random() * 0.3, // 0.5-0.8
        resolution: '30m',
        timestamp: new Date().toISOString(),
        educational: {
            note: 'This is simulated data for offline demonstration',
            resolution_advantage: 'Landsat\'s 30m resolution allows detailed field-level analysis'
        }
    };
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
    if (event.tag === 'nasa-data-sync') {
        event.waitUntil(syncPendingRequests());
    }
});

/**
 * Sync pending requests when connection is restored
 */
async function syncPendingRequests() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['pending_requests'], 'readwrite');
        const store = transaction.objectStore('pending_requests');

        const requests = await store.getAll();

        for (const request of requests) {
            try {
                const response = await fetch(request.url, request.options);
                if (response.ok) {
                    // Cache the fresh data
                    const cache = await caches.open(DATA_CACHE_NAME);
                    cache.put(request.url, response.clone());

                    // Remove from pending
                    await store.delete(request.id);
                }
            } catch (error) {
                console.log('[ServiceWorker] Sync failed for:', request.url);
            }
        }

    } catch (error) {
        console.error('[ServiceWorker] Background sync failed:', error);
    }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data && event.data.type === 'CACHE_NASA_DATA') {
        event.waitUntil(preloadNASAData(event.data.urls));
    } else if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(clearOldCache());
    }
});

/**
 * Preload NASA data URLs into cache
 * @param {Array} urls - URLs to preload
 */
async function preloadNASAData(urls) {
    const cache = await caches.open(DATA_CACHE_NAME);

    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                await setCacheTimestamp(url, Date.now());
            }
        } catch (error) {
            console.log('[ServiceWorker] Preload failed for:', url);
        }
    }
}

/**
 * Clear old cache entries
 */
async function clearOldCache() {
    const now = Date.now();

    // Clear expired static assets
    const staticCache = await caches.open(CACHE_NAME);
    const staticRequests = await staticCache.keys();

    for (const request of staticRequests) {
        const cacheTime = await getCacheTimestamp(request.url);
        if (now - cacheTime > CACHE_DURATIONS.STATIC_ASSETS) {
            await staticCache.delete(request);
        }
    }

    // Clear expired NASA data
    const dataCache = await caches.open(DATA_CACHE_NAME);
    const dataRequests = await dataCache.keys();

    for (const request of dataRequests) {
        const cacheTime = await getCacheTimestamp(request.url);
        if (now - cacheTime > CACHE_DURATIONS.NASA_DATA) {
            await dataCache.delete(request);
        }
    }
}

console.log('[ServiceWorker] NASA Farm Navigators Service Worker loaded and ready for 72-hour offline operation');