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
- Identification runs in the browser. `runModelPrediction(videoElement)` classifies the frame with pretrained MobileNet (ImageNet classes) and maps the top class name to a crop with substring keyword checks and `plantMapping`. Anything unmatched becomes `generic_plant`.
- ImageNet has no classes for growing wheat, rice, soybean, tomato, or potato, so automatic identification in practice recognizes only `corn` and `ear, spike, capitulum` (both mapped to corn). Substring matching can also map unrelated classes to a crop. See `docs/adr/0002-plant-id-model-limitation.md`.
- An automatic `generic_plant` result shows "Could not confidently identify a specific crop", an "Unidentified" badge, the raw ImageNet class with its probability, and no health score. If the raw class matches a non-plant keyword, it is reported as not a plant.
- Manual selection (only offered in the error modal after the model fails to load) shows the selected crop, a "Manual" badge, and a health score computed from the NASA route values.

## NASA data routes

- `api/smap/soil-moisture.js` and `api/modis/ndvi.js` query NASA CMR for granule metadata only. The MODIS route also checks whether the ORNL DAAC subset service responds, but does not read its NDVI values.
- Every value these routes return (soil moisture, NDVI, temperature) is generated from latitude, season, and `Math.random()`. Every response has `quality: 'simulated'` and a source string that starts with "Simulated". When a CMR granule matches, `granule_id` and `collection` are included as metadata context only.
- Real SMAP and MODIS measurement retrieval is not implemented. See `docs/adr/0001-honest-data-quality-labeling.md`.
- `server/nasa-proxy.js`, `api/landsat/imagery.js`, and several client files (`src/ar-functions.js`, `src/conversational-ai.js`, `src/voice-commands.js`, `src/game/FarmGameUI.js`, `src/plant-recognition.js`) still use `quality: 'real'` labels or `quality || 'real'` defaults.
- The plant recognition result shows the SMAP route's quality value as-is next to soil moisture.
- `api/landsat/imagery.js` calls `axios.get` without importing `axios`, so its CMR request always throws and it uses its fallback path.

## Credentials

- No credential values are stored in the repository. `.env` and `key.pem` are listed in `.gitignore`; `.env.example` lists the server variable names only.
- Server-side NASA Earthdata credentials come only from `process.env.NASA_USERNAME`, `NASA_PASSWORD`, and `NASA_TOKEN`, read in `NASA_CONFIG` in `api/smap/soil-moisture.js`, `api/modis/ndvi.js`, `api/landsat/imagery.js`, and `server/nasa-proxy.js`. Nothing loads `.env` automatically; set the variables in the shell or the Vercel project environment.
- Those routes send `Authorization: Bearer <token>` only when a token exists: a user token from the request's `Authorization` header first, then `NASA_TOKEN`. Without either, requests go out unauthenticated, and any upstream failure uses the route's existing simulated fallback.
- In the browser, the OpenAI API key (`openai_api_key`), NASA Earthdata token (`nasa_earthdata_token`), and Cesium Ion token (`cesium_access_token`) exist only if the user enters them in the welcome setup modal, the token modal, the settings panel, or the browser console. Nothing is saved on load, and setup inputs are prefilled only with values the user already stored.
- `src/data/nasaRealTimeService.js` reads the NASA token from localStorage only. `src/components/FarmGlobe3D.js` uses the Cesium Ion token from localStorage when set, and otherwise uses free Cesium imagery.
- `server.js` serves the repository root as static files. A local `key.pem` on disk is therefore reachable over HTTP from the dev server. `.env` is not served, because Express ignores dotfiles by default.
- Earlier git history still contains the removed credential values.

## Tests

- `npx jest src/tests/plant-recognition.test.js` runs the plant-recognition regression checks (button wiring, quality display, crop mapping, and recognized, unidentified, non-plant, and manual result display). It loads the browser script into a Node `vm` context with a fake DOM, mocked geolocation, and mocked fetch.
- `npx jest src/tests/credentials.test.js` scans tracked files (excluding `node_modules/` and PDFs) for credential literals, checks that client code stores only user-entered credentials, and checks NASA route authorization headers with and without tokens.
- `npx jest src/tests/nasa-quality-labels.test.js` checks the SMAP and MODIS route labels on every response path, with mocked upstream fetch. It loads the ES module routes into a `vm` context as CommonJS.
- `src/tests/integration.test.js` and `api/test.js` are matched by Jest but do not run: they use ES module syntax and the repository has no Jest transform for it.
