'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, ShoppingBag } from 'lucide-react';
import { ko } from '@/lib/i18n/ko';
import { useStudioStore } from '@/lib/store/studio';
import {
  DEFAULT_SLOT_CONFIGS, getAllSlotConfigs, SlotConfig,
} from '@/lib/firebase/mockup-configs';

/* ═══════════════════════════════════════════════════════════════
   LOW-LEVEL CANVAS HELPERS
═══════════════════════════════════════════════════════════════ */

function drawAffine3(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  s0x: number, s0y: number,
  s1x: number, s1y: number,
  s2x: number, s2y: number,
  d0x: number, d0y: number,
  d1x: number, d1y: number,
  d2x: number, d2y: number,
) {
  const det = s0x * (s1y - s2y) + s1x * (s2y - s0y) + s2x * (s0y - s1y);
  if (Math.abs(det) < 0.001) return;
  const a = (d0x*(s1y-s2y) + d1x*(s2y-s0y) + d2x*(s0y-s1y)) / det;
  const b = (d0y*(s1y-s2y) + d1y*(s2y-s0y) + d2y*(s0y-s1y)) / det;
  const c = (s0x*(d1x-d2x) + s1x*(d2x-d0x) + s2x*(d0x-d1x)) / det;
  const d = (s0x*(d1y-d2y) + s1x*(d2y-d0y) + s2x*(d0y-d1y)) / det;
  const e = (s0x*(s1y*d2x-s2y*d1x) + s1x*(s2y*d0x-s0y*d2x) + s2x*(s0y*d1x-s1y*d0x)) / det;
  const f = (s0x*(s1y*d2y-s2y*d1y) + s1x*(s2y*d0y-s0y*d2y) + s2x*(s0y*d1y-s1y*d0y)) / det;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0x, d0y); ctx.lineTo(d1x, d1y); ctx.lineTo(d2x, d2y);
  ctx.closePath(); ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function quadWarp(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  zoom = 1.0,
) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const dw = Math.max(x1 - x0, x2 - x3);
  const dh = Math.max(y3 - y0, y2 - y1);
  const da = dw / dh, ia = iw / ih;
  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (ia > da) { sw = ih * da; sx = (iw - sw) / 2; }
  else         { sh = iw / da; sy = (ih - sh) / 2; }
  if (zoom !== 1) {
    const zw = sw / zoom, zh = sh / zoom;
    sx += (sw - zw) / 2; sy += (sh - zh) / 2;
    sw = zw; sh = zh;
  }
  const ex = sx + sw, ey = sy + sh;
  drawAffine3(ctx, img, sx, sy, ex, sy, sx, ey,  x0, y0, x1, y1, x3, y3);
  drawAffine3(ctx, img, ex, sy, ex, ey, sx, ey,  x1, y1, x2, y2, x3, y3);
}

/* ═══════════════════════════════════════════════════════════════
   CONFIG-DRIVEN SLOT RENDERER
═══════════════════════════════════════════════════════════════ */

function drawSlot(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  W: number, H: number,
  cfg: SlotConfig,
) {
  const cx = cfg.x * W;
  const cy = cfg.y * H;
  const sw = cfg.w * W;
  const sh = cfg.h * H;
  const rad = (cfg.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  ctx.save();
  ctx.globalCompositeOperation = cfg.blendMode as GlobalCompositeOperation;
  ctx.globalAlpha = cfg.opacity;

  const filters: string[] = [];
  if (cfg.brightness !== 1) filters.push(`brightness(${cfg.brightness})`);
  if (cfg.saturation !== 1) filters.push(`saturate(${cfg.saturation})`);
  if (cfg.sepia !== 0)      filters.push(`sepia(${cfg.sepia})`);
  if (filters.length > 0)   ctx.filter = filters.join(' ');

  if (cfg.shape === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, sw / 2, sh / 2, rad, 0, Math.PI * 2);
    ctx.clip();
    const iw = userImg.naturalWidth, ih = userImg.naturalHeight;
    const scale = Math.max(sw / iw, sh / ih) * cfg.zoom;
    ctx.translate(cx, cy);
    ctx.rotate(rad);
    ctx.drawImage(userImg, -(iw * scale) / 2, -(ih * scale) / 2, iw * scale, ih * scale);
  } else if (cfg.cylinderCurve) {
    // Cylinder warp: bezier arc clip (A) + optional sinusoidal strip warp (B)
    const fov = cfg.cylinderFov ?? 0;
    const topArc = sh * (cfg.cylinderTopCurve ?? cfg.cylinderCurve);
    const botArc = sh * (cfg.cylinderBottomCurve ?? cfg.cylinderCurve);
    const x0 = cx - sw / 2, y0 = cy - sh / 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, y0 + topArc, x0 + sw, y0);   // top: dips down (concave)
    ctx.lineTo(x0 + sw, y0 + sh);
    ctx.quadraticCurveTo(cx, y0 + sh + botArc, x0, y0 + sh); // bottom: bulges down (convex)
    ctx.closePath(); ctx.clip();
    const iw = userImg.naturalWidth, ih = userImg.naturalHeight;
    const da = sw / sh, ia = iw / ih;
    let sx = 0, sy = 0, srcW = iw, srcH = ih;
    if (ia > da) { srcW = ih * da; sx = (iw - srcW) / 2; }
    else         { srcH = iw / da; sy = (ih - srcH) / 2; }
    if (cfg.zoom !== 1) {
      const zw = srcW / cfg.zoom, zh = srcH / cfg.zoom;
      sx += (srcW - zw) / 2; sy += (srcH - zh) / 2; srcW = zw; srcH = zh;
    }
    if (fov > 0) {
      const STRIPS = 60, sinHalf = Math.sin(fov / 2);
      for (let i = 0; i < STRIPS; i++) {
        const t0 = i / STRIPS, t1 = (i + 1) / STRIPS;
        const dx0 = x0 + sw * (Math.sin((t0 - 0.5) * fov) + sinHalf) / (2 * sinHalf);
        const dx1 = x0 + sw * (Math.sin((t1 - 0.5) * fov) + sinHalf) / (2 * sinHalf);
        if (dx1 <= dx0) continue;
        ctx.drawImage(userImg, sx + t0 * srcW, sy, (t1 - t0) * srcW, srcH, dx0, y0, dx1 - dx0, sh);
      }
    } else {
      ctx.drawImage(userImg, sx, sy, srcW, srcH, x0, y0, sw, sh);
    }
  } else if (cfg.quad) {
    // Free quad warp: use stored corner positions directly
    const { tl, tr, br, bl } = cfg.quad;
    quadWarp(ctx, userImg,
      tl[0]*W, tl[1]*H,
      tr[0]*W, tr[1]*H,
      br[0]*W, br[1]*H,
      bl[0]*W, bl[1]*H,
      cfg.zoom,
    );
  } else {
    // Rotated rect: compute 4 corners from center+size+rotation
    const tlx = cx + (-sw/2)*cos - (-sh/2)*sin, tly = cy + (-sw/2)*sin + (-sh/2)*cos;
    const trx = cx + ( sw/2)*cos - (-sh/2)*sin, trY = cy + ( sw/2)*sin + (-sh/2)*cos;
    const brx = cx + ( sw/2)*cos - ( sh/2)*sin, bry = cy + ( sw/2)*sin + ( sh/2)*cos;
    const blx = cx + (-sw/2)*cos - ( sh/2)*sin, bly = cy + (-sw/2)*sin + ( sh/2)*cos;
    quadWarp(ctx, userImg, tlx, tly, trx, trY, brx, bry, blx, bly, cfg.zoom);
  }

  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT CONFIG
═══════════════════════════════════════════════════════════════ */

const ITEMS = [
  { id: 'tshirt',     slotIds: ['tshirt'],                              label: ko.studio.mockup.tshirt,     w: 200, h: 220, productSrc: '/mockups/tshirt.jpg.png'     },
  { id: 'mug',        slotIds: ['mug'],                                 label: ko.studio.mockup.mug,        w: 220, h: 205, productSrc: '/mockups/mug.jpg.png'        },
  { id: 'cushion',    slotIds: ['cushion_left', 'cushion_right'],       label: ko.studio.mockup.cushion,    w: 200, h: 195, productSrc: '/mockups/cushion.jpg.png'    },
  { id: 'totebag',    slotIds: ['totebag_black', 'totebag_white'],      label: ko.studio.mockup.totebag,    w: 185, h: 215, productSrc: '/mockups/totebag.jpg.png'    },
  { id: 'griptok',    slotIds: ['griptok'],                             label: ko.studio.mockup.griptok,    w: 175, h: 190, productSrc: '/mockups/griptok.jpg.png'    },
  { id: 'minicanvas', slotIds: ['minicanvas_left', 'minicanvas_right'], label: ko.studio.mockup.minicanvas, w: 215, h: 188, productSrc: '/mockups/minicanvas.jpg.png' },
] as const;

/* ─── single canvas ──────────────────────────────────────────── */

function MockupCanvas({ slotIds, label, w, h, img, productImg, configs }: {
  slotIds: readonly string[];
  label: string; w: number; h: number;
  img: HTMLImageElement | null;
  productImg: HTMLImageElement | null;
  configs: Record<string, SlotConfig>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio ?? 1, 2) : 1;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !img || !productImg) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w * dpr, h * dpr);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.drawImage(productImg, 0, 0, w, h);
    for (const id of slotIds) {
      const cfg = configs[id];
      if (cfg) drawSlot(ctx, img, w, h, cfg);
    }
    ctx.restore();
  }, [slotIds, img, productImg, w, h, dpr, configs]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={ref}
        width={w * dpr}
        height={h * dpr}
        style={{ width: '100%', height: 'auto', aspectRatio: `${w} / ${h}` }}
        className="rounded-xl"
      />
      <span className="text-[11px] text-muted-foreground font-medium tracking-wide">{label}</span>
    </div>
  );
}

/* ─── product image preloader ─────────────────────────────────── */

function useProductImgs(): Record<string, HTMLImageElement | null> {
  const [imgs, setImgs] = useState<Record<string, HTMLImageElement | null>>({});
  useEffect(() => {
    ITEMS.forEach(({ id, productSrc }) => {
      const i = new window.Image();
      i.onload = () => setImgs((prev) => ({ ...prev, [id]: i }));
      i.src = productSrc;
    });
  }, []);
  return imgs;
}

/* ─── public component ───────────────────────────────────────── */

export function MockupPreview({ imageUrl }: { imageUrl: string }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [configs, setConfigs] = useState<Record<string, SlotConfig>>(DEFAULT_SLOT_CONFIGS);
  const productImgs = useProductImgs();
  const router = useRouter();
  const generationId = useStudioStore((s) => s.generationId);

  useEffect(() => {
    getAllSlotConfigs().then(setConfigs);
  }, []);

  useEffect(() => {
    if (!imageUrl) return;
    const i = new window.Image();
    if (!imageUrl.startsWith('data:')) i.crossOrigin = 'anonymous';
    i.onload = () => setImg(i);
    i.src = imageUrl;
  }, [imageUrl]);

  function handleItemClick(id: string) {
    const params = new URLSearchParams();
    if (generationId) params.set('gid', generationId);
    router.push(`/product/${id}?${params.toString()}`);
  }

  async function downloadCombined() {
    const COLS = 3, ROWS = 2;
    const CELL_W = 240, CELL_H = 256, LABEL_H = 22, PAD = 14;
    const totalW = COLS * (CELL_W + PAD) + PAD;
    const totalH = ROWS * (CELL_H + LABEL_H + PAD) + PAD;

    const offscreen = document.createElement('canvas');
    offscreen.width = totalW;
    offscreen.height = totalH;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(0, 0, totalW, totalH);

    for (let i = 0; i < ITEMS.length; i++) {
      const item = ITEMS[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const ox = PAD + col * (CELL_W + PAD);
      const oy = PAD + row * (CELL_H + LABEL_H + PAD);

      const prodImg = productImgs[item.id];
      if (!prodImg) continue;

      // White rounded cell
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(ox, oy, CELL_W, CELL_H, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      // Render item to temp canvas at native size
      const tmp = document.createElement('canvas');
      tmp.width = item.w; tmp.height = item.h;
      const tCtx = tmp.getContext('2d');
      if (!tCtx) continue;
      tCtx.drawImage(prodImg, 0, 0, item.w, item.h);
      if (img) {
        for (const id of item.slotIds) {
          const cfg = configs[id];
          if (cfg) drawSlot(tCtx, img, item.w, item.h, cfg);
        }
      }

      // Scale to fit inside cell with padding
      const inner = 16;
      const scale = Math.min((CELL_W - inner * 2) / item.w, (CELL_H - inner * 2) / item.h);
      const dw = item.w * scale, dh = item.h * scale;
      const dx = ox + (CELL_W - dw) / 2, dy = oy + (CELL_H - dh) / 2;
      ctx.drawImage(tmp, dx, dy, dw, dh);

      // Label
      ctx.fillStyle = '#71717a';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, ox + CELL_W / 2, oy + CELL_H + 15);
    }

    const a = document.createElement('a');
    a.download = 'goods-preview.png';
    a.href = offscreen.toDataURL('image/png');
    a.click();
  }

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-border/40 w-full">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {ko.studio.mockup.title}
        </p>
        <p className="text-[10px] text-muted-foreground">{ko.studio.mockup.note}</p>
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-6 w-full">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className="group relative flex flex-col items-center gap-2 rounded-xl p-1 transition-all hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer"
          >
            <MockupCanvas
              slotIds={item.slotIds}
              label={item.label}
              w={item.w} h={item.h}
              img={img}
              productImg={productImgs[item.id] ?? null}
              configs={configs}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground shadow">
                <ShoppingBag className="size-3.5" />
                주문하기
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
