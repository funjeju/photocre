'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Layers, History, Wand2, LogOut, BookImage, Newspaper } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth-context';
import { CreditsBadge } from '@/components/shared/credits-badge';
import { ko } from '@/lib/i18n/ko';

const NAV_ITEMS = [
  { href: '/studio', label: ko.nav.studio, icon: Wand2 },
  { href: '/cover', label: ko.nav.cover, icon: Newspaper },
  { href: '/magazine', label: ko.nav.magazine, icon: BookImage },
  { href: '/apply', label: ko.nav.apply, icon: Layers },
  { href: '/templates', label: ko.nav.templates, icon: LayoutGrid },
  { href: '/history', label: ko.nav.history, icon: History },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 md:px-6 lg:px-8">
        {/* 로고 */}
        <Link href="/studio" className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold tracking-tight text-accent">
            {ko.app.name}
          </span>
        </Link>

        {/* 탭 내비게이션 */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          <CreditsBadge />

          {/* 아바타 + 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                <Avatar className="size-8">
                  <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? ''} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium truncate">{user?.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive gap-2">
                <LogOut className="size-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 모바일 탭 바 */}
      <div className="flex md:hidden border-t border-border">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              pathname.startsWith(href)
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}
