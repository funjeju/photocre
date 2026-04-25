export type FontPreset = {
  family: string;
  label: string;
  lang: 'ko' | 'en';
  weights: number[];
  googleFontsName: string;
};

export const FONTS_KO: FontPreset[] = [
  { family: 'Noto Sans KR', label: '노토 산스', lang: 'ko', weights: [400, 500, 700], googleFontsName: 'Noto+Sans+KR:wght@400;500;700' },
  { family: 'Noto Serif KR', label: '노토 세리프', lang: 'ko', weights: [400, 700], googleFontsName: 'Noto+Serif+KR:wght@400;700' },
  { family: 'Nanum Gothic', label: '나눔 고딕', lang: 'ko', weights: [400, 700], googleFontsName: 'Nanum+Gothic:wght@400;700' },
  { family: 'Nanum Myeongjo', label: '나눔 명조', lang: 'ko', weights: [400, 700], googleFontsName: 'Nanum+Myeongjo:wght@400;700' },
  { family: 'Nanum Pen Script', label: '나눔 펜', lang: 'ko', weights: [400], googleFontsName: 'Nanum+Pen+Script' },
  { family: 'Black Han Sans', label: '블랙 한 산스', lang: 'ko', weights: [400], googleFontsName: 'Black+Han+Sans' },
  { family: 'Jua', label: '주아', lang: 'ko', weights: [400], googleFontsName: 'Jua' },
  { family: 'Do Hyeon', label: '도현', lang: 'ko', weights: [400], googleFontsName: 'Do+Hyeon' },
  { family: 'Gowun Dodum', label: '고운 돋움', lang: 'ko', weights: [400], googleFontsName: 'Gowun+Dodum' },
  { family: 'Gaegu', label: '개구', lang: 'ko', weights: [400, 700], googleFontsName: 'Gaegu:wght@400;700' },
];

export const FONTS_EN: FontPreset[] = [
  { family: 'Inter', label: 'Inter', lang: 'en', weights: [400, 500, 700], googleFontsName: 'Inter:wght@400;500;700' },
  { family: 'Playfair Display', label: 'Playfair Display', lang: 'en', weights: [400, 700], googleFontsName: 'Playfair+Display:wght@400;700' },
  { family: 'Montserrat', label: 'Montserrat', lang: 'en', weights: [400, 700], googleFontsName: 'Montserrat:wght@400;700' },
  { family: 'DM Sans', label: 'DM Sans', lang: 'en', weights: [400, 500], googleFontsName: 'DM+Sans:wght@400;500' },
  { family: 'Space Grotesk', label: 'Space Grotesk', lang: 'en', weights: [400, 500], googleFontsName: 'Space+Grotesk:wght@400;500' },
  { family: 'Caveat', label: 'Caveat', lang: 'en', weights: [400, 700], googleFontsName: 'Caveat:wght@400;700' },
  { family: 'Pacifico', label: 'Pacifico', lang: 'en', weights: [400], googleFontsName: 'Pacifico' },
  { family: 'Bebas Neue', label: 'Bebas Neue', lang: 'en', weights: [400], googleFontsName: 'Bebas+Neue' },
  { family: 'Dela Gothic One', label: 'Dela Gothic One', lang: 'en', weights: [400], googleFontsName: 'Dela+Gothic+One' },
  { family: 'Archivo', label: 'Archivo', lang: 'en', weights: [400, 700], googleFontsName: 'Archivo:wght@400;700' },
];

export const ALL_FONTS = [...FONTS_KO, ...FONTS_EN];

export function getFont(family: string): FontPreset {
  return ALL_FONTS.find((f) => f.family === family) ?? FONTS_KO[0];
}

// 동적 Google Fonts 로드 (선택 시에만)
const loadedFonts = new Set<string>();

export function loadGoogleFont(font: FontPreset) {
  if (typeof document === 'undefined') return;
  if (loadedFonts.has(font.family)) return;
  loadedFonts.add(font.family);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.googleFontsName}&display=swap`;
  document.head.appendChild(link);
}
