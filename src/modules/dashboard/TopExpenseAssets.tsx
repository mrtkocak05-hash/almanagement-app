import { memo } from 'react'
import { Receipt, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { useTopExpenseAssets } from '@/hooks/useAIDashboard'

const TYPE_LABELS: Record<string, string> = {
  arac: 'Araç', gayrimenkul: 'G.Menkul', is_makinesi: 'Makine',
  tekne: 'Tekne', karavan: 'Karavan', motosiklet: 'Moto',
  cash: 'Nakit', investment: 'Yatırım', other: 'Diğer',
}

const BAR_COLORS = ['#ef4444', '#f97316', '#C9A84C', '#eab308', '#94a3b8']

export const TopExpenseAssets = memo(function TopExpenseAssets() {
  const { data, loading } = useTopExpenseAssets()

  const maxExpense = data?.length ? Math.max(...data.map(d => d.total_expenses)) : 0

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/15">
          <Receipt className="w-3.5 h-3.5 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">En Çok Gider</p>
          <p className="text-xs text-muted-foreground mt-0.5">Varlık bazlı gider</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="px-4 py-2.5 border-b border-border/60 last:border-0 space-y-1.5">
              <div className="flex justify-between">
                <div className="w-24 h-3 rounded bg-muted/40 animate-pulse" />
                <div className="w-16 h-3 rounded bg-muted/40 animate-pulse" />
              </div>
              <div className="h-1.5 rounded-full bg-muted/30 animate-pulse" />
            </div>
          ))
        ) : !data?.length ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-2 text-center">
            <AlertCircle className="w-8 h-8 text-muted/20" />
            <p className="text-xs text-muted-foreground">Varlığa bağlı gider kaydı yok</p>
          </div>
        ) : data.map((item, i) => {
          const barColor = BAR_COLORS[i] ?? '#94a3b8'
          const pct = maxExpense > 0 ? (item.total_expenses / maxExpense) * 100 : 0
          return (
            <div key={item.asset_id}
              className="px-4 py-2.5 border-b border-border/60 last:border-0 hover:bg-accent/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground flex-shrink-0">
                    {TYPE_LABELS[item.asset_type] ?? item.asset_type}
                  </span>
                  <p className="text-xs font-medium text-foreground truncate">{item.asset_name}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
                    {formatCurrency(item.total_expenses, 'TRY')}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{item.expense_count} gider</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {!loading && data && data.length > 0 && (
        <div className="px-4 py-2 border-t border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-muted-foreground">{data.length} varlık</p>
            <p className="text-[9px] font-semibold text-red-400">
              {formatCurrency(data.reduce((s, d) => s + d.total_expenses, 0), 'TRY')} toplam
            </p>
          </div>
        </div>
      )}
    </Card>
  )
})
