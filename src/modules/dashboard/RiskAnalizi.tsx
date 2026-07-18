import { memo, useMemo } from 'react'
import { Shield, Droplets, CreditCard, Clock, LayoutGrid } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'
import { useAIBrief } from '@/hooks/useAIDashboard'
import type { DashboardData } from '@/types/dashboard'

interface RiskDim {
  label: string
  icon: React.ComponentType<{ className?: string }>
  score: number
  detail: string
}

function scoreColor(score: number): { bar: string; text: string } {
  if (score >= 75) return { bar: '#22c55e', text: 'text-green-500' }
  if (score >= 50) return { bar: '#C9A84C', text: 'text-yellow-600' }
  if (score >= 30) return { bar: '#f97316', text: 'text-orange-500' }
  return { bar: '#ef4444', text: 'text-red-500' }
}

interface Props { data: DashboardData }

export const RiskAnalizi = memo(function RiskAnalizi({ data }: Props) {
  const { data: brief } = useAIBrief()

  const dims: RiskDim[] = useMemo(() => {
    const { metrics } = data
    const liquidity = metrics.total_asset_value > 0
      ? Math.min((metrics.available_cash / metrics.total_asset_value) * 300, 100)
      : 50

    const waitingRisk = brief?.risks.find(r => r.includes('bekliyor'))
    const waitingCount = waitingRisk ? parseInt(waitingRisk) : 0
    const waitScore = Math.max(0, 100 - waitingCount * 20)

    const diversify = Math.min((metrics.total_assets / 10) * 100, 100)

    return [
      {
        label: 'Likidite',
        icon: Droplets,
        score: Math.round(liquidity),
        detail: `Nakit oran %${((metrics.available_cash / Math.max(metrics.total_asset_value, 1)) * 100).toFixed(1)}`,
      },
      {
        label: 'Borç',
        icon: CreditCard,
        score: 75,
        detail: 'Finans modülünden takip edin',
      },
      {
        label: 'Bekleme Süresi',
        icon: Clock,
        score: Math.round(waitScore),
        detail: waitingCount > 0 ? `${waitingCount} varlık uzun süreli` : 'Bekleme süresi normal',
      },
      {
        label: 'Portföy Yoğunluğu',
        icon: LayoutGrid,
        score: Math.round(diversify),
        detail: `${metrics.total_assets} varlık, çeşitlendirme`,
      },
    ]
  }, [data, brief])

  const overallScore = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length)
  const overall = scoreColor(overallScore)

  // Gauge arc
  const R = 36
  const cx = 50
  const cy = 50
  const arcStart = -Math.PI * 0.75
  const arcEnd = Math.PI * 0.75
  const totalArc = arcEnd - arcStart
  const fillArc = arcStart + totalArc * (overallScore / 100)
  const px = (a: number) => cx + R * Math.cos(a)
  const py = (a: number) => cy + R * Math.sin(a)
  const bgPath = `M ${px(arcStart)} ${py(arcStart)} A ${R} ${R} 0 1 1 ${px(arcEnd)} ${py(arcEnd)}`
  const fillPath = overallScore > 0
    ? `M ${px(arcStart)} ${py(arcStart)} A ${R} ${R} 0 ${fillArc - arcStart > Math.PI ? 1 : 0} 1 ${px(fillArc)} ${py(fillArc)}`
    : null

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C9A84C' }}>
          <Shield className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Risk Analizi</p>
          <p className="text-xs text-muted-foreground mt-0.5">0–100 risk skoru</p>
        </div>
      </div>

      {/* Gauge */}
      <div className="flex items-center justify-center py-4 border-b border-border flex-shrink-0">
        <div className="relative">
          <svg width="100" height="70" viewBox="0 0 100 70">
            <path d={bgPath} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" className="text-muted/30" />
            {fillPath && <path d={fillPath} fill="none" stroke={overall.bar} strokeWidth="7" strokeLinecap="round" />}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <p className="text-xl font-bold text-foreground tabular-nums leading-none">{overallScore}</p>
            <p className={cn('text-[10px] font-semibold', overall.text)}>
              {overallScore >= 75 ? 'Düşük Risk' : overallScore >= 50 ? 'Orta Risk' : overallScore >= 30 ? 'Yüksek Risk' : 'Kritik'}
            </p>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="flex-1 divide-y divide-border">
        {dims.map(dim => {
          const Icon = dim.icon
          const { bar, text } = scoreColor(dim.score)
          return (
            <div key={dim.label} className="flex items-center gap-3 px-5 py-2.5">
              <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', text)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-foreground">{dim.label}</p>
                  <span className={cn('text-xs font-bold tabular-nums', text)}>{dim.score}</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${dim.score}%`, backgroundColor: bar }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{dim.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
})
