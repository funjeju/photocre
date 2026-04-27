import type { MagazineTemplate, BackgroundPaletteEntry, ContentSet } from "./types"

// ── Luminance helper ──────────────────────────────────────────────────────────

function isLightColor(hex: string): boolean {
  const clean = hex.replace("#", "")
  if (clean.length < 6) return true
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

function solidEntry(hex: string): BackgroundPaletteEntry {
  const light = isLightColor(hex)
  return {
    type: "solid",
    value: hex,
    textColor: light ? "#0A0A0A" : "#FAFAFA",
    accentColor: light ? "#4B5563" : "#93C5FD",
    tone: "neutral",
  }
}

interface GradStop { color: string; at: number }
interface ExtGradient {
  type: string
  direction?: string
  center?: string
  stops: GradStop[]
}

function gradientEntry(grad: ExtGradient): BackgroundPaletteEntry {
  const stops = grad.stops ?? []
  const from = stops[0]?.color ?? "#FAFAFA"
  const to = stops[stops.length - 1]?.color ?? "#FFFFFF"
  const angle = parseInt(grad.direction ?? "180") || 180
  const light = isLightColor(from)
  return {
    type: "gradient",
    from,
    to,
    angle,
    textColor: light ? "#0A0A0A" : "#FAFAFA",
    accentColor: light ? "#4B5563" : "#93C5FD",
    tone: "neutral",
  }
}

// ── Palette builder ───────────────────────────────────────────────────────────

interface BackgroundSystem {
  solid?: Record<string, string>
  gradient?: Record<string, ExtGradient>
  texture?: Record<string, { base_color?: string }>
  pattern?: Record<string, { bg_color?: string }>
}

export function buildUnifiedPalette(
  basePalette: Record<string, BackgroundPaletteEntry>,
  backgroundSystem: BackgroundSystem
): Record<string, BackgroundPaletteEntry> {
  const result: Record<string, BackgroundPaletteEntry> = { ...basePalette }

  for (const [k, hex] of Object.entries(backgroundSystem.solid ?? {})) {
    if (!(k in result)) result[k] = solidEntry(hex)
  }
  for (const [k, grad] of Object.entries(backgroundSystem.gradient ?? {})) {
    if (!(k in result)) result[k] = gradientEntry(grad)
  }
  // Textures: fallback to base_color as solid (no PNG assets yet)
  for (const [k, tex] of Object.entries(backgroundSystem.texture ?? {})) {
    if (!(k in result)) result[k] = solidEntry(tex.base_color ?? "#F4F0E8")
  }
  // Patterns: fallback to bg_color as solid
  for (const [k, pat] of Object.entries(backgroundSystem.pattern ?? {})) {
    if (!(k in result)) result[k] = solidEntry(pat.bg_color ?? "#FAFAFA")
  }

  return result
}

// ── Dedicated sets resolver ───────────────────────────────────────────────────

export function getDedicatedSets(
  template: MagazineTemplate,
  allTemplates: MagazineTemplate[]
): ContentSet[] {
  // Base template: has its own sets
  if (template.dedicated_sets && template.dedicated_sets.length > 0) {
    return template.dedicated_sets
  }
  // Extension template: borrow from referenced template
  const sourceId = template.borrows_sets_from
  if (sourceId) {
    const source = allTemplates.find((t) => t.id === sourceId)
    if (source?.dedicated_sets && source.dedicated_sets.length > 0) {
      return source.dedicated_sets
    }
  }
  return []
}

// ── Template merger ───────────────────────────────────────────────────────────

export function mergeTemplates(
  baseTemplates: MagazineTemplate[],
  extTemplates: MagazineTemplate[]
): MagazineTemplate[] {
  // Assign category to base templates (all editorial)
  const base = baseTemplates.map((t) => ({ ...t, category: "editorial" as const }))
  return [...base, ...extTemplates]
}
