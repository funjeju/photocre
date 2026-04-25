export type FontPreset = {
  family: string;
  label: string;
  lang: 'ko' | 'en';
  weights: number[];
  googleFontsName: string;
};

export const FONTS_KO: FontPreset[] = [
  { family: 'Black Han Sans', label: '블랙한산스 (울트라볼드)', lang: 'ko', weights: [400], googleFontsName: 'Black+Han+Sans' },
  { family: 'Jua', label: '주아 (둥근볼드)', lang: 'ko', weights: [400], googleFontsName: 'Jua' },
  { family: 'Do Hyeon', label: '도현 (모던볼드)', lang: 'ko', weights: [400], googleFontsName: 'Do+Hyeon' },
  { family: 'Nanum Gothic', label: '나눔고딕 (고딕)', lang: 'ko', weights: [400, 700], googleFontsName: 'Nanum+Gothic:wght@400;700' },
  { family: 'Noto Sans KR', label: '노토산스 (산세리프)', lang: 'ko', weights: [400, 700, 900], googleFontsName: 'Noto+Sans+KR:wght@400;700;900' },
  { family: 'Noto Serif KR', label: '노토세리프 (명조)', lang: 'ko', weights: [400, 700], googleFontsName: 'Noto+Serif+KR:wght@400;700' },
  { family: 'Nanum Myeongjo', label: '나눔명조 (명조)', lang: 'ko', weights: [400, 700], googleFontsName: 'Nanum+Myeongjo:wght@400;700' },
  { family: 'Gamja Flower', label: '감자꽃 (손글씨)', lang: 'ko', weights: [400], googleFontsName: 'Gamja+Flower' },
  { family: 'Sunflower', label: '해바라기 (라운드)', lang: 'ko', weights: [300, 500, 700], googleFontsName: 'Sunflower:wght@300;500;700' },
  { family: 'IBM Plex Sans KR', label: 'IBM플렉스 (모던)', lang: 'ko', weights: [400, 700], googleFontsName: 'IBM+Plex+Sans+KR:wght@400;700' },
  { family: 'Song Myung', label: '송명 (클래식명조)', lang: 'ko', weights: [400], googleFontsName: 'Song+Myung' },
  { family: 'Gowun Dodum', label: '고운돋움 (라이트)', lang: 'ko', weights: [400], googleFontsName: 'Gowun+Dodum' },
  { family: 'Nanum Pen Script', label: '나눔펜 (손글씨)', lang: 'ko', weights: [400], googleFontsName: 'Nanum+Pen+Script' },
  { family: 'Gaegu', label: '개구 (귀여운)', lang: 'ko', weights: [400, 700], googleFontsName: 'Gaegu:wght@400;700' },
];

export const FONTS_EN: FontPreset[] = [
  { family: 'Bebas Neue', label: 'Bebas Neue (압축볼드)', lang: 'en', weights: [400], googleFontsName: 'Bebas+Neue' },
  { family: 'Anton', label: 'Anton (울트라볼드)', lang: 'en', weights: [400], googleFontsName: 'Anton' },
  { family: 'Oswald', label: 'Oswald (콘덴스드)', lang: 'en', weights: [400, 600, 700], googleFontsName: 'Oswald:wght@400;600;700' },
  { family: 'Archivo Black', label: 'Archivo Black (헤비)', lang: 'en', weights: [400], googleFontsName: 'Archivo+Black' },
  { family: 'Fjalla One', label: 'Fjalla One (압축헤비)', lang: 'en', weights: [400], googleFontsName: 'Fjalla+One' },
  { family: 'Black Ops One', label: 'Black Ops One (밀리터리)', lang: 'en', weights: [400], googleFontsName: 'Black+Ops+One' },
  { family: 'Alfa Slab One', label: 'Alfa Slab One (슬랩)', lang: 'en', weights: [400], googleFontsName: 'Alfa+Slab+One' },
  { family: 'Ultra', label: 'Ultra (울트라세리프)', lang: 'en', weights: [400], googleFontsName: 'Ultra' },
  { family: 'Squada One', label: 'Squada One (기하학)', lang: 'en', weights: [400], googleFontsName: 'Squada+One' },
  { family: 'Teko', label: 'Teko (타이트콘덴스드)', lang: 'en', weights: [400, 500, 700], googleFontsName: 'Teko:wght@400;500;700' },
  { family: 'Playfair Display', label: 'Playfair Display (럭셔리세리프)', lang: 'en', weights: [400, 700], googleFontsName: 'Playfair+Display:wght@400;700' },
  { family: 'Montserrat', label: 'Montserrat (모던산세리프)', lang: 'en', weights: [400, 700, 900], googleFontsName: 'Montserrat:wght@400;700;900' },
  { family: 'Caveat', label: 'Caveat (손글씨)', lang: 'en', weights: [400, 700], googleFontsName: 'Caveat:wght@400;700' },
  { family: 'Pacifico', label: 'Pacifico (레트로손글씨)', lang: 'en', weights: [400], googleFontsName: 'Pacifico' },
  { family: 'Righteous', label: 'Righteous (라운드볼드)', lang: 'en', weights: [400], googleFontsName: 'Righteous' },
];

export const ALL_FONTS = [...FONTS_KO, ...FONTS_EN];

export function getFont(family: string): FontPreset {
  return ALL_FONTS.find((f) => f.family === family) ?? FONTS_KO[0];
}

const loadedFonts = new Set<string>();

export async function loadGoogleFont(font: FontPreset): Promise<void> {
  if (typeof document === 'undefined') return;
  if (!loadedFonts.has(font.family)) {
    loadedFonts.add(font.family);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${font.googleFontsName}&display=swap`;
    document.head.appendChild(link);
  }
  await document.fonts.load(`700 24px "${font.family}"`);
}
