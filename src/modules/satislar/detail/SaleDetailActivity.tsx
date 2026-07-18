import type { SaleDetail } from '@/types/sales'

export function SaleDetailActivity({ sale }: { sale: SaleDetail }) {
  if (!sale.activities || sale.activities.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Aktivite kaydı bulunmuyor.</p>
  }

  return (
    <div className="space-y-3">
      {(sale.activities as Record<string, unknown>[]).map((a, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-xl border border-border bg-card">
          <div className="w-2 h-2 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{String(a.title ?? '')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {String(a.activity_date ?? a.created_at ?? '')}
              {a.amount != null && ` · ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Number(a.amount))}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
