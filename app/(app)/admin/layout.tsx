'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth-context';
import { ko } from '@/lib/i18n/ko';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    user.getIdToken().then((token) =>
      fetch('/api/admin/verify', { headers: { Authorization: `Bearer ${token}` } })
    ).then((r) => r.json()).then(({ isOwner }: { isOwner: boolean }) => {
      setIsOwner(!!isOwner);
      if (!isOwner) router.replace('/studio');
    }).catch(() => {
      setIsOwner(false);
      router.replace('/studio');
    });
  }, [user, authLoading, router]);

  if (authLoading || isOwner === null) {
    return <div className="flex flex-1 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isOwner) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldAlert className="size-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">접근 권한이 없습니다.</p>
      </div>
    );
  }

  const tabs = [
    { href: '/admin/orders',   label: ko.admin.orders },
    { href: '/admin/products', label: ko.admin.products },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border/60 bg-muted/20 px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-6 py-3">
          <span className="text-sm font-semibold text-accent">{ko.admin.title}</span>
          <nav className="flex gap-1">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(t.href)
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/60',
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
