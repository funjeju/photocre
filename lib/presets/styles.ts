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
      'Transform this photo with professional beauty retouching: brighten overall exposure by +1.5 stops, apply heavy skin smoothing and pore removal, add strong soft-focus glow effect, boost saturation and vibrancy significantly, enhance eye brightness. Keep photorealistic — no illustration or painting conversion.',
  },
  {
    id: 'ghibli',
    name: '지브리풍',
    description: '수채화, 따뜻한 팔레트',
    thumbnailSrc: '/style-samples/ghibli.png',
    promptFragment:
      'COMPLETELY transform this photo into Studio Ghibli hand-drawn animation style. The entire image must look like a frame from a Miyazaki film — soft watercolor textures, warm amber-and-green palette, gentle hand-painted brushwork visible throughout, simplified but expressive facial features drawn in Ghibli style. This is a full art style conversion, NOT a filter.',
  },
  {
    id: 'pixar-3d',
    name: '픽사 3D',
    description: '귀여운 3D 렌더링',
    thumbnailSrc: '/style-samples/pixar-3d.png',
    promptFragment:
      'COMPLETELY transform this photo into Pixar 3D CGI animation style. The entire image must look like a frame from a Pixar movie — smooth subsurface scattering skin, large expressive CGI eyes, soft studio three-point lighting, vibrant saturated colors, premium Pixar render quality with visible 3D depth and texture. This is a full 3D CGI conversion, NOT a filter.',
  },
  {
    id: 'anime',
    name: '애니메이션',
    description: '클린 라인아트, 셀 셰이딩',
    thumbnailSrc: '/style-samples/anime.png',
    promptFragment:
      'COMPLETELY transform this photo into Japanese anime illustration style. The entire image must look like a frame from a high-quality anime series — clean crisp black outlines, flat cel-shaded colors, large stylized anime eyes, simplified smooth skin with anime-style shading, vivid saturated palette. This is a full anime art conversion, NOT a filter.',
  },
  {
    id: 'disney-3d',
    name: '디즈니 3D',
    description: '디즈니 3D 렌더링',
    thumbnailSrc: '/style-samples/disney-3d.png',
    promptFragment:
      'COMPLETELY transform this photo into Disney 3D CGI animation style. The entire image must look like a frame from a Disney animated film — warm glowing skin with Disney-characteristic smooth shading, bright cheerful studio lighting, slightly enlarged expressive eyes in Disney style, rich color saturation, premium Disney render quality. This is a full 3D CGI conversion, NOT a filter.',
  },
  {
    id: 'oil-painting',
    name: '유화',
    description: '붓 터치, 임파스토',
    thumbnailSrc: '/style-samples/oil-painting.png',
    promptFragment:
      'COMPLETELY transform this photo into a classical oil painting. The entire image must look like a hand-painted portrait on canvas — thick impasto brushstrokes visible throughout, rich deeply saturated colors, traditional portrait painting composition, visible canvas texture beneath, painterly rendering of all surfaces including skin hair and clothing. This is a full painting conversion, NOT a filter.',
  },
  {
    id: 'pencil-sketch',
    name: '연필 스케치',
    description: '모노크롬 선화',
    thumbnailSrc: '/style-samples/pencil-sketch.png',
    promptFragment:
      'COMPLETELY transform this photo into a detailed pencil sketch drawing. The entire image must look like an artist\'s hand-drawn graphite sketch — monochrome with only pencil lines and shading, visible hatching and cross-hatching throughout, paper texture showing through, no photographic elements remaining. This is a full drawing conversion, NOT a filter.',
  },
];

export function getStyle(id: string): StylePreset {
  return STYLES.find((s) => s.id === id) ?? STYLES[0];
}
