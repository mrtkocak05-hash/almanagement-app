import { memo } from 'react'
import {
  ShoppingCart, TrendingUp, Receipt, User,
  DollarSign, FileText, Landmark, Activity, Zap,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import type { Activity as ActivityItem, ActivityType } from '@/types/dashboard'
import { cn } from '@/utils/cn'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('tr')

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; dot: string; module: string }
> = {
  purchase:         { label: 'Satınalma',    icon: ShoppingCart, color: 'text-blue-500',   bg: 'bg-blue-500/10',   dot: '#3b82f6', module: 'Satınalma' },
  sale:             { label: 'Satış',         icon: TrendingUp,   color: 'text-green-500',  bg: 'bg-green-500/10',  dot: '#22c55e', module: 'Satışlar' },
  expense:          { label: 'Masraf',        icon: Receipt,      color: 'text-red-400',    bg: 'bg-red-400/10',    dot: '#f87171', module: 'Masraflar' },
  personal_expense: { label: 'Kişisel',      icon: User,         color: 'text-zinc-400',   bg: 'bg-zinc-400/10',   dot: '#a1a1aa', module: 'Kişisel' },
  income:           { label: 'Gelir',         icon: DollarSign,   color: 'text-teal-500',   bg: 'bg-teal-500/10',   dot: '#14b8a6', module: 'Finans' },
  document:         { label: 'Doküman',       icon: FileText,     color: 'text-gray-400',   bg: 'bg-gray-400/10',   dot: '#9ca3af', module: 'Arşiv' },
  capital:          { label: 'Sermaye',       icon: Landmark,     color: 'text-yellow-500', bg: 'bg-yellow-500/10', dot: '#eab308', module: 'Finans' },
}

function StoryItem({ item }: { item: ActivityItem }) {
  const cfg = ACTIVITY_CONFIG[item.type] ?? ACTIVITY_CONFIG.document
  const Icon = cfg.icon
  const time = dayjs(item.activity_date)
  const isToday = time.isSame(dayjs(), 'day')

  return (
    <div className={cn(
      'group flex items-start gap-3 px-4 py-2.5 border-b border-border/60 last:border-0',
      'hover:bg-accent/40 transition-colors duration-150 cursor-default',
    )}>
      {/* Icon badge */}
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
        <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate leading-snug">{item.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                {cfg.label}
              </span>
              <span className="text-[9px] text-muted-foreground">{cfg.module}</span>
              {item.note && (
                <span className="text-[9px] text-muted-foreground truncate max-w-[100px]">· {item.note}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            {item.amount != null && (
              <span className={cn('text-xs font-bold tabular-nums', cfg.color)}>
                {formatCurrency(item.amount, item.currency)}
              </span>
            )}
            <div className="flex items-center gap-1">
              {isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              )}
              <span className="text-[9px] text-muted-foreground tabular-nums">
                {time.format('DD MMM, HH:mm')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ActivityTimelineProps {
  activities: ActivityItem[]
}

export const ActivityTimeline = memo(function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-yellow-600/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Son Hareketler</p>
            <p className="text-xs text-muted-foreground mt-0.5">{activities.length} aktivite</p>
          </div>
        </div>
        {activities.length > 0 && (
          <div className="flex gap-1">
            {(['purchase', 'sale', 'expense', 'income'] as ActivityType[]).map(t => {
              const count = activities.filter(a => a.type === t).length
              if (!count) return null
              const cfg = ACTIVITY_CONFIG[t]
              return (
                <span key={t}
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${cfg.dot}18`, color: cfg.dot }}>
                  {count}
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
            <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground">Henüz hareket yok</p>
          </div>
        ) : (
          activities.map(item => <StoryItem key={item.id} item={item} />)
        )}
      </div>
    </Card>
  )
})
