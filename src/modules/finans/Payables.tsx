import { useState } from 'react'
import { Plus, CheckCircle } from 'lucide-react'
import { usePayables, useCashAccounts, useBankAccounts } from '@/hooks/useFinancial'
import { financialApi } from '@/services/financialApi'
import { PAYABLE_STATUS_LABELS } from '@/types/financial'
import type { Payable } from '@/types/financial'
import { Button, Drawer, Input, Badge, EmptyState } from '@/components/ui'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

const statusVariant = { pending: 'warning', partial: 'secondary', paid: 'success' } as const

export function Payables() {
  const { data, loading, refetch } = usePayables()
  const { data: cashAccounts } = useCashAccounts()
  const { data: bankAccounts } = useBankAccounts()
  const [open, setOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [paying, setPaying] = useState<Payable | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ supplier: '', amount: '', currency: 'TRY', exchange_rate: '1', due_date: '', description: '' })
  const [payForm, setPayForm] = useState({ amount: '', cash_id: '', bank_id: '' })

  function openPay(p: Payable) {
    setPaying(p)
    setPayForm({ amount: String(p.amount_try - p.paid_amount), cash_id: '', bank_id: '' })
    setPayOpen(true)
  }

  async function handleSave() {
    if (!form.supplier.trim() || !form.amount) return
    setSaving(true)
    try {
      const rate = Number(form.exchange_rate) || 1
      await financialApi.createPayable({
        supplier: form.supplier, amount: Number(form.amount),
        currency: form.currency as Payable['currency'],
        exchange_rate: rate,
        amount_try: Math.round(Number(form.amount) * rate * 100) / 100,
        due_date: form.due_date || null, description: form.description || null,
      })
      setOpen(false); refetch()
    } finally { setSaving(false) }
  }

  async function handlePay() {
    if (!paying || !payForm.amount) return
    setSaving(true)
    try {
      await financialApi.payPayable(
        paying.id, Number(payForm.amount),
        payForm.cash_id ? Number(payForm.cash_id) : undefined,
        payForm.bank_id ? Number(payForm.bank_id) : undefined,
      )
      setPayOpen(false); refetch()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu borcu silmek istiyor musunuz?')) return
    await financialApi.deletePayable(id); refetch()
  }

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Yükleniyor...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} borç</p>
        <Button size="sm" onClick={() => { setForm({ supplier: '', amount: '', currency: 'TRY', exchange_rate: '1', due_date: '', description: '' }); setOpen(true) }}>
          <Plus className="w-4 h-4" />Yeni Borç
        </Button>
      </div>

      {!data?.items.length ? (
        <EmptyState icon={CheckCircle} title="Borç yok" description="Ödenecek borçlarınızı takip edin" />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tedarikçi</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Vade</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Toplam</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Ödenen</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Kalan</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Durum</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.items.map(p => (
                <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.supplier}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.due_date ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-foreground tabular-nums">{fmt(p.amount_try)}</td>
                  <td className="px-4 py-3 text-right text-green-400 tabular-nums">{fmt(p.paid_amount)}</td>
                  <td className="px-4 py-3 text-right text-red-400 font-medium tabular-nums">{fmt(p.amount_try - p.paid_amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusVariant[p.status] as 'warning' | 'secondary' | 'success'}>{PAYABLE_STATUS_LABELS[p.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.status !== 'paid' && (
                        <button onClick={() => openPay(p)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-400" title="Öde">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(p.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
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

      <Drawer open={open} onClose={() => setOpen(false)} title="Yeni Borç"
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button loading={saving} onClick={handleSave}>Kaydet</Button></div>}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Tedarikçi *</label><Input value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} placeholder="Tedarikçi adı" /></div>
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

      <Drawer open={payOpen} onClose={() => setPayOpen(false)} title={`Öde — ${paying?.supplier}`} width="md"
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setPayOpen(false)}>İptal</Button><Button loading={saving} onClick={handlePay}>Öde</Button></div>}>
        <div className="space-y-4">
          {paying && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Kalan: <span className="text-red-400 font-medium">{fmt(paying.amount_try - paying.paid_amount)}</span></p>
            </div>
          )}
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Ödeme Tutarı *</label><Input type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" /></div>
          <p className="text-xs text-muted-foreground">Kasadan veya bankadan düşmek için seçin (opsiyonel)</p>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Kasadan Öde</label>
            <select value={payForm.cash_id} onChange={e => setPayForm(p => ({ ...p, cash_id: e.target.value, bank_id: '' }))} className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
              <option value="">Seçme</option>
              {(cashAccounts ?? []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Bankadan Öde</label>
            <select value={payForm.bank_id} onChange={e => setPayForm(p => ({ ...p, bank_id: e.target.value, cash_id: '' }))} className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
              <option value="">Seçme</option>
              {(bankAccounts ?? []).map(a => <option key={a.id} value={a.id}>{a.bank_name}</option>)}
            </select>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
