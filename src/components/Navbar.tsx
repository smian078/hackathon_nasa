import { BookOpen, Globe2, Radio, Satellite } from 'lucide-react';
import { REGION_LIST } from '../data/samples/asfVertexSamples.ts';
import type { LanguageCode, RegionId } from '../types/sar.ts';

interface NavbarProps {
  activeRegionId: RegionId;
  onSelectRegion: (id: RegionId) => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  language: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onOpenAbout: () => void;
}

const LANGUAGES: Array<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिन्दी' },
];

export function Navbar({
  activeRegionId,
  onSelectRegion,
  demoMode,
  onToggleDemoMode,
  language,
  onSelectLanguage,
  onOpenAbout,
}: NavbarProps) {
  return (
    <header className="aura-glass border-b border-[#C04CFD]/25 px-4 py-3">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C04CFD]/15 border border-[#C04CFD]/40 text-[#00F0FF]"
            aria-hidden="true"
          >
            <Satellite className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold tracking-tight text-[#F8FAFC] whitespace-nowrap leading-tight">
              NISAR Pulse
            </h1>
            <p className="hidden sm:block text-xs text-[#94A3B8] whitespace-nowrap">
              L-Band GCOV &amp; GUNW Surface Change Explorer
            </p>
          </div>
        </div>

        {/* Region Quick-Tabs */}
        <nav
          aria-label="Study area selector"
          className="flex items-center gap-1 rounded-xl bg-[#100E14]/80 p-1 border border-white/10 overflow-x-auto max-w-full"
        >
          {REGION_LIST.map((region) => {
            const isActive = region.id === activeRegionId;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => onSelectRegion(region.id)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
                  isActive
                    ? 'bg-[#C04CFD]/25 text-[#F8FAFC] border border-[#C04CFD]/60'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 border border-transparent'
                }`}
              >
                {region.shortName}
              </button>
            );
          })}
        </nav>

        {/* Controls Cluster */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          <button
            type="button"
            onClick={onToggleDemoMode}
            aria-pressed={demoMode}
            aria-label={
              demoMode
                ? 'Demo Mode active using bundled ASF Vertex samples. Click to switch to Live NASA and ASF APIs.'
                : 'Live API mode active. Click to switch to bundled ASF Vertex Demo Mode.'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
              demoMode
                ? 'bg-[#D4F844]/12 text-[#D4F844] border-[#D4F844]/40 hover:bg-[#D4F844]/20'
                : 'bg-[#00F0FF]/12 text-[#00F0FF] border-[#00F0FF]/45 hover:bg-[#00F0FF]/20'
            }`}
          >
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{demoMode ? 'Demo Mode: Bundled ASF' : 'Live NASA / ASF Fetch'}</span>
          </button>

          <div
            role="group"
            aria-label="Analysis language selector"
            className="flex items-center rounded-lg bg-[#100E14]/80 p-0.5 border border-white/10"
          >
            <Globe2
              className="h-3.5 w-3.5 text-[#94A3B8] ml-2 mr-1 hidden sm:block"
              aria-hidden="true"
            />
            {LANGUAGES.map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onSelectLanguage(lang.code)}
                  aria-pressed={active}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
                    active
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenAbout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#F8FAFC] bg-white/5 hover:bg-white/10 border border-white/15 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#C04CFD]" aria-hidden="true" />
            <span>About &amp; Data</span>
          </button>
        </div>
      </div>
    </header>
  );
}
