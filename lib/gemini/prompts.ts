export const STYLE_MAP: Record<string, string> = {
  'beauty': `Cinematic photo retouching with soft luminous light,
    glowing highlights, pastel color grade, dreamy bokeh. Polished
    photographic quality across the entire frame.`,

  'ghibli': `Studio Ghibli 2D hand-drawn animation. Flat cel shading
    with 2-3 tones, visible ink outlines on every element, hand-painted
    watercolor backgrounds, warm earthy palette with teal skies. Every
    pixel must look like a frame from a Ghibli film — no photographic
    residue anywhere.`,

  'pixar-3d': `Pixar CGI 3D animation. Smooth polished 3D surfaces with
    subsurface scattering, cinematic three-point lighting, global
    illumination, vibrant saturated palette. Every element rebuilt as
    stylized 3D — no photographic textures.`,

  'anime': `Modern Japanese anime illustration. Clean ink line art with
    weight variation, flat cel-shaded color fills, crisp shadow
    boundaries, saturated anime palette, stylized painted backgrounds.
    No camera lens effects or photographic texture.`,

  'disney-3d': `Disney CGI animation. Polished 3D render with magical
    warm lighting, volumetric light rays, appealing rounded forms, rich
    detailed textures, vibrant harmonious palette. Frame from a Disney
    feature film.`,

  'oil-painting': `Classical oil painting on canvas. Visible directional
    brushstrokes on every surface, canvas texture throughout, mixed
    painterly colors, chiaroscuro lighting, atmospheric perspective.
    Indistinguishable from a hand-painted canvas.`,

  'pencil-sketch': `Graphite pencil sketch on white paper. Monochrome
    grey only, visible cross-hatching and parallel pencil strokes,
    paper grain showing through, hand-drawn line variation. Pure pencil
    drawing — no color, no digital smoothness.`,
};

const INTENSITY_PROMPT: Record<number, string> = {
  30:  `INTENSITY 30% — Preserve ~90% of the original. Apply only a
        faint stylistic hint (slight color/texture shift). The image
        still reads as the original photograph.`,
  50:  `INTENSITY 50% — Balance original and target style equally. Both
        the source scene and the art style are clearly visible.`,
  70:  `INTENSITY 70% — Target style dominates. Re-render all elements
        visibly in the target style. Composition preserved, photographic
        quality mostly replaced.`,
  100: `INTENSITY 100% — Complete transformation. Re-render every pixel
        as if the image was natively created in the target style. Zero
        photographic residue. The output must be indistinguishable from
        a native work in this style.`,
};

export const FINAL_PROMPT = (style: string, intensity: number) => `
You are an artistic style transfer system. Re-render the entire input
image in the target art style.

TARGET STYLE: ${style}

${INTENSITY_PROMPT[intensity] ?? INTENSITY_PROMPT[70]}

RULES:
- Preserve composition, layout, camera angle, and subject placement
  exactly as in the input
- Apply the style uniformly to EVERYTHING in the frame — whether the
  image contains people, animals, landscape, objects, or any
  combination, treat it as one scene
- Do not add or remove any elements
- No text, watermark, or border
- The output must clearly look like the target art style at the
  specified intensity
`.trim();
