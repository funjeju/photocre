# Framelab — Product & Technical Spec

> 전체 기능·디자인·기술·API·프리셋 상세 스펙.
> 프로젝트 원칙·규칙은 `CLAUDE.md` 참조.

## 목차

1. [Overview](#1-overview)
2. [User Journeys](#2-user-journeys)
3. [Feature Spec — 기능1: Studio (메인 생성기)](#3-feature-spec--기능1-studio-메인-생성기)
4. [Feature Spec — 기능2: Apply (템플릿 재적용)](#4-feature-spec--기능2-apply-템플릿-재적용)
5. [Design System](#5-design-system)
6. [Preset Data](#6-preset-data)
7. [Tech Architecture](#7-tech-architecture)
8. [Gemini API Integration](#8-gemini-api-integration)
9. [Firebase Schema & Security Rules](#9-firebase-schema--security-rules)
10. [Credits System (확장 대비)](#10-credits-system-확장-대비)
11. [Roadmap & Phases](#11-roadmap--phases)
12. [Open Questions / TODO](#12-open-questions--todo)

---

## 1. Overview

### 핵심 가치
**"한 번 맘에 드는 이미지를 만들었으면, 같은 톤으로 다음 것들은 클릭 한 번에."**

SNS용 감성 사진을 매번 처음부터 프레임·스타일·배경 고르는 번거로움을 없앰. 첫 결과를 "템플릿"으로 저장하면 이후 사진들은 업로드만으로 같은 시리즈를 생성.

### 타깃
- 인스타·블로그·개인 프로젝트용 감성 이미지가 필요한 개인 사용자
- 브랜드 중립. 제주·여행·음식 등 특정 버티컬에 치우치지 않음.

### 비즈니스 모델 (단계적)
1. **Phase 1 (지금)**: 개인 사용만. 오너 계정은 무제한, 일반 로그인 사용자는 일일 무료 크레딧 N회.
2. **Phase 4+**: 크레딧 구매(Stripe) 또는 월 구독. 구조는 지금부터 대비.

---

## 2. User Journeys

### Journey A — 첫 이미지 만들기 (기능1)

```
[로그인] → [Studio 진입] 
  → [사진 업로드] 
  → [크롭 다이얼로그: 비율 선택 + 영역 지정] 
  → [프레임 선택 (카드 그리드)] 
  → [배경 선택 (카드 그리드 + 업로드)] 
  → [스타일 변형 선택 (카드 그리드, "변형 없음" 포함)] 
  → [텍스트 입력 + 폰트·색 선택 (선택사항)] 
  → [미리보기 영역에서 텍스트 위치 드래그 조정] 
  → [생성 버튼] 
  → [로딩 (약 5~15초)] 
  → [결과 뷰어: 다운로드 / 다시 생성 / 템플릿으로 저장]
```

### Journey B — 템플릿으로 시리즈 생성 (기능2)

```
[로그인] → [Apply 진입] 
  → [저장된 템플릿 목록에서 하나 선택] 
  → [새 사진 1장 또는 여러 장 업로드] 
  → [각 사진마다 자동 파이프라인 실행] 
    (= 저장된 크롭 비율 · 프레임 · 배경 · 스타일 · 텍스트 재사용)
  → [결과 갤러리: 개별 다운로드 / 전체 ZIP 다운로드]
```

### Journey C — 템플릿 관리

```
[Templates 탭] 
  → [저장된 템플릿 카드 그리드] 
  → [각 카드: 썸네일 + 이름 + 사용 횟수 + 메뉴(이름 변경 / 삭제 / 기본 설정)]
```

---

## 3. Feature Spec — 기능1: Studio (메인 생성기)

### 3.1 페이지 레이아웃 (`/studio`)

**데스크탑 (≥ lg, 1024px+)**
```
┌──────────────────────────────────────────────┐
│ Header (로고 | 탭: Studio·Apply·Templates·History | 크레딧 배지 | 아바타) │
├────────────────────┬─────────────────────────┤
│                    │  Right Panel (400px)     │
│   Canvas Preview   │  ├ 사진 업로드           │
│   (중앙 정렬,      │  ├ 크롭 버튼             │
│   영역별 영역화)   │  ├ 프레임 (스크롤 그리드)│
│                    │  ├ 배경 (스크롤 그리드) │
│                    │  ├ 스타일 (스크롤 그리드)│
│                    │  ├ 텍스트 입력           │
│                    │  └ [생성] 버튼 (sticky) │
└────────────────────┴─────────────────────────┘
```

**모바일 (< md, 768px)**
- 상단 캔버스 (고정 높이 55vh)
- 하단 도구 영역은 `vaul` 바텀시트 → 탭 전환 (프레임/배경/스타일/텍스트)
- 하단 고정 [생성] 버튼 (full-width, `pb-safe`)

### 3.2 상태 모델 (zustand or React Context)

```ts
type StudioState = {
  // 1. 입력
  sourceImage: { blob: Blob; previewUrl: string } | null;
  
  // 2. 크롭
  crop: { x: number; y: number; width: number; height: number } | null;
  aspectRatio: '1:1' | '4:5' | '3:4' | '9:16' | '16:9' | 'free';
  croppedImage: { blob: Blob; previewUrl: string } | null;
  
  // 3. 선택 프리셋
  frameId: string | null;        // 'polaroid-classic' 등
  backgroundId: string | null;   // 'white' | 'studio-gray' | custom:xxx
  customBackground: { blob: Blob; url: string } | null;
  styleId: string | null;        // 'none' | 'ghibli' | 'pixar' 등
  
  // 4. 텍스트 오버레이
  textOverlay: {
    content: string;
    fontFamily: string;          // Google Fonts name
    fontSize: number;            // px (캔버스 기준)
    color: string;
    position: { x: number; y: number }; // 0~1 비율
    alignment: 'left' | 'center' | 'right';
    weight: number;
  } | null;
  
  // 5. 출력
  outputResolution: '1K' | '2K' | '4K';  // 기본 1K
  generatedImage: { url: string; id: string } | null;
  isGenerating: boolean;
};
```

### 3.3 각 단계 UI 상세

#### (1) 사진 업로드
- 드롭존 + 클릭 업로드 (shadcn 커스텀, `lucide-react`의 `ImageUp` 아이콘)
- 지원 포맷: JPG, PNG, WebP, HEIC (HEIC는 `heic2any`로 브라우저 변환)
- 최대 10MB. 초과 시 sonner 토스트로 안내 + 자동 리사이즈 제안
- 업로드 즉시 **클라에서 리사이즈**: 긴 변 2048px 이하로 (browser-image-compression 라이브러리)

#### (2) 크롭
- `react-easy-crop` 사용. 
- 비율 프리셋 칩 (1:1 / 4:5 / 3:4 / 9:16 / 16:9 / 자유) — 기본 1:1
- 크롭 다이얼로그(데스크탑) / 풀스크린 다이얼로그(모바일).
- 확인 시 Canvas로 실제 크롭된 이미지 blob 생성.

#### (3) 프레임 선택
- 가로 스크롤 카드 리스트 (2 rows × n cards, snap-scroll).
- 각 카드: 썸네일 + 이름. 선택 시 `ring-2 ring-accent`.
- "프레임 없음" 옵션 포함.
- 프레임 종류는 `lib/presets/frames.ts`에 정의 (아래 §6 참조).

#### (4) 배경 선택
- 프레임과 동일한 카드 그리드.
- 옵션: White / Studio Gray Gradient / Warm Pastel / Cool Pastel / Linen / Bokeh / Keep Original / **Custom Upload**.
- Custom Upload는 맨 앞 "+" 카드. 업로드 시 클라 리사이즈 후 썸네일로 표시.
- "스타일에 어울리는 자동" 옵션 (AI가 배경도 제안) — Phase 2 추가.

#### (5) 스타일 변형
- 카드 그리드. 각 카드는 해당 스타일로 변환된 **동일 샘플 사진**을 보여줌 (스타일 감 파악용).
- "변형 없음 (원본 유지)" 맨 앞에.
- 스타일 종류는 `lib/presets/styles.ts`에 정의 (아래 §6 참조).

#### (6) 텍스트 오버레이
- 입력창(최대 80자, 2줄) + 폰트 드롭다운 + 굵기·색상·정렬.
- 폰트는 Google Fonts에서 `<link>` 동적 로드 (선택 시에만 load).
- 기본 위치: **프레임마다 프리셋 정의** (예: 폴라로이드는 하단 흰 영역, 풀블리드는 하단 중앙).
- 미리보기에서 **드래그로 위치 조정** (`react-konva` Text 노드).

#### (7) 생성 버튼
- 전체 단계 모든 것이 선택됐을 때 활성화 (사진 + 프레임 + 배경 + 스타일 최소). 텍스트는 선택사항.
- 클릭 시 credits 체크 → 부족하면 토스트 + 크레딧 충전 안내 모달.
- 생성 중 상태: 버튼 로딩 + 캔버스 영역에 스켈레톤 오버레이.

#### (8) 결과 뷰어
- 결과 이미지 + 아래 버튼 4개:
  - [다운로드] — PNG 저장
  - [다시 생성] — 같은 설정으로 재시도 (variation)
  - [템플릿으로 저장] — 모달에서 이름 입력
  - [공유 링크] — Phase 3+

### 3.4 생성 파이프라인 (클라 → 서버 → 클라)

```
[클라]
  1. 크롭된 이미지 (Blob) 준비
  2. 선택 프리셋 ID들 수집
  3. 텍스트 오버레이 설정 수집
  4. POST /api/generate (multipart or base64)

[서버 /api/generate]
  1. Firebase Auth 토큰 검증
  2. 사용자 credits 체크 (남은 크레딧 >= 1)
  3. 업로드 이미지를 Firebase Storage에 저장 (input/{uid}/{ts}.webp)
  4. lib/gemini/compose.ts 로 프롬프트 합성
     (프레임 + 배경 + 스타일 프리셋을 자연어 프롬프트 한 덩어리로 변환)
  5. Gemini API 호출 (gemini-2.5-flash-image)
     - input: 사용자 이미지 + (custom background 있으면) 배경 이미지
     - output: 생성 이미지 (base64 or URL)
  6. 생성 이미지를 Firebase Storage에 저장 (output/{uid}/{gen_id}.webp)
  7. Firestore에 Generation 문서 기록
  8. credits -= 1
  9. 클라에 {outputUrl, generationId, cost} 반환

[클라]
  1. 서버 응답 이미지를 로드
  2. react-konva 캔버스에 합성:
     - 배경 레이어: 서버에서 받은 AI 생성 이미지
     - 텍스트 레이어: 클라에서 실시간 렌더링 (Konva Text)
  3. [다운로드] 클릭 시 Konva stage를 PNG로 export → 다운로드
```

### 3.5 핵심 설계 결정 — **텍스트는 클라에서 합성**

AI 모델(Gemini Image)도 텍스트 렌더링이 가능하지만:
- 한글 폰트 파일을 API에 직접 넘길 수 없음
- 매번 재생성 시 비용 발생
- 위치·색 편집이 불가능

**→ 텍스트는 AI 이미지 위에 `react-konva` 레이어로 클라에서 합성.** 이 방식의 이점:
- Google Fonts 10+10 자유 선택 가능
- 드래그로 위치 조정 즉시 반영
- 최종 다운로드 시 Konva stage를 PNG로 export
- AI 비용 재발생 없음

---

## 4. Feature Spec — 기능2: Apply (템플릿 재적용)

### 4.1 설계 핵심

**"템플릿"은 AI 생성 결과를 참조로 쓰는 게 아니라, 생성 당시의 모든 설정(크롭 비율·프레임·배경·스타일·텍스트·폰트·위치)을 JSON으로 저장한 레시피다.**

이렇게 하면:
- 새 사진에 **정확히 같은 설정**으로 파이프라인 재실행 → 일관된 결과
- 비용은 일반 1회 생성과 동일 (Pro 모델 참조 블렌딩 불필요)
- 완전히 제어 가능 (왜 다른 결과가 나오는지 디버깅 가능)

**보조 옵션 (Phase 6+)**: "AI 참조 모드"를 메뉴로 추가할 수 있음 — 원본 결과 이미지와 새 사진 둘 다 `gemini-2.5-flash-image`에 전달해 참조 기반 블렌딩. 2.5 Flash도 multi-image fusion을 지원하므로 별도 Pro 모델은 불필요. 다만 프리셋 재실행 대비 일관성이 떨어질 수 있어 MVP에선 제외.

### 4.2 Template 데이터 모델

```ts
type Template = {
  id: string;
  ownerUid: string;
  name: string;                          // 사용자가 지정
  thumbnailUrl: string;                  // 원본 참조 결과 이미지
  createdAt: Timestamp;
  lastUsedAt: Timestamp;
  useCount: number;
  
  recipe: {
    aspectRatio: string;
    frameId: string;
    backgroundId: string;
    backgroundCustomUrl?: string;        // 커스텀 배경인 경우
    styleId: string;
    textOverlay?: {
      content?: string;                  // "이 텍스트 재사용" or 빈값
      fontFamily: string;
      fontSize: number;
      color: string;
      position: { x: number; y: number };
      alignment: string;
      weight: number;
    };
    cropStrategy: 'center' | 'smart' | 'manual'; 
    // 새 사진을 어떻게 크롭할지:
    //   center: 지정된 비율로 중앙 크롭 (기본)
    //   smart: 주피사체 자동 감지 후 크롭 (Phase 3+)
    //   manual: 새 사진마다 크롭 UI 표시
  };
};
```

### 4.3 페이지 레이아웃 (`/apply`)

```
┌──────────────────────────────────────────────┐
│ Header                                        │
├──────────────────┬───────────────────────────┤
│                  │                            │
│  템플릿 목록     │  업로드 영역               │
│  (좌측 패널,     │  + 선택된 템플릿 정보      │
│  스크롤)         │  + 배치 업로드 드롭존      │
│                  │  + [전체 생성] 버튼        │
│                  │                            │
│                  │  결과 갤러리               │
│                  │  (생성 완료된 것부터 표시) │
└──────────────────┴───────────────────────────┘
```

### 4.4 배치 플로우

```
1. 템플릿 선택 → 우측에 해당 recipe 표시
2. 사진 여러 장 업로드 (최대 20장, 총 50MB)
3. 각 사진 옆에 상태 표시: 대기 / 크롭 중 / 생성 중 / 완료 / 실패
4. [전체 생성] 클릭 시:
   - 크레딧 체크 (사진 수만큼)
   - 병렬 처리 (동시 3개, Rate Limit 고려)
   - 각 완료 건마다 결과 카드가 갤러리에 스트림 추가
5. 완료 후 [전체 ZIP 다운로드] 활성화
```

### 4.5 실패 처리
- 개별 실패는 해당 카드에만 ❌ 표시 + 재시도 버튼
- API 쿼터 초과 시 전체 일시정지 + 토스트 + 재개 버튼
- 크레딧 부족 시 남은 크레딧 만큼만 처리 + 안내

---

## 5. Design System

### 5.1 디자인 철학 (Claude Code 필독)

1. **"정리된 여백"이 디자인의 80%다.** 요소 사이 숨 쉴 공간이 부족하면 다른 모든 노력이 무의미.
2. **컬러는 최소로.** 배경 1, 전경 1, accent 1, 총 3개 색으로 거의 모든 걸 해결.
3. **타이포 위계가 곧 구조다.** 헤더·본문·보조텍스트 3단계만. 네 번째 크기 금지.
4. **모션은 기능 설명용이다.** 화려함이 아니라, "이게 어디서 왔는지·어디로 가는지" 알려주는 역할만.
5. **다크모드는 반전이 아니라 재설계다.** 단순 색 반전이 아니라 별도 명도·채도 고려.

### 5.2 디자인 토큰 (`app/globals.css`)

```css
@layer base {
  :root {
    /* Neutral palette (Light) */
    --background: 220 20% 98%;          /* #FAFAFC — 살짝 블루 틴트, 순백보다 고급감 */
    --foreground: 224 10% 10%;          /* near-black */
    --muted: 220 14% 96%;               /* light gray */
    --muted-foreground: 220 10% 40%;    /* mid gray */
    --border: 220 13% 91%;              /* soft border */
    --card: 0 0% 100%;
    --card-foreground: 224 10% 10%;
    
    /* Accent (single) */
    --accent: 238 75% 60%;              /* indigo-500 */
    --accent-foreground: 0 0% 100%;
    
    /* Feedback */
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 71% 45%;
    --warning: 38 92% 50%;
    
    /* Radius */
    --radius-sm: 0.5rem;                /* 8px */
    --radius-md: 0.75rem;               /* 12px */
    --radius-lg: 1rem;                  /* 16px */
    --radius-xl: 1.5rem;                /* 24px — 기본 카드 */
    
    /* Spacing scale (Tailwind 기본 + 확장) */
    /* 컴포넌트 패딩 기본: 1.5rem (p-6) */
    /* 섹션 간격 기본: 3rem (gap-12) */
    
    /* Shadow */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.04);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.06);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08);
    /* shadow-xl 이상은 쓰지 말 것 */
  }
  
  .dark {
    --background: 224 10% 6%;           /* near-black bg */
    --foreground: 220 14% 94%;
    --muted: 224 10% 12%;
    --muted-foreground: 220 10% 60%;
    --border: 224 10% 16%;
    --card: 224 10% 8%;
    --card-foreground: 220 14% 94%;
    --accent: 238 75% 65%;              /* 다크에서 살짝 밝게 */
    --accent-foreground: 224 10% 6%;
  }
}
```

### 5.3 타이포그래피 (UI 전용)

```css
/* UI 폰트 (콘텐츠 안 텍스트 오버레이용 폰트와는 별개) */
--font-sans: 'Inter', 'Noto Sans KR', system-ui, sans-serif;
--font-display: 'Inter', 'Noto Sans KR', system-ui, sans-serif; /* 같아도 OK */
```

**크기 위계 (3단계만)**
| Use | Class |
|---|---|
| Page Title | `text-2xl md:text-3xl font-semibold tracking-tight` |
| Section/Card Title | `text-base font-medium` |
| Body | `text-sm text-foreground/80` |
| Helper | `text-xs text-muted-foreground` |

### 5.4 컴포넌트 패턴

#### Button
- 1차 CTA: `bg-accent text-accent-foreground hover:bg-accent/90` — 페이지당 1개만
- 2차: `variant="outline"` 또는 `variant="ghost"`
- 파괴적: `variant="destructive"` + 확인 다이얼로그 동반

#### Card
- `rounded-2xl border bg-card p-6 shadow-sm`
- hover: `hover:shadow-md transition-shadow duration-200`

#### Input / Select
- 높이 40px 기본 (`h-10`), 모바일 터치 타겟 44px (`h-11 md:h-10`)
- `rounded-xl border bg-background px-3 focus:ring-2 focus:ring-accent/20`

#### Preset Picker Card (프레임·배경·스타일 카드)
```tsx
// 공통 패턴
<button
  className={cn(
    "relative rounded-xl overflow-hidden aspect-[4/5] border transition-all",
    selected 
      ? "ring-2 ring-accent ring-offset-2 border-accent" 
      : "border-border hover:border-foreground/20"
  )}
>
  <img src={thumbnail} className="w-full h-full object-cover" />
  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
    <span className="text-xs font-medium text-white">{name}</span>
  </div>
</button>
```

### 5.5 모션 (motion-primitives)

- 페이지 전환: `AnimatePresence` + `fade + 8px Y translate`, duration 200ms
- 카드 선택: 즉시 반영(0ms transition 아닌 `duration-150`)
- 생성 로딩: pulse가 아닌 **스켈레톤 shimmer** (motion-primitives `TextShimmer` 참고)
- 결과 등장: `scale 0.96 → 1` + `opacity 0 → 1`, 300ms, `ease-out`

**금지**: `spring` 과장 모션, `rotate` 장식, `bounce`, 200ms 초과하는 전환.

### 5.6 레이아웃 그리드

- Max content width: `max-w-7xl mx-auto px-4 md:px-6 lg:px-8`
- 사이드바 너비: `w-60 lg:w-64`
- Right panel (Studio): `w-full lg:w-[400px]`
- 모바일 하단 safe area: `pb-[max(env(safe-area-inset-bottom),1rem)]`

### 5.7 아이콘

`lucide-react` 단일 사용. 크기는 `size-4` (16px) 기본, 헤더만 `size-5`.

### 5.8 Visual Reference (북극성)

프로젝트 루트 **`docs/visual-reference.png`** 이 이 서비스의 최종 디자인 기준 이미지다.
**텍스트 스펙과 이미지가 충돌하면 이미지를 따른다.** 작업 시작 전 반드시 이 이미지를 열어 볼 것.

이미지에서 읽어낸 디자인 언어:

**여백이 주인공**
- 카드 내부 패딩 `p-6`~`p-8`, 섹션 간격 `gap-16` 이상.
- 좌측 컬럼 `max-w-xl`로 제한, 우측은 프리뷰 또는 여백.
- "빡빡해 보이면 다 틀렸다"는 기준.

**컬러 절제 — Neutral + 단일 Indigo**
- 페이지 전체에서 accent 색 노출은 1곳만 원칙. 예외는 선택 상태(ring·border).
- 로고, 1차 CTA, 히어로 키 프레이즈 강조에만 accent 사용.
- 텍스트 강조는 **색 하나만**, 밑줄·배경 하이라이트·이모지 장식 금지.

**일관된 카드 그리드**
- 프리셋 Picker(프레임·배경·스타일) 전부 동일 템플릿.
- `aspect-[4/5]` 비율, 썸네일 + 하단 라벨, 선택 시 `ring-2 ring-accent ring-offset-2` + `border-accent` 중첩.
- 가로 스크롤 or 그리드, 끝에 `...` 또는 "전체보기" 버튼.

**섬세한 경계**
- 모든 박스: 1px `border-border` + `shadow-sm` (거의 보이지 않음).
- 떠 있는 느낌이 아닌 **정지된 명함** 같은 느낌.
- 선택 강조 = ring 증가 (shadow 증가 아님).

**3단계 타이포 위계 고정**
- H1 `text-2xl md:text-3xl font-semibold tracking-tight` (28~32px)
- Section Title `text-base font-medium` (16px)
- Body `text-sm text-foreground/80` (14px)
- Helper `text-xs text-muted-foreground` (12px)
- 네 번째 크기 금지.

### 5.9 Composition Patterns (재사용 블록)

이미지에서 파생된 재사용 컴포지션. 모든 페이지가 이 블록들의 조합이어야 함.

#### 패턴 A — Hero Split

```
┌─────────────────────────────────┬──────────────────┐
│ (overline: small, muted)        │                  │
│ H1 2~3줄                        │   Product        │
│  [neutral][accent 키 프레이즈]  │   Preview /      │
│  [neutral]                      │   Visual         │
│ Body 3~4줄 (muted)              │   (sticky OK)    │
│                                 │                  │
│ [Primary CTA]  [Secondary link] │                  │
└─────────────────────────────────┴──────────────────┘
좌: max-w-xl                       우: flex-1
```

구현 제약
- 좌측 `max-w-xl`, `text-left` 고정
- H1 키 프레이즈만 `text-accent`. 나머지는 `text-foreground`
- Primary CTA는 `bg-accent text-accent-foreground`
- Secondary는 `text-muted-foreground underline-offset-4 hover:underline` (버튼 아님)
- 우측 프리뷰 카드만 예외적으로 `shadow-lg` 허용 (떠 있는 감각 연출)

#### 패턴 B — Feature Badge Row (4개 고정)

```
┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
│ [icon]│  │ [icon]│  │ [icon]│  │ [icon]│
│ Label │  │ Label │  │ Label │  │ Label │
│ sub   │  │ sub   │  │ sub   │  │ sub   │
└───────┘  └───────┘  └───────┘  └───────┘
```

구현 제약
- lucide-react 아이콘 `size-6`
- 아이콘 배경: `bg-muted rounded-xl p-2` (얇은 배지)
- 아이콘 색: `text-foreground` (accent 금지)
- 라벨: `text-sm font-medium`
- 서브: `text-xs text-muted-foreground`
- **정확히 4개 아이템.** 3개도 5개도 아님 (리듬 붕괴)

#### 패턴 C — Canvas Work Zone

작업 캔버스(Studio, Apply의 프리뷰 영역).

```
┌────────────────────────────────────┐
│  (subtle SVG texture overlay)      │
│                                    │
│        ┌──────────┐                │
│        │ Artwork  │                │
│        │ Preview  │  shadow-lg     │
│        └──────────┘                │
│                                    │
└────────────────────────────────────┘
배경: bg-muted/30
```

구현 제약
- `bg-muted/30` + **subtle SVG pattern**: 잎사귀 실루엣 / 점 패턴 / 가느다란 격자 중 택 1, opacity `0.04~0.08`
- 프리뷰 이미지는 `shadow-lg` 까지 허용 (전체 앱 규칙의 **예외**, 이 영역에서만)
- **순백 `bg-background`에 프리뷰를 직접 놓지 말 것**

#### 패턴 D — Preset Picker Card

§5.4의 Preset Picker 기본형에 Visual Reference 기준으로 다음 확정:
- 카드 비율 `aspect-[4/5]` 고정
- 선택 시 `ring-2 ring-accent ring-offset-2` + `border-accent` 중첩 (중복이 정상)
- 라벨 영역: 하단 `bg-gradient-to-t from-black/60 to-transparent p-3`, 흰색 텍스트
- 비선택 hover: `border-foreground/20` (accent 아님)

#### 패턴 E — Mobile Bottom Sheet

```
┌──────────────────────┐
│ Header               │
├──────────────────────┤
│                      │
│ Canvas 55vh          │
│ (bg-muted/30)        │
│                      │
├──────────────────────┤
│ ─ grab handle ─      │
│ [Tabs: 프레임 배경 ···]│
│ Tab Content (scroll) │
└──────────────────────┘
     [생성하기] (fixed bottom, pb-safe)
```

구현 제약
- `vaul` Drawer: `modal={false}`, `dismissible={false}` (상시 표시)
- 스냅 포인트 `[0.4, 0.9]` 2단
- 최하단 [생성하기] 버튼은 **바텀시트 외부** `fixed bottom-0 inset-x-0` + `pb-[env(safe-area-inset-bottom)]`

### 5.10 Landing Page (`/`) 초기 와이어

비로그인 시 랜딩. 로그인 상태에서 `/` 접근 시 `/studio`로 리다이렉트.

```
┌────────────────────────────────────────────────┐
│ Header: 로고(좌) | [로그인](우)                  │
├────────────────────────────────────────────────┤
│                                                │
│  [패턴 A — Hero Split]                         │
│                                                │
│  좌측 (max-w-xl):                              │
│   overline: "사진을 감성으로, 시리즈로."         │
│   H1: 당신만의 감성을                           │
│        [한 번의 클릭으로,]  ← accent            │
│        계속 이어가세요.                         │
│   Body: Framelab은 프레임·배경·스타일·         │
│         텍스트를 조합해 감성 이미지를 만들고,    │
│         템플릿으로 저장해 다음 사진에도         │
│         동일한 느낌을 빠르게 적용할 수 있는      │
│         AI 이미지 스튜디오입니다.               │
│   [Google로 시작하기]  [기능 살펴보기]           │
│                                                │
│  우측: Studio 화면 목업 (쿼리스트링 live URL)    │
│                                                │
├────────────────────────────────────────────────┤
│  [패턴 B — Feature Badge Row]                  │
│  ✦ 감성 프리셋         ⬚ 템플릿 저장            │
│  ❏ 시리즈 제작        ◎ AI 스타일 변환          │
├────────────────────────────────────────────────┤
│  Studio Flow (7단계 가로 스크롤 카드)           │
│  1.업로드 → 2.크롭 → 3.프레임 → 4.배경          │
│    → 5.스타일 → 6.텍스트 → 7.완성               │
├────────────────────────────────────────────────┤
│  Apply Flow (3단 구성)                         │
│  [템플릿 선택] → [사진 업로드] → [시리즈 결과]    │
├────────────────────────────────────────────────┤
│  CTA 하단 배너                                 │
│  "당신의 감성을 담은 한 장이,                    │
│   시리즈가 되어 계속 이어집니다."                 │
│  [Google로 시작하기]                           │
├────────────────────────────────────────────────┤
│ Footer: 로고 | 이용약관·개인정보 | © Framelab   │
└────────────────────────────────────────────────┘
```

구현 제약
- 모든 섹션 `max-w-6xl mx-auto px-4 md:px-6`
- 섹션 간격 `gap-20 md:gap-32`
- 히어로 우측 프리뷰만 `shadow-lg` 허용 (패턴 A 예외)
- Studio Flow 카드 리스트는 모바일 `overflow-x-auto snap-x snap-mandatory`
- CTA 배너 영역은 `bg-muted/30` 으로 미세한 톤 전환
- 카피는 **범용·브랜드 중립**. 지역·업종·고유명사 넣지 말 것.

---

## 6. Preset Data

### 6.1 프레임 (`lib/presets/frames.ts`)

10개 프리셋. 각각은 **AI 프롬프트에 합성되는 자연어 지시** + **썸네일 이미지** + **텍스트 기본 위치** 를 갖는다.

| ID | 이름 | 설명 | 텍스트 기본 위치 |
|---|---|---|---|
| `none` | 프레임 없음 | 풀블리드 | 하단 중앙 |
| `polaroid-classic` | 폴라로이드 클래식 | 흰 테두리, 아래 여백 큼 | 하단 흰 영역 중앙 |
| `polaroid-vintage` | 폴라로이드 빈티지 | 크림 톤, 약간 낡은 느낌 | 하단 크림 영역 |
| `film-strip` | 필름 스트립 | 양옆에 스프로킷 홀 | 하단 중앙 |
| `instagram-post` | 인스타 포스트 | 1:1, 얇은 흰 테두리 | 하단 중앙 |
| `instagram-story` | 인스타 스토리 | 9:16 세로 | 상단 또는 하단 중앙 |
| `magazine-cover` | 매거진 커버 | 타이포 중심 프레임 | 상단 |
| `postcard` | 엽서 | 두꺼운 카드 + 둥근 모서리 | 하단 |
| `minimal-white` | 미니멀 화이트 | 균일한 흰 여백 | 하단 |
| `vintage-frame` | 빈티지 액자 | 나무·금박 장식 테두리 | 하단 중앙 |

각 프리셋은 다음 스키마로:
```ts
type FramePreset = {
  id: string;
  name: string;
  description: string;
  thumbnailPath: string;           // /frames/polaroid-classic.jpg
  aspectLock?: string;             // '1:1' 등 강제 비율 (없으면 free)
  promptFragment: string;          // Gemini 프롬프트에 합성될 자연어
  textDefault: {
    position: { x: number; y: number }; // 0~1
    alignment: 'left' | 'center' | 'right';
    colorPreference: 'dark' | 'light';  // 프레임 배경색에 따라
  };
};
```

### 6.2 배경 (`lib/presets/backgrounds.ts`)

| ID | 이름 | 타입 |
|---|---|---|
| `keep-original` | 원본 배경 유지 | — |
| `white` | 순백 | solid |
| `studio-gray` | 스튜디오 그라데이션 (증명사진 톤) | gradient |
| `warm-pastel` | 따뜻한 파스텔 | gradient |
| `cool-pastel` | 차가운 파스텔 | gradient |
| `linen` | 리넨 질감 | texture |
| `kraft-paper` | 크라프트 종이 | texture |
| `bokeh-warm` | 따뜻한 보케 | texture |
| `bokeh-cool` | 차가운 보케 | texture |
| `black` | 순흑 | solid |
| `custom` | 업로드 | user |

**구현 노트**: 단색·그라데이션은 Gemini 프롬프트 텍스트로만 지시. 텍스처 이미지는 `public/backgrounds/`에 실제 파일로 두고 필요 시 Gemini에 reference image로 전달 (multi-input).

### 6.3 스타일 변형 (`lib/presets/styles.ts`)

10개. 각 스타일은 프롬프트 단편을 가짐.

| ID | 이름 | 프롬프트 키워드 |
|---|---|---|
| `none` | 변형 없음 (원본 유지) | 원본 사진 유지, AI 수정 최소화 |
| `ghibli` | 지브리풍 | Studio Ghibli style, soft watercolor, warm palette |
| `pixar-3d` | 픽사 3D | Pixar-style 3D render, rounded features, stylized lighting |
| `anime` | 애니메이션 | anime illustration, clean line art, cel shading |
| `disney-3d` | 디즈니 3D 아바타 | Disney Pixar 3D avatar style, expressive eyes, smooth rendering |
| `watercolor` | 수채화 | loose watercolor painting, paper texture |
| `oil-painting` | 유화 | oil painting, visible brush strokes, impasto |
| `pencil-sketch` | 연필 스케치 | pencil sketch, detailed linework, monochrome |
| `cinematic` | 시네마틱 | cinematic photography, film grain, dramatic lighting |
| `polaroid-photo` | 폴라로이드 사진 | polaroid photograph, slight light leak, vintage tone |

### 6.4 폰트 (`lib/presets/fonts.ts`)

**한글 10개 (Google Fonts 전원 OFL 라이선스)**

| Family | 분위기 | 굵기 옵션 |
|---|---|---|
| Noto Sans KR | 산세리프 기본 | 100/300/400/500/700/900 |
| Noto Serif KR | 세리프 기본 | 200/300/400/500/600/700/900 |
| Nanum Gothic | 산세리프 대안 | 400/700/800 |
| Nanum Myeongjo | 명조 | 400/700/800 |
| Nanum Pen Script | 손글씨(펜) | 400 |
| Black Han Sans | 굵은 디스플레이 | 400 |
| Jua | 귀여운 캐주얼 | 400 |
| Do Hyeon | 둥근 캐주얼 | 400 |
| Gowun Dodum | 부드러운 고딕 | 400 |
| Gaegu | 손글씨(마커) | 300/400/700 |

**영문 10개**

| Family | 분위기 |
|---|---|
| Inter | 기본 산세리프 (UI와 공용) |
| Playfair Display | 우아한 세리프 |
| Montserrat | 디스플레이 산세리프 |
| DM Sans | 깔끔한 기하학 |
| Space Grotesk | 모던 기하학 |
| Caveat | 손글씨 |
| Pacifico | 손글씨 굵은 |
| Bebas Neue | 콘덴스드 디스플레이 |
| Dela Gothic One | 임팩트 디스플레이 |
| Archivo | 실용 산세리프 |

**로딩 전략**
- UI 기본 폰트(Inter + Noto Sans KR)만 initial load.
- 나머지는 사용자가 드롭다운에서 선택할 때 동적 `<link>` 삽입.
- CSS: `font-display: swap`.

---

## 7. Tech Architecture

### 7.1 Data Flow

```
Client (Browser)
   ├─ Firebase Auth (Google) ──→ idToken
   ├─ Image Compression (client-side resize)
   ├─ Upload to Firebase Storage (via signed URL)
   └─ POST /api/generate with {imagePath, presets, text}
          │
          ↓
Next.js API Route (/api/generate)
   ├─ Verify idToken (firebase-admin)
   ├─ Check credits in Firestore
   ├─ Build Gemini prompt (lib/gemini/compose.ts)
   ├─ Call Gemini API (server-side, API key in env)
   ├─ Save output to Firebase Storage
   ├─ Write Generation doc to Firestore
   ├─ Decrement credits
   └─ Return {outputUrl, generationId}
          │
          ↓
Client
   ├─ Load result image
   ├─ Compose text layer (react-konva)
   └─ Export final PNG on download
```

### 7.2 환경 변수 (`.env.example`)

```bash
# Firebase Client (공개 가능)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (서버 전용)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Google Gemini (서버 전용)
GEMINI_API_KEY=

# App Config
NEXT_PUBLIC_APP_NAME=Framelab
OWNER_EMAIL=your-owner-email@example.com  # 무제한 계정용
DAILY_FREE_CREDITS=5                       # 일반 사용자 일일 무료 크레딧
```

### 7.3 초기 셋업 명령어

```bash
# 1. 프로젝트 생성
npx create-next-app@latest framelab --typescript --tailwind --app --src-dir=false

# 2. shadcn 초기화
cd framelab
npx shadcn@latest init
# 색: Neutral, 스타일: New York, CSS 변수: Yes

# 3. 기본 컴포넌트
npx shadcn@latest add button card dialog input select label
npx shadcn@latest add dropdown-menu tabs toast skeleton avatar
npx shadcn@latest add form separator tooltip

# 4. 필수 라이브러리
pnpm add react-easy-crop react-konva konva
pnpm add zustand react-hook-form zod @hookform/resolvers
pnpm add sonner vaul lucide-react class-variance-authority
pnpm add browser-image-compression heic2any

# 5. Firebase
pnpm add firebase firebase-admin

# 6. Gemini
pnpm add @google/genai

# 7. 모션
pnpm add motion
# motion-primitives 컴포넌트는 CLI로 개별 추가
```

### 7.4 Vercel 배포 설정

- `firebase-admin` 은 Node runtime 필수 → 해당 API route에 `export const runtime = 'nodejs'`
- Gemini 호출은 응답이 최대 60초 가능 → `export const maxDuration = 60` (Vercel Pro 필요할 수 있음. Hobby 플랜은 10초)
- Vercel Edge Middleware로 인증 확인은 하지 않음 (firebase-admin 호환 안됨)
- 이미지 최적화: `next/image`의 remotePatterns에 Firebase Storage 도메인 추가

---

## 8. Gemini API Integration

### 8.1 모델 선택 매트릭스

| 용도 | 모델 | 근거 |
|---|---|---|
| 기능1 일반 생성 | `gemini-2.5-flash-image` (나노바나나) | 공식 $0.039/이미지, 1024px, 저지연 |
| 기능2 템플릿 재실행 | 동일 | 같은 레시피 적용이 목적 |
| 커스텀 배경 이미지 합성 | 동일 | 2.5 Flash도 multi-image fusion 지원 |
| AI 참조 모드(Phase 6+, 옵션) | `gemini-3-pro-image-preview` | 4K·최대 8장 블렌딩·장문 텍스트 렌더링 필요 시에만. 비용 6배 유의. |

**MVP는 전부 `gemini-2.5-flash-image` 단일 모델로 처리.** 2.5 Flash도 공식적으로 multi-image fusion + character consistency + natural language editing을 지원하므로 커스텀 배경 이미지 합성까지 커버됨. Pro는 필요해진 시점에 옵션 추가.

**공통 주의**
- 모든 출력 이미지에 **SynthID 워터마크가 자동 삽입**됨. UI 어딘가(결과 하단 보조 텍스트 등)에 "AI로 생성된 이미지입니다" 표시 권장.
- 출력 해상도는 1024px 기본. aspect ratio는 `image_config.aspect_ratio` 파라미터로 제어.

### 8.2 프롬프트 합성 구조 (`lib/gemini/compose.ts`)

최종 프롬프트 = 5개 단편의 연결
```
[Base Instruction]
+ [Style Fragment]     (스타일 프리셋의 promptFragment)
+ [Frame Fragment]     (프레임 프리셋의 promptFragment)
+ [Background Fragment] (배경 프리셋의 promptFragment)
+ [Quality/Format Fragment]
```

**예시 합성**:
```
입력:
  style=pixar-3d
  frame=polaroid-classic
  background=studio-gray

출력 프롬프트:
"Transform the provided photo into the specified style while preserving 
the subject's identity and pose.

Style: Pixar-style 3D render with rounded features, stylized lighting, 
and expressive eyes. Smooth subsurface scattering on skin.

Frame: Place the result inside a classic Polaroid frame — white border, 
slightly wider white space at the bottom for text/caption area. 
The frame should look like a real instant photo.

Background: Replace the original background with a soft neutral gray 
studio gradient, darker at edges and brighter at center, similar to 
professional portrait photography backdrops.

Output: High-quality image at 1024x1024. Preserve facial identity. 
Keep the bottom caption area of the polaroid empty for later text overlay."
```

### 8.3 Gemini 호출 코드 (서버사이드)

```ts
// lib/gemini/client.ts
import { GoogleGenAI } from '@google/genai';

export const genai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY! 
});

// app/api/generate/route.ts (요약)
import { genai } from '@/lib/gemini/client';
import { composePrompt } from '@/lib/gemini/compose';
import { getPresets } from '@/lib/presets';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const { uid, imagePath, frameId, backgroundId, styleId, customBgPath } 
    = await parseAndVerify(req);
  
  await checkCredits(uid);
  
  // 1. Firebase Storage에서 입력 이미지 로드
  const inputImage = await loadFromStorage(imagePath);
  
  // 2. 프롬프트 합성
  const { frame, background, style } = getPresets(frameId, backgroundId, styleId);
  const prompt = composePrompt({ frame, background, style });
  
  // 3. Gemini 호출
  const parts: any[] = [
    { text: prompt },
    { inlineData: { mimeType: 'image/webp', data: inputImage.base64 } },
  ];
  
  if (customBgPath) {
    const bgImage = await loadFromStorage(customBgPath);
    parts.push({ inlineData: { mimeType: 'image/webp', data: bgImage.base64 } });
    // composePrompt에서 "second image is the desired background" 지시 추가
  }
  
  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts }],
    // 이미지 출력 요청
    config: { 
      responseModalities: ['image', 'text'],
      imageConfig: { aspectRatio: '1:1' }, // 크롭 결과 비율에 맞춰 동적 지정
    },
  });
  
  // 4. 응답에서 이미지 추출
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    p => p.inlineData?.mimeType?.startsWith('image/')
  );
  if (!imagePart?.inlineData?.data) throw new Error('No image in response');
  
  // 5. Storage에 저장 + Firestore 기록 + 크레딧 차감
  const outputPath = await saveToStorage(imagePart.inlineData.data, uid);
  const genId = await recordGeneration(uid, { imagePath, outputPath, prompt });
  await decrementCredits(uid);
  
  return Response.json({ 
    outputUrl: await getDownloadUrl(outputPath), 
    generationId: genId 
  });
}
```

### 8.4 Rate Limit & Retry

- Gemini 기본 쿼터: RPM 제한 있음 (모델·계정 따라 상이)
- **클라 측**: 배치 처리 시 동시성 3개 제한 (`p-limit` 라이브러리)
- **서버 측**: Exponential backoff 3회 재시도 (429 응답 시)
- **실패 시**: credits 복구 (환불 로직)

### 8.5 이미지 후처리
- Gemini 출력은 PNG(또는 WebP). 서버에서 WebP로 통일 저장 (용량 절감, `sharp`).
- 썸네일 생성: 256px 정사각 크롭 → Storage `/thumbs/{genId}.webp`.

---

## 9. Firebase Schema & Security Rules

### 9.1 Firestore 컬렉션

```
/users/{uid}
  - email: string
  - displayName: string
  - photoURL: string
  - credits: number
  - plan: 'free' | 'personal' | 'pro'
  - isOwner: boolean          // 오너 계정 무제한
  - createdAt: timestamp
  - lastLoginAt: timestamp

/users/{uid}/templates/{templateId}
  - name: string
  - thumbnailUrl: string
  - recipe: {...}             // §4.2 Template 타입
  - useCount: number
  - createdAt: timestamp
  - lastUsedAt: timestamp

/users/{uid}/generations/{genId}
  - inputImagePath: string    // Storage path
  - outputImagePath: string
  - prompt: string
  - model: string             // 'gemini-2.5-flash-image'
  - cost: number              // 크레딧 차감량 (보통 1)
  - presets: { frameId, backgroundId, styleId }
  - templateId?: string       // 템플릿에서 파생된 경우
  - createdAt: timestamp
  - status: 'success' | 'failed'
  - error?: string

/credits_ledger/{logId}       // 크레딧 변동 이력 (미래 결제용)
  - uid: string
  - delta: number             // +충전, -사용
  - reason: 'generate' | 'signup_bonus' | 'purchase' | 'refund'
  - relatedId?: string        // generationId 등
  - createdAt: timestamp
```

### 9.2 Firestore Security Rules (기본형)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자기 문서만
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      // 크레딧 수정은 서버(admin)에서만. 클라는 metadata만 수정 가능.
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null 
                    && request.auth.uid == uid
                    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['credits', 'plan', 'isOwner']);
      allow delete: if false;
      
      match /templates/{tid} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /generations/{gid} {
        allow read: if request.auth != null && request.auth.uid == uid;
        // 생성은 서버에서만 기록
        allow write: if false;
      }
    }
    
    match /credits_ledger/{logId} {
      allow read: if request.auth != null && resource.data.uid == request.auth.uid;
      allow write: if false; // 서버 전용
    }
  }
}
```

### 9.3 Firebase Storage 구조 & Rules

```
/input/{uid}/{ts}.webp           # 사용자 업로드 원본 (crop 후)
/output/{uid}/{genId}.webp       # AI 생성 결과
/thumbs/{uid}/{genId}.webp       # 썸네일
/custom-bg/{uid}/{hash}.webp     # 커스텀 배경 업로드
/templates/{uid}/{tid}.webp      # 템플릿 대표 이미지
```

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{folder}/{uid}/{file=**} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null 
                   && request.auth.uid == uid
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 10. Credits System (확장 대비)

### 10.1 초기(Phase 1) 정책
- **오너 계정(`isOwner: true`)**: 크레딧 체크 bypass. 무제한.
- **일반 로그인 사용자**: 하루 N회 무료 크레딧 (기본 N=5, env로 조정).
  - 매일 00:00 KST에 리셋 (Cloud Function cron).
- **비로그인**: 사용 불가 (로그인 유도).

### 10.2 크레딧 체크 로직
```ts
async function checkCredits(uid: string): Promise<void> {
  const user = await getUserDoc(uid);
  if (user.isOwner) return; // 무제한
  
  // 매일 리셋 보장 (last reset 체크)
  await ensureDailyReset(uid);
  
  const user2 = await getUserDoc(uid);
  if (user2.credits < 1) throw new Error('INSUFFICIENT_CREDITS');
}
```

### 10.3 Phase 4 확장 경로 (미리 대비)
- Stripe Checkout Session으로 크레딧 팩 구매 (예: 50크레딧 / 200크레딧).
- Stripe Webhook → Firebase Cloud Function → `credits_ledger` 기록 + `users.credits` 증가.
- 월 구독 플랜(Phase 5): `plan: 'personal' | 'pro'` 로 전환, 매월 크레딧 부여.
- **지금 해야 할 것**: `plan` 필드 + `credits_ledger` 컬렉션 **지금부터 스키마에 포함**. 데이터 구조가 미래 결제와 호환되도록.

---

## 11. Roadmap & Phases

### Phase 0 — 셋업 (1~2일)
- [ ] Next.js 14 + TS + Tailwind + shadcn 초기화
- [ ] Firebase 프로젝트 생성 (Auth + Firestore + Storage)
- [ ] Vercel 배포 및 `.env` 연동
- [ ] 디자인 토큰 `globals.css`에 박기 (§5.2 기준, `#FAFAFC` 배경 확인)
- [ ] `docs/visual-reference.png` 커밋
- [ ] 기본 레이아웃: Header + Sidebar + AppShell
- [ ] Google 로그인 동작 확인
- [ ] `OWNER_EMAIL` 로 오너 플래그 자동 부여 Cloud Function

### Phase 1 — Studio MVP (3~5일) **현재 여기**
- [ ] 랜딩 페이지 `/` 기본형 (§5.10 — Hero Split + Feature Badge + CTA)
- [ ] `/studio` 페이지 레이아웃 (데스크탑 + 모바일 §5.9 패턴 E)
- [ ] 작업 캔버스 텍스처 존 (§5.9 패턴 C)
- [ ] 이미지 업로드 + 클라 리사이즈
- [ ] 크롭 다이얼로그 (react-easy-crop)
- [ ] 프레임 Picker (5개 프리셋 우선, §5.9 패턴 D)
- [ ] 배경 Picker (5개 프리셋 + 커스텀 업로드)
- [ ] 스타일 Picker (5개 프리셋)
- [ ] 텍스트 오버레이 입력 + 폰트 5개 + 드래그 위치 (Konva)
- [ ] `/api/generate` 라우트
- [ ] Gemini 프롬프트 합성 + 호출
- [ ] 결과 뷰어 + 다운로드 (Konva export)
- [ ] SynthID 워터마크 안내 문구 표시
- [ ] 크레딧 차감 & 로그

### Phase 2 — 템플릿 저장 & 관리 (2일)
- [ ] 결과에서 "템플릿으로 저장" 다이얼로그
- [ ] `/templates` 페이지 (그리드, 이름 변경, 삭제)
- [ ] Template 데이터 모델 & Firestore 연동

### Phase 3 — Apply MVP (3일)
- [ ] `/apply` 페이지 레이아웃
- [ ] 템플릿 선택 패널
- [ ] 배치 업로드 (최대 5장 우선)
- [ ] `/api/apply-template` 라우트 (템플릿 recipe로 파이프라인 재실행)
- [ ] 결과 갤러리 + 개별/전체 다운로드

### Phase 4 — 프리셋 보강 & 감성 업 (3일)
- [ ] 프레임 10개 완성
- [ ] 배경 10개 완성 (에셋 준비)
- [ ] 스타일 10개 완성 (샘플 이미지 생성)
- [ ] 폰트 20개 연동
- [ ] 온보딩 투어 (shepherd.js or 직접 구현)

### Phase 5 — 유료 크레딧 (3~5일)
- [ ] Stripe Checkout 연동
- [ ] Webhook 처리
- [ ] 가격 페이지 / 크레딧 팩 UI
- [ ] 결제 실패 복구 플로우

### Phase 6 — 품질 & 확장
- [ ] AI 참조 모드 (기능2 대안: `gemini-2.5-flash-image`로 원본 결과 + 새 사진 블렌딩. 필요 시 `gemini-3-pro-image-preview` 4K 업그레이드 옵션 검토)
- [ ] 공유 링크 (비공개/공개)
- [ ] 모바일 PWA 설치 지원
- [ ] 해시태그/메모 태깅

---

## 12. Open Questions / TODO

아래는 현재 시점 미결. 개발 진행 중 결정 필요.

1. **도메인**: `framelab.app`? `.com`? 사용자 확인 후 구매.
2. **파비콘/로고**: 현재 없음. Phase 1 말까지 최소한 워드마크라도 정리. `docs/visual-reference.png` 좌상단 로고 참고.
3. **오너 계정 초기 설정 방법**: Cloud Function vs Firestore 수동 플래그. → Cloud Function 권장 (`.env`의 `OWNER_EMAIL` 매칭).
4. **이미지 다운로드 포맷**: PNG 기본. JPG(작은 용량) 옵션 추가 여부.
5. **SynthID 워터마크 안내**: Gemini 2.5 Flash Image는 모든 출력에 보이지 않는 워터마크를 자동 삽입. 결과 뷰어 하단에 "AI로 생성된 이미지입니다" 짧은 고지 필요.
6. **추가 워터마크 정책(Phase 5)**: 무료 사용자에게 서비스 로고 워터마크 부착 여부. MVP는 안 붙이고 유료 출시 시 재검토.
7. **GDPR/개인정보**: 사용자 업로드 이미지 보관 기간 정책. 기본 30일 후 자동 삭제를 권장 (Cloud Function cron).
8. **이용약관/개인정보처리방침**: 법적 검토 필요 (Phase 5 유료화 전 필수).
9. **랜딩 카피 최종 확정**: §5.10 와이어의 H1·Body·CTA 문구를 Phase 1 말에 리뷰·확정.

---

## 13. Claude Code 작업 체크리스트 (매 커밋 전)

- [ ] `docs/visual-reference.png` 를 다시 열어봤나? UI가 그 톤에서 벗어나지 않나?
- [ ] 디자인 토큰만 사용했나? 임의 hex/색 없나?
- [ ] accent 색이 페이지당 1곳 근처로 절제됐나? (선택 ring 제외)
- [ ] 카드 비율 `aspect-[4/5]`·`p-6` 이상 여백 지켰나?
- [ ] 하드코딩 문자열 없나? `ko.ts`/`en.ts` 경유했나?
- [ ] API 키가 클라 번들에 노출되지 않나? (서버 전용 env는 `NEXT_PUBLIC_` 접두사 없어야 함)
- [ ] credits 체크 없이 Gemini 호출하는 곳 없나?
- [ ] `any` 타입 없나? (`grep -rn "any" --include="*.ts*"`로 확인)
- [ ] 모바일(375px)에서 깨지지 않나? 바텀시트 패턴(§5.9 E) 따랐나?
- [ ] 다크모드 확인했나?
- [ ] 에러 케이스 toast 처리했나?
- [ ] Firestore rules가 새 필드 커버하나?

---

**끝.** 의문점은 커밋 말고 `SPEC.md` 업데이트로 먼저 합의.
