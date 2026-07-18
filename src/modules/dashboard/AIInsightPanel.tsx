import { Sparkles, AlertTriangle, Info, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui'
import type { Insight, InsightLevel } from '@/types/dashboard'
import { cn } from '@/utils/cn'

const LEVEL_CONFIG: Record<InsightLevel, {
  icon: React.ComponentType<{ className?: string }>
  bar: string
  icon_color: string
  text_color: string
}> = {
  info:    { icon: Info,          bar: 'bg-blue-500',   icon_color: 'text-blue-500',   text_color: 'text-foreground/80' },
  warning: { icon: AlertTriangle, bar: 'bg-orange-500', icon_color: 'text-orange-500', text_color: 'text-foreground/80' },
  success: { icon: CheckCircle,   bar: 'bg-green-500',  icon_color: 'text-green-500',  text_color: 'text-foreground/80' },
  error:   { icon: XCircle,       bar: 'bg-red-500',    icon_color: 'text-red-500',    text_color: 'text-foreground/80' },
}

interface AIInsightPanelProps {
  insights: Insight[]
}

export function AIInsightPanel({ insights }: AIInsightPanelProps) {
  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Akıllı Özet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Kural motoru</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground/50 font-medium">{insights.length} uyarı</span>
      </div>

      {/* Insights list */}
      <div className="flex-1 overflow-y-auto">
        {insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Sparkles className="w-7 h-7 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Analiz yapılıyor...</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {insights.map((insight, idx) => {
              const cfg = LEVEL_CONFIG[insight.level]
              const Icon = cfg.icon
              return (
                <div key={idx} className="flex items-start gap-3 px-5 py-3.5 group hover:bg-accent/30 transition-colors">
                  <div className={cn('w-0.5 self-stretch rounded-full flex-shrink-0', cfg.bar)} />
                  <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', cfg.icon_color)} />
                  <p className={cn('text-xs leading-relaxed flex-1', cfg.text_color)}>{insight.message}</p>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex-shrink-0">
        <p className="text-xs text-muted-foreground/40 text-center">OpenAI / Claude API entegrasyonu planlandı</p>
      </div>
    </Card>
  )
}
