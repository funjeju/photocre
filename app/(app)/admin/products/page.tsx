'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFirebaseDb } from '@/lib/firebase/client';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { PRODUCT_PRESETS, type ProductPreset } from '@/lib/presets/products';
import { ko } from '@/lib/i18n/ko';

interface ProductOverride {
  id: string;
  basePrice?: number;
  isActive?: boolean;
  description?: string;
}

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, ProductOverride>>({});
  const [edits, setEdits] = useState<Record<string, Partial<ProductPreset & { isActive: boolean }>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirebaseDb();
    getDocs(collection(db, 'products')).then((snap) => {
      const map: Record<string, ProductOverride> = {};
      snap.docs.forEach((d) => { map[d.id] = { id: d.id, ...d.data() } as ProductOverride; });
      setOverrides(map);
      setLoading(false);
    });
  }, []);

  function getEffective(preset: ProductPreset) {
    const ov = overrides[preset.id];
    const ed = edits[preset.id];
    return {
      basePrice:   ed?.basePrice   ?? ov?.basePrice   ?? preset.basePrice,
      description: ed?.description ?? ov?.description ?? preset.description,
      isActive:    ed?.isActive    ?? ov?.isActive    ?? true,
    };
  }

  async function handleSave(preset: ProductPreset) {
    if (!user) return;
    setSaving(preset.id);
    const effective = getEffective(preset);
    const db = getFirebaseDb();
    try {
      await setDoc(doc(db, 'products', preset.id), {
        basePrice:   effective.basePrice,
        description: effective.description,
        isActive:    effective.isActive,
      });
      setOverrides((prev) => ({ ...prev, [preset.id]: { id: preset.id, ...effective } }));
      setEdits((prev) => { const n = { ...prev }; delete n[preset.id]; return n; });
      toast.success('저장되었습니다.');
    } catch {
      toast.error(ko.errors.unknown);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 lg:px-8">
        <h1 className="mb-6 text-xl font-semibold">{ko.admin.products}</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRODUCT_PRESETS.map((preset) => {
            const effective = getEffective(preset);
            const isDirty = !!edits[preset.id];
            return (
              <div key={preset.id} className="flex flex-col gap-4 rounded-2xl border border-border/60 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.id}</p>
                  </div>
                  {/* 토글 */}
                  <button
                    onClick={() => setEdits((prev) => ({
                      ...prev,
                      [preset.id]: { ...(prev[preset.id] ?? {}), isActive: !effective.isActive },
                    }))}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      effective.isActive
                        ? 'bg-accent/20 text-accent'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {effective.isActive ? ko.admin.active : ko.admin.inactive}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{ko.admin.basePrice}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={effective.basePrice}
                      onChange={(e) => setEdits((prev) => ({
                        ...prev,
                        [preset.id]: { ...(prev[preset.id] ?? {}), basePrice: Number(e.target.value) },
                      }))}
                      className="rounded-xl"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">원</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">설명</Label>
                  <Input
                    value={effective.description}
                    onChange={(e) => setEdits((prev) => ({
                      ...prev,
                      [preset.id]: { ...(prev[preset.id] ?? {}), description: e.target.value },
                    }))}
                    className="rounded-xl text-sm"
                  />
                </div>

                <Button
                  size="sm"
                  variant={isDirty ? 'default' : 'outline'}
                  className="rounded-xl gap-1.5 self-end"
                  disabled={saving === preset.id || !isDirty}
                  onClick={() => handleSave(preset)}
                >
                  {saving === preset.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  {ko.admin.save}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
