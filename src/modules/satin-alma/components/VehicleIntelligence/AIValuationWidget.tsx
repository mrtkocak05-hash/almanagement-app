import { useEffect, useRef } from 'react'
import { Zap, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react'
import { useQuickValuation } from '@/hooks/useVehicleValuation'
import { formatCurrency } from '@/utils/format'

interface Props {
  price: number
  category: string
  brand?: string | null
  model?: string | null
  year?: number | null
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-bold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

const VEHICLE_TYPES = ['vehicle', 'motorcycle', 'caravan', 'construction_equipment']

export function AIValuationWidget({ price, category, brand, model, year }: Props) {
  const { data, loading, compute } = useQuickValuation()
  const prevPrice = useRef<number>(0)

  // Debounced auto-compute when price changes significantly
  useEffect(() => {
    if (!price || price <= 0) return
    if (!VEHICLE_TYPES.includes(category)) return
    if (Math.abs(price - prevPrice.current) < price * 0.03) return // <3% change — skip
    prevPrice.current = price

    const timer = setTimeout(() => {
      compute({
        category,
        brand:      brand ?? undefined,
        model:      model ?? undefined,
        year:       year ?? undefined,
        price,
        vehicleAge: year ? new Date().getFullYear() - year : undefined,
      })
    }, 800)

    return () => clearTimeout(timer)
  }, [price, category, brand, model, year]) // eslint-disable-line

  if (!VEHICLE_TYPES.includes(category)) return null
  if (!price || price <= 0) return null

  const pct       = data?.price_vs_market
  const pctStr    = pct != null ? `${Math.abs(pct * 100).toFixed(1)}%` : null
  const isBelow   = pct != null && pct < -0.03
  const isAbove   = pct != null && pct > 0.05
  const borderCol = isBelow ? 'border-emerald-500/30 bg-emerald-500/5' : isAbove ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-muted/20'

  return (
    <div className={`rounded-xl border p-3 transition-all duration-300 ${borderCol}`}>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="text-xs font-semibold text-foreground">AI Değerleme</span>
        {loading && <span className="text-[10px] text-muted-foreground ml-auto">Analiz ediliyor...</span>}
        {!loading && data && pct != null && (
          <span className="ml-auto flex items-center gap-1">
            {isBelow ? (
              <><TrendingDown className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-emerald-500 font-semibold">%{pctStr} altında</span></>
            ) : isAbove ? (
              <><TrendingUp className="w-3 h-3 text-red-500" /><span className="text-[10px] text-red-500 font-semibold">%{pctStr} üzerinde</span></>
            ) : (
              <span className="text-[10px] text-amber-500 font-semibold">Piyasa ortalamasında</span>
            )}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-8 flex-1 rounded-lg bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && data && (
        <div className="space-y-2">
          {/* Negotiation advice */}
          {data.negotiation_advice && (
            <p className="text-[11px] text-foreground leading-relaxed">{data.negotiation_advice}</p>
          )}

          {/* Metric bars */}
          <div className="space-y-1.5">
            <ScoreBar label="Yatırım Skoru" value={Math.round(data.investment_score ?? 0)}
              color={data.investment_score! >= 70 ? '#10B981' : data.investment_score! >= 45 ? '#F59E0B' : '#EF4444'} />
            <ScoreBar label="Likidite" value={Math.round(data.liquidity_score ?? 0)} color="#6366f1" />
          </div>

          {/* Market avg + target */}
          <div className="flex gap-2 mt-1">
            {data.market_avg ? (
              <div className="flex-1 px-2 py-1.5 rounded-lg bg-background/60 border border-border text-center">
                <p className="text-[9px] text-muted-foreground">Piyasa Ort.</p>
                <p className="text-xs font-bold text-foreground">{formatCurrency(data.market_avg)}</p>
              </div>
            ) : null}
            {data.negotiation_price ? (
              <div className="flex-1 px-2 py-1.5 rounded-lg bg-background/60 border border-border text-center">
                <p className="text-[9px] text-muted-foreground">Pazarlık Hedefi</p>
                <p className="text-xs font-bold text-primary">{formatCurrency(data.negotiation_price)}</p>
              </div>
            ) : null}
            {data.market_count > 0 && (
              <div className="flex-1 px-2 py-1.5 rounded-lg bg-background/60 border border-border text-center">
                <p className="text-[9px] text-muted-foreground">İlan Sayısı</p>
                <p className="text-xs font-bold text-foreground">{data.market_count}</p>
              </div>
            )}
          </div>

          {data.market_count === 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-600">
              <AlertCircle className="w-3 h-3" />
              Bu araç için piyasa araştırması bulunamadı; değerler tahminidir.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
