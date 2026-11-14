import { Info } from 'lucide-react';

interface FooterProps {
  onOpenAbout: () => void;
}

export function Footer({ onOpenAbout }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#100E14] px-4 py-4 mt-4">
      <div className="mx-auto flex max-w-[1440px] flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#94A3B8]">
        <p>
          Built with open NASA &amp; ISRO NISAR / ASF / Earthdata / GIBS / POWER data. NASA does not endorse this application.
        </p>
        <div className="flex items-center gap-4 shrink-0">
          <span>NASA Space Apps Challenge · Nagpur 2026</span>
          <button
            type="button"
            onClick={onOpenAbout}
            className="inline-flex items-center gap-1.5 text-[#00F0FF] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] rounded"
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Data Sources &amp; Physics</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
