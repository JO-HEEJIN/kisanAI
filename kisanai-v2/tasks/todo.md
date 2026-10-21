# KisanAI v2 — plan

Copied from the v1 repo's plan (approved): a simple phone app with real data,
photo diagnosis, English + Hindi, offline support. Game/AR/3D dropped for now.

## Todo
- [x] Create the copy with a clean folder layout (new GitHub repo creation was blocked from the session; built locally)
- [x] Server: real soil moisture + rain forecast (`lib/conditions.js`, Open-Meteo) with tests
- [x] Server: irrigation decision logic (`lib/advice.js`, pure function) with tests
- [x] Server: photo → crop health (`lib/diagnose.js`, adapted from v1 `server/vision.js`) with tests
- [x] Front end: single mobile page — GPS (with manual fallback), crop picker, photo button, result cards
- [x] English/Hindi text file
- [x] Offline: service worker + last result saved in the browser
- [x] README with how to run + deploy
- [x] Run it in a headless browser and check it end to end

## Review
- 18 server tests pass (`npm test`); none need network.
- End-to-end check in headless Chromium at phone size, with stand-in Open-Meteo and Gemini
  responses: advice card, Hindi switch, photo diagnosis, and offline reload all work, no console errors,
  no horizontal scroll.
- Not verified live: Open-Meteo is blocked from the build sandbox, and there's no Gemini key here.
  The Open-Meteo request/response shape follows their documented `/v1/forecast` format;
  first live run should confirm it.
- Crop refill points assume loam soil — a soil type picker is the obvious next improvement.
