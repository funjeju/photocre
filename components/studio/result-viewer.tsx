'use client';

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text as KonvaText } from 'react-konva';
import { Download, RefreshCw, CheckCircle2, Loader2, Info, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useStudioStore } from '@/lib/store/studio';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFrame } from '@/lib/presets/frames';
import { getBackground, CUSTOM_BACKGROUND } from '@/lib/presets/backgrounds';
import { downloadRef } from '@/lib/canvas/download-ref';
import { ko } from '@/lib/i18n/ko';
import { MockupPreview } from './mockup-preview';
import type Konva from 'konva';

const EXPORT_LONG = 1024;
const DISPLAY_MAX = 520;

function getImageDimensions(aspectRatio: string): { w: number; h: number } {
  const ratios: Record<string, [number, number]> = {
    '1:1':  [1, 1],
    '4:5':  [4, 5],
    '3:4':  [3, 4],
    '9:16': [9, 16],
    '16:9': [16, 9],
    'free': [1, 1],
  };
  const [rw, rh] = ratios[aspectRatio] ?? [1, 1];
  if (rw >= rh) {
    return { w: EXPORT_LONG, h: Math.round(EXPORT_LONG * rh / rw) };
  }
  return { w: Math.round(EXPORT_LONG * rw / rh), h: EXPORT_LONG };
}

function useImage(src: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) { setImg(null); return; }
    const i = new window.Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => setImg(i);
    i.src = src;
  }, [src]);
  return img;
}

export function ResultViewer() {
  const {
    generatedImageUrl, textOverlay, frameId, backgroundId, customBackground,
    aspectRatio, styleId, customPrompt,
    setGeneratedImageUrl, setGenerationId, setTextOverlay, reset,
  } = useStudioStore();
  const { user } = useAuth();
  const stageRef = useRef<Konva.Stage>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Responsive container sizing ──────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(DISPLAY_MAX);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      if (w > 0) setContainerW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const frame = getFrame(frameId);
  const background = backgroundId === 'custom' ? CUSTOM_BACKGROUND : getBackground(backgroundId);

  const mainImage = useImage(generatedImageUrl);
  const customBgImage = useImage(
    backgroundId === 'custom' && customBackground ? customBackground.previewUrl : null,
  );

  const { w: imgW, h: imgH } = getImageDimensions(aspectRatio);

  const fScale = imgW / 512;
  const pad = {
    top:    frame.konva.top    * fScale,
    right:  frame.konva.right  * fScale,
    bottom: frame.konva.bottom * fScale,
    left:   frame.konva.left   * fScale,
  };

  const canvasW = imgW + pad.left + pad.right;
  const canvasH = imgH + pad.top  + pad.bottom;

  // Cap at DISPLAY_MAX and actual container width — prevents horizontal overflow
  const effectiveMax = Math.min(DISPLAY_MAX, containerW);
  const displayScale = effectiveMax / Math.max(canvasW, canvasH);
  const displayW = Math.round(canvasW * displayScale);
  const displayH = Math.round(canvasH * displayScale);

  const textPos = textOverlay?.position ?? { x: 0.5, y: 0.9 };

  const showBgImage = backgroundId === 'custom' && customBgImage;
  const fontSize = textOverlay ? Math.max(16, textOverlay.fontSize * fScale) : 24;

  function handleDownload() {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ mimeType: 'image/png', quality: 1 });
    const a = document.createElement('a');
    a.href = uri;
    a.download = 'framelab.png';
    a.click();
  }

  useEffect(() => {
    downloadRef.fn = handleDownload;
    return () => { downloadRef.fn = null; };
  });

  function handleRegenerate() {
    setGeneratedImageUrl(null);
    setGenerationId(null);
    setSaved(false);
  }

  async function handleSaveToProfile() {
    if (!stageRef.current || !user || saving || saved) return;
    setSaving(true);
    try {
      const dataUrl = stageRef.current.toDataURL({ mimeType: 'image/png', quality: 1 });
      const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
      const token = await user.getIdToken();
      const res = await fetch('/api/save-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: base64, styleId, customPrompt }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json() as { id: string };
      setGenerationId(data.id);
      setSaved(true);
      toast.success('마이페이지에 저장됐습니다.');
    } catch {
      toast.error('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  if (!generatedImageUrl) return null;

  return (
    <div ref={wrapperRef} className="flex flex-col items-center gap-4 w-full">
      {/* ── Konva Stage (responsive scaled) ── */}
      <div
        className="rounded-2xl overflow-hidden shadow-lg"
        style={{ width: displayW, height: displayH }}
      >
        <div style={{ transform: `scale(${displayScale})`, transformOrigin: 'top left', width: canvasW, height: canvasH }}>
          <Stage ref={stageRef} width={canvasW} height={canvasH}>
            <Layer clipFunc={(ctx) => {
              const r = 24;
              ctx.beginPath();
              ctx.moveTo(r, 0);
              ctx.lineTo(canvasW - r, 0);
              ctx.quadraticCurveTo(canvasW, 0, canvasW, r);
              ctx.lineTo(canvasW, canvasH - r);
              ctx.quadraticCurveTo(canvasW, canvasH, canvasW - r, canvasH);
              ctx.lineTo(r, canvasH);
              ctx.quadraticCurveTo(0, canvasH, 0, canvasH - r);
              ctx.lineTo(0, r);
              ctx.quadraticCurveTo(0, 0, r, 0);
              ctx.closePath();
            }}>
              {showBgImage ? (
                <KonvaImage image={customBgImage!} x={0} y={0} width={canvasW} height={canvasH} />
              ) : background.id !== 'keep-original' && background.id !== 'custom' ? (
                <Rect x={0} y={0} width={canvasW} height={canvasH} fill={extractSolidColor(background.thumbnailStyle)} />
              ) : null}

              {frame.konva.frameBg !== 'transparent' && (
                <Rect x={0} y={0} width={canvasW} height={canvasH} fill={frame.konva.frameBg} />
              )}

              {mainImage && (
                <KonvaImage
                  image={mainImage}
                  x={pad.left} y={pad.top}
                  width={imgW} height={imgH}
                />
              )}

              {textOverlay?.content && (() => {
                const tx = textPos.x * canvasW - canvasW / 2;
                const ty = textPos.y * canvasH - fontSize / 2;
                const lineCount = textOverlay.content.split('\n').length;
                const bgH = fontSize * lineCount * 1.35 + 16;
                const bgPad = 12;
                return (
                  <>
                    {textOverlay.textBgColor && (
                      <Rect
                        x={tx - bgPad}
                        y={ty - 8}
                        width={canvasW + bgPad * 2}
                        height={bgH}
                        fill={textOverlay.textBgColor}
                        cornerRadius={8}
                        listening={false}
                      />
                    )}
                    <KonvaText
                      text={textOverlay.content}
                      x={tx}
                      y={ty}
                      width={canvasW}
                      fontSize={fontSize}
                      fontFamily={textOverlay.fontFamily}
                      fontStyle={textOverlay.bold ? 'bold' : 'normal'}
                      fill={textOverlay.color}
                      align={textOverlay.alignment}
                      draggable
                      onDragEnd={(e) => {
                        const newPos = {
                          x: Math.min(1, Math.max(0, (e.target.x() + canvasW / 2) / canvasW)),
                          y: Math.min(1, Math.max(0, (e.target.y() + fontSize / 2) / canvasH)),
                        };
                        if (textOverlay) setTextOverlay({ ...textOverlay, position: newPos });
                      }}
                    />
                  </>
                );
              })()}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* SynthID notice */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3 shrink-0" />
        {ko.studio.result.synthIdNotice}
      </div>

      {/* ── 2×2 action buttons ── */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="h-11 rounded-2xl gap-1.5 text-sm"
        >
          <Download className="size-4 shrink-0" />
          {ko.studio.result.download}
        </Button>
        <Button
          onClick={handleRegenerate}
          variant="outline"
          className="h-11 rounded-2xl gap-1.5 text-sm"
        >
          <RefreshCw className="size-4 shrink-0" />
          {ko.studio.result.regenerate}
        </Button>
        <Button
          variant={saved ? 'default' : 'outline'}
          className="h-11 rounded-2xl gap-1.5 text-sm"
          onClick={handleSaveToProfile}
          disabled={saving || saved}
        >
          {saving ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <Download className="size-4 shrink-0" />
          )}
          {saved ? '저장됨' : ko.studio.result.saveToProfile}
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-2xl gap-1.5 text-sm"
          onClick={reset}
        >
          <ImagePlus className="size-4 shrink-0" />
          {ko.studio.result.newImage}
        </Button>
      </div>

      <MockupPreview imageUrl={generatedImageUrl} />
    </div>
  );
}

function extractSolidColor(style: string): string {
  const match = style.match(/#[0-9A-Fa-f]{3,8}/);
  if (match) return match[0];
  if (style.startsWith('#')) return style;
  return '#f5f5f5';
}
