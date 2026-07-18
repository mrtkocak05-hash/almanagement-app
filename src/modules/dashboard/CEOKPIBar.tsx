import { memo } from 'react'
import {
  Briefcase, TrendingUp, TrendingDown, Wallet, BarChart2,
  ShoppingCart, Package, Clock, CheckCircle, DollarSign,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useKPIs } from '@/hooks/useAIDashboard'

interface KPIItem {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  trend?: 'up' | 'down' | 'neutral'
}

function KPICard({ item, loading }: { item: KPIItem; loading: boolean }) {
  const Icon = item.icon
  return (
    <div className={cn(
      'flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-card',
      'hover:border-yellow-600/30 hover:shadow-sm hover:-translate-y-px transition-all duration-150',
      'min-w-0',
    )}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', item.bg)}>
        <Icon className={cn('w-4 h-4', item.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5 truncate">{item.label}</p>
        {loading ? (
          <div className="h-4 w-20 rounded bg-muted/40 animate-pulse" />
        ) : (
          <p className="text-sm font-bold text-foreground tabular-nums truncate leading-none">{item.value}</p>
        )}
      </div>
      {item.trend && !loading && (
        <div className="flex-shrink-0">
          {item.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
          {item.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
        </div>
      )}
    </div>
  )
}

export const CEOKPIBar = memo(function CEOKPIBar() {
  const { data, loading } = useKPIs()

  const items: KPIItem[] = data ? [
    {
      label: 'Portföy Değeri',
      value: formatCurrency(data.portfolio_value, 'TRY'),
      icon: Briefcase,
      color: 'text-yellow-600',
      bg: 'bg-yellow-600/10',
    },
    {
      label: 'Aktif Varlık',
      value: formatNumber(data.active_assets, 0),
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Bu Ay Kar',
      value: formatCurrency(data.month_profit, 'TRY'),
      icon: TrendingUp,
      color: data.month_profit >= 0 ? 'text-green-500' : 'text-red-400',
      bg: data.month_profit >= 0 ? 'bg-green-500/10' : 'bg-red-400/10',
      trend: data.month_profit > 0 ? 'up' : data.month_profit < 0 ? 'down' : 'neutral',
    },
    {
      label: 'Net Nakit',
      value: formatCurrency(data.net_cash, 'TRY'),
      icon: Wallet,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Ortalama ROI',
      value: data.avg_roi > 0 ? `%${data.avg_roi.toFixed(1)}` : '—',
      icon: BarChart2,
      color: data.avg_roi > 0 ? 'text-yellow-600' : 'text-muted-foreground',
      bg: 'bg-yellow-600/10',
    },
    {
      label: 'Toplam Satış',
      value: formatCurrency(data.total_sales, 'TRY'),
      icon: DollarSign,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10',
    },
    {
      label: 'Toplam Alım',
      value: formatCurrency(data.total_purchases, 'TRY'),
      icon: ShoppingCart,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Bu Ay Gider',
      value: formatCurrency(data.month_expenses, 'TRY'),
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      label: 'Bekleyen Satış',
      value: formatNumber(data.pending_sales, 0),
      icon: Clock,
      color: data.pending_sales > 0 ? 'text-orange-500' : 'text-muted-foreground',
      bg: data.pending_sales > 0 ? 'bg-orange-500/10' : 'bg-muted/40',
    },
    {
      label: 'Pasif Varlık',
      value: formatNumber(data.passive_assets, 0),
      icon: CheckCircle,
      color: 'text-muted-foreground',
      bg: 'bg-muted/40',
    },
  ] : Array.from({ length: 10 }, () => ({
    label: '—', value: '—', icon: Briefcase, color: 'text-muted-foreground', bg: 'bg-muted/20',
  } as KPIItem))

  return (
    <div className="grid grid-cols-5 xl:grid-cols-10 gap-2">
      {items.map((item, i) => (
        <KPICard key={i} item={item} loading={loading} />
      ))}
    </div>
  )
})
