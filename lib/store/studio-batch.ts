import { create } from 'zustand';

export type ItemStatus = 'idle' | 'processing' | 'success' | 'failed';

export interface BatchItem {
  id: string;
  fileName: string;
  previewUrl: string;      // Object URL (original preview)
  base64: string;          // 1024px resized webp base64 for API
  imageType: string;
  status: ItemStatus;
  resultUrl?: string;      // data: URL returned from Gemini
  text: string;            // 사용자 입력 텍스트
  error?: string;
  croppedBase64?: string;  // 개별 크롭 후 base64 (있으면 AI 변환 시 우선 사용)
  croppedPreviewUrl?: string; // 크롭 썸네일 미리보기
}

export interface BatchTower {
  styleId: string;
  intensity: number;
  aspectRatio: string;
  customPrompt: string;
  backgroundPrompt: string;
  // 텍스트 오버레이 (단일 모드와 동일한 방식)
  textEnabled: boolean;
  textFontFamily: string;
  textFontSize: number;
  textColor: string;
  textBold: boolean;
  textPosition: 'top' | 'center' | 'bottom';
  textBgColor: string | null;
  textAlignment: 'left' | 'center' | 'right';
}

const DEFAULT_TOWER: BatchTower = {
  styleId: 'beauty',
  intensity: 70,
  aspectRatio: '4:5',
  customPrompt: '',
  backgroundPrompt: '',
  textEnabled: false,
  textFontFamily: 'Noto Sans KR',
  textFontSize: 36,
  textColor: '#FFFFFF',
  textBold: false,
  textPosition: 'bottom',
  textBgColor: null,
  textAlignment: 'center',
};

interface StudioBatchState {
  items: BatchItem[];
  tower: BatchTower;
  isProcessing: boolean;

  addItems: (items: Omit<BatchItem, 'status' | 'text' | 'error'>[]) => void;
  removeItem: (id: string) => void;
  updateText: (id: string, text: string) => void;
  patchTower: (patch: Partial<BatchTower>) => void;
  patchItem: (id: string, patch: Partial<BatchItem>) => void;
  setProcessing: (v: boolean) => void;
  reset: () => void;
}

export const useStudioBatchStore = create<StudioBatchState>((set) => ({
  items: [],
  tower: DEFAULT_TOWER,
  isProcessing: false,

  addItems: (newItems) =>
    set((s) => ({
      items: [
        ...s.items,
        ...newItems.map((item) => ({ ...item, status: 'idle' as ItemStatus, text: '' })),
      ],
    })),

  removeItem: (id) =>
    set((s) => {
      const item = s.items.find((i) => i.id === id);
      if (item?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
      return { items: s.items.filter((i) => i.id !== id) };
    }),

  updateText: (id, text) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, text } : i)) })),

  patchTower: (patch) => set((s) => ({ tower: { ...s.tower, ...patch } })),

  patchItem: (id, patch) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),

  setProcessing: (v) => set({ isProcessing: v }),

  reset: () => {
    // revoke all object URLs
    useStudioBatchStore.getState().items.forEach((item) => {
      if (item.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
    });
    set({ items: [], tower: DEFAULT_TOWER, isProcessing: false });
  },
}));
