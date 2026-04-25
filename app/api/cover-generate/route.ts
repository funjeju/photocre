import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';
import { getGenAI, MODEL } from '@/lib/gemini/client';
import { getCoverTemplate } from '@/lib/presets/cover-templates';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 90;

async function verifyToken(req: NextRequest): Promise<{ uid: string; email: string }> {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!auth) throw new Error('UNAUTHORIZED');
  const decoded = await adminAuth().verifyIdToken(auth);
  return { uid: decoded.uid, email: decoded.email ?? '' };
}

const OWNER_EMAILS = (process.env.OWNER_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);

async function checkAndDecrementCredits(uid: string, email: string): Promise<void> {
  if (OWNER_EMAILS.includes(email)) return;
  const userRef = adminDb().collection('users').doc(uid);
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error('USER_NOT_FOUND');
    const data = snap.data()!;
    if (data.isOwner) return;
    if ((data.credits ?? 0) < 1) throw new Error('INSUFFICIENT_CREDITS');
    tx.update(userRef, { credits: data.credits - 1 });
  });
}

async function saveToStorage(base64: string, uid: string, folder: string, ext = 'webp'): Promise<string> {
  const bucket = adminStorage().bucket();
  const ts = Date.now();
  const filePath = `${folder}/${uid}/${ts}.${ext}`;
  const file = bucket.file(filePath);
  const buffer = Buffer.from(base64, 'base64');
  await file.save(buffer, { contentType: `image/${ext}`, metadata: { cacheControl: 'public,max-age=31536000' } });
  await file.makePublic();
  const encodedPath = encodeURIComponent(filePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
}

function readTemplateImageAsBase64(imagePath: string): { base64: string; mimeType: string } {
  const publicDir = path.join(process.cwd(), 'public');
  const fullPath = path.join(publicDir, imagePath);
  const buffer = fs.readFileSync(fullPath);
  const ext = path.extname(imagePath).toLowerCase().replace('.', '');
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return { base64: buffer.toString('base64'), mimeType };
}

function composeCoverPrompt(
  templateStyle: string,
  texts: Record<string, string>,
  templateName: string,
): string {
  const textLines = Object.entries(texts)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `  - ${k}: "${v}"`)
    .join('\n');

  return `You are an expert magazine cover compositor.

TASK: Create a magazine cover image by compositing the provided person photo(s) into the style of the reference magazine cover template.

TEMPLATE STYLE: ${templateStyle}

INSTRUCTIONS:
1. Study the reference magazine cover (first image) carefully — analyze its layout, typography placement, color palette, mood, and visual style.
2. Take the person photo(s) (remaining images) and place the subject(s) naturally into that magazine cover style.
3. Recreate the overall magazine cover composition with the new person as the cover model.
4. Apply the magazine's visual style: color grading, lighting mood, background, and graphic elements.
5. The result must look like a real ${templateName} magazine cover featuring this person.

TEXT TO INCLUDE (place these prominently according to the template layout):
${textLines || '  - Use placeholder text matching the magazine style'}

COMPOSITION RULES:
- Person(s) should be the focal point, positioned as in the original template
- Replicate the magazine logo/title placement and style (use the text provided above for the title)
- Include decorative text elements around the portrait in the magazine's typographic style
- Maintain the original template's aspect ratio and color mood
- Output should look print-ready and professional

OUTPUT: A single magazine cover image in portrait orientation (4:5 or 3:4 ratio).`;
}

function composeFaceSwapPrompt(templateName: string): string {
  return `You are an expert magazine cover art director and photo compositor.

IMAGE 1: The original ${templateName} magazine cover. Use ONLY as a style/layout reference.
IMAGE 2: The person who will be the cover model. This is the ONLY person who should appear in the result.

TASK: Create a new magazine cover where IMAGE 2's person is the sole cover model, styled to match ${templateName}'s visual identity.

CRITICAL — ABOUT THE PEOPLE:
- The person from IMAGE 1 must NOT appear in the result at all. Do not mix, blend, or reference their face, skin, hair, or features.
- IMAGE 2's person is the ONLY subject. Render them as they are — preserve their actual facial features, face shape, skin tone, and hair.
- Do not average or merge the two people's faces together.

WHAT TO TAKE FROM IMAGE 1 (layout & style only):
- Magazine title, logo, and all typographic elements — keep them in exact positions
- Background composition, color palette, and graphic design elements
- Lighting direction, mood, and color grading style
- The overall framing and how much of the frame the model occupies

WHAT TO DO WITH IMAGE 2's PERSON:
- Place them in the same position and framing as the original cover model
- Apply ${templateName}'s lighting and color treatment to them naturally
- Style their appearance to match the magazine's aesthetic level
- They should look like they were actually photographed for this cover

OUTPUT: A complete ${templateName} magazine cover. IMAGE 2's person as the cover model. All original text/graphics intact. No trace of IMAGE 1's original person.`;
}

export async function POST(req: NextRequest) {
  let uid: string;
  let email: string;
  try {
    ({ uid, email } = await verifyToken(req));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    templateId: string;
    photoBase64s: string[];
    photoTypes: string[];
    texts: Record<string, string>;
    mode?: 'style' | 'faceswap';
  };

  const template = getCoverTemplate(body.templateId);
  if (!template) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
  }

  try {
    await checkAndDecrementCredits(uid, email);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, { status: 402 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  try {
    const { base64: templateBase64, mimeType: templateMime } = readTemplateImageAsBase64(template.imagePath);

    const isFaceSwap = body.mode === 'faceswap';
    const prompt = isFaceSwap
      ? composeFaceSwapPrompt(template.name)
      : composeCoverPrompt(template.style, body.texts, template.name);

    const parts: unknown[] = [
      { text: prompt },
      { inlineData: { mimeType: templateMime, data: templateBase64 } },
      ...body.photoBase64s.map((b64, i) => ({
        inlineData: { mimeType: body.photoTypes[i] || 'image/webp', data: b64 },
      })),
    ];

    const genai = getGenAI();
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: parts as never[] }],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: { aspectRatio: '3:4' },
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p: unknown) => {
        const part = p as { inlineData?: { mimeType?: string; data?: string } };
        return part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data;
      },
    ) as { inlineData: { mimeType: string; data: string } } | undefined;

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    const { data: imageData, mimeType } = imagePart.inlineData;
    const dataUrl = `data:${mimeType};base64,${imageData}`;

    const genRef = adminDb().collection('users').doc(uid).collection('generations').doc();
    saveToStorage(imageData, uid, 'cover-output').then((outputUrl) => {
      genRef.set({
        outputImagePath: outputUrl,
        prompt,
        model: MODEL,
        cost: 1,
        presets: { templateId: body.templateId, texts: body.texts },
        createdAt: new Date(),
        status: 'success',
        type: 'cover',
      });
      adminDb().collection('credits_ledger').add({
        uid,
        delta: -1,
        reason: 'cover-generate',
        relatedId: genRef.id,
        createdAt: new Date(),
      });
    }).catch((e) => console.error('[cover-generate] storage save failed:', e));

    return NextResponse.json({ outputUrl: dataUrl, generationId: genRef.id });
  } catch (e: unknown) {
    console.error('[cover-generate]', e);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
