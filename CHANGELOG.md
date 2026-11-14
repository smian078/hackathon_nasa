# Changelog

## [0.1.0] - 2026-11-14 — P0 Complete Release
### Added
- **3-Region SAR Study Areas**: Bundled ASF Vertex `GCOV` & `GUNW` multi-polygon GeoJSON and 4-pass orbital telemetry for Maharashtra (Wainganga/Gosikhurd & Wardha), Northeast India (Brahmaputra/Kaziranga), and Japan (Noto Peninsula/Toyama Bay).
- **Cloud-Piercer Split-Screen Map (`src/components/CloudPiercerMap.tsx`)**: Synchronized dual Leaflet view comparing NASA GIBS MODIS Terra optical cloud cover against color-coded L-band SAR polygons with a draggable/keyboard-accessible split slider and GUNW coherence (`γ`) mask.
- **12-Day Orbital Pass Scrubber (`src/components/OrbitalTimeScrubber.tsx`)**: 4-cycle timeline with autoplay (respecting `prefers-reduced-motion`), baseline delta readouts, and `localStorage` snapshot pinning (`nisar_pulse_saved_snapshots_v1`).
- **Multi-Sensor Telemetry (`src/components/TelemetryPanel.tsx`)**: Dual-axis Recharts SAR vs NASA POWER rainfall/soil wetness correlation and interactive Roughness vs Dielectric Constant 2D quadrant scatter plot.
- **Grounded Physical Driver Synthesizer (`src/components/PhysicalDriverSynthesizer.tsx`)**: Server-side `gemini-4-hydrogen` integration (`/api/gemini/synthesize`) supporting English, Marathi (`मराठी`), and Hindi (`हिन्दी`), with deterministic physics fallback.
- **ASF Vertex Granule Inspector (`src/components/GranuleInspector.tsx`)**: Live/bundled granule metadata table, raw JSON inspector, JSON export, custom `.geojson`/`.json` upload parser, and live NASA EONET hazard feed.
- **Unified Express + Vite Server (`server.ts`, `server/routes.ts`, `server/cache.ts`)**: Proxies `/api/health`, `/api/asf/granules`, `/api/nasa/power`, `/api/nasa/eonet`, and `/api/gemini/synthesize` with in-memory TTL/SWR caching and 60 req/min rate limiting.

### Fixed (Browser Verification)
- Replaced CartoDB basemap URL (which displayed an API key watermark in sandbox) with dark-inverted OpenStreetMap tiles (`.nisar-dark-basemap-tiles`) and added `maxNativeZoom={9}` to the NASA GIBS MODIS Terra layer.
- Added a 5000ms timeout race on `/api/gemini/synthesize` and a 6000ms client `AbortController` so synthesis always resolves rapidly to either `GEMINI_4_HYDROGEN` or `DETERMINISTIC_PHYSICS_FALLBACK`.
- Fixed mobile (`390px`) Navbar control cluster wrapping and repositioned the Optical GIBS map badge to bottom-left on mobile viewports to prevent badge overlap.

## [0.1.1] - 2026-11-14 — ASF Vertex Cycle 035 HDF5 Wiring & Timeout Patch
### Added
- Wired the 3 downloaded ASF Vertex NISAR Cycle 035 `.h5` granules (Maharashtra Track 084 Frame 013, Northeast India Track 098 Frame 013, Japan Track 009 Frame 024; `40+5 MHz`, `DHDH [HH+HV]`, `CRID P05036`) and HDF5 internal paths (`/science/LSAR/GCOV/grids/frequencyA/HHHH`, `/science/LSAR/GCOV/grids/frequencyA/HVHV`, `/science/LSAR/identification/boundingPolygon`) into `src/data/samples/asfVertexSamples.ts` and `src/components/GranuleInspector.tsx`.
- Added local Python extractor `scripts/extract_nisar_h5.py` (`h5py` + `numpy`) to convert `.h5` covariance grids to `10 * log10(gamma0)` dB summaries and GeoJSON without storing >100 MB binaries in Git.

### Changed
- Increased `/api/gemini/synthesize` model timeout to `12000` ms with `gemini-2.5-flash` fallback prior to `DETERMINISTIC_PHYSICS_FALLBACK` in `server/routes.ts`.
- Replaced `__dirname` with `import.meta.dirname` in `vite.config.ts`.
