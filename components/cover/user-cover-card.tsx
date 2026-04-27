'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserCover } from '@/types/user-cover';

interface Props {
  cover: UserCover;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function UserCoverCard({ cover, isSelected, onSelect, onDelete }: Props) {
  return (
    <div className="group flex flex-col gap-2 text-left relative">
      <button
        onClick={onSelect}
        className={cn(
          'aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all w-full',
          isSelected
            ? 'border-accent ring-2 ring-accent ring-offset-2'
            : 'border-border group-hover:border-foreground/30 group-hover:shadow-md',
        )}
      >
        <Image
          src={cover.thumbnailUrl}
          alt={cover.name || '나만의 커버'}
          width={200}
          height={267}
          className="w-full h-full object-cover"
          unoptimized
        />
      </button>

      {/* 삭제 버튼 — hover 시 노출 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={cn(
          'absolute top-1.5 right-1.5 size-6 rounded-full',
          'bg-background/80 hover:bg-background border border-border',
          'flex items-center justify-center transition-all',
          'opacity-0 group-hover:opacity-100',
        )}
      >
        <X className="size-3" />
      </button>

      <div>
        <p className="text-sm font-semibold leading-tight truncate">
          {cover.name || '나만의 커버'}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {cover.maxPhotos}인용 · 내 커버
        </p>
      </div>
    </div>
  );
}
