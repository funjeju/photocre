const IDENTITY_BY_INTENSITY: Record<number, string> = {
  30: `IDENTITY (STRICT — barely stylized):
- The subject (person, animal, or object) must look almost identical to the original photo
- Apply only the faintest hint of the style — surface texture, very subtle color shift at most
- Face/features shape and expression: preserve at ~90%, virtually unchanged
- A viewer should immediately recognize this as the same photo with a slight filter`,

  50: `IDENTITY (BALANCED):
- The subject must remain clearly recognizable as the same individual
- Allow natural style-appropriate rendering (e.g. slightly stylized fur/skin, mild cel shading)
- Preserve overall appearance and identity at ~60% — stylize within that constraint
- Both the original subject AND the target style should be clearly visible`,

  70: `IDENTITY (LOOSE — style takes priority):
- The subject should be recognizable, but style transformation is the priority
- Allow strong stylization of features, surface texture, and colors in the target style
- Preserve identity at ~30% — enough to know it's the same subject, but heavily stylized
- The result should LOOK LIKE the target art style first, original subject second`,

  100: `IDENTITY (NONE — full artistic transformation):
- Ignore identity preservation entirely. Style is everything.
- Transform the subject completely into the target art style with zero compromise
- Render as if this were an original artwork in the target style, not a photo conversion
- All features, textures, colors, and background — ALL must be 100% in the target style
- The result must be indistinguishable from native artwork`,
};

export const FINAL_PROMPT = (style: string, intensity: number = 70) => `
You are an expert image-to-image style transfer system.
The input image may contain a person, an animal, an object, or a scene — handle all equally.

Your task is to re-render the provided image into the following visual style:
"${style}"

${IDENTITY_BY_INTENSITY[intensity] ?? IDENTITY_BY_INTENSITY[70]}

STYLE TRANSFORMATION:
- Apply the requested style ${intensity === 100 ? 'at ABSOLUTE MAXIMUM — no holding back' : intensity >= 70 ? 'strongly and visibly' : intensity === 50 ? 'clearly but balanced with the original' : 'very subtly, barely noticeable'}
- Transform rendering: textures, materials, shading, lighting, linework — all in target style
- Ensure the entire image — subject features, body, and background — is consistently transformed
- The style change must be ${intensity === 100 ? 'total and complete' : intensity >= 70 ? 'obvious and striking' : 'gentle and subtle'}

CONSISTENCY:
- Keep original colors (fur, hair, clothing, skin) consistent with the source
- Body pose, species, and composition must stay the same

NEGATIVE CONSTRAINTS:
- No grotesque or extreme distortion of the subject
- No added elements, props, or accessories not in the original
- No text, watermark, or frame

OUTPUT QUALITY:
- High quality, sharp, clean rendering in the target style
- No artifacts, no blur, no deformation
`.trim();

export const STYLE_MAP: Record<string, string> = {
  'beauty': `
high-end professional beauty retouching,
photorealistic skin enhancement,
soft natural glow,
balanced lighting,
clean color grading
`.trim(),

  'ghibli': `
Studio Ghibli style,
hand-painted watercolor animation,
warm natural tones,
soft gradients,
subtle line variation,
atmospheric lighting
`.trim(),

  'pixar-3d': `
Pixar-style 3D CGI,
soft global illumination,
subsurface scattering skin,
smooth shading,
cinematic lighting,
high-quality rendering
`.trim(),

  'anime': `
modern Japanese anime style,
clean line art,
controlled line weight,
cel shading,
flat colors with soft highlights
`.trim(),

  'disney-3d': `
Disney-style 3D CGI,
warm soft lighting,
smooth shading,
vibrant cinematic colors,
polished materials
`.trim(),

  'oil-painting': `
classical oil painting,
visible brush strokes,
impasto texture,
rich color blending,
canvas grain
`.trim(),

  'pencil-sketch': `
graphite pencil sketch,
monochrome drawing,
cross-hatching,
fine linework,
paper texture
`.trim(),
};
