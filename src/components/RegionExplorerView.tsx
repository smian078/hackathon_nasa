import { ArrowLeft, ChevronDown, ChevronUp, Compass, Layers } from 'lucide-react';
import { REGION_DATASETS } from '../data/samples/asfVertexSamples.ts';
import type {
  AsfGranulesApiResponse,
  DatasetAspectId,
  EonetEvent,
  LanguageCode,
  LayerMode,
  NasaPowerApiResponse,
  PhysicalDriverSynthesis,
  RegionDataset,
  RegionId,
  SavedSnapshot,
  StudyZone,
} from '../types/sar.ts';
import { getDatasetAspectsForRegion } from '../utils/globeMath.ts';
import {
  computePassDelta,
  formatSigned,
  getPolygonVisualStyle,
} from '../utils/sarPhysics.ts';
import { CloudPiercerMap } from './CloudPiercerMap.tsx';
import { GranuleInspector } from './GranuleInspector.tsx';
import { OrbitalTimeScrubber } from './OrbitalTimeScrubber.tsx';
import { PhysicalDriverSynthesizer } from './PhysicalDriverSynthesizer.tsx';
import { TelemetryPanel } from './TelemetryPanel.tsx';

interface RegionExplorerViewProps {
  region: RegionDataset;
  activeRegionId: RegionId;
  onSelectRegion: (id: RegionId) => void;
  onReturnToGlobe: () => void;
  activeAspect: DatasetAspectId | null;
  onToggleAspect: (aspectId: DatasetAspectId) => void;
  selectedZone: StudyZone | null;
  onSelectZone: (zoneId: string) => void;
  layerMode: LayerMode;
  onSelectLayerMode: (mode: LayerMode) => void;
  passIndex: number;
  onSelectPass: (idx: number) => void;
  coherenceThreshold: number;
  onChangeCoherenceThreshold: (val: number) => void;
  demoMode: boolean;
  splitPercent: number;
  onChangeSplitPercent: (val: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPinSnapshot: () => void;
  savedSnapshots: SavedSnapshot[];
  onLoadSnapshot: (snap: SavedSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  powerData: NasaPowerApiResponse | null;
  isLoadingPower: boolean;
  powerError: string | null;
  onRetryPower: () => void;
  language: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  synthesis: PhysicalDriverSynthesis | null;
  isSynthesizing: boolean;
  synthesisError: string | null;
  onSynthesize: () => void;
  granulesData: AsfGranulesApiResponse | null;
  isLoadingGranules: boolean;
  granulesError: string | null;
  onRetryGranules: () => void;
  eonetEvents: EonetEvent[];
}

const REGION_SWITCH_ITEMS: Array<{ id: RegionId; label: string }> = [
  { id: 'maharashtra_gcov', label: '01 · Maharashtra' },
  { id: 'northeast_india_gcov', label: '02 · Northeast India' },
  { id: 'japan_gunw', label: '03 · Japan' },
];

export function RegionExplorerView({
  region,
  activeRegionId,
  onSelectRegion,
  onReturnToGlobe,
  activeAspect,
  onToggleAspect,
  selectedZone,
  onSelectZone,
  layerMode,
  onSelectLayerMode,
  passIndex,
  onSelectPass,
  coherenceThreshold,
  onChangeCoherenceThreshold,
  demoMode,
  splitPercent,
  onChangeSplitPercent,
  isPlaying,
  onTogglePlay,
  onPinSnapshot,
  savedSnapshots,
  onLoadSnapshot,
  onDeleteSnapshot,
  powerData,
  isLoadingPower,
  powerError,
  onRetryPower,
  language,
  onSelectLanguage,
  synthesis,
  isSynthesizing,
  synthesisError,
  onSynthesize,
  granulesData,
  isLoadingGranules,
  granulesError,
  onRetryGranules,
  eonetEvents,
}: RegionExplorerViewProps) {
  const aspects = getDatasetAspectsForRegion(region.id);
  const activeZone = selectedZone ?? region.zones[0];
  const activePass = activeZone.passes[passIndex] ?? activeZone.passes[0];
  const activeDelta = computePassDelta(activeZone, passIndex);

  return (
    <div className="map-enter-reveal mx-auto w-full max-w-[1600px] border-x border-[#D4D4D8] px-4 sm:px-8 py-6 space-y-6">
      {/* Top 2D Explorer Navigation & Metadata Bar */}
      <section
        aria-label="Active study region navigation bar"
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#D4D4D8]"
      >
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="back-to-globe-btn"
              onClick={onReturnToGlobe}
              className="inline-flex items-center gap-2 border border-[#18181B] bg-[#18181B] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#EBEBE8] hover:bg-[#0066FF] hover:border-[#0066FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>3D Earth Home</span>
            </button>

            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#0066FF]">
              2D Projection · Level-2 {region.productType}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.03em] text-[#18181B]">
            {region.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B]">{region.subtitle}</p>
        </div>

        {/* Region Switcher Pills & BBox */}
        <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
          <div
            role="group"
            aria-label="Switch 2D map study area"
            className="flex flex-wrap gap-1.5"
          >
            {REGION_SWITCH_ITEMS.map((item) => {
              const active = item.id === activeRegionId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectRegion(item.id)}
                  aria-pressed={active}
                  className={`border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
                    active
                      ? 'border-[#0066FF] bg-[#0066FF] text-white'
                      : 'border-[#D4D4D8] bg-[#F4F4F5] text-[#18181B] hover:border-[#18181B]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#52525B] tabular-nums">
            BBox [{region.bbox.map((v) => v.toFixed(2)).join(', ')}] · {REGION_DATASETS[region.id].zones.length} Sub-Zones
          </div>
        </div>
      </section>

      {/* Main 12-Col Grid: 2D Map Left (7 cols) + Toggleable Dataset Aspects Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stage (7 cols): 2D Map + Orbital Scrubber */}
        <div className="lg:col-span-7 space-y-5">
          <CloudPiercerMap
            region={region}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
            layerMode={layerMode}
            onSelectLayerMode={onSelectLayerMode}
            passIndex={passIndex}
            coherenceThreshold={coherenceThreshold}
            onChangeCoherenceThreshold={onChangeCoherenceThreshold}
            demoMode={demoMode}
            splitPercent={splitPercent}
            onChangeSplitPercent={onChangeSplitPercent}
          />

          <OrbitalTimeScrubber
            region={region}
            selectedZone={selectedZone}
            passIndex={passIndex}
            onSelectPass={onSelectPass}
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
            onPinSnapshot={onPinSnapshot}
            savedSnapshots={savedSnapshots}
            onLoadSnapshot={onLoadSnapshot}
            onDeleteSnapshot={onDeleteSnapshot}
          />
        </div>

        {/* Right Stage (5 cols): Toggleable Dataset Aspect Options */}
        <aside
          aria-label="Dataset aspects and detailed analysis toggles"
          className="lg:col-span-5 space-y-3"
        >
          <div className="flex items-center justify-between border border-[#D4D4D8] bg-[#F4F4F5] px-4 py-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#0066FF]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#18181B]">
                Dataset Aspects · Toggle Analysis
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#52525B]">
              {aspects.length} Modules
            </span>
          </div>

          <div className="space-y-2.5">
            {aspects.map((aspect) => {
              const isOpen = activeAspect === aspect.id;

              return (
                <div
                  key={aspect.id}
                  className={`border transition-colors ${
                    isOpen
                      ? 'border-[#18181B] bg-[#EBEBE8]'
                      : 'border-[#D4D4D8] bg-[#F4F4F5] hover:border-[#18181B]'
                  }`}
                >
                  {/* Toggle Header Button */}
                  <button
                    type="button"
                    data-testid={`aspect-toggle-${aspect.id}`}
                    aria-expanded={isOpen}
                    onClick={() => onToggleAspect(aspect.id)}
                    className="w-full px-4 py-3.5 text-left flex items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0066FF]"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                        <span className="text-[#0066FF]">{aspect.code}</span>
                        <span className="border border-[#D4D4D8] bg-[#EBEBE8] px-1.5 py-0.5 text-[#18181B]">
                          {aspect.shortTag}
                        </span>
                      </div>
                      <h2 className="text-sm font-bold text-[#18181B]">
                        {aspect.title}
                      </h2>
                      <p className="text-xs text-[#52525B] leading-snug">
                        {aspect.summary}
                      </p>
                    </div>

                    <span
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center border ${
                        isOpen
                          ? 'border-[#0066FF] bg-[#0066FF] text-white'
                          : 'border-[#D4D4D8] bg-[#EBEBE8] text-[#18181B]'
                      }`}
                    >
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                  </button>

                  {/* Expanded Aspect Detailed Analysis Content */}
                  {isOpen && (
                    <div
                      data-testid={`aspect-detail-${aspect.id}`}
                      className="border-t border-[#D4D4D8] bg-[#EBEBE8] p-4 space-y-4"
                    >
                      {(aspect.id === 'flood_water' ||
                        aspect.id === 'crop_canopy' ||
                        aspect.id === 'crustal_los' ||
                        aspect.id === 'coherence_mask') && (
                        <div className="space-y-4">
                          {/* Active Zone Deep Breakdown */}
                          <div className="border border-[#D4D4D8] bg-[#F4F4F5] p-3.5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#0066FF]">
                                Zone Signal Breakdown · {activePass.passCode} ({activePass.acquisitionDate})
                              </span>
                              <Compass className="h-3.5 w-3.5 text-[#0066FF]" aria-hidden="true" />
                            </div>
                            <div className="text-sm font-bold text-[#18181B]">
                              {activeZone.name}
                            </div>
                            <p className="text-xs text-[#52525B] leading-relaxed">
                              {aspect.id === 'flood_water' &&
                                `Co-polarized HH backscatter measures ${activePass.hhGamma0Db.toFixed(1)} dB (Δ ${formatSigned(activeDelta.deltaHhDb, 1)} dB vs baseline) with dielectric constant ε = ${activePass.dielectricConstantEst.toFixed(1)}. Values at or below -18.0 dB indicate smooth standing floodwater causing mirror-like specular reflection away from the radar antenna.`}
                              {aspect.id === 'crop_canopy' &&
                                `Cross-polarized HV backscatter reads ${activePass.hvGamma0Db.toFixed(1)} dB (HV/HH ratio ${formatSigned(activePass.hvHhRatioDb, 1)} dB) alongside ${activePass.surfaceRoughnessCm.toFixed(1)} cm roughness. Elevated HV (>= -12.5 dB) captures volumetric canopy scattering and flooded double-bounce stems.`}
                              {aspect.id === 'crustal_los' &&
                                `Unwrapped L-band interferometric phase measures ${formatSigned(activePass.unwrappedPhaseRad ?? 0, 2)} rad, resolving ${formatSigned(activePass.losDisplacementCm ?? 0, 1)} cm of Line-of-Sight motion (Δ ${formatSigned(activeDelta.deltaLosCm ?? 0, 1)} cm vs baseline).`}
                              {aspect.id === 'coherence_mask' &&
                                `Interferometric coherence is γ = ${(activePass.coherence ?? 0).toFixed(2)} against the current mask threshold γ >= ${coherenceThreshold.toFixed(2)}. Adjust the Mask γ slider below the 2D map to isolate bedrock vs decorrelated liquefaction/forest cells.`}
                            </p>
                          </div>

                          {/* All Sub-Zones Comparison Table (Click row to switch polygon) */}
                          <div className="space-y-1.5">
                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#52525B]">
                              Compare All {region.zones.length} Sub-Zones (Tap to Focus)
                            </div>
                            <div className="divide-y divide-[#D4D4D8] border border-[#D4D4D8] bg-[#F4F4F5]">
                              {region.zones.map((z) => {
                                const p = z.passes[passIndex] ?? z.passes[0];
                                const st = getPolygonVisualStyle(
                                  p,
                                  layerMode,
                                  coherenceThreshold
                                );
                                const isSel = z.id === activeZone.id;
                                return (
                                  <button
                                    key={z.id}
                                    type="button"
                                    onClick={() => onSelectZone(z.id)}
                                    className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
                                      isSel
                                        ? 'bg-[#18181B] text-[#EBEBE8]'
                                        : 'hover:bg-[#EBEBE8] text-[#18181B]'
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div className="truncate text-xs font-bold">
                                        {z.name}
                                      </div>
                                      <div
                                        className={`text-[11px] truncate ${
                                          isSel ? 'text-[#D4D4D8]' : 'text-[#52525B]'
                                        }`}
                                      >
                                        {st.classificationLabel}
                                      </div>
                                    </div>
                                    <div className="font-mono text-xs font-bold shrink-0 tabular-nums">
                                      {st.formattedValue} {st.unit}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {aspect.id === 'climate_power' && (
                        <TelemetryPanel
                          region={region}
                          selectedZone={selectedZone}
                          onSelectZone={onSelectZone}
                          passIndex={passIndex}
                          powerData={powerData}
                          isLoadingPower={isLoadingPower}
                          powerError={powerError}
                          onRetryPower={onRetryPower}
                        />
                      )}

                      {aspect.id === 'physics_ai' && (
                        <PhysicalDriverSynthesizer
                          region={region}
                          selectedZone={selectedZone}
                          passIndex={passIndex}
                          language={language}
                          onSelectLanguage={onSelectLanguage}
                          synthesis={synthesis}
                          isSynthesizing={isSynthesizing}
                          synthesisError={synthesisError}
                          onSynthesize={onSynthesize}
                        />
                      )}

                      {aspect.id === 'sources_hdf5' && (
                        <GranuleInspector
                          region={region}
                          granulesData={granulesData}
                          isLoadingGranules={isLoadingGranules}
                          granulesError={granulesError}
                          onRetryGranules={onRetryGranules}
                          eonetEvents={eonetEvents}
                          demoMode={demoMode}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
