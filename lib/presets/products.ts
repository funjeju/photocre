export interface ProductOption {
  key: string;
  label: string;
  values: string[];
}

export interface ProductPreset {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  options: ProductOption[];
  deliveryDays: number;
  mockupSrc: string;
  slotIds: string[];
  canvasW: number;
  canvasH: number;
}

export const SHIPPING_FEE = 3500;
export const FREE_SHIPPING_THRESHOLD = 50000;

export const PRODUCT_PRESETS: ProductPreset[] = [
  {
    id: 'tshirt',
    name: '커스텀 티셔츠',
    basePrice: 29000,
    description: '고품질 순면 소재에 내 사진을 DTG 직접 프린팅. 세탁 후에도 색상이 오래 유지됩니다.',
    options: [
      { key: 'size',  label: '사이즈', values: ['S', 'M', 'L', 'XL', '2XL'] },
      { key: 'color', label: '색상',   values: ['화이트', '블랙', '그레이', '네이비'] },
    ],
    deliveryDays: 7,
    mockupSrc: '/mockups/tshirt.jpg.png',
    slotIds: ['tshirt'],
    canvasW: 200, canvasH: 220,
  },
  {
    id: 'mug',
    name: '커스텀 머그컵',
    basePrice: 19000,
    description: '매일 아침 내 사진과 함께하는 특별한 머그컵. 전자레인지·식기세척기 사용 가능.',
    options: [
      { key: 'capacity', label: '용량', values: ['320ml', '460ml'] },
    ],
    deliveryDays: 7,
    mockupSrc: '/mockups/mug.jpg.png',
    slotIds: ['mug'],
    canvasW: 220, canvasH: 205,
  },
  {
    id: 'cushion',
    name: '커스텀 쿠션',
    basePrice: 32000,
    description: '내 사진이 담긴 포근한 쿠션. 커버 분리 세탁 가능. 내부 솜 포함.',
    options: [
      { key: 'size', label: '사이즈', values: ['40×40cm', '50×50cm'] },
    ],
    deliveryDays: 10,
    mockupSrc: '/mockups/cushion.jpg.png',
    slotIds: ['cushion_left', 'cushion_right'],
    canvasW: 200, canvasH: 195,
  },
  {
    id: 'totebag',
    name: '커스텀 에코백',
    basePrice: 18000,
    description: '두꺼운 캔버스 원단의 친환경 에코백. 내 사진을 실크스크린 프린팅으로 제작.',
    options: [
      { key: 'color', label: '색상', values: ['화이트', '블랙'] },
    ],
    deliveryDays: 7,
    mockupSrc: '/mockups/totebag.jpg.png',
    slotIds: ['totebag_black', 'totebag_white'],
    canvasW: 185, canvasH: 215,
  },
  {
    id: 'griptok',
    name: '커스텀 그립톡',
    basePrice: 12000,
    description: '스마트폰 뒷면에 붙이는 그립톡. 내 사진이 새겨진 UV 인쇄 방식.',
    options: [],
    deliveryDays: 5,
    mockupSrc: '/mockups/griptok.jpg.png',
    slotIds: ['griptok'],
    canvasW: 175, canvasH: 190,
  },
  {
    id: 'minicanvas',
    name: '커스텀 미니캔버스',
    basePrice: 24000,
    description: '작은 이젤에 올려두는 나만의 미니 캔버스 액자. 책상 위 소품으로 제격.',
    options: [
      { key: 'size', label: '사이즈', values: ['10×10cm', '15×15cm'] },
    ],
    deliveryDays: 10,
    mockupSrc: '/mockups/minicanvas.jpg.png',
    slotIds: ['minicanvas_left', 'minicanvas_right'],
    canvasW: 215, canvasH: 188,
  },
];

export const PRODUCT_MAP = Object.fromEntries(PRODUCT_PRESETS.map((p) => [p.id, p]));
