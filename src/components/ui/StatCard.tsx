import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card } from './Card'

interface StatCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: number
  trendLabel?: string
  className?: string
  iconColor?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
  iconColor = 'text-muted-foreground',
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground mt-1.5 tracking-tight">{value}</p>

          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  isPositive ? 'text-green-500' : 'text-destructive'
                )}
              >
                {isPositive ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-muted-foreground">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        )}
      </div>
    </Card>
  )
}
