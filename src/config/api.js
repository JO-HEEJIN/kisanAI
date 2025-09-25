// API Configuration for different environments

const getApiBaseUrl = () => {
    // Check if running in production (Vercel)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Production: Use relative path for Vercel serverless functions
        return '/api';
    } else {
        // Development: Use local proxy server
        return 'http://localhost:3001/api';
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

console.log('API Configuration:', {
    hostname: window.location.hostname,
    baseUrl: API_BASE_URL,
    environment: window.location.hostname === 'localhost' ? 'development' : 'production'
});