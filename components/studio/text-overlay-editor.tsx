'use client';

import { useState, useEffect } from 'react';
import { ALL_FONTS, loadGoogleFont, getFont } from '@/lib/presets/fonts';
import { useStudioStore, DEFAULT_TEXT_OVERLAY } from '@/lib/store/studio';
import { cn } from '@/lib/utils';
import { ko } from '@/lib/i18n/ko';

const COLORS = ['#FFFFFF', '#000000', '#F5E6C8', '#C8D8F5', '#F5C8C8', '#C8F5D8'];
const BG_COLORS = ['#000000', '#FFFFFF', '#FF000099', '#00000099', '#FFFFFF99'];
const ALIGNMENTS = [
  { value: 'left', label: '←' },
  { value: 'center', label: '↔' },
  { value: 'right', label: '→' },
] as const;

export function TextOverlayEditor() {
  const textOverlay = useStudioStore((s) => s.textOverlay);
  const setTextOverlay = useStudioStore((s) => s.setTextOverlay);
  const [enabled, setEnabled] = useState(() => textOverlay !== null);

  const overlay = textOverlay ?? DEFAULT_TEXT_OVERLAY;

  useEffect(() => {
    if (!enabled) setTextOverlay(null);
    else if (!textOverlay) setTextOverlay(DEFAULT_TEXT_OVERLAY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  function update(patch: Partial<typeof overlay>) {
    setTextOverlay({ ...overlay, ...patch });
    if (!enabled) setEnabled(true);
  }

  async function handleFontChange(family: string) {
    const font = getFont(family);
    update({ fontFamily: family });           // HTML 미리보기 즉시 반영
    await loadGoogleFont(font);               // 폰트 로드 완료 대기
    update({ fontFamily: family });           // Konva 재렌더 트리거
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{ko.studio.text.title}</p>
        <button
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
            enabled ? 'bg-accent' : 'bg-muted border border-border',
          )}
        >
          <span
            className={cn(
              'inline-block size-3.5 rounded-full bg-white shadow transition-transform',
              enabled ? 'translate-x-4' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3">
          {/* 텍스트 입력 */}
          <textarea
            value={overlay.content}
            onChange={(e) => update({ content: e.target.value })}
            placeholder={ko.studio.text.placeholder}
            maxLength={80}
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />

          {/* 폰트 선택 */}
          <div className="flex gap-2 items-center">
            <label className="text-xs text-muted-foreground w-8 shrink-0">{ko.studio.text.fontFamily}</label>
            <select
              value={overlay.fontFamily}
              onChange={(e) => handleFontChange(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
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

          {/* 크기 + 정렬 + 볼드 */}
          <div className="flex gap-2 items-center">
            <label className="text-xs text-muted-foreground w-8 shrink-0">{ko.studio.text.fontSize}</label>
            <input
              type="range"
              min={16}
              max={80}
              value={overlay.fontSize}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
              className="flex-1 accent-accent"
            />
            <span className="text-xs text-muted-foreground w-6 text-right">{overlay.fontSize}</span>

            <div className="flex gap-1 ml-2">
              {/* 볼드 */}
              <button
                onClick={() => update({ bold: !overlay.bold })}
                className={cn(
                  'size-7 rounded-lg text-xs font-bold border transition-colors',
                  overlay.bold
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/30',
                )}
              >
                B
              </button>
              {ALIGNMENTS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => update({ alignment: a.value })}
                  className={cn(
                    'size-7 rounded-lg text-xs border transition-colors',
                    overlay.alignment === a.value
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/30',
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* 텍스트 배경색 */}
          <div className="flex gap-2 items-center">
            <label className="text-xs text-muted-foreground w-8 shrink-0">배경</label>
            <div className="flex gap-1.5">
              {/* 없음 */}
              <button
                onClick={() => update({ textBgColor: null })}
                className={cn(
                  'size-6 rounded-full border-2 flex items-center justify-center transition-all',
                  overlay.textBgColor === null ? 'border-accent scale-110' : 'border-border',
                )}
              >
                <span className="text-[9px] text-muted-foreground">∅</span>
              </button>
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ textBgColor: c })}
                  className={cn(
                    'size-6 rounded-full border-2 transition-all',
                    overlay.textBgColor === c ? 'border-accent scale-110' : 'border-border',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* 색상 */}
          <div className="flex gap-2 items-center">
            <label className="text-xs text-muted-foreground w-8 shrink-0">{ko.studio.text.color}</label>
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ color: c })}
                  className={cn(
                    'size-6 rounded-full border-2 transition-all',
                    overlay.color === c ? 'border-accent scale-110' : 'border-border',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              {/* 커스텀 컬러 피커 */}
              <label className="size-6 rounded-full border-2 border-dashed border-border cursor-pointer overflow-hidden">
                <input
                  type="color"
                  value={overlay.color}
                  onChange={(e) => update({ color: e.target.value })}
                  className="opacity-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
