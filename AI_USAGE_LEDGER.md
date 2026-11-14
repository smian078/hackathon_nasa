# AI Usage Ledger

This ledger records every AI model and tool usage across **NISAR Pulse** development and runtime operation.

## Runtime AI Integration
- **Model**: `gemini-4-hydrogen` (`@google/genai` SDK, server-side via `/api/gemini/synthesize`)
- **Thinking Level**: `LOW` for low-latency structured JSON synthesis
- **Grounding Guardrails**: System instruction restricts analysis strictly to supplied GCOV ($\gamma^0$ HH, HV, $\Delta\gamma^0$) or GUNW (unwrapped phase rad, LOS cm, coherence $\gamma$) and NASA POWER (`PRECTOTCORR`, `GWETROOT`) metrics.
- **Deterministic Offline Fallback**: `src/utils/sarPhysics.ts` (`buildDeterministicSynthesis`) provides physics-accurate multilingual fallback when offline or unconfigured.

## Development Engineering Log
- **2026-11-14**: Initial P0 build generated with Gemini 4 Hydrogen (`gemini-4-hydrogen`) inside Google AI Studio Build: strict TypeScript interfaces (`src/types/sar.ts`), SAR physics calculations + `node:test` unit suite (`src/utils/sarPhysics.ts`), ASF Vertex bundled samples (`src/data/samples/asfVertexSamples.ts`), Express proxy & caching layer (`server.ts`, `server/routes.ts`, `server/cache.ts`), and React + Leaflet + Recharts frontend workspace.
- **2026-11-14 (Verification Pass)**: Added 5s server-side timeout guard on `gemini-4-hydrogen` calls, switched Leaflet base layer to dark-inverted OpenStreetMap tiles, and refined 390px mobile responsive layout after Playwright visual verification.
