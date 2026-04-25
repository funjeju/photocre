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
      'Apply professional beauty photo retouching to this image. Keep it fully photorealistic. Smooth and brighten the skin, add a soft luminous glow, boost overall brightness and color vibrancy. Do NOT change facial proportions, eye size, or facial structure in any way.',
  },
  {
    id: 'ghibli',
    name: '지브리풍',
    description: '수채화, 따뜻한 팔레트',
    thumbnailSrc: '/style-samples/ghibli.png',
    promptFragment:
      'Repaint this entire image in Studio Ghibli hand-drawn animation style. Every part of the image — skin, hair, clothing, background — must be rendered as soft hand-painted watercolor illustration with warm amber tones, as seen in Miyazaki films. Do NOT enlarge or distort facial features; preserve the subject\'s facial proportions exactly, only change the rendering style.',
  },
  {
    id: 'pixar-3d',
    name: '픽사 3D',
    description: '귀여운 3D 렌더링',
    thumbnailSrc: '/style-samples/pixar-3d.png',
    promptFragment:
      'Render this entire image in Pixar 3D CGI style. Every surface — skin, hair, fabric, background — must look like premium Pixar CGI with subsurface scattering on skin, soft studio lighting, and vibrant color grading. Do NOT enlarge or reshape any facial features; preserve the subject\'s facial proportions exactly, only convert the surface rendering to 3D CGI.',
  },
  {
    id: 'anime',
    name: '애니메이션',
    description: '클린 라인아트, 셀 셰이딩',
    thumbnailSrc: '/style-samples/anime.png',
    promptFragment:
      'Redraw this entire image in Japanese anime illustration style. Every part — skin, hair, clothing, background — must use clean crisp line art with cel-shaded flat colors and anime-style lighting. Do NOT enlarge or distort facial features; preserve the subject\'s facial proportions exactly, only change the rendering style to anime illustration.',
  },
  {
    id: 'disney-3d',
    name: '디즈니 3D',
    description: '디즈니 3D 렌더링',
    thumbnailSrc: '/style-samples/disney-3d.png',
    promptFragment:
      'Render this entire image in Disney 3D CGI animation style. Every surface — skin, hair, fabric, background — must look like premium Disney CGI with warm smooth shading, bright cheerful studio lighting, and rich color saturation. Do NOT enlarge or reshape any facial features; preserve the subject\'s facial proportions exactly, only convert the surface rendering to Disney 3D CGI.',
  },
  {
    id: 'oil-painting',
    name: '유화',
    description: '붓 터치, 임파스토',
    thumbnailSrc: '/style-samples/oil-painting.png',
    promptFragment:
      'Repaint this entire image as a classical oil painting on canvas. Every surface must show thick visible impasto brushstrokes, rich saturated oil paint colors, and canvas texture. Do NOT change facial proportions or structure; preserve the subject\'s features exactly, only convert the rendering to oil painting style.',
  },
  {
    id: 'pencil-sketch',
    name: '연필 스케치',
    description: '모노크롬 선화',
    thumbnailSrc: '/style-samples/pencil-sketch.png',
    promptFragment:
      'Redraw this entire image as a detailed graphite pencil sketch. Every part must be rendered in monochrome pencil linework with hatching and cross-hatching for shading, on paper texture. No photographic elements should remain. Do NOT change facial proportions; preserve the subject\'s features exactly, only convert to pencil sketch rendering.',
  },
];

export function getStyle(id: string): StylePreset {
  return STYLES.find((s) => s.id === id) ?? STYLES[0];
}
