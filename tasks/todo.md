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
