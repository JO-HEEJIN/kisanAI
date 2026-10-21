/**
 * Irrigation decision from soil moisture + 3-day weather.
 * A simple daily water balance over the root zone (FAO-56 style):
 *   moisture tomorrow = moisture today - (crop water use - useful rain) / root zone depth
 * Water when moisture is projected to fall below the crop's refill point.
 */

const ROOT_ZONE_MM = 240; // 3-27 cm layer the moisture value describes
const RAIN_EFFICIENCY = 0.8; // share of rain that actually soaks in
const WET_LIMIT = 0.36; // above this, a loam soil is close to saturated

// kc: crop coefficient (mid-season). refill: moisture (m³/m³) at which to water, for a loam soil.
const CROPS = {
    rice: { kc: 1.2, refill: 0.32, wet: 1 }, // paddy rice likes standing water
    wheat: { kc: 1.15, refill: 0.2 },
    maize: { kc: 1.2, refill: 0.22 },
    cotton: { kc: 1.15, refill: 0.18 },
    sugarcane: { kc: 1.25, refill: 0.25 },
    millet: { kc: 1.0, refill: 0.15 },
    pulses: { kc: 1.0, refill: 0.18 },
    vegetables: { kc: 1.05, refill: 0.24 }
};

const round1 = n => Math.round(n * 10) / 10;

function irrigationAdvice({ soilMoisture, days, crop }) {
    const params = CROPS[crop];
    if (!params) {
        throw new Error(`Unknown crop: ${crop}`);
    }
    const wetLimit = params.wet ?? WET_LIMIT;
    const target = params.refill + 0.08; // fill back up to a comfortable level

    const facts = {
        soilMoisturePct: Math.round(soilMoisture * 100),
        refillPct: Math.round(params.refill * 100),
        rainMm: round1(days.reduce((sum, d) => sum + d.rainMm, 0)),
        cropUseMm: round1(days.reduce((sum, d) => sum + d.et0Mm * params.kc, 0))
    };
    const result = (action, reason, inDays = null, waterMm = 0) => ({ action, reason, inDays, waterMm, facts });

    if (soilMoisture >= wetLimit) {
        return result('wait', 'soil_wet');
    }

    let moisture = soilMoisture;
    for (let i = 0; i < days.length; i++) {
        // Rain that falls before the soil runs dry counts first.
        moisture += (days[i].rainMm * RAIN_EFFICIENCY) / ROOT_ZONE_MM;
        if (moisture < params.refill) {
            const waterMm = Math.round((target - moisture) * ROOT_ZONE_MM);
            return i === 0
                ? result('irrigate_now', 'soil_dry', 0, waterMm)
                : result('irrigate_soon', 'will_dry', i, waterMm);
        }
        moisture = Math.min(moisture, wetLimit) - (days[i].et0Mm * params.kc) / ROOT_ZONE_MM;
    }

    if (moisture < params.refill) {
        // Fine for the forecast window but will need water right after it.
        return result('irrigate_soon', 'will_dry', days.length, Math.round((target - moisture) * ROOT_ZONE_MM));
    }
    return result('wait', facts.rainMm >= 5 ? 'rain_coming' : 'enough_water');
}

module.exports = { irrigationAdvice, CROPS };
