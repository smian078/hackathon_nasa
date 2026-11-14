import {
  BarChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  Cell,
} from 'recharts';
import { AlertTriangle, CloudRain, Compass, RefreshCw } from 'lucide-react';
import type {
  NasaPowerApiResponse,
  RegionDataset,
  StudyZone,
} from '../types/sar.ts';

interface TelemetryPanelProps {
  region: RegionDataset;
  selectedZone: StudyZone | null;
  onSelectZone: (zoneId: string) => void;
  passIndex: number;
  powerData: NasaPowerApiResponse | null;
  isLoadingPower: boolean;
  powerError: string | null;
  onRetryPower: () => void;
}

export function TelemetryPanel({
  region,
  selectedZone,
  onSelectZone,
  passIndex,
  powerData,
  isLoadingPower,
  powerError,
  onRetryPower,
}: TelemetryPanelProps) {
  const activeZone = selectedZone ?? region.zones[0];
  const isGunw = region.productType === 'GUNW';
  const activeDate = activeZone.passes[passIndex]?.acquisitionDate;

  // Build synchronized time-series merging SAR orbital passes & NASA POWER rainfall/moisture
  const timeSeriesData = activeZone.passes.map((pass, idx) => {
    const matchedPower =
      powerData?.series[idx] ?? powerData?.series[powerData.series.length - 1];
    const rainfallMm =
      powerData?.source === 'NASA_POWER_LIVE' && matchedPower
        ? matchedPower.rainfallMm
        : pass.rainfallMm;
    const soilMoisturePct = Number(
      (
        (powerData?.source === 'NASA_POWER_LIVE' && matchedPower
          ? matchedPower.soilMoistureIndex
          : pass.soilMoistureIndex) * 100
      ).toFixed(0)
    );

    return {
      date: pass.acquisitionDate.slice(5),
      fullDate: pass.acquisitionDate,
      passCode: pass.passCode,
      hhDb: pass.hhGamma0Db,
      hvDb: pass.hvGamma0Db,
      losCm: pass.losDisplacementCm ?? 0,
      coherencePct: Number(((pass.coherence ?? 0) * 100).toFixed(0)),
      rainfallMm,
      soilMoisturePct,
    };
  });

  // Scatter matrix data across all 4 sub-zones at current orbital pass
  const scatterData = region.zones.map((z) => {
    const p = z.passes[passIndex] ?? z.passes[0];
    return {
      zoneId: z.id,
      name: z.name,
      dielectric: p.dielectricConstantEst,
      roughness: p.surfaceRoughnessCm,
      hhDb: p.hhGamma0Db,
      hvDb: p.hvGamma0Db,
      isSelected: z.id === activeZone.id,
    };
  });

  if (isLoadingPower) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading telemetry charts">
        <div className="h-52 rounded-xl skeleton-shimmer" />
        <div className="h-52 rounded-xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {powerError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F59E0B]/45 bg-[#F59E0B]/10 px-3 py-2 text-xs text-[#F8FAFC]"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
            <span>{powerError}</span>
          </div>
          <button
            type="button"
            onClick={onRetryPower}
            className="inline-flex items-center gap-1 rounded-md bg-[#F59E0B]/20 px-2.5 py-1 text-xs font-medium text-[#F8FAFC] hover:bg-[#F59E0B]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Sub-zone Quick Selector */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-[#94A3B8]">
            Active Study Zone
          </span>
          <span className="font-mono text-[11px] text-[#00F0FF]">
            {powerData?.source === 'NASA_POWER_LIVE'
              ? 'NASA POWER LIVE'
              : 'NASA POWER BUNDLED'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {region.zones.map((z) => {
            const active = z.id === activeZone.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => onSelectZone(z.id)}
                aria-pressed={active}
                className={`truncate rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
                  active
                    ? 'bg-[#C04CFD]/20 border-[#C04CFD]/60 text-[#F8FAFC] font-medium'
                    : 'bg-[#100E14]/60 border-white/10 text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
                title={z.name}
              >
                {z.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual-Axis SAR vs NASA POWER Time Series */}
      <div className="rounded-xl bg-[#100E14]/75 p-3 border border-white/10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-[#F8FAFC]">
            <CloudRain className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
            <span>
              {isGunw
                ? 'GUNW LOS Shift (cm) vs NASA POWER Rain (mm)'
                : 'GCOV HH/HV (dB) vs NASA POWER Rainfall (mm)'}
            </span>
          </h3>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timeSeriesData}
              margin={{ top: 8, right: 6, left: -16, bottom: 0 }}
            >
              <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                stroke="#94A3B8"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
              />
              <YAxis
                yAxisId="sar"
                stroke={isGunw ? '#E8559D' : '#00F0FF'}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                domain={isGunw ? [-22, 8] : [-25, -5]}
              />
              <YAxis
                yAxisId="rain"
                orientation="right"
                stroke="#C04CFD"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                domain={[0, 160]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16131C',
                  border: '1px solid rgba(192,76,253,0.35)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
              />
              {activeDate && (
                <ReferenceLine
                  yAxisId="sar"
                  x={activeDate.slice(5)}
                  stroke="#D4F844"
                  strokeDasharray="3 3"
                />
              )}
              <Bar
                yAxisId="rain"
                dataKey="rainfallMm"
                name="Rain (mm/day)"
                fill="rgba(192, 76, 253, 0.35)"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              {isGunw ? (
                <Line
                  yAxisId="sar"
                  type="monotone"
                  dataKey="losCm"
                  name="LOS Shift (cm)"
                  stroke="#E8559D"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#E8559D' }}
                />
              ) : (
                <>
                  <Line
                    yAxisId="sar"
                    type="monotone"
                    dataKey="hhDb"
                    name="HH (dB)"
                    stroke="#00F0FF"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#00F0FF' }}
                  />
                  <Line
                    yAxisId="sar"
                    type="monotone"
                    dataKey="hvDb"
                    name="HV (dB)"
                    stroke="#D4F844"
                    strokeWidth={2}
                    dot={{ r: 3.5, fill: '#D4F844' }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94A3B8] font-mono">
          <span>Pass {passIndex + 1} Soil Wetness (GWETROOT): {(activeZone.passes[passIndex]?.soilMoistureIndex ?? 0).toFixed(2)}</span>
          <span>Rain: {(activeZone.passes[passIndex]?.rainfallMm ?? 0).toFixed(1)} mm/d</span>
        </div>
      </div>

      {/* Roughness vs Dielectric Constant 2D Quadrant Matrix */}
      <div className="rounded-xl bg-[#100E14]/75 p-3 border border-white/10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-[#F8FAFC]">
            <Compass className="h-3.5 w-3.5 text-[#D4F844]" aria-hidden="true" />
            <span>Roughness vs Dielectric Constant Matrix</span>
          </h3>
          <span className="text-[11px] text-[#94A3B8]">Click node to select</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="dielectric"
                name="Dielectric ε"
                domain={[0, 80]}
                stroke="#94A3B8"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
              />
              <YAxis
                type="number"
                dataKey="roughness"
                name="Roughness (cm)"
                domain={[0, 8]}
                stroke="#94A3B8"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
              />
              <ZAxis range={[90, 180]} />
              <ReferenceLine x={35} stroke="rgba(248,250,252,0.16)" strokeDasharray="3 3" />
              <ReferenceLine y={3.0} stroke="rgba(248,250,252,0.16)" strokeDasharray="3 3" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#16131C',
                  border: '1px solid rgba(0,240,255,0.4)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
              />
              <Scatter
                name="Sub-Zones"
                data={scatterData}
                onClick={(point) => {
                  const payload = point as unknown as { zoneId?: string };
                  if (payload?.zoneId) {
                    onSelectZone(payload.zoneId);
                  }
                }}
              >
                {scatterData.map((entry) => (
                  <Cell
                    key={entry.zoneId}
                    fill={entry.isSelected ? '#00F0FF' : '#C04CFD'}
                    stroke={entry.isSelected ? '#F8FAFC' : '#100E14'}
                    strokeWidth={entry.isSelected ? 2 : 1}
                    className="cursor-pointer"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-[#94A3B8]">
          <span>Low ε / Low Rough: Dry Bare Soil</span>
          <span className="text-right">High ε / Low Rough: Floodwater</span>
          <span>Low ε / High Rough: Dry Canopy</span>
          <span className="text-right">High ε / High Rough: Flooded Crop</span>
        </div>
      </div>

      {/* Soil Moisture Bar Strip */}
      <div className="rounded-xl bg-[#100E14]/75 p-3 border border-white/10">
        <div className="text-xs font-medium text-[#94A3B8] mb-2">
          Root-Zone Wetness (GWETROOT %) Across Passes
        </div>
        <div className="h-20 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeSeriesData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <XAxis dataKey="passCode" stroke="#94A3B8" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16131C',
                  border: '1px solid rgba(212,248,68,0.4)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#F8FAFC',
                }}
              />
              <Bar dataKey="soilMoisturePct" name="Soil Moisture %" fill="#D4F844" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
