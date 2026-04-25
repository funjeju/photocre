'use client';

import { useStudioStore } from '@/lib/store/studio';
import { cn } from '@/lib/utils';

const OPTIONS: { value: 30 | 50 | 70 | 100; label: string; desc: string }[] = [
  { value: 30,  label: '30%', desc: '살짝' },
  { value: 50,  label: '50%', desc: '반반' },
  { value: 70,  label: '70%', desc: '강하게' },
  { value: 100, label: '100%', desc: '완전변환' },
];

export function IntensityPicker() {
  const intensity = useStudioStore((s) => s.transformIntensity);
  const setIntensity = useStudioStore((s) => s.setTransformIntensity);

  return (
    <div>
      <p className="mb-3 text-sm font-medium">변환 강도</p>
      <div className="grid grid-cols-4 gap-1.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setIntensity(opt.value)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-xl border py-2.5 px-1 transition-all text-center',
              intensity === opt.value
                ? 'border-accent ring-2 ring-accent ring-offset-2 bg-accent/5'
                : 'border-border hover:border-foreground/20',
            )}
          >
            <span className="text-sm font-semibold leading-none">{opt.label}</span>
            <span className="text-[10px] text-muted-foreground leading-none mt-1">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
