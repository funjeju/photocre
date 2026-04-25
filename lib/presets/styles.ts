export type StylePreset = {
  id: string;
  name: string;
  description: string;
  thumbnailSrc: string;
  promptFragment: string;
};

export const STYLES: StylePreset[] = [
  {
    id: 'beauty',
    name: '뽀샤시',
    description: '밝고 선명한 뷰티 보정',
    thumbnailSrc: '/style-samples/none.png',
    promptFragment:
      'Apply a soft beauty enhancement to this photo: brighten the overall exposure, smooth and even out skin tone, add a gentle soft-glow effect, boost clarity and vibrancy slightly. Keep it natural — the result should look like a professionally retouched portrait photo, not an illustration.',
  },
  {
    id: 'ghibli',
    name: '지브리풍',
    description: '수채화, 따뜻한 팔레트',
    thumbnailSrc: '/style-samples/ghibli.png',
    promptFragment:
      'Transform into Studio Ghibli animation style: soft watercolor painting, warm and lush color palette, hand-drawn feel with gentle brushwork, dreamy and whimsical atmosphere.',
  },
  {
    id: 'pixar-3d',
    name: '픽사 3D',
    description: '귀여운 3D 렌더링',
    thumbnailSrc: '/style-samples/pixar-3d.png',
    promptFragment:
      'Transform into Pixar-style 3D render: rounded, expressive features, stylized subsurface scattering on skin, bright and vibrant colors, professional CGI quality.',
  },
  {
    id: 'anime',
    name: '애니메이션',
    description: '클린 라인아트, 셀 셰이딩',
    thumbnailSrc: '/style-samples/anime.png',
    promptFragment:
      'Transform into anime illustration: clean crisp line art, cel shading with flat color fills, large expressive eyes, high-contrast lighting typical of Japanese animation.',
  },
  {
    id: 'disney-3d',
    name: '디즈니 3D',
    description: '디즈니 수채화 스타일',
    thumbnailSrc: '/style-samples/disney-3d.png',
    promptFragment:
      'Transform into Disney Pixar 3D avatar style: enlarged expressive eyes, smooth skin rendering, idealized proportions, bright cheerful colors, premium animation quality.',
  },
  {
    id: 'oil-painting',
    name: '유화',
    description: '붓 터치, 임파스토',
    thumbnailSrc: '/style-samples/oil-painting.png',
    promptFragment:
      'Transform into oil painting: visible impasto brush strokes, rich saturated colors, classical portrait painting style, textured canvas surface.',
  },
  {
    id: 'pencil-sketch',
    name: '연필 스케치',
    description: '모노크롬 선화',
    thumbnailSrc: '/style-samples/pencil-sketch.png',
    promptFragment:
      'Transform into pencil sketch: detailed graphite linework, hatching and cross-hatching for shading, monochrome, hand-drawn sketchbook quality.',
  },
];

export function getStyle(id: string): StylePreset {
  return STYLES.find((s) => s.id === id) ?? STYLES[0];
}
