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
        <div className="h-52 skeleton-shimmer" />
        <div className="h-52 skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {powerError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 border border-[#D97706] bg-[#FEF3C7] px-3 py-2 text-xs text-[#18181B]"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0" aria-hidden="true" />
            <span>{powerError}</span>
          </div>
          <button
            type="button"
            onClick={onRetryPower}
            className="inline-flex items-center gap-1 border border-[#18181B] bg-[#EBEBE8] px-2.5 py-1 text-xs font-semibold hover:bg-[#18181B] hover:text-[#EBEBE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Sub-zone Quick Selector */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#52525B]">
            Active Study Zone
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#0066FF]">
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
                className={`truncate px-2.5 py-1.5 text-left text-xs transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
                  active
                    ? 'border-[#0066FF] bg-[#0066FF] text-white font-semibold'
                    : 'border-[#D4D4D8] bg-[#F4F4F5] text-[#18181B] hover:border-[#18181B]'
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
      <div className="border border-[#D4D4D8] bg-[#F4F4F5] p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#18181B]">
            <CloudRain className="h-3.5 w-3.5 text-[#0066FF]" aria-hidden="true" />
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
              <CartesianGrid stroke="#D4D4D8" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                stroke="#52525B"
                tick={{ fontSize: 11, fill: '#52525B' }}
              />
              <YAxis
                yAxisId="sar"
                stroke="#0066FF"
                tick={{ fontSize: 11, fill: '#52525B' }}
                domain={isGunw ? [-22, 8] : [-25, -5]}
              />
              <YAxis
                yAxisId="rain"
                orientation="right"
                stroke="#18181B"
                tick={{ fontSize: 11, fill: '#52525B' }}
                domain={[0, 160]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#EBEBE8',
                  border: '1px solid #18181B',
                  borderRadius: '0px',
                  fontSize: '12px',
                  color: '#18181B',
                }}
              />
              {activeDate && (
                <ReferenceLine
                  yAxisId="sar"
                  x={activeDate.slice(5)}
                  stroke="#0066FF"
                  strokeDasharray="3 3"
                />
              )}
              <Bar
                yAxisId="rain"
                dataKey="rainfallMm"
                name="Rain (mm/day)"
                fill="rgba(24, 24, 27, 0.2)"
                barSize={18}
              />
              {isGunw ? (
                <Line
                  yAxisId="sar"
                  type="monotone"
                  dataKey="losCm"
                  name="LOS Shift (cm)"
                  stroke="#0066FF"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0066FF' }}
                />
              ) : (
                <>
                  <Line
                    yAxisId="sar"
                    type="monotone"
                    dataKey="hhDb"
                    name="HH (dB)"
                    stroke="#0066FF"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0066FF' }}
                  />
                  <Line
                    yAxisId="sar"
                    type="monotone"
                    dataKey="hvDb"
                    name="HV (dB)"
                    stroke="#16A34A"
                    strokeWidth={2}
                    dot={{ r: 3.5, fill: '#16A34A' }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#52525B] font-mono">
          <span>Pass {passIndex + 1} GWETROOT: {(activeZone.passes[passIndex]?.soilMoistureIndex ?? 0).toFixed(2)}</span>
          <span>Rain: {(activeZone.passes[passIndex]?.rainfallMm ?? 0).toFixed(1)} mm/d</span>
        </div>
      </div>

      {/* Roughness vs Dielectric Constant 2D Quadrant Matrix */}
      <div className="border border-[#D4D4D8] bg-[#F4F4F5] p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#18181B]">
            <Compass className="h-3.5 w-3.5 text-[#0066FF]" aria-hidden="true" />
            <span>Roughness vs Dielectric Constant</span>
          </h3>
          <span className="font-mono text-[10px] uppercase text-[#52525B]">Click node</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
              <CartesianGrid stroke="#D4D4D8" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="dielectric"
                name="Dielectric ε"
                domain={[0, 80]}
                stroke="#52525B"
                tick={{ fontSize: 11, fill: '#52525B' }}
              />
              <YAxis
                type="number"
                dataKey="roughness"
                name="Roughness (cm)"
                domain={[0, 8]}
                stroke="#52525B"
                tick={{ fontSize: 11, fill: '#52525B' }}
              />
              <ZAxis range={[90, 180]} />
              <ReferenceLine x={35} stroke="#A1A1AA" strokeDasharray="3 3" />
              <ReferenceLine y={3.0} stroke="#A1A1AA" strokeDasharray="3 3" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#EBEBE8',
                  border: '1px solid #18181B',
                  borderRadius: '0px',
                  fontSize: '12px',
                  color: '#18181B',
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
                    fill={entry.isSelected ? '#0066FF' : '#18181B'}
                    stroke="#EBEBE8"
                    strokeWidth={entry.isSelected ? 2 : 1}
                    className="cursor-pointer"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] font-mono text-[#52525B]">
          <span>Low ε / Low Rough: Dry Soil</span>
          <span className="text-right">High ε / Low Rough: Floodwater</span>
          <span>Low ε / High Rough: Dry Canopy</span>
          <span className="text-right">High ε / High Rough: Flooded Crop</span>
        </div>
      </div>

      {/* Soil Moisture Bar Strip */}
      <div className="border border-[#D4D4D8] bg-[#F4F4F5] p-3">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#52525B] mb-2">
          Root-Zone Wetness (GWETROOT %) Across Passes
        </div>
        <div className="h-20 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeSeriesData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <XAxis dataKey="passCode" stroke="#52525B" tick={{ fontSize: 10, fill: '#52525B' }} />
              <YAxis domain={[0, 100]} stroke="#52525B" tick={{ fontSize: 10, fill: '#52525B' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#EBEBE8',
                  border: '1px solid #18181B',
                  borderRadius: '0px',
                  fontSize: '11px',
                  color: '#18181B',
                }}
              />
              <Bar dataKey="soilMoisturePct" name="Soil Moisture %" fill="#0066FF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
