import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { getScoreLabel } from '@/types/sales'
import type { SaleDetail } from '@/types/sales'

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color ?? 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 85 ? '#22c55e' : score >= 70 ? '#10b981' : score >= 55 ? '#3b82f6' : score >= 40 ? '#eab308' : '#ef4444'
  const r = 52
  const half = Math.PI * r

  return (
    <div className="flex flex-col items-center p-6 border border-border rounded-xl bg-card">
      <svg width="130" height="80" viewBox="0 0 130 80">
        <path d={`M15,70 A52,52 0 0,1 115,70`} fill="none" stroke="currentColor" strokeWidth="10" className="text-border" strokeLinecap="round" />
        <path
          d={`M15,70 A52,52 0 0,1 115,70`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * half} ${half}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="65" y="68" textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>{score}</text>
      </svg>
      <p className="text-sm font-bold mt-2" style={{ color }}>{getScoreLabel(score)}</p>
      <p className="text-xs text-muted-foreground mt-1">Yatırım Skoru</p>
    </div>
  )
}

export function SaleDetailAnalysis({ sale }: { sale: SaleDetail }) {
  const netProfit = sale.net_profit_try ?? 0
  const profitColor = netProfit >= 0 ? 'text-green-500' : 'text-red-500'
  const roiColor = (sale.roi_percent ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'

  const fmtNum = (v: number | null, suffix = '') =>
    v === null ? '—' : `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v)}${suffix}`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {sale.investment_score != null && (
          <div className="col-span-2">
            <ScoreGauge score={sale.investment_score} />
          </div>
        )}

        <MetricCard
          label="Net Kâr / Zarar"
          value={formatCurrency(Math.abs(netProfit))}
          sub={netProfit < 0 ? 'Zarar' : 'Kâr'}
          color={profitColor}
        />
        <MetricCard
          label="Hisseme Düşen"
          value={sale.share_profit_try != null ? formatCurrency(sale.share_profit_try) : '—'}
          sub={`%${sale.share_percent} hisse`}
          color={profitColor}
        />
        <MetricCard
          label="ROI"
          value={sale.roi_percent != null ? `%${sale.roi_percent}` : '—'}
          color={roiColor}
        />
        <MetricCard
          label="Yıllık ROI"
          value={sale.annual_roi_percent != null ? `%${sale.annual_roi_percent}` : '—'}
          sub="Yıllıklandırılmış"
          color={roiColor}
        />
        <MetricCard
          label="Elde Tutma Süresi"
          value={sale.holding_days != null ? `${sale.holding_days} gün` : '—'}
          sub={sale.holding_days != null ? `≈ ${(sale.holding_days / 30).toFixed(1)} ay` : undefined}
        />
        <MetricCard
          label="Alım Maliyeti"
          value={formatCurrency(sale.total_cost_try ?? 0)}
          sub={sale.purchase_date ?? undefined}
        />
      </div>

      {(sale.purchase_usd_value != null || sale.purchase_gold_value != null) && (
        <div className="border border-border rounded-xl p-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Döviz / Altın Değerleme</p>

          {sale.purchase_usd_value != null && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">USD Değerleme</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Alım Değeri (USD)</p>
                  <p className="text-base font-bold text-foreground">${fmtNum(sale.purchase_usd_value)}</p>
                  {sale.sale_usd_rate && <p className="text-xs text-muted-foreground mt-0.5">1$ = {sale.sale_usd_rate} ₺</p>}
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Satış Değeri (USD)</p>
                  <p className="text-base font-bold text-foreground">${fmtNum(sale.current_usd_value)}</p>
                  {sale.purchase_usd_value != null && sale.current_usd_value != null && (
                    <p className={`text-xs mt-0.5 font-semibold ${sale.current_usd_value >= sale.purchase_usd_value ? 'text-green-500' : 'text-red-500'}`}>
                      {sale.current_usd_value >= sale.purchase_usd_value
                        ? <TrendingUp className="w-3 h-3 inline mr-0.5" />
                        : <TrendingDown className="w-3 h-3 inline mr-0.5" />
                      }
                      {fmtNum(sale.current_usd_value - sale.purchase_usd_value, ' USD')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {sale.purchase_gold_value != null && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Altın Değerleme</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Alım Değeri (gr)</p>
                  <p className="text-base font-bold text-foreground">{fmtNum(sale.purchase_gold_value, ' gr')}</p>
                  {sale.sale_gold_rate && <p className="text-xs text-muted-foreground mt-0.5">1gr = {sale.sale_gold_rate} ₺</p>}
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Satış Değeri (gr)</p>
                  <p className="text-base font-bold text-foreground">{fmtNum(sale.current_gold_value, ' gr')}</p>
                  {sale.purchase_gold_value != null && sale.current_gold_value != null && (
                    <p className={`text-xs mt-0.5 font-semibold ${sale.current_gold_value >= sale.purchase_gold_value ? 'text-green-500' : 'text-red-500'}`}>
                      {fmtNum(sale.current_gold_value - sale.purchase_gold_value, ' gr')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
