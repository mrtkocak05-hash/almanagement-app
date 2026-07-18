import { Eye, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Zap } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'
import { analyzePortfolio } from '@/services/investorAnalysisService'
import type { DashboardData } from '@/types/dashboard'
import type { InvestorInsight } from '@/services/investorAnalysisService'

const INSIGHT_ICONS = {
  opportunity: TrendingUp,
  risk: AlertTriangle,
  neutral: Eye,
  action: ArrowRight,
}

const INSIGHT_COLORS = {
  opportunity: { icon: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  risk: { icon: 'text-red-500', bg: 'bg-red-500/10' },
  neutral: { icon: 'text-blue-400', bg: 'bg-blue-400/10' },
  action: { icon: 'text-yellow-600', bg: 'bg-yellow-600/10' },
}

const RATING_STYLE = {
  strong: { label: 'Güçlü', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  moderate: { label: 'Dengeli', color: 'text-yellow-600', bg: 'bg-yellow-600/10', border: 'border-yellow-600/20' },
  caution: { label: 'Dikkatli', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  alert: { label: 'Alarm', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
}

interface InsightRowProps { insight: InvestorInsight }

function InsightRow({ insight }: InsightRowProps) {
  const Icon = INSIGHT_ICONS[insight.type]
  const colors = INSIGHT_COLORS[insight.type]
  return (
    <div className="flex items-start gap-3 px-5 py-3 hover:bg-accent/30 transition-colors duration-150">
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', colors.bg)}>
        <Icon className={cn('w-3.5 h-3.5', colors.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{insight.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.detail}</p>
      </div>
    </div>
  )
}

interface YatirimciGozuProps { data: DashboardData }

export function YatirimciGozu({ data }: YatirimciGozuProps) {
  const analysis = analyzePortfolio(data)
  const rating = RATING_STYLE[analysis.rating]

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1C1914' }}>
            <Eye className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Yatırımcı Gözü</p>
            <p className="text-xs text-muted-foreground mt-0.5">Portföy analitiği</p>
          </div>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full border', rating.color, rating.bg, rating.border)}>
          {rating.label}
        </span>
      </div>

      {/* Summary */}
      <div className="px-5 py-3 border-b border-border flex-shrink-0 flex items-start gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/80 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Insights */}
      <div className="flex-1 divide-y divide-border overflow-y-auto">
        {analysis.insights.slice(0, 4).map((insight, i) => (
          <InsightRow key={i} insight={insight} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-border flex-shrink-0 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground/40">Kural tabanlı analiz</p>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-yellow-600/60" />
          <p className="text-[10px] text-muted-foreground/40">Claude AI entegrasyonu · Yakında</p>
        </div>
      </div>
    </Card>
  )
}
