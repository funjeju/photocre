'use client';

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text as KonvaText } from 'react-konva';
import { Download, RefreshCw, BookmarkPlus, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useStudioStore } from '@/lib/store/studio';
import { getFrame } from '@/lib/presets/frames';
import { getBackground, CUSTOM_BACKGROUND } from '@/lib/presets/backgrounds';
import { downloadRef } from '@/lib/canvas/download-ref';
import { ko } from '@/lib/i18n/ko';
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
    aspectRatio, setGeneratedImageUrl, setGenerationId, setTextOverlay,
  } = useStudioStore();
  const stageRef = useRef<Konva.Stage>(null);

  const frame = getFrame(frameId);
  const background = backgroundId === 'custom' ? CUSTOM_BACKGROUND : getBackground(backgroundId);

  const mainImage = useImage(generatedImageUrl);
  const customBgImage = useImage(
    backgroundId === 'custom' && customBackground ? customBackground.previewUrl : null,
  );

  // 이미지 영역 크기 (비율 기반)
  const { w: imgW, h: imgH } = getImageDimensions(aspectRatio);

  // 프레임 패딩 (imgW 기준 스케일)
  const fScale = imgW / 512;
  const pad = {
    top:    frame.konva.top    * fScale,
    right:  frame.konva.right  * fScale,
    bottom: frame.konva.bottom * fScale,
    left:   frame.konva.left   * fScale,
  };

  // 캔버스 전체 크기 = 이미지 + 프레임 패딩
  const canvasW = imgW + pad.left + pad.right;
  const canvasH = imgH + pad.top  + pad.bottom;

  // 화면 표시 스케일
  const displayScale = DISPLAY_MAX / Math.max(canvasW, canvasH);
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
  }

  if (!generatedImageUrl) return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full" style={{ maxWidth: DISPLAY_MAX }}>
      <div
        className="rounded-2xl overflow-hidden shadow-lg"
        style={{ width: displayW, height: displayH }}
      >
        <div style={{ transform: `scale(${displayScale})`, transformOrigin: 'top left', width: canvasW, height: canvasH }}>
          <Stage ref={stageRef} width={canvasW} height={canvasH}>
            <Layer>
              {/* 1. 배경 (캔버스 전체) */}
              {showBgImage ? (
                <KonvaImage image={customBgImage!} x={0} y={0} width={canvasW} height={canvasH} />
              ) : background.id !== 'keep-original' && background.id !== 'custom' ? (
                <Rect x={0} y={0} width={canvasW} height={canvasH} fill={extractSolidColor(background.thumbnailStyle)} />
              ) : null}

              {/* 2. 프레임 배경 (폴라로이드 흰 영역 등) */}
              {frame.konva.frameBg !== 'transparent' && (
                <Rect x={0} y={0} width={canvasW} height={canvasH} fill={frame.konva.frameBg} />
              )}

              {/* 3. AI 이미지 — 패딩 안쪽에 정확히 배치 */}
              {mainImage && (
                <KonvaImage
                  image={mainImage}
                  x={pad.left} y={pad.top}
                  width={imgW} height={imgH}
                />
              )}

              {/* 4. 텍스트 오버레이 */}
              {textOverlay?.content && (
                <KonvaText
                  text={textOverlay.content}
                  x={textPos.x * canvasW - canvasW / 2}
                  y={textPos.y * canvasH - fontSize / 2}
                  width={canvasW}
                  fontSize={fontSize}
                  fontFamily={textOverlay.fontFamily}
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
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3 shrink-0" />
        {ko.studio.result.synthIdNotice}
      </div>

      <div className="flex gap-2 w-full flex-wrap">
        <Button onClick={handleDownload} variant="outline" className="flex-1 rounded-2xl gap-2 min-w-0">
          <Download className="size-4 shrink-0" />
          {ko.studio.result.download}
        </Button>
        <Button onClick={handleRegenerate} variant="outline" className="flex-1 rounded-2xl gap-2 min-w-0">
          <RefreshCw className="size-4 shrink-0" />
          {ko.studio.result.regenerate}
        </Button>
        <Button
          variant="outline"
          className="flex-1 rounded-2xl gap-2 min-w-0"
          onClick={() => toast.info('템플릿 저장은 Phase 2에서 지원됩니다.')}
        >
          <BookmarkPlus className="size-4 shrink-0" />
          {ko.studio.result.saveTemplate}
        </Button>
      </div>
    </div>
  );
}

function extractSolidColor(style: string): string {
  const match = style.match(/#[0-9A-Fa-f]{3,8}/);
  if (match) return match[0];
  if (style.startsWith('#')) return style;
  return '#f5f5f5';
}
