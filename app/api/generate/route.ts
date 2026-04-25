import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';
import { getGenAI, MODEL } from '@/lib/gemini/client';
import { composePrompt, getAspectRatioParam } from '@/lib/gemini/compose';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function verifyToken(req: NextRequest): Promise<{ uid: string; email: string }> {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!auth) throw new Error('UNAUTHORIZED');
  const decoded = await adminAuth().verifyIdToken(auth);
  return { uid: decoded.uid, email: decoded.email ?? '' };
}

const OWNER_EMAILS = (process.env.OWNER_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);

async function checkAndDecrementCredits(uid: string, email: string): Promise<void> {
  if (OWNER_EMAILS.includes(email)) return; // 오너 무제한

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

export async function POST(req: NextRequest) {
  let uid: string;
  let email: string;
  try {
    ({ uid, email } = await verifyToken(req));
  } catch (e) {
    console.error('[generate] verifyToken failed:', e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    imageBase64: string;
    imageType: string;
    styleId: string;
    aspectRatio: string;
    customPrompt?: string;
    backgroundPrompt?: string;
    transformIntensity?: number;
  };

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
    const inputPath = await saveToStorage(body.imageBase64, uid, 'input');

    console.log('[generate] styleId received:', body.styleId, '| aspectRatio:', body.aspectRatio);

    const prompt = composePrompt({
      styleId: body.styleId,
      customPrompt: body.customPrompt,
      aspectRatio: body.aspectRatio,
      backgroundPrompt: body.backgroundPrompt,
      transformIntensity: body.transformIntensity,
    });

    const parts: unknown[] = [
      { text: prompt },
      { inlineData: { mimeType: body.imageType || 'image/webp', data: body.imageBase64 } },
    ];

    const genai = getGenAI();
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: parts as never[] }],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: { aspectRatio: getAspectRatioParam(body.aspectRatio) },
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

    // Storage 저장 + Firestore 기록은 백그라운드로 (CORS 우회 — 표시는 dataUrl 직접 사용)
    const genRef = adminDb().collection('users').doc(uid).collection('generations').doc();
    saveToStorage(imageData, uid, 'output').then((outputUrl) => {
      genRef.set({
        inputImagePath: inputPath,
        outputImagePath: outputUrl,
        prompt,
        model: MODEL,
        cost: 1,
        presets: { styleId: body.styleId, customPrompt: body.customPrompt ?? '' },
        createdAt: new Date(),
        status: 'success',
      });
      adminDb().collection('credits_ledger').add({
        uid,
        delta: -1,
        reason: 'generate',
        relatedId: genRef.id,
        createdAt: new Date(),
      });
    }).catch((e) => console.error('[generate] storage save failed:', e));

    return NextResponse.json({ outputUrl: dataUrl, generationId: genRef.id });
  } catch (e: unknown) {
    console.error('[generate]', e);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
