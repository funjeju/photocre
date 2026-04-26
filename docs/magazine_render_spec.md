# 매거진 레이아웃 렌더링 시스템 — 구현 명세서

## ⚡ 핵심 원칙

**이 시스템은 런타임에 AI를 절대 호출하지 않습니다.**

유저 사진 → AI 스타일 변환 (별도 기존 기능) → **순수 코드/JSON 매칭** → PNG 다운로드

매거진 레이아웃 생성 단계는 100% 결정론적(deterministic) 매핑입니다. Claude Code는 콘텐츠를 생성하지 않고, 이미 정의된 콘텐츠를 슬롯에 배치하는 렌더링 로직만 만듭니다.

---

## 📥 입력

```typescript
type RenderInput = {
  images: string[]           // 1~4장의 변환된 이미지 URL 또는 base64
  imageCount: 1 | 2 | 3 | 4  // images.length
  seed?: number              // 옵션 - 같은 입력에 같은 결과 원할 때
}
```

## 📤 출력

```typescript
type RenderOutput = {
  pngBlob: Blob              // 다운로드용 PNG
  templateId: string         // 사용된 템플릿 (예: "1-01")
  contentSetIndex: number    // 사용된 콘텐츠 세트 인덱스 (0~9)
  width: number              // 픽셀 단위
  height: number
}
```

---

## 🗂️ JSON 구조 (magazine_layouts_v5.json)

```typescript
type MagazineLayouts = {
  schema_version: "5.0-final"
  templates: Template[]      // 길이 40 (4 chapters × 10 templates)
}

type Template = {
  id: string                 // "1-01" ~ "4-10" (chapter-num)
  name: string
  description: string
  imageCount: 1 | 2 | 3 | 4  // 첫 자리 숫자 = 이미지 개수
  style: string
  aspectRatio: "4:3" | "3:4" // 가로 또는 세로
  background: string         // 배경 키워드 ("paper_white", "color_block_red", etc.)
  images: ImageSlot[]        // 이미지 좌표 (length === imageCount)
  texts: TextSlot[]          // 텍스트 슬롯
  decorations: any[]         // 장식 요소 (선, 도형 등)
  char_limits: Record<string, CharLimit>  // 슬롯별 글자수 한도
  dedicated_sets: ContentSet[]  // 길이 10, 콘텐츠 후보군
}

type ImageSlot = {
  x: number   // % (0~100)
  y: number   // %
  w: number   // %
  h: number   // %
}

type TextSlot = {
  type: "eyebrow" | "title" | "byline" | "body" | "vertical" | "folio" | "kicker" | ...
  x: number      // %
  y: number      // %
  w: number      // %
  h: number      // %
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl"
  rotation?: 0 | -90 | 90  // 도 단위
}

type CharLimit = {
  min: number
  ideal: number
  max: number
  lines: number
  case: "uppercase" | "title" | "sentence" | "lowercase" | "numeric" | "mixed"
}

type ContentSet = Record<string, string | object>
// 예: { "eyebrow": "— CHAPTER ONE", "title": "Mountain Quietude", "body": "...", ... }
// 키는 TextSlot.type과 매칭됨. 같은 type이 여러 개면 "type_2", "type_3" 같이 suffix 붙음
```

---

## 🔧 핵심 함수 시그니처

```typescript
// 1. imageCount에 맞는 템플릿 후보군 필터
function getTemplatesForImageCount(
  layouts: MagazineLayouts,
  imageCount: 1 | 2 | 3 | 4
): Template[] {
  return layouts.templates.filter(t => t.imageCount === imageCount)
  // 결과: 항상 길이 10 (각 chapter당 10 템플릿)
}

// 2. 무작위 템플릿 선택
function pickRandomTemplate(templates: Template[], seed?: number): Template {
  const idx = seed !== undefined 
    ? seed % templates.length 
    : Math.floor(Math.random() * templates.length)
  return templates[idx]
}

// 3. 무작위 콘텐츠 세트 선택
function pickRandomContentSet(template: Template, seed?: number): ContentSet {
  const sets = template.dedicated_sets
  const idx = seed !== undefined 
    ? Math.floor(seed / 10) % sets.length 
    : Math.floor(Math.random() * sets.length)
  return sets[idx]
}

// 4. 메인 렌더 함수
async function renderMagazinePage(input: RenderInput): Promise<RenderOutput> {
  const layouts = await import('@/data/magazine_layouts_v5.json')
  const candidates = getTemplatesForImageCount(layouts, input.imageCount)
  const template = pickRandomTemplate(candidates, input.seed)
  const contentSet = pickRandomContentSet(template, input.seed)
  
  // Konva 또는 Canvas API로 렌더
  const canvas = await renderToCanvas(template, input.images, contentSet)
  const pngBlob = await canvasToPNG(canvas)
  
  return { 
    pngBlob, 
    templateId: template.id, 
    contentSetIndex: /* ... */, 
    width: canvas.width, 
    height: canvas.height 
  }
}
```

---

## 🎨 렌더링 가이드 (Konva 기준)

### 1. 캔버스 크기

```typescript
const PAGE_WIDTH = 1600   // 또는 원하는 export 해상도
const PAGE_HEIGHT = template.aspectRatio === "4:3" 
  ? PAGE_WIDTH * 3 / 4 
  : PAGE_WIDTH * 4 / 3
```

### 2. 좌표 변환 (% → px)

```typescript
function pctToPx(pct: number, total: number): number {
  return (pct / 100) * total
}

// 이미지 슬롯 배치
template.images.forEach((slot, i) => {
  const x = pctToPx(slot.x, PAGE_WIDTH)
  const y = pctToPx(slot.y, PAGE_HEIGHT)
  const w = pctToPx(slot.w, PAGE_WIDTH)
  const h = pctToPx(slot.h, PAGE_HEIGHT)
  
  // Konva.Image with object-fit: cover behavior
  const img = new Konva.Image({ x, y, width: w, height: h, image: htmlImage })
  // 이미지가 슬롯에 가득 차도록 cover crop
  layer.add(img)
})
```

### 3. 텍스트 슬롯 처리

```typescript
// size → 폰트 크기 맵핑 (캔버스 너비 기준)
const SIZE_TO_FONTSIZE: Record<string, (pageW: number) => number> = {
  xs: w => w * 0.010,
  sm: w => w * 0.014,
  md: w => w * 0.020,
  lg: w => w * 0.030,
  xl: w => w * 0.040,
  "2xl": w => w * 0.055,
  "3xl": w => w * 0.075,
  "4xl": w => w * 0.100,
  "5xl": w => w * 0.130,
  "6xl": w => w * 0.170,
}

template.texts.forEach((slot, i) => {
  // 같은 type이 여러 개면 suffix
  const sameTypeBefore = template.texts.slice(0, i).filter(s => s.type === slot.type).length
  const key = sameTypeBefore === 0 ? slot.type : `${slot.type}_${sameTypeBefore + 1}`
  
  const text = contentSet[key]
  if (!text) return
  
  const fontSize = SIZE_TO_FONTSIZE[slot.size || "sm"](PAGE_WIDTH)
  const x = pctToPx(slot.x, PAGE_WIDTH)
  const y = pctToPx(slot.y, PAGE_HEIGHT)
  const w = pctToPx(slot.w, PAGE_WIDTH)
  const h = pctToPx(slot.h, PAGE_HEIGHT)
  
  const konvaText = new Konva.Text({
    x, y, width: w, height: h,
    text: typeof text === 'string' ? text : formatInfobox(text),
    fontSize,
    fontFamily: getFontFamily(slot.type),
    fill: getTextColor(slot.type, template.background),
    rotation: slot.rotation || 0,
    align: getTextAlign(slot.type),
  })
  layer.add(konvaText)
})
```

### 4. 슬롯 type별 폰트/색상 매핑

```typescript
const TYPE_TO_FONT: Record<string, string> = {
  eyebrow:    "Inter, sans-serif",        // small caps style
  title:      "Georgia, serif",
  body:       "Georgia, serif",
  byline:     "Inter, sans-serif",
  pullquote:  "Georgia, serif",           // italic
  caption:    "Inter, sans-serif",
  vertical:   "Georgia, serif",           // italic, vertical writing
  script:     "Brush Script MT, cursive", // 손글씨체
  masthead:   "Inter, sans-serif",        // bold uppercase
  number:     "Georgia, serif",           // big serif
  runninghead:"Inter, sans-serif",
  folio:      "Inter, sans-serif",
  kicker:     "Georgia, serif",           // italic intro
  infobox:    "Inter, sans-serif",
  label:      "Inter, sans-serif",        // big label
}

// case에 따른 텍스트 변환
function applyCase(text: string, caseStyle: string): string {
  switch (caseStyle) {
    case "uppercase": return text.toUpperCase()
    case "lowercase": return text.toLowerCase()
    case "title":     return text  // 이미 title case로 작성됨
    default:          return text
  }
}
```

### 5. infobox 슬롯 (객체 → 멀티라인 텍스트)

```typescript
// infobox는 dict {key: value} 구조 — 표 형식으로 렌더
function formatInfobox(infobox: Record<string, string>): string {
  return Object.entries(infobox)
    .map(([k, v]) => `${k.toUpperCase()}\n${v}`)
    .join("\n\n")
}
```

### 6. 배경 처리

```typescript
const BACKGROUND_PRESETS: Record<string, string> = {
  paper_white:        "#FAFAFA",
  paper_cream:        "#F4F0E8",
  paper_beige:        "#F2EFEA",
  color_block_red:    "#C8392E",
  cinematic_black:    "#0A0A0A",
  newsprint:          "#F8F5EE",
  // ...
}

const bg = new Konva.Rect({
  x: 0, y: 0, 
  width: PAGE_WIDTH, height: PAGE_HEIGHT,
  fill: BACKGROUND_PRESETS[template.background] || "#FAFAFA"
})
layer.add(bg)
```

### 7. PNG Export

```typescript
async function canvasToPNG(stage: Konva.Stage): Promise<Blob> {
  const dataUrl = stage.toDataURL({ 
    mimeType: 'image/png', 
    quality: 1.0,
    pixelRatio: 2  // retina용
  })
  const response = await fetch(dataUrl)
  return await response.blob()
}
```

---

## 🧪 테스트 케이스

```typescript
// 같은 인풋 → 같은 결과 (seed 사용)
const r1 = await renderMagazinePage({ images: [...], imageCount: 1, seed: 42 })
const r2 = await renderMagazinePage({ images: [...], imageCount: 1, seed: 42 })
expect(r1.templateId).toBe(r2.templateId)

// imageCount === 1 이면 templateId가 "1-XX"로 시작
const r = await renderMagazinePage({ images: [img], imageCount: 1 })
expect(r.templateId).toMatch(/^1-\d{2}$/)

// 콘텐츠가 char_limits 안에 있는지 확인 (이미 검증됐지만 안전성)
// — JSON에 들어있는 콘텐츠는 빌드 시점에 모두 max 한도 내로 검증됨
```

---

## 🚫 하지 말아야 할 것

1. **런타임에 LLM 호출** — 이 시스템은 AI 호출 없이 동작합니다.
2. **콘텐츠 동적 생성** — 모든 텍스트는 `dedicated_sets`에 이미 들어있습니다.
3. **char_limits 무시** — JSON에 든 콘텐츠는 이미 검증됐지만, 만약 외부에서 콘텐츠 변경하면 검증 필요.
4. **magazine_layouts_v5.json을 LLM 컨텍스트에 통째로 넣기** — 459KB라 컨텍스트 다 먹습니다. 코드에서 `import`만 하세요.

---

## 📁 권장 파일 구조

```
photocre/
├── data/
│   └── magazine_layouts_v5.json        # 런타임 데이터 (코드에서 import)
├── lib/
│   └── magazine/
│       ├── render.ts                   # renderMagazinePage 메인 함수
│       ├── konva-renderer.ts           # Konva 렌더 로직
│       ├── slot-utils.ts               # 좌표/크기/색상 매핑
│       └── types.ts                    # 위 TypeScript 타입 정의
├── components/
│   └── MagazineRenderer.tsx            # React 컴포넌트 (Konva Stage 호스트)
└── docs/
    └── magazine_render_spec.md         # 이 파일
```

---

## ✅ Claude Code에게 줄 한 줄 명령

> "이 SPEC.md 보고 lib/magazine/ 폴더 안에 render.ts, konva-renderer.ts, slot-utils.ts, types.ts 만들어줘. 데이터는 data/magazine_layouts_v5.json에서 import해서 쓰면 되고 (분석할 필요 없음), 핵심 함수는 renderMagazinePage이야. AI 호출 절대 하지 말고 순수 매핑 로직으로만 작성."

이 한 줄이면 Claude Code는 SPEC만 보고 전체 시스템을 짤 수 있습니다. JSON 콘텐츠 자체는 import만 하면 되니 컨텍스트에 들어갈 일 없어요.
