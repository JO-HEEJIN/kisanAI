/**
 * Long-term climate for a location from NASA POWER (free, no key).
 * Monthly values 1991 onwards: mean temperature, hottest day, coldest night,
 * rain and root-zone soil wetness (NASA GEOS / MERRA-2).
 * Turned into two 6-month growing seasons and a "how is it changing" trend.
 * Main season = the warmest 6 months, or in the tropics (little temperature change) the wettest 6.
 */

const POWER_URL = 'https://power.larc.nasa.gov/api/temporal/monthly/point';
const PARAMS = ['T2M', 'T2M_MAX', 'T2M_MIN', 'PRECTOTCORR', 'GWETROOT'];
const START_YEAR = 1991;
const TREND_YEARS = 10; // compare the first 10 years with the last 10
const TROPICAL_SWING_C = 4; // warm and cool halves closer than this: split the year by rain instead
const DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const round1 = n => Math.round(n * 10) / 10;
const mean = list => list.reduce((a, b) => a + b, 0) / list.length;

function buildUrl(lat, lon, endYear) {
    const params = new URLSearchParams({
        parameters: PARAMS.join(','),
        community: 'AG',
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        start: String(START_YEAR),
        end: String(endYear),
        format: 'JSON'
    });
    return `${POWER_URL}?${params}`;
}

// { "199101": 12.3, ..., "199113": annual } -> { 1991: [12 monthly values or null] }
function byYear(series, fillValue) {
    const years = {};
    for (const [key, value] of Object.entries(series)) {
        const year = Number(key.slice(0, 4));
        const month = Number(key.slice(4));
        if (month < 1 || month > 12) continue; // month 13 is the annual value
        years[year] = years[year] || new Array(12).fill(null);
        years[year][month - 1] = value === fillValue || !Number.isFinite(value) ? null : value;
    }
    return years;
}

function summarizeSeason(months, monthly) {
    const pick = (key, list = months) => list.map(m => monthly[key][m]);
    // Crops are in the field for the middle months; an early or late frost at the edges
    // only shifts the sowing date, so heat and frost are judged on the middle 4.
    const growing = months.slice(1, 5);
    return {
        months: months.map(m => m + 1), // 1-12
        meanTempC: round1(mean(pick('T2M'))),
        hotDayC: round1(Math.max(...pick('T2M_MAX', growing))),
        coldNightC: round1(Math.min(...pick('T2M_MIN', growing))),
        rainMm: Math.round(months.reduce((sum, m) => sum + monthly.PRECTOTCORR[m] * DAYS_IN_MONTH[m], 0)),
        wetness: Math.round(mean(pick('GWETROOT')) * 100) / 100
    };
}

function parseResponse(data) {
    const fillValue = data.header?.fill_value ?? -999;
    const series = {};
    for (const key of PARAMS) {
        const raw = data.properties?.parameter?.[key];
        if (!raw) throw new Error(`NASA POWER response missing ${key}`);
        series[key] = byYear(raw, fillValue);
    }

    // Only use years where every value is present.
    const years = Object.keys(series.T2M).map(Number).sort()
        .filter(y => PARAMS.every(k => series[k][y] && series[k][y].every(v => v !== null)));
    if (years.length < TREND_YEARS * 2) {
        throw new Error('Not enough NASA POWER years for this location');
    }

    // Average of each calendar month across all years.
    const monthly = {};
    for (const key of PARAMS) {
        monthly[key] = Array.from({ length: 12 }, (_, m) => mean(years.map(y => series[key][y][m])));
    }

    // The 6 months in a row with the highest total of a monthly series.
    const bestHalf = values => {
        let start = 0;
        let best = -Infinity;
        for (let s = 0; s < 12; s++) {
            const total = [0, 1, 2, 3, 4, 5].reduce((sum, i) => sum + values[(s + i) % 12], 0);
            if (total > best) { best = total; start = s; }
        }
        return start;
    };
    const warmStart = bestHalf(monthly.T2M);
    const halfMean = start => mean([0, 1, 2, 3, 4, 5].map(i => monthly.T2M[(start + i) % 12]));
    const tropical = halfMean(warmStart) - halfMean(warmStart + 6) < TROPICAL_SWING_C;
    const mainStart = tropical ? bestHalf(monthly.PRECTOTCORR) : warmStart;
    const mainMonths = [0, 1, 2, 3, 4, 5].map(i => (mainStart + i) % 12);
    const secondMonths = [6, 7, 8, 9, 10, 11].map(i => (mainStart + i) % 12);

    const yearRain = y => series.PRECTOTCORR[y].reduce((sum, v, m) => sum + v * DAYS_IN_MONTH[m], 0);
    const mainTemp = y => mean(mainMonths.map(m => series.T2M[y][m]));
    const early = years.slice(0, TREND_YEARS);
    const recent = years.slice(-TREND_YEARS);
    const annualRainMm = mean(years.map(yearRain));
    const earlyRain = mean(early.map(yearRain));

    return {
        // splitBy: 'temperature' (main = warm half) or 'rain' (tropics: main = wet half)
        splitBy: tropical ? 'rain' : 'temperature',
        seasons: {
            main: summarizeSeason(mainMonths, monthly),
            second: summarizeSeason(secondMonths, monthly)
        },
        annualRainMm: Math.round(annualRainMm),
        trend: {
            early: `${early[0]}-${early[early.length - 1]}`,
            recent: `${recent[0]}-${recent[recent.length - 1]}`,
            rainChangePct: Math.round(((mean(recent.map(yearRain)) - earlyRain) / earlyRain) * 100),
            mainSeasonTempChangeC: round1(mean(recent.map(mainTemp)) - mean(early.map(mainTemp))),
            // Years in the last 10 with less than 80% of normal rain.
            dryYearsRecent: recent.filter(y => yearRain(y) < 0.8 * annualRainMm).length
        },
        source: `NASA POWER (MERRA-2), ${years[0]}-${years[years.length - 1]}`
    };
}

async function fetchClimate(lat, lon, { fetchFn = fetch, now = new Date() } = {}) {
    // Last full year; POWER fills in a few months behind real time.
    const endYear = now.getFullYear() - 1;
    const response = await fetchFn(buildUrl(lat, lon, endYear), { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
        throw new Error(`NASA POWER returned ${response.status}`);
    }
    return parseResponse(await response.json());
}

module.exports = { fetchClimate, parseResponse, buildUrl };
