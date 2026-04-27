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
  layoutDescription: string;
  editableTexts: CoverTextField[];
}

export const COVER_TEMPLATES: CoverTemplate[] = [
  {
    id: 'cov1',
    name: 'STYLE',
    description: '미래주의 패션 · 실버 메탈릭 · 블루',
    imagePath: '/magazine-covers/cov1.png',
    maxPhotos: 1,
    style: 'futuristic fashion magazine cover, bold cobalt blue background, large silver metallic bold title at top, full-body portrait with dramatic sci-fi styling',
    layoutDescription: `COMPOSITION BLUEPRINT — STYLE magazine:
- FRAMING: Full-body portrait; head to feet or near-full figure visible
- SCALE: Person occupies 70–80% of the frame height
- VERTICAL POSITION: Head at approximately 15–20% from top; body extends near the bottom
- HORIZONTAL POSITION: Model centered; slight dynamic stance
- POSE: Confident, forward-facing futuristic pose; strong eye contact; arms at sides or in a geometric position
- BACKGROUND: Solid deep cobalt blue; clean, no environment
- TEXT LAYOUT: Large bold magazine title "STYLE" at the top spanning 60–70% of frame width. A two-line bold headline in white at the bottom of the frame (bottom 25%). Minimal text elements.
- OVERLAP: Title above head; bottom headline overlaps lower body slightly`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'VISION OF ELEGANCE' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'NEW PERSPECTIVE COLLECTION' },
    ],
  },
  {
    id: 'cov2',
    name: '방송가이드',
    description: '90년대 한국 방송 가이드 · 레트로',
    imagePath: '/magazine-covers/cov2.png',
    maxPhotos: 2,
    style: '1990s Korean broadcasting guide magazine, retro Korean TV magazine aesthetic, cluttered Korean text layout, two celebrity portrait, warm aged tones',
    layoutDescription: `COMPOSITION BLUEPRINT — 방송가이드 magazine (TWO PEOPLE):
- FRAMING: Waist-up portrait of two people side by side
- SCALE: Together the two subjects fill 65–75% of the frame height
- VERTICAL POSITION: Upper bodies centered; heads at approximately 20–30% from top
- HORIZONTAL POSITION: One person left-center, one right-center; overlapping slightly
- POSE: Both subjects facing camera; casual, approachable TV celebrity expression
- BACKGROUND: Neutral studio or simple colored background
- TEXT LAYOUT: Bold Korean magazine title "방송가이드" at top-left. Issue date and small text in corners. Multiple Korean text callouts and program listings fill the bottom 30% of the frame and sides
- OVERLAP: Program listings below waist; faces kept clear`,
    editableTexts: [
      { key: 'title', label: '특집 제목', placeholder: '스타 인터뷰' },
      { key: 'date', label: '날짜', placeholder: '9월 1일호' },
    ],
  },
  {
    id: 'cov3',
    name: 'CLARA',
    description: '현대 한국 에디토리얼 · 클린 레이아웃',
    imagePath: '/magazine-covers/cov3.png',
    maxPhotos: 1,
    style: 'modern Korean editorial fashion magazine CLARA, clean white/neutral background, elegant serif logo, waist-up portrait in solid color outfit, multiple side text callouts',
    layoutDescription: `COMPOSITION BLUEPRINT — CLARA magazine:
- FRAMING: Waist-up portrait; head through waist clearly visible
- SCALE: Person occupies approximately 70–80% of the frame height
- VERTICAL POSITION: Head at approximately 15–20% from top; waist near 85% from top
- HORIZONTAL POSITION: Model centered; clean balanced composition
- POSE: Refined editorial pose; body facing camera or slight 3/4 turn; composed, confident expression
- BACKGROUND: Clean white or very light neutral background; simple and uncluttered
- TEXT LAYOUT: "CLARA" in large serif type at the top-left or top-center (top 12%). Short text callout columns on both left and right sides alongside the body. Bold headline in large type at the bottom of the frame overlapping the lower body area.
- OVERLAP: Side callouts flank the body; bottom headline overlaps lower torso`,
    editableTexts: [
      { key: 'headline', label: '메인 카피', placeholder: 'EMBRACE THE CHANGE' },
      { key: 'coverLine', label: '커버 라인', placeholder: 'ProTips · 트렌드 가이드' },
    ],
  },
  {
    id: 'cov4',
    name: 'VOGUE',
    description: '보그 스트릿 패션 · 건축적 아웃도어',
    imagePath: '/magazine-covers/cov4.png',
    maxPhotos: 1,
    style: 'VOGUE magazine street fashion editorial, full-body portrait in urban architectural setting, clean sans-serif logo, bold headline at bottom, sophisticated minimal layout',
    layoutDescription: `COMPOSITION BLUEPRINT — VOGUE magazine:
- FRAMING: Full-body portrait; head to feet clearly visible
- SCALE: Person occupies 75–85% of the frame height
- VERTICAL POSITION: Head at approximately 12% from top; feet near the bottom
- HORIZONTAL POSITION: Model centered; slight casual stance
- POSE: Confident street fashion editorial pose; casual yet intentional; hands in pockets or at sides; direct gaze
- BACKGROUND: Urban architectural environment — concrete, building exteriors, or structured outdoor space; muted tones
- TEXT LAYOUT: "VOGUE" in clean large sans-serif at top-center (top 12%). A two-line bold headline in white in the lower-left corner overlapping the lower body. Very minimal text overall.
- OVERLAP: Headline text in lower portion; model's face and torso kept clear`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'STREET ARCHITECTURE' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'Urban Fashion Issue' },
    ],
  },
  {
    id: 'cov5',
    name: 'ANNA',
    description: 'K팝 컬러풀 패션지 · 비비드 타이포',
    imagePath: '/magazine-covers/cov5.png',
    maxPhotos: 1,
    style: 'colorful K-pop fashion magazine ANNA, vibrant magenta/pink background, bold Korean and English typography, close-up beauty portrait with dramatic colorful hair and makeup',
    layoutDescription: `COMPOSITION BLUEPRINT — ANNA magazine:
- FRAMING: Head-and-shoulders to bust portrait; face is primary subject
- SCALE: Head and upper chest fill approximately 65–75% of the frame height
- VERTICAL POSITION: Face in the upper-center zone; eyes at 30–40% from top
- HORIZONTAL POSITION: Model centered; slight tilt allowed
- POSE: Bold, expressive K-pop pose; dramatic makeup; direct eye contact; vibrant energy
- BACKGROUND: Vivid solid color (magenta, hot pink, or neon tone); clean and saturated
- TEXT LAYOUT: "ANNA" in very large bold display type at top (top 20%). Multiple short Korean and English text callouts arranged on left and right margins. Two large lines of Korean headline text in the lower half.
- OVERLAP: Title overlaps slightly above/at head; Korean headlines overlap lower chest area`,
    editableTexts: [
      { key: 'headline', label: '메인 카피', placeholder: '트렌드 발견' },
      { key: 'subtitle', label: '서브 카피', placeholder: '개성 연출' },
    ],
  },
  {
    id: 'cov6',
    name: 'MZ통신',
    description: 'MZ세대 라이프스타일 · 그래픽 팝',
    imagePath: '/magazine-covers/cov6.png',
    maxPhotos: 1,
    style: 'MZ generation Korean lifestyle magazine, bold graphic colorful design, K-pop youth culture aesthetic, dynamic illustrated elements around portrait, busy vibrant layout',
    layoutDescription: `COMPOSITION BLUEPRINT — MZ통신 magazine:
- FRAMING: 3/4 body to full-body portrait; figure clearly visible
- SCALE: Person occupies 60–75% of the frame height
- VERTICAL POSITION: Head at approximately 15–25% from top
- HORIZONTAL POSITION: Model slightly left or right of center; room for graphic elements on opposite side
- POSE: Dynamic youth culture pose; energetic expression; may have accessories (camera, phone); trendy Gen-Z styling
- BACKGROUND: Colorful background with graphic design elements (stars, shapes, Y2K motifs) scattered around the figure
- TEXT LAYOUT: "MZ통신" in large bold stylized Korean type at top. Multiple colorful text boxes with Korean callouts fill the spaces around the figure. A main bold Korean headline in the lower portion.
- OVERLAP: Graphic elements and text overlap the edges of the figure; face kept clear`,
    editableTexts: [
      { key: 'headline', label: '메인 특집', placeholder: 'MZ 트렌드 쇼핑 가이드' },
      { key: 'subtitle', label: '서브 카피', placeholder: '빈티지 마켓 탐험' },
    ],
  },
  {
    id: 'cov7',
    name: 'URBAN ESSENCE',
    description: '남성 패션 에디토리얼 · 미니멀 화이트',
    imagePath: '/magazine-covers/cov7.png',
    maxPhotos: 1,
    style: 'Urban Essence men\'s fashion editorial magazine, clean white background, waist-up portrait of male subject in premium coat, minimal elegant sans-serif typography',
    layoutDescription: `COMPOSITION BLUEPRINT — URBAN ESSENCE magazine:
- FRAMING: Waist-up portrait; head through waist clearly visible
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 20–25% from top; waist near 80% from top
- HORIZONTAL POSITION: Model centered; slight 3/4 turn allowed
- POSE: Calm, composed men's fashion pose; strong but understated; direct or slightly averted gaze; premium outerwear fully visible
- BACKGROUND: Pure white or very light grey; clean studio; no distractions
- TEXT LAYOUT: "URBAN ESSENCE" in clean sans-serif at top (top 15%). A two-line feature headline in bold black type in the left portion of the lower frame. Small subtitle text below the headline. Very minimal — maximum 3 text elements.
- OVERLAP: Headlines in the lower-left area; body and face remain clear`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'THE URBAN GENTLEMAN' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'Luxury Collection' },
    ],
  },
  {
    id: 'cov8',
    name: 'FASHION VANGUARD',
    description: '아방가르드 패션 · 다크 드라마틱',
    imagePath: '/magazine-covers/cov8.png',
    maxPhotos: 1,
    style: 'Fashion Vanguard avant-garde magazine, dark dramatic portrait with moody lighting, deep burgundy and black tones, bold display typography, haute couture fashion editorial',
    layoutDescription: `COMPOSITION BLUEPRINT — FASHION VANGUARD magazine:
- FRAMING: Chest-up to waist-up portrait; upper body dominant
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 20% from top; torso extending to 80%
- HORIZONTAL POSITION: Model centered; slight 3/4 angle
- POSE: Dramatic, avant-garde fashion pose; mysterious, artistic expression; elaborate headpiece or accessory; strong cinematic lighting
- BACKGROUND: Very dark — deep black, charcoal, or near-black gradient; minimal environmental detail; dramatic single-source lighting
- TEXT LAYOUT: "FASHION VANGUARD" in two bold lines at the very top (top 20%). Two short feature callouts in the upper-left area. A large bold headline "VOICE OF FASHION?" at the bottom spanning the lower 20% of the frame.
- OVERLAP: Top title may brush against the model's head; bottom headline overlaps lower body`,
    editableTexts: [
      { key: 'headline', label: '메인 카피', placeholder: 'VOICE OF FASHION?' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'AVANT-GARDE FASHION REPORT' },
    ],
  },
  {
    id: 'cov9',
    name: 'OUR LIFE',
    description: '음악 컬처 매거진 · 캐주얼 포트레이트',
    imagePath: '/magazine-covers/cov9.png',
    maxPhotos: 1,
    style: 'OUR LIFE music culture magazine, clean white background, waist-up casual male portrait in denim jacket, clean sans-serif typography with text callouts on both sides',
    layoutDescription: `COMPOSITION BLUEPRINT — OUR LIFE magazine:
- FRAMING: Waist-up portrait; upper body visible
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 20% from top; waist near 80%
- HORIZONTAL POSITION: Model centered; casual relaxed stance
- POSE: Natural, authentic music artist pose; relaxed confidence; direct or slightly off camera gaze; casual everyday styling
- BACKGROUND: Clean white or light neutral background; simple, uncluttered
- TEXT LAYOUT: "OUR LIFE" in large bold sans-serif at top-center (top 12%). Two text callout columns on left and right sides of the figure. A large bold main headline in the lower third of the frame.
- OVERLAP: Side callouts flank the body; bottom headline over lower torso`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'CONTEMPORARY CULTURE' },
      { key: 'coverLine', label: '커버 라인', placeholder: 'GLOBAL SCENE · INDIE EDITORS' },
    ],
  },
  {
    id: 'cov10',
    name: 'LIME',
    description: '뉴스 매거진 · 아이코닉 권위 포트레이트',
    imagePath: '/magazine-covers/cov10.png',
    maxPhotos: 1,
    style: 'LIME news magazine TIME-inspired cover, bold red border frame, tight head-and-shoulders authoritative portrait, clean white and red color scheme, news magazine gravitas',
    layoutDescription: `COMPOSITION BLUEPRINT — LIME magazine:
- FRAMING: Tight head-and-shoulders portrait; face is the absolute focal point
- SCALE: Head and upper chest fill approximately 65–75% of the frame height
- VERTICAL POSITION: Face centered; eyes at 35–45% from top; chin at 65–70%
- HORIZONTAL POSITION: Model perfectly centered; dignified, iconic framing
- POSE: Frontal or near-frontal; authoritative, serious expression; looking directly at camera; still and controlled
- BACKGROUND: Dark, near-black or very deep grey background; dramatic lighting on face
- TEXT LAYOUT: "LIME" logo in large bold type at top-center with red border frame around entire cover. A short bold headline in large type at the bottom overlapping the chest area. Red frame border visible around all edges.
- OVERLAP: Title at top; headline overlaps lower chest area`,
    editableTexts: [
      { key: 'headline', label: '메인 타이틀', placeholder: 'GLOBAL INSIGHT' },
      { key: 'subtitle', label: '설명 문구', placeholder: '세계를 바꾸는 리더' },
    ],
  },
  {
    id: 'cov11',
    name: 'GREEN LIVING',
    description: '에코 라이프스타일 · 클린 내추럴',
    imagePath: '/magazine-covers/cov11.png',
    maxPhotos: 1,
    style: 'Green Living eco lifestyle magazine, clean white background, waist-up portrait holding natural element, minimal clean typography, earthy and sustainable aesthetic',
    layoutDescription: `COMPOSITION BLUEPRINT — GREEN LIVING magazine:
- FRAMING: Waist-up portrait; head through waist visible; may hold object
- SCALE: Person occupies approximately 55–65% of the frame height; centered with generous margins
- VERTICAL POSITION: Head at approximately 20–25% from top; breathing room above and below
- HORIZONTAL POSITION: Model centered; looking down at object or toward camera
- POSE: Gentle, natural pose; holding a plant, flower, or natural element with both hands; soft, mindful expression; sustainable lifestyle energy
- BACKGROUND: Very clean white or off-white; minimal; earthy tones allowed as accent
- TEXT LAYOUT: "GREEN LIVING" in large bold sans-serif at top-center (top 12%). A two-line headline in bold black type at the bottom of the frame. Small subtitle in Korean below the headline.
- OVERLAP: All text above and below the figure; the figure itself is clean`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'REGENERATIVE WAVE' },
      { key: 'subtitle', label: '서브 카피', placeholder: '재생의 물결' },
    ],
  },
  {
    id: 'cov12',
    name: 'ALGORITHM CODEC',
    description: '사이버펑크 테크 · 네온 미래주의',
    imagePath: '/magazine-covers/cov12.png',
    maxPhotos: 1,
    style: 'Algorithm Codec cyberpunk tech magazine, dark background with neon purple and cyan glow, close-up portrait with VR/AR goggles or tech accessory, futuristic digital aesthetic, Korean and English typography',
    layoutDescription: `COMPOSITION BLUEPRINT — ALGORITHM CODEC magazine:
- FRAMING: Head-and-shoulders to bust portrait; face with tech accessory as focal point
- SCALE: Head and upper chest fill approximately 65–75% of the frame height
- VERTICAL POSITION: Face in upper-center zone; eyes at approximately 35–45% from top
- HORIZONTAL POSITION: Model centered; slightly forward-facing
- POSE: Intense, futuristic expression; wearing VR goggles or tech headset; cyberpunk styling; dramatic neon lighting
- BACKGROUND: Dark black with neon light accents (purple, cyan, magenta); digital/holographic elements in background; atmospheric and dramatic
- TEXT LAYOUT: "ALGORITHM CODEC" in glowing display type at the top (top 20%). A two-line feature headline with Korean subtitle at the bottom center of the frame.
- OVERLAP: Minimal text over face; title at top, headline at bottom`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'NEON CODEX' },
      { key: 'subtitle', label: '서브 카피', placeholder: '네온 코덱' },
    ],
  },
  {
    id: 'cov13',
    name: 'FORM & FUNCTION',
    description: '건축·디자인 매거진 · 미니멀리즘',
    imagePath: '/magazine-covers/cov13.png',
    maxPhotos: 1,
    style: 'Form and Function architecture design magazine, dramatic architectural environment, small figure dwarfed by monolithic concrete structures, bold black sans-serif typography, high contrast black and white aesthetic',
    layoutDescription: `COMPOSITION BLUEPRINT — FORM & FUNCTION magazine:
- FRAMING: Wide architectural shot with human figure as scale reference; figure may be small relative to structure
- SCALE: Person occupies approximately 20–35% of the frame height as a silhouette or small figure
- VERTICAL POSITION: Figure positioned in the lower-center or center of the frame; massive architecture dominates
- HORIZONTAL POSITION: Figure centered between architectural elements; symmetrical if possible
- POSE: Standing still, looking at or walking through the structure; conveying scale and contemplation
- BACKGROUND: Dramatic concrete or stone architecture; monolithic, massive, geometric; overcast or dramatic sky
- TEXT LAYOUT: "FORM & FUNCTION" in large bold black sans-serif at the very top (top 15%). A two-line headline with Korean subtitle at the bottom center.
- OVERLAP: Title at top above architecture; bottom headline in lower portion`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'MINIMALIST MONOLITH' },
      { key: 'subtitle', label: '서브 카피', placeholder: '미니멀리즘 단일 구조' },
    ],
  },
  {
    id: 'cov14',
    name: "CREATIT'S GORE",
    description: '아트 매거진 · 콜라주 컬러풀',
    imagePath: '/magazine-covers/cov14.png',
    maxPhotos: 1,
    style: "Creatit's Gore contemporary art magazine, colorful collage and mixed media aesthetic, bold graphic portrait integrated with abstract painted elements, vibrant artistic composition",
    layoutDescription: `COMPOSITION BLUEPRINT — CREATIT'S GORE magazine:
- FRAMING: Head-and-shoulders portrait integrated with artistic/painted collage elements
- SCALE: Face occupies approximately 50–65% of the frame; artistic elements fill remaining space
- VERTICAL POSITION: Face centered; artwork and collage elements surrounding the portrait
- HORIZONTAL POSITION: Face centered or slightly off-center to allow collage composition
- POSE: Expressive, artistic pose; natural but creative expression; face interacting with the collage aesthetic
- BACKGROUND: Colorful abstract mixed-media background — collage of colors, textures, shapes, painted elements; vibrant and layered
- TEXT LAYOUT: Magazine title at top in bold display type. A two-line headline with Korean subtitle centered at the bottom.
- OVERLAP: Collage elements may overlap face edges; text above and below`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: "ARTIST'S GAZE" },
      { key: 'subtitle', label: '서브 카피', placeholder: '매술가의 시선' },
    ],
  },
  {
    id: 'cov15',
    name: 'NOMAD CHRONICLE',
    description: '여행 다큐 매거진 · 글로벌 보이스',
    imagePath: '/magazine-covers/cov15.png',
    maxPhotos: 1,
    style: 'Nomad Chronicle travel documentary magazine, full-body portrait in traditional ethnic costume against dramatic mountain landscape, earthy warm tones, explorer aesthetic',
    layoutDescription: `COMPOSITION BLUEPRINT — NOMAD CHRONICLE magazine:
- FRAMING: Full-body portrait; person from head to feet clearly visible in landscape
- SCALE: Person occupies approximately 60–70% of the frame height
- VERTICAL POSITION: Head at approximately 15–20% from top; feet near the bottom
- HORIZONTAL POSITION: Model centered or slightly off-center; mountain backdrop visible
- POSE: Standing naturally in traditional or travel clothing; looking at camera or into the distance; authentic, documentary feel
- BACKGROUND: Dramatic mountain or landscape environment; wide open vistas; earthy warm tones
- TEXT LAYOUT: "NOMAD CHRONICLE" in bold serif type at the very top (top 12%). A two-line headline with Korean subtitle at the bottom of the frame.
- OVERLAP: Title above head; bottom text over lower landscape area`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'GLOBAL VOICES' },
      { key: 'subtitle', label: '서브 카피', placeholder: '세계의 목소리' },
    ],
  },
  {
    id: 'cov16',
    name: 'UNCHARTED EXPLORATION',
    description: '과학 매거진 · 우주와 실험실',
    imagePath: '/magazine-covers/cov16.png',
    maxPhotos: 1,
    style: 'Uncharted Exploration science magazine, dramatic dark cosmos background with microscopic and galactic elements, scientist portrait at work, dark atmospheric with vibrant science imagery',
    layoutDescription: `COMPOSITION BLUEPRINT — UNCHARTED EXPLORATION magazine:
- FRAMING: 3/4 body portrait; person working with scientific instrument
- SCALE: Person occupies approximately 60–70% of the frame height
- VERTICAL POSITION: Head at approximately 20% from top; figure extending to near bottom
- HORIZONTAL POSITION: Model slightly left or right of center; scientific imagery fills opposite side
- POSE: Focused at work — looking through microscope, holding equipment, or examining specimen; professional, concentrated expression
- BACKGROUND: Dark background with dramatic cosmic/scientific imagery — galaxies, cells, molecular structures visible
- TEXT LAYOUT: "UNCHARTED EXPLORATION" in display type at top. A two-line headline with Korean subtitle at the bottom center.
- OVERLAP: Background imagery surrounds figure; title at top`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'BOUNDARIES OF SCIENCE' },
      { key: 'subtitle', label: '서브 카피', placeholder: '과학의 경계' },
    ],
  },
  {
    id: 'cov17',
    name: 'FLAVOR EVOLUTION',
    description: '요리 예술 매거진 · 셰프 포트레이트',
    imagePath: '/magazine-covers/cov17.png',
    maxPhotos: 1,
    style: 'Flavor Evolution culinary arts magazine, dramatic dark background, chef portrait in white uniform plating an artistic dish, warm gold and dark tones, fine dining aesthetic',
    layoutDescription: `COMPOSITION BLUEPRINT — FLAVOR EVOLUTION magazine:
- FRAMING: 3/4 body portrait; chef with culinary creation visible
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 20% from top; hands/dish at approximately 70–80% from top
- HORIZONTAL POSITION: Model centered; hands and dish prominently featured
- POSE: Chef actively plating or presenting an artistic dish; concentrated, proud expression; hands clearly visible with beautiful food creation
- BACKGROUND: Dark, warm background — black or deep brown; dramatic lighting illuminating the dish and face; fine dining atmosphere
- TEXT LAYOUT: "FLAVOR EVOLUTION" in bold display type at the very top. A two-line headline with Korean subtitle at the bottom center.
- OVERLAP: Title at top; bottom text over lower portion`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'CULINARY ARTISTRY' },
      { key: 'subtitle', label: '서브 카피', placeholder: '요리의 예술' },
    ],
  },
  {
    id: 'cov18',
    name: 'THE SOUNDSCAPE',
    description: '문학·빈티지 매거진 · 클래식 일러스트',
    imagePath: '/magazine-covers/cov18.png',
    maxPhotos: 1,
    style: 'The Soundscape literary vintage magazine, painterly illustrated style, period portrait of person with books or writing, classic countryside background, warm aged illustration aesthetic',
    layoutDescription: `COMPOSITION BLUEPRINT — THE SOUNDSCAPE magazine:
- FRAMING: 3/4 body or bust portrait; person engaged with books or writing
- SCALE: Person occupies approximately 55–65% of the frame height
- VERTICAL POSITION: Figure in center-upper area; environment visible below
- HORIZONTAL POSITION: Slightly off-center to allow background environment
- POSE: Classical, literary pose — seated with book or writing; period clothing; scholarly, contemplative expression
- BACKGROUND: Classic countryside or library setting; warm illustrated/painterly treatment; bookshelves or natural landscape
- TEXT LAYOUT: "The SOUNDSCAPE" in decorative serif type at the very top. A two-line headline with Korean subtitle at the bottom center of the frame.
- OVERLAP: Title in top area; bottom text over lower portion of scene`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'BREATH OF LITERATURE' },
      { key: 'subtitle', label: '서브 카피', placeholder: '문학의 숨결' },
    ],
  },
  {
    id: 'cov19',
    name: 'UNDERGROUND SOUND',
    description: '언더그라운드 음악 · 흑백 라이브',
    imagePath: '/magazine-covers/cov19.png',
    maxPhotos: 2,
    style: 'Underground Sound music magazine, gritty black and white photography, live concert performance with band on stage, raw documentary aesthetic, high contrast dramatic',
    layoutDescription: `COMPOSITION BLUEPRINT — UNDERGROUND SOUND magazine (BAND/MULTIPLE):
- FRAMING: Full group or 2–3 person stage performance shot; energy and motion
- SCALE: Figures occupy 60–80% of the frame height; dynamic composition
- VERTICAL POSITION: Figures centered; stage atmosphere fills the frame
- HORIZONTAL POSITION: Figures spread naturally across stage; lead performer may be centered
- POSE: Active performance poses; playing instruments; full energy; raw and authentic stage presence; black and white treatment
- BACKGROUND: Dark stage/concert environment; dramatic stage lighting as contrast; moody atmosphere
- TEXT LAYOUT: "UNDERGROUND SOUND" in bold sans-serif at the top (top 15%). A two-line headline with Korean subtitle at the bottom.
- OVERLAP: Title at top; bottom text over lower stage area`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'STREET MUSIC' },
      { key: 'subtitle', label: '서브 카피', placeholder: '거리의 음악' },
    ],
  },
  {
    id: 'cov20',
    name: 'RAW',
    description: '어반 힙합 매거진 · 다크 클로즈업',
    imagePath: '/magazine-covers/cov20.png',
    maxPhotos: 1,
    style: 'RAW urban hip-hop magazine, tight head-and-shoulders close-up portrait of rapper or urban artist, bold minimal white typography on dark background, raw street credibility aesthetic',
    layoutDescription: `COMPOSITION BLUEPRINT — RAW magazine:
- FRAMING: Head-and-shoulders close-up; face is dominant and confrontational
- SCALE: Head fills approximately 70–80% of the frame height
- VERTICAL POSITION: Face centered; chin at approximately 65–70% from top
- HORIZONTAL POSITION: Face centered; direct, raw framing
- POSE: Intense, confrontational urban expression; raw authenticity; direct gaze; minimal styling — raw and unfiltered
- BACKGROUND: White or very light background for maximum contrast; or dark studio — high graphic contrast either way
- TEXT LAYOUT: "RAW" in very large bold sans-serif at the top (top 15%). Multiple short text callouts in small type on left and right sides. A bold main headline at the bottom overlapping the lower chest area.
- OVERLAP: Side text flanks the figure; bottom headline over lower portion; face kept clear`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'STREET UNLEASHED' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'A bold expression from the underground' },
    ],
  },
  {
    id: 'cov21',
    name: 'VIBE',
    description: 'K팝 아이돌 매거진 · 클린 미니멀',
    imagePath: '/magazine-covers/cov21.png',
    maxPhotos: 1,
    style: 'VIBE K-pop idol magazine, clean white minimal background, waist-up portrait of Korean idol, bold simple sans-serif logo, clean editorial with small text caption at bottom',
    layoutDescription: `COMPOSITION BLUEPRINT — VIBE magazine:
- FRAMING: Waist-up to chest-up portrait; clean idol portrait
- SCALE: Person occupies approximately 70–80% of the frame height
- VERTICAL POSITION: Head at approximately 15–20% from top; torso extending to 80–85%
- HORIZONTAL POSITION: Model centered; clean symmetrical framing
- POSE: Korean idol-style confident pose; clean styling; direct or slightly averted gaze; fresh, premium energy
- BACKGROUND: Pure white or very light grey; completely clean; studio minimal
- TEXT LAYOUT: "VIBE" in large bold sans-serif at the top-left with small magazine descriptor. Small subtitle text below the "VIBE" logo. A bold two-line caption/feature at the bottom with Korean description.
- OVERLAP: Title at top; bottom caption over lower portion`,
    editableTexts: [
      { key: 'coverName', label: '커버 아티스트', placeholder: 'K-DECODE' },
      { key: 'subtitle', label: '설명 문구', placeholder: 'K gender-neutral K-pop solo artist' },
    ],
  },
  {
    id: 'cov22',
    name: 'GLOW',
    description: '뷰티 아방가르드 · 드라마틱 메이크업',
    imagePath: '/magazine-covers/cov22.png',
    maxPhotos: 1,
    style: 'GLOW beauty magazine avant-garde cover, ultra close-up Asian beauty portrait with dramatic artistic makeup, bold colorful eye art, clean black background, high fashion beauty editorial',
    layoutDescription: `COMPOSITION BLUEPRINT — GLOW magazine:
- FRAMING: Extreme close-up; face fills nearly the entire frame
- SCALE: Face occupies 80–90% of the frame height; cropped just below chin and at forehead
- VERTICAL POSITION: Eyes at approximately 30–40% from top; lips visible
- HORIZONTAL POSITION: Face perfectly centered; intense, direct framing
- POSE: Intense beauty close-up; eyes open and engaging; dramatic artistic makeup; Asian beauty editorial; expressive yet controlled
- BACKGROUND: Pure black or very dark; maximum contrast with the face
- TEXT LAYOUT: "GLOW" in large elegant sans-serif at the very top-left (top 10%). A bold two-line headline at the bottom in white type. Small descriptive text below the headline.
- OVERLAP: Title at top-left; bottom headline over chin/neck area`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'COLOR SPECTRUM' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'An avant-garde beauty portrait' },
    ],
  },
  {
    id: 'cov23',
    name: 'THE PULSE',
    description: '셀럽 뉴스 매거진 · 다크 무디 포트레이트',
    imagePath: '/magazine-covers/cov23.png',
    maxPhotos: 1,
    style: 'The Pulse celebrity news magazine, dramatic dark moody portrait of male subject, bold sans-serif magazine title, dark background with serious authoritative expression, Hollywood actor editorial',
    layoutDescription: `COMPOSITION BLUEPRINT — THE PULSE magazine:
- FRAMING: Chest-up to waist-up portrait; upper body prominent
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 20–25% from top
- HORIZONTAL POSITION: Model centered; strong centered framing
- POSE: Serious, authoritative expression; looking directly at camera; strong masculine presence; slight 3/4 turn allowed; no smile
- BACKGROUND: Very dark grey or near-black; dramatic Rembrandt-style lighting on face and upper body
- TEXT LAYOUT: "THE PULSE" in bold display type at the top-center with small subtitle. Two or three small text callouts in the right column. A large bold headline at the bottom of the frame spanning the lower 20%.
- OVERLAP: Title at top; side callouts to right; bottom headline over lower torso`,
    editableTexts: [
      { key: 'headline', label: '메인 카피', placeholder: 'HOLLYWOOD SHADOWS' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'Behind the scenes' },
    ],
  },
  {
    id: 'cov24',
    name: '신여성',
    description: '60년대 한국 빈티지 여성지 · 레트로',
    imagePath: '/magazine-covers/cov24.png',
    maxPhotos: 1,
    style: '1960s Korean vintage women magazine 신여성, aged paper texture, traditional Korean dress hanbok or modest period fashion, classic retro Korean typography, warm sepia and muted tones',
    layoutDescription: `COMPOSITION BLUEPRINT — 신여성 magazine:
- FRAMING: Bust to waist-up portrait; classic modest portrait
- SCALE: Person occupies approximately 55–65% of the frame height
- VERTICAL POSITION: Head at approximately 25–30% from top; comfortable margins
- HORIZONTAL POSITION: Model centered; dignified classical composition
- POSE: Classic, refined Korean feminine pose; traditional dress or modest period fashion; gentle, composed expression; facing camera or slight 3/4 turn
- BACKGROUND: Warm neutral or slightly warm tone; simple, uncluttered; suggested interior or plain backdrop
- TEXT LAYOUT: "신여성" in stylized Korean/Chinese characters at the top. Issue date in small type at corners. Short Korean headline in the lower portion.
- OVERLAP: Title floats above head; lower text may lightly overlay lower body`,
    editableTexts: [
      { key: 'issue', label: '호수', placeholder: "'66 봄호" },
      { key: 'headline', label: '특집', placeholder: '모던 코리아' },
    ],
  },
  {
    id: 'cov25',
    name: 'CHIC',
    description: '프랑스 하이패션 · 엘레강스 & 시크',
    imagePath: '/magazine-covers/cov25.png',
    maxPhotos: 1,
    style: 'CHIC high fashion magazine French elegance, rich green background, full-body portrait in elegant green gown, bold serif logo, luxury timeless fashion editorial with Korean subtitle',
    layoutDescription: `COMPOSITION BLUEPRINT — CHIC magazine:
- FRAMING: Full-body to 3/4 body portrait; complete elegant look visible
- SCALE: Person occupies approximately 75–85% of the frame height
- VERTICAL POSITION: Head at approximately 12–15% from top; gown extends near bottom
- HORIZONTAL POSITION: Model centered; elegant and composed
- POSE: Timeless, poised fashion pose; luxurious gown fully displayed; direct or downward gaze; French haute couture elegance; one hand may gesture naturally
- BACKGROUND: Rich jewel-toned solid color (emerald green, deep teal, or similar luxury tone); clean, no distractions
- TEXT LAYOUT: "CHIC" in large elegant serif type at the top-center. Two small text callouts in the upper corners. A bold two-line headline with Korean subtitle at the bottom center.
- OVERLAP: Title above head; bottom headline overlaps lower gown area`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'TIMELESS CHIC' },
      { key: 'subtitle', label: '서브 카피', placeholder: '프랑스 하이 패션 · 엘레강스' },
    ],
  },
  {
    id: 'cov26',
    name: '연예특종',
    description: '80년대 한국 연예 가십지 · 커플',
    imagePath: '/magazine-covers/cov26.png',
    maxPhotos: 2,
    style: '1980s Korean entertainment gossip magazine 연예특종, retro Korean celebrity couple portrait, vintage photography style, bold Korean typography with gossip callouts, warm retro tones',
    layoutDescription: `COMPOSITION BLUEPRINT — 연예특종 magazine (TWO PEOPLE):
- FRAMING: Waist-up to chest-up portrait of a couple side by side
- SCALE: Together the two subjects fill 65–75% of the frame height
- VERTICAL POSITION: Upper bodies centered; heads at approximately 20–30% from top
- HORIZONTAL POSITION: Two people close together center-frame; she on left, he on right or vice versa
- POSE: Couple pose — facing each other slightly or both toward camera; warm, close expression; natural 1980s Korean celebrity styling
- BACKGROUND: Simple studio backdrop or neutral color; warm retro tones
- TEXT LAYOUT: Magazine title "연예특종" in large bold Korean display type at top. Issue number in small text corner. A bold Korean headline in large type in the lower third. Small Korean text callouts around the edges.
- OVERLAP: Title at top; large Korean headline at bottom over lower body area`,
    editableTexts: [
      { key: 'headline', label: '메인 카피', placeholder: '연예특종' },
      { key: 'subtitle', label: '서브 문구', placeholder: "'커플 탄생'" },
    ],
  },
  {
    id: 'cov27',
    name: 'JADE',
    description: '한국 뷰티 매거진 · 청량 핑크 프레시',
    imagePath: '/magazine-covers/cov27.png',
    maxPhotos: 1,
    style: 'JADE Korean beauty magazine, soft pink background, waist-up portrait of Korean beauty influencer with fresh natural makeup, elegant sans-serif logo, clean modern Korean beauty editorial',
    layoutDescription: `COMPOSITION BLUEPRINT — JADE magazine:
- FRAMING: Waist-up portrait; head through waist visible
- SCALE: Person occupies approximately 70–80% of the frame height
- VERTICAL POSITION: Head at approximately 18–22% from top; waist near 85%
- HORIZONTAL POSITION: Model centered; fresh, balanced composition
- POSE: Fresh, natural Korean beauty pose; clean makeup; warm smile or soft direct gaze; youthful and radiant energy; hair naturally styled
- BACKGROUND: Soft pink, peach, or blush tone; clean and gentle; no distractions
- TEXT LAYOUT: "JADE" in clean elegant sans-serif at the top-left or top-center (top 12%). A bold two-line headline with Korean subtitle at the bottom of the frame.
- OVERLAP: Title at top; bottom text over lower torso`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'YOUTH GLOW' },
      { key: 'subtitle', label: '서브 카피', placeholder: '현대 아시아 뷰티 · 트렌디 & 영' },
    ],
  },
  {
    id: 'cov28',
    name: 'VOGUE KOREA',
    description: '보그 코리아 · 서울 스타일 에디토리얼',
    imagePath: '/magazine-covers/cov28.png',
    maxPhotos: 1,
    style: 'VOGUE Korea editorial magazine, clean white background, 3/4 body portrait of Korean actress in premium fashion, classic VOGUE serif logo, bold Korean and English headlines, Seoul lifestyle aesthetic',
    layoutDescription: `COMPOSITION BLUEPRINT — VOGUE KOREA magazine:
- FRAMING: 3/4 body to full-body portrait; elegant fashion look displayed
- SCALE: Person occupies approximately 75–85% of the frame height
- VERTICAL POSITION: Head at approximately 12–15% from top; figure extends toward bottom
- HORIZONTAL POSITION: Model centered or slightly off-center; premium editorial composition
- POSE: Sophisticated Korean actress editorial pose; premium fashion; composed gaze; strong but feminine presence; minimal movement — artful and deliberate
- BACKGROUND: Clean white or very light studio background; open and spacious
- TEXT LAYOUT: "VOGUE" in classic large serif at top-center or top-left. Small additional header text. A bold multi-word headline in large type in the lower-left area. Korean subtitle below the headline. Very elegant and restrained text overall.
- OVERLAP: Logo above head; lower text alongside or below figure`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'SEOUL STYLE' },
      { key: 'subtitle', label: '서브 카피', placeholder: '한국 럭셔리 라이프스타일 · 최신 트렌드' },
    ],
  },
  {
    id: 'cov29',
    name: 'WANDER',
    description: '보헤미안 여행 매거진 · 사막 글로벌 노마드',
    imagePath: '/magazine-covers/cov29.png',
    maxPhotos: 1,
    style: 'WANDER travel lifestyle magazine, 3/4 body portrait in bohemian travel outfit against desert or arid landscape, earthy warm tones, Korean and English travel editorial typography',
    layoutDescription: `COMPOSITION BLUEPRINT — WANDER magazine:
- FRAMING: 3/4 body portrait; figure in travel clothing with landscape visible
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 15–20% from top; feet or lower body visible
- HORIZONTAL POSITION: Model centered; desert or landscape background visible on both sides
- POSE: Natural bohemian travel pose; looking toward camera or horizon; authentic, free-spirited energy; travel-worn but beautiful styling
- BACKGROUND: Desert, arid landscape, or open natural environment; warm golden tones; wide, open atmosphere
- TEXT LAYOUT: "WANDER" in bold serif or sans-serif type at the top-left or top-center (top 12%). Two small callout text blocks on left and right sides. A bold two-line Korean-English headline at the bottom center.
- OVERLAP: Title at top; side callouts flank the body; bottom headline over lower landscape`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'GLOBAL NOMAD' },
      { key: 'subtitle', label: '서브 카피', placeholder: '글로벌 여행 라이프스타일 · 탐험가의 기록' },
    ],
  },
  {
    id: 'cov30',
    name: 'AURA',
    description: '웰니스 마인드풀니스 · 퍼플 세레니티',
    imagePath: '/magazine-covers/cov30.png',
    maxPhotos: 1,
    style: 'AURA wellness mindfulness magazine, rich purple/violet background, waist-up portrait holding candle or wellness object, eyes closed or serene expression, elegant sans-serif logo, calm luxury aesthetic',
    layoutDescription: `COMPOSITION BLUEPRINT — AURA magazine:
- FRAMING: Waist-up portrait; person in relaxed wellness pose holding an object
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 18–22% from top; hands/object at approximately 70%
- HORIZONTAL POSITION: Model centered; tranquil, balanced composition
- POSE: Serene, mindful pose; eyes closed or softly looking down; holding a candle, crystal, or wellness item; peaceful, luxurious energy; flowing fabric or premium loungewear
- BACKGROUND: Rich solid purple, violet, or lavender; clean and meditative; no distractions
- TEXT LAYOUT: "AURA" in large elegant sans-serif at the top-center. Two short text callouts on both sides alongside the figure. A bold italic headline at the bottom of the frame.
- OVERLAP: Title at top; side callouts flank the upper body; bottom headline over lower portion`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'A New Kind of Glow' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'HIGH-FASHION MINDFULNESS' },
    ],
  },
  {
    id: 'cov31',
    name: 'MODERN MANIA',
    description: '메트로폴리탄 시티 매거진 · NYC 배경',
    imagePath: '/magazine-covers/cov31.png',
    maxPhotos: 1,
    style: 'Modern Mania metropolitan city magazine, dramatic city skyline background (NYC or Seoul), confident pose against urban backdrop, bold commercial magazine typography, multiple text callouts',
    layoutDescription: `COMPOSITION BLUEPRINT — MODERN MANIA magazine:
- FRAMING: 3/4 body to waist-up portrait against city skyline
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 15–20% from top
- HORIZONTAL POSITION: Model centered or slightly left; city skyline visible behind and beside
- POSE: Confident, metropolitan pose; city energy; looking at camera with urban confidence; stylish city fashion
- BACKGROUND: Dramatic city skyline — skyscrapers, bridges, urban architecture; dusk or daytime sky; dramatic and aspirational
- TEXT LAYOUT: "MODERN MANIA" in bold display type at the top-left and top-right. Multiple text callouts around the body — left side, right side. A bold multi-line headline at the bottom of the frame.
- OVERLAP: Title spans top; callouts flank the sides; large headline at bottom over lower body`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'METROPOLITAN MANIA' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'CITY RUSH · Urban Passion' },
    ],
  },
  {
    id: 'cov32',
    name: 'BeatEcho',
    description: '인디 음악 서울 2025 · 언더그라운드 그런지',
    imagePath: '/magazine-covers/cov32.png',
    maxPhotos: 1,
    style: 'BeatEcho indie music magazine Seoul 2025, dark moody portrait of indie/rock artist with dramatic styling, grunge texture overlay, bold mixed typography in English and Korean',
    layoutDescription: `COMPOSITION BLUEPRINT — BeatEcho magazine:
- FRAMING: Waist-up to 3/4 body portrait; upper body dominant
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 15–25% from top
- HORIZONTAL POSITION: Model centered or slightly off-center; raw, editorial framing
- POSE: Indie/rock artist pose; dark, brooding energy; direct camera stare; natural styling with grunge influence; necklaces, chains, or accessories visible
- BACKGROUND: Dark, textured background with worn or grunge aesthetic; visible texture overlays; moody atmosphere
- TEXT LAYOUT: "BeatEcho" in stylized retro-inspired type at the top with small "JAPAN 25" text. Multiple short text callouts on left and right sides. A large multi-line headline at the bottom with "SEOUL 2025" indicator.
- OVERLAP: Title at top; side callouts flank the body; bottom text over lower portion`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'UNFILTERED ARTISTRY' },
      { key: 'subtitle', label: '서브 카피', placeholder: 'INDIE MUSIC & CULTURE · SEOUL 2025' },
    ],
  },
  {
    id: 'cov33',
    name: 'EPOCH',
    description: '미래주의 하이패션 · 화이트 건축적 공간',
    imagePath: '/magazine-covers/cov33.png',
    maxPhotos: 1,
    style: 'EPOCH futuristic high fashion magazine, dramatic white architectural environment with sweeping curved surfaces, full-body portrait in sculptural avant-garde fashion, minimalist white and silver tones',
    layoutDescription: `COMPOSITION BLUEPRINT — EPOCH magazine:
- FRAMING: Full-body portrait in dramatic architectural space
- SCALE: Person occupies approximately 70–80% of the frame height
- VERTICAL POSITION: Head at approximately 12–15% from top; full figure visible
- HORIZONTAL POSITION: Model centered; architectural curves visible on both sides
- POSE: Avant-garde fashion pose; sculptural, architectural body angles; strong yet graceful; looking at camera or in profile; futuristic garment fully displayed
- BACKGROUND: White, ivory, or silver architectural interior — sweeping curves, spiraling forms; clean and futuristic
- TEXT LAYOUT: "EPOCH" in large clean sans-serif at the very top. Two short text callouts flanking the upper body. A bold multi-line headline at the bottom-left of the frame.
- OVERLAP: Title at top; side text alongside upper body; bottom text over lower portion`,
    editableTexts: [
      { key: 'headline', label: '헤드라인', placeholder: 'THE SPIRIT OF NOW' },
      { key: 'subtitle', label: '서브 카피', placeholder: '2025 ERA NOW · VISIONARY STYLE' },
    ],
  },
  {
    id: 'cov34',
    name: 'K/I/N/E/S/I/S',
    description: '실험적 타이포그래피 · 흑백 아방가르드',
    imagePath: '/magazine-covers/cov34.png',
    maxPhotos: 1,
    style: 'K/I/N/E/S/I/S experimental typography fashion magazine, pure black and white high contrast, deconstructed typography overlapping portrait, avant-garde design, Twiggy-style close-up with dramatic type overlay',
    layoutDescription: `COMPOSITION BLUEPRINT — K/I/N/E/S/I/S magazine:
- FRAMING: Head-and-shoulders portrait integrated with large-scale typography
- SCALE: Face occupies approximately 55–65% of the frame; large letters fill remaining space
- VERTICAL POSITION: Face in the upper-center zone; large typography below and overlapping
- HORIZONTAL POSITION: Face slightly off-center; type elements fill the open space
- POSE: Striking, graphic avant-garde pose; intense retro beauty expression; dramatic eye makeup; face as a design element
- BACKGROUND: Pure white or pure black; extreme high contrast; no mid-tones
- TEXT LAYOUT: "K/I/N/E/S/I/S" deconstructed into large individual letter slashes placed at various scales and angles. Multiple large typographic elements surround and partially overlap the face. Issue number and small text in one corner.
- OVERLAP: Large letters directly overlap the face, shoulders, and body — intentional typographic design`,
    editableTexts: [
      { key: 'title', label: '매거진명', placeholder: 'K/I/N/E/S/I/S' },
      { key: 'headline', label: '메인 카피', placeholder: 'ISSUE / 17' },
    ],
  },
];

export function getCoverTemplate(id: string): CoverTemplate | undefined {
  return COVER_TEMPLATES.find((t) => t.id === id);
}
