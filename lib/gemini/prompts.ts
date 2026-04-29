/* ══════════════════════════════════════════════════════════════
   STYLE MAPS — 피사체 타입별 × 스타일별 렌더링 지시
   모든 설명은 아트 기법 중심 → 털 유무/피사체 외형에 무관하게 작동
══════════════════════════════════════════════════════════════ */

/* ─── PERSON ──────────────────────────────────────────────── */
export const STYLE_MAP: Record<string, string> = {
  'beauty':        `soft dreamy portrait, soft lighting, glowing skin, pastel tones, beauty filter look, shallow depth of field, cinematic bokeh, smooth skin texture`,
  'ghibli':        `Studio Ghibli hand-drawn animation style, ink outlines, watercolor wash texture, tiny simplified nose, large round expressive eyes, soft warm earthy color palette, gentle cel shading, nostalgic storybook mood — fully commit to the Ghibli illustration look`,
  'pixar-3d':      `Pixar CGI animation style, smooth subsurface scattering skin, very large round expressive eyes, rounded soft facial features, slightly enlarged head, bright saturated colors, studio 3-point lighting, polished 3D render — fully commit to the Pixar character design look`,
  'anime':         `anime style portrait, clean line art, cel shading, simplified shapes, expressive features, stylized but maintaining likeness`,
  'disney-3d':     `stylized cinematic 3D character, slightly larger eyes, rounded facial features, smooth skin, warm lighting, appealing character look`,
  'oil-painting':  `oil painting portrait, thick brush strokes, rich texture, classical painting style, dramatic lighting, detailed facial structure`,
  'pencil-sketch': `pencil sketch portrait, graphite drawing, cross hatching, monochrome, detailed shading, realistic proportions, hand-drawn texture`,
};

/* ─── CAT (털 유무 무관 — 아트 기법 중심) ─────────────────── */
export const CAT_STYLE_MAP: Record<string, string> = {
  'beauty':        `soft dreamy style, glowing coat, pastel tones, light bloom, soft focus, cinematic bokeh, warm mood, ethereal glow`,
  'ghibli':        `hand-drawn animation style, watercolor shading, soft natural lighting, warm nostalgic mood, slightly stylized but recognizable, expressive Ghibli creature eyes`,
  'pixar-3d':      `stylized 3D animal render, ultra detailed surface texture, big expressive eyes with wet sheen, global illumination, soft shadows, subsurface scattering, high detail, masterpiece`,
  'anime':         `anime style cat, clean line art, cel shading, stylized proportions, large expressive eyes, simplified but recognizable features`,
  'disney-3d':     `stylized cute 3D cat, rounded shapes, big sparkling eyes, soft warm lighting, smooth texture, appealing storybook character look`,
  'oil-painting':  `oil painting style, thick impasto brush strokes, rich texture, classical art composition, dramatic chiaroscuro lighting, canvas grain`,
  'pencil-sketch': `pencil sketch, graphite drawing, cross hatching for surface depth, monochrome, detailed shading on face and body, expressive linework, visible paper grain`,
};

/* ─── DOG (털 유무 무관 — 아트 기법 중심) ─────────────────── */
export const DOG_STYLE_MAP: Record<string, string> = {
  'beauty':        `soft dreamy style, glowing coat, pastel tones, fluffy or smooth texture, soft focus, cinematic bokeh, warm mood`,
  'ghibli':        `hand-drawn animation style, watercolor shading, soft natural lighting, warm nostalgic feeling, slightly stylized but recognizable`,
  'pixar-3d':      `stylized 3D dog render, realistic surface texture, big expressive eyes, global illumination, soft shadows, high detail, masterpiece`,
  'anime':         `anime style dog, clean line art, cel shading, stylized but recognizable features, expressive large eyes`,
  'disney-3d':     `stylized cute 3D dog, rounded shapes, big expressive eyes, smooth texture, warm lighting, friendly character look`,
  'oil-painting':  `oil painting style, thick brush strokes, rich texture, classical painting composition, dramatic lighting`,
  'pencil-sketch': `pencil sketch dog, graphite drawing, cross hatching, monochrome, detailed surface strokes, hand-drawn texture`,
};

/* ─── OTHER ANIMAL (범용 폴백) ────────────────────────────── */
export const ANIMAL_STYLE_MAP: Record<string, string> = {
  'beauty':        `soft dreamy style, ethereal glow, pastel tones, light bloom, soft focus, cinematic bokeh`,
  'ghibli':        `Studio Ghibli style, hand-drawn animation, watercolor shading, warm natural lighting, nostalgic mood, expressive creature eyes`,
  'pixar-3d':      `Pixar-style 3D render, big expressive eyes, ultra detailed surface, global illumination, soft shadows, vibrant colors, masterpiece`,
  'anime':         `anime style, clean line art, cel shading, stylized proportions, expressive animal face`,
  'disney-3d':     `Disney-style 3D CGI, cute and magical, rounded shapes, sparkling big eyes, soft warm lighting`,
  'oil-painting':  `classical oil painting, thick brush strokes, rich texture, dramatic lighting, canvas grain`,
  'pencil-sketch': `graphite pencil sketch, cross-hatching, monochrome, detailed shading, expressive linework, paper grain`,
};

/* ══════════════════════════════════════════════════════════════
   PERSON IDENTITY — 변환 강도별 (사람 전용)
══════════════════════════════════════════════════════════════ */
const PERSON_IDENTITY: Record<number, string> = {
  30:  `PERSON IDENTITY (STRICT): preserve at ~90% — only faintest style hint on skin/hair. Viewer must immediately recognize the same person.`,
  50:  `PERSON IDENTITY (BALANCED): preserve at ~60% — clearly recognizable, allow mild cel shading or style-appropriate skin rendering.`,
  70:  `PERSON IDENTITY (LOOSE): preserve at ~30% — style dominates, still the same person but heavily stylized.`,
  100: `PERSON IDENTITY (NONE): ignore identity entirely. Full artistic transformation — face, skin, hair, clothing all 100% in target style.`,
};

/* ══════════════════════════════════════════════════════════════
   FINAL_PROMPT — 4-way 분기 (PERSON / CAT / DOG / OTHER_ANIMAL)
══════════════════════════════════════════════════════════════ */
export const FINAL_PROMPT = (
  personStyle:      string,
  catStyle:         string,
  dogStyle:         string,
  otherAnimalStyle: string,
  intensity:        number = 70,
) => `
You are an expert image-to-image style transfer system.

══ STEP 1: CLASSIFY THE PRIMARY SUBJECT ══
Examine the image carefully. Identify the primary subject:
- PERSON       → one or more humans are visible anywhere in the frame (solo portrait, group photo, full-body shot, distant figures — any case)
- CAT          → a domestic cat or wild feline (any breed, including hairless)
- DOG          → a domestic dog (any breed, including hairless)
- OTHER_ANIMAL → any other animal, creature, or pet
- OTHER        → object, scene, or environment with no humans

══ STEP 2: APPLY THE MATCHING STYLE BRANCH ══

▶ If PERSON:
Target style: "${personStyle}"
${PERSON_IDENTITY[intensity] ?? PERSON_IDENTITY[70]}
- Keep original hair color, clothing color and type for each person
- Body pose and composition must stay the same
- No grotesque or extreme face distortion
- GLOBAL STYLE APPLICATION: Re-render the ENTIRE image in the target art style — background, environment, sky, floor, walls, lighting, and every element must all be stylized consistently. Do not leave any area as a plain photograph.
- Group photos: apply style equally to ALL people and the whole background scene
- Wide shots with small figures: the large background is the primary canvas — apply style strongly and consistently across the entire frame

▶ If CAT:
Target style: "${catStyle}"
- Preserve: exact breed/type, body markings, coat pattern, eye color, pose, expression
- Apply the art style to surface texture, eyes, body, and background
- Style technique overrides surface material — works on both furry and hairless cats
- Intensity: ${intensity === 100 ? 'full artistic transformation' : intensity >= 70 ? 'style strongly dominates, cat still recognizable' : intensity === 50 ? 'balance photo realism and target style' : 'subtle style hint, nearly photorealistic'}

▶ If DOG:
Target style: "${dogStyle}"
- Preserve: exact breed/type, body markings, coat pattern, eye color, pose, expression
- Apply the art style to surface texture, eyes, body, and background
- Style technique overrides surface material — works on both furry and hairless dogs
- Intensity: ${intensity === 100 ? 'full artistic transformation' : intensity >= 70 ? 'style strongly dominates, dog still recognizable' : intensity === 50 ? 'balance photo realism and target style' : 'subtle style hint, nearly photorealistic'}

▶ If OTHER_ANIMAL:
Target style: "${otherAnimalStyle}"
- Preserve species, body markings, pose, and expression
- Apply the art style consistently across the entire subject and background
- Intensity: ${intensity === 100 ? 'full artistic transformation' : intensity >= 70 ? 'strong stylization' : intensity === 50 ? 'balanced' : 'subtle'}

▶ If OTHER:
Target style: "${personStyle}"
- Apply the style uniformly across all surfaces and materials
- Preserve original composition and structure

══ UNIVERSAL RULES ══
- Same pose, same composition, same camera angle as the input
- Style must be applied to the ENTIRE image — subject(s) AND background equally. Never leave part of the image as an unstyled photograph while the rest is transformed.
- No added elements or accessories not in the original
- No text, watermark, or frame
- High quality, sharp, clean rendering — no artifacts, no blur
`.trim();
