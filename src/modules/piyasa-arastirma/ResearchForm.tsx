import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'
import type { CreateResearchPayload, MarketResearch, ResearchCategory } from '@/types/marketResearch'
import { RESEARCH_CATEGORIES } from '@/types/marketResearch'
import { ResearchFilters } from './ResearchFilters'
import { marketResearchApi } from '@/services/marketResearchApi'

interface Props {
  research?: MarketResearch
  onClose: () => void
  onSave: () => void
}

const inputCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-amber-500/60 transition-colors'

export function ResearchForm({ research, onClose, onSave }: Props) {
  const [form, setForm] = useState<CreateResearchPayload>({
    title: research?.title ?? '',
    category: research?.category ?? 'arac',
    brand: research?.brand ?? undefined,
    model: research?.model ?? undefined,
    version: research?.version ?? undefined,
    year_from: research?.year_from ?? undefined,
    year_to: research?.year_to ?? undefined,
    km_from: research?.km_from ?? undefined,
    km_to: research?.km_to ?? undefined,
    fuel_type: research?.fuel_type ?? undefined,
    transmission: research?.transmission ?? undefined,
    property_type: research?.property_type ?? undefined,
    room_count: research?.room_count ?? undefined,
    area_from: research?.area_from ?? undefined,
    area_to: research?.area_to ?? undefined,
    length_from: research?.length_from ?? undefined,
    length_to: research?.length_to ?? undefined,
    province: research?.province ?? undefined,
    notes: research?.notes ?? undefined,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!form.title) { setError('Başlık zorunlu'); return }
    setSaving(true)
    setError(null)
    try {
      if (research) {
        await marketResearchApi.update(research.id, form)
      } else {
        await marketResearchApi.create(form)
      }
      onSave()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">{research ? 'Araştırma Düzenle' : 'Yeni Araştırma'}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Araştırma Başlığı *</label>
            <input
              className={inputCls}
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="2020-2022 Toyota Corolla Araştırması..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Kategori</label>
            <select
              className={inputCls}
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value as ResearchCategory }))}
            >
              {RESEARCH_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Filtreler</p>
            <ResearchFilters
              category={form.category}
              values={form}
              onChange={(key, value) => setForm(prev => ({ ...prev, [key]: value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Notlar</label>
            <textarea
              className={`${inputCls} h-16 resize-none py-2`}
              value={form.notes ?? ''}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value || undefined }))}
              placeholder="Araştırma hakkında notlar..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>İptal</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}
            style={{ backgroundColor: '#D97706', color: 'white' }}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  )
}
