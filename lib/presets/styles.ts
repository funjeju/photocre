export type StylePreset = {
  id: string;
  name: string;
  description: string;
  thumbnailSrc: string;
};

export const STYLES: StylePreset[] = [
  {
    id: 'beauty',
    name: '뽀샤시',
    description: '밝고 선명한 뷰티 보정',
    thumbnailSrc: '/style-samples/none.png',
  },
  {
    id: 'ghibli',
    name: '지브리풍',
    description: '수채화, 따뜻한 팔레트',
    thumbnailSrc: '/style-samples/ghibli.png',
  },
  {
    id: 'pixar-3d',
    name: '픽사 3D',
    description: '귀여운 3D 렌더링',
    thumbnailSrc: '/style-samples/pixar-3d.png',
  },
  {
    id: 'anime',
    name: '애니메이션',
    description: '클린 라인아트, 셀 셰이딩',
    thumbnailSrc: '/style-samples/anime.png',
  },
  {
    id: 'disney-3d',
    name: '디즈니 3D',
    description: '디즈니 3D 렌더링',
    thumbnailSrc: '/style-samples/disney-3d.png',
  },
  {
    id: 'oil-painting',
    name: '유화',
    description: '붓 터치, 임파스토',
    thumbnailSrc: '/style-samples/oil-painting.png',
  },
  {
    id: 'pencil-sketch',
    name: '연필 스케치',
    description: '모노크롬 선화',
    thumbnailSrc: '/style-samples/pencil-sketch.png',
  },
];

export function getStyle(id: string): StylePreset {
  return STYLES.find((s) => s.id === id) ?? STYLES[0];
}
