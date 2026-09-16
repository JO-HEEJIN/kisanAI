# 0001 Honest data quality labeling

Date: 2026-09-17

## Context

The Vercel routes `api/smap/soil-moisture.js` and `api/modis/ndvi.js` queried NASA CMR only for granule metadata, and the MODIS route checked only whether the ORNL DAAC subset service responded. Neither route downloaded or read pixel values. The soil moisture, NDVI, and temperature values they returned were generated with `Math.random()`, `getRealisticTemperature()`, and `getRealisticNDVI()`. Even so, the metadata-match and ORNL paths returned `quality: 'real'` and source strings such as "NASA EarthData SMAP Real Data", and the fallback paths returned `quality: 'estimated'`. The plant recognition UI showed the quality value to users as-is, so users were told generated numbers were real NASA measurements.

The alternative was to implement real SMAP and MODIS retrieval right away: authenticated granule download, HDF5/HDF-EOS parsing, and pixel lookup for the requested location. That was more work than this fix and was deferred.

## Decision

Every response path in both routes returned `quality: 'simulated'`: CMR metadata match, empty CMR results, CMR API error, ORNL success, final fallback, and unexpected handler error. Source strings began with "Simulated" and said that measurements were not retrieved. CMR granule and collection identifiers were kept as metadata context only. The UI was not allowed to claim values were real unless they came from actual measurement retrieval. Retrieving and validating real SMAP and MODIS measurements was recorded as follow-up work, with TODO comments in both routes.

## Consequences

- Users saw "simulated" wherever the UI displayed the quality field from these routes.
- Consumers that compared `quality === 'real'` stopped treating these responses as real data. For example, the plant health score no longer received its real-data bonus.
- Other code outside these two routes still labeled generated or regional values as real (`server/nasa-proxy.js`, `api/landsat/imagery.js`, and client-side defaults such as `quality || 'real'`). This decision did not cover them.
- Real retrieval remained open. Once it exists, only responses whose values come from measured pixels should use a real label.
