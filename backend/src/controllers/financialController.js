const { getDb } = require('../database/connection')

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0]
const today = () => new Date().toISOString().split('T')[0]
const toTry = (amount, rate) => Math.round((amount || 0) * (rate || 1) * 100) / 100

// ── Summary ───────────────────────────────────────────────────────────────────

function getSummary(req, res) {
  const db = getDb()
  const rates = db.prepare('SELECT usd_try, gold_gram_try FROM exchange_rates WHERE id = 1').get() || { usd_try: 0, gold_gram_try: 0 }

  function toTryRate(currency) {
    if (currency === 'USD') return rates.usd_try || 1
    if (currency === 'EUR') return (rates.usd_try || 1) * 1.08
    if (currency === 'Gold') return rates.gold_gram_try || 1
    return 1
  }

  const cashAccounts = db.prepare('SELECT balance, currency FROM cash_accounts WHERE deleted_at IS NULL AND status = ?').all('active')
  const bankAccounts = db.prepare('SELECT current_balance, currency FROM bank_accounts WHERE deleted_at IS NULL AND status = ?').all('active')

  const totalCash = cashAccounts.reduce((s, a) => s + (a.balance || 0) * toTryRate(a.currency), 0)
  const totalBank = bankAccounts.reduce((s, a) => s + (a.current_balance || 0) * toTryRate(a.currency), 0)

  const totalReceivable = db.prepare(
    `SELECT COALESCE(SUM(amount_try - collected_amount), 0) as t FROM receivables WHERE deleted_at IS NULL AND status != 'collected'`
  ).get().t || 0

  const totalPayable = db.prepare(
    `SELECT COALESCE(SUM(amount_try - paid_amount), 0) as t FROM payables WHERE deleted_at IS NULL AND status != 'paid'`
  ).get().t || 0

  const totalCreditDebt = db.prepare(
    'SELECT COALESCE(SUM(current_debt), 0) as t FROM credit_cards WHERE deleted_at IS NULL AND status = ?'
  ).get('active').t || 0

  const capital = db.prepare('SELECT amount_try FROM capital WHERE id = 1').get()

  const availableCash = totalCash + totalBank
  const netCashPosition = availableCash + totalReceivable - totalPayable - totalCreditDebt

  const recentTransactions = db.prepare(
    'SELECT * FROM financial_transactions WHERE deleted_at IS NULL ORDER BY transaction_date DESC, created_at DESC LIMIT 15'
  ).all()

  res.json({
    success: true,
    data: {
      current_capital: capital?.amount_try || 0,
      available_cash: totalCash,
      banks_total: totalBank,
      receivables_total: totalReceivable,
      payables_total: totalPayable,
      credit_debt: totalCreditDebt,
      net_cash_position: netCashPosition,
      recent_transactions: recentTransactions,
    },
  })
}

// ── Cash Accounts ─────────────────────────────────────────────────────────────

function listCashAccounts(req, res) {
  const db = getDb()
  res.json({ success: true, data: db.prepare('SELECT * FROM cash_accounts WHERE deleted_at IS NULL ORDER BY name').all() })
}

function createCashAccount(req, res) {
  const db = getDb()
  const { name, currency = 'TRY', balance = 0, description, status = 'active' } = req.body
  const ts = now()
  if (!name) return res.status(400).json({ success: false, message: 'Kasa adı zorunludur' })

  const r = db.prepare(
    'INSERT INTO cash_accounts (name, currency, balance, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, currency, balance || 0, description || null, status, ts, ts)

  if ((balance || 0) > 0) {
    db.prepare(
      `INSERT INTO financial_transactions (type, category, source_type, source_id, amount, currency, exchange_rate, amount_try, transaction_date, description, created_at, updated_at)
       VALUES ('income', 'Açılış Bakiyesi', 'cash', ?, ?, ?, 1, ?, ?, ?, ?, ?)`
    ).run(r.lastInsertRowid, balance, currency, balance, today(), `${name} — açılış bakiyesi`, ts, ts)
  }

  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM cash_accounts WHERE id = ?').get(r.lastInsertRowid) })
}

function updateCashAccount(req, res) {
  const db = getDb()
  const { name, description, status } = req.body
  const ts = now()
  db.prepare('UPDATE cash_accounts SET name = COALESCE(?, name), description = COALESCE(?, description), status = COALESCE(?, status), updated_at = ? WHERE id = ? AND deleted_at IS NULL')
    .run(name || null, description !== undefined ? description : null, status || null, ts, req.params.id)
  res.json({ success: true, data: db.prepare('SELECT * FROM cash_accounts WHERE id = ?').get(req.params.id) })
}

function deleteCashAccount(req, res) {
  const db = getDb()
  db.prepare('UPDATE cash_accounts SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), req.params.id)
  res.json({ success: true })
}

function adjustCashBalance(req, res) {
  const db = getDb()
  const { amount, type = 'income', description } = req.body
  const ts = now()
  const acct = db.prepare('SELECT * FROM cash_accounts WHERE id = ? AND deleted_at IS NULL').get(req.params.id)
  if (!acct) return res.status(404).json({ success: false, message: 'Kasa bulunamadı' })

  const change = type === 'expense' ? -Math.abs(amount) : Math.abs(amount)
  db.prepare('UPDATE cash_accounts SET balance = balance + ?, updated_at = ? WHERE id = ?').run(change, ts, acct.id)
  db.prepare(
    `INSERT INTO financial_transactions (type, category, source_type, source_id, amount, currency, exchange_rate, amount_try, transaction_date, description, created_at, updated_at)
     VALUES (?, 'Kasa Hareketi', 'cash', ?, ?, ?, 1, ?, ?, ?, ?, ?)`
  ).run(type, acct.id, Math.abs(amount), acct.currency, Math.abs(amount), today(), description || null, ts, ts)

  res.json({ success: true, data: db.prepare('SELECT * FROM cash_accounts WHERE id = ?').get(acct.id) })
}

// ── Bank Accounts ─────────────────────────────────────────────────────────────

function listBankAccounts(req, res) {
  const db = getDb()
  res.json({ success: true, data: db.prepare('SELECT * FROM bank_accounts WHERE deleted_at IS NULL ORDER BY bank_name').all() })
}

function createBankAccount(req, res) {
  const db = getDb()
  const { bank_name, branch, iban, currency = 'TRY', opening_balance = 0, status = 'active' } = req.body
  const ts = now()
  if (!bank_name) return res.status(400).json({ success: false, message: 'Banka adı zorunludur' })

  const r = db.prepare(
    'INSERT INTO bank_accounts (bank_name, branch, iban, currency, opening_balance, current_balance, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(bank_name, branch || null, iban || null, currency, opening_balance || 0, opening_balance || 0, status, ts, ts)

  if ((opening_balance || 0) > 0) {
    db.prepare(
      `INSERT INTO financial_transactions (type, category, source_type, source_id, amount, currency, exchange_rate, amount_try, transaction_date, description, created_at, updated_at)
       VALUES ('income', 'Açılış Bakiyesi', 'bank', ?, ?, ?, 1, ?, ?, ?, ?, ?)`
    ).run(r.lastInsertRowid, opening_balance, currency, opening_balance, today(), `${bank_name} — açılış bakiyesi`, ts, ts)
  }

  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(r.lastInsertRowid) })
}

function updateBankAccount(req, res) {
  const db = getDb()
  const ts = now()
  const body = req.body
  const skip = new Set(['id', 'created_at', 'deleted_at', 'opening_balance'])
  const cols = Object.keys(body).filter(k => !skip.has(k))
  if (cols.length === 0) return res.json({ success: true })
  const set = cols.map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE bank_accounts SET ${set}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
    .run(...cols.map(k => body[k] ?? null), ts, req.params.id)
  res.json({ success: true, data: db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(req.params.id) })
}

function deleteBankAccount(req, res) {
  const db = getDb()
  db.prepare('UPDATE bank_accounts SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), req.params.id)
  res.json({ success: true })
}

function adjustBankBalance(req, res) {
  const db = getDb()
  const { amount, type = 'income', description } = req.body
  const ts = now()
  const acct = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND deleted_at IS NULL').get(req.params.id)
  if (!acct) return res.status(404).json({ success: false, message: 'Banka hesabı bulunamadı' })

  const change = type === 'expense' ? -Math.abs(amount) : Math.abs(amount)
  db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?').run(change, ts, acct.id)
  db.prepare(
    `INSERT INTO financial_transactions (type, category, source_type, source_id, amount, currency, exchange_rate, amount_try, transaction_date, description, created_at, updated_at)
     VALUES (?, 'Banka Hareketi', 'bank', ?, ?, ?, 1, ?, ?, ?, ?, ?)`
  ).run(type, acct.id, Math.abs(amount), acct.currency, Math.abs(amount), today(), description || null, ts, ts)

  res.json({ success: true, data: db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(acct.id) })
}

// ── Credit Cards ──────────────────────────────────────────────────────────────

function listCreditCards(req, res) {
  const db = getDb()
  res.json({ success: true, data: db.prepare('SELECT * FROM credit_cards WHERE deleted_at IS NULL ORDER BY bank').all() })
}

function createCreditCard(req, res) {
  const db = getDb()
  const { bank, card_name, limit_amount = 0, available_limit, current_debt = 0, due_date, statement_date, status = 'active' } = req.body
  const ts = now()
  if (!bank || !card_name) return res.status(400).json({ success: false, message: 'Banka ve kart adı zorunludur' })
  const avail = available_limit !== undefined ? available_limit : (limit_amount - current_debt)
  const r = db.prepare(
    'INSERT INTO credit_cards (bank, card_name, limit_amount, available_limit, current_debt, due_date, statement_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(bank, card_name, limit_amount, avail, current_debt, due_date || null, statement_date || null, status, ts, ts)
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM credit_cards WHERE id = ?').get(r.lastInsertRowid) })
}

function updateCreditCard(req, res) {
  const db = getDb()
  const ts = now()
  const body = req.body
  const skip = new Set(['id', 'created_at', 'deleted_at'])
  const cols = Object.keys(body).filter(k => !skip.has(k))
  if (cols.length === 0) return res.json({ success: true })
  const set = cols.map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE credit_cards SET ${set}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
    .run(...cols.map(k => body[k] ?? null), ts, req.params.id)
  res.json({ success: true, data: db.prepare('SELECT * FROM credit_cards WHERE id = ?').get(req.params.id) })
}

function deleteCreditCard(req, res) {
  const db = getDb()
  db.prepare('UPDATE credit_cards SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), req.params.id)
  res.json({ success: true })
}

// ── Capital Movements ─────────────────────────────────────────────────────────

function listCapitalMovements(req, res) {
  const db = getDb()
  const { page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)
  const total = db.prepare('SELECT COUNT(*) as c FROM capital_movements WHERE deleted_at IS NULL').get().c
  const items = db.prepare('SELECT * FROM capital_movements WHERE deleted_at IS NULL ORDER BY movement_date DESC, created_at DESC LIMIT ? OFFSET ?').all(Number(limit), offset)
  res.json({ success: true, data: { items, total, page: Number(page), total_pages: Math.ceil(total / Number(limit)) } })
}

function createCapitalMovement(req, res) {
  const db = getDb()
  const { type = 'other', movement_date, amount, currency = 'TRY', exchange_rate = 1, description } = req.body
  const ts = now()
  if (!amount || !movement_date) return res.status(400).json({ success: false, message: 'Tutar ve tarih zorunludur' })

  const amount_try = toTry(amount, exchange_rate)
  const r = db.prepare(
    'INSERT INTO capital_movements (type, movement_date, amount, currency, exchange_rate, amount_try, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(type, movement_date, amount, currency, exchange_rate, amount_try, description || null, ts, ts)

  const POSITIVE_TYPES = ['increase', 'owner_contribution', 'partner_contribution', 'investment_return']
  const change = POSITIVE_TYPES.includes(type) ? amount_try : -amount_try
  db.prepare('UPDATE capital SET amount_try = amount_try + ?, updated_at = ? WHERE id = 1').run(change, ts)

  db.prepare(
    `INSERT INTO financial_transactions (type, category, source_type, source_id, amount, currency, exchange_rate, amount_try, transaction_date, description, created_at, updated_at)
     VALUES ('capital', ?, 'capital_movements', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(type, r.lastInsertRowid, amount, currency, exchange_rate, amount_try, movement_date, description || null, ts, ts)

  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM capital_movements WHERE id = ?').get(r.lastInsertRowid) })
}

function deleteCapitalMovement(req, res) {
  const db = getDb()
  const ts = now()
  const m = db.prepare('SELECT * FROM capital_movements WHERE id = ? AND deleted_at IS NULL').get(req.params.id)
  if (!m) return res.status(404).json({ success: false, message: 'Hareket bulunamadı' })
  const POSITIVE_TYPES = ['increase', 'owner_contribution', 'partner_contribution', 'investment_return']
  const reverse = POSITIVE_TYPES.includes(m.type) ? -m.amount_try : m.amount_try
  db.prepare('UPDATE capital SET amount_try = amount_try + ?, updated_at = ? WHERE id = 1').run(reverse, ts)
  db.prepare('UPDATE capital_movements SET deleted_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, req.params.id)
  res.json({ success: true })
}

// ── Money Transfers ───────────────────────────────────────────────────────────

function listTransfers(req, res) {
  const db = getDb()
  const { page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)
  const total = db.prepare('SELECT COUNT(*) as c FROM money_transfers WHERE deleted_at IS NULL').get().c
  const items = db.prepare('SELECT * FROM money_transfers WHERE deleted_at IS NULL ORDER BY transfer_date DESC, created_at DESC LIMIT ? OFFSET ?').all(Number(limit), offset)
  res.json({ success: true, data: { items, total, page: Number(page), total_pages: Math.ceil(total / Number(limit)) } })
}

function createTransfer(req, res) {
  const db = getDb()
  const { from_type, from_id, to_type, to_id, amount, currency = 'TRY', exchange_rate = 1, transfer_date, description } = req.body
  const ts = now()
  if (!from_type || !from_id || !to_type || !to_id || !amount) {
    return res.status(400).json({ success: false, message: 'Kaynak, hedef ve tutar zorunludur' })
  }

  const getAccountName = (type, id) => {
    if (type === 'cash') return db.prepare('SELECT name FROM cash_accounts WHERE id = ?').get(id)?.name || ''
    if (type === 'bank') return db.prepare('SELECT bank_name FROM bank_accounts WHERE id = ?').get(id)?.bank_name || ''
    return ''
  }

  const fromName = getAccountName(from_type, from_id)
  const toName = getAccountName(to_type, to_id)
  const amount_try = toTry(amount, exchange_rate)

  const doTransfer = db.transaction(() => {
    if (from_type === 'cash') db.prepare('UPDATE cash_accounts SET balance = balance - ?, updated_at = ? WHERE id = ?').run(amount, ts, from_id)
    else if (from_type === 'bank') db.prepare('UPDATE bank_accounts SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?').run(amount, ts, from_id)

    if (to_type === 'cash') db.prepare('UPDATE cash_accounts SET balance = balance + ?, updated_at = ? WHERE id = ?').run(amount, ts, to_id)
    else if (to_type === 'bank') db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?').run(amount, ts, to_id)

    const r = db.prepare(
      'INSERT INTO money_transfers (from_type, from_id, from_name, to_type, to_id, to_name, amount, currency, exchange_rate, amount_try, transfer_date, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(from_type, from_id, fromName, to_type, to_id, toName, amount, currency, exchange_rate, amount_try, transfer_date || today(), description || null, ts, ts)

    db.prepare(
      `INSERT INTO financial_transactions (type, category, source_type, source_id, amount, currency, exchange_rate, amount_try, transaction_date, description, created_at, updated_at)
       VALUES ('transfer', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(`${fromName} → ${toName}`, from_type, from_id, amount, currency, exchange_rate, amount_try, transfer_date || today(), description || null, ts, ts)

    return r.lastInsertRowid
  })

  try {
    const id = doTransfer()
    res.status(201).json({ success: true, data: db.prepare('SELECT * FROM money_transfers WHERE id = ?').get(id) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── Receivables ───────────────────────────────────────────────────────────────

function listReceivables(req, res) {
  const db = getDb()
  const { status, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)
  const where = status ? 'WHERE deleted_at IS NULL AND status = ?' : 'WHERE deleted_at IS NULL'
  const params = status ? [status] : []
  const total = db.prepare(`SELECT COUNT(*) as c FROM receivables ${where}`).get(...params).c
  const items = db.prepare(`SELECT * FROM receivables ${where} ORDER BY due_date ASC, created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset)
  const summary = db.prepare(`SELECT COALESCE(SUM(amount_try),0) as total, COALESCE(SUM(collected_amount),0) as collected, COALESCE(SUM(amount_try-collected_amount),0) as remaining FROM receivables WHERE deleted_at IS NULL AND status != 'collected'`).get()
  res.json({ success: true, data: { items, total, page: Number(page), total_pages: Math.ceil(total / Number(limit)), summary } })
}

function createReceivable(req, res) {
  const db = getDb()
  const { customer, amount, currency = 'TRY', exchange_rate = 1, due_date, description } = req.body
  const ts = now()
  if (!customer || !amount) return res.status(400).json({ success: false, message: 'Müşteri ve tutar zorunludur' })
  const amount_try = toTry(amount, exchange_rate)
  const r = db.prepare(
    `INSERT INTO receivables (customer, amount, currency, exchange_rate, amount_try, due_date, collected_amount, status, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?, ?)`
  ).run(customer, amount, currency, exchange_rate, amount_try, due_date || null, description || null, ts, ts)
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM receivables WHERE id = ?').get(r.lastInsertRowid) })
}

function collectReceivable(req, res) {
  const db = getDb()
  const { amount, cash_account_id, bank_account_id } = req.body
  const ts = now()
  const rec = db.prepare('SELECT * FROM receivables WHERE id = ? AND deleted_at IS NULL').get(req.params.id)
  if (!rec) return res.status(404).json({ success: false, message: 'Alacak bulunamadı' })

  const newCollected = (rec.collected_amount || 0) + Number(amount)
  const status = newCollected >= rec.amount_try ? 'collected' : 'partial'

  const doCollect = db.transaction(() => {
    db.prepare('UPDATE receivables SET collected_amount = ?, status = ?, updated_at = ? WHERE id = ?').run(newCollected, status, ts, rec.id)
    if (cash_account_id) db.prepare('UPDATE cash_accounts SET balance = balance + ?, updated_at = ? WHERE id = ?').run(amount, ts, cash_account_id)
    if (bank_account_id) db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?').run(amount, ts, bank_account_id)
    db.prepare(
      `INSERT INTO financial_transactions (type, category, source_type, source_id, amount, currency, exchange_rate, amount_try, transaction_date, description, created_at, updated_at)
       VALUES ('income', 'Alacak Tahsilatı', 'receivable', ?, ?, 'TRY', 1, ?, ?, ?, ?, ?)`
    ).run(rec.id, amount, amount, today(), `${rec.customer} — tahsilat`, ts, ts)
  })

  doCollect()
  res.json({ success: true, data: db.prepare('SELECT * FROM receivables WHERE id = ?').get(rec.id) })
}

function deleteReceivable(req, res) {
  const db = getDb()
  db.prepare('UPDATE receivables SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), req.params.id)
  res.json({ success: true })
}

// ── Payables ──────────────────────────────────────────────────────────────────

function listPayables(req, res) {
  const db = getDb()
  const { status, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)
  const where = status ? 'WHERE deleted_at IS NULL AND status = ?' : 'WHERE deleted_at IS NULL'
  const params = status ? [status] : []
  const total = db.prepare(`SELECT COUNT(*) as c FROM payables ${where}`).get(...params).c
  const items = db.prepare(`SELECT * FROM payables ${where} ORDER BY due_date ASC, created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset)
  const summary = db.prepare(`SELECT COALESCE(SUM(amount_try),0) as total, COALESCE(SUM(paid_amount),0) as paid, COALESCE(SUM(amount_try-paid_amount),0) as remaining FROM payables WHERE deleted_at IS NULL AND status != 'paid'`).get()
  res.json({ success: true, data: { items, total, page: Number(page), total_pages: Math.ceil(total / Number(limit)), summary } })
}

function createPayable(req, res) {
  const db = getDb()
  const { supplier, amount, currency = 'TRY', exchange_rate = 1, due_date, description } = req.body
  const ts = now()
  if (!supplier || !amount) return res.status(400).json({ success: false, message: 'Tedarikçi ve tutar zorunludur' })
  const amount_try = toTry(amount, exchange_rate)
  const r = db.prepare(
    `INSERT INTO payables (supplier, amount, currency, exchange_rate, amount_try, due_date, paid_amount, status, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?, ?)`
  ).run(supplier, amount, currency, exchange_rate, amount_try, due_date || null, description || null, ts, ts)
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM payables WHERE id = ?').get(r.lastInsertRowid) })
}

function payPayable(req, res) {
  const db = getDb()
  const { amount, cash_account_id, bank_account_id } = req.body
  const ts = now()
  const payable = db.prepare('SELECT * FROM payables WHERE id = ? AND deleted_at IS NULL').get(req.params.id)
  if (!payable) return res.status(404).json({ success: false, message: 'Borç bulunamadı' })

  const newPaid = (payable.paid_amount || 0) + Number(amount)
  const status = newPaid >= payable.amount_try ? 'paid' : 'partial'

  const doPay = db.transaction(() => {
    db.prepare('UPDATE payables SET paid_amount = ?, status = ?, updated_at = ? WHERE id = ?').run(newPaid, status, ts, payable.id)
    if (cash_account_id) db.prepare('UPDATE cash_accounts SET balance = balance - ?, updated_at = ? WHERE id = ?').run(amount, ts, cash_account_id)
    if (bank_account_id) db.prepare('UPDATE bank_accounts SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?').run(amount, ts, bank_account_id)
    db.prepare(
      `INSERT INTO financial_transactions (type, category, source_type, source_id, amount, currency, exchange_rate, amount_try, transaction_date, description, created_at, updated_at)
       VALUES ('expense', 'Borç Ödemesi', 'payable', ?, ?, 'TRY', 1, ?, ?, ?, ?, ?)`
    ).run(payable.id, amount, amount, today(), `${payable.supplier} — ödeme`, ts, ts)
  })

  doPay()
  res.json({ success: true, data: db.prepare('SELECT * FROM payables WHERE id = ?').get(payable.id) })
}

function deletePayable(req, res) {
  const db = getDb()
  db.prepare('UPDATE payables SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), req.params.id)
  res.json({ success: true })
}

// ── Financial Transactions ────────────────────────────────────────────────────

function listTransactions(req, res) {
  const db = getDb()
  const { type, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)
  const where = type ? 'WHERE deleted_at IS NULL AND type = ?' : 'WHERE deleted_at IS NULL'
  const params = type ? [type] : []
  const total = db.prepare(`SELECT COUNT(*) as c FROM financial_transactions ${where}`).get(...params).c
  const items = db.prepare(`SELECT * FROM financial_transactions ${where} ORDER BY transaction_date DESC, created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(limit), offset)
  res.json({ success: true, data: { items, total, page: Number(page), total_pages: Math.ceil(total / Number(limit)) } })
}

function createTransaction(req, res) {
  const db = getDb()
  const { type = 'expense', category, source_type, source_id, amount, currency = 'TRY', exchange_rate = 1, transaction_date, description, reference_no } = req.body
  const ts = now()
  const amount_try = toTry(amount, exchange_rate)

  const r = db.prepare(
    `INSERT INTO financial_transactions (type, category, source_type, source_id, amount, currency, exchange_rate, amount_try, transaction_date, description, reference_no, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(type, category || null, source_type || null, source_id || null, amount, currency, exchange_rate, amount_try, transaction_date || today(), description || null, reference_no || null, ts, ts)

  if (source_type === 'cash' && source_id) {
    const change = type === 'income' ? amount : -amount
    db.prepare('UPDATE cash_accounts SET balance = balance + ?, updated_at = ? WHERE id = ?').run(change, ts, source_id)
  } else if (source_type === 'bank' && source_id) {
    const change = type === 'income' ? amount : -amount
    db.prepare('UPDATE bank_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?').run(change, ts, source_id)
  }

  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM financial_transactions WHERE id = ?').get(r.lastInsertRowid) })
}

module.exports = {
  getSummary,
  listCashAccounts, createCashAccount, updateCashAccount, deleteCashAccount, adjustCashBalance,
  listBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount, adjustBankBalance,
  listCreditCards, createCreditCard, updateCreditCard, deleteCreditCard,
  listCapitalMovements, createCapitalMovement, deleteCapitalMovement,
  listTransfers, createTransfer,
  listReceivables, createReceivable, collectReceivable, deleteReceivable,
  listPayables, createPayable, payPayable, deletePayable,
  listTransactions, createTransaction,
}
