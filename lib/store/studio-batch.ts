import { create } from 'zustand';

export type ItemStatus = 'idle' | 'processing' | 'success' | 'failed';

export interface BatchItem {
  id: string;
  fileName: string;
  previewUrl: string;   // Object URL (original preview)
  base64: string;       // 1024px resized webp base64 for API
  imageType: string;
  status: ItemStatus;
  resultUrl?: string;   // data: URL returned from Gemini
  text: string;         // 사용자 입력 텍스트
  error?: string;
}

export interface BatchTower {
  styleId: string;
  intensity: number;
  aspectRatio: string;
  customPrompt: string;
  backgroundPrompt: string;
}

const DEFAULT_TOWER: BatchTower = {
  styleId: 'beauty',
  intensity: 70,
  aspectRatio: '4:5',
  customPrompt: '',
  backgroundPrompt: '',
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
