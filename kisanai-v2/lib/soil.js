/**
 * Topsoil estimate from ISRIC SoilGrids (free, no key, 250 m global soil map).
 * Only used to pre-fill the form: the farmer knows their field better and can change it.
 * Returns null when the service is down or has no data (e.g. water, cities).
 */

const SOILGRIDS_URL = 'https://rest.isric.org/soilgrids/v2.0/properties/query';
const DEPTH = '5-15cm';

function buildUrl(lat, lon) {
    const params = new URLSearchParams({ lat: lat.toFixed(4), lon: lon.toFixed(4), depth: DEPTH, value: 'mean' });
    for (const p of ['clay', 'sand', 'phh2o', 'soc']) params.append('property', p);
    return `${SOILGRIDS_URL}?${params}`;
}

// Simple 3-way texture classes, enough to change water and crop choices.
function textureClass(sandPct, clayPct) {
    if (clayPct >= 35) return 'clay';
    if (sandPct >= 60 && clayPct < 20) return 'sandy';
    return 'loam';
}

// Soil organic carbon in g/kg (1% = 10 g/kg).
function organicMatterClass(socGPerKg) {
    if (socGPerKg < 10) return 'low';
    if (socGPerKg < 20) return 'medium';
    return 'high';
}

function parseResponse(data) {
    const values = {};
    for (const layer of data.properties?.layers || []) {
        const depth = layer.depths.find(d => d.label === DEPTH);
        const raw = depth?.values?.mean;
        if (!Number.isFinite(raw)) return null;
        values[layer.name] = raw / (layer.unit_measure?.d_factor || 1);
    }
    if (!['clay', 'sand', 'phh2o', 'soc'].every(k => Number.isFinite(values[k]))) return null;
    // SoilGrids gives clay and sand in g/kg / 10 = %, pH x10 / 10, soc in dg/kg / 10 = g/kg.
    return {
        texture: textureClass(values.sand, values.clay),
        organicMatter: organicMatterClass(values.soc),
        ph: Math.round(values.phh2o * 10) / 10,
        source: 'soilgrids'
    };
}

async function fetchSoil(lat, lon, { fetchFn = fetch } = {}) {
    try {
        const response = await fetchFn(buildUrl(lat, lon), { signal: AbortSignal.timeout(8000) });
        if (!response.ok) return null;
        return parseResponse(await response.json());
    } catch (error) {
        console.error('SoilGrids failed:', error.message);
        return null;
    }
}

module.exports = { fetchSoil, parseResponse, textureClass, organicMatterClass, buildUrl };
