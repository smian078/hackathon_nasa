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
      className="aura-glass rounded-2xl p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-[#C04CFD]" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold text-[#F8FAFC]">
            12-Day Orbital Repeat Pass Scrubber
          </h2>
          <span className="text-xs text-[#94A3B8] font-mono">
            · {currentPass.acquisitionDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause orbital pass animation' : 'Play orbital pass animation'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#C04CFD]/20 border border-[#C04CFD]/50 px-3 py-1.5 text-xs font-medium text-[#F8FAFC] hover:bg-[#C04CFD]/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Pause Cycle</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Animate Passes</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onPinSnapshot}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/15 px-3 py-1.5 text-xs font-medium text-[#F8FAFC] hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
          >
            <BookmarkPlus className="h-3.5 w-3.5 text-[#D4F844]" aria-hidden="true" />
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
              className={`rounded-xl px-3 py-2 text-left transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
                active
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF]/60 text-[#F8FAFC]'
                  : 'bg-[#100E14]/65 border-white/10 text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                <span className={active ? 'text-[#00F0FF] font-semibold' : ''}>
                  {pass.passCode}
                </span>
                <span>{pass.acquisitionDate}</span>
              </div>
              <div className="mt-1 truncate text-xs font-medium">
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
            <div className="rounded-xl bg-[#100E14]/70 px-3 py-2 border border-white/10">
              <div className="text-[11px] text-[#94A3B8]">LOS Displacement</div>
              <div className="text-base font-semibold text-[#E8559D]">
                {formatSigned(currentPass.losDisplacementCm ?? 0, 1)} cm
              </div>
            </div>
            <div className="rounded-xl bg-[#100E14]/70 px-3 py-2 border border-white/10">
              <div className="text-[11px] text-[#94A3B8]">ΔLOS vs Baseline</div>
              <div className="text-base font-semibold text-[#00F0FF]">
                {formatSigned(delta.deltaLosCm ?? 0, 1)} cm
              </div>
            </div>
            <div className="rounded-xl bg-[#100E14]/70 px-3 py-2 border border-white/10">
              <div className="text-[11px] text-[#94A3B8]">Unwrapped Phase</div>
              <div className="text-base font-semibold text-[#F8FAFC]">
                {formatSigned(currentPass.unwrappedPhaseRad ?? 0, 2)} rad
              </div>
            </div>
            <div className="rounded-xl bg-[#100E14]/70 px-3 py-2 border border-white/10">
              <div className="text-[11px] text-[#94A3B8]">Coherence (γ)</div>
              <div className="text-base font-semibold text-[#D4F844]">
                {(currentPass.coherence ?? 0).toFixed(2)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl bg-[#100E14]/70 px-3 py-2 border border-white/10">
              <div className="text-[11px] text-[#94A3B8]">HH Backscatter</div>
              <div className="text-base font-semibold text-[#00F0FF]">
                {currentPass.hhGamma0Db.toFixed(1)} dB
              </div>
            </div>
            <div className="rounded-xl bg-[#100E14]/70 px-3 py-2 border border-white/10">
              <div className="text-[11px] text-[#94A3B8]">Δγ⁰ HH</div>
              <div className="text-base font-semibold text-[#C04CFD]">
                {formatSigned(delta.deltaHhDb, 1)} dB
              </div>
            </div>
            <div className="rounded-xl bg-[#100E14]/70 px-3 py-2 border border-white/10">
              <div className="text-[11px] text-[#94A3B8]">HV Volume</div>
              <div className="text-base font-semibold text-[#D4F844]">
                {currentPass.hvGamma0Db.toFixed(1)} dB
              </div>
            </div>
            <div className="rounded-xl bg-[#100E14]/70 px-3 py-2 border border-white/10">
              <div className="text-[11px] text-[#94A3B8]">Dielectric ε / Rain</div>
              <div className="text-base font-semibold text-[#F8FAFC]">
                {currentPass.dielectricConstantEst.toFixed(1)} · {currentPass.rainfallMm.toFixed(0)} mm
              </div>
            </div>
          </>
        )}
      </div>

      {/* Saved LocalStorage Snapshots Bar */}
      {savedSnapshots.length > 0 && (
        <div className="border-t border-white/10 pt-2.5">
          <div className="text-[11px] font-medium text-[#94A3B8] mb-2">
            Pinned Local Snapshots ({savedSnapshots.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {savedSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#100E14]/90 border border-white/15 px-2.5 py-1 text-xs"
              >
                <button
                  type="button"
                  onClick={() => onLoadSnapshot(snap)}
                  className="text-left text-[#F8FAFC] hover:text-[#00F0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] rounded"
                >
                  <span className="font-medium">{snap.zoneName.split(' ')[0]}</span>
                  <span className="text-[#94A3B8] font-mono ml-1.5">
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
                  className="text-[#94A3B8] hover:text-[#EF4444] p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
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
