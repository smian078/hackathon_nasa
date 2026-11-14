import { useCallback, useEffect, useRef, useState } from 'react';
import type L from 'leaflet';
import {
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { Cloud, EyeOff, GripVertical, Layers, Radar, SlidersHorizontal } from 'lucide-react';
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
  }, [map, onMainMapReady]);

  useEffect(() => {
    map.setView(center, zoom, { animate: false });
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
  }, [map, onOpticalMapReady]);

  useEffect(() => {
    map.setView(center, zoom, { animate: false });
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

  // Keep the clipped optical GIBS map locked to main radar map pan/zoom
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

  // Drag handler for Cloud-Piercer vertical divider
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
        { mode: 'GUNW_COHERENCE', label: 'GUNW Coherence (γ)' },
        { mode: 'GCOV_HH', label: 'Ref HH dB' },
      ]
    : [
        { mode: 'GCOV_HH', label: 'GCOV HH' },
        { mode: 'GCOV_HV', label: 'GCOV HV' },
        { mode: 'GCOV_RATIO', label: 'HV / HH Ratio' },
      ];

  // Historical valid MODIS Terra monsoon/spring date for live NASA GIBS WMTS tiles
  const gibsTileDate =
    region.id === 'japan_gunw' ? '2024-05-18' : '2024-08-14';
  const cloudOpacity = Math.min(0.88, Math.max(0.28, (activePass?.cloudCoverPct ?? 80) / 110));

  return (
    <section
      aria-label="Cloud-Piercer Dual Optical and SAR Radar Map"
      className="aura-glass rounded-2xl overflow-hidden"
    >
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 bg-[#16131C]/90">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="SAR product layer mode">
          <Layers className="h-4 w-4 text-[#C04CFD] mr-1 shrink-0" aria-hidden="true" />
          {layerOptions.map((opt) => {
            const active = layerMode === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => onSelectLayerMode(opt.mode)}
                aria-pressed={active}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
                  active
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                    : 'bg-white/5 text-[#94A3B8] hover:text-[#F8FAFC] border border-white/10'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span
            className={`font-mono px-2 py-0.5 rounded border whitespace-nowrap ${
              demoMode
                ? 'border-[#D4F844]/40 bg-[#D4F844]/10 text-[#D4F844]'
                : 'border-[#00F0FF]/40 bg-[#00F0FF]/10 text-[#00F0FF]'
            }`}
          >
            {demoMode ? 'SAMPLE DATA (ASF VERTEX EXTRACT)' : 'LIVE NASA / ASF API'}
          </span>
        </div>
      </div>

      {/* Main Split Map Stage */}
      <div
        ref={containerRef}
        data-testid="cloud-piercer-map-stage"
        className="relative h-[360px] lg:h-[460px] w-full select-none overflow-hidden bg-[#0B090F]"
      >
        {/* Base Interactive Radar Map (SAR Polygons) */}
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
            className="nisar-dark-basemap-tiles"
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
                  color: isSelected ? '#F8FAFC' : style.strokeColor,
                  weight: isSelected ? 3 : 1.5,
                  fillColor: style.fillColor,
                  fillOpacity: isSelected
                    ? Math.min(0.68, style.fillOpacity + 0.12)
                    : style.fillOpacity,
                  dashArray: style.dimmed ? '4 4' : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectZone(zone.id),
                }}
              >
                <Tooltip sticky className="nisar-leaflet-tooltip">
                  <div className="text-xs font-sans">
                    <div className="font-semibold text-slate-900">{zone.name}</div>
                    <div className="font-mono text-slate-700">
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

          {/* Realistic Cloud Occlusion Veil calibrated to active pass cloudCoverPct */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: cloudOpacity,
              background:
                'radial-gradient(circle at 22% 30%, rgba(248,250,252,0.95) 0%, rgba(226,232,240,0.78) 30%, transparent 58%), radial-gradient(circle at 65% 58%, rgba(248,250,252,0.92) 0%, rgba(203,213,225,0.72) 34%, transparent 64%), linear-gradient(135deg, rgba(226,232,240,0.52), rgba(148,163,184,0.4))',
            }}
          />
        </div>

        {/* Pane Corner Labels */}
        <div className="pointer-events-none absolute bottom-3 left-3 sm:bottom-auto sm:top-3 sm:left-14 z-[460] flex items-center gap-1.5 rounded-lg bg-[#100E14]/85 px-2.5 py-1 text-[11px] font-medium text-[#F8FAFC] border border-white/15">
          <Cloud className="h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
          <span>Optical GIBS ({activePass?.cloudCoverPct ?? 90}% Cloud)</span>
        </div>

        <div className="pointer-events-none absolute top-3 right-3 z-[460] flex items-center gap-1.5 rounded-lg bg-[#100E14]/85 px-2.5 py-1 text-[11px] font-medium text-[#00F0FF] border border-[#00F0FF]/35">
          <Radar className="h-3.5 w-3.5" aria-hidden="true" />
          <span>NISAR L-Band {region.productType}</span>
        </div>

        {/* Vertical Cloud-Piercer Split Divider & Drag Handle */}
        <div
          className="absolute top-0 bottom-0 z-[480] w-0.5 bg-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.75)]"
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
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-7 cursor-ew-resize items-center justify-center rounded-full bg-[#16131C] border-2 border-[#00F0FF] text-[#00F0FF] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8FAFC]"
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Calibrated Scale Legend, Coherence Filter & Active Polygon HUD */}
      <div className="border-t border-white/10 bg-[#16131C]/95 px-4 py-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Split Slider Accessibility Control */}
          <div className="flex items-center gap-2.5 min-w-[210px]">
            <label
              htmlFor="cloud-piercer-range"
              className="text-xs text-[#94A3B8] whitespace-nowrap"
            >
              Optical / SAR Split
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
            <span className="font-mono text-xs text-[#00F0FF] tabular-nums w-9 text-right">
              {splitPercent}%
            </span>
          </div>

          {/* Coherence Filter (GUNW only) */}
          {isGunw && (
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#D4F844]" aria-hidden="true" />
              <label
                htmlFor="coherence-filter-range"
                className="text-xs text-[#94A3B8] whitespace-nowrap"
              >
                Coherence Mask (γ &ge;)
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
              <span className="font-mono text-xs text-[#D4F844] tabular-nums w-10">
                {coherenceThreshold.toFixed(2)}
              </span>
            </div>
          )}

          {/* Legend Key */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#94A3B8]">
            {layerMode === 'GCOV_HH' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#00F0FF]" />
                  <span>Floodwater (&le; -18 dB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#C04CFD]" />
                  <span>Wet Soil (-18 to -13 dB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#E8559D]" />
                  <span>Rough / Double-Bounce (&gt; -13 dB)</span>
                </span>
              </>
            )}
            {layerMode === 'GCOV_HV' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#D4F844]" />
                  <span>Dense Canopy (&ge; -12.5 dB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#C04CFD]" />
                  <span>Moderate Crop (-16 to -12.5 dB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#00F0FF]" />
                  <span>Open Water (&lt; -16 dB)</span>
                </span>
              </>
            )}
            {layerMode === 'GCOV_RATIO' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#00F0FF]" />
                  <span>Flooded Gap (&ge; +5 dB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#D4F844]" />
                  <span>Volume Canopy (-3 to +5 dB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#C04CFD]" />
                  <span>Surface Dominated (&lt; -3 dB)</span>
                </span>
              </>
            )}
            {layerMode === 'GUNW_LOS' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#EF4444]" />
                  <span>Subsidence (&le; -10 cm)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#E8559D]" />
                  <span>Moderate (-10 to -2 cm)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#00F0FF]" />
                  <span>Uplift (&ge; +2 cm)</span>
                </span>
              </>
            )}
            {layerMode === 'GUNW_COHERENCE' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#D4F844]" />
                  <span>High γ (&ge; 0.70)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#00F0FF]" />
                  <span>Moderate γ (0.40–0.70)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B]" />
                  <span>Decorrelated (&lt; 0.40)</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Active Zone Selection HUD */}
        {selectedZone && activePass && activeStyle ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-[#100E14]/85 px-3.5 py-2.5 border border-white/10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#F8FAFC]">
                  {selectedZone.name}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  · {selectedZone.districtOrPrefecture}
                </span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                    selectedZone.hazardStatus === 'CRITICAL'
                      ? 'border-[#EF4444]/50 text-[#EF4444] bg-[#EF4444]/10'
                      : selectedZone.hazardStatus === 'ELEVATED'
                        ? 'border-[#F59E0B]/50 text-[#F59E0B] bg-[#F59E0B]/10'
                        : 'border-[#10B981]/50 text-[#10B981] bg-[#10B981]/10'
                  }`}
                >
                  {selectedZone.hazardStatus}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {selectedZone.dominantCover} · {activeStyle.classificationLabel}
              </p>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs tabular-nums shrink-0">
              {isGunw ? (
                <>
                  <div>
                    <span className="text-[#94A3B8] block text-[10px]">LOS Shift</span>
                    <span className="text-sm font-semibold text-[#E8559D]">
                      {formatSigned(activePass.losDisplacementCm ?? 0, 1)} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[10px]">Phase</span>
                    <span className="text-sm font-semibold text-[#F8FAFC]">
                      {formatSigned(activePass.unwrappedPhaseRad ?? 0, 2)} rad
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[10px]">Coherence</span>
                    <span className="text-sm font-semibold text-[#D4F844]">
                      γ {(activePass.coherence ?? 0).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[#94A3B8] block text-[10px]">HH γ⁰</span>
                    <span className="text-sm font-semibold text-[#00F0FF]">
                      {activePass.hhGamma0Db.toFixed(1)} dB
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[10px]">ΔHH</span>
                    <span className="text-sm font-semibold text-[#C04CFD]">
                      {formatSigned(activeDelta?.deltaHhDb ?? 0, 1)} dB
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[10px]">HV γ⁰</span>
                    <span className="text-sm font-semibold text-[#D4F844]">
                      {activePass.hvGamma0Db.toFixed(1)} dB
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-[#100E14]/85 px-3.5 py-2.5 border border-white/10 text-xs text-[#94A3B8]">
            <EyeOff className="h-4 w-4 text-[#C04CFD]" aria-hidden="true" />
            <span>Click any SAR polygon on the map to inspect polarization covariance or LOS displacement metrics.</span>
          </div>
        )}
      </div>
    </section>
  );
}
