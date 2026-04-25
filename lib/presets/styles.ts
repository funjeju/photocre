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
      'Retouch this photo with a soft beauty effect: brighten exposure, smooth skin tone evenly, add a gentle soft-glow, boost clarity and vibrancy. Must remain a photorealistic portrait — do NOT convert to illustration or change facial structure.',
  },
  {
    id: 'ghibli',
    name: '지브리풍',
    description: '수채화, 따뜻한 팔레트',
    thumbnailSrc: '/style-samples/ghibli.png',
    promptFragment:
      'Apply Studio Ghibli watercolor painting rendering: soft hand-drawn brushwork, warm lush color palette, gentle watercolor texture. Change ONLY the painting style — do NOT alter face shape, proportions, or clothing.',
  },
  {
    id: 'pixar-3d',
    name: '픽사 3D',
    description: '귀여운 3D 렌더링',
    thumbnailSrc: '/style-samples/pixar-3d.png',
    promptFragment:
      'Apply Pixar 3D CGI rendering technique: smooth subsurface scattering on skin, soft studio lighting, vibrant color grading, premium CGI texture quality. Change ONLY the rendering style — do NOT alter face shape or proportions.',
  },
  {
    id: 'anime',
    name: '애니메이션',
    description: '클린 라인아트, 셀 셰이딩',
    thumbnailSrc: '/style-samples/anime.png',
    promptFragment:
      'Apply Japanese anime illustration rendering: clean crisp line art, cel shading with flat color fills, high-contrast lighting. Change ONLY the drawing style — do NOT alter face shape or proportions.',
  },
  {
    id: 'disney-3d',
    name: '디즈니 3D',
    description: '디즈니 3D 렌더링',
    thumbnailSrc: '/style-samples/disney-3d.png',
    promptFragment:
      'Apply Disney 3D CGI rendering technique: smooth warm skin shading, bright cheerful lighting, rich color saturation, premium Disney animation texture quality. Change ONLY the rendering style — do NOT alter face shape, eye size, or proportions.',
  },
  {
    id: 'oil-painting',
    name: '유화',
    description: '붓 터치, 임파스토',
    thumbnailSrc: '/style-samples/oil-painting.png',
    promptFragment:
      'Apply oil painting rendering: visible impasto brush strokes, rich saturated colors, classical portrait painting texture, canvas surface. Change ONLY the painting style — do NOT alter face shape or proportions.',
  },
  {
    id: 'pencil-sketch',
    name: '연필 스케치',
    description: '모노크롬 선화',
    thumbnailSrc: '/style-samples/pencil-sketch.png',
    promptFragment:
      'Apply pencil sketch rendering: detailed graphite linework, hatching and cross-hatching for shading, monochrome. Change ONLY the drawing style — do NOT alter face shape or proportions.',
  },
];

export function getStyle(id: string): StylePreset {
  return STYLES.find((s) => s.id === id) ?? STYLES[0];
}
