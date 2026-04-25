import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';
import { getGenAI, MODEL } from '@/lib/gemini/client';
import { getCoverTemplate } from '@/lib/presets/cover-templates';

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

function composeCoverPrompt(
  templateStyle: string,
  layoutDescription: string,
  texts: Record<string, string>,
  templateName: string,
): string {
  const textLines = Object.entries(texts)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `  - ${k}: "${v}"`)
    .join('\n');

  return `You are an expert magazine cover art director and compositor.

MAGAZINE: ${templateName}

VISUAL STYLE:
${templateStyle}

COMPOSITION BLUEPRINT — follow this exactly to place the uploaded person:
${layoutDescription}

YOUR TASK:
1. Take the uploaded person photo as your ONLY model.
2. Preserve their actual face, hair color, skin tone, and clothing exactly as they appear — do not alter or replace any aspect of their appearance.
3. Place them in the exact composition described in the COMPOSITION BLUEPRINT above (position, framing, scale, pose direction, relationship to text).
4. Recreate the magazine's visual environment (background color/style, lighting mood, color grading) as described in VISUAL STYLE.
5. Add the magazine title, logo, and all typographic elements in the correct positions as described in the COMPOSITION BLUEPRINT.

TEXT TO INCLUDE:
${textLines || '  - Use placeholder text matching the magazine style'}

OUTPUT RULES:
- Portrait orientation, 3:4 aspect ratio, print-ready quality
- The result must look exactly like a real ${templateName} magazine cover, featuring the uploaded person as the cover model
- The uploaded person's actual appearance (face, outfit, hair) must be faithfully preserved`;
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
    const prompt = composeCoverPrompt(template.style, template.layoutDescription, body.texts, template.name);

    const parts: unknown[] = [
      { text: prompt },
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
