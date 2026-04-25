export const FINAL_PROMPT = (style: string) => `
You are an expert image-to-image style transfer system.

Your task is to re-render the provided image into the following visual style:
"${style}"

IDENTITY LOCK (HIGHEST PRIORITY):
- The person must remain the exact same individual
- Strictly preserve facial structure, proportions, bone structure, and facial geometry
- Preserve identity-defining features (eyes, nose, mouth, face shape)
- Keep original pose, expression, camera angle, and composition

STYLE TRANSFORMATION:
- Apply the requested style strongly and clearly
- ONLY change rendering (texture, materials, shading, lighting, linework)
- Do NOT alter facial geometry or proportions
- Do NOT reinterpret the subject as a different character

STYLE EXECUTION DETAILS:
- Use style-appropriate lighting, materials, textures, and rendering techniques
- Ensure the entire image is consistently transformed into the style
- Avoid partial or weak style application

CONSISTENCY:
- Keep original hair, clothing, and colors consistent
- Maintain realistic anatomy

NEGATIVE CONSTRAINTS:
- No face distortion
- No exaggerated eyes or features
- No added elements, props, or accessories
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
