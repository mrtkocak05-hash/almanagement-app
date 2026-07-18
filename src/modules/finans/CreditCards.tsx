import { useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard as CardIcon } from 'lucide-react'
import { useCreditCards } from '@/hooks/useFinancial'
import { financialApi } from '@/services/financialApi'
import type { CreditCard } from '@/types/financial'
import { Button, Drawer, Input, EmptyState } from '@/components/ui'
import { cn } from '@/utils/cn'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

export function CreditCards() {
  const { data: cards, loading, refetch } = useCreditCards()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CreditCard | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ bank: '', card_name: '', limit_amount: '', current_debt: '', due_date: '', statement_date: '' })

  function openNew() { setEditing(null); setForm({ bank: '', card_name: '', limit_amount: '', current_debt: '', due_date: '', statement_date: '' }); setOpen(true) }
  function openEdit(c: CreditCard) {
    setEditing(c)
    setForm({ bank: c.bank, card_name: c.card_name, limit_amount: String(c.limit_amount), current_debt: String(c.current_debt), due_date: c.due_date ?? '', statement_date: c.statement_date ?? '' })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.bank.trim() || !form.card_name.trim()) return
    setSaving(true)
    try {
      const limit = Number(form.limit_amount) || 0
      const debt = Number(form.current_debt) || 0
      const payload = { bank: form.bank, card_name: form.card_name, limit_amount: limit, current_debt: debt, available_limit: limit - debt, due_date: form.due_date || null, statement_date: form.statement_date || null }
      if (editing) await financialApi.updateCreditCard(editing.id, payload)
      else await financialApi.createCreditCard(payload)
      setOpen(false); refetch()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu kredi kartını silmek istiyor musunuz?')) return
    await financialApi.deleteCreditCard(id); refetch()
  }

  if (loading) return <div className="text-sm text-muted-foreground py-8 text-center">Yükleniyor...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{cards?.length ?? 0} kredi kartı</p>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4" />Yeni Kart</Button>
      </div>

      {!cards?.length ? (
        <EmptyState icon={CardIcon} title="Kredi kartı yok" description="İlk kredi kartınızı ekleyin" />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {cards.map(c => {
            const usagePct = c.limit_amount > 0 ? (c.current_debt / c.limit_amount) * 100 : 0
            return (
              <div key={c.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium text-foreground">{c.card_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.bank}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(c.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Kullanım</span>
                    <span>{usagePct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', usagePct > 80 ? 'bg-red-500' : usagePct > 50 ? 'bg-yellow-500' : 'bg-green-500')}
                      style={{ width: `${Math.min(usagePct, 100)}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-xs text-muted-foreground">Limit</p><p className="text-sm font-medium text-foreground mt-0.5">{fmt(c.limit_amount)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Borç</p><p className="text-sm font-medium text-red-400 mt-0.5">{fmt(c.current_debt)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Kullanılabilir</p><p className="text-sm font-medium text-green-400 mt-0.5">{fmt(c.available_limit)}</p></div>
                </div>
                {(c.due_date || c.statement_date) && (
                  <div className="flex gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                    {c.statement_date && <span>Ekstre: {c.statement_date}</span>}
                    {c.due_date && <span>Son Ödeme: {c.due_date}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? 'Kartı Düzenle' : 'Yeni Kredi Kartı'}
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button loading={saving} onClick={handleSave}>Kaydet</Button></div>}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Banka *</label><Input value={form.bank} onChange={e => setForm(p => ({ ...p, bank: e.target.value }))} placeholder="Örn: Garanti" /></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Kart Adı *</label><Input value={form.card_name} onChange={e => setForm(p => ({ ...p, card_name: e.target.value }))} placeholder="Örn: Bonus" /></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Limit</label><Input type="number" value={form.limit_amount} onChange={e => setForm(p => ({ ...p, limit_amount: e.target.value }))} placeholder="0" /></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Güncel Borç</label><Input type="number" value={form.current_debt} onChange={e => setForm(p => ({ ...p, current_debt: e.target.value }))} placeholder="0" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Ekstre Tarihi</label><Input type="date" value={form.statement_date} onChange={e => setForm(p => ({ ...p, statement_date: e.target.value }))} /></div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Son Ödeme</label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} /></div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
