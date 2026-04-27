'use client';

/**
 * 일괄 처리 모드 — PC 전용
 * TODO: 향후 유료 회원(Personal/Pro 플랜) 전용으로 전환 예정
 */

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import JSZip from 'jszip';
import {
  Upload, X, Loader2, CheckCircle2, XCircle, Wand2,
  Download, Save, ShoppingBag, ChevronDown, ChevronUp,
  FolderPlus, Trash2, RotateCcw, Crop,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getCroppedBlob } from '@/lib/canvas/crop';
import { getFirebaseDb } from '@/lib/firebase/client';
import { useAuth } from '@/lib/firebase/auth-context';
import { useStudioBatchStore, type BatchItem, type BatchTower } from '@/lib/store/studio-batch';
import { useCartStore } from '@/lib/store/cart';
import { PRODUCT_PRESETS, type ProductPreset } from '@/lib/presets/products';
import { STYLES } from '@/lib/presets/styles';
import { ALL_FONTS, loadGoogleFont, getFont } from '@/lib/presets/fonts';
import { ko } from '@/lib/i18n/ko';

const MAX_ITEMS = 50;
const CONCURRENCY = 1;
const ASPECT_OPTIONS = ['1:1', '4:5', '3:4'] as const;

/* ═══════════════════════════════════════════════════════════════
   IMAGE RESIZE UTIL
═══════════════════════════════════════════════════════════════ */

async function fileToBase64(
  file: File,
  maxSide = 1024,
): Promise<{ base64: string; type: string; previewUrl: string }> {
  let src: File = file;
  if (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic')
  ) {
    const heic2any = (await import('heic2any')).default;
    const blob = await heic2any({ blob: file, toType: 'image/jpeg' });
    src = new File([blob as Blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
  }
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(src);
    img.onload = () => {
      const { naturalWidth: nw, naturalHeight: nh } = img;
      const scale = Math.min(1, maxSide / Math.max(nw, nh));
      const w = Math.round(nw * scale), h = Math.round(nh * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/webp', 0.85);
      URL.revokeObjectURL(url);
      resolve({ base64: dataUrl.replace(/^data:[^;]+;base64,/, ''), type: 'image/webp', previewUrl: dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

/* ═══════════════════════════════════════════════════════════════
   CONCURRENCY QUEUE
═══════════════════════════════════════════════════════════════ */

async function runConcurrent<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<void> {
  const queue = [...tasks];
  const inFlight = new Set<Promise<void>>();

  function startNext() {
    if (!queue.length) return;
    const task = queue.shift()!;
    const p: Promise<void> = task().then(() => { inFlight.delete(p); }).catch(() => { inFlight.delete(p); });
    inFlight.add(p);
  }

  for (let i = 0; i < Math.min(concurrency, tasks.length); i++) startNext();

  while (inFlight.size > 0) {
    await Promise.race(inFlight);
    startNext();
  }
}

/* ═══════════════════════════════════════════════════════════════
   TEXT COMPOSITE UTIL
   단일 모드와 동일: Canvas 2D로 이미지 위에 텍스트 합성
═══════════════════════════════════════════════════════════════ */

async function composeTextOnImage(
  imageDataUrl: string,
  text: string,
  opts: {
    fontFamily: string;
    fontSize: number;
    color: string;
    bold: boolean;
    position: 'top' | 'center' | 'bottom';
    bgColor: string | null;
    alignment: 'left' | 'center' | 'right';
  },
): Promise<string> {
  const font = getFont(opts.fontFamily);
  await loadGoogleFont(font);
  const weight = opts.bold ? '700' : '400';
  await document.fonts.load(`${weight} ${opts.fontSize}px "${opts.fontFamily}"`).catch(() => {});

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas unavailable')); return; }

      ctx.drawImage(img, 0, 0);

      // 단일 모드 fScale과 동일한 방식으로 폰트 크기 스케일
      const fScale = canvas.width / 512;
      const actualSize = Math.max(16, opts.fontSize * fScale);

      const posYMap = {
        top:    canvas.height * 0.08,
        center: canvas.height * 0.50,
        bottom: canvas.height * 0.88,
      };
      const y = posYMap[opts.position];
      const x = opts.alignment === 'left'   ? 20
               : opts.alignment === 'right'  ? canvas.width - 20
               : canvas.width / 2;

      ctx.font = `${weight} ${actualSize}px "${opts.fontFamily}", sans-serif`;
      ctx.textAlign = opts.alignment as CanvasTextAlign;
      ctx.textBaseline = 'top';

      const lines = text.split('\n');
      const lineH = actualSize * 1.35;
      const totalH = lineH * lines.length + 16;

      if (opts.bgColor) {
        ctx.fillStyle = opts.bgColor;
        ctx.fillRect(0, y - 8, canvas.width, totalH);
      }

      ctx.fillStyle = opts.color;
      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + i * lineH);
      });

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

/* ═══════════════════════════════════════════════════════════════
   CONTROL TOWER
═══════════════════════════════════════════════════════════════ */

function ControlTower({ tower, onChange, disabled }: {
  tower: BatchTower;
  onChange: (patch: Partial<BatchTower>) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
      >
        <span>일괄 옵션</span>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-4 border-t border-border/40 px-4 pb-4 pt-3 md:grid-cols-4 lg:grid-cols-6">
          {/* 스타일 — 썸네일 카드 */}
          <div className="flex flex-col gap-1.5 col-span-2 md:col-span-4 lg:col-span-3">
            <Label className="text-xs">스타일</Label>
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
              {STYLES.map((s) => {
                const selected = tower.styleId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onChange({ styleId: s.id })}
                    disabled={disabled}
                    className={`snap-start shrink-0 flex flex-col items-center gap-1 focus:outline-none disabled:opacity-50 group`}
                  >
                    <div className={`w-14 aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all ${
                      selected
                        ? 'border-accent ring-2 ring-accent ring-offset-1'
                        : 'border-border group-hover:border-foreground/30'
                    }`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.thumbnailSrc}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={`text-[10px] font-medium leading-tight ${selected ? 'text-accent' : 'text-muted-foreground'}`}>
                      {s.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 강도 */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">변환 강도</Label>
            <div className="flex gap-1">
              {[30, 50, 70, 100].map((v) => (
                <button
                  key={v}
                  disabled={disabled}
                  onClick={() => onChange({ intensity: v })}
                  className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                    tower.intensity === v
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          {/* 출력 비율 */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">출력 비율</Label>
            <div className="flex gap-1">
              {ASPECT_OPTIONS.map((a) => (
                <button
                  key={a}
                  disabled={disabled}
                  onClick={() => onChange({ aspectRatio: a })}
                  className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                    tower.aspectRatio === a
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* 배경 프롬프트 */}
          <div className="flex flex-col gap-1.5 md:col-span-1 lg:col-span-2">
            <Label className="text-xs">배경 지시 (선택)</Label>
            <Input
              value={tower.backgroundPrompt}
              onChange={(e) => onChange({ backgroundPrompt: e.target.value })}
              disabled={disabled}
              placeholder="예: 흰 스튜디오 배경"
              className="rounded-xl text-xs h-8"
            />
          </div>

          {/* 커스텀 프롬프트 */}
          <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-2">
            <Label className="text-xs">추가 지시 (선택)</Label>
            <Input
              value={tower.customPrompt}
              onChange={(e) => onChange({ customPrompt: e.target.value })}
              disabled={disabled}
              placeholder="예: 자연스러운 미소, 눈을 크게"
              className="rounded-xl text-xs h-8"
            />
          </div>

          {/* ── 텍스트 오버레이 구분선 ── */}
          <div className="col-span-2 md:col-span-4 lg:col-span-6 border-t border-border/40 pt-3 flex flex-col gap-3">
            {/* 토글 헤더 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">텍스트 오버레이</Label>
              <button
                onClick={() => onChange({ textEnabled: !tower.textEnabled })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  tower.textEnabled ? 'bg-accent' : 'bg-muted border border-border'
                }`}
              >
                <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${
                  tower.textEnabled ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {tower.textEnabled && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {/* 폰트 */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label className="text-xs">폰트</Label>
                  <select
                    value={tower.textFontFamily}
                    onChange={(e) => onChange({ textFontFamily: e.target.value })}
                    className="rounded-xl border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
                  >
                    <optgroup label="한글">
                      {ALL_FONTS.filter((f) => f.lang === 'ko').map((f) => (
                        <option key={f.family} value={f.family}>{f.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="English">
                      {ALL_FONTS.filter((f) => f.lang === 'en').map((f) => (
                        <option key={f.family} value={f.family}>{f.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* 크기 + 볼드 + 정렬 */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label className="text-xs">크기 · 스타일</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min={16} max={80} value={tower.textFontSize}
                      onChange={(e) => onChange({ textFontSize: Number(e.target.value) })}
                      className="flex-1 accent-accent"
                    />
                    <span className="text-xs text-muted-foreground w-6 text-right">{tower.textFontSize}</span>
                    <button
                      onClick={() => onChange({ textBold: !tower.textBold })}
                      className={`size-7 rounded-lg text-xs font-bold border transition-colors ${
                        tower.textBold ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground'
                      }`}
                    >B</button>
                  </div>
                </div>

                {/* 위치 */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">위치</Label>
                  <div className="flex gap-1">
                    {(['top', 'center', 'bottom'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => onChange({ textPosition: p })}
                        className={`flex-1 rounded-lg border py-1.5 text-[10px] font-medium transition-colors ${
                          tower.textPosition === p
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border text-muted-foreground hover:border-foreground/30'
                        }`}
                      >
                        {p === 'top' ? '상단' : p === 'center' ? '중앙' : '하단'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 정렬 */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">정렬</Label>
                  <div className="flex gap-1">
                    {([['left','←'],['center','↔'],['right','→']] as const).map(([v, label]) => (
                      <button
                        key={v}
                        onClick={() => onChange({ textAlignment: v })}
                        className={`flex-1 rounded-lg border py-1.5 text-xs transition-colors ${
                          tower.textAlignment === v
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border text-muted-foreground hover:border-foreground/30'
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* 텍스트 색상 */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label className="text-xs">텍스트 색상</Label>
                  <div className="flex gap-1.5 items-center">
                    {['#FFFFFF','#000000','#F5E6C8','#C8D8F5','#F5C8C8'].map((c) => (
                      <button
                        key={c}
                        onClick={() => onChange({ textColor: c })}
                        className={`size-6 rounded-full border-2 transition-all ${tower.textColor === c ? 'border-accent scale-110' : 'border-border'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <label className="size-6 rounded-full border-2 border-dashed border-border cursor-pointer overflow-hidden">
                      <input type="color" value={tower.textColor} onChange={(e) => onChange({ textColor: e.target.value })} className="opacity-0 w-full h-full cursor-pointer" />
                    </label>
                  </div>
                </div>

                {/* 텍스트 배경 */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label className="text-xs">텍스트 배경</Label>
                  <div className="flex gap-1.5 items-center">
                    <button
                      onClick={() => onChange({ textBgColor: null })}
                      className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${tower.textBgColor === null ? 'border-accent scale-110' : 'border-border'}`}
                    ><span className="text-[9px] text-muted-foreground">∅</span></button>
                    {['#000000','#FFFFFF','#FF000099','#00000099','#FFFFFF99'].map((c) => (
                      <button
                        key={c}
                        onClick={() => onChange({ textBgColor: c })}
                        className={`size-6 rounded-full border-2 transition-all ${tower.textBgColor === c ? 'border-accent scale-110' : 'border-border'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ITEM ROW
═══════════════════════════════════════════════════════════════ */

function ItemRow({ item, onRemove, onTextChange, onCrop, disabled }: {
  item: BatchItem;
  onRemove: () => void;
  onTextChange: (text: string) => void;
  onCrop: () => void;
  disabled: boolean;
}) {
  const statusIcon = {
    idle: null,
    processing: <Loader2 className="size-4 animate-spin text-accent" />,
    success: <CheckCircle2 className="size-4 text-green-500" />,
    failed: <XCircle className="size-4 text-destructive" />,
  }[item.status];

  // 크롭된 미리보기 우선, 결과 이미지 우선, 원본 순서
  const thumbSrc = item.resultUrl ?? item.croppedPreviewUrl ?? item.previewUrl;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background p-3 transition-shadow hover:shadow-sm">
      {/* 썸네일 */}
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbSrc}
          alt={item.fileName}
          className="h-full w-full object-cover"
        />
        {item.status === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="size-4 animate-spin text-accent" />
          </div>
        )}
        {/* 크롭 완료 배지 */}
        {item.croppedBase64 && item.status !== 'success' && (
          <div className="absolute bottom-0.5 right-0.5 rounded-full bg-accent p-0.5">
            <Crop className="size-2.5 text-accent-foreground" />
          </div>
        )}
      </div>

      {/* 정보 + 텍스트 */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium truncate text-muted-foreground max-w-[160px]">{item.fileName}</p>
          {statusIcon}
          {item.status === 'failed' && item.error && (
            <span className="text-[10px] text-destructive">{item.error}</span>
          )}
        </div>
        <Input
          value={item.text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="텍스트 입력 (선택 · 위 텍스트 오버레이 설정대로 이미지에 합성됨)"
          disabled={disabled || item.status === 'processing'}
          maxLength={40}
          className="h-7 rounded-xl text-xs"
        />
      </div>

      {/* 크롭 버튼 */}
      <button
        onClick={onCrop}
        disabled={disabled || item.status === 'processing'}
        title="크롭 조정"
        className={`shrink-0 transition-colors disabled:opacity-40 ${
          item.croppedBase64 ? 'text-accent hover:text-accent/70' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Crop className="size-4" />
      </button>

      {/* 삭제 버튼 */}
      <button
        onClick={onRemove}
        disabled={disabled}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   UPLOAD ZONE
═══════════════════════════════════════════════════════════════ */

function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.heic'),
    );
    if (files.length) onFiles(files);
  }, [onFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-16 cursor-pointer transition-colors ${
        isDragging ? 'border-accent bg-accent/5' : 'border-border/60 bg-muted/20 hover:border-accent/60 hover:bg-muted/30'
      }`}
    >
      <Upload className="size-10 text-muted-foreground/40" />
      <div className="text-center">
        <p className="text-sm font-medium">사진을 드래그하거나 클릭해서 업로드</p>
        <p className="mt-1 text-xs text-muted-foreground">최대 {MAX_ITEMS}장 · JPG, PNG, WEBP, HEIC</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SAVE DIALOG
═══════════════════════════════════════════════════════════════ */

function SaveDialog({ open, successCount, onConfirm, onClose }: {
  open: boolean;
  successCount: number;
  onConfirm: (folderName: string) => void;
  onClose: () => void;
}) {
  const [folderName, setFolderName] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    const now = new Date();
    const defaultName = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} 일괄처리`;
    setFolderName(defaultName);
    setSaving(false);
    setTimeout(() => { inputRef.current?.select(); }, 50);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !saving) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="size-4" />
            마이페이지에 저장
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            성공한 <span className="font-semibold text-foreground">{successCount}장</span>을 마이페이지에 저장합니다.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">폴더 이름</Label>
            <Input
              ref={inputRef}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && folderName.trim()) { setSaving(true); onConfirm(folderName.trim()); } }}
              placeholder="폴더 이름을 입력하세요"
              maxLength={30}
              className="rounded-xl"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving} className="rounded-xl">취소</Button>
          <Button
            onClick={() => { setSaving(true); onConfirm(folderName.trim()); }}
            disabled={!folderName.trim() || saving}
            className="rounded-xl gap-1.5"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GOODS DIALOG
═══════════════════════════════════════════════════════════════ */

function GoodsDialog({ open, items, onClose }: {
  open: boolean;
  items: BatchItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [selectedProduct, setSelectedProduct] = useState<ProductPreset | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const successItems = items.filter((i) => i.status === 'success' && i.resultUrl);

  function handleSelectProduct(preset: ProductPreset) {
    setSelectedProduct(preset);
    const defaults: Record<string, string> = {};
    preset.options.forEach((o) => { if (o.values.length > 0) defaults[o.key] = o.values[0]; });
    setSelectedOptions(defaults);
  }

  function handleAddToCart() {
    if (!selectedProduct) return;
    successItems.forEach((item) => {
      addItem({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        customImageUrl: item.resultUrl!,
        generationId: null,
        selectedOptions,
        quantity: 1,
        unitPrice: selectedProduct.basePrice,
      });
    });
    toast.success(`${successItems.length}개 상품을 장바구니에 담았습니다.`);
    onClose();
    router.push('/cart');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="size-4" />
            굿즈 일괄 주문
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            성공한 <span className="font-semibold text-foreground">{successItems.length}장</span>으로 동일한 굿즈를 일괄 제작합니다.
          </p>

          {/* 상품 선택 */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs">굿즈 종류</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRODUCT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectProduct(preset)}
                  className={`rounded-xl border p-2.5 text-xs font-medium transition-all ${
                    selectedProduct?.id === preset.id
                      ? 'border-accent bg-accent/10 text-accent ring-2 ring-accent ring-offset-1'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  <p className="font-semibold">{preset.name}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{preset.basePrice.toLocaleString()}원</p>
                </button>
              ))}
            </div>
          </div>

          {/* 옵션 선택 */}
          {selectedProduct && selectedProduct.options.length > 0 && (
            <div className="flex flex-col gap-3">
              <Separator />
              <Label className="text-xs">기본 옵션 <span className="text-muted-foreground">(장바구니에서 개별 변경 가능)</span></Label>
              {selectedProduct.options.map((opt) => (
                <div key={opt.key} className="flex flex-col gap-1.5">
                  <p className="text-[11px] text-muted-foreground">{opt.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {opt.values.map((val) => (
                      <button
                        key={val}
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.key]: val }))}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selectedOptions[opt.key] === val
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border text-muted-foreground hover:border-foreground/30'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">취소</Button>
          <Button
            onClick={handleAddToCart}
            disabled={!selectedProduct}
            className="rounded-xl gap-1.5"
          >
            <ShoppingBag className="size-3.5" />
            {successItems.length}개 장바구니에 담기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CROP UTILS + BATCH CROP DIALOG
═══════════════════════════════════════════════════════════════ */

async function blobToBase64Resized(blob: Blob, maxSide = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/webp', 0.85);
      resolve(dataUrl.replace(/^data:[^;]+;base64,/, ''));
    };
    img.onerror = reject;
    img.src = url;
  });
}

const CROP_RATIOS = [
  { label: '원본', num: 0 },
  { label: '1:1',  num: 1 / 1 },
  { label: '4:5',  num: 4 / 5 },
  { label: '3:4',  num: 3 / 4 },
  { label: '9:16', num: 9 / 16 },
] as const;

function BatchCropDialog({ imageUrl, open, onConfirm, onClose }: {
  imageUrl: string;
  open: boolean;
  onConfirm: (croppedBase64: string, croppedPreviewUrl: string) => void;
  onClose: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratioNum, setRatioNum] = useState<number>(4 / 5);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const { blob, previewUrl } = await getCroppedBlob(imageUrl, croppedAreaPixels);
      const base64 = await blobToBase64Resized(blob);
      onConfirm(base64, previewUrl);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-base font-medium">크롭 조정</DialogTitle>
        </DialogHeader>

        {/* 비율 선택 */}
        <div className="flex gap-2 px-6 pb-4 overflow-x-auto">
          {CROP_RATIOS.map((r) => (
            <button
              key={r.label}
              onClick={() => setRatioNum(r.num)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                ratioNum === r.num
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/30'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* 크롭 영역 */}
        <div className="relative h-72 bg-black">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              minZoom={0.5}
              maxZoom={4}
              aspect={ratioNum || undefined}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              style={{ containerStyle: { borderRadius: 0 } }}
            />
          )}
        </div>

        {/* 줌 슬라이더 */}
        <div className="flex items-center gap-3 px-6 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground shrink-0">축소</span>
          <input
            type="range" min={0.5} max={4} step={0.05} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="text-xs text-muted-foreground shrink-0">확대</span>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">취소</Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !croppedAreaPixels}
            className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? '처리 중...' : '확인'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CREDIT CONFIRM DIALOG
═══════════════════════════════════════════════════════════════ */

function CreditConfirmDialog({ open, count, credits, onConfirm, onClose }: {
  open: boolean;
  count: number;
  credits: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>일괄 AI 변환</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm">
          <p>{count}장의 이미지를 변환합니다.</p>
          <p className="font-semibold text-accent">{count} 크레딧이 차감됩니다.</p>
          <p className="text-muted-foreground">현재 잔여: {credits} 크레딧</p>
          {credits < count && (
            <p className="text-destructive font-medium">크레딧이 부족합니다. {count - credits}개를 충전해주세요.</p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">취소</Button>
          <Button onClick={onConfirm} disabled={credits < count} className="rounded-xl gap-1.5">
            <Wand2 className="size-3.5" />
            확인하고 시작
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN BATCH MODE COMPONENT
═══════════════════════════════════════════════════════════════ */

export function BatchMode() {
  const { user } = useAuth();
  const router = useRouter();

  const { items, tower, isProcessing, addItems, removeItem, updateText, patchTower, patchItem, setProcessing, reset } =
    useStudioBatchStore();

  const [credits, setCredits] = useState(0);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [goodsDialogOpen, setGoodsDialogOpen] = useState(false);
  const [savingProgress, setSavingProgress] = useState<{ current: number; total: number } | null>(null);
  const [cropItemId, setCropItemId] = useState<string | null>(null);

  const pendingItems = items.filter((i) => i.status === 'idle');
  const successItems = items.filter((i) => i.status === 'success');
  const failedItems = items.filter((i) => i.status === 'failed');
  const processableItems = [...pendingItems, ...failedItems];

  /* ── 파일 추가 ── */
  async function handleFiles(files: File[]) {
    const remaining = MAX_ITEMS - items.length;
    if (remaining <= 0) { toast.error(`최대 ${MAX_ITEMS}장까지 추가할 수 있습니다.`); return; }
    const sliced = files.slice(0, remaining);
    if (files.length > remaining) toast(`${remaining}장만 추가됩니다. (최대 ${MAX_ITEMS}장)`);

    toast.promise(
      Promise.all(
        sliced.map(async (file) => {
          const { base64, type, previewUrl } = await fileToBase64(file);
          return { id: `${file.name}-${Date.now()}-${Math.random()}`, fileName: file.name, previewUrl, base64, imageType: type };
        }),
      ).then(addItems),
      { loading: `${sliced.length}장 처리 중...`, success: `${sliced.length}장 추가됨`, error: '이미지 처리 실패' },
    );
  }

  /* ── 크레딧 확인 후 처리 시작 ── */
  async function handleProcessClick() {
    if (!user) { toast.error(ko.errors.unauthorized); return; }
    const token = await user.getIdToken();
    const res = await fetch('/api/credits', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json() as { credits: number };
      setCredits(data.credits);
    }
    setCreditDialogOpen(true);
  }

  /* ── 실제 AI 처리 ── */
  async function runBatch(targetItems: BatchItem[]) {
    if (!user) return;
    setProcessing(true);

    const tasks = targetItems.map((item) => async () => {
      patchItem(item.id, { status: 'processing', error: undefined });
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            imageBase64: item.croppedBase64 ?? item.base64,
            imageType: item.imageType,
            styleId: tower.styleId,
            aspectRatio: tower.aspectRatio,
            customPrompt: tower.customPrompt || undefined,
            backgroundPrompt: tower.backgroundPrompt || undefined,
            transformIntensity: tower.intensity,
          }),
        });
        if (!res.ok) {
          const data = await res.json() as { code?: string };
          if (data.code === 'INSUFFICIENT_CREDITS') throw new Error('크레딧 부족');
          throw new Error('변환 실패');
        }
        const data = await res.json() as { outputUrl: string };
        patchItem(item.id, { status: 'success', resultUrl: data.outputUrl });
      } catch (e: unknown) {
        patchItem(item.id, { status: 'failed', error: e instanceof Error ? e.message : '오류' });
      }
    });

    await runConcurrent(tasks, CONCURRENCY);
    setProcessing(false);
    const done = useStudioBatchStore.getState().items.filter((i) => i.status === 'success').length;
    const fail = useStudioBatchStore.getState().items.filter((i) => i.status === 'failed').length;
    toast.success(`완료: 성공 ${done}장 / 실패 ${fail}장`);
  }

  /* ── 텍스트 합성 옵션 추출 ── */
  function getTextOpts() {
    return {
      fontFamily: tower.textFontFamily,
      fontSize: tower.textFontSize,
      color: tower.textColor,
      bold: tower.textBold,
      position: tower.textPosition,
      bgColor: tower.textBgColor,
      alignment: tower.textAlignment,
    };
  }

  async function applyText(item: BatchItem): Promise<string> {
    if (!tower.textEnabled || !item.text.trim() || !item.resultUrl) return item.resultUrl ?? '';
    return composeTextOnImage(item.resultUrl, item.text, getTextOpts());
  }

  /* ── 일괄 저장 ── */
  async function handleSave(folderName: string) {
    if (!user) return;
    const db = getFirebaseDb();
    const batchId = `batch_${Date.now()}`;

    // 1. 폴더 생성
    const folderRef = await addDoc(collection(db, 'users', user.uid, 'folders'), {
      name: folderName,
      createdAt: serverTimestamp(),
    });
    const folderId = folderRef.id;

    // 2. 각 성공 이미지 텍스트 합성 후 저장
    const successList = useStudioBatchStore.getState().items.filter((i) => i.status === 'success' && i.resultUrl);
    setSavingProgress({ current: 0, total: successList.length });

    const token = await user.getIdToken();
    for (let i = 0; i < successList.length; i++) {
      const item = successList[i];
      try {
        const finalDataUrl = await applyText(item);
        const base64 = finalDataUrl.replace(/^data:[^;]+;base64,/, '');
        await fetch('/api/save-generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            imageBase64: base64,
            styleId: tower.styleId,
            customPrompt: tower.customPrompt || undefined,
            folderId,
            text: item.text || undefined,
            label: item.text || undefined,
            batchId,
            batchIndex: i,
          }),
        });
      } catch {
        // 저장 실패해도 나머지 계속
      }
      setSavingProgress({ current: i + 1, total: successList.length });
    }

    setSavingProgress(null);
    setSaveDialogOpen(false);
    toast.success(`"${folderName}" 폴더에 ${successList.length}장 저장됐습니다.`);
    router.push('/profile');
  }

  /* ── ZIP 다운로드 ── */
  async function handleZipDownload() {
    const list = successItems.filter((i) => i.resultUrl);
    if (!list.length) { toast.error('저장할 이미지가 없습니다.'); return; }

    toast.promise(
      (async () => {
        const JSZipLib = (await import('jszip')).default;
        const zip = new JSZipLib();
        // 텍스트 합성 후 ZIP에 추가
        for (let idx = 0; idx < list.length; idx++) {
          const item = list[idx];
          const finalDataUrl = await applyText(item);
          const base64 = finalDataUrl.replace(/^data:[^;]+;base64,/, '');
          const name = `${String(idx + 1).padStart(3, '0')}_${item.fileName.replace(/\.[^.]+$/, '')}.png`;
          zip.file(name, base64, { base64: true });
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch_${new Date().toISOString().slice(0, 10)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      })(),
      { loading: 'ZIP 생성 중...', success: `${list.length}장 다운로드 완료`, error: 'ZIP 생성 실패' },
    );
  }

  /* ── 렌더 ── */
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 space-y-4">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">일괄 처리</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              최대 {MAX_ITEMS}장 · AI 변환 후 일괄 저장 또는 굿즈 주문
              {/* TODO: 향후 유료 회원 전용 */}
            </p>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{successItems.length}/{items.length} 완료</span>
              {failedItems.length > 0 && (
                <span className="text-destructive">{failedItems.length} 실패</span>
              )}
            </div>
          )}
        </div>

        {/* 컨트롤 타워 */}
        {items.length > 0 && (
          <ControlTower tower={tower} onChange={patchTower} disabled={isProcessing} />
        )}

        {/* 업로드 존 / 목록 */}
        {items.length === 0 ? (
          <UploadZone onFiles={handleFiles} />
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onTextChange={(t) => updateText(item.id, t)}
                onCrop={() => setCropItemId(item.id)}
                disabled={isProcessing}
              />
            ))}
            {/* 추가 업로드 */}
            {!isProcessing && items.length < MAX_ITEMS && (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/40 py-4 text-sm text-muted-foreground hover:border-accent/60 hover:text-accent transition-colors">
                <Upload className="size-4" />
                사진 추가 ({items.length}/{MAX_ITEMS})
                <input
                  type="file" accept="image/*,.heic" multiple className="sr-only"
                  onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) handleFiles(f); e.target.value = ''; }}
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* 저장 진행 오버레이 */}
      {savingProgress && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur">
          <Loader2 className="size-8 animate-spin text-accent" />
          <p className="text-sm font-medium">저장 중... {savingProgress.current}/{savingProgress.total}</p>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(savingProgress.current / savingProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 하단 sticky 액션 바 */}
      {items.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center gap-2">
            {/* 전체 삭제 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { if (!isProcessing) reset(); }}
              disabled={isProcessing}
              className="gap-1.5 rounded-xl text-muted-foreground"
            >
              <Trash2 className="size-3.5" />
              초기화
            </Button>

            <div className="flex-1" />

            {/* 실패 재시도 */}
            {failedItems.length > 0 && !isProcessing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBatch(failedItems)}
                className="gap-1.5 rounded-xl"
              >
                <RotateCcw className="size-3.5" />
                실패 재시도 ({failedItems.length})
              </Button>
            )}

            {/* AI 처리 */}
            {processableItems.length > 0 && (
              <Button
                onClick={handleProcessClick}
                disabled={isProcessing}
                className="gap-1.5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                size="sm"
              >
                {isProcessing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Wand2 className="size-3.5" />
                )}
                {isProcessing ? '변환 중...' : `AI 변환 (${processableItems.length}장)`}
              </Button>
            )}

            {/* 결과 액션 (성공 이미지 있을 때) */}
            {successItems.length > 0 && !isProcessing && (
              <>
                <Button variant="outline" size="sm" onClick={handleZipDownload} className="gap-1.5 rounded-xl">
                  <Download className="size-3.5" />
                  ZIP 다운로드
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)} className="gap-1.5 rounded-xl">
                  <Save className="size-3.5" />
                  마이페이지 저장
                </Button>
                <Button size="sm" onClick={() => setGoodsDialogOpen(true)} className="gap-1.5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
                  <ShoppingBag className="size-3.5" />
                  굿즈 일괄 주문
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 개별 크롭 다이얼로그 */}
      {cropItemId && (() => {
        const cropItem = items.find((i) => i.id === cropItemId);
        if (!cropItem) return null;
        return (
          <BatchCropDialog
            imageUrl={cropItem.previewUrl}
            open={true}
            onConfirm={(croppedBase64, croppedPreviewUrl) => {
              patchItem(cropItemId, { croppedBase64, croppedPreviewUrl });
              setCropItemId(null);
            }}
            onClose={() => setCropItemId(null)}
          />
        );
      })()}

      {/* 다이얼로그들 */}
      <CreditConfirmDialog
        open={creditDialogOpen}
        count={processableItems.length}
        credits={credits}
        onConfirm={() => { setCreditDialogOpen(false); runBatch(processableItems); }}
        onClose={() => setCreditDialogOpen(false)}
      />
      <SaveDialog
        open={saveDialogOpen}
        successCount={successItems.length}
        onConfirm={handleSave}
        onClose={() => setSaveDialogOpen(false)}
      />
      <GoodsDialog
        open={goodsDialogOpen}
        items={items}
        onClose={() => setGoodsDialogOpen(false)}
      />
    </div>
  );
}
