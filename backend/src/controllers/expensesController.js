const { getDb } = require('../database/connection')
const path = require('path')

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0]
const today = () => new Date().toISOString().split('T')[0]
const toTry = (amount, rate) => Math.round((amount || 0) * (rate || 1) * 100) / 100
const PAGE_SIZE = 50

// ── Expense No ──────────────────────────────────────────────────────────────

function generateExpenseNo(db) {
  const year = new Date().getFullYear()
  const row = db.prepare(`SELECT COUNT(*) as cnt FROM expenses WHERE expense_no LIKE 'EXP-${year}-%'`).get()
  const seq = String((row?.cnt || 0) + 1).padStart(4, '0')
  return `EXP-${year}-${seq}`
}

// ── Financial Side Effects ───────────────────────────────────────────────────

function applyPaymentSource(db, expense, factor = 1) {
  const { payment_source, payment_source_id, amount_try, expense_owner } = expense
  const delta = toTry(amount_try, factor)

  if (payment_source === 'cash' && payment_source_id) {
    db.prepare('UPDATE cash_accounts SET balance = balance - ?, updated_at = ? WHERE id = ?')
      .run(delta, now(), payment_source_id)
  } else if (payment_source === 'bank' && payment_source_id) {
    db.prepare('UPDATE bank_accounts SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?')
      .run(delta, now(), payment_source_id)
  } else if (payment_source === 'credit_card' && payment_source_id) {
    db.prepare('UPDATE credit_cards SET current_debt = current_debt + ?, available_limit = available_limit - ?, updated_at = ? WHERE id = ?')
      .run(delta, delta, now(), payment_source_id)
  }

  // Company expenses erode capital
  if (expense_owner === 'company') {
    db.prepare('UPDATE capital SET amount_try = amount_try - ?, updated_at = ? WHERE id = 1')
      .run(delta, now())
  }
}

function logTransaction(db, expense) {
  db.prepare(`
    INSERT INTO financial_transactions
      (type, category, source_type, source_id, amount, currency, exchange_rate, amount_try, transaction_date, description, reference_no, created_at, updated_at)
    VALUES ('expense', ?, 'expense', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    expense.category,
    expense.id,
    expense.amount,
    expense.currency,
    expense.exchange_rate,
    expense.amount_try,
    expense.expense_date,
    expense.description,
    expense.expense_no,
    now(), now()
  )
}

function reverseTransaction(db, expenseId) {
  db.prepare(`UPDATE financial_transactions SET deleted_at = ? WHERE source_type = 'expense' AND source_id = ? AND deleted_at IS NULL`)
    .run(now(), expenseId)
}

// ── Purchase & Sale Integration ──────────────────────────────────────────────

function refreshPurchaseTotals(db, purchaseId) {
  if (!purchaseId) return
  const purchaseExp = db.prepare(
    `SELECT COALESCE(SUM(amount_try),0) as t FROM purchase_expenses WHERE purchase_id = ? AND deleted_at IS NULL`
  ).get(purchaseId)?.t || 0
  const generalExp = db.prepare(
    `SELECT COALESCE(SUM(amount_try),0) as t FROM expenses WHERE related_purchase_id = ? AND deleted_at IS NULL AND status = 'active'`
  ).get(purchaseId)?.t || 0
  const totalExp = purchaseExp + generalExp
  const purchase = db.prepare('SELECT purchase_price_try FROM purchases WHERE id = ?').get(purchaseId)
  if (!purchase) return
  const totalCost = (purchase.purchase_price_try || 0) + totalExp
  db.prepare('UPDATE purchases SET total_expenses_try = ?, total_cost_try = ?, updated_at = ? WHERE id = ?')
    .run(totalExp, totalCost, now(), purchaseId)
}

function refreshSaleTotals(db, saleId) {
  if (!saleId) return
  const saleExpTable = db.prepare(
    `SELECT COALESCE(SUM(amount_try),0) as t FROM sale_expenses WHERE sale_id = ? AND deleted_at IS NULL`
  ).get(saleId)?.t || 0
  const generalExp = db.prepare(
    `SELECT COALESCE(SUM(amount_try),0) as t FROM expenses WHERE related_sale_id = ? AND deleted_at IS NULL AND status = 'active'`
  ).get(saleId)?.t || 0
  const total = saleExpTable + generalExp
  const sale = db.prepare('SELECT sale_price_try, total_cost_try FROM sales WHERE id = ?').get(saleId)
  if (!sale) return
  const netSale = (sale.sale_price_try || 0) - total
  const netProfit = netSale - (sale.total_cost_try || 0)
  db.prepare('UPDATE sales SET total_sale_expenses_try = ?, net_sale_try = ?, net_profit_try = ?, updated_at = ? WHERE id = ?')
    .run(total, netSale, netProfit, now(), saleId)
}

// ── Summary ──────────────────────────────────────────────────────────────────

function getSummary(req, res) {
  const db = getDb()
  const t = today()
  const yearStart = t.slice(0, 4) + '-01-01'
  const monthStart = t.slice(0, 7) + '-01'

  const base = `FROM expenses WHERE deleted_at IS NULL AND status = 'active'`
  const todayTotal = db.prepare(`SELECT COALESCE(SUM(amount_try),0) as v ${base} AND expense_date = ?`).get(t)?.v || 0
  const monthTotal = db.prepare(`SELECT COALESCE(SUM(amount_try),0) as v ${base} AND expense_date >= ?`).get(monthStart)?.v || 0
  const yearTotal  = db.prepare(`SELECT COALESCE(SUM(amount_try),0) as v ${base} AND expense_date >= ?`).get(yearStart)?.v || 0

  const daysInYear = Math.ceil((new Date(t) - new Date(yearStart)) / 86400000) + 1
  const avgDaily = daysInYear > 0 ? yearTotal / daysInYear : 0

  const byCategory = db.prepare(
    `SELECT category, COALESCE(SUM(amount_try),0) as total, COUNT(*) as cnt ${base} AND expense_date >= ? GROUP BY category ORDER BY total DESC`
  ).all(yearStart)

  const byOwner = db.prepare(
    `SELECT expense_owner, COALESCE(SUM(amount_try),0) as total, COUNT(*) as cnt ${base} GROUP BY expense_owner`
  ).all()

  res.json({ success: true, data: { today: todayTotal, month: monthTotal, year: yearTotal, avg_daily: Math.round(avgDaily * 100) / 100, by_category: byCategory, by_owner: byOwner } })
}

// ── List ──────────────────────────────────────────────────────────────────────

function listExpenses(req, res) {
  const db = getDb()
  const { page = 1, category, owner, payment_source, date_from, date_to, asset_id, search } = req.query
  const offset = (Number(page) - 1) * PAGE_SIZE

  const conditions = ['e.deleted_at IS NULL']
  const params = []

  if (category) { conditions.push('e.category = ?'); params.push(category) }
  if (owner) { conditions.push('e.expense_owner = ?'); params.push(owner) }
  if (payment_source) { conditions.push('e.payment_source = ?'); params.push(payment_source) }
  if (date_from) { conditions.push('e.expense_date >= ?'); params.push(date_from) }
  if (date_to) { conditions.push('e.expense_date <= ?'); params.push(date_to) }
  if (asset_id) { conditions.push('e.related_asset_id = ?'); params.push(Number(asset_id)) }
  if (search) { conditions.push('(e.description LIKE ? OR e.expense_no LIKE ? OR e.notes LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`) }

  const where = conditions.join(' AND ')
  const total = db.prepare(`SELECT COUNT(*) as n FROM expenses e WHERE ${where}`).get(...params)?.n || 0
  const items = db.prepare(`
    SELECT e.*,
      a.name as asset_name_ref,
      p.purchase_no,
      s.sale_no
    FROM expenses e
    LEFT JOIN assets a ON a.id = e.related_asset_id AND a.deleted_at IS NULL
    LEFT JOIN purchases p ON p.id = e.related_purchase_id AND p.deleted_at IS NULL
    LEFT JOIN sales s ON s.id = e.related_sale_id AND s.deleted_at IS NULL
    WHERE ${where}
    ORDER BY e.expense_date DESC, e.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, PAGE_SIZE, offset)

  const summary = db.prepare(`SELECT COALESCE(SUM(amount_try),0) as total FROM expenses e WHERE ${where}`).get(...params)

  res.json({ success: true, data: { items, total, page: Number(page), total_pages: Math.ceil(total / PAGE_SIZE), summary: { total_try: summary?.total || 0 } } })
}

// ── Get Expense ───────────────────────────────────────────────────────────────

function getExpense(req, res) {
  const db = getDb()
  const expense = db.prepare(`
    SELECT e.*,
      a.name as asset_name_ref,
      p.purchase_no, p.asset_name as purchase_asset_name,
      s.sale_no, s.asset_name as sale_asset_name
    FROM expenses e
    LEFT JOIN assets a ON a.id = e.related_asset_id
    LEFT JOIN purchases p ON p.id = e.related_purchase_id
    LEFT JOIN sales s ON s.id = e.related_sale_id
    WHERE e.id = ? AND e.deleted_at IS NULL
  `).get(Number(req.params.id))

  if (!expense) return res.status(404).json({ success: false, message: 'Gider bulunamadı' })

  const documents = db.prepare('SELECT * FROM expense_documents WHERE expense_id = ? AND deleted_at IS NULL').all(expense.id)
  const tags = db.prepare('SELECT tag FROM expense_tags WHERE expense_id = ? AND deleted_at IS NULL').all(expense.id).map(t => t.tag)

  res.json({ success: true, data: { ...expense, documents, tags } })
}

// ── Create Expense ────────────────────────────────────────────────────────────

function createExpense(req, res) {
  const db = getDb()
  const {
    expense_date, category, sub_category, description,
    amount, currency = 'TRY', exchange_rate = 1,
    payment_source = 'other', payment_source_id, payment_source_name,
    expense_owner = 'company',
    related_asset_id, related_asset_name,
    related_purchase_id, related_sale_id,
    tax_included = 0, vat_rate = 0, notes, tags = [],
  } = req.body

  if (!expense_date || !category || !description || !amount) {
    return res.status(400).json({ success: false, message: 'Zorunlu alanlar eksik' })
  }

  const amount_try = toTry(amount, exchange_rate)

  const do_create = db.transaction(() => {
    const expense_no = generateExpenseNo(db)

    const result = db.prepare(`
      INSERT INTO expenses
        (expense_no, expense_date, category, sub_category, description,
         amount, currency, exchange_rate, amount_try,
         payment_source, payment_source_id, payment_source_name,
         expense_owner, related_asset_id, related_asset_name,
         related_purchase_id, related_sale_id,
         tax_included, vat_rate, notes, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'active',?,?)
    `).run(
      expense_no, expense_date, category, sub_category || null, description,
      Number(amount), currency, Number(exchange_rate), amount_try,
      payment_source, payment_source_id || null, payment_source_name || null,
      expense_owner, related_asset_id || null, related_asset_name || null,
      related_purchase_id || null, related_sale_id || null,
      tax_included ? 1 : 0, Number(vat_rate) || 0, notes || null,
      now(), now()
    )

    const expenseId = result.lastInsertRowid
    const expense = { id: expenseId, expense_no, amount, currency, exchange_rate, amount_try, expense_date, description, category, payment_source, payment_source_id, expense_owner }

    // Tags
    if (Array.isArray(tags) && tags.length) {
      const tagStmt = db.prepare('INSERT INTO expense_tags (expense_id, tag, created_at, updated_at) VALUES (?,?,?,?)')
      tags.forEach(tag => tagStmt.run(expenseId, tag, now(), now()))
    }

    // Financial side effects
    applyPaymentSource(db, expense)
    logTransaction(db, expense)

    // Purchase / sale integration
    if (related_purchase_id) refreshPurchaseTotals(db, related_purchase_id)
    if (related_sale_id) refreshSaleTotals(db, related_sale_id)

    // Activity log for asset
    if (related_asset_id) {
      db.prepare(`INSERT INTO activities (asset_id, type, title, amount, currency, note, activity_date, created_at, updated_at)
        VALUES (?, 'expense', ?, ?, ?, ?, ?, ?, ?)`
      ).run(related_asset_id, `Gider: ${description}`, amount_try, 'TRY', `${category} — ${expense_no}`, expense_date, now(), now())
    }

    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId)
  })

  const created = do_create()
  res.status(201).json({ success: true, data: created })
}

// ── Update Expense ────────────────────────────────────────────────────────────

function updateExpense(req, res) {
  const db = getDb()
  const id = Number(req.params.id)
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!existing) return res.status(404).json({ success: false, message: 'Gider bulunamadı' })
  if (existing.status === 'void') return res.status(400).json({ success: false, message: 'İptal edilmiş gider düzenlenemez' })

  const { category, sub_category, description, notes, expense_date, tags = [] } = req.body

  db.prepare(`UPDATE expenses SET category=?, sub_category=?, description=?, notes=?, expense_date=?, updated_at=? WHERE id=?`)
    .run(category ?? existing.category, sub_category ?? existing.sub_category, description ?? existing.description,
      notes ?? existing.notes, expense_date ?? existing.expense_date, now(), id)

  if (tags.length) {
    db.prepare('UPDATE expense_tags SET deleted_at = ? WHERE expense_id = ?').run(now(), id)
    const tagStmt = db.prepare('INSERT INTO expense_tags (expense_id, tag, created_at, updated_at) VALUES (?,?,?,?)')
    tags.forEach(t => tagStmt.run(id, t, now(), now()))
  }

  res.json({ success: true, data: db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) })
}

// ── Delete (Void) Expense ─────────────────────────────────────────────────────

function deleteExpense(req, res) {
  const db = getDb()
  const id = Number(req.params.id)
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!expense) return res.status(404).json({ success: false, message: 'Gider bulunamadı' })

  db.transaction(() => {
    // Reverse financial side effects
    applyPaymentSource(db, expense, -1)
    reverseTransaction(db, id)

    // Reverse purchase/sale totals
    if (expense.related_purchase_id) {
      db.prepare('UPDATE expenses SET deleted_at = ?, status = ? WHERE id = ?').run(now(), 'void', id)
      refreshPurchaseTotals(db, expense.related_purchase_id)
    }
    if (expense.related_sale_id) {
      db.prepare('UPDATE expenses SET deleted_at = ? WHERE id = ?').run(now(), id)
      refreshSaleTotals(db, expense.related_sale_id)
    }

    db.prepare('UPDATE expenses SET deleted_at = ?, status = ?, updated_at = ? WHERE id = ?').run(now(), 'void', now(), id)
  })()

  res.json({ success: true, data: null })
}

// ── Documents ─────────────────────────────────────────────────────────────────

function uploadDocument(req, res) {
  const db = getDb()
  const expenseId = Number(req.params.id)
  if (!db.prepare('SELECT id FROM expenses WHERE id = ? AND deleted_at IS NULL').get(expenseId)) {
    return res.status(404).json({ success: false, message: 'Gider bulunamadı' })
  }
  if (!req.file) return res.status(400).json({ success: false, message: 'Dosya yüklenmedi' })

  const { doc_type = 'other' } = req.body
  const result = db.prepare(`
    INSERT INTO expense_documents (expense_id, doc_type, original_name, file_path, created_at, updated_at)
    VALUES (?,?,?,?,?,?)
  `).run(expenseId, doc_type, req.file.originalname, req.file.filename, now(), now())

  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM expense_documents WHERE id = ?').get(result.lastInsertRowid) })
}

function deleteDocument(req, res) {
  const db = getDb()
  db.prepare('UPDATE expense_documents SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL').run(now(), Number(req.params.docId))
  res.json({ success: true, data: null })
}

// ── Categories ───────────────────────────────────────────────────────────────

function listCategories(req, res) {
  const db = getDb()
  const cats = db.prepare('SELECT * FROM expense_categories WHERE deleted_at IS NULL ORDER BY sort_order, name').all()
  res.json({ success: true, data: cats })
}

// ── Reports ──────────────────────────────────────────────────────────────────

function getReports(req, res) {
  const db = getDb()
  const { year = new Date().getFullYear() } = req.query
  const yearStr = String(year)

  const byCategory = db.prepare(`
    SELECT category, COALESCE(SUM(amount_try),0) as total, COUNT(*) as cnt
    FROM expenses
    WHERE deleted_at IS NULL AND status='active' AND expense_date LIKE ?
    GROUP BY category ORDER BY total DESC
  `).all(`${yearStr}%`)

  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', expense_date) as month,
           COALESCE(SUM(amount_try),0) as total,
           COUNT(*) as cnt
    FROM expenses
    WHERE deleted_at IS NULL AND status='active' AND expense_date LIKE ?
    GROUP BY month ORDER BY month
  `).all(`${yearStr}%`)

  const byOwner = db.prepare(`
    SELECT expense_owner, COALESCE(SUM(amount_try),0) as total, COUNT(*) as cnt
    FROM expenses
    WHERE deleted_at IS NULL AND status='active' AND expense_date LIKE ?
    GROUP BY expense_owner
  `).all(`${yearStr}%`)

  const byPaymentSource = db.prepare(`
    SELECT payment_source, COALESCE(SUM(amount_try),0) as total, COUNT(*) as cnt
    FROM expenses
    WHERE deleted_at IS NULL AND status='active' AND expense_date LIKE ?
    GROUP BY payment_source ORDER BY total DESC
  `).all(`${yearStr}%`)

  const byAsset = db.prepare(`
    SELECT e.related_asset_id, COALESCE(e.related_asset_name, a.name, 'Bilinmeyen') as asset_name,
           COALESCE(SUM(e.amount_try),0) as total, COUNT(*) as cnt
    FROM expenses e
    LEFT JOIN assets a ON a.id = e.related_asset_id
    WHERE e.deleted_at IS NULL AND e.status='active' AND e.expense_date LIKE ? AND e.related_asset_id IS NOT NULL
    GROUP BY e.related_asset_id ORDER BY total DESC
    LIMIT 10
  `).all(`${yearStr}%`)

  const yearTotal = db.prepare(`SELECT COALESCE(SUM(amount_try),0) as v FROM expenses WHERE deleted_at IS NULL AND status='active' AND expense_date LIKE ?`).get(`${yearStr}%`)?.v || 0

  res.json({ success: true, data: { year: yearStr, year_total: yearTotal, by_category: byCategory, monthly, by_owner: byOwner, by_payment_source: byPaymentSource, by_asset: byAsset } })
}

// ── Context helpers for form selects ─────────────────────────────────────────

function getFormContext(req, res) {
  const db = getDb()
  const assets = db.prepare(`SELECT id, name, type FROM assets WHERE deleted_at IS NULL AND status != 'sold' ORDER BY name`).all()
  const purchases = db.prepare(`SELECT id, purchase_no, asset_name FROM purchases WHERE deleted_at IS NULL AND status = 'completed' ORDER BY purchase_no DESC LIMIT 50`).all()
  const sales = db.prepare(`SELECT id, sale_no, asset_name FROM sales WHERE deleted_at IS NULL ORDER BY sale_no DESC LIMIT 50`).all()
  const cashAccounts = db.prepare(`SELECT id, name FROM cash_accounts WHERE deleted_at IS NULL AND status='active'`).all()
  const bankAccounts = db.prepare(`SELECT id, bank_name as name FROM bank_accounts WHERE deleted_at IS NULL AND status='active'`).all()
  const creditCards = db.prepare(`SELECT id, card_name as name, bank FROM credit_cards WHERE deleted_at IS NULL AND status='active'`).all()
  res.json({ success: true, data: { assets, purchases, sales, cash_accounts: cashAccounts, bank_accounts: bankAccounts, credit_cards: creditCards } })
}

module.exports = {
  getSummary, listExpenses, getExpense, createExpense, updateExpense, deleteExpense,
  uploadDocument, deleteDocument, listCategories, getReports, getFormContext,
}
