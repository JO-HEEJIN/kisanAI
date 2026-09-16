# 0003 Gemini general image identification

Date: 2026-09-17

Supersedes: 0002 Plant ID model limitation (the choice of recognition approach; its honest-display rules for the offline fallback still apply)

## Context

ADR 0002 recorded that client-side MobileNet with keyword mapping could identify almost none of the target crops. Two replacements were listed: a custom transfer-learning classifier or a server-side vision model. The requirement then widened: the app had to recognize any subject (a computer as a computer, house and garden plants by species), not only a fixed crop list, and return unknown only when the subject really could not be identified. Photos were not to be stored anywhere.

A custom classifier was rejected. Public plant datasets were mostly close-up disease-leaf photos with mixed licenses, and a closed class list could not cover arbitrary objects.

Server-side vision models were compared on 42 Wikipedia lead images from Wikimedia Commons (12 objects, 30 plants including crops, house plants, and garden plants), using the same prompt and JSON schema:

| Model | Correct | Plants | Median latency | Cost per image |
|---|---|---|---|---|
| gemini-3.1-pro-preview | 41/42 | 30/30 | 4.0 s | ~$0.0041 |
| gemini-3.8-flash | 40/42 | 30/30 | 3.1 s | ~$0.0018 (introductory price until 2026-12-31) |

Claude (claude-opus-5, claude-fable-5-1) could not be measured because the Anthropic account had no credit. OpenAI (gpt-6-astra, gpt-5.6-sol) could not be measured because no API key was available. Lead images were easy subjects, so the set did not separate the two Gemini models; both misses on the objects side were ambiguous photos (a person at a desktop computer, tea in a mug).

## Decision

- Identification moved to a server endpoint, `POST /api/vision/identify`, in the Railway server (`server/vision.js`, mounted in `server/nasa-proxy.js`), calling Google Gemini with a JSON schema: label, category, isPlant, commonName, scientificName, self-reported confidence, alternatives.
- The default model was `gemini-3.8-flash`: stable (GA), cheaper and faster than the preview Pro model, and within one image of it on the benchmark. `GEMINI_VISION_MODEL` overrides it.
- The API key came only from `GEMINI_API_KEY` on the server. Images were processed in memory and never logged or stored by the app.
- The client kept `runModelPrediction(videoElement)`, sent a downscaled JPEG frame to the server, and showed any subject by name. Crop health analysis was shown only when the scientific name matched a crop in `plantDatabase`.
- MobileNet stayed as an offline fallback when the server was unreachable, labeled "Offline AI", with the ADR 0002 display rules.

## Consequences

- Recognition covered everyday objects and plant species instead of a corn-only keyword match.
- Every identification cost a Gemini call and required a network connection.
- Photos left the device to Google. Google did not use paid-tier prompts to improve its products, but logged them for a limited period for abuse detection.
- The endpoint had no authentication or rate limit, so anyone who found the URL could spend Gemini credit.
- The camera UI still appeared only when MobileNet loaded, so a MobileNet load failure also blocked Gemini identification.
- The benchmark did not include real field photos or Claude and OpenAI results; a harder set would be needed to revisit the provider choice.
