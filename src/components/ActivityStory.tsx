import { useEffect, useState } from 'react'
import { ShoppingCart, TrendingUp, TrendingDown, FileText, Camera, Receipt, Plus, DollarSign, Activity, Loader2 } from 'lucide-react'
import { formatCurrency, formatRelative } from '@/utils/format'
import { cn } from '@/utils/cn'

interface StoryEvent {
  type: string
  icon: string
  title: string
  detail: string | null
  amount: number | null
  currency?: string
  date: string
}

interface Props {
  assetId: number
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Plus, ShoppingCart, TrendingUp, TrendingDown, FileText, Camera, Receipt, DollarSign, Activity,
}

const EVENT_COLORS: Record<string, string> = {
  asset_created: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  purchased:     'bg-amber-500/15 text-amber-400 border-amber-500/20',
  expense:       'bg-orange-500/15 text-orange-400 border-orange-500/20',
  photos_added:  'bg-purple-500/15 text-purple-400 border-purple-500/20',
  document:      'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  activity:      'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  sold:          'bg-green-500/15 text-green-400 border-green-500/20',
  profit:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  loss:          'bg-red-500/15 text-red-400 border-red-500/20',
}

export function ActivityStory({ assetId }: Props) {
  const [events, setEvents] = useState<StoryEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/assets/${assetId}/story`)
      .then(r => r.json())
      .then(j => { if (j.success) setEvents(j.data.events ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [assetId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!events.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">Henüz aktivite yok.</p>
  }

  return (
    <div className="relative pl-10 space-y-0">
      {/* Vertical line */}
      <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />

      {events.map((ev, i) => {
        const IconComp = ICON_MAP[ev.icon] ?? Activity
        const colorCls = EVENT_COLORS[ev.type] ?? EVENT_COLORS.activity

        return (
          <div key={i} className="relative pb-5 last:pb-0">
            {/* Icon dot */}
            <div className={cn(
              'absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center',
              colorCls,
            )}>
              <IconComp className="w-2.5 h-2.5" />
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">{ev.title}</p>
                {ev.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{ev.detail}</p>
                )}
                <p className="text-[11px] text-muted-foreground/50 mt-1">{formatRelative(ev.date)}</p>
              </div>
              {ev.amount != null && (
                <span className={cn(
                  'text-xs font-semibold tabular-nums flex-shrink-0',
                  ev.type === 'profit' ? 'text-emerald-400' : ev.type === 'loss' ? 'text-red-400' : 'text-muted-foreground',
                )}>
                  {ev.type === 'profit' ? '+' : ev.type === 'loss' ? '' : ''}
                  {formatCurrency(Math.abs(ev.amount))}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
