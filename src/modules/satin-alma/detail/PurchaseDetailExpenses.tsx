import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { EXPENSE_TYPES, CURRENCY_LABELS } from '@/types/purchases'
import type { PurchaseDetail, PurchaseCurrency } from '@/types/purchases'
import { purchasesApi } from '@/services/purchasesApi'

interface Props { purchase: PurchaseDetail; onRefresh: () => void }

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {children}
    </select>
  )
}

export function PurchaseDetailExpenses({ purchase, onRefresh }: Props) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ expense_type: 'Diğer', expense_name: '', amount: '', currency: 'TRY' as PurchaseCurrency, paid_by: '', is_shared: false })
  const [saving, setSaving] = useState(false)

  const expenses = purchase.expenses.filter(e => !e.deleted_at)

  const handleAdd = async () => {
    if (!form.expense_name.trim() || !form.amount) return
    try {
      setSaving(true)
      await purchasesApi.addExpense(purchase.id, {
        expense_type: form.expense_type,
        expense_name: form.expense_name.trim(),
        amount: Number(form.amount),
        currency: form.currency,
        exchange_rate: 1,
        amount_try: Number(form.amount),
        paid_by: form.paid_by || null,
        is_shared: form.is_shared ? 1 : 0,
        my_share_amount: null,
      })
      setForm({ expense_type: 'Diğer', expense_name: '', amount: '', currency: 'TRY', paid_by: '', is_shared: false })
      setAdding(false)
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (eid: number) => {
    if (!confirm('Bu gider silinsin mi?')) return
    await purchasesApi.deleteExpense(purchase.id, eid)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{expenses.length} gider kalemi</p>
        {purchase.status !== 'completed' && (
          <Button size="sm" variant="outline" onClick={() => setAdding(v => !v)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Gider Ekle
          </Button>
        )}
      </div>

      {adding && (
        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tür</label>
              <Sel value={form.expense_type} onChange={v => setForm(f => ({ ...f, expense_type: v }))}>
                {EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}
              </Sel>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Açıklama</label>
              <Input value={form.expense_name} onChange={e => setForm(f => ({ ...f, expense_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tutar</label>
              <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Para Birimi</label>
              <Sel value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v as PurchaseCurrency }))}>
                {(Object.keys(CURRENCY_LABELS) as PurchaseCurrency[]).map(c => (
                  <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
                ))}
              </Sel>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>İptal</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving || !form.expense_name || !form.amount}>Ekle</Button>
          </div>
        </div>
      )}

      {/* Summary */}
      {expenses.length > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border">
          <span className="text-xs text-muted-foreground">Toplam Gider:</span>
          <span className="text-sm font-semibold text-foreground">{formatCurrency(purchase.total_expenses_try)}</span>
          <span className="text-xs text-muted-foreground ml-4">Toplam Maliyet:</span>
          <span className="text-sm font-bold text-foreground">{formatCurrency(purchase.total_cost_try ?? 0)}</span>
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Gider kaydı yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tür</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Açıklama</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Tutar</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">TRY</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Ödeyen</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map(e => (
                <tr key={e.id} className="group">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.expense_type}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{e.expense_name}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    {e.currency !== 'TRY' ? `${e.amount} ${e.currency}` : formatCurrency(e.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-foreground">{formatCurrency(e.amount_try)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.paid_by || '—'}</td>
                  <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                    {purchase.status !== 'completed' && (
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
