const { getDb } = require('../database/connection')

function list(req, res) {
  const db = getDb()
  const { module, action, user_id, date_from, date_to, limit = 100, offset = 0 } = req.query
  let sql = `SELECT * FROM audit_logs WHERE 1=1`
  const params = []
  if (module) { sql += ` AND module = ?`; params.push(module) }
  if (action) { sql += ` AND action = ?`; params.push(action) }
  if (user_id) { sql += ` AND user_id = ?`; params.push(user_id) }
  if (date_from) { sql += ` AND created_at >= ?`; params.push(date_from) }
  if (date_to) { sql += ` AND created_at <= ?`; params.push(date_to + 'T23:59:59') }
  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(parseInt(limit), parseInt(offset))
  const rows = db.prepare(sql).all(...params)
  const countRow = db.prepare(`SELECT COUNT(*) as total FROM audit_logs WHERE 1=1`).get()
  res.json({ success: true, data: { logs: rows, total: countRow.total } })
}

function getLog(req, res) {
  const db = getDb()
  const row = db.prepare(`SELECT * FROM audit_logs WHERE id = ?`).get(req.params.id)
  if (!row) return res.status(404).json({ success: false, message: 'Log bulunamadı.' })
  res.json({ success: true, data: row })
}

module.exports = { list, getLog }
