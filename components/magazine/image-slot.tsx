'use client';

import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageSlotProps {
  index: number;
  label: string;
  src: string | null;
  onChange: (src: string | null) => void;
}

export function ImageSlot({ index, label, src, onChange }: ImageSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    onChange(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !src && inputRef.current?.click()}
        className={cn(
          'relative rounded-2xl overflow-hidden border-2 border-dashed transition-colors',
          'aspect-[3/4] w-full',
          src
            ? 'border-transparent'
            : 'border-border hover:border-foreground/30 cursor-pointer bg-muted/40',
        )}
      >
        {src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`이미지 ${index + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 h-full text-muted-foreground">
            <ImagePlus className="size-8 opacity-40" />
            <p className="text-xs text-center px-4">클릭 또는 드래그해서<br />사진 업로드</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
