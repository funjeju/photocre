'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import { Plus, Trash2, Download, ArrowLeft, AlignLeft, AlignCenter, AlignRight, RotateCcw, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ALL_FONTS, loadGoogleFont, getFont } from '@/lib/presets/fonts';
import { cn } from '@/lib/utils';

const CANVAS_W = 400;
const CANVAS_H = 533; // 3:4

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  bold: boolean;
  align: 'left' | 'center' | 'right';
  vertical: boolean;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  strokeEnabled: boolean;
  stroke: string;
  strokeWidth: number;
}

function makeLayer(uid: string): TextLayer {
  return {
    id: uid,
    text: '텍스트',
    x: CANVAS_W / 2 - 60,
    y: CANVAS_H / 2 - 20,
    fontSize: 48,
    fontFamily: 'Black Han Sans',
    fill: '#FFFFFF',
    bold: false,
    align: 'left',
    vertical: false,
    shadowEnabled: true,
    shadowColor: '#000000',
    shadowBlur: 8,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    strokeEnabled: false,
    stroke: '#000000',
    strokeWidth: 2,
  };
}

function ColorSwatch({
  value,
  onChange,
  presets,
}: {
  value: string;
  onChange: (c: string) => void;
  presets: string[];
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {presets.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            'size-6 rounded-full border-2 transition-all shrink-0',
            value === c ? 'border-accent scale-110' : 'border-border/60',
          )}
          style={{ backgroundColor: c }}
        />
      ))}
      <label className="size-6 rounded-full border-2 border-dashed border-border cursor-pointer overflow-hidden shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="opacity-0 w-full h-full cursor-pointer"
        />
      </label>
    </div>
  );
}

const TEXT_COLOR_PRESETS = ['#FFFFFF', '#000000', '#FFD700', '#FF3366', '#00CFFF', '#A8FF78'];
const SHADOW_COLOR_PRESETS = ['#000000', '#1a1a2e', '#4a1942', '#002b5b'];
const STROKE_COLOR_PRESETS = ['#000000', '#FFFFFF', '#FFD700', '#FF3366', '#1a1a2e'];

export function CoverTextEditor({
  resultUrl,
  templateName,
  onBack,
}: {
  resultUrl: string;
  templateName: string;
  onBack: () => void;
}) {
  const uid = useId();
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  // Load background image
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setBgImage(img);
    img.src = resultUrl;
  }, [resultUrl]);

  // Preload default font
  useEffect(() => {
    loadGoogleFont(getFont('Black Han Sans')).then(() => setFontsReady(true));
  }, []);

  // Sync transformer to selected node
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (!selectedId) {
      transformerRef.current.nodes([]);
      return;
    }
    const node = stageRef.current.findOne(`#${CSS.escape(selectedId)}`);
    if (node) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, layers]);

  const selected = layers.find((l) => l.id === selectedId) ?? null;

  function addLayer() {
    const id = `${uid}-${Date.now()}`;
    const layer = makeLayer(id);
    setLayers((prev) => [...prev, layer]);
    setSelectedId(id);
    loadGoogleFont(getFont(layer.fontFamily));
  }

  function updateLayer(id: string, patch: Partial<TextLayer>) {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function deleteLayer(id: string) {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const handleFontChange = useCallback(
    async (id: string, family: string) => {
      updateLayer(id, { fontFamily: family });
      await loadGoogleFont(getFont(family));
      updateLayer(id, { fontFamily: family }); // re-render trigger
    },
    [],
  );

  function handleTextDragEnd(id: string, e: { target: { x: () => number; y: () => number } }) {
    updateLayer(id, { x: e.target.x(), y: e.target.y() });
  }

  function handleTransformEnd(id: string, e: { target: Konva.Node }) {
    const node = e.target;
    updateLayer(id, {
      x: node.x(),
      y: node.y(),
      fontSize: Math.round((layers.find((l) => l.id === id)?.fontSize ?? 48) * node.scaleX()),
    });
    node.scaleX(1);
    node.scaleY(1);
  }

  async function handleExport() {
    if (!stageRef.current) return;
    setIsExporting(true);
    try {
      setSelectedId(null);
      await new Promise((r) => requestAnimationFrame(r));
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `cover-${templateName}-final.png`;
      a.click();
      toast.success('다운로드 완료!');
    } catch {
      toast.error('내보내기 실패');
    } finally {
      setIsExporting(false);
    }
  }

  const fontWeight = selected?.bold ? '700' : '400';
  const konvaFontStyle = selected?.bold ? 'bold' : 'normal';

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── 좌측 패널 ── */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <button onClick={onBack} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="size-4" />
          </button>
          <p className="text-sm font-semibold">{templateName} · 텍스트 편집</p>
        </div>

        {/* 레이어 목록 */}
        <div className="border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">텍스트 레이어</p>
            <button
              onClick={addLayer}
              className="flex items-center gap-1 text-xs text-accent font-medium hover:text-accent/80 transition-colors"
            >
              <Plus className="size-3.5" />
              추가
            </button>
          </div>
          {layers.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">+ 추가를 눌러 텍스트를 얹으세요</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
              {layers.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedId(l.id === selectedId ? null : l.id)}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors',
                    l.id === selectedId ? 'bg-accent/10 text-accent border border-accent/30' : 'hover:bg-muted border border-transparent',
                  )}
                >
                  <span className="flex-1 truncate font-medium">{l.text || '(빈 텍스트)'}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteLayer(l.id); }}
                    className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택 레이어 속성 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {!selected ? (
            <p className="text-[11px] text-muted-foreground">레이어를 선택하면 스타일을 편집할 수 있습니다.</p>
          ) : (
            <>
              {/* 텍스트 내용 */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">텍스트 내용</Label>
                <textarea
                  value={selected.text}
                  onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* 폰트 */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">폰트</Label>
                <select
                  value={selected.fontFamily}
                  onChange={(e) => handleFontChange(selected.id, e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <optgroup label="한글">
                    {ALL_FONTS.filter((f) => f.lang === 'ko').map((f) => (
                      <option key={f.family} value={f.family}>{f.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="영문 (Bold)">
                    {ALL_FONTS.filter((f) => f.lang === 'en').map((f) => (
                      <option key={f.family} value={f.family}>{f.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 크기 + 볼드 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">크기</Label>
                  <span className="text-xs text-muted-foreground">{selected.fontSize}px</span>
                </div>
                <Slider
                  min={10}
                  max={200}
                  step={1}
                  value={[selected.fontSize]}
                  onValueChange={([v]) => updateLayer(selected.id, { fontSize: v })}
                  className="w-full"
                />
                <div className="flex gap-1.5 mt-0.5">
                  <button
                    onClick={() => updateLayer(selected.id, { bold: !selected.bold })}
                    className={cn(
                      'flex-1 py-1 rounded-lg text-xs font-bold border transition-colors',
                      selected.bold ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-foreground/30',
                    )}
                  >
                    Bold
                  </button>
                  {/* 정렬 */}
                  {([['left', <AlignLeft key="l" className="size-3" />], ['center', <AlignCenter key="c" className="size-3" />], ['right', <AlignRight key="r" className="size-3" />]] as const).map(([align, icon]) => (
                    <button
                      key={align}
                      onClick={() => updateLayer(selected.id, { align })}
                      className={cn(
                        'flex-1 py-1 rounded-lg border transition-colors flex items-center justify-center',
                        selected.align === align ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-foreground/30',
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* 방향 */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">쓰기 방향</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => updateLayer(selected.id, { vertical: false })}
                    className={cn(
                      'py-1.5 rounded-xl text-xs border transition-colors',
                      !selected.vertical ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground',
                    )}
                  >
                    가로쓰기 —
                  </button>
                  <button
                    onClick={() => updateLayer(selected.id, { vertical: true })}
                    className={cn(
                      'py-1.5 rounded-xl text-xs border transition-colors',
                      selected.vertical ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground',
                    )}
                  >
                    세로쓰기 ｜
                  </button>
                </div>
              </div>

              {/* 텍스트 색상 */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">텍스트 색상</Label>
                <ColorSwatch value={selected.fill} onChange={(c) => updateLayer(selected.id, { fill: c })} presets={TEXT_COLOR_PRESETS} />
              </div>

              {/* 그림자 */}
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">그림자</Label>
                  <button
                    onClick={() => updateLayer(selected.id, { shadowEnabled: !selected.shadowEnabled })}
                    className={cn(
                      'relative inline-flex h-4 w-8 items-center rounded-full transition-colors shrink-0',
                      selected.shadowEnabled ? 'bg-accent' : 'bg-muted border border-border',
                    )}
                  >
                    <span className={cn('inline-block size-3 rounded-full bg-white shadow transition-transform', selected.shadowEnabled ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                </div>
                {selected.shadowEnabled && (
                  <div className="flex flex-col gap-2">
                    <ColorSwatch value={selected.shadowColor} onChange={(c) => updateLayer(selected.id, { shadowColor: c })} presets={SHADOW_COLOR_PRESETS} />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-8 shrink-0">번짐</span>
                      <Slider min={0} max={30} step={1} value={[selected.shadowBlur]} onValueChange={([v]) => updateLayer(selected.id, { shadowBlur: v })} className="flex-1" />
                      <span className="text-[10px] text-muted-foreground w-4 text-right">{selected.shadowBlur}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-8 shrink-0">X</span>
                      <Slider min={-20} max={20} step={1} value={[selected.shadowOffsetX]} onValueChange={([v]) => updateLayer(selected.id, { shadowOffsetX: v })} className="flex-1" />
                      <span className="text-[10px] text-muted-foreground w-4 text-right">{selected.shadowOffsetX}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-8 shrink-0">Y</span>
                      <Slider min={-20} max={20} step={1} value={[selected.shadowOffsetY]} onValueChange={([v]) => updateLayer(selected.id, { shadowOffsetY: v })} className="flex-1" />
                      <span className="text-[10px] text-muted-foreground w-4 text-right">{selected.shadowOffsetY}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 테두리 (Stroke) */}
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">테두리</Label>
                  <button
                    onClick={() => updateLayer(selected.id, { strokeEnabled: !selected.strokeEnabled })}
                    className={cn(
                      'relative inline-flex h-4 w-8 items-center rounded-full transition-colors shrink-0',
                      selected.strokeEnabled ? 'bg-accent' : 'bg-muted border border-border',
                    )}
                  >
                    <span className={cn('inline-block size-3 rounded-full bg-white shadow transition-transform', selected.strokeEnabled ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                </div>
                {selected.strokeEnabled && (
                  <div className="flex flex-col gap-2">
                    <ColorSwatch value={selected.stroke} onChange={(c) => updateLayer(selected.id, { stroke: c })} presets={STROKE_COLOR_PRESETS} />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-8 shrink-0">굵기</span>
                      <Slider min={1} max={12} step={0.5} value={[selected.strokeWidth]} onValueChange={([v]) => updateLayer(selected.id, { strokeWidth: v })} className="flex-1" />
                      <span className="text-[10px] text-muted-foreground w-4 text-right">{selected.strokeWidth}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 삭제 */}
              <button
                onClick={() => deleteLayer(selected.id)}
                className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors mt-1"
              >
                <Trash2 className="size-3.5" />
                이 레이어 삭제
              </button>
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-border shrink-0 flex flex-col gap-2">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full rounded-2xl border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors h-9 text-xs font-medium"
          >
            <RefreshCw className="size-3.5" />
            새로 만들기
          </button>
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            결과물이 마음에 안 드시면 새로 만들기 후 다시 생성해 보세요
          </p>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full rounded-2xl gap-2 bg-accent hover:bg-accent/90 text-accent-foreground h-11"
          >
            <Download className="size-4" />
            {isExporting ? '내보내는 중...' : '최종 PNG 다운로드'}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">캔버스 위 텍스트 포함 저장됩니다</p>
        </div>
      </div>

      {/* ── 우측 Konva 캔버스 ── */}
      <div className="flex-1 overflow-auto bg-muted/30 flex items-start justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Canvas · 텍스트를 드래그로 이동</p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.22)' }}
          >
            <Stage
              ref={stageRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onClick={(e) => {
                if (e.target === e.target.getStage()) setSelectedId(null);
              }}
            >
              <Layer>
                {bgImage && (
                  <KonvaImage
                    image={bgImage}
                    x={0}
                    y={0}
                    width={CANVAS_W}
                    height={CANVAS_H}
                  />
                )}
                {fontsReady && layers.map((layer) => (
                  <Text
                    key={layer.id}
                    id={layer.id}
                    text={layer.vertical ? layer.text.split('').join('\n') : layer.text}
                    x={layer.x}
                    y={layer.y}
                    fontSize={layer.fontSize}
                    fontFamily={layer.fontFamily}
                    fontStyle={konvaFontStyle === 'bold' && layer.id === selectedId ? 'bold' : (layer.bold ? 'bold' : 'normal')}
                    fill={layer.fill}
                    align={layer.align}
                    rotation={layer.vertical ? 0 : 0}
                    shadowEnabled={layer.shadowEnabled}
                    shadowColor={layer.shadowColor}
                    shadowBlur={layer.shadowBlur}
                    shadowOffsetX={layer.shadowOffsetX}
                    shadowOffsetY={layer.shadowOffsetY}
                    strokeEnabled={layer.strokeEnabled}
                    stroke={layer.strokeEnabled ? layer.stroke : undefined}
                    strokeWidth={layer.strokeEnabled ? layer.strokeWidth : undefined}
                    draggable
                    onClick={() => setSelectedId(layer.id)}
                    onTap={() => setSelectedId(layer.id)}
                    onDragEnd={(e) => handleTextDragEnd(layer.id, e)}
                    onTransformEnd={(e) => handleTransformEnd(layer.id, e as unknown as { target: Konva.Node })}
                  />
                ))}
                <Transformer
                  ref={transformerRef}
                  rotateEnabled={false}
                  enabledAnchors={['middle-left', 'middle-right']}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (Math.abs(newBox.width) < 20) return oldBox;
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
          <p className="text-[10px] text-muted-foreground">출력: {CANVAS_W * 2} × {CANVAS_H * 2}px (2x)</p>
        </div>
      </div>
    </div>
  );
}
