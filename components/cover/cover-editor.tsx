'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  ArrowLeft, Sparkles, Loader2, Plus, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { COVER_TEMPLATES, type CoverTemplate } from '@/lib/presets/cover-templates';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFirebaseDb } from '@/lib/firebase/client';
import { uploadUserCover, deleteUserCover, touchLastUsed, MAX_USER_COVERS } from '@/lib/user-covers';
import { UploadCoverCard } from './upload-cover-card';
import { UserCoverCard } from './user-cover-card';
import type { UserCover } from '@/types/user-cover';
import { cn } from '@/lib/utils';

const CoverTextEditor = dynamic(
  () => import('./cover-text-editor').then((m) => m.CoverTextEditor),
  { ssr: false },
);

// ── 선택된 커버 판별 타입 ─────────────────────────────────────
type SelectedCover =
  | { type: 'system'; template: CoverTemplate }
  | { type: 'user'; cover: UserCover };

function getMaxPhotos(sel: SelectedCover): number {
  return sel.type === 'system' ? sel.template.maxPhotos : sel.cover.maxPhotos;
}

function getCoverName(sel: SelectedCover): string {
  return sel.type === 'system' ? sel.template.name : (sel.cover.name || '나만의 커버');
}

function getCoverDescription(sel: SelectedCover): string {
  return sel.type === 'system' ? sel.template.description : `${sel.cover.maxPhotos}인용 · 내 커버`;
}

function getCoverPreviewUrl(sel: SelectedCover): string {
  return sel.type === 'system' ? sel.template.imagePath : sel.cover.thumbnailUrl;
}

// ── 이미지 리사이즈 유틸 (사진 슬롯용) ──────────────────────────
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

// ── 사진 슬롯 컴포넌트 ──────────────────────────────────────────
function PhotoSlot({
  index, src, onChange, onRemove,
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

// ── 메인 에디터 ─────────────────────────────────────────────────
export function CoverEditor() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<SelectedCover | null>(null);
  const [myCovers, setMyCovers] = useState<UserCover[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [photos, setPhotos] = useState<{ url: string; blob: Blob }[]>([]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // 사용자 커버 실시간 구독
  useEffect(() => {
    if (!user) return;
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'userCovers'),
      where('uid', '==', user.uid),
      orderBy('lastUsedAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMyCovers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserCover)));
    });
    return unsub;
  }, [user]);

  // ── 커버 선택 핸들러 ──
  function selectCover(cover: SelectedCover) {
    setSelected(cover);
    setPhotos([]);
    setTexts({});
    setResultUrl(null);
    setShowTemplatePicker(false);
    if (cover.type === 'user') {
      touchLastUsed(cover.cover.id);
    }
  }

  function switchSystemTemplate(t: CoverTemplate) {
    setSelected({ type: 'system', template: t });
    setTexts({});
    setResultUrl(null);
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

  // ── 사용자 커버 업로드 ──
  async function handleUpload(file: File, maxPhotos: 1 | 2) {
    if (!user) return;
    if (myCovers.length >= MAX_USER_COVERS) {
      toast.error(`커버는 최대 ${MAX_USER_COVERS}개까지 저장할 수 있습니다.`);
      return;
    }
    setIsUploading(true);
    try {
      const cover = await uploadUserCover(user.uid, file, maxPhotos, myCovers.length);
      toast.success('커버가 업로드되었습니다.');
      // 업로드 직후 자동 선택 (onSnapshot으로 myCovers 업데이트 전이라 직접 선택)
      setSelected({ type: 'user', cover });
      setPhotos([]);
      setTexts({});
      setResultUrl(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'COVER_LIMIT_REACHED') {
        toast.error(`커버는 최대 ${MAX_USER_COVERS}개까지 저장할 수 있습니다.`);
      } else {
        toast.error('업로드에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsUploading(false);
    }
  }

  // ── 사용자 커버 삭제 ──
  function handleDelete(coverId: string) {
    if (!user) return;
    toast('이 커버를 삭제할까요?', {
      action: {
        label: '삭제',
        onClick: async () => {
          try {
            await deleteUserCover(user.uid, coverId);
            // 삭제된 커버가 선택 중이었으면 선택 해제
            if (selected?.type === 'user' && selected.cover.id === coverId) {
              setSelected(null);
            }
            toast.success('커버가 삭제되었습니다.');
          } catch {
            toast.error('삭제에 실패했습니다.');
          }
        },
      },
      cancel: { label: '취소', onClick: () => {} },
    });
  }

  // ── AI 생성 ──
  async function handleGenerate() {
    if (!user || !selected || photos.length === 0) return;
    setIsGenerating(true);
    setResultUrl(null);
    try {
      const idToken = await user.getIdToken(true);
      const resized = await Promise.all(photos.map((p) => resizeToBase64(p.blob)));

      if (resized.some((r) => !r.base64 || r.base64.length < 100)) {
        toast.error('사진을 읽을 수 없습니다. 다시 업로드해 주세요.');
        return;
      }

      const bodyPayload = selected.type === 'system'
        ? {
          templateId: selected.template.id,
          photoBase64s: resized.map((r) => r.base64),
          photoTypes: resized.map((r) => r.mimeType),
          texts,
        }
        : {
          userCoverUrl: selected.cover.imageUrl,
          userCoverName: selected.cover.name || '나만의 커버',
          photoBase64s: resized.map((r) => r.base64),
          photoTypes: resized.map((r) => r.mimeType),
          texts: {},
        };

      const res = await fetch('/api/cover-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(bodyPayload),
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

      if (selected.type === 'user') {
        touchLastUsed(selected.cover.id);
      }

      setResultUrl(data.outputUrl);
      toast.success('커버 생성 완료!');
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }

  // ── 결과 뷰 ──
  if (resultUrl && selected) {
    return (
      <CoverTextEditor
        resultUrl={resultUrl}
        templateName={getCoverName(selected)}
        onBack={() => setResultUrl(null)}
      />
    );
  }

  // ── 커버 선택 그리드 ──
  if (!selected) {
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="max-w-5xl mx-auto w-full px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1">AI 매거진 커버</h1>
            <p className="text-sm text-muted-foreground">
              잡지 커버 스타일을 선택하거나 나만의 커버를 업로드하세요.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* 업로드 카드 */}
            <UploadCoverCard onUpload={handleUpload} isUploading={isUploading} />

            {/* 내 커버 */}
            {myCovers.map((cover) => (
              <UserCoverCard
                key={cover.id}
                cover={cover}
                isSelected={false}
                onSelect={() => selectCover({ type: 'user', cover })}
                onDelete={() => handleDelete(cover.id)}
              />
            ))}
          </div>

          {/* 시스템 템플릿 구분선 */}
          {myCovers.length > 0 && (
            <div className="flex items-center gap-4 my-6">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground shrink-0">시스템 템플릿</span>
              <Separator className="flex-1" />
            </div>
          )}

          {/* 시스템 템플릿 */}
          <div className={cn(
            'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4',
            myCovers.length > 0 && 'mt-0',
          )}>
            {COVER_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => selectCover({ type: 'system', template: t })}
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

  const maxPhotos = getMaxPhotos(selected);
  const canGenerate = photos.length > 0 && !isGenerating;

  // ── 편집 뷰 ──
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
              <p className="text-sm font-semibold leading-tight truncate">{getCoverName(selected)}</p>
              <p className="text-[11px] text-muted-foreground truncate">{getCoverDescription(selected)}</p>
            </div>

            {/* 시스템 템플릿만 인라인 전환 버튼 제공 */}
            {selected.type === 'system' && (
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
            )}
          </div>

          {/* 시스템 템플릿 전환 드롭다운 */}
          {selected.type === 'system' && showTemplatePicker && (
            <div className="border-t border-border px-3 py-3 bg-muted/20">
              <p className="text-[10px] text-muted-foreground mb-2 px-1">템플릿 선택 (사진 유지)</p>
              <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto">
                {COVER_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { switchSystemTemplate(t); setShowTemplatePicker(false); }}
                    className="flex flex-col gap-1 focus:outline-none group"
                  >
                    <div className={cn(
                      'aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all',
                      selected.type === 'system' && t.id === selected.template.id
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
                      selected.type === 'system' && t.id === selected.template.id
                        ? 'text-accent font-semibold'
                        : 'text-muted-foreground',
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
              내 사진 ({photos.length}/{maxPhotos}장)
            </p>
            <div className={cn('grid gap-2.5', maxPhotos > 1 ? 'grid-cols-2' : 'grid-cols-1 max-w-[140px]')}>
              {Array.from({ length: maxPhotos }, (_, i) => (
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

          {/* 핵심 텍스트 편집 — 시스템 템플릿만 */}
          {selected.type === 'system' && selected.template.editableTexts.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                핵심 텍스트 편집
              </p>
              <p className="text-[11px] text-muted-foreground -mt-2">
                2-3개의 주요 텍스트만 편집할 수 있습니다. 나머지는 AI가 자동으로 채웁니다.
              </p>
              {selected.template.editableTexts.map((field) => (
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
          )}

          {/* 커버 미리보기 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              참고 템플릿
            </p>
            <div className="aspect-[3/4] w-28 rounded-xl overflow-hidden border border-border">
              <Image
                src={getCoverPreviewUrl(selected)}
                alt={getCoverName(selected)}
                width={112}
                height={150}
                className="w-full h-full object-cover"
                unoptimized={selected.type === 'user'}
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

      {/* 우측: 프리뷰 */}
      <div className="flex-1 overflow-auto bg-muted/30 flex flex-col items-center gap-6 p-8">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Template Reference</p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxWidth: 300 }}
          >
            <Image
              src={getCoverPreviewUrl(selected)}
              alt={getCoverName(selected)}
              width={300}
              height={400}
              className="w-full object-cover"
              unoptimized={selected.type === 'user'}
            />
          </div>
          {photos.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center max-w-[240px]">
              사진을 업로드하고 커버 만들기를 누르면 AI가 이 스타일로 합성합니다
            </p>
          )}
        </div>

        {selected.type === 'system' && (
          <p className="text-[11px] text-muted-foreground text-center">
            왼쪽 패널 상단 <strong>변경 ▾</strong> 버튼으로 다른 템플릿으로 바꿀 수 있습니다
          </p>
        )}
      </div>
    </div>
  );
}
