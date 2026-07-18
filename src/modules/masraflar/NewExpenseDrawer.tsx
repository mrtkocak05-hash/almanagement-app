import { useState, useEffect } from 'react'
import { Drawer, Button, Input, DatePicker, NumberInput } from '@/components/ui'
import { useFormContext } from '@/hooks/useExpenses'
import { expensesApi } from '@/services/expensesApi'
import { EXPENSE_CATEGORIES, PAYMENT_SOURCE_LABELS, EXPENSE_OWNER_LABELS } from '@/types/expenses'
import type { PaymentSource, ExpenseOwner } from '@/types/expenses'

const todayIso = () => new Date().toISOString().split('T')[0]
const DEFAULT_RATES: Record<string, number> = { TRY: 1, USD: 38, EUR: 41, Gold: 4200 }

interface Props { open: boolean; onClose: () => void; onCreated: () => void }

interface FormState {
  expense_date: string
  category: string
  sub_category: string
  description: string
  amount: number | null
  currency: string
  exchange_rate: number | null
  payment_source: PaymentSource
  payment_source_id: string
  expense_owner: ExpenseOwner
  related_asset_id: string
  related_purchase_id: string
  related_sale_id: string
  tax_included: boolean
  vat_rate: number | null
  notes: string
  tags: string
}

const INIT: FormState = {
  expense_date: todayIso(), category: 'Diğer', sub_category: '', description: '',
  amount: null, currency: 'TRY', exchange_rate: 1,
  payment_source: 'other', payment_source_id: '',
  expense_owner: 'company',
  related_asset_id: '', related_purchase_id: '', related_sale_id: '',
  tax_included: false, vat_rate: null, notes: '', tags: '',
}

export function NewExpenseDrawer({ open, onClose, onCreated }: Props) {
  const { data: ctx } = useFormContext()
  const [form, setForm] = useState<FormState>(INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setForm({ ...INIT, expense_date: todayIso() }); setError(null) }
  }, [open])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(p => ({ ...p, [key]: value }))
  }

  function handleCurrencyChange(currency: string) {
    set('currency', currency)
    set('exchange_rate', DEFAULT_RATES[currency] ?? 1)
  }

  const amountTry = ((form.amount ?? 0) * (form.exchange_rate ?? 1))
  const showSourceSelect = ['cash', 'bank', 'credit_card'].includes(form.payment_source)

  const sourceOptions = () => {
    if (form.payment_source === 'cash') return ctx?.cash_accounts ?? []
    if (form.payment_source === 'bank') return ctx?.bank_accounts ?? []
    if (form.payment_source === 'credit_card') return ctx?.credit_cards.map(c => ({ id: c.id, name: `${c.bank} ${c.name}` })) ?? []
    return []
  }

  async function handleSave() {
    if (!form.description.trim()) { setError('Açıklama zorunludur'); return }
    if (!form.amount || form.amount <= 0) { setError('Tutar giriniz'); return }
    setSaving(true); setError(null)
    try {
      const opts = sourceOptions()
      const srcOption = opts.find(o => String(o.id) === form.payment_source_id)
      await expensesApi.create({
        expense_date: form.expense_date,
        category: form.category,
        sub_category: form.sub_category || undefined,
        description: form.description,
        amount: form.amount,
        currency: form.currency,
        exchange_rate: form.exchange_rate ?? 1,
        amount_try: Math.round(amountTry * 100) / 100,
        payment_source: form.payment_source,
        payment_source_id: form.payment_source_id ? Number(form.payment_source_id) : undefined,
        payment_source_name: srcOption?.name ?? undefined,
        expense_owner: form.expense_owner,
        related_asset_id: form.related_asset_id ? Number(form.related_asset_id) : undefined,
        related_asset_name: ctx?.assets.find(a => String(a.id) === form.related_asset_id)?.name,
        related_purchase_id: form.related_purchase_id ? Number(form.related_purchase_id) : undefined,
        related_sale_id: form.related_sale_id ? Number(form.related_sale_id) : undefined,
        tax_included: form.tax_included ? 1 : 0,
        vat_rate: form.vat_rate ?? 0,
        notes: form.notes || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      })
      onCreated(); onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt hatası')
    } finally { setSaving(false) }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Yeni Gider"
      subtitle="Gideri kaydet ve finansal entegrasyonu otomatik uygula"
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={onClose}>İptal</Button>
            <Button loading={saving} onClick={handleSave}>Kaydet</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Tarih + Kategori */}
        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Tarih *"
            value={form.expense_date}
            onChange={v => set('expense_date', v ?? todayIso())}
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Kategori *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Alt Kategori + Açıklama */}
        <div className="grid grid-cols-3 gap-4">
          <Input label="Alt Kategori" value={form.sub_category} onChange={e => set('sub_category', e.target.value)} placeholder="Opsiyonel" />
          <div className="col-span-2">
            <Input label="Açıklama *" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Giderin açıklaması" />
          </div>
        </div>

        {/* Tutar */}
        <div className="grid grid-cols-3 gap-4">
          <NumberInput
            label="Tutar *"
            value={form.amount}
            onChange={v => set('amount', v)}
            decimals={2}
            placeholder="0,00"
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Para Birimi</label>
            <select value={form.currency} onChange={e => handleCurrencyChange(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option>TRY</option><option>USD</option><option>EUR</option><option>Gold</option>
            </select>
          </div>
          <div>
            <NumberInput
              label="Kur"
              value={form.exchange_rate}
              onChange={v => set('exchange_rate', v)}
              decimals={2}
              disabled={form.currency === 'TRY'}
            />
            {amountTry > 0 && form.currency !== 'TRY' && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amountTry)}
              </p>
            )}
          </div>
        </div>

        {/* Ödeme Kaynağı */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Ödeme Kaynağı</label>
            <select value={form.payment_source} onChange={e => { set('payment_source', e.target.value as PaymentSource); set('payment_source_id', '') }}
              className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              {(Object.keys(PAYMENT_SOURCE_LABELS) as PaymentSource[]).map(k => (
                <option key={k} value={k}>{PAYMENT_SOURCE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          {showSourceSelect && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Hesap Seç</label>
              <select value={form.payment_source_id} onChange={e => set('payment_source_id', e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Seçin (opsiyonel)</option>
                {sourceOptions().map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Gider Sahibi */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Gider Sahibi</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(EXPENSE_OWNER_LABELS) as ExpenseOwner[]).map(k => (
              <button key={k} type="button" onClick={() => set('expense_owner', k)}
                className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.expense_owner === k ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                {EXPENSE_OWNER_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        {/* İlişkilendirme */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">İlişkilendirme (Opsiyonel)</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Varlık</label>
              <select value={form.related_asset_id} onChange={e => set('related_asset_id', e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-input px-3 text-xs text-foreground">
                <option value="">—</option>
                {(ctx?.assets ?? []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Alım</label>
              <select value={form.related_purchase_id} onChange={e => set('related_purchase_id', e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-input px-3 text-xs text-foreground">
                <option value="">—</option>
                {(ctx?.purchases ?? []).map(p => <option key={p.id} value={p.id}>{p.purchase_no}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Satış</label>
              <select value={form.related_sale_id} onChange={e => set('related_sale_id', e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-input px-3 text-xs text-foreground">
                <option value="">—</option>
                {(ctx?.sales ?? []).map(s => <option key={s.id} value={s.id}>{s.sale_no}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* KDV */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.tax_included} onChange={e => set('tax_included', e.target.checked)} className="w-4 h-4 rounded border-border" />
            <span className="text-sm text-foreground">KDV Dahil</span>
          </label>
          {form.tax_included && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Oran:</label>
              <NumberInput value={form.vat_rate} onChange={v => set('vat_rate', v)} decimals={0} className="w-24" suffix="%" />
            </div>
          )}
        </div>

        {/* Etiketler */}
        <Input label="Etiketler" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Virgülle ayırın: bakım, yıllık, acil" />

        {/* Notlar */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Notlar</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Ek bilgi..."
            className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </Drawer>
  )
}
