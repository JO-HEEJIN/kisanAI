# KisanAI v2

A phone-first field assistant for small farmers. Three tools on one page:

1. **Plan my crop rotation** (NASA Space Apps challenge) — 2-year rotation plans built from 30+ years of
   NASA climate data, the farmer's soil, crops and priorities. See below.
2. **Should I water?** — uses your GPS location and crop to give one clear answer
   ("Water today, about 30 mm" / "Water in 2 days" / "No need to water now") and shows *why*.
3. **Is my crop healthy?** — take a photo of a leaf or plant and get the likely problem
   plus 1–3 low-cost next steps.

Works in English and Hindi, and shows your last result when there is no signal.

## What's different from v1

| v1 (NASA Farm Navigators) | v2 |
|---|---|
| Soil moisture/NDVI values were mostly `Math.random()` | Real modelled soil moisture + forecast from Open-Meteo; fails loudly instead of inventing data |
| AR.js, Three.js, Babylon, TensorFlow, 22 HTML pages, 8k-line `app.js` | One page, plain HTML/CSS/JS, ~600 lines total |
| "Identify anything" photo AI | Crop health diagnosis with practical, safe advice |
| English only | English + Hindi (add a language in `public/i18n.js`) |
| Advice score with no explanation | Water balance decision with the numbers behind it |

## How the rotation planner works

1. **NASA climate** (`lib/climate.js`): monthly NASA POWER data since 1991 for the field's location —
   mean temperature, hottest day, coldest night, rain and root-zone soil wetness (MERRA-2).
   The year is split into a **main** and a **second** season (the warmest 6 months; near the equator,
   where temperature barely changes, the wettest 6). It also reports how rain and temperature changed
   between the first and last 10 years, and how many of the last 10 years were dry (< 80% of normal rain).
2. **Soil** (`lib/soil.js`): the farmer's answers (type, organic matter, pH). Blank answers are filled from
   the ISRIC SoilGrids map; if that is down, loam is assumed and the app asks the farmer to check.
3. **Crops** (`lib/crops.js`): 20 crops and cover crops with family, temperature range, frost and heat
   limits, water need, drought tolerance, pH range, nitrogen effect, roots, residue and a rough value.
   Approximate figures from FAO guides.
4. **Plans** (`lib/rotation.js`): every 4-season sequence of crops that fit each season's temperature,
   frost, soil, pH and water (rain + stored soil water + the farmer's irrigation) is scored 0-100 for:
   - **Soil health**: legumes, cover crops, residue, deep roots, plant-family variety; penalties for the
     same family in a row (pests carry over), two heavy feeders in a row, or bare soil
   - **Save water**: irrigation needed over 2 years
   - **Drought & heat safe**: water still missing in a dry year and hottest-day risk, weighted more when
     NASA data shows the area getting drier or hotter
   - **Income**: rough relative crop value (not a price forecast)

   The farmer's 1-2 priorities count 3x. The best 3 plans that differ in at least 2 seasons are shown,
   each with plain reasons and warnings. The same crop is never planted twice in a row, and a
   "crop I want to keep" is always included.

## How the irrigation advice works

`lib/advice.js` runs a small daily water balance (FAO-56 style) over the 3–27 cm root zone:

```
moisture tomorrow = moisture today + 0.8 × rain − crop coefficient × ET₀
```

If moisture is projected to fall below the crop's refill point within the next 3 days,
it recommends watering on that day and how much (mm = litres per m²) to refill it.
Crop coefficients and refill points are in the `CROPS` table and assume a loam soil.

## Run it

```bash
npm install
GEMINI_API_KEY=your-key npm start   # http://localhost:3000
npm test
```

- Rotation planner needs no key (NASA POWER and SoilGrids are free).
- Irrigation advice needs no key (Open-Meteo is free for non-commercial use).
- Photo diagnosis needs a Google Gemini API key. Optional: `GEMINI_VISION_MODEL`.
- Geolocation and the camera need HTTPS on phones; any host with HTTPS works
  (Render, Railway, Fly.io).

## Files

```
server.js          Express app: static files + 3 API routes
lib/climate.js     NASA POWER monthly history → seasons + climate trend
lib/soil.js        SoilGrids lookup → soil type, organic matter, pH (or null)
lib/crops.js       Crop traits for rotation planning
lib/rotation.js    Rotation planner (pure function)
lib/conditions.js  Open-Meteo fetch → { soilMoisture, temperatureC, days[] }
lib/advice.js      Irrigation decision (pure function)
lib/diagnose.js    POST /api/diagnose → Gemini crop health
public/            The phone app (index.html, app.js, i18n.js, style.css, sw.js)
test/              node:test tests (no network needed)
```

## API

- `GET /api/advice?lat=28.61&lon=77.21&crop=wheat`
  → `{ conditions, advice: { action, reason, inDays, waterMm, facts } }`
  Crops: rice, wheat, maize, cotton, sugarcane, millet, pulses, vegetables.
- `GET /api/rotation?lat=28.6&lon=77.2&irrigation=none|limited|full&soil=sandy|loam|clay&om=low|medium|high&ph=7.2&lastCrop=rice&keepCrop=wheat&priorities=soil,water`
  → `{ climate, soil, startSeason, plans: [{ seasons[4], scores, total, irrigationMm, reasons[], warnings[] }] }`.
  Only `lat`, `lon`, `irrigation` are required. Priorities: soil, water, resilience, income.
- `POST /api/diagnose` `{ image: <base64>, mimeType, language: "en"|"hi", crop }`
  → `{ isCrop, crop, status, problem, confidence, advice[] }`. Photos are not stored or logged.

## Ideas for next steps

- Soil type picker (sand/loam/clay) to tune refill points
- More languages (Marathi, Telugu, Punjabi…) and read-aloud with the Web Speech API
- SMS / WhatsApp version for feature phones
- Bring back the farm game as a learning mode on top of this real-data core
