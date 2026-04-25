import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';
import { OrderItemSchema, ShippingAddressSchema } from '@/lib/firebase/schema';
import { z } from 'zod';

export const runtime = 'nodejs';

async function verifyToken(req: NextRequest): Promise<{ uid: string; email: string; name: string }> {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!auth) throw new Error('UNAUTHORIZED');
  const decoded = await adminAuth().verifyIdToken(auth);
  return { uid: decoded.uid, email: decoded.email ?? '', name: decoded.name ?? '' };
}

async function saveDataUrl(dataUrl: string, uid: string): Promise<string> {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+);/);
  const mimeType = mimeMatch?.[1] ?? 'image/webp';
  const ext = mimeType.split('/')[1] ?? 'webp';
  const bucket = adminStorage().bucket();
  const filePath = `order-images/${uid}/${Date.now()}.${ext}`;
  const file = bucket.file(filePath);
  await file.save(Buffer.from(base64, 'base64'), {
    contentType: mimeType,
    metadata: { cacheControl: 'public,max-age=31536000' },
  });
  await file.makePublic();
  const encoded = encodeURIComponent(filePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media`;
}

const BodySchema = z.object({
  items:           z.array(OrderItemSchema),
  totalPrice:      z.number(),
  shippingFee:     z.number(),
  shippingAddress: ShippingAddressSchema,
});

export async function POST(req: NextRequest) {
  let uid: string, email: string, name: string;
  try {
    ({ uid, email, name } = await verifyToken(req));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await req.json();
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { items, totalPrice, shippingFee, shippingAddress } = parsed.data;

  try {
    // data: URL인 경우 Firebase Storage에 업로드 후 영구 URL로 교체
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        if (item.customImageUrl.startsWith('data:')) {
          const permanentUrl = await saveDataUrl(item.customImageUrl, uid);
          return { ...item, customImageUrl: permanentUrl };
        }
        return item;
      }),
    );

    const orderRef = adminDb().collection('orders').doc();
    const now = new Date();
    await orderRef.set({
      userId:          uid,
      userEmail:       email,
      userName:        name,
      items:           resolvedItems,
      totalPrice,
      shippingFee,
      shippingAddress,
      paymentMethod:   'bank_transfer',
      paymentStatus:   'pending',
      orderStatus:     'received',
      shippingInfo:    {},
      createdAt:       now,
      updatedAt:       now,
    });

    return NextResponse.json({ orderId: orderRef.id });
  } catch (e) {
    console.error('[orders/POST]', e);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  let uid: string;
  try {
    ({ uid } = await verifyToken(req));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snap = await adminDb()
      .collection('orders')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ orders });
  } catch (e) {
    console.error('[orders/GET]', e);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
