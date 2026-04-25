import { create } from 'zustand';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  customImageUrl: string;
  generationId: string | null;
  selectedOptions: Record<string, string>;
  quantity: number;
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clear: () => void;
  totalCount: () => number;
  totalPrice: () => number;
}

function makeItemId(productId: string, options: Record<string, string>, imageUrl: string): string {
  const optStr = Object.entries(options).sort().map(([k, v]) => `${k}:${v}`).join('_');
  return `${productId}_${optStr}_${imageUrl.slice(-12)}`;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    const id = makeItemId(item.productId, item.selectedOptions, item.customImageUrl);
    const existing = get().items.find((i) => i.id === id);
    if (existing) {
      set((s) => ({
        items: s.items.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i,
        ),
      }));
    } else {
      set((s) => ({ items: [...s.items, { ...item, id }] }));
    }
  },

  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  updateQuantity: (id, qty) => {
    if (qty <= 0) { get().removeItem(id); return; }
    set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, quantity: qty } : i) }));
  },

  clear: () => set({ items: [] }),

  totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  totalPrice: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
}));
