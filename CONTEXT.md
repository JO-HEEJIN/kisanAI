# kisanAI Context

Current state of the system. Present tense only. Decisions and their history live in `docs/adr/`.

## Runtime layout

- `index.html` is the single-page browser app. It loads classic scripts from `src/`, including `src/plant-recognition.js`.
- `server.js` is the local Express server (port 3000, HTTPS 3443 when `key.pem`/`cert.pem` exist). It serves the repository root as static files.
- `server/nasa-proxy.js` is the local NASA proxy (port 3001).
- `api/` holds Vercel serverless routes (`api/smap/soil-moisture.js`, `api/modis/ndvi.js`, `api/landsat/imagery.js`, and others).

## Plant recognition

- `src/plant-recognition.js` defines `PlantRecognition` and creates `window.plantRecognition` on `DOMContentLoaded`.
- `PlantRecognition.bindPlantEvents()` is the only code that attaches a click listener to `#test-plant-id-btn`. It runs after the model loads and also after the model fails to load, when the error modal with manual plant selection is created.
- One click on `#test-plant-id-btn` calls `openPlantModal()` once, which requests geolocation once and fetches `/api/smap/soil-moisture` and `/api/modis/ndvi` once each.

## Credentials

- Hardcoded credentials are still embedded in the codebase: an OpenAI API key and a NASA Earthdata token in `src/app.js`, NASA Earthdata fallbacks in `api/smap/soil-moisture.js`, `api/modis/ndvi.js`, `api/landsat/imagery.js`, `server/nasa-proxy.js`, and `src/data/nasaRealTimeService.js`, and a Cesium Ion token fallback in `src/components/FarmGlobe3D.js`.

## Tests

- `npx jest src/tests/plant-recognition.test.js` runs the plant-recognition regression checks. It loads the browser script into a Node `vm` context with a fake DOM, mocked geolocation, and mocked fetch.
- `src/tests/integration.test.js` and `api/test.js` are matched by Jest but do not run: they use ES module syntax and the repository has no Jest transform for it.
