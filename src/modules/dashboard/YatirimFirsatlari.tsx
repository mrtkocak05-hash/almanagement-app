import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react'
import { useValuationDashboard } from '@/hooks/useVehicleValuation'
import { formatCurrency } from '@/utils/format'

function ScoreRing({ value, color, size = 36 }: { value: number; color: string; size?: number }) {
  const r    = size * 0.38
  const cx   = size / 2
  const circ = 2 * Math.PI * r
  const off  = circ - (value / 100) * circ
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor"
        strokeWidth={size * 0.12} className="text-muted/40" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color}
        strokeWidth={size * 0.12}
        strokeDasharray={`${circ} ${circ}`} strokeDashoffset={off}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset .5s ease' }} />
      <text x={cx} y={cx + 4} textAnchor="middle" fill={color}
        fontSize={size * 0.28} fontWeight="700">{value}</text>
    </svg>
  )
}

export function YatirimFirsatlari() {
  const { data, loading } = useValuationDashboard()

  const stats = data?.stats
  const opportunities = data?.opportunities ?? []
  const cheapest      = data?.cheapest ?? []

  const avgScore = stats?.avg_score ? Math.round(stats.avg_score) : null
  const avgRoi   = stats?.avg_roi   ? Math.round(stats.avg_roi)   : null

  const scoreColor =
    avgScore == null   ? '#6366f1'
    : avgScore >= 70   ? '#10B981'
    : avgScore >= 45   ? '#F59E0B'
    : '#EF4444'

  return (
    <div className="rounded-2xl border border-border bg-card p-4 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Yatırım Fırsatları</h3>
        </div>
        {!loading && avgScore != null && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${scoreColor}18`, color: scoreColor }}>
            Ort. {avgScore}/100
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 flex-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : opportunities.length === 0 && cheapest.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-4">
          <Zap className="w-6 h-6 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">
            Henüz değerleme yapılmamış araç bulunmuyor.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 flex-1">
          {/* Summary row */}
          {stats && (
            <div className="flex gap-2 mb-2">
              <div className="flex-1 px-2 py-1.5 rounded-lg bg-muted/40 text-center">
                <p className="text-[9px] text-muted-foreground">Değerlenen</p>
                <p className="text-sm font-bold text-foreground">{stats.total}</p>
              </div>
              {avgRoi != null && (
                <div className="flex-1 px-2 py-1.5 rounded-lg bg-muted/40 text-center">
                  <p className="text-[9px] text-muted-foreground">Ort. ROI</p>
                  <p className="text-sm font-bold text-emerald-500">%{avgRoi}</p>
                </div>
              )}
              {stats.avg_liquidity != null && (
                <div className="flex-1 px-2 py-1.5 rounded-lg bg-muted/40 text-center">
                  <p className="text-[9px] text-muted-foreground">Ort. Likidite</p>
                  <p className="text-sm font-bold text-indigo-500">{Math.round(stats.avg_liquidity)}</p>
                </div>
              )}
            </div>
          )}

          {/* Top opportunities */}
          {opportunities.slice(0, 3).map(opp => {
            const pct   = opp.price_vs_market
            const isGood = pct != null && pct < -0.03
            const color = (opp.investment_score ?? 0) >= 70 ? '#10B981'
              : (opp.investment_score ?? 0) >= 45 ? '#F59E0B' : '#EF4444'
            return (
              <div key={opp.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                <ScoreRing value={Math.round(opp.investment_score ?? 0)} color={color} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {opp.name ?? `${opp.brand} ${opp.model}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {opp.our_price ? formatCurrency(opp.our_price) : '—'}
                    {pct != null && (
                      <span className={`ml-1.5 font-semibold ${isGood ? 'text-emerald-500' : 'text-red-400'}`}>
                        {isGood ? <TrendingDown className="inline w-2.5 h-2.5" /> : <TrendingUp className="inline w-2.5 h-2.5" />}
                        {' '}{Math.abs(pct * 100).toFixed(1)}%
                      </span>
                    )}
                  </p>
                </div>
                {opp.roi_1y != null && (
                  <span className="text-xs font-bold text-emerald-500 flex-shrink-0">
                    %{Math.round(opp.roi_1y)}
                  </span>
                )}
              </div>
            )
          })}

          {/* Cheapest vs market */}
          {cheapest.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground mt-2 px-1">
                Piyasanın Altında
              </p>
              {cheapest.slice(0, 2).map(opp => {
                const pct = opp.price_vs_market ?? 0
                return (
                  <div key={opp.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <p className="text-xs text-foreground flex-1 truncate">
                      {opp.name ?? `${opp.brand ?? ''} ${opp.model ?? ''}`.trim()}
                    </p>
                    <span className="text-xs font-bold text-emerald-500">
                      %{Math.abs(pct * 100).toFixed(1)} ↓
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
