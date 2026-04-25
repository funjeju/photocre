'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { Button } from '@/components/ui/button';
import { useStudioStore } from '@/lib/store/studio';
import { useAuth } from '@/lib/firebase/auth-context';
import { blobToBase64 } from '@/lib/canvas/export';
import { STYLES } from '@/lib/presets/styles';
import { getBackground } from '@/lib/presets/backgrounds';
import { ko } from '@/lib/i18n/ko';

const STYLES_MAP = Object.fromEntries(STYLES.map((s) => [s.id, s.name]));

export function GenerateButton() {
  const { user } = useAuth();
  const isGenerating = useStudioStore((s) => s.isGenerating);
  const croppedImage = useStudioStore((s) => s.croppedImage);
  const styleId = useStudioStore((s) => s.styleId);
  const setIsGenerating = useStudioStore((s) => s.setIsGenerating);
  const setGeneratedImageUrl = useStudioStore((s) => s.setGeneratedImageUrl);
  const setGenerationId = useStudioStore((s) => s.setGenerationId);

  const canAct = !!croppedImage && !isGenerating;

  async function handleGenerate() {
    if (!canAct || !user) return;

    // 클릭 시점에 store 최신값 직접 읽기 — 스테일 클로저 방지
    const { croppedImage: img, styleId: sid, customPrompt, aspectRatio, backgroundId, transformIntensity } = useStudioStore.getState();
    if (!img) return;

    const bg = getBackground(backgroundId);
    const backgroundPrompt = bg.type !== 'keep' && bg.type !== 'custom' ? bg.promptFragment : undefined;

    setIsGenerating(true);
    try {
      const idToken = await user.getIdToken();
      const resizedBlob = await imageCompression(img.blob, {
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.85,
      });
      const imageBase64 = await blobToBase64(resizedBlob);

      console.log('[generate] styleId:', sid, '| aspectRatio:', aspectRatio);

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          imageBase64,
          imageType: img.blob.type || 'image/webp',
          styleId: sid,
          aspectRatio,
          customPrompt: customPrompt.trim() || undefined,
          backgroundPrompt,
          transformIntensity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'INSUFFICIENT_CREDITS') {
          toast.error(ko.credits.insufficient);
        } else {
          toast.error(data.error ?? ko.errors.unknown);
        }
        return;
      }

      setGeneratedImageUrl(data.outputUrl);
      setGenerationId(data.generationId);
    } catch {
      toast.error(ko.errors.network);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={!canAct}
      variant="outline"
      className="w-full gap-2 rounded-2xl h-10 disabled:opacity-40"
    >
      {isGenerating ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {ko.studio.generate.generating}
        </>
      ) : (
        <>
          <Sparkles className="size-4" />
          {ko.studio.generate.button}
          <span className="ml-auto text-xs opacity-50 font-normal">{STYLES_MAP[styleId] ?? styleId}</span>
          <span className="text-xs opacity-60">• {ko.studio.ai.credit}</span>
        </>
      )}
    </Button>
  );
}
