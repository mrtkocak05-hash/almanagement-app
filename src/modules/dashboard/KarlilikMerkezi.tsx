import { memo, useMemo } from 'react'
import { TrendingUp, TrendingDown, Award, BarChart2 } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useProfitability } from '@/hooks/useAIDashboard'

export const KarlilikMerkezi = memo(function KarlilikMerkezi() {
  const { data, loading } = useProfitability()

  const stats = useMemo(() => {
    if (!data) return null
    return [
      {
        label: 'Toplam Kar',
        value: data.total_profit,
        isCurrency: true,
        color: data.total_profit > 0 ? 'text-green-500' : 'text-muted-foreground',
        icon: TrendingUp,
        iconColor: 'text-green-500',
        bg: 'bg-green-500/10',
      },
      {
        label: 'Toplam Zarar',
        value: data.total_loss,
        isCurrency: true,
        color: data.total_loss > 0 ? 'text-red-400' : 'text-muted-foreground',
        icon: TrendingDown,
        iconColor: 'text-red-400',
        bg: 'bg-red-400/10',
      },
      {
        label: 'Ortalama ROI',
        value: data.avg_roi,
        suffix: '%',
        color: data.avg_roi > 0 ? 'text-yellow-600' : 'text-muted-foreground',
        icon: BarChart2,
        iconColor: 'text-yellow-600',
        bg: 'bg-yellow-600/10',
      },
      {
        label: 'Net Sonuç',
        value: data.net,
        isCurrency: true,
        color: data.net >= 0 ? 'text-green-500' : 'text-red-400',
        icon: Award,
        iconColor: data.net >= 0 ? 'text-green-500' : 'text-red-400',
        bg: data.net >= 0 ? 'bg-green-500/10' : 'bg-red-400/10',
      },
    ]
  }, [data])

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-500/15">
          <Award className="w-3.5 h-3.5 text-green-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Karlılık Merkezi</p>
          <p className="text-xs text-muted-foreground mt-0.5">Gerçekleşen satışlar</p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-xl border border-border p-3 space-y-2">
                <div className="h-3 w-16 rounded bg-muted/40 animate-pulse" />
                <div className="h-5 w-24 rounded bg-muted/40 animate-pulse" />
              </div>
            ))}
          </div>
        ) : !data || !stats ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-muted-foreground">Tamamlanan satış kaydı yok</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="rounded-xl border border-border p-3 flex items-center gap-2.5">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', s.bg)}>
                      <Icon className={cn('w-4 h-4', s.iconColor)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                      <p className={cn('text-sm font-bold tabular-nums leading-tight', s.color)}>
                        {s.isCurrency
                          ? formatCurrency(s.value ?? 0, 'TRY')
                          : `${(s.value ?? 0).toFixed(1)}${s.suffix ?? ''}`
                        }
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* En karlı / en düşük */}
            {data.best && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">En Karlı Yatırım</p>
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground truncate max-w-[60%]">{data.best.asset_name}</p>
                    <span className="text-xs font-bold text-green-500">
                      {data.best.roi_percent != null ? `%${data.best.roi_percent.toFixed(1)} ROI` : ''}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatCurrency(data.best.net_profit_try, 'TRY')} net kar
                  </p>
                </div>
              </div>
            )}

            {data.worst && data.worst.id !== data.best?.id && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">En Düşük Karlılık</p>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground truncate max-w-[60%]">{data.worst.asset_name}</p>
                    <span className={cn('text-xs font-bold', data.worst.net_profit_try < 0 ? 'text-red-400' : 'text-muted-foreground')}>
                      {data.worst.roi_percent != null ? `%${data.worst.roi_percent.toFixed(1)} ROI` : ''}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatCurrency(data.worst.net_profit_try, 'TRY')} net
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
})
