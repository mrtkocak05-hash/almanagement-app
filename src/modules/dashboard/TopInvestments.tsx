import { memo } from 'react'
import { Trophy, TrendingUp, Clock } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useTopInvestments } from '@/hooks/useAIDashboard'

const TYPE_LABELS: Record<string, string> = {
  arac: 'Araç', gayrimenkul: 'G.Menkul', is_makinesi: 'Makine',
  tekne: 'Tekne', karavan: 'Karavan', motosiklet: 'Moto',
  cash: 'Nakit', investment: 'Yatırım', other: 'Diğer',
}

const RANK_BG = ['#C9A84C', '#94A3B8', '#CD7F32', '#6B7280', '#6B7280']

function roiColor(roi: number): string {
  if (roi >= 50) return '#22c55e'
  if (roi >= 20) return '#C9A84C'
  if (roi >= 0)  return '#94a3b8'
  return '#ef4444'
}

export const TopInvestments = memo(function TopInvestments() {
  const { data, loading } = useTopInvestments()

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#C9A84C' }}>
          <Trophy className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">En Karlı Yatırımlar</p>
          <p className="text-xs text-muted-foreground mt-0.5">ROI sıralaması</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-0">
              <div className="w-5 h-5 rounded-full bg-muted/40 animate-pulse flex-shrink-0" />
              <div className="flex-1 h-3 rounded bg-muted/40 animate-pulse" />
              <div className="w-12 h-4 rounded-full bg-muted/40 animate-pulse" />
            </div>
          ))
        ) : !data?.length ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-2 text-center">
            <TrendingUp className="w-8 h-8 text-muted/20" />
            <p className="text-xs text-muted-foreground">Tamamlanmış satış kaydı yok</p>
          </div>
        ) : data.map((inv, i) => {
          const rankBg = RANK_BG[i] ?? '#6B7280'
          const color = roiColor(inv.roi_percent)
          return (
            <div key={inv.id}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 last:border-0 hover:bg-accent/30 transition-colors">
              {/* Rank badge */}
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white"
                style={{ backgroundColor: rankBg, opacity: i < 3 ? 1 : 0.5 }}>
                {i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate leading-snug">{inv.asset_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                    {TYPE_LABELS[inv.asset_type] ?? inv.asset_type}
                  </span>
                  {inv.holding_days != null && (
                    <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />{inv.holding_days}g
                    </span>
                  )}
                </div>
              </div>

              {/* ROI + profit */}
              <div className="text-right flex-shrink-0">
                <span className={cn('text-xs font-black tabular-nums px-2 py-0.5 rounded-full')}
                  style={{ color, backgroundColor: `${color}18` }}>
                  %{inv.roi_percent.toFixed(1)}
                </span>
                <p className="text-[9px] text-muted-foreground mt-0.5 tabular-nums">
                  +{formatCurrency(inv.net_profit_try, 'TRY')}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {!loading && data && data.length > 0 && (
        <div className="px-4 py-2 border-t border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-muted-foreground">
              Ort. ROI: %{(data.reduce((s, d) => s + d.roi_percent, 0) / data.length).toFixed(1)}
            </p>
            <p className="text-[9px] font-semibold text-green-500">
              +{formatCurrency(data.reduce((s, d) => s + d.net_profit_try, 0), 'TRY')}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
})
