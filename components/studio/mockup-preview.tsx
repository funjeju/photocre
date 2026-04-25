'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
   MUG  — draw order: body → image on surface → shading → rim/handle on top
═══════════════════════════════════════════════════════════ */
function drawMug(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const tx = 16, tw = W - 32;   // top edge left, width
  const bx = 28, bw = W - 56;   // bottom edge left, width
  const ty = 42;                  // top of body (under rim)
  const by = H - 22;             // bottom of body
  const tcx = tx + tw / 2;       // top center x

  // print zone on the cylinder surface
  const pL = tx + 26, pR = tx + tw - 26;
  const pT = ty + 10, pB = by - 6;
  const pw = pR - pL, ph = pB - pT;

  // 0. drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 24; ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath();
  ctx.moveTo(tx, ty); ctx.lineTo(tx + tw, ty);
  ctx.lineTo(bx + bw, by); ctx.lineTo(bx, by);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 1. body fill (ceramic, light left side)
  const bodyG = ctx.createLinearGradient(tx, ty, tx + tw, ty);
  bodyG.addColorStop(0,    '#eaeaea');
  bodyG.addColorStop(0.06, '#f5f5f5');
  bodyG.addColorStop(0.5,  '#fafafa');
  bodyG.addColorStop(0.94, '#f2f2f2');
  bodyG.addColorStop(1,    '#e5e5e5');
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.moveTo(tx, ty); ctx.lineTo(tx + tw, ty);
  ctx.lineTo(bx + bw, by); ctx.lineTo(bx, by);
  ctx.closePath();
  ctx.fill();

  // 2. user image mapped to print zone
  ctx.save();
  ctx.beginPath();
  ctx.rect(pL, pT, pw, ph);
  ctx.clip();
  cover(ctx, img, pL, pT, pw, ph);
  ctx.restore();

  // 3. cylinder shading on print zone (multiply)
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.beginPath(); ctx.rect(pL, pT, pw, ph); ctx.clip();
  // left-right curvature
  const cg = ctx.createLinearGradient(pL, 0, pL + pw, 0);
  cg.addColorStop(0,    'rgb(45,45,45)');
  cg.addColorStop(0.09, 'rgb(168,168,168)');
  cg.addColorStop(0.24, 'rgb(250,250,250)');
  cg.addColorStop(0.76, 'rgb(250,250,250)');
  cg.addColorStop(0.91, 'rgb(152,152,152)');
  cg.addColorStop(1,    'rgb(50,50,50)');
  ctx.fillStyle = cg; ctx.fillRect(pL, pT, pw, ph);
  // vertical highlight (top lighter)
  const vg = ctx.createLinearGradient(0, pT, 0, pT + ph);
  vg.addColorStop(0,    'rgb(238,238,238)');
  vg.addColorStop(0.18, 'rgb(255,255,255)');
  vg.addColorStop(0.6,  'rgb(255,255,255)');
  vg.addColorStop(1,    'rgb(218,218,218)');
  ctx.fillStyle = vg; ctx.fillRect(pL, pT, pw, ph);
  ctx.restore();

  // 4. top rim (drawn ON TOP of image area)
  const rimRX = tw / 2, rimRY = 12;
  ctx.fillStyle = '#e2e2e2';
  ctx.beginPath();
  ctx.ellipse(tcx, ty, rimRX, rimRY, 0, 0, Math.PI * 2);
  ctx.fill();
  // rim top surface
  const rimSurf = ctx.createRadialGradient(tcx - rimRX * 0.2, ty - 3, 2, tcx, ty, rimRX - 6);
  rimSurf.addColorStop(0, '#d5d5d5');
  rimSurf.addColorStop(1, '#c2c2c2');
  ctx.fillStyle = rimSurf;
  ctx.beginPath();
  ctx.ellipse(tcx, ty, rimRX - 7, rimRY - 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // coffee inside
  ctx.fillStyle = '#28110a';
  ctx.beginPath();
  ctx.ellipse(tcx, ty, rimRX - 14, rimRY - 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // rim highlight arc
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(tcx, ty - 1, rimRX - 3, rimRY - 1, 0, Math.PI * 0.95, Math.PI * 1.92);
  ctx.stroke();

  // 5. bottom base
  ctx.fillStyle = '#d2d2d2';
  ctx.beginPath();
  ctx.ellipse(bx + bw / 2, by, bw / 2 + 2, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(bx + bw / 2, by, bw / 2 + 2, 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 6. handle
  const hrx = tx + tw + 2;
  const hcy = (ty + by) / 2;
  const hRad = (by - ty) * 0.30;
  const hT = 10;
  // outer handle
  ctx.strokeStyle = '#dcdcdc'; ctx.lineWidth = hT + 2; ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.arc(hrx - hRad * 0.35, hcy, hRad, -Math.PI * 0.58, Math.PI * 0.58);
  ctx.stroke();
  // handle fill
  const hg = ctx.createLinearGradient(hrx, hcy - hRad, hrx + hRad, hcy);
  hg.addColorStop(0, '#f0f0f0'); hg.addColorStop(0.45, '#f9f9f9'); hg.addColorStop(1, '#d5d5d5');
  ctx.strokeStyle = hg; ctx.lineWidth = hT;
  ctx.beginPath();
  ctx.arc(hrx - hRad * 0.35, hcy, hRad, -Math.PI * 0.58, Math.PI * 0.58);
  ctx.stroke();
  // handle inner shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(hrx - hRad * 0.35, hcy, hRad - hT / 2 - 1, -Math.PI * 0.52, Math.PI * 0.52);
  ctx.stroke();

  // 7. body edge highlights
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(tx + 2, ty + 6); ctx.lineTo(bx + 2, by - 6); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(tx + tw - 2, ty + 6); ctx.lineTo(bx + bw - 2, by - 6); ctx.stroke();
}

/* ═══════════════════════════════════════════════════════════
   PIN  — draw order: ring → image in dome → dome shading → gloss
═══════════════════════════════════════════════════════════ */
function drawPin(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const cx = W / 2, cy = H / 2 - 10;
  const OR = Math.min(W, H) / 2 - 7;
  const IR = OR - 11;

  // 0. shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 7;
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath(); ctx.arc(cx, cy, OR, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // 1. chrome ring
  const rg = ctx.createLinearGradient(cx - OR, cy - OR, cx + OR, cy + OR);
  rg.addColorStop(0,    '#ffffff');
  rg.addColorStop(0.10, '#c8c8c8');
  rg.addColorStop(0.24, '#f5f5f5');
  rg.addColorStop(0.38, '#a5a5a5');
  rg.addColorStop(0.52, '#ebebeb');
  rg.addColorStop(0.66, '#b5b5b5');
  rg.addColorStop(0.82, '#f2f2f2');
  rg.addColorStop(1,    '#9e9e9e');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(cx, cy, OR, 0, Math.PI * 2); ctx.fill();

  // 2. user image in inner circle
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, IR, 0, Math.PI * 2); ctx.clip();
  cover(ctx, img, cx - IR, cy - IR, IR * 2, IR * 2);
  ctx.restore();

  // 3. dome shading (multiply)
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.beginPath(); ctx.arc(cx, cy, IR, 0, Math.PI * 2); ctx.clip();
  const dome = ctx.createRadialGradient(cx - IR * 0.12, cy - IR * 0.12, IR * 0.04, cx, cy, IR);
  dome.addColorStop(0,    'rgb(255,255,255)');
  dome.addColorStop(0.48, 'rgb(245,245,245)');
  dome.addColorStop(0.76, 'rgb(192,192,192)');
  dome.addColorStop(1,    'rgb(125,125,125)');
  ctx.fillStyle = dome;
  ctx.beginPath(); ctx.arc(cx, cy, IR, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // 4. ring inner edge
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, IR, 0, Math.PI * 2); ctx.stroke();

  // 5. gloss arc
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, IR * 0.76, Math.PI * 1.22, Math.PI * 1.82);
  ctx.strokeStyle = 'rgba(255,255,255,0.58)'; ctx.lineWidth = IR * 0.19;
  ctx.lineCap = 'round'; ctx.stroke();
  ctx.restore();

  // 6. clasp
  const clY = cy + OR + 7;
  const clg = ctx.createLinearGradient(cx - 13, clY, cx + 13, clY);
  clg.addColorStop(0, '#b5b5b5'); clg.addColorStop(0.5, '#efefef'); clg.addColorStop(1, '#adadad');
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
  ctx.fillStyle = clg;
  ctx.beginPath(); ctx.ellipse(cx, clY, 13, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#909090'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.ellipse(cx, clY, 13, 5.5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════
   CUSHION  — draw order: body → image → puffy shading → stitching
═══════════════════════════════════════════════════════════ */
function drawCushion(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const p = 10, r = 22;
  const x = p, y = p + 4, w = W - p * 2, h = H - p * 2 - 6;

  // 0. shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.24)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; ctx.shadowOffsetX = 1;
  ctx.fillStyle = '#f8f8f8';
  rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.restore();

  // 1. body fill
  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, '#f5f5f5'); bg.addColorStop(1, '#e8e8e8');
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, h, r); ctx.fill();

  // 2. user image (fill body area)
  const inset = 5;
  ctx.save();
  rr(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, r - 3); ctx.clip();
  cover(ctx, img, x + inset, y + inset, w - inset * 2, h - inset * 2);
  ctx.restore();

  // 3. puffy shading (multiply)
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  rr(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, r - 3); ctx.clip();
  const puff = ctx.createRadialGradient(
    x + w * 0.5, y + h * 0.43, Math.min(w, h) * 0.1,
    x + w * 0.5, y + h * 0.5,  Math.max(w, h) * 0.66,
  );
  puff.addColorStop(0,    'rgb(252,252,252)');
  puff.addColorStop(0.44, 'rgb(238,238,238)');
  puff.addColorStop(0.70, 'rgb(185,185,185)');
  puff.addColorStop(1,    'rgb(112,112,112)');
  ctx.fillStyle = puff; ctx.fillRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
  ctx.restore();

  // 4. stitching
  const si = 11;
  ctx.strokeStyle = 'rgba(255,255,255,0.68)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
  rr(ctx, x + si, y + si, w - si * 2, h - si * 2, r - si + 5); ctx.stroke();
  ctx.setLineDash([]);

  // 5. outer border + edge highlight
  ctx.strokeStyle = 'rgba(0,0,0,0.09)'; ctx.lineWidth = 1;
  rr(ctx, x, y, w, h, r); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.52)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h * 0.38);
  ctx.stroke();
}

/* ═══════════════════════════════════════════════════════════
   PHONE CASE  — draw order: body → image → material shading → camera/buttons
═══════════════════════════════════════════════════════════ */
function drawPhoneCase(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const pr = 18;
  const px = 5, py = 5, pw = W - 10, ph = H - 10;

  // camera island geometry
  const camW = 44, camH = 36;
  const camX = px + pw - camW - 7;
  const camY = py + 12;

  const iPad = 5;
  const ipx = px + iPad, ipy = py + iPad;
  const ipw = pw - iPad * 2, iph = ph - iPad * 2;

  // 0. shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.38)'; ctx.shadowBlur = 20; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 9;
  const sg = ctx.createLinearGradient(px, py, px + pw, py + ph);
  sg.addColorStop(0, '#2e2e30'); sg.addColorStop(1, '#181818');
  ctx.fillStyle = sg;
  rr(ctx, px, py, pw, ph, pr); ctx.fill();
  ctx.restore();

  // 1. case body
  const cg = ctx.createLinearGradient(px, py, px + pw, py + ph);
  cg.addColorStop(0,   '#2c2c2e');
  cg.addColorStop(0.5, '#1e1e20');
  cg.addColorStop(1,   '#131315');
  ctx.fillStyle = cg;
  rr(ctx, px, py, pw, ph, pr); ctx.fill();

  // 2. user image on case back
  ctx.save();
  rr(ctx, ipx, ipy, ipw, iph, pr - 3); ctx.clip();
  cover(ctx, img, ipx, ipy, ipw, iph);
  ctx.restore();

  // 3. material shading (multiply)
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  rr(ctx, ipx, ipy, ipw, iph, pr - 3); ctx.clip();
  const mg = ctx.createRadialGradient(px + pw * 0.30, py + ph * 0.24, 0, px + pw * 0.5, py + ph * 0.5, Math.max(pw, ph) * 0.72);
  mg.addColorStop(0,    'rgb(252,252,252)');
  mg.addColorStop(0.52, 'rgb(215,215,215)');
  mg.addColorStop(1,    'rgb(115,115,115)');
  ctx.fillStyle = mg; ctx.fillRect(ipx, ipy, ipw, iph);
  ctx.restore();

  // 4. camera bump
  ctx.save();
  ctx.fillStyle = '#0c0c0e';
  rr(ctx, camX, camY, camW, camH, 10); ctx.fill();
  ctx.strokeStyle = '#3a3a3c'; ctx.lineWidth = 0.8;
  rr(ctx, camX, camY, camW, camH, 10); ctx.stroke();

  const lenses: [number, number, number][] = [
    [camX + 13, camY + 12, 8.5],
    [camX + camW - 12, camY + camH - 12, 7],
  ];
  lenses.forEach(([lx, ly, lr]) => {
    ctx.strokeStyle = '#454545'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(lx, ly, lr + 1.8, 0, Math.PI * 2); ctx.stroke();
    const lg = ctx.createRadialGradient(lx - lr * 0.3, ly - lr * 0.3, 0, lx, ly, lr);
    lg.addColorStop(0, '#1c1c40'); lg.addColorStop(0.7, '#06060e'); lg.addColorStop(1, '#000008');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.beginPath(); ctx.arc(lx - lr * 0.32, ly - lr * 0.32, lr * 0.3, 0, Math.PI * 2); ctx.fill();
  });
  // flash
  const flX = camX + 9, flY = camY + camH - 10;
  ctx.fillStyle = '#ffcc44';
  ctx.beginPath(); ctx.arc(flX, flY, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ddaa22'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.arc(flX, flY, 3.5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // 5. power button (right)
  ctx.save();
  ctx.fillStyle = '#252528'; rr(ctx, px + pw - 2, py + 55, 5, 38, 2.5); ctx.fill();
  ctx.fillStyle = '#383838'; rr(ctx, px + pw - 2, py + 57, 5, 34, 2);   ctx.fill();
  ctx.restore();

  // 6. volume buttons (left)
  [[py + 38, 24], [py + 68, 24]].forEach(([by2, bh]) => {
    ctx.save();
    ctx.fillStyle = '#252528'; rr(ctx, px - 3, by2,     5, bh,     2.5); ctx.fill();
    ctx.fillStyle = '#383838'; rr(ctx, px - 3, by2 + 2, 5, bh - 4, 2);   ctx.fill();
    ctx.restore();
  });

  // 7. USB-C
  ctx.save();
  ctx.fillStyle = '#0a0a0c'; rr(ctx, px + pw / 2 - 11, py + ph - 5, 22, 5, 2.5); ctx.fill();
  ctx.restore();

  // 8. rim highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  rr(ctx, px, py, pw, ph, pr); ctx.stroke();
}

/* ─── config ─────────────────────────────────────────────── */

const DRAW_FN: Record<string, (ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => void> = {
  pin:       drawPin,
  mug:       drawMug,
  cushion:   drawCushion,
  phonecase: drawPhoneCase,
};

const ITEMS = [
  { id: 'pin',       label: ko.studio.mockup.pin,       w: 165, h: 195 },
  { id: 'mug',       label: ko.studio.mockup.mug,       w: 220, h: 200 },
  { id: 'cushion',   label: ko.studio.mockup.cushion,   w: 170, h: 190 },
  { id: 'phonecase', label: ko.studio.mockup.phonecase, w: 140, h: 215 },
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  useEffect(() => {
    if (!imageUrl) return;
    const i = new window.Image();
    if (!imageUrl.startsWith('data:')) i.crossOrigin = 'anonymous';
    i.onload = () => setImg(i);
    i.src = imageUrl;
  }, [imageUrl]);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  function scrollLeft()  { scrollRef.current?.scrollBy({ left: -210, behavior: 'smooth' }); }
  function scrollRight() { scrollRef.current?.scrollBy({ left:  210, behavior: 'smooth' }); }

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-border/40 w-full">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {ko.studio.mockup.title}
        </p>
        <p className="text-[10px] text-muted-foreground">{ko.studio.mockup.note}</p>
      </div>

      {/* scroll row */}
      <div className="relative">
        {/* left button */}
        {canLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center
                       w-7 h-7 rounded-full bg-background/90 border border-border shadow-sm
                       hover:bg-muted transition-colors"
            style={{ marginTop: -10 }}
          >
            <ChevronLeft className="size-4 text-muted-foreground" />
          </button>
        )}

        {/* scrollable area */}
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          style={{
            overflowX: 'scroll',
            overflowY: 'visible',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            paddingBottom: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 20, width: 'max-content' }}>
            {ITEMS.map((item) => (
              <MockupCanvas key={item.id} {...item} img={img} />
            ))}
          </div>
        </div>

        {/* right button */}
        {canRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center
                       w-7 h-7 rounded-full bg-background/90 border border-border shadow-sm
                       hover:bg-muted transition-colors"
            style={{ marginTop: -10 }}
          >
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
