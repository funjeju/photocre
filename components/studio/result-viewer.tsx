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

const EXPORT_SIZE = 1024; // 다운로드 해상도 (px)
const DISPLAY_SIZE = 520; // 화면 표시 크기 (px)

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
    setGeneratedImageUrl, setGenerationId,
  } = useStudioStore();
  const stageRef = useRef<Konva.Stage>(null);

  const frame = getFrame(frameId);
  const background = backgroundId === 'custom' ? CUSTOM_BACKGROUND : getBackground(backgroundId);

  const mainImage = useImage(generatedImageUrl);
  const customBgImage = useImage(
    backgroundId === 'custom' && customBackground ? customBackground.previewUrl : null,
  );

  // Konva는 EXPORT_SIZE 기준으로 렌더링, CSS transform으로 DISPLAY_SIZE에 맞게 축소 표시
  const SIZE = EXPORT_SIZE;
  const displayScale = DISPLAY_SIZE / EXPORT_SIZE; // 화면 표시 비율

  // 프레임 패딩 (EXPORT_SIZE 기준)
  const scale = SIZE / 512;
  const pad = {
    top: frame.konva.top * scale,
    right: frame.konva.right * scale,
    bottom: frame.konva.bottom * scale,
    left: frame.konva.left * scale,
  };

  // 이미지가 그려질 영역
  const imgX = pad.left;
  const imgY = pad.top;
  const imgW = SIZE - pad.left - pad.right;
  const imgH = SIZE - pad.top - pad.bottom;

  // 텍스트 위치
  const [textPos, setTextPos] = useState({ x: 0.5, y: 0.9 });
  useEffect(() => {
    if (textOverlay) setTextPos(textOverlay.position);
  }, [textOverlay]);

  // 배경 채우기 (단색/그라데이션은 Konva Rect, 이미지는 KonvaImage)
  const showBgImage = backgroundId === 'custom' && customBgImage;

  function handleDownload() {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ mimeType: 'image/png', quality: 1 });
    const a = document.createElement('a');
    a.href = uri;
    a.download = 'framelab.png';
    a.click();
  }

  // 패널 버튼에서 다운로드를 트리거할 수 있도록 콜백 등록
  useEffect(() => {
    downloadRef.fn = handleDownload;
    return () => { downloadRef.fn = null; };
  });

  function handleRegenerate() {
    setGeneratedImageUrl(null);
    setGenerationId(null);
  }

  if (!generatedImageUrl) return null;

  const fontSize = textOverlay ? Math.max(16, textOverlay.fontSize * scale) : 24;

  return (
    <div className="flex flex-col items-center gap-4 w-full" style={{ maxWidth: DISPLAY_SIZE }}>
      {/* Konva — EXPORT_SIZE로 렌더링, CSS transform으로 축소 표시 */}
      <div
        className="rounded-2xl overflow-hidden shadow-lg origin-top-left"
        style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
      >
        <div style={{ transform: `scale(${displayScale})`, transformOrigin: 'top left', width: EXPORT_SIZE, height: EXPORT_SIZE }}>
        <Stage ref={stageRef} width={SIZE} height={SIZE}>
          <Layer>
            {/* 1. 배경 */}
            {showBgImage ? (
              <KonvaImage image={customBgImage!} x={0} y={0} width={SIZE} height={SIZE} />
            ) : background.id === 'keep-original' || background.id === 'custom' ? null : (
              /* 단색/그라데이션: Konva는 CSS gradient 직접 지원 안 해서 fill로 근사 */
              <Rect
                x={0} y={0} width={SIZE} height={SIZE}
                fill={extractSolidColor(background.thumbnailStyle)}
              />
            )}

            {/* 2. 프레임 배경 (폴라로이드 흰 영역 등) */}
            {frame.konva.frameBg !== 'transparent' && (
              <Rect x={0} y={0} width={SIZE} height={SIZE} fill={frame.konva.frameBg} />
            )}

            {/* 3. 메인 이미지 */}
            {mainImage && (
              <KonvaImage
                image={mainImage}
                x={imgX} y={imgY}
                width={imgW} height={imgH}
              />
            )}

            {/* 4. 텍스트 오버레이 */}
            {textOverlay?.content && (
              <KonvaText
                text={textOverlay.content}
                x={textPos.x * SIZE - SIZE / 2}
                y={textPos.y * SIZE - fontSize / 2}
                width={SIZE}
                fontSize={fontSize}
                fontFamily={textOverlay.fontFamily}
                fill={textOverlay.color}
                align={textOverlay.alignment}
                draggable
                onDragEnd={(e) => {
                  setTextPos({
                    x: Math.min(1, Math.max(0, (e.target.x() + SIZE / 2) / SIZE)),
                    y: Math.min(1, Math.max(0, (e.target.y() + fontSize / 2) / SIZE)),
                  });
                }}
              />
            )}
          </Layer>
        </Stage>
        </div>
      </div>

      {/* SynthID 안내 */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3 shrink-0" />
        {ko.studio.result.synthIdNotice}
      </div>

      {/* 액션 버튼 */}
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

// CSS gradient 문자열에서 첫 번째 solid color 근사치 추출
function extractSolidColor(style: string): string {
  // radial/linear-gradient → 첫 번째 hex 또는 named color
  const match = style.match(/#[0-9A-Fa-f]{3,8}/);
  if (match) return match[0];
  if (style.startsWith('#')) return style;
  return '#f5f5f5';
}
