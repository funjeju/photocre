'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, orderBy, query, limit, doc, getDoc } from 'firebase/firestore';
import { Loader2, ShoppingBag, ImageOff, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFirebaseDb } from '@/lib/firebase/client';
import { PRODUCT_PRESETS } from '@/lib/presets/products';
import { ko } from '@/lib/i18n/ko';

interface Generation {
  id: string;
  outputImagePath: string;
  createdAt: { toDate?: () => Date } | Date | null;
  status: string;
}

interface UserDoc {
  credits: number;
  plan: 'free' | 'personal' | 'pro';
}

function formatDate(ts: Generation['createdAt']) {
  if (!ts) return '';
  const d = ts instanceof Date ? ts : (ts as { toDate?: () => Date }).toDate?.() ?? new Date();
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }

    const db = getFirebaseDb();
    Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDocs(query(
        collection(db, 'users', user.uid, 'generations'),
        orderBy('createdAt', 'desc'),
        limit(40),
      )),
    ]).then(([userSnap, genSnap]) => {
      if (userSnap.exists()) setUserDoc(userSnap.data() as UserDoc);
      setGenerations(genSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Generation)));
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
          <div className="ml-auto flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => router.push('/orders')}>
              주문 내역
            </Button>
          </div>
        </div>

        {/* 생성 이미지 갤러리 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {ko.profile.myImages}
          </h2>

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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {generations.map((gen) => (
                <div key={gen.id} className="group relative flex flex-col gap-2">
                  <div className="aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gen.outputImagePath}
                      alt="생성 이미지"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground px-0.5">{formatDate(gen.createdAt)}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-xl gap-1.5 text-xs h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ShoppingBag className="size-3.5" />
                        {ko.profile.orderWith}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      {PRODUCT_PRESETS.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => handleOrder(p.id, gen)}
                          className="text-sm"
                        >
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

      </div>
    </div>
  );
}
