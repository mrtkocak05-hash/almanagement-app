import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useFinancialTransactions } from '@/hooks/useFinancial'
import { financialApi } from '@/services/financialApi'
import { TRANSACTION_COLORS, TRANSACTION_BG, TRANSACTION_LABELS } from '@/types/financial'
import type { TransactionType } from '@/types/financial'
import { Button, Drawer, Input, EmptyState } from '@/components/ui'
import { cn } from '@/utils/cn'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
const today = () => new Date().toISOString().split('T')[0]

const TYPE_FILTER_OPTIONS = [
  { id: '', label: 'Tümü' },
  { id: 'income', label: 'Gelir' },
  { id: 'expense', label: 'Gider' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'capital', label: 'Sermaye' },
]

export function FinancialTransactions() {
  const { data, loading, refetch } = useFinancialTransactions()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'income' as TransactionType, category: '', amount: '', currency: 'TRY', exchange_rate: '1', transaction_date: today(), description: '', reference_no: '' })

  async function handleSave() {
    if (!form.amount || Number(form.amount) <= 0) return
    setSaving(true)
    try {
      const rate = Number(form.exchange_rate) || 1
      await financialApi.createTransaction({
        type: form.type,
        category: form.category || null,
        amount: Number(form.amount),
        currency: form.currency as 'TRY' | 'USD' | 'EUR' | 'Gold',
        exchange_rate: rate,
        amount_try: Math.round(Number(form.amount) * rate * 100) / 100,
        transaction_date: form.transaction_date,
        description: form.description || null,
        reference_no: form.reference_no || null,
      })
      setOpen(false); refetch()
    } finally { setSaving(false) }
  }

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Yükleniyor...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TYPE_FILTER_OPTIONS.map(o => (
            <button key={o.id} onClick={() => setFilter(o.id)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filter === o.id ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {o.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => { setForm({ type: 'income', category: '', amount: '', currency: 'TRY', exchange_rate: '1', transaction_date: today(), description: '', reference_no: '' }); setOpen(true) }}>
          <Plus className="w-4 h-4" />Yeni İşlem
        </Button>
      </div>

      {!data?.items.length ? (
        <EmptyState icon={Plus} title="İşlem yok" description="Finansal işlemlerinizi buradan takip edin" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tür</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Açıklama</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Kategori</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.items.filter(t => !filter || t.type === filter).map(t => (
                <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', TRANSACTION_BG[t.type])}>
                      <span className={TRANSACTION_COLORS[t.type]}>{TRANSACTION_LABELS[t.type]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.transaction_date}</td>
                  <td className="px-4 py-3 text-foreground">{t.description ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.category ?? '—'}</td>
                  <td className={cn('px-4 py-3 text-right font-medium tabular-nums', TRANSACTION_COLORS[t.type])}>
                    {t.type === 'expense' ? '-' : '+'}{fmt(t.amount_try)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title="Manuel İşlem Ekle" width="md"
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button loading={saving} onClick={handleSave}>Kaydet</Button></div>}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">İşlem Türü</label>
            <div className="grid grid-cols-2 gap-2">
              {(['income', 'expense', 'transfer', 'capital'] as TransactionType[]).map(t => (
                <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                  className={cn('py-2 rounded-lg border text-sm font-medium transition-colors', form.type === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                  {TRANSACTION_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Tarih</label><Input type="date" value={form.transaction_date} onChange={e => setForm(p => ({ ...p, transaction_date: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Para Birimi</label>
              <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
                <option>TRY</option><option>USD</option><option>EUR</option>
              </select>
            </div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Kur</label><Input type="number" value={form.exchange_rate} onChange={e => setForm(p => ({ ...p, exchange_rate: e.target.value }))} /></div>
          </div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Tutar *</label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" /></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Kategori</label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Örn: Kira, Fatura..." /></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Açıklama</label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Opsiyonel" /></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Referans No</label><Input value={form.reference_no} onChange={e => setForm(p => ({ ...p, reference_no: e.target.value }))} placeholder="Opsiyonel" /></div>
        </div>
      </Drawer>
    </div>
  )
}
