'use client';

import { useState, useRef } from 'react';
// html-to-image via dynamic import (installed as dependency)
import { Download, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MAGAZINE_TEMPLATES, type MagazineTemplate } from '@/lib/presets/magazine-templates';
import { MagazineCanvas, CANVAS_W, CANVAS_H } from './magazine-canvas';
import { ImageSlot } from './image-slot';
import { cn } from '@/lib/utils';

const DISPLAY_W = 340;
const DISPLAY_SCALE = DISPLAY_W / CANVAS_W;

export function MagazineEditor() {
  const [selected, setSelected] = useState<MagazineTemplate | null>(null);
  const [images, setImages] = useState<(string | null)[]>([null, null]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  function selectTemplate(t: MagazineTemplate) {
    setSelected(t);
    setImages([null, null]);
    setTexts({});
  }

  function setImage(i: number, src: string | null) {
    setImages((prev) => { const next = [...prev]; next[i] = src; return next; });
  }

  function setText(key: string, val: string) {
    setTexts((prev) => ({ ...prev, [key]: val }));
  }

  async function handleExport() {
    if (!exportRef.current || !selected) return;
    setIsExporting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { toPng } = await import('html-to-image' as any);
      const dataUrl = await toPng(exportRef.current, {
        width: CANVAS_W,
        height: CANVAS_H,
        pixelRatio: 1,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `magazine-${selected.id}.png`;
      a.click();
      toast.success('다운로드 완료!');
    } catch {
      toast.error('내보내기 실패. 다시 시도해주세요.');
    } finally {
      setIsExporting(false);
    }
  }

  if (!selected) {
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="max-w-5xl mx-auto w-full px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1">Magazine</h1>
            <p className="text-sm text-muted-foreground">잡지 스타일 레이아웃을 선택해서 나만의 에디토리얼을 만들어보세요.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {MAGAZINE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className="group flex flex-col gap-2 text-left focus:outline-none"
              >
                <div className={cn(
                  'aspect-[3/4] rounded-2xl border-2 bg-muted/40 overflow-hidden transition-all',
                  'border-border group-hover:border-foreground/30 group-hover:shadow-md',
                  'flex items-center justify-center',
                )}>
                  <TemplateThumbnail template={t} />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    사진 {t.imageCount}장{t.textFields.length > 0 ? ` · 텍스트 ${t.textFields.length}개` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const imageLabels = selected.imageCount === 1
    ? ['메인 사진']
    : ['사진 1', '사진 2'];

  return (
    <div className="flex h-full overflow-hidden">
      {/* 좌측 컨트롤 패널 */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border shrink-0">
          <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <p className="text-sm font-semibold leading-tight">{selected.name}</p>
            <p className="text-[11px] text-muted-foreground">{selected.description}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          {/* 이미지 업로드 */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">사진 업로드</p>
            <div className={cn('grid gap-3', selected.imageCount > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
              {Array.from({ length: selected.imageCount }, (_, i) => (
                <ImageSlot
                  key={i}
                  index={i}
                  label={imageLabels[i]}
                  src={images[i]}
                  onChange={(src) => setImage(i, src)}
                />
              ))}
            </div>
          </div>

          {/* 텍스트 필드 */}
          {selected.textFields.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">텍스트</p>
              {selected.textFields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label className="text-sm">{field.label}</Label>
                  {field.multiline ? (
                    <Textarea
                      value={texts[field.key] ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      rows={3}
                      className="resize-none text-sm rounded-xl"
                    />
                  ) : (
                    <Input
                      value={texts[field.key] ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      className="text-sm rounded-xl"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 만들기 버튼 */}
        <div className="p-5 border-t border-border shrink-0">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full rounded-2xl gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isExporting ? (
              <>처리 중...</>
            ) : (
              <>
                <Download className="size-4" />
                PNG로 다운로드
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 우측 프리뷰 */}
      <div className="flex-1 overflow-auto bg-muted/30 flex items-start justify-center p-8" ref={canvasRef}>
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Preview</p>
          {/* 화면 표시용 (스케일 다운) */}
          <div
            style={{
              width: CANVAS_W * DISPLAY_SCALE,
              height: CANVAS_H * DISPLAY_SCALE,
              overflow: 'hidden',
              borderRadius: 16,
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              flexShrink: 0,
            }}
          >
            <div style={{ transform: `scale(${DISPLAY_SCALE})`, transformOrigin: 'top left', width: CANVAS_W, height: CANVAS_H }}>
              <MagazineCanvas
                template={selected}
                images={images}
                texts={texts}
                scale={1}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">출력 해상도: 1200 × 1600px</p>
        </div>
      </div>

      {/* 내보내기용 히든 캔버스 (실제 크기) */}
      <div style={{ position: 'fixed', left: -9999, top: -9999, width: CANVAS_W, height: CANVAS_H, pointerEvents: 'none' }}>
        <MagazineCanvas
          ref={exportRef}
          template={selected}
          images={images}
          texts={texts}
          scale={1}
        />
      </div>
    </div>
  );
}

function TemplateThumbnail({ template }: { template: MagazineTemplate }) {
  const colors: Record<string, string> = {
    cover_full_editorial: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    split_left_image_right_text: 'linear-gradient(90deg, #c9b99a 50%, #F5F3EF 50%)',
    center_overlay_block: 'linear-gradient(160deg, #667eea 0%, #764ba2 100%)',
    top_typography_minimal: 'linear-gradient(180deg, #ffffff 40%, #d4a5a5 40%)',
    grid_double_image: 'linear-gradient(180deg, #2d2d2d 49%, #1a1a1a 49%, #1a1a1a 51%, #3d3d3d 51%)',
    cutout_color_bg: 'linear-gradient(135deg, #FFE066 0%, #FF6B9D 50%, #C44DFF 100%)',
    dark_luxury_cover: 'linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 100%)',
    side_bar_text: 'linear-gradient(90deg, #8a8a8a 70%, #EFEFEF 70%)',
    bottom_caption_editorial: 'linear-gradient(180deg, #5a7a9a 75%, #ffffff 75%)',
    experimental_poster: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
  };

  const icons: Record<string, string> = {
    cover_full_editorial: 'T',
    split_left_image_right_text: '▌',
    center_overlay_block: '▣',
    top_typography_minimal: '▀',
    grid_double_image: '⊟',
    cutout_color_bg: '★',
    dark_luxury_cover: 'N',
    side_bar_text: '▐',
    bottom_caption_editorial: '▄',
    experimental_poster: '◎',
  };

  return (
    <div style={{ width: '100%', height: '100%', background: colors[template.id] ?? '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 28, fontWeight: 700 }}>{icons[template.id] ?? '□'}</span>
    </div>
  );
}
