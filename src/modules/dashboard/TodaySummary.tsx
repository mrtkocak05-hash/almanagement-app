import { ShoppingCart, TrendingUp, Receipt, DollarSign, ArrowUpDown } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import type { DashboardData } from '@/types/dashboard'
import { cn } from '@/utils/cn'

interface TodaySummaryProps {
  summary: DashboardData['today_summary']
}

export function TodaySummary({ summary }: TodaySummaryProps) {
  const items = [
    {
      label: 'Bugünkü Satınalma',
      value: summary.purchases,
      icon: ShoppingCart,
      color: 'text-blue-500',
      sign: '-',
    },
    {
      label: 'Bugünkü Satış',
      value: summary.sales,
      icon: TrendingUp,
      color: 'text-green-500',
      sign: '+',
    },
    {
      label: 'Bugünkü Masraf',
      value: summary.expenses,
      icon: Receipt,
      color: 'text-red-500',
      sign: '-',
    },
    {
      label: 'Bugünkü Gelir',
      value: summary.income,
      icon: DollarSign,
      color: 'text-teal-500',
      sign: '+',
    },
    {
      label: 'Net Değişim',
      value: Math.abs(summary.net_change),
      icon: ArrowUpDown,
      color: summary.net_change >= 0 ? 'text-green-500' : 'text-red-500',
      sign: summary.net_change >= 0 ? '+' : '-',
      isSummary: true,
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-4">
      {items.map(item => {
        const Icon = item.icon
        return (
          <Card key={item.label} className={cn('p-5', item.isSummary && 'border-border/70')}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={cn('w-3.5 h-3.5', item.color)} />
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
            </div>
            <p className={cn('text-xl font-bold tabular-nums', item.value === 0 ? 'text-muted-foreground/40' : item.color)}>
              {item.value === 0
                ? '—'
                : `${item.sign === '+' ? '+' : item.sign === '-' ? '-' : ''}${formatCurrency(item.value, 'TRY')}`}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
