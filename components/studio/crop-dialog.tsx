'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCroppedBlob } from '@/lib/canvas/crop';
import { useStudioStore, type AspectRatio } from '@/lib/store/studio';
import { ko } from '@/lib/i18n/ko';

const RATIOS: { label: string; value: AspectRatio; num: number }[] = [
  { label: '1:1', value: '1:1', num: 1 / 1 },
  { label: '4:5', value: '4:5', num: 4 / 5 },
  { label: '3:4', value: '3:4', num: 3 / 4 },
  { label: '9:16', value: '9:16', num: 9 / 16 },
  { label: '16:9', value: '16:9', num: 16 / 9 },
  { label: '원본', value: 'free', num: 0 },
];

export function CropDialog() {
  const { sourceImage, isCropDialogOpen, setIsCropDialogOpen, aspectRatio, setAspectRatio, setCroppedImage, setCropData } =
    useStudioStore();

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!sourceImage || !croppedAreaPixels) return;
    setLoading(true);
    try {
      const result = await getCroppedBlob(sourceImage.previewUrl, croppedAreaPixels);
      setCroppedImage(result);
      setCropData(croppedAreaPixels);

      // 크롭된 실제 비율로 Gemini 파라미터 자동 세팅
      const r = croppedAreaPixels.width / croppedAreaPixels.height;
      if (r > 1.6) setAspectRatio('16:9');
      else if (r > 1.1) setAspectRatio('4:5');
      else if (r < 0.65) setAspectRatio('9:16');
      else if (r < 0.85) setAspectRatio('3:4');
      else setAspectRatio('1:1');

      setIsCropDialogOpen(false);
    } catch {
      /* toast 처리는 getCroppedBlob 바깥에서 */
    } finally {
      setLoading(false);
    }
  };

  const selectedRatio = RATIOS.find((r) => r.value === aspectRatio);
  const cropAspect = selectedRatio?.num || undefined;

  return (
    <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-base font-medium">{ko.studio.crop.title}</DialogTitle>
        </DialogHeader>

        {/* 비율 칩 */}
        <div className="flex gap-2 px-6 pb-4 overflow-x-auto">
          {RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => setAspectRatio(r.value)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                aspectRatio === r.value
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/30',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* 크롭 영역 */}
        <div className="relative h-72 bg-black">
          {sourceImage && (
            <Cropper
              image={sourceImage.previewUrl}
              crop={crop}
              zoom={zoom}
              minZoom={0.5}
              maxZoom={4}
              aspect={cropAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { borderRadius: 0 } }}
            />
          )}
        </div>

        {/* 줌 슬라이더 */}
        <div className="flex items-center gap-3 px-6 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground shrink-0">축소</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="text-xs text-muted-foreground shrink-0">확대</span>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 px-6 py-4">
          <Button variant="outline" onClick={() => setIsCropDialogOpen(false)} className="rounded-xl">
            {ko.studio.crop.cancel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? '처리 중...' : ko.studio.crop.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
