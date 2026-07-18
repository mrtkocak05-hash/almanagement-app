import { TrendingUp, TrendingDown, Calendar, DollarSign, Layers } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { getScoreLabel, getScoreColor } from '@/types/sales'
import { ASSET_TYPE_LABELS } from '@/types/assets'
import type { SaleWizardData } from '@/types/sales'

interface Props {
  data: SaleWizardData
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-foreground' : 'text-foreground'}`}>{value}</span>
    </div>
  )
}

function ScoreGauge({ score }: { score: number }) {
  const pct = score
  const color = score >= 85 ? '#22c55e' : score >= 70 ? '#10b981' : score >= 55 ? '#3b82f6' : score >= 40 ? '#eab308' : '#ef4444'
  const r = 40

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="60" viewBox="0 0 100 60">
        <path d={`M10,50 A40,40 0 0,1 90,50`} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" strokeLinecap="round" />
        <path
          d={`M10,50 A40,40 0 0,1 90,50`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * (Math.PI * r)} ${Math.PI * r}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text x="50" y="52" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>{score}</text>
      </svg>
      <p className="text-xs font-semibold mt-1" style={{ color }}>{getScoreLabel(score)}</p>
    </div>
  )
}

export function Step5Summary({ data }: Props) {
  const totalExpTry = data.expenses.reduce((s, e) => s + (e.amount_try || 0), 0)
  const netSale = (data.sale_price_try || 0) - totalExpTry
  const totalCost = data.total_cost_try || 0
  const netProfit = netSale - totalCost
  const shareProfit = netProfit * (data.share_percent || 100) / 100
  const myShareCost = totalCost * (data.share_percent || 100) / 100

  let holdingDays: number | null = null
  let roi: number | null = null
  let annualRoi: number | null = null
  let score: number | null = null

  if (data.purchase_date && data.sale_date) {
    const days = Math.round((new Date(data.sale_date).getTime() - new Date(data.purchase_date).getTime()) / 86400000)
    if (days > 0) holdingDays = days
  }

  if (totalCost > 0) {
    roi = Math.round((netProfit / totalCost) * 10000) / 100
    if (holdingDays && holdingDays > 0) {
      annualRoi = Math.round((roi * 365 / holdingDays) * 100) / 100
      score = Math.min(100, Math.max(0, Math.round(50 + annualRoi)))
    }
  }

  // Valuations
  const usdRate = data.sale_usd_rate || 0
  const goldRate = data.sale_gold_rate || 0
  const purchaseUsd = usdRate > 0 ? totalCost / usdRate : null
  const currentUsd = usdRate > 0 ? (data.sale_price_try || 0) / usdRate : null
  const purchaseGold = goldRate > 0 ? totalCost / goldRate : null
  const currentGold = goldRate > 0 ? (data.sale_price_try || 0) / goldRate : null

  const fmtNum = (v: number | null, suffix = '') =>
    v === null ? '—' : `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v)}${suffix}`

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Yatırım Özeti</h2>
        <p className="text-sm text-muted-foreground mt-1">Satışı tamamlamadan önce tüm detayları inceleyin</p>
      </div>

      {/* Asset & Score */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex-1">
          <p className="text-base font-semibold text-foreground">{data.asset_name}</p>
          <p className="text-xs text-muted-foreground">{data.asset_type ? ASSET_TYPE_LABELS[data.asset_type] : ''}</p>
          {data.buyer_name && <p className="text-xs text-muted-foreground mt-1">Alıcı: <span className="text-foreground">{data.buyer_name}</span></p>}
        </div>
        {score !== null && <ScoreGauge score={score} />}
      </div>

      {/* Financial Summary */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-0">
        <Row label="Toplam Maliyet (Alım + Gider)" value={formatCurrency(totalCost)} />
        <Row label="Satış Fiyatı (TRY)" value={formatCurrency(data.sale_price_try || 0)} />
        <Row label="Satış Giderleri" value={`− ${formatCurrency(totalExpTry)}`} />
        <Row label="Net Satış" value={formatCurrency(netSale)} />
        <div className="flex items-center justify-between py-3 mt-1">
          <span className="text-sm font-semibold text-foreground">Net Kâr / Zarar</span>
          <span className={`text-lg font-bold flex items-center gap-1 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {formatCurrency(Math.abs(netProfit))}
            {netProfit < 0 && ' (zarar)'}
          </span>
        </div>
        {data.share_percent < 100 && (
          <Row label={`Hisseme Düşen Kâr (%${data.share_percent})`} value={formatCurrency(shareProfit)} />
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Elde Tutma</span>
          </div>
          <p className="text-lg font-bold text-foreground">{holdingDays ?? '—'} gün</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">ROI / Yıllık ROI</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {roi !== null ? `%${roi}` : '—'} {annualRoi !== null && <span className="text-sm text-muted-foreground">/ %{annualRoi}/yıl</span>}
          </p>
        </div>
        {data.share_percent < 100 && (
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Hisse Maliyetim</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(myShareCost)}</p>
          </div>
        )}
        {annualRoi !== null && score !== null && (
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Yatırım Skoru</span>
            </div>
            <p className={`text-lg font-bold ${getScoreColor(score)}`}>{score} — {getScoreLabel(score)}</p>
          </div>
        )}
      </div>

      {/* USD / Gold Valuation */}
      {(purchaseUsd !== null || purchaseGold !== null) && (
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Döviz / Altın Değerleme</p>
          {purchaseUsd !== null && currentUsd !== null && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Alım (USD)</p>
                <p className="text-sm font-semibold text-foreground">${fmtNum(purchaseUsd)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Satış (USD)</p>
                <p className="text-sm font-semibold text-foreground">${fmtNum(currentUsd)}</p>
              </div>
            </div>
          )}
          {purchaseGold !== null && currentGold !== null && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Alım (gr Altın)</p>
                <p className="text-sm font-semibold text-foreground">{fmtNum(purchaseGold, ' gr')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Satış (gr Altın)</p>
                <p className="text-sm font-semibold text-foreground">{fmtNum(currentGold, ' gr')}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
