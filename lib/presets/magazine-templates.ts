export type LayoutType =
  | 'full_image'
  | 'split_vertical'
  | 'image_bottom'
  | 'grid'
  | 'solid_background'
  | 'image_with_sidebar';

export interface TextFieldDef {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
  maxLength?: number;
}

export interface MagazineTemplate {
  id: string;
  name: string;
  description: string;
  imageCount: number;
  layout: LayoutType;
  textFields: TextFieldDef[];
}

export const MAGAZINE_TEMPLATES: MagazineTemplate[] = [
  {
    id: 'cover_full_editorial',
    name: '에디토리얼 표지',
    description: '풀 이미지 위에 제목을 올린 잡지 표지',
    imageCount: 1,
    layout: 'full_image',
    textFields: [
      { key: 'title', label: '메인 타이틀', placeholder: 'VOGUE', maxLength: 20 },
      { key: 'subtitle', label: '서브 타이틀', placeholder: 'Spring Collection 2025', maxLength: 50 },
      { key: 'meta', label: '메타 정보', placeholder: 'Vol.12 · April 2025', maxLength: 50 },
    ],
  },
  {
    id: 'split_left_image_right_text',
    name: '좌우 분할',
    description: '왼쪽 사진, 오른쪽 텍스트 레이아웃',
    imageCount: 1,
    layout: 'split_vertical',
    textFields: [
      { key: 'title', label: '제목', placeholder: 'The Art of Simplicity', maxLength: 40 },
      { key: 'body', label: '본문', placeholder: '한 문장의 철학이 삶을 바꾼다.', multiline: true, maxLength: 200 },
    ],
  },
  {
    id: 'center_overlay_block',
    name: '센터 블록',
    description: '이미지 중앙에 반투명 블록과 타이틀',
    imageCount: 1,
    layout: 'full_image',
    textFields: [
      { key: 'title', label: '제목', placeholder: 'EDITORIAL', maxLength: 20 },
    ],
  },
  {
    id: 'top_typography_minimal',
    name: '미니멀 타이포',
    description: '상단 큰 타이틀, 하단에 사진',
    imageCount: 1,
    layout: 'image_bottom',
    textFields: [
      { key: 'title', label: '메인 타이틀', placeholder: 'PORTRAIT', maxLength: 20 },
      { key: 'subtitle', label: '서브 타이틀', placeholder: 'Spring / Summer', maxLength: 40 },
    ],
  },
  {
    id: 'grid_double_image',
    name: '더블 그리드',
    description: '2장의 사진을 세로로 나란히 배치',
    imageCount: 2,
    layout: 'grid',
    textFields: [
      { key: 'caption1', label: '캡션 1', placeholder: 'Look 01', maxLength: 30 },
      { key: 'caption2', label: '캡션 2', placeholder: 'Look 02', maxLength: 30 },
    ],
  },
  {
    id: 'cutout_color_bg',
    name: '컬러 팝',
    description: '밝은 그라데이션 배경의 팝한 포스터',
    imageCount: 1,
    layout: 'solid_background',
    textFields: [
      { key: 'title', label: '메인 타이틀', placeholder: 'STAR', maxLength: 20 },
      { key: 'badge', label: '배지', placeholder: 'NEW', maxLength: 10 },
    ],
  },
  {
    id: 'dark_luxury_cover',
    name: '럭셔리 다크',
    description: '어두운 무드의 하이엔드 커버',
    imageCount: 1,
    layout: 'full_image',
    textFields: [
      { key: 'title', label: '메인 타이틀', placeholder: 'NOIR', maxLength: 20 },
      { key: 'subtitle', label: '서브 타이틀', placeholder: 'Exclusive Edition', maxLength: 40 },
    ],
  },
  {
    id: 'side_bar_text',
    name: '사이드바',
    description: '70% 사진 + 30% 텍스트 사이드바',
    imageCount: 1,
    layout: 'image_with_sidebar',
    textFields: [
      { key: 'title', label: '제목', placeholder: 'Feature Story', maxLength: 20 },
      { key: 'list', label: '목록', placeholder: '• 첫 번째 항목\n• 두 번째 항목\n• 세 번째 항목', multiline: true, maxLength: 150 },
    ],
  },
  {
    id: 'bottom_caption_editorial',
    name: '바텀 캡션',
    description: '하단 흰 캡션 영역이 있는 에디토리얼',
    imageCount: 1,
    layout: 'full_image',
    textFields: [
      { key: 'title', label: '제목', placeholder: 'Journey', maxLength: 30 },
      { key: 'body', label: '캡션', placeholder: '한 줄의 문장으로 순간을 담다.', multiline: true, maxLength: 150 },
    ],
  },
  {
    id: 'experimental_poster',
    name: '실험적 포스터',
    description: '도형과 그래픽이 어우러진 아방가르드 포스터',
    imageCount: 1,
    layout: 'full_image',
    textFields: [
      { key: 'title', label: '타이틀', placeholder: 'AVANT-GARDE', maxLength: 20 },
    ],
  },
];

export function getMagazineTemplate(id: string): MagazineTemplate | undefined {
  return MAGAZINE_TEMPLATES.find((t) => t.id === id);
}
