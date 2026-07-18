import { useState } from 'react'
import { Plus, CheckCircle } from 'lucide-react'
import { useReceivables, useCashAccounts, useBankAccounts } from '@/hooks/useFinancial'
import { financialApi } from '@/services/financialApi'
import { RECEIVABLE_STATUS_LABELS } from '@/types/financial'
import type { Receivable } from '@/types/financial'
import { Button, Drawer, Input, Badge, EmptyState } from '@/components/ui'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

const statusVariant = { pending: 'warning', partial: 'secondary', collected: 'success' } as const

export function Receivables() {
  const { data, loading, refetch } = useReceivables()
  const { data: cashAccounts } = useCashAccounts()
  const { data: bankAccounts } = useBankAccounts()
  const [open, setOpen] = useState(false)
  const [collectOpen, setCollectOpen] = useState(false)
  const [collecting, setCollecting] = useState<Receivable | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ customer: '', amount: '', currency: 'TRY', exchange_rate: '1', due_date: '', description: '' })
  const [collectForm, setCollectForm] = useState({ amount: '', cash_id: '', bank_id: '' })

  function openCollect(r: Receivable) {
    setCollecting(r)
    const remaining = r.amount_try - r.collected_amount
    setCollectForm({ amount: String(remaining), cash_id: '', bank_id: '' })
    setCollectOpen(true)
  }

  async function handleSave() {
    if (!form.customer.trim() || !form.amount) return
    setSaving(true)
    try {
      const rate = Number(form.exchange_rate) || 1
      await financialApi.createReceivable({
        customer: form.customer, amount: Number(form.amount),
        currency: form.currency as Receivable['currency'],
        exchange_rate: rate,
        amount_try: Math.round(Number(form.amount) * rate * 100) / 100,
        due_date: form.due_date || null, description: form.description || null,
      })
      setOpen(false); refetch()
    } finally { setSaving(false) }
  }

  async function handleCollect() {
    if (!collecting || !collectForm.amount) return
    setSaving(true)
    try {
      await financialApi.collectReceivable(
        collecting.id, Number(collectForm.amount),
        collectForm.cash_id ? Number(collectForm.cash_id) : undefined,
        collectForm.bank_id ? Number(collectForm.bank_id) : undefined,
      )
      setCollectOpen(false); refetch()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu alacağı silmek istiyor musunuz?')) return
    await financialApi.deleteReceivable(id); refetch()
  }

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Yükleniyor...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} alacak</p>
        <Button size="sm" onClick={() => { setForm({ customer: '', amount: '', currency: 'TRY', exchange_rate: '1', due_date: '', description: '' }); setOpen(true) }}>
          <Plus className="w-4 h-4" />Yeni Alacak
        </Button>
      </div>

      {!data?.items.length ? (
        <EmptyState icon={CheckCircle} title="Alacak yok" description="Tahsil edilecek alacaklarınızı takip edin" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Müşteri</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Vade</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Toplam</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tahsil</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Kalan</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Durum</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.items.map(r => (
                <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{r.customer}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.due_date ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-foreground tabular-nums">{fmt(r.amount_try)}</td>
                  <td className="px-4 py-3 text-right text-green-400 tabular-nums">{fmt(r.collected_amount)}</td>
                  <td className="px-4 py-3 text-right text-yellow-400 font-medium tabular-nums">{fmt(r.amount_try - r.collected_amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusVariant[r.status] as 'warning' | 'secondary' | 'success'}>{RECEIVABLE_STATUS_LABELS[r.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {r.status !== 'collected' && (
                        <button onClick={() => openCollect(r)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-400" title="Tahsil Et">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(r.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Plus className="w-3.5 h-3.5 rotate-45" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title="Yeni Alacak"
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button loading={saving} onClick={handleSave}>Kaydet</Button></div>}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Müşteri *</label><Input value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))} placeholder="Müşteri adı" /></div>
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
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Vade Tarihi</label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} /></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Açıklama</label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Opsiyonel" /></div>
        </div>
      </Drawer>

      <Drawer open={collectOpen} onClose={() => setCollectOpen(false)} title={`Tahsil Et — ${collecting?.customer}`} width="md"
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setCollectOpen(false)}>İptal</Button><Button loading={saving} onClick={handleCollect}>Tahsil Et</Button></div>}>
        <div className="space-y-4">
          {collecting && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Kalan: <span className="text-yellow-400 font-medium">{fmt(collecting.amount_try - collecting.collected_amount)}</span></p>
            </div>
          )}
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Tahsil Tutarı *</label><Input type="number" value={collectForm.amount} onChange={e => setCollectForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" /></div>
          <p className="text-xs text-muted-foreground">Kasaya veya bankaya eklemek için seçin (opsiyonel)</p>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Kasaya Ekle</label>
            <select value={collectForm.cash_id} onChange={e => setCollectForm(p => ({ ...p, cash_id: e.target.value, bank_id: '' }))} className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
              <option value="">Seçme</option>
              {(cashAccounts ?? []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Bankaya Ekle</label>
            <select value={collectForm.bank_id} onChange={e => setCollectForm(p => ({ ...p, bank_id: e.target.value, cash_id: '' }))} className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
              <option value="">Seçme</option>
              {(bankAccounts ?? []).map(a => <option key={a.id} value={a.id}>{a.bank_name}</option>)}
            </select>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
