import type { BackgroundPaletteEntry, FontSize, TextSlot } from "./types"

export const PAGE_WIDTH = 1600

export function pctToPx(pct: number, total: number): number {
  return (pct / 100) * total
}

export function getPageHeight(aspectRatio: "4:3" | "3:4"): number {
  return aspectRatio === "4:3" ? (PAGE_WIDTH * 3) / 4 : (PAGE_WIDTH * 4) / 3
}

const FONT_SIZE_SCALE: Record<FontSize, number> = {
  xs:    0.010,
  sm:    0.014,
  md:    0.020,
  lg:    0.030,
  xl:    0.040,
  "2xl": 0.055,
  "3xl": 0.075,
  "4xl": 0.100,
  "5xl": 0.130,
  "6xl": 0.170,
}

export function getFontSize(size: FontSize | undefined, pageWidth: number): number {
  return (FONT_SIZE_SCALE[size ?? "sm"] ?? 0.014) * pageWidth
}

export function getFontFamily(slot: TextSlot): string {
  if (slot.font === "script") return "cursive"
  if (slot.font === "serif") return "Georgia, serif"
  return "Arial, sans-serif"
}

export function getFontStyle(slot: TextSlot): string {
  const bold = slot.weight === "bold" || slot.weight === "black"
  if (bold && slot.italic) return "bold italic"
  if (bold) return "bold"
  if (slot.italic) return "italic"
  return "normal"
}

export function getLetterSpacing(slot: TextSlot, fontSize: number): number {
  if (slot.letterSpacing === "widest") return fontSize * 0.15
  if (slot.letterSpacing === "wide") return fontSize * 0.05
  return 0
}

export function getLineHeight(slot: TextSlot): number {
  if (slot.lineHeight === "tight") return 1.2
  if (slot.lineHeight === "relaxed") return 1.6
  return 1.4
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function resolveTextColor(slot: TextSlot, palette: BackgroundPaletteEntry): string {
  if (!slot.color || slot.color === "default") return palette.textColor
  if (slot.color === "accent") return palette.accentColor
  if (slot.color === "muted") return hexToRgba(palette.textColor, 0.45)
  return slot.color
}

export function applyCase(text: string, caseStyle: string): string {
  if (caseStyle === "uppercase") return text.toUpperCase()
  if (caseStyle === "lowercase") return text.toLowerCase()
  return text
}

export function formatInfobox(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${k.toUpperCase()}\n${v}`)
    .join("\n\n")
}

export function resolveContentKey(texts: TextSlot[], slotIndex: number, slot: TextSlot): string {
  const sameTypeBefore = texts.slice(0, slotIndex).filter((s) => s.type === slot.type).length
  return sameTypeBefore === 0 ? slot.type : `${slot.type}_${sameTypeBefore + 1}`
}

export function angleToGradientPoints(angle: number, W: number, H: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  const len = Math.sqrt(W * W + H * H) / 2
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    start: { x: W / 2 - cos * len, y: H / 2 - sin * len },
    end:   { x: W / 2 + cos * len, y: H / 2 + sin * len },
  }
}
