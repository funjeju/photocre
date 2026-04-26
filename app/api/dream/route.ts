import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';
import { getGenAI, MODEL } from '@/lib/gemini/client';

export const runtime = 'nodejs';
export const maxDuration = 300;

export interface DreamReport {
  headline: string;
  summary: string;
  overview?: string;
  strengths: string[];
  strengthDetails?: string[];
  skills: string[];
  skillDetails?: string[];
  path: string[];
  pathDetails?: string[];
  dailyLife?: string;
  prospects?: string;
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
    overview: `${career}는 사회에서 중요한 역할을 담당하는 직업입니다. 전문 지식과 실무 경험이 결합될 때 진정한 전문가로 성장할 수 있습니다. 이 분야는 끊임없는 변화와 함께 새로운 기회를 제공합니다.`,
    strengths: ['창의력', '집중력', '열정'],
    strengthDetails: [
      '창의적 사고는 새로운 문제를 독창적으로 해결하는 데 핵심적인 역할을 합니다.',
      '깊은 집중력은 복잡한 업무를 정확하고 효율적으로 처리할 수 있게 합니다.',
      '열정은 어려운 상황에서도 끝까지 도전하는 원동력이 됩니다.',
    ],
    skills: ['전문 지식', '커뮤니케이션', '문제 해결'],
    skillDetails: [
      '해당 분야의 깊은 전문 지식은 신뢰받는 전문가로 자리매김하는 기반이 됩니다.',
      '명확한 커뮤니케이션 능력은 팀과의 협업 및 고객 응대에 필수적입니다.',
      '체계적인 문제 해결 능력은 예상치 못한 상황에서도 최선의 결과를 이끌어냅니다.',
    ],
    path: ['기초 학습 및 자격 취득', '현장 실무 경험 쌓기', '전문가로 성장하기'],
    pathDetails: [
      '관련 학위 또는 자격증을 취득하고 이론적 기반을 단단히 합니다. 온라인 강의와 독서로 지식을 꾸준히 쌓아가세요.',
      '인턴십이나 실무 프로젝트를 통해 현장 경험을 쌓습니다. 멘토를 찾고 네트워크를 형성하는 것이 중요합니다.',
      '독립적인 프로젝트를 진행하고 업계에서 인정받는 포트폴리오를 구축합니다. 지속적인 자기 계발로 분야의 리더로 성장합니다.',
    ],
    dailyLife: `${age}살 ${career}의 하루는 도전과 성취로 가득합니다. 아침 일찍 시작해 오늘의 목표를 확인하고, 오전에는 핵심 업무에 집중합니다. 점심 후에는 동료들과 아이디어를 나누고, 오후에는 프로젝트를 발전시킵니다. 하루를 마치며 오늘의 성장을 돌아보는 시간이 큰 보람이 됩니다.`,
    prospects: `${career} 분야는 앞으로 더욱 성장할 것으로 전망됩니다. 기술의 발전으로 새로운 기회가 끊임없이 생겨나고 있으며, 전문가에 대한 수요도 꾸준히 증가하고 있습니다. 글로벌 무대에서 활약할 기회도 많아지고 있어, 지금 시작하는 것이 최고의 선택입니다.`,
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

    const prompt = `이 사진 속 인물을 기반으로 두 가지를 만들어주세요.

1. AI 이미지 생성 — 이 인물이 ${age}살에 ${career}로 일하는 포토리얼리스틱 모습:
   - 핵심 중요: 사진 속 인물의 얼굴 골격, 눈·코·입·턱선·이마 형태, 피부톤, 눈동자 색상을 최대한 유지
   - 나이만 ${age}살에 맞게 자연스럽게 조정 (적절한 헤어스타일, 피부 상태 등)
   - ${career} 직업에 어울리는 전문적인 복장과 배경으로만 변경
   - 고품질 포토리얼리스틱, 자연스러운 조명, 전문 인물 사진 느낌

2. 한국어 커리어 리포트 JSON (마크다운·코드블록 없이 순수 JSON만):
{"headline":"${age}살 ${career}의 삶을 담은 인상적인 제목","summary":"이 직업의 핵심 매력을 2~3문장으로","overview":"이 직업의 사회적 역할, 일상, 매력, 도전, 미래 가능성을 5~7문장으로 풍부하게 서술","strengths":["강점1","강점2","강점3"],"strengthDetails":["강점1이 이 직업에서 어떻게 발현되는지 구체적으로 2문장","강점2 설명 2문장","강점3 설명 2문장"],"skills":["핵심스킬1","스킬2","스킬3"],"skillDetails":["스킬1이 왜 중요하고 어떻게 활용되는지 2문장","스킬2 설명 2문장","스킬3 설명 2문장"],"path":["커리어 1단계 제목","2단계 제목","3단계 제목"],"pathDetails":["1단계의 구체적 내용과 기간·방법을 2~3문장으로","2단계 상세 설명","3단계 상세 설명"],"dailyLife":"이 직업인의 하루 일과, 업무 환경, 동료와의 상호작용을 생생하게 4~5문장으로","prospects":"앞으로 5~10년간 이 직업의 성장 가능성, 기술 변화의 영향, 새로운 기회를 4~5문장으로","message":"이 꿈을 향해 나아가는 사람에게 보내는 따뜻하고 구체적인 응원 2~3문장"}`;

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
