'use client';

import { useEffect, useRef, useState } from 'react';
import { ko } from '@/lib/i18n/ko';

/* ─── helpers ─────────────────────────────────────────────── */

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

function multiplyRect(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  px: number, py: number, pw: number, ph: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
  cover(ctx, userImg, px, py, pw, ph);
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════
   TSHIRT — chest print zone, rect clip
═══════════════════════════════════════════════════════════ */
function drawTshirtPhoto(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  prodImg: HTMLImageElement,
  W: number, H: number,
) {
  ctx.drawImage(prodImg, 0, 0, W, H);
  const px = Math.round(W * 0.28), py = Math.round(H * 0.30);
  const pw = Math.round(W * 0.43), ph = Math.round(H * 0.31);
  multiplyRect(ctx, userImg, px, py, pw, ph);
}

/* ═══════════════════════════════════════════════════════════
   MUG — center mug white body, rect clip
═══════════════════════════════════════════════════════════ */
function drawMugPhoto(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  prodImg: HTMLImageElement,
  W: number, H: number,
) {
  ctx.drawImage(prodImg, 0, 0, W, H);
  const px = Math.round(W * 0.27), py = Math.round(H * 0.11);
  const pw = Math.round(W * 0.38), ph = Math.round(H * 0.67);
  multiplyRect(ctx, userImg, px, py, pw, ph);
}

/* ═══════════════════════════════════════════════════════════
   CUSHION — left cushion face, rect clip
═══════════════════════════════════════════════════════════ */
function drawCushionPhoto(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  prodImg: HTMLImageElement,
  W: number, H: number,
) {
  ctx.drawImage(prodImg, 0, 0, W, H);
  const px = Math.round(W * 0.05), py = Math.round(H * 0.09);
  const pw = Math.round(W * 0.44), ph = Math.round(H * 0.80);
  multiplyRect(ctx, userImg, px, py, pw, ph);
}

/* ═══════════════════════════════════════════════════════════
   TOTEBAG — natural/white bag body (right side), rect clip
═══════════════════════════════════════════════════════════ */
function drawTotebagPhoto(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  prodImg: HTMLImageElement,
  W: number, H: number,
) {
  ctx.drawImage(prodImg, 0, 0, W, H);
  const px = Math.round(W * 0.52), py = Math.round(H * 0.12);
  const pw = Math.round(W * 0.42), ph = Math.round(H * 0.78);
  multiplyRect(ctx, userImg, px, py, pw, ph);
}

/* ═══════════════════════════════════════════════════════════
   GRIPTOK — white disc face, ellipse clip
═══════════════════════════════════════════════════════════ */
function drawGriptokPhoto(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  prodImg: HTMLImageElement,
  W: number, H: number,
) {
  ctx.drawImage(prodImg, 0, 0, W, H);
  const cx = Math.round(W * 0.39), cy = Math.round(H * 0.44);
  const rx = Math.round(W * 0.30), ry = Math.round(H * 0.27);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
  cover(ctx, userImg, cx - rx, cy - ry, rx * 2, ry * 2);
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════
   MINICANVAS — left canvas face, rect clip
═══════════════════════════════════════════════════════════ */
function drawMinicanvasPhoto(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  prodImg: HTMLImageElement,
  W: number, H: number,
) {
  ctx.drawImage(prodImg, 0, 0, W, H);
  const px = Math.round(W * 0.08), py = Math.round(H * 0.08);
  const pw = Math.round(W * 0.44), ph = Math.round(H * 0.60);
  multiplyRect(ctx, userImg, px, py, pw, ph);
}

/* ─── config ─────────────────────────────────────────────── */

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  prodImg: HTMLImageElement | null,
  w: number,
  h: number,
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

/* ─── public ─────────────────────────────────────────────── */

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
          <MockupCanvas key={item.id} {...item} img={img} productImg={productImgs[item.id] ?? null} />
        ))}
      </div>
    </div>
  );
}
