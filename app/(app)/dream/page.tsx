'use client';

import { useRef, useState } from 'react';
import { Sparkles, Upload, Printer, RotateCcw, ChevronRight, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/firebase/auth-context';
import { ko } from '@/lib/i18n/ko';
import type { DreamReport } from '@/app/api/dream/route';

/* ── image helper ──────────────────────────────────────────── */

async function fileToResized(file: File, maxSide = 1024): Promise<{ base64: string; type: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      const { naturalWidth: nw, naturalHeight: nh } = img;
      const scale = Math.min(1, maxSide / Math.max(nw, nh));
      const w = Math.round(nw * scale), h = Math.round(nh * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/webp', 0.85);
      URL.revokeObjectURL(blobUrl);
      resolve({ base64: dataUrl.replace(/^data:[^;]+;base64,/, ''), type: 'image/webp', previewUrl: dataUrl });
    };
    img.onerror = reject;
    img.src = blobUrl;
  });
}

/* ── Report card subcomponents ─────────────────────────────── */

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium">
          {item}
        </span>
      ))}
    </div>
  );
}

function PathStep({ step, index }: { step: string; index: number }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold mt-0.5">
        {index + 1}
      </div>
      <p className="text-sm leading-relaxed">{step}</p>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */

export default function DreamPage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [photo, setPhoto] = useState<{ base64: string; type: string; previewUrl: string } | null>(null);
  const [career, setCareer] = useState('');
  const [age, setAge] = useState(25);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string; report: DreamReport; career: string; age: number } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('파일 크기가 10MB를 초과합니다.'); return; }
    try {
      const resized = await fileToResized(file);
      setPhoto(resized);
    } catch {
      toast.error('이미지 처리에 실패했습니다.');
    }
    e.target.value = '';
  }

  async function handleGenerate() {
    if (!photo) { toast.error(ko.dream.noPhoto); return; }
    if (!career.trim()) { toast.error(ko.dream.noCareer); return; }
    if (!user) { toast.error(ko.errors.unauthorized); return; }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: photo.base64, imageType: photo.type, career: career.trim(), age }),
      });
      if (!res.ok) {
        const data = await res.json() as { code?: string };
        if (data.code === 'INSUFFICIENT_CREDITS') { toast.error(ko.credits.insufficient); return; }
        throw new Error('Generation failed');
      }
      const data = await res.json() as { outputUrl: string; report: DreamReport };
      setResult({ imageUrl: data.outputUrl, report: data.report, career: career.trim(), age });
    } catch {
      toast.error(ko.errors.unknown);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setPhoto(null);
    setCareer('');
    setAge(25);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 lg:px-8 flex flex-col gap-8">

        {/* Header */}
        <div className="print:hidden">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="size-6 text-accent" />
            {ko.dream.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{ko.dream.subtitle}</p>
        </div>

        {/* ── Input form (hidden after result) ── */}
        {!result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Photo upload */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium">{ko.dream.photoLabel}</span>
              <button
                onClick={() => fileRef.current?.click()}
                className="relative flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 transition-all hover:border-accent/60 hover:bg-muted/40 overflow-hidden"
              >
                {photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={photo.previewUrl} alt="업로드된 사진" className="absolute inset-0 h-full w-full object-cover rounded-2xl" />
                ) : (
                  <>
                    <User className="size-10 text-muted-foreground/40" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">클릭해서 사진 업로드</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{ko.dream.photoHint}</p>
                    </div>
                    <Upload className="size-4 text-muted-foreground/40" />
                  </>
                )}
                {photo && (
                  <div className="absolute inset-0 flex items-end justify-center pb-4 bg-gradient-to-t from-black/40 to-transparent rounded-2xl">
                    <span className="text-xs text-white font-medium flex items-center gap-1.5">
                      <Upload className="size-3" />다른 사진 선택
                    </span>
                  </div>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
            </div>

            {/* Form */}
            <div className="flex flex-col gap-5 justify-center">
              {/* Career */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{ko.dream.careerLabel}</label>
                <input
                  type="text"
                  value={career}
                  onChange={(e) => setCareer(e.target.value)}
                  placeholder={ko.dream.careerPlaceholder}
                  maxLength={40}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/40 placeholder:text-muted-foreground/50"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                />
              </div>

              {/* Age */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{ko.dream.ageLabel}</label>
                  <span className="text-sm font-semibold text-accent">{age}살</span>
                </div>
                <input
                  type="range" min={18} max={60} step={1} value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-1.5 cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/60">
                  <span>18세</span><span>40세</span><span>60세</span>
                </div>
              </div>

              <Separator />

              {/* Generate button */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !photo || !career.trim()}
                  className="h-12 rounded-2xl gap-2 text-base bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <Sparkles className="size-5 animate-pulse" />
                      {ko.dream.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-5" />
                      {ko.dream.generateButton}
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">{ko.dream.creditNote}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {result && (
          <div ref={printRef} className="flex flex-col gap-6">

            {/* Action buttons */}
            <div className="flex items-center justify-between print:hidden">
              <h2 className="text-lg font-semibold">{ko.dream.resultTitle} — {result.career} · {result.age}살</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => window.print()}>
                  <Printer className="size-4" />
                  {ko.dream.printButton}
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={handleReset}>
                  <RotateCcw className="size-4" />
                  {ko.dream.resetButton}
                </Button>
              </div>
            </div>

            {/* Print-only header */}
            <div className="hidden print:block text-center mb-4">
              <h1 className="text-2xl font-bold">✦ Dream — {result.career} · {result.age}살</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generated image */}
              <div className="flex flex-col gap-3">
                <div className="overflow-hidden rounded-2xl border border-border/40 shadow-sm aspect-square bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.imageUrl} alt={`${result.age}살 ${result.career}`} className="h-full w-full object-cover" />
                </div>
                {/* Original photo thumb */}
                {photo && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground print:hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.previewUrl} alt="원본" className="size-8 rounded-lg object-cover border border-border/40" />
                    원본 → AI 생성 이미지
                  </div>
                )}
              </div>

              {/* Report card */}
              <div className="flex flex-col gap-5 rounded-2xl border border-border/40 bg-muted/10 p-6">
                {/* Headline */}
                <div>
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">{result.career}</p>
                  <h3 className="text-xl font-bold leading-snug">{result.report.headline}</h3>
                </div>

                <Separator />

                {/* Summary */}
                <p className="text-sm leading-relaxed text-muted-foreground">{result.report.summary}</p>

                {/* Strengths + Skills */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ko.dream.strengths}</p>
                    <TagList items={result.report.strengths} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ko.dream.skills}</p>
                    <TagList items={result.report.skills} />
                  </div>
                </div>

                <Separator />

                {/* Career path */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ko.dream.careerPath}</p>
                  <div className="flex flex-col gap-2.5">
                    {result.report.path.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-[10px] font-bold mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm leading-relaxed">{step}</p>
                        {i < result.report.path.length - 1 && (
                          <ChevronRight className="size-3.5 text-muted-foreground/40 shrink-0 mt-1 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Encouragement message */}
            <div className="rounded-2xl border border-accent/30 bg-accent/5 px-6 py-5">
              <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{ko.dream.encouragement}</p>
              <p className="text-base leading-relaxed font-medium">{result.report.message}</p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
