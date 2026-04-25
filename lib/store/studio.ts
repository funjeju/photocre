import { create } from 'zustand';

export type AspectRatio = '1:1' | '4:5' | '3:4' | '9:16' | '16:9' | 'free';

export interface TextOverlay {
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  position: { x: number; y: number };
  alignment: 'left' | 'center' | 'right';
  weight: number;
}

export interface StudioState {
  // 1. 소스 이미지
  sourceImage: { blob: Blob; previewUrl: string } | null;

  // 2. 크롭
  cropData: { x: number; y: number; width: number; height: number } | null;
  aspectRatio: AspectRatio;
  croppedImage: { blob: Blob; previewUrl: string } | null;

  // 3. AI 스타일 + 커스텀 프롬프트
  styleId: string;
  customPrompt: string;

  // 4. AI 출력
  generatedImageUrl: string | null;
  generationId: string | null;
  isGenerating: boolean;

  // 5. 꾸미기 (AI 출력 후 Konva 레이어)
  frameId: string;
  backgroundId: string;
  customBackground: { blob: Blob; previewUrl: string } | null;
  textOverlay: TextOverlay | null;

  // 크롭 다이얼로그
  isCropDialogOpen: boolean;

  // 액션
  setSourceImage: (img: { blob: Blob; previewUrl: string } | null) => void;
  setCropData: (crop: { x: number; y: number; width: number; height: number } | null) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setCroppedImage: (img: { blob: Blob; previewUrl: string } | null) => void;
  setStyleId: (id: string) => void;
  setCustomPrompt: (prompt: string) => void;
  setFrameId: (id: string) => void;
  setBackgroundId: (id: string) => void;
  setCustomBackground: (bg: { blob: Blob; previewUrl: string } | null) => void;
  setTextOverlay: (text: TextOverlay | null) => void;
  setGeneratedImageUrl: (url: string | null) => void;
  setGenerationId: (id: string | null) => void;
  setIsGenerating: (v: boolean) => void;
  setIsCropDialogOpen: (v: boolean) => void;
  reset: () => void;
}

const DEFAULT_TEXT_OVERLAY: TextOverlay = {
  content: '',
  fontFamily: 'Noto Sans KR',
  fontSize: 32,
  color: '#FFFFFF',
  position: { x: 0.5, y: 0.88 },
  alignment: 'center',
  weight: 400,
};

export const useStudioStore = create<StudioState>((set) => ({
  sourceImage: null,
  cropData: null,
  aspectRatio: '1:1',
  croppedImage: null,
  styleId: 'none',
  customPrompt: '',
  frameId: 'polaroid-classic',
  backgroundId: 'studio-gray',
  customBackground: null,
  textOverlay: null,
  generatedImageUrl: null,
  generationId: null,
  isGenerating: false,
  isCropDialogOpen: false,

  setSourceImage: (img) => set({ sourceImage: img, croppedImage: null, cropData: null, generatedImageUrl: null }),
  setCropData: (crop) => set({ cropData: crop }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
  setCroppedImage: (img) => set({ croppedImage: img }),
  // 스타일 변경 시 AI 결과 초기화 (재생성 필요)
  setStyleId: (id) => set({ styleId: id, generatedImageUrl: null }),
  setCustomPrompt: (prompt) => set({ customPrompt: prompt }),
  // 프레임/배경/텍스트는 AI 결과에 Konva로 합성 → 변경해도 AI 결과 유지
  setFrameId: (id) => set({ frameId: id }),
  setBackgroundId: (id) => set({ backgroundId: id }),
  setCustomBackground: (bg) => set({ customBackground: bg }),
  setTextOverlay: (text) => set({ textOverlay: text }),
  setGeneratedImageUrl: (url) => set({ generatedImageUrl: url }),
  setGenerationId: (id) => set({ generationId: id }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setIsCropDialogOpen: (v) => set({ isCropDialogOpen: v }),
  reset: () => set({
    sourceImage: null, cropData: null, croppedImage: null,
    styleId: 'none', customPrompt: '',
    frameId: 'polaroid-classic', backgroundId: 'studio-gray',
    customBackground: null, textOverlay: null,
    generatedImageUrl: null, generationId: null, isGenerating: false,
  }),
}));

export { DEFAULT_TEXT_OVERLAY };
