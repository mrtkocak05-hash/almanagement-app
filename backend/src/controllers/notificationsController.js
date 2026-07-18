const { getDb } = require('../database/connection')

const TYPE_ICONS = { info: 'ℹ️', success: '✅', warning: '⚠️', critical: '🚨', ai: '🤖' }

function list(req, res) {
  const db = getDb()
  const userId = req.user?.id
  const { type, unread_only, limit = 50 } = req.query

  let sql = `SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL)`
  const params = [userId]
  if (type) { sql += ` AND type = ?`; params.push(type) }
  if (unread_only === 'true') { sql += ` AND is_read = 0` }
  sql += ` ORDER BY created_at DESC LIMIT ?`
  params.push(parseInt(limit))

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
}

function unreadCount(req, res) {
  const db = getDb()
  const row = db.prepare(`SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`).get(req.user?.id)
  res.json({ success: true, data: { count: row.count } })
}

function markRead(req, res) {
  const db = getDb()
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`).run(req.params.id)
  res.json({ success: true, data: null })
}

function markAllRead(req, res) {
  const db = getDb()
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`).run(req.user?.id)
  res.json({ success: true, data: null })
}

function createNotification({ userId = null, type = 'info', title, body = null, link = null, category = 'system' }) {
  try {
    const db = getDb()
    const result = db.prepare(`INSERT INTO notifications (user_id, type, title, body, link, category) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(userId, type, title, body, link, category)
    return result.lastInsertRowid
  } catch (_) { return null }
}

function deleteNotification(req, res) {
  const db = getDb()
  db.prepare(`DELETE FROM notifications WHERE id = ?`).run(req.params.id)
  res.json({ success: true, data: null })
}

module.exports = { list, unreadCount, markRead, markAllRead, createNotification, deleteNotification }
