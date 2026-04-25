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

  return `You are an expert magazine cover art director.

IMAGE 1: The ${templateName} magazine cover reference. Use ONLY for layout and visual style — DO NOT use its person.
IMAGE 2 (and beyond): The person(s) to feature on the cover. These are your ONLY models.

TASK: Create a brand-new ${templateName}-style magazine cover featuring the person(s) from IMAGE 2+.

CRITICAL — ABOUT THE PEOPLE:
- The person appearing in IMAGE 1 must NOT appear in the output in any form.
- Do NOT copy, reference, or be influenced by IMAGE 1's model: not their face, hair, clothing, body shape, pose, or any physical attribute.
- IMAGE 2's person is the sole subject. Use their actual face, hair, skin tone, and clothing exactly as they appear in their photo.
- Their outfit and appearance from IMAGE 2 should be preserved — do not replace or alter their clothes to match IMAGE 1's model.

WHAT TO TAKE FROM IMAGE 1 (design only):
- Magazine title / logo — placement, font style, and color treatment
- Overall layout: how the model is framed within the cover
- Color palette, mood, and lighting atmosphere
- Background style and graphic design elements
- Typography hierarchy for headline and body text

WHAT TO DO WITH IMAGE 2's PERSON:
- Place them as the cover model in a natural, editorial pose suited to ${templateName}'s aesthetic
- Apply the magazine's color grading and lighting mood to the scene — not to alter their look, but to match the atmosphere
- They should look like they were professionally photographed for this exact cover

TEXT TO INCLUDE (place prominently per the template layout):
${textLines || '  - Use placeholder text matching the magazine style'}

OUTPUT RULES:
- Portrait orientation, 3:4 aspect ratio
- Print-ready quality, sharp and clean
- Result must look like a real ${templateName} cover with IMAGE 2's person as the model`;
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
    const { base64: templateBase64, mimeType: templateMime } = readTemplateImageAsBase64(template.imagePath);

    const prompt = composeCoverPrompt(template.style, body.texts, template.name);

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
