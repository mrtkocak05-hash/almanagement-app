import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui'
import type { CreateListingPayload, MarketListing } from '@/types/marketResearch'
import { PLATFORMS } from '@/types/marketResearch'
import { marketResearchApi } from '@/services/marketResearchApi'

interface Props {
  researchId: number
  listing?: MarketListing
  onClose: () => void
  onSave: () => void
}

const inputCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-amber-500/60 transition-colors'
const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'

export function ListingForm({ researchId, listing, onClose, onSave }: Props) {
  const [form, setForm] = useState<CreateListingPayload>({
    title: listing?.title ?? '',
    url: listing?.url ?? '',
    platform: listing?.platform ?? '',
    price: listing?.price ?? 0,
    currency: listing?.currency ?? 'TRY',
    listing_date: listing?.listing_date ?? '',
    km: listing?.km ?? undefined,
    description: listing?.description ?? '',
    seller: listing?.seller ?? '',
    notes: listing?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof CreateListingPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.value
    setForm(prev => ({ ...prev, [k]: v === '' ? undefined : k === 'price' || k === 'km' ? Number(v) : v }))
  }

  async function handleSave() {
    if (!form.title) { setError('Başlık zorunlu'); return }
    if (!form.price && form.price !== 0) { setError('Fiyat zorunlu'); return }
    setSaving(true)
    setError(null)
    try {
      if (listing) {
        await marketResearchApi.updateListing(researchId, listing.id, form)
      } else {
        await marketResearchApi.createListing(researchId, form)
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
      <div className="relative z-10 w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">{listing ? 'İlan Düzenle' : 'Yeni İlan Ekle'}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className={labelCls}>İlan Başlığı *</label>
            <input className={inputCls} value={form.title} onChange={set('title')} placeholder="2020 Toyota Corolla 1.6 Premium..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Platform</label>
              <select className={inputCls} value={form.platform ?? ''} onChange={set('platform')}>
                <option value="">Seç</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>İlan Tarihi</label>
              <input className={inputCls} type="date" value={form.listing_date ?? ''} onChange={set('listing_date')} />
            </div>
          </div>

          <div>
            <label className={labelCls}>İlan Linki</label>
            <div className="relative">
              <input className={`${inputCls} pr-9`} value={form.url ?? ''} onChange={set('url')} placeholder="https://..." />
              {form.url && (
                <a href={form.url} target="_blank" rel="noopener noreferrer" className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>İlan Fiyatı *</label>
              <input className={inputCls} type="number" value={form.price || ''} onChange={set('price')} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Para Birimi</label>
              <select className={inputCls} value={form.currency} onChange={set('currency')}>
                <option value="TRY">TRY ₺</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>KM</label>
            <input className={inputCls} type="number" value={form.km ?? ''} onChange={set('km')} placeholder="0" />
          </div>

          <div>
            <label className={labelCls}>Satıcı</label>
            <input className={inputCls} value={form.seller ?? ''} onChange={set('seller')} placeholder="Bireysel / Galeri adı..." />
          </div>

          <div>
            <label className={labelCls}>Açıklama</label>
            <textarea
              className={`${inputCls} h-16 resize-none py-2`}
              value={form.description ?? ''}
              onChange={set('description')}
              placeholder="İlan açıklaması..."
            />
          </div>

          <div>
            <label className={labelCls}>Notlar</label>
            <textarea
              className={`${inputCls} h-14 resize-none py-2`}
              value={form.notes ?? ''}
              onChange={set('notes')}
              placeholder="Kişisel notlar..."
            />
          </div>
        </div>

        {/* Footer */}
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
