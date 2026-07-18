import { useRef, useCallback } from 'react'
import { Upload, Star, Trash2, Image } from 'lucide-react'
import { Input, NumberInput, DatePicker } from '@/components/ui'
import { cn } from '@/utils/cn'
import { DamageMap } from './DamageMap'
import type { PurchaseWizardData, DamageStatus, WizardPhoto } from '@/types/purchases'
import { PHOTO_CATEGORIES } from '@/types/purchases'

type F = PurchaseWizardData
type SetFn = <K extends keyof F>(key: K, value: F[K]) => void

interface Props { data: F; set: SetFn }

const VEHICLE_TYPES = ['vehicle', 'motorcycle', 'caravan']

const SCORE_FIELDS: { key: keyof F; label: string }[] = [
  { key: 'score_engine',      label: 'Motor Puanı' },
  { key: 'score_mechanical',  label: 'Mekanik Puanı' },
  { key: 'score_body',        label: 'Kaporta Puanı' },
  { key: 'score_paint',       label: 'Boya Puanı' },
  { key: 'score_general',     label: 'Genel Puan' },
]

export function StepInspection({ data, set }: Props) {
  const isVehicle = VEHICLE_TYPES.includes(data.type)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Photo helpers ────────────────────────────────────────────────
  const addPhotos = useCallback((fileList: FileList | null) => {
    if (!fileList) return
    const photos = data.photos ?? []
    const next: WizardPhoto[] = [
      ...photos,
      ...Array.from(fileList).map((file, i) => ({
        file,
        preview: URL.createObjectURL(file),
        category: 'Diğer',
        is_cover: photos.length === 0 && i === 0,
      })),
    ]
    set('photos', next)
  }, [data.photos, set])

  const removePhoto = (idx: number) => {
    const photos = data.photos ?? []
    URL.revokeObjectURL(photos[idx].preview)
    const next = photos.filter((_, i) => i !== idx)
    if (photos[idx].is_cover && next.length > 0) next[0].is_cover = true
    set('photos', next)
  }

  const setCover = (idx: number) => {
    const next = (data.photos ?? []).map((p, i) => ({ ...p, is_cover: i === idx }))
    set('photos', next)
  }

  const updatePhotoCategory = (idx: number, cat: string) => {
    const next = (data.photos ?? []).map((p, i) => i === idx ? { ...p, category: cat } : p)
    set('photos', next)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    addPhotos(e.dataTransfer.files)
  }

  if (!isVehicle) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Hasar / Eksper</h2>
          <p className="text-sm text-muted-foreground mt-1">Bu varlık türü için ekspertiz formu mevcut değildir</p>
        </div>
        <div className="flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-border">
          <p className="text-sm text-muted-foreground">Sadece araç, motosiklet ve karavan için geçerlidir</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Hasar / Eksper</h2>
        <p className="text-sm text-muted-foreground mt-1">Araç hasarını ve ekspertiz sonuçlarını işaretleyin</p>
      </div>

      {/* ─── Damage Map ──────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-border bg-muted/10">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Hasar Haritası</p>
        <DamageMap
          parts={data.damage_parts ?? {}}
          onChange={(p: Record<string, DamageStatus>) => set('damage_parts', p)}
        />
      </div>

      {/* ─── Expert Info ──────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Eksper Bilgileri</p>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Eksper Firması"
            value={data.expert_company ?? ''}
            onChange={e => set('expert_company', e.target.value)}
            placeholder="Eksper A.Ş."
          />
          <DatePicker
            label="Eksper Tarihi"
            value={data.expert_date ?? null}
            onChange={v => set('expert_date', v ?? '')}
          />
          <Input
            label="Eksper No"
            value={data.expert_no ?? ''}
            onChange={e => set('expert_no', e.target.value)}
            placeholder="EXP-2024-001"
          />
        </div>

        {/* Scores */}
        <div className="grid grid-cols-5 gap-3">
          {SCORE_FIELDS.map(({ key, label }) => (
            <NumberInput
              key={key}
              label={label}
              value={(data[key] as number | undefined) ?? null}
              onChange={v => set(key, (v ?? undefined) as F[keyof F])}
              decimals={0}
              min={0}
              max={100}
              suffix="/100"
              placeholder="—"
            />
          ))}
        </div>

        {/* Score bar visualization */}
        {SCORE_FIELDS.some(({ key }) => data[key] != null) && (
          <div className="space-y-2">
            {SCORE_FIELDS.map(({ key, label }) => {
              const score = data[key] as number | undefined
              if (score == null) return null
              const pct = Math.min(100, Math.max(0, score))
              const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#ca8a04' : '#dc2626'
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color }}>{pct}</span>
                </div>
              )
            })}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">AI Risk Notu</label>
          <textarea
            value={data.ai_risk_note ?? ''}
            onChange={e => set('ai_risk_note', e.target.value)}
            rows={2}
            placeholder="Eksper tespitleri ve risk değerlendirmesi..."
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* ─── Photo Gallery ──────────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fotoğraf Galerisi</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Fotoğraf Ekle
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => addPhotos(e.target.files)}
          />
        </div>

        {/* Drop zone / gallery */}
        {(data.photos ?? []).length === 0 ? (
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-all"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Fotoğrafları sürükleyin veya tıklayın</p>
            <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WEBP</p>
          </div>
        ) : (
          <div
            className="grid grid-cols-4 gap-2"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            {(data.photos ?? []).map((photo, idx) => (
              <div
                key={idx}
                className={cn(
                  'relative rounded-lg overflow-hidden border-2 group',
                  photo.is_cover ? 'border-amber-500' : 'border-border',
                )}
              >
                <img
                  src={photo.preview}
                  alt={photo.category}
                  className="w-full h-20 object-cover"
                />
                {/* Category selector */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                  <select
                    value={photo.category}
                    onChange={e => updatePhotoCategory(idx, e.target.value)}
                    className="w-full text-[9px] bg-transparent text-white border-none outline-none appearance-none cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  >
                    {PHOTO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Cover badge */}
                {photo.is_cover && (
                  <div className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-bold px-1 rounded">
                    KAPAK
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!photo.is_cover && (
                    <button
                      onClick={() => setCover(idx)}
                      title="Kapak yap"
                      className="w-5 h-5 bg-amber-500 text-white rounded flex items-center justify-center hover:bg-amber-600"
                    >
                      <Star className="w-2.5 h-2.5" />
                    </button>
                  )}
                  <button
                    onClick={() => removePhoto(idx)}
                    title="Sil"
                    className="w-5 h-5 bg-red-500 text-white rounded flex items-center justify-center hover:bg-red-600"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add more tile */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-20 rounded-lg border-2 border-dashed border-border hover:border-amber-400 hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-all flex items-center justify-center"
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
