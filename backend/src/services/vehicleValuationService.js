/**
 * Vehicle Valuation Service — Sprint 13.1
 * Rule-based AI valuation: market price, negotiation, ROI, liquidity, future value
 */

const DEPRECIATION = {
  vehicle:                0.15,
  motorcycle:             0.12,
  caravan:                0.08,
  construction_equipment: 0.10,
  default:                0.15,
}

const POPULAR_BRANDS = [
  'volkswagen', 'vw', 'renault', 'ford', 'fiat', 'toyota',
  'honda', 'hyundai', 'kia', 'opel', 'peugeot', 'citroen',
  'bmw', 'mercedes', 'audi', 'skoda', 'dacia', 'seat',
]

// ── 1. Market Price Stats ─────────────────────────────────────────────────────

function calculateMarketPrice(listings) {
  const prices = listings.map(l => l.price).filter(p => p > 0).sort((a, b) => a - b)
  if (!prices.length) return null

  const n      = prices.length
  const min    = prices[0]
  const max    = prices[n - 1]
  const sum    = prices.reduce((s, p) => s + p, 0)
  const avg    = sum / n
  const mid    = Math.floor(n / 2)
  const median = n % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid]
  const variance = prices.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / n
  const stdDev   = Math.sqrt(variance)

  return {
    min: Math.round(min),
    max: Math.round(max),
    avg: Math.round(avg),
    median: Math.round(median),
    stdDev: Math.round(stdDev),
    count: n,
  }
}

// ── 2. Negotiation Price ──────────────────────────────────────────────────────

function calculateNegotiationPrice(ourPrice, marketStats) {
  if (!marketStats || !marketStats.avg) {
    return { advice: 'Piyasa verisi yetersiz, karşılaştırma yapılamadı.', negotiationPrice: null, pctVsMarket: null }
  }

  const avg        = marketStats.avg
  const pct        = (ourPrice - avg) / avg          // negative = below market = good
  const pctAbs     = Math.abs(pct) * 100

  let advice, negotiationPrice

  if (pct < -0.10) {
    advice           = `Piyasanın %${pctAbs.toFixed(1)} altında. Mükemmel fırsat, hemen alın.`
    negotiationPrice = null
  } else if (pct < -0.05) {
    advice           = `Piyasanın %${pctAbs.toFixed(1)} altında. İyi fiyat, alım uygun.`
    negotiationPrice = null
  } else if (pct <= 0.03) {
    const negoAmt    = Math.round(ourPrice * 0.03)
    advice           = `Piyasa ortalamasında. ~${negoAmt.toLocaleString('tr-TR')} ₺ pazarlık yapılabilir.`
    negotiationPrice = Math.round(ourPrice - negoAmt)
  } else if (pct <= 0.10) {
    const diff       = Math.round(ourPrice - avg)
    advice           = `Piyasanın %${pctAbs.toFixed(1)} üzerinde. ${diff.toLocaleString('tr-TR')} ₺ indirim talep edin.`
    negotiationPrice = Math.round(avg * 0.98)
  } else {
    advice           = `Piyasanın %${pctAbs.toFixed(1)} üzerinde. Başka alternatifler incelenmeli veya beklenmeli.`
    negotiationPrice = Math.round(avg * 0.95)
  }

  return { advice, negotiationPrice, pctVsMarket: pct }
}

// ── 3. Investment Score ───────────────────────────────────────────────────────

function calculateInvestmentScore({ pctVsMarket, liquidity, marketCount, vehicleAge }) {
  let score = 50

  // Price vs market effect
  if (pctVsMarket < -0.10)      score += 25
  else if (pctVsMarket < -0.05) score += 15
  else if (pctVsMarket < 0)     score += 8
  else if (pctVsMarket <= 0.05) score += 0
  else if (pctVsMarket <= 0.10) score -= 10
  else                           score -= 20

  // Liquidity bonus (max 15)
  score += Math.round((liquidity / 100) * 15)

  // Market data confidence
  if (marketCount >= 10) score += 8
  else if (marketCount >= 5) score += 4
  else if (marketCount >= 2) score += 2

  // Age penalty
  if (vehicleAge > 15)      score -= 12
  else if (vehicleAge > 10) score -= 6
  else if (vehicleAge > 7)  score -= 2

  return Math.max(0, Math.min(100, Math.round(score)))
}

// ── 4. Future Value Prediction ────────────────────────────────────────────────

function predictFutureValue(ourPrice, category, vehicleAge) {
  let annualRate = DEPRECIATION[category] ?? DEPRECIATION.default

  // Older vehicles depreciate at a slower absolute rate
  if (vehicleAge > 15)      annualRate = 0.04
  else if (vehicleAge > 10) annualRate = 0.07
  else if (vehicleAge > 5)  annualRate = annualRate * 0.85

  const value6m  = Math.round(ourPrice * (1 - annualRate * 0.5))
  const value12m = Math.round(ourPrice * (1 - annualRate))
  const value24m = Math.round(ourPrice * Math.pow(1 - annualRate, 2))

  return { value6m, value12m, value24m, annualDepreciationRate: annualRate }
}

// ── 5. Liquidity Score ────────────────────────────────────────────────────────

function calculateLiquidity({ category, brand, marketCount, vehicleAge }) {
  const BASE = {
    vehicle:                65,
    motorcycle:             55,
    caravan:                35,
    construction_equipment: 30,
    default:                45,
  }
  let score = BASE[category] ?? BASE.default

  // Market depth bonus
  if (marketCount >= 15)     score += 18
  else if (marketCount >= 8) score += 12
  else if (marketCount >= 3) score += 6
  else if (marketCount === 0) score -= 10

  // Popular brand bonus
  const b = (brand ?? '').toLowerCase()
  if (POPULAR_BRANDS.some(pb => b.includes(pb))) score += 10

  // Age effect
  if (vehicleAge > 15)      score -= 15
  else if (vehicleAge > 10) score -= 8
  else if (vehicleAge < 5)  score += 8

  return Math.max(0, Math.min(100, Math.round(score)))
}

// ── 6. AI Recommendation ─────────────────────────────────────────────────────

function generateRecommendation({ investScore, pctVsMarket, liquidity, roi1y, vehicleAge }) {
  const lines = []

  if (pctVsMarket != null) {
    const pctAbs = (Math.abs(pctVsMarket) * 100).toFixed(1)
    if (pctVsMarket < -0.08)
      lines.push(`Bu araç piyasanın %${pctAbs} altında fiyatlanmış — yüksek yatırım potansiyeli.`)
    else if (pctVsMarket < -0.03)
      lines.push(`Araç piyasanın %${pctAbs} altında, uygun alım fırsatı.`)
    else if (pctVsMarket <= 0.03)
      lines.push('Araç piyasa ortalamasında fiyatlanmış.')
    else
      lines.push(`Araç piyasanın %${pctAbs} üzerinde; daha uygun alternatifler değerlendirilebilir.`)
  }

  if (liquidity >= 70)
    lines.push('Likidite skoru yüksek; araç piyasada hızla alıcı bulur.')
  else if (liquidity >= 45)
    lines.push('Orta düzey likidite; satış birkaç hafta sürebilir.')
  else
    lines.push('Likidite skoru düşük; satış için daha fazla süre ayırın.')

  if (vehicleAge > 12)
    lines.push('Aracın yaşı göz önüne alındığında kısa vadeli tutma önerilir.')
  else if (vehicleAge > 6)
    lines.push('6–12 ay tutup satmak optimum strateji olabilir.')
  else
    lines.push('Nispeten genç araç; uzun vadeli tutma seçeneği değerlendirilebilir.')

  if (roi1y != null && roi1y >= 8)
    lines.push(`Beklenen yıllık getiri %${roi1y.toFixed(1)} ile cazip seviyede.`)

  const verdict =
    investScore >= 75 ? '✓ Alım tavsiye edilir.'
    : investScore >= 55 ? '⚠ Dikkatli değerlendirin.'
    : '✗ Alternatif arayışı önerilir.'
  lines.push(verdict)

  return lines.join(' ')
}

// ── Master compute ────────────────────────────────────────────────────────────

function computeFullValuation({ listings, ourPrice, category, brand, vehicleAge }) {
  const marketStats = calculateMarketPrice(listings)
  const negoResult  = calculateNegotiationPrice(ourPrice, marketStats)
  const liquidity   = calculateLiquidity({
    category, brand, vehicleAge,
    marketCount: marketStats?.count ?? 0,
  })
  const pctVsMarket = negoResult.pctVsMarket
  const investScore = calculateInvestmentScore({
    pctVsMarket: pctVsMarket ?? 0,
    liquidity,
    marketCount: marketStats?.count ?? 0,
    vehicleAge,
  })
  const future      = predictFutureValue(ourPrice, category, vehicleAge)
  const riskScore   = Math.max(0, Math.min(100, Math.round(100 - investScore)))

  // Simple ROI: if bought below market, potential upside + resale timing
  const marketAvg   = marketStats?.avg ?? ourPrice
  const priceGap    = Math.max(0, marketAvg - ourPrice)
  const roi1y       = Math.round(((priceGap / ourPrice) * 100) - (future.annualDepreciationRate * 100) + (liquidity / 100) * 5)

  const recommendation = generateRecommendation({ investScore, pctVsMarket, liquidity, roi1y, vehicleAge })

  return {
    // Market
    market_min:        marketStats?.min ?? null,
    market_max:        marketStats?.max ?? null,
    market_avg:        marketStats?.avg ?? null,
    market_median:     marketStats?.median ?? null,
    market_std_dev:    marketStats?.stdDev ?? null,
    market_count:      marketStats?.count ?? 0,
    market_price:      marketStats?.median ?? null,
    // Our position
    our_price:         ourPrice,
    price_vs_market:   pctVsMarket,
    negotiation_price: negoResult.negotiationPrice,
    negotiation_advice: negoResult.advice,
    // Scores
    investment_score:  investScore,
    liquidity_score:   liquidity,
    roi_1y:            roi1y,
    risk_score:        riskScore,
    // Future
    value_6m:          future.value6m,
    value_12m:         future.value12m,
    value_24m:         future.value24m,
    // AI
    ai_recommendation: recommendation,
    ai_analysis:       recommendation,
  }
}

module.exports = {
  calculateMarketPrice,
  calculateNegotiationPrice,
  calculateInvestmentScore,
  predictFutureValue,
  calculateLiquidity,
  generateRecommendation,
  computeFullValuation,
}
