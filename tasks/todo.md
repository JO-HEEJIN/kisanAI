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

---

# Plan: Crop Rotation Planner (NASA Space Apps challenge) - in kisanai-v2

Goal: a farmer enters location + soil + last crop + what matters most, and gets 3 two-year rotation plans
(4 seasons each), scored for soil health, water use, climate resilience and income, with plain-language reasons.

## Data (all free, no keys)
- **NASA POWER** monthly point data 1991-2024 (verified reachable): `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR` (rain), `GWETROOT` (root-zone soil wetness, NASA GEOS/MERRA-2)
  - Derived: rain + temps for the warm and cool season, **rain and heat trend** (2015-24 vs 1991-2000), share of dry years
- **Soil**: farmer picks texture (sandy/loam/clay), organic matter (low/med/high), optional pH.
  Prefilled from ISRIC SoilGrids when it answers (blocked in this sandbox, so tested with recorded data; the farmer can always change it)

## Todo
- [x] Copy `kisanai-v2/` from branch `ccr-08c65661-5iango` onto this branch
- [x] `lib/climate.js`: fetch NASA POWER, turn it into a season + trend summary (fails clearly, never invents data)
- [x] `lib/soil.js`: SoilGrids lookup -> { texture, ph, organicMatter }, returns null on failure
- [x] `lib/crops.js`: table of ~16 crops (cereals, legumes, oilseeds, cotton, potato, cover crop) with family, season, temp range, water need, drought/heat tolerance, pH range, nitrogen effect, root depth, rough value. Values approximate, from FAO crop guides
- [x] `lib/rotation.js` (pure function): try every 4-season sequence of suitable crops, drop ones breaking basic rules (same family back to back, crops that don't fit climate/soil/water), score the rest by the farmer's priorities, return the top 3 different plans with reasons
- [x] `server.js`: `GET /api/rotation?lat&lon&soil&om&ph&irrigation&lastCrop&priorities`
- [x] Front end: new "Plan my rotation" section: priorities as tap buttons, soil + irrigation pickers, results as a 4-season strip + score bars + "why" list + "your climate is changing" card
- [x] English + Hindi text
- [x] Tests (fixtures, no network) + one live NASA POWER check; headless phone-size check

## Not in this round
- The "Today" card plan above (can follow after this)
- Yield/price forecasts: income is a rough relative score, labelled as such

## Review (rotation planner)
- **Built** in `kisanai-v2/`: `lib/climate.js` (NASA POWER), `lib/soil.js` (SoilGrids), `lib/crops.js` (20 crops),
  `lib/rotation.js` (planner), `GET /api/rotation`, a "Plan my crop rotation" section on the phone page, English + Hindi.
- **Tests**: 47 pass (29 new), no network needed. Live NASA POWER checked for Delhi, Iowa, Nairobi and Alaska.
- **Headless phone check** (390 px, light + dark, Hindi, offline reload): plans render, no console errors, no sideways scroll.
- **Fixed while testing on live data** (root causes, not patches):
  - Frost at season edges wrongly ruled out summer crops (Iowa) → heat/frost judged on the middle 4 growing months
  - Tropics have no real warm/cool season → split by rain there
  - Resilience punished every thirsty crop whenever rain trended down → now checks the water actually missing in a dry year
  - Cover crops between cash crops hid same-family repeats → family rule compares cash crops
  - "Save water" picked leaving fields bare → fallow only when nothing fits
  - "Rain only" farms were told to irrigate → suggested irrigation capped at what the farmer has
- **Not verified live**: SoilGrids is blocked from this sandbox (tested with its documented response shape;
  the app falls back to loam and asks the farmer). Crop numbers are approximate FAO values; income is a rough score.
- **Heads-up**: in very hot places (Delhi: hottest days ~47°C in May-June) most summer crops get a heat warning.
  That's real risk data, but it's repeated on each plan.
