import type {
  MagazineLayouts,
  MagazineTemplate,
  ContentSet,
  RenderInput,
  RenderVariant,
  RenderResolution,
} from "./types"
import { buildUnifiedPalette, getDedicatedSets, mergeTemplates } from "./layouts"

// ── Seeded RNG ────────────────────────────────────────────────────────────────

function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = Math.imul(s, 1664525) + 1013904223
    return (s >>> 0) / 0x100000000
  }
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  const rng = makeRng(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ── Template / content-set pickers ────────────────────────────────────────────

export function getTemplatesForImageCount(
  templates: MagazineTemplate[],
  imageCount: 1 | 2 | 3 | 4
): MagazineTemplate[] {
  return templates.filter((t) => t.imageCount === imageCount)
}

export function pickThreeTemplates(
  candidates: MagazineTemplate[],
  seed?: number
): [MagazineTemplate, MagazineTemplate, MagazineTemplate] {
  let shuffled: MagazineTemplate[]
  if (seed !== undefined) {
    shuffled = seededShuffle(candidates, seed)
  } else {
    shuffled = [...candidates]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
  }
  return [shuffled[0], shuffled[1], shuffled[2]]
}

export function pickContentSet(
  template: MagazineTemplate,
  allTemplates: MagazineTemplate[],
  seed?: number
): { set: ContentSet; index: number } {
  const sets = getDedicatedSets(template, allTemplates)
  if (sets.length === 0) {
    // Fallback: return empty set so the template still renders
    return { set: {}, index: 0 }
  }
  const index =
    seed !== undefined
      ? Math.abs((makeRng(seed + 99)() * sets.length) | 0) % sets.length
      : Math.floor(Math.random() * sets.length)
  return { set: sets[index], index }
}

// ── Async layout loader (merged base + extension) ─────────────────────────────

async function loadMergedLayouts() {
  const [baseModule, extModule] = await Promise.all([
    import("@/data/magazine_layouts_v5.json"),
    import("@/data/magazine_layouts_v5_extension.json"),
  ])

  const base = baseModule as unknown as MagazineLayouts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ext = extModule as unknown as any

  const allTemplates = mergeTemplates(
    base.templates as MagazineTemplate[],
    ext.templates as MagazineTemplate[]
  )

  const unifiedPalette = buildUnifiedPalette(
    base.background_palette,
    ext.background_system ?? {}
  )

  return { allTemplates, unifiedPalette }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function* generateThreeVariants(
  input: RenderInput
): AsyncGenerator<RenderVariant, void, unknown> {
  const { allTemplates, unifiedPalette } = await loadMergedLayouts()
  const { renderToBlob } = await import("./konva-renderer")

  const candidates = getTemplatesForImageCount(allTemplates, input.imageCount)
  const [t1, t2, t3] = pickThreeTemplates(candidates, input.seed)

  const cs1 = pickContentSet(t1, allTemplates, input.seed)
  const cs2 = pickContentSet(t2, allTemplates, input.seed !== undefined ? input.seed + 37 : undefined)
  const cs3 = pickContentSet(t3, allTemplates, input.seed !== undefined ? input.seed + 73 : undefined)

  const triples: [MagazineTemplate, ContentSet, number][] = [
    [t1, cs1.set, cs1.index],
    [t2, cs2.set, cs2.index],
    [t3, cs3.set, cs3.index],
  ]

  for (const [template, contentSet, contentSetIndex] of triples) {
    const variant = await renderToBlob(
      template,
      unifiedPalette,
      input.images,
      contentSet,
      contentSetIndex,
      "thumbnail"
    )
    yield variant
  }
}

export async function renderAtResolution(
  templateId: string,
  contentSetIndex: number,
  images: string[],
  resolution: "preview" | "download",
  overrideContentSet?: ContentSet
): Promise<RenderVariant> {
  const { allTemplates, unifiedPalette } = await loadMergedLayouts()
  const { renderToBlob } = await import("./konva-renderer")

  const template = allTemplates.find((t) => t.id === templateId)
  if (!template) throw new Error(`Template not found: ${templateId}`)

  const sets = getDedicatedSets(template, allTemplates)
  const baseContentSet = sets[contentSetIndex] ?? {}

  const contentSet: ContentSet = overrideContentSet
    ? { ...baseContentSet, ...overrideContentSet }
    : baseContentSet

  return renderToBlob(template, unifiedPalette, images, contentSet, contentSetIndex, resolution)
}

export async function getTemplateAndContentSet(
  templateId: string,
  contentSetIndex: number
): Promise<{ template: MagazineTemplate; contentSet: ContentSet }> {
  const { allTemplates } = await loadMergedLayouts()

  const template = allTemplates.find((t) => t.id === templateId)
  if (!template) throw new Error(`Template not found: ${templateId}`)

  const sets = getDedicatedSets(template, allTemplates)
  const contentSet = sets[contentSetIndex] ?? {}
  return { template, contentSet }
}

export type { RenderResolution }
