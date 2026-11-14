#!/usr/bin/env python3
"""
Local NISAR L2 GCOV HDF5 (.h5) Extractor for NISAR Pulse.

Reads the 3 downloaded ASF Vertex NISAR GCOV HDF5 granules locally using h5py and numpy,
extracts /science/LSAR/GCOV/grids/frequencyA/HHHH, HVHV linear covariance arrays, and
/science/LSAR/identification/boundingPolygon, converts covariance to decibels
(10 * log10(gamma0)), and writes lightweight GeoJSON + summary JSON files so >100 MB
.h5 binaries never need to be committed to GitHub.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import h5py
import numpy as np

HDF5_PATHS = {
    "hhhh": "/science/LSAR/GCOV/grids/frequencyA/HHHH",
    "hvhv": "/science/LSAR/GCOV/grids/frequencyA/HVHV",
    "bounding_polygon": "/science/LSAR/identification/boundingPolygon",
}

DEFAULT_GRANULES = [
    {
        "region_id": "maharashtra_gcov",
        "region_name": "Maharashtra (Wainganga Basin & Wardha Cotton Belt)",
        "filename": "NISAR_L2_PR_GCOV_035_084_A_013_4005_DHDH_A_20261111T001915_20261111T001949_P05036_N_F_J_001.h5",
        "cycle": 35,
        "track": 84,
        "frame": 13,
        "orbit_direction": "ASCENDING",
        "bandwidth": "40+5 MHz",
        "polarization": "DHDH (HH + HV)",
        "acquisition_utc": "2026-11-11T00:19:15Z",
        "crid": "P05036",
    },
    {
        "region_id": "northeast_india_gcov",
        "region_name": "Northeast India (Brahmaputra Floodplain & Kaziranga)",
        "filename": "NISAR_L2_PR_GCOV_035_098_A_013_4005_DHDH_A_20261111T233738_20261111T233812_P05036_N_F_J_001.h5",
        "cycle": 35,
        "track": 98,
        "frame": 13,
        "orbit_direction": "ASCENDING",
        "bandwidth": "40+5 MHz",
        "polarization": "DHDH (HH + HV)",
        "acquisition_utc": "2026-11-11T23:37:38Z",
        "crid": "P05036",
    },
    {
        "region_id": "japan_gunw",
        "region_name": "Japan (Noto Peninsula & Toyama Bay)",
        "filename": "NISAR_L2_PR_GCOV_035_009_A_024_4005_DHDH_A_20261105T193406_20261105T193442_P05036_N_F_J_001.h5",
        "cycle": 35,
        "track": 9,
        "frame": 24,
        "orbit_direction": "ASCENDING",
        "bandwidth": "40+5 MHz",
        "polarization": "DHDH (HH + HV)",
        "acquisition_utc": "2026-11-05T19:34:06Z",
        "crid": "P05036",
    },
]


def to_db_stats(arr: np.ndarray, stride: int = 8) -> dict[str, float]:
    """Subsample and compute calibrated 10*log10(gamma0) dB summary statistics."""
    sampled = np.asarray(arr[::stride, ::stride], dtype=np.float64)
    valid_mask = np.isfinite(sampled) & (sampled > 1e-6)
    valid = sampled[valid_mask]
    if valid.size == 0:
        raise ValueError("Dataset contains no finite positive gamma0 backscatter values.")

    db_vals = 10.0 * np.log10(valid)
    return {
        "valid_samples": int(valid.size),
        "min_db": round(float(np.min(db_vals)), 3),
        "p10_db": round(float(np.percentile(db_vals, 10)), 3),
        "median_db": round(float(np.median(db_vals)), 3),
        "mean_db": round(float(np.mean(db_vals)), 3),
        "p90_db": round(float(np.percentile(db_vals, 90)), 3),
        "max_db": round(float(np.max(db_vals)), 3),
    }


def parse_wkt_polygon(wkt_raw: Any) -> list[list[list[float]]]:
    """Parse NISAR /science/LSAR/identification/boundingPolygon WKT into GeoJSON Polygon coordinates."""
    if isinstance(wkt_raw, bytes):
        wkt_text = wkt_raw.decode("utf-8", errors="ignore")
    elif isinstance(wkt_raw, np.ndarray):
        wkt_text = str(wkt_raw.item()) if wkt_raw.size == 1 else str(wkt_raw.tolist())
    else:
        wkt_text = str(wkt_raw)

    match = re.search(r"POLYGON\s*\(\(([^)]+)\)\)", wkt_text, flags=re.IGNORECASE)
    if not match:
        return []

    ring: list[list[float]] = []
    for pair in match.group(1).split(","):
        parts = pair.strip().split()
        if len(parts) >= 2:
            ring.append([round(float(parts[0]), 6), round(float(parts[1]), 6)])

    if ring and ring[0] != ring[-1]:
        ring.append(ring[0])
    return [ring] if len(ring) >= 4 else []


def extract_granule(h5_path: Path, meta: dict[str, Any], stride: int) -> dict[str, Any]:
    """Read HHHH, HVHV, and boundingPolygon from a single NISAR L2 GCOV HDF5 file."""
    with h5py.File(h5_path, "r") as h5f:
        hhhh_ds = h5f[HDF5_PATHS["hhhh"]]
        hvhv_ds = h5f[HDF5_PATHS["hvhv"]]
        wkt_val = h5f[HDF5_PATHS["bounding_polygon"]][()]

        hh_stats = to_db_stats(hhhh_ds, stride=stride)
        hv_stats = to_db_stats(hvhv_ds, stride=stride)
        coords = parse_wkt_polygon(wkt_val)

    hv_hh_ratio_db = round(hv_stats["median_db"] - hh_stats["median_db"], 3)

    return {
        "type": "Feature",
        "properties": {
            **meta,
            "hdf5_paths": HDF5_PATHS,
            "hh_gamma0": hh_stats,
            "hv_gamma0": hv_stats,
            "hv_hh_median_ratio_db": hv_hh_ratio_db,
        },
        "geometry": {
            "type": "Polygon" if coords else "Point",
            "coordinates": coords if coords else [0.0, 0.0],
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract lightweight dB statistics and GeoJSON footprints from NISAR L2 GCOV .h5 granules."
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path("./raw_nisar_h5"),
        help="Directory containing downloaded ASF Vertex .h5 files.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("./src/data/samples/extracted_nisar_gcov.geojson"),
        help="Destination lightweight GeoJSON path.",
    )
    parser.add_argument(
        "--stride",
        type=int,
        default=8,
        help="Spatial decimation stride when computing 10*log10(gamma0) statistics.",
    )
    args = parser.parse_args()

    features: list[dict[str, Any]] = []
    missing: list[str] = []

    for meta in DEFAULT_GRANULES:
        candidate = args.input_dir / meta["filename"]
        if not candidate.exists():
            missing.append(str(candidate))
            continue
        features.append(extract_granule(candidate, meta, stride=max(1, args.stride)))

    output_payload = {
        "type": "FeatureCollection",
        "metadata": {
            "mission": "NISAR (NASA-ISRO)",
            "product": "L2_GCOV",
            "hdf5_paths": HDF5_PATHS,
            "missing_local_h5_files": missing,
        },
        "features": features,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output_payload, indent=2), encoding="utf-8")
    print(f"Wrote {len(features)} extracted granule(s) to {args.output}")
    if missing:
        print(f"Skipped {len(missing)} missing local .h5 file(s):")
        for item in missing:
            print(f"  - {item}")


if __name__ == "__main__":
    main()
