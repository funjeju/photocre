'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/firebase/auth-context';
import { ko } from '@/lib/i18n/ko';

interface AdminOrder {
  id: string;
  userName: string;
  userEmail: string;
  orderStatus: string;
  paymentStatus: string;
  totalPrice: number;
  shippingFee: number;
  items: { productName: string; customImageUrl: string; selectedOptions: Record<string, string>; quantity: number; unitPrice: number }[];
  shippingAddress: { name: string; phone: string; zipCode: string; address: string; addressDetail?: string; memo?: string };
  shippingInfo?: { carrier?: string; trackingNumber?: string };
  adminMemo?: string;
  createdAt: { _seconds: number };
}

function formatPrice(n: number) { return n.toLocaleString('ko-KR') + '원'; }
function formatDate(sec: number) {
  return new Date(sec * 1000).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const PAY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary', paid: 'default', cancelled: 'destructive', refunded: 'outline',
};
const ORDER_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  received: 'secondary', processing: 'default', shipped: 'default', delivered: 'outline', cancelled: 'destructive',
};

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Record<string, { carrier: string; trackingNumber: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function fetchOrders() {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${idToken}` } });
    if (res.ok) { const d = await res.json(); setOrders(d.orders ?? []); }
    setLoading(false);
  }

  useEffect(() => { fetchOrders(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(orderId: string, body: Record<string, unknown>) {
    if (!user) return;
    setSaving(orderId);
    const idToken = await user.getIdToken();
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success('저장되었습니다.');
      fetchOrders();
    } else {
      toast.error(ko.errors.unknown);
    }
    setSaving(null);
  }

  if (loading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  const stats = {
    total:    orders.length,
    pending:  orders.filter((o) => o.paymentStatus === 'pending').length,
    process:  orders.filter((o) => o.orderStatus === 'processing').length,
    shipped:  orders.filter((o) => o.orderStatus === 'shipped').length,
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8">
        <h1 className="mb-6 text-xl font-semibold">{ko.admin.orders}</h1>

        {/* 통계 카드 */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: ko.admin.totalOrders, value: stats.total },
            { label: ko.admin.pendingPayment, value: stats.pending },
            { label: ko.admin.processing, value: stats.process },
            { label: ko.admin.shipped, value: stats.shipped },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/60 p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <p className="text-center text-muted-foreground py-16">주문이 없습니다.</p>
        )}

        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const isExpanded = expanded === order.id;
            const tk = tracking[order.id] ?? { carrier: order.shippingInfo?.carrier ?? '', trackingNumber: order.shippingInfo?.trackingNumber ?? '' };

            return (
              <div key={order.id} className="rounded-2xl border border-border/60 overflow-hidden">
                {/* 요약 행 */}
                <button
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <Badge variant={PAY_VARIANT[order.paymentStatus] ?? 'outline'} className="text-xs">
                      {ko.order.payment[order.paymentStatus as keyof typeof ko.order.payment]}
                    </Badge>
                    <Badge variant={ORDER_VARIANT[order.orderStatus] ?? 'outline'} className="text-xs">
                      {ko.order.status[order.orderStatus as keyof typeof ko.order.status]}
                    </Badge>
                    <span className="text-sm font-medium">{order.userName}</span>
                    <span className="text-xs text-muted-foreground">{order.items.map((i) => `${i.productName}×${i.quantity}`).join(', ')}</span>
                    <span className="ml-auto text-sm font-semibold">{formatPrice(order.totalPrice + order.shippingFee)}</span>
                    <span className="text-xs text-muted-foreground">{order.createdAt ? formatDate(order.createdAt._seconds) : ''}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
                </button>

                {/* 펼쳐진 상세 */}
                {isExpanded && (
                  <div className="border-t border-border/40 p-4 flex flex-col gap-5">
                    {/* 주문 상품 */}
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">주문 상품</p>
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.customImageUrl} alt={item.productName} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex flex-1 flex-col">
                            <span className="text-sm font-medium">{item.productName}</span>
                            <span className="text-xs text-muted-foreground">{Object.values(item.selectedOptions).join(' / ')} · {item.quantity}개</span>
                          </div>
                          <span className="text-sm">{formatPrice(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* 배송지 */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">배송지</p>
                      <div className="text-sm flex flex-col gap-0.5">
                        <p>{order.shippingAddress.name} · {order.shippingAddress.phone}</p>
                        <p>[{order.shippingAddress.zipCode}] {order.shippingAddress.address} {order.shippingAddress.addressDetail ?? ''}</p>
                        {order.shippingAddress.memo && <p className="text-muted-foreground">메모: {order.shippingAddress.memo}</p>}
                      </div>
                    </div>

                    <Separator />

                    {/* 상태 변경 버튼 */}
                    <div className="flex flex-col gap-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">상태 변경</p>
                      <div className="flex flex-wrap gap-2">
                        {order.paymentStatus === 'pending' && (
                          <Button size="sm" variant="outline" className="rounded-xl" disabled={saving === order.id}
                            onClick={() => patch(order.id, { paymentStatus: 'paid', orderStatus: 'processing' })}>
                            {ko.admin.markPaid}
                          </Button>
                        )}
                        {order.orderStatus === 'processing' && (
                          <Button size="sm" variant="outline" className="rounded-xl" disabled={saving === order.id}
                            onClick={() => patch(order.id, { orderStatus: 'shipped' })}>
                            {ko.admin.markShipped}
                          </Button>
                        )}
                        {order.orderStatus === 'shipped' && (
                          <Button size="sm" variant="outline" className="rounded-xl" disabled={saving === order.id}
                            onClick={() => patch(order.id, { orderStatus: 'delivered' })}>
                            {ko.admin.markDelivered}
                          </Button>
                        )}
                        {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                          <Button size="sm" variant="outline" className="rounded-xl text-destructive hover:text-destructive" disabled={saving === order.id}
                            onClick={() => patch(order.id, { orderStatus: 'cancelled', paymentStatus: 'cancelled' })}>
                            {ko.admin.markCancelled}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 송장 입력 */}
                    {(order.orderStatus === 'processing' || order.orderStatus === 'shipped') && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="size-3.5" />{ko.admin.enterTracking}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <Input
                            placeholder={ko.admin.carrier}
                            value={tk.carrier}
                            onChange={(e) => setTracking((prev) => ({ ...prev, [order.id]: { ...tk, carrier: e.target.value } }))}
                            className="rounded-xl w-32"
                          />
                          <Input
                            placeholder={ko.admin.trackingNumber}
                            value={tk.trackingNumber}
                            onChange={(e) => setTracking((prev) => ({ ...prev, [order.id]: { ...tk, trackingNumber: e.target.value } }))}
                            className="rounded-xl flex-1 min-w-[160px]"
                          />
                          <Button size="sm" variant="outline" className="rounded-xl" disabled={saving === order.id}
                            onClick={() => patch(order.id, { shippingInfo: { carrier: tk.carrier, trackingNumber: tk.trackingNumber }, orderStatus: 'shipped' })}>
                            {ko.admin.save}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 관리자 메모 */}
                    <div className="flex gap-2">
                      <Input
                        placeholder={ko.admin.adminMemo}
                        defaultValue={order.adminMemo ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (order.adminMemo ?? '')) {
                            patch(order.id, { adminMemo: e.target.value });
                          }
                        }}
                        className="rounded-xl text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
