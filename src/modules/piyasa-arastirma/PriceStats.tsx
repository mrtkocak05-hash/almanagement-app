import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import type { PriceStats as PriceStatsType } from '@/types/marketResearch'
import { cn } from '@/utils/cn'

interface Props { stats: PriceStatsType }

export function PriceStatsCard({ stats }: Props) {
  if (!stats.count) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        İlan eklendikçe istatistikler hesaplanır
      </div>
    )
  }

  const items = [
    { label: 'En Düşük', value: stats.min, icon: TrendingDown, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'En Yüksek', value: stats.max, icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Ortalama', value: stats.avg, icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Medyan', value: stats.median, icon: Minus, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(item => {
        const Icon = item.icon
        return (
          <div key={item.label} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', item.bg)}>
              <Icon className={cn('w-4 h-4', item.color)} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(item.value, 'TRY')}</p>
            </div>
          </div>
        )
      })}
      <div className="col-span-2 rounded-xl border border-border bg-card p-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fiyat Aralığı</p>
          <p className="text-sm font-semibold text-foreground">{formatCurrency(stats.range, 'TRY')}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">İlan Sayısı</p>
          <p className="text-sm font-bold text-foreground">{stats.count}</p>
        </div>
      </div>
    </div>
  )
}
