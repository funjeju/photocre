'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/firebase/auth-context';
import { ko } from '@/lib/i18n/ko';

interface OrderSummary {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  totalPrice: number;
  shippingFee: number;
  items: { productName: string; quantity: number }[];
  createdAt: { _seconds: number };
}

function formatPrice(n: number) { return n.toLocaleString('ko-KR') + '원'; }
function formatDate(sec: number) {
  return new Date(sec * 1000).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const ORDER_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  received:   'secondary',
  processing: 'default',
  shipped:    'default',
  delivered:  'outline',
  cancelled:  'destructive',
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${idToken}` } });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <Package className="size-12 text-muted-foreground/40" />
        <div>
          <p className="font-medium">{ko.order.empty}</p>
          <p className="mt-1 text-sm text-muted-foreground">{ko.order.emptyHint}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/studio')} className="rounded-2xl">
          Studio로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">{ko.order.title}</h1>
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => router.push(`/orders/${order.id}`)}
              className="flex items-center gap-4 rounded-2xl border border-border/60 p-5 text-left hover:bg-muted/40 transition-colors w-full"
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <Badge variant={ORDER_STATUS_VARIANT[order.orderStatus] ?? 'outline'} className="text-xs">
                    {ko.order.status[order.orderStatus as keyof typeof ko.order.status] ?? order.orderStatus}
                  </Badge>
                  <Badge
                    variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {ko.order.payment[order.paymentStatus as keyof typeof ko.order.payment] ?? order.paymentStatus}
                  </Badge>
                </div>
                <p className="text-sm font-medium">
                  {order.items.map((i) => `${i.productName} ${i.quantity}개`).join(', ')}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatPrice(order.totalPrice + order.shippingFee)}</span>
                  <span>·</span>
                  <span>{order.createdAt ? formatDate(order.createdAt._seconds) : ''}</span>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
