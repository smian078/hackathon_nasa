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
      color: '#00F0FF',
      desc: 'Smooth water surface reflects 24 cm L-band pulse away from satellite → sharp HH drop (≤ -18 dB).',
    },
    DOUBLE_BOUNCE_FLOODED_VEG: {
      title: 'Double-Bounce + Emergent Canopy',
      color: '#C04CFD',
      desc: 'Radar pulse bounces off water surface onto vertical stems and back → elevated HV & cross-pol ratio.',
    },
    VOLUME_CANOPY: {
      title: 'Volume Scattering (Dense Crop / Forest)',
      color: '#D4F844',
      desc: 'L-band microwaves penetrate branches/stems, depolarizing signal → high HV backscatter (≥ -12.5 dB).',
    },
    INSAR_PHASE_DEFORMATION: {
      title: 'InSAR Phase Shift (Crustal Motion)',
      color: '#E8559D',
      desc: 'Coherent phase shift Δφ between 12-day passes resolves cm-scale Line-of-Sight uplift & subsidence.',
    },
  };

  const active = labels[mechanism];

  return (
    <div className="rounded-xl bg-[#100E14]/85 p-3 border border-white/10">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-medium text-[#94A3B8]">
          Active Microwave Physics Mechanism
        </span>
        <span
          className="font-mono text-[11px] font-semibold"
          style={{ color: active.color }}
        >
          {mechanism}
        </span>
      </div>

      {/* Crisp SVG Vector Scattering Diagram */}
      <svg
        viewBox="0 0 320 76"
        className="w-full h-16 rounded-lg bg-[#0B090F] border border-white/5"
        role="img"
        aria-label={active.title}
      >
        {/* Ground / Water plane */}
        <line x1="16" y1="60" x2="304" y2="60" stroke="#475569" strokeWidth="2" />
        {/* Incoming beam */}
        <line
          x1="48"
          y1="10"
          x2="145"
          y2="58"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        {mechanism === 'SPECULAR_WATER' && (
          <>
            <line x1="145" y1="58" x2="255" y2="12" stroke="#00F0FF" strokeWidth="2.5" />
            <rect x="95" y="57" width="130" height="5" fill="#00F0FF" opacity="0.7" />
          </>
        )}
        {mechanism === 'DOUBLE_BOUNCE_FLOODED_VEG' && (
          <>
            <line x1="175" y1="30" x2="175" y2="60" stroke="#D4F844" strokeWidth="3" />
            <line x1="145" y1="58" x2="175" y2="44" stroke="#C04CFD" strokeWidth="2.5" />
            <line x1="175" y1="44" x2="72" y2="10" stroke="#C04CFD" strokeWidth="2.5" />
          </>
        )}
        {mechanism === 'VOLUME_CANOPY' && (
          <>
            <circle cx="155" cy="40" r="16" fill="rgba(212,248,68,0.18)" stroke="#D4F844" strokeWidth="1.5" />
            <circle cx="176" cy="44" r="12" fill="rgba(212,248,68,0.18)" stroke="#D4F844" strokeWidth="1.5" />
            <line x1="145" y1="42" x2="90" y2="12" stroke="#D4F844" strokeWidth="2" />
            <line x1="165" y1="38" x2="215" y2="16" stroke="#D4F844" strokeWidth="2" />
          </>
        )}
        {mechanism === 'INSAR_PHASE_DEFORMATION' && (
          <>
            <path d="M 90 60 Q 160 36 230 60" fill="none" stroke="#E8559D" strokeWidth="2.5" />
            <line x1="145" y1="48" x2="56" y2="12" stroke="#E8559D" strokeWidth="2.5" />
            <text x="160" y="26" fill="#E8559D" fontSize="10" textAnchor="middle" fontFamily="monospace">
              Δφ = 4π·ΔR / λ
            </text>
          </>
        )}
      </svg>
      <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">{active.desc}</p>
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
      {/* Grounded Telemetry Context Box */}
      <div className="rounded-xl bg-[#100E14]/80 p-3.5 border border-white/10 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs text-[#94A3B8]">Selected Target Polygon</div>
            <h3 className="font-display text-sm font-semibold text-[#F8FAFC]">
              {activeZone.name}
            </h3>
          </div>
          <span className="font-mono text-[11px] text-[#00F0FF] shrink-0">
            {pass.acquisitionDate}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 pt-1 font-mono text-xs tabular-nums text-[#E2E8F0]">
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

      {/* Scattering Physics Diagram */}
      <ScatteringDiagram
        mechanism={synthesis?.scatteringMechanism ?? previewMechanism}
      />

      {/* Action Controls: Language + Synthesize CTA */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Synthesis output language"
          className="flex items-center rounded-lg bg-[#100E14]/90 p-0.5 border border-white/10"
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
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
                language === item.code
                  ? 'bg-[#C04CFD]/25 text-[#F8FAFC]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
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
          className="inline-flex items-center gap-2 rounded-xl bg-[#C04CFD] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C04CFD]/90 disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
        >
          <Cpu className="h-4 w-4" aria-hidden="true" />
          <span>
            {isSynthesizing ? 'Synthesizing...' : 'Synthesize Physical Drivers'}
          </span>
        </button>
      </div>

      {/* Loading State */}
      {isSynthesizing && (
        <div className="space-y-3" aria-busy="true" aria-label="Generating physical driver synthesis">
          <div className="h-6 w-3/4 rounded-lg skeleton-shimmer" />
          <div className="h-24 rounded-xl skeleton-shimmer" />
          <div className="h-24 rounded-xl skeleton-shimmer" />
        </div>
      )}

      {/* Error State */}
      {synthesisError && !isSynthesizing && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs text-[#F8FAFC]"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#EF4444] shrink-0" aria-hidden="true" />
            <span>{synthesisError}</span>
          </div>
          <button
            type="button"
            onClick={onSynthesize}
            className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium hover:bg-white/20"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State before user clicks */}
      {!synthesis && !isSynthesizing && !synthesisError && (
        <div className="rounded-xl border border-dashed border-white/15 bg-[#100E14]/50 p-4 text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2 font-medium text-[#F8FAFC] mb-1">
            <Waves className="h-4 w-4 text-[#00F0FF]" aria-hidden="true" />
            <span>Ready for Grounded Radar Synthesis</span>
          </div>
          Click <strong>Synthesize Physical Drivers</strong> to generate a grounded explanation of dielectric, roughness, or interferometric phase changes in English, Marathi, or Hindi.
        </div>
      )}

      {/* Grounded Synthesis Output Card */}
      {synthesis && !isSynthesizing && (
        <article className="rounded-xl bg-[#100E14]/85 p-4 border border-[#C04CFD]/35 space-y-3 text-xs leading-relaxed">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-2.5">
            <h4 className="font-display text-sm font-semibold text-[#F8FAFC]">
              {synthesis.headline}
            </h4>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#00F0FF]/12 text-[#00F0FF] border border-[#00F0FF]/35 shrink-0">
              {synthesis.source === 'GEMINI_4_HYDROGEN'
                ? 'Gemini 4 Hydrogen · Grounded'
                : 'Deterministic Physics Fallback'}
            </span>
          </div>

          <div>
            <div className="font-semibold text-[#00F0FF] mb-1">
              1. Microwave Scattering &amp; Dielectric Mechanism
            </div>
            <p className="text-[#E2E8F0]">{synthesis.physicsExplanation}</p>
          </div>

          <div>
            <div className="font-semibold text-[#C04CFD] mb-1">
              2. Human &amp; Hydro-Tectonic Drivers
            </div>
            <p className="text-[#E2E8F0]">{synthesis.humanAndNaturalDrivers}</p>
          </div>

          <div>
            <div className="font-semibold text-[#D4F844] mb-1.5">
              3. Recommended Field Actions
            </div>
            <ul className="space-y-1.5">
              {synthesis.actionableAdvisory.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-[#F8FAFC]">
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-[#D4F844] mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-white/5 px-3 py-2 text-[11px] text-[#94A3B8] border border-white/10">
            <strong className="text-[#F8FAFC]">Uncertainty &amp; Limits: </strong>
            {synthesis.uncertaintyAndLimits}
          </div>
        </article>
      )}
    </div>
  );
}
