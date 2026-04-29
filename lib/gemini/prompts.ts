/* ══════════════════════════════════════════════════════════════
   STYLE MAPS — 피사체 타입별 × 스타일별 렌더링 지시
   모든 설명은 아트 기법 중심 → 털 유무/피사체 외형에 무관하게 작동
══════════════════════════════════════════════════════════════ */

/* ─── PERSON ──────────────────────────────────────────────── */
export const STYLE_MAP: Record<string, string> = {
  'beauty':        `Cinematic beauty retouch — transform the ENTIRE scene. Person: flawless glowing skin, soft pastel tones, luminous highlight on face and hair, silky smooth texture, large dewy eyes. Background/environment: dreamy soft-focus bokeh, cinematic haze, pastel-washed colors, gentle light bloom across the whole frame. Every surface — sky, ground, walls, objects — must take on a soft dreamy cinematic quality. No harsh photographic colors or textures should remain anywhere.`,
  'ghibli':        `Studio Ghibli hand-drawn animation style — transform the ENTIRE image, person AND background, into a Ghibli film frame. Person: clean ink outlines, simplified nose, large round expressive eyes, soft cel shading, warm skin tones. Background/environment: hand-painted watercolor backgrounds with rich painterly detail, lush stylized landscape, luminous atmospheric depth with visible brushwork, warm earthy and teal/blue color palette, stylized sky with soft puffy clouds, Ghibli-signature glowing natural light. Sky, ground, sea, buildings, vehicles, vegetation — every element must look like a cel-painted Ghibli backdrop, not a photograph. No photographic texture should remain anywhere in the frame.`,
  'pixar-3d':      `Pixar CGI animation style — transform the ENTIRE scene into a Pixar film frame. Person: smooth subsurface scattering skin, very large round expressive eyes, rounded soft facial features, slightly enlarged head, polished 3D character render. Background/environment: full Pixar CGI environment — stylized architecture, vibrant saturated colors, studio-quality 3-point lighting, global illumination, perfectly rendered 3D props and surfaces. Every element — sky, ground, buildings, objects — must look like it was rendered in a Pixar production pipeline. Zero photographic qualities anywhere in the frame.`,
  'anime':         `Anime illustration style — transform the ENTIRE image into a high-quality anime scene. Person: clean precise ink line art, flat cel shading, large expressive eyes with detailed iris, simplified sharp facial features, anime-style hair rendering. Background/environment: detailed anime background art — clean painted sky, stylized architecture and environment with anime color palette, crisp cel-shaded surfaces. Every element — clouds, ground, buildings, objects — must look like it belongs in a high-production anime. No photographic textures anywhere.`,
  'disney-3d':     `Disney CGI animation style — transform the ENTIRE scene into a Disney film frame. Person: large sparkling eyes with translucent iris detail, rounded appealing facial features, smooth polished skin, warm cinematic lighting. Background/environment: Disney-quality CGI environment — lush detailed 3D world, magical warm lighting with volumetric rays, vibrant color grading, richly rendered surfaces and props. Every element of the background must look like it was rendered for a Disney feature film. No photographic qualities anywhere.`,
  'oil-painting':  `Classical oil painting — transform the ENTIRE image into a masterwork oil painting on canvas. Person: thick impasto brushwork on face and clothing, rich painterly skin tones, dramatic chiaroscuro lighting, visible bristle texture. Background/environment: fully painted background with bold gestural brushstrokes, rich deep colors, canvas texture visible throughout, painterly atmospheric depth, Old Masters color palette. Every element — sky, ground, walls, objects — must show visible paint texture and brushwork. The entire frame must look like it was painted by hand on canvas.`,
  'pencil-sketch': `Graphite pencil sketch — transform the ENTIRE image into a detailed hand-drawn pencil drawing. Person: precise graphite line art with cross-hatching shading, monochrome tones, visible pencil stroke texture on skin and clothing, detailed hand-drawn features. Background/environment: full pencil-drawn environment — hatched and shaded architecture, sky, ground, and objects all rendered in graphite with visible paper grain. Every element must look like it was drawn by hand on white paper with a graphite pencil. No photographic colors or tones anywhere — pure monochrome graphite drawing.`,
};

/* ─── CAT (털 유무 무관 — 아트 기법 중심) ─────────────────── */
export const CAT_STYLE_MAP: Record<string, string> = {
  'beauty':        `cinematic beauty — glowing coat, ethereal soft light, pastel bloom, dreamy background with soft bokeh, warm cinematic color grade across entire scene`,
  'ghibli':        `Studio Ghibli hand-drawn animation — cat AND entire background fully rendered as Ghibli illustration: watercolor painted environment, warm earthy palette, expressive Ghibli creature eyes, cel-shaded coat, hand-painted sky and ground`,
  'pixar-3d':      `Pixar CGI — cat AND full environment rendered as Pixar film frame: ultra detailed fur/skin SSS, big wet expressive eyes, global illumination, fully 3D-rendered background props and environment`,
  'anime':         `anime illustration — cat AND background fully in anime style: clean ink line art on animal, cel-shaded coat, large stylized eyes, detailed anime-painted background`,
  'disney-3d':     `Disney CGI — cat AND full scene as Disney film frame: rounded appealing form, big sparkling eyes, fully rendered Disney-quality 3D environment and lighting`,
  'oil-painting':  `oil painting — cat AND entire scene as canvas painting: impasto brushwork on fur, rich deep colors, dramatic chiaroscuro, visible canvas texture throughout entire background`,
  'pencil-sketch': `graphite sketch — cat AND full scene as pencil drawing: detailed cross-hatch shading on fur and body, monochrome graphite, entire background rendered in pencil with visible paper grain`,
};

/* ─── DOG (털 유무 무관 — 아트 기법 중심) ─────────────────── */
export const DOG_STYLE_MAP: Record<string, string> = {
  'beauty':        `cinematic beauty — glowing coat, soft pastel light bloom, dreamy bokeh, warm cinematic color grade across entire scene`,
  'ghibli':        `Studio Ghibli hand-drawn animation — dog AND entire background fully rendered as Ghibli illustration: watercolor painted environment, warm earthy palette, expressive creature eyes, cel-shaded coat, hand-painted sky and surroundings`,
  'pixar-3d':      `Pixar CGI — dog AND full environment rendered as Pixar film frame: detailed fur SSS, big expressive eyes, global illumination, fully 3D-rendered background and props`,
  'anime':         `anime illustration — dog AND background fully in anime style: clean ink line art, cel-shaded coat, large stylized eyes, detailed anime-painted background`,
  'disney-3d':     `Disney CGI — dog AND full scene as Disney film frame: rounded friendly form, big sparkling eyes, fully rendered Disney-quality 3D environment and lighting`,
  'oil-painting':  `oil painting — dog AND entire scene as canvas painting: impasto brushwork on coat, rich deep colors, dramatic lighting, visible canvas grain throughout entire image`,
  'pencil-sketch': `graphite sketch — dog AND full scene as pencil drawing: cross-hatch shading on fur, monochrome graphite, entire background rendered in pencil with paper grain`,
};

/* ─── OTHER ANIMAL (범용 폴백) ────────────────────────────── */
export const ANIMAL_STYLE_MAP: Record<string, string> = {
  'beauty':        `cinematic beauty — ethereal soft glow, pastel light bloom, dreamy bokeh background, warm cinematic color grade across entire scene`,
  'ghibli':        `Studio Ghibli hand-drawn animation — animal AND entire scene as Ghibli illustration: watercolor painted environment, warm palette, expressive creature eyes, hand-painted background`,
  'pixar-3d':      `Pixar CGI — animal AND full environment as Pixar film frame: detailed SSS surface, big expressive eyes, global illumination, fully 3D-rendered background`,
  'anime':         `anime illustration — animal AND full scene in anime style: clean ink line art, cel shading, large stylized eyes, anime-painted background`,
  'disney-3d':     `Disney CGI — animal AND full scene as Disney film frame: rounded appealing form, sparkling eyes, fully rendered Disney-quality 3D environment`,
  'oil-painting':  `oil painting — animal AND entire scene as canvas painting: impasto brushwork, rich colors, dramatic lighting, canvas texture throughout`,
  'pencil-sketch': `graphite sketch — animal AND full scene as pencil drawing: cross-hatch shading, monochrome graphite, entire scene rendered in pencil with paper grain`,
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
