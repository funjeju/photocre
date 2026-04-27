'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  collection, getDocs, orderBy, query, limit,
  doc, getDoc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, writeBatch,
} from 'firebase/firestore';
import {
  Sparkles, Loader2, ShoppingBag, ImageOff, Zap, Download,
  FileText, FolderPlus, Folder, FolderOpen, MoreHorizontal,
  Pencil, Trash2, FolderInput, Check, X, FolderX,
} from 'lucide-react';
import type { DreamReport } from '@/app/api/dream/route';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFirebaseDb } from '@/lib/firebase/client';
import { PRODUCT_PRESETS } from '@/lib/presets/products';
import { STYLES } from '@/lib/presets/styles';
import { ko } from '@/lib/i18n/ko';

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */

interface Folder {
  id: string;
  name: string;
  createdAt: unknown;
}

interface Generation {
  id: string;
  outputImagePath: string;
  presets?: { styleId?: string; customPrompt?: string };
  createdAt: unknown;
  status: string;
  folderId?: string | null;
  label?: string;
}

interface DreamResult {
  id: string;
  career: string;
  age: number;
  outputImageUrl: string;
  report: DreamReport;
  createdAt: unknown;
}

interface UserDoc {
  credits: number;
  plan: 'free' | 'personal' | 'pro';
}

/* ═══════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════ */

function toDate(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  const t = ts as { toDate?: () => Date };
  return t.toDate?.() ?? null;
}
function formatDate(ts: unknown) {
  const d = toDate(ts);
  if (!d) return '-';
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatDateTime(ts: unknown) {
  const d = toDate(ts);
  if (!d) return '-';
  return d.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function getStyleName(styleId?: string) {
  if (!styleId) return null;
  return STYLES.find((s) => s.id === styleId)?.name ?? styleId;
}

/* ═══════════════════════════════════════════════════════════════
   FOLDER BAR
═══════════════════════════════════════════════════════════════ */

function FolderBar({
  folders,
  selected,
  onSelect,
  onRename,
  onDelete,
  onNew,
}: {
  folders: Folder[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {/* 전체 탭 */}
      <button
        onClick={() => onSelect(null)}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
          selected === null
            ? 'bg-accent text-accent-foreground'
            : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <FolderOpen className="size-3.5" />
        {ko.profile.folder.all}
      </button>

      {/* 폴더 탭들 */}
      {folders.map((folder) => (
        <div key={folder.id} className="relative flex shrink-0 items-center">
          <button
            onClick={() => onSelect(folder.id)}
            className={`flex items-center gap-1.5 rounded-full pl-3 pr-2 py-1.5 text-xs font-medium transition-colors ${
              selected === folder.id
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Folder className="size-3.5" />
            {folder.name}
          </button>
          {/* 폴더 관리 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`ml-0.5 flex size-5 items-center justify-center rounded-full transition-colors hover:bg-black/10 ${
                selected === folder.id ? 'text-accent-foreground/70' : 'text-muted-foreground'
              }`}>
                <MoreHorizontal className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              <DropdownMenuItem onClick={() => onRename(folder)} className="gap-2 text-xs">
                <Pencil className="size-3.5" />
                {ko.profile.folder.rename}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(folder)} className="gap-2 text-xs text-destructive focus:text-destructive">
                <FolderX className="size-3.5" />
                {ko.profile.folder.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      {/* 새 폴더 버튼 */}
      <button
        onClick={onNew}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
      >
        <FolderPlus className="size-3.5" />
        {ko.profile.folder.newFolder}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GENERATION CARD
═══════════════════════════════════════════════════════════════ */

function GenerationCard({
  gen,
  folders,
  onClick,
  onOrder,
  onMoveToFolder,
  onEditLabel,
  onDelete,
  onDownload,
}: {
  gen: Generation;
  folders: Folder[];
  onClick: () => void;
  onOrder: (productId: string) => void;
  onMoveToFolder: (folderId: string | null) => void;
  onEditLabel: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const label = gen.label || formatDate(gen.createdAt);

  return (
    <div className="group relative flex flex-col gap-1.5">
      {/* 썸네일 */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted/30">
        <button
          onClick={onClick}
          className="h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gen.outputImagePath}
            alt={label}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        {/* hover 오버레이: ... 메뉴 */}
        <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex size-7 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur hover:bg-background transition-colors"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {/* 다운로드 */}
              <DropdownMenuItem onClick={onDownload} className="gap-2 text-xs">
                <Download className="size-3.5" />
                {ko.profile.gen.download}
              </DropdownMenuItem>

              {/* 이름 변경 */}
              <DropdownMenuItem onClick={onEditLabel} className="gap-2 text-xs">
                <Pencil className="size-3.5" />
                {ko.profile.gen.editLabel}
              </DropdownMenuItem>

              {/* 폴더로 이동 */}
              {folders.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 text-xs">
                    <FolderInput className="size-3.5" />
                    {ko.profile.gen.moveToFolder}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-40">
                    {/* 미분류로 이동 */}
                    <DropdownMenuItem
                      onClick={() => onMoveToFolder(null)}
                      className="gap-2 text-xs"
                    >
                      <FolderOpen className="size-3.5" />
                      {ko.profile.folder.all}
                      {!gen.folderId && <Check className="size-3 ml-auto text-accent" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {folders.map((f) => (
                      <DropdownMenuItem
                        key={f.id}
                        onClick={() => onMoveToFolder(f.id)}
                        className="gap-2 text-xs"
                      >
                        <Folder className="size-3.5" />
                        {f.name}
                        {gen.folderId === f.id && <Check className="size-3 ml-auto text-accent" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {/* 주문하기 */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 text-xs">
                  <ShoppingBag className="size-3.5" />
                  주문하기
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-44">
                  {PRODUCT_PRESETS.map((p) => (
                    <DropdownMenuItem key={p.id} onClick={() => onOrder(p.id)} className="text-xs">
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* 삭제 */}
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-xs text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5" />
                {ko.profile.gen.deleteImage}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="truncate px-0.5 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GENERATION DETAIL MODAL
═══════════════════════════════════════════════════════════════ */

function GenerationModal({
  gen,
  open,
  onClose,
  onOrder,
}: {
  gen: Generation | null;
  open: boolean;
  onClose: () => void;
  onOrder: (productId: string, gen: Generation) => void;
}) {
  if (!gen) return null;
  const styleName = getStyleName(gen.presets?.styleId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl w-full p-0 overflow-hidden rounded-2xl gap-0 border-border/60 bg-background">
        <div className="w-full bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gen.outputImagePath} alt="생성 이미지" className="w-full object-contain max-h-[80vh]" />
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-border/40">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-medium">{gen.label || formatDateTime(gen.createdAt)}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {styleName && <Badge variant="outline" className="text-xs">{styleName}</Badge>}
              {gen.presets?.customPrompt && (
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  &ldquo;{gen.presets.customPrompt}&rdquo;
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1.5 shrink-0">
                <ShoppingBag className="size-4" />
                주문하기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {PRODUCT_PRESETS.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => { onClose(); onOrder(p.id, gen); }}>
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOLDER DIALOG (create / rename)
═══════════════════════════════════════════════════════════════ */

function FolderDialog({
  open,
  mode,
  initialName,
  onConfirm,
  onClose,
}: {
  open: boolean;
  mode: 'create' | 'rename';
  initialName?: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initialName ?? '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initialName]);

  function handleConfirm() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? ko.profile.folder.createTitle : ko.profile.folder.rename}
          </DialogTitle>
        </DialogHeader>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          placeholder={
            mode === 'create'
              ? ko.profile.folder.createPlaceholder
              : ko.profile.folder.renamePlaceholder
          }
          maxLength={30}
          className="rounded-xl"
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim()} className="rounded-xl">
            {mode === 'create' ? '만들기' : '변경'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDIT LABEL DIALOG
═══════════════════════════════════════════════════════════════ */

function EditLabelDialog({
  open,
  gen,
  onConfirm,
  onClose,
}: {
  open: boolean;
  gen: Generation | null;
  onConfirm: (label: string) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && gen) {
      setLabel(gen.label ?? '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, gen]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{ko.profile.gen.editLabel}</DialogTitle>
        </DialogHeader>
        {gen && (
          <div className="flex gap-3 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gen.outputImagePath}
              alt=""
              className="size-14 rounded-xl object-cover border border-border/40 shrink-0"
            />
            <Input
              ref={inputRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onConfirm(label.trim())}
              placeholder={ko.profile.gen.labelPlaceholder}
              maxLength={40}
              className="rounded-xl"
            />
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            취소
          </Button>
          <Button onClick={() => onConfirm(label.trim())} className="rounded-xl">
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [dreams, setDreams] = useState<DreamResult[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // 선택 폴더 (null = 전체)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // 모달 상태
  const [modalGen, setModalGen] = useState<Generation | null>(null);
  const [folderDialogMode, setFolderDialogMode] = useState<'create' | 'rename' | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [editingGen, setEditingGen] = useState<Generation | null>(null);
  const [dreamPDFLoading, setDreamPDFLoading] = useState<string | null>(null);

  /* ── 초기 데이터 로드 ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }

    const db = getFirebaseDb();
    Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDocs(query(collection(db, 'users', user.uid, 'folders'), orderBy('createdAt', 'asc'))),
      getDocs(query(collection(db, 'users', user.uid, 'generations'), orderBy('createdAt', 'desc'), limit(120))),
      getDocs(query(collection(db, 'users', user.uid, 'dreams'), orderBy('createdAt', 'desc'), limit(20))),
    ]).then(([userSnap, folderSnap, genSnap, dreamSnap]) => {
      if (userSnap.exists()) setUserDoc(userSnap.data() as UserDoc);
      setFolders(folderSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Folder)));
      setGenerations(genSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Generation)));
      setDreams(dreamSnap.docs.map((d) => ({ id: d.id, ...d.data() } as DreamResult)));
    }).finally(() => setLoadingData(false));
  }, [user, authLoading, router]);

  /* ── 폴더 생성 ── */
  async function handleCreateFolder(name: string) {
    if (!user) return;
    const db = getFirebaseDb();
    const ref = await addDoc(collection(db, 'users', user.uid, 'folders'), {
      name,
      createdAt: serverTimestamp(),
    });
    const newFolder: Folder = { id: ref.id, name, createdAt: new Date() };
    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolder(ref.id);
    setFolderDialogMode(null);
    toast.success(`폴더 "${name}"를 만들었습니다.`);
  }

  /* ── 폴더 이름 변경 ── */
  async function handleRenameFolder(name: string) {
    if (!user || !renamingFolder) return;
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'users', user.uid, 'folders', renamingFolder.id), { name });
    setFolders((prev) => prev.map((f) => f.id === renamingFolder.id ? { ...f, name } : f));
    setRenamingFolder(null);
    setFolderDialogMode(null);
    toast.success('폴더 이름을 변경했습니다.');
  }

  /* ── 폴더 삭제 ── */
  function handleDeleteFolder(folder: Folder) {
    toast(`폴더 "${folder.name}"를 삭제할까요?`, {
      description: ko.profile.folder.deleteConfirm,
      action: {
        label: '삭제',
        onClick: async () => {
          if (!user) return;
          const db = getFirebaseDb();
          const batch = writeBatch(db);

          // 해당 폴더 내 이미지들 folderId 제거
          const gensInFolder = generations.filter((g) => g.folderId === folder.id);
          gensInFolder.forEach((g) => {
            batch.update(doc(db, 'users', user.uid, 'generations', g.id), { folderId: null });
          });
          // 폴더 문서 삭제
          batch.delete(doc(db, 'users', user.uid, 'folders', folder.id));
          await batch.commit();

          setGenerations((prev) => prev.map((g) =>
            g.folderId === folder.id ? { ...g, folderId: null } : g
          ));
          setFolders((prev) => prev.filter((f) => f.id !== folder.id));
          if (selectedFolder === folder.id) setSelectedFolder(null);
          toast.success(`폴더 "${folder.name}"를 삭제했습니다.`);
        },
      },
      cancel: { label: '취소', onClick: () => {} },
    });
  }

  /* ── 이미지 폴더 이동 ── */
  async function handleMoveToFolder(gen: Generation, folderId: string | null) {
    if (!user) return;
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'users', user.uid, 'generations', gen.id), { folderId: folderId ?? null });
    setGenerations((prev) => prev.map((g) => g.id === gen.id ? { ...g, folderId } : g));
    const folderName = folderId ? folders.find((f) => f.id === folderId)?.name : ko.profile.folder.all;
    toast.success(`"${folderName}"로 이동했습니다.`);
  }

  /* ── 이미지 라벨 수정 ── */
  async function handleEditLabel(label: string) {
    if (!user || !editingGen) return;
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'users', user.uid, 'generations', editingGen.id), { label: label || null });
    setGenerations((prev) => prev.map((g) => g.id === editingGen.id ? { ...g, label: label || undefined } : g));
    setEditingGen(null);
    toast.success('이름을 변경했습니다.');
  }

  /* ── 이미지 삭제 ── */
  function handleDeleteGen(gen: Generation) {
    toast(ko.profile.gen.deleteConfirm, {
      action: {
        label: '삭제',
        onClick: async () => {
          if (!user) return;
          const db = getFirebaseDb();
          await deleteDoc(doc(db, 'users', user.uid, 'generations', gen.id));
          setGenerations((prev) => prev.filter((g) => g.id !== gen.id));
          if (modalGen?.id === gen.id) setModalGen(null);
          toast.success('이미지를 삭제했습니다.');
        },
      },
      cancel: { label: '취소', onClick: () => {} },
    });
  }

  /* ── 이미지 다운로드 ── */
  async function handleDownloadGen(gen: Generation) {
    try {
      const res = await fetch(gen.outputImagePath);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${gen.label || gen.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('다운로드에 실패했습니다.');
    }
  }

  /* ── 주문 이동 ── */
  function handleOrder(productId: string, gen: Generation) {
    const params = new URLSearchParams({ img: gen.outputImagePath, gid: gen.id });
    router.push(`/product/${productId}?${params.toString()}`);
  }

  /* ── Dream 다운로드 ── */
  async function handleDreamImageDownload(dream: DreamResult) {
    const { downloadImageFromUrl } = await import('@/components/dream/dream-pdf');
    await downloadImageFromUrl(dream.outputImageUrl, `dream-${dream.career}-${dream.age}살.jpg`);
  }
  async function handleDreamPDFDownload(dream: DreamResult) {
    setDreamPDFLoading(dream.id);
    try {
      const { downloadDreamPDF } = await import('@/components/dream/dream-pdf');
      await downloadDreamPDF({ imageUrl: dream.outputImageUrl, report: dream.report, career: dream.career, age: dream.age });
    } catch {
      toast.error('PDF 생성에 실패했습니다.');
    } finally {
      setDreamPDFLoading(null);
    }
  }

  /* ── 렌더 ── */
  if (authLoading || loadingData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  const initials = user.displayName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const planLabel = userDoc ? ko.profile.plan[userDoc.plan] : ko.profile.plan.free;

  // 현재 선택 폴더 기준 필터
  const visibleGens = selectedFolder === null
    ? generations
    : generations.filter((g) => g.folderId === selectedFolder);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8 flex flex-col gap-10">

        {/* 유저 정보 */}
        <div className="flex items-center gap-5 rounded-2xl border border-border/40 bg-muted/20 p-6">
          <Avatar className="size-16 shrink-0">
            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ''} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-lg font-semibold truncate">{user.displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{planLabel}</Badge>
              {userDoc && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="size-3" />
                  {ko.credits.badge.replace('{{count}}', String(userDoc.credits))}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => router.push('/orders')}>
              주문 내역
            </Button>
          </div>
        </div>

        {/* 생성 이미지 갤러리 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {ko.profile.myImages}
            </h2>
            <span className="text-xs text-muted-foreground">
              {visibleGens.length}/{generations.length}개
            </span>
          </div>

          {/* 폴더 탭 바 */}
          {(folders.length > 0 || generations.length > 0) && (
            <FolderBar
              folders={folders}
              selected={selectedFolder}
              onSelect={setSelectedFolder}
              onRename={(f) => { setRenamingFolder(f); setFolderDialogMode('rename'); }}
              onDelete={handleDeleteFolder}
              onNew={() => setFolderDialogMode('create')}
            />
          )}

          {/* 갤러리 그리드 */}
          {generations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 py-16 text-center">
              <ImageOff className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{ko.profile.empty}</p>
              <p className="text-xs text-muted-foreground/70">{ko.profile.emptyHint}</p>
              <Button variant="outline" size="sm" className="mt-2 rounded-xl" onClick={() => router.push('/studio')}>
                Studio 열기
              </Button>
            </div>
          ) : visibleGens.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-12 text-center">
              <Folder className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{ko.profile.folder.noImages}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {visibleGens.map((gen) => (
                <GenerationCard
                  key={gen.id}
                  gen={gen}
                  folders={folders}
                  onClick={() => setModalGen(gen)}
                  onOrder={(productId) => handleOrder(productId, gen)}
                  onMoveToFolder={(folderId) => handleMoveToFolder(gen, folderId)}
                  onEditLabel={() => setEditingGen(gen)}
                  onDelete={() => handleDeleteGen(gen)}
                  onDownload={() => handleDownloadGen(gen)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Dream 기록 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              {ko.dream.myDreams}
            </h2>
            {dreams.length > 0 && (
              <span className="text-xs text-muted-foreground">{dreams.length}개</span>
            )}
          </div>

          {dreams.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-10 text-center">
              <Sparkles className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{ko.dream.dreamsEmpty}</p>
              <p className="text-xs text-muted-foreground/70">{ko.dream.dreamsEmptyHint}</p>
              <Button variant="outline" size="sm" className="mt-1 rounded-xl gap-1.5" onClick={() => router.push('/dream')}>
                <Sparkles className="size-3.5" />
                Dream 열기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {dreams.map((dream) => (
                <div key={dream.id} className="group flex flex-col gap-1.5">
                  <div className="aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dream.outputImageUrl}
                      alt={dream.career}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-0.5">
                    <p className="text-xs font-medium truncate">{dream.career} · {dream.age}살</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(dream.createdAt)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] rounded-xl gap-1 px-2"
                      onClick={() => handleDreamImageDownload(dream)}>
                      <Download className="size-3" />이미지
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] rounded-xl gap-1 px-2"
                      onClick={() => handleDreamPDFDownload(dream)} disabled={dreamPDFLoading === dream.id}>
                      {dreamPDFLoading === dream.id
                        ? <Loader2 className="size-3 animate-spin" />
                        : <FileText className="size-3" />}
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── 모달들 ── */}

      <GenerationModal
        gen={modalGen}
        open={!!modalGen}
        onClose={() => setModalGen(null)}
        onOrder={handleOrder}
      />

      <FolderDialog
        open={folderDialogMode === 'create'}
        mode="create"
        onConfirm={handleCreateFolder}
        onClose={() => setFolderDialogMode(null)}
      />

      <FolderDialog
        open={folderDialogMode === 'rename'}
        mode="rename"
        initialName={renamingFolder?.name}
        onConfirm={handleRenameFolder}
        onClose={() => { setFolderDialogMode(null); setRenamingFolder(null); }}
      />

      <EditLabelDialog
        open={!!editingGen}
        gen={editingGen}
        onConfirm={handleEditLabel}
        onClose={() => setEditingGen(null)}
      />
    </div>
  );
}
