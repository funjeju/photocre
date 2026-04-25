import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('users').doc(decoded.uid).get();

    if (!snap.exists) return NextResponse.json({ credits: 0 });

    const data = snap.data()!;
    return NextResponse.json({ credits: data.credits ?? 0, isOwner: data.isOwner ?? false });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
