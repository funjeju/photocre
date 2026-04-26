import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { getFirebaseDb } from './client';

export interface QuadCorners {
  tl: [number, number]; // Top-left  (x,y) normalized 0–1
  tr: [number, number]; // Top-right
  br: [number, number]; // Bottom-right
  bl: [number, number]; // Bottom-left
}

export interface SlotConfig {
  x: number;        // center x (0–1)
  y: number;        // center y (0–1)
  w: number;        // width   (0–1)
  h: number;        // height  (0–1)
  rotation: number; // degrees
  shape: 'rect' | 'ellipse';
  opacity: number;  // 0–1
  blendMode: string;
  zoom: number;     // 1 = cover-fit, >1 crops tighter
  brightness: number; // 0–2, default 1
  saturation: number; // 0–2, default 1
  sepia: number;      // 0–1, default 0
  // Optional per-corner warp (rect only). Overrides x/y/w/h/rotation when set.
  quad?: QuadCorners;
  // Cylinder warp (rect only). Overrides quad when set.
  cylinderCurve?: number;       // shared arc depth fallback (0.05–0.25)
  cylinderTopCurve?: number;    // top arc depth override (positive = dips down = concave)
  cylinderBottomCurve?: number; // bottom arc depth override (positive = bulges down = convex)
  cylinderFov?: number;         // 0 = arc clip only (A), >0 = strip warp FOV radians (B)
}

export const DEFAULT_SLOT_CONFIGS: Record<string, SlotConfig> = {
  tshirt: {
    x: 0.50, y: 0.38, w: 0.30, h: 0.30,
    rotation: 0, shape: 'rect', opacity: 1.0, blendMode: 'multiply',
    zoom: 1, brightness: 1, saturation: 1, sepia: 0,
  },
  mug: {
    x: 0.19, y: 0.54, w: 0.36, h: 0.64,
    rotation: 0, shape: 'rect', opacity: 1.0, blendMode: 'multiply',
    zoom: 1, brightness: 1, saturation: 1, sepia: 0,
    cylinderCurve: 0.10, cylinderTopCurve: 0.10, cylinderBottomCurve: 0.10, cylinderFov: 0,
  },
  cushion_left: {
    x: 0.25, y: 0.345, w: 0.22, h: 0.27,
    rotation: 0, shape: 'rect', opacity: 1.0, blendMode: 'multiply',
    zoom: 1, brightness: 1, saturation: 1, sepia: 0,
  },
  cushion_right: {
    x: 0.73, y: 0.44, w: 0.22, h: 0.28,
    rotation: 0, shape: 'rect', opacity: 1.0, blendMode: 'multiply',
    zoom: 1, brightness: 0.95, saturation: 0.93, sepia: 0,
  },
  totebag_black: {
    x: 0.25, y: 0.50, w: 0.16, h: 0.26,
    rotation: 0, shape: 'rect', opacity: 0.85, blendMode: 'source-over',
    zoom: 1, brightness: 1, saturation: 1, sepia: 0,
  },
  totebag_white: {
    x: 0.76, y: 0.495, w: 0.16, h: 0.27,
    rotation: 0, shape: 'rect', opacity: 1.0, blendMode: 'multiply',
    zoom: 1, brightness: 1, saturation: 1, sepia: 0,
  },
  griptok: {
    x: 0.34, y: 0.38, w: 0.62, h: 0.72,
    rotation: 0, shape: 'ellipse', opacity: 1.0, blendMode: 'multiply',
    zoom: 1, brightness: 1, saturation: 1, sepia: 0,
  },
  minicanvas_left: {
    x: 0.23, y: 0.265, w: 0.40, h: 0.49,
    rotation: 0, shape: 'rect', opacity: 1.0, blendMode: 'multiply',
    zoom: 1, brightness: 1, saturation: 1, sepia: 0,
  },
  minicanvas_right: {
    x: 0.741, y: 0.733, w: 0.462, h: 0.486,
    rotation: 0, shape: 'rect', opacity: 1.0, blendMode: 'multiply',
    zoom: 1, brightness: 1, saturation: 1, sepia: 0,
  },
};

export const SLOT_META: { id: string; label: string; productSrc: string; canvasW: number; canvasH: number }[] = [
  { id: 'tshirt',          label: '티셔츠',            productSrc: '/mockups/tshirt.jpg.png',     canvasW: 200, canvasH: 220 },
  { id: 'mug',             label: '머그컵',             productSrc: '/mockups/mug.jpg.png',        canvasW: 220, canvasH: 205 },
  { id: 'cushion_left',    label: '쿠션 (왼쪽)',        productSrc: '/mockups/cushion.jpg.png',    canvasW: 200, canvasH: 195 },
  { id: 'cushion_right',   label: '쿠션 (오른쪽)',      productSrc: '/mockups/cushion.jpg.png',    canvasW: 200, canvasH: 195 },
  { id: 'totebag_black',   label: '에코백 (검정)',       productSrc: '/mockups/totebag.jpg.png',    canvasW: 185, canvasH: 215 },
  { id: 'totebag_white',   label: '에코백 (흰색)',       productSrc: '/mockups/totebag.jpg.png',    canvasW: 185, canvasH: 215 },
  { id: 'griptok',         label: '그립톡',             productSrc: '/mockups/griptok.jpg.png',    canvasW: 175, canvasH: 190 },
  { id: 'minicanvas_left', label: '미니캔버스 (좌상단)',   productSrc: '/mockups/minicanvas.jpg.png', canvasW: 215, canvasH: 188 },
  { id: 'minicanvas_right',label: '미니캔버스 (우하단)',  productSrc: '/mockups/minicanvas.jpg.png', canvasW: 215, canvasH: 188 },
];

export async function getAllSlotConfigs(): Promise<Record<string, SlotConfig>> {
  const result: Record<string, SlotConfig> = { ...DEFAULT_SLOT_CONFIGS };
  try {
    const snap = await getDocs(collection(getFirebaseDb(), 'mockup_configs'));
    snap.forEach((d) => {
      result[d.id] = { ...DEFAULT_SLOT_CONFIGS[d.id], ...d.data() } as SlotConfig;
    });
  } catch (e) {
    console.warn('[mockup-configs] Firestore fetch failed, using defaults', e);
  }
  return result;
}

export async function saveSlotConfig(slotId: string, cfg: SlotConfig): Promise<void> {
  await setDoc(doc(getFirebaseDb(), 'mockup_configs', slotId), {
    ...cfg,
    updatedAt: new Date(),
  });
}
