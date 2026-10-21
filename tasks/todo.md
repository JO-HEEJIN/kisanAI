# Plan: Clone Kisan AI into new repo `stagmate/kisan-ai` and get it running & deployed

## Blocker
- [ ] You create an empty private repo `stagmate/kisan-ai` on GitHub (no README) and give the Claude GitHub App access to it

## Part 1 - Fresh-start copy
- [ ] Copy current code (225 source files) into a new git repo with one initial commit
- [ ] Leave out `node_modules/` (21k files committed by mistake) and `cert.pem` (local HTTPS cert)
- [ ] Add `node_modules/`, `*.pem`, `.env` to `.gitignore`
- [ ] Push to `stagmate/kisan-ai`

## Part 2 - Run locally
- [ ] `npm install` and `npm start` (server.js on port 3000) - fix any startup errors at the root cause
- [ ] Check every `/api/*` route responds (health, smap, modis, landsat, pixel-hunt, ai/*)
- [ ] Load index.html in headless Chromium, fix console errors that break page load
- [ ] Check mobile view loads the AR entry point (mobile-ar.html)

## Part 3 - Deploy (Vercel)
- [ ] Confirm `vercel.json` + `api/` folder work as Vercel serverless functions
- [ ] Document required env vars (from `.env.example`) - no secrets committed
- [ ] Write short deploy steps in README (you connect the repo in Vercel - I can't log in for you)

## Review
(to be filled in after the work)

---

# Plan: More farmer info on the v2 "Today" screen (kisanai-v2)

All new data comes from the same free Open-Meteo call the app already makes, with no new keys and no made-up values.

- [ ] Copy `kisanai-v2/` from branch `ccr-08c65661-5iango` onto this branch
- [ ] `lib/conditions.js`: request a few more fields: humidity + wind now, rain chance per hour (next 6 h), min temp, max wind, sunrise/sunset per day
- [ ] New `lib/today.js` (one small pure function, `todayInfo(conditions)`):
  - **Spray window**: OK / not OK + reason (wind > 15 km/h, rain chance >= 40% in next 6 h, temp > 30°C)
  - **Alerts**: heat (max >= 40°C), frost (min <= 2°C), heavy rain (>= 50 mm/day), strong wind (>= 40 km/h) for each of the 3 days
  - **Field work tips**: good/bad day to harvest or dry grain (rain chance + humidity), sowing (soil moisture + no heavy rain)
- [ ] `server.js`: add `today` to the existing `/api/advice` response (no new route)
- [ ] `public/app.js` + `style.css`: new "Today" card under the water advice: alerts, spray window, field tips, 3-day forecast strip, sunrise/sunset + humidity
- [ ] `public/i18n.js`: English + Hindi text for all of it
- [ ] Tests for `today.js` and the new fields; run `npm test`
- [ ] Check at phone size in headless Chromium (light, dark, Hindi, offline)
