import { ShieldCheck, Droplets, TrendingUp, AlertOctagon, Clock } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'
import type { DashboardData } from '@/types/dashboard'

interface ScoreDimension {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  score: number
  detail: string
}

function computeScores(data: DashboardData): ScoreDimension[] {
  const { metrics, recent_activities } = data

  // Likidite — nakit / toplam varlık değeri
  const liquidityRaw = metrics.total_asset_value > 0
    ? Math.min((metrics.available_cash / metrics.total_asset_value) * 250, 100)
    : 50
  const liquidityScore = Math.round(liquidityRaw)

  // Karlılık — satış aktivitelerindeki gider/gelir oranı
  const sales = recent_activities.filter(a => a.type === 'sale').reduce((s, a) => s + (a.amount ?? 0), 0)
  const expenses = recent_activities.filter(a => a.type === 'expense').reduce((s, a) => s + (a.amount ?? 0), 0)
  let profitScore = 60
  if (sales > 0 || expenses > 0) {
    const ratio = sales / Math.max(expenses, 1)
    profitScore = Math.min(Math.round(ratio * 50), 100)
  }

  // Risk — varlık çeşitlilik skoru (ne kadar çok varlık, o kadar düşük risk)
  const diversityScore = Math.min(Math.round((metrics.total_assets / 15) * 100), 100)

  // Bekleme Süresi — aktif yatırım oranı (düşük oran = iyi, varlık çabuk dönüyor)
  const activeRatio = metrics.total_assets > 0 ? metrics.active_investments / metrics.total_assets : 0.5
  const waitScore = Math.round((1 - activeRatio) * 100)

  return [
    {
      key: 'likidite',
      label: 'Likidite',
      icon: Droplets,
      score: liquidityScore,
      detail: `Nakit oran: %${((metrics.available_cash / Math.max(metrics.total_asset_value, 1)) * 100).toFixed(1)}`,
    },
    {
      key: 'karlilik',
      label: 'Karlılık',
      icon: TrendingUp,
      score: profitScore,
      detail: `Gelir/gider oranı son dönem`,
    },
    {
      key: 'risk',
      label: 'Risk Dağılımı',
      icon: AlertOctagon,
      score: diversityScore,
      detail: `${metrics.total_assets} varlık, çeşitlendirme`,
    },
    {
      key: 'bekleme',
      label: 'Bekleme Süresi',
      icon: Clock,
      score: waitScore,
      detail: `Aktif oran: %${(activeRatio * 100).toFixed(0)}`,
    },
  ]
}

function scoreColor(score: number) {
  if (score >= 75) return { bar: '#22c55e', text: 'text-green-500' }
  if (score >= 50) return { bar: '#C9A84C', text: 'text-yellow-600' }
  if (score >= 25) return { bar: '#f97316', text: 'text-orange-500' }
  return { bar: '#ef4444', text: 'text-red-500' }
}

function overallGrade(score: number) {
  if (score >= 80) return { label: 'Mükemmel', color: 'text-green-500' }
  if (score >= 65) return { label: 'İyi', color: 'text-yellow-600' }
  if (score >= 45) return { label: 'Orta', color: 'text-orange-500' }
  return { label: 'Zayıf', color: 'text-red-500' }
}

interface DimensionRowProps { dim: ScoreDimension }

function DimensionRow({ dim }: DimensionRowProps) {
  const Icon = dim.icon
  const { bar, text } = scoreColor(dim.score)
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Icon className={cn('w-4 h-4 flex-shrink-0', text)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-foreground">{dim.label}</p>
          <span className={cn('text-xs font-bold tabular-nums', text)}>{dim.score}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${dim.score}%`, backgroundColor: bar }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{dim.detail}</p>
      </div>
    </div>
  )
}

interface PortfoySkoruProps { data: DashboardData }

export function PortfoySkoru({ data }: PortfoySkoruProps) {
  const dimensions = computeScores(data)
  const overallScore = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length)
  const { bar } = scoreColor(overallScore)
  const grade = overallGrade(overallScore)

  // Gauge arc parameters
  const R = 40
  const cx = 56
  const cy = 56
  const startAngle = -Math.PI * 0.75
  const endAngle = Math.PI * 0.75
  const totalArc = endAngle - startAngle
  const fillArc = startAngle + totalArc * (overallScore / 100)

  const polarX = (a: number) => cx + R * Math.cos(a)
  const polarY = (a: number) => cy + R * Math.sin(a)

  const bgPath = `M ${polarX(startAngle)} ${polarY(startAngle)} A ${R} ${R} 0 1 1 ${polarX(endAngle)} ${polarY(endAngle)}`
  const fillPath = `M ${polarX(startAngle)} ${polarY(startAngle)} A ${R} ${R} 0 ${fillArc - startAngle > Math.PI ? 1 : 0} 1 ${polarX(fillArc)} ${polarY(fillArc)}`

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C9A84C' }}>
          <ShieldCheck className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Portföy Sağlık Skoru</p>
          <p className="text-xs text-muted-foreground mt-0.5">0–100 kural tabanlı analiz</p>
        </div>
      </div>

      {/* Gauge + score */}
      <div className="flex items-center justify-center py-4 border-b border-border flex-shrink-0">
        <div className="relative">
          <svg width="112" height="80" viewBox="0 0 112 80">
            {/* Background arc */}
            <path d={bgPath} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-muted/40" />
            {/* Fill arc */}
            {overallScore > 0 && (
              <path d={fillPath} fill="none" stroke={bar} strokeWidth="8" strokeLinecap="round" />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-5">
            <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{overallScore}</p>
            <p className={cn('text-[10px] font-semibold mt-0.5', grade.color)}>{grade.label}</p>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="flex-1 divide-y divide-border overflow-y-auto">
        {dimensions.map(dim => (
          <DimensionRow key={dim.key} dim={dim} />
        ))}
      </div>
    </Card>
  )
}
