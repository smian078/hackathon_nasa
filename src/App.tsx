import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Activity, Cpu, Database } from 'lucide-react';
import { CloudPiercerMap } from './components/CloudPiercerMap.tsx';
import { Footer } from './components/Footer.tsx';
import { GranuleInspector } from './components/GranuleInspector.tsx';
import { Navbar } from './components/Navbar.tsx';
import { OrbitalTimeScrubber } from './components/OrbitalTimeScrubber.tsx';
import { PhysicalDriverSynthesizer } from './components/PhysicalDriverSynthesizer.tsx';
import { TelemetryPanel } from './components/TelemetryPanel.tsx';
import { REGION_DATASETS } from './data/samples/asfVertexSamples.ts';
import {
  fetchAsfGranules,
  fetchEonetEvents,
  fetchNasaPowerSeries,
  loadSavedSnapshots,
  persistSavedSnapshot,
  removeSavedSnapshot,
  synthesizePhysicalDrivers,
} from './services/nisarApi.ts';
import type {
  AsfGranulesApiResponse,
  EonetEvent,
  LanguageCode,
  LayerMode,
  NasaPowerApiResponse,
  PhysicalDriverSynthesis,
  RegionId,
  SavedSnapshot,
} from './types/sar.ts';
import { computePassDelta } from './utils/sarPhysics.ts';

const AboutDataModal = lazy(() =>
  import('./components/AboutDataModal.tsx').then((m) => ({
    default: m.AboutDataModal,
  }))
);

type DockTab = 'telemetry' | 'synthesizer' | 'granules';

export default function App() {
  const [activeRegionId, setActiveRegionId] =
    useState<RegionId>('maharashtra_gcov');
  const [layerMode, setLayerMode] = useState<LayerMode>('GCOV_HH');
  const [passIndex, setPassIndex] = useState<number>(2);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('mh_gosikhurd');
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [activeDockTab, setActiveDockTab] = useState<DockTab>('telemetry');
  const [splitPercent, setSplitPercent] = useState<number>(42);
  const [coherenceThreshold, setCoherenceThreshold] = useState<number>(0.35);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Saved snapshots in localStorage
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshot[]>(() =>
    loadSavedSnapshots()
  );

  // NASA POWER state
  const [powerData, setPowerData] = useState<NasaPowerApiResponse | null>(null);
  const [isLoadingPower, setIsLoadingPower] = useState<boolean>(false);
  const [powerError, setPowerError] = useState<string | null>(null);

  // ASF Granules state
  const [granulesData, setGranulesData] =
    useState<AsfGranulesApiResponse | null>(null);
  const [isLoadingGranules, setIsLoadingGranules] = useState<boolean>(false);
  const [granulesError, setGranulesError] = useState<string | null>(null);

  // EONET events
  const [eonetEvents, setEonetEvents] = useState<EonetEvent[]>([]);

  // Gemini synthesis state
  const [synthesis, setSynthesis] = useState<PhysicalDriverSynthesis | null>(
    null
  );
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);

  const region = REGION_DATASETS[activeRegionId];
  const selectedZone =
    region.zones.find((z) => z.id === selectedZoneId) ?? region.zones[0] ?? null;

  const loadRegionalData = useCallback(async () => {
    const currentRegion = REGION_DATASETS[activeRegionId];
    setIsLoadingPower(true);
    setIsLoadingGranules(true);
    setPowerError(null);
    setGranulesError(null);

    try {
      const powerResp = await fetchNasaPowerSeries(currentRegion, demoMode);
      setPowerData(powerResp);
    } catch (err) {
      setPowerError(
        err instanceof Error
          ? `${err.message}. Falling back to bundled POWER sample.`
          : 'Could not reach NASA POWER API.'
      );
      setPowerData({
        lat: currentRegion.center[0],
        lon: currentRegion.center[1],
        source: 'NASA_POWER_BUNDLED',
        series: currentRegion.powerSeries,
        cached: false,
      });
    } finally {
      setIsLoadingPower(false);
    }

    try {
      const asfResp = await fetchAsfGranules(
        activeRegionId,
        currentRegion.productType,
        demoMode
      );
      setGranulesData(asfResp);
    } catch (err) {
      setGranulesError(
        err instanceof Error
          ? `${err.message}. Showing bundled ASF Vertex extract.`
          : 'Could not reach ASF Vertex search proxy.'
      );
      setGranulesData({
        region: activeRegionId,
        product: currentRegion.productType,
        source: 'ASF_VERTEX_BUNDLED_SAMPLE',
        liveCount: 0,
        granules: currentRegion.granules,
        cached: false,
      });
    } finally {
      setIsLoadingGranules(false);
    }

    try {
      const eonetResp = await fetchEonetEvents(currentRegion.bbox, demoMode);
      setEonetEvents(eonetResp.events);
    } catch {
      setEonetEvents([]);
    }
  }, [activeRegionId, demoMode]);

  useEffect(() => {
    void loadRegionalData();
  }, [loadRegionalData]);

  // Orbital pass autoplay loop (automatically respects prefers-reduced-motion)
  useEffect(() => {
    if (!isPlaying) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setInterval(() => {
      setPassIndex((prev) => (prev + 1) % 4);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const handleSelectRegion = (id: RegionId) => {
    setActiveRegionId(id);
    const nextRegion = REGION_DATASETS[id];
    setSelectedZoneId(nextRegion.zones[0].id);
    setLayerMode(nextRegion.productType === 'GUNW' ? 'GUNW_LOS' : 'GCOV_HH');
    setSynthesis(null);
    setSynthesisError(null);
  };

  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setSynthesis(null);
    setSynthesisError(null);
  };

  const handleSynthesize = async () => {
    if (!selectedZone) return;
    const pass = selectedZone.passes[passIndex] ?? selectedZone.passes[0];
    const delta = computePassDelta(selectedZone, passIndex);

    setIsSynthesizing(true);
    setSynthesisError(null);

    try {
      const result = await synthesizePhysicalDrivers({
        regionId: region.id,
        zoneName: selectedZone.name,
        productType: region.productType,
        hhDb: pass.hhGamma0Db,
        hvDb: pass.hvGamma0Db,
        deltaHhDb: delta.deltaHhDb,
        deltaHvDb: delta.deltaHvDb,
        losDisplacementCm: pass.losDisplacementCm,
        coherence: pass.coherence,
        rainfallMm: pass.rainfallMm,
        soilMoistureIndex: pass.soilMoistureIndex,
        language,
      });
      setSynthesis(result);
    } catch (err) {
      setSynthesisError(
        err instanceof Error
          ? err.message
          : 'Failed to synthesize physical drivers.'
      );
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePinSnapshot = () => {
    if (!selectedZone) return;
    const pass = selectedZone.passes[passIndex] ?? selectedZone.passes[0];
    const snap: SavedSnapshot = {
      id: `${region.id}-${selectedZone.id}-${pass.passCode}`,
      createdAt: new Date().toISOString(),
      regionId: region.id,
      regionTitle: region.shortName,
      zoneId: selectedZone.id,
      zoneName: selectedZone.name,
      passIndex,
      acquisitionDate: pass.acquisitionDate,
      layerMode,
      hhDb: pass.hhGamma0Db,
      hvDb: pass.hvGamma0Db,
      losDisplacementCm: pass.losDisplacementCm,
      coherence: pass.coherence,
      rainfallMm: pass.rainfallMm,
    };
    setSavedSnapshots(persistSavedSnapshot(snap));
  };

  const handleLoadSnapshot = (snap: SavedSnapshot) => {
    setActiveRegionId(snap.regionId);
    setSelectedZoneId(snap.zoneId);
    setPassIndex(snap.passIndex);
    setLayerMode(snap.layerMode);
    setSynthesis(null);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSavedSnapshots(removeSavedSnapshot(id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#100E14] text-[#F8FAFC]">
      <Navbar
        activeRegionId={activeRegionId}
        onSelectRegion={handleSelectRegion}
        demoMode={demoMode}
        onToggleDemoMode={() => setDemoMode((prev) => !prev)}
        language={language}
        onSelectLanguage={(lang) => {
          setLanguage(lang);
          setSynthesis(null);
        }}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 space-y-4">
        {/* Region Header Banner */}
        <section
          aria-label="Active study area summary"
          className="flex flex-wrap items-center justify-between gap-3 px-1"
        >
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F8FAFC]">
              {region.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
              {region.subtitle}
            </p>
          </div>
          <div className="font-mono text-xs text-[#94A3B8] tabular-nums shrink-0">
            BBox: [{region.bbox.map((v) => v.toFixed(2)).join(', ')}] · Product: {region.productType}
          </div>
        </section>

        {/* 12-Column Command Console Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left / Center Stage (7 Columns on Desktop) */}
          <div className="lg:col-span-7 space-y-4">
            <CloudPiercerMap
              region={region}
              selectedZone={selectedZone}
              onSelectZone={handleSelectZone}
              layerMode={layerMode}
              onSelectLayerMode={setLayerMode}
              passIndex={passIndex}
              coherenceThreshold={coherenceThreshold}
              onChangeCoherenceThreshold={setCoherenceThreshold}
              demoMode={demoMode}
              splitPercent={splitPercent}
              onChangeSplitPercent={setSplitPercent}
            />

            <OrbitalTimeScrubber
              region={region}
              selectedZone={selectedZone}
              passIndex={passIndex}
              onSelectPass={setPassIndex}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((prev) => !prev)}
              onPinSnapshot={handlePinSnapshot}
              savedSnapshots={savedSnapshots}
              onLoadSnapshot={handleLoadSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
            />
          </div>

          {/* Right Intelligence Dock (5 Columns on Desktop) */}
          <aside
            aria-label="Telemetry, Physical Driver Synthesis, and Granule Inspector"
            className="lg:col-span-5 aura-glass rounded-2xl overflow-hidden"
          >
            {/* Dock Tab Bar */}
            <div
              role="tablist"
              aria-label="Intelligence dock views"
              className="grid grid-cols-3 border-b border-white/10 bg-[#16131C]/95 p-1.5 gap-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeDockTab === 'telemetry'}
                onClick={() => setActiveDockTab('telemetry')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
                  activeDockTab === 'telemetry'
                    ? 'bg-[#C04CFD]/25 text-[#F8FAFC] border border-[#C04CFD]/50'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] border border-transparent'
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
                <span>Telemetry</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeDockTab === 'synthesizer'}
                onClick={() => setActiveDockTab('synthesizer')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
                  activeDockTab === 'synthesizer'
                    ? 'bg-[#C04CFD]/25 text-[#F8FAFC] border border-[#C04CFD]/50'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] border border-transparent'
                }`}
              >
                <Cpu className="h-3.5 w-3.5 text-[#C04CFD]" aria-hidden="true" />
                <span>Driver AI</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeDockTab === 'granules'}
                onClick={() => setActiveDockTab('granules')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
                  activeDockTab === 'granules'
                    ? 'bg-[#C04CFD]/25 text-[#F8FAFC] border border-[#C04CFD]/50'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] border border-transparent'
                }`}
              >
                <Database className="h-3.5 w-3.5 text-[#D4F844]" aria-hidden="true" />
                <span>ASF Granules</span>
              </button>
            </div>

            {/* Active Tab Panel Content */}
            <div className="p-4" role="tabpanel">
              {activeDockTab === 'telemetry' && (
                <TelemetryPanel
                  region={region}
                  selectedZone={selectedZone}
                  onSelectZone={handleSelectZone}
                  passIndex={passIndex}
                  powerData={powerData}
                  isLoadingPower={isLoadingPower}
                  powerError={powerError}
                  onRetryPower={() => void loadRegionalData()}
                />
              )}

              {activeDockTab === 'synthesizer' && (
                <PhysicalDriverSynthesizer
                  region={region}
                  selectedZone={selectedZone}
                  passIndex={passIndex}
                  language={language}
                  onSelectLanguage={(lang) => {
                    setLanguage(lang);
                    setSynthesis(null);
                  }}
                  synthesis={synthesis}
                  isSynthesizing={isSynthesizing}
                  synthesisError={synthesisError}
                  onSynthesize={() => void handleSynthesize()}
                />
              )}

              {activeDockTab === 'granules' && (
                <GranuleInspector
                  region={region}
                  granulesData={granulesData}
                  isLoadingGranules={isLoadingGranules}
                  granulesError={granulesError}
                  onRetryGranules={() => void loadRegionalData()}
                  eonetEvents={eonetEvents}
                  demoMode={demoMode}
                />
              )}
            </div>
          </aside>
        </div>
      </main>

      <Footer onOpenAbout={() => setIsAboutOpen(true)} />

      <Suspense fallback={null}>
        <AboutDataModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
        />
      </Suspense>
    </div>
  );
}
