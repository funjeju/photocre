'use client';

import { STYLES } from '@/lib/presets/styles';
import { useStudioStore } from '@/lib/store/studio';
import { PresetCard } from './preset-card';
import { ko } from '@/lib/i18n/ko';

export function StylePicker() {
  const styleId = useStudioStore((s) => s.styleId);
  const setStyleId = useStudioStore((s) => s.setStyleId);

  return (
    <div>
      <p className="mb-3 text-sm font-medium">{ko.studio.style.title}</p>
      <div className="flex gap-2 overflow-x-auto px-1 py-2 snap-x snap-mandatory">
        {STYLES.map((style) => (
          <PresetCard
            key={style.id}
            name={style.name}
            selected={styleId === style.id}
            onClick={() => setStyleId(style.id)}
            thumbnailSrc={style.thumbnailSrc}
            className="snap-start"
          />
        ))}
      </div>
    </div>
  );
}
