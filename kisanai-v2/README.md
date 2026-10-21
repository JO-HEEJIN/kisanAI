# KisanAI v2

A phone-first field assistant for small farmers. Two questions, two big buttons:

1. **Should I water?** — uses your GPS location and crop to give one clear answer
   ("Water today, about 30 mm" / "Water in 2 days" / "No need to water now") and shows *why*.
2. **Is my crop healthy?** — take a photo of a leaf or plant and get the likely problem
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

- Irrigation advice needs no key (Open-Meteo is free for non-commercial use).
- Photo diagnosis needs a Google Gemini API key. Optional: `GEMINI_VISION_MODEL`.
- Geolocation and the camera need HTTPS on phones; any host with HTTPS works
  (Render, Railway, Fly.io).

## Files

```
server.js          Express app: static files + 2 API routes
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
- `POST /api/diagnose` `{ image: <base64>, mimeType, language: "en"|"hi", crop }`
  → `{ isCrop, crop, status, problem, confidence, advice[] }`. Photos are not stored or logged.

## Ideas for next steps

- Soil type picker (sand/loam/clay) to tune refill points
- More languages (Marathi, Telugu, Punjabi…) and read-aloud with the Web Speech API
- SMS / WhatsApp version for feature phones
- Bring back the farm game as a learning mode on top of this real-data core
