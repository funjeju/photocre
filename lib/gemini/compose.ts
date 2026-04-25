import { getStyle } from '@/lib/presets/styles';
import { BASE_INSTRUCTION, QUALITY_FRAGMENT } from './prompts';

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
}

export function composePrompt(options: ComposeOptions): string {
  const style = getStyle(options.styleId);
  const ratioLabel = ASPECT_RATIO_LABELS[options.aspectRatio ?? ''] ?? 'same aspect ratio as the input image';

  const parts = [
    BASE_INSTRUCTION,
    `- Output image aspect ratio: ${ratioLabel}`,
    '',
    `TARGET STYLE [${style.name.toUpperCase()}]: ${style.promptFragment}`,
  ];

  if (options.customPrompt?.trim()) {
    parts.push('', `Additional user requirements: ${options.customPrompt.trim()}`);
  }

  parts.push(QUALITY_FRAGMENT);
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
