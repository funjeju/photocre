'use client';

import { useRef, useState, useEffect } from 'react';
import { useStudioStore } from '@/lib/store/studio';
import { getFrame } from '@/lib/presets/frames';
import { getBackground, CUSTOM_BACKGROUND } from '@/lib/presets/backgrounds';

const PREVIEW_MAX_W = 520;

export function LivePreview() {
  const { croppedImage, frameId, backgroundId, customBackground, textOverlay, setTextOverlay } =
    useStudioStore();

  const frameRef = useRef<HTMLDivElement>(null);
  const [frameW, setFrameW] = useState(PREVIEW_MAX_W);
  const isDragging = useRef(false);
  const dragStart = useRef({ clientX: 0, clientY: 0, ox: 0.5, oy: 0.88 });

  useEffect(() => {
    if (!frameRef.current) return;
    const ro = new ResizeObserver(([entry]) => setFrameW(entry.contentRect.width));
    ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, []);

  const frame = getFrame(frameId);
  const background = backgroundId === 'custom' ? CUSTOM_BACKGROUND : getBackground(backgroundId);

  const bgStyle: React.CSSProperties =
    backgroundId === 'custom' && customBackground
      ? { backgroundImage: `url(${customBackground.previewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : background.id === 'keep-original'
      ? { background: '#d4d4d4' }
      : { background: background.thumbnailStyle };

  function handlePointerDown(e: React.PointerEvent) {
    if (!frameRef.current) return;
    const current = useStudioStore.getState().textOverlay;
    if (!current) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      ox: current.position.x,
      oy: current.position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging.current || !frameRef.current) return;
    const current = useStudioStore.getState().textOverlay;
    if (!current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStart.current.clientX) / rect.width;
    const dy = (e.clientY - dragStart.current.clientY) / rect.height;
    useStudioStore.getState().setTextOverlay({
      ...current,
      position: {
        x: Math.min(0.95, Math.max(0.05, dragStart.current.ox + dx)),
        y: Math.min(0.95, Math.max(0.05, dragStart.current.oy + dy)),
      },
    });
  }

  function handlePointerUp() {
    isDragging.current = false;
  }

  const textX = textOverlay?.position.x ?? 0.5;
  const textY = textOverlay?.position.y ?? 0.88;
  const textFontSize = Math.max(8, (textOverlay?.fontSize ?? 24) * frameW / 512);

  if (!croppedImage) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center">
          <svg className="size-6 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-xs text-muted-foreground">
          사진을 업로드하면<br />여기에 미리보기가 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div style={{ width: '100%', maxWidth: PREVIEW_MAX_W }}>
        {/* 원본 크롭 이미지 — 프레임/배경 없이 그대로 표시 */}
        <div ref={frameRef} className="relative rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={croppedImage.previewUrl}
            alt="미리보기"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />

          {/* 드래그 가능한 텍스트 레이어 */}
          {textOverlay && (
            <div className="absolute inset-0 pointer-events-none">
              <span
                className="absolute pointer-events-auto cursor-move select-none touch-none"
                style={{
                  left: `${textX * 100}%`,
                  top: `${textY * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: textOverlay.fontFamily,
                  fontSize: textFontSize,
                  color: textOverlay.content ? textOverlay.color : 'rgba(255,255,255,0.5)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                  textAlign: textOverlay.alignment as React.CSSProperties['textAlign'],
                  whiteSpace: 'pre-wrap',
                  maxWidth: '90%',
                  lineHeight: 1.2,
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {textOverlay.content || 'TEXT'}
              </span>
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          AI 변환 전 미리보기 · 프레임/배경은 생성 후 적용됩니다
        </p>
      </div>
    </div>
  );
}
