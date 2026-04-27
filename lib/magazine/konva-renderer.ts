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

// Parse "rgba(0,0,0,0.4)" → Konva-compatible color + opacity
function parseRgba(rgba: string): { color: string; opacity: number } {
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (!m) return { color: "#000000", opacity: 0.5 }
  const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3])
  const a = m[4] !== undefined ? parseFloat(m[4]) : 1
  const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  return { color: hex, opacity: a }
}

// Resolve card_box fill keyword to hex
function resolveCardFill(fill: string | undefined, bg: BackgroundPaletteEntry): string {
  if (!fill || fill === "white") return "#FFFFFF"
  if (fill === "obsidian" || fill === "black") return "#0A0A0A"
  if (fill === "accent") return bg.accentColor
  return fill // hex literal
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

    // ── 1. Background ──────────────────────────────────────────────────
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

    // ── 2. Under-decorations (lines only) ──────────────────────────────
    for (const dec of template.decorations) {
      if (dec.type === "line") {
        const stroke = dec.color === "accent"
          ? bg.accentColor
          : (dec.color === "muted" ? "rgba(0,0,0,0.25)" : (dec.color ?? bg.textColor))
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

    // ── 3. Images ──────────────────────────────────────────────────────
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
      const rotDeg = slot.rotation ?? 0

      if (htmlImg) {
        const crop = coverCrop(htmlImg.naturalWidth, htmlImg.naturalHeight, w, h)
        if (rotDeg !== 0) {
          // Rotate around image center
          layer.add(new Konva.Image({
            x: x + w / 2, y: y + h / 2,
            width: w, height: h,
            offsetX: w / 2, offsetY: h / 2,
            image: htmlImg, ...crop,
            rotation: rotDeg,
          }))
        } else {
          layer.add(new Konva.Image({ x, y, width: w, height: h, image: htmlImg, ...crop }))
        }
      } else {
        if (rotDeg !== 0) {
          layer.add(new Konva.Rect({
            x: x + w / 2, y: y + h / 2,
            width: w, height: h,
            offsetX: w / 2, offsetY: h / 2,
            fill: "#2A2A2A", rotation: rotDeg,
          }))
        } else {
          layer.add(new Konva.Rect({ x, y, width: w, height: h, fill: "#2A2A2A" }))
        }
      }
    }

    // ── 4. Over-decorations (card_box, overlay_gradient, quad_color_overlay) ──
    for (const dec of template.decorations) {
      if (dec.type === "card_box") {
        const x = pctToPx(dec.x ?? 0, W)
        const y = pctToPx(dec.y ?? 0, H)
        const w = pctToPx(dec.w ?? 10, W)
        const h = pctToPx(dec.h ?? 10, H)
        layer.add(new Konva.Rect({
          x, y, width: w, height: h,
          fill: resolveCardFill(dec.fill, bg),
          opacity: dec.opacity ?? 1,
        }))
      }

      if (dec.type === "overlay_gradient") {
        const yRange = dec.y_range ?? [0, 100]
        const yTop = pctToPx(yRange[0], H)
        const yBot = pctToPx(yRange[1], H)
        const height = yBot - yTop
        const { color: fromColor, opacity: fromOpacity } = parseRgba(dec.from ?? "rgba(0,0,0,0)")
        const { color: toColor, opacity: toOpacity } = parseRgba(dec.to ?? "rgba(0,0,0,0)")

        layer.add(new Konva.Rect({
          x: 0, y: yTop, width: W, height,
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: height },
          fillLinearGradientColorStops: [
            0, `rgba(${hexToRgbParts(fromColor)},${fromOpacity})`,
            1, `rgba(${hexToRgbParts(toColor)},${toOpacity})`,
          ],
        }))
      }

      if (dec.type === "quad_color_overlay") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const colors: string[] = (dec as any).colors ?? []
        const opacity: number = (dec as any).opacity ?? 0.7
        const quadW = W / 2
        const quadH = H / 2
        const positions = [
          { x: 0, y: 0 }, { x: quadW, y: 0 },
          { x: 0, y: quadH }, { x: quadW, y: quadH },
        ]
        positions.forEach(({ x, y }, i) => {
          if (colors[i]) {
            layer.add(new Konva.Rect({ x, y, width: quadW, height: quadH, fill: colors[i], opacity }))
          }
        })
      }
    }

    // ── 5. Texts ───────────────────────────────────────────────────────
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

    // ── 6. Export ──────────────────────────────────────────────────────
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

function hexToRgbParts(hex: string): string {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.slice(0, 2), 16) || 0
  const g = parseInt(clean.slice(2, 4), 16) || 0
  const b = parseInt(clean.slice(4, 6), 16) || 0
  return `${r},${g},${b}`
}
