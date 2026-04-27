'use client';

import { useState, useRef } from 'react';
import { Plus, Loader2, User, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  onUpload: (file: File, maxPhotos: 1 | 2) => Promise<void>;
  isUploading: boolean;
}

export function UploadCoverCard({ onUpload, isUploading }: Props) {
  const [open, setOpen] = useState(false);
  const [maxPhotos, setMaxPhotos] = useState<1 | 2>(1);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleCardClick() {
    if (isUploading) return;
    setOpen(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setOpen(false);
    await onUpload(file, maxPhotos);
  }

  return (
    <>
      <button
        onClick={handleCardClick}
        disabled={isUploading}
        className={cn(
          'group flex flex-col gap-2 text-left focus:outline-none',
          isUploading && 'opacity-50 cursor-not-allowed',
        )}
      >
        <div className={cn(
          'aspect-[3/4] rounded-2xl border-2 border-dashed transition-all',
          'flex flex-col items-center justify-center gap-2',
          'border-border group-hover:border-foreground/40 bg-muted/20 group-hover:bg-muted/40',
        )}>
          {isUploading ? (
            <Loader2 className="size-6 text-muted-foreground animate-spin" />
          ) : (
            <Plus className="size-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">나만의 커버</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">직접 업로드</p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">나만의 커버 업로드</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 pt-1">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">몇 명을 합성할 커버인가요?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMaxPhotos(1)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-sm font-medium',
                    maxPhotos === 1
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  <User className="size-4" />
                  1인용
                </button>
                <button
                  onClick={() => setMaxPhotos(2)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-sm font-medium',
                    maxPhotos === 2
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  <Users className="size-4" />
                  2인용
                </button>
              </div>
            </div>

            <Button
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl gap-2 bg-accent hover:bg-accent/90 text-accent-foreground h-10"
            >
              <Plus className="size-4" />
              이미지 선택
            </Button>

            <p className="text-[10px] text-muted-foreground text-center -mt-2">
              업로드한 이미지의 저작권 책임은 사용자에게 있습니다.
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
