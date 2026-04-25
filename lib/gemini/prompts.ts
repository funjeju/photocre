export const FINAL_PROMPT = (style: string) => `
You are an expert image-to-image style transfer system.

Your task is to re-render the provided image into the following visual style:
"${style}"

IDENTITY (BALANCED — allow stylization while keeping the person recognizable):
- The person must remain clearly recognizable as the same individual
- Allow natural style-appropriate facial rendering (e.g. smoother skin in CGI, line art in anime)
- Preserve overall face shape and identity at ~50% — stylize freely within that constraint
- Keep original pose, expression, camera angle, and composition

STYLE TRANSFORMATION (PRIORITY):
- Apply the requested style strongly, visibly, and consistently across the entire image
- Transform rendering: textures, materials, shading, lighting, linework — all in target style
- Facial features should be rendered in the target style (not photo-realistic unless the style requires it)
- Do NOT reinterpret the subject as a completely different character

STYLE EXECUTION DETAILS:
- Use style-appropriate lighting, materials, textures, and rendering techniques
- Ensure the entire image — face, hair, clothing, background — is consistently transformed
- The style change must be obvious and striking, not subtle

CONSISTENCY:
- Keep original hair color, clothing color and type consistent
- Body pose and composition must stay the same

NEGATIVE CONSTRAINTS:
- No grotesque or extreme face distortion
- No added elements, props, or accessories not in the original
- No text, watermark, or frame

OUTPUT QUALITY:
- High quality, sharp, clean rendering
- No artifacts, no blur, no deformation
- The result must clearly show the style while preserving identity perfectly
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
