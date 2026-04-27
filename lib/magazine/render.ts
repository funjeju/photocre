import type {
  MagazineLayouts,
  MagazineTemplate,
  ContentSet,
  RenderInput,
  RenderVariant,
  RenderResolution,
} from "./types"

// Linear-congruential seeded RNG (deterministic, good enough for layout picking)
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

export function getTemplatesForImageCount(
  layouts: MagazineLayouts,
  imageCount: 1 | 2 | 3 | 4
): MagazineTemplate[] {
  return layouts.templates.filter((t) => t.imageCount === imageCount)
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
  seed?: number
): { set: ContentSet; index: number } {
  const sets = template.dedicated_sets
  const index =
    seed !== undefined
      ? Math.abs(makeRng(seed + 99)() * sets.length | 0) % sets.length
      : Math.floor(Math.random() * sets.length)
  return { set: sets[index], index }
}

export async function* generateThreeVariants(
  input: RenderInput
): AsyncGenerator<RenderVariant, void, unknown> {
  const layouts = (await import("@/data/magazine_layouts_v5.json")) as unknown as MagazineLayouts
  const { renderToBlob } = await import("./konva-renderer")

  const candidates = getTemplatesForImageCount(layouts, input.imageCount)
  const [t1, t2, t3] = pickThreeTemplates(candidates, input.seed)

  // Each template gets its own content-set seed so they don't all land on the same set
  const cs1 = pickContentSet(t1, input.seed)
  const cs2 = pickContentSet(t2, input.seed !== undefined ? input.seed + 37 : undefined)
  const cs3 = pickContentSet(t3, input.seed !== undefined ? input.seed + 73 : undefined)

  const triples: [MagazineTemplate, ContentSet, number][] = [
    [t1, cs1.set, cs1.index],
    [t2, cs2.set, cs2.index],
    [t3, cs3.set, cs3.index],
  ]

  for (const [template, contentSet, contentSetIndex] of triples) {
    const variant = await renderToBlob(
      template,
      layouts.background_palette,
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
  const layouts = (await import("@/data/magazine_layouts_v5.json")) as unknown as MagazineLayouts
  const { renderToBlob } = await import("./konva-renderer")

  const template = layouts.templates.find((t) => t.id === templateId)
  if (!template) throw new Error(`Template not found: ${templateId}`)

  const baseContentSet = template.dedicated_sets[contentSetIndex]
  if (!baseContentSet) throw new Error(`ContentSet index out of range: ${contentSetIndex}`)

  // Merge override on top of base so unedited slots keep their original values
  const contentSet: ContentSet = overrideContentSet
    ? { ...baseContentSet, ...overrideContentSet }
    : baseContentSet

  return renderToBlob(
    template,
    layouts.background_palette,
    images,
    contentSet,
    contentSetIndex,
    resolution
  )
}

export async function getTemplateAndContentSet(
  templateId: string,
  contentSetIndex: number
): Promise<{ template: MagazineTemplate; contentSet: ContentSet }> {
  const layouts = (await import("@/data/magazine_layouts_v5.json")) as unknown as MagazineLayouts
  const template = layouts.templates.find((t) => t.id === templateId)
  if (!template) throw new Error(`Template not found: ${templateId}`)
  const contentSet = template.dedicated_sets[contentSetIndex]
  if (!contentSet) throw new Error(`ContentSet index out of range: ${contentSetIndex}`)
  return { template, contentSet }
}

export type { RenderResolution }
