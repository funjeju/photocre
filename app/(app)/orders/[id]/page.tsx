'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Truck, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/firebase/auth-context';
import { ko } from '@/lib/i18n/ko';

interface OrderDetail {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  totalPrice: number;
  shippingFee: number;
  items: {
    productId: string;
    productName: string;
    customImageUrl: string;
    selectedOptions: Record<string, string>;
    quantity: number;
    unitPrice: number;
  }[];
  shippingAddress: {
    name: string; phone: string; zipCode: string;
    address: string; addressDetail?: string; memo?: string;
  };
  shippingInfo?: { carrier?: string; trackingNumber?: string };
  createdAt: { _seconds: number };
}

function formatPrice(n: number) { return n.toLocaleString('ko-KR') + '원'; }
function formatDate(sec: number) {
  return new Date(sec * 1000).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const STEPS = ['received', 'processing', 'shipped', 'delivered'] as const;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${idToken}` } });
      if (res.ok) { const data = await res.json(); setOrder(data); }
      setLoading(false);
    })();
  }, [user, id]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!order) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">주문을 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.push('/orders')} className="rounded-2xl">주문 목록</Button>
      </div>
    );
  }

  const stepIdx = STEPS.indexOf(order.orderStatus as (typeof STEPS)[number]);
  const cancelled = order.orderStatus === 'cancelled';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 lg:px-8">
        <button onClick={() => router.push('/orders')} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />주문 목록
        </button>

        {/* 헤더 */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">{ko.order.detail}</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
              {ko.order.payment[order.paymentStatus as keyof typeof ko.order.payment]}
            </Badge>
          </div>
        </div>

        {/* 진행 상태 */}
        {!cancelled && (
          <div className="mb-8 flex items-center gap-1">
            {STEPS.map((step, i) => {
              const done = i <= stepIdx;
              const active = i === stepIdx;
              return (
                <div key={step} className="flex flex-1 items-center gap-1">
                  <div className={`flex flex-col items-center gap-1 flex-1 ${i > 0 ? '' : ''}`}>
                    {i > 0 && <div className={`h-0.5 w-full ${i <= stepIdx ? 'bg-accent' : 'bg-border'}`} />}
                    <div className={`size-2 rounded-full ${done ? 'bg-accent' : 'bg-border'} ${active ? 'ring-2 ring-accent ring-offset-2' : ''}`} />
                    <span className={`text-[10px] whitespace-nowrap ${active ? 'text-accent font-medium' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {ko.order.status[step]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* 입금 안내 */}
          {order.paymentStatus === 'pending' && !cancelled && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="font-medium text-amber-800 dark:text-amber-400">{ko.order.placed}</p>
              <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">{ko.order.placedHint}</p>
              <div className="mt-3 text-sm">
                <p className="font-medium">{ko.order.bankAccount}</p>
                <p className="text-muted-foreground mt-1">카카오뱅크 3333-00-0000000 · 홍길동</p>
                <p className="font-semibold mt-1">{formatPrice(order.totalPrice + order.shippingFee)}</p>
              </div>
            </div>
          )}

          {/* 배송 정보 */}
          {order.shippingInfo?.trackingNumber && (
            <div className="rounded-2xl border border-border/60 p-5 flex items-start gap-3">
              <Truck className="size-5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{ko.order.shipping.carrier}: {order.shippingInfo.carrier ?? '-'}</p>
                <p className="text-sm text-muted-foreground">{ko.order.shipping.tracking}: {order.shippingInfo.trackingNumber}</p>
              </div>
            </div>
          )}

          {/* 배송 완료 */}
          {order.orderStatus === 'delivered' && (
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 p-5">
              <CheckCircle className="size-5 text-accent" />
              <span className="font-medium">배송이 완료되었습니다.</span>
            </div>
          )}

          {/* 주문 상품 */}
          <div className="rounded-2xl border border-border/60 p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Package className="size-4" />주문 상품</h2>
            <div className="flex flex-col gap-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.customImageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">{item.productName}</span>
                    <span className="text-xs text-muted-foreground">
                      {Object.values(item.selectedOptions).join(' / ')} · {item.quantity}개
                    </span>
                  </div>
                  <span className="text-sm font-medium">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>상품 금액</span><span>{formatPrice(order.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>배송비</span>
                <span className={order.shippingFee === 0 ? 'text-accent' : ''}>{order.shippingFee === 0 ? '무료' : formatPrice(order.shippingFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>합계</span><span>{formatPrice(order.totalPrice + order.shippingFee)}</span>
              </div>
            </div>
          </div>

          {/* 배송지 */}
          <div className="rounded-2xl border border-border/60 p-5">
            <h2 className="font-semibold mb-3">배송지</h2>
            <div className="text-sm flex flex-col gap-1">
              <p><span className="text-muted-foreground">수령인: </span>{order.shippingAddress.name}</p>
              <p><span className="text-muted-foreground">연락처: </span>{order.shippingAddress.phone}</p>
              <p><span className="text-muted-foreground">주소: </span>[{order.shippingAddress.zipCode}] {order.shippingAddress.address} {order.shippingAddress.addressDetail ?? ''}</p>
              {order.shippingAddress.memo && <p><span className="text-muted-foreground">메모: </span>{order.shippingAddress.memo}</p>}
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            주문일: {order.createdAt ? formatDate(order.createdAt._seconds) : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
