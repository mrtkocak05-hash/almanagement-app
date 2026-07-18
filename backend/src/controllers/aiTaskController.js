const { getDb } = require('../database/connection')

function getTasks(req, res) {
  const db = getDb()
  const { status, type, limit = 50, offset = 0 } = req.query

  let sql = `SELECT * FROM ai_tasks WHERE deleted_at IS NULL AND (user_id = ? OR user_id IS NULL)`
  const params = [req.user?.id ?? null]
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (type)   { sql += ' AND type = ?';   params.push(type) }
  sql += ' ORDER BY priority ASC, created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), parseInt(offset))

  const rows = db.prepare(sql).all(...params)
  const total = db.prepare(`SELECT COUNT(*) AS c FROM ai_tasks WHERE deleted_at IS NULL AND (user_id = ? OR user_id IS NULL)`).get(req.user?.id ?? null)
  res.json({ success: true, data: { tasks: rows, total: total.c } })
}

function createTask(req, res) {
  const db = getDb()
  const { title, description, type = 'analysis', priority = 3, due_date } = req.body

  if (!title) return res.status(400).json({ success: false, message: 'Başlık zorunlu.' })

  const row = db.prepare(`
    INSERT INTO ai_tasks (user_id, company_id, title, description, type, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user?.id ?? null, req.user?.company_id ?? null,
    title, description ?? null, type, priority, due_date ?? null,
  )

  res.status(201).json({ success: true, data: { id: row.lastInsertRowid } })
}

function updateTask(req, res) {
  const db = getDb()
  const { id } = req.params
  const { title, description, status, priority, due_date, result, ai_provider, ai_model } = req.body

  const existing = db.prepare('SELECT * FROM ai_tasks WHERE id = ? AND deleted_at IS NULL').get(parseInt(id))
  if (!existing) return res.status(404).json({ success: false, message: 'Görev bulunamadı.' })

  db.prepare(`
    UPDATE ai_tasks SET
      title = ?, description = ?, status = ?, priority = ?,
      due_date = ?, result = ?, ai_provider = ?, ai_model = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title ?? existing.title,
    description ?? existing.description,
    status ?? existing.status,
    priority ?? existing.priority,
    due_date ?? existing.due_date,
    result ?? existing.result,
    ai_provider ?? existing.ai_provider,
    ai_model ?? existing.ai_model,
    parseInt(id),
  )

  res.json({ success: true, data: null })
}

function deleteTask(req, res) {
  const db = getDb()
  const { id } = req.params

  db.prepare(`UPDATE ai_tasks SET deleted_at = datetime('now') WHERE id = ? AND (user_id = ? OR user_id IS NULL)`)
    .run(parseInt(id), req.user?.id ?? null)

  res.json({ success: true, data: null })
}

module.exports = { getTasks, createTask, updateTask, deleteTask }
