import { useState, type ChangeEvent } from 'react';
import {
  AlertTriangle,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileUp,
  RefreshCw,
} from 'lucide-react';
import { NISAR_HDF5_MANIFEST } from '../data/samples/asfVertexSamples.ts';
import type {
  AsfGranuleMetadata,
  AsfGranulesApiResponse,
  EonetEvent,
  RegionDataset,
} from '../types/sar.ts';
import { parseUploadedGeoJsonOrGranule } from '../utils/sarPhysics.ts';

interface GranuleInspectorProps {
  region: RegionDataset;
  granulesData: AsfGranulesApiResponse | null;
  isLoadingGranules: boolean;
  granulesError: string | null;
  onRetryGranules: () => void;
  eonetEvents: EonetEvent[];
  demoMode: boolean;
}

export function GranuleInspector({
  region,
  granulesData,
  isLoadingGranules,
  granulesError,
  onRetryGranules,
  eonetEvents,
  demoMode,
}: GranuleInspectorProps) {
  const [customGranules, setCustomGranules] = useState<AsfGranuleMetadata[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expandedJsonId, setExpandedJsonId] = useState<string | null>(null);

  const hdf5Manifest = NISAR_HDF5_MANIFEST[region.id];
  const combinedGranules = [
    ...customGranules,
    ...(granulesData?.granules ?? region.granules),
  ];

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseUploadedGeoJsonOrGranule(text);
    if (!parsed.valid) {
      setUploadError(parsed.error ?? 'Could not parse uploaded file.');
      setUploadStatus(null);
      return;
    }
    setUploadError(null);
    setUploadStatus(parsed.summary);
    setCustomGranules((prev) => [...parsed.granules, ...prev]);
    e.target.value = '';
  };

  const handleDownloadMetadata = (granule: AsfGranuleMetadata) => {
    const blob = new Blob([JSON.stringify(granule, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${granule.sceneName}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoadingGranules) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading ASF Vertex granules">
        <div className="h-28 rounded-xl skeleton-shimmer" />
        <div className="h-28 rounded-xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {granulesError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F59E0B]/45 bg-[#F59E0B]/10 px-3 py-2 text-xs text-[#F8FAFC]"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
            <span>{granulesError}</span>
          </div>
          <button
            type="button"
            onClick={onRetryGranules}
            className="inline-flex items-center gap-1 rounded bg-[#F59E0B]/20 px-2.5 py-1 text-xs font-medium hover:bg-[#F59E0B]/30"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Custom GeoJSON / Granule Metadata Uploader */}
      <div className="rounded-xl border border-dashed border-[#C04CFD]/40 bg-[#100E14]/70 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-[#F8FAFC]">
              Import ASF Vertex GeoJSON / Granule JSON
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Inspect custom `.geojson` or `.json` SAR scene exports locally in browser.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#C04CFD]/20 border border-[#C04CFD]/50 px-3 py-1.5 text-xs font-medium text-[#F8FAFC] hover:bg-[#C04CFD]/30 focus-within:ring-2 focus-within:ring-[#00F0FF]">
            <FileUp className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
            <span>Upload JSON</span>
            <input
              type="file"
              accept=".json,.geojson,application/json,application/geo+json"
              onChange={handleFileUpload}
              className="sr-only"
              aria-label="Upload ASF Vertex GeoJSON or JSON metadata file"
            />
          </label>
        </div>
        {uploadStatus && (
          <p className="mt-2 text-xs text-[#10B981] font-medium">{uploadStatus}</p>
        )}
        {uploadError && (
          <p className="mt-2 text-xs text-[#EF4444] font-medium" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      {/* Downloaded ASF Vertex HDF5 (.h5) Internal Dataset Paths */}
      <div className="rounded-xl bg-[#100E14]/85 p-3.5 border border-[#00F0FF]/30 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#F8FAFC]">
            ASF Vertex HDF5 (.h5) Primary Granule
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40">
            Cycle {String(hdf5Manifest.cycle).padStart(3, '0')} · CRID {hdf5Manifest.crid}
          </span>
        </div>
        <div className="font-mono text-[11px] text-[#D4F844] break-all">
          {hdf5Manifest.filename}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[11px] text-[#E2E8F0] tabular-nums">
          <div>Track: {String(hdf5Manifest.track).padStart(3, '0')}</div>
          <div>Frame: {String(hdf5Manifest.frame).padStart(3, '0')}</div>
          <div>Orbit: {hdf5Manifest.orbitDirection}</div>
          <div>BW: {hdf5Manifest.bandwidth}</div>
          <div>Pol: {hdf5Manifest.polarizationMode}</div>
          <div className="truncate" title={hdf5Manifest.acquisitionUtc}>
            UTC: {hdf5Manifest.acquisitionUtc}
          </div>
        </div>
        <div className="rounded-lg bg-[#0B090F] p-2.5 border border-white/10 font-mono text-[10px] text-[#94A3B8] space-y-1">
          <div className="text-[#F8FAFC] font-semibold">HDF5 Internal Dataset Paths</div>
          <div className="break-all">HH Covariance: {hdf5Manifest.paths.hhhh}</div>
          <div className="break-all">HV Covariance: {hdf5Manifest.paths.hvhv}</div>
          <div className="break-all">Footprint WKT: {hdf5Manifest.paths.boundingPolygon}</div>
        </div>
      </div>

      {/* Granules List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-[#F8FAFC]">
            <Database className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
            <span>ASF Vertex {region.productType} Scene Catalog ({combinedGranules.length})</span>
          </span>
          <span className="font-mono text-[11px] text-[#94A3B8]">
            {granulesData?.source === 'ASF_VERTEX_LIVE_API'
              ? `Live (${granulesData.liveCount} scenes)`
              : 'Bundled Extract'}
          </span>
        </div>

        {combinedGranules.length === 0 ? (
          <div className="rounded-xl bg-[#100E14]/60 p-4 text-xs text-[#94A3B8] border border-white/10">
            No matching SAR granules found for this bounding box.
          </div>
        ) : (
          combinedGranules.map((g) => {
            const isExpanded = expandedJsonId === g.granuleId;
            return (
              <div
                key={g.granuleId}
                className="rounded-xl bg-[#100E14]/80 p-3 border border-white/10 space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-[#00F0FF] break-all">
                      {g.sceneName}
                    </div>
                    <div className="text-[11px] text-[#94A3B8] mt-0.5">
                      {g.mission} · {g.beamMode} · {g.polarization}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/15 bg-white/5 text-[#D4F844] shrink-0">
                    {g.processingLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono tabular-nums text-[#E2E8F0]">
                  <div>Date: {g.acquisitionDate}</div>
                  <div>Orbit: {g.orbitDirection}</div>
                  <div>Track/Frame: {g.trackNumber}/{g.frameNumber}</div>
                  <div>λ: {g.wavelengthCm.toFixed(1)} cm</div>
                  <div>Res: {g.spatialResolutionM} m</div>
                  <div className="truncate">Src: {g.source === 'CUSTOM_UPLOAD' ? 'Local Upload' : g.source === 'ASF_VERTEX_LIVE_API' ? 'ASF Live' : 'ASF Sample'}</div>
                </div>

                <p className="text-[11px] text-[#94A3B8]">{g.browseNote}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedJsonId(isExpanded ? null : g.granuleId)
                    }
                    className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/15 px-2.5 py-1 text-[11px] font-medium text-[#F8FAFC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
                  >
                    <Code2 className="h-3 w-3 text-[#C04CFD]" aria-hidden="true" />
                    <span>{isExpanded ? 'Hide JSON' : 'Inspect JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadMetadata(g)}
                    className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/15 px-2.5 py-1 text-[11px] font-medium text-[#F8FAFC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
                  >
                    <Download className="h-3 w-3 text-[#00F0FF]" aria-hidden="true" />
                    <span>Download JSON</span>
                  </button>

                  <a
                    href={g.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#00F0FF] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
                  >
                    <span>ASF Vertex</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>

                {isExpanded && (
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[#0B090F] p-2.5 font-mono text-[11px] text-[#94A3B8] border border-white/10">
                    {JSON.stringify(g, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Live NASA EONET Hazard Feed (when Live Mode active) */}
      <div className="rounded-xl bg-[#100E14]/75 p-3 border border-white/10">
        <div className="text-xs font-semibold text-[#F8FAFC] mb-1">
          NASA EONET Regional Hazard Feed
        </div>
        {demoMode ? (
          <p className="text-[11px] text-[#94A3B8]">
            Demo Mode is active. Toggle <strong>Live NASA / ASF Fetch</strong> in the top bar to query live open NASA EONET hazard events for this bounding box.
          </p>
        ) : eonetEvents.length === 0 ? (
          <p className="text-[11px] text-[#94A3B8]">
            No active open EONET hazard events currently overlap this bounding box.
          </p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {eonetEvents.slice(0, 4).map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between gap-2 text-[#E2E8F0]"
              >
                <span className="truncate">{ev.title}</span>
                <span className="font-mono text-[10px] text-[#F59E0B] shrink-0">
                  {ev.category} · {ev.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
