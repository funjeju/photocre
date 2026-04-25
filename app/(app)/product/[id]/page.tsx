'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Minus, Plus, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStudioStore } from '@/lib/store/studio';
import { useCartStore } from '@/lib/store/cart';
import { PRODUCT_MAP, SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from '@/lib/presets/products';
import { ko } from '@/lib/i18n/ko';
import { cn } from '@/lib/utils';

function formatPrice(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const product = PRODUCT_MAP[productId];

  const generatedImageUrl = useStudioStore((s) => s.generatedImageUrl);
  const generationId      = useStudioStore((s) => s.generationId);
  const addItem           = useCartStore((s) => s.addItem);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    product?.options.forEach((o) => { defaults[o.key] = o.values[0]; });
    return defaults;
  });
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) router.replace('/studio');
  }, [product, router]);

  if (!product) return null;

  const allOptionsSelected = product.options.every((o) => selectedOptions[o.key]);
  const canAdd = !!generatedImageUrl && allOptionsSelected;
  const shippingLabel = (product.basePrice * quantity) >= FREE_SHIPPING_THRESHOLD
    ? ko.shop.freeShipping
    : formatPrice(SHIPPING_FEE);

  function handleAddToCart() {
    if (!generatedImageUrl) { toast.error(ko.shop.noImage); return; }
    addItem({
      productId: product.id,
      productName: product.name,
      customImageUrl: generatedImageUrl,
      generationId,
      selectedOptions,
      quantity,
      unitPrice: product.basePrice,
    });
    toast.success(`${product.name}을(를) 장바구니에 담았습니다.`);
  }

  function handleBuyNow() {
    if (!generatedImageUrl) { toast.error(ko.shop.noImage); return; }
    handleAddToCart();
    router.push('/cart');
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 lg:px-8">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          뒤로가기
        </button>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* 이미지 프리뷰 */}
          <div className="flex flex-col gap-4">
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-muted/40 border border-border/40">
              {generatedImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={generatedImageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <Package className="size-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{ko.shop.noImage}</p>
                  <Button variant="outline" size="sm" onClick={() => router.push('/studio')}>
                    {ko.shop.goStudio}
                  </Button>
                </div>
              )}
            </div>
            {/* 제품 사진 */}
            <div className="grid grid-cols-1 gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.mockupSrc}
                alt={`${product.name} 샘플`}
                className="w-full rounded-xl border border-border/40 object-cover"
              />
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatPrice(product.basePrice)}</span>
              <span className="text-sm text-muted-foreground">/ 1개</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="size-4" />
              {ko.shop.deliveryDays.replace('{{n}}', String(product.deliveryDays))}
            </div>

            <Separator />

            {/* 옵션 선택 */}
            {product.options.map((opt) => (
              <div key={opt.key} className="flex flex-col gap-2">
                <label className="text-sm font-medium">{opt.label}</label>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.key]: v }))}
                      className={cn(
                        'rounded-xl border px-4 py-2 text-sm font-medium transition-all',
                        selectedOptions[opt.key] === v
                          ? 'border-accent bg-accent/10 text-accent ring-2 ring-accent ring-offset-2'
                          : 'border-border hover:border-accent/60 hover:bg-muted/60',
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* 수량 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">{ko.shop.quantity}</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex size-9 items-center justify-center rounded-xl border border-border hover:bg-muted/60 transition-colors"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex size-9 items-center justify-center rounded-xl border border-border hover:bg-muted/60 transition-colors"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <Separator />

            {/* 금액 요약 */}
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">상품 금액</span>
                <span>{formatPrice(product.basePrice * quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{ko.shop.shippingFee}</span>
                <span className={product.basePrice * quantity >= FREE_SHIPPING_THRESHOLD ? 'text-accent font-medium' : ''}>
                  {shippingLabel}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>{ko.shop.total}</span>
                <span>
                  {formatPrice(
                    product.basePrice * quantity +
                    (product.basePrice * quantity >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE),
                  )}
                </span>
              </div>
            </div>

            {/* 커스텀 이미지 뱃지 */}
            {generatedImageUrl && (
              <Badge variant="outline" className="self-start text-xs gap-1.5">
                <span className="size-2 rounded-full bg-accent inline-block" />
                {ko.shop.customImage} 적용됨
              </Badge>
            )}

            {/* 버튼 */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleBuyNow}
                disabled={!canAdd}
                className="h-12 rounded-2xl gap-2 text-base"
              >
                <ShoppingBag className="size-5" />
                {ko.shop.buyNow}
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={!canAdd}
                variant="outline"
                className="h-12 rounded-2xl gap-2 text-base"
              >
                {ko.shop.addToCart}
              </Button>
              {!generatedImageUrl && (
                <p className="text-center text-xs text-muted-foreground">{ko.shop.noImage}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
