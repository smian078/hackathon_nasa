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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#18181B]/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto border border-[#18181B] bg-[#EBEBE8] p-6 text-[#18181B] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#D4D4D8] pb-4">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#0066FF]">
              Provenance &amp; Open Telemetry
            </div>
            <h2 id="about-modal-title" className="text-xl font-black tracking-tight text-[#18181B] mt-1">
              NISAR Pulse &amp; Open NASA / ISRO Data Sources
            </h2>
            <p className="mt-1 text-sm text-[#52525B]">
              Cloud-Piercing L-Band GCOV &amp; GUNW Radar Intelligence for Floods, Farms, and Faults
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close About and Data Sources modal"
            className="border border-[#D4D4D8] bg-[#F4F4F5] p-2 text-[#18181B] hover:border-[#18181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-[#18181B]">
          <section className="border border-[#D4D4D8] bg-[#F4F4F5] p-4">
            <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0066FF]">
              <Radio className="h-4 w-4" aria-hidden="true" />
              Why L-Band SAR (24 cm Wavelength) Pierces Monsoon Clouds
            </h3>
            <p className="mt-2 text-xs text-[#52525B]">
              Optical sensors (MODIS, VIIRS, Sentinel-2) are blocked by dense monsoon clouds and night-time darkness. NISAR transmits active L-band microwaves (24 cm wavelength, 12-day exact repeat cycle) that penetrate cloud cover, smoke, and crop canopies to measure surface dielectric constant (moisture), geometric roughness, and sub-centimeter crustal motion.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="border border-[#D4D4D8] bg-[#EBEBE8] p-3">
                <p className="font-bold text-xs text-[#18181B]">Level-2 GCOV (Polarimetric Covariance)</p>
                <p className="mt-1 text-xs text-[#52525B]">
                  Radiometrically terrain-corrected backscatter in γ⁰ dB. <strong className="text-[#18181B]">HH</strong> drops sharply on smooth standing floodwater (specular reflection &le; -18 dB). <strong className="text-[#18181B]">HV</strong> rises with canopy volume and emergent flooded crops (&ge; -12.5 dB).
                </p>
              </div>
              <div className="border border-[#D4D4D8] bg-[#EBEBE8] p-3">
                <p className="font-bold text-xs text-[#18181B]">Level-2 GUNW (Unwrapped Interferogram)</p>
                <p className="mt-1 text-xs text-[#52525B]">
                  Measures interferometric phase differences (radians) across 12-day orbital passes. At 24 cm wavelength, one 2π fringe equals 12.0 cm of Line-of-Sight (LOS) uplift or subsidence, filtered by coherence γ (0.0–1.0).
                </p>
              </div>
            </div>
          </section>

          <section className="border border-[#D4D4D8] bg-[#F4F4F5] p-4">
            <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#18181B]">
              <Layers className="h-4 w-4 text-[#0066FF]" aria-hidden="true" />
              Verified NASA, ISRO &amp; Open Telemetry Endpoints
            </h3>
            <ul className="mt-3 space-y-2.5 text-xs text-[#52525B]">
              <li className="flex items-start justify-between gap-3 border-b border-[#D4D4D8] pb-2">
                <div>
                  <strong className="text-[#18181B]">Alaska Satellite Facility (ASF DAAC Vertex)</strong>
                  <p>Cycle 035 HDF5 (.h5) L-band granules &amp; search API for GCOV and GUNW.</p>
                </div>
                <a
                  href="https://search.asf.alaska.edu/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#0066FF] hover:underline shrink-0"
                >
                  <span>Vertex</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-[#D4D4D8] pb-2">
                <div>
                  <strong className="text-[#18181B]">NASA GIBS (MODIS Terra TrueColor WMTS)</strong>
                  <p>Optical true-color orbital imagery demonstrating monsoon cloud occlusion.</p>
                </div>
                <a
                  href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#0066FF] hover:underline shrink-0"
                >
                  <span>GIBS</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-[#D4D4D8] pb-2">
                <div>
                  <strong className="text-[#18181B]">NASA POWER Agroclimatology API</strong>
                  <p>Daily precipitation (PRECTOTCORR mm/day) and root-zone soil wetness (GWETROOT).</p>
                </div>
                <a
                  href="https://power.larc.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#0066FF] hover:underline shrink-0"
                >
                  <span>POWER</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li className="flex items-start justify-between gap-3">
                <div>
                  <strong className="text-[#18181B]">NASA EONET v3 Natural Events</strong>
                  <p>Live open hazard event tracking integrated when Live Mode is active.</p>
                </div>
                <a
                  href="https://eonet.gsfc.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#0066FF] hover:underline shrink-0"
                >
                  <span>EONET</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </section>

          <section className="border border-[#D4D4D8] bg-[#F4F4F5] p-4">
            <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#18181B]">
              <ShieldCheck className="h-4 w-4 text-[#0066FF]" aria-hidden="true" />
              Grounded AI Disclosure &amp; Attribution
            </h3>
            <p className="mt-2 text-xs text-[#52525B]">
              Built with open NASA &amp; ISRO NISAR / ASF / Earthdata / GIBS / POWER data. NASA does not endorse this application.
            </p>
            <p className="mt-2 text-xs text-[#52525B]">
              <strong className="text-[#18181B]">Team (Nagpur 2026):</strong> Aman Kawale · Vedant Jaiswal · Kalash Wasad · Humaira Khan · Asawari Dhawad
            </p>
          </section>
        </div>

        <div className="mt-5 flex justify-end border-t border-[#D4D4D8] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#18181B] bg-[#18181B] px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#EBEBE8] hover:bg-[#0066FF] hover:border-[#0066FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
          >
            Return to App
          </button>
        </div>
      </div>
    </div>
  );
}
