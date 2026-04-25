import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';

export const runtime = 'nodejs';

const OWNER_EMAILS = (process.env.OWNER_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);

async function verifyOwner(req: NextRequest): Promise<{ uid: string }> {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!auth) throw new Error('UNAUTHORIZED');
  const decoded = await adminAuth().verifyIdToken(auth);
  const snap = await adminDb().collection('users').doc(decoded.uid).get();
  const isOwner = snap.data()?.isOwner || OWNER_EMAILS.includes(decoded.email ?? '');
  if (!isOwner) throw new Error('FORBIDDEN');
  return { uid: decoded.uid };
}

const PatchSchema = z.object({
  paymentStatus: z.enum(['pending', 'paid', 'cancelled', 'refunded']).optional(),
  orderStatus:   z.enum(['received', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  shippingInfo: z.object({
    carrier:       z.string().optional(),
    trackingNumber: z.string().optional(),
  }).optional(),
  adminMemo: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await verifyOwner(req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json({ error: msg === 'FORBIDDEN' ? 'Forbidden' : 'Unauthorized' }, { status: msg === 'FORBIDDEN' ? 403 : 401 });
  }

  const raw = await req.json();
  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.paymentStatus) updates.paymentStatus = parsed.data.paymentStatus;
    if (parsed.data.orderStatus)   updates.orderStatus   = parsed.data.orderStatus;
    if (parsed.data.adminMemo !== undefined) updates.adminMemo = parsed.data.adminMemo;
    if (parsed.data.shippingInfo) {
      const si = parsed.data.shippingInfo;
      if (si.carrier)        updates['shippingInfo.carrier']        = si.carrier;
      if (si.trackingNumber) updates['shippingInfo.trackingNumber'] = si.trackingNumber;
      if (si.carrier || si.trackingNumber) updates['shippingInfo.shippedAt'] = new Date();
    }
    await adminDb().collection('orders').doc(id).update(updates);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[admin/orders/PATCH]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
