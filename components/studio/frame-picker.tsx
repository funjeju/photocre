'use client';

import { FRAMES } from '@/lib/presets/frames';
import { useStudioStore } from '@/lib/store/studio';
import { PresetCard } from './preset-card';
import { ko } from '@/lib/i18n/ko';

export function FramePicker() {
  const frameId = useStudioStore((s) => s.frameId);
  const setFrameId = useStudioStore((s) => s.setFrameId);

  return (
    <div>
      <p className="mb-3 text-sm font-medium">{ko.studio.frame.title}</p>
      <div className="flex gap-2 overflow-x-auto px-1 py-2 snap-x snap-mandatory">
        {FRAMES.map((frame) => (
          <PresetCard
            key={frame.id}
            name={frame.name}
            selected={frameId === frame.id}
            onClick={() => setFrameId(frame.id)}
            thumbnailStyle={frame.thumbnailBg}
            className="snap-start"
          />
        ))}
      </div>
    </div>
  );
}
