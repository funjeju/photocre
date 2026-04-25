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
    id: 'paper',
    name: 'PAPER',
    description: '미국 인디 패션지 · 미니멀 브라운',
    imagePath: '/magazine-covers/paper.jpg',
    maxPhotos: 1,
    style: 'minimalist American indie magazine, warm brown tones, large bold serif title at top, clean editorial layout',
    layoutDescription: `COMPOSITION BLUEPRINT — PAPER magazine:
- FRAMING: Waist-up to full-body portrait, model centered horizontally
- SCALE: Person occupies 65–75% of the total frame height
- VERTICAL POSITION: Head begins at approximately 20–25% from the top; lower body/waist reaches near the bottom
- HORIZONTAL POSITION: Model centered, roughly equal margins on both sides
- POSE: Relaxed upright stance, body facing directly toward the camera or with a very slight 3/4 turn; direct eye contact with the lens
- BACKGROUND: Single solid warm color (cream, brown, or muted tone), fully visible above and below the figure
- TEXT LAYOUT: Large bold serif magazine title fills the upper 20–25% of the frame, above the model's head; a single short headline line sits just below the title or overlapping the model's upper chest/shoulder area; no text on the sides
- OVERLAP: Minimal — the title floats above the head with a small gap; no heavy text overlay on the face`,
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
    style: 'British teen celebrity magazine, green and white color scheme, playful modern typography, multiple text callouts around edges',
    layoutDescription: `COMPOSITION BLUEPRINT — CLOSE UP magazine:
- FRAMING: Head-and-shoulders tight portrait; face is the primary visual subject
- SCALE: Head and shoulders fill 65–75% of the frame height; face is large and centered
- VERTICAL POSITION: Face centered in the upper-middle of the frame; chin at roughly 65% from top
- HORIZONTAL POSITION: Model centered; face occupies the central 60% of the frame width
- POSE: Frontal or near-frontal, looking directly into the camera; casual, youthful expression
- BACKGROUND: Solid bright color (green/white), visible around all edges of the face
- TEXT LAYOUT: Magazine title spans the top 20% of the frame above the head. Multiple short callout text lines (celeb facts, feature teasers) are arranged along the left edge, right edge, and bottom edge of the cover — like a border of text surrounding the face portrait
- OVERLAP: Callout text may slightly encroach on the shoulder area; face itself is kept clear`,
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
    style: 'allure beauty magazine style, vibrant colorful background with pop art elements, bold lowercase logo, beauty portrait with saturated colors',
    layoutDescription: `COMPOSITION BLUEPRINT — allure magazine:
- FRAMING: Beauty close-up — head and upper chest (roughly chest-up); face is the hero
- SCALE: Face and neck-chest area fill approximately 60–70% of the frame height
- VERTICAL POSITION: Face centered in the upper-middle zone; eyes at approximately 35–40% from top
- HORIZONTAL POSITION: Model centered; slightly favoring the left half of the frame or perfectly centered
- POSE: Facing camera directly or with a subtle tilt; confident beauty expression; eyes open and engaging
- BACKGROUND: Bold saturated single-color background (vibrant pink, coral, blue, or yellow) fully visible on all sides
- TEXT LAYOUT: "allure" logo in lowercase at the top-left or top-center (small to medium size). Two to three short text callouts arranged on the left side column and bottom portion of the cover. One headline near the lower third of the frame, not overlapping the face
- OVERLAP: Text callouts are on the periphery; the face zone (eye level and above) stays completely clear`,
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
    layoutDescription: `COMPOSITION BLUEPRINT — BUZZ magazine:
- FRAMING: Waist-up portrait; upper body dominant
- SCALE: Person occupies 60–70% of the frame height
- VERTICAL POSITION: Head at approximately 25% from top; waist at approximately 80% from top
- HORIZONTAL POSITION: Model centered or very slightly left-of-center
- POSE: Body angled slightly (3/4 turn or slight side angle); face turned back toward camera; dramatic, powerful expression; one shoulder more prominent than the other
- BACKGROUND: Dark charcoal or near-black gradient; almost no environmental detail visible
- TEXT LAYOUT: Large bold geometric "BUZZ" title dominates the top 25–30% of the frame above the head. A bold white or grey headline spans the lower-third of the cover, positioned over or just below the model's waist/hip area. Additional small text lines in the bottom margin
- OVERLAP: The headline text sits over the lower torso area; the head and face zone are kept text-free`,
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
    layoutDescription: `COMPOSITION BLUEPRINT — 여성中央 magazine:
- FRAMING: Classic bust portrait — head and shoulders to mid-chest; a timeless editorial portrait format
- SCALE: Person (head through upper chest) occupies approximately 55–65% of the frame height
- VERTICAL POSITION: Head positioned in the upper-center zone; chin at approximately 60% from top; centered with breathing room above and below
- HORIZONTAL POSITION: Model perfectly centered horizontally
- POSE: Frontal or 3/4 turn toward camera; soft, composed expression; looking directly at or slightly past the camera; classic dignified Korean magazine beauty pose
- BACKGROUND: Neutral warm tone (cream, soft beige, or light warm grey); simple and uncluttered; background is clearly visible above the head and on the sides
- TEXT LAYOUT: Magazine title "여성中央" in stylized traditional Korean/Chinese characters positioned at the top, spanning the top 20% of the frame. Issue number and date in small type at the corners. A short feature headline in Korean placed in the lower third, either overlapping the lower chest area or below the figure
- OVERLAP: Title floats above the head; lower-body text may lightly overlay the chest/shoulder area`,
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
    style: 'bold red fashion magazine cover, dramatic gradient red background, large split typography title, powerful editorial portrait with strong graphic design',
    layoutDescription: `COMPOSITION BLUEPRINT — FASHION magazine:
- FRAMING: Full-body or 3/4-body portrait; the entire figure from head to feet (or knees) is visible
- SCALE: Person occupies 75–85% of the total frame height; figure is tall and commanding in the frame
- VERTICAL POSITION: Head near the top 15% of the frame; feet or lower legs near the bottom; very little margin above or below
- HORIZONTAL POSITION: Model centered; may have a subtle power stance with weight on one leg
- POSE: Strong, confident editorial stance; body slightly angled (3/4 turn or power pose); direct eye contact with camera; arms may be at sides, on hips, or in a dynamic position
- BACKGROUND: Solid bold red or deep gradient red; no environmental details
- TEXT LAYOUT: Large display title "FASHION" split into two halves — the top half of the word appears above the model's shoulders/head level, and the bottom half appears overlapping the lower torso/hip area of the figure, creating a split-text effect. A short subheadline sits just below the mid-body title portion
- OVERLAP: The split title letters overlap the upper body (shoulder/neck area) and lower body (hip area) of the model`,
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
    style: '1990s Korean TV guide magazine, retro Korean broadcasting style, bold red TV가이드 logo, cluttered text layout with program listings',
    layoutDescription: `COMPOSITION BLUEPRINT — TV가이드 magazine (TWO PEOPLE):
- FRAMING: Waist-up or chest-up portrait of two people side by side
- SCALE: Together the two subjects fill 65–75% of the frame height; individual figures are medium-scale
- VERTICAL POSITION: Upper bodies centered; heads at approximately 20–30% from top; waists/chests reaching to about 75–80% from top
- HORIZONTAL POSITION: One person on the left half, one on the right half; they may overlap slightly in the center; both face toward the camera
- POSE: Both subjects facing camera or turned slightly toward each other; casual, friendly or professional expression; may be standing close together; both clearly visible
- BACKGROUND: Studio neutral or simple colored background; no complex environment
- TEXT LAYOUT: Bold red "TV가이드" logo at top-center spanning the full width. Issue date in small text in the top corner. Multiple small text boxes and program listing callouts fill the bottom 30% of the frame below the subjects' waists. Short text labels may appear on both sides of the figures
- OVERLAP: Program listing text fills the area around and below the waists; the faces are kept clear`,
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
    style: 'Hong Kong luxury women magazine JESSICA, vibrant red background, elegant serif logo, glamorous portrait with luxury fashion styling',
    layoutDescription: `COMPOSITION BLUEPRINT — JESSICA magazine:
- FRAMING: Waist-up glamorous portrait; head through waist clearly visible
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 20–25% from top; waist at approximately 80% from top; model centered vertically with slight room above head
- HORIZONTAL POSITION: Model centered; slight left or right offset possible for compositional interest
- POSE: Glamorous, poised fashion pose; body angled at a 3/4 turn to camera; face turned fully toward the camera; confident, luxurious demeanor; hands may be visible near the waist or holding an accessory
- BACKGROUND: Vibrant solid red (or similarly bold color); fully visible around the figure; no environmental detail
- TEXT LAYOUT: "JESSICA" logo in elegant serif type at the top of the frame (top 15–20%). Below the logo, a short luxury headline runs horizontally. Cover-line text in small elegant type appears on the left column and right column alongside the figure's body, not overlapping the face. A small bilingual text line near the bottom
- OVERLAP: Cover-line columns flank both sides of the body; only the lower torso area may have light text proximity`,
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
    style: 'ELLE Korea magazine editorial, clean white ELLE logo, modern Korean editorial photography, elegant fashion portrait',
    layoutDescription: `COMPOSITION BLUEPRINT — ELLE KOREA magazine:
- FRAMING: 3/4 body to full-body editorial portrait; figure from head to roughly the knee or below
- SCALE: Person occupies 75–85% of the frame height; tall and elongated presence
- VERTICAL POSITION: Head near the top 10–15% of the frame; legs extend to near the bottom; almost no top margin above the head
- HORIZONTAL POSITION: Model slightly left-of-center or centered; one shoulder may be higher, creating dynamic asymmetry
- POSE: Confident editorial fashion pose; body in a natural but intentional 3/4 stance; slight contrapposto; looking directly at the camera or with a slightly angled gaze; one hand may be at waist or naturally positioned
- BACKGROUND: Clean minimal (white, off-white, or light grey studio) or a suggested outdoor/architectural environment; background is visible but secondary to the figure
- TEXT LAYOUT: "ELLE" in clean white or black sans-serif logo at top-center (top 12%). Headline text in moderate-size type positioned to one side (left or right column) of the body, aligned with the mid-body area. Artist/cover name in medium text. Minimal text — no more than 3–4 text elements total
- OVERLAP: Minimal overlap; text placed alongside the figure rather than over it`,
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
    layoutDescription: `COMPOSITION BLUEPRINT — eCi magazine:
- FRAMING: Bust to waist-up portrait; head through upper torso clearly shown
- SCALE: Person occupies approximately 60–70% of the frame height
- VERTICAL POSITION: Head at approximately 20–30% from top; torso ending near 75% from top; comfortable margins above and below
- HORIZONTAL POSITION: Model centered; may lean slightly to one side in a casual youthful pose
- POSE: Casual, approachable pose typical of early 2000s Korean magazine style; slight tilt of the head; friendly direct gaze; relaxed arms and shoulders; youthful and natural
- BACKGROUND: Light neutral or subtle gradient background; may have very light graphical Y2K design elements (stars, soft shapes) at the edges
- TEXT LAYOUT: Magazine logo "eCi" in the top-left or top-center with a colored accent (green). Issue date in small text. Several text callouts of medium size appear on the left side and right side of the portrait, listing features. These text elements frame the model's body on both sides
- OVERLAP: Side text columns align with the torso area; the face zone is kept clear`,
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
    style: '2002 Korean fashion magazine 유행통신, Y2K early 2000s Korean style, busy colorful layout with many text boxes, trendy portrait with fashion items',
    layoutDescription: `COMPOSITION BLUEPRINT — 유행통신 magazine:
- FRAMING: Full-body or 3/4 body portrait showing the complete outfit from head to feet
- SCALE: Person occupies 70–80% of the frame height; full figure clearly visible
- VERTICAL POSITION: Head at approximately 10–15% from top; feet or lower legs near the bottom of the frame
- HORIZONTAL POSITION: Model centered; full-body stance with both feet visible
- POSE: Y2K fashion stance; full-body pose showing the complete outfit; slight dynamic lean or weight shift; face toward camera with trendy expression; arms possibly posed to show outfit detail
- BACKGROUND: Clean white or light background with colorful Y2K graphic elements (geometric shapes, stars, color blocks) scattered in the empty corners around the figure
- TEXT LAYOUT: Magazine title "유행통신" at the top in colorful display type. Multiple colored text boxes and callouts are packed into all available space surrounding the figure — left side, right side, above and below — creating a busy info-dense layout. Small product/price tags may appear near clothing items. A main feature headline in the largest text size overlaps the upper body/shoulder area
- OVERLAP: Many text elements overlap the lower body and outer body areas; the face and head zone are generally kept clear`,
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
    layoutDescription: `COMPOSITION BLUEPRINT — FRONTROW magazine:
- FRAMING: 3/4 body portrait; upper body prominent, lower legs may be cropped
- SCALE: Person occupies approximately 70–80% of the frame height
- VERTICAL POSITION: Head at approximately 15–20% from top; figure extends to approximately 85–90% from top
- HORIZONTAL POSITION: Model centered or very slightly off-center; clean balanced composition
- POSE: Refined, still editorial pose; slight 3/4 turn of body; head tilted or level; calm, composed high-fashion gaze; one hand may be placed at waist or naturally hanging
- BACKGROUND: Clean neutral light grey or off-white studio background; completely smooth, no texture, no environment — pure studio minimalism
- TEXT LAYOUT: "FRONTROW" in large premium serif type is placed prominently — it either sits in the upper 20–25% above the head, OR large letters span across the chest/torso area of the model as a design overlay. A short elegant subtitle sits below the main title. No text on the sides. Very few text elements — maximum 2–3 lines total, placed to coexist beautifully with the figure
- OVERLAP: The main title text may partially overlap the upper body/chest area of the model as an intentional typographic design element`,
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
    layoutDescription: `COMPOSITION BLUEPRINT — Harper's BAZAAR Korea magazine:
- FRAMING: 3/4 body to full-body fashion portrait; the complete fashion look should be visible
- SCALE: Person occupies approximately 75–85% of the frame height; elongated, fashion-editorial scale
- VERTICAL POSITION: Head near the top 10–15% of the frame; legs or lower body visible near the bottom; very little margin above head
- HORIZONTAL POSITION: Model centered or slightly off-center (left or right); asymmetric composition is acceptable
- POSE: High-fashion editorial stance; confident, elongated posture; one hip slightly cocked (contrapposto); arms in a deliberate position (one on hip, one at side, or both relaxed); strong, composed gaze toward camera; very editorial and intentional in every detail
- BACKGROUND: Clean white, very light grey, or seamless studio background; open and breathable; background is visible especially above the head and to the sides, giving the cover a spacious luxury feel
- TEXT LAYOUT: "Harper's BAZAAR" in the classic large serif logotype at the top-center or top-left (top 15–20% of frame). A short elegant cover-line headline in medium type appears to one side of the body or below the shoulder area. The cover-name (model name) in elegant small type. Handwritten or script accent text as a design detail near the lower portion. Total text is restrained and elegant
- OVERLAP: Logo sits above head; some text may brush against the shoulder; face and most of body remain clear`,
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
    style: 'KPOP LIFE fan magazine clean white layout, full-body casual portrait, simple sans-serif typography, clean bright editorial style',
    layoutDescription: `COMPOSITION BLUEPRINT — KPOP LIFE magazine:
- FRAMING: Full-body portrait; complete figure from head to feet is visible
- SCALE: Person occupies 80–90% of the frame height; large presence with minimal margins above and below
- VERTICAL POSITION: Head near the top 8–12% of the frame; feet near the bottom 5–10% of the frame; the person fills nearly the entire height
- HORIZONTAL POSITION: Model centered; may have a slight lean or casual stance
- POSE: Casual, youthful K-pop idol style pose; full-body visible; natural standing or a simple dynamic pose (slight lean, one hand in pocket, or a gentle arm gesture); friendly direct gaze toward camera; approachable and charming energy
- BACKGROUND: Completely clean white or very light neutral background; no environmental elements; pure white studio feel
- TEXT LAYOUT: "KPOP LIFE" magazine title in clean sans-serif at the top-center (top 10–12%). Artist or cover model name in medium-large clean type positioned either below the title or near the model's mid-body area. A short headline like "No Limits" or a feature callout in large text, positioned to one side of the figure or below the waist. Minimal text overall — clean and uncluttered
- OVERLAP: Almost no text overlaps the figure; text is placed above the head or alongside the body`,
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
    layoutDescription: `COMPOSITION BLUEPRINT — TIME magazine:
- FRAMING: Tight head-and-shoulders to chest-up portrait; face is the absolute focal point
- SCALE: Head and upper chest fill approximately 65–75% of the frame height; face is large and commanding
- VERTICAL POSITION: Face centered in the middle of the frame; eyes approximately at the 35–45% mark from top; chin at approximately 65–70% from top
- HORIZONTAL POSITION: Model perfectly centered; symmetrical, iconic, dignified framing
- POSE: Frontal or near-frontal; strong, serious, authoritative expression; looking directly into the camera; very still and controlled; no dynamic action — gravitas and presence are the goal; jaw set, posture upright
- BACKGROUND: Dark, moody, near-black or very deep dark grey/navy background; dramatic Rembrandt-style or single-source lighting on the face; background is almost nothing
- TEXT LAYOUT: Bold red "TIME" logo at the top-center spanning approximately 80% of the frame width (top 12–15%). A short white headline in clean sans-serif appears in the lower-center area, either below the chin or overlapping the chest area of the subject. Very minimal text — only the logo and one headline. Red border frame around entire cover may be present
- OVERLAP: The "TIME" logo sits above the head; the headline may overlap the lower chest/neck area`,
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
    layoutDescription: `COMPOSITION BLUEPRINT — BEAUTY STYLE magazine:
- FRAMING: Full-body commercial portrait; entire figure from head to feet clearly visible
- SCALE: Person occupies approximately 80–90% of the frame height; large, commercial, product-catalog scale
- VERTICAL POSITION: Head at approximately 8–12% from the top; feet at approximately 90–95% from the top; almost fills the entire frame vertically
- HORIZONTAL POSITION: Model centered; slight commercial pose stance
- POSE: Upright commercial pose; natural standing position; weight evenly distributed or slight pose with one hip forward; slight smile or confident approachable expression; looking directly at camera; outfit fully visible from head to toe; arms at sides or slightly forward in a welcoming gesture
- BACKGROUND: Solid vibrant color (purple/violet or similarly bright commercial tone); completely clean background with no texture or environment; commercial catalog aesthetic
- TEXT LAYOUT: Magazine title "BEAUTY STYLE" in large commercial sans-serif type at the top, spanning the full width above the head. A short shopping or lifestyle headline below the title. Text callouts with product/feature information arranged in the bottom margin below the feet. Possible small badge or price elements in corners
- OVERLAP: All text is above the head or below the feet; the figure itself has minimal text overlap`,
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
    style: 'Cosmopolitan China magazine cover, bold bilingual logo, glamorous celebrity portrait in white outfit, high gloss fashion photography, vibrant editorial typography',
    layoutDescription: `COMPOSITION BLUEPRINT — Cosmopolitan magazine:
- FRAMING: Waist-up to chest-up glamorous portrait; head through waist visible
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 20–28% from top; waist area at approximately 80% from top; good breathing room above the head
- HORIZONTAL POSITION: Model centered; slight 3/4 turn or facing camera directly
- POSE: Glamorous celebrity-style pose; confident, radiant expression; may have a hand gesture (touching collar, hand on hip, or arms at a flattering angle); looking directly into camera with high-energy appeal; elegant, polished
- BACKGROUND: White or light neutral background (may have very subtle tone); high-key commercial-gloss lighting; clean and bright
- TEXT LAYOUT: "Cosmopolitan" logotype in large bold type at the top-center, bilingual if applicable (top 15–20%). A bold main headline appears prominently — positioned to the left side of the figure AND overlapping the lower torso/hip area of the model, wrapping around the figure. Multiple short cover-lines appear on both left and right margins alongside the body. Model name in medium type at the bottom area
- OVERLAP: Cover-lines and the main headline overlap the torso and sides of the figure; face kept clear`,
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
    style: 'Rolling Stone Japan magazine cover, classic Rolling Stone script logo, moody dark portrait with dramatic low-key lighting, music magazine editorial',
    layoutDescription: `COMPOSITION BLUEPRINT — Rolling Stone magazine:
- FRAMING: Waist-up to 3/4 body portrait; upper body and part of lower body visible
- SCALE: Person occupies approximately 65–75% of the frame height
- VERTICAL POSITION: Head at approximately 15–25% from top; waist/hip at approximately 75–80% from top
- HORIZONTAL POSITION: Model centered or slightly off-center (left or right) for an editorial, less-commercial feel
- POSE: Music artist editorial pose; casual-cool energy; may have a slight lean, arms crossed, or one hand in pocket; looking directly at camera with a confident or introspective expression; not rigidly formal — natural and authentic; may have slight head tilt
- BACKGROUND: Dark moody background (deep black, dark grey, or very dark navy); dramatic single-source or low-key lighting that sculpts the face; atmospheric, not clean studio
- TEXT LAYOUT: Classic "Rolling Stone" script logotype at the top-center or top-left, spanning approximately 70% of the frame width (top 15%). Artist or feature name in bold display type positioned below the logo or in a column to one side of the figure. A short headline in medium type near the mid-body area. Footer text in small type at the very bottom
- OVERLAP: Logo sits above the head; artist name may overlap the shoulder area; the face is kept clear`,
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
    style: 'VOGUE Korea modern fashion cover, classic VOGUE logo, high fashion editorial portrait, sophisticated luxury aesthetic',
    layoutDescription: `COMPOSITION BLUEPRINT — VOGUE KOREA magazine:
- FRAMING: Full-body to 3/4 body high-fashion portrait; the complete fashion look should be celebrated
- SCALE: Person occupies approximately 80–88% of the frame height; commanding, full presence
- VERTICAL POSITION: Head at approximately 10–15% from top; lower body (legs/feet) visible near the bottom; minimal margins — the figure commands the entire frame
- HORIZONTAL POSITION: Model centered or slightly off-center with deliberate compositional asymmetry
- POSE: Signature high-fashion Vogue editorial pose; elongated, sophisticated posture; deliberate, artful body angle (3/4 turn, contrapposto, or architectural stance); one leg slightly in front; arms positioned with intention; gaze is confident and enigmatic — may look directly at camera or with a slightly averted, contemplative expression; the total impression is luxury and art
- BACKGROUND: Seamless white or very pale grey studio background, completely clean; OR a carefully lit, minimal environment that doesn't compete with the figure; always open and spacious
- TEXT LAYOUT: "VOGUE" in the iconic classic serif logotype at the top-center or top spanning the full width (top 12–15%). Cover model name in elegant type below the logo or beside the upper body. 2–3 short cover-lines in small refined type positioned to one side (left or right column) of the lower body. The typography is restrained, high-end, and minimal
- OVERLAP: Logo above head; cover-lines alongside the body — the figure's face and main body remain clear`,
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
    layoutDescription: `COMPOSITION BLUEPRINT — D/I/D/O/T magazine:
- FRAMING: Head-and-shoulders to bust portrait; face and upper body are the primary subject, interacting with typography
- SCALE: Person occupies approximately 55–65% of the frame height; the typography occupies significant visual space alongside the figure
- VERTICAL POSITION: Face centered in the upper-middle zone of the frame; head at approximately 20–35% from top; the lower portion of the frame is dominated by large typographic elements
- HORIZONTAL POSITION: Model centered or placed to interact with the typography layout; may be slightly offset to allow large letters to appear beside or behind the face
- POSE: Avant-garde editorial pose; direct and intense gaze into the camera; head and upper body may be slightly tilted or positioned unconventionally; strong, graphic, expressive — the person is as much a design element as the type
- BACKGROUND: Pure white or pure black; extremely high-contrast black-and-white treatment; no mid-tones in the background; stark and graphic
- TEXT LAYOUT: The title "D/I/D/O/T" is deconstructed — individual letters (D, I, D, O, T) are placed at very large scale in different positions around and overlapping the portrait. Some letters may be behind the figure, some in front, some at the edges. Large-scale typography fills the empty space around the person. Issue number or headline text in a contrasting smaller size in one corner or below the portrait
- OVERLAP: Large individual letters directly overlap the face, shoulders, and body — this deliberate typographic overlay is a defining feature of the design`,
    editableTexts: [
      { key: 'title', label: '매거진명', placeholder: 'D/I/D/O/T' },
      { key: 'headline', label: '메인 카피', placeholder: 'ISSUE / 67' },
    ],
  },
];

export function getCoverTemplate(id: string): CoverTemplate | undefined {
  return COVER_TEMPLATES.find((t) => t.id === id);
}
