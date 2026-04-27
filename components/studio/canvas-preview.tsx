'use client';

import { useStudioStore } from '@/lib/store/studio';
import { LivePreview } from './live-preview';
import { ResultViewer } from './result-viewer';
import { StudioLoading } from './studio-loading';

export function CanvasPreview() {
  const { generatedImageUrl, isGenerating } = useStudioStore();

  return (
    /* 작업 캔버스 배경 존 — dot 텍스처 + muted 배경 */
    <div className="relative flex flex-1 rounded-2xl bg-muted/30 lg:overflow-hidden lg:min-h-[560px]">
      {/* SVG 도트 텍스처 */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="canvas-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#canvas-dots)" />
      </svg>

      {/* 콘텐츠 — desktop: overflow-y-auto (패널 내 스크롤), mobile: auto height (aside가 스크롤 담당) */}
      <div className="relative z-10 flex flex-1 items-start justify-center p-4 md:p-8 pt-6 md:pt-8 lg:overflow-y-auto">
        {isGenerating ? (
          <StudioLoading />
        ) : generatedImageUrl ? (
          <ResultViewer />
        ) : (
          <LivePreview />
        )}
      </div>
    </div>
  );
}
