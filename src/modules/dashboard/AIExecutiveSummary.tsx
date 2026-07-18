import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BotMessageSquare, Clock, TrendingUp, Search,
  Wallet, AlertOctagon, FileText, CheckCircle2, ArrowRight,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'
import { useExecutiveSummary } from '@/hooks/useAIDashboard'
import type { ActionIcon, ActionPriority } from '@/types/aiDashboard'

const ICON_MAP: Record<ActionIcon, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  trending_up: TrendingUp,
  search: Search,
  wallet: Wallet,
  alert: AlertOctagon,
  file: FileText,
  check: CheckCircle2,
}

const PRIORITY_STYLES: Record<ActionPriority, { dot: string; border: string; bg: string }> = {
  high: { dot: 'bg-red-400', border: 'border-red-400/20', bg: 'bg-red-400/5' },
  medium: { dot: 'bg-amber-400', border: 'border-yellow-600/20', bg: 'bg-yellow-600/5' },
  low: { dot: 'bg-emerald-400', border: 'border-emerald-400/20', bg: 'bg-emerald-400/5' },
}

export const AIExecutiveSummary = memo(function AIExecutiveSummary() {
  const { data: actions, loading } = useExecutiveSummary()
  const navigate = useNavigate()

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C9A84C' }}>
          <BotMessageSquare className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Bugün Ne Yapmalıyım?</p>
          <p className="text-xs text-muted-foreground mt-0.5">AI önceliklendirmesi</p>
        </div>
      </div>

      <div className="flex-1 divide-y divide-border overflow-y-auto">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="w-4 h-4 rounded-full bg-muted/40 animate-pulse flex-shrink-0" />
              <div className="flex-1 h-3 rounded bg-muted/40 animate-pulse" />
            </div>
          ))
        ) : !actions?.length ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-xs text-muted-foreground">Öneri yükleniyor...</p>
          </div>
        ) : actions.map((action, i) => {
          const Icon = ICON_MAP[action.icon] ?? CheckCircle2
          const style = PRIORITY_STYLES[action.priority]
          return (
            <button key={i} onClick={() => navigate(action.link)}
              className={cn('w-full flex items-start gap-3 px-5 py-3 hover:bg-accent/40 transition-all duration-150 text-left group', style.bg)}>
              <div className="relative flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className={cn('absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full', style.dot)} />
              </div>
              <p className="text-xs text-foreground flex-1 leading-relaxed">{action.text}</p>
              <ArrowRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0 mt-0.5 transition-colors" />
            </button>
          )
        })}
      </div>

      <div className="px-5 py-2 border-t border-border flex-shrink-0">
        <p className="text-[10px] text-muted-foreground/40 text-center">Kural tabanlı · Claude AI entegrasyonu yakında</p>
      </div>
    </Card>
  )
})
