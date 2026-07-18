import { memo } from 'react'
import {
  Trophy, Droplets, TrendingUp, Shield, FileText,
  Car, PieChart, Clock,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'
import { useExecutiveScore } from '@/hooks/useAIDashboard'

const DIM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  likidite:   Droplets,
  karlilik:   TrendingUp,
  risk:       Shield,
  belge:      FileText,
  sigorta:    Car,
  cesitlilik: PieChart,
  bekleme:    Clock,
}

function scoreColor(s: number): string {
  if (s >= 75) return '#22c55e'
  if (s >= 55) return '#C9A84C'
  if (s >= 35) return '#f97316'
  return '#ef4444'
}

function scoreLabel(s: number): string {
  if (s >= 80) return 'Mükemmel'
  if (s >= 65) return 'İyi'
  if (s >= 50) return 'Orta'
  if (s >= 35) return 'Zayıf'
  return 'Kritik'
}

// Gauge arc
function Gauge({ score }: { score: number }) {
  const R = 38, cx = 50, cy = 52
  const arcStart = -Math.PI * 0.8
  const arcEnd = Math.PI * 0.8
  const total = arcEnd - arcStart
  const fill = arcStart + total * (score / 100)
  const px = (a: number) => cx + R * Math.cos(a)
  const py = (a: number) => cy + R * Math.sin(a)
  const large = fill - arcStart > Math.PI ? 1 : 0
  const bgPath = `M ${px(arcStart)} ${py(arcStart)} A ${R} ${R} 0 1 1 ${px(arcEnd)} ${py(arcEnd)}`
  const fillPath = score > 0
    ? `M ${px(arcStart)} ${py(arcStart)} A ${R} ${R} 0 ${large} 1 ${px(fill)} ${py(fill)}`
    : null
  const color = scoreColor(score)

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="76" viewBox="0 0 100 76">
        <path d={bgPath} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-muted/30" />
        {fillPath && (
          <path d={fillPath} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <p className="text-2xl font-black text-foreground tabular-nums leading-none">{score}</p>
        <p className="text-[10px] font-semibold mt-0.5" style={{ color }}>{scoreLabel(score)}</p>
      </div>
    </div>
  )
}

export const ExecutiveScore = memo(function ExecutiveScore() {
  const { data, loading } = useExecutiveScore()

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C9A84C' }}>
          <Trophy className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">Executive Score</p>
          <p className="text-xs text-muted-foreground mt-0.5">0-100 yönetim skoru</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 p-5 space-y-3">
          <div className="flex justify-center py-4">
            <div className="w-24 h-16 rounded-xl bg-muted/20 animate-pulse" />
          </div>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-muted/30 animate-pulse flex-shrink-0" />
              <div className="flex-1 h-1.5 rounded-full bg-muted/20 animate-pulse" />
              <div className="w-6 h-3 rounded bg-muted/30 animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-xs text-muted-foreground">Veri yükleniyor...</p>
        </div>
      ) : (
        <div className="flex-1 p-4 space-y-1 min-h-0 overflow-y-auto">
          <Gauge score={data.overall} />

          <div className="space-y-2 mt-1">
            {data.dimensions.map(dim => {
              const Icon = DIM_ICONS[dim.key] ?? Shield
              const color = scoreColor(dim.score)
              return (
                <div key={dim.key} className="group">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="flex-shrink-0" style={{ color }}><Icon className="w-3 h-3" /></span>
                    <span className="text-[10px] font-medium text-foreground flex-1 truncate">{dim.label}</span>
                    <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{dim.score}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted/40 overflow-hidden ml-5">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${dim.score}%`, backgroundColor: color }}
                    />
                  </div>
                  <p className={cn('text-[9px] text-muted-foreground mt-0.5 ml-5 truncate opacity-0 group-hover:opacity-100 transition-opacity')}>
                    {dim.detail}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
})
