'use client';

import { useStudioStore } from '@/lib/store/studio';
import { ko } from '@/lib/i18n/ko';

export function CustomPromptField() {
  const { customPrompt, setCustomPrompt } = useStudioStore();

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">
        {ko.studio.ai.prompt.label}
      </label>
      <textarea
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        placeholder={ko.studio.ai.prompt.placeholder}
        maxLength={200}
        rows={2}
        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-muted-foreground/60"
      />
    </div>
  );
}
