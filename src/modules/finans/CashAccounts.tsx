import { useState } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react'
import { useCashAccounts } from '@/hooks/useFinancial'
import { financialApi } from '@/services/financialApi'
import type { CashAccount } from '@/types/financial'
import { Button, Drawer, Input, EmptyState } from '@/components/ui'
import { cn } from '@/utils/cn'

const fmt = (v: number, cur = 'TRY') => {
  if (cur === 'Gold') return `${v.toFixed(4)} gr`
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur === 'Gold' ? 'TRY' : cur, maximumFractionDigits: 2 }).format(v)
}

export function CashAccounts() {
  const { data: accounts, loading, refetch } = useCashAccounts()
  const [open, setOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [editing, setEditing] = useState<CashAccount | null>(null)
  const [adjusting, setAdjusting] = useState<CashAccount | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', currency: 'TRY', balance: '', description: '' })
  const [adjForm, setAdjForm] = useState({ amount: '', type: 'income' as 'income' | 'expense', description: '' })

  function openNew() {
    setEditing(null)
    setForm({ name: '', currency: 'TRY', balance: '', description: '' })
    setOpen(true)
  }

  function openEdit(a: CashAccount) {
    setEditing(a)
    setForm({ name: a.name, currency: a.currency, balance: String(a.balance), description: a.description ?? '' })
    setOpen(true)
  }

  function openAdjust(a: CashAccount) {
    setAdjusting(a)
    setAdjForm({ amount: '', type: 'income', description: '' })
    setAdjustOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = { name: form.name, currency: form.currency as CashAccount['currency'], balance: Number(form.balance) || 0, description: form.description || null }
      if (editing) await financialApi.updateCashAccount(editing.id, payload)
      else await financialApi.createCashAccount(payload)
      setOpen(false)
      refetch()
    } finally { setSaving(false) }
  }

  async function handleAdjust() {
    if (!adjusting || !adjForm.amount) return
    setSaving(true)
    try {
      await financialApi.adjustCashBalance(adjusting.id, Number(adjForm.amount), adjForm.type, adjForm.description || undefined)
      setAdjustOpen(false)
      refetch()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu kasayı silmek istiyor musunuz?')) return
    await financialApi.deleteCashAccount(id)
    refetch()
  }

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Yükleniyor...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{accounts?.length ?? 0} kasa hesabı</p>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4" />Yeni Kasa</Button>
      </div>

      {!accounts?.length ? (
        <EmptyState icon={Plus} title="Kasa hesabı yok" description="İlk kasa hesabınızı oluşturun" />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {accounts.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.currency}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openAdjust(a)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"><ArrowUpDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => openEdit(a)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(a.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className={cn('text-2xl font-semibold', a.balance >= 0 ? 'text-green-400' : 'text-red-400')}>{fmt(a.balance, a.currency)}</p>
              {a.description && <p className="text-xs text-muted-foreground mt-2">{a.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Drawer */}
      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? 'Kasayı Düzenle' : 'Yeni Kasa Hesabı'}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button loading={saving} onClick={handleSave}>Kaydet</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Kasa Adı *</label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Örn: Ana Kasa" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Para Birimi</label>
            <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
              className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
              <option>TRY</option><option>USD</option><option>EUR</option><option>Gold</option>
            </select>
          </div>
          {!editing && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Açılış Bakiyesi</label>
              <Input type="number" value={form.balance} onChange={e => setForm(p => ({ ...p, balance: e.target.value }))} placeholder="0" />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Açıklama</label>
            <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Opsiyonel" />
          </div>
        </div>
      </Drawer>

      {/* Adjust Balance Drawer */}
      <Drawer open={adjustOpen} onClose={() => setAdjustOpen(false)} title={`Bakiye Güncelle — ${adjusting?.name}`} width="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>İptal</Button>
            <Button loading={saving} onClick={handleAdjust}>Kaydet</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">İşlem Türü</label>
            <div className="grid grid-cols-2 gap-2">
              {(['income', 'expense'] as const).map(t => (
                <button key={t} onClick={() => setAdjForm(p => ({ ...p, type: t }))}
                  className={cn('py-2.5 rounded-lg border text-sm font-medium transition-colors', adjForm.type === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                  {t === 'income' ? 'Giriş (Artış)' : 'Çıkış (Azalış)'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Tutar</label>
            <Input type="number" value={adjForm.amount} onChange={e => setAdjForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Açıklama</label>
            <Input value={adjForm.description} onChange={e => setAdjForm(p => ({ ...p, description: e.target.value }))} placeholder="Opsiyonel" />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
