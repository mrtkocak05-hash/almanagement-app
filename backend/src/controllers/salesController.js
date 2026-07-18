const { getDb } = require('../database/connection')
const fs = require('fs')
const path = require('path')

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0]
const today = () => new Date().toISOString().split('T')[0]

function generateSaleNo(db) {
  const year = new Date().getFullYear()
  const row = db.prepare(
    `SELECT COUNT(*) as c FROM sales WHERE strftime('%Y', created_at) = ? AND deleted_at IS NULL`
  ).get(String(year))
  const seq = (row.c || 0) + 1
  return `SALE-${year}-${String(seq).padStart(4, '0')}`
}

function calcMetrics({ total_cost_try, share_percent, sale_price_try, total_sale_expenses_try, purchase_date, sale_date }) {
  const cost = total_cost_try || 0
  const myShareCost = cost * (share_percent || 100) / 100
  const netSale = (sale_price_try || 0) - (total_sale_expenses_try || 0)
  const netProfit = netSale - cost
  const shareProfit = netProfit * (share_percent || 100) / 100

  let holdingDays = null
  let roi = null
  let annualRoi = null
  let score = null

  if (purchase_date && sale_date) {
    const days = Math.round((new Date(sale_date).getTime() - new Date(purchase_date).getTime()) / 86400000)
    if (days > 0) holdingDays = days
  }

  if (cost > 0) {
    roi = Math.round((netProfit / cost) * 10000) / 100
    if (holdingDays && holdingDays > 0) {
      annualRoi = Math.round((roi * 365 / holdingDays) * 100) / 100
      score = Math.min(100, Math.max(0, Math.round(50 + annualRoi)))
    }
  }

  return { myShareCost, netSale, netProfit, shareProfit, holdingDays, roi, annualRoi, score }
}

// ── Asset Context ──────────────────────────────────────────────────────────────

function getAssetContext(req, res) {
  const db = getDb()
  const assetId = Number(req.params.assetId)

  const asset = db.prepare(`
    SELECT a.*,
      p.id as purchase_id, p.purchase_no,
      p.purchase_price_try, p.total_expenses_try as total_purchase_expenses_try,
      p.total_cost_try, p.my_share_cost, p.purchase_date, p.share_percent,
      p.currency as purchase_currency, p.exchange_rate as purchase_exchange_rate
    FROM assets a
    LEFT JOIN purchases p ON p.asset_id = a.id AND p.deleted_at IS NULL AND p.status = 'completed'
    WHERE a.id = ? AND a.deleted_at IS NULL AND a.status = 'active'
  `).get(assetId)

  if (!asset) return res.status(404).json({ success: false, message: 'Varlık bulunamadı veya satışa uygun değil' })

  const partners = asset.purchase_id
    ? db.prepare(`SELECT * FROM purchase_partners WHERE purchase_id = ? AND deleted_at IS NULL`).all(asset.purchase_id)
    : db.prepare(`SELECT * FROM asset_partners WHERE asset_id = ? AND deleted_at IS NULL`).all(assetId)

  res.json({ success: true, data: { ...asset, partners } })
}

// ── List Sales ─────────────────────────────────────────────────────────────────

function listSales(req, res) {
  const db = getDb()
  const { search, status, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  const conditions = ['s.deleted_at IS NULL']
  const params = []

  if (search) {
    conditions.push('(s.sale_no LIKE ? OR s.asset_name LIKE ? OR s.buyer_name LIKE ?)')
    const s = `%${search}%`
    params.push(s, s, s)
  }
  if (status) { conditions.push('s.status = ?'); params.push(status) }

  const where = conditions.join(' AND ')

  const total = db.prepare(`SELECT COUNT(*) as c FROM sales s WHERE ${where}`).get(...params).c

  const rows = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM sale_expenses WHERE sale_id = s.id AND deleted_at IS NULL) as expense_count
    FROM sales s
    WHERE ${where}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset)

  const todayStr = today()
  const monthStart = todayStr.slice(0, 7) + '-01'

  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN date(sale_date) = ? THEN net_profit_try ELSE 0 END), 0) as today_profit,
      COALESCE(SUM(CASE WHEN sale_date >= ? THEN net_profit_try ELSE 0 END), 0) as month_profit,
      COALESCE(SUM(net_profit_try), 0) as total_profit,
      COALESCE(AVG(CASE WHEN roi_percent IS NOT NULL THEN roi_percent END), 0) as avg_roi,
      COUNT(*) as count
    FROM sales
    WHERE deleted_at IS NULL AND status = 'completed'
  `).get(todayStr, monthStart)

  res.json({
    success: true,
    data: { items: rows, total, page: Number(page), limit: Number(limit), total_pages: Math.ceil(total / Number(limit)), summary },
  })
}

// ── Get Sale Detail ────────────────────────────────────────────────────────────

function getSale(req, res) {
  const db = getDb()
  const sale = db.prepare('SELECT * FROM sales WHERE id = ? AND deleted_at IS NULL').get(Number(req.params.id))
  if (!sale) return res.status(404).json({ success: false, message: 'Satış bulunamadı' })

  const expenses = db.prepare('SELECT * FROM sale_expenses WHERE sale_id = ? AND deleted_at IS NULL ORDER BY created_at').all(sale.id)
  const documents = db.prepare('SELECT * FROM documents WHERE sale_id = ? AND deleted_at IS NULL ORDER BY created_at DESC').all(sale.id)
  const activities = db.prepare('SELECT * FROM activities WHERE sale_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 50').all(sale.id)

  const partners = sale.purchase_id
    ? db.prepare('SELECT * FROM purchase_partners WHERE purchase_id = ? AND deleted_at IS NULL').all(sale.purchase_id)
    : db.prepare('SELECT * FROM asset_partners WHERE asset_id = ? AND deleted_at IS NULL').all(sale.asset_id)

  res.json({ success: true, data: { ...sale, expenses, documents, activities, partners } })
}

// ── Create Sale ────────────────────────────────────────────────────────────────

function createSale(req, res) {
  const db = getDb()
  const body = req.body
  const ts = now()

  const {
    asset_id, asset_name, asset_type = 'other',
    purchase_id, purchase_price_try, total_purchase_expenses_try = 0, total_cost_try,
    share_percent = 100, purchase_date,
    buyer_name, buyer_type, buyer_phone,
    sale_date, sale_price = 0, currency = 'TRY', exchange_rate = 1, sale_price_try,
    payment_method, notes,
    sale_usd_rate, sale_gold_rate,
    expenses = [],
    complete = false,
  } = body

  if (!asset_id || !asset_name) return res.status(400).json({ success: false, message: 'Varlık seçimi zorunludur' })

  const saleNo = generateSaleNo(db)

  const totalExpTry = expenses.reduce((s, e) => s + (e.amount_try || 0), 0)
  const metrics = calcMetrics({ total_cost_try, share_percent, sale_price_try, total_sale_expenses_try: totalExpTry, purchase_date, sale_date })

  // Compute valuations
  const usdRate = sale_usd_rate || 0
  const goldRate = sale_gold_rate || 0
  const purchaseUsdValue = usdRate > 0 ? Math.round((total_cost_try || 0) / usdRate * 100) / 100 : null
  const currentUsdValue = usdRate > 0 ? Math.round((sale_price_try || 0) / usdRate * 100) / 100 : null
  const purchaseGoldValue = goldRate > 0 ? Math.round((total_cost_try || 0) / goldRate * 100) / 100 : null
  const currentGoldValue = goldRate > 0 ? Math.round((sale_price_try || 0) / goldRate * 100) / 100 : null

  const doCreate = db.transaction(() => {
    const r = db.prepare(`
      INSERT INTO sales (
        sale_no, asset_id, asset_name, asset_type,
        purchase_id, purchase_price_try, total_purchase_expenses_try, total_cost_try,
        share_percent, my_share_cost, purchase_date,
        buyer_name, buyer_type, buyer_phone,
        sale_date, sale_price, currency, exchange_rate, sale_price_try, payment_method,
        total_sale_expenses_try, net_sale_try, net_profit_try, share_profit_try,
        holding_days, roi_percent, annual_roi_percent, investment_score,
        sale_usd_rate, sale_gold_rate,
        purchase_usd_value, current_usd_value, purchase_gold_value, current_gold_value,
        status, notes, created_at, updated_at
      ) VALUES (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      )
    `).run(
      saleNo, asset_id, asset_name, asset_type,
      purchase_id || null, purchase_price_try || null, total_purchase_expenses_try, total_cost_try || null,
      share_percent, metrics.myShareCost, purchase_date || null,
      buyer_name || null, buyer_type || null, buyer_phone || null,
      sale_date || null, sale_price, currency, exchange_rate, sale_price_try || null, payment_method || null,
      totalExpTry, metrics.netSale, metrics.netProfit, metrics.shareProfit,
      metrics.holdingDays, metrics.roi, metrics.annualRoi, metrics.score,
      sale_usd_rate || null, sale_gold_rate || null,
      purchaseUsdValue, currentUsdValue, purchaseGoldValue, currentGoldValue,
      complete ? 'completed' : 'draft', notes || null, ts, ts
    )

    const saleId = r.lastInsertRowid

    // Insert expenses
    if (expenses.length > 0) {
      const expStmt = db.prepare(`
        INSERT INTO sale_expenses (sale_id, expense_type, expense_name, amount, currency, exchange_rate, amount_try, paid_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const e of expenses) {
        expStmt.run(saleId, e.expense_type || 'other', e.expense_name || '', e.amount || 0, e.currency || 'TRY', e.exchange_rate || 1, e.amount_try || 0, e.paid_by || null, ts)
      }
    }

    if (complete) {
      // Mark asset as sold
      db.prepare('UPDATE assets SET status = ?, updated_at = ? WHERE id = ?').run('sold', ts, asset_id)

      // Log activity
      db.prepare(`
        INSERT INTO activities (asset_id, sale_id, type, title, amount, currency, note, activity_date, created_at, updated_at)
        VALUES (?, ?, 'sale', ?, ?, 'TRY', ?, ?, ?, ?)
      `).run(asset_id, saleId, `Satış tamamlandı — ${saleNo}`, sale_price_try || sale_price, notes || null, sale_date || today(), ts, ts)
    }

    return saleId
  })

  try {
    const saleId = doCreate()
    const result = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId)
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── Complete Sale ──────────────────────────────────────────────────────────────

function completeSale(req, res) {
  const db = getDb()
  const ts = now()
  const { id } = req.params

  const sale = db.prepare('SELECT * FROM sales WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!sale) return res.status(404).json({ success: false, message: 'Satış bulunamadı' })
  if (sale.status === 'completed') return res.status(400).json({ success: false, message: 'Satış zaten tamamlandı' })

  const doComplete = db.transaction(() => {
    const expRow = db.prepare('SELECT COALESCE(SUM(amount_try), 0) as total FROM sale_expenses WHERE sale_id = ? AND deleted_at IS NULL').get(id)
    const totalExpTry = expRow.total || 0

    const metrics = calcMetrics({
      total_cost_try: sale.total_cost_try,
      share_percent: sale.share_percent,
      sale_price_try: sale.sale_price_try,
      total_sale_expenses_try: totalExpTry,
      purchase_date: sale.purchase_date,
      sale_date: sale.sale_date,
    })

    db.prepare(`
      UPDATE sales SET
        status = 'completed',
        total_sale_expenses_try = ?,
        net_sale_try = ?,
        net_profit_try = ?,
        share_profit_try = ?,
        my_share_cost = ?,
        holding_days = ?,
        roi_percent = ?,
        annual_roi_percent = ?,
        investment_score = ?,
        updated_at = ?
      WHERE id = ?
    `).run(totalExpTry, metrics.netSale, metrics.netProfit, metrics.shareProfit, metrics.myShareCost, metrics.holdingDays, metrics.roi, metrics.annualRoi, metrics.score, ts, id)

    db.prepare('UPDATE assets SET status = ?, updated_at = ? WHERE id = ?').run('sold', ts, sale.asset_id)

    db.prepare(`
      INSERT INTO activities (asset_id, sale_id, type, title, amount, currency, note, activity_date, created_at, updated_at)
      VALUES (?, ?, 'sale', ?, ?, 'TRY', ?, ?, ?, ?)
    `).run(sale.asset_id, sale.id, `Satış tamamlandı — ${sale.sale_no}`, sale.sale_price_try || sale.sale_price, sale.notes || null, sale.sale_date || today(), ts, ts)
  })

  try {
    doComplete()
    const result = db.prepare('SELECT * FROM sales WHERE id = ?').get(id)
    res.json({ success: true, data: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── Delete Sale ────────────────────────────────────────────────────────────────

function deleteSale(req, res) {
  const db = getDb()
  const ts = now()
  const { id } = req.params

  const s = db.prepare('SELECT id FROM sales WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!s) return res.status(404).json({ success: false, message: 'Satış bulunamadı' })

  db.prepare('UPDATE sales SET deleted_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, id)
  res.json({ success: true })
}

// ── Sale Expenses ──────────────────────────────────────────────────────────────

function addSaleExpense(req, res) {
  const db = getDb()
  const { id } = req.params
  const { expense_type = 'other', expense_name = '', amount = 0, currency = 'TRY', exchange_rate = 1, amount_try = 0, paid_by } = req.body
  const ts = now()

  const r = db.prepare(`
    INSERT INTO sale_expenses (sale_id, expense_type, expense_name, amount, currency, exchange_rate, amount_try, paid_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, expense_type, expense_name, amount, currency, exchange_rate, amount_try, paid_by || null, ts)

  _recalcSaleTotals(db, id, ts)
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM sale_expenses WHERE id = ?').get(r.lastInsertRowid) })
}

function deleteSaleExpense(req, res) {
  const db = getDb()
  const { id, eid } = req.params
  const ts = now()
  db.prepare('UPDATE sale_expenses SET deleted_at = ? WHERE id = ? AND sale_id = ?').run(ts, eid, id)
  _recalcSaleTotals(db, id, ts)
  res.json({ success: true })
}

function _recalcSaleTotals(db, saleId, ts) {
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId)
  const expRow = db.prepare('SELECT COALESCE(SUM(amount_try), 0) as total FROM sale_expenses WHERE sale_id = ? AND deleted_at IS NULL').get(saleId)
  const totalExpTry = expRow.total || 0

  const metrics = calcMetrics({
    total_cost_try: sale.total_cost_try,
    share_percent: sale.share_percent,
    sale_price_try: sale.sale_price_try,
    total_sale_expenses_try: totalExpTry,
    purchase_date: sale.purchase_date,
    sale_date: sale.sale_date,
  })

  db.prepare(`
    UPDATE sales SET
      total_sale_expenses_try = ?, net_sale_try = ?, net_profit_try = ?, share_profit_try = ?,
      holding_days = ?, roi_percent = ?, annual_roi_percent = ?, investment_score = ?, updated_at = ?
    WHERE id = ?
  `).run(totalExpTry, metrics.netSale, metrics.netProfit, metrics.shareProfit, metrics.holdingDays, metrics.roi, metrics.annualRoi, metrics.score, ts, saleId)
}

// ── Sale Documents ─────────────────────────────────────────────────────────────

function uploadSaleDocument(req, res) {
  const db = getDb()
  const { id } = req.params
  const file = req.file
  if (!file) return res.status(400).json({ success: false, message: 'Dosya bulunamadı' })

  const { type = 'other', title } = req.body
  const ts = now()

  const sale = db.prepare('SELECT asset_id FROM sales WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!sale) return res.status(404).json({ success: false, message: 'Satış bulunamadı' })

  const r = db.prepare(`
    INSERT INTO documents (asset_id, sale_id, type, title, filename, path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sale.asset_id || null, id, type, title || file.originalname, file.filename, `/storage/documents/${file.filename}`, ts, ts)

  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM documents WHERE id = ?').get(r.lastInsertRowid) })
}

function deleteSaleDocument(req, res) {
  const db = getDb()
  const { id, docId } = req.params
  const ts = now()

  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND sale_id = ? AND deleted_at IS NULL').get(docId, id)
  if (!doc) return res.status(404).json({ success: false, message: 'Doküman bulunamadı' })

  db.prepare('UPDATE documents SET deleted_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, docId)
  try { fs.unlinkSync(path.join(__dirname, '../../../storage/documents', doc.filename)) } catch (_) {}
  res.json({ success: true })
}

module.exports = {
  getAssetContext, listSales, getSale, createSale, completeSale, deleteSale,
  addSaleExpense, deleteSaleExpense,
  uploadSaleDocument, deleteSaleDocument,
}
