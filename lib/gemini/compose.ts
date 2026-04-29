import { FINAL_PROMPT, STYLE_MAP, CAT_STYLE_MAP, DOG_STYLE_MAP, ANIMAL_STYLE_MAP } from './prompts';

const ASPECT_RATIO_LABELS: Record<string, string> = {
  '1:1': 'square (1:1)',
  '4:5': 'portrait (4:5)',
  '3:4': 'portrait (3:4)',
  '9:16': 'tall portrait (9:16)',
  '16:9': 'landscape (16:9)',
  'free': 'same aspect ratio as the input image',
};

const INTENSITY_PROMPT: Record<number, string> = {
  30: 'TRANSFORMATION INTENSITY: 30% — Keep the image mostly photorealistic. Apply only a very subtle hint of the style. The original photo should dominate; style is barely noticeable.',
  50: 'TRANSFORMATION INTENSITY: 50% — Balance equally between the original photo and the target style. Both should be clearly visible.',
  70: 'TRANSFORMATION INTENSITY: 70% — Apply the style strongly. The style should clearly dominate while the subject (person, animal, or object) remains recognizable.',
  100: 'TRANSFORMATION INTENSITY: 100% — Apply the style at MAXIMUM strength with absolutely no restraint. The output must be indistinguishable from a hand-crafted illustration in the target art style. Zero photographic qualities should remain — no photographic textures, no camera noise, no lens effects. Every pixel of the image — sky, background, environment, clothing, skin — must be fully re-rendered in the target style.',
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
  const styleDesc       = STYLE_MAP[options.styleId]       ?? STYLE_MAP['beauty'];
  const catStyleDesc    = CAT_STYLE_MAP[options.styleId]    ?? CAT_STYLE_MAP['beauty'];
  const dogStyleDesc    = DOG_STYLE_MAP[options.styleId]    ?? DOG_STYLE_MAP['beauty'];
  const animalStyleDesc = ANIMAL_STYLE_MAP[options.styleId] ?? ANIMAL_STYLE_MAP['beauty'];
  const ratioLabel =
    ASPECT_RATIO_LABELS[options.aspectRatio ?? ''] ??
    'same aspect ratio as the input image';

  const intensity = options.transformIntensity ?? 70;

  const parts = [
    FINAL_PROMPT(styleDesc, catStyleDesc, dogStyleDesc, animalStyleDesc, intensity),

    '',

    `OUTPUT SETTING:
- Aspect ratio: ${ratioLabel}`,
  ];

  parts.push('', INTENSITY_PROMPT[intensity] ?? INTENSITY_PROMPT[70]);

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
      `USER REQUIREMENTS:
${options.customPrompt.trim()}`,
    );
  }

  // 연속 요청 시 Gemini가 동일 요청으로 처리하는 것을 방지하는 고유 ID
  const seed = options.requestId ?? Math.random().toString(36).slice(2, 10);
  parts.push('', `[Request ID: ${seed}]`);

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
