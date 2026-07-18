import { Plus, Trash2 } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import type { PurchaseWizardData, WizardPartner } from '@/types/purchases'

interface Props {
  data: PurchaseWizardData
  set: <K extends keyof PurchaseWizardData>(key: K, value: PurchaseWizardData[K]) => void
}

const EMPTY: WizardPartner = { name: '', share_percent: 0 }

export function Step4Partners({ data, set }: Props) {
  const partners = data.partners

  const add = () => set('partners', [...partners, { ...EMPTY }])
  const remove = (i: number) => set('partners', partners.filter((_, idx) => idx !== i))
  const update = (i: number, key: keyof WizardPartner, value: string | number) => {
    const next = partners.map((p, idx) => idx === i ? { ...p, [key]: value } : p)
    set('partners', next)
  }

  const totalShareOthers = partners.reduce((s, p) => s + (Number(p.share_percent) || 0), 0)
  const myShare = Math.max(0, data.share_percent - totalShareOthers)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Hissedarlar</h2>
        <p className="text-sm text-muted-foreground mt-1">Bu satın almaya ortak olan kişiler</p>
      </div>

      {/* My share summary */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
        <div>
          <p className="text-xs text-muted-foreground">Benim Hissem</p>
          <p className="text-xl font-bold text-foreground">%{myShare.toFixed(0)}</p>
        </div>
        {data.purchase_price_try > 0 && (
          <>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Hisse Tutarım</p>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(data.purchase_price_try * myShare / 100)}
              </p>
            </div>
          </>
        )}
        <Button size="sm" variant="outline" className="ml-auto" onClick={add}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Ortak Ekle
        </Button>
      </div>

      {partners.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Ortak yoksa bu adımı atlayabilirsiniz.
        </p>
      ) : (
        <div className="space-y-3">
          {partners.map((p, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg border border-border bg-card">
              <div className="col-span-4">
                <label className="text-xs text-muted-foreground mb-1 block">Ad Soyad</label>
                <Input value={p.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Ortak adı" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Hisse %</label>
                <Input type="number" min={0} max={100} value={p.share_percent} onChange={e => update(i, 'share_percent', Number(e.target.value))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Tutar</label>
                <div className="h-9 flex items-center px-3 rounded-md bg-foreground/5 border border-border text-xs font-medium text-foreground">
                  {data.purchase_price_try > 0
                    ? formatCurrency(data.purchase_price_try * (Number(p.share_percent) || 0) / 100)
                    : '—'}
                </div>
              </div>
              <div className="col-span-3">
                <label className="text-xs text-muted-foreground mb-1 block">Telefon</label>
                <Input value={p.phone ?? ''} onChange={e => update(i, 'phone', e.target.value)} placeholder="+90..." />
              </div>
              <div className="col-span-1 flex justify-end pb-0.5">
                <button onClick={() => remove(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
