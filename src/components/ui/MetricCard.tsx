import { cn } from '@/utils/cn'
import { Card } from './Card'

interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  colorBar?: string
  className?: string
}

export function MetricCard({ label, value, subValue, colorBar, className }: MetricCardProps) {
  return (
    <Card className={cn('p-4 relative overflow-hidden', className)}>
      {colorBar && (
        <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', colorBar)} />
      )}
      <div className={cn(colorBar && 'pl-2')}>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
      </div>
    </Card>
  )
}
