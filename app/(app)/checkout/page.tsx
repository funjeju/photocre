'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, MapPin, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useCartStore } from '@/lib/store/cart';
import { useAuth } from '@/lib/firebase/auth-context';
import { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from '@/lib/presets/products';
import { ko } from '@/lib/i18n/ko';

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: { zonecode: string; roadAddress: string }) => void }) => { open: () => void };
    };
  }
}

function formatPrice(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

const FormSchema = z.object({
  name:          z.string().min(1, ko.checkout.required),
  phone:         z.string().min(9, ko.checkout.required),
  zipCode:       z.string().length(5, ko.checkout.required),
  address:       z.string().min(1, ko.checkout.required),
  addressDetail: z.string().optional(),
  memo:          z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalPrice, clear } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const postcodeRef = useRef<HTMLScriptElement | null>(null);

  const subtotal = totalPrice();
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  useEffect(() => {
    if (items.length === 0) router.replace('/cart');
  }, [items, router]);

  // 다음 우편번호 API 동적 로드
  useEffect(() => {
    if (postcodeRef.current) return;
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    postcodeRef.current = script;
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  function openPostcode() {
    if (!window.daum?.Postcode) { toast.error('주소 검색을 불러오는 중입니다.'); return; }
    new window.daum.Postcode({
      oncomplete: (data) => {
        setValue('zipCode', data.zonecode, { shouldValidate: true });
        setValue('address', data.roadAddress, { shouldValidate: true });
      },
    }).open();
  }

  async function onSubmit(values: FormValues) {
    if (!user) { toast.error(ko.errors.unauthorized); return; }
    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId:       i.productId,
            productName:     i.productName,
            customImageUrl:  i.customImageUrl,
            generationId:    i.generationId,
            selectedOptions: i.selectedOptions,
            quantity:        i.quantity,
            unitPrice:       i.unitPrice,
          })),
          totalPrice: subtotal,
          shippingFee,
          shippingAddress: values,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? ko.errors.unknown); return; }
      clear();
      router.push(`/orders/${data.orderId}`);
    } catch {
      toast.error(ko.errors.network);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">{ko.checkout.title}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
          {/* 배송지 폼 */}
          <div className="flex flex-col gap-5 rounded-2xl border border-border/60 p-6">
            <h2 className="font-semibold flex items-center gap-2">
              <MapPin className="size-4" />
              배송지 정보
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>{ko.checkout.name}</Label>
                <Input {...register('name')} placeholder="홍길동" className="rounded-xl" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{ko.checkout.phone}</Label>
                <Input {...register('phone')} placeholder={ko.checkout.phonePlaceholder} className="rounded-xl" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{ko.checkout.zipCode}</Label>
              <div className="flex gap-2">
                <Input
                  {...register('zipCode')}
                  placeholder="12345"
                  className="rounded-xl w-32"
                  readOnly
                />
                <Button type="button" variant="outline" onClick={openPostcode} className="rounded-xl gap-1.5">
                  <MapPin className="size-4" />
                  {ko.checkout.searchAddress}
                </Button>
              </div>
              {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{ko.checkout.address}</Label>
              <Input {...register('address')} readOnly className="rounded-xl bg-muted/30" />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{ko.checkout.addressDetail}</Label>
              <Input {...register('addressDetail')} placeholder="상세 주소 (동/호수 등)" className="rounded-xl" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{ko.checkout.memo}</Label>
              <Input {...register('memo')} placeholder={ko.checkout.memoPlaceholder} className="rounded-xl" />
            </div>
          </div>

          {/* 주문 내역 */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border/60 p-6">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingBag className="size-4" />
              {ko.checkout.orderSummary}
            </h2>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted/40">
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
            <Separator />
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">상품 금액</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{ko.shop.shippingFee}</span>
                <span className={shippingFee === 0 ? 'text-accent font-medium' : ''}>
                  {shippingFee === 0 ? ko.shop.freeShipping : formatPrice(shippingFee)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>{ko.shop.total}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* 결제 방법 */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 p-6">
            <h2 className="font-semibold">{ko.checkout.paymentMethod}</h2>
            <div className="flex items-center gap-3 rounded-xl border-2 border-accent bg-accent/5 p-4">
              <div className="size-2 rounded-full bg-accent" />
              <div>
                <p className="font-medium text-sm">{ko.checkout.bankTransfer}</p>
                <p className="text-xs text-muted-foreground">{ko.checkout.bankInfo}</p>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="h-12 rounded-2xl text-base gap-2">
            {submitting ? (
              <><Loader2 className="size-5 animate-spin" />{ko.checkout.placing}</>
            ) : (
              <>{ko.checkout.placeOrder} · {formatPrice(total)}</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
