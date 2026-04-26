'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, orderBy, query, limit, doc, getDoc } from 'firebase/firestore';
import { Sparkles } from 'lucide-react';
import { Loader2, ShoppingBag, ImageOff, Zap } from 'lucide-react';
import type { DreamReport } from '@/app/api/dream/route';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFirebaseDb } from '@/lib/firebase/client';
import { PRODUCT_PRESETS } from '@/lib/presets/products';
import { STYLES } from '@/lib/presets/styles';
import { ko } from '@/lib/i18n/ko';

interface Generation {
  id: string;
  outputImagePath: string;
  presets?: { styleId?: string; customPrompt?: string };
  createdAt: { toDate?: () => Date } | Date | null;
  status: string;
}

interface DreamResult {
  id: string;
  career: string;
  age: number;
  outputImageUrl: string;
  report: DreamReport;
  createdAt: { toDate?: () => Date } | Date | null;
}

interface UserDoc {
  credits: number;
  plan: 'free' | 'personal' | 'pro';
}

function toDate(ts: Generation['createdAt']): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  return (ts as { toDate?: () => Date }).toDate?.() ?? null;
}

function formatDate(ts: Generation['createdAt']) {
  const d = toDate(ts);
  if (!d) return '-';
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(ts: Generation['createdAt']) {
  const d = toDate(ts);
  if (!d) return '-';
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getStyleName(styleId?: string) {
  if (!styleId) return null;
  return STYLES.find((s) => s.id === styleId)?.name ?? styleId;
}

/* ── 모달 ──────────────────────────────────────────────────── */

function GenerationModal({
  gen,
  open,
  onClose,
  onOrder,
}: {
  gen: Generation | null;
  open: boolean;
  onClose: () => void;
  onOrder: (productId: string, gen: Generation) => void;
}) {
  if (!gen) return null;
  const styleName = getStyleName(gen.presets?.styleId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl w-full p-0 overflow-hidden rounded-2xl gap-0 border-border/60 bg-background">
        {/* 이미지 */}
        <div className="w-full bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gen.outputImagePath}
            alt="생성 이미지"
            className="w-full object-contain max-h-[80vh]"
          />
        </div>

        {/* 정보 + 버튼 */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-white border-t border-border/40">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{formatDateTime(gen.createdAt)}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {styleName && <Badge variant="outline" className="text-xs">{styleName}</Badge>}
              {gen.presets?.customPrompt && (
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  &ldquo;{gen.presets.customPrompt}&rdquo;
                </span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1.5 shrink-0">
                <ShoppingBag className="size-4" />
                주문하기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {PRODUCT_PRESETS.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => { onClose(); onOrder(p.id, gen); }}>
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── 메인 페이지 ─────────────────────────────────────────── */

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [dreams, setDreams] = useState<DreamResult[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selected, setSelected] = useState<Generation | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }

    const db = getFirebaseDb();
    Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDocs(query(collection(db, 'users', user.uid, 'generations'), orderBy('createdAt', 'desc'), limit(60))),
      getDocs(query(collection(db, 'users', user.uid, 'dreams'), orderBy('createdAt', 'desc'), limit(20))),
    ]).then(([userSnap, genSnap, dreamSnap]) => {
      if (userSnap.exists()) setUserDoc(userSnap.data() as UserDoc);
      setGenerations(genSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Generation)));
      setDreams(dreamSnap.docs.map((d) => ({ id: d.id, ...d.data() } as DreamResult)));
    }).finally(() => setLoadingData(false));
  }, [user, authLoading, router]);

  if (authLoading || loadingData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  const initials = user.displayName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const planLabel = userDoc ? ko.profile.plan[userDoc.plan] : ko.profile.plan.free;

  function handleOrder(productId: string, gen: Generation) {
    const params = new URLSearchParams({ img: gen.outputImagePath, gid: gen.id });
    router.push(`/product/${productId}?${params.toString()}`);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8 flex flex-col gap-10">

        {/* 유저 정보 */}
        <div className="flex items-center gap-5 rounded-2xl border border-border/40 bg-muted/20 p-6">
          <Avatar className="size-16 shrink-0">
            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ''} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-lg font-semibold truncate">{user.displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{planLabel}</Badge>
              {userDoc && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="size-3" />
                  {ko.credits.badge.replace('{{count}}', String(userDoc.credits))}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => router.push('/orders')}>
              주문 내역
            </Button>
          </div>
        </div>

        {/* 생성 이미지 갤러리 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {ko.profile.myImages}
            </h2>
            {generations.length > 0 && (
              <span className="text-xs text-muted-foreground">{generations.length}개</span>
            )}
          </div>

          {generations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 py-16 text-center">
              <ImageOff className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{ko.profile.empty}</p>
              <p className="text-xs text-muted-foreground/70">{ko.profile.emptyHint}</p>
              <Button variant="outline" size="sm" className="mt-2 rounded-xl" onClick={() => router.push('/studio')}>
                Studio 열기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {generations.map((gen) => (
                <div key={gen.id} className="group relative flex flex-col gap-1.5">
                  {/* 썸네일 — 클릭 시 모달 */}
                  <button
                    onClick={() => setSelected(gen)}
                    className="aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gen.outputImagePath}
                      alt="생성 이미지"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                  <p className="text-[10px] text-muted-foreground px-0.5">{formatDate(gen.createdAt)}</p>

                  {/* hover 주문 버튼 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-xl gap-1.5 text-xs h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ShoppingBag className="size-3" />
                        주문
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      {PRODUCT_PRESETS.map((p) => (
                        <DropdownMenuItem key={p.id} onClick={() => handleOrder(p.id, gen)}>
                          {p.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Dream 기록 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              {ko.dream.myDreams}
            </h2>
            {dreams.length > 0 && (
              <span className="text-xs text-muted-foreground">{dreams.length}개</span>
            )}
          </div>

          {dreams.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-10 text-center">
              <Sparkles className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{ko.dream.dreamsEmpty}</p>
              <p className="text-xs text-muted-foreground/70">{ko.dream.dreamsEmptyHint}</p>
              <Button variant="outline" size="sm" className="mt-1 rounded-xl gap-1.5" onClick={() => router.push('/dream')}>
                <Sparkles className="size-3.5" />
                Dream 열기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {dreams.map((dream) => (
                <div key={dream.id} className="flex flex-col gap-1.5">
                  <div className="aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dream.outputImageUrl}
                      alt={dream.career}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="px-0.5">
                    <p className="text-xs font-medium truncate">{dream.career} · {dream.age}살</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(dream.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 이미지 상세 모달 */}
      <GenerationModal
        gen={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onOrder={handleOrder}
      />
    </div>
  );
}
