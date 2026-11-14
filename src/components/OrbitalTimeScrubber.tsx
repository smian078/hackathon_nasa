import { BookmarkPlus, CalendarClock, Pause, Play, Trash2 } from 'lucide-react';
import type { RegionDataset, SavedSnapshot, StudyZone } from '../types/sar.ts';
import { computePassDelta, formatSigned } from '../utils/sarPhysics.ts';

interface OrbitalTimeScrubberProps {
  region: RegionDataset;
  selectedZone: StudyZone | null;
  passIndex: number;
  onSelectPass: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPinSnapshot: () => void;
  savedSnapshots: SavedSnapshot[];
  onLoadSnapshot: (snap: SavedSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
}

export function OrbitalTimeScrubber({
  region,
  selectedZone,
  passIndex,
  onSelectPass,
  isPlaying,
  onTogglePlay,
  onPinSnapshot,
  savedSnapshots,
  onLoadSnapshot,
  onDeleteSnapshot,
}: OrbitalTimeScrubberProps) {
  const referenceZone = selectedZone ?? region.zones[0];
  const currentPass =
    referenceZone.passes[passIndex] ?? referenceZone.passes[0];
  const delta = computePassDelta(referenceZone, passIndex);
  const isGunw = region.productType === 'GUNW';

  return (
    <section
      aria-label="12-Day Orbital Pass Time Scrubber"
      className="border border-[#D4D4D8] bg-[#EBEBE8] p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#D4D4D8]">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-[#0066FF]" aria-hidden="true" />
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#18181B]">
            12-Day Orbital Repeat Pass Scrubber
          </h2>
          <span className="text-xs text-[#52525B] font-mono">
            · {currentPass.acquisitionDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause orbital pass animation' : 'Play orbital pass animation'}
            className="inline-flex items-center gap-1.5 border border-[#18181B] bg-[#18181B] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#EBEBE8] hover:bg-[#0066FF] hover:border-[#0066FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" aria-hidden="true" />
                <span>Animate</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onPinSnapshot}
            className="inline-flex items-center gap-1.5 border border-[#D4D4D8] bg-[#F4F4F5] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#18181B] hover:border-[#18181B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
          >
            <BookmarkPlus className="h-3 w-3 text-[#0066FF]" aria-hidden="true" />
            <span>Pin Snapshot</span>
          </button>
        </div>
      </div>

      {/* 4 Orbital Pass Stepper Buttons */}
      <div
        role="group"
        aria-label="Orbital acquisition passes"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        {referenceZone.passes.map((pass, idx) => {
          const active = idx === passIndex;
          return (
            <button
              key={pass.passCode}
              type="button"
              onClick={() => onSelectPass(idx)}
              aria-pressed={active}
              className={`px-3 py-2.5 text-left transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
                active
                  ? 'border-[#0066FF] bg-[#0066FF] text-white'
                  : 'border-[#D4D4D8] bg-[#F4F4F5] text-[#18181B] hover:border-[#18181B]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-bold">
                <span>{pass.passCode}</span>
                <span className={active ? 'text-white/90' : 'text-[#52525B]'}>
                  {pass.acquisitionDate}
                </span>
              </div>
              <div className="mt-1 truncate text-xs font-semibold">
                {pass.passLabel.replace(/^Pass \d+ · /, '')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Instant Delta Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono tabular-nums">
        {isGunw ? (
          <>
            <div className="border border-[#D4D4D8] bg-[#F4F4F5] px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#52525B]">LOS Displacement</div>
              <div className="text-base font-bold text-[#0066FF]">
                {formatSigned(currentPass.losDisplacementCm ?? 0, 1)} cm
              </div>
            </div>
            <div className="border border-[#D4D4D8] bg-[#F4F4F5] px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#52525B]">ΔLOS vs Baseline</div>
              <div className="text-base font-bold text-[#18181B]">
                {formatSigned(delta.deltaLosCm ?? 0, 1)} cm
              </div>
            </div>
            <div className="border border-[#D4D4D8] bg-[#F4F4F5] px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#52525B]">Unwrapped Phase</div>
              <div className="text-base font-bold text-[#18181B]">
                {formatSigned(currentPass.unwrappedPhaseRad ?? 0, 2)} rad
              </div>
            </div>
            <div className="border border-[#D4D4D8] bg-[#F4F4F5] px-3 py-2">
              <div className="text-[10px] tracking-[0.14em] text-[#52525B]">COHERENCE (γ)</div>
              <div className="text-base font-bold text-[#18181B]">
                {(currentPass.coherence ?? 0).toFixed(2)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="border border-[#D4D4D8] bg-[#F4F4F5] px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#52525B]">HH Backscatter</div>
              <div className="text-base font-bold text-[#0066FF]">
                {currentPass.hhGamma0Db.toFixed(1)} dB
              </div>
            </div>
            <div className="border border-[#D4D4D8] bg-[#F4F4F5] px-3 py-2">
              <div className="text-[10px] tracking-[0.14em] text-[#52525B]">Δγ⁰ HH</div>
              <div className="text-base font-bold text-[#18181B]">
                {formatSigned(delta.deltaHhDb, 1)} dB
              </div>
            </div>
            <div className="border border-[#D4D4D8] bg-[#F4F4F5] px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#52525B]">HV Volume</div>
              <div className="text-base font-bold text-[#18181B]">
                {currentPass.hvGamma0Db.toFixed(1)} dB
              </div>
            </div>
            <div className="border border-[#D4D4D8] bg-[#F4F4F5] px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#52525B]">Dielectric / Rain</div>
              <div className="text-base font-bold text-[#18181B]">
                {currentPass.dielectricConstantEst.toFixed(1)} · {currentPass.rainfallMm.toFixed(0)} mm
              </div>
            </div>
          </>
        )}
      </div>

      {/* Saved LocalStorage Snapshots Bar */}
      {savedSnapshots.length > 0 && (
        <div className="border-t border-[#D4D4D8] pt-2.5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#52525B] mb-2">
            Pinned Local Snapshots ({savedSnapshots.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {savedSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="inline-flex items-center gap-1.5 border border-[#D4D4D8] bg-[#F4F4F5] px-2.5 py-1 text-xs"
              >
                <button
                  type="button"
                  onClick={() => onLoadSnapshot(snap)}
                  className="text-left text-[#18181B] hover:text-[#0066FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
                >
                  <span className="font-semibold">{snap.zoneName.split(' ')[0]}</span>
                  <span className="text-[#52525B] font-mono ml-1.5">
                    {snap.acquisitionDate} ·{' '}
                    {snap.losDisplacementCm !== undefined
                      ? `${formatSigned(snap.losDisplacementCm, 1)} cm`
                      : `${snap.hhDb.toFixed(1)} dB`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSnapshot(snap.id)}
                  aria-label={`Remove pinned snapshot ${snap.zoneName} ${snap.acquisitionDate}`}
                  className="text-[#52525B] hover:text-[#DC2626] p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
