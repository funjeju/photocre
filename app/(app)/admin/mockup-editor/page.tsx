'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Ellipse, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { Upload, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  SLOT_META, DEFAULT_SLOT_CONFIGS, SlotConfig,
  saveSlotConfig, getAllSlotConfigs,
} from '@/lib/firebase/mockup-configs';

const SCALE = 2;
const BLEND_MODES = [
  'multiply', 'source-over', 'overlay', 'screen',
  'soft-light', 'hard-light', 'color-burn', 'luminosity',
];

/* ── Slider helper ─────────────────────────────────────────── */

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
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 cursor-pointer accent-accent"
      />
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */

export default function MockupEditorPage() {
  const [mounted, setMounted] = useState(false);
  const [slotId, setSlotId] = useState(SLOT_META[0].id);
  const [cfg, setCfg] = useState<SlotConfig>(DEFAULT_SLOT_CONFIGS[SLOT_META[0].id]);
  const [productImg, setProductImg] = useState<HTMLImageElement | null>(null);
  const [sampleImg, setSampleImg] = useState<HTMLImageElement | null>(null);
  const [saving, setSaving] = useState(false);

  const rectRef = useRef<Konva.Rect>(null);
  const ellipseRef = useRef<Konva.Ellipse>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const slot = SLOT_META.find((m) => m.id === slotId)!;
  const stageW = slot.canvasW * SCALE;
  const stageH = slot.canvasH * SCALE;
  const px = cfg.x * stageW;
  const py = cfg.y * stageH;
  const pw = cfg.w * stageW;
  const ph = cfg.h * stageH;

  useEffect(() => setMounted(true), []);

  // Load config from Firestore on slot change
  useEffect(() => {
    getAllSlotConfigs().then((configs) => {
      setCfg({ ...DEFAULT_SLOT_CONFIGS[slotId], ...configs[slotId] });
    });
  }, [slotId]);

  // Load product image when slot changes
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setProductImg(img);
    img.src = slot.productSrc;
  }, [slot.productSrc]);

  // Attach transformer to current shape
  useEffect(() => {
    if (!trRef.current) return;
    const node = cfg.shape === 'rect' ? rectRef.current : ellipseRef.current;
    if (!node) return;
    trRef.current.nodes([node]);
    trRef.current.getLayer()?.batchDraw();
  }, [mounted, cfg.shape, slotId]);

  // Refresh transformer bounding box when cfg changes from sliders
  useEffect(() => {
    trRef.current?.getLayer()?.batchDraw();
  }, [cfg]);

  /* ── Fill pattern ─── */
  const patScale = sampleImg
    ? Math.max(pw / sampleImg.naturalWidth, ph / sampleImg.naturalHeight) * cfg.zoom
    : 1;

  function rectFill() {
    if (!sampleImg) return { stroke: '#6366f1', strokeWidth: 1.5, dash: [6, 4], dashEnabled: true, fill: undefined };
    return {
      fillPatternImage: sampleImg,
      fillPatternX: (pw - sampleImg.naturalWidth * patScale) / 2,
      fillPatternY: (ph - sampleImg.naturalHeight * patScale) / 2,
      fillPatternScaleX: patScale,
      fillPatternScaleY: patScale,
      fillPatternRepeat: 'no-repeat' as const,
    };
  }

  function ellipseFill() {
    if (!sampleImg) return { stroke: '#6366f1', strokeWidth: 1.5, dash: [6, 4], dashEnabled: true, fill: undefined };
    return {
      fillPatternImage: sampleImg,
      fillPatternX: -(sampleImg.naturalWidth * patScale) / 2,
      fillPatternY: -(sampleImg.naturalHeight * patScale) / 2,
      fillPatternScaleX: patScale,
      fillPatternScaleY: patScale,
      fillPatternRepeat: 'no-repeat' as const,
    };
  }

  /* ── Transform end (normalize scale → cfg) ─── */
  function handleTransformEnd() {
    if (cfg.shape === 'rect' && rectRef.current) {
      const n = rectRef.current;
      const newW = n.width() * n.scaleX();
      const newH = n.height() * n.scaleY();
      n.width(newW); n.height(newH);
      n.offsetX(newW / 2); n.offsetY(newH / 2);
      n.scaleX(1); n.scaleY(1);
      setCfg((prev) => ({
        ...prev,
        x: n.x() / stageW, y: n.y() / stageH,
        w: newW / stageW, h: newH / stageH,
        rotation: n.rotation(),
      }));
    } else if (cfg.shape === 'ellipse' && ellipseRef.current) {
      const n = ellipseRef.current;
      const newRx = n.radiusX() * n.scaleX();
      const newRy = n.radiusY() * n.scaleY();
      n.radiusX(newRx); n.radiusY(newRy);
      n.scaleX(1); n.scaleY(1);
      setCfg((prev) => ({
        ...prev,
        x: n.x() / stageW, y: n.y() / stageH,
        w: (newRx * 2) / stageW, h: (newRy * 2) / stageH,
        rotation: n.rotation(),
      }));
    }
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    setCfg((prev) => ({
      ...prev,
      x: e.target.x() / stageW,
      y: e.target.y() / stageH,
    }));
  }

  function set<K extends keyof SlotConfig>(key: K, value: SlotConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveSlotConfig(slotId, cfg);
      toast.success(`${slot.label} 저장 완료`);
    } catch (e) {
      console.error(e);
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setCfg(DEFAULT_SLOT_CONFIGS[slotId]);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => setSampleImg(img);
    img.src = url;
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-6">

          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-lg font-semibold">굿즈 배치 설정</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={slotId} onValueChange={setSlotId}>
                <SelectTrigger className="w-52 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_META.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 pointer-events-none">
                  <Upload className="size-4" />샘플 이미지 업로드
                </Button>
              </label>
            </div>
          </div>

          <div className="flex gap-8 flex-col lg:flex-row items-start">

            {/* Canvas */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div
                className="rounded-2xl overflow-hidden border border-border/40 bg-muted/20"
                style={{ width: stageW, height: stageH }}
              >
                {mounted && (
                  <Stage width={stageW} height={stageH}>
                    <Layer>
                      {productImg && (
                        <KonvaImage image={productImg} width={stageW} height={stageH} />
                      )}

                      {cfg.shape === 'rect' && (
                        <Rect
                          ref={rectRef}
                          key={`rect-${slotId}`}
                          x={px} y={py}
                          width={pw} height={ph}
                          offsetX={pw / 2} offsetY={ph / 2}
                          rotation={cfg.rotation}
                          opacity={cfg.opacity}
                          globalCompositeOperation={cfg.blendMode as GlobalCompositeOperation}
                          draggable
                          onDragEnd={handleDragEnd}
                          onTransformEnd={handleTransformEnd}
                          {...rectFill()}
                        />
                      )}

                      {cfg.shape === 'ellipse' && (
                        <Ellipse
                          ref={ellipseRef}
                          key={`ellipse-${slotId}`}
                          x={px} y={py}
                          radiusX={pw / 2} radiusY={ph / 2}
                          rotation={cfg.rotation}
                          opacity={cfg.opacity}
                          globalCompositeOperation={cfg.blendMode as GlobalCompositeOperation}
                          draggable
                          onDragEnd={handleDragEnd}
                          onTransformEnd={handleTransformEnd}
                          {...ellipseFill()}
                        />
                      )}

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
              <p className="text-[10px] text-muted-foreground">
                {slot.label} — {stageW}×{stageH}px (SCALE×{SCALE})
              </p>
            </div>

            {/* Controls */}
            <div className="flex-1 flex flex-col gap-4 lg:max-w-[280px] w-full">

              {/* Shape */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">모양</span>
                <div className="flex gap-2">
                  {(['rect', 'ellipse'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => set('shape', s)}
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
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLEND_MODES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Position */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">위치</span>
                <SliderRow label="X (가로 중심)" value={cfg.x} min={0} max={1} step={0.001}
                  onChange={(v) => set('x', v)} fmt={(v) => `${(v * 100).toFixed(1)}%`} />
                <SliderRow label="Y (세로 중심)" value={cfg.y} min={0} max={1} step={0.001}
                  onChange={(v) => set('y', v)} fmt={(v) => `${(v * 100).toFixed(1)}%`} />
              </div>

              {/* Size */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">크기</span>
                <SliderRow label="너비" value={cfg.w} min={0.01} max={1} step={0.001}
                  onChange={(v) => set('w', v)} fmt={(v) => `${(v * 100).toFixed(1)}%`} />
                <SliderRow label="높이" value={cfg.h} min={0.01} max={1} step={0.001}
                  onChange={(v) => set('h', v)} fmt={(v) => `${(v * 100).toFixed(1)}%`} />
              </div>

              {/* Tilt */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">기울기 (틸트)</span>
                <SliderRow label="회전 각도" value={cfg.rotation} min={-180} max={180} step={0.1}
                  onChange={(v) => set('rotation', v)} fmt={(v) => `${v.toFixed(1)}°`} />
              </div>

              <Separator />

              {/* Opacity / Zoom */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">불투명도 / 줌</span>
                <SliderRow label="투명도" value={cfg.opacity} min={0} max={1} step={0.01}
                  onChange={(v) => set('opacity', v)} fmt={(v) => `${(v * 100).toFixed(0)}%`} />
                <SliderRow label="줌 (이미지 크롭)" value={cfg.zoom} min={1} max={3} step={0.01}
                  onChange={(v) => set('zoom', v)} fmt={(v) => `${v.toFixed(2)}×`} />
              </div>

              {/* Color filters */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  색상 보정
                  <span className="ml-1 normal-case text-[10px] font-normal">(저장 후 굿즈 미리보기 반영)</span>
                </span>
                <SliderRow label="밝기" value={cfg.brightness} min={0} max={2} step={0.01}
                  onChange={(v) => set('brightness', v)} fmt={(v) => v.toFixed(2)} />
                <SliderRow label="채도" value={cfg.saturation} min={0} max={2} step={0.01}
                  onChange={(v) => set('saturation', v)} fmt={(v) => v.toFixed(2)} />
                <SliderRow label="세피아" value={cfg.sepia} min={0} max={1} step={0.01}
                  onChange={(v) => set('sepia', v)} fmt={(v) => v.toFixed(2)} />
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline" size="sm" className="rounded-xl gap-1.5 flex-1">
                  <RotateCcw className="size-3.5" />초기화
                </Button>
                <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-xl gap-1.5 flex-1">
                  <Save className="size-3.5" />{saving ? '저장 중...' : '저장'}
                </Button>
              </div>

              {/* Debug: current normalized values */}
              <div className="rounded-xl bg-muted/30 p-3 text-[10px] font-mono text-muted-foreground leading-relaxed">
                {slotId}: x={cfg.x.toFixed(3)} y={cfg.y.toFixed(3)} w={cfg.w.toFixed(3)} h={cfg.h.toFixed(3)} rot={cfg.rotation.toFixed(1)}°
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
