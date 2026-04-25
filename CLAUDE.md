# Framelab — Claude Code Guide

> 이 파일은 Claude Code가 **매 작업 시작 시 자동으로 읽는** 프로젝트 가이드.
> 세부 스펙·프리셋·코드 예제는 `SPEC.md` 참조.

---

## 1. 한 줄 요약

업로드한 사진을 **크롭 → 프레임/배경/스타일/텍스트**로 꾸며 Gemini 나노바나나(2.5 Flash Image)로 생성하고,
맘에 드는 결과는 **템플릿**으로 저장해서 다른 사진들도 **같은 톤의 시리즈**로 일괄 생성하는 이미지 에디터.

**이름(임시)**: Framelab
**배포**: Vercel | **인증·DB·스토리지**: Firebase | **AI**: Google Gemini Image API

---

## 2. 절대 어기지 말 것 (Design Rules)

1. **디자인 토큰만 사용**. 색·폰트·간격·radius·shadow는 반드시 `app/globals.css`의 CSS 변수에서. 임의 hex 금지.
2. **shadcn/ui 우선**. 새 컴포넌트 만들기 전에 shadcn에서 검색. 없으면 shadcn 스타일로 만들 것.
3. **여백 후하게**. 카드·섹션은 `p-6`/`p-8` 기본. `p-2` 답답한 패딩 금지.
4. **그림자 절제**. `shadow-sm` 기본, hover에만 `shadow-md`. `shadow-2xl` 금지.
5. **애니메이션은 motion-primitives**. `framer-motion` 직접 임포트 금지.
6. **1차 CTA만 accent 컬러**. 나머지 버튼은 전부 neutral `variant="outline"` or `ghost`.
7. **라운드는 `rounded-2xl` 기본**. 배지·칩만 `rounded-full`. 날카로운 `rounded-none` 금지.
8. **에러·성공 피드백은 `sonner` 토스트**. `alert()` / `confirm()` 절대 금지.
9. **모바일 바텀시트는 `vaul`**, 데스크탑은 `Dialog`. `useMediaQuery`로 분기.
10. **i18n 대비**. 하드코딩 문자열 금지. 모든 문구는 `lib/i18n/ko.ts` 또는 `en.ts`에서.

## 3. 절대 어기지 말 것 (Engineering Rules)

1. `localStorage`·`sessionStorage` 금지 → Firestore 또는 React state.
2. HTML `<form>` submit 금지 → `onClick` 핸들러로 처리.
3. `.env.local`·Firebase 키 커밋 금지. `.env.example`만 commit.
4. Gemini API 호출 전 **반드시 credits 체크**. 무한 루프 호출 방지.
5. 이미지 업로드는 **클라에서 리사이즈 후 Firebase Storage로**. 원본 그대로 업로드 금지 (비용·속도).
6. Gemini 호출은 **반드시 서버(`/api/*` route)에서**. 클라에서 API 키 노출 금지.
7. Firestore write는 **반드시 security rules로 검증**. 클라 신뢰 금지.
8. 에러는 `try/catch` + toast. 콘솔에만 찍고 사일런트 실패 금지.
9. 모든 컴포넌트 **TypeScript strict**. `any` 금지, 불가피하면 `unknown` + 타입가드.
10. **Server Component 우선**. `"use client"`는 인터랙션 있는 컴포넌트에만.

---

## 4. 기술 스택 (고정 — 임의 교체 금지)

| 레이어 | 기술 |
|---|---|
| Framework | Next.js 14 App Router + TypeScript (strict) |
| Styling | Tailwind CSS v3 + CSS Variables |
| UI Components | shadcn/ui + `motion-primitives` + `lucide-react` |
| Forms | `react-hook-form` + `zod` |
| Canvas (크롭) | `react-easy-crop` |
| Canvas (텍스트 레이어) | `react-konva` + `konva` |
| Toast | `sonner` |
| Mobile Bottom Sheet | `vaul` |
| Auth | Firebase Auth (Google Provider) |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| AI Image | Google Gemini API (`@google/genai` SDK) |
| Deployment | Vercel |

**Gemini 모델 (고정)**
- **기능1·기능2 공용**: `gemini-2.5-flash-image` (나노바나나, $0.039/이미지, 1K 해상도)
- 4K·멀티 이미지 블렌딩이 필요해지면 Phase 6에서 `gemini-3-pro-image-preview` 옵션 추가 검토. **그 전까진 다른 모델 호출 금지.**
- 모든 생성 이미지에 Google의 SynthID 워터마크가 **자동 삽입**됨 (사용자에게 안내 필요).

---

## 5. 파일 구조

```
framelab/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx            # 사이드바/헤더 셸
│   │   ├── studio/page.tsx       # 기능1: 메인 생성기
│   │   ├── apply/page.tsx        # 기능2: 템플릿 재적용
│   │   ├── templates/page.tsx    # 저장된 템플릿 목록
│   │   └── history/page.tsx      # 생성 히스토리
│   ├── api/
│   │   ├── generate/route.ts     # 기능1 생성 엔드포인트
│   │   ├── apply-template/route.ts
│   │   └── credits/route.ts
│   ├── globals.css               # 디자인 토큰
│   ├── layout.tsx
│   └── page.tsx                  # 랜딩
├── components/
│   ├── ui/                       # shadcn 컴포넌트
│   ├── studio/
│   │   ├── image-uploader.tsx
│   │   ├── crop-dialog.tsx
│   │   ├── frame-picker.tsx
│   │   ├── background-picker.tsx
│   │   ├── style-picker.tsx
│   │   ├── text-overlay-editor.tsx
│   │   ├── generate-button.tsx
│   │   └── result-viewer.tsx
│   ├── apply/
│   │   ├── template-picker.tsx
│   │   └── batch-uploader.tsx
│   └── shared/
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── credits-badge.tsx
├── lib/
│   ├── firebase/
│   │   ├── client.ts
│   │   ├── admin.ts
│   │   └── schema.ts             # zod 타입
│   ├── gemini/
│   │   ├── client.ts
│   │   ├── prompts.ts            # 프롬프트 템플릿
│   │   └── compose.ts            # 프롬프트 합성 로직
│   ├── presets/
│   │   ├── frames.ts
│   │   ├── backgrounds.ts
│   │   ├── styles.ts
│   │   └── fonts.ts
│   ├── canvas/
│   │   ├── crop.ts
│   │   ├── text-layer.ts
│   │   └── export.ts
│   ├── i18n/
│   │   ├── ko.ts
│   │   └── en.ts
│   └── utils.ts
├── public/
│   ├── backgrounds/              # 기본 배경 이미지들
│   └── frames/                   # 프레임 썸네일
├── .env.example
├── CLAUDE.md                     # 이 파일
├── SPEC.md                       # 상세 스펙
└── package.json
```

---

## 6. 디자인 레퍼런스 (이런 느낌으로)

### 1순위: `docs/visual-reference.png` — 북극성

프로젝트에 포함된 **`docs/visual-reference.png`** 파일이 이 서비스의 최종 디자인 기준이야.
모든 UI 결정은 이 이미지의 톤·레이아웃·여백감·컬러 사용에 수렴해야 함.
**아래 텍스트 규칙과 이미지가 충돌하면 이미지를 따를 것.**

Claude Code가 작업 시작할 때 가장 먼저 해야 할 일:
1. `docs/visual-reference.png`를 열어본다.
2. 이미지의 Color Palette·Typography·Radius·Shadow·Composition 영역을 기억한다.
3. 그 다음 이번 작업에 해당하는 SPEC.md 섹션을 읽는다.

### 2순위: 참고 사이트 (감각 보조용)

텍스처·모션·인터랙션 디테일 보조 레퍼런스.

- https://vercel.com
- https://linear.app
- https://raycast.com
- https://arc.net
- https://framer.com
- https://resend.com
- https://cursor.com

### 이미지에서 파생된 추가 룰 (Design Rules 확장)

§2의 10개 Design Rules에 더해 다음도 지킬 것:

11. **좌측 heavy, 우측 light**. 히어로·섹션 헤더에서 텍스트·CTA는 좌측 `max-w-xl` 이내. 우측은 프리뷰·일러스트 또는 여백.
12. **강조는 색 하나로만**. 키 프레이즈만 `text-accent`. 밑줄·박스·배경 하이라이트·이모지 장식 전부 금지.
13. **피처 배지는 4개 고정 그리드**. 아이콘 + 볼드 라벨 + 1줄 보조 텍스트. 아이콘 색도 neutral, accent 금지.
14. **캔버스 영역은 텍스처 있는 그레이존**. `/studio` 작업 캔버스는 `bg-muted/30` + subtle SVG 오버레이. 순백 배경 금지. 프리뷰 이미지에만 예외적으로 `shadow-lg` 허용.
15. **카드 비율은 `aspect-[4/5]` 통일**. 프리셋 Picker(프레임·배경·스타일) 전부 동일 비율.
16. **선택 강조는 shadow가 아니라 ring**. `ring-2 ring-accent ring-offset-2` + `border-accent` 중첩 적용이 정상.

### 참고 금지

크롬 확장 마켓플레이스 느낌, 광고 배너 많은 SaaS 랜딩, 그라데이션 남발한 AI 서비스 템플릿, 네온·글래스모피즘·블러 오버레이.

---

## 7. 현재 단계

`Phase 1` — 메인 생성기(기능1) 구축 중.
`SPEC.md#roadmap` 의 체크리스트 따라 진행.

---

## 8. 커뮤니케이션 규약

- 모든 UI 문구는 **한국어 우선** (ko.ts), 영어는 보조 (en.ts). 향후 토글.
- 커밋 메시지: Conventional Commits (`feat:`, `fix:`, `chore:`, `style:`, `refactor:`).
- PR 설명에 **스크린샷 2장** (데스크탑·모바일) 필수.

---

## 9. Claude Code에게 주는 실무 지시

- **추측하지 말 것**. 스펙에 없는 결정은 TODO 주석으로 남기고 질문.
- **"임시로" 코드 금지**. 나중에 고친다는 가정으로 하드코딩 금지.
- **Phase 경계 존중**. 이번 Phase 범위 밖 기능 선행 구현 금지.
- **UI 만들 때 디자인 토큰 위반이 보이면 즉시 롤백**. 예쁘게 보여도 원칙 위반은 전면 교체.
- **API 호출 테스트 코드**는 `scripts/` 밑에 별도로. 프로덕션 라우트와 섞지 말 것.
