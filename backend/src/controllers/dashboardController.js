const { getDb } = require('../database/connection')

// ── Shared helpers ────────────────────────────────────────────────────────────

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0]

function generateInsights(data) {
  const insights = []
  if (!data.capital || data.capital.amount_try === 0) {
    insights.push({ level: 'warning', message: 'Sermaye henüz tanımlanmamış. Ayarlardan mevcut sermayenizi giriniz.' })
  }
  if (!data.rates || data.rates.usd_try === 0) {
    insights.push({ level: 'info', message: 'Döviz kurları güncellenmemiş. USD/TL ve altın gram fiyatını giriniz.' })
  }
  if (data.totalAssets === 0) {
    insights.push({ level: 'info', message: 'Henüz varlık eklenmemiş. İlk varlığınızı Varlıklar modülünden ekleyebilirsiniz.' })
  } else if (data.totalAssetValue === 0) {
    insights.push({ level: 'info', message: 'Varlıkların güncel değeri girilmemiş. Varlıklar sayfasından güncelleyebilirsiniz.' })
  }
  if (data.recentActivities.length === 0) {
    insights.push({ level: 'info', message: 'Hiç işlem kaydı bulunmuyor. Satınalma, satış veya gelir girişi yapabilirsiniz.' })
  }
  if (data.todayActivityCount === 0) {
    insights.push({ level: 'info', message: 'Bugün hiç işlem yapılmamış.' })
  }
  if (insights.length === 0) {
    insights.push({ level: 'success', message: 'Sistem güncel. Tüm veriler mevcut.' })
  }
  return insights
}

// ── Main dashboard ────────────────────────────────────────────────────────────

function getDashboard(_req, res) {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]

  const capital = db.prepare('SELECT * FROM capital WHERE id = 1').get()
  const rates = db.prepare('SELECT * FROM exchange_rates WHERE id = 1').get()

  const totalAssetsRow = db.prepare("SELECT COUNT(*) as count FROM assets WHERE deleted_at IS NULL").get()
  const activeInvestmentsRow = db.prepare("SELECT COUNT(*) as count FROM assets WHERE deleted_at IS NULL AND type != 'cash'").get()
  const availableCashRow = db.prepare("SELECT COALESCE(SUM(current_value), 0) as total FROM assets WHERE type = 'cash' AND deleted_at IS NULL").get()
  const totalValueRow = db.prepare("SELECT COALESCE(SUM(current_value), 0) as total FROM assets WHERE deleted_at IS NULL AND purchase_currency = 'TRY'").get()

  const recentActivities = db.prepare(
    'SELECT * FROM activities WHERE deleted_at IS NULL ORDER BY activity_date DESC, created_at DESC LIMIT 10'
  ).all()

  const todayPurchases = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM activities WHERE type = 'purchase' AND activity_date = ? AND deleted_at IS NULL").get(today)
  const todaySales = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM activities WHERE type = 'sale' AND activity_date = ? AND deleted_at IS NULL").get(today)
  const todayExpenses = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM activities WHERE type IN ('expense', 'personal_expense') AND activity_date = ? AND deleted_at IS NULL").get(today)
  const todayIncome = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM activities WHERE type = 'income' AND activity_date = ? AND deleted_at IS NULL").get(today)
  const todayCountRow = db.prepare('SELECT COUNT(*) as count FROM activities WHERE activity_date = ? AND deleted_at IS NULL').get(today)

  const amountTry = capital?.amount_try ?? 0
  const usdRate = rates?.usd_try ?? 0
  const goldRate = rates?.gold_gram_try ?? 0

  res.json({
    success: true,
    data: {
      capital: { amount_try: amountTry, updated_at: capital?.updated_at ?? null },
      metrics: {
        total_assets: totalAssetsRow.count,
        active_investments: activeInvestmentsRow.count,
        available_cash: availableCashRow.total,
        total_asset_value: totalValueRow.total,
      },
      recent_activities: recentActivities,
      today_summary: {
        purchases: todayPurchases.total,
        sales: todaySales.total,
        expenses: todayExpenses.total,
        income: todayIncome.total,
        net_change: todaySales.total + todayIncome.total - todayPurchases.total - todayExpenses.total,
      },
      exchange_rates: { usd_try: usdRate, gold_gram_try: goldRate, updated_at: rates?.updated_at ?? null },
      insights: generateInsights({ capital, rates, totalAssets: totalAssetsRow.count, totalAssetValue: totalValueRow.total, recentActivities, todayActivityCount: todayCountRow.count }),
      last_updated: new Date().toISOString(),
    },
  })
}

// ── CEO Morning Brief ─────────────────────────────────────────────────────────

function getAIBrief(_req, res) {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const ago90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]

  // Portföy özeti
  const assets = db.prepare("SELECT COUNT(*) as total, COALESCE(SUM(current_value),0) as value, COALESCE(SUM(purchase_price),0) as cost FROM assets WHERE deleted_at IS NULL AND status='active'").get()
  const capital = db.prepare('SELECT amount_try FROM capital WHERE id=1').get()
  const cashAssets = db.prepare("SELECT COALESCE(SUM(current_value),0) as total FROM assets WHERE type='cash' AND deleted_at IS NULL").get()

  // Son 24 saat aktiviteleri
  const last24h = db.prepare("SELECT type, title, amount, currency, activity_date FROM activities WHERE deleted_at IS NULL AND activity_date >= ? ORDER BY created_at DESC LIMIT 20").all(yesterday)

  // Bekleyen işler
  const pendingPurchases = db.prepare("SELECT COUNT(*) as c FROM purchases WHERE status='draft' AND deleted_at IS NULL").get()
  const pendingSales = db.prepare("SELECT COUNT(*) as c FROM sales WHERE status='draft' AND deleted_at IS NULL").get()

  // Riskler: 90 günden uzun süredir aktif varlıklar
  const longWaiting = db.prepare("SELECT COUNT(*) as c FROM assets WHERE status='active' AND deleted_at IS NULL AND purchase_date IS NOT NULL AND purchase_date < ?").get(ago90)
  const noValue = db.prepare("SELECT COUNT(*) as c FROM assets WHERE deleted_at IS NULL AND (current_value IS NULL OR current_value = 0)").get()
  const totalAssetCount = db.prepare("SELECT COUNT(*) as c FROM assets WHERE deleted_at IS NULL").get()

  // Fırsatlar: araştırmalar
  const activeResearch = db.prepare("SELECT COUNT(*) as c FROM market_researches WHERE deleted_at IS NULL AND status='active'").get()
  const highValueGain = db.prepare("SELECT COUNT(*) as c FROM assets WHERE deleted_at IS NULL AND current_value > purchase_price * 1.1 AND purchase_price > 0").get()

  // AI yorumu (kural tabanlı)
  const amountTry = capital?.amount_try ?? 0
  const totalValue = assets.value ?? 0
  const cashTotal = cashAssets.total ?? 0
  const liquidityPct = totalValue > 0 ? (cashTotal / totalValue * 100) : 0

  const riskItems = []
  if (longWaiting.c > 0) riskItems.push(`${longWaiting.c} varlık 90+ gündür bekliyor`)
  if (noValue.c > 0) riskItems.push(`${noValue.c} varlığın değeri güncellenmemiş`)
  if (liquidityPct < 5 && totalValue > 0) riskItems.push('Nakit oranı kritik düzeyde düşük')
  if (pendingPurchases.c > 0) riskItems.push(`${pendingPurchases.c} taslak alım bekliyor`)

  const opportunityItems = []
  if (highValueGain.c > 0) opportunityItems.push(`${highValueGain.c} varlık değer kazanmış, satış fırsatı`)
  if (activeResearch.c > 0) opportunityItems.push(`${activeResearch.c} aktif piyasa araştırması mevcut`)
  if (liquidityPct > 15) opportunityItems.push(`Güçlü nakit pozisyonu — yatırım fırsatı değerlendirilebilir`)

  const pendingItems = []
  if (pendingPurchases.c > 0) pendingItems.push({ type: 'purchase', label: 'Taslak alım', count: pendingPurchases.c })
  if (pendingSales.c > 0) pendingItems.push({ type: 'sale', label: 'Taslak satış', count: pendingSales.c })
  if (longWaiting.c > 0) pendingItems.push({ type: 'waiting', label: '90+ gün bekleyen varlık', count: longWaiting.c })

  // AI yorum metni
  let aiComment = ''
  if (totalAssetCount.c === 0) {
    aiComment = 'Portföy henüz oluşturulmamış. İlk varlığınızı ekleyerek başlayın.'
  } else {
    const parts = []
    if (assets.value > assets.cost) {
      const gain = ((assets.value - assets.cost) / assets.cost * 100).toFixed(1)
      parts.push(`Portföy değeri maliyet üzerinde %${gain} artış gösteriyor.`)
    }
    if (liquidityPct > 20) parts.push(`Likidite güçlü (${liquidityPct.toFixed(0)}%).`)
    else if (liquidityPct < 5) parts.push(`Nakit oranı düşük (${liquidityPct.toFixed(0)}%) — dikkat.`)
    if (riskItems.length === 0) parts.push('Önemli risk unsuru tespit edilmedi.')
    if (opportunityItems.length > 0) parts.push(opportunityItems[0] + '.')
    aiComment = parts.join(' ') || 'Portföy izleniyor. Detaylı analiz için varlık değerlerini güncel tutun.'
  }

  // 7-day and 30-day summaries
  const ago7  = new Date(Date.now() -  7 * 86400000).toISOString().split('T')[0]
  const ago30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  function daySummary(since) {
    const inc  = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='income' AND activity_date >= ?").get(since)
    const sal  = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='sale' AND activity_date >= ?").get(since)
    const exp  = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type IN ('expense','personal_expense') AND activity_date >= ?").get(since)
    const prof = db.prepare("SELECT COALESCE(SUM(net_profit_try),0) as v FROM sales WHERE deleted_at IS NULL AND sale_date >= ?").get(since)
    return { income: inc.v + sal.v, expenses: exp.v, profit: prof.v, net: inc.v + sal.v - exp.v }
  }

  // Expiring insurance (next 30 days)
  let expiringInsurance = 0
  try {
    const next30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    const ins = db.prepare("SELECT COUNT(*) as c FROM documents WHERE deleted_at IS NULL AND LOWER(title) LIKE '%sigorta%' AND expire_date IS NOT NULL AND expire_date BETWEEN ? AND ?").get(today, next30)
    expiringInsurance = ins.c
  } catch (_) {}

  // Missing doc count
  let missingDocCount = 0
  try {
    const md = db.prepare("SELECT COUNT(*) as c FROM assets a WHERE a.deleted_at IS NULL AND a.type NOT IN ('cash','investment') AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.asset_id=a.id AND d.deleted_at IS NULL)").get()
    missingDocCount = md.c
  } catch (_) {}

  res.json({
    success: true,
    data: {
      portfolio: {
        active_count: assets.total,
        total_value: totalValue,
        total_cost: assets.cost,
        gain_loss: totalValue - assets.cost,
        gain_loss_pct: assets.cost > 0 ? ((totalValue - assets.cost) / assets.cost * 100) : 0,
      },
      cash: {
        capital: amountTry,
        cash_assets: cashTotal,
        liquidity_pct: liquidityPct,
      },
      risks: riskItems,
      opportunities: opportunityItems,
      pending: pendingItems,
      last_24h: last24h,
      last_7d: daySummary(ago7),
      last_30d: daySummary(ago30),
      expiring_insurance: expiringInsurance,
      missing_docs: missingDocCount,
      ai_comment: aiComment,
      generated_at: new Date().toISOString(),
    },
  })
}

// ── Portfolio breakdown (pie chart) ──────────────────────────────────────────

function getPortfolioBreakdown(_req, res) {
  const db = getDb()

  const rows = db.prepare(`
    SELECT
      type,
      COUNT(*) as count,
      COALESCE(SUM(current_value), 0) as total_value,
      COALESCE(SUM(purchase_price), 0) as total_cost
    FROM assets
    WHERE deleted_at IS NULL
    GROUP BY type
    ORDER BY total_value DESC
  `).all()

  const total = rows.reduce((s, r) => s + r.total_value, 0)

  const breakdown = rows.map(r => ({
    type: r.type,
    count: r.count,
    total_value: r.total_value,
    total_cost: r.total_cost,
    pct: total > 0 ? Math.round(r.total_value / total * 1000) / 10 : 0,
  }))

  res.json({ success: true, data: { breakdown, total_value: total } })
}

// ── Profitability center ──────────────────────────────────────────────────────

function getProfitability(_req, res) {
  const db = getDb()

  const sales = db.prepare(`
    SELECT id, asset_name, asset_type, net_profit_try, roi_percent, annual_roi_percent,
           sale_date, share_profit_try
    FROM sales
    WHERE deleted_at IS NULL AND net_profit_try IS NOT NULL
    ORDER BY net_profit_try DESC
  `).all()

  if (!sales.length) {
    return res.json({ success: true, data: { sales: [], best: null, worst: null, avg_roi: 0, total_profit: 0, total_loss: 0 } })
  }

  const profits = sales.filter(s => s.net_profit_try > 0)
  const losses = sales.filter(s => s.net_profit_try <= 0)
  const totalProfit = profits.reduce((s, r) => s + r.net_profit_try, 0)
  const totalLoss = Math.abs(losses.reduce((s, r) => s + r.net_profit_try, 0))
  const rois = sales.filter(s => s.roi_percent != null).map(s => s.roi_percent)
  const avgRoi = rois.length ? rois.reduce((a, b) => a + b, 0) / rois.length : 0

  res.json({
    success: true,
    data: {
      sales: sales.slice(0, 10),
      best: sales[0] ?? null,
      worst: sales[sales.length - 1] ?? null,
      avg_roi: Math.round(avgRoi * 10) / 10,
      total_profit: totalProfit,
      total_loss: totalLoss,
      net: totalProfit - totalLoss,
    },
  })
}

// ── Smart alerts ──────────────────────────────────────────────────────────────

function getAlerts(_req, res) {
  const db = getDb()
  const ago90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]
  const ago60 = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]
  const next30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const alerts = []

  // 90 günden uzun bekleyen varlıklar
  const longWaiting = db.prepare(`
    SELECT id, name, type, purchase_date, current_value, purchase_price
    FROM assets
    WHERE status='active' AND deleted_at IS NULL AND purchase_date IS NOT NULL AND purchase_date < ?
    ORDER BY purchase_date ASC
    LIMIT 5
  `).all(ago90)
  for (const a of longWaiting) {
    const days = Math.round((Date.now() - new Date(a.purchase_date).getTime()) / 86400000)
    alerts.push({
      type: 'waiting',
      severity: days > 180 ? 'high' : 'medium',
      title: `${a.name} — ${days} gündür bekliyor`,
      detail: `${a.type} kategorisi`,
      asset_id: a.id,
      link: `/varliklar/${a.id}`,
    })
  }

  // Değer girilmemiş varlıklar
  const noValue = db.prepare(`
    SELECT id, name, type FROM assets
    WHERE deleted_at IS NULL AND (current_value IS NULL OR current_value = 0) AND type != 'cash'
    LIMIT 5
  `).all()
  for (const a of noValue) {
    alerts.push({
      type: 'missing_value',
      severity: 'low',
      title: `${a.name} — güncel değer girilmemiş`,
      detail: 'Varlık sayfasından güncelleyin',
      asset_id: a.id,
      link: `/varliklar/${a.id}`,
    })
  }

  // Fotoğrafsız varlıklar
  const noPhoto = db.prepare(`
    SELECT a.id, a.name, a.type FROM assets a
    WHERE a.deleted_at IS NULL AND a.type != 'cash'
      AND NOT EXISTS (SELECT 1 FROM asset_photos p WHERE p.asset_id = a.id AND p.deleted_at IS NULL)
    LIMIT 5
  `).all()
  for (const a of noPhoto) {
    alerts.push({
      type: 'missing_photo',
      severity: 'low',
      title: `${a.name} — fotoğraf eksik`,
      detail: 'Varlık detayından fotoğraf ekleyin',
      asset_id: a.id,
      link: `/varliklar/${a.id}`,
    })
  }

  // Belge son kullanma tarihi yaklaşanlar
  try {
    const expiringDocs = db.prepare(`
      SELECT d.id, d.title, d.expire_date, a.name as asset_name, a.id as asset_id
      FROM documents d
      LEFT JOIN assets a ON a.id = d.asset_id
      WHERE d.deleted_at IS NULL AND d.expire_date IS NOT NULL
        AND d.expire_date BETWEEN ? AND ?
      LIMIT 5
    `).all(today, next30)
    for (const d of expiringDocs) {
      const daysLeft = Math.round((new Date(d.expire_date).getTime() - Date.now()) / 86400000)
      alerts.push({
        type: 'expiring_doc',
        severity: daysLeft <= 7 ? 'high' : 'medium',
        title: `${d.title} — ${daysLeft} günde süresi dolacak`,
        detail: d.asset_name ?? 'Belge arşivi',
        asset_id: d.asset_id,
        link: d.asset_id ? `/varliklar/${d.asset_id}` : '/operasyon/dokumanlar',
      })
    }
  } catch (_) {}

  // Belgesi olmayan varlıklar
  const noDoc = db.prepare(`
    SELECT a.id, a.name, a.type FROM assets a
    WHERE a.deleted_at IS NULL AND a.type NOT IN ('cash','investment')
      AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.asset_id = a.id AND d.deleted_at IS NULL)
    LIMIT 5
  `).all()
  for (const a of noDoc) {
    alerts.push({
      type: 'missing_doc',
      severity: 'low',
      title: `${a.name} — belge yok`,
      detail: 'Fatura, ruhsat veya tapu ekleyin',
      asset_id: a.id,
      link: `/varliklar/${a.id}`,
    })
  }

  // Sort: high → medium → low
  const severityOrder = { high: 0, medium: 1, low: 2 }
  alerts.sort((a, b) => (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2))

  res.json({ success: true, data: alerts.slice(0, 20) })
}

// ── AI Executive Summary ──────────────────────────────────────────────────────

function getExecutiveSummary(_req, res) {
  const db = getDb()
  const ago90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]

  const actions = []

  // Uzun bekleyen varlıklar
  const longWaiting = db.prepare("SELECT id, name, type, purchase_date FROM assets WHERE status='active' AND deleted_at IS NULL AND purchase_date < ? ORDER BY purchase_date ASC LIMIT 3").all(ago90)
  for (const a of longWaiting) {
    const days = Math.round((Date.now() - new Date(a.purchase_date).getTime()) / 86400000)
    actions.push({ icon: 'clock', priority: 'high', text: `${a.name} ${days} gündür bekliyor — satış planı değerlendir`, link: `/varliklar/${a.id}` })
  }

  // Değer artmış varlıklar — satış fırsatı
  const gainers = db.prepare("SELECT id, name, current_value, purchase_price FROM assets WHERE deleted_at IS NULL AND current_value > purchase_price * 1.15 AND purchase_price > 0 LIMIT 2").all()
  for (const a of gainers) {
    const pct = ((a.current_value - a.purchase_price) / a.purchase_price * 100).toFixed(0)
    actions.push({ icon: 'trending_up', priority: 'medium', text: `${a.name} %${pct} değer kazandı — satış için iyi zaman`, link: `/varliklar/${a.id}` })
  }

  // Aktif piyasa araştırmaları
  try {
    const research = db.prepare("SELECT COUNT(*) as c FROM market_researches WHERE deleted_at IS NULL AND status='active'").get()
    if (research.c > 0) {
      actions.push({ icon: 'search', priority: 'medium', text: `${research.c} aktif piyasa araştırması var — fırsatları incele`, link: '/operasyon/piyasa-arastirma' })
    }
  } catch (_) {}

  // Nakit durumu
  const capital = db.prepare('SELECT amount_try FROM capital WHERE id=1').get()
  const cashAssets = db.prepare("SELECT COALESCE(SUM(current_value),0) as total FROM assets WHERE type='cash' AND deleted_at IS NULL").get()
  const totalValue = db.prepare("SELECT COALESCE(SUM(current_value),0) as total FROM assets WHERE deleted_at IS NULL").get()
  const cashPct = totalValue.total > 0 ? (cashAssets.total / totalValue.total * 100) : 0

  if (cashPct > 20) actions.push({ icon: 'wallet', priority: 'low', text: 'Nakit pozisyonu güçlü — yeni yatırım fırsatı değerlendirilebilir', link: '/' })
  else if (cashPct < 5 && totalValue.total > 0) actions.push({ icon: 'alert', priority: 'high', text: 'Nakit oranı kritik — likidite takviyesi öncelikli', link: '/operasyon/finans' })

  // Belgesi/fotoğrafı eksik varlıklar
  const missingDocs = db.prepare("SELECT COUNT(*) as c FROM assets a WHERE a.deleted_at IS NULL AND a.type NOT IN ('cash','investment') AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.asset_id = a.id AND d.deleted_at IS NULL)").get()
  if (missingDocs.c > 0) {
    actions.push({ icon: 'file', priority: 'low', text: `${missingDocs.c} varlığın belgesi eksik — arşiv tamamlanmalı`, link: '/operasyon/dokumanlar' })
  }

  if (actions.length === 0) {
    actions.push({ icon: 'check', priority: 'low', text: 'Portföy düzenli görünüyor — yeni varlık veya araştırma ekleyebilirsiniz', link: '/varliklar' })
  }

  res.json({ success: true, data: actions.slice(0, 8) })
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

function getKPIs(_req, res) {
  const db = getDb()
  const month = new Date().toISOString().slice(0, 7)

  const portfolio   = db.prepare("SELECT COALESCE(SUM(current_value),0) as val FROM assets WHERE deleted_at IS NULL AND status='active'").get()
  const capital     = db.prepare('SELECT amount_try FROM capital WHERE id=1').get()
  const activeAss   = db.prepare("SELECT COUNT(*) as val FROM assets WHERE deleted_at IS NULL AND status='active'").get()
  const passiveAss  = db.prepare("SELECT COUNT(*) as val FROM assets WHERE deleted_at IS NULL AND status!='active'").get()
  const pendSales   = db.prepare("SELECT COUNT(*) as val FROM sales WHERE deleted_at IS NULL AND status='draft'").get()
  const avgRoi      = db.prepare('SELECT AVG(roi_percent) as val FROM sales WHERE deleted_at IS NULL AND roi_percent IS NOT NULL').get()
  const monthProfit = db.prepare("SELECT COALESCE(SUM(net_profit_try),0) as val FROM sales WHERE deleted_at IS NULL AND strftime('%Y-%m', COALESCE(sale_date, created_at)) = ?").get(month)
  const monthExp    = db.prepare("SELECT COALESCE(SUM(amount),0) as val FROM activities WHERE deleted_at IS NULL AND type IN ('expense','personal_expense') AND strftime('%Y-%m', activity_date) = ?").get(month)
  const totalSales  = db.prepare("SELECT COALESCE(SUM(net_sale_price_try),0) as val FROM sales WHERE deleted_at IS NULL AND status='completed'").get()
  const totalPurch  = db.prepare("SELECT COALESCE(SUM(purchase_price_try),0) as val FROM purchases WHERE deleted_at IS NULL AND status='completed'").get()

  res.json({
    success: true,
    data: {
      portfolio_value: portfolio.val,
      total_sales: totalSales.val,
      total_purchases: totalPurch.val,
      month_profit: monthProfit.val,
      month_expenses: monthExp.val,
      net_cash: capital?.amount_try ?? 0,
      avg_roi: avgRoi.val ? Math.round(avgRoi.val * 10) / 10 : 0,
      active_assets: activeAss.val,
      passive_assets: passiveAss.val,
      pending_sales: pendSales.val,
    },
  })
}

// ── Chart Data ────────────────────────────────────────────────────────────────

function getChartData(req, res) {
  const db = getDb()
  const { period = 'monthly' } = req.query

  if (period === 'weekly') {
    const data = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const day = d.getDay()
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - day)
      const ws = weekStart.toISOString().split('T')[0]
      const we = new Date(weekStart)
      we.setDate(we.getDate() + 6)
      const weStr = we.toISOString().split('T')[0]

      const income   = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='income' AND activity_date BETWEEN ? AND ?").get(ws, weStr)
      const sale     = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='sale' AND activity_date BETWEEN ? AND ?").get(ws, weStr)
      const expenses = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type IN ('expense','personal_expense') AND activity_date BETWEEN ? AND ?").get(ws, weStr)
      const profit   = db.prepare("SELECT COALESCE(SUM(net_profit_try),0) as v FROM sales WHERE deleted_at IS NULL AND sale_date BETWEEN ? AND ?").get(ws, weStr)
      data.push({ period: ws, label: `H${8 - i}`, income: income.v + sale.v, expenses: expenses.v, profit: profit.v })
    }
    return res.json({ success: true, data })
  }

  if (period === 'yearly') {
    const data = []
    for (let i = 2; i >= 0; i--) {
      const y = String(new Date().getFullYear() - i)
      const income   = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='income' AND strftime('%Y',activity_date)=?").get(y)
      const sale     = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='sale' AND strftime('%Y',activity_date)=?").get(y)
      const expenses = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type IN ('expense','personal_expense') AND strftime('%Y',activity_date)=?").get(y)
      const profit   = db.prepare("SELECT COALESCE(SUM(net_profit_try),0) as v FROM sales WHERE deleted_at IS NULL AND strftime('%Y',COALESCE(sale_date,created_at))=?").get(y)
      data.push({ period: y, label: y, income: income.v + sale.v, expenses: expenses.v, profit: profit.v })
    }
    return res.json({ success: true, data })
  }

  // default: monthly — last 12
  const data = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const m = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('tr-TR', { month: 'short' })

    const income   = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='income' AND strftime('%Y-%m',activity_date)=?").get(m)
    const sale     = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='sale' AND strftime('%Y-%m',activity_date)=?").get(m)
    const expenses = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type IN ('expense','personal_expense') AND strftime('%Y-%m',activity_date)=?").get(m)
    const profit   = db.prepare("SELECT COALESCE(SUM(net_profit_try),0) as v FROM sales WHERE deleted_at IS NULL AND strftime('%Y-%m',COALESCE(sale_date,created_at))=?").get(m)
    data.push({ period: m, label, income: income.v + sale.v, expenses: expenses.v, profit: profit.v })
  }
  res.json({ success: true, data })
}

// ── Executive Score ───────────────────────────────────────────────────────────

function getExecutiveScore(_req, res) {
  const db = getDb()
  const ago90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]

  const capital    = db.prepare('SELECT amount_try FROM capital WHERE id=1').get()
  const totalValue = db.prepare("SELECT COALESCE(SUM(current_value),0) as val FROM assets WHERE deleted_at IS NULL AND status='active'").get()
  const netCash    = capital?.amount_try ?? 0
  const liquidityScore = totalValue.val > 0 ? Math.min((netCash / totalValue.val) * 500, 100) : 50

  const avgRoi   = db.prepare('SELECT AVG(roi_percent) as val FROM sales WHERE deleted_at IS NULL AND roi_percent IS NOT NULL').get()
  const profScore = avgRoi.val != null ? Math.min(Math.max(avgRoi.val * 2, 0), 100) : 50

  const activeAss   = db.prepare("SELECT COUNT(*) as c FROM assets WHERE deleted_at IS NULL AND status='active'").get()
  const longWait    = db.prepare("SELECT COUNT(*) as c FROM assets WHERE status='active' AND deleted_at IS NULL AND purchase_date IS NOT NULL AND purchase_date < ?").get(ago90)
  const riskScore   = activeAss.c > 0 ? Math.max(0, 100 - (longWait.c / Math.max(activeAss.c, 1)) * 200) : 75

  const nonCash  = db.prepare("SELECT COUNT(*) as c FROM assets WHERE deleted_at IS NULL AND type NOT IN ('cash','investment')").get()
  const withDocs = db.prepare("SELECT COUNT(DISTINCT a.id) as c FROM assets a INNER JOIN documents d ON d.asset_id=a.id WHERE a.deleted_at IS NULL AND a.type NOT IN ('cash','investment') AND d.deleted_at IS NULL").get()
  const docScore = nonCash.c > 0 ? Math.min((withDocs.c / nonCash.c) * 100, 100) : 100

  let insuranceScore = 60
  try {
    const withIns = db.prepare("SELECT COUNT(DISTINCT asset_id) as c FROM documents WHERE deleted_at IS NULL AND LOWER(title) LIKE '%sigorta%' AND asset_id IS NOT NULL").get()
    insuranceScore = nonCash.c > 0 ? Math.min((withIns.c / nonCash.c) * 100, 100) : 80
  } catch (_) {}

  const typeCount     = db.prepare("SELECT COUNT(DISTINCT type) as c FROM assets WHERE deleted_at IS NULL AND type NOT IN ('cash','investment')").get()
  const diversityScore = Math.min(typeCount.c * 20, 100)

  const waitingScore = Math.max(0, 100 - longWait.c * 15)

  const dimensions = [
    { key: 'likidite',    label: 'Likidite',            score: Math.round(liquidityScore),  detail: `Nakit %${totalValue.val > 0 ? ((netCash / totalValue.val) * 100).toFixed(0) : 0}` },
    { key: 'karlilik',    label: 'Karlılık',             score: Math.round(Math.max(0, profScore)),  detail: avgRoi.val != null ? `Ort. ROI %${avgRoi.val.toFixed(1)}` : 'Satış kaydı yok' },
    { key: 'risk',        label: 'Risk',                 score: Math.round(Math.max(0, riskScore)),  detail: longWait.c > 0 ? `${longWait.c} uzun bekleyen` : 'Risk normal' },
    { key: 'belge',       label: 'Belge Tamlığı',        score: Math.round(docScore),        detail: `${withDocs.c}/${nonCash.c} varlık belgeli` },
    { key: 'sigorta',     label: 'Sigorta Durumu',       score: Math.round(Math.max(0, insuranceScore)), detail: 'Sigorta belgelerinden hesaplandı' },
    { key: 'cesitlilik',  label: 'Portföy Çeşitliliği',  score: Math.round(diversityScore),  detail: `${typeCount.c} farklı kategori` },
    { key: 'bekleme',     label: 'Bekleme Süresi',       score: Math.round(Math.max(0, waitingScore)), detail: longWait.c > 0 ? `${longWait.c} varlık 90+ gün` : 'Bekleme normal' },
  ]

  const overall = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length)
  res.json({ success: true, data: { overall, dimensions } })
}

// ── Top Investments ───────────────────────────────────────────────────────────

function getTopInvestments(_req, res) {
  const db = getDb()
  const rows = db.prepare(`
    SELECT id, asset_name, asset_type, net_profit_try, roi_percent,
           annual_roi_percent, sale_date, purchase_date, holding_days, investment_score
    FROM sales
    WHERE deleted_at IS NULL
      AND status = 'completed'
      AND roi_percent IS NOT NULL
      AND net_profit_try > 0
    ORDER BY roi_percent DESC
    LIMIT 5
  `).all()
  res.json({ success: true, data: rows })
}

// ── Top Expense Assets ────────────────────────────────────────────────────────

function getTopExpenseAssets(_req, res) {
  const db = getDb()
  const rows = db.prepare(`
    SELECT
      a.id   AS asset_id,
      a.name AS asset_name,
      a.type AS asset_type,
      COALESCE(SUM(act.amount), 0) AS total_expenses,
      COUNT(act.id)                AS expense_count
    FROM activities act
    JOIN assets a ON a.id = act.asset_id
    WHERE act.deleted_at IS NULL
      AND a.deleted_at IS NULL
      AND act.type IN ('expense', 'personal_expense')
      AND act.asset_id IS NOT NULL
    GROUP BY a.id, a.name, a.type
    ORDER BY total_expenses DESC
    LIMIT 5
  `).all()
  res.json({ success: true, data: rows })
}

// ── Balance Summary (period-filtered cash overview) ───────────────────────────

function getBalanceSummary(req, res) {
  const db = getDb()
  const { period = 'monthly' } = req.query

  const today = new Date().toISOString().split('T')[0]
  let startDate

  if (period === 'daily') {
    startDate = today
  } else if (period === 'weekly') {
    const d = new Date()
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1 // 0=Mon offset
    d.setDate(d.getDate() - dow)
    startDate = d.toISOString().split('T')[0]
  } else if (period === 'monthly') {
    startDate = today.slice(0, 7) + '-01'
  } else {
    startDate = today.slice(0, 4) + '-01-01'
  }
  const endDate = today

  // Static balance
  const cashBal    = db.prepare("SELECT COALESCE(SUM(balance),0) as v FROM cash_accounts WHERE deleted_at IS NULL AND status='active'").get().v
  const bankBal    = db.prepare("SELECT COALESCE(SUM(current_balance),0) as v FROM bank_accounts WHERE deleted_at IS NULL AND status='active'").get().v
  const capitalBal = db.prepare('SELECT amount_try FROM capital WHERE id=1').get()?.amount_try ?? 0
  const staticBalance = cashBal + bankBal + capitalBal

  // Period income
  const salesIncome = db.prepare(
    "SELECT COALESCE(SUM(net_sale_try),0) as v FROM sales WHERE deleted_at IS NULL AND status='completed' AND sale_date BETWEEN ? AND ?"
  ).get(startDate, endDate).v
  const actIncome = db.prepare(
    "SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='income' AND activity_date BETWEEN ? AND ?"
  ).get(startDate, endDate).v
  const capIncrease = db.prepare(
    "SELECT COALESCE(SUM(amount_try),0) as v FROM capital_movements WHERE deleted_at IS NULL AND type='increase' AND movement_date BETWEEN ? AND ?"
  ).get(startDate, endDate).v
  let recvCollected = 0
  try {
    recvCollected = db.prepare(
      "SELECT COALESCE(SUM(collected_amount),0) as v FROM receivables WHERE deleted_at IS NULL AND collected_amount>0 AND status='collected' AND DATE(updated_at) BETWEEN ? AND ?"
    ).get(startDate, endDate).v
  } catch (_) {}
  const periodIncome = salesIncome + actIncome + capIncrease + recvCollected

  // Period expenses — from expenses table
  const personalExpTable = db.prepare(
    "SELECT COALESCE(SUM(amount_try),0) as v FROM expenses WHERE deleted_at IS NULL AND expense_owner='personal' AND expense_date BETWEEN ? AND ?"
  ).get(startDate, endDate).v
  const companyExpTable = db.prepare(
    "SELECT COALESCE(SUM(amount_try),0) as v FROM expenses WHERE deleted_at IS NULL AND expense_owner!='personal' AND expense_date BETWEEN ? AND ?"
  ).get(startDate, endDate).v
  // Period expenses — from activities
  const personalExpAct = db.prepare(
    "SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='personal_expense' AND activity_date BETWEEN ? AND ?"
  ).get(startDate, endDate).v
  const companyExpAct = db.prepare(
    "SELECT COALESCE(SUM(amount),0) as v FROM activities WHERE deleted_at IS NULL AND type='expense' AND activity_date BETWEEN ? AND ?"
  ).get(startDate, endDate).v

  const personalExpenses = personalExpTable + personalExpAct
  const companyExpenses  = companyExpTable + companyExpAct
  const totalExpenses    = personalExpenses + companyExpenses
  const kasadaBulunan    = staticBalance + periodIncome
  const kalan            = kasadaBulunan - totalExpenses

  return res.json({
    success: true,
    data: {
      period,
      start_date: startDate,
      end_date: endDate,
      static_balance: staticBalance,
      period_income: periodIncome,
      income_breakdown: {
        sales: salesIncome,
        activities: actIncome,
        capital_increase: capIncrease,
        receivables: recvCollected,
      },
      kasada_bulunan: kasadaBulunan,
      expenses: {
        personal: personalExpenses,
        company: companyExpenses,
        total: totalExpenses,
      },
      kalan,
    },
  })
}

module.exports = { getDashboard, getAIBrief, getPortfolioBreakdown, getProfitability, getAlerts, getExecutiveSummary, getKPIs, getChartData, getExecutiveScore, getTopInvestments, getTopExpenseAssets, getBalanceSummary }
