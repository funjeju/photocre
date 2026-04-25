import { FINAL_PROMPT, STYLE_MAP } from './prompts';

const ASPECT_RATIO_LABELS: Record<string, string> = {
  '1:1': 'square (1:1)',
  '4:5': 'portrait (4:5)',
  '3:4': 'portrait (3:4)',
  '9:16': 'tall portrait (9:16)',
  '16:9': 'landscape (16:9)',
  'free': 'same aspect ratio as the input image',
};

interface ComposeOptions {
  styleId: string;
  customPrompt?: string;
  aspectRatio?: string;
  backgroundPrompt?: string;
}

export function composePrompt(options: ComposeOptions): string {
  const styleDesc = STYLE_MAP[options.styleId] ?? STYLE_MAP['beauty'];
  const ratioLabel =
    ASPECT_RATIO_LABELS[options.aspectRatio ?? ''] ??
    'same aspect ratio as the input image';

  const parts = [
    FINAL_PROMPT(styleDesc),

    '',

    `OUTPUT SETTING:
- Aspect ratio: ${ratioLabel}`,
  ];

  if (options.backgroundPrompt?.trim()) {
    parts.push(
      '',
      `BACKGROUND:
${options.backgroundPrompt.trim()}`,
    );
  }

  if (options.customPrompt?.trim()) {
    parts.push(
      '',
      `USER REQUIREMENTS (must not break identity preservation):
${options.customPrompt.trim()}`,
    );
  }

  return parts.join('\n');
}

export function getAspectRatioParam(
  aspectRatio: string,
): '1:1' | '4:3' | '3:4' | '16:9' | '9:16' {
  const map: Record<string, '1:1' | '4:3' | '3:4' | '16:9' | '9:16'> = {
    '1:1': '1:1',
    '4:5': '3:4',
    '3:4': '3:4',
    '9:16': '9:16',
    '16:9': '16:9',
    free: '1:1',
  };
  return map[aspectRatio] ?? '1:1';
}
