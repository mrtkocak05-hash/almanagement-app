import { Plus, Trash2 } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { SALE_EXPENSE_TYPES, type WizardSaleExpense } from '@/types/sales'
import { CURRENCY_LABELS, type PurchaseCurrency } from '@/types/purchases'
import type { SaleWizardData } from '@/types/sales'

interface Props {
  data: SaleWizardData
  set: <K extends keyof SaleWizardData>(key: K, value: SaleWizardData[K]) => void
  exchangeRates: { usd_try: number; gold_gram_try: number }
}

const EMPTY: WizardSaleExpense = {
  expense_type: 'Diğer', expense_name: '', amount: 0, currency: 'TRY', exchange_rate: 1, amount_try: 0,
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {children}
    </select>
  )
}

export function Step3Expenses({ data, set, exchangeRates }: Props) {
  const expenses = data.expenses

  const getRate = (currency: PurchaseCurrency) => {
    if (currency === 'TRY') return 1
    if (currency === 'USD') return exchangeRates.usd_try || 1
    if (currency === 'EUR') return (exchangeRates.usd_try || 1) * 1.08
    if (currency === 'Gold') return exchangeRates.gold_gram_try || 1
    return 1
  }

  const add = () => set('expenses', [...expenses, { ...EMPTY }])
  const remove = (i: number) => set('expenses', expenses.filter((_, idx) => idx !== i))
  const update = (i: number, key: keyof WizardSaleExpense, value: string | number) => {
    const next = expenses.map((e, idx) => {
      if (idx !== i) return e
      const updated = { ...e, [key]: value }
      if (key === 'amount' || key === 'currency') {
        const rate = getRate(key === 'currency' ? value as PurchaseCurrency : updated.currency)
        updated.exchange_rate = rate
        updated.amount_try = Math.round((Number(updated.amount) || 0) * rate * 100) / 100
      }
      return updated
    })
    set('expenses', next)
  }

  const totalExpTry = expenses.reduce((s, e) => s + (e.amount_try || 0), 0)
  const netSale = (data.sale_price_try || 0) - totalExpTry
  const netProfit = netSale - (data.total_cost_try || 0)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Satış Giderleri</h2>
        <p className="text-sm text-muted-foreground mt-1">Noter, komisyon, vergi ve diğer ek giderler</p>
      </div>

      <div className="flex items-center gap-6 p-4 rounded-xl border border-border bg-muted/20">
        <div>
          <p className="text-xs text-muted-foreground">Satış Fiyatı</p>
          <p className="text-base font-semibold text-foreground">{formatCurrency(data.sale_price_try || 0)}</p>
        </div>
        <div className="text-muted-foreground">−</div>
        <div>
          <p className="text-xs text-muted-foreground">Satış Giderleri</p>
          <p className="text-base font-semibold text-orange-500">{formatCurrency(totalExpTry)}</p>
        </div>
        <div className="text-muted-foreground">=</div>
        <div>
          <p className="text-xs text-muted-foreground">Net Satış</p>
          <p className="text-base font-bold text-foreground">{formatCurrency(netSale)}</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <p className="text-xs text-muted-foreground">Net Kâr</p>
          <p className={`text-base font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(netProfit)}</p>
        </div>
        <Button size="sm" variant="outline" className="ml-auto" onClick={add}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Gider Ekle
        </Button>
      </div>

      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Satış gideri yoksa bu adımı atlayabilirsiniz.</p>
      ) : (
        <div className="space-y-3">
          {expenses.map((e, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-card space-y-2">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Gider Türü</label>
                  <Sel value={e.expense_type} onChange={v => update(i, 'expense_type', v)}>
                    {SALE_EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </Sel>
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-muted-foreground mb-1 block">Açıklama</label>
                  <Input value={e.expense_name} onChange={ev => update(i, 'expense_name', ev.target.value)} placeholder="Gider adı" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Tutar</label>
                  <Input type="number" value={e.amount || ''} onChange={ev => update(i, 'amount', Number(ev.target.value) || 0)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Para Birimi</label>
                  <Sel value={e.currency} onChange={v => update(i, 'currency', v as PurchaseCurrency)}>
                    {(Object.keys(CURRENCY_LABELS) as PurchaseCurrency[]).map(c => (
                      <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
                    ))}
                  </Sel>
                </div>
                <div className="col-span-1 flex items-end justify-end pb-0.5">
                  <button onClick={() => remove(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {e.currency !== 'TRY' && (
                <p className="text-xs text-muted-foreground">TRY: <span className="font-medium text-foreground">{formatCurrency(e.amount_try)}</span></p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
