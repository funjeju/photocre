import type { Metadata } from 'next';
import { Inter, Noto_Sans_KR, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/firebase/auth-context';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
  weight: ['400', '500', '700'],
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Framelab — 감성 이미지 스튜디오',
  description:
    '프레임·배경·스타일·텍스트를 조합해 감성 이미지를 만들고, 템플릿으로 저장해 다음 사진에도 동일한 느낌을 빠르게 적용하세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${inter.variable} ${notoSansKR.variable} ${playfairDisplay.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
