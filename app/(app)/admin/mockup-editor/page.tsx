'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Ellipse, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { Upload, Save, RotateCcw, Grid3X3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  SLOT_META, DEFAULT_SLOT_CONFIGS, SlotConfig, QuadCorners,
  saveSlotConfig, getAllSlotConfigs,
} from '@/lib/firebase/mockup-configs';

const SCALE = 2;
const HANDLE_R = 9; // corner handle hit radius (px)
const BLEND_MODES = [
  'multiply', 'source-over', 'overlay', 'screen',
  'soft-light', 'hard-light', 'color-burn', 'luminosity',
];

/* ── Canvas draw helpers (same as mockup-preview) ─── */

function drawAffine3(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  s0x: number, s0y: number, s1x: number, s1y: number, s2x: number, s2y: number,
  d0x: number, d0y: number, d1x: number, d1y: number, d2x: number, d2y: number,
) {
  const det = s0x*(s1y-s2y) + s1x*(s2y-s0y) + s2x*(s0y-s1y);
  if (Math.abs(det) < 0.001) return;
  const a=(d0x*(s1y-s2y)+d1x*(s2y-s0y)+d2x*(s0y-s1y))/det;
  const b=(d0y*(s1y-s2y)+d1y*(s2y-s0y)+d2y*(s0y-s1y))/det;
  const c=(s0x*(d1x-d2x)+s1x*(d2x-d0x)+s2x*(d0x-d1x))/det;
  const d=(s0x*(d1y-d2y)+s1x*(d2y-d0y)+s2x*(d0y-d1y))/det;
  const e=(s0x*(s1y*d2x-s2y*d1x)+s1x*(s2y*d0x-s0y*d2x)+s2x*(s0y*d1x-s1y*d0x))/det;
  const f=(s0x*(s1y*d2y-s2y*d1y)+s1x*(s2y*d0y-s0y*d2y)+s2x*(s0y*d1y-s1y*d0y))/det;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(d0x,d0y); ctx.lineTo(d1x,d1y); ctx.lineTo(d2x,d2y);
  ctx.closePath(); ctx.clip();
  ctx.transform(a,b,c,d,e,f); ctx.drawImage(img,0,0);
  ctx.restore();
}

function quadWarp(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  x0:number, y0:number, x1:number, y1:number,
  x2:number, y2:number, x3:number, y3:number, zoom=1,
) {
  const iw=img.naturalWidth, ih=img.naturalHeight;
  const dw=Math.max(x1-x0,x2-x3), dh=Math.max(y3-y0,y2-y1);
  const da=dw/dh, ia=iw/ih;
  let sx=0,sy=0,sw=iw,sh=ih;
  if(ia>da){sw=ih*da;sx=(iw-sw)/2;}else{sh=iw/da;sy=(ih-sh)/2;}
  if(zoom!==1){const zw=sw/zoom,zh=sh/zoom;sx+=(sw-zw)/2;sy+=(sh-zh)/2;sw=zw;sh=zh;}
  const ex=sx+sw,ey=sy+sh;
  drawAffine3(ctx,img,sx,sy,ex,sy,sx,ey, x0,y0,x1,y1,x3,y3);
  drawAffine3(ctx,img,ex,sy,ex,ey,sx,ey, x1,y1,x2,y2,x3,y3);
}

/* ── Helpers ─── */

type PixelCorners = [[number,number],[number,number],[number,number],[number,number]];

function quadToPixel(q: QuadCorners, W: number, H: number): PixelCorners {
  return [
    [q.tl[0]*W, q.tl[1]*H],
    [q.tr[0]*W, q.tr[1]*H],
    [q.br[0]*W, q.br[1]*H],
    [q.bl[0]*W, q.bl[1]*H],
  ];
}

function computeRectCorners(cfg: SlotConfig, W: number, H: number): PixelCorners {
  if (cfg.quad) return quadToPixel(cfg.quad, W, H);
  const cx=cfg.x*W, cy=cfg.y*H, hw=cfg.w*W/2, hh=cfg.h*H/2;
  const rad=(cfg.rotation*Math.PI)/180, cos=Math.cos(rad), sin=Math.sin(rad);
  return [
    [cx-hw*cos+hh*sin, cy-hw*sin-hh*cos],
    [cx+hw*cos+hh*sin, cy+hw*sin-hh*cos],
    [cx+hw*cos-hh*sin, cy+hw*sin+hh*cos],
    [cx-hw*cos-hh*sin, cy-hw*sin+hh*cos],
  ];
}

function pixelToQuad(c: PixelCorners, W: number, H: number): QuadCorners {
  return {
    tl: [c[0][0]/W, c[0][1]/H],
    tr: [c[1][0]/W, c[1][1]/H],
    br: [c[2][0]/W, c[2][1]/H],
    bl: [c[3][0]/W, c[3][1]/H],
  };
}

/* ── Config-driven slot renderer (mirrors mockup-preview logic) ─── */

function drawSlot(
  ctx: CanvasRenderingContext2D,
  userImg: HTMLImageElement,
  W: number, H: number,
  cfg: SlotConfig,
) {
  const cx=cfg.x*W, cy=cfg.y*H, sw=cfg.w*W, sh=cfg.h*H;
  const rad=(cfg.rotation*Math.PI)/180, cos=Math.cos(rad), sin=Math.sin(rad);
  ctx.save();
  ctx.globalCompositeOperation = cfg.blendMode as GlobalCompositeOperation;
  ctx.globalAlpha = cfg.opacity;
  const f: string[] = [];
  if (cfg.brightness!==1) f.push(`brightness(${cfg.brightness})`);
  if (cfg.saturation!==1) f.push(`saturate(${cfg.saturation})`);
  if (cfg.sepia!==0)      f.push(`sepia(${cfg.sepia})`);
  if (f.length) ctx.filter = f.join(' ');
  if (cfg.shape === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, sw/2, sh/2, rad, 0, Math.PI*2);
    ctx.clip();
    const iw=userImg.naturalWidth, ih=userImg.naturalHeight;
    const sc=Math.max(sw/iw, sh/ih)*cfg.zoom;
    ctx.translate(cx, cy); ctx.rotate(rad);
    ctx.drawImage(userImg, -(iw*sc)/2, -(ih*sc)/2, iw*sc, ih*sc);
  } else if (cfg.cylinderCurve) {
    const fov = cfg.cylinderFov ?? 0;
    const topArc = sh * (cfg.cylinderTopCurve ?? cfg.cylinderCurve);
    const botArc = sh * (cfg.cylinderBottomCurve ?? cfg.cylinderCurve);
    const x0 = cx - sw / 2, y0 = cy - sh / 2;
    if (rad !== 0) { ctx.translate(cx, cy); ctx.rotate(rad); ctx.translate(-cx, -cy); }
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, y0 + topArc, x0 + sw, y0);               // top: dips down (concave)
    ctx.lineTo(x0 + sw, y0 + sh - botArc);                              // right corner rises
    ctx.quadraticCurveTo(cx, y0 + sh + botArc, x0, y0 + sh - botArc); // bottom: clips corners → bulges down
    ctx.closePath(); ctx.clip();
    const iw=userImg.naturalWidth, ih=userImg.naturalHeight;
    const da=sw/sh, ia=iw/ih;
    let sx=0, sy=0, srcW=iw, srcH=ih;
    if(ia>da){srcW=ih*da;sx=(iw-srcW)/2;}else{srcH=iw/da;sy=(ih-srcH)/2;}
    if(cfg.zoom!==1){const zw=srcW/cfg.zoom,zh=srcH/cfg.zoom;sx+=(srcW-zw)/2;sy+=(srcH-zh)/2;srcW=zw;srcH=zh;}
    if (fov > 0) {
      const STRIPS=60, sinHalf=Math.sin(fov/2);
      for(let i=0;i<STRIPS;i++){
        const t0=i/STRIPS,t1=(i+1)/STRIPS;
        const dx0=x0+sw*(Math.sin((t0-0.5)*fov)+sinHalf)/(2*sinHalf);
        const dx1=x0+sw*(Math.sin((t1-0.5)*fov)+sinHalf)/(2*sinHalf);
        if(dx1<=dx0)continue;
        ctx.drawImage(userImg,sx+t0*srcW,sy,(t1-t0)*srcW,srcH,dx0,y0,dx1-dx0,sh);
      }
    } else {
      ctx.drawImage(userImg, sx, sy, srcW, srcH, x0, y0, sw, sh);
    }
  } else if (cfg.quad) {
    const {tl,tr,br,bl} = cfg.quad;
    quadWarp(ctx, userImg, tl[0]*W,tl[1]*H, tr[0]*W,tr[1]*H, br[0]*W,br[1]*H, bl[0]*W,bl[1]*H, cfg.zoom);
  } else {
    const tlx=cx-sw/2*cos+sh/2*sin, tly=cy-sw/2*sin-sh/2*cos;
    const trx=cx+sw/2*cos+sh/2*sin, trY=cy+sw/2*sin-sh/2*cos;
    const brx=cx+sw/2*cos-sh/2*sin, bry=cy+sw/2*sin+sh/2*cos;
    const blx=cx-sw/2*cos-sh/2*sin, bly=cy-sw/2*sin+sh/2*cos;
    quadWarp(ctx, userImg, tlx,tly, trx,trY, brx,bry, blx,bly, cfg.zoom);
  }
  ctx.restore();
}

const PREVIEW_ITEMS = [
  { id: 'tshirt',     slotIds: ['tshirt'],                              label: '티셔츠',       w: 200, h: 220, src: '/mockups/tshirt.jpg.png'     },
  { id: 'mug',        slotIds: ['mug'],                                 label: '머그컵',       w: 220, h: 205, src: '/mockups/mug.jpg.png'        },
  { id: 'cushion',    slotIds: ['cushion_left','cushion_right'],        label: '쿠션',         w: 200, h: 195, src: '/mockups/cushion.jpg.png'    },
  { id: 'totebag',    slotIds: ['totebag_black','totebag_white'],       label: '에코백',       w: 185, h: 215, src: '/mockups/totebag.jpg.png'    },
  { id: 'griptok',    slotIds: ['griptok'],                             label: '그립톡',       w: 175, h: 190, src: '/mockups/griptok.jpg.png'    },
  { id: 'minicanvas', slotIds: ['minicanvas_left','minicanvas_right'],  label: '미니캔버스',   w: 215, h: 188, src: '/mockups/minicanvas.jpg.png' },
] as const;

function PreviewCanvas({ label, w, h, slotIds, configs, sampleImg, productSrc }: {
  label: string; w: number; h: number; slotIds: readonly string[];
  configs: Record<string, SlotConfig>;
  sampleImg: HTMLImageElement | null;
  productSrc: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [prodImg, setProdImg] = useState<HTMLImageElement | null>(null);
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio ?? 1, 2) : 1;

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setProdImg(img);
    img.src = productSrc;
  }, [productSrc]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !prodImg) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w*dpr, h*dpr);
    ctx.save(); ctx.scale(dpr, dpr);
    ctx.drawImage(prodImg, 0, 0, w, h);
    if (sampleImg) {
      for (const id of slotIds) {
        const cfg = configs[id];
        if (cfg) drawSlot(ctx, sampleImg, w, h, cfg);
      }
    }
    ctx.restore();
  }, [prodImg, sampleImg, slotIds, configs, w, h, dpr]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <canvas
        ref={ref}
        width={w*dpr} height={h*dpr}
        style={{ width: '100%', height: 'auto', aspectRatio: `${w}/${h}` }}
        className="rounded-xl border border-border/30"
      />
      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

/* ── Slider ─── */

function SliderRow({ label, value, min, max, step, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-mono text-foreground">{fmt ? fmt(value) : value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 cursor-pointer accent-accent" />
    </div>
  );
}

/* ── Page ─── */

export default function MockupEditorPage() {
  const [mounted, setMounted] = useState(false);
  const [slotId, setSlotId] = useState(SLOT_META[0].id);
  const [cfg, setCfg] = useState<SlotConfig>(DEFAULT_SLOT_CONFIGS[SLOT_META[0].id]);
  const [productImg, setProductImg] = useState<HTMLImageElement | null>(null);
  const [sampleImg, setSampleImg] = useState<HTMLImageElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewConfigs, setPreviewConfigs] = useState<Record<string, SlotConfig>>(DEFAULT_SLOT_CONFIGS);

  // Rect canvas
  const rectCanvasRef = useRef<HTMLCanvasElement>(null);
  const [corners, setCorners] = useState<PixelCorners>([[0,0],[0,0],[0,0],[0,0]]);
  const dragging = useRef<number | null>(null);

  // Ellipse Konva
  const ellipseRef = useRef<Konva.Ellipse>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const slot = SLOT_META.find((m) => m.id === slotId)!;
  const W = slot.canvasW * SCALE;
  const H = slot.canvasH * SCALE;

  useEffect(() => setMounted(true), []);

  async function loadPreview() {
    const cfgs = await getAllSlotConfigs();
    setPreviewConfigs(cfgs);
  }

  // Load all configs on mount for preview gallery
  useEffect(() => { loadPreview(); }, []);

  // Load config from Firestore on slot change
  useEffect(() => {
    getAllSlotConfigs().then((configs) => {
      setCfg({ ...DEFAULT_SLOT_CONFIGS[slotId], ...configs[slotId] });
    });
  }, [slotId]);

  // Load product image
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setProductImg(img);
    img.src = slot.productSrc;
  }, [slot.productSrc]);

  // Sync cfg → corners (skip during drag)
  useEffect(() => {
    if (dragging.current !== null) return;
    if (cfg.shape === 'rect') setCorners(computeRectCorners(cfg, W, H));
  }, [cfg, W, H]);

  // Render rect canvas
  useEffect(() => {
    if (cfg.shape !== 'rect') return;
    const canvas = rectCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    if (productImg) ctx.drawImage(productImg, 0, 0, W, H);

    if (sampleImg) drawSlot(ctx, sampleImg, W, H, cfg);

    // Corner handles only when NOT in cylinder mode
    if (!cfg.cylinderCurve) {
      ctx.save();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(corners[0][0], corners[0][1]);
      ctx.lineTo(corners[1][0], corners[1][1]);
      ctx.lineTo(corners[2][0], corners[2][1]);
      ctx.lineTo(corners[3][0], corners[3][1]);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      const labels = ['TL', 'TR', 'BR', 'BL'];
      corners.forEach(([x, y], i) => {
        ctx.beginPath();
        ctx.arc(x, y, HANDLE_R, 0, Math.PI * 2);
        ctx.fillStyle = dragging.current === i ? '#6366f1' : 'white';
        ctx.fill();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(labels[i], x + 11, y - 4);
      });
    }
  }, [corners, productImg, sampleImg, cfg, W, H]);

  // Attach Konva transformer for ellipse
  useEffect(() => {
    if (!trRef.current || !ellipseRef.current) return;
    trRef.current.nodes([ellipseRef.current]);
    trRef.current.getLayer()?.batchDraw();
  }, [mounted, slotId, cfg.shape]);

  useEffect(() => {
    trRef.current?.getLayer()?.batchDraw();
  }, [cfg]);

  /* ── Rect canvas mouse events ─── */

  function canvasXY(e: React.MouseEvent<HTMLCanvasElement>): [number, number] {
    const r = rectCanvasRef.current!.getBoundingClientRect();
    return [
      (e.clientX - r.left) * (W / r.width),
      (e.clientY - r.top)  * (H / r.height),
    ];
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (cfg.cylinderCurve) return;
    const [mx, my] = canvasXY(e);
    for (let i = 0; i < 4; i++) {
      if (Math.hypot(mx - corners[i][0], my - corners[i][1]) < HANDLE_R + 4) {
        dragging.current = i;
        return;
      }
    }
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragging.current === null) return;
    const [mx, my] = canvasXY(e);
    const idx = dragging.current;
    const nc: PixelCorners = corners.map((c, i) =>
      i === idx ? [mx, my] : c,
    ) as PixelCorners;
    setCorners(nc);
    setCfg((prev) => ({ ...prev, quad: pixelToQuad(nc, W, H) }));
  }

  function onMouseUp() { dragging.current = null; }

  /* ── Ellipse Konva events ─── */

  function onEllipseTransformEnd() {
    if (!ellipseRef.current) return;
    const n = ellipseRef.current;
    const rx = n.radiusX() * n.scaleX(), ry = n.radiusY() * n.scaleY();
    n.radiusX(rx); n.radiusY(ry); n.scaleX(1); n.scaleY(1);
    setCfg((prev) => ({
      ...prev,
      x: n.x()/W, y: n.y()/H, w: rx*2/W, h: ry*2/H, rotation: n.rotation(),
    }));
  }

  function onEllipseDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    setCfg((prev) => ({ ...prev, x: e.target.x()/W, y: e.target.y()/H }));
  }

  /* ── Ellipse fill pattern ─── */

  const px = cfg.x*W, py = cfg.y*H, pw = cfg.w*W, ph = cfg.h*H;
  const eps = sampleImg
    ? Math.max(pw/sampleImg.naturalWidth, ph/sampleImg.naturalHeight) * cfg.zoom
    : 1;
  const ellipseFill = sampleImg ? {
    fillPatternImage: sampleImg,
    fillPatternX: -(sampleImg.naturalWidth * eps) / 2,
    fillPatternY: -(sampleImg.naturalHeight * eps) / 2,
    fillPatternScaleX: eps, fillPatternScaleY: eps,
    fillPatternRepeat: 'no-repeat' as const,
  } : { stroke: '#6366f1', strokeWidth: 1.5, dash: [6, 4], dashEnabled: true };

  /* ── Config helpers ─── */

  function set<K extends keyof SlotConfig>(k: K, v: SlotConfig[K]) {
    setCfg((prev) => ({ ...prev, [k]: v }));
  }

  // Position/size/rotation sliders clear quad (revert to regular rect)
  function setGeom<K extends 'x'|'y'|'w'|'h'|'rotation'>(k: K, v: number) {
    setCfg((prev) => { const n = { ...prev, [k]: v }; delete n.quad; return n; });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveSlotConfig(slotId, cfg);
      toast.success(`${slot.label} 저장 완료`);
      await loadPreview();
    } catch (e) {
      console.error(e);
      toast.error('저장에 실패했습니다.');
    } finally { setSaving(false); }
  }

  function handleReset() { setCfg(DEFAULT_SLOT_CONFIGS[slotId]); }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => setSampleImg(img);
    img.src = url;
  }

  const isCylinderMode = cfg.shape === 'rect' && !!cfg.cylinderCurve;
  const isQuadActive = cfg.shape === 'rect' && !!cfg.quad && !isCylinderMode;

  /* ── Render ─── */

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-6">

          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">굿즈 배치 설정</h1>
              {isQuadActive && (
                <span className="text-[10px] font-mono bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
                  쿼드 워프 활성
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={slotId} onValueChange={setSlotId}>
                <SelectTrigger className="w-52 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SLOT_META.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 pointer-events-none">
                  <Upload className="size-4" />샘플 이미지
                </Button>
              </label>
            </div>
          </div>

          <div className="flex gap-8 flex-col lg:flex-row items-start">

            {/* Canvas area */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div
                className="rounded-2xl overflow-hidden border border-border/40 bg-muted/20"
                style={{ width: W, height: H }}
              >
                {/* Rect mode: Canvas 2D with corner handles */}
                {cfg.shape === 'rect' && (
                  <canvas
                    ref={rectCanvasRef}
                    width={W} height={H}
                    style={{ display: 'block', width: W, height: H, cursor: 'crosshair' }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                  />
                )}

                {/* Ellipse mode: Konva Stage */}
                {cfg.shape === 'ellipse' && mounted && (
                  <Stage width={W} height={H}>
                    <Layer>
                      {productImg && <KonvaImage image={productImg} width={W} height={H} />}
                      <Ellipse
                        ref={ellipseRef}
                        key={`ellipse-${slotId}`}
                        x={px} y={py} radiusX={pw/2} radiusY={ph/2}
                        rotation={cfg.rotation}
                        opacity={cfg.opacity}
                        globalCompositeOperation={cfg.blendMode as GlobalCompositeOperation}
                        draggable
                        onDragEnd={onEllipseDragEnd}
                        onTransformEnd={onEllipseTransformEnd}
                        {...ellipseFill}
                      />
                      <Transformer
                        ref={trRef}
                        keepRatio={false}
                        rotateEnabled
                        borderStroke="#6366f1"
                        anchorStroke="#6366f1"
                        anchorFill="white"
                        anchorSize={8}
                        anchorCornerRadius={2}
                      />
                    </Layer>
                  </Stage>
                )}
              </div>

              {/* Hint */}
              <div className="text-[10px] text-muted-foreground text-center space-y-0.5">
                {cfg.shape === 'rect' ? (
                  isCylinderMode ? (
                    <>
                      <p>{slot.label} — {W}×{H}px</p>
                      <p className="text-accent/70">● 실린더 워프 활성 — 우측 슬라이더로 아크·FOV 조절</p>
                    </>
                  ) : (
                    <>
                      <p>{slot.label} — {W}×{H}px</p>
                      <p className="text-accent/70">● 각 꼭짓점을 드래그하면 해당 코너만 자유롭게 이동합니다</p>
                    </>
                  )
                ) : (
                  <p>{slot.label} — 드래그·핸들로 조절</p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 flex flex-col gap-4 lg:max-w-[280px] w-full">

              {/* Shape */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">모양</span>
                <div className="flex gap-2">
                  {(['rect', 'ellipse'] as const).map((s) => (
                    <button key={s} onClick={() => set('shape', s)}
                      className={cn(
                        'flex-1 rounded-xl border py-1.5 text-sm font-medium transition-all',
                        cfg.shape === s
                          ? 'border-accent bg-accent/10 text-accent ring-2 ring-accent ring-offset-2'
                          : 'border-border hover:border-accent/60 hover:bg-muted/60',
                      )}
                    >
                      {s === 'rect' ? '직사각형' : '타원형'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blend mode */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">블렌드 모드</span>
                <Select value={cfg.blendMode} onValueChange={(v) => set('blendMode', v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BLEND_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Position / size — sliders clear quad when changed */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">위치 / 크기</span>
                  {isQuadActive && (
                    <button
                      onClick={() => setGeom('x', cfg.x)}
                      className="text-[10px] text-accent hover:underline flex items-center gap-1"
                      title="쿼드 워프를 초기화하고 사각형 모드로 전환"
                    >
                      <Grid3X3 className="size-3" />사각형 리셋
                    </button>
                  )}
                </div>
                <SliderRow label="X (가로 중심)" value={cfg.x} min={0} max={1} step={0.001}
                  onChange={(v) => setGeom('x', v)} fmt={(v) => `${(v*100).toFixed(1)}%`} />
                <SliderRow label="Y (세로 중심)" value={cfg.y} min={0} max={1} step={0.001}
                  onChange={(v) => setGeom('y', v)} fmt={(v) => `${(v*100).toFixed(1)}%`} />
                <SliderRow label="너비" value={cfg.w} min={0.01} max={1} step={0.001}
                  onChange={(v) => setGeom('w', v)} fmt={(v) => `${(v*100).toFixed(1)}%`} />
                <SliderRow label="높이" value={cfg.h} min={0.01} max={1} step={0.001}
                  onChange={(v) => setGeom('h', v)} fmt={(v) => `${(v*100).toFixed(1)}%`} />
              </div>

              {/* Rotation (only shown when NOT in quad warp mode) */}
              {!isQuadActive && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">기울기 (틸트)</span>
                  <SliderRow label="회전" value={cfg.rotation} min={-180} max={180} step={0.1}
                    onChange={(v) => setGeom('rotation', v)} fmt={(v) => `${v.toFixed(1)}°`} />
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">불투명도 / 줌</span>
                <SliderRow label="투명도" value={cfg.opacity} min={0} max={1} step={0.01}
                  onChange={(v) => set('opacity', v)} fmt={(v) => `${(v*100).toFixed(0)}%`} />
                <SliderRow label="줌 (이미지 크롭)" value={cfg.zoom} min={1} max={3} step={0.01}
                  onChange={(v) => set('zoom', v)} fmt={(v) => `${v.toFixed(2)}×`} />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  색상 보정
                  <span className="ml-1 normal-case text-[10px] font-normal">(저장 후 반영)</span>
                </span>
                <SliderRow label="밝기" value={cfg.brightness} min={0} max={2} step={0.01}
                  onChange={(v) => set('brightness', v)} fmt={(v) => v.toFixed(2)} />
                <SliderRow label="채도" value={cfg.saturation} min={0} max={2} step={0.01}
                  onChange={(v) => set('saturation', v)} fmt={(v) => v.toFixed(2)} />
                <SliderRow label="세피아" value={cfg.sepia} min={0} max={1} step={0.01}
                  onChange={(v) => set('sepia', v)} fmt={(v) => v.toFixed(2)} />
              </div>

              {/* Cylinder warp — rect only */}
              {cfg.shape === 'rect' && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        실린더 워프
                      </span>
                      <div className="flex gap-1">
                        {isCylinderMode && (
                          <span className="text-[10px] font-mono bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
                            {(cfg.cylinderFov ?? 0) > 0 ? 'B — 스트립' : 'A — 아크'}
                          </span>
                        )}
                        <button
                          onClick={() => setCfg((p) => {
                            const n = { ...p };
                            if (n.cylinderCurve) {
                              delete n.cylinderCurve; delete n.cylinderFov;
                              delete n.cylinderTopCurve; delete n.cylinderBottomCurve;
                            } else {
                              n.cylinderCurve = 0.10;
                              n.cylinderTopCurve = 0.10;
                              n.cylinderBottomCurve = 0.10;
                              n.cylinderFov = 0;
                            }
                            return n;
                          })}
                          className="text-[10px] text-accent hover:underline"
                        >
                          {isCylinderMode ? '끄기' : '켜기'}
                        </button>
                      </div>
                    </div>
                    {isCylinderMode && (
                      <>
                        <SliderRow
                          label="상단 아크 깊이"
                          value={cfg.cylinderTopCurve ?? cfg.cylinderCurve ?? 0.10}
                          min={0} max={0.40} step={0.01}
                          onChange={(v) => set('cylinderTopCurve', v)}
                          fmt={(v) => `${(v * 100).toFixed(0)}%`}
                        />
                        <SliderRow
                          label="하단 아크 깊이"
                          value={cfg.cylinderBottomCurve ?? cfg.cylinderCurve ?? 0.10}
                          min={0} max={0.40} step={0.01}
                          onChange={(v) => set('cylinderBottomCurve', v)}
                          fmt={(v) => `${(v * 100).toFixed(0)}%`}
                        />
                        <SliderRow
                          label="스트립 워프 FOV (0 = A만)"
                          value={cfg.cylinderFov ?? 0}
                          min={0} max={1.5} step={0.05}
                          onChange={(v) => set('cylinderFov', v)}
                          fmt={(v) => v === 0 ? 'OFF (A)' : `${(v * 180 / Math.PI).toFixed(0)}°`}
                        />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          FOV 0 → 옵션A (아크 클립만) · FOV &gt; 0 → 옵션B (아크+스트립 압축)
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline" size="sm" className="rounded-xl gap-1.5 flex-1">
                  <RotateCcw className="size-3.5" />초기화
                </Button>
                <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-xl gap-1.5 flex-1">
                  <Save className="size-3.5" />{saving ? '저장 중...' : '저장'}
                </Button>
              </div>

              {/* Debug readout */}
              <div className="rounded-xl bg-muted/30 p-3 text-[10px] font-mono text-muted-foreground leading-relaxed">
                {isQuadActive ? (
                  <>
                    <div>TL ({(cfg.quad!.tl[0]*100).toFixed(1)}%, {(cfg.quad!.tl[1]*100).toFixed(1)}%)</div>
                    <div>TR ({(cfg.quad!.tr[0]*100).toFixed(1)}%, {(cfg.quad!.tr[1]*100).toFixed(1)}%)</div>
                    <div>BR ({(cfg.quad!.br[0]*100).toFixed(1)}%, {(cfg.quad!.br[1]*100).toFixed(1)}%)</div>
                    <div>BL ({(cfg.quad!.bl[0]*100).toFixed(1)}%, {(cfg.quad!.bl[1]*100).toFixed(1)}%)</div>
                  </>
                ) : (
                  `${slotId}: x=${cfg.x.toFixed(3)} y=${cfg.y.toFixed(3)} w=${cfg.w.toFixed(3)} h=${cfg.h.toFixed(3)} rot=${cfg.rotation.toFixed(1)}°`
                )}
              </div>
            </div>
          </div>

          {/* Preview gallery */}
          <Separator />
          <div className="flex flex-col gap-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">굿즈 전체 미리보기</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  저장된 설정 기준 · 샘플 이미지 업로드 시 합성 결과 확인 가능
                </p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={loadPreview}>
                <RotateCcw className="size-3.5" />새로고침
              </Button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {PREVIEW_ITEMS.map((item) => (
                <PreviewCanvas
                  key={item.id}
                  label={item.label}
                  w={item.w}
                  h={item.h}
                  slotIds={item.slotIds}
                  configs={previewConfigs}
                  sampleImg={sampleImg}
                  productSrc={item.src}
                />
              ))}
            </div>
          </div>
        </div>
  );
}
