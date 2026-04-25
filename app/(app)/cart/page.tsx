'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, Minus, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/lib/store/cart';
import { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from '@/lib/presets/products';
import { ko } from '@/lib/i18n/ko';

function formatPrice(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const subtotal = totalPrice();
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <ShoppingBag className="size-12 text-muted-foreground/40" />
        <div>
          <p className="font-medium">{ko.cart.empty}</p>
          <p className="mt-1 text-sm text-muted-foreground">{ko.cart.emptyHint}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/studio')} className="rounded-2xl">
          {ko.cart.continueShopping}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">{ko.cart.title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {ko.cart.itemCount.replace('{{n}}', String(items.reduce((s, i) => s + i.quantity, 0)))}
        </p>

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-2xl border border-border/60 p-4">
              {/* 이미지 */}
              <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.customImageUrl}
                  alt={item.productName}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* 정보 */}
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    {Object.entries(item.selectedOptions).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {Object.entries(item.selectedOptions).map(([, v]) => v).join(' / ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  {/* 수량 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex size-7 items-center justify-center rounded-lg border border-border hover:bg-muted/60 transition-colors"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex size-7 items-center justify-center rounded-lg border border-border hover:bg-muted/60 transition-colors"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <span className="font-semibold">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {/* 금액 요약 */}
        <div className="flex flex-col gap-3 rounded-2xl bg-muted/30 p-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">상품 금액</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{ko.shop.shippingFee}</span>
            <span className={shippingFee === 0 ? 'text-accent font-medium' : ''}>
              {shippingFee === 0 ? ko.shop.freeShipping : formatPrice(shippingFee)}
            </span>
          </div>
          {subtotal < FREE_SHIPPING_THRESHOLD && (
            <p className="text-xs text-muted-foreground">
              {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} 더 담으면 무료배송
            </p>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>{ko.shop.total}</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={() => router.push('/checkout')} className="h-12 rounded-2xl text-base gap-2">
            <Package className="size-5" />
            {ko.cart.checkout}
          </Button>
          <Button variant="outline" onClick={() => router.push('/studio')} className="h-12 rounded-2xl">
            {ko.cart.continueShopping}
          </Button>
        </div>
      </div>
    </div>
  );
}
