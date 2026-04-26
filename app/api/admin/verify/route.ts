import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

const OWNER_EMAILS = (process.env.OWNER_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ isOwner: false });
    const decoded = await adminAuth().verifyIdToken(auth);
    const snap = await adminDb().collection('users').doc(decoded.uid).get();
    const isOwner = !!(snap.data()?.isOwner) || OWNER_EMAILS.includes(decoded.email ?? '');
    return NextResponse.json({ isOwner });
  } catch {
    return NextResponse.json({ isOwner: false });
  }
}
