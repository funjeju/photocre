'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ArrowLeft, Sparkles, Loader2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
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

const MAX_PHOTO_PX = 1200;

function resizeToBase64(blob: Blob): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, MAX_PHOTO_PX / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (resized) => {
          if (!resized) { reject(new Error('canvas toBlob failed')); return; }
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const comma = result.indexOf(',');
            if (comma === -1) { reject(new Error('unexpected dataURL format')); return; }
            resolve({ base64: result.slice(comma + 1), mimeType: 'image/webp' });
          };
          reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
          reader.readAsDataURL(resized);
        },
        'image/webp',
        0.88,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
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
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  function selectTemplate(t: CoverTemplate) {
    setSelected(t);
    setPhotos([]);
    setTexts({});
    setResultUrl(null);
  }

  function switchTemplate(t: CoverTemplate) {
    setSelected(t);
    setTexts({});
    setResultUrl(null);
    // 사진은 새 템플릿 maxPhotos에 맞게 잘라냄
    setPhotos((prev) => prev.slice(0, t.maxPhotos));
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
      const idToken = await user.getIdToken(true);
      const resized = await Promise.all(photos.map((p) => resizeToBase64(p.blob)));
      const photoBase64s = resized.map((r) => r.base64);
      const photoTypes = resized.map((r) => r.mimeType);

      if (photoBase64s.some((b) => !b || b.length < 100)) {
        toast.error('사진을 읽을 수 없습니다. 다시 업로드해 주세요.');
        return;
      }

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
        } else if (data.code === 'INVALID_PHOTO') {
          toast.error('사진 데이터가 올바르지 않습니다. 사진을 다시 업로드해 주세요.');
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
        {/* 헤더 */}
        <div className="shrink-0 border-b border-border">
          <div className="flex items-center gap-2 px-5 py-3">
            <button
              onClick={() => { setSelected(null); setResultUrl(null); setShowTemplatePicker(false); }}
              className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{selected.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{selected.description}</p>
            </div>
            <button
              onClick={() => setShowTemplatePicker((v) => !v)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0',
                showTemplatePicker
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              )}
            >
              변경
              {showTemplatePicker ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>
          </div>

          {/* 인라인 템플릿 선택 드롭다운 */}
          {showTemplatePicker && (
            <div className="border-t border-border px-3 py-3 bg-muted/20">
              <p className="text-[10px] text-muted-foreground mb-2 px-1">템플릿 선택 (사진 유지)</p>
              <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto">
                {COVER_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { switchTemplate(t); setShowTemplatePicker(false); }}
                    className="flex flex-col gap-1 focus:outline-none group"
                  >
                    <div className={cn(
                      'aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all',
                      t.id === selected.id
                        ? 'border-accent ring-1 ring-accent'
                        : 'border-border group-hover:border-foreground/30',
                    )}>
                      <Image
                        src={t.imagePath}
                        alt={t.name}
                        width={70}
                        height={93}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className={cn(
                      'text-[9px] text-center leading-tight truncate w-full',
                      t.id === selected.id ? 'text-accent font-semibold' : 'text-muted-foreground',
                    )}>
                      {t.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
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

          {/* 핵심 텍스트 편집 */}
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

      {/* 우측: 프리뷰 + 템플릿 전환 */}
      <div className="flex-1 overflow-auto bg-muted/30 flex flex-col items-center gap-6 p-8">
        {/* 현재 템플릿 프리뷰 */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Template Reference</p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxWidth: 300 }}
          >
            <Image
              src={selected.imagePath}
              alt={selected.name}
              width={300}
              height={400}
              className="w-full object-cover"
            />
          </div>
          {photos.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center max-w-[240px]">
              사진을 업로드하고 커버 만들기를 누르면 AI가 이 스타일로 합성합니다
            </p>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          왼쪽 패널 상단 <strong>변경 ▾</strong> 버튼으로 다른 템플릿으로 바꿀 수 있습니다
        </p>
      </div>
    </div>
  );
}
