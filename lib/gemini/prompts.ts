/* ══════════════════════════════════════════════════════════════
   STYLE MAPS — 피사체 타입별 × 스타일별 렌더링 지시
   모든 설명은 아트 기법 중심 → 털 유무/피사체 외형에 무관하게 작동
══════════════════════════════════════════════════════════════ */

/* ─── PERSON ──────────────────────────────────────────────── */
export const STYLE_MAP: Record<string, string> = {
  'beauty': `High-end cinematic photo retouching. Enhance the ENTIRE image: flawless glowing skin with soft luminous highlight, silky smooth textures, large dewy eyes, pastel-washed color grade across the whole frame, dreamy soft-focus bokeh in background, gentle light bloom. Every element — sky, ground, walls, objects — takes on a soft cinematic quality. Output is a polished photograph, not a painting.`,

  'ghibli': `Studio Ghibli 2D hand-drawn animation. MANDATORY TECHNICAL REQUIREMENTS:
(1) FLAT CEL SHADING — no photographic gradients. Every surface uses 2–3 flat tones with crisp anime shading boundaries, exactly like hand-painted animation cels.
(2) INK OUTLINES — visible black/dark ink contour lines on ALL elements: people, horse, fence posts, wind turbine, bridge pillars, clouds, ground, everything.
(3) WATERCOLOR BACKGROUND — sky, sea, ground, and all backgrounds are rendered as soft hand-painted watercolor washes with visible brushwork and irregular edges. NOT photographic — looks painted.
(4) STYLIZED TEXTURES — no photorealistic surface detail. Stone, wood, fabric, fur are all simplified into painted textures with visible brushstroke marks.
(5) COLOR PALETTE — warm earthy tones, rich teal/blue skies, soft cream highlights, Ghibli-signature glowing atmospheric haze.
OUTPUT STANDARD: Every pixel must look like a frame extracted from a Ghibli animated film (Spirited Away, Princess Mononoke, Howl's Moving Castle). If any part of the output looks photographic, the task has failed.`,

  'pixar-3d': `Pixar CGI 3D animation. MANDATORY TECHNICAL REQUIREMENTS:
(1) FULL 3D RENDER — every element is re-rendered as a smooth, polished 3D CGI object. No photographic textures remain anywhere.
(2) SUBSURFACE SCATTERING — skin, fur, cloth all have the characteristic Pixar soft translucent quality.
(3) STUDIO LIGHTING — three-point cinematic lighting, global illumination, soft ambient occlusion shadows. No harsh real-world shadows.
(4) STYLIZED PROPORTIONS — slightly rounded, appealing forms. Wind turbine, fence, bridge all become clean stylized 3D props.
(5) VIBRANT COLORS — saturated, clean CGI color palette. Sky is vivid azure, ground has smooth stylized texture.
OUTPUT STANDARD: Must look identical to a rendered frame from Toy Story, Coco, or Up. Zero photographic qualities anywhere.`,

  'anime': `Modern Japanese anime illustration. MANDATORY TECHNICAL REQUIREMENTS:
(1) CLEAN LINE ART — precise sharp ink lines with controlled line weight variation on ALL elements. Everything has a drawn outline.
(2) CEL SHADING — flat color fills with crisp shadow/highlight boundaries. No photographic gradients or depth-of-field blur.
(3) ANIME COLOR PALETTE — clear saturated sky blue, soft skin tones with 2-tone shading, clean white for fabric and horse with anime-style shadow color.
(4) ANIME BACKGROUNDS — sky with stylized cloud shapes, simplified architectural and natural elements with clean painted flat colors, exactly like high-quality anime production backgrounds.
(5) NO PHOTOGRAPHY — no camera lens effects, no film grain, no photographic texture anywhere.
OUTPUT STANDARD: Must look like a high-quality scene from a premium anime series. Every element fully illustrated, zero photographic residue.`,

  'disney-3d': `Disney CGI animation style. MANDATORY TECHNICAL REQUIREMENTS:
(1) FULL DISNEY 3D RENDER — all elements rebuilt as smooth polished CGI. No photographic surfaces.
(2) MAGICAL WARM LIGHTING — volumetric light rays, warm golden-hour glow, soft magical ambient fill.
(3) APPEALING STYLIZED FORMS — rounded, charming proportions. Fence posts, turbine, bridge all become stylized Disney props.
(4) RICH DETAIL — Disney-level texture work on clothing (fabric weave, lace), horse fur (flowing silky strands), environment (cobblestone pattern).
(5) CINEMATIC COLOR — vibrant yet harmonious palette, rich shadows, luminous highlights.
OUTPUT STANDARD: Must look like a rendered frame from Moana, Encanto, or Tangled. Completely computer-generated appearance.`,

  'oil-painting': `Classical oil painting on canvas. MANDATORY TECHNICAL REQUIREMENTS:
(1) VISIBLE BRUSHWORK — every surface shows thick, directional paint strokes. Sky has broad gestural sweeps, ground has textured impasto, clothing has fabric-following brushwork.
(2) CANVAS TEXTURE — underlying canvas grain visible throughout the entire image, especially in lighter areas.
(3) PAINTERLY COLOR — colors are mixed/blended with visible transitions, rich deep shadows, luminous highlights built up in layers.
(4) OLD MASTERS TECHNIQUE — chiaroscuro lighting, atmospheric perspective, painterly soft edges in distance.
(5) NO PHOTOGRAPHY — no sharp photographic edges, no digital smoothness, no camera artifacts. Pure painted quality.
OUTPUT STANDARD: Must look like it was physically painted with oil on canvas by a skilled painter. Indistinguishable from a real oil painting.`,

  'pencil-sketch': `Graphite pencil sketch on white paper. MANDATORY TECHNICAL REQUIREMENTS:
(1) MONOCHROME ONLY — entire image in shades of graphite grey, NO color whatsoever.
(2) VISIBLE PENCIL STROKES — cross-hatching for shadow areas, fine parallel lines for mid-tones, clean white paper showing through for highlights.
(3) PAPER TEXTURE — white paper grain visible throughout, especially in light areas.
(4) LINE-BASED RENDERING — all forms defined by drawn lines and hatching, not photographic tones.
(5) HAND-DRAWN QUALITY — slight irregularity in lines, natural pencil pressure variation.
OUTPUT STANDARD: Must look like a skilled artist drew this by hand on paper with graphite pencils. No color, no digital smoothness, pure pencil drawing.`,
};

/* ─── CAT (털 유무 무관 — 아트 기법 중심) ─────────────────── */
export const CAT_STYLE_MAP: Record<string, string> = {
  'beauty':        `cinematic beauty retouch — glowing coat with soft luminous highlight, ethereal soft light, pastel bokeh background, warm cinematic color grade across entire scene`,
  'ghibli':        `Studio Ghibli 2D hand-drawn animation — cat AND entire background as a Ghibli film frame: flat cel-shaded fur with ink outlines, expressive large Ghibli eyes, hand-painted watercolor environment, warm earthy palette. No photographic texture anywhere.`,
  'pixar-3d':      `Pixar CGI 3D — cat AND full environment as Pixar film frame: detailed SSS fur rendering, big wet expressive eyes, global illumination, fully 3D-rendered props and background. No photography.`,
  'anime':         `anime illustration — cat AND background fully drawn in anime style: clean ink line art on body, cel-shaded coat with flat colors, large stylized eyes, detailed anime-painted background. No photographic elements.`,
  'disney-3d':     `Disney CGI — cat AND full scene as Disney film frame: rounded appealing form, big sparkling eyes, fully rendered Disney-quality 3D environment and magical lighting. No photography.`,
  'oil-painting':  `oil painting — cat AND entire scene as canvas painting: impasto brushwork on fur, rich deep colors, visible canvas texture throughout, dramatic chiaroscuro. No photography.`,
  'pencil-sketch': `graphite sketch — cat AND full scene as pencil drawing: detailed cross-hatch shading on fur, monochrome graphite only, entire scene rendered with pencil strokes on white paper. No color, no photography.`,
};

/* ─── DOG (털 유무 무관 — 아트 기법 중심) ─────────────────── */
export const DOG_STYLE_MAP: Record<string, string> = {
  'beauty':        `cinematic beauty retouch — glowing coat, soft pastel light bloom, dreamy bokeh, warm cinematic color grade across entire scene`,
  'ghibli':        `Studio Ghibli 2D hand-drawn animation — dog AND entire background as a Ghibli film frame: flat cel-shaded coat with ink outlines, expressive creature eyes, hand-painted watercolor environment, warm earthy palette. No photographic texture anywhere.`,
  'pixar-3d':      `Pixar CGI 3D — dog AND full environment as Pixar film frame: detailed fur SSS, big expressive eyes, global illumination, fully 3D-rendered background and props. No photography.`,
  'anime':         `anime illustration — dog AND background fully drawn in anime style: clean ink line art, cel-shaded coat, large stylized eyes, detailed anime-painted background. No photographic elements.`,
  'disney-3d':     `Disney CGI — dog AND full scene as Disney film frame: rounded friendly form, big sparkling eyes, fully rendered Disney-quality 3D environment. No photography.`,
  'oil-painting':  `oil painting — dog AND entire scene as canvas painting: impasto brushwork on coat, rich deep colors, canvas grain throughout. No photography.`,
  'pencil-sketch': `graphite sketch — dog AND full scene as pencil drawing: cross-hatch shading on fur, monochrome graphite, entire scene on white paper with pencil strokes. No color, no photography.`,
};

/* ─── OTHER ANIMAL (범용 폴백) ────────────────────────────── */
export const ANIMAL_STYLE_MAP: Record<string, string> = {
  'beauty':        `cinematic beauty retouch — ethereal soft glow, pastel light bloom, dreamy bokeh background, warm cinematic color grade across entire scene`,
  'ghibli':        `Studio Ghibli 2D hand-drawn animation — animal AND entire scene as Ghibli film frame: flat cel shading with ink outlines, expressive eyes, hand-painted watercolor background. No photography.`,
  'pixar-3d':      `Pixar CGI 3D — animal AND full environment as Pixar film frame: detailed SSS surface, big expressive eyes, global illumination, fully 3D-rendered background. No photography.`,
  'anime':         `anime illustration — animal AND full scene in anime style: clean ink line art, cel shading, large stylized eyes, anime-painted background. No photography.`,
  'disney-3d':     `Disney CGI — animal AND full scene as Disney film frame: rounded appealing form, sparkling eyes, fully rendered Disney-quality 3D environment. No photography.`,
  'oil-painting':  `oil painting — animal AND entire scene as canvas painting: impasto brushwork, rich colors, canvas texture throughout. No photography.`,
  'pencil-sketch': `graphite sketch — animal AND full scene as pencil drawing: cross-hatch shading, monochrome graphite on white paper. No color, no photography.`,
};

/* ══════════════════════════════════════════════════════════════
   PERSON IDENTITY — 변환 강도별 (사람 전용)
══════════════════════════════════════════════════════════════ */
const PERSON_IDENTITY: Record<number, string> = {
  30:  `PERSON IDENTITY (STRICT): preserve at ~90% — faintest style hint only. Viewer immediately recognizes the same person.`,
  50:  `PERSON IDENTITY (BALANCED): preserve at ~60% — clearly recognizable, allow style-appropriate rendering.`,
  70:  `PERSON IDENTITY (LOOSE): preserve at ~30% — style strongly dominates, person still identifiable but heavily stylized.`,
  100: `PERSON IDENTITY (NONE): ignore photographic identity entirely. Fully re-draw face, skin, hair, clothing 100% in target art style.`,
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
You are an expert artistic style transfer system. Your task is to re-render the provided image in a completely different art style.

⚠ CRITICAL RULE: The input image provides COMPOSITION and SUBJECT REFERENCE ONLY. It does NOT define the output rendering style. You must break free from the photographic appearance of the input and fully commit to the target art style. If the output looks like a photograph, you have failed.

══ STEP 1: CLASSIFY THE PRIMARY SUBJECT ══
Identify the primary subject:
- PERSON       → one or more humans visible anywhere (portrait, group, full-body, distant figures)
- CAT          → domestic cat or wild feline (any breed, including hairless)
- DOG          → domestic dog (any breed, including hairless)
- OTHER_ANIMAL → any other animal or creature
- OTHER        → object, scene, or environment with no humans or animals

══ STEP 2: APPLY THE MATCHING STYLE BRANCH ══

▶ If PERSON:
Target art style: "${personStyle}"
${PERSON_IDENTITY[intensity] ?? PERSON_IDENTITY[70]}
- Keep original hair color, clothing color and type for each person
- Keep body pose and composition
- No grotesque or extreme face distortion
- Re-render the ENTIRE image in the target art style: background, sky, environment, floor, walls, lighting — everything. No area left as a plain photograph.
- Group photos: apply style equally to ALL people and the whole background
- Wide shots: the large background is the primary canvas — stylize it strongly

▶ If CAT:
Target art style: "${catStyle}"
- Preserve: breed/type, body markings, coat pattern, eye color, pose, expression
- Re-render subject AND entire background in the target art style

▶ If DOG:
Target art style: "${dogStyle}"
- Preserve: breed/type, body markings, coat pattern, eye color, pose, expression
- Re-render subject AND entire background in the target art style

▶ If OTHER_ANIMAL:
Target art style: "${otherAnimalStyle}"
- Preserve species, body markings, pose, and expression
- Re-render subject AND entire background in the target art style

▶ If OTHER:
Target art style: "${personStyle}"
- Apply the style uniformly across all surfaces and materials

══ UNIVERSAL RULES ══
- Same pose, same composition, same camera angle as the input
- Style applied to the ENTIRE image — subject(s) AND background equally
- No added elements or accessories not in the original
- No text, watermark, or frame
- High quality, sharp, clean rendering in the target art style
- The output must be CLEARLY AND UNMISTAKABLY rendered in the target art style — not a photograph with a filter applied
`.trim();
