'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ArrowLeft, Sparkles, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { COVER_TEMPLATES, type CoverTemplate } from '@/lib/presets/cover-templates';
import { useAuth } from '@/lib/firebase/auth-context';
import { cn } from '@/lib/utils';

const CoverTextEditor = dynamic(
  () => import('./cover-text-editor').then((m) => m.CoverTextEditor),
  { ssr: false },
);

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function PhotoSlot({
  index,
  src,
  onChange,
  onRemove,
}: {
  index: number;
  src: string | null;
  onChange: (src: string, blob: Blob) => void;
  onRemove: () => void;
}) {
  const handleFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      onChange(url, file);
    },
    [onChange],
  );

  if (src) {
    return (
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border">
        <Image src={src} alt={`photo ${index + 1}`} fill className="object-cover" />
        <button
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 bg-background/80 rounded-full p-0.5 hover:bg-background"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-foreground/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40">
      <Plus className="size-5 text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground">사진 {index + 1}</span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </label>
  );
}

export function CoverEditor() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<CoverTemplate | null>(null);
  const [photos, setPhotos] = useState<{ url: string; blob: Blob }[]>([]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  function selectTemplate(t: CoverTemplate) {
    setSelected(t);
    setPhotos([]);
    setTexts({});
    setResultUrl(null);
  }

  function setPhoto(i: number, url: string, blob: Blob) {
    setPhotos((prev) => {
      const next = [...prev];
      next[i] = { url, blob };
      return next;
    });
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleGenerate() {
    if (!user || !selected || photos.length === 0) return;
    setIsGenerating(true);
    setResultUrl(null);
    try {
      const idToken = await user.getIdToken();
      const photoBase64s = await Promise.all(photos.map((p) => blobToBase64(p.blob)));
      const photoTypes = photos.map((p) => p.blob.type || 'image/jpeg');

      const res = await fetch('/api/cover-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          templateId: selected.id,
          photoBase64s,
          photoTypes,
          texts,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'INSUFFICIENT_CREDITS') {
          toast.error('크레딧이 부족합니다.');
        } else {
          toast.error(data.error ?? '생성 실패. 다시 시도해주세요.');
        }
        return;
      }

      setResultUrl(data.outputUrl);
      toast.success('커버 생성 완료!');
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }

  if (resultUrl && selected) {
    return (
      <CoverTextEditor
        resultUrl={resultUrl}
        templateName={selected.name}
        onBack={() => setResultUrl(null)}
      />
    );
  }

  if (!selected) {
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="max-w-5xl mx-auto w-full px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1">AI 매거진 커버</h1>
            <p className="text-sm text-muted-foreground">
              잡지 커버 스타일을 선택하면 내 사진을 그 스타일로 합성해드립니다.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {COVER_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className="group flex flex-col gap-2 text-left focus:outline-none"
              >
                <div className={cn(
                  'aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all',
                  'border-border group-hover:border-foreground/30 group-hover:shadow-md',
                )}>
                  <Image
                    src={t.imagePath}
                    alt={t.name}
                    width={200}
                    height={267}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    사진 최대 {t.maxPhotos}장 · 1 크레딧
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const canGenerate = photos.length > 0 && !isGenerating;

  return (
    <div className="flex h-full overflow-hidden">
      {/* 좌측 컨트롤 패널 */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border shrink-0">
          <button
            onClick={() => { setSelected(null); setResultUrl(null); }}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <p className="text-sm font-semibold leading-tight">{selected.name}</p>
            <p className="text-[11px] text-muted-foreground">{selected.description}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          {/* 사진 업로드 */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              내 사진 ({photos.length}/{selected.maxPhotos}장)
            </p>
            <div className={cn('grid gap-2.5', selected.maxPhotos > 1 ? 'grid-cols-2' : 'grid-cols-1 max-w-[140px]')}>
              {Array.from({ length: selected.maxPhotos }, (_, i) => (
                <PhotoSlot
                  key={i}
                  index={i}
                  src={photos[i]?.url ?? null}
                  onChange={(url, blob) => setPhoto(i, url, blob)}
                  onRemove={() => removePhoto(i)}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              얼굴이 잘 보이는 사진을 올리면 더 잘 합성됩니다.
            </p>
          </div>

          {/* 편집 텍스트 */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              핵심 텍스트 편집
            </p>
            <p className="text-[11px] text-muted-foreground -mt-2">
              2-3개의 주요 텍스트만 편집할 수 있습니다. 나머지는 AI가 자동으로 채웁니다.
            </p>
            {selected.editableTexts.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label className="text-sm">{field.label}</Label>
                <Input
                  value={texts[field.key] ?? ''}
                  onChange={(e) => setTexts((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="text-sm rounded-xl"
                />
              </div>
            ))}
          </div>

          {/* 템플릿 참고 이미지 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              참고 템플릿
            </p>
            <div className="aspect-[3/4] w-28 rounded-xl overflow-hidden border border-border">
              <Image
                src={selected.imagePath}
                alt={selected.name}
                width={112}
                height={150}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-border shrink-0 flex flex-col gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full rounded-2xl gap-2 bg-accent hover:bg-accent/90 text-accent-foreground h-11 disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                생성 중... (30-60초)
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                커버 만들기
                <span className="ml-auto text-xs opacity-60 font-normal">1 크레딧</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 우측 프리뷰 */}
      <div className="flex-1 overflow-auto bg-muted/30 flex items-start justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            {resultUrl ? 'Result' : 'Template Reference'}
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxWidth: 340 }}
          >
            <Image
              src={resultUrl ?? selected.imagePath}
              alt={resultUrl ? '생성 결과' : selected.name}
              width={340}
              height={453}
              className="w-full object-cover"
              unoptimized={resultUrl?.startsWith('data:') ?? false}
            />
          </div>
          {!resultUrl && photos.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center max-w-[240px]">
              왼쪽에서 사진을 업로드하고 커버 만들기를 누르면 AI가 이 스타일로 합성합니다
            </p>
          )}
          {resultUrl && (
            <p className="text-[11px] text-muted-foreground">
              다시 만들려면 커버 만들기를 다시 누르세요 (1 크레딧 추가 소모)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
