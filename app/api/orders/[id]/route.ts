import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

async function verifyToken(req: NextRequest): Promise<{ uid: string }> {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!auth) throw new Error('UNAUTHORIZED');
  const decoded = await adminAuth().verifyIdToken(auth);
  return { uid: decoded.uid };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let uid: string;
  try {
    ({ uid } = await verifyToken(req));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const doc = await adminDb().collection('orders').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = doc.data()!;
    if (data.userId !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ id: doc.id, ...data });
  } catch (e) {
    console.error('[orders/id GET]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
