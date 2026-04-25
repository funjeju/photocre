export type BackgroundPreset = {
  id: string;
  name: string;
  type: 'solid' | 'gradient' | 'texture' | 'keep' | 'custom';
  thumbnailStyle: string; // CSS background for thumbnail
  promptFragment: string;
};

export const BACKGROUNDS: BackgroundPreset[] = [
  {
    id: 'keep-original',
    name: '원본 배경',
    type: 'keep',
    thumbnailStyle: 'linear-gradient(135deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%)',
    promptFragment: 'Keep the original background as-is without any replacement.',
  },
  {
    id: 'white',
    name: '순백',
    type: 'solid',
    thumbnailStyle: '#FFFFFF',
    promptFragment: 'Replace the background with a pure, clean white (#FFFFFF).',
  },
  {
    id: 'studio-gray',
    name: '스튜디오 그레이',
    type: 'gradient',
    thumbnailStyle: 'radial-gradient(ellipse at center, #C8C8C8 0%, #888888 100%)',
    promptFragment:
      'Replace the background with a professional studio gradient: soft neutral gray, darker at the edges and brighter at center, like a portrait photography backdrop.',
  },
  {
    id: 'warm-pastel',
    name: '따뜻한 파스텔',
    type: 'gradient',
    thumbnailStyle: 'linear-gradient(135deg, #FFE5D9 0%, #FFC8B4 100%)',
    promptFragment:
      'Replace the background with a warm pastel gradient: soft peach and rose tones, gentle and airy.',
  },
  {
    id: 'cool-pastel',
    name: '차가운 파스텔',
    type: 'gradient',
    thumbnailStyle: 'linear-gradient(135deg, #D9E8FF 0%, #B4D0FF 100%)',
    promptFragment:
      'Replace the background with a cool pastel gradient: soft sky blue and lavender tones, calm and fresh.',
  },
  {
    id: 'linen',
    name: '리넨',
    type: 'texture',
    thumbnailStyle: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D8 100%)',
    promptFragment:
      'Replace the background with a linen fabric texture: natural off-white fibers, subtle woven pattern, warm and tactile.',
  },
  {
    id: 'kraft-paper',
    name: '크라프트 종이',
    type: 'texture',
    thumbnailStyle: 'linear-gradient(135deg, #C8A97A 0%, #A67C52 100%)',
    promptFragment:
      'Replace the background with a kraft paper texture: warm brown recycled paper, visible fibrous grain, earthy and natural.',
  },
  {
    id: 'bokeh-warm',
    name: '보케 (웜)',
    type: 'texture',
    thumbnailStyle: 'radial-gradient(ellipse at 30% 40%, #FFD580 0%, #FF9966 40%, #CC6644 100%)',
    promptFragment:
      'Replace the background with warm bokeh blur: soft out-of-focus circular light orbs in golden, amber, and warm orange tones.',
  },
  {
    id: 'bokeh-cool',
    name: '보케 (쿨)',
    type: 'texture',
    thumbnailStyle: 'radial-gradient(ellipse at 60% 40%, #80C8FF 0%, #4499DD 40%, #224488 100%)',
    promptFragment:
      'Replace the background with cool bokeh blur: soft out-of-focus circular light orbs in ice blue, teal, and deep navy tones.',
  },
  {
    id: 'black',
    name: '순흑',
    type: 'solid',
    thumbnailStyle: '#111111',
    promptFragment: 'Replace the background with pure, deep black (#000000) for dramatic contrast.',
  },
];

export const CUSTOM_BACKGROUND: BackgroundPreset = {
  id: 'custom',
  name: '커스텀 업로드',
  type: 'custom',
  thumbnailStyle: 'linear-gradient(135deg, #F0F0F0 0%, #D8D8D8 100%)',
  promptFragment:
    'Replace the background with the second provided reference image as the new background.',
};

export function getBackground(id: string): BackgroundPreset {
  if (id === 'custom') return CUSTOM_BACKGROUND;
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}
