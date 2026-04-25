'use client';

import { useRef } from 'react';
import { Plus } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { BACKGROUNDS } from '@/lib/presets/backgrounds';
import { useStudioStore } from '@/lib/store/studio';
import { PresetCard } from './preset-card';
import { ko } from '@/lib/i18n/ko';
import { cn } from '@/lib/utils';

export function BackgroundPicker() {
  const backgroundId = useStudioStore((s) => s.backgroundId);
  const customBackground = useStudioStore((s) => s.customBackground);
  const setBackgroundId = useStudioStore((s) => s.setBackgroundId);
  const setCustomBackground = useStudioStore((s) => s.setCustomBackground);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleCustomUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await imageCompression(file, { maxWidthOrHeight: 1024, useWebWorker: true });
      const previewUrl = URL.createObjectURL(compressed);
      setCustomBackground({ blob: compressed, previewUrl });
      setBackgroundId('custom');
    } catch {
      toast.error(ko.errors.unknown);
    }
    e.target.value = '';
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium">{ko.studio.background.title}</p>
      <div className="flex gap-2 overflow-x-auto px-1 py-2 snap-x snap-mandatory">
        {/* 커스텀 업로드 카드 */}
        <button
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative rounded-xl aspect-[4/5] border transition-all shrink-0 w-20 flex flex-col items-center justify-center gap-1',
            backgroundId === 'custom'
              ? 'ring-2 ring-accent ring-offset-2 border-accent'
              : 'border-dashed border-border hover:border-foreground/30',
          )}
        >
          {customBackground ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={customBackground.previewUrl} alt="커스텀 배경" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <>
              <Plus className="size-4 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">{ko.studio.background.customUpload}</span>
            </>
          )}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />

        {BACKGROUNDS.map((bg) => (
          <PresetCard
            key={bg.id}
            name={bg.name}
            selected={backgroundId === bg.id}
            onClick={() => setBackgroundId(bg.id)}
            thumbnailStyle={bg.thumbnailStyle}
            className="snap-start"
          />
        ))}
      </div>
    </div>
  );
}
