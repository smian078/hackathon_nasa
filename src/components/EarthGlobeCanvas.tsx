import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ArrowUpRight, Crosshair, RotateCcw } from 'lucide-react';
import { REGION_DATASETS } from '../data/samples/asfVertexSamples.ts';
import type { RegionId } from '../types/sar.ts';
import {
  computeCameraPositionForLatLon,
  latLonToCartesian,
} from '../utils/globeMath.ts';

interface EarthGlobeCanvasProps {
  activeRegionId: RegionId;
  onSelectRegionTransition: (regionId: RegionId) => void;
  isTransitioning: boolean;
}

const EARTH_RADIUS = 1.65;
const DEFAULT_CAMERA_LAT = 23;
const DEFAULT_CAMERA_LON = 96;
const DEFAULT_CAMERA_DIST = 4.45;

// Clean non-self-intersecting geographic contours [lon, lat] for crisp procedural globe rendering
const CONTINENT_POLYGONS: Array<Array<[number, number]>> = [
  // North & Central America
  [
    [-168, 65], [-162, 71], [-140, 70], [-122, 73], [-95, 74], [-78, 70],
    [-64, 64], [-55, 52], [-66, 45], [-74, 40], [-81, 31], [-80, 25],
    [-84, 29], [-90, 29], [-97, 26], [-96, 19], [-88, 21], [-84, 11],
    [-78, 8], [-85, 10], [-93, 15], [-105, 20], [-112, 28], [-117, 32],
    [-124, 40], [-125, 49], [-136, 58], [-152, 60], [-164, 55],
  ],
  // Greenland
  [
    [-52, 60], [-42, 60], [-30, 68], [-19, 77], [-28, 83], [-56, 82],
    [-68, 76], [-56, 68],
  ],
  // South America
  [
    [-78, 9], [-72, 12], [-62, 10], [-50, 2], [-35, -6], [-39, -15],
    [-40, -22], [-48, -28], [-54, -34], [-63, -41], [-67, -50], [-68, -55],
    [-74, -52], [-75, -43], [-71, -30], [-70, -18], [-81, -5], [-79, 2],
  ],
  // Africa
  [
    [-17, 15], [-13, 28], [-6, 36], [10, 37], [15, 32], [25, 32], [33, 31],
    [39, 21], [43, 12], [51, 12], [49, 4], [41, -2], [40, -11], [35, -20],
    [32, -28], [26, -34], [18, -35], [15, -26], [12, -16], [12, -6],
    [9, 4], [2, 6], [-8, 5], [-14, 9],
  ],
  // Madagascar
  [[44, -25], [47, -25], [50, -15], [48, -13], [44, -18]],
  // Europe & Eurasia & India & SE Asia (clean clockwise coastal trace)
  [
    [-9, 37], [-9, 43], [-2, 43], [-4, 48], [2, 51], [8, 55], [10, 58],
    [5, 61], [15, 69], [28, 71], [44, 68], [66, 71], [90, 74], [115, 73],
    [140, 72], [175, 67], [163, 60], [155, 59], [142, 53], [136, 45],
    [129, 41], [129, 35], [126, 35], [124, 39], [120, 36], [122, 31],
    [118, 24], [108, 21], [109, 13], [104, 10], [103, 2], [99, 13],
    [96, 16], [92, 21], [88, 22], [84, 19], [80, 13], [77.5, 8.1],
    [76, 10], [73, 16], [72, 21], [68, 23], [62, 25], [56, 26],
    [50, 29], [57, 23], [53, 16], [44, 13], [35, 29], [36, 36],
    [27, 41], [24, 38], [18, 40], [15, 38], [12, 43], [7, 44], [3, 42], [-5, 36],
  ],
  // Sri Lanka
  [[80, 9.6], [81.8, 7.8], [81.2, 6.0], [79.8, 6.9]],
  // UK & Ireland
  [[-6, 50], [1, 51], [-2, 58], [-6, 57], [-8, 53]],
  // Japan (Kyushu, Shikoku, Honshu, Hokkaido)
  [[130, 31.2], [131.6, 32], [131.2, 34], [129.6, 33.4]],
  [[132, 34], [135, 34.4], [137, 36.8], [139.8, 35.2], [141, 38], [141.4, 41.3], [140, 41.2], [138.8, 37.8], [136.5, 36.8], [134, 35.6], [131, 34.2]],
  [[140.2, 41.6], [142, 42.2], [145.5, 43.4], [144, 44.5], [141.6, 45.4], [140.2, 43.2]],
  // Sumatra, Java, Borneo, Philippines
  [[95.3, 5.5], [105.8, -5.9], [104.2, -6.1], [98, 2.5]],
  [[105.5, -6.2], [114.4, -8.3], [114.2, -7.2], [106, -5.8]],
  [[109, 1.5], [117.5, 6.5], [118.8, 1.0], [115, -3.5], [110, -2.5]],
  [[120, 18.4], [122.4, 14.2], [126.2, 7.2], [122, 6.8], [119.8, 13.5]],
  // Australia & New Zealand
  [
    [114, -22], [122, -17], [130, -12], [136, -12], [142, -11], [146, -18],
    [153, -27], [151, -34], [147, -38], [139, -36], [131, -32], [122, -34],
    [115, -34], [113, -27],
  ],
  [[167, -46], [173, -41], [178, -37], [174, -35], [171, -41], [166, -45]],
];

function createEarthTextures(): {
  colorMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const width = 2048;
  const height = 1024;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d');

  const toPx = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * width,
    ((90 - lat) / 180) * height,
  ];

  if (ctx && rCtx) {
    // Ocean base — Warm Industrial Slate Navy
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0, '#131A22');
    oceanGrad.addColorStop(0.5, '#19232E');
    oceanGrad.addColorStop(1, '#131A22');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // Ocean roughness (medium-low sheen)
    rCtx.fillStyle = '#666666';
    rCtx.fillRect(0, 0, width, height);

    // Subtle equirectangular graticule grid
    ctx.strokeStyle = 'rgba(235, 235, 232, 0.08)';
    ctx.lineWidth = 1;
    for (let lon = -150; lon <= 180; lon += 30) {
      const [x] = toPx(lon, 0);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const [, y] = toPx(0, lat);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Equator accent
    const [, eqY] = toPx(0, 0);
    ctx.strokeStyle = 'rgba(0, 102, 255, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, eqY);
    ctx.lineTo(width, eqY);
    ctx.stroke();

    // Draw Continents in Warm Industrial mineral grey/parchment
    for (const poly of CONTINENT_POLYGONS) {
      if (poly.length < 3) continue;

      ctx.beginPath();
      rCtx.beginPath();
      poly.forEach(([lon, lat], idx) => {
        const [px, py] = toPx(lon, lat);
        if (idx === 0) {
          ctx.moveTo(px, py);
          rCtx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
          rCtx.lineTo(px, py);
        }
      });
      ctx.closePath();
      rCtx.closePath();

      ctx.fillStyle = '#D6D6D0';
      ctx.fill();
      ctx.strokeStyle = '#0066FF';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Matte land roughness
      rCtx.fillStyle = '#E0E0E0';
      rCtx.fill();
    }

    // Highlight subtle radar swath footprint markers around active regions on texture
    Object.values(REGION_DATASETS).forEach((region) => {
      const [cx, cy] = toPx(region.center[1], region.center[0]);
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 46);
      grad.addColorStop(0, 'rgba(0, 102, 255, 0.55)');
      grad.addColorStop(0.5, 'rgba(0, 102, 255, 0.18)');
      grad.addColorStop(1, 'rgba(0, 102, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 4;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  return { colorMap, roughnessMap };
}

function detectSoftwareWebGL(renderer: THREE.WebGLRenderer): boolean {
  try {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      const rendererStr = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '');
      if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr)) {
        return true;
      }
    }
    const baseStr = String(gl.getParameter(gl.RENDERER) ?? '');
    return /SwiftShader|llvmpipe|softpipe|Software/i.test(baseStr);
  } catch {
    return false;
  }
}

export function EarthGlobeCanvas({
  activeRegionId,
  onSelectRegionTransition,
  isTransitioning,
}: EarthGlobeCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const flyTriggerRef = useRef<((id: RegionId) => void) | null>(null);
  const resetViewRef = useRef<(() => void) | null>(null);
  const onSelectRef = useRef(onSelectRegionTransition);
  const activeRegionRef = useRef(activeRegionId);

  useEffect(() => {
    onSelectRef.current = onSelectRegionTransition;
  }, [onSelectRegionTransition]);

  useEffect(() => {
    activeRegionRef.current = activeRegionId;
  }, [activeRegionId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = Math.max(300, container.clientWidth || 540);
    const height = Math.max(320, container.clientHeight || 480);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError('WebGL unavailable; use the regional buttons below to open 2D maps.');
      return;
    }

    const isSoftwareGl = detectSoftwareWebGL(renderer);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D Earth showing highlighted NISAR study areas in Maharashtra, Northeast India, and Japan'
    );

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const initCam = computeCameraPositionForLatLon(
      DEFAULT_CAMERA_LAT,
      DEFAULT_CAMERA_LON,
      DEFAULT_CAMERA_DIST
    );
    camera.position.set(initCam.x, initCam.y, initCam.z);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.65;
    controls.minDistance = 2.6;
    controls.maxDistance = 6.8;
    controls.autoRotate = false;

    // Crisp Studio-Grade Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(5, 4, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x0066ff, 0.9);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);

    // Earth & Atmosphere
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const { colorMap, roughnessMap } = createEarthTextures();
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 48, 36);
    const earthMat = new THREE.MeshStandardMaterial({
      map: colorMap,
      roughnessMap,
      roughness: 0.72,
      metalness: 0.08,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    const gridGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.007, 24, 12);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const gridCage = new THREE.Mesh(gridGeo, gridMat);
    earthGroup.add(gridCage);

    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.055, 32, 24);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.11,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthGroup.add(atmoMesh);

    // Sun-Synchronous NISAR Orbital Ring + Spacecraft Mini-Model
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.z = THREE.MathUtils.degToRad(97.4);
    orbitGroup.rotation.y = THREE.MathUtils.degToRad(18);
    scene.add(orbitGroup);

    const orbitRadius = EARTH_RADIUS * 1.24;
    const orbitRingGeo = new THREE.TorusGeometry(orbitRadius, 0.008, 8, 96);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x18181b,
      transparent: true,
      opacity: 0.25,
    });
    const orbitRingMesh = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRingMesh.rotation.x = Math.PI / 2;
    orbitGroup.add(orbitRingMesh);

    const satelliteGroup = new THREE.Group();
    const satBusGeo = new THREE.BoxGeometry(0.06, 0.06, 0.08);
    const satBusMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7, roughness: 0.3 });
    const satBus = new THREE.Mesh(satBusGeo, satBusMat);
    satelliteGroup.add(satBus);

    const dishGeo = new THREE.CylinderGeometry(0.07, 0.01, 0.025, 16);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x003399, roughness: 0.3 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0, -0.055, 0);
    satelliteGroup.add(dish);

    const wingGeo = new THREE.BoxGeometry(0.24, 0.008, 0.045);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.5, roughness: 0.25 });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    satelliteGroup.add(wing);

    orbitGroup.add(satelliteGroup);

    // 3 Interactive Highlighted Region Beacons
    const clickableTargets: THREE.Mesh[] = [];
    const beaconVisuals: Array<{
      regionId: RegionId;
      group: THREE.Group;
      pulseRing: THREE.Mesh;
      coreMesh: THREE.Mesh;
      stemMat: THREE.MeshBasicMaterial;
      basePos: THREE.Vector3;
    }> = [];

    const stemGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8);
    const coreGeo = new THREE.SphereGeometry(0.055, 16, 16);
    const ringGeo = new THREE.RingGeometry(0.07, 0.105, 24);
    const hitGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    (Object.keys(REGION_DATASETS) as RegionId[]).forEach((regionId) => {
      const region = REGION_DATASETS[regionId];
      const pt = latLonToCartesian(region.center[0], region.center[1], EARTH_RADIUS);
      const normal = new THREE.Vector3(pt.x, pt.y, pt.z).normalize();

      const group = new THREE.Group();
      group.position.copy(normal.clone().multiplyScalar(EARTH_RADIUS));
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      const isActive = regionId === activeRegionId;
      const accentHex = regionId === 'japan_gunw' ? 0xd9381e : 0x0066ff;

      const stemMat = new THREE.MeshBasicMaterial({
        color: accentHex,
      });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.11;
      group.add(stem);

      const coreMat = new THREE.MeshStandardMaterial({
        color: accentHex,
        emissive: accentHex,
        emissiveIntensity: isActive ? 0.9 : 0.45,
        roughness: 0.25,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.y = 0.23;
      group.add(coreMesh);

      const pulseMat = new THREE.MeshBasicMaterial({
        color: accentHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const pulseRing = new THREE.Mesh(ringGeo, pulseMat);
      pulseRing.rotation.x = -Math.PI / 2;
      pulseRing.position.y = 0.015;
      group.add(pulseRing);

      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.y = 0.12;
      hitMesh.userData.regionId = regionId;
      group.add(hitMesh);
      clickableTargets.push(hitMesh);

      earthGroup.add(group);
      beaconVisuals.push({
        regionId,
        group,
        pulseRing,
        coreMesh,
        stemMat,
        basePos: normal.clone(),
      });
    });

    // Raycasting & Smooth Fly-To Animation State
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let isDisposed = false;
    let rafId = 0;
    let timerId = 0;
    let satAngle = 0.85;
    let hoverRegionLocal: RegionId | null = null;
    let flyState: {
      startPos: THREE.Vector3;
      endPos: THREE.Vector3;
      startTime: number;
      durationMs: number;
      targetRegion: RegionId | null;
      triggerTransition: boolean;
    } | null = null;

    const triggerFlyTo = (regionId: RegionId, triggerTransition: boolean) => {
      const region = REGION_DATASETS[regionId];
      const targetCam = computeCameraPositionForLatLon(
        region.center[0],
        region.center[1],
        triggerTransition ? 2.65 : DEFAULT_CAMERA_DIST
      );
      flyState = {
        startPos: camera.position.clone(),
        endPos: new THREE.Vector3(targetCam.x, targetCam.y, targetCam.z),
        startTime: performance.now(),
        durationMs: isSoftwareGl ? 360 : 620,
        targetRegion: regionId,
        triggerTransition,
      };
      scheduleNextTick();
    };

    flyTriggerRef.current = (id: RegionId) => triggerFlyTo(id, true);
    resetViewRef.current = () => {
      const camPt = computeCameraPositionForLatLon(
        DEFAULT_CAMERA_LAT,
        DEFAULT_CAMERA_LON,
        DEFAULT_CAMERA_DIST
      );
      flyState = {
        startPos: camera.position.clone(),
        endPos: new THREE.Vector3(camPt.x, camPt.y, camPt.z),
        startTime: performance.now(),
        durationMs: 480,
        targetRegion: null,
        triggerTransition: false,
      };
      scheduleNextTick();
    };

    const updatePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableTargets, false);
      const hitId = (hits[0]?.object.userData.regionId as RegionId | undefined) ?? null;
      if (hitId !== hoverRegionLocal) {
        hoverRegionLocal = hitId;
        setHoveredRegion(hitId);
        renderer.domElement.style.cursor = hitId ? 'pointer' : 'grab';
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const moved = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (moved > 8) return; // Dragged globe rather than clicked marker
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableTargets, false);
      const hitId = hits[0]?.object.userData.regionId as RegionId | undefined;
      if (hitId) {
        triggerFlyTo(hitId, true);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (isDisposed || !container) return;
      const w = Math.max(300, container.clientWidth);
      const h = Math.max(320, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderFrame();
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    const renderFrame = () => {
      if (isDisposed) return;
      const now = performance.now();

      // Update satellite orbital position
      satAngle += isSoftwareGl ? 0.015 : 0.004;
      satelliteGroup.position.set(
        Math.cos(satAngle) * orbitRadius,
        0,
        Math.sin(satAngle) * orbitRadius
      );
      satelliteGroup.lookAt(0, 0, 0);

      // Pulse beacon rings
      beaconVisuals.forEach((b, idx) => {
        const isHot = b.regionId === hoverRegionLocal || b.regionId === activeRegionRef.current;
        const wave = ((now * 0.0018 + idx * 0.35) % 1);
        const scale = isHot ? 1.15 + wave * 0.95 : 0.9 + wave * 0.65;
        b.pulseRing.scale.set(scale, scale, 1);
        const pMat = b.pulseRing.material as THREE.MeshBasicMaterial;
        pMat.opacity = (1 - wave) * (isHot ? 0.95 : 0.65);
        const cMat = b.coreMesh.material as THREE.MeshStandardMaterial;
        cMat.emissiveIntensity = isHot ? 1.15 : 0.45;
      });

      // Handle smooth camera fly-to
      if (flyState) {
        const elapsed = now - flyState.startTime;
        const rawT = Math.min(1, elapsed / flyState.durationMs);
        // Cubic-bezier approximation (high inertia deceleration)
        const eased = 1 - Math.pow(1 - rawT, 3);

        // Spherical slerp-like interpolation so camera never clips through Earth
        const startDir = flyState.startPos.clone().normalize();
        const endDir = flyState.endPos.clone().normalize();
        const interpDir = startDir.lerp(endDir, eased).normalize();
        const startDist = flyState.startPos.length();
        const endDist = flyState.endPos.length();
        const interpDist = THREE.MathUtils.lerp(startDist, endDist, eased);

        camera.position.copy(interpDir.multiplyScalar(interpDist));
        camera.lookAt(0, 0, 0);

        if (rawT >= 1) {
          const completed = flyState;
          flyState = null;
          if (completed.triggerTransition && completed.targetRegion) {
            onSelectRef.current(completed.targetRegion);
          }
        }
      } else {
        controls.update();
      }

      renderer.render(scene, camera);
    };

    const gl2 = isSoftwareGl
      ? (renderer.getContext() as WebGL2RenderingContext)
      : null;

    const afterDraw = (next: () => void) => {
      if (isDisposed) return;
      if (gl2 && typeof gl2.fenceSync === 'function') {
        const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (sync) {
          gl2.flush();
          const started = performance.now();
          const poll = () => {
            if (isDisposed) {
              gl2.deleteSync(sync);
              return;
            }
            const status = gl2.clientWaitSync(sync, 0, 0);
            if (
              status === gl2.ALREADY_SIGNALED ||
              status === gl2.CONDITION_SATISFIED ||
              performance.now() - started > 80
            ) {
              gl2.deleteSync(sync);
              next();
            } else {
              timerId = window.setTimeout(poll, 8);
            }
          };
          timerId = window.setTimeout(poll, 8);
          return;
        }
      }
      rafId = window.requestAnimationFrame(next);
    };

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const tick = () => {
      if (isDisposed) return;
      renderFrame();
      if (!prefersReducedMotion || flyState) {
        if (isSoftwareGl) {
          // Pace gently on SwiftShader so browser remains ultra-responsive
          timerId = window.setTimeout(() => afterDraw(tick), flyState ? 16 : 60);
        } else {
          rafId = window.requestAnimationFrame(tick);
        }
      }
    };

    const scheduleNextTick = () => {
      if (prefersReducedMotion && !flyState) {
        renderFrame();
      } else if (!rafId && !timerId) {
        tick();
      }
    };

    renderFrame();
    if (!prefersReducedMotion) {
      tick();
    }

    const handleControlChange = () => {
      if (prefersReducedMotion) {
        renderFrame();
      }
    };
    controls.addEventListener('change', handleControlChange);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      resizeObserver.disconnect();
      controls.removeEventListener('change', handleControlChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);

      earthGeo.dispose();
      earthMat.dispose();
      colorMap.dispose();
      roughnessMap.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      orbitRingGeo.dispose();
      orbitRingMat.dispose();
      satBusGeo.dispose();
      satBusMat.dispose();
      dishGeo.dispose();
      dishMat.dispose();
      wingGeo.dispose();
      wingMat.dispose();
      stemGeo.dispose();
      coreGeo.dispose();
      ringGeo.dispose();
      hitGeo.dispose();
      hitMat.dispose();
      beaconVisuals.forEach((b) => {
        b.stemMat.dispose();
        (b.coreMesh.material as THREE.Material).dispose();
        (b.pulseRing.material as THREE.Material).dispose();
      });

      renderer.dispose();
    };
  }, []);

  const activeHoverMeta = hoveredRegion ? REGION_DATASETS[hoveredRegion] : null;

  return (
    <div className="relative border border-[#D4D4D8] bg-[#EBEBE8] p-4 sm:p-5">
      {/* Top Frame Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D4D4D8]">
        <div className="flex items-center gap-2">
          <Crosshair className="h-3.5 w-3.5 text-[#0066FF]" aria-hidden="true" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#18181B]">
            3D Orbital Globe · Drag to Inspect · Tap Highlighted Site
          </span>
        </div>
        <button
          type="button"
          onClick={() => resetViewRef.current?.()}
          aria-label="Reset 3D Earth camera to Asia-Pacific study corridor"
          className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#52525B] hover:text-[#0066FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          <span>Reset Orbit</span>
        </button>
      </div>

      {/* 3D WebGL Earth Viewport */}
      <div className="relative mt-4 h-[330px] sm:h-[400px] w-full border border-[#D4D4D8] bg-[#141C24] overflow-hidden">
        {webglError ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-xs text-[#EBEBE8] font-mono">
            {webglError}
          </div>
        ) : (
          <div
            ref={mountRef}
            data-testid="earth-globe-canvas"
            className="h-full w-full"
          />
        )}

        {/* Solid Corner Coordinate Readout (No backdrop-blur over WebGL) */}
        <div className="pointer-events-none absolute top-3 left-3 bg-[#18181B] px-2.5 py-1 border border-[#3F3F46] font-mono text-[10px] uppercase tracking-[0.2em] text-[#EBEBE8]">
          {activeHoverMeta
            ? `TARGET: ${activeHoverMeta.shortName} · CLICK TO OPEN 2D MAP`
            : isTransitioning
              ? 'MORPHING 3D ORBIT → 2D LEAFLET PROJECTION...'
              : 'L-BAND SWEEPSAR · 97.4° SUN-SYNC'}
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3 bg-[#EBEBE8] px-2.5 py-1 border border-[#18181B] font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#18181B]">
          3 ACTIVE CYCLE 035 SITES
        </div>
      </div>

      {/* Direct Highlighted Region Selector Chips */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(Object.keys(REGION_DATASETS) as RegionId[]).map((id, idx) => {
          const r = REGION_DATASETS[id];
          const isHovered = hoveredRegion === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={`globe-pin-${id}`}
              onClick={() => flyTriggerRef.current?.(id)}
              className={`group flex items-center justify-between gap-2 border px-3 py-2.5 text-left transition-colors industrial-ease duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] ${
                isHovered
                  ? 'border-[#0066FF] bg-[#0066FF] text-white'
                  : 'border-[#D4D4D8] bg-[#F4F4F5] text-[#18181B] hover:border-[#18181B] hover:bg-[#18181B] hover:text-[#EBEBE8]'
              }`}
            >
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-75">
                  0{idx + 1} · {r.productType}
                </div>
                <div className="truncate text-xs font-bold mt-0.5">
                  {r.shortName.replace(/ \[.*\]$/, '')}
                </div>
              </div>
              <ArrowUpRight
                className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:rotate-45"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
