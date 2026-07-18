import { useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, Gauge, Zap,
  BarChart3, RefreshCw, ChevronRight, AlertCircle
} from 'lucide-react'
import type { VehicleValuation } from '@/types/vehicleValuation'
import { formatCurrency } from '@/utils/format'

// ── SVG Primitives ────────────────────────────────────────────────────────────

function RingGauge({ value, max = 100, color, label, size = 80 }: {
  value: number | null; max?: number; color: string; label: string; size?: number
}) {
  const v    = Math.max(0, Math.min(max, value ?? 0))
  const r    = size * 0.38
  const cx   = size / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (v / max) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth={size * 0.10}
          className="text-muted/40" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={size * 0.10}
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: 'stroke-dashoffset .6s ease' }} />
        <text x={cx} y={cx + 4} textAnchor="middle"
          fill={color} fontSize={size * 0.22} fontWeight="700">
          {v}
        </text>
      </svg>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  )
}

function PriceMeter({ ourPrice, marketMin, marketMax, marketAvg }: {
  ourPrice: number; marketMin: number; marketMax: number; marketAvg: number
}) {
  const range  = marketMax - marketMin || 1
  const ourPct = Math.max(0, Math.min(100, ((ourPrice - marketMin) / range) * 100))
  const avgPct = Math.max(0, Math.min(100, ((marketAvg - marketMin) / range) * 100))
  const W = 260, H = 42, BAR_Y = 20, BAR_H = 10

  const ourColor = ourPct < avgPct ? '#10B981' : ourPct > avgPct + 10 ? '#EF4444' : '#F59E0B'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
      {/* Track */}
      <rect x={0} y={BAR_Y} width={W} height={BAR_H} rx={5} fill="#1e293b" />
      {/* Gradient fill to avg */}
      <rect x={0} y={BAR_Y} width={(avgPct / 100) * W} height={BAR_H} rx={5} fill="#334155" />
      {/* Market avg marker */}
      <line x1={(avgPct / 100) * W} y1={BAR_Y - 4} x2={(avgPct / 100) * W} y2={BAR_Y + BAR_H + 4}
        stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="2,2" />
      <text x={(avgPct / 100) * W} y={BAR_Y - 6} textAnchor="middle"
        fill="#64748b" fontSize={8}>Ort.</text>
      {/* Our price needle */}
      <rect x={(ourPct / 100) * W - 2} y={BAR_Y - 4} width={4} height={BAR_H + 8} rx={2}
        fill={ourColor} />
      {/* Min / Max labels */}
      <text x={0} y={H} fill="#475569" fontSize={8}>{formatCurrency(marketMin)}</text>
      <text x={W} y={H} textAnchor="end" fill="#475569" fontSize={8}>{formatCurrency(marketMax)}</text>
    </svg>
  )
}

function Sparkline({ values, labels, color }: {
  values: number[]; labels: string[]; color: string
}) {
  const H  = 60
  const W  = 200
  const pad = 20
  const min = Math.min(...values) * 0.95
  const max = Math.max(...values) * 1.05
  const range = max - min || 1

  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }))

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${d} L${pts[pts.length - 1].x},${H - pad} L${pts[0].x},${H - pad} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="overflow-visible">
      <path d={area} fill={color} fillOpacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill={color} />
          <text x={p.x} y={p.y - 6} textAnchor="middle" fill={color} fontSize={7} fontWeight="600">
            {formatCurrency(values[i])}
          </text>
          <text x={p.x} y={H - 4} textAnchor="middle" fill="#64748b" fontSize={7}>
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  )
}

function PriceDistBar({ min, max, avg, median, ourPrice }: {
  min: number; max: number; avg: number; median: number; ourPrice: number
}) {
  const all   = [min, max, avg, median, ourPrice]
  const lo    = Math.min(...all) * 0.96
  const hi    = Math.max(...all) * 1.04
  const range = hi - lo || 1
  const W     = 240

  function xOf(v: number) { return Math.round(((v - lo) / range) * W) }

  const bars = [
    { val: min,      label: 'Min',    color: '#10B981' },
    { val: median,   label: 'Medyan', color: '#6366f1' },
    { val: avg,      label: 'Ort.',   color: '#F59E0B' },
    { val: max,      label: 'Max',    color: '#EF4444' },
    { val: ourPrice, label: 'Bizim',  color: '#0ea5e9' },
  ]

  return (
    <svg viewBox={`0 0 ${W} 80`} width="100%" className="overflow-visible">
      {/* track */}
      <rect x={xOf(min)} y={24} width={xOf(max) - xOf(min)} height={6} rx={3} fill="#334155" />
      {bars.map(({ val, label, color }, i) => (
        <g key={i}>
          <line x1={xOf(val)} y1={18} x2={xOf(val)} y2={36} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          <text x={xOf(val)} y={label === 'Bizim' ? 50 : i % 2 === 0 ? 46 : 56}
            textAnchor="middle" fill={color} fontSize={7} fontWeight="600">
            {label}
          </text>
          <text x={xOf(val)} y={label === 'Bizim' ? 58 : i % 2 === 0 ? 54 : 64}
            textAnchor="middle" fill={color} fontSize={6}>
            {formatCurrency(val)}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── Pill ──────────────────────────────────────────────────────────────────────

function ScorePill({ v, label }: { v: number | null; label: string }) {
  const val   = v ?? 0
  const color = val >= 70 ? '#10B981' : val >= 45 ? '#F59E0B' : '#EF4444'
  const bg    = val >= 70 ? 'bg-emerald-500/10' : val >= 45 ? 'bg-amber-500/10' : 'bg-red-500/10'
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl ${bg}`}>
      <span className="text-lg font-bold" style={{ color }}>{val}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'ozet',   label: 'Özet',        icon: DollarSign },
  { id: 'piyasa', label: 'Piyasa',      icon: BarChart3 },
  { id: 'gelecek',label: 'Gelecek Değer', icon: TrendingUp },
  { id: 'roi',    label: 'ROI & Risk',  icon: Gauge },
  { id: 'ai',     label: 'AI Analizi',  icon: Zap },
]

// ── Panel ─────────────────────────────────────────────────────────────────────

interface Props {
  data: VehicleValuation | null
  loading: boolean
  computing: boolean
  error: string | null
  onCompute: () => void
}

export function AIValuationPanel({ data, loading, computing, error, onCompute }: Props) {
  const [activeTab, setActiveTab] = useState('ozet')

  if (loading) return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      Yükleniyor...
    </div>
  )

  const hasData = data && data.investment_score != null

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Değerleme Motoru</span>
          {data?.updated_at && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(data.updated_at).toLocaleDateString('tr-TR')}
            </span>
          )}
        </div>
        <button
          onClick={onCompute}
          disabled={computing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <RefreshCw className={`w-3 h-3 ${computing ? 'animate-spin' : ''}`} />
          {computing ? 'Hesaplanıyor...' : 'Değerlemeyi Güncelle'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {!hasData ? (
        <div className="p-8 text-center">
          <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground mb-4">
            Henüz değerleme yapılmadı. Yapay zeka değerleme motorunu çalıştırın.
          </p>
          <button
            onClick={onCompute}
            disabled={computing}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {computing ? 'Hesaplanıyor...' : 'Değerlemeyi Başlat'}
          </button>
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-border">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium flex-shrink-0 border-b-2 transition-colors ${
                    active
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-4">
            {/* ── Özet ── */}
            {activeTab === 'ozet' && (
              <div className="space-y-4">
                {/* Score pills */}
                <div className="flex gap-3 justify-center">
                  <RingGauge
                    value={data.investment_score}
                    color={data.investment_score! >= 70 ? '#10B981' : data.investment_score! >= 45 ? '#F59E0B' : '#EF4444'}
                    label="Yatırım Skoru"
                    size={90}
                  />
                  <RingGauge
                    value={data.liquidity_score}
                    color="#6366f1"
                    label="Likidite"
                    size={90}
                  />
                  <RingGauge
                    value={data.risk_score}
                    max={100}
                    color={data.risk_score! <= 30 ? '#10B981' : data.risk_score! <= 60 ? '#F59E0B' : '#EF4444'}
                    label="Risk"
                    size={90}
                  />
                </div>

                {/* Price vs market */}
                {data.our_price && data.market_avg ? (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border">
                    <p className="text-xs font-semibold text-foreground mb-2">Piyasa Konumu</p>
                    <PriceMeter
                      ourPrice={data.our_price}
                      marketMin={data.market_min ?? data.market_avg * 0.8}
                      marketMax={data.market_max ?? data.market_avg * 1.2}
                      marketAvg={data.market_avg}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      {(data.price_vs_market ?? 0) < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className="text-xs text-foreground">{data.negotiation_advice}</span>
                    </div>
                  </div>
                ) : null}

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <ScorePill v={data.investment_score} label="Yatırım" />
                  <ScorePill v={data.liquidity_score} label="Likidite" />
                  <ScorePill v={Math.round(data.roi_1y ?? 0)} label="ROI 1Y %" />
                </div>
              </div>
            )}

            {/* ── Piyasa ── */}
            {activeTab === 'piyasa' && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-foreground">
                  Piyasa Dağılımı ({data.market_count} ilan)
                </p>
                {data.market_min && data.market_max && data.market_avg && data.market_median && data.our_price ? (
                  <PriceDistBar
                    min={data.market_min}
                    max={data.market_max}
                    avg={data.market_avg}
                    median={data.market_median}
                    ourPrice={data.our_price}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">Yeterli piyasa verisi bulunamadı.</p>
                )}

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { label: 'Piyasa Min',   val: data.market_min },
                    { label: 'Piyasa Maks',  val: data.market_max },
                    { label: 'Piyasa Ort.',  val: data.market_avg },
                    { label: 'Medyan',       val: data.market_median },
                    { label: 'Bizim Fiyat',  val: data.our_price },
                    { label: 'Pazar. Hedef', val: data.negotiation_price },
                  ].map(({ label, val }) => (
                    <div key={label} className="px-3 py-2 rounded-lg bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground">
                        {val != null ? formatCurrency(val) : '—'}
                      </p>
                    </div>
                  ))}
                </div>

                {data.negotiation_advice && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> Pazarlık Önerisi
                    </p>
                    <p className="text-xs text-foreground">{data.negotiation_advice}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Gelecek Değer ── */}
            {activeTab === 'gelecek' && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-foreground">Tahmini Değer Projeksiyonu</p>
                {data.value_6m && data.value_12m && data.value_24m && data.our_price ? (
                  <Sparkline
                    values={[data.our_price, data.value_6m, data.value_12m, data.value_24m]}
                    labels={['Bugün', '6 Ay', '12 Ay', '24 Ay']}
                    color="#6366f1"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">Projeksiyon verisi bulunamadı.</p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '6 Ay',  val: data.value_6m },
                    { label: '12 Ay', val: data.value_12m },
                    { label: '24 Ay', val: data.value_24m },
                  ].map(({ label, val }) => {
                    const diff  = val && data.our_price ? val - data.our_price : null
                    const pct   = diff && data.our_price ? (diff / data.our_price) * 100 : null
                    const color = diff == null ? '' : diff >= 0 ? 'text-emerald-500' : 'text-red-400'
                    return (
                      <div key={label} className="px-3 py-2 rounded-lg bg-muted/40 border border-border text-center">
                        <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                        <p className="text-sm font-bold text-foreground">
                          {val != null ? formatCurrency(val) : '—'}
                        </p>
                        {pct != null && (
                          <p className={`text-[10px] font-semibold ${color}`}>
                            {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── ROI & Risk ── */}
            {activeTab === 'roi' && (
              <div className="space-y-4">
                <div className="flex gap-6 justify-center">
                  <RingGauge
                    value={Math.max(0, data.roi_1y ?? 0)}
                    max={50}
                    color="#10B981"
                    label="Yıllık ROI %"
                    size={96}
                  />
                  <RingGauge
                    value={data.risk_score}
                    max={100}
                    color={data.risk_score! <= 30 ? '#10B981' : data.risk_score! <= 60 ? '#F59E0B' : '#EF4444'}
                    label="Risk Skoru"
                    size={96}
                  />
                  <RingGauge
                    value={data.liquidity_score}
                    max={100}
                    color="#6366f1"
                    label="Likidite"
                    size={96}
                  />
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Yatırım Skoru',   val: data.investment_score,  max: 100, color: '#F59E0B' },
                    { label: 'Likidite Skoru',  val: data.liquidity_score,   max: 100, color: '#6366f1' },
                    { label: 'Risk Skoru',      val: data.risk_score,        max: 100, color: '#EF4444' },
                    { label: 'Tahmini ROI/Yıl', val: Math.max(0, data.roi_1y ?? 0), max: 50, color: '#10B981' },
                  ].map(({ label, val, max, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(((val ?? 0) / max) * 100)}%`, background: color }}
                        />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color }}>
                        {val != null ? Math.round(val) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── AI Analizi ── */}
            {activeTab === 'ai' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> AI Değerleme Özeti
                  </p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {data.ai_recommendation ?? 'Analiz bulunamadı.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Piyasa Fiyatı',  val: data.market_price,      fmt: true },
                    { label: 'Hedef Pazar.',    val: data.negotiation_price, fmt: true },
                    { label: 'Piyasa vs Biz',   val: data.price_vs_market != null
                      ? `${(data.price_vs_market * 100).toFixed(1)}%`
                      : null,                                                 fmt: false },
                    { label: 'İlan Sayısı',     val: data.market_count,      fmt: false },
                  ].map(({ label, val, fmt }) => (
                    <div key={label} className="px-3 py-2 rounded-lg bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground">
                        {val == null ? '—' : fmt ? formatCurrency(val as number) : String(val)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
