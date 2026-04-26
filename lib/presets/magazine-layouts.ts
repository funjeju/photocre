export interface MagazineTextSlot {
  type: 'title' | 'body' | 'caption';
  x: number; y: number; w: number; h: number;
}

export interface MagazineImageSlot {
  x: number; y: number; w: number; h: number;
}

export interface MagazineTemplate {
  id: string;
  imageCount: number;
  images: MagazineImageSlot[];
  texts: MagazineTextSlot[];
}

// 모든 좌표는 % 단위 (0–100), 캔버스 크기에 비례

export const MAGAZINE_TEMPLATES: MagazineTemplate[] = [

  /* ===================== */
  /* 1장 레이아웃           */
  /* ===================== */

  {
    id: '1-1', imageCount: 1,
    images: [
      { x: 0, y: 0, w: 100, h: 100 },
    ],
    texts: [
      { type: 'title',   x: 5,  y: 75, w: 90, h: 10 },
      { type: 'body',    x: 5,  y: 85, w: 90, h: 10 },
    ],
  },

  {
    id: '1-2', imageCount: 1,
    images: [
      { x: 10, y: 10, w: 80, h: 60 },
    ],
    texts: [
      { type: 'title', x: 10, y: 72, w: 80, h: 10 },
      { type: 'body',  x: 10, y: 82, w: 80, h: 10 },
    ],
  },

  {
    id: '1-3', imageCount: 1,
    images: [
      { x: 0, y: 0, w: 60, h: 100 },
    ],
    texts: [
      { type: 'title', x: 65, y: 20, w: 30, h: 10 },
      { type: 'body',  x: 65, y: 32, w: 30, h: 40 },
    ],
  },

  {
    id: '1-4', imageCount: 1,
    images: [
      { x: 20, y: 10, w: 60, h: 60 },
    ],
    texts: [
      { type: 'title',   x: 20, y: 75, w: 60, h: 10 },
      { type: 'caption', x: 20, y: 85, w: 60, h: 8  },
    ],
  },

  /* ===================== */
  /* 2장 레이아웃           */
  /* ===================== */

  {
    id: '2-1', imageCount: 2,
    images: [
      { x: 0, y: 0,  w: 100, h: 50 },
      { x: 0, y: 50, w: 100, h: 50 },
    ],
    texts: [
      { type: 'title', x: 5, y: 45, w: 90, h: 8 },
    ],
  },

  {
    id: '2-2', imageCount: 2,
    images: [
      { x: 0,  y: 0, w: 50, h: 100 },
      { x: 50, y: 0, w: 50, h: 60  },
    ],
    texts: [
      { type: 'body', x: 50, y: 65, w: 45, h: 30 },
    ],
  },

  {
    id: '2-3', imageCount: 2,
    images: [
      { x: 0,  y: 0, w: 60, h: 100 },
      { x: 60, y: 0, w: 40, h: 40  },
    ],
    texts: [
      { type: 'title', x: 60, y: 45, w: 35, h: 10 },
      { type: 'body',  x: 60, y: 60, w: 35, h: 30 },
    ],
  },

  {
    id: '2-4', imageCount: 2,
    images: [
      { x: 10, y: 10, w: 80, h: 40 },
      { x: 10, y: 55, w: 80, h: 35 },
    ],
    texts: [
      { type: 'caption', x: 10, y: 92, w: 80, h: 6 },
    ],
  },

  /* ===================== */
  /* 3장 레이아웃           */
  /* ===================== */

  {
    id: '3-1', imageCount: 3,
    images: [
      { x: 0,  y: 0,  w: 100, h: 50 },
      { x: 0,  y: 50, w: 50,  h: 50 },
      { x: 50, y: 50, w: 50,  h: 50 },
    ],
    texts: [
      { type: 'title', x: 5, y: 45, w: 90, h: 8 },
    ],
  },

  {
    id: '3-2', imageCount: 3,
    images: [
      { x: 0,  y: 0,  w: 60, h: 60 },
      { x: 60, y: 0,  w: 40, h: 30 },
      { x: 60, y: 30, w: 40, h: 30 },
    ],
    texts: [
      { type: 'body', x: 0, y: 65, w: 100, h: 30 },
    ],
  },

  {
    id: '3-3', imageCount: 3,
    images: [
      { x: 0,  y: 0, w: 33, h: 100 },
      { x: 33, y: 0, w: 33, h: 100 },
      { x: 66, y: 0, w: 34, h: 60  },
    ],
    texts: [
      { type: 'title', x: 66, y: 65, w: 30, h: 10 },
    ],
  },

  {
    id: '3-4', imageCount: 3,
    images: [
      { x: 10, y: 10, w: 80, h: 30 },
      { x: 10, y: 45, w: 35, h: 35 },
      { x: 55, y: 45, w: 35, h: 35 },
    ],
    texts: [
      { type: 'caption', x: 10, y: 82, w: 80, h: 10 },
    ],
  },

  /* ===================== */
  /* 4장 레이아웃           */
  /* ===================== */

  {
    id: '4-1', imageCount: 4,
    images: [
      { x: 0,  y: 0,  w: 50, h: 50 },
      { x: 50, y: 0,  w: 50, h: 50 },
      { x: 0,  y: 50, w: 50, h: 50 },
      { x: 50, y: 50, w: 50, h: 50 },
    ],
    texts: [
      { type: 'title', x: 5, y: 90, w: 90, h: 8 },
    ],
  },

  {
    id: '4-2', imageCount: 4,
    images: [
      { x: 0,  y: 0,  w: 60,  h: 60 },
      { x: 60, y: 0,  w: 40,  h: 30 },
      { x: 60, y: 30, w: 40,  h: 30 },
      { x: 0,  y: 60, w: 100, h: 40 },
    ],
    texts: [
      { type: 'body', x: 5, y: 90, w: 90, h: 8 },
    ],
  },

  {
    id: '4-3', imageCount: 4,
    images: [
      { x: 0,  y: 0,  w: 33,  h: 50 },
      { x: 33, y: 0,  w: 34,  h: 50 },
      { x: 67, y: 0,  w: 33,  h: 50 },
      { x: 0,  y: 50, w: 100, h: 50 },
    ],
    texts: [
      { type: 'caption', x: 5, y: 92, w: 90, h: 6 },
    ],
  },

  {
    id: '4-4', imageCount: 4,
    images: [
      { x: 10, y: 10, w: 35, h: 35 },
      { x: 55, y: 10, w: 35, h: 35 },
      { x: 10, y: 50, w: 35, h: 35 },
      { x: 55, y: 50, w: 35, h: 35 },
    ],
    texts: [
      { type: 'title', x: 10, y: 88, w: 80, h: 8 },
    ],
  },

];
