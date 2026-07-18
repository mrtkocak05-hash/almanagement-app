import { formatCurrency } from '@/utils/format'
import { CURRENCY_LABELS } from '@/types/purchases'
import type { SaleDetail } from '@/types/sales'

export function SaleDetailExpenses({ sale }: { sale: SaleDetail }) {
  const active = sale.expenses.filter(e => !e.deleted_at)

  if (active.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Satış gideri bulunmuyor.</p>
  }

  const total = active.reduce((s, e) => s + e.amount_try, 0)

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Gider Türü</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Açıklama</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Tutar</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">TRY</th>
            </tr>
          </thead>
          <tbody>
            {active.map(e => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-foreground font-medium">{e.expense_type}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.expense_name || '—'}</td>
                <td className="px-4 py-2.5 text-right text-foreground">
                  {e.currency !== 'TRY'
                    ? `${e.amount} ${CURRENCY_LABELS[e.currency as keyof typeof CURRENCY_LABELS] ?? e.currency}`
                    : formatCurrency(e.amount)
                  }
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-foreground">{formatCurrency(e.amount_try)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/20">
              <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-foreground">Toplam</td>
              <td className="px-4 py-2.5 text-right font-bold text-foreground">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
