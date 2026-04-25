'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/firebase/auth-context';
import { ko } from '@/lib/i18n/ko';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/studio');
  }, [user, loading, router]);

  async function handleLogin() {
    setSigningIn(true);
    await signInWithGoogle();
    setSigningIn(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── 좌측 콘텐츠 ── */}
      <div className="flex flex-1 flex-col justify-center px-12 py-16 lg:px-24">
        <div className="w-full max-w-lg">

          {/* 로고 */}
          <p className="mb-10 text-sm font-semibold tracking-tight text-accent">
            {ko.app.name}
          </p>

          {/* 오버라인 */}
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {ko.app.tagline}
          </p>

          {/* H1 */}
          <h1 className="mb-7 text-4xl font-semibold leading-[1.2] tracking-tight md:text-5xl">
            당신만의 감성을
            <br />
            <span className="text-accent">한 번의 클릭으로,</span>
            <br />
            계속 이어가세요.
          </h1>

          {/* 본문 */}
          <p className="mb-10 max-w-sm text-sm leading-7 text-muted-foreground">
            Framelab은 프레임·배경·스타일·텍스트를 조합해 감성 이미지를 만들고, 템플릿으로 저장해
            다음 사진에도 동일한 느낌을 빠르게 적용할 수 있는 AI 이미지 스튜디오입니다.
          </p>

          {/* CTA */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              onClick={handleLogin}
              disabled={signingIn}
              className="h-11 gap-2.5 rounded-2xl bg-accent px-6 text-accent-foreground hover:bg-accent/90"
            >
              {signingIn ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {signingIn ? ko.auth.loggingIn : ko.auth.loginButton}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 우측 프리뷰 (데스크탑) ── */}
      <div className="relative hidden lg:flex w-[45%] items-center justify-center overflow-hidden bg-muted/30">
        {/* SVG 도트 텍스처 */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="login-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-dots)" />
        </svg>

        {/* 목업 카드 — 폴라로이드 스타일 */}
        <div className="relative z-10 w-72 rotate-1 rounded-2xl border border-border bg-card p-4 shadow-lg">
          {/* 이미지 영역 */}
          <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-br from-stone-200 to-stone-300">
            {/* 해 지는 해변 느낌의 그라데이션 */}
            <div className="h-full w-full bg-gradient-to-b from-orange-200 via-amber-100 to-stone-200 opacity-80" />
          </div>
          {/* 폴라로이드 하단 캡션 영역 */}
          <div className="mt-3 flex flex-col items-center gap-1 pb-1">
            <p className="text-sm font-medium text-foreground/70">Good day :)</p>
          </div>
        </div>

        {/* 우측 하단 배지 */}
        <div className="absolute bottom-8 right-8 flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 backdrop-blur-sm shadow-sm">
          <div className="size-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-medium text-foreground/70">AI 이미지 생성 중</span>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
