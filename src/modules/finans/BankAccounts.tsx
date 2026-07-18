import { useState } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react'
import { useBankAccounts } from '@/hooks/useFinancial'
import { financialApi } from '@/services/financialApi'
import type { BankAccount } from '@/types/financial'
import { Button, Drawer, Input, EmptyState } from '@/components/ui'
import { cn } from '@/utils/cn'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

export function BankAccounts() {
  const { data: accounts, loading, refetch } = useBankAccounts()
  const [open, setOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [editing, setEditing] = useState<BankAccount | null>(null)
  const [adjusting, setAdjusting] = useState<BankAccount | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ bank_name: '', branch: '', iban: '', currency: 'TRY', opening_balance: '' })
  const [adjForm, setAdjForm] = useState({ amount: '', type: 'income' as 'income' | 'expense', description: '' })

  function openNew() { setEditing(null); setForm({ bank_name: '', branch: '', iban: '', currency: 'TRY', opening_balance: '' }); setOpen(true) }
  function openEdit(a: BankAccount) {
    setEditing(a)
    setForm({ bank_name: a.bank_name, branch: a.branch ?? '', iban: a.iban ?? '', currency: a.currency, opening_balance: String(a.opening_balance) })
    setOpen(true)
  }
  function openAdjust(a: BankAccount) { setAdjusting(a); setAdjForm({ amount: '', type: 'income', description: '' }); setAdjustOpen(true) }

  async function handleSave() {
    if (!form.bank_name.trim()) return
    setSaving(true)
    try {
      const payload = { bank_name: form.bank_name, branch: form.branch || null, iban: form.iban || null, currency: form.currency as BankAccount['currency'], opening_balance: Number(form.opening_balance) || 0 }
      if (editing) await financialApi.updateBankAccount(editing.id, payload)
      else await financialApi.createBankAccount(payload)
      setOpen(false); refetch()
    } finally { setSaving(false) }
  }

  async function handleAdjust() {
    if (!adjusting || !adjForm.amount) return
    setSaving(true)
    try {
      await financialApi.adjustBankBalance(adjusting.id, Number(adjForm.amount), adjForm.type, adjForm.description || undefined)
      setAdjustOpen(false); refetch()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu banka hesabını silmek istiyor musunuz?')) return
    await financialApi.deleteBankAccount(id); refetch()
  }

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Yükleniyor...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{accounts?.length ?? 0} banka hesabı</p>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4" />Yeni Hesap</Button>
      </div>

      {!accounts?.length ? (
        <EmptyState icon={Plus} title="Banka hesabı yok" description="İlk banka hesabınızı ekleyin" />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {accounts.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">{a.bank_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.branch ? `${a.branch} · ` : ''}{a.currency}
                    {a.iban ? ` · ${a.iban.slice(-8)}` : ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openAdjust(a)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"><ArrowUpDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => openEdit(a)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(a.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className={cn('text-2xl font-semibold', a.current_balance >= 0 ? 'text-green-400' : 'text-red-400')}>
                {fmt(a.current_balance)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? 'Hesabı Düzenle' : 'Yeni Banka Hesabı'}
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button loading={saving} onClick={handleSave}>Kaydet</Button></div>}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Banka Adı *</label><Input value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} placeholder="Örn: Ziraat Bankası" /></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Şube</label><Input value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} placeholder="Opsiyonel" /></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">IBAN</label><Input value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} placeholder="TR..." /></div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Para Birimi</label>
            <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
              <option>TRY</option><option>USD</option><option>EUR</option>
            </select>
          </div>
          {!editing && <div><label className="text-sm font-medium text-foreground mb-1.5 block">Açılış Bakiyesi</label><Input type="number" value={form.opening_balance} onChange={e => setForm(p => ({ ...p, opening_balance: e.target.value }))} placeholder="0" /></div>}
        </div>
      </Drawer>

      <Drawer open={adjustOpen} onClose={() => setAdjustOpen(false)} title={`Bakiye Güncelle — ${adjusting?.bank_name}`} width="md"
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setAdjustOpen(false)}>İptal</Button><Button loading={saving} onClick={handleAdjust}>Kaydet</Button></div>}>
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
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Tutar</label><Input type="number" value={adjForm.amount} onChange={e => setAdjForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" /></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Açıklama</label><Input value={adjForm.description} onChange={e => setAdjForm(p => ({ ...p, description: e.target.value }))} placeholder="Opsiyonel" /></div>
        </div>
      </Drawer>
    </div>
  )
}
