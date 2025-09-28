// API Configuration for different environments

const getApiBaseUrl = () => {
    // Check if running in production (Vercel)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Production: Use relative path for Vercel serverless functions
        return '/api';
    } else {
        // Development: Use local proxy server with protocol detection
        const isHTTPS = window.location.protocol === 'https:';
        const port = isHTTPS ? '3444' : '3001';
        const protocol = isHTTPS ? 'https' : 'http';

        console.log(`🔗 API Base URL: Using ${protocol} on port ${port} (WebXR mode: ${isHTTPS})`);
        return `${protocol}://localhost:${port}/api`;
    }
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
    SMAP_SOIL: `${API_BASE_URL}/smap/soil-moisture`,
    MODIS_NDVI: `${API_BASE_URL}/modis/ndvi`,
    ECOSTRESS_TEMP: `${API_BASE_URL}/ecostress/temperature`,
    GPM_PRECIPITATION: `${API_BASE_URL}/gpm/precipitation`,
    LANDSAT_IMAGERY: `${API_BASE_URL}/landsat/imagery`,
    POWER_WEATHER: `${API_BASE_URL}/power/weather`,
    AI_QUERY: `${API_BASE_URL}/ai-query`
};

// Utility function to get API URL for any endpoint
export const getApiUrl = (endpoint) => {
    return `${API_BASE_URL}/${endpoint}`;
};

// Utility function for WebXR compatibility
export const getNASAApiUrl = (endpoint, params = {}) => {
    const isHTTPS = window.location.protocol === 'https:';
    const port = isHTTPS ? '3444' : '3001';
    const protocol = isHTTPS ? 'https' : 'http';

    const queryString = Object.keys(params).length > 0 ?
        '?' + Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&') : '';

    return `${protocol}://localhost:${port}/api/${endpoint}${queryString}`;
};

console.log('API Configuration:', {
    hostname: window.location.hostname,
    baseUrl: API_BASE_URL,
    environment: window.location.hostname === 'localhost' ? 'development' : 'production'
});