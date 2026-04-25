'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFirebaseDb } from '@/lib/firebase/client';
import { useAuth } from '@/lib/firebase/auth-context';
import { ko } from '@/lib/i18n/ko';

export function CreditsBadge({ className }: { className?: string }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const ref = doc(getFirebaseDb(), 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setCredits(snap.data().credits ?? 0);
    });
    return unsub;
  }, [user]);

  if (!user || credits === null) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1',
        className,
      )}
    >
      <Zap className="size-3.5 text-foreground/60" />
      <span className="text-xs font-medium text-foreground/80">
        {ko.credits.badge.replace('{{count}}', String(credits))}
      </span>
    </div>
  );
}
