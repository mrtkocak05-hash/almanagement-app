import { useState } from 'react'
import { Plus, ArrowRight } from 'lucide-react'
import { useMoneyTransfers, useCashAccounts, useBankAccounts } from '@/hooks/useFinancial'
import { financialApi } from '@/services/financialApi'
import { Button, Drawer, Input, EmptyState } from '@/components/ui'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
const today = () => new Date().toISOString().split('T')[0]

export function MoneyTransfers() {
  const { data, loading, refetch } = useMoneyTransfers()
  const { data: cashAccounts } = useCashAccounts()
  const { data: bankAccounts } = useBankAccounts()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    from_type: 'cash' as 'cash' | 'bank',
    from_id: '',
    to_type: 'bank' as 'cash' | 'bank',
    to_id: '',
    amount: '',
    currency: 'TRY',
    exchange_rate: '1',
    transfer_date: today(),
    description: '',
  })

  const fromOptions = form.from_type === 'cash'
    ? (cashAccounts ?? []).map(a => ({ id: a.id, name: a.name }))
    : (bankAccounts ?? []).map(a => ({ id: a.id, name: a.bank_name }))

  const toOptions = form.to_type === 'cash'
    ? (cashAccounts ?? []).map(a => ({ id: a.id, name: a.name }))
    : (bankAccounts ?? []).map(a => ({ id: a.id, name: a.bank_name }))

  async function handleSave() {
    if (!form.from_id || !form.to_id || !form.amount) return
    setSaving(true)
    try {
      const rate = Number(form.exchange_rate) || 1
      await financialApi.createTransfer({
        from_type: form.from_type, from_id: Number(form.from_id),
        to_type: form.to_type, to_id: Number(form.to_id),
        amount: Number(form.amount), currency: form.currency,
        exchange_rate: rate,
        transfer_date: form.transfer_date,
        description: form.description || undefined,
      })
      setOpen(false)
      refetch()
    } finally { setSaving(false) }
  }

  function openNew() {
    setForm({ from_type: 'cash', from_id: '', to_type: 'bank', to_id: '', amount: '', currency: 'TRY', exchange_rate: '1', transfer_date: today(), description: '' })
    setOpen(true)
  }

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Yükleniyor...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} transfer</p>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4" />Yeni Transfer</Button>
      </div>

      {!data?.items.length ? (
        <EmptyState icon={ArrowRight} title="Transfer yok" description="Hesaplar arası transfer başlatın" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Kaynak</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground"></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Hedef</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.items.map(t => (
                <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{t.transfer_date}</td>
                  <td className="px-4 py-3 text-foreground">{t.from_name ?? `${t.from_type} #${t.from_id}`}</td>
                  <td className="px-4 py-3"><ArrowRight className="w-4 h-4 text-muted-foreground" /></td>
                  <td className="px-4 py-3 text-foreground">{t.to_name ?? `${t.to_type} #${t.to_id}`}</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-400 tabular-nums">{fmt(t.amount_try)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title="Yeni Para Transferi"
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button loading={saving} onClick={handleSave}>Kaydet</Button></div>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Kaynak Tür</label>
              <select value={form.from_type} onChange={e => setForm(p => ({ ...p, from_type: e.target.value as 'cash' | 'bank', from_id: '' }))}
                className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
                <option value="cash">Kasa</option><option value="bank">Banka</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Kaynak Hesap</label>
              <select value={form.from_id} onChange={e => setForm(p => ({ ...p, from_id: e.target.value }))}
                className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
                <option value="">Seçin</option>
                {fromOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Hedef Tür</label>
              <select value={form.to_type} onChange={e => setForm(p => ({ ...p, to_type: e.target.value as 'cash' | 'bank', to_id: '' }))}
                className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
                <option value="cash">Kasa</option><option value="bank">Banka</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Hedef Hesap</label>
              <select value={form.to_id} onChange={e => setForm(p => ({ ...p, to_id: e.target.value }))}
                className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
                <option value="">Seçin</option>
                {toOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Tarih</label><Input type="date" value={form.transfer_date} onChange={e => setForm(p => ({ ...p, transfer_date: e.target.value }))} /></div>
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
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Açıklama</label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Opsiyonel" /></div>
        </div>
      </Drawer>
    </div>
  )
}
