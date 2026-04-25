'use client';

import { useEffect, useRef, useState } from 'react';
import { ko } from '@/lib/i18n/ko';

/* ═══════════════════════════════════════════════════════════════
   LOW-LEVEL HELPERS
═══════════════════════════════════════════════════════════════ */

/** cover-fit: src image → dst rect (like CSS background-size:cover) */
function cover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number,
) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const da = dw / dh, ia = iw / ih;
  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (ia > da) { sw = ih * da; sx = (iw - sw) / 2; }
  else         { sh = iw / da; sy = (ih - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/** rounded-rect path helper */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

/**
 * Affine-transform a single triangle of `img` onto the canvas.
 * Source triangle → destination triangle, clipped to dest triangle.
 */
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

/**
 * Perspective-correct quad warp using 2-triangle affine decomposition.
 * Destination: TL(x0,y0) TR(x1,y1) BR(x2,y2) BL(x3,y3)
 * Image is cover-fitted to the destination bounds before warping.
 */
function quadWarp(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x0: number, y0: number,   // TL
  x1: number, y1: number,   // TR
  x2: number, y2: number,   // BR
  x3: number, y3: number,   // BL
) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const dw = Math.max(x1 - x0, x2 - x3);
  const dh = Math.max(y3 - y0, y2 - y1);
  const da = dw / dh, ia = iw / ih;
  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (ia > da) { sw = ih * da; sx = (iw - sw) / 2; }
  else         { sh = iw / da; sy = (ih - sh) / 2; }
  const ex = sx + sw, ey = sy + sh;
  // Triangle 1: TL TR BL
  drawAffine3(ctx, img, sx, sy, ex, sy, sx, ey,  x0, y0, x1, y1, x3, y3);
  // Triangle 2: TR BR BL
  drawAffine3(ctx, img, ex, sy, ex, ey, sx, ey,  x1, y1, x2, y2, x3, y3);
}

/** quadWarp with multiply blend (white surface → design shows through) */
function multiplyQuad(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x0: number, y0: number, x1: number, y1: number,
  x2: number, y2: number, x3: number, y3: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  quadWarp(ctx, img, x0, y0, x1, y1, x2, y2, x3, y3);
  ctx.restore();
}

/** quadWarp with source-over blend (colored/dark surface → design on top) */
function overQuad(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  opacity: number,
  x0: number, y0: number, x1: number, y1: number,
  x2: number, y2: number, x3: number, y3: number,
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  quadWarp(ctx, img, x0, y0, x1, y1, x2, y2, x3, y3);
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT DRAW FUNCTIONS
   Coordinates measured from actual product photos.
═══════════════════════════════════════════════════════════════ */

function drawTshirtPhoto(ctx: CanvasRenderingContext2D, u: HTMLImageElement, p: HTMLImageElement, W: number, H: number) {
  ctx.drawImage(p, 0, 0, W, H);
  // 앞면 프린트 존 — 칼라 아래 ~ 밑단 위, 좌우 여백 제외
  multiplyQuad(ctx, u,
    W*0.21, H*0.26,   // TL
    W*0.79, H*0.26,   // TR
    W*0.78, H*0.68,   // BR
    W*0.22, H*0.68,   // BL
  );
}

function drawMugPhoto(ctx: CanvasRenderingContext2D, u: HTMLImageElement, p: HTMLImageElement, W: number, H: number) {
  ctx.drawImage(p, 0, 0, W, H);
  // 가운데(녹색 핸들) 머그 흰 몸체 — 핸들 왼쪽 영역만
  multiplyQuad(ctx, u,
    W*0.22, H*0.10,
    W*0.60, H*0.10,
    W*0.60, H*0.87,
    W*0.22, H*0.87,
  );
}

function drawCushionPhoto(ctx: CanvasRenderingContext2D, u: HTMLImageElement, p: HTMLImageElement, W: number, H: number) {
  ctx.drawImage(p, 0, 0, W, H);
  // 왼쪽 쿠션 — 위에서 약간 내려다보는 앵글, 약간 사다리꼴
  multiplyQuad(ctx, u,
    W*0.04, H*0.09,   // TL
    W*0.47, H*0.09,   // TR
    W*0.47, H*0.87,   // BR
    W*0.03, H*0.87,   // BL
  );
  // 오른쪽 쿠션
  multiplyQuad(ctx, u,
    W*0.50, H*0.12,
    W*0.93, H*0.12,
    W*0.93, H*0.90,
    W*0.50, H*0.90,
  );
}

function drawTotebagPhoto(ctx: CanvasRenderingContext2D, u: HTMLImageElement, p: HTMLImageElement, W: number, H: number) {
  ctx.drawImage(p, 0, 0, W, H);
  // 검은 백 — source-over (multiply on black = invisible)
  overQuad(ctx, u, 0.88,
    W*0.03, H*0.21,
    W*0.46, H*0.21,
    W*0.46, H*0.94,
    W*0.03, H*0.94,
  );
  // 흰/아이보리 백 — multiply
  multiplyQuad(ctx, u,
    W*0.54, H*0.21,
    W*0.97, H*0.21,
    W*0.97, H*0.94,
    W*0.54, H*0.94,
  );
}

function drawGriptokPhoto(ctx: CanvasRenderingContext2D, u: HTMLImageElement, p: HTMLImageElement, W: number, H: number) {
  ctx.drawImage(p, 0, 0, W, H);
  // 흰 원반: ~25° 앞으로 기울어짐 → 원반 face를 quadWarp로 perspective 맞춤
  // 이후 ellipse clip으로 원형 마스킹
  const cx = W*0.33, cy = H*0.41, rx = W*0.27, ry = H*0.27;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
  quadWarp(ctx, u,
    W*0.07, H*0.14,   // TL
    W*0.60, H*0.16,   // TR
    W*0.59, H*0.67,   // BR
    W*0.08, H*0.65,   // BL
  );
  ctx.restore();
}

function drawMinicanvasPhoto(ctx: CanvasRenderingContext2D, u: HTMLImageElement, p: HTMLImageElement, W: number, H: number) {
  ctx.drawImage(p, 0, 0, W, H);
  // 왼쪽 캔버스 — 약간 뒤로 기울어진 이젤
  multiplyQuad(ctx, u,
    W*0.08, H*0.08,   // TL
    W*0.48, H*0.09,   // TR
    W*0.47, H*0.71,   // BR
    W*0.09, H*0.70,   // BL
  );
  // 오른쪽 캔버스
  multiplyQuad(ctx, u,
    W*0.53, H*0.10,
    W*0.92, H*0.10,
    W*0.91, H*0.74,
    W*0.53, H*0.73,
  );
}

/* ─── config ─────────────────────────────────────────────── */

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  prodImg: HTMLImageElement | null,
  w: number, h: number,
) => void;

const DRAW_FN: Record<string, DrawFn> = {
  tshirt:     (ctx, img, p, w, h) => { if (p) drawTshirtPhoto(ctx, img, p, w, h); },
  mug:        (ctx, img, p, w, h) => { if (p) drawMugPhoto(ctx, img, p, w, h); },
  cushion:    (ctx, img, p, w, h) => { if (p) drawCushionPhoto(ctx, img, p, w, h); },
  totebag:    (ctx, img, p, w, h) => { if (p) drawTotebagPhoto(ctx, img, p, w, h); },
  griptok:    (ctx, img, p, w, h) => { if (p) drawGriptokPhoto(ctx, img, p, w, h); },
  minicanvas: (ctx, img, p, w, h) => { if (p) drawMinicanvasPhoto(ctx, img, p, w, h); },
};

const ITEMS = [
  { id: 'tshirt',     label: ko.studio.mockup.tshirt,     w: 200, h: 220, productSrc: '/mockups/tshirt.jpg.png'     },
  { id: 'mug',        label: ko.studio.mockup.mug,        w: 220, h: 205, productSrc: '/mockups/mug.jpg.png'        },
  { id: 'cushion',    label: ko.studio.mockup.cushion,    w: 200, h: 195, productSrc: '/mockups/cushion.jpg.png'    },
  { id: 'totebag',    label: ko.studio.mockup.totebag,    w: 185, h: 215, productSrc: '/mockups/totebag.jpg.png'    },
  { id: 'griptok',    label: ko.studio.mockup.griptok,    w: 175, h: 190, productSrc: '/mockups/griptok.jpg.png'    },
  { id: 'minicanvas', label: ko.studio.mockup.minicanvas, w: 195, h: 215, productSrc: '/mockups/minicanvas.jpg.png' },
] as const;

/* ─── single canvas ──────────────────────────────────────── */

function MockupCanvas({ id, label, w, h, img, productImg }: {
  id: string; label: string; w: number; h: number;
  img: HTMLImageElement | null; productImg: HTMLImageElement | null;
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
    DRAW_FN[id]?.(ctx, img, productImg, w, h);
    ctx.restore();
  }, [id, img, productImg, w, h, dpr]);

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

/* ─── product image preloader ─────────────────────────────── */

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

/* ─── public component ───────────────────────────────────── */

export function MockupPreview({ imageUrl }: { imageUrl: string }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const productImgs = useProductImgs();

  useEffect(() => {
    if (!imageUrl) return;
    const i = new window.Image();
    if (!imageUrl.startsWith('data:')) i.crossOrigin = 'anonymous';
    i.onload = () => setImg(i);
    i.src = imageUrl;
  }, [imageUrl]);

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
          <MockupCanvas
            key={item.id}
            {...item}
            img={img}
            productImg={productImgs[item.id] ?? null}
          />
        ))}
      </div>
    </div>
  );
}
