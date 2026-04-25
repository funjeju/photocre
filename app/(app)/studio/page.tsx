'use client';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Crop, Download, PackageCheck } from 'lucide-react';
import { CanvasPreview } from '@/components/studio/canvas-preview';
import { CropDialog } from '@/components/studio/crop-dialog';
import { ImageUploader } from '@/components/studio/image-uploader';
import { StylePicker } from '@/components/studio/style-picker';
import { CustomPromptField } from '@/components/studio/custom-prompt';
import { GenerateButton } from '@/components/studio/generate-button';
import { FramePicker } from '@/components/studio/frame-picker';
import { BackgroundPicker } from '@/components/studio/background-picker';
import { TextOverlayEditor } from '@/components/studio/text-overlay-editor';
import { useStudioStore } from '@/lib/store/studio';
import { downloadRef } from '@/lib/canvas/download-ref';
import { ko } from '@/lib/i18n/ko';

export default function StudioPage() {
  const { croppedImage, generatedImageUrl, styleId, setGeneratedImageUrl, setIsCropDialogOpen } =
    useStudioStore();

  const hasImage = !!croppedImage;
  const hasResult = !!generatedImageUrl;

  function handleComplete() {
    if (!croppedImage) return;
    if (hasResult) {
      downloadRef.fn?.();
    } else {
      // AI 없이 원본 이미지 기반으로 Konva 합성 → 다운로드 가능
      setGeneratedImageUrl(croppedImage.previewUrl);
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ─── 좌측: 캔버스 ─── */}
      <div className="hidden lg:flex flex-1 p-6">
        <CanvasPreview />
      </div>

      {/* ─── 우측 패널 ─── */}
      <aside className="w-full lg:w-[400px] lg:border-l border-border flex flex-col overflow-y-auto">
        <div className="flex-1 space-y-6 p-6 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{ko.studio.title}</h1>
          </div>

          {/* 모바일 캔버스 */}
          <div className="lg:hidden">
            <CanvasPreview />
          </div>

          {/* ── ① 사진 업로드 ── */}
          <ImageUploader />
          {croppedImage && (
            <Button
              variant="outline"
              onClick={() => setIsCropDialogOpen(true)}
              className="w-full gap-2 rounded-2xl"
            >
              <Crop className="size-4" />
              크롭 조정
            </Button>
          )}

          <Separator />

          {/* ── ② AI 스타일 변환 (선택사항, 꾸미기 전에 먼저 결정) ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{ko.studio.ai.title}</p>
              <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
                선택 · {ko.studio.ai.credit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI로 스타일을 먼저 변환하면 더 풍부한 결과물을 얻을 수 있습니다.
              변환 없이 꾸미기만 해도 됩니다.
            </p>
            <StylePicker />
            <CustomPromptField />
            {/* styleId가 'none'이 아닐 때만 AI 변환 버튼 표시 */}
            {styleId !== 'none' && <GenerateButton />}
          </div>

          <Separator />

          {/* ── ③ 꾸미기 (AI 여부 무관, 항상 사용 가능) ── */}
          <div className="space-y-6">
            <p className="text-sm font-semibold">{ko.studio.decorate.title}</p>
            <FramePicker />
            <Separator />
            <BackgroundPicker />
            <Separator />
            <TextOverlayEditor />
          </div>
        </div>

        {/* ── 완성하기 / 다운로드 (sticky) ── */}
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur p-4">
          <Button
            onClick={handleComplete}
            disabled={!hasImage}
            className="w-full gap-2 rounded-2xl h-11 bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40"
          >
            {hasResult ? (
              <>
                <Download className="size-4" />
                {ko.studio.result.download}
              </>
            ) : (
              <>
                <PackageCheck className="size-4" />
                완성하기
              </>
            )}
          </Button>
        </div>
      </aside>

      <CropDialog />
    </div>
  );
}
