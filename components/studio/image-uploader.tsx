'use client';

import { useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { ImageUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/lib/store/studio';
import { ko } from '@/lib/i18n/ko';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_MB = 10;

export function ImageUploader({ className }: { className?: string }) {
  const setSourceImage = useStudioStore((s) => s.setSourceImage);
  const setIsCropDialogOpen = useStudioStore((s) => s.setIsCropDialogOpen);
  const sourceImage = useStudioStore((s) => s.sourceImage);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(heic|heif)$/i)) {
        toast.error(ko.studio.uploadFormatError);
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(ko.studio.uploadSizeError);
        return;
      }

      try {
        let processedFile = file;
        // HEIC 변환
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.match(/\.(heic|heif)$/i)) {
          const heic2any = (await import('heic2any')).default;
          const converted = await heic2any({ blob: file, toType: 'image/webp' });
          processedFile = new File(
            [converted as Blob],
            file.name.replace(/\.(heic|heif)$/i, '.webp'),
            { type: 'image/webp' },
          );
        }

        // 클라이언트 리사이즈 (긴 변 2048px 이하)
        const compressed = await imageCompression(processedFile, {
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          fileType: 'image/webp',
        });

        const previewUrl = URL.createObjectURL(compressed);
        setSourceImage({ blob: compressed, previewUrl });
        setIsCropDialogOpen(true);
      } catch {
        toast.error(ko.errors.unknown);
      }
    },
    [setSourceImage, setIsCropDialogOpen],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-8 transition-colors hover:border-accent/40 hover:bg-muted/60 cursor-pointer',
        sourceImage && 'border-accent/30 bg-accent/5',
        className,
      )}
      onClick={() => inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.heic,.heif"
        className="hidden"
        onChange={onInputChange}
      />

      {sourceImage ? (
        // 업로드된 상태: 썸네일 미리보기
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sourceImage.previewUrl}
          alt="업로드된 사진"
          className="w-full max-h-40 object-contain rounded-xl"
        />
      ) : (
        <>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <ImageUp className="size-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{ko.studio.uploadPrompt}</p>
            <p className="mt-1 text-xs text-muted-foreground">{ko.studio.uploadHint}</p>
          </div>
        </>
      )}
    </div>
  );
}
