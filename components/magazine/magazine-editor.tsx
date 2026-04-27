'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, RefreshCw, ChevronLeft, ImagePlus, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { VariantState, RenderVariant, MagazineTemplate, ContentSet } from '@/lib/magazine/types'
import { generateThreeVariants, renderAtResolution, getTemplateAndContentSet } from '@/lib/magazine/render'
import { resolveContentKey } from '@/lib/magazine/slot-utils'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseStorage, getFirebaseDb } from '@/lib/firebase/client'

// ── Layout Sample Data (hardcoded from magazine_layouts_v5.json) ────────────

interface SlotRect { x: number; y: number; w: number; h: number }
interface LayoutSample {
  id: string
  name: string
  imageCount: 1 | 2 | 3 | 4
  aspectRatio: '4:3' | '3:4'
  bgColor: string
  textColor: string
  images: SlotRect[]
}

const LAYOUT_SAMPLES: LayoutSample[] = [
  // 1장
  { id:'1-01', name:'Vertical Label Spread', imageCount:1, aspectRatio:'4:3', bgColor:'#FAFAFA', textColor:'#0A0A0A', images:[{x:38,y:5,w:60,h:90}] },
  { id:'1-02', name:'Lookbook Hero',         imageCount:1, aspectRatio:'3:4', bgColor:'#FAFAFA', textColor:'#0A0A0A', images:[{x:45,y:10,w:55,h:65}] },
  { id:'1-03', name:'Pullquote Page',        imageCount:1, aspectRatio:'4:3', bgColor:'#E8E8E5', textColor:'#1A1A1A', images:[{x:60,y:60,w:35,h:32}] },
  // 2장
  { id:'2-01', name:'Vertical Label Duo',    imageCount:2, aspectRatio:'4:3', bgColor:'#FAFAFA', textColor:'#0A0A0A', images:[{x:4,y:6,w:32,h:88},{x:67,y:30,w:29,h:50}] },
  { id:'2-02', name:'Lookbook Duo',          imageCount:2, aspectRatio:'3:4', bgColor:'#FAFAFA', textColor:'#0A0A0A', images:[{x:35,y:4,w:60,h:55},{x:4,y:60,w:50,h:35}] },
  { id:'2-03', name:'Quote Plus Frame',      imageCount:2, aspectRatio:'4:3', bgColor:'#E8E8E5', textColor:'#1A1A1A', images:[{x:48,y:8,w:48,h:60},{x:70,y:72,w:26,h:22}] },
  // 3장
  { id:'3-01', name:'Three Verticals',       imageCount:3, aspectRatio:'4:3', bgColor:'#FAFAFA', textColor:'#0A0A0A', images:[{x:34,y:8,w:20,h:84},{x:56,y:8,w:20,h:84},{x:78,y:8,w:20,h:84}] },
  { id:'3-02', name:'Hero Plus Duo',         imageCount:3, aspectRatio:'3:4', bgColor:'#FAFAFA', textColor:'#0A0A0A', images:[{x:0,y:0,w:100,h:42},{x:34,y:50,w:32,h:35},{x:68,y:50,w:30,h:35}] },
  { id:'3-03', name:'Quote Plus Trio',       imageCount:3, aspectRatio:'4:3', bgColor:'#F5F1E8', textColor:'#1A1A1A', images:[{x:48,y:6,w:48,h:38},{x:48,y:48,w:23,h:46},{x:73,y:48,w:23,h:46}] },
  // 4장
  { id:'4-01', name:'Quad Grid',             imageCount:4, aspectRatio:'4:3', bgColor:'#FAFAFA', textColor:'#0A0A0A', images:[{x:12,y:8,w:21,h:40},{x:35,y:8,w:21,h:40},{x:58,y:8,w:19,h:40},{x:79,y:8,w:17,h:40}] },
  { id:'4-02', name:'Travel Album',          imageCount:4, aspectRatio:'4:3', bgColor:'#FAFAFA', textColor:'#0A0A0A', images:[{x:2,y:4,w:47,h:46},{x:51,y:4,w:47,h:46},{x:2,y:52,w:47,h:44},{x:51,y:52,w:47,h:44}] },
  { id:'4-03', name:'Heritage Quad',         imageCount:4, aspectRatio:'4:3', bgColor:'#F5F1E8', textColor:'#1A1A1A', images:[{x:4,y:4,w:38,h:56},{x:46,y:4,w:22,h:26},{x:70,y:4,w:22,h:26},{x:46,y:32,w:46,h:28}] },
]

// ── Layout Preview Card (SVG wireframe) ──────────────────────────────────────

function LayoutPreviewCard({ sample }: { sample: LayoutSample }) {
  const isPortrait = sample.aspectRatio === '3:4'
  // Viewbox: 100×75 (4:3) or 75×100 (3:4)
  const vw = isPortrait ? 75 : 100
  const vh = isPortrait ? 100 : 75
  const imgAlpha = sample.bgColor === '#FAFAFA' || sample.bgColor === '#F5F1E8' ? '0.18' : '0.30'

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="rounded-xl overflow-hidden border border-border/50 shadow-sm"
        style={{ aspectRatio: isPortrait ? '3/4' : '4/3' }}
      >
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{ background: sample.bgColor }}
        >
          {/* Image slots */}
          {sample.images.map((img, i) => (
            <rect
              key={i}
              x={(img.x / 100) * vw}
              y={(img.y / 100) * vh}
              width={(img.w / 100) * vw}
              height={(img.h / 100) * vh}
              fill={sample.textColor}
              fillOpacity={imgAlpha}
              rx="1"
            />
          ))}
          {/* Subtle text-area hint lines */}
          {[0.25, 0.4, 0.55].map((py, i) => (
            <rect
              key={`t${i}`}
              x={isPortrait ? 4 : 4}
              y={py * vh}
              width={isPortrait ? 28 : 22}
              height={1.5}
              fill={sample.textColor}
              fillOpacity={0.12}
              rx="0.5"
            />
          ))}
        </svg>
      </div>
      <p className="text-[10px] text-muted-foreground text-center leading-tight truncate px-0.5">{sample.name}</p>
    </div>
  )
}

// ── Layout Samples Section ────────────────────────────────────────────────────

function LayoutSamplesSection() {
  const groups: { label: string; count: 1|2|3|4 }[] = [
    { label: '사진 1장', count: 1 },
    { label: '사진 2장', count: 2 },
    { label: '사진 3장', count: 3 },
    { label: '사진 4장', count: 4 },
  ]

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs text-muted-foreground font-medium shrink-0">레이아웃 샘플</p>
        <div className="h-px flex-1 bg-border" />
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        업로드한 사진 수에 따라 아래 스타일 중 3가지가 자동 생성됩니다.
      </p>
      {groups.map(({ label, count }) => {
        const samples = LAYOUT_SAMPLES.filter(s => s.imageCount === count)
        return (
          <div key={count} className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground/70">{label}</p>
            <div className="grid grid-cols-3 gap-2">
              {samples.map(s => <LayoutPreviewCard key={s.id} sample={s} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Constants ───────────────────────────────────────────────────────────────

const MAX_IMAGES = 4

const SLOT_LABELS: Record<string, string> = {
  eyebrow:    '상단 라벨',
  title:      '제목',
  byline:     '바이라인',
  body:       '본문',
  vertical:   '세로 텍스트',
  folio:      '페이지 번호',
  pullquote:  '인용구',
  caption:    '캡션',
  kicker:     '리드 문구',
  masthead:   '마스트헤드',
  number:     '번호',
  script:     '필기체',
  runninghead:'러닝 헤드',
  infobox:    '정보 박스',
  label:      '라벨',
}

const MULTILINE_TYPES = new Set(['body', 'pullquote', 'caption'])

// ── Types ────────────────────────────────────────────────────────────────────

interface EditableField {
  key: string
  label: string
  multiline: boolean
  value: string
  max: number | undefined
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildEditableFields(
  template: MagazineTemplate,
  contentSet: ContentSet
): EditableField[] {
  return template.texts
    .map((slot, i) => {
      const key = resolveContentKey(template.texts, i, slot)
      const raw = contentSet[key]
      if (typeof raw !== 'string') return null // skip objects (infobox) & undefined
      return {
        key,
        label: SLOT_LABELS[slot.type] ?? slot.type,
        multiline: MULTILINE_TYPES.has(slot.type),
        value: raw,
        max: template.char_limits[slot.type]?.max,
      }
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)
}

async function saveToProfile(blob: Blob, templateId: string, contentSetIndex: number) {
  const user = getFirebaseAuth().currentUser
  if (!user) return
  try {
    const storage = getFirebaseStorage()
    const db = getFirebaseDb()
    const path = `users/${user.uid}/magazine/${Date.now()}.png`
    const sRef = storageRef(storage, path)
    await uploadBytes(sRef, blob)
    const url = await getDownloadURL(sRef)
    await addDoc(collection(db, `users/${user.uid}/generated_images`), {
      url, type: 'magazine', templateId, contentSetIndex,
      createdAt: serverTimestamp(),
    })
  } catch {
    // best-effort — download already succeeded
  }
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

function ImageUploadZone({
  images, onAdd, onRemove,
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

  return (
    <div className="flex flex-col gap-4">
      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files) }}
          className={cn(
            'flex flex-col items-center justify-center gap-3 aspect-[4/3] w-full rounded-2xl border-2 border-dashed transition-colors',
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
          {images.length < MAX_IMAGES && (
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
        ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { if (e.target.files?.length) { processFiles(e.target.files); e.target.value = '' } }}
      />
    </div>
  )
}

// ── Thumbnail Card ────────────────────────────────────────────────────────────

function ThumbnailCard({
  state, active, onClick,
}: {
  state: VariantState
  active: boolean
  onClick: () => void
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    if (state.status !== 'ready') return
    const url = URL.createObjectURL(state.variant.blob)
    setBlobUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [state])

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state.status !== 'ready'}
      className={cn(
        'relative rounded-2xl overflow-hidden flex-1 min-w-0 aspect-[3/4] transition-all focus:outline-none',
        active
          ? 'ring-2 ring-accent ring-offset-2 border border-accent'
          : 'ring-0 border border-border hover:border-foreground/30',
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
        <img src={blobUrl} alt="매거진 썸네일" className="w-full h-full object-cover" />
      ) : null}
    </button>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

interface ModalState {
  variant: RenderVariant
  template: MagazineTemplate | null
  contentSet: ContentSet | null
  previewBlobUrl: string | null
  previewLoading: boolean
}

function EditModal({
  open,
  modal,
  editedTexts,
  onTextChange,
  onClose,
  onSave,
  saveLoading,
}: {
  open: boolean
  modal: ModalState | null
  editedTexts: Record<string, string>
  onTextChange: (key: string, val: string) => void
  onClose: () => void
  onSave: () => void
  saveLoading: boolean
}) {
  const template = modal?.template ?? null
  const contentSet = modal?.contentSet ?? null

  const fields: EditableField[] = template && contentSet
    ? buildEditableFields(template, contentSet)
    : []

  const isPortrait = !template || template.aspectRatio === '3:4'

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-4xl w-full p-0 gap-0 overflow-hidden rounded-2xl max-h-[90vh]">
        <div className="flex flex-col md:flex-row max-h-[90vh]">

          {/* ── Left: Preview ─────────────────────────────────── */}
          <div className={cn(
            'bg-muted/30 flex items-center justify-center p-6 shrink-0',
            'md:w-[340px] md:max-h-full',
            'max-h-[40vh] md:max-h-none'
          )}>
            <div className={cn(
              'relative rounded-xl overflow-hidden shadow-lg bg-muted w-full',
              isPortrait ? 'aspect-[3/4]' : 'aspect-[4/3]',
              'md:max-h-[calc(90vh-80px)]'
            )}>
              {modal?.previewLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
                  <Loader2 className="size-7 text-muted-foreground animate-spin" />
                </div>
              ) : modal?.previewBlobUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={modal.previewBlobUrl}
                  alt="매거진 미리보기"
                  className="w-full h-full object-contain"
                />
              ) : modal ? (
                <ThumbnailBlobImg blob={modal.variant.blob} />
              ) : null}
            </div>
          </div>

          {/* ── Right: Text Fields ─────────────────────────────── */}
          <div className="flex flex-col flex-1 min-h-0">
            <DialogHeader className="px-6 pt-5 pb-3 shrink-0 border-b border-border">
              <DialogTitle className="text-base">텍스트 편집</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                자동 생성된 텍스트를 자유롭게 수정하세요.
              </p>
            </DialogHeader>

            {/* Scrollable fields */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              {fields.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-5 text-muted-foreground animate-spin" />
                </div>
              ) : (
                fields.map((field) => {
                  const current = editedTexts[field.key] ?? field.value
                  return (
                    <div key={field.key} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {field.label}
                        </Label>
                        {field.max && (
                          <span className={cn(
                            'text-[10px] tabular-nums',
                            current.length > field.max ? 'text-destructive' : 'text-muted-foreground/60'
                          )}>
                            {current.length}/{field.max}
                          </span>
                        )}
                      </div>
                      {field.multiline ? (
                        <Textarea
                          value={current}
                          onChange={(e) => onTextChange(field.key, e.target.value)}
                          rows={4}
                          className="resize-none text-sm rounded-xl"
                        />
                      ) : (
                        <Input
                          value={current}
                          onChange={(e) => onTextChange(field.key, e.target.value)}
                          className="text-sm rounded-xl"
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border shrink-0 flex-row gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl"
                disabled={saveLoading}
              >
                취소
              </Button>
              <Button
                onClick={onSave}
                disabled={saveLoading || fields.length === 0}
                className="flex-1 rounded-xl gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {saveLoading ? (
                  <><Loader2 className="size-4 animate-spin" />저장 중...</>
                ) : (
                  <><Save className="size-4" />PNG 저장하기</>
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  return <img src={url} alt="" className="w-full h-full object-contain" />
}

// ── Main Editor ───────────────────────────────────────────────────────────────

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
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const generationRef = useRef(0)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({})
  const [saveLoading, setSaveLoading] = useState(false)

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
    setActiveIdx(null)

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
        slot++
      }
    } catch (err) {
      if (generationRef.current !== genId) return
      setVariants((prev) => {
        const next = [...prev] as VariantState[]
        for (let j = slot; j < 3; j++) next[j] = { status: 'error', message: '생성 실패' }
        return next
      })
      console.error('Magazine render error:', err)
      toast.error('일부 결과 생성에 실패했습니다.')
    }
  }

  async function handleGenerate() {
    if (images.length === 0) { toast.error('사진을 최소 1장 업로드해주세요.'); return }
    setPhase('results')
    await runGeneration(images)
  }

  async function handleThumbnailClick(i: number) {
    const v = variants[i]
    if (v.status !== 'ready') return

    setActiveIdx(i)
    setEditedTexts({})

    // Open modal immediately with thumbnail as placeholder
    const initialModal: ModalState = {
      variant: v.variant,
      template: null,
      contentSet: null,
      previewBlobUrl: null,
      previewLoading: true,
    }
    setModal(initialModal)
    setModalOpen(true)

    // Load template info + 800px preview in parallel
    try {
      const [{ template, contentSet }, previewResult] = await Promise.all([
        getTemplateAndContentSet(v.variant.templateId, v.variant.contentSetIndex),
        renderAtResolution(v.variant.templateId, v.variant.contentSetIndex, images, 'preview'),
      ])
      const previewUrl = URL.createObjectURL(previewResult.blob)
      setModal({
        variant: v.variant,
        template,
        contentSet,
        previewBlobUrl: previewUrl,
        previewLoading: false,
      })
    } catch {
      setModal((prev) => prev ? { ...prev, previewLoading: false } : null)
      toast.error('미리보기 로드 실패')
    }
  }

  function handleModalClose() {
    if (modal?.previewBlobUrl) URL.revokeObjectURL(modal.previewBlobUrl)
    setModalOpen(false)
    setModal(null)
    setEditedTexts({})
  }

  async function handleSave() {
    if (!modal) return
    setSaveLoading(true)
    try {
      // Merge edited texts on top of original contentSet
      const base = modal.contentSet ?? {}
      const merged: ContentSet = { ...base, ...editedTexts }

      const result = await renderAtResolution(
        modal.variant.templateId,
        modal.variant.contentSetIndex,
        images,
        'download',
        merged
      )

      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `magazine-${modal.variant.templateId}-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('저장 완료!')
      handleModalClose()
      await saveToProfile(result.blob, modal.variant.templateId, modal.variant.contentSetIndex)
    } catch {
      toast.error('저장 실패. 다시 시도해주세요.')
    } finally {
      setSaveLoading(false)
    }
  }

  const allDone = variants.every((v) => v.status === 'ready' || v.status === 'error')

  // ── Upload Phase ────────────────────────────────────────────────────────
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
              {images.length}장 선택됨 · {images.length}장 이미지에 맞는 템플릿 3가지 생성
            </p>
          )}
          <Button
            onClick={handleGenerate}
            disabled={images.length === 0}
            className="w-full rounded-2xl gap-2 bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-sm font-semibold"
          >
            매거진 생성하기
          </Button>
          <LayoutSamplesSection />
        </div>
      </div>
    )
  }

  // ── Results Phase ────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col h-full overflow-auto">
        <div className="max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-8">

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
                {allDone ? '썸네일을 클릭하면 편집·저장할 수 있습니다' : '생성 중...'}
              </p>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-3 sm:gap-4">
            {variants.map((state, i) => (
              <ThumbnailCard
                key={i}
                state={state}
                active={activeIdx === i && modalOpen}
                onClick={() => handleThumbnailClick(i)}
              />
            ))}
          </div>

          {/* Regenerate */}
          {allDone && (
            <Button
              variant="outline"
              onClick={() => runGeneration(images)}
              className="w-full rounded-2xl gap-2"
            >
              <RefreshCw className="size-4" />
              새롭게 구성하기
            </Button>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditModal
        open={modalOpen}
        modal={modal}
        editedTexts={editedTexts}
        onTextChange={(key, val) => setEditedTexts((prev) => ({ ...prev, [key]: val }))}
        onClose={handleModalClose}
        onSave={handleSave}
        saveLoading={saveLoading}
      />
    </>
  )
}
