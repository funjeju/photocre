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
  return `You are a professional retouching artist performing a precise face replacement on a magazine cover.

IMAGE 1: The original ${templateName} magazine cover. This is your base canvas — preserve it almost entirely.
IMAGE 2: The face donor. Extract ONLY the face from this image.

TASK: Replace the face of the cover model in IMAGE 1 with the face from IMAGE 2.

WHAT TO PRESERVE FROM IMAGE 1 (keep pixel-perfect):
- Every piece of text, logo, title, and all typographic elements — exact position and style
- Background, set design, color palette, and all graphic elements
- The cover model's body, neck, shoulders, clothing, hands, and pose
- Hair (adapt edges naturally where face meets hair)
- Overall color grading, lighting direction, and mood of the image

FACE REPLACEMENT — CRITICAL RULES:
- Identify the face region of IMAGE 1's cover model (forehead to chin, ear to ear)
- COMPLETELY remove IMAGE 1's face features from that region — eyes, nose, mouth, face shape, skin texture: gone
- Insert IMAGE 2's face into that exact region at the correct scale and perspective
- IMAGE 2's facial features must appear 100% as they are: their eye shape, nose, lips, face contour, skin tone — all preserved exactly
- ABSOLUTE PROHIBITION: Do NOT blend, average, or merge any features from IMAGE 1's face with IMAGE 2's face. Zero mixing. IMAGE 1's face must contribute nothing to the final face.
- Adapt the lighting and color tone of IMAGE 2's face to match IMAGE 1's lighting conditions so the face looks naturally lit for the scene
- Blend the edges (hairline, jawline, neck transition) seamlessly — no visible seam or halo

OUTPUT: The ${templateName} magazine cover with IMAGE 2's face placed naturally on the original cover model's body. Everything else identical to IMAGE 1. The result must look like the person from IMAGE 2 was the original cover model.`;
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
