import { ArrowUpRight, Globe, Radio, Wifi, WifiOff } from 'lucide-react';
import type { LanguageCode, PageViewMode, RegionId } from '../types/sar.ts';
import { REGION_DATASETS } from '../data/samples/asfVertexSamples.ts';

interface NavbarProps {
  pageView: PageViewMode;
  onNavigateHome: () => void;
  onEnterExplorer: () => void;
  activeRegionId: RegionId;
  onSelectRegion: (id: RegionId) => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  language: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onOpenAbout: () => void;
}

const REGION_LINKS: Array<{ id: RegionId; label: string }> = [
  { id: 'maharashtra_gcov', label: 'Maharashtra' },
  { id: 'northeast_india_gcov', label: 'NE India' },
  { id: 'japan_gunw', label: 'Japan' },
];

export function Navbar({
  pageView,
  onNavigateHome,
  onEnterExplorer,
  activeRegionId,
  onSelectRegion,
  demoMode,
  onToggleDemoMode,
  language,
  onSelectLanguage,
  onOpenAbout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-[1050] h-20 w-full border-b border-[#D4D4D8] bg-[#EBEBE8]/85 backdrop-blur-[10px]">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-2 px-4 sm:px-8 relative">
        {/* Left Navigation Links (Tiny Caps 10px Tracked) */}
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-3 sm:gap-5 min-w-0"
        >
          <button
            type="button"
            onClick={onNavigateHome}
            aria-current={pageView === 'HOME_3D_GLOBE' ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
              pageView === 'HOME_3D_GLOBE'
                ? 'text-[#0066FF]'
                : 'text-[#18181B] hover:text-[#0066FF]'
            }`}
          >
            <Globe className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">3D Earth</span>
          </button>

          <div
            className="hidden md:flex items-center gap-3 border-l border-[#D4D4D8] pl-4"
            role="group"
            aria-label="Quick study region navigation"
          >
            {REGION_LINKS.map((item) => {
              const active =
                pageView === 'REGION_2D_MAP' && activeRegionId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectRegion(item.id)}
                  className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
                    active
                      ? 'text-[#0066FF] underline underline-offset-4'
                      : 'text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenAbout}
            className="hidden sm:inline-flex font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#52525B] hover:text-[#18181B] border-l border-[#D4D4D8] pl-3 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
          >
            Sources
          </button>
        </nav>

        {/* Absolute Centered Brand Mark (Serif Italic + Bold Sans) */}
        <button
          type="button"
          onClick={onNavigateHome}
          aria-label="Return to NISAR Pulse 3D Earth Home"
          className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 inline-flex items-baseline gap-1 text-[#18181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] px-1 shrink-0"
        >
          <span className="font-serif-editorial text-lg sm:text-2xl leading-none">
            Nisar
          </span>
          <span className="text-base sm:text-xl font-black uppercase tracking-[-0.04em] leading-none">
            PULSE
          </span>
        </button>

        {/* Right Controls: Mode + Language + Rounded-Full Header CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleDemoMode}
            aria-pressed={demoMode}
            title="Toggle between bundled Cycle 035 ASF sample telemetry and live NASA/ASF proxy fetches"
            className={`hidden sm:inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
              demoMode
                ? 'border-[#D4D4D8] bg-[#F4F4F5] text-[#18181B]'
                : 'border-[#0066FF] bg-[#0066FF]/10 text-[#0066FF]'
            }`}
          >
            {demoMode ? (
              <WifiOff className="h-3 w-3 text-[#52525B]" aria-hidden="true" />
            ) : (
              <Wifi className="h-3 w-3 text-[#0066FF]" aria-hidden="true" />
            )}
            <span>{demoMode ? 'Sample' : 'Live'}</span>
          </button>

          {/* Language Selector */}
          <div
            role="group"
            aria-label="Synthesis and assistant language"
            className="hidden xl:flex items-center border border-[#D4D4D8] bg-[#F4F4F5]"
          >
            {(
              [
                { code: 'en', label: 'EN' },
                { code: 'mr', label: 'MR' },
                { code: 'hi', label: 'HI' },
              ] as const
            ).map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => onSelectLanguage(item.code)}
                aria-pressed={language === item.code}
                className={`px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
                  language === item.code
                    ? 'bg-[#18181B] text-[#EBEBE8]'
                    : 'text-[#52525B] hover:text-[#18181B]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Rounded-Full Header CTA Pill (Strict Spec Exception) */}
          <button
            type="button"
            onClick={pageView === 'HOME_3D_GLOBE' ? onEnterExplorer : onNavigateHome}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#18181B] bg-[#EBEBE8] px-3.5 sm:px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#18181B] hover:bg-[#0066FF] hover:border-[#0066FF] hover:text-white transition-colors duration-300 industrial-ease whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
          >
            {pageView === 'HOME_3D_GLOBE' ? (
              <>
                <Radio className="h-3 w-3 text-[#0066FF] group-hover:text-white" aria-hidden="true" />
                <span>2D Map ({REGION_DATASETS[activeRegionId].productType})</span>
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </>
            ) : (
              <>
                <Globe className="h-3 w-3" aria-hidden="true" />
                <span>3D Earth Home</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
