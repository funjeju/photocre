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
  const fullPath = path.join(process.cwd(), 'public', imagePath);
  const buffer = fs.readFileSync(fullPath);
  const ext = path.extname(imagePath).toLowerCase().replace('.', '');
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return { base64: buffer.toString('base64'), mimeType };
}

function composeCoverPrompt(
  layoutDescription: string,
  texts: Record<string, string>,
  templateName: string,
): string {
  const textLines = Object.entries(texts)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `  - ${k}: "${v}"`)
    .join('\n');

  return `You are a professional magazine cover compositor.

IMAGE 1: The ${templateName} magazine cover background. This image contains the background, typography, logo, and all graphic design elements — but intentionally has NO person in it. This is your base canvas.
IMAGE 2: The person to place on the cover. This is your ONLY model.

TASK: Place IMAGE 2's person into IMAGE 1's canvas to create a complete, natural-looking ${templateName} magazine cover.

PERSON PLACEMENT BLUEPRINT — follow this precisely:
${layoutDescription}

PERSON RULES (critical — NON-NEGOTIABLE):
- FACE PRESERVATION IS ABSOLUTE: Do NOT alter, retouch, reshape, smooth, slim, enhance, or change the person's face in ANY way. Reproduce the face with 100% fidelity — every feature, expression, and characteristic exactly as in IMAGE 2.
- Do NOT apply beauty filters, skin smoothing, facial reshaping, or AI enhancement to the face.
- Do NOT change hair color, skin tone, eye shape, nose, lips, or any facial feature.
- Preserve the person's clothing, body proportions, and overall appearance exactly as in IMAGE 2 — no alterations.
- Position, scale, and frame them exactly as described in the PERSON PLACEMENT BLUEPRINT.
- You may only adapt the lighting and color grading to harmonize with IMAGE 1's atmosphere — nothing else.
- The person should look like they were professionally photographed for this cover, but their face and appearance must remain completely unchanged.

BACKGROUND RULES:
- Use IMAGE 1 purely as a layout and design REFERENCE — do not copy its pixels. Instead, recreate every element (logo, typography, graphic shapes, background color/texture) at full high resolution and maximum sharpness.
- All text and lettering must be rendered crisp, clean, and perfectly legible — as if typeset by a professional designer, not sampled from a low-res source.
- All edges, lines, and graphic elements must be sharp with no aliasing, blurriness, or compression artifacts.
- The only addition beyond IMAGE 1's design is IMAGE 2's person placed in the correct position.
${textLines ? `\nTEXT OVERRIDE (replace these specific text elements from IMAGE 1 with the values below):\n${textLines}` : ''}

OUTPUT: A complete, print-ready ${templateName} magazine cover at 3:4 aspect ratio. IMAGE 1's design with IMAGE 2's person naturally placed in it.`;
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
  };

  const template = getCoverTemplate(body.templateId);
  if (!template) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
  }

  if (!Array.isArray(body.photoBase64s) || body.photoBase64s.length === 0) {
    return NextResponse.json({ error: 'No photos provided' }, { status: 400 });
  }
  const invalidPhoto = body.photoBase64s.findIndex((b) => !b || b.length < 100);
  if (invalidPhoto !== -1) {
    console.error(`[cover-generate] photo[${invalidPhoto}] is empty or too small (len=${body.photoBase64s[invalidPhoto]?.length ?? 0})`);
    return NextResponse.json({ error: 'Invalid photo data', code: 'INVALID_PHOTO' }, { status: 400 });
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
    const { base64: bgBase64, mimeType: bgMime } = readTemplateImageAsBase64(template.imagePath);
    const prompt = composeCoverPrompt(template.layoutDescription, body.texts, template.name);

    const parts: unknown[] = [
      { text: prompt },
      // IMAGE 1: person-less background canvas
      { inlineData: { mimeType: bgMime, data: bgBase64 } },
      // IMAGE 2+: user's person photo(s)
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
      const textPart = response.candidates?.[0]?.content?.parts?.find(
        (p: unknown) => (p as Record<string, unknown>).text,
      ) as { text?: string } | undefined;
      console.error('[cover-generate] no image in response. text:', textPart?.text ?? '(none)', 'finishReason:', response.candidates?.[0]?.finishReason);
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
