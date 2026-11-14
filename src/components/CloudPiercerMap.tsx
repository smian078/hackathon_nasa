import { useCallback, useEffect, useRef, useState } from 'react';
import type L from 'leaflet';
import {
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import {
  Cloud,
  EyeOff,
  GripVertical,
  Layers,
  Radar,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  LayerMode,
  RegionDataset,
  StudyZone,
} from '../types/sar.ts';
import {
  computePassDelta,
  formatSigned,
  getPolygonVisualStyle,
} from '../utils/sarPhysics.ts';

interface CloudPiercerMapProps {
  region: RegionDataset;
  selectedZone: StudyZone | null;
  onSelectZone: (zoneId: string) => void;
  layerMode: LayerMode;
  onSelectLayerMode: (mode: LayerMode) => void;
  passIndex: number;
  coherenceThreshold: number;
  onChangeCoherenceThreshold: (val: number) => void;
  demoMode: boolean;
  splitPercent: number;
  onChangeSplitPercent: (val: number) => void;
}

interface MapSyncBridgeProps {
  center: [number, number];
  zoom: number;
  onMainMapReady: (map: L.Map) => void;
}

function MainMapSyncBridge({ center, zoom, onMainMapReady }: MapSyncBridgeProps) {
  const map = useMap();

  useEffect(() => {
    onMainMapReady(map);
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [map, onMainMapReady]);

  useEffect(() => {
    map.setView(center, zoom, { animate: false });
    map.invalidateSize();
  }, [map, center, zoom]);

  return null;
}

interface OpticalMapSyncBridgeProps {
  center: [number, number];
  zoom: number;
  onOpticalMapReady: (map: L.Map) => void;
}

function OpticalMapSyncBridge({
  center,
  zoom,
  onOpticalMapReady,
}: OpticalMapSyncBridgeProps) {
  const map = useMap();

  useEffect(() => {
    onOpticalMapReady(map);
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [map, onOpticalMapReady]);

  useEffect(() => {
    map.setView(center, zoom, { animate: false });
    map.invalidateSize();
  }, [map, center, zoom]);

  return null;
}

export function CloudPiercerMap({
  region,
  selectedZone,
  onSelectZone,
  layerMode,
  onSelectLayerMode,
  passIndex,
  coherenceThreshold,
  onChangeCoherenceThreshold,
  demoMode,
  splitPercent,
  onChangeSplitPercent,
}: CloudPiercerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mainMapRef = useRef<L.Map | null>(null);
  const opticalMapRef = useRef<L.Map | null>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  const handleMainMapReady = useCallback((map: L.Map) => {
    mainMapRef.current = map;
  }, []);

  const handleOpticalMapReady = useCallback((map: L.Map) => {
    opticalMapRef.current = map;
  }, []);

  useEffect(() => {
    const main = mainMapRef.current;
    if (!main) return;

    const syncOptical = () => {
      const optical = opticalMapRef.current;
      if (!optical) return;
      optical.setView(main.getCenter(), main.getZoom(), { animate: false });
    };

    main.on('move', syncOptical);
    main.on('zoom', syncOptical);
    return () => {
      main.off('move', syncOptical);
      main.off('zoom', syncOptical);
    };
  }, [region.id]);

  useEffect(() => {
    if (!isDraggingSplit) return;

    const updateSplitFromClientX = (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      onChangeSplitPercent(Math.round(Math.min(94, Math.max(6, pct))));
    };

    const onPointerMove = (e: PointerEvent) => {
      updateSplitFromClientX(e.clientX);
    };
    const onPointerUp = () => {
      setIsDraggingSplit(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDraggingSplit, onChangeSplitPercent]);

  const activePass =
    selectedZone?.passes[passIndex] ?? region.zones[0].passes[passIndex];
  const activeDelta = selectedZone
    ? computePassDelta(selectedZone, passIndex)
    : null;
  const activeStyle = activePass
    ? getPolygonVisualStyle(activePass, layerMode, coherenceThreshold)
    : null;

  const isGunw = region.productType === 'GUNW';

  const layerOptions: Array<{ mode: LayerMode; label: string }> = isGunw
    ? [
        { mode: 'GUNW_LOS', label: 'GUNW LOS cm' },
        { mode: 'GUNW_COHERENCE', label: 'COHERENCE (γ)' },
        { mode: 'GCOV_HH', label: 'REF HH dB' },
      ]
    : [
        { mode: 'GCOV_HH', label: 'GCOV HH' },
        { mode: 'GCOV_HV', label: 'GCOV HV' },
        { mode: 'GCOV_RATIO', label: 'HV / HH RATIO' },
      ];

  const gibsTileDate =
    region.id === 'japan_gunw' ? '2024-05-18' : '2024-08-14';
  const cloudOpacity = Math.min(
    0.88,
    Math.max(0.28, (activePass?.cloudCoverPct ?? 80) / 110)
  );

  return (
    <section
      aria-label="Cloud-Piercer Dual Optical and SAR Radar 2D Map"
      className="border border-[#D4D4D8] bg-[#EBEBE8]"
    >
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4D4D8] px-4 py-3 bg-[#F4F4F5]">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="SAR product layer mode"
        >
          <Layers className="h-3.5 w-3.5 text-[#0066FF] mr-1 shrink-0" aria-hidden="true" />
          {layerOptions.map((opt) => {
            const active = layerMode === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => onSelectLayerMode(opt.mode)}
                aria-pressed={active}
                className={`px-2.5 py-1.5 border font-mono text-[10px] font-bold tracking-[0.16em] whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
                  active
                    ? 'border-[#18181B] bg-[#18181B] text-[#EBEBE8]'
                    : 'border-[#D4D4D8] bg-[#EBEBE8] text-[#52525B] hover:border-[#18181B] hover:text-[#18181B]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <span
          className={`font-mono text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 border whitespace-nowrap ${
            demoMode
              ? 'border-[#18181B] bg-[#EBEBE8] text-[#18181B]'
              : 'border-[#0066FF] bg-[#0066FF]/10 text-[#0066FF]'
          }`}
        >
          {demoMode ? 'SAMPLE: ASF VERTEX' : 'LIVE: NASA / ASF'}
        </span>
      </div>

      {/* Main Split Map Stage */}
      <div
        ref={containerRef}
        data-testid="cloud-piercer-map-stage"
        className="relative h-[360px] lg:h-[460px] w-full select-none overflow-hidden bg-[#E2E2DE]"
      >
        <MapContainer
          center={region.center}
          zoom={region.zoom}
          className="h-full w-full z-10"
          scrollWheelZoom={true}
        >
          <MainMapSyncBridge
            center={region.center}
            zoom={region.zoom}
            onMainMapReady={handleMainMapReady}
          />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="nisar-industrial-basemap-tiles"
          />

          {region.zones.map((zone) => {
            const pass = zone.passes[passIndex] ?? zone.passes[0];
            const style = getPolygonVisualStyle(
              pass,
              layerMode,
              coherenceThreshold
            );
            const isSelected = selectedZone?.id === zone.id;

            return (
              <Polygon
                key={`${region.id}-${zone.id}`}
                positions={zone.coordinates}
                pathOptions={{
                  color: isSelected ? '#18181B' : style.strokeColor,
                  weight: isSelected ? 3.5 : 1.75,
                  fillColor: style.fillColor,
                  fillOpacity: isSelected
                    ? Math.min(0.7, style.fillOpacity + 0.14)
                    : style.fillOpacity,
                  dashArray: style.dimmed ? '4 4' : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectZone(zone.id),
                }}
              >
                <Tooltip sticky className="nisar-leaflet-tooltip">
                  <div className="text-xs font-sans">
                    <div className="font-semibold text-[#18181B]">{zone.name}</div>
                    <div className="font-mono text-[#52525B]">
                      {style.formattedValue} {style.unit} · {style.classificationLabel}
                    </div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>

        {/* Left Clipped Optical NASA GIBS + Monsoon Cloud Layer */}
        <div
          aria-hidden="true"
          data-testid="optical-clip-pane"
          className="pointer-events-none absolute inset-0 z-[420]"
          style={{
            clipPath: `inset(0 ${100 - splitPercent}% 0 0)`,
          }}
        >
          <MapContainer
            center={region.center}
            zoom={region.zoom}
            className="h-full w-full"
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            boxZoom={false}
            keyboard={false}
            touchZoom={false}
          >
            <OpticalMapSyncBridge
              center={region.center}
              zoom={region.zoom}
              onOpticalMapReady={handleOpticalMapReady}
            />
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <TileLayer
              opacity={0.85}
              maxNativeZoom={9}
              url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${gibsTileDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
            />
          </MapContainer>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: cloudOpacity,
              background:
                'radial-gradient(circle at 22% 30%, rgba(255,255,255,0.96) 0%, rgba(235,235,232,0.82) 32%, transparent 60%), radial-gradient(circle at 65% 58%, rgba(255,255,255,0.94) 0%, rgba(212,212,216,0.75) 35%, transparent 64%), linear-gradient(135deg, rgba(235,235,232,0.58), rgba(161,161,170,0.45))',
            }}
          />
        </div>

        {/* Pane Corner Badges */}
        <div className="pointer-events-none absolute bottom-3 left-3 sm:bottom-auto sm:top-3 sm:left-14 z-[460] flex items-center gap-1.5 border border-[#18181B] bg-[#EBEBE8]/95 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#18181B]">
          <Cloud className="h-3.5 w-3.5 text-[#52525B]" aria-hidden="true" />
          <span>Optical GIBS ({activePass?.cloudCoverPct ?? 90}% Cloud)</span>
        </div>

        <div className="pointer-events-none absolute top-3 right-3 z-[460] flex items-center gap-1.5 border border-[#0066FF] bg-[#18181B] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#EBEBE8]">
          <Radar className="h-3.5 w-3.5 text-[#0066FF]" aria-hidden="true" />
          <span>NISAR L-Band {region.productType}</span>
        </div>

        {/* Vertical Cloud-Piercer Split Divider */}
        <div
          className="absolute top-0 bottom-0 z-[480] w-0.5 bg-[#0066FF]"
          style={{ left: `${splitPercent}%` }}
        >
          <button
            type="button"
            onPointerDown={() => setIsDraggingSplit(true)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onChangeSplitPercent(Math.max(6, splitPercent - 5));
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                onChangeSplitPercent(Math.min(94, splitPercent + 5));
              }
            }}
            aria-label={`Cloud-Piercer split handle at ${splitPercent}%. Drag or use Left and Right arrow keys to compare optical cloud cover against SAR radar.`}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-7 cursor-ew-resize items-center justify-center border-2 border-[#0066FF] bg-[#18181B] text-[#EBEBE8] shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Controls, Calibrated Scale Legend & Active Zone HUD */}
      <div className="border-t border-[#D4D4D8] bg-[#F4F4F5] px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Split Slider */}
          <div className="flex items-center gap-2.5 min-w-[210px]">
            <label
              htmlFor="cloud-piercer-range"
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#52525B] whitespace-nowrap"
            >
              Optical / SAR
            </label>
            <input
              id="cloud-piercer-range"
              type="range"
              min={6}
              max={94}
              value={splitPercent}
              onChange={(e) => onChangeSplitPercent(Number(e.target.value))}
              aria-label="Cloud-Piercer split slider percentage"
              className="nisar-range w-28"
            />
            <span className="font-mono text-xs font-bold text-[#0066FF] tabular-nums w-9 text-right">
              {splitPercent}%
            </span>
          </div>

          {/* Coherence Mask (GUNW only) */}
          {isGunw && (
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#0066FF]" aria-hidden="true" />
              <label
                htmlFor="coherence-filter-range"
                className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#52525B] whitespace-nowrap"
              >
                MASK γ &ge;
              </label>
              <input
                id="coherence-filter-range"
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={coherenceThreshold}
                onChange={(e) =>
                  onChangeCoherenceThreshold(Number(e.target.value))
                }
                aria-label="GUNW interferometric coherence filter threshold"
                className="nisar-range w-24"
              />
              <span className="font-mono text-xs font-bold text-[#18181B] tabular-nums w-10">
                {coherenceThreshold.toFixed(2)}
              </span>
            </div>
          )}

          {/* Legend Key */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#52525B] font-mono">
            {layerMode === 'GCOV_HH' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#00F0FF]" />
                  <span>Flood (&le; -18 dB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#C04CFD]" />
                  <span>Wet (-18..-13 dB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#E8559D]" />
                  <span>Rough (&gt; -13 dB)</span>
                </span>
              </>
            )}
            {layerMode === 'GCOV_HV' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#D4F844]" />
                  <span>Canopy (&ge; -12.5 dB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#C04CFD]" />
                  <span>Moderate</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#00F0FF]" />
                  <span>Open Water</span>
                </span>
              </>
            )}
            {layerMode === 'GCOV_RATIO' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#00F0FF]" />
                  <span>Flooded Gap (&ge; +5 dB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#D4F844]" />
                  <span>Volume Canopy</span>
                </span>
              </>
            )}
            {layerMode === 'GUNW_LOS' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#EF4444]" />
                  <span>Subsidence (&le; -10 cm)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#00F0FF]" />
                  <span>Uplift (&ge; +2 cm)</span>
                </span>
              </>
            )}
            {layerMode === 'GUNW_COHERENCE' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#D4F844]" />
                  <span>High γ (&ge; 0.70)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 border border-[#18181B] bg-[#F59E0B]" />
                  <span>Decorrelated (&lt; 0.40)</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Active Zone Telemetry Strip */}
        {selectedZone && activePass && activeStyle ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-[#D4D4D8] bg-[#EBEBE8] px-3.5 py-2.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[#18181B]">
                  {selectedZone.name}
                </span>
                <span className="text-xs text-[#52525B]">
                  · {selectedZone.districtOrPrefecture}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 border ${
                    selectedZone.hazardStatus === 'CRITICAL'
                      ? 'border-[#DC2626] text-[#B91C1C] bg-[#FEE2E2]'
                      : selectedZone.hazardStatus === 'ELEVATED'
                        ? 'border-[#D97706] text-[#92400E] bg-[#FEF3C7]'
                        : 'border-[#16A34A] text-[#166534] bg-[#DCFCE7]'
                  }`}
                >
                  {selectedZone.hazardStatus}
                </span>
              </div>
              <p className="text-xs text-[#52525B] mt-0.5">
                {selectedZone.dominantCover} · {activeStyle.classificationLabel}
              </p>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs tabular-nums shrink-0">
              {isGunw ? (
                <>
                  <div>
                    <span className="text-[#52525B] block text-[10px] uppercase">LOS Shift</span>
                    <span className="text-sm font-bold text-[#0066FF]">
                      {formatSigned(activePass.losDisplacementCm ?? 0, 1)} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-[#52525B] block text-[10px] uppercase">Phase</span>
                    <span className="text-sm font-bold text-[#18181B]">
                      {formatSigned(activePass.unwrappedPhaseRad ?? 0, 2)} rad
                    </span>
                  </div>
                  <div>
                    <span className="text-[#52525B] block text-[10px]">COHERENCE γ</span>
                    <span className="text-sm font-bold text-[#18181B]">
                      γ {(activePass.coherence ?? 0).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[#52525B] block text-[10px]">HH γ⁰</span>
                    <span className="text-sm font-bold text-[#0066FF]">
                      {activePass.hhGamma0Db.toFixed(1)} dB
                    </span>
                  </div>
                  <div>
                    <span className="text-[#52525B] block text-[10px]">ΔHH</span>
                    <span className="text-sm font-bold text-[#18181B]">
                      {formatSigned(activeDelta?.deltaHhDb ?? 0, 1)} dB
                    </span>
                  </div>
                  <div>
                    <span className="text-[#52525B] block text-[10px]">HV γ⁰</span>
                    <span className="text-sm font-bold text-[#18181B]">
                      {activePass.hvGamma0Db.toFixed(1)} dB
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 border border-[#D4D4D8] bg-[#EBEBE8] px-3.5 py-2.5 text-xs text-[#52525B]">
            <EyeOff className="h-4 w-4 text-[#0066FF]" aria-hidden="true" />
            <span>Click any SAR polygon on the map to inspect polarization covariance or LOS displacement metrics.</span>
          </div>
        )}
      </div>
    </section>
  );
}
