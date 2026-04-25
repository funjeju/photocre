'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ThumbnailCss {
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat?: string;
}

interface PresetCardProps {
  name: string;
  selected: boolean;
  onClick: () => void;
  thumbnailStyle?: string;
  thumbnailSrc?: string;
  thumbnailCss?: ThumbnailCss;
  className?: string;
}

export const PresetCard = forwardRef<HTMLButtonElement, PresetCardProps>(function PresetCard(
  { name, selected, onClick, thumbnailStyle, thumbnailSrc, thumbnailCss, className },
  ref,
) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        'relative rounded-xl overflow-hidden aspect-[4/5] border transition-all shrink-0 w-20',
        selected
          ? 'ring-2 ring-accent ring-offset-2 border-accent'
          : 'border-border hover:border-foreground/20',
        className,
      )}
    >
      <div className="absolute inset-0">
        {thumbnailCss ? (
          <div className="w-full h-full" style={thumbnailCss} />
        ) : thumbnailSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailSrc} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: thumbnailStyle ?? '#F5F5F5' }} />
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <span className="text-[9px] font-medium text-white leading-tight line-clamp-2">{name}</span>
      </div>
    </button>
  );
});
