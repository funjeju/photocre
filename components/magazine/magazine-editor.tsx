'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Download, RefreshCw, ChevronLeft, ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VariantState, RenderVariant } from '@/lib/magazine/types'
import { generateThreeVariants, renderAtResolution } from '@/lib/magazine/render'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseStorage, getFirebaseDb } from '@/lib/firebase/client'

const MAX_IMAGES = 4
const THUMB_ASPECT = 260 / 347 // approximate 3:4 display

// ── Upload Phase ────────────────────────────────────────────────────────────

function ImageUploadZone({
  images,
  onAdd,
  onRemove,
}: {
  images: string[]
  onAdd: (srcs: string[]) => void
  onRemove: (i: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function processFiles(files: FileList) {
    const remaining = MAX_IMAGES - images.length
    const toProcess = Array.from(files).slice(0, remaining)
    const srcs: string[] = []
    let done = 0
    for (const file of toProcess) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) srcs.push(e.target.result as string)
        done++
        if (done === toProcess.length) onAdd(srcs)
      }
      reader.readAsDataURL(file)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      processFiles(e.target.files)
      e.target.value = ''
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files)
  }

  const canAdd = images.length < MAX_IMAGES

  return (
    <div className="flex flex-col gap-4">
      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-3',
            'aspect-[4/3] w-full rounded-2xl border-2 border-dashed transition-colors',
            dragging
              ? 'border-foreground/40 bg-muted/50'
              : 'border-border bg-muted/20 hover:border-foreground/25 hover:bg-muted/30'
          )}
        >
          <Upload className="size-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">사진을 드래그하거나 클릭해서 업로드</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP · 최대 4장</p>
          </div>
        </button>
      ) : (
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden bg-muted" style={{ width: 100, height: 133 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 size-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3.5 text-white" />
              </button>
            </div>
          ))}
          {canAdd && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border hover:border-foreground/25 transition-colors text-muted-foreground"
              style={{ width: 100, height: 133 }}
            >
              <ImagePlus className="size-5" />
              <span className="text-[11px]">추가</span>
            </button>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}

// ── Thumbnail Card ──────────────────────────────────────────────────────────

function ThumbnailCard({
  state,
  selected,
  onClick,
}: {
  state: VariantState
  selected: boolean
  onClick: () => void
}) {
  const blobUrl = state.status === 'ready' ? URL.createObjectURL(state.variant.blob) : null

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status === 'ready' && state.status])

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state.status !== 'ready'}
      className={cn(
        'relative rounded-2xl overflow-hidden flex-1 min-w-0 transition-all focus:outline-none',
        'aspect-[3/4]',
        selected && state.status === 'ready'
          ? 'ring-2 ring-accent ring-offset-2 border border-accent shadow-md'
          : 'ring-0 border border-border',
        state.status !== 'ready' && 'cursor-not-allowed'
      )}
    >
      {state.status === 'loading' || state.status === 'pending' ? (
        <div className="w-full h-full bg-muted/50 animate-pulse flex items-center justify-center">
          <Loader2 className="size-6 text-muted-foreground animate-spin" />
        </div>
      ) : state.status === 'error' ? (
        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center px-2">생성 실패</p>
        </div>
      ) : blobUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blobUrl}
          alt="매거진 썸네일"
          className="w-full h-full object-cover fade-in"
        />
      ) : null}
    </button>
  )
}

// ── Large Preview ───────────────────────────────────────────────────────────

function LargePreview({
  variant,
  previewBlobUrl,
  loading,
}: {
  variant: RenderVariant | null
  previewBlobUrl: string | null
  loading: boolean
}) {
  const src = previewBlobUrl
  if (!variant) return null

  return (
    <div className="w-full flex justify-center">
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden shadow-lg',
          'max-w-sm w-full aspect-[3/4]'
        )}
      >
        {loading && (
          <div className="absolute inset-0 bg-muted/40 flex items-center justify-center z-10">
            <Loader2 className="size-7 text-muted-foreground animate-spin" />
          </div>
        )}
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="매거진 미리보기" className="w-full h-full object-cover" />
        ) : (
          // fallback: show thumbnail blob while preview loads
          <ThumbnailBlobImg blob={variant.blob} />
        )}
      </div>
    </div>
  )
}

function ThumbnailBlobImg({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  if (!url) return <div className="w-full h-full bg-muted/50" />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="w-full h-full object-cover" />
}

// ── Firebase Save ───────────────────────────────────────────────────────────

async function saveToProfile(blob: Blob, templateId: string, contentSetIndex: number) {
  const user = getFirebaseAuth().currentUser
  if (!user) return
  try {
    const storage = getFirebaseStorage()
    const db = getFirebaseDb()
    const timestamp = Date.now()
    const path = `users/${user.uid}/magazine/${timestamp}.png`
    const sRef = storageRef(storage, path)
    await uploadBytes(sRef, blob)
    const url = await getDownloadURL(sRef)
    await addDoc(collection(db, `users/${user.uid}/generated_images`), {
      url,
      type: 'magazine',
      templateId,
      contentSetIndex,
      createdAt: serverTimestamp(),
    })
  } catch {
    // silent — save is best-effort, download already succeeded
  }
}

// ── Main Editor ─────────────────────────────────────────────────────────────

type Phase = 'upload' | 'results'

const INITIAL_VARIANTS: VariantState[] = [
  { status: 'pending' },
  { status: 'pending' },
  { status: 'pending' },
]

export function MagazineEditor() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState<VariantState[]>(INITIAL_VARIANTS)
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const [previewBlobUrls, setPreviewBlobUrls] = useState<Record<number, string>>({})
  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const generationRef = useRef(0)

  // cleanup preview blob URLs on unmount
  useEffect(() => {
    return () => { Object.values(previewBlobUrls).forEach(URL.revokeObjectURL) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addImages(srcs: string[]) {
    setImages((prev) => [...prev, ...srcs].slice(0, MAX_IMAGES))
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function runGeneration(imgs: string[]) {
    const genId = ++generationRef.current
    const imageCount = Math.min(Math.max(imgs.length, 1), 4) as 1 | 2 | 3 | 4

    setVariants([{ status: 'loading' }, { status: 'loading' }, { status: 'loading' }])
    setSelectedIdx(0)
    setPreviewBlobUrls({})

    let slot = 0
    try {
      for await (const variant of generateThreeVariants({ images: imgs, imageCount })) {
        if (generationRef.current !== genId) return
        const i = slot
        setVariants((prev) => {
          const next = [...prev] as VariantState[]
          next[i] = { status: 'ready', variant }
          return next
        })
        if (i === 0) setSelectedIdx(0)
        slot++
      }
    } catch (err) {
      if (generationRef.current !== genId) return
      const remaining = 3 - slot
      if (remaining > 0) {
        setVariants((prev) => {
          const next = [...prev] as VariantState[]
          for (let j = slot; j < 3; j++) {
            next[j] = { status: 'error', message: '생성 실패' }
          }
          return next
        })
      }
      console.error('Magazine render error:', err)
      toast.error('일부 결과 생성에 실패했습니다.')
    }
  }

  async function handleGenerate() {
    if (images.length === 0) {
      toast.error('사진을 최소 1장 업로드해주세요.')
      return
    }
    setPhase('results')
    await runGeneration(images)
  }

  async function handleRegenerate() {
    await runGeneration(images)
  }

  async function handleThumbnailClick(i: number) {
    setSelectedIdx(i)
    const v = variants[i]
    if (v.status !== 'ready') return
    if (previewBlobUrls[i]) return // already cached

    setPreviewLoading(true)
    try {
      const result = await renderAtResolution(
        v.variant.templateId,
        v.variant.contentSetIndex,
        images,
        'preview'
      )
      const url = URL.createObjectURL(result.blob)
      setPreviewBlobUrls((prev) => ({ ...prev, [i]: url }))
    } catch {
      toast.error('미리보기 로드 실패')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleDownload() {
    const v = variants[selectedIdx]
    if (v.status !== 'ready') return
    setDownloadLoading(true)
    try {
      const result = await renderAtResolution(
        v.variant.templateId,
        v.variant.contentSetIndex,
        images,
        'download'
      )
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `magazine-${v.variant.templateId}-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('다운로드 완료!')
      await saveToProfile(result.blob, v.variant.templateId, v.variant.contentSetIndex)
    } catch {
      toast.error('다운로드 실패. 다시 시도해주세요.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const selectedVariant =
    variants[selectedIdx]?.status === 'ready' ? variants[selectedIdx].variant : null
  const anyReady = variants.some((v) => v.status === 'ready')
  const allDone = variants.every((v) => v.status === 'ready' || v.status === 'error')

  // ── Upload Phase ───────────────────────────────────────────────
  if (phase === 'upload') {
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="max-w-lg mx-auto w-full px-6 py-10 flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Magazine</h1>
            <p className="text-sm text-muted-foreground">
              사진을 올리면 매거진 레이아웃이 자동으로 생성됩니다.
            </p>
          </div>

          <ImageUploadZone images={images} onAdd={addImages} onRemove={removeImage} />

          {images.length > 0 && (
            <p className="text-xs text-muted-foreground -mt-2">
              {images.length}장 선택됨 · {images.length}장 이미지 템플릿에서 3가지를 생성합니다
            </p>
          )}

          <Button
            onClick={handleGenerate}
            disabled={images.length === 0}
            className="w-full rounded-2xl gap-2 bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-sm font-semibold"
          >
            매거진 생성하기
          </Button>
        </div>
      </div>
    )
  }

  // ── Results Phase ──────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setPhase('upload'); setVariants(INITIAL_VARIANTS) }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold leading-tight">매거진 결과</h1>
            <p className="text-xs text-muted-foreground">
              {allDone ? '마음에 드는 결과를 선택하세요' : '생성 중...'}
            </p>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-3 sm:gap-4">
          {variants.map((state, i) => (
            <ThumbnailCard
              key={i}
              state={state}
              selected={selectedIdx === i}
              onClick={() => handleThumbnailClick(i)}
            />
          ))}
        </div>

        {/* Large Preview */}
        {anyReady && (
          <LargePreview
            variant={selectedVariant}
            previewBlobUrl={previewBlobUrls[selectedIdx] ?? null}
            loading={previewLoading}
          />
        )}

        {/* Action Buttons */}
        {anyReady && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              disabled={!selectedVariant || downloadLoading}
              className="flex-1 rounded-2xl gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {downloadLoading ? (
                <><Loader2 className="size-4 animate-spin" />고화질 저장 중...</>
              ) : (
                <><Download className="size-4" />PNG 다운로드</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={!allDone}
              className="flex-1 rounded-2xl gap-2"
            >
              <RefreshCw className="size-4" />
              새롭게 구성하기
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
