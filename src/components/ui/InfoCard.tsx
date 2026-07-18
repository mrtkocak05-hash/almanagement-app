import { type LucideIcon, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

type InfoCardType = 'info' | 'warning' | 'success' | 'error'

interface InfoCardProps {
  type?: InfoCardType
  title?: string
  message: string
  icon?: LucideIcon
  className?: string
}

const typeConfig: Record<InfoCardType, { icon: LucideIcon; classes: string }> = {
  info: { icon: Info, classes: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' },
  warning: { icon: AlertTriangle, classes: 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400' },
  success: { icon: CheckCircle, classes: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' },
  error: { icon: XCircle, classes: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' },
}

export function InfoCard({ type = 'info', title, message, icon, className }: InfoCardProps) {
  const config = typeConfig[type]
  const Icon = icon || config.icon

  return (
    <div className={cn('flex gap-3 p-4 rounded-lg border', config.classes, className)}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>
        {title && <p className="text-sm font-semibold mb-0.5">{title}</p>}
        <p className="text-sm opacity-90">{message}</p>
      </div>
    </div>
  )
}
