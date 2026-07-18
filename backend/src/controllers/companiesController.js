const { getDb } = require('../database/connection')
const { createAuditLog } = require('../middleware/audit')

function list(req, res) {
  const db = getDb()
  const rows = db.prepare(`SELECT * FROM companies WHERE status != 'deleted' ORDER BY company_name`).all()
  res.json({ success: true, data: rows })
}

function getCompany(req, res) {
  const db = getDb()
  const row = db.prepare(`SELECT * FROM companies WHERE id = ?`).get(req.params.id)
  if (!row) return res.status(404).json({ success: false, message: 'Şirket bulunamadı.' })
  res.json({ success: true, data: row })
}

function createCompany(req, res) {
  const { company_name, tax_number, tax_office, phone, mail, address, logo, currency } = req.body
  if (!company_name) return res.status(400).json({ success: false, message: 'Şirket adı gereklidir.' })
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO companies (company_name, tax_number, tax_office, phone, mail, address, logo, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(company_name, tax_number ?? null, tax_office ?? null, phone ?? null, mail ?? null, address ?? null, logo ?? null, currency ?? 'TRY')
  createAuditLog({ userId: req.user?.id, userName: req.user?.full_name, action: 'create_company', module: 'companies', recordId: result.lastInsertRowid, req })
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
}

function updateCompany(req, res) {
  const db = getDb()
  const old = db.prepare(`SELECT * FROM companies WHERE id = ?`).get(req.params.id)
  if (!old) return res.status(404).json({ success: false, message: 'Şirket bulunamadı.' })
  const { company_name, tax_number, tax_office, phone, mail, address, logo, currency } = req.body
  db.prepare(`
    UPDATE companies SET company_name=?, tax_number=?, tax_office=?, phone=?, mail=?, address=?, logo=?, currency=?, updated_at=datetime('now')
    WHERE id = ?
  `).run(company_name ?? old.company_name, tax_number ?? old.tax_number, tax_office ?? old.tax_office,
    phone ?? old.phone, mail ?? old.mail, address ?? old.address, logo ?? old.logo, currency ?? old.currency, old.id)
  createAuditLog({ userId: req.user?.id, userName: req.user?.full_name, action: 'update_company', module: 'companies', recordId: old.id, oldValues: old, req })
  res.json({ success: true, data: { id: old.id } })
}

module.exports = { list, getCompany, createCompany, updateCompany }
