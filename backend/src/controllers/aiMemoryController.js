const { getDb } = require('../database/connection')

// ── V4 Memory Engine ─────────────────────────────────────────────────────────

function saveMemory(req, res) {
  const db = getDb()
  const {
    type = 'analysis', title, content, summary, tags,
    importance = 5, source_module = 'chat', data_json,
  } = req.body

  if (!summary && !content) {
    return res.status(400).json({ success: false, message: 'summary veya content zorunlu.' })
  }

  const row = db.prepare(`
    INSERT INTO ai_memories
      (user_id, company_id, type, title, content, summary, data_json, tags, importance,
       source_module, module, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
  `).run(
    req.user?.id ?? null, req.user?.company_id ?? null,
    type, title ?? null, content ?? null,
    summary ?? (content ?? '').slice(0, 200),
    data_json ? JSON.stringify(data_json) : null,
    Array.isArray(tags) ? tags.join(',') : (tags ?? null),
    importance, source_module, source_module,
  )

  res.status(201).json({ success: true, data: { id: row.lastInsertRowid } })
}

function getRecentMemories(req, res) {
  const db = getDb()
  const { limit = 20, type, source_module: mod } = req.query

  let sql = `SELECT * FROM ai_memories WHERE status != 'archived' AND (user_id = ? OR user_id IS NULL)`
  const params = [req.user?.id ?? null]
  if (type) { sql += ' AND type = ?'; params.push(type) }
  if (mod)  { sql += ' AND source_module = ?'; params.push(mod) }
  sql += ' ORDER BY created_at DESC LIMIT ?'
  params.push(parseInt(limit))

  res.json({ success: true, data: db.prepare(sql).all(...params) })
}

function getTopMemories(req, res) {
  const db = getDb()
  const { limit = 10 } = req.query
  const rows = db.prepare(`
    SELECT * FROM ai_memories
    WHERE status != 'archived' AND (user_id = ? OR user_id IS NULL)
    ORDER BY importance DESC, usage_count DESC, created_at DESC
    LIMIT ?
  `).all(req.user?.id ?? null, parseInt(limit))
  res.json({ success: true, data: rows })
}

function searchMemory(req, res) {
  const db = getDb()
  const { query, type, source_module, limit = 15 } = req.body

  if (!query) return res.status(400).json({ success: false, message: 'query zorunlu.' })

  const like = `%${query}%`
  let sql = `
    SELECT * FROM ai_memories
    WHERE status != 'archived' AND (user_id = ? OR user_id IS NULL)
      AND (title LIKE ? OR content LIKE ? OR summary LIKE ? OR tags LIKE ?)
  `
  const params = [req.user?.id ?? null, like, like, like, like]
  if (type)          { sql += ' AND type = ?';          params.push(type) }
  if (source_module) { sql += ' AND source_module = ?'; params.push(source_module) }
  sql += ' ORDER BY importance DESC, usage_count DESC LIMIT ?'
  params.push(parseInt(limit))

  res.json({ success: true, data: db.prepare(sql).all(...params) })
}

function findRelated(req, res) {
  const db = getDb()
  const { memoryId, limit = 5 } = req.body

  if (!memoryId) return res.status(400).json({ success: false, message: 'memoryId zorunlu.' })

  const base = db.prepare('SELECT * FROM ai_memories WHERE id = ?').get(memoryId)
  if (!base) return res.status(404).json({ success: false, message: 'Hafıza bulunamadı.' })

  const baseTags = (base.tags ?? '').split(',').filter(Boolean)

  if (baseTags.length === 0) {
    const rows = db.prepare(`
      SELECT * FROM ai_memories
      WHERE id != ? AND type = ? AND status != 'archived' AND (user_id = ? OR user_id IS NULL)
      ORDER BY created_at DESC LIMIT ?
    `).all(memoryId, base.type, req.user?.id ?? null, parseInt(limit))
    return res.json({ success: true, data: rows })
  }

  const conditions = baseTags.map(() => 'tags LIKE ?').join(' OR ')
  const params = [memoryId, req.user?.id ?? null, ...baseTags.map(t => `%${t}%`), parseInt(limit)]
  const rows = db.prepare(`
    SELECT * FROM ai_memories
    WHERE id != ? AND (user_id = ? OR user_id IS NULL) AND status != 'archived'
      AND (${conditions})
    ORDER BY importance DESC LIMIT ?
  `).all(...params)
  res.json({ success: true, data: rows })
}

function updateImportance(req, res) {
  const db = getDb()
  const { id } = req.params
  const { importance } = req.body

  if (importance == null || importance < 1 || importance > 10) {
    return res.status(400).json({ success: false, message: 'importance 1-10 arasında olmalı.' })
  }

  db.prepare(`
    UPDATE ai_memories
    SET importance = ?, usage_count = usage_count + 1, last_used_at = datetime('now')
    WHERE id = ? AND (user_id = ? OR user_id IS NULL)
  `).run(importance, parseInt(id), req.user?.id ?? null)

  res.json({ success: true, data: null })
}

function archiveMemory(req, res) {
  const db = getDb()
  const { id } = req.params

  db.prepare(`
    UPDATE ai_memories SET status = 'archived'
    WHERE id = ? AND (user_id = ? OR user_id IS NULL)
  `).run(parseInt(id), req.user?.id ?? null)

  res.json({ success: true, data: null })
}

// ── Legacy compat ─────────────────────────────────────────────────────────────

function list(req, res) {
  const db = getDb()
  const { module: mod, type, limit = 50 } = req.query
  let sql = `SELECT * FROM ai_memories WHERE (user_id = ? OR user_id IS NULL)`
  const params = [req.user?.id]
  if (mod)  { sql += ` AND module = ?`; params.push(mod) }
  if (type) { sql += ` AND type = ?`;   params.push(type) }
  sql += ` ORDER BY created_at DESC LIMIT ?`
  params.push(parseInt(limit))
  res.json({ success: true, data: db.prepare(sql).all(...params) })
}

function create(req, res) {
  const { type = 'analysis', module: mod = 'dashboard', summary, data_json, importance = 5 } = req.body
  if (!summary) return res.status(400).json({ success: false, message: 'Özet gereklidir.' })
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO ai_memories (user_id, company_id, type, module, summary, data_json, importance)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user?.id ?? null, req.user?.company_id ?? null,
    type, mod, summary,
    data_json ? JSON.stringify(data_json) : null,
    importance,
  )
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
}

function clear(req, res) {
  const db = getDb()
  const { older_than_days = 30 } = req.query
  const days = parseInt(older_than_days)
  db.prepare(`DELETE FROM ai_memories WHERE user_id = ? AND created_at < datetime('now', '-${days} days')`).run(req.user?.id)
  res.json({ success: true, data: null })
}

function getSummary(req, res) {
  const db = getDb()
  const rows = db.prepare(`SELECT summary FROM ai_memories WHERE (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC LIMIT 10`).all(req.user?.id)
  const summary = rows.map(r => r.summary).join(' | ')
  res.json({ success: true, data: { summary: summary || 'Henüz kayıt yok.' } })
}

module.exports = {
  saveMemory, getRecentMemories, getTopMemories,
  searchMemory, findRelated, updateImportance, archiveMemory,
  list, create, clear, getSummary,
}
