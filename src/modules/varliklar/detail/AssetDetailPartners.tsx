import { useState } from 'react'
import { Plus, Trash2, Phone } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { assetsApi } from '@/services/assetsApi'
import { formatCurrency } from '@/utils/format'
import type { AssetDetail, AssetPartner } from '@/types/assets'

interface Props { asset: AssetDetail; onRefresh: () => void }

export function AssetDetailPartners({ asset, onRefresh }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [percent, setPercent] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!name.trim() || !percent) return
    try {
      setSaving(true)
      await assetsApi.addPartner(asset.id, { name: name.trim(), share_percent: Number(percent), phone: phone || undefined })
      setName(''); setPercent(''); setPhone(''); setAdding(false)
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: AssetPartner) => {
    if (!confirm(`"${p.name}" silinsin mi?`)) return
    await assetsApi.deletePartner(asset.id, p.id)
    onRefresh()
  }

  const partners = asset.partners.filter(p => !p.deleted_at)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{partners.length} hissedar</p>
        <Button size="sm" variant="outline" onClick={() => setAdding(v => !v)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Ekle
        </Button>
      </div>

      {adding && (
        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Ad Soyad</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ad Soyad" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Hisse %</label>
              <Input type="number" value={percent} onChange={e => setPercent(e.target.value)} placeholder="0" />
            </div>
            <div className="col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Telefon (isteğe bağlı)</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>İptal</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>Kaydet</Button>
          </div>
        </div>
      )}

      {partners.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Henüz hissedar yok.</p>
      ) : (
        <div className="space-y-2">
          {partners.map(p => (
            <div key={p.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card group">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground flex-shrink-0">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                {p.phone && (
                  <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-0.5">
                    <Phone className="w-3 h-3" />{p.phone}
                  </a>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">%{p.share_percent}</p>
                {p.share_amount != null && asset.current_value != null && (
                  <p className="text-xs text-muted-foreground">{formatCurrency((asset.current_value * p.share_percent) / 100)}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(p)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
