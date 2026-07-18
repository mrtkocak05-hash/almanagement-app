const { getDb } = require('../database/connection')

const DIMENSION_MAP = {
  likidite:  queryLikidite,
  risk:      queryRisk,
  karlilik:  queryKarlilik,
  nakit:     queryNakit,
  roi:       queryROI,
  portfoy:   queryPortfoy,
  belge:     queryBelge,
  sigorta:   querySigorta,
  piyasa:    queryPiyasa,
}

function queryLikidite(db) {
  const capital = db.prepare('SELECT amount_try FROM capital WHERE id = 1').get() ?? { amount_try: 0 }
  const receivables = db.prepare(`SELECT COALESCE(SUM(amount_try),0) AS total FROM receivables WHERE status != 'paid' AND deleted_at IS NULL`).get()
  const payables = db.prepare(`SELECT COALESCE(SUM(amount_try),0) AS total FROM payables WHERE status != 'paid' AND deleted_at IS NULL`).get()
  const liquid = (capital.amount_try ?? 0) + (receivables.total ?? 0)
  const obligations = payables.total ?? 0
  const ratio = obligations > 0 ? liquid / obligations : null

  return {
    dimension: 'likidite',
    metrics: { cash_try: capital.amount_try ?? 0, receivables_try: receivables.total ?? 0, payables_try: obligations, ratio: ratio?.toFixed(2) ?? 'N/A' },
    score: ratio == null ? 70 : Math.min(100, Math.round(ratio * 50)),
    status: ratio == null ? 'good' : ratio >= 2 ? 'good' : ratio >= 1 ? 'warning' : 'critical',
    summary: ratio == null ? 'Likidite verisi yetersiz.' : `Likidite oranı: ${ratio.toFixed(2)}`,
    recommendations: ratio != null && ratio < 1 ? ['Alacakları hızlandırın', 'Nakit girişi sağlayın'] : [],
  }
}

function queryRisk(db) {
  const longWait = db.prepare(`SELECT COUNT(*) AS c FROM assets WHERE status='active' AND deleted_at IS NULL AND julianday('now') - julianday(purchase_date) > 90`).get()
  const total = db.prepare(`SELECT COUNT(*) AS c FROM assets WHERE status='active' AND deleted_at IS NULL`).get()
  const capital = db.prepare('SELECT amount_try FROM capital WHERE id = 1').get() ?? { amount_try: 0 }
  const portfolio = db.prepare(`SELECT COALESCE(SUM(current_value),0) AS v FROM assets WHERE status='active' AND deleted_at IS NULL`).get()
  const cashRatio = portfolio.v > 0 ? (capital.amount_try ?? 0) / portfolio.v : 1

  const risks = []
  if (longWait.c > 2) risks.push(`${longWait.c} varlık 90+ gün bekliyor`)
  if (cashRatio < 0.05) risks.push('Nakit/portföy oranı kritik (<5%)')
  if (total.c > 0 && longWait.c / total.c > 0.4) risks.push('Portföyün %40+ bölümü uzun beklemede')

  const score = Math.max(0, 100 - risks.length * 25 - Math.round((longWait.c / Math.max(total.c, 1)) * 30))
  return {
    dimension: 'risk',
    metrics: { long_wait_count: longWait.c, total_active: total.c, cash_ratio: cashRatio.toFixed(3) },
    score, status: score >= 70 ? 'good' : score >= 40 ? 'warning' : 'critical',
    summary: risks.length === 0 ? 'Kritik risk tespit edilmedi.' : risks.join('; '),
    recommendations: risks,
  }
}

function queryKarlilik(db) {
  const sales = db.prepare(`SELECT AVG(roi_percent) AS avg_roi, SUM(net_profit_try) AS total_profit, COUNT(*) AS cnt FROM sales WHERE status='completed' AND deleted_at IS NULL`).get()
  const avgROI = sales.avg_roi ?? 0
  const totalProfit = sales.total_profit ?? 0
  const score = Math.min(100, Math.round(Math.max(0, avgROI) * 2))

  return {
    dimension: 'karlilik',
    metrics: { avg_roi: avgROI.toFixed(2), total_profit_try: totalProfit.toFixed(0), sale_count: sales.cnt },
    score, status: score >= 60 ? 'good' : score >= 30 ? 'warning' : 'critical',
    summary: `Ortalama ROI: %${avgROI.toFixed(1)}, Toplam kâr: ₺${Math.round(totalProfit / 1000)}K`,
    recommendations: avgROI < 10 ? ['ROI artırmak için satış fiyatlarını gözden geçirin'] : [],
  }
}

function queryNakit(db) {
  const capital = db.prepare('SELECT amount_try FROM capital WHERE id = 1').get() ?? { amount_try: 0 }
  const cash = db.prepare(`SELECT COALESCE(SUM(balance),0) AS total FROM cash_accounts WHERE status='active' AND deleted_at IS NULL`).get()
  const bank = db.prepare(`SELECT COALESCE(SUM(current_balance),0) AS total FROM bank_accounts WHERE status='active' AND deleted_at IS NULL`).get()
  const total = (capital.amount_try ?? 0) + (cash.total ?? 0) + (bank.total ?? 0)
  const score = total > 0 ? Math.min(100, Math.round(Math.log10(total + 1) * 20)) : 10

  return {
    dimension: 'nakit',
    metrics: { capital_try: capital.amount_try ?? 0, cash_accounts_try: cash.total ?? 0, bank_accounts_try: bank.total ?? 0, total_try: total },
    score, status: score >= 60 ? 'good' : score >= 30 ? 'warning' : 'critical',
    summary: `Toplam nakit: ₺${Math.round(total / 1000)}K`,
    recommendations: total === 0 ? ['Nakit girişi sağlayın'] : [],
  }
}

function queryROI(db) {
  const rows = db.prepare(`
    SELECT asset_type, AVG(roi_percent) AS avg_roi, COUNT(*) AS cnt
    FROM sales WHERE status='completed' AND deleted_at IS NULL AND roi_percent IS NOT NULL
    GROUP BY asset_type ORDER BY avg_roi DESC
  `).all()
  const best = rows[0]
  const score = best ? Math.min(100, Math.round(Math.max(0, best.avg_roi) * 1.5)) : 0

  return {
    dimension: 'roi',
    metrics: { by_type: rows, best_type: best?.asset_type ?? 'N/A', best_avg_roi: best?.avg_roi?.toFixed(2) ?? '0' },
    score, status: score >= 60 ? 'good' : score >= 30 ? 'warning' : 'critical',
    summary: best ? `En iyi ROI: ${best.asset_type} (%${best.avg_roi.toFixed(1)})` : 'Tamamlanmış satış yok.',
    recommendations: rows.length === 0 ? ['İlk satışı tamamlayın'] : [],
  }
}

function queryPortfoy(db) {
  const rows = db.prepare(`
    SELECT type, COUNT(*) AS cnt, COALESCE(SUM(current_value),0) AS value
    FROM assets WHERE status='active' AND deleted_at IS NULL
    GROUP BY type ORDER BY value DESC
  `).all()
  const totalValue = rows.reduce((s, r) => s + r.value, 0)
  const totalCount = rows.reduce((s, r) => s + r.cnt, 0)
  const concentration = rows.length > 0 ? (rows[0].value / Math.max(totalValue, 1)) : 0
  const score = Math.min(100, Math.round((1 - concentration) * 80 + (Math.min(rows.length, 5) / 5) * 20))

  return {
    dimension: 'portfoy',
    metrics: { by_type: rows, total_value_try: totalValue, total_count: totalCount, type_count: rows.length },
    score, status: score >= 60 ? 'good' : score >= 40 ? 'warning' : 'critical',
    summary: `${totalCount} varlık, ${rows.length} farklı tip, toplam ₺${Math.round(totalValue / 1e6 * 10) / 10}M`,
    recommendations: concentration > 0.7 ? ['Portföyü çeşitlendirin — tek tip çok yoğun'] : [],
  }
}

function queryBelge(db) {
  const totalAssets = db.prepare('SELECT COUNT(*) AS c FROM assets WHERE deleted_at IS NULL AND status != \'sold\'').get()
  const assetsWithDocs = db.prepare('SELECT COUNT(DISTINCT asset_id) AS c FROM documents WHERE deleted_at IS NULL AND asset_id IS NOT NULL').get()
  const coverage = totalAssets.c > 0 ? assetsWithDocs.c / totalAssets.c : 0
  const score = Math.round(coverage * 100)

  return {
    dimension: 'belge',
    metrics: { total_assets: totalAssets.c, assets_with_docs: assetsWithDocs.c, coverage_pct: (coverage * 100).toFixed(1) },
    score, status: score >= 80 ? 'good' : score >= 50 ? 'warning' : 'critical',
    summary: `Belge kapsamı: %${(coverage * 100).toFixed(0)} (${assetsWithDocs.c}/${totalAssets.c} varlık)`,
    recommendations: coverage < 0.8 ? ['Eksik varlıklar için belge yükleyin'] : [],
  }
}

function querySigorta(db) {
  const insuranceDocs = db.prepare(`SELECT COUNT(DISTINCT asset_id) AS c FROM documents WHERE deleted_at IS NULL AND asset_id IS NOT NULL AND (type LIKE '%sigorta%' OR type LIKE '%kasko%' OR category LIKE '%sigorta%' OR category LIKE '%kasko%')`).get()
  const totalAssets = db.prepare('SELECT COUNT(*) AS c FROM assets WHERE deleted_at IS NULL AND status = \'active\'').get()
  const coverage = totalAssets.c > 0 ? insuranceDocs.c / totalAssets.c : 0
  const score = Math.round(coverage * 100)

  return {
    dimension: 'sigorta',
    metrics: { insured_count: insuranceDocs.c, total_active: totalAssets.c, coverage_pct: (coverage * 100).toFixed(1) },
    score, status: score >= 70 ? 'good' : score >= 40 ? 'warning' : 'critical',
    summary: `Sigortalı varlık: ${insuranceDocs.c}/${totalAssets.c} (%${(coverage * 100).toFixed(0)})`,
    recommendations: coverage < 0.7 ? ['Sigortasız varlıklar için poliçe edinin'] : [],
  }
}

function queryPiyasa(db) {
  const researches = db.prepare(`SELECT COUNT(*) AS c FROM market_researches WHERE status='active' AND deleted_at IS NULL`).get()
  const listings = db.prepare(`SELECT COUNT(*) AS c, AVG(price) AS avg_price FROM market_listings WHERE deleted_at IS NULL`).get()
  const score = Math.min(100, researches.c * 15 + Math.min(listings.c, 10) * 3)

  return {
    dimension: 'piyasa',
    metrics: { research_count: researches.c, listing_count: listings.c, avg_listing_price: listings.avg_price?.toFixed(0) ?? '0' },
    score, status: score >= 60 ? 'good' : score >= 30 ? 'warning' : 'critical',
    summary: `${researches.c} araştırma, ${listings.c} ilan takipte`,
    recommendations: researches.c < 3 ? ['Piyasa araştırması artırın'] : [],
  }
}

function getDimensionInsight(req, res) {
  const db = getDb()
  const { dimension } = req.params
  const fn = DIMENSION_MAP[dimension.toLowerCase()]
  if (!fn) return res.status(404).json({ success: false, message: 'Bilinmeyen boyut.' })
  try {
    res.json({ success: true, data: fn(db) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

function getAllInsights(req, res) {
  const db = getDb()
  try {
    const results = Object.entries(DIMENSION_MAP).map(([key, fn]) => {
      try { return fn(db) } catch { return { dimension: key, score: 0, status: 'critical', summary: 'Veri alınamadı.', metrics: {}, recommendations: [] } }
    })
    const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    res.json({ success: true, data: { insights: results, overall_score: avgScore } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getDimensionInsight, getAllInsights }
