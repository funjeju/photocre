import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

const OWNER_EMAILS = (process.env.OWNER_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);

async function verifyOwner(req: NextRequest): Promise<void> {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!auth) throw new Error('UNAUTHORIZED');
  const decoded = await adminAuth().verifyIdToken(auth);
  const snap = await adminDb().collection('users').doc(decoded.uid).get();
  const isOwner = snap.data()?.isOwner || OWNER_EMAILS.includes(decoded.email ?? '');
  if (!isOwner) throw new Error('FORBIDDEN');
}

export async function GET(req: NextRequest) {
  try {
    await verifyOwner(req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: msg }, { status: msg === 'FORBIDDEN' ? 403 : 401 });
  }

  try {
    const snap = await adminDb()
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ orders });
  } catch (e) {
    console.error('[admin/orders GET]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
