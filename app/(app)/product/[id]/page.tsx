'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import {
  getAllSlotConfigs, DEFAULT_SLOT_CONFIGS, SlotConfig,
} from '@/lib/firebase/mockup-configs';

/* ── Canvas helpers (mirrors mockup-preview logic) ── */

function drawAffine3(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  s0x: number, s0y: number, s1x: number, s1y: number, s2x: number, s2y: number,
  d0x: number, d0y: number, d1x: number, d1y: number, d2x: number, d2y: number,
) {
  const det = s0x*(s1y-s2y) + s1x*(s2y-s0y) + s2x*(s0y-s1y);
  if (Math.abs(det) < 0.001) return;
  const a=(d0x*(s1y-s2y)+d1x*(s2y-s0y)+d2x*(s0y-s1y))/det;
  const b=(d0y*(s1y-s2y)+d1y*(s2y-s0y)+d2y*(s0y-s1y))/det;
  const c=(s0x*(d1x-d2x)+s1x*(d2x-d0x)+s2x*(d0x-d1x))/det;
  const d=(s0x*(d1y-d2y)+s1x*(d2y-d0y)+s2x*(d0y-d1y))/det;
  const e=(s0x*(s1y*d2x-s2y*d1x)+s1x*(s2y*d0x-s0y*d2x)+s2x*(s0y*d1x-s1y*d0x))/det;
  const f=(s0x*(s1y*d2y-s2y*d1y)+s1x*(s2y*d0y-s0y*d2y)+s2x*(s0y*d1y-s1y*d0y))/det;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(d0x,d0y); ctx.lineTo(d1x,d1y); ctx.lineTo(d2x,d2y);
  ctx.closePath(); ctx.clip();
  ctx.transform(a,b,c,d,e,f); ctx.drawImage(img,0,0);
  ctx.restore();
}

function quadWarp(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  x0:number, y0:number, x1:number, y1:number,
  x2:number, y2:number, x3:number, y3:number, zoom=1,
) {
  const iw=img.naturalWidth, ih=img.naturalHeight;
  const dw=Math.max(x1-x0,x2-x3), dh=Math.max(y3-y0,y2-y1);
  const da=dw/dh, ia=iw/ih;
  let sx=0,sy=0,sw=iw,sh=ih;
  if(ia>da){sw=ih*da;sx=(iw-sw)/2;}else{sh=iw/da;sy=(ih-sh)/2;}
  if(zoom!==1){const zw=sw/zoom,zh=sh/zoom;sx+=(sw-zw)/2;sy+=(sh-zh)/2;sw=zw;sh=zh;}
  const ex=sx+sw,ey=sy+sh;
  drawAffine3(ctx,img,sx,sy,ex,sy,sx,ey, x0,y0,x1,y1,x3,y3);
  drawAffine3(ctx,img,ex,sy,ex,ey,sx,ey, x1,y1,x2,y2,x3,y3);
}

function drawSlot(
  ctx: CanvasRenderingContext2D, userImg: HTMLImageElement,
  W: number, H: number, cfg: SlotConfig,
) {
  const cx=cfg.x*W, cy=cfg.y*H, sw=cfg.w*W, sh=cfg.h*H;
  const rad=(cfg.rotation*Math.PI)/180, cos=Math.cos(rad), sin=Math.sin(rad);
  ctx.save();
  ctx.globalCompositeOperation = cfg.blendMode as GlobalCompositeOperation;
  ctx.globalAlpha = cfg.opacity;
  const f: string[] = [];
  if (cfg.brightness!==1) f.push(`brightness(${cfg.brightness})`);
  if (cfg.saturation!==1) f.push(`saturate(${cfg.saturation})`);
  if (cfg.sepia!==0)      f.push(`sepia(${cfg.sepia})`);
  if (f.length) ctx.filter = f.join(' ');
  if (cfg.shape === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, sw/2, sh/2, rad, 0, Math.PI*2);
    ctx.clip();
    const iw=userImg.naturalWidth, ih=userImg.naturalHeight;
    const sc=Math.max(sw/iw, sh/ih)*cfg.zoom;
    ctx.translate(cx, cy); ctx.rotate(rad);
    ctx.drawImage(userImg, -(iw*sc)/2, -(ih*sc)/2, iw*sc, ih*sc);
  } else if (cfg.cylinderCurve) {
    const fov = cfg.cylinderFov ?? 0;
    const arc = sh * cfg.cylinderCurve;
    const x0 = cx - sw / 2, y0 = cy - sh / 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + arc);
    ctx.quadraticCurveTo(cx, y0 - arc, x0 + sw, y0 + arc);
    ctx.lineTo(x0 + sw, y0 + sh - arc);
    ctx.quadraticCurveTo(cx, y0 + sh + arc, x0, y0 + sh - arc);
    ctx.closePath(); ctx.clip();
    const iw = userImg.naturalWidth, ih = userImg.naturalHeight;
    const da = sw / sh, ia = iw / ih;
    let sx = 0, sy = 0, srcW = iw, srcH = ih;
    if (ia > da) { srcW = ih * da; sx = (iw - srcW) / 2; }
    else         { srcH = iw / da; sy = (ih - srcH) / 2; }
    if (cfg.zoom !== 1) {
      const zw = srcW / cfg.zoom, zh = srcH / cfg.zoom;
      sx += (srcW - zw) / 2; sy += (srcH - zh) / 2; srcW = zw; srcH = zh;
    }
    if (fov > 0) {
      const STRIPS = 60, sinHalf = Math.sin(fov / 2);
      for (let i = 0; i < STRIPS; i++) {
        const t0 = i / STRIPS, t1 = (i + 1) / STRIPS;
        const dx0 = x0 + sw * (Math.sin((t0 - 0.5) * fov) + sinHalf) / (2 * sinHalf);
        const dx1 = x0 + sw * (Math.sin((t1 - 0.5) * fov) + sinHalf) / (2 * sinHalf);
        if (dx1 <= dx0) continue;
        ctx.drawImage(userImg, sx + t0 * srcW, sy, (t1 - t0) * srcW, srcH, dx0, y0, dx1 - dx0, sh);
      }
    } else {
      ctx.drawImage(userImg, sx, sy, srcW, srcH, x0, y0, sw, sh);
    }
  } else if (cfg.quad) {
    const {tl,tr,br,bl} = cfg.quad;
    quadWarp(ctx, userImg, tl[0]*W,tl[1]*H, tr[0]*W,tr[1]*H, br[0]*W,br[1]*H, bl[0]*W,bl[1]*H, cfg.zoom);
  } else {
    const tlx=cx-sw/2*cos+sh/2*sin, tly=cy-sw/2*sin-sh/2*cos;
    const trx=cx+sw/2*cos+sh/2*sin, trY=cy+sw/2*sin-sh/2*cos;
    const brx=cx+sw/2*cos-sh/2*sin, bry=cy+sw/2*sin+sh/2*cos;
    const blx=cx-sw/2*cos-sh/2*sin, bly=cy-sw/2*sin+sh/2*cos;
    quadWarp(ctx, userImg, tlx,tly, trx,trY, brx,bry, blx,bly, cfg.zoom);
  }
  ctx.restore();
}

const SCALE = 2;

/* ── Page ── */

function formatPrice(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const product = PRODUCT_MAP[productId];

  const studioImageUrl = useStudioStore((s) => s.generatedImageUrl);
  const studioGenId    = useStudioStore((s) => s.generationId);
  const imgParam = searchParams.get('img');
  const gidParam = searchParams.get('gid');
  const generatedImageUrl = imgParam ?? studioImageUrl;
  const generationId      = gidParam ?? studioGenId;
  const addItem           = useCartStore((s) => s.addItem);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    product?.options.forEach((o) => { defaults[o.key] = o.values[0]; });
    return defaults;
  });
  const [quantity, setQuantity] = useState(1);

  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slotConfigs, setSlotConfigs] = useState<Record<string, SlotConfig>>(DEFAULT_SLOT_CONFIGS);
  const [productImg, setProductImg] = useState<HTMLImageElement | null>(null);
  const [userImg, setUserImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!product) router.replace('/studio');
  }, [product, router]);

  useEffect(() => {
    getAllSlotConfigs().then(setSlotConfigs);
  }, []);

  useEffect(() => {
    if (!product) return;
    const img = new window.Image();
    img.onload = () => setProductImg(img);
    img.src = product.mockupSrc;
  }, [product]);

  useEffect(() => {
    if (!generatedImageUrl) { setUserImg(null); return; }
    const img = new window.Image();
    img.onload = () => setUserImg(img);
    img.src = generatedImageUrl;
  }, [generatedImageUrl]);

  // Render composite onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !product || !productImg) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = product.canvasW;
    const H = product.canvasH;
    ctx.clearRect(0, 0, W * SCALE, H * SCALE);
    ctx.save();
    ctx.scale(SCALE, SCALE);
    ctx.drawImage(productImg, 0, 0, W, H);
    if (userImg) {
      for (const id of product.slotIds) {
        const cfg = slotConfigs[id];
        if (cfg) drawSlot(ctx, userImg, W, H, cfg);
      }
    }
    ctx.restore();
  }, [productImg, userImg, slotConfigs, product]);

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
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          뒤로가기
        </button>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* 합성 미리보기 */}
          <div className="flex flex-col gap-3">
            <div
              className="w-full overflow-hidden rounded-2xl bg-muted/40 border border-border/40"
              style={{ aspectRatio: `${product.canvasW} / ${product.canvasH}` }}
            >
              <canvas
                ref={canvasRef}
                width={product.canvasW * SCALE}
                height={product.canvasH * SCALE}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                className="rounded-2xl"
              />
            </div>

            {!generatedImageUrl && (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/60 bg-muted/20">
                <Package className="size-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{ko.shop.noImage}</p>
                <Button variant="outline" size="sm" onClick={() => router.push('/studio')} className="rounded-xl ml-1">
                  {ko.shop.goStudio}
                </Button>
              </div>
            )}
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
