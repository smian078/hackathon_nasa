import { useEffect } from 'react';
import { ExternalLink, Layers, Radio, ShieldCheck, X } from 'lucide-react';

interface AboutDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDataModal({ isOpen, onClose }: AboutDataModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      onClick={onClose}
    >
      <div
        className="aura-glass relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6 text-[#F8FAFC] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 id="about-modal-title" className="font-display text-xl font-bold text-[#F8FAFC]">
              About NISAR Pulse &amp; NASA Data Sources
            </h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Cloud-Piercing L-Band GCOV &amp; GUNW Radar Intelligence for Floods, Farms, and Faults
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close About and Data Sources modal"
            className="rounded-lg p-2 text-[#94A3B8] hover:bg-white/10 hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-[#E2E8F0]">
          <section className="rounded-xl bg-[#100E14]/70 p-4 border border-white/10">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-[#00F0FF]">
              <Radio className="h-4 w-4" aria-hidden="true" />
              Why L-Band SAR (24 cm Wavelength) Pierces Monsoon Clouds
            </h3>
            <p className="mt-2 text-[#94A3B8]">
              Optical sensors (MODIS, VIIRS, Sentinel-2) are blocked by dense monsoon clouds and night-time darkness. NISAR transmits active L-band microwaves (24 cm wavelength, 12-day exact repeat cycle) that penetrate cloud cover, smoke, and crop canopies to measure surface dielectric constant (moisture), geometric roughness, and sub-centimeter crustal motion.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                <p className="font-semibold text-[#C04CFD]">Level-2 GCOV (Polarimetric Covariance)</p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Radiometrically terrain-corrected backscatter in γ⁰ dB. <strong className="text-[#F8FAFC]">HH</strong> drops sharply on smooth standing floodwater (specular reflection &le; -18 dB). <strong className="text-[#F8FAFC]">HV</strong> rises with canopy volume and emergent flooded crops (&ge; -12.5 dB).
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                <p className="font-semibold text-[#E8559D]">Level-2 GUNW (Unwrapped Interferogram)</p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Measures interferometric phase differences (radians) across 12-day orbital passes. At 24 cm wavelength, one 2π fringe equals 12.0 cm of Line-of-Sight (LOS) uplift or subsidence, filtered by coherence γ (0.0–1.0).
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-[#100E14]/70 p-4 border border-white/10">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-[#D4F844]">
              <Layers className="h-4 w-4" aria-hidden="true" />
              Verified NASA, ISRO &amp; Open Telemetry Endpoints
            </h3>
            <ul className="mt-2 space-y-2 text-xs text-[#94A3B8]">
              <li className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                <div>
                  <strong className="text-[#F8FAFC]">Alaska Satellite Facility (ASF DAAC Vertex)</strong>
                  <p>Search API &amp; NISAR / Sentinel-1 GCOV and GUNW granule catalog.</p>
                </div>
                <a
                  href="https://search.asf.alaska.edu/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#00F0FF] hover:underline shrink-0"
                >
                  <span>Vertex</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                <div>
                  <strong className="text-[#F8FAFC]">NASA GIBS (MODIS Terra TrueColor WMTS)</strong>
                  <p>Optical true-color orbital imagery demonstrating monsoon cloud occlusion.</p>
                </div>
                <a
                  href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#00F0FF] hover:underline shrink-0"
                >
                  <span>GIBS</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                <div>
                  <strong className="text-[#F8FAFC]">NASA POWER Agroclimatology API</strong>
                  <p>Daily precipitation (PRECTOTCORR mm/day) and root-zone soil wetness (GWETROOT).</p>
                </div>
                <a
                  href="https://power.larc.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#00F0FF] hover:underline shrink-0"
                >
                  <span>POWER</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li className="flex items-start justify-between gap-3">
                <div>
                  <strong className="text-[#F8FAFC]">NASA EONET v3 Natural Events</strong>
                  <p>Live open hazard event tracking integrated when Live Mode is active.</p>
                </div>
                <a
                  href="https://eonet.gsfc.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#00F0FF] hover:underline shrink-0"
                >
                  <span>EONET</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </section>

          <section className="rounded-xl bg-[#100E14]/70 p-4 border border-white/10">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-[#C04CFD]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Grounded AI Disclosure &amp; Attribution
            </h3>
            <p className="mt-2 text-xs text-[#94A3B8]">
              Physical Driver Synthesis uses Gemini 4 Hydrogen strictly grounded to the selected zone&apos;s GCOV/GUNW measurements and NASA POWER climate series via a server-side proxy, with an automatic deterministic microwave physics fallback when offline. Built with open NASA &amp; ISRO NISAR / ASF / Earthdata / GIBS / POWER data. This application does not imply endorsement by NASA or ISRO.
            </p>
            <p className="mt-2 text-xs text-[#94A3B8]">
              <strong className="text-[#F8FAFC]">Team (Nagpur 2026):</strong> Aman Kawale · Vedant Jaiswal · Kalash Wasad · Humaira Khan · Asawari Dhawad
            </p>
          </section>
        </div>

        <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#C04CFD] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C04CFD]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
          >
            Return to Console
          </button>
        </div>
      </div>
    </div>
  );
}
