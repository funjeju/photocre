import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function verifyToken(req: NextRequest): Promise<string> {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!auth) throw new Error('UNAUTHORIZED');
  const decoded = await adminAuth().verifyIdToken(auth);
  return decoded.uid;
}

export async function POST(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyToken(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    imageBase64: string;
    styleId?: string;
    customPrompt?: string;
    // batch 저장 확장 필드
    folderId?: string;
    text?: string;
    label?: string;
    batchId?: string;
    batchIndex?: number;
  };

  if (!body.imageBase64) {
    return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });
  }

  try {
    const bucket = adminStorage().bucket();
    const ts = Date.now();
    const filePath = `output/${uid}/${ts}.png`;
    const file = bucket.file(filePath);
    const buffer = Buffer.from(body.imageBase64, 'base64');
    await file.save(buffer, {
      contentType: 'image/png',
      metadata: { cacheControl: 'public,max-age=31536000' },
    });
    await file.makePublic();
    const encodedPath = encodeURIComponent(filePath);
    const outputImagePath = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

    const genRef = adminDb().collection('users').doc(uid).collection('generations').doc();
    await genRef.set({
      outputImagePath,
      presets: {
        styleId: body.styleId ?? '',
        customPrompt: body.customPrompt ?? '',
      },
      createdAt: new Date(),
      status: 'success',
      ...(body.folderId   != null && { folderId:   body.folderId }),
      ...(body.text       != null && { text:       body.text }),
      ...(body.label      != null && { label:      body.label }),
      ...(body.batchId    != null && { batchId:    body.batchId }),
      ...(body.batchIndex != null && { batchIndex: body.batchIndex }),
    });

    return NextResponse.json({ id: genRef.id, outputImagePath });
  } catch (e) {
    console.error('[save-generation]', e);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
