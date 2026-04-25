'use client';

import { useEffect, useRef, useState } from 'react';
import { ko } from '@/lib/i18n/ko';

/* ─── canvas helpers ──────────────────────────────────────── */

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, dx: number, dy: number, dw: number, dh: number) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const da = dw / dh, ia = iw / ih;
  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (ia > da) { sw = ih * da; sx = (iw - sw) / 2; }
  else         { sh = iw / da; sy = (ih - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/* ─── pin button ─────────────────────────────────────────── */
function drawPin(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const cx = cw / 2, cy = ch / 2 - 8;
  const OR = Math.min(cw, ch) / 2 - 6;
  const IR = OR - 8;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
  const g = ctx.createLinearGradient(cx - OR, cy - OR, cx + OR, cy + OR);
  g.addColorStop(0,   '#e2e2e2');
  g.addColorStop(0.3, '#ffffff');
  g.addColorStop(0.7, '#c4c4c4');
  g.addColorStop(1,   '#a0a0a0');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, OR, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, IR, 0, Math.PI * 2); ctx.clip();
  cover(ctx, img, cx - IR, cy - IR, IR * 2, IR * 2);
  ctx.restore();

  const shine = ctx.createRadialGradient(cx - IR * 0.25, cy - IR * 0.3, 0, cx, cy, IR);
  shine.addColorStop(0,    'rgba(255,255,255,0.38)');
  shine.addColorStop(0.55, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, IR, 0, Math.PI * 2);
  ctx.fillStyle = shine; ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#b8b8b8'; ctx.strokeStyle = '#909090'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(cx, cy + OR + 5, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

/* ─── mug ────────────────────────────────────────────────── */
function drawMug(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const topW = 108, botW = 90, mugH = 86;
  const mx = cw / 2 - 10;
  const top = (ch - mugH) / 2 - 2, bot = top + mugH;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#f7f7f7';
  ctx.beginPath();
  ctx.moveTo(mx - topW / 2, top); ctx.lineTo(mx + topW / 2, top);
  ctx.lineTo(mx + botW / 2, bot); ctx.lineTo(mx - botW / 2, bot);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  const pp = 10;
  const px = mx - topW / 2 + pp, py = top + 11, pw = topW - pp * 2, ph = mugH - 22;
  ctx.save();
  ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
  cover(ctx, img, px, py, pw, ph);
  const lG = ctx.createLinearGradient(px, 0, px + pw * 0.22, 0);
  lG.addColorStop(0, 'rgba(255,255,255,0.52)'); lG.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lG; ctx.fillRect(px, py, pw * 0.22, ph);
  const rG = ctx.createLinearGradient(px + pw * 0.78, 0, px + pw, 0);
  rG.addColorStop(0, 'rgba(0,0,0,0)'); rG.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = rG; ctx.fillRect(px + pw * 0.78, py, pw * 0.22, ph);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx - topW / 2, top); ctx.lineTo(mx + topW / 2, top);
  ctx.lineTo(mx + botW / 2, bot); ctx.lineTo(mx - botW / 2, bot);
  ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#e4e4e4'; ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(mx, top, topW / 2, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d8d8d8';
  ctx.beginPath(); ctx.ellipse(mx, bot, botW / 2, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#d4d4d4'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(mx + botW / 2 + 18, top + mugH * 0.5, mugH * 0.26, -Math.PI * 0.72, Math.PI * 0.72);
  ctx.stroke();
  ctx.restore();
}

/* ─── cushion ────────────────────────────────────────────── */
function drawCushion(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const p = 10, r = 24;
  const x = p, y = p + 6, w = cw - p * 2, h = ch - p * 2 - 8;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 7;
  ctx.fillStyle = '#fff'; rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.restore();

  ctx.save();
  rr(ctx, x, y, w, h, r); ctx.clip();
  cover(ctx, img, x, y, w, h);
  const eg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.28, x + w / 2, y + h / 2, Math.max(w, h) * 0.72);
  eg.addColorStop(0, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = eg; ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  rr(ctx, x + 8, y + 8, w - 16, h - 16, r - 6); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
  rr(ctx, x, y, w, h, r); ctx.stroke();
  ctx.restore();
}

/* ─── phone case ─────────────────────────────────────────── */
function drawPhoneCase(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const pw = 70, ph = 128, pr = 14;
  const px = (cw - pw) / 2, py = (ch - ph) / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#1c1c1e'; rr(ctx, px, py, pw, ph, pr); ctx.fill();
  ctx.restore();

  const inset = 4;
  ctx.save();
  rr(ctx, px + inset, py + inset, pw - inset * 2, ph - inset * 2, pr - 2); ctx.clip();
  cover(ctx, img, px + inset, py + inset, pw - inset * 2, ph - inset * 2);
  ctx.restore();

  // Camera bump
  const cx = px + pw - 28, cy2 = py + 11;
  ctx.save();
  ctx.fillStyle = '#2c2c2e'; ctx.strokeStyle = '#3a3a3c'; ctx.lineWidth = 1;
  rr(ctx, cx, cy2, 20, 17, 5); ctx.fill(); ctx.stroke();
  ([[cx + 5, cy2 + 5, 4], [cx + 14, cy2 + 9, 3]] as [number, number, number][]).forEach(([lx, ly, lr]) => {
    ctx.fillStyle = '#08081a';
    ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.arc(lx - 1, ly - 1, lr * 0.45, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#2c2c2e'; rr(ctx, px + pw - 1, py + 44, 4, 24, 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  rr(ctx, px, py, pw, ph, pr); ctx.stroke();
  ctx.restore();
}

/* ─── draw map ────────────────────────────────────────────── */
const DRAW_FN: Record<string, (ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => void> = {
  pin:       drawPin,
  mug:       drawMug,
  cushion:   drawCushion,
  phonecase: drawPhoneCase,
};

const ITEMS = [
  { id: 'pin',       label: ko.studio.mockup.pin,       w: 150, h: 165 },
  { id: 'mug',       label: ko.studio.mockup.mug,       w: 180, h: 165 },
  { id: 'cushion',   label: ko.studio.mockup.cushion,   w: 150, h: 165 },
  { id: 'phonecase', label: ko.studio.mockup.phonecase, w: 120, h: 165 },
] as const;

/* ─── single mockup canvas ────────────────────────────────── */
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
      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

/* ─── public ─────────────────────────────────────────────── */
export function MockupPreview({ imageUrl }: { imageUrl: string }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageUrl) return;
    const i = new window.Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => setImg(i);
    i.src = imageUrl;
  }, [imageUrl]);

  return (
    <div className="w-full flex flex-col gap-3 pt-2 border-t border-border/50 mt-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {ko.studio.mockup.title}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight text-right max-w-[160px]">
          {ko.studio.mockup.note}
        </p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {ITEMS.map((item) => (
          <MockupCanvas key={item.id} {...item} img={img} />
        ))}
      </div>
    </div>
  );
}
