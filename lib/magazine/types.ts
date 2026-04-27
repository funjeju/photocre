export type AspectRatio = "4:3" | "3:4"
export type FontSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl"
export type TextCase = "uppercase" | "title" | "sentence" | "lowercase" | "numeric" | "mixed"
export type TextAlign = "left" | "center" | "right"
export type FontWeight = "regular" | "medium" | "bold" | "black"
export type LetterSpacing = "normal" | "wide" | "widest"

export interface ImageSlot {
  x: number
  y: number
  w: number
  h: number
  rotation?: number   // degrees, for tilted/polaroid images
  frame?: string      // "polaroid" | "thin_border" etc. (visual hint, future use)
  clip?: string       // "triangle_top_left" etc. (visual hint, future use)
}

export interface TextSlot {
  type: string
  x: number
  y: number
  w: number
  h: number
  size?: FontSize
  rotation?: 0 | -90 | 90
  align?: TextAlign
  font?: "serif" | "sans" | "script"
  weight?: FontWeight
  italic?: boolean
  letterSpacing?: LetterSpacing
  color?: string
  lineHeight?: "tight" | "normal" | "relaxed"
  value_default?: string
}

export interface Decoration {
  type: "line" | "card_box" | "overlay_gradient" | "quad_color_overlay" | string
  // line fields
  orientation?: "horizontal" | "vertical"
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  thickness?: number
  color?: string
  // card_box fields
  x?: number
  y?: number
  w?: number
  h?: number
  fill?: string
  opacity?: number
  // overlay_gradient fields
  from?: string
  to?: string
  direction?: string
  y_range?: [number, number]
  // quad_color_overlay fields
  colors?: string[]
}

export interface CharLimit {
  min: number
  ideal: number
  max: number
  lines: number
  case: TextCase
}

export type ContentSet = Record<string, string | Record<string, string>>

export interface BackgroundPaletteEntry {
  type: "solid" | "gradient" | "bokeh"
  value?: string
  from?: string
  to?: string
  angle?: number
  baseColor?: string
  textColor: string
  accentColor: string
  tone: "neutral" | "warm" | "cool" | "dark"
}

export interface MagazineTemplate {
  id: string
  name: string
  description: string
  category?: "editorial" | "cute"
  imageCount: 1 | 2 | 3 | 4
  style: string
  aspectRatio: AspectRatio
  background: string
  images: ImageSlot[]
  texts: TextSlot[]
  decorations: Decoration[]
  char_limits: Record<string, CharLimit>
  dedicated_sets?: ContentSet[]       // base templates only
  borrows_sets_from?: string          // extension templates: borrow sets from this id
}

export interface MagazineLayouts {
  schema_version: string
  background_palette: Record<string, BackgroundPaletteEntry>
  templates: MagazineTemplate[]
}

export type RenderResolution = "thumbnail" | "preview" | "download"

export const RESOLUTION_CONFIG: Record<RenderResolution, { pixelRatio: number; outputPx: number }> = {
  thumbnail: { pixelRatio: 0.25, outputPx: 400 },
  preview:   { pixelRatio: 0.5,  outputPx: 800 },
  download:  { pixelRatio: 2,    outputPx: 3200 },
}

export interface RenderInput {
  images: string[]
  imageCount: 1 | 2 | 3 | 4
  seed?: number
}

export interface RenderVariant {
  templateId: string
  contentSetIndex: number
  resolution: RenderResolution
  blob: Blob
  width: number
  height: number
}

export type VariantState =
  | { status: "pending" }
  | { status: "loading" }
  | { status: "ready"; variant: RenderVariant }
  | { status: "error"; message: string }
