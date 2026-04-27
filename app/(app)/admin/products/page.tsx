'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFirebaseDb } from '@/lib/firebase/client';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { PRODUCT_PRESETS, type ProductPreset, type ProductOption } from '@/lib/presets/products';
import { ko } from '@/lib/i18n/ko';

interface ProductOverride {
  id: string;
  basePrice?: number;
  isActive?: boolean;
  description?: string;
  deliveryDays?: number;
  options?: ProductOption[];
}

type EditState = Partial<{
  basePrice: number;
  isActive: boolean;
  description: string;
  deliveryDays: number;
  options: ProductOption[];
}>;

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, ProductOverride>>({});
  const [edits, setEdits] = useState<Record<string, EditState>>({});
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
      basePrice:    ed?.basePrice    ?? ov?.basePrice    ?? preset.basePrice,
      description:  ed?.description  ?? ov?.description  ?? preset.description,
      isActive:     ed?.isActive     ?? ov?.isActive     ?? true,
      deliveryDays: ed?.deliveryDays ?? ov?.deliveryDays ?? preset.deliveryDays,
      options:      ed?.options      ?? ov?.options      ?? preset.options,
    };
  }

  function patchEdit(presetId: string, patch: Partial<EditState>) {
    setEdits((prev) => ({
      ...prev,
      [presetId]: { ...(prev[presetId] ?? {}), ...patch },
    }));
  }

  function patchOptionValues(preset: ProductPreset, optionKey: string, rawInput: string) {
    const effective = getEffective(preset);
    const values = rawInput.split(',').map((v) => v.trim()).filter(Boolean);
    const newOptions = effective.options.map((o) =>
      o.key === optionKey ? { ...o, values } : o
    );
    patchEdit(preset.id, { options: newOptions });
  }

  async function handleSave(preset: ProductPreset) {
    if (!user) return;
    setSaving(preset.id);
    const effective = getEffective(preset);
    const db = getFirebaseDb();
    try {
      await setDoc(doc(db, 'products', preset.id), {
        basePrice:    effective.basePrice,
        description:  effective.description,
        isActive:     effective.isActive,
        deliveryDays: effective.deliveryDays,
        options:      effective.options,
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
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 lg:px-8">
        <h1 className="mb-6 text-xl font-semibold">{ko.admin.products}</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PRODUCT_PRESETS.map((preset) => {
            const effective = getEffective(preset);
            const isDirty = !!edits[preset.id];

            return (
              <div key={preset.id} className="flex flex-col gap-5 rounded-2xl border border-border/60 p-5">

                {/* 헤더 */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.id}</p>
                  </div>
                  <button
                    onClick={() => patchEdit(preset.id, { isActive: !effective.isActive })}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      effective.isActive
                        ? 'bg-accent/20 text-accent'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {effective.isActive ? ko.admin.active : ko.admin.inactive}
                  </button>
                </div>

                {/* 가격 + 배송 기간 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">{ko.admin.basePrice}</Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={effective.basePrice}
                        onChange={(e) => patchEdit(preset.id, { basePrice: Number(e.target.value) })}
                        className="rounded-xl"
                      />
                      <span className="text-sm text-muted-foreground shrink-0">원</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">배송 기간</Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={effective.deliveryDays}
                        onChange={(e) => patchEdit(preset.id, { deliveryDays: Number(e.target.value) })}
                        className="rounded-xl"
                      />
                      <span className="text-sm text-muted-foreground shrink-0">일</span>
                    </div>
                  </div>
                </div>

                {/* 설명 */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">상품 설명</Label>
                  <Input
                    value={effective.description}
                    onChange={(e) => patchEdit(preset.id, { description: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* 옵션 */}
                {effective.options.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <Label className="text-xs">옵션</Label>
                    {effective.options.map((option) => (
                      <div key={option.key} className="flex flex-col gap-1.5">
                        <p className="text-[11px] font-medium text-muted-foreground">{option.label}</p>
                        {/* 태그 방식 값 편집 */}
                        <OptionTagEditor
                          values={option.values}
                          onChange={(newValues) => {
                            const newOptions = effective.options.map((o) =>
                              o.key === option.key ? { ...o, values: newValues } : o
                            );
                            patchEdit(preset.id, { options: newOptions });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 저장 */}
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

/* ── 옵션 태그 편집기 ── */
function OptionTagEditor({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function addValue() {
    const v = input.trim();
    if (!v || values.includes(v)) { setInput(''); return; }
    onChange([...values, v]);
    setInput('');
  }

  function removeValue(v: string) {
    onChange(values.filter((x) => x !== v));
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 현재 값 태그들 */}
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
          >
            {v}
            <button
              onClick={() => removeValue(v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      {/* 새 값 추가 */}
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addValue()}
          placeholder="값 입력 후 Enter 또는 추가"
          className="h-8 rounded-xl text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-xl px-2.5 shrink-0"
          onClick={addValue}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
