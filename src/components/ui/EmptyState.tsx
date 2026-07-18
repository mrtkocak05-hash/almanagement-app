import { type LucideIcon, Inbox } from 'lucide-react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-12 text-center', className)}>
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        {description && <p className="text-xs text-muted-foreground max-w-xs">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
