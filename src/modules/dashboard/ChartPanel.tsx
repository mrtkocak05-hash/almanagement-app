import { memo, useState, useMemo } from 'react'
import { BarChart2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useChartData } from '@/hooks/useAIDashboard'

type Period = 'monthly' | 'weekly' | 'yearly'
type Series = 'income' | 'expenses' | 'profit'

const SERIES_CONFIG: Record<Series, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  income:   { label: 'Gelir',  color: '#22c55e', icon: TrendingUp },
  expenses: { label: 'Gider',  color: '#ef4444', icon: TrendingDown },
  profit:   { label: 'Kar',    color: '#C9A84C', icon: DollarSign },
}

const PERIOD_LABELS: Record<Period, string> = {
  monthly: 'Aylık',
  weekly: 'Haftalık',
  yearly: 'Yıllık',
}

function BarGroup({ point, maxVal, activeSeries }: { point: { label: string; income: number; expenses: number; profit: number }; maxVal: number; activeSeries: Series[] }) {
  const BAR_H = 120
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0 group">
      <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: BAR_H }}>
        {(activeSeries as Series[]).map(s => {
          const val = point[s] as number
          const h = maxVal > 0 ? Math.max(2, (val / maxVal) * BAR_H) : 2
          const { color, label } = SERIES_CONFIG[s]
          return (
            <div key={s} className="relative flex flex-col items-center">
              <div
                className="rounded-t-sm transition-all duration-500 cursor-pointer min-w-[6px] max-w-[16px] w-[10px]"
                style={{ height: h, backgroundColor: color, opacity: 0.85 }}
                title={`${label}: ${formatCurrency(val, 'TRY')}`}
              />
            </div>
          )
        })}
      </div>
      <p className="text-[9px] text-muted-foreground truncate w-full text-center leading-none">{point.label}</p>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="bg-popover border border-border rounded-lg shadow-xl px-3 py-2 text-xs whitespace-nowrap">
          <p className="font-semibold text-foreground mb-1">{point.label}</p>
          {activeSeries.map(s => (
            <div key={s} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SERIES_CONFIG[s].color }} />
              <span className="text-muted-foreground">{SERIES_CONFIG[s].label}:</span>
              <span className="font-medium text-foreground">{formatCurrency(point[s] as number, 'TRY')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const ChartPanel = memo(function ChartPanel() {
  const [period, setPeriod] = useState<Period>('monthly')
  const [activeSeries, setActiveSeries] = useState<Set<Series>>(new Set(['income', 'expenses', 'profit']))
  const { data, loading } = useChartData(period)

  const maxVal = useMemo(() => {
    if (!data) return 0
    return Math.max(...data.map(p => Math.max(
      activeSeries.has('income')   ? p.income   : 0,
      activeSeries.has('expenses') ? p.expenses : 0,
      activeSeries.has('profit')   ? p.profit   : 0,
    )), 1)
  }, [data, activeSeries])

  function toggleSeries(s: Series) {
    setActiveSeries(prev => {
      const n = new Set(prev)
      if (n.has(s) && n.size > 1) n.delete(s)
      else n.add(s)
      return n
    })
  }

  const seriesArr = Array.from(activeSeries) as Series[]

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-500/15">
            <BarChart2 className="w-3.5 h-3.5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Finansal Grafik</p>
            <p className="text-xs text-muted-foreground mt-0.5">Gelir · Gider · Kar</p>
          </div>
        </div>

        {/* Period switcher */}
        <div className="flex gap-1 bg-muted/40 p-0.5 rounded-lg">
          {(['monthly', 'weekly', 'yearly'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn('px-2.5 py-1 text-[10px] font-medium rounded-md transition-all duration-150',
                period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Series toggles */}
      <div className="flex items-center gap-3 px-5 py-2 border-b border-border flex-shrink-0">
        {(Object.entries(SERIES_CONFIG) as [Series, typeof SERIES_CONFIG[Series]][]).map(([key, cfg]) => {
          const Icon = cfg.icon
          const active = activeSeries.has(key)
          return (
            <button
              key={key}
              onClick={() => toggleSeries(key)}
              className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-150',
                active ? 'opacity-100' : 'opacity-30'
              )}
              style={{ color: cfg.color, backgroundColor: active ? `${cfg.color}18` : 'transparent' }}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Chart area */}
      <div className="flex-1 px-5 py-4 min-h-0">
        {loading ? (
          <div className="flex items-end gap-1 h-[130px]">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="flex-1 rounded-t-sm animate-pulse bg-muted/30"
                style={{ height: `${30 + Math.sin(i) * 30 + 20}px` }} />
            ))}
          </div>
        ) : !data?.length ? (
          <div className="flex flex-col items-center justify-center h-full py-6 gap-2 text-center">
            <BarChart2 className="w-8 h-8 text-muted/20" />
            <p className="text-xs text-muted-foreground">İşlem kaydı oluşunca grafik görüntülenir</p>
          </div>
        ) : (
          <div className="flex items-end gap-1 relative overflow-x-auto" style={{ minHeight: 130 }}>
            {data.map((point, i) => (
              <BarGroup key={i} point={point} maxVal={maxVal} activeSeries={seriesArr} />
            ))}
          </div>
        )}
      </div>

      {/* Summary totals */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-3 gap-0 border-t border-border flex-shrink-0">
          {seriesArr.map(s => {
            const total = data.reduce((sum, p) => sum + (p[s] as number), 0)
            const { color, label } = SERIES_CONFIG[s]
            return (
              <div key={s} className="px-4 py-2 text-center border-r border-border last:border-0">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-xs font-bold tabular-nums leading-tight mt-0.5" style={{ color }}>
                  {formatCurrency(total, 'TRY')}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
})
