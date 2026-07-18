const { getDb } = require('../database/connection')
const fs = require('fs')
const path = require('path')

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0]
const today = () => new Date().toISOString().split('T')[0]

// ── Helpers ───────────────────────────────────────────────────────────────────

function generatePurchaseNo(db) {
  const year = new Date().getFullYear()
  const row = db.prepare(
    `SELECT COUNT(*) as c FROM purchases WHERE strftime('%Y', created_at) = ?`
  ).get(String(year))
  const seq = (row.c || 0) + 1
  return `SAT-${year}-${String(seq).padStart(4, '0')}`
}

function calcTry(amount, rate) {
  return Math.round((amount || 0) * (rate || 1) * 100) / 100
}

// ── List ──────────────────────────────────────────────────────────────────────

function listPurchases(req, res) {
  const db = getDb()
  const { search, type, status, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  const conditions = ['p.deleted_at IS NULL']
  const params = []

  if (search) {
    conditions.push('(p.asset_name LIKE ? OR p.purchase_no LIKE ? OR p.seller_name LIKE ?)')
    const s = `%${search}%`
    params.push(s, s, s)
  }
  if (type) { conditions.push('p.type = ?'); params.push(type) }
  if (status) { conditions.push('p.status = ?'); params.push(status) }

  const where = conditions.join(' AND ')

  const total = db.prepare(`SELECT COUNT(*) as c FROM purchases p WHERE ${where}`).get(...params).c

  const rows = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM purchase_expenses WHERE purchase_id = p.id AND deleted_at IS NULL) as expense_count,
      (SELECT COUNT(*) FROM purchase_partners WHERE purchase_id = p.id AND deleted_at IS NULL) as partner_count
    FROM purchases p
    WHERE ${where}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset)

  // Summary stats
  const todayStr = today()
  const monthStart = todayStr.slice(0, 7) + '-01'

  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN date(purchase_date) = ? THEN total_cost_try ELSE 0 END), 0) as today_total,
      COALESCE(SUM(CASE WHEN purchase_date >= ? THEN total_cost_try ELSE 0 END), 0) as month_total,
      COALESCE(SUM(total_cost_try), 0) as grand_total,
      COALESCE(AVG(total_cost_try), 0) as avg_total,
      COUNT(*) as count
    FROM purchases
    WHERE deleted_at IS NULL AND status = 'completed'
  `).get(todayStr, monthStart)

  res.json({
    success: true,
    data: {
      items: rows,
      total,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil(total / Number(limit)),
      summary,
    },
  })
}

// ── Get Detail ────────────────────────────────────────────────────────────────

function getPurchase(req, res) {
  const db = getDb()
  const { id } = req.params

  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!purchase) return res.status(404).json({ success: false, message: 'Satın alma bulunamadı' })

  const expenses = db.prepare(
    'SELECT * FROM purchase_expenses WHERE purchase_id = ? AND deleted_at IS NULL ORDER BY created_at'
  ).all(id)

  const partners = db.prepare(
    'SELECT * FROM purchase_partners WHERE purchase_id = ? AND deleted_at IS NULL ORDER BY created_at'
  ).all(id)

  const documents = db.prepare(
    'SELECT * FROM documents WHERE purchase_id = ? AND deleted_at IS NULL ORDER BY created_at DESC'
  ).all(id)

  const activities = db.prepare(
    'SELECT * FROM activities WHERE purchase_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 50'
  ).all(id)

  res.json({ success: true, data: { ...purchase, expenses, partners, documents, activities } })
}

// ── Create Purchase (draft → complete in one shot) ────────────────────────────

function createPurchase(req, res) {
  const db = getDb()
  const body = req.body
  const ts = now()

  const {
    type = 'other',
    asset_name,
    seller_name, seller_type, seller_province, seller_district,
    purchase_date, purchase_price, currency = 'TRY', exchange_rate = 1,
    payment_method, share_percent = 100, notes,
    brand, model, package_name, year, km, fuel_type, transmission,
    plate, vin, engine_number, engine_size, color, damage_status,
    property_type, gross_area, net_area, room_count, building_age,
    floor_number, location_address, title_deed,
    length_m, engine_power, hull_type, boat_reg_number,
    equipment_type, engine_hours, serial_number,
    investment_type, institution, units, unit_price, bank_wallet,
    description,
    partners = [],
    expenses = [],
    complete = false,
  } = body

  if (!asset_name) return res.status(400).json({ success: false, message: 'Varlık adı zorunludur' })

  const purchase_price_try = calcTry(purchase_price, exchange_rate)
  const purchase_no = generatePurchaseNo(db)

  const createPurchaseAndComplete = db.transaction(() => {
    // Insert purchase
    const r = db.prepare(`
      INSERT INTO purchases (
        purchase_no, type, asset_name,
        seller_name, seller_type, seller_province, seller_district,
        purchase_date, purchase_price, currency, exchange_rate, purchase_price_try,
        payment_method, share_percent, notes,
        brand, model, package_name, year, km, fuel_type, transmission,
        plate, vin, engine_number, engine_size, color, damage_status,
        property_type, gross_area, net_area, room_count, building_age,
        floor_number, location_address, title_deed,
        length_m, engine_power, hull_type, boat_reg_number,
        equipment_type, engine_hours, serial_number,
        investment_type, institution, units, unit_price, bank_wallet,
        description, status, created_at, updated_at
      ) VALUES (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      )
    `).run(
      purchase_no, type, asset_name,
      seller_name || null, seller_type || null, seller_province || null, seller_district || null,
      purchase_date || null, purchase_price || null, currency, exchange_rate, purchase_price_try,
      payment_method || null, share_percent, notes || null,
      brand || null, model || null, package_name || null, year || null, km || null,
      fuel_type || null, transmission || null, plate || null, vin || null,
      engine_number || null, engine_size || null, color || null, damage_status || null,
      property_type || null, gross_area || null, net_area || null, room_count || null,
      building_age || null, floor_number || null, location_address || null, title_deed || null,
      length_m || null, engine_power || null, hull_type || null, boat_reg_number || null,
      equipment_type || null, engine_hours || null, serial_number || null,
      investment_type || null, institution || null, units || null, unit_price || null,
      bank_wallet || null, description || null,
      complete ? 'completed' : 'draft', ts, ts
    )

    const purchaseId = r.lastInsertRowid

    // Insert expenses
    let totalExpensesTry = 0
    const expStmt = db.prepare(`
      INSERT INTO purchase_expenses (purchase_id, expense_type, expense_name, amount, currency, exchange_rate, amount_try, paid_by, is_shared, my_share_amount, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const e of expenses) {
      const eRate = e.exchange_rate || 1
      const eTry = calcTry(e.amount, eRate)
      const myShare = e.is_shared ? calcTry(eTry * share_percent / 100, 1) : eTry
      expStmt.run(purchaseId, e.expense_type || 'other', e.expense_name, e.amount || 0, e.currency || 'TRY', eRate, eTry, e.paid_by || null, e.is_shared ? 1 : 0, myShare, ts)
      totalExpensesTry += eTry
    }

    // Insert partners
    const partStmt = db.prepare(`
      INSERT INTO purchase_partners (purchase_id, name, share_percent, share_amount, phone, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    for (const p of partners) {
      const shareAmt = purchase_price_try ? calcTry(purchase_price_try * p.share_percent / 100, 1) : null
      partStmt.run(purchaseId, p.name, p.share_percent, shareAmt, p.phone || null, p.notes || null, ts)
    }

    // Finalize totals
    const totalCost = purchase_price_try + totalExpensesTry
    const myShareCost = calcTry(totalCost * share_percent / 100, 1)

    db.prepare(`UPDATE purchases SET total_expenses_try = ?, total_cost_try = ?, my_share_cost = ?, updated_at = ? WHERE id = ?`)
      .run(totalExpensesTry, totalCost, myShareCost, ts, purchaseId)

    let assetId = null
    if (complete) {
      assetId = _createAssetFromPurchase(db, purchaseId, {
        type, asset_name, purchase_date, purchase_price_try, currency,
        share_percent, brand, model, year, km, fuel_type, transmission,
        plate, vin, engine_number, engine_size, color, damage_status,
        property_type, gross_area, net_area, room_count, building_age,
        floor_number, location_address, length_m, engine_power, hull_type,
        boat_reg_number, equipment_type, engine_hours, serial_number,
        investment_type, institution, units, unit_price, bank_wallet, description,
        partners, totalCost,
      }, ts)
    }

    return purchaseId
  })

  const purchaseId = createPurchaseAndComplete()
  const result = db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId)
  res.status(201).json({ success: true, data: result })
}

// ── Complete Draft ────────────────────────────────────────────────────────────

function completePurchase(req, res) {
  const db = getDb()
  const { id } = req.params
  const ts = now()

  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!purchase) return res.status(404).json({ success: false, message: 'Satın alma bulunamadı' })
  if (purchase.status === 'completed') return res.status(400).json({ success: false, message: 'Zaten tamamlandı' })

  const expenses = db.prepare('SELECT * FROM purchase_expenses WHERE purchase_id = ? AND deleted_at IS NULL').all(id)
  const partners = db.prepare('SELECT * FROM purchase_partners WHERE purchase_id = ? AND deleted_at IS NULL').all(id)

  const doComplete = db.transaction(() => {
    const assetId = _createAssetFromPurchase(db, id, {
      type: purchase.type,
      asset_name: purchase.asset_name,
      purchase_date: purchase.purchase_date,
      purchase_price_try: purchase.purchase_price_try,
      currency: purchase.currency,
      share_percent: purchase.share_percent,
      brand: purchase.brand, model: purchase.model, year: purchase.year, km: purchase.km,
      fuel_type: purchase.fuel_type, transmission: purchase.transmission, plate: purchase.plate,
      vin: purchase.vin, engine_number: purchase.engine_number, engine_size: purchase.engine_size,
      color: purchase.color, damage_status: purchase.damage_status,
      property_type: purchase.property_type, gross_area: purchase.gross_area, net_area: purchase.net_area,
      room_count: purchase.room_count, building_age: purchase.building_age, floor_number: purchase.floor_number,
      location_address: purchase.location_address, length_m: purchase.length_m, engine_power: purchase.engine_power,
      hull_type: purchase.hull_type, boat_reg_number: purchase.boat_reg_number,
      equipment_type: purchase.equipment_type, engine_hours: purchase.engine_hours, serial_number: purchase.serial_number,
      investment_type: purchase.investment_type, institution: purchase.institution, units: purchase.units,
      unit_price: purchase.unit_price, bank_wallet: purchase.bank_wallet, description: purchase.description,
      partners, totalCost: purchase.total_cost_try,
    }, ts)

    db.prepare('UPDATE purchases SET status = ?, asset_id = ?, updated_at = ? WHERE id = ?')
      .run('completed', assetId, ts, id)

    return assetId
  })

  doComplete()
  const result = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id)
  res.json({ success: true, data: result })
}

// ── Internal: create asset from purchase ──────────────────────────────────────

function _createAssetFromPurchase(db, purchaseId, data, ts) {
  const {
    type, asset_name, purchase_date, purchase_price_try, currency, share_percent,
    brand, model, year, km, fuel_type, transmission, plate, vin, engine_number,
    engine_size, color, damage_status, property_type, gross_area, net_area,
    room_count, building_age, floor_number, location_address, length_m, engine_power,
    hull_type, boat_reg_number, equipment_type, engine_hours, serial_number,
    investment_type, institution, units, unit_price, bank_wallet, description,
    partners = [], totalCost,
  } = data

  const r = db.prepare(`
    INSERT INTO assets (
      name, type, status, purchase_price, purchase_currency, current_value, purchase_date,
      share_percent, brand, model, year, km, fuel_type, transmission, plate, vin,
      engine_number, engine_size, color, damage_status, property_type, gross_area,
      net_area, room_count, building_age, floor_number, location_address,
      length_m, engine_power, hull_type, boat_reg_number, equipment_type,
      engine_hours, serial_number, investment_type, institution, units, unit_price,
      bank_wallet, description, created_at, updated_at
    ) VALUES (
      ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    )
  `).run(
    asset_name, type, 'active',
    purchase_price_try || null, 'TRY', totalCost || purchase_price_try || null,
    purchase_date || null, share_percent,
    brand || null, model || null, year || null, km || null,
    fuel_type || null, transmission || null, plate || null, vin || null,
    engine_number || null, engine_size || null, color || null, damage_status || null,
    property_type || null, gross_area || null, net_area || null, room_count || null,
    building_age || null, floor_number || null, location_address || null,
    length_m || null, engine_power || null, hull_type || null, boat_reg_number || null,
    equipment_type || null, engine_hours || null, serial_number || null,
    investment_type || null, institution || null, units || null, unit_price || null,
    bank_wallet || null, description || null, ts, ts
  )

  const assetId = r.lastInsertRowid

  // Copy partners → asset_partners
  const partStmt = db.prepare(`
    INSERT INTO asset_partners (asset_id, name, share_percent, share_amount, phone, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const p of partners) {
    const shareAmt = totalCost ? calcTry(totalCost * (p.share_percent || p.share_percent) / 100, 1) : null
    partStmt.run(assetId, p.name, p.share_percent, p.share_amount || shareAmt, p.phone || null, p.notes || null, ts, ts)
  }

  // Update purchase with asset_id
  db.prepare('UPDATE purchases SET asset_id = ?, updated_at = ? WHERE id = ?').run(assetId, ts, purchaseId)

  // Log activity
  db.prepare(`
    INSERT INTO activities (asset_id, purchase_id, type, title, amount, currency, activity_date, created_at, updated_at)
    VALUES (?, ?, 'purchase', ?, ?, 'TRY', ?, ?, ?)
  `).run(assetId, purchaseId, `Satın alma tamamlandı: ${asset_name}`, purchase_price_try || null, today(), ts, ts)

  return assetId
}

// ── Update Purchase ───────────────────────────────────────────────────────────

function updatePurchase(req, res) {
  const db = getDb()
  const { id } = req.params
  const ts = now()

  const existing = db.prepare('SELECT * FROM purchases WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!existing) return res.status(404).json({ success: false, message: 'Satın alma bulunamadı' })
  if (existing.status === 'completed') return res.status(400).json({ success: false, message: 'Tamamlanmış satın alma düzenlenemez' })

  const body = req.body
  const skip = new Set(['id', 'purchase_no', 'asset_id', 'created_at', 'deleted_at', 'partners', 'expenses'])
  const cols = Object.keys(body).filter(k => !skip.has(k))
  const setClause = cols.map(k => `${k} = ?`).join(', ')
  const values = cols.map(k => body[k] ?? null)

  // Recalculate purchase_price_try if price/rate changed
  const price = body.purchase_price ?? existing.purchase_price
  const rate = body.exchange_rate ?? existing.exchange_rate
  const priceTry = calcTry(price, rate)

  db.prepare(`UPDATE purchases SET ${setClause}, purchase_price_try = ?, updated_at = ? WHERE id = ?`)
    .run(...values, priceTry, ts, id)

  const result = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id)
  res.json({ success: true, data: result })
}

// ── Delete Purchase ───────────────────────────────────────────────────────────

function deletePurchase(req, res) {
  const db = getDb()
  const { id } = req.params
  const ts = now()

  const p = db.prepare('SELECT id FROM purchases WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!p) return res.status(404).json({ success: false, message: 'Satın alma bulunamadı' })

  db.prepare('UPDATE purchases SET deleted_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, id)
  res.json({ success: true, message: 'Silindi' })
}

// ── Expenses ──────────────────────────────────────────────────────────────────

function addExpense(req, res) {
  const db = getDb()
  const { id } = req.params
  const { expense_type = 'other', expense_name, amount = 0, currency = 'TRY', exchange_rate = 1, paid_by, is_shared = false } = req.body
  const ts = now()

  const purchase = db.prepare('SELECT share_percent FROM purchases WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!purchase) return res.status(404).json({ success: false, message: 'Satın alma bulunamadı' })

  const amount_try = calcTry(amount, exchange_rate)
  const my_share = is_shared ? calcTry(amount_try * purchase.share_percent / 100, 1) : amount_try

  const r = db.prepare(`
    INSERT INTO purchase_expenses (purchase_id, expense_type, expense_name, amount, currency, exchange_rate, amount_try, paid_by, is_shared, my_share_amount, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, expense_type, expense_name, amount, currency, exchange_rate, amount_try, paid_by || null, is_shared ? 1 : 0, my_share, ts)

  _recalcTotals(db, id, ts)
  res.status(201).json({ success: true, data: { id: r.lastInsertRowid, expense_type, expense_name, amount, currency, amount_try, my_share_amount: my_share } })
}

function deleteExpense(req, res) {
  const db = getDb()
  const { id, eid } = req.params
  const ts = now()

  db.prepare('UPDATE purchase_expenses SET deleted_at = ? WHERE id = ? AND purchase_id = ?').run(ts, eid, id)
  _recalcTotals(db, id, ts)
  res.json({ success: true })
}

function _recalcTotals(db, purchaseId, ts) {
  const purchase = db.prepare('SELECT purchase_price_try, share_percent FROM purchases WHERE id = ?').get(purchaseId)
  const expenses = db.prepare('SELECT SUM(amount_try) as total FROM purchase_expenses WHERE purchase_id = ? AND deleted_at IS NULL').get(purchaseId)
  const totalExp = expenses.total || 0
  const totalCost = (purchase.purchase_price_try || 0) + totalExp
  const myShare = calcTry(totalCost * purchase.share_percent / 100, 1)
  db.prepare('UPDATE purchases SET total_expenses_try = ?, total_cost_try = ?, my_share_cost = ?, updated_at = ? WHERE id = ?')
    .run(totalExp, totalCost, myShare, ts, purchaseId)
}

// ── Partners ──────────────────────────────────────────────────────────────────

function addPurchasePartner(req, res) {
  const db = getDb()
  const { id } = req.params
  const { name, share_percent, phone, notes } = req.body
  const ts = now()

  const purchase = db.prepare('SELECT purchase_price_try FROM purchases WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!purchase) return res.status(404).json({ success: false, message: 'Satın alma bulunamadı' })

  const share_amount = purchase.purchase_price_try ? calcTry(purchase.purchase_price_try * share_percent / 100, 1) : null

  const r = db.prepare(`
    INSERT INTO purchase_partners (purchase_id, name, share_percent, share_amount, phone, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, share_percent, share_amount, phone || null, notes || null, ts)

  res.status(201).json({ success: true, data: { id: r.lastInsertRowid, name, share_percent, share_amount, phone, notes } })
}

function deletePurchasePartner(req, res) {
  const db = getDb()
  const { id, pid } = req.params
  const ts = now()
  db.prepare('UPDATE purchase_partners SET deleted_at = ? WHERE id = ? AND purchase_id = ?').run(ts, pid, id)
  res.json({ success: true })
}

// ── Documents ─────────────────────────────────────────────────────────────────

function uploadPurchaseDocument(req, res) {
  const db = getDb()
  const { id } = req.params
  const file = req.file
  if (!file) return res.status(400).json({ success: false, message: 'Dosya bulunamadı' })

  const { type = 'other', title } = req.body
  const ts = now()

  const purchase = db.prepare('SELECT asset_id FROM purchases WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!purchase) return res.status(404).json({ success: false, message: 'Satın alma bulunamadı' })

  const r = db.prepare(`
    INSERT INTO documents (purchase_id, asset_id, type, title, filename, path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, purchase.asset_id || null, type, title || file.originalname, file.filename, `/storage/documents/${file.filename}`, ts, ts)

  res.status(201).json({ success: true, data: { id: r.lastInsertRowid, type, title: title || file.originalname, filename: file.filename, path: `/storage/documents/${file.filename}` } })
}

function deletePurchaseDocument(req, res) {
  const db = getDb()
  const { id, docId } = req.params
  const ts = now()

  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND purchase_id = ? AND deleted_at IS NULL').get(docId, id)
  if (!doc) return res.status(404).json({ success: false, message: 'Doküman bulunamadı' })

  db.prepare('UPDATE documents SET deleted_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, docId)
  try { fs.unlinkSync(path.join(__dirname, '../../../storage/documents', doc.filename)) } catch (_) {}
  res.json({ success: true })
}

module.exports = {
  listPurchases, getPurchase, createPurchase, updatePurchase, deletePurchase, completePurchase,
  addExpense, deleteExpense,
  addPurchasePartner, deletePurchasePartner,
  uploadPurchaseDocument, deletePurchaseDocument,
}
