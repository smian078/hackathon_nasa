import { useState, type ChangeEvent } from 'react';
import {
  AlertTriangle,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileUp,
  Layers,
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
        <div className="h-28 skeleton-shimmer" />
        <div className="h-28 skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {granulesError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 border border-[#D97706] bg-[#FEF3C7] px-3 py-2 text-xs text-[#18181B]"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
            <span>{granulesError}</span>
          </div>
          <button
            type="button"
            onClick={onRetryGranules}
            className="inline-flex items-center gap-1 border border-[#18181B] bg-[#EBEBE8] px-2.5 py-1 text-xs font-semibold hover:bg-[#18181B] hover:text-[#EBEBE8]"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Primary Open Data Sources & Provenance */}
      <div className="border border-[#18181B] bg-[#F4F4F5] p-3.5 space-y-2.5">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#0066FF]">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Verified Open NASA &amp; ISRO Data Sources</span>
        </div>
        <ul className="space-y-1.5 text-xs text-[#52525B]">
          <li>
            <strong className="text-[#18181B]">1. NASA–ISRO NISAR Cycle 035 HDF5 (.h5):</strong> Level-2 L-band (24 cm) GCOV Polarimetric Covariance &amp; GUNW Unwrapped Interferograms via ASF DAAC Vertex.
          </li>
          <li>
            <strong className="text-[#18181B]">2. NASA GIBS MODIS Terra TrueColor WMTS:</strong> Optical orbital reference demonstrating monsoon cloud occlusion vs cloud-piercing SAR.
          </li>
          <li>
            <strong className="text-[#18181B]">3. NASA POWER Agroclimatology API:</strong> Daily precipitation (<code className="font-mono">PRECTOTCORR</code>) &amp; root-zone wetness (<code className="font-mono">GWETROOT</code>).
          </li>
          <li>
            <strong className="text-[#18181B]">4. NASA EONET v3 API:</strong> Open natural hazard event tracking overlaid when Live Fetch is enabled.
          </li>
        </ul>
      </div>

      {/* Downloaded ASF Vertex HDF5 (.h5) Internal Dataset Paths */}
      <div className="border border-[#0066FF] bg-[#EBEBE8] p-3.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#18181B]">
            ASF Vertex HDF5 (.h5) Primary Granule
          </span>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 border border-[#0066FF] bg-[#0066FF] text-white">
            Cycle {String(hdf5Manifest.cycle).padStart(3, '0')} · CRID {hdf5Manifest.crid}
          </span>
        </div>
        <div className="font-mono text-[11px] font-bold text-[#0066FF] break-all">
          {hdf5Manifest.filename}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[11px] text-[#18181B] tabular-nums">
          <div>Track: {String(hdf5Manifest.track).padStart(3, '0')}</div>
          <div>Frame: {String(hdf5Manifest.frame).padStart(3, '0')}</div>
          <div>Orbit: {hdf5Manifest.orbitDirection}</div>
          <div>BW: {hdf5Manifest.bandwidth}</div>
          <div>Pol: {hdf5Manifest.polarizationMode}</div>
          <div className="truncate" title={hdf5Manifest.acquisitionUtc}>
            UTC: {hdf5Manifest.acquisitionUtc}
          </div>
        </div>
        <div className="border border-[#D4D4D8] bg-[#F4F4F5] p-2.5 font-mono text-[10px] text-[#52525B] space-y-1">
          <div className="text-[#18181B] font-bold uppercase">HDF5 Internal Dataset Paths</div>
          <div className="break-all">HH Covariance: {hdf5Manifest.paths.hhhh}</div>
          <div className="break-all">HV Covariance: {hdf5Manifest.paths.hvhv}</div>
          <div className="break-all">Footprint WKT: {hdf5Manifest.paths.boundingPolygon}</div>
        </div>
      </div>

      {/* Custom GeoJSON / Granule Metadata Uploader */}
      <div className="border border-dashed border-[#18181B] bg-[#F4F4F5] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-[#18181B]">
              Import ASF Vertex GeoJSON / Granule JSON
            </div>
            <p className="text-[11px] text-[#52525B]">
              Inspect custom `.geojson` or `.json` SAR scene exports locally in browser.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1.5 border border-[#18181B] bg-[#18181B] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#EBEBE8] hover:bg-[#0066FF] hover:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]">
            <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
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
          <p className="mt-2 text-xs text-[#166534] font-semibold">{uploadStatus}</p>
        )}
        {uploadError && (
          <p className="mt-2 text-xs text-[#DC2626] font-semibold" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      {/* Granules List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#18181B]">
            <Database className="h-3.5 w-3.5 text-[#0066FF]" aria-hidden="true" />
            <span>ASF Vertex Catalog ({combinedGranules.length})</span>
          </span>
          <span className="font-mono text-[10px] uppercase text-[#52525B]">
            {granulesData?.source === 'ASF_VERTEX_LIVE_API'
              ? `Live (${granulesData.liveCount} scenes)`
              : 'Bundled Extract'}
          </span>
        </div>

        {combinedGranules.length === 0 ? (
          <div className="border border-[#D4D4D8] bg-[#F4F4F5] p-4 text-xs text-[#52525B]">
            No matching SAR granules found for this bounding box.
          </div>
        ) : (
          combinedGranules.map((g) => {
            const isExpanded = expandedJsonId === g.granuleId;
            return (
              <div
                key={g.granuleId}
                className="border border-[#D4D4D8] bg-[#F4F4F5] p-3 space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold text-[#0066FF] break-all">
                      {g.sceneName}
                    </div>
                    <div className="text-[11px] text-[#52525B] mt-0.5">
                      {g.mission} · {g.beamMode} · {g.polarization}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 border border-[#18181B] bg-[#EBEBE8] text-[#18181B] shrink-0">
                    {g.processingLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono tabular-nums text-[#18181B]">
                  <div>Date: {g.acquisitionDate}</div>
                  <div>Orbit: {g.orbitDirection}</div>
                  <div>Track/Frame: {g.trackNumber}/{g.frameNumber}</div>
                  <div>λ: {g.wavelengthCm.toFixed(1)} cm</div>
                  <div>Res: {g.spatialResolutionM} m</div>
                  <div className="truncate">
                    Src: {g.source === 'CUSTOM_UPLOAD' ? 'Upload' : g.source === 'ASF_VERTEX_LIVE_API' ? 'ASF Live' : 'ASF Sample'}
                  </div>
                </div>

                <p className="text-[11px] text-[#52525B]">{g.browseNote}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedJsonId(isExpanded ? null : g.granuleId)
                    }
                    className="inline-flex items-center gap-1 border border-[#D4D4D8] bg-[#EBEBE8] px-2.5 py-1 text-[11px] font-semibold text-[#18181B] hover:border-[#18181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
                  >
                    <Code2 className="h-3 w-3 text-[#0066FF]" aria-hidden="true" />
                    <span>{isExpanded ? 'Hide JSON' : 'Inspect JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadMetadata(g)}
                    className="inline-flex items-center gap-1 border border-[#D4D4D8] bg-[#EBEBE8] px-2.5 py-1 text-[11px] font-semibold text-[#18181B] hover:border-[#18181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
                  >
                    <Download className="h-3 w-3 text-[#0066FF]" aria-hidden="true" />
                    <span>Download JSON</span>
                  </button>

                  <a
                    href={g.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#0066FF] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
                  >
                    <span>ASF Vertex</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>

                {isExpanded && (
                  <pre className="mt-2 max-h-48 overflow-auto border border-[#D4D4D8] bg-[#18181B] p-2.5 font-mono text-[11px] text-[#EBEBE8]">
                    {JSON.stringify(g, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Live NASA EONET Hazard Feed */}
      <div className="border border-[#D4D4D8] bg-[#F4F4F5] p-3">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#18181B] mb-1">
          NASA EONET Regional Hazard Feed
        </div>
        {demoMode ? (
          <p className="text-[11px] text-[#52525B]">
            Sample Mode is active. Toggle <strong>Sample / Live</strong> in the top bar to query open NASA EONET hazard events for this bounding box.
          </p>
        ) : eonetEvents.length === 0 ? (
          <p className="text-[11px] text-[#52525B]">
            No active open EONET hazard events currently overlap this bounding box.
          </p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {eonetEvents.slice(0, 4).map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between gap-2 text-[#18181B]"
              >
                <span className="truncate">{ev.title}</span>
                <span className="font-mono text-[10px] text-[#D97706] shrink-0">
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
