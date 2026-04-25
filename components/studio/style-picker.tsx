'use client';

import { useRef, useEffect } from 'react';
import { STYLES } from '@/lib/presets/styles';
import { useStudioStore } from '@/lib/store/studio';
import { PresetCard } from './preset-card';
import { ko } from '@/lib/i18n/ko';

export function StylePicker() {
  const styleId = useStudioStore((s) => s.styleId);
  const setStyleId = useStudioStore((s) => s.setStyleId);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // 선택된 카드가 화면 밖에 있으면 스크롤해서 보이게
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [styleId]);

  return (
    <div>
      <p className="mb-3 text-sm font-medium">{ko.studio.style.title}</p>
      <div className="flex gap-2 overflow-x-auto px-1 py-2 snap-x snap-mandatory">
        {STYLES.map((style) => {
          const isSelected = styleId === style.id;
          return (
            <PresetCard
              key={style.id}
              ref={isSelected ? selectedRef : undefined}
              name={style.name}
              selected={isSelected}
              onClick={() => setStyleId(style.id)}
              thumbnailSrc={style.thumbnailSrc}
              className="snap-start"
            />
          );
        })}
      </div>
    </div>
  );
}
