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
  transformIntensity?: number;
  requestId?: string;
}

export function composePrompt(options: ComposeOptions): string {
  const style = STYLE_MAP[options.styleId] ?? STYLE_MAP['beauty'];
  const intensity = options.transformIntensity ?? 70;
  const ratioLabel =
    ASPECT_RATIO_LABELS[options.aspectRatio ?? ''] ??
    'same aspect ratio as the input image';

  const parts = [
    FINAL_PROMPT(style, intensity),
    '',
    `OUTPUT: Aspect ratio ${ratioLabel}`,
  ];

  if (options.backgroundPrompt?.trim()) {
    parts.push('', `BACKGROUND: ${options.backgroundPrompt.trim()}`);
  }
  if (options.customPrompt?.trim()) {
    parts.push('', `USER NOTES: ${options.customPrompt.trim()}`);
  }

  const seed = options.requestId ?? crypto.randomUUID();
  parts.push('', `# cache-buster: ${seed}`);

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
