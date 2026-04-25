interface ThumbnailCss {
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
}

export type StylePreset = {
  id: string;
  name: string;
  description: string;
  thumbnailBg: string;
  thumbnailSrc?: string;
  thumbnailCss?: ThumbnailCss;
  promptFragment: string;
};

// 참조 이미지: /public/style-samples/style-ref.jpg
// 레이아웃: 4열 × 2행 그리드
// 행1: 오리지널, 지브리, 픽사3D, 애니메이션
// 행2: 디즈니3D/수채화, 유화, 연필스케치, 시네마틱/폴라로이드
const REF = (col: 0 | 1 | 2 | 3, row: 0 | 1): ThumbnailCss => ({
  backgroundImage: "url('/style-samples/style-ref.jpg')",
  backgroundSize: '400% 200%',
  backgroundPosition: `${col === 0 ? 0 : col === 1 ? 33.33 : col === 2 ? 66.67 : 100}% ${row === 0 ? 0 : 100}%`,
  backgroundRepeat: 'no-repeat',
});

export const STYLES: StylePreset[] = [
  {
    id: 'none',
    name: '변형 없음',
    description: '원본 사진 그대로',
    thumbnailBg: 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)',
    thumbnailSrc: '/style-samples/none.svg',
    thumbnailCss: REF(0, 0),
    promptFragment: 'Preserve the original photographic style without any artistic transformation.',
  },
  {
    id: 'ghibli',
    name: '지브리풍',
    description: '수채화, 따뜻한 팔레트',
    thumbnailBg: 'linear-gradient(135deg, #B8D4A8 0%, #D4E8C0 50%, #E8D4A0 100%)',
    thumbnailSrc: '/style-samples/ghibli.svg',
    thumbnailCss: REF(1, 0),
    promptFragment:
      'Transform into Studio Ghibli animation style: soft watercolor painting, warm and lush color palette, hand-drawn feel with gentle brushwork, dreamy and whimsical atmosphere.',
  },
  {
    id: 'pixar-3d',
    name: '픽사 3D',
    description: '귀여운 3D 렌더링',
    thumbnailBg: 'linear-gradient(135deg, #FFD4A0 0%, #FFA060 100%)',
    thumbnailSrc: '/style-samples/pixar-3d.svg',
    thumbnailCss: REF(2, 0),
    promptFragment:
      'Transform into Pixar-style 3D render: rounded, expressive features, stylized subsurface scattering on skin, bright and vibrant colors, professional CGI quality.',
  },
  {
    id: 'anime',
    name: '애니메이션',
    description: '클린 라인아트, 셀 셰이딩',
    thumbnailBg: 'linear-gradient(135deg, #C0D8F0 0%, #A0C0E8 100%)',
    thumbnailSrc: '/style-samples/anime.svg',
    thumbnailCss: REF(3, 0),
    promptFragment:
      'Transform into anime illustration: clean crisp line art, cel shading with flat color fills, large expressive eyes, high-contrast lighting typical of Japanese animation.',
  },
  {
    id: 'disney-3d',
    name: '디즈니 3D',
    description: '디즈니 아바타 스타일',
    thumbnailBg: 'linear-gradient(135deg, #F0C8D0 0%, #E0A0B0 100%)',
    thumbnailSrc: '/style-samples/disney-3d.svg',
    thumbnailCss: REF(0, 1),
    promptFragment:
      'Transform into Disney Pixar 3D avatar style: enlarged expressive eyes, smooth skin rendering, idealized proportions, bright cheerful colors, premium animation quality.',
  },
  {
    id: 'watercolor',
    name: '수채화',
    description: '부드러운 물감 번짐',
    thumbnailBg: 'linear-gradient(135deg, #D4E8F0 0%, #C0D4E8 50%, #E8D4C0 100%)',
    thumbnailSrc: '/style-samples/watercolor.svg',
    thumbnailCss: REF(0, 1),
    promptFragment:
      'Transform into loose watercolor painting: visible water-bleed edges, translucent layered washes, paper texture showing through, spontaneous brush marks.',
  },
  {
    id: 'oil-painting',
    name: '유화',
    description: '붓 터치, 임파스토',
    thumbnailBg: 'linear-gradient(135deg, #C8A870 0%, #A87850 100%)',
    thumbnailSrc: '/style-samples/oil-painting.svg',
    thumbnailCss: REF(1, 1),
    promptFragment:
      'Transform into oil painting: visible impasto brush strokes, rich saturated colors, classical portrait painting style, textured canvas surface.',
  },
  {
    id: 'pencil-sketch',
    name: '연필 스케치',
    description: '모노크롬 선화',
    thumbnailBg: 'linear-gradient(135deg, #F0F0F0 0%, #D0D0D0 100%)',
    thumbnailSrc: '/style-samples/pencil-sketch.svg',
    thumbnailCss: REF(2, 1),
    promptFragment:
      'Transform into pencil sketch: detailed graphite linework, hatching and cross-hatching for shading, monochrome, hand-drawn sketchbook quality.',
  },
  {
    id: 'cinematic',
    name: '시네마틱',
    description: '필름 그레인, 드라마틱 조명',
    thumbnailBg: 'linear-gradient(135deg, #2C2C3C 0%, #1A1A28 100%)',
    thumbnailSrc: '/style-samples/cinematic.svg',
    thumbnailCss: REF(3, 1),
    promptFragment:
      'Apply cinematic photography treatment: dramatic directional lighting, subtle film grain, slight color grading with teal and orange tones, letterbox aspect ratio feel, movie still quality.',
  },
  {
    id: 'polaroid-photo',
    name: '폴라로이드 사진',
    description: '라이트 릭, 빈티지 톤',
    thumbnailBg: 'linear-gradient(135deg, #F5E8D0 0%, #E8D4B0 100%)',
    thumbnailSrc: '/style-samples/polaroid-photo.svg',
    thumbnailCss: REF(3, 1),
    promptFragment:
      'Apply vintage polaroid photograph effect: slight light leak in corner, faded color saturation, warm yellowish tint, slightly overexposed highlights, analog instant photo feel.',
  },
];

export function getStyle(id: string): StylePreset {
  return STYLES.find((s) => s.id === id) ?? STYLES[0];
}
