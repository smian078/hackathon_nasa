import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Footer } from './components/Footer.tsx';
import { HomeLandingView } from './components/HomeLandingView.tsx';
import { Navbar } from './components/Navbar.tsx';
import { PageAwareAssistant } from './components/PageAwareAssistant.tsx';
import { RegionExplorerView } from './components/RegionExplorerView.tsx';
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
  DatasetAspectId,
  EonetEvent,
  LanguageCode,
  LayerMode,
  NasaPowerApiResponse,
  PageViewMode,
  PhysicalDriverSynthesis,
  RegionId,
  SavedSnapshot,
} from './types/sar.ts';
import {
  getDatasetAspectsForRegion,
  getDefaultAspectForRegion,
} from './utils/globeMath.ts';
import { computePassDelta, formatSigned } from './utils/sarPhysics.ts';

const AboutDataModal = lazy(() =>
  import('./components/AboutDataModal.tsx').then((m) => ({
    default: m.AboutDataModal,
  }))
);

export default function App() {
  const [pageView, setPageView] = useState<PageViewMode>('HOME_3D_GLOBE');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [activeRegionId, setActiveRegionId] =
    useState<RegionId>('maharashtra_gcov');
  const [activeAspect, setActiveAspect] = useState<DatasetAspectId | null>(
    'flood_water'
  );
  const [layerMode, setLayerMode] = useState<LayerMode>('GCOV_HH');
  const [passIndex, setPassIndex] = useState<number>(2);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('mh_gosikhurd');
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [splitPercent, setSplitPercent] = useState<number>(42);
  const [coherenceThreshold, setCoherenceThreshold] = useState<number>(0.35);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshot[]>(() =>
    loadSavedSnapshots()
  );

  const [powerData, setPowerData] = useState<NasaPowerApiResponse | null>(null);
  const [isLoadingPower, setIsLoadingPower] = useState<boolean>(false);
  const [powerError, setPowerError] = useState<string | null>(null);

  const [granulesData, setGranulesData] =
    useState<AsfGranulesApiResponse | null>(null);
  const [isLoadingGranules, setIsLoadingGranules] = useState<boolean>(false);
  const [granulesError, setGranulesError] = useState<string | null>(null);

  const [eonetEvents, setEonetEvents] = useState<EonetEvent[]>([]);

  const [synthesis, setSynthesis] = useState<PhysicalDriverSynthesis | null>(
    null
  );
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);

  const region = REGION_DATASETS[activeRegionId];
  const selectedZone =
    region.zones.find((z) => z.id === selectedZoneId) ?? region.zones[0] ?? null;
  const activePass =
    selectedZone?.passes[passIndex] ?? region.zones[0].passes[passIndex];

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

  const selectRegionAndEnterMap = useCallback((id: RegionId) => {
    const nextRegion = REGION_DATASETS[id];
    setActiveRegionId(id);
    setSelectedZoneId(nextRegion.zones[0].id);
    setLayerMode(nextRegion.productType === 'GUNW' ? 'GUNW_LOS' : 'GCOV_HH');
    setActiveAspect(getDefaultAspectForRegion(id));
    setSynthesis(null);
    setSynthesisError(null);
    setIsTransitioning(true);

    window.setTimeout(() => {
      setPageView('REGION_2D_MAP');
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 180);
  }, []);

  const handleToggleAspect = (aspectId: DatasetAspectId) => {
    if (activeAspect === aspectId) {
      setActiveAspect(null);
      return;
    }
    setActiveAspect(aspectId);
    const meta = getDatasetAspectsForRegion(activeRegionId).find(
      (a) => a.id === aspectId
    );
    if (meta?.recommendedLayerMode) {
      setLayerMode(meta.recommendedLayerMode);
    }
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
    setActiveAspect(getDefaultAspectForRegion(snap.regionId));
    setPageView('REGION_2D_MAP');
    setSynthesis(null);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSavedSnapshots(removeSavedSnapshot(id));
  };

  const metricsSummary =
    region.productType === 'GUNW'
      ? `LOS ${formatSigned(activePass.losDisplacementCm ?? 0, 1)} cm, γ ${(activePass.coherence ?? 0).toFixed(2)}, Rain ${activePass.rainfallMm.toFixed(1)} mm/d`
      : `HH ${activePass.hhGamma0Db.toFixed(1)} dB, HV ${activePass.hvGamma0Db.toFixed(1)} dB, Rain ${activePass.rainfallMm.toFixed(1)} mm/d`;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#EBEBE8] text-[#18181B]">
      {/* Fixed 12-Column Structural Background Grid (0.10 opacity #18181B, max-w-1600px) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 mx-auto max-w-[1600px] grid grid-cols-12"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border-r border-[#18181B]/10 first:border-l" />
        ))}
      </div>

      {/* Global 4% Fractal Noise Texture Overlay */}
      <div
        aria-hidden="true"
        className="industrial-noise-overlay pointer-events-none fixed inset-0 z-[1500]"
      />

      <Navbar
        pageView={pageView}
        onNavigateHome={() => {
          setPageView('HOME_3D_GLOBE');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onEnterExplorer={() => selectRegionAndEnterMap(activeRegionId)}
        activeRegionId={activeRegionId}
        onSelectRegion={selectRegionAndEnterMap}
        demoMode={demoMode}
        onToggleDemoMode={() => setDemoMode((prev) => !prev)}
        language={language}
        onSelectLanguage={(lang) => {
          setLanguage(lang);
          setSynthesis(null);
        }}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <main className="relative z-10 flex-1">
        {pageView === 'HOME_3D_GLOBE' ? (
          <HomeLandingView
            activeRegionId={activeRegionId}
            onSelectRegionFromGlobe={selectRegionAndEnterMap}
            isTransitioning={isTransitioning}
            onOpenAbout={() => setIsAboutOpen(true)}
          />
        ) : (
          <RegionExplorerView
            region={region}
            activeRegionId={activeRegionId}
            onSelectRegion={selectRegionAndEnterMap}
            onReturnToGlobe={() => {
              setPageView('HOME_3D_GLOBE');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            activeAspect={activeAspect}
            onToggleAspect={handleToggleAspect}
            selectedZone={selectedZone}
            onSelectZone={handleSelectZone}
            layerMode={layerMode}
            onSelectLayerMode={setLayerMode}
            passIndex={passIndex}
            onSelectPass={setPassIndex}
            coherenceThreshold={coherenceThreshold}
            onChangeCoherenceThreshold={setCoherenceThreshold}
            demoMode={demoMode}
            splitPercent={splitPercent}
            onChangeSplitPercent={setSplitPercent}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((prev) => !prev)}
            onPinSnapshot={handlePinSnapshot}
            savedSnapshots={savedSnapshots}
            onLoadSnapshot={handleLoadSnapshot}
            onDeleteSnapshot={handleDeleteSnapshot}
            powerData={powerData}
            isLoadingPower={isLoadingPower}
            powerError={powerError}
            onRetryPower={() => void loadRegionalData()}
            language={language}
            onSelectLanguage={(lang) => {
              setLanguage(lang);
              setSynthesis(null);
            }}
            synthesis={synthesis}
            isSynthesizing={isSynthesizing}
            synthesisError={synthesisError}
            onSynthesize={() => void handleSynthesize()}
            granulesData={granulesData}
            isLoadingGranules={isLoadingGranules}
            granulesError={granulesError}
            onRetryGranules={() => void loadRegionalData()}
            eonetEvents={eonetEvents}
          />
        )}
      </main>

      <Footer onOpenAbout={() => setIsAboutOpen(true)} />

      <PageAwareAssistant
        pageView={pageView}
        activeRegionId={activeRegionId}
        activeAspect={activeAspect}
        zoneName={selectedZone?.name}
        passDate={activePass?.acquisitionDate}
        layerMode={layerMode}
        metricsSummary={metricsSummary}
        language={language}
        onSelectLanguage={(lang) => {
          setLanguage(lang);
          setSynthesis(null);
        }}
      />

      <Suspense fallback={null}>
        <AboutDataModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
        />
      </Suspense>
    </div>
  );
}
