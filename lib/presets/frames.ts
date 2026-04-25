import type { CSSProperties } from 'react';

export type FramePreset = {
  id: string;
  name: string;
  description: string;
  thumbnailBg: string;
  aspectLock?: string;
  promptFragment: string;
  textDefault: {
    position: { x: number; y: number };
    alignment: 'left' | 'center' | 'right';
    colorPreference: 'dark' | 'light';
  };
  // CSS 즉시 미리보기용
  css: {
    wrapper: CSSProperties;   // 프레임 전체 배경 (폴라로이드 흰 영역 등)
    image: CSSProperties;     // 이미지에 적용할 스타일
    showCaption?: boolean;    // 하단 캡션 영역 표시 여부 (폴라로이드 등)
    captionBg?: string;       // 캡션 배경색
  };
  // Konva 합성용 padding (512px 기준, px)
  konva: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    frameBg: string;          // 'transparent' or hex
  };
};

export const FRAMES: FramePreset[] = [
  {
    id: 'none',
    name: '프레임 없음',
    description: '풀블리드 — 프레임 없이 원본 비율 유지',
    thumbnailBg: '#F5F5F0',
    promptFragment: 'Full-bleed image with no border or frame.',
    textDefault: { position: { x: 0.5, y: 0.88 }, alignment: 'center', colorPreference: 'light' },
    css: { wrapper: {}, image: { borderRadius: '0.75rem' }, showCaption: false },
    konva: { top: 0, right: 0, bottom: 0, left: 0, frameBg: 'transparent' },
  },
  {
    id: 'polaroid-classic',
    name: '폴라로이드 클래식',
    description: '흰 테두리, 하단 넓은 여백',
    thumbnailBg: '#FFFFFF',
    promptFragment: 'Place the image inside a classic Polaroid instant photo frame.',
    textDefault: { position: { x: 0.5, y: 0.92 }, alignment: 'center', colorPreference: 'dark' },
    css: {
      wrapper: { background: '#ffffff', padding: '10px 10px 48px', boxShadow: '0 6px 24px rgba(0,0,0,0.12)' },
      image: {},
      showCaption: true,
      captionBg: '#ffffff',
    },
    konva: { top: 16, right: 16, bottom: 80, left: 16, frameBg: '#ffffff' },
  },
  {
    id: 'polaroid-vintage',
    name: '폴라로이드 빈티지',
    description: '크림 톤, 낡은 질감',
    thumbnailBg: '#F5ECD7',
    promptFragment: 'Place the image inside a vintage Polaroid frame with cream-colored border.',
    textDefault: { position: { x: 0.5, y: 0.92 }, alignment: 'center', colorPreference: 'dark' },
    css: {
      wrapper: { background: '#F5ECD7', padding: '10px 10px 48px', boxShadow: '0 6px 24px rgba(0,0,0,0.10)', filter: 'sepia(0.15)' },
      image: {},
      showCaption: true,
      captionBg: '#F5ECD7',
    },
    konva: { top: 16, right: 16, bottom: 80, left: 16, frameBg: '#F5ECD7' },
  },
  {
    id: 'minimal-white',
    name: '미니멀 화이트',
    description: '균일한 흰 여백',
    thumbnailBg: '#FAFAFA',
    promptFragment: 'Surround the image with a clean, uniform white border on all four sides.',
    textDefault: { position: { x: 0.5, y: 0.95 }, alignment: 'center', colorPreference: 'dark' },
    css: {
      wrapper: { background: '#ffffff', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
      image: {},
      showCaption: false,
    },
    konva: { top: 40, right: 40, bottom: 40, left: 40, frameBg: '#ffffff' },
  },
  {
    id: 'film-strip',
    name: '필름 스트립',
    description: '양옆 스프로킷 홀',
    thumbnailBg: '#1A1A1A',
    promptFragment: 'Place the image inside a film strip frame with sprocket holes on the edges.',
    textDefault: { position: { x: 0.5, y: 0.88 }, alignment: 'center', colorPreference: 'light' },
    css: {
      wrapper: { background: '#1a1a1a', padding: '10px 36px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
      image: { filter: 'contrast(1.05) saturate(0.9)' },
      showCaption: false,
    },
    konva: { top: 16, right: 56, bottom: 16, left: 56, frameBg: '#1a1a1a' },
  },
  {
    id: 'instagram-post',
    name: '인스타 포스트',
    description: '1:1 비율, 얇은 흰 테두리',
    thumbnailBg: '#FFFFFF',
    aspectLock: '1:1',
    promptFragment: 'Frame the image in a 1:1 square format with a thin, clean white border.',
    textDefault: { position: { x: 0.5, y: 0.88 }, alignment: 'center', colorPreference: 'light' },
    css: {
      wrapper: { background: '#ffffff', padding: '6px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
      image: {},
      showCaption: false,
    },
    konva: { top: 10, right: 10, bottom: 10, left: 10, frameBg: '#ffffff' },
  },
  {
    id: 'postcard',
    name: '엽서',
    description: '두꺼운 카드 + 둥근 모서리',
    thumbnailBg: '#FFFEF7',
    promptFragment: 'Present the image as a printed postcard with thick card-like border.',
    textDefault: { position: { x: 0.5, y: 0.92 }, alignment: 'center', colorPreference: 'dark' },
    css: {
      wrapper: { background: '#FFFEF7', padding: '20px 20px 36px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: '12px' },
      image: { borderRadius: '4px' },
      showCaption: true,
      captionBg: '#FFFEF7',
    },
    konva: { top: 32, right: 32, bottom: 56, left: 32, frameBg: '#FFFEF7' },
  },
  {
    id: 'magazine-cover',
    name: '매거진 커버',
    description: '타이포 중심 레이아웃',
    thumbnailBg: '#E8E8E8',
    promptFragment: 'Style the image as a high-fashion magazine cover.',
    textDefault: { position: { x: 0.5, y: 0.1 }, alignment: 'center', colorPreference: 'light' },
    css: {
      wrapper: { background: '#E8E8E8', padding: '0', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
      image: {},
      showCaption: false,
    },
    konva: { top: 0, right: 0, bottom: 0, left: 0, frameBg: 'transparent' },
  },
  {
    id: 'instagram-story',
    name: '인스타 스토리',
    description: '9:16 세로 포맷',
    thumbnailBg: '#F0F0F0',
    aspectLock: '9:16',
    promptFragment: 'Frame the image in a 9:16 vertical story format.',
    textDefault: { position: { x: 0.5, y: 0.85 }, alignment: 'center', colorPreference: 'light' },
    css: {
      wrapper: { background: 'transparent', padding: '0' },
      image: {},
      showCaption: false,
    },
    konva: { top: 0, right: 0, bottom: 0, left: 0, frameBg: 'transparent' },
  },
  {
    id: 'vintage-frame',
    name: '빈티지 액자',
    description: '나무·금박 장식 테두리',
    thumbnailBg: '#8B6914',
    promptFragment: 'Surround the image with an ornate vintage picture frame with gold leaf decoration.',
    textDefault: { position: { x: 0.5, y: 0.92 }, alignment: 'center', colorPreference: 'light' },
    css: {
      wrapper: {
        background: 'linear-gradient(135deg, #C8A030, #8B6914, #C8A030, #8B6914)',
        padding: '18px',
        boxShadow: '0 6px 28px rgba(0,0,0,0.3), inset 0 0 0 3px rgba(255,220,100,0.4)',
      },
      image: {},
      showCaption: false,
    },
    konva: { top: 28, right: 28, bottom: 28, left: 28, frameBg: '#A0780A' },
  },
];

export function getFrame(id: string): FramePreset {
  return FRAMES.find((f) => f.id === id) ?? FRAMES[0];
}
