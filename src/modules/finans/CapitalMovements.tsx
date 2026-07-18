import { useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { useCapitalMovements } from '@/hooks/useFinancial'
import { financialApi } from '@/services/financialApi'
import { MOVEMENT_TYPE_LABELS, MOVEMENT_POSITIVE } from '@/types/financial'
import type { MovementType } from '@/types/financial'
import { Button, Drawer, Input, EmptyState } from '@/components/ui'
import { cn } from '@/utils/cn'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
const today = () => new Date().toISOString().split('T')[0]

export function CapitalMovements() {
  const { data, loading, refetch } = useCapitalMovements()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'increase' as MovementType, movement_date: today(), amount: '', currency: 'TRY', exchange_rate: '1', description: '' })

  async function handleSave() {
    if (!form.amount || Number(form.amount) <= 0) return
    setSaving(true)
    try {
      const rate = Number(form.exchange_rate) || 1
      await financialApi.createCapitalMovement({
        type: form.type,
        movement_date: form.movement_date,
        amount: Number(form.amount),
        currency: form.currency as 'TRY' | 'USD' | 'EUR' | 'Gold',
        exchange_rate: rate,
        amount_try: Math.round(Number(form.amount) * rate * 100) / 100,
        description: form.description || null,
      })
      setOpen(false)
      refetch()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu sermaye hareketini silmek istiyor musunuz?')) return
    await financialApi.deleteCapitalMovement(id)
    refetch()
  }

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Yükleniyor...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} hareket</p>
        <Button size="sm" onClick={() => { setForm({ type: 'increase', movement_date: today(), amount: '', currency: 'TRY', exchange_rate: '1', description: '' }); setOpen(true) }}>
          <Plus className="w-4 h-4" />Yeni Hareket
        </Button>
      </div>

      {!data?.items.length ? (
        <EmptyState icon={TrendingUp} title="Sermaye hareketi yok" description="İlk sermaye hareketini ekleyin" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tür</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Açıklama</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tutar</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.items.map(m => {
                const isPos = MOVEMENT_POSITIVE.includes(m.type)
                return (
                  <tr key={m.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{m.movement_date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isPos
                          ? <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                          : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                        <span className={isPos ? 'text-green-400' : 'text-red-400'}>{MOVEMENT_TYPE_LABELS[m.type]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.description ?? '—'}</td>
                    <td className={cn('px-4 py-3 text-right font-medium tabular-nums', isPos ? 'text-green-400' : 'text-red-400')}>
                      {isPos ? '+' : '-'}{fmt(m.amount_try)}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(m.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title="Yeni Sermaye Hareketi"
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button loading={saving} onClick={handleSave}>Kaydet</Button></div>}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Hareket Türü</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as MovementType }))}
              className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
              {(Object.keys(MOVEMENT_TYPE_LABELS) as MovementType[]).map(k => (
                <option key={k} value={k}>{MOVEMENT_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Tarih</label><Input type="date" value={form.movement_date} onChange={e => setForm(p => ({ ...p, movement_date: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Para Birimi</label>
              <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
                <option>TRY</option><option>USD</option><option>EUR</option><option>Gold</option>
              </select>
            </div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Kur</label><Input type="number" value={form.exchange_rate} onChange={e => setForm(p => ({ ...p, exchange_rate: e.target.value }))} placeholder="1" /></div>
          </div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Tutar *</label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" /></div>
          {form.currency !== 'TRY' && form.amount && (
            <p className="text-xs text-muted-foreground">≈ {fmt(Number(form.amount) * Number(form.exchange_rate))} TRY</p>
          )}
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Açıklama</label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Opsiyonel" /></div>
        </div>
      </Drawer>
    </div>
  )
}
