import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';
import { getGenAI, MODEL } from '@/lib/gemini/client';

export const runtime = 'nodejs';
export const maxDuration = 300;

export interface DreamReport {
  headline: string;
  summary: string;
  strengths: string[];
  skills: string[];
  path: string[];
  message: string;
}

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

function fallbackReport(career: string, age: number): DreamReport {
  return {
    headline: `${age}세 ${career}의 하루`,
    summary: `${career}는 전문성과 열정이 필요한 직업입니다. 꾸준한 노력으로 성장할 수 있습니다.`,
    strengths: ['창의력', '집중력', '열정'],
    skills: ['전문 지식', '커뮤니케이션', '문제 해결'],
    path: ['기초 학습 및 자격 취득', '현장 실무 경험 쌓기', '전문가로 성장하기'],
    message: '당신의 꿈을 향한 여정을 응원합니다! 한 걸음씩 나아가다 보면 반드시 이뤄질 거예요.',
  };
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
    imageBase64: string;
    imageType: string;
    career: string;
    age?: number;
  };

  const career = body.career?.trim();
  const age = Math.max(18, Math.min(60, body.age ?? 25));

  if (!career) {
    return NextResponse.json({ error: 'career is required' }, { status: 400 });
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
    const inputUrl = await saveToStorage(body.imageBase64, uid, 'dream-input');

    const prompt = `이 사진 속 인물을 보고 두 가지를 만들어주세요.

1. 이 인물이 ${age}살에 ${career}로 일하는 모습을 포토리얼리스틱 이미지로 생성해주세요.
   - 사진 속 인물의 얼굴을 그대로 유지하되 ${age}살에 맞게 자연스럽게 조정
   - ${career}에 어울리는 전문적인 배경과 복장
   - 고품질, 자연스러운 조명

2. 아래 JSON 형식으로 한국어 커리어 리포트를 작성해주세요 (마크다운 없이 JSON만):
{"headline":"${age}살 ${career}의 하루를 담은 한 줄 제목","summary":"이 직업의 매력과 미래 가능성을 2~3문장으로","strengths":["이 직업에 맞는 강점1","강점2","강점3"],"skills":["핵심 스킬1","스킬2","스킬3"],"path":["커리어 첫 단계","두 번째 단계","전문가 단계"],"message":"이 꿈을 꾸는 사람에게 보내는 따뜻한 응원 한 마디"}`;

    const genai = getGenAI();
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: body.imageType || 'image/webp', data: body.imageBase64 } },
        ] as never[],
      }],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: { aspectRatio: '1:1' },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];

    const imagePart = parts.find((p: unknown) => {
      const part = p as { inlineData?: { mimeType?: string; data?: string } };
      return part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data;
    }) as { inlineData: { mimeType: string; data: string } } | undefined;

    const textPart = parts.find((p: unknown) => {
      const part = p as { text?: string };
      return typeof part.text === 'string' && part.text.trim().length > 0;
    }) as { text: string } | undefined;

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    const { data: imageData, mimeType } = imagePart.inlineData;
    const dataUrl = `data:${mimeType};base64,${imageData}`;

    let report: DreamReport = fallbackReport(career, age);
    if (textPart?.text) {
      try {
        const jsonMatch = textPart.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) report = JSON.parse(jsonMatch[0]) as DreamReport;
      } catch {
        console.warn('[dream] JSON parse failed, using fallback report');
      }
    }

    const dreamRef = adminDb().collection('users').doc(uid).collection('dreams').doc();
    saveToStorage(imageData, uid, 'dream-output').then((outputUrl) => {
      dreamRef.set({
        career, age,
        inputImageUrl: inputUrl,
        outputImageUrl: outputUrl,
        report,
        createdAt: new Date(),
        status: 'success',
      });
      adminDb().collection('credits_ledger').add({
        uid, delta: -1, reason: 'dream',
        relatedId: dreamRef.id, createdAt: new Date(),
      });
    }).catch((e) => console.error('[dream] storage save failed:', e));

    return NextResponse.json({ outputUrl: dataUrl, report, dreamId: dreamRef.id });
  } catch (e) {
    console.error('[dream]', e);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
