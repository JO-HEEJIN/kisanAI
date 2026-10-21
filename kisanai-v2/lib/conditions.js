/**
 * Real field conditions for a location from Open-Meteo (free, no API key).
 * Soil moisture comes from the ECMWF/ICON land models, rain and evapotranspiration
 * from the weather forecast. Nothing here is random or made up.
 */

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = 3;

function isValidLocation(lat, lon) {
    return Number.isFinite(lat) && Number.isFinite(lon) &&
        lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function buildUrl(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        current: 'temperature_2m',
        hourly: 'soil_moisture_3_to_9cm,soil_moisture_9_to_27cm',
        daily: 'precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,temperature_2m_max',
        forecast_days: String(FORECAST_DAYS),
        timezone: 'auto'
    });
    return `${OPEN_METEO_URL}?${params}`;
}

// Turns the raw Open-Meteo response into the small shape the app uses.
function parseResponse(data) {
    const currentHour = String(data.current.time).slice(0, 13); // "2026-10-21T14"
    const index = data.hourly.time.findIndex(t => t.startsWith(currentHour));
    if (index === -1) {
        throw new Error('Current hour missing from soil moisture data');
    }

    const shallow = data.hourly.soil_moisture_3_to_9cm[index];
    const deep = data.hourly.soil_moisture_9_to_27cm[index];
    if (!Number.isFinite(shallow) || !Number.isFinite(deep)) {
        throw new Error('No soil moisture data for this location');
    }

    const days = data.daily.time.map((date, i) => ({
        date,
        rainMm: data.daily.precipitation_sum[i] ?? 0,
        rainChance: data.daily.precipitation_probability_max[i] ?? 0,
        et0Mm: data.daily.et0_fao_evapotranspiration[i] ?? 0,
        maxTempC: data.daily.temperature_2m_max[i]
    }));

    return {
        // Root zone (3-27 cm) volumetric water content, m³/m³.
        soilMoisture: Number(((shallow + deep) / 2).toFixed(3)),
        temperatureC: data.current.temperature_2m,
        days,
        observedAt: data.current.time,
        source: 'Open-Meteo (ECMWF / DWD ICON land models)'
    };
}

async function fetchConditions(lat, lon, { fetchFn = fetch } = {}) {
    const response = await fetchFn(buildUrl(lat, lon), { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
        throw new Error(`Open-Meteo returned ${response.status}`);
    }
    return parseResponse(await response.json());
}

module.exports = { fetchConditions, parseResponse, buildUrl, isValidLocation };
