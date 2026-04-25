export interface CoverTextField {
  key: string;
  label: string;
  placeholder: string;
}

export interface CoverTemplate {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  maxPhotos: number;
  style: string;
  editableTexts: CoverTextField[];
}

export const COVER_TEMPLATES: CoverTemplate[] = [
  {
    id: 'paper',
    name: 'PAPER',
    description: '미국 인디 패션지 · 미니멀 브라운',
    imagePath: '/magazine-covers/paper.jpg',
    maxPhotos: 1,
    style: 'minimalist American indie magazine, brown warm tones, large bold serif title at top, clean editorial layout, full-body or bust portrait centered',
    editableTexts: [
      { key: 'title', label: '매거진 타이틀', placeholder: 'PAPER' },
      { key: 'headline', label: '헤드라인', placeholder: 'BREAK THE INTERNET' },
    ],
  },
  {
    id: 'close-up',
    name: 'CLOSE UP',
    description: '영국 틴 셀럽 매거진 · 그린/화이트',
    imagePath: '/magazine-covers/close-up.jpg',
    maxPhotos: 1,
    style: 'British teen celebrity magazine, green and white color scheme, close-up face portrait, playful modern typography, multiple text callouts around edges',
    editableTexts: [
      { key: 'title', label: '매거진 타이틀', placeholder: 'CLOSE UP' },
      { key: 'coverName', label: '커버 인물 이름', placeholder: '홍길동' },
    ],
  },
  {
    id: 'allure',
    name: 'allure',
    description: '미국 뷰티 매거진 · 컬러풀 팝아트',
    imagePath: '/magazine-covers/allure.jpg',
    maxPhotos: 1,
    style: 'allure beauty magazine style, vibrant colorful background with pop art elements, bold lowercase logo, beauty close-up portrait with saturated colors',
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'LIFE IN COLOR' },
      { key: 'subtitle', label: '서브 카피', placeholder: '나만의 색을 찾아서' },
    ],
  },
  {
    id: 'buzz',
    name: 'BUZZ',
    description: '가십 매거진 · 다크 모노크롬',
    imagePath: '/magazine-covers/buzz.jpg',
    maxPhotos: 1,
    style: 'gossip magazine dark moody cover, high contrast black and grey tones, bold geometric logo, dramatic portrait with side lighting',
    editableTexts: [
      { key: 'title', label: '매거진 타이틀', placeholder: 'BUZZ' },
      { key: 'headline', label: '헤드라인', placeholder: 'CELEBRITY SECRETS REVEALED' },
    ],
  },
  {
    id: 'yeoseong-jungang',
    name: '여성中央',
    description: '70년대 한국 여성지 · 빈티지 레트로',
    imagePath: '/magazine-covers/yeoseong-jungang.jpg',
    maxPhotos: 1,
    style: '1970s Korean women magazine vintage style, aged paper texture, retro Korean typography in red and blue, classic portrait with natural styling',
    editableTexts: [
      { key: 'issue', label: '호수', placeholder: "'70 8월호" },
      { key: 'headline', label: '특집 제목', placeholder: '봄 패션 특집' },
    ],
  },
  {
    id: 'fashion',
    name: 'FASHION',
    description: '패션 매거진 · 레드 파워 에디토리얼',
    imagePath: '/magazine-covers/fashion.jpg',
    maxPhotos: 1,
    style: 'bold red fashion magazine cover, dramatic gradient red background, large split typography title, powerful editorial portrait with red outfit, strong graphic design',
    editableTexts: [
      { key: 'headline', label: '메인 카피', placeholder: 'SECRET OF BEAUTY' },
      { key: 'subtitle', label: '서브 카피', placeholder: "it's all about fashion" },
    ],
  },
  {
    id: 'tv-guide',
    name: 'TV가이드',
    description: '90년대 한국 TV가이드 · 레트로',
    imagePath: '/magazine-covers/tv-guide.jpg',
    maxPhotos: 2,
    style: '1990s Korean TV guide magazine, retro Korean broadcasting style, bold red TV가이드 logo, group portrait or duo portrait, cluttered text layout with program listings',
    editableTexts: [
      { key: 'title', label: '특집 제목', placeholder: '이 주의 특집' },
      { key: 'date', label: '날짜', placeholder: '12·26 ~ 1·8' },
    ],
  },
  {
    id: 'jessica',
    name: 'JESSICA',
    description: '홍콩 럭셔리 여성지 · 레드 배경',
    imagePath: '/magazine-covers/jessica.jpg',
    maxPhotos: 1,
    style: 'Hong Kong luxury women magazine JESSICA, vibrant red background, elegant serif logo, glamorous portrait with luxury fashion styling, bilingual Korean/Chinese text',
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'NEW YEAR NEW YOU' },
      { key: 'coverLine', label: '커버 라인', placeholder: 'Pro Tips · 뷰티 & 패션' },
    ],
  },
  {
    id: 'elle-korea',
    name: 'ELLE KOREA',
    description: 'ELLE 코리아 · 현대 에디토리얼',
    imagePath: '/magazine-covers/elle-korea.jpg',
    maxPhotos: 1,
    style: 'ELLE Korea magazine editorial, clean white ELLE logo, modern Korean editorial photography, outdoor urban setting, elegant fashion portrait with natural light',
    editableTexts: [
      { key: 'coverName', label: '커버 인물', placeholder: '민지' },
      { key: 'headline', label: '헤드라인', placeholder: 'BEAUTIFUL CHANGES' },
    ],
  },
  {
    id: 'eci',
    name: 'eCi',
    description: '2000년대 한국 여성지 · 레트로 Y2K',
    imagePath: '/magazine-covers/eci.jpg',
    maxPhotos: 1,
    style: '2000s Korean women magazine Y2K style, retro Korean fashion magazine aesthetic, green accent logo, casual youth portrait, nostalgic early 2000s layout',
    editableTexts: [
      { key: 'issue', label: '호수', placeholder: '7월호' },
      { key: 'headline', label: '특집', placeholder: '여름 패션 & 뷰티' },
    ],
  },
  {
    id: 'yuhaeng-tongsin',
    name: '유행통신',
    description: '2000년대 한국 패션지 · Y2K 스타일',
    imagePath: '/magazine-covers/yuhaeng-tongsin.jpg',
    maxPhotos: 1,
    style: '2002 Korean fashion magazine 유행통신, Y2K early 2000s Korean style, busy colorful layout with many text boxes, trendy Korean celebrity portrait with fashion items',
    editableTexts: [
      { key: 'issue', label: '호수', placeholder: '8월호' },
      { key: 'headline', label: '메인 특집', placeholder: '여름 스타일 가이드' },
    ],
  },
  {
    id: 'frontrow',
    name: 'FRONTROW',
    description: '한국 미니멀 에디토리얼 · 프리미엄',
    imagePath: '/magazine-covers/frontrow.jpg',
    maxPhotos: 1,
    style: 'FRONTROW Korean editorial minimal magazine, clean light grey background, large serif title text overlapping portrait, premium fashion photography, understated luxury aesthetic',
    editableTexts: [
      { key: 'headline', label: '메인 타이틀', placeholder: 'The Wintry City' },
      { key: 'subtitle', label: '서브 카피', placeholder: '프리미엄 컬렉션으로 그려낸 계절' },
    ],
  },
  {
    id: 'bazaar-korea',
    name: "Harper's BAZAAR",
    description: '하퍼스 바자 코리아 · 하이패션',
    imagePath: '/magazine-covers/bazaar-korea.jpg',
    maxPhotos: 1,
    style: "Harper's BAZAAR Korea high fashion cover, clean white/grey background, large classic BAZAAR logo, bold fashion editorial portrait, handwritten style accent text, luxury beauty styling",
    editableTexts: [
      { key: 'coverName', label: '커버 인물', placeholder: '제니' },
      { key: 'headline', label: '헤드라인', placeholder: "WHAT'S NEXT?" },
    ],
  },
  {
    id: 'kpop-life',
    name: 'KPOP LIFE',
    description: 'K팝 팬 매거진 · 화이트 클린',
    imagePath: '/magazine-covers/kpop-life.jpg',
    maxPhotos: 1,
    style: 'KPOP LIFE fan magazine clean white layout, French text accents, full-body casual portrait, simple sans-serif typography, clean bright editorial style',
    editableTexts: [
      { key: 'coverName', label: '커버 아티스트', placeholder: '아티스트 이름' },
      { key: 'headline', label: '헤드라인', placeholder: 'No Limits' },
    ],
  },
  {
    id: 'time',
    name: 'TIME',
    description: 'TIME 매거진 · 뉴스 아이코닉',
    imagePath: '/magazine-covers/time.jpg',
    maxPhotos: 1,
    style: 'TIME magazine iconic cover, bold red TIME logo, dark dramatic portrait with serious expression, minimal white text overlay, news magazine gravitas and authority',
    editableTexts: [
      { key: 'headline', label: '메인 타이틀', placeholder: 'THE NEGOTIATOR' },
      { key: 'subtitle', label: '설명 문구', placeholder: '변화를 이끄는 리더' },
    ],
  },
  {
    id: 'beauty-style',
    name: 'BEAUTY STYLE',
    description: '뷰티 커머셜 · 퍼플 무드',
    imagePath: '/magazine-covers/beauty-style.jpg',
    maxPhotos: 1,
    style: 'beauty style commercial magazine, purple/violet background color, full-body commercial portrait, bright product-style lighting, shopping and lifestyle magazine aesthetic',
    editableTexts: [
      { key: 'headline', label: '메인 카피', placeholder: 'BEAUTY STYLE' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'Woman Shopping' },
    ],
  },
  {
    id: 'cosmopolitan',
    name: 'Cosmopolitan',
    description: '코스모폴리탄 차이나 · 글로벌 패션',
    imagePath: '/magazine-covers/cosmopolitan.jpg',
    maxPhotos: 1,
    style: 'Cosmopolitan China magazine cover, bold Cosmopolitan/时尚 bilingual logo, glamorous celebrity portrait in white outfit, high gloss fashion photography, vibrant editorial typography',
    editableTexts: [
      { key: 'headline', label: '메인 카피', placeholder: 'Number 1? No! Only 1!' },
      { key: 'coverName', label: '커버 인물', placeholder: '앤젤라베이비' },
    ],
  },
  {
    id: 'rolling-stone',
    name: 'Rolling Stone',
    description: '롤링스톤 재팬 · 뮤직 아이코닉',
    imagePath: '/magazine-covers/rolling-stone.jpg',
    maxPhotos: 1,
    style: 'Rolling Stone Japan magazine cover, classic Rolling Stone script logo, moody dark portrait with leather jacket, music magazine editorial, dramatic low-key lighting',
    editableTexts: [
      { key: 'coverName', label: '아티스트', placeholder: '정국' },
      { key: 'headline', label: '헤드라인', placeholder: 'No Limits' },
    ],
  },
  {
    id: 'vogue-korea',
    name: 'VOGUE KOREA',
    description: 'VOGUE 코리아 · 현대 하이패션',
    imagePath: '/magazine-covers/vogue-korea.jpg',
    maxPhotos: 1,
    style: 'VOGUE Korea modern fashion cover, classic VOGUE logo, high fashion editorial portrait, bold typographic layout with Korean text accents, sophisticated luxury aesthetic',
    editableTexts: [
      { key: 'coverName', label: '커버 인물', placeholder: '크리스탈' },
      { key: 'headline', label: '헤드라인', placeholder: '2024 WOMAN NOW' },
    ],
  },
  {
    id: 'didot',
    name: 'D/I/D/O/T',
    description: '타이포그래피 실험적 · 흑백 모노크롬',
    imagePath: '/magazine-covers/didot.jpg',
    maxPhotos: 1,
    style: 'experimental typography fashion magazine D/I/D/O/T, black and white high contrast, deconstructed serif type layout, editorial portrait mixed with typography, avantgarde design aesthetic',
    editableTexts: [
      { key: 'title', label: '매거진명', placeholder: 'D/I/D/O/T' },
      { key: 'headline', label: '메인 카피', placeholder: 'ISSUE / 67' },
    ],
  },
];

export function getCoverTemplate(id: string): CoverTemplate | undefined {
  return COVER_TEMPLATES.find((t) => t.id === id);
}
