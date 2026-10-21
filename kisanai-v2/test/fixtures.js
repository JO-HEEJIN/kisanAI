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
module.exports = { openMeteoResponse };
