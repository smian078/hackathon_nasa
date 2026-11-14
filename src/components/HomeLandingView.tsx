import { ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react';
import {
  NISAR_HDF5_MANIFEST,
  REGION_DATASETS,
} from '../data/samples/asfVertexSamples.ts';
import type { RegionId } from '../types/sar.ts';
import { EarthGlobeCanvas } from './EarthGlobeCanvas.tsx';

interface HomeLandingViewProps {
  activeRegionId: RegionId;
  onSelectRegionFromGlobe: (regionId: RegionId) => void;
  isTransitioning: boolean;
  onOpenAbout: () => void;
}

const REGION_ORDER: RegionId[] = [
  'maharashtra_gcov',
  'northeast_india_gcov',
  'japan_gunw',
];

const REGION_EDITORIAL_TAGS: Record<
  RegionId,
  { index: string; location: string; headline: string; focusMetric: string }
> = {
  maharashtra_gcov: {
    index: '01',
    location: 'WAINGANGA BASIN & WARDHA · INDIA',
    headline: 'Maharashtra Flood & Cotton',
    focusMetric: 'HH -21.4 dB · HV -11.2 dB · 118.6 mm Rain',
  },
  northeast_india_gcov: {
    index: '02',
    location: 'BRAHMAPUTRA & KAZIRANGA · INDIA',
    headline: 'Northeast Wetland Pulse',
    focusMetric: 'HH -22.8 dB · Ratio +6.6 dB · 99% Cloud Cover',
  },
  japan_gunw: {
    index: '03',
    location: 'NOTO PENINSULA & TOKYO BAY · JAPAN',
    headline: 'Japan Crustal Faults',
    focusMetric: 'LOS +18.2 cm · Phase +9.53 rad · γ = 0.86',
  },
};

export function HomeLandingView({
  activeRegionId,
  onSelectRegionFromGlobe,
  isTransitioning,
  onOpenAbout,
}: HomeLandingViewProps) {
  const scrollToRegions = () => {
    const el = document.getElementById('study-area-index');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Split Hero (12-Column Grid) */}
      <section
        aria-label="NISAR Pulse 3D Earth Hero"
        className="mx-auto max-w-[1600px] border-x border-b border-[#D4D4D8] px-4 sm:px-8 py-8 sm:py-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Hero Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Status Pulse */}
              <div className="inline-flex items-center gap-2.5 border border-[#D4D4D8] bg-[#F4F4F5] px-3 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22C55E]" />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#18181B]">
                  Available · Cycle 035 L-Band Radar Active
                </span>
              </div>

              {/* 3-Line Display Heading combining stroke-text + Playfair italic */}
              <h1 className="text-5xl sm:text-7xl xl:text-[108px] font-black uppercase leading-[0.88] tracking-[-0.05em] text-[#18181B]">
                <span className="block stroke-text">PIERCING</span>
                <span className="block font-serif-editorial lowercase font-normal tracking-[-0.02em] text-[#0066FF]">
                  monsoon
                </span>
                <span className="block">CLOUDS</span>
              </h1>

              <p className="max-w-xl text-sm sm:text-base text-[#52525B] leading-relaxed">
                Select any highlighted study area on the interactive 3D Earth or index below to morph directly into its 2D radar workspace—decoding L-band GCOV floodwater, crop canopy moisture, and GUNW centimeter-scale crustal deformation.
              </p>
            </div>

            {/* Mono Technical Readouts + Primary Rectangular CTA */}
            <div className="space-y-5 pt-2 border-t border-[#D4D4D8]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 font-mono">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#52525B]">
                    Wavelength
                  </div>
                  <div className="text-sm font-bold text-[#18181B] mt-1">
                    24.0 CM L-BAND
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#52525B]">
                    Level-2 Products
                  </div>
                  <div className="text-sm font-bold text-[#18181B] mt-1">
                    GCOV + GUNW
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#52525B]">
                    Active Regions
                  </div>
                  <div className="text-sm font-bold text-[#0066FF] mt-1">
                    MH · NE INDIA · JAPAN
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onSelectRegionFromGlobe(activeRegionId)}
                  className="group inline-flex items-center gap-3 border border-[#18181B] bg-[#18181B] px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#EBEBE8] hover:bg-[#0066FF] hover:border-[#0066FF] transition-colors duration-300 industrial-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
                >
                  <span>Start 2D Exploration</span>
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45"
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  onClick={scrollToRegions}
                  className="group inline-flex items-center gap-2 border border-[#D4D4D8] bg-[#F4F4F5] px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#18181B] hover:border-[#18181B] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
                >
                  <span>Browse Datasets</span>
                  <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={onOpenAbout}
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#52525B] underline underline-offset-4 hover:text-[#0066FF] px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
                >
                  Data Sources
                </button>
              </div>
            </div>
          </div>

          {/* Right Hero Column (5 cols): 3D Interactive Earth */}
          <div className="lg:col-span-5">
            <EarthGlobeCanvas
              activeRegionId={activeRegionId}
              onSelectRegionTransition={onSelectRegionFromGlobe}
              isTransitioning={isTransitioning}
            />
          </div>
        </div>
      </section>

      {/* Full-Width 120px Warm Industrial Marquee Ticker */}
      <section
        aria-label="Mission telemetry ticker"
        className="h-[120px] w-full overflow-hidden border-b border-[#D4D4D8] bg-[#F4F4F5] flex items-center"
      >
        <div className="marquee-track items-center gap-10">
          {[0, 1].map((dupIdx) => (
            <div key={dupIdx} className="flex items-center gap-10 pr-10">
              <span className="text-4xl sm:text-6xl font-black uppercase tracking-[-0.04em] stroke-text whitespace-nowrap">
                L-BAND 24CM
              </span>
              <Sparkles className="h-7 w-7 text-[#0066FF] shrink-0" aria-hidden="true" />
              <span className="text-4xl sm:text-6xl font-serif-editorial text-[#18181B] whitespace-nowrap">
                gcov polarimetry
              </span>
              <Sparkles className="h-7 w-7 text-[#0066FF] shrink-0" aria-hidden="true" />
              <span className="text-4xl sm:text-6xl font-black uppercase tracking-[-0.04em] stroke-text whitespace-nowrap">
                GUNW INTERFEROMETRY
              </span>
              <Sparkles className="h-7 w-7 text-[#0066FF] shrink-0" aria-hidden="true" />
              <span className="text-4xl sm:text-6xl font-serif-editorial text-[#18181B] whitespace-nowrap">
                cycle 035 asf vertex
              </span>
              <Sparkles className="h-7 w-7 text-[#0066FF] shrink-0" aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Project List (3 Study Areas with Clip-Path Hover Reveal) */}
      <section
        id="study-area-index"
        aria-label="Study Area Datasets"
        className="mx-auto max-w-[1600px] border-x border-[#D4D4D8]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4D4D8] px-4 sm:px-8 py-4 bg-[#EBEBE8]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#52525B]">
            Highlighted Globe Corridors · Click to Transition to 2D Map
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#18181B]">
            3 / 3 DATASETS READY
          </span>
        </div>

        <div>
          {REGION_ORDER.map((id) => {
            const region = REGION_DATASETS[id];
            const meta = REGION_EDITORIAL_TAGS[id];
            const manifest = NISAR_HDF5_MANIFEST[id];

            return (
              <button
                key={id}
                type="button"
                data-testid={`project-row-${id}`}
                onClick={() => onSelectRegionFromGlobe(id)}
                className="group relative w-full text-left border-b border-[#D4D4D8] bg-[#EBEBE8] hover:bg-[#F4F4F5] transition-colors duration-500 industrial-ease min-h-[240px] sm:h-[290px] px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0066FF]"
              >
                {/* Left Index & Details (7 cols) */}
                <div className="lg:col-span-7 space-y-3 z-10">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#52525B]">
                    <span className="text-[#0066FF]">{meta.index}</span>
                    <span>/</span>
                    <span>{meta.location}</span>
                    <span className="border border-[#D4D4D8] bg-[#EBEBE8] px-2 py-0.5 text-[#18181B]">
                      {region.productType} · TRACK {String(manifest.track).padStart(3, '0')}
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.03em] text-[#18181B] transition-all duration-500 industrial-ease group-hover:font-serif-editorial group-hover:font-normal group-hover:text-[#0066FF]">
                    {meta.headline}
                  </h2>

                  <p className="max-w-2xl text-xs sm:text-sm text-[#52525B]">
                    {region.subtitle}
                  </p>

                  <div className="font-mono text-[11px] font-semibold text-[#18181B] pt-1">
                    {meta.focusMetric}
                  </div>
                </div>

                {/* Right Clip-Path Reveal Radar Preview Card (5 cols) */}
                <div className="lg:col-span-5 relative h-36 sm:h-48 w-full border border-[#D4D4D8] bg-[#E2E2DE] overflow-hidden">
                  {/* Static subtle architectural grid behind preview */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 font-mono text-[10px] text-[#52525B]">
                    <div className="flex justify-between">
                      <span>LAT {region.center[0].toFixed(2)}°</span>
                      <span>LON {region.center[1].toFixed(2)}°</span>
                    </div>
                    <div className="text-[#18181B] font-bold uppercase tracking-[0.2em]">
                      HOVER / SELECT TO MORPH 3D → 2D
                    </div>
                    <div className="truncate opacity-80">{manifest.filename}</div>
                  </div>

                  {/* Right-to-left clip-path reveal panel */}
                  <div className="project-reveal-panel absolute inset-0 bg-[#18181B] text-[#EBEBE8] p-4 flex flex-col justify-between">
                    {/* Grayscale topographic SAR svg pattern + #0066FF/20 overlay */}
                    <svg
                      viewBox="0 0 400 180"
                      className="absolute inset-0 h-full w-full opacity-45 grayscale"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <defs>
                        <pattern
                          id={`grid-${id}`}
                          width="24"
                          height="24"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 24 0 L 0 0 0 24"
                            fill="none"
                            stroke="#EBEBE8"
                            strokeWidth="0.6"
                          />
                        </pattern>
                      </defs>
                      <rect width="400" height="180" fill={`url(#grid-${id})`} />
                      <path
                        d="M 30 130 Q 120 40 210 95 T 370 50"
                        fill="none"
                        stroke="#EBEBE8"
                        strokeWidth="2.5"
                      />
                      <polygon
                        points="90,55 180,35 230,115 115,135"
                        fill="rgba(235,235,232,0.22)"
                        stroke="#EBEBE8"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <div className="absolute inset-0 bg-[#0066FF]/20 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
                      <span>{region.zones.length} SUB-ZONES</span>
                      <span>CYCLE {String(manifest.cycle).padStart(3, '0')}</span>
                    </div>

                    <div className="relative z-10 flex items-end justify-between">
                      <div className="font-mono text-xs text-[#EBEBE8]/90">
                        <div>Open Interactive 2D Map</div>
                        <div className="text-[10px] text-[#EBEBE8]/70">
                          Toggleable Aspect Analysis
                        </div>
                      </div>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#EBEBE8] bg-[#0066FF] text-white font-mono text-[10px] font-bold uppercase tracking-[0.15em]">
                        View
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
