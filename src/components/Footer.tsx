import { ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onOpenAbout: () => void;
}

export function Footer({ onOpenAbout }: FooterProps) {
  return (
    <footer className="relative overflow-hidden bg-[#18181B] text-[#EBEBE8] border-t border-[#27272A]">
      {/* Top Interactive Trigger */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 pt-12 pb-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#EBEBE8]/15">
          <div className="space-y-3">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#A1A1AA]">
              NASA Space Apps Challenge 2026 · Dancing With The SARs
            </div>
            <button
              type="button"
              onClick={onOpenAbout}
              className="group inline-flex items-center gap-3 text-left text-2xl sm:text-4xl font-bold tracking-[-0.03em] text-[#EBEBE8] border-b-2 border-transparent hover:border-[#0066FF] pb-1 transition-colors duration-300 industrial-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
            >
              <span>Inspect Open NASA &amp; ISRO Data Sources</span>
              <ArrowUpRight
                className="h-7 w-7 text-[#0066FF] transition-transform duration-300 group-hover:rotate-45"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] space-y-1">
            <div>ASF DAAC VERTEX · GCOV &amp; GUNW</div>
            <div>NASA GIBS MODIS · NASA POWER · NASA EONET</div>
          </div>
        </div>
      </div>

      {/* Massive 20vw Low-Opacity Background Marquee */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none overflow-hidden py-2 opacity-10"
      >
        <div className="marquee-track-slow items-center gap-16">
          {[0, 1].map((idx) => (
            <div key={idx} className="flex items-center gap-16 pr-16">
              <span className="text-[18vw] leading-none font-black uppercase tracking-[-0.05em] whitespace-nowrap">
                NISAR PULSE
              </span>
              <span className="text-[18vw] leading-none font-serif-editorial whitespace-nowrap">
                l-band radar
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Compliance & Status Row */}
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-8 py-6 border-t border-[#EBEBE8]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#EBEBE8]">
            System Operational · Cycle 035 Manifest Verified
          </span>
        </div>

        <p className="text-xs text-[#D4D4D8] max-w-2xl">
          Built with open NASA &amp; ISRO NISAR / ASF / Earthdata / GIBS / POWER data. NASA does not endorse this application.
        </p>
      </div>
    </footer>
  );
}
