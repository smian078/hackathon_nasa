import { REGION_DATASETS } from '../data/samples/asfVertexSamples.ts';
import type {
  AsfGranulesApiResponse,
  EonetEvent,
  HealthStatusResponse,
  NasaPowerApiResponse,
  PhysicalDriverSynthesis,
  ProductType,
  RegionDataset,
  RegionId,
  SavedSnapshot,
  SynthesizeRequestPayload,
} from '../types/sar.ts';
import { buildDeterministicSynthesis } from '../utils/sarPhysics.ts';

const SNAPSHOTS_STORAGE_KEY = 'nisar_pulse_saved_snapshots_v1';

export async function fetchHealthStatus(): Promise<HealthStatusResponse> {
  const resp = await fetch('/api/health');
  if (!resp.ok) {
    throw new Error(`Health check failed (${resp.status})`);
  }
  return (await resp.json()) as HealthStatusResponse;
}

export async function fetchAsfGranules(
  regionId: RegionId,
  productType: ProductType,
  demoMode: boolean
): Promise<AsfGranulesApiResponse> {
  const dataset = REGION_DATASETS[regionId];

  if (demoMode) {
    return {
      region: regionId,
      product: productType,
      source: 'ASF_VERTEX_BUNDLED_SAMPLE',
      liveCount: 0,
      granules: dataset.granules,
      cached: true,
    };
  }

  const regionParam =
    regionId === 'maharashtra_gcov'
      ? 'maharashtra'
      : regionId === 'northeast_india_gcov'
        ? 'northeast_india'
        : 'japan';

  const resp = await fetch(
    `/api/asf/granules?region=${encodeURIComponent(regionParam)}&product=${encodeURIComponent(productType)}`
  );
  if (!resp.ok) {
    throw new Error(`ASF Vertex proxy returned HTTP ${resp.status}`);
  }
  return (await resp.json()) as AsfGranulesApiResponse;
}

export async function fetchNasaPowerSeries(
  region: RegionDataset,
  demoMode: boolean
): Promise<NasaPowerApiResponse> {
  if (demoMode) {
    return {
      lat: region.center[0],
      lon: region.center[1],
      source: 'NASA_POWER_BUNDLED',
      series: region.powerSeries,
      cached: true,
    };
  }

  // Query recent 60-day agroclimatology window for live NASA POWER data
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 5);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 45);

  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;

  const resp = await fetch(
    `/api/nasa/power?lat=${region.center[0]}&lon=${region.center[1]}&start=${fmt(startDate)}&end=${fmt(endDate)}`
  );
  if (!resp.ok) {
    throw new Error(`NASA POWER proxy returned HTTP ${resp.status}`);
  }
  return (await resp.json()) as NasaPowerApiResponse;
}

export async function fetchEonetEvents(
  bbox: [number, number, number, number],
  demoMode: boolean
): Promise<{ events: EonetEvent[]; source: string }> {
  if (demoMode) {
    return { events: [], source: 'DEMO_MODE_BUNDLED' };
  }
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const resp = await fetch(
    `/api/nasa/eonet?bbox=${minLon},${maxLat},${maxLon},${minLat}`
  );
  if (!resp.ok) {
    return { events: [], source: 'NASA_EONET_UNAVAILABLE' };
  }
  return (await resp.json()) as { events: EonetEvent[]; source: string };
}

export async function synthesizePhysicalDrivers(
  payload: SynthesizeRequestPayload
): Promise<PhysicalDriverSynthesis> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const resp = await fetch('/api/gemini/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) {
      throw new Error(`Synthesis endpoint returned HTTP ${resp.status}`);
    }
    return (await resp.json()) as PhysicalDriverSynthesis;
  } catch {
    clearTimeout(timer);
    return buildDeterministicSynthesis(payload);
  }
}

export function loadSavedSnapshots(): SavedSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function persistSavedSnapshot(snapshot: SavedSnapshot): SavedSnapshot[] {
  const existing = loadSavedSnapshots();
  const next = [snapshot, ...existing.filter((s) => s.id !== snapshot.id)].slice(0, 12);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function removeSavedSnapshot(id: string): SavedSnapshot[] {
  const existing = loadSavedSnapshots();
  const next = existing.filter((s) => s.id !== id);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
