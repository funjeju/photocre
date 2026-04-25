'use client';

import { useEffect, useRef, useState } from 'react';
import { ko } from '@/lib/i18n/ko';

/* ─── helpers ─────────────────────────────────────────────── */

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Center-crop cover fill */
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

/* ═══════════════════════════════════════════════════════════
   MUG  — ceramic gloss, cylindrical print area
═══════════════════════════════════════════════════════════ */
function drawMug(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const BW = 126, BH = 104;            // mug body
  const bx = (cw - BW) / 2 - 14;      // shift left for handle
  const by = (ch - BH) / 2 + 4;
  const RX = BW / 2, RY = 10;          // top/bottom ellipse
  const brx = BW * 0.44, bry = 7;

  // ── outer shadow ──
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#f8f8f8';
  ctx.beginPath();
  ctx.moveTo(bx - RX, by + RY);
  ctx.lineTo(bx + RX, by + RY);
  ctx.lineTo(bx + brx, by + BH - bry);
  ctx.lineTo(bx - brx, by + BH - bry);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── image mapped to print area ──
  const px = bx - RX + 14, pw = BW - 28;
  const py = by + RY + 6, ph = BH - RY - bry - 12;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bx - RX, by + RY);
  ctx.lineTo(bx + RX, by + RY);
  ctx.lineTo(bx + brx, by + BH - bry);
  ctx.lineTo(bx - brx, by + BH - bry);
  ctx.closePath();
  ctx.clip();
  cover(ctx, img, bx - RX, by + RY, BW, BH - RY - bry);
  ctx.restore();

  // ── multiply: cylinder curvature shading ──
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';

  // left shadow
  const lG = ctx.createLinearGradient(px, 0, px + pw * 0.28, 0);
  lG.addColorStop(0, 'rgb(100,100,100)');
  lG.addColorStop(1, 'rgb(255,255,255)');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bx - RX, by + RY); ctx.lineTo(bx + RX, by + RY);
  ctx.lineTo(bx + brx, by + BH - bry); ctx.lineTo(bx - brx, by + BH - bry);
  ctx.closePath(); ctx.clip();
  ctx.fillStyle = lG; ctx.fillRect(bx - RX, by, BW, BH);

  // right shadow
  const rG = ctx.createLinearGradient(px + pw * 0.72, 0, px + pw, 0);
  rG.addColorStop(0, 'rgb(255,255,255)');
  rG.addColorStop(1, 'rgb(95,95,95)');
  ctx.fillStyle = rG; ctx.fillRect(bx - RX, by, BW, BH);
  ctx.restore();

  // top-left gloss highlight
  const shine = ctx.createRadialGradient(bx - RX * 0.3, by + RY * 1.5, 0, bx, by + BH * 0.5, BW * 0.6);
  shine.addColorStop(0,    'rgb(255,255,255)');
  shine.addColorStop(0.35, 'rgb(235,235,235)');
  shine.addColorStop(1,    'rgb(255,255,255)');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bx - RX, by + RY); ctx.lineTo(bx + RX, by + RY);
  ctx.lineTo(bx + brx, by + BH - bry); ctx.lineTo(bx - brx, by + BH - bry);
  ctx.closePath(); ctx.clip();
  ctx.fillStyle = shine; ctx.fillRect(bx - RX, by, BW, BH);
  ctx.restore();

  ctx.restore(); // end multiply

  // ── structural elements (normal mode, drawn on top) ──
  ctx.save();
  // top rim fill
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.ellipse(bx, by + RY, RX, RY, 0, 0, Math.PI * 2);
  ctx.fill();
  // rim highlight
  ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(bx, by + RY, RX, RY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // mug outline
  ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx - RX, by + RY); ctx.lineTo(bx - brx, by + BH - bry);
  ctx.moveTo(bx + RX, by + RY); ctx.lineTo(bx + brx, by + BH - bry);
  ctx.stroke();

  // bottom ellipse
  ctx.fillStyle = '#d4d4d4';
  ctx.beginPath();
  ctx.ellipse(bx, by + BH - bry, brx, bry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(bx, by + BH - bry, brx, bry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // handle — 3D arc
  const hcx = bx + RX + 20, hcy = by + BH * 0.5;
  const hry = BH * 0.3;

  // handle shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = 2;
  ctx.strokeStyle = '#e2e2e2'; ctx.lineWidth = 11; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(hcx, hcy, hry, -Math.PI * 0.65, Math.PI * 0.65);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(hcx, hcy, hry, -Math.PI * 0.65, Math.PI * 0.65);
  ctx.stroke();
  // inner edge
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hcx, hcy, hry + 3, -Math.PI * 0.55, Math.PI * 0.55);
  ctx.stroke();

  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════
   PIN BUTTON  — chrome ring, dome surface
═══════════════════════════════════════════════════════════ */
function drawPin(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const cx = cw / 2, cy = ch / 2 - 6;
  const OR = Math.min(cw, ch) / 2 - 5;  // outer (ring) radius
  const IR = OR - 9;                      // inner (image) radius

  // shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.30)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx, cy, OR, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // chrome ring — 8-stop metallic gradient
  const ringG = ctx.createLinearGradient(cx - OR, cy - OR, cx + OR, cy + OR);
  ringG.addColorStop(0,    '#ffffff');
  ringG.addColorStop(0.12, '#d8d8d8');
  ringG.addColorStop(0.25, '#f4f4f4');
  ringG.addColorStop(0.38, '#adadad');
  ringG.addColorStop(0.50, '#e8e8e8');
  ringG.addColorStop(0.65, '#c0c0c0');
  ringG.addColorStop(0.80, '#f0f0f0');
  ringG.addColorStop(1,    '#b0b0b0');
  ctx.fillStyle = ringG;
  ctx.beginPath(); ctx.arc(cx, cy, OR, 0, Math.PI * 2); ctx.fill();

  // image in inner circle
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, IR, 0, Math.PI * 2); ctx.clip();
  cover(ctx, img, cx - IR, cy - IR, IR * 2, IR * 2);
  ctx.restore();

  // multiply: dome shading
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.beginPath(); ctx.arc(cx, cy, IR, 0, Math.PI * 2); ctx.clip();
  const dome = ctx.createRadialGradient(cx - IR * 0.15, cy - IR * 0.15, IR * 0.05, cx, cy, IR);
  dome.addColorStop(0,    'rgb(255,255,255)');
  dome.addColorStop(0.55, 'rgb(238,238,238)');
  dome.addColorStop(0.80, 'rgb(195,195,195)');
  dome.addColorStop(1,    'rgb(140,140,140)');
  ctx.fillStyle = dome;
  ctx.beginPath(); ctx.arc(cx, cy, IR, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // top-left gloss arc
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, IR * 0.82, Math.PI * 1.25, Math.PI * 1.82);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = IR * 0.22;
  ctx.lineCap = 'round'; ctx.stroke();
  ctx.restore();

  // ring inner edge
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, IR, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // clasp
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
  const cG = ctx.createLinearGradient(cx - 10, cy + OR + 2, cx + 10, cy + OR + 10);
  cG.addColorStop(0, '#e0e0e0'); cG.addColorStop(0.5, '#f8f8f8'); cG.addColorStop(1, '#b8b8b8');
  ctx.fillStyle = cG;
  ctx.beginPath(); ctx.ellipse(cx, cy + OR + 5, 10, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a0a0a0'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(cx, cy + OR + 5, 10, 4.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════
   CUSHION  — puffy square, fabric edge, stitching
═══════════════════════════════════════════════════════════ */
function drawCushion(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const p = 9, r = 26;
  const x = p, y = p + 4, w = cw - p * 2, h = ch - p * 2 - 6;

  // drop shadow (puffy depth)
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; ctx.shadowOffsetX = 1;
  ctx.fillStyle = '#fff';
  rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.restore();

  // image fill
  ctx.save();
  rr(ctx, x, y, w, h, r); ctx.clip();
  cover(ctx, img, x, y, w, h);
  ctx.restore();

  // multiply: puffy center bright, edges recede
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  rr(ctx, x, y, w, h, r); ctx.clip();
  const puff = ctx.createRadialGradient(
    x + w * 0.5, y + h * 0.45, Math.min(w, h) * 0.12,
    x + w * 0.5, y + h * 0.5,  Math.max(w, h) * 0.68,
  );
  puff.addColorStop(0,    'rgb(250,250,250)');
  puff.addColorStop(0.5,  'rgb(230,230,230)');
  puff.addColorStop(0.82, 'rgb(175,175,175)');
  puff.addColorStop(1,    'rgb(120,120,120)');
  ctx.fillStyle = puff; ctx.fillRect(x, y, w, h);
  ctx.restore();

  // stitching (white dashes)
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
  rr(ctx, x + 9, y + 9, w - 18, h - 18, r - 7); ctx.stroke();
  ctx.restore();

  // outer border
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
  rr(ctx, x, y, w, h, r); ctx.stroke();
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════
   PHONE CASE  — matte back, camera island, side details
═══════════════════════════════════════════════════════════ */
function drawPhoneCase(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const pw = 72, ph = 132, pr = 16;
  const px = (cw - pw) / 2, py = (ch - ph) / 2;

  // shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.30)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 7;
  ctx.fillStyle = '#1c1c1e';
  rr(ctx, px, py, pw, ph, pr); ctx.fill();
  ctx.restore();

  // case face gradient (matte plastic)
  const faceG = ctx.createLinearGradient(px, py, px + pw, py + ph);
  faceG.addColorStop(0,   '#2c2c2e');
  faceG.addColorStop(0.5, '#1c1c1e');
  faceG.addColorStop(1,   '#111113');
  ctx.fillStyle = faceG;
  rr(ctx, px, py, pw, ph, pr); ctx.fill();

  // image on back (inset)
  const inset = 5, ir = pr - 2;
  ctx.save();
  rr(ctx, px + inset, py + inset, pw - inset * 2, ph - inset * 2, ir); ctx.clip();
  cover(ctx, img, px + inset, py + inset, pw - inset * 2, ph - inset * 2);
  ctx.restore();

  // multiply: case material overlay on image
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  rr(ctx, px + inset, py + inset, pw - inset * 2, ph - inset * 2, ir); ctx.clip();
  const matG = ctx.createRadialGradient(px + pw * 0.35, py + ph * 0.3, 0, px + pw * 0.5, py + ph * 0.5, Math.max(pw, ph) * 0.65);
  matG.addColorStop(0,    'rgb(248,248,248)');
  matG.addColorStop(0.6,  'rgb(218,218,218)');
  matG.addColorStop(1,    'rgb(140,140,140)');
  ctx.fillStyle = matG; ctx.fillRect(px + inset, py + inset, pw - inset * 2, ph - inset * 2);
  ctx.restore();

  // camera island
  const cix = px + pw - 30, ciy = py + 13;
  ctx.save();
  ctx.fillStyle = '#111';
  ctx.strokeStyle = '#3a3a3c'; ctx.lineWidth = 1;
  rr(ctx, cix, ciy, 22, 20, 6); ctx.fill(); ctx.stroke();

  // lenses
  const lenses: [number, number, number][] = [[cix + 6, ciy + 6, 4.5], [cix + 15, ciy + 12, 3.5]];
  lenses.forEach(([lx, ly, lr]) => {
    // lens ring
    ctx.strokeStyle = '#505050'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(lx, ly, lr + 1.5, 0, Math.PI * 2); ctx.stroke();
    // lens body
    const lG = ctx.createRadialGradient(lx - lr * 0.3, ly - lr * 0.3, 0, lx, ly, lr);
    lG.addColorStop(0, '#1a1a3a'); lG.addColorStop(0.7, '#08080f'); lG.addColorStop(1, '#000');
    ctx.fillStyle = lG;
    ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
    // lens glint
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.beginPath(); ctx.arc(lx - lr * 0.35, ly - lr * 0.35, lr * 0.35, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();

  // side power button
  ctx.save();
  ctx.fillStyle = '#2a2a2c';
  rr(ctx, px + pw - 1, py + 48, 4, 26, 2); ctx.fill();
  ctx.fillStyle = '#3a3a3c';
  rr(ctx, px + pw - 1, py + 50, 4, 22, 2); ctx.fill();
  ctx.restore();

  // volume buttons (left side)
  ctx.save();
  ctx.fillStyle = '#2a2a2c';
  [[py + 42, 18], [py + 64, 18]].forEach(([by2, bh]) => {
    rr(ctx, px - 3, by2, 4, bh, 2); ctx.fill();
  });
  ctx.restore();

  // USB-C port at bottom
  ctx.save();
  ctx.fillStyle = '#111';
  rr(ctx, px + pw / 2 - 9, py + ph - 5, 18, 4, 2); ctx.fill();
  ctx.restore();

  // edge highlight (rim)
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
  rr(ctx, px, py, pw, ph, pr); ctx.stroke();
  ctx.restore();
}

/* ─── items ──────────────────────────────────────────────── */

const DRAW_FN: Record<string, (ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => void> = {
  pin:       drawPin,
  mug:       drawMug,
  cushion:   drawCushion,
  phonecase: drawPhoneCase,
};

const ITEMS = [
  { id: 'pin',       label: ko.studio.mockup.pin,       w: 152, h: 170 },
  { id: 'mug',       label: ko.studio.mockup.mug,       w: 190, h: 170 },
  { id: 'cushion',   label: ko.studio.mockup.cushion,   w: 152, h: 170 },
  { id: 'phonecase', label: ko.studio.mockup.phonecase, w: 120, h: 170 },
] as const;

/* ─── single canvas ──────────────────────────────────────── */

function MockupCanvas({ id, label, w, h, img }: {
  id: string; label: string; w: number; h: number; img: HTMLImageElement | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio ?? 1, 2) : 1;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w * dpr, h * dpr);
    ctx.save();
    ctx.scale(dpr, dpr);
    DRAW_FN[id]?.(ctx, img, w, h);
    ctx.restore();
  }, [id, img, w, h, dpr]);

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <canvas
        ref={ref}
        width={w * dpr}
        height={h * dpr}
        style={{ width: w, height: h }}
        className="rounded-xl"
      />
      <span className="text-[11px] text-muted-foreground font-medium tracking-wide">{label}</span>
    </div>
  );
}

/* ─── public ─────────────────────────────────────────────── */

export function MockupPreview({ imageUrl }: { imageUrl: string }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageUrl) return;
    const i = new window.Image();
    // data URLs don't need crossOrigin
    if (!imageUrl.startsWith('data:')) i.crossOrigin = 'anonymous';
    i.onload = () => setImg(i);
    i.src = imageUrl;
  }, [imageUrl]);

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {ko.studio.mockup.title}
        </p>
        <p className="text-[10px] text-muted-foreground">{ko.studio.mockup.note}</p>
      </div>

      {/* 가로 스크롤 — min-w-0 + overflow-x-auto */}
      <div
        className="overflow-x-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-5 pb-2" style={{ width: 'max-content' }}>
          {ITEMS.map((item) => (
            <MockupCanvas key={item.id} {...item} img={img} />
          ))}
        </div>
      </div>
    </div>
  );
}
