import type { MagazineTemplate, ContentSet, BackgroundPaletteEntry, RenderResolution, RenderVariant } from "./types"
import { RESOLUTION_CONFIG } from "./types"
import {
  PAGE_WIDTH,
  pctToPx,
  getPageHeight,
  getFontSize,
  getFontFamily,
  getFontStyle,
  getLetterSpacing,
  getLineHeight,
  resolveTextColor,
  applyCase,
  formatInfobox,
  resolveContentKey,
  angleToGradientPoints,
} from "./slot-utils"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 60)}`))
    img.src = src
  })
}

function coverCrop(imgW: number, imgH: number, slotW: number, slotH: number) {
  const slotRatio = slotW / slotH
  const imgRatio = imgW / imgH
  let cropX = 0, cropY = 0, cropW = imgW, cropH = imgH
  if (imgRatio > slotRatio) {
    cropW = imgH * slotRatio
    cropX = (imgW - cropW) / 2
  } else {
    cropH = imgW / slotRatio
    cropY = (imgH - cropH) / 2
  }
  return { cropX, cropY, cropWidth: cropW, cropHeight: cropH }
}

export async function renderToBlob(
  template: MagazineTemplate,
  palette: Record<string, BackgroundPaletteEntry>,
  userImages: string[],
  contentSet: ContentSet,
  contentSetIndex: number,
  resolution: RenderResolution
): Promise<RenderVariant> {
  const KonvaModule = await import("konva")
  // konva exports default differently between CJS/ESM
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Konva = (KonvaModule as any).default ?? KonvaModule

  const { pixelRatio } = RESOLUTION_CONFIG[resolution]
  const W = PAGE_WIDTH
  const H = getPageHeight(template.aspectRatio)
  const fallbackBg: BackgroundPaletteEntry = {
    type: "solid", value: "#FAFAFA", textColor: "#0A0A0A",
    accentColor: "#666666", tone: "neutral",
  }
  const bg = palette[template.background] ?? fallbackBg

  const container = document.createElement("div")
  container.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;"
  document.body.appendChild(container)

  try {
    const stage = new Konva.Stage({ container, width: W, height: H })
    const layer = new Konva.Layer()
    stage.add(layer)

    // ── Background ─────────────────────────────────────────────────
    if (bg.type === "gradient" && bg.from && bg.to) {
      const { start, end } = angleToGradientPoints(bg.angle ?? 180, W, H)
      layer.add(new Konva.Rect({
        x: 0, y: 0, width: W, height: H,
        fillLinearGradientStartPoint: start,
        fillLinearGradientEndPoint: end,
        fillLinearGradientColorStops: [0, bg.from, 1, bg.to],
      }))
    } else {
      const fill = bg.type === "bokeh" ? (bg.baseColor ?? "#1A1A1A") : (bg.value ?? "#FAFAFA")
      layer.add(new Konva.Rect({ x: 0, y: 0, width: W, height: H, fill }))
    }

    // ── Decorations ────────────────────────────────────────────────
    for (const dec of template.decorations) {
      if (dec.type === "line") {
        const stroke = dec.color === "accent"
          ? bg.accentColor
          : (dec.color ?? bg.textColor)
        layer.add(new Konva.Line({
          points: [
            pctToPx(dec.x1 ?? 0, W), pctToPx(dec.y1 ?? 0, H),
            pctToPx(dec.x2 ?? 0, W), pctToPx(dec.y2 ?? 0, H),
          ],
          stroke,
          strokeWidth: dec.thickness ?? 1,
        }))
      }
    }

    // ── Images ─────────────────────────────────────────────────────
    const loadedImages = await Promise.all(
      template.images.map((_, i) =>
        userImages[i] ? loadImage(userImages[i]).catch(() => null) : Promise.resolve(null)
      )
    )

    for (let i = 0; i < template.images.length; i++) {
      const slot = template.images[i]
      const x = pctToPx(slot.x, W)
      const y = pctToPx(slot.y, H)
      const w = pctToPx(slot.w, W)
      const h = pctToPx(slot.h, H)
      const htmlImg = loadedImages[i]

      if (htmlImg) {
        const crop = coverCrop(htmlImg.naturalWidth, htmlImg.naturalHeight, w, h)
        layer.add(new Konva.Image({ x, y, width: w, height: h, image: htmlImg, ...crop }))
      } else {
        layer.add(new Konva.Rect({ x, y, width: w, height: h, fill: "#2A2A2A" }))
      }
    }

    // ── Texts ──────────────────────────────────────────────────────
    for (let i = 0; i < template.texts.length; i++) {
      const slot = template.texts[i]
      const key = resolveContentKey(template.texts, i, slot)

      let displayText: string | undefined
      const raw = contentSet[key]
      if (raw === undefined) {
        displayText = slot.value_default
      } else if (typeof raw === "string") {
        displayText = raw
      } else if (raw && typeof raw === "object") {
        displayText = formatInfobox(raw as Record<string, string>)
      }
      if (!displayText) continue

      const charLimit = template.char_limits[slot.type]
      const text = charLimit ? applyCase(displayText, charLimit.case) : displayText

      const fontSize = getFontSize(slot.size, W)
      const x = pctToPx(slot.x, W)
      const y = pctToPx(slot.y, H)
      const w = pctToPx(slot.w, W)
      const h = pctToPx(slot.h, H)

      const baseProps = {
        text,
        fontSize,
        fontFamily: getFontFamily(slot),
        fontStyle: getFontStyle(slot),
        fill: resolveTextColor(slot, bg),
        align: slot.align ?? "left",
        lineHeight: getLineHeight(slot),
        letterSpacing: getLetterSpacing(slot, fontSize),
        wrap: "word",
        ellipsis: true,
      }

      if (slot.rotation === -90) {
        layer.add(new Konva.Text({ ...baseProps, x, y: y + h, width: h, height: w, rotation: -90 }))
      } else if (slot.rotation === 90) {
        layer.add(new Konva.Text({ ...baseProps, x: x + w, y, width: h, height: w, rotation: 90 }))
      } else {
        layer.add(new Konva.Text({ ...baseProps, x, y, width: w, height: h }))
      }
    }

    layer.draw()

    // ── Export ─────────────────────────────────────────────────────
    const blob = await new Promise<Blob>((resolve, reject) => {
      stage.toBlob({
        mimeType: "image/png",
        quality: 1,
        pixelRatio,
        callback: (b: Blob | null) =>
          b ? resolve(b) : reject(new Error("stage.toBlob returned null")),
      })
    })

    stage.destroy()

    return {
      templateId: template.id,
      contentSetIndex,
      resolution,
      blob,
      width: Math.round(W * pixelRatio),
      height: Math.round(H * pixelRatio),
    }
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}
