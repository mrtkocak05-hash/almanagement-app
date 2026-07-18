const { getDb } = require('../database/connection')
const fs = require('fs')
const path = require('path')

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0]
const today = () => new Date().toISOString().split('T')[0]

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildWhereClause(filters) {
  const conditions = ['a.deleted_at IS NULL']
  const params = []

  if (filters.search) {
    conditions.push('(a.name LIKE ? OR a.brand LIKE ? OR a.model LIKE ? OR a.plate LIKE ?)')
    const s = `%${filters.search}%`
    params.push(s, s, s, s)
  }
  if (filters.type) { conditions.push('a.type = ?'); params.push(filters.type) }
  if (filters.status) { conditions.push('a.status = ?'); params.push(filters.status) }
  if (filters.category) { conditions.push('a.category = ?'); params.push(filters.category) }

  return { where: conditions.join(' AND '), params }
}

function calculatePartnerAmount(price, pct) {
  if (!price || !pct) return null
  return Math.round((price * pct / 100) * 100) / 100
}

// ── Asset CRUD ────────────────────────────────────────────────────────────────

function listAssets(req, res) {
  const db = getDb()
  const { search, type, status, category, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  const { where, params } = buildWhereClause({ search, type, status, category })

  const total = db.prepare(`SELECT COUNT(*) as c FROM assets a WHERE ${where}`).get(...params).c

  const rows = db.prepare(`
    SELECT a.*,
      (SELECT path FROM asset_photos WHERE asset_id = a.id AND is_main = 1 AND deleted_at IS NULL LIMIT 1) as main_photo,
      (SELECT COUNT(*) FROM asset_partners WHERE asset_id = a.id AND deleted_at IS NULL) as partner_count
    FROM assets a
    WHERE ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset)

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_count,
      COALESCE(SUM(CASE WHEN purchase_currency = 'TRY' THEN current_value ELSE 0 END), 0) as total_value,
      COALESCE(SUM(CASE WHEN purchase_currency = 'TRY' THEN current_value * share_percent / 100 ELSE 0 END), 0) as total_share_value
    FROM assets WHERE deleted_at IS NULL
  `).get()

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

function getAsset(req, res) {
  const db = getDb()
  const { id } = req.params

  const asset = db.prepare('SELECT * FROM assets WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!asset) return res.status(404).json({ success: false, message: 'Varlık bulunamadı' })

  const photos = db.prepare(
    'SELECT * FROM asset_photos WHERE asset_id = ? AND deleted_at IS NULL ORDER BY is_main DESC, created_at'
  ).all(id)

  const partners = db.prepare(
    'SELECT * FROM asset_partners WHERE asset_id = ? AND deleted_at IS NULL ORDER BY created_at'
  ).all(id)

  const documents = db.prepare(
    'SELECT * FROM documents WHERE asset_id = ? AND deleted_at IS NULL ORDER BY created_at DESC'
  ).all(id)

  const activities = db.prepare(
    'SELECT * FROM activities WHERE asset_id = ? AND deleted_at IS NULL ORDER BY activity_date DESC, created_at DESC LIMIT 50'
  ).all(id)

  res.json({ success: true, data: { ...asset, photos, partners, documents, activities } })
}

function createAsset(req, res) {
  const db = getDb()
  const body = req.body
  const partners = body.partners || []

  const cols = Object.keys(body).filter(k => k !== 'partners' && k !== 'id')
  const placeholders = cols.map(() => '?').join(', ')
  const colNames = cols.join(', ')
  const values = cols.map(k => body[k] ?? null)

  const ts = now()
  const stmt = db.prepare(
    `INSERT INTO assets (${colNames}, created_at, updated_at) VALUES (${placeholders}, ?, ?)`
  )
  const result = stmt.run(...values, ts, ts)
  const assetId = result.lastInsertRowid

  // Insert partners
  const partnerStmt = db.prepare(`
    INSERT INTO asset_partners (asset_id, name, share_percent, share_amount, phone, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const p of partners) {
    const amount = calculatePartnerAmount(body.purchase_price, p.share_percent)
    partnerStmt.run(assetId, p.name, p.share_percent, amount, p.phone || null, p.notes || null, ts, ts)
  }

  // Log activity
  db.prepare(`
    INSERT INTO activities (asset_id, type, title, amount, currency, activity_date, created_at, updated_at)
    VALUES (?, 'purchase', ?, ?, ?, ?, ?, ?)
  `).run(assetId, `Varlık eklendi: ${body.name}`, body.purchase_price || null, body.purchase_currency || 'TRY', today(), ts, ts)

  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId)
  res.status(201).json({ success: true, data: asset })
}

function updateAsset(req, res) {
  const db = getDb()
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM assets WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!existing) return res.status(404).json({ success: false, message: 'Varlık bulunamadı' })

  const body = req.body
  const ts = now()
  const cols = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'deleted_at')
  const setClause = cols.map(k => `${k} = ?`).join(', ')
  const values = cols.map(k => body[k] ?? null)

  db.prepare(`UPDATE assets SET ${setClause}, updated_at = ? WHERE id = ?`).run(...values, ts, id)

  const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(id)
  res.json({ success: true, data: updated })
}

function deleteAsset(req, res) {
  const db = getDb()
  const { id } = req.params
  const ts = now()

  const asset = db.prepare('SELECT id FROM assets WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!asset) return res.status(404).json({ success: false, message: 'Varlık bulunamadı' })

  db.prepare('UPDATE assets SET deleted_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, id)
  res.json({ success: true, message: 'Varlık silindi' })
}

// ── Photos ────────────────────────────────────────────────────────────────────

function uploadPhotos(req, res) {
  const db = getDb()
  const { id } = req.params
  const files = req.files || (req.file ? [req.file] : [])

  if (!files.length) return res.status(400).json({ success: false, message: 'Dosya bulunamadı' })

  const asset = db.prepare('SELECT id FROM assets WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!asset) return res.status(404).json({ success: false, message: 'Varlık bulunamadı' })

  const hasMain = db.prepare(
    'SELECT id FROM asset_photos WHERE asset_id = ? AND is_main = 1 AND deleted_at IS NULL'
  ).get(id)

  const ts = now()
  const stmt = db.prepare(
    'INSERT INTO asset_photos (asset_id, filename, path, is_main, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const inserted = []
  files.forEach((f, idx) => {
    const isMain = !hasMain && idx === 0 ? 1 : 0
    const r = stmt.run(id, f.filename, `/storage/photos/${f.filename}`, isMain, ts, ts)
    inserted.push({ id: r.lastInsertRowid, filename: f.filename, path: `/storage/photos/${f.filename}`, is_main: isMain })
  })

  res.status(201).json({ success: true, data: inserted })
}

function setMainPhoto(req, res) {
  const db = getDb()
  const { id, photoId } = req.params
  const ts = now()

  db.prepare('UPDATE asset_photos SET is_main = 0, updated_at = ? WHERE asset_id = ?').run(ts, id)
  db.prepare('UPDATE asset_photos SET is_main = 1, updated_at = ? WHERE id = ? AND asset_id = ?').run(ts, photoId, id)

  res.json({ success: true })
}

function deletePhoto(req, res) {
  const db = getDb()
  const { id, photoId } = req.params
  const ts = now()

  const photo = db.prepare(
    'SELECT * FROM asset_photos WHERE id = ? AND asset_id = ? AND deleted_at IS NULL'
  ).get(photoId, id)
  if (!photo) return res.status(404).json({ success: false, message: 'Fotoğraf bulunamadı' })

  db.prepare('UPDATE asset_photos SET deleted_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, photoId)

  // Try to delete actual file
  const filePath = path.join(__dirname, '../../../storage/photos', photo.filename)
  try { fs.unlinkSync(filePath) } catch (_) {}

  res.json({ success: true })
}

// ── Partners ──────────────────────────────────────────────────────────────────

function addPartner(req, res) {
  const db = getDb()
  const { id } = req.params
  const { name, share_percent, phone, notes } = req.body
  const ts = now()

  const asset = db.prepare('SELECT purchase_price FROM assets WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!asset) return res.status(404).json({ success: false, message: 'Varlık bulunamadı' })

  const share_amount = calculatePartnerAmount(asset.purchase_price, share_percent)

  const r = db.prepare(`
    INSERT INTO asset_partners (asset_id, name, share_percent, share_amount, phone, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, share_percent, share_amount, phone || null, notes || null, ts, ts)

  res.status(201).json({ success: true, data: { id: r.lastInsertRowid, name, share_percent, share_amount, phone, notes } })
}

function updatePartner(req, res) {
  const db = getDb()
  const { id, pid } = req.params
  const { name, share_percent, phone, notes } = req.body
  const ts = now()

  const asset = db.prepare('SELECT purchase_price FROM assets WHERE id = ?').get(id)
  const share_amount = calculatePartnerAmount(asset?.purchase_price, share_percent)

  db.prepare(`
    UPDATE asset_partners SET name = ?, share_percent = ?, share_amount = ?, phone = ?, notes = ?, updated_at = ?
    WHERE id = ? AND asset_id = ? AND deleted_at IS NULL
  `).run(name, share_percent, share_amount, phone || null, notes || null, ts, pid, id)

  res.json({ success: true })
}

function deletePartner(req, res) {
  const db = getDb()
  const { id, pid } = req.params
  const ts = now()

  db.prepare('UPDATE asset_partners SET deleted_at = ?, updated_at = ? WHERE id = ? AND asset_id = ?').run(ts, ts, pid, id)
  res.json({ success: true })
}

// ── Documents ─────────────────────────────────────────────────────────────────

function uploadDocument(req, res) {
  const db = getDb()
  const { id } = req.params
  const file = req.file
  if (!file) return res.status(400).json({ success: false, message: 'Dosya bulunamadı' })

  const { type = 'other', title } = req.body
  const ts = now()

  const r = db.prepare(`
    INSERT INTO documents (asset_id, type, title, filename, path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, type, title || file.originalname, file.filename, `/storage/documents/${file.filename}`, ts, ts)

  res.status(201).json({ success: true, data: { id: r.lastInsertRowid, type, title, filename: file.filename, path: `/storage/documents/${file.filename}` } })
}

function deleteDocument(req, res) {
  const db = getDb()
  const { id, docId } = req.params
  const ts = now()

  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND asset_id = ? AND deleted_at IS NULL').get(docId, id)
  if (!doc) return res.status(404).json({ success: false, message: 'Doküman bulunamadı' })

  db.prepare('UPDATE documents SET deleted_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, docId)

  const filePath = path.join(__dirname, '../../../storage/documents', doc.filename)
  try { fs.unlinkSync(filePath) } catch (_) {}

  res.json({ success: true })
}

// ── Activity Story ────────────────────────────────────────────────────────────

function getActivityStory(req, res) {
  const db = getDb()
  const assetId = Number(req.params.id)

  const asset = db.prepare('SELECT * FROM assets WHERE id = ? AND deleted_at IS NULL').get(assetId)
  if (!asset) return res.status(404).json({ success: false, message: 'Varlık bulunamadı' })

  const events = []

  // 1. Asset created
  events.push({ type: 'asset_created', icon: 'Plus', title: 'Varlık oluşturuldu', detail: asset.name, date: asset.created_at, amount: null })

  // 2. Purchase(s)
  const purchases = db.prepare('SELECT * FROM purchases WHERE asset_id = ? AND deleted_at IS NULL ORDER BY created_at').all(assetId)
  purchases.forEach(p => {
    events.push({ type: 'purchased', icon: 'ShoppingCart', title: 'Satın alındı', detail: p.purchase_no, amount: p.purchase_price_try, currency: 'TRY', date: p.created_at })

    // Purchase expenses
    const pExp = db.prepare('SELECT * FROM purchase_expenses WHERE purchase_id = ? AND deleted_at IS NULL ORDER BY created_at').all(p.id)
    pExp.forEach(e => events.push({ type: 'expense', icon: 'Receipt', title: 'Gider eklendi', detail: `${e.expense_type} — ${e.expense_name}`, amount: e.amount_try, currency: 'TRY', date: e.created_at }))
  })

  // 3. Photos
  const photos = db.prepare('SELECT * FROM asset_photos WHERE asset_id = ? AND deleted_at IS NULL ORDER BY created_at').all(assetId)
  if (photos.length > 0) {
    events.push({ type: 'photos_added', icon: 'Camera', title: 'Fotoğraf eklendi', detail: `${photos.length} fotoğraf`, amount: null, date: photos[0].created_at })
  }

  // 4. Documents
  const docs = db.prepare('SELECT * FROM documents WHERE asset_id = ? AND deleted_at IS NULL AND status != ? ORDER BY created_at').all(assetId, 'missing')
  docs.forEach(d => events.push({ type: 'document', icon: 'FileText', title: 'Belge yüklendi', detail: `${d.category} — ${d.title}`, amount: null, date: d.created_at }))

  // 5. Activities log
  const acts = db.prepare("SELECT * FROM activities WHERE asset_id = ? AND deleted_at IS NULL ORDER BY created_at").all(assetId)
  acts.forEach(a => events.push({ type: 'activity', icon: 'Activity', title: a.title, detail: a.note, amount: a.amount, currency: a.currency, date: a.created_at }))

  // 6. Sale(s)
  const sales = db.prepare('SELECT * FROM sales WHERE asset_id = ? AND deleted_at IS NULL ORDER BY created_at').all(assetId)
  sales.forEach(s => {
    // Sale expenses
    const sExp = db.prepare('SELECT * FROM sale_expenses WHERE sale_id = ? AND deleted_at IS NULL ORDER BY created_at').all(s.id)
    sExp.forEach(e => events.push({ type: 'expense', icon: 'Receipt', title: 'Satış gideri', detail: `${e.expense_type} — ${e.expense_name}`, amount: e.amount_try, currency: 'TRY', date: e.created_at }))

    events.push({ type: 'sold', icon: 'TrendingUp', title: 'Satıldı', detail: s.sale_no, amount: s.sale_price_try, currency: 'TRY', date: s.created_at })

    if (s.net_profit_try != null) {
      const profitable = s.net_profit_try >= 0
      events.push({ type: profitable ? 'profit' : 'loss', icon: profitable ? 'DollarSign' : 'TrendingDown', title: profitable ? 'Kâr oluştu' : 'Zarar oluştu', detail: `ROI: %${s.roi_percent?.toFixed(1) ?? '—'}`, amount: s.net_profit_try, currency: 'TRY', date: s.updated_at })
    }
  })

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  res.json({ success: true, data: { asset, events } })
}

module.exports = {
  listAssets, getAsset, createAsset, updateAsset, deleteAsset,
  uploadPhotos, setMainPhoto, deletePhoto,
  addPartner, updatePartner, deletePartner,
  uploadDocument, deleteDocument, getActivityStory,
}
