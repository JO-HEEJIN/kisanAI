// Shape of a real Open-Meteo /v1/forecast response (trimmed to 3 days x 3 hours).
function openMeteoResponse({ shallow = 0.25, deep = 0.27, rain = [0, 0, 0], et0 = [4, 4, 4] } = {}) {
    return {
        latitude: 28.625, longitude: 77.25, timezone: 'Asia/Kolkata',
        current: { time: '2026-10-21T14:15', interval: 900, temperature_2m: 31.2 },
        hourly: {
            time: ['2026-10-21T13:00', '2026-10-21T14:00', '2026-10-21T15:00'],
            soil_moisture_3_to_9cm: [0.1, shallow, 0.1],
            soil_moisture_9_to_27cm: [0.1, deep, 0.1]
        },
        daily: {
            time: ['2026-10-21', '2026-10-22', '2026-10-23'],
            precipitation_sum: rain,
            precipitation_probability_max: [10, 20, 30],
            et0_fao_evapotranspiration: et0,
            temperature_2m_max: [33, 32, 31]
        }
    };
}

// Shape of a real NASA POWER monthly response. Each option is a function (year, monthIndex) -> value.
// Keys are "YYYYMM"; month 13 is the annual value, which the parser must skip.
const NORTH_TEMPS = [0, 2, 6, 12, 18, 24, 27, 26, 20, 13, 6, 1]; // warmest 6 months: May-Oct
function powerResponse({
    firstYear = 1991,
    lastYear = 2020,
    t2m = (y, m) => NORTH_TEMPS[m],
    tMax = (y, m) => t2m(y, m) + 10,
    tMin = (y, m) => t2m(y, m) - 8,
    rain = () => 2, // mm/day
    wetness = () => 0.5
} = {}) {
    const series = { T2M: t2m, T2M_MAX: tMax, T2M_MIN: tMin, PRECTOTCORR: rain, GWETROOT: wetness };
    const parameter = {};
    for (const [key, fn] of Object.entries(series)) {
        parameter[key] = {};
        for (let y = firstYear; y <= lastYear; y++) {
            for (let m = 0; m < 12; m++) parameter[key][`${y}${String(m + 1).padStart(2, '0')}`] = fn(y, m);
            parameter[key][`${y}13`] = 999; // annual value, ignored
        }
    }
    return { header: { fill_value: -999 }, properties: { parameter } };
}

// Shape of a real SoilGrids v2 /properties/query response.
function soilGridsResponse({ clay = 250, sand = 400, phh2o = 72, soc = 85 } = {}) {
    const layer = (name, mean) => ({
        name,
        unit_measure: { d_factor: 10 },
        depths: [{ label: '5-15cm', values: { mean } }]
    });
    return { properties: { layers: [layer('clay', clay), layer('sand', sand), layer('phh2o', phh2o), layer('soc', soc)] } };
}

module.exports = { openMeteoResponse, powerResponse, soilGridsResponse, NORTH_TEMPS };
