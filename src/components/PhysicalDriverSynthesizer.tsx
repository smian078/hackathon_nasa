import { AlertTriangle, CheckCircle2, Cpu, RefreshCw, Waves } from 'lucide-react';
import type {
  LanguageCode,
  PhysicalDriverSynthesis,
  RegionDataset,
  ScatteringMechanism,
  StudyZone,
} from '../types/sar.ts';
import {
  classifyScatteringMechanism,
  computePassDelta,
  formatSigned,
} from '../utils/sarPhysics.ts';

interface PhysicalDriverSynthesizerProps {
  region: RegionDataset;
  selectedZone: StudyZone | null;
  passIndex: number;
  language: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  synthesis: PhysicalDriverSynthesis | null;
  isSynthesizing: boolean;
  synthesisError: string | null;
  onSynthesize: () => void;
}

function ScatteringDiagram({ mechanism }: { mechanism: ScatteringMechanism }) {
  const labels: Record<ScatteringMechanism, { title: string; color: string; desc: string }> = {
    SPECULAR_WATER: {
      title: 'Specular Reflection (Open Floodwater)',
      color: '#0066FF',
      desc: 'Smooth water surface reflects 24 cm L-band pulse away from satellite → sharp HH drop (≤ -18 dB).',
    },
    DOUBLE_BOUNCE_FLOODED_VEG: {
      title: 'Double-Bounce + Emergent Canopy',
      color: '#0066FF',
      desc: 'Radar pulse bounces off water surface onto vertical stems and back → elevated HV & cross-pol ratio.',
    },
    VOLUME_CANOPY: {
      title: 'Volume Scattering (Dense Crop / Forest)',
      color: '#16A34A',
      desc: 'L-band microwaves penetrate branches/stems, depolarizing signal → high HV backscatter (≥ -12.5 dB).',
    },
    INSAR_PHASE_DEFORMATION: {
      title: 'InSAR Phase Shift (Crustal Motion)',
      color: '#DC2626',
      desc: 'Coherent phase shift Δφ between 12-day passes resolves cm-scale Line-of-Sight uplift & subsidence.',
    },
  };

  const active = labels[mechanism];

  return (
    <div className="border border-[#D4D4D8] bg-[#F4F4F5] p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#52525B]">
          Scattering Physics
        </span>
        <span
          className="font-mono text-[10px] font-bold"
          style={{ color: active.color }}
        >
          {mechanism}
        </span>
      </div>

      <svg
        viewBox="0 0 320 76"
        className="w-full h-16 border border-[#D4D4D8] bg-[#18181B]"
        role="img"
        aria-label={active.title}
      >
        <line x1="16" y1="60" x2="304" y2="60" stroke="#71717A" strokeWidth="2" />
        <line
          x1="48"
          y1="10"
          x2="145"
          y2="58"
          stroke="#EBEBE8"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        {mechanism === 'SPECULAR_WATER' && (
          <>
            <line x1="145" y1="58" x2="255" y2="12" stroke="#0066FF" strokeWidth="2.5" />
            <rect x="95" y="57" width="130" height="5" fill="#0066FF" opacity="0.85" />
          </>
        )}
        {mechanism === 'DOUBLE_BOUNCE_FLOODED_VEG' && (
          <>
            <line x1="175" y1="30" x2="175" y2="60" stroke="#22C55E" strokeWidth="3" />
            <line x1="145" y1="58" x2="175" y2="44" stroke="#0066FF" strokeWidth="2.5" />
            <line x1="175" y1="44" x2="72" y2="10" stroke="#0066FF" strokeWidth="2.5" />
          </>
        )}
        {mechanism === 'VOLUME_CANOPY' && (
          <>
            <circle cx="155" cy="40" r="16" fill="rgba(34,197,94,0.22)" stroke="#22C55E" strokeWidth="1.5" />
            <circle cx="176" cy="44" r="12" fill="rgba(34,197,94,0.22)" stroke="#22C55E" strokeWidth="1.5" />
            <line x1="145" y1="42" x2="90" y2="12" stroke="#22C55E" strokeWidth="2" />
            <line x1="165" y1="38" x2="215" y2="16" stroke="#22C55E" strokeWidth="2" />
          </>
        )}
        {mechanism === 'INSAR_PHASE_DEFORMATION' && (
          <>
            <path d="M 90 60 Q 160 36 230 60" fill="none" stroke="#EF4444" strokeWidth="2.5" />
            <line x1="145" y1="48" x2="56" y2="12" stroke="#EF4444" strokeWidth="2.5" />
            <text x="160" y="26" fill="#EBEBE8" fontSize="10" textAnchor="middle" fontFamily="monospace">
              Δφ = 4π·ΔR / λ
            </text>
          </>
        )}
      </svg>
      <p className="mt-2 text-xs text-[#52525B] leading-relaxed">{active.desc}</p>
    </div>
  );
}

export function PhysicalDriverSynthesizer({
  region,
  selectedZone,
  passIndex,
  language,
  onSelectLanguage,
  synthesis,
  isSynthesizing,
  synthesisError,
  onSynthesize,
}: PhysicalDriverSynthesizerProps) {
  const activeZone = selectedZone ?? region.zones[0];
  const pass = activeZone.passes[passIndex] ?? activeZone.passes[0];
  const delta = computePassDelta(activeZone, passIndex);

  const previewMechanism = classifyScatteringMechanism(
    region.productType,
    pass.hhGamma0Db,
    pass.hvGamma0Db,
    pass.losDisplacementCm
  );

  return (
    <div className="space-y-4">
      <div className="border border-[#D4D4D8] bg-[#F4F4F5] p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#52525B]">
              Target Study Zone
            </div>
            <h3 className="text-sm font-bold text-[#18181B]">
              {activeZone.name}
            </h3>
          </div>
          <span className="font-mono text-[11px] font-bold text-[#0066FF] shrink-0">
            {pass.acquisitionDate}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 pt-1 font-mono text-xs tabular-nums text-[#18181B]">
          <span>HH: {pass.hhGamma0Db.toFixed(1)} dB ({formatSigned(delta.deltaHhDb, 1)})</span>
          <span>HV: {pass.hvGamma0Db.toFixed(1)} dB</span>
          {pass.losDisplacementCm !== undefined && (
            <span>LOS: {formatSigned(pass.losDisplacementCm, 1)} cm</span>
          )}
          {pass.coherence !== undefined && (
            <span>γ: {pass.coherence.toFixed(2)}</span>
          )}
          <span>Rain: {pass.rainfallMm.toFixed(1)} mm/d</span>
        </div>
      </div>

      <ScatteringDiagram
        mechanism={synthesis?.scatteringMechanism ?? previewMechanism}
      />

      {/* Language & Synthesize Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Synthesis output language"
          className="flex items-center border border-[#D4D4D8] bg-[#F4F4F5]"
        >
          {(
            [
              { code: 'en', label: 'English' },
              { code: 'mr', label: 'मराठी' },
              { code: 'hi', label: 'हिन्दी' },
            ] as const
          ).map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => onSelectLanguage(item.code)}
              aria-pressed={language === item.code}
              className={`px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
                language === item.code
                  ? 'bg-[#18181B] text-[#EBEBE8]'
                  : 'text-[#52525B] hover:text-[#18181B]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onSynthesize}
          disabled={isSynthesizing}
          className="inline-flex items-center gap-2 border border-[#0066FF] bg-[#0066FF] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:bg-[#18181B] hover:border-[#18181B] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
        >
          <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {isSynthesizing ? 'Synthesizing...' : 'Synthesize Drivers'}
          </span>
        </button>
      </div>

      {isSynthesizing && (
        <div className="space-y-3" aria-busy="true" aria-label="Generating physical driver synthesis">
          <div className="h-6 w-3/4 skeleton-shimmer" />
          <div className="h-24 skeleton-shimmer" />
          <div className="h-24 skeleton-shimmer" />
        </div>
      )}

      {synthesisError && !isSynthesizing && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 border border-[#DC2626] bg-[#FEE2E2] p-3 text-xs text-[#18181B]"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#DC2626] shrink-0" aria-hidden="true" />
            <span>{synthesisError}</span>
          </div>
          <button
            type="button"
            onClick={onSynthesize}
            className="inline-flex items-center gap-1 border border-[#18181B] bg-[#EBEBE8] px-2.5 py-1 text-xs font-semibold hover:bg-[#18181B] hover:text-[#EBEBE8]"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {!synthesis && !isSynthesizing && !synthesisError && (
        <div className="border border-dashed border-[#A1A1AA] bg-[#F4F4F5] p-4 text-xs text-[#52525B]">
          <div className="flex items-center gap-2 font-semibold text-[#18181B] mb-1">
            <Waves className="h-4 w-4 text-[#0066FF]" aria-hidden="true" />
            <span>Ready for Grounded Radar Synthesis</span>
          </div>
          Click <strong>Synthesize Drivers</strong> to generate a grounded explanation of dielectric, roughness, or interferometric phase changes in English, Marathi, or Hindi.
        </div>
      )}

      {synthesis && !isSynthesizing && (
        <article className="border border-[#18181B] bg-[#F4F4F5] p-4 space-y-3 text-xs leading-relaxed">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#D4D4D8] pb-2.5">
            <h4 className="text-sm font-bold text-[#18181B]">
              {synthesis.headline}
            </h4>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 border border-[#0066FF] bg-[#0066FF]/10 text-[#0066FF] shrink-0">
              {synthesis.source === 'GEMINI_4_HYDROGEN'
                ? 'Gemini 4 Hydrogen · Grounded'
                : 'Deterministic Physics Fallback'}
            </span>
          </div>

          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF] mb-1">
              1. Microwave Scattering &amp; Dielectric Mechanism
            </div>
            <p className="text-[#18181B]">{synthesis.physicsExplanation}</p>
          </div>

          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#18181B] mb-1">
              2. Human &amp; Hydro-Tectonic Drivers
            </div>
            <p className="text-[#52525B]">{synthesis.humanAndNaturalDrivers}</p>
          </div>

          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#166534] mb-1.5">
              3. Recommended Field Actions
            </div>
            <ul className="space-y-1.5">
              {synthesis.actionableAdvisory.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-[#18181B]">
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-[#16A34A] mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-[#D4D4D8] bg-[#EBEBE8] px-3 py-2 text-[11px] text-[#52525B]">
            <strong className="text-[#18181B]">Uncertainty &amp; Limits: </strong>
            {synthesis.uncertaintyAndLimits}
          </div>
        </article>
      )}
    </div>
  );
}
