import { formatCurrency } from '@/utils/format'
import type { SaleDetail } from '@/types/sales'

export function SaleDetailPartners({ sale }: { sale: SaleDetail }) {
  if (!sale.partners || sale.partners.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Hissedar kaydı bulunmuyor.</p>
  }

  return (
    <div className="space-y-2">
      {sale.partners.map((p, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0">
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{p.name}</p>
            {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">%{p.share_percent}</p>
            {sale.total_cost_try != null && (
              <p className="text-xs text-muted-foreground">{formatCurrency(sale.total_cost_try * p.share_percent / 100)}</p>
            )}
          </div>
        </div>
      ))}

      <div className="p-3 rounded-xl bg-muted/20 border border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Toplam Hisseler</span>
          <span className="font-semibold text-foreground">
            %{sale.partners.reduce((s, p) => s + p.share_percent, 0)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted-foreground">Benim Payım</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(sale.my_share_cost ?? (sale.total_cost_try ?? 0) * sale.share_percent / 100)}
          </span>
        </div>
      </div>
    </div>
  )
}
