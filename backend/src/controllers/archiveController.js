const { getDb } = require('../database/connection')
const path = require('path')
const fs = require('fs')

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0]
const today = () => new Date().toISOString().split('T')[0]
const PAGE_SIZE = 50
const STORAGE_BASE = path.join(__dirname, '../../../storage/documents')

// ── Expire Status ─────────────────────────────────────────────────────────────

function expireStatus(expireDate) {
  if (!expireDate) return null
  const diff = Math.ceil((new Date(expireDate) - new Date(today())) / 86400000)
  if (diff < 0) return 'expired'
  if (diff <= 30) return 'expiring_soon'
  return 'valid'
}

function enrichDoc(doc) {
  return { ...doc, expire_status: expireStatus(doc.expire_date) }
}

// ── Summary ───────────────────────────────────────────────────────────────────

function getSummary(req, res) {
  const db = getDb()
  const t = today()

  const total = db.prepare(`SELECT COUNT(*) as n FROM documents WHERE deleted_at IS NULL`).get()?.n || 0
  const missing = db.prepare(`SELECT COUNT(*) as n FROM documents WHERE deleted_at IS NULL AND status = 'missing'`).get()?.n || 0
  const pending = db.prepare(`SELECT COUNT(*) as n FROM documents WHERE deleted_at IS NULL AND status = 'pending_review'`).get()?.n || 0

  const expired = db.prepare(
    `SELECT COUNT(*) as n FROM documents WHERE deleted_at IS NULL AND expire_date IS NOT NULL AND expire_date < ?`
  ).get(t)?.n || 0

  const expiringSoon = db.prepare(
    `SELECT COUNT(*) as n FROM documents WHERE deleted_at IS NULL AND expire_date IS NOT NULL AND expire_date >= ? AND expire_date <= date(?, '+30 days')`
  ).get(t, t)?.n || 0

  const recent = db.prepare(
    `SELECT d.*, a.name as asset_ref, p.purchase_no, s.sale_no
     FROM documents d
     LEFT JOIN assets a ON a.id = d.asset_id AND a.deleted_at IS NULL
     LEFT JOIN purchases p ON p.id = d.purchase_id AND p.deleted_at IS NULL
     LEFT JOIN sales s ON s.id = d.sale_id AND s.deleted_at IS NULL
     WHERE d.deleted_at IS NULL AND d.status != 'missing'
     ORDER BY d.created_at DESC LIMIT 10`
  ).all().map(enrichDoc)

  const expiringDocs = db.prepare(
    `SELECT d.*, a.name as asset_ref FROM documents d
     LEFT JOIN assets a ON a.id = d.asset_id AND a.deleted_at IS NULL
     WHERE d.deleted_at IS NULL AND d.expire_date IS NOT NULL AND d.expire_date >= ? AND d.expire_date <= date(?, '+60 days')
     ORDER BY d.expire_date ASC LIMIT 10`
  ).get(t, t) // returns single row - fix to all
  const expiringList = db.prepare(
    `SELECT d.*, a.name as asset_ref FROM documents d
     LEFT JOIN assets a ON a.id = d.asset_id AND a.deleted_at IS NULL
     WHERE d.deleted_at IS NULL AND d.expire_date IS NOT NULL AND d.expire_date >= ? AND d.expire_date <= date(?, '+60 days')
     ORDER BY d.expire_date ASC LIMIT 10`
  ).all(t, t).map(enrichDoc)

  res.json({
    success: true,
    data: { total, missing, pending, expired, expiring_soon: expiringSoon, recent, expiring_list: expiringList },
  })
}

// ── List ──────────────────────────────────────────────────────────────────────

function listDocuments(req, res) {
  const db = getDb()
  const { page = 1, category, module: mod, status, expire_status, search, asset_id, date_from, date_to } = req.query
  const offset = (Number(page) - 1) * PAGE_SIZE

  const conds = ['d.deleted_at IS NULL']
  const params = []

  if (category) { conds.push('d.category = ?'); params.push(category) }
  if (mod) { conds.push('d.module = ?'); params.push(mod) }
  if (status) { conds.push('d.status = ?'); params.push(status) }
  if (asset_id) { conds.push('d.asset_id = ?'); params.push(Number(asset_id)) }
  if (date_from) { conds.push('date(d.created_at) >= ?'); params.push(date_from) }
  if (date_to) { conds.push('date(d.created_at) <= ?'); params.push(date_to) }
  if (search) {
    conds.push('(d.title LIKE ? OR d.original_name LIKE ? OR d.description LIKE ?)')
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const t = today()
  if (expire_status === 'expired') {
    conds.push('d.expire_date IS NOT NULL AND d.expire_date < ?'); params.push(t)
  } else if (expire_status === 'expiring_soon') {
    conds.push(`d.expire_date IS NOT NULL AND d.expire_date >= ? AND d.expire_date <= date(?, '+30 days')`)
    params.push(t, t)
  } else if (expire_status === 'valid') {
    conds.push(`(d.expire_date IS NULL OR d.expire_date > date(?, '+30 days'))`)
    params.push(t)
  }

  const where = conds.join(' AND ')

  const total = db.prepare(`SELECT COUNT(*) as n FROM documents d WHERE ${where}`).get(...params)?.n || 0
  const items = db.prepare(`
    SELECT d.*,
      a.name as asset_ref, a.type as asset_type,
      p.purchase_no, p.asset_name as purchase_asset,
      s.sale_no, s.asset_name as sale_asset
    FROM documents d
    LEFT JOIN assets a ON a.id = d.asset_id AND a.deleted_at IS NULL
    LEFT JOIN purchases p ON p.id = d.purchase_id AND p.deleted_at IS NULL
    LEFT JOIN sales s ON s.id = d.sale_id AND s.deleted_at IS NULL
    WHERE ${where}
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, PAGE_SIZE, offset).map(enrichDoc)

  res.json({ success: true, data: { items, total, page: Number(page), total_pages: Math.ceil(total / PAGE_SIZE) } })
}

// ── Get Document ──────────────────────────────────────────────────────────────

function getDocument(req, res) {
  const db = getDb()
  const id = Number(req.params.id)
  const doc = db.prepare(`
    SELECT d.*,
      a.name as asset_ref, a.type as asset_type,
      p.purchase_no, s.sale_no
    FROM documents d
    LEFT JOIN assets a ON a.id = d.asset_id
    LEFT JOIN purchases p ON p.id = d.purchase_id
    LEFT JOIN sales s ON s.id = d.sale_id
    WHERE d.id = ? AND d.deleted_at IS NULL
  `).get(id)
  if (!doc) return res.status(404).json({ success: false, message: 'Doküman bulunamadı' })

  const relations = db.prepare('SELECT * FROM document_relations WHERE document_id = ? AND deleted_at IS NULL').all(id)
  const versions = db.prepare('SELECT * FROM document_versions WHERE document_id = ? AND deleted_at IS NULL ORDER BY version_number DESC').all(id)

  res.json({ success: true, data: { ...enrichDoc(doc), relations, versions } })
}

// ── Upload (single or multiple files) ────────────────────────────────────────

function uploadDocuments(req, res) {
  const db = getDb()
  const files = req.files || (req.file ? [req.file] : [])
  if (!files.length) return res.status(400).json({ success: false, message: 'Dosya seçilmedi' })

  const {
    category = 'Diğer',
    module: mod = 'archive',
    module_id, module_name,
    asset_id, purchase_id, sale_id,
    expire_date, description, status = 'uploaded',
    relation_type, relation_id, relation_name,
  } = req.body

  const created = db.transaction(() => {
    return files.map(file => {
      const result = db.prepare(`
        INSERT INTO documents
          (title, filename, path, type, module, description, category, expire_date, status,
           file_size, mime_type, original_name, current_version,
           asset_id, purchase_id, sale_id,
           created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?)
      `).run(
        file.originalname,
        file.filename,
        file.filename,
        file.mimetype,
        mod,
        description || null,
        category,
        expire_date || null,
        status,
        file.size,
        file.mimetype,
        file.originalname,
        asset_id ? Number(asset_id) : null,
        purchase_id ? Number(purchase_id) : null,
        sale_id ? Number(sale_id) : null,
        now(), now()
      )

      const docId = result.lastInsertRowid

      // Version record
      db.prepare(`
        INSERT INTO document_versions (document_id, version_number, filename, path, original_name, file_size, mime_type, created_at, updated_at)
        VALUES (?,1,?,?,?,?,?,?,?)
      `).run(docId, file.filename, file.filename, file.originalname, file.size, file.mimetype, now(), now())

      // Relation
      if (relation_type && relation_id) {
        db.prepare(`INSERT INTO document_relations (document_id, relation_type, relation_id, relation_name, created_at, updated_at) VALUES (?,?,?,?,?,?)`)
          .run(docId, relation_type, Number(relation_id), relation_name || null, now(), now())
      }

      return db.prepare('SELECT * FROM documents WHERE id = ?').get(docId)
    })
  })()

  res.status(201).json({ success: true, data: created })
}

// ── Create Missing Placeholder ────────────────────────────────────────────────

function createMissing(req, res) {
  const db = getDb()
  const { title, category = 'Diğer', description, asset_id, purchase_id, sale_id, expire_date, module: mod = 'archive' } = req.body
  if (!title) return res.status(400).json({ success: false, message: 'Başlık zorunludur' })

  const result = db.prepare(`
    INSERT INTO documents (title, filename, path, type, module, description, category, expire_date, status, current_version, asset_id, purchase_id, sale_id, created_at, updated_at)
    VALUES (?, '', '', 'missing', ?, ?, ?, ?, 'missing', 0, ?, ?, ?, ?, ?)
  `).run(title, mod, description || null, category, expire_date || null, asset_id || null, purchase_id || null, sale_id || null, now(), now())

  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid) })
}

// ── Update Document ───────────────────────────────────────────────────────────

function updateDocument(req, res) {
  const db = getDb()
  const id = Number(req.params.id)
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!doc) return res.status(404).json({ success: false, message: 'Doküman bulunamadı' })

  const { title, category, description, expire_date, status, keywords, summary } = req.body

  db.prepare(`UPDATE documents SET
    title = ?, category = ?, description = ?, expire_date = ?, status = ?,
    keywords = ?, summary = ?, updated_at = ?
    WHERE id = ?`
  ).run(
    title ?? doc.title, category ?? doc.category, description ?? doc.description,
    expire_date !== undefined ? (expire_date || null) : doc.expire_date,
    status ?? doc.status,
    keywords ?? doc.keywords, summary ?? doc.summary,
    now(), id
  )

  res.json({ success: true, data: enrichDoc(db.prepare('SELECT * FROM documents WHERE id = ?').get(id)) })
}

// ── Delete Document ───────────────────────────────────────────────────────────

function deleteDocument(req, res) {
  const db = getDb()
  const id = Number(req.params.id)
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!doc) return res.status(404).json({ success: false, message: 'Doküman bulunamadı' })

  db.prepare('UPDATE documents SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), id)
  res.json({ success: true, data: null })
}

// ── Add Version ───────────────────────────────────────────────────────────────

function addVersion(req, res) {
  const db = getDb()
  const id = Number(req.params.id)
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!doc) return res.status(404).json({ success: false, message: 'Doküman bulunamadı' })
  if (!req.file) return res.status(400).json({ success: false, message: 'Dosya seçilmedi' })

  const newVersion = (doc.current_version || 1) + 1
  const { upload_note } = req.body

  db.transaction(() => {
    db.prepare(`INSERT INTO document_versions (document_id, version_number, filename, path, original_name, file_size, mime_type, upload_note, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).run(id, newVersion, req.file.filename, req.file.filename, req.file.originalname, req.file.size, req.file.mimetype, upload_note || null, now(), now())

    db.prepare('UPDATE documents SET filename=?, path=?, original_name=?, file_size=?, mime_type=?, current_version=?, status=\'uploaded\', updated_at=? WHERE id=?')
      .run(req.file.filename, req.file.filename, req.file.originalname, req.file.size, req.file.mimetype, newVersion, now(), id)
  })()

  res.json({ success: true, data: db.prepare('SELECT * FROM documents WHERE id = ?').get(id) })
}

// ── Download ──────────────────────────────────────────────────────────────────

function downloadDocument(req, res) {
  const db = getDb()
  const id = Number(req.params.id)
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!doc) return res.status(404).json({ success: false, message: 'Doküman bulunamadı' })
  if (!doc.path) return res.status(404).json({ success: false, message: 'Dosya yolu bulunamadı' })

  const filePath = path.join(STORAGE_BASE, doc.path)
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Dosya bulunamadı' })

  const name = doc.original_name || doc.filename || `document-${id}`
  res.download(filePath, name)
}

// ── Preview (inline) ──────────────────────────────────────────────────────

function previewDocument(req, res) {
  const db = getDb()
  const id = Number(req.params.id)
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!doc || !doc.path) return res.status(404).json({ success: false, message: 'Dosya bulunamadı' })

  const filePath = path.join(STORAGE_BASE, doc.path)
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Dosya bulunamadı' })

  res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream')
  res.setHeader('Content-Disposition', 'inline')
  res.sendFile(filePath)
}

// ── OCR Extract (demo) ────────────────────────────────────────────────────

function ocrExtract(req, res) {
  const db = getDb()
  const id = Number(req.params.id)
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!doc) return res.status(404).json({ success: false, message: 'Doküman bulunamadı' })

  // Update OCR status to 'processing' then 'completed' (demo)
  db.prepare("UPDATE documents SET ocr_status = 'completed', updated_at = ? WHERE id = ?").run(now(), id)

  // Demo extracted data based on category
  const category = doc.category || ''
  let extracted = {}

  if (category.includes('Fatura') || category.includes('fatura')) {
    extracted = {
      belge_no: 'FTR-2024-00' + id,
      tarih: new Date().toISOString().split('T')[0],
      tutar: Math.floor(Math.random() * 50000 + 5000) + ' TRY',
      kdv: '%20',
      firma: 'Demo Firma A.Ş.',
      aciklama: 'Faturadan otomatik çıkarılan demo veri',
    }
  } else if (category.includes('Sigorta') || category.includes('Kasko')) {
    extracted = {
      police_no: 'SIG-' + Math.floor(Math.random() * 999999),
      bitis_tarihi: new Date(Date.now() + 365 * 864e5).toISOString().split('T')[0],
      prim: Math.floor(Math.random() * 8000 + 2000) + ' TRY',
      sigorta_sirket: 'Demo Sigorta A.Ş.',
      aciklama: 'Sigorta poliçesinden otomatik çıkarılan demo veri',
    }
  } else if (category.includes('Ruhsat')) {
    extracted = {
      plaka: '34 ABC ' + Math.floor(Math.random() * 999),
      tescil_tarihi: new Date().toISOString().split('T')[0],
      marka: 'Demo Marka',
      model: 'Demo Model',
      aciklama: 'Ruhsattan otomatik çıkarılan demo veri',
    }
  } else {
    extracted = {
      belge_turu: category || 'Bilinmiyor',
      isleme_tarihi: new Date().toISOString().split('T')[0],
      aciklama: 'Belgeden otomatik çıkarılan demo veri — ileride Claude/ChatGPT OCR ile doldurulacak',
    }
  }

  res.json({
    success: true,
    data: {
      document_id: id,
      ocr_status: 'completed',
      confidence: 0.87,
      extracted,
      note: 'Bu demo verisidir. Gerçek OCR entegrasyonu Claude AI veya GPT-4 Vision API ile sağlanacak.',
    },
  })
}

// ── Relations ─────────────────────────────────────────────────────────────────

function addRelation(req, res) {
  const db = getDb()
  const id = Number(req.params.id)
  const { relation_type, relation_id, relation_name } = req.body
  const result = db.prepare(`INSERT INTO document_relations (document_id, relation_type, relation_id, relation_name, created_at, updated_at) VALUES (?,?,?,?,?,?)`)
    .run(id, relation_type, relation_id || null, relation_name || null, now(), now())
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM document_relations WHERE id = ?').get(result.lastInsertRowid) })
}

function deleteRelation(req, res) {
  const db = getDb()
  db.prepare('UPDATE document_relations SET deleted_at = ? WHERE id = ?').run(now(), Number(req.params.relId))
  res.json({ success: true, data: null })
}

// ── Categories ────────────────────────────────────────────────────────────────

function listCategories(req, res) {
  const db = getDb()
  res.json({ success: true, data: db.prepare('SELECT * FROM document_categories WHERE deleted_at IS NULL ORDER BY sort_order, name').all() })
}

// ── Archive Context ───────────────────────────────────────────────────────────

function getArchiveContext(req, res) {
  const db = getDb()
  const assets = db.prepare(`SELECT id, name, type FROM assets WHERE deleted_at IS NULL ORDER BY name`).all()
  const purchases = db.prepare(`SELECT id, purchase_no, asset_name FROM purchases WHERE deleted_at IS NULL ORDER BY purchase_no DESC LIMIT 50`).all()
  const sales = db.prepare(`SELECT id, sale_no, asset_name FROM sales WHERE deleted_at IS NULL ORDER BY sale_no DESC LIMIT 50`).all()
  const expenses = db.prepare(`SELECT id, expense_no, description FROM expenses WHERE deleted_at IS NULL ORDER BY expense_date DESC LIMIT 50`).all()
  res.json({ success: true, data: { assets, purchases, sales, expenses } })
}

// ── Reports ───────────────────────────────────────────────────────────────────

function getReports(req, res) {
  const db = getDb()
  const t = today()

  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as cnt FROM documents WHERE deleted_at IS NULL AND status != 'missing' GROUP BY category ORDER BY cnt DESC
  `).all()

  const byModule = db.prepare(`
    SELECT module, COUNT(*) as cnt FROM documents WHERE deleted_at IS NULL GROUP BY module ORDER BY cnt DESC
  `).all()

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as cnt FROM documents WHERE deleted_at IS NULL GROUP BY status
  `).all()

  const missingDocs = db.prepare(`
    SELECT d.*, a.name as asset_ref FROM documents d
    LEFT JOIN assets a ON a.id = d.asset_id AND a.deleted_at IS NULL
    WHERE d.deleted_at IS NULL AND d.status = 'missing'
    ORDER BY d.created_at DESC LIMIT 20
  `).all()

  const expiredDocs = db.prepare(`
    SELECT d.*, a.name as asset_ref FROM documents d
    LEFT JOIN assets a ON a.id = d.asset_id AND a.deleted_at IS NULL
    WHERE d.deleted_at IS NULL AND d.expire_date IS NOT NULL AND d.expire_date < ?
    ORDER BY d.expire_date ASC LIMIT 20
  `).all(t)

  const uploadTimeline = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as cnt
    FROM documents WHERE deleted_at IS NULL AND status != 'missing'
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all()

  const byAsset = db.prepare(`
    SELECT d.asset_id, COALESCE(a.name,'—') as asset_name, COUNT(*) as cnt
    FROM documents d
    LEFT JOIN assets a ON a.id = d.asset_id AND a.deleted_at IS NULL
    WHERE d.deleted_at IS NULL AND d.asset_id IS NOT NULL
    GROUP BY d.asset_id ORDER BY cnt DESC LIMIT 10
  `).all()

  res.json({
    success: true,
    data: { by_category: byCategory, by_module: byModule, by_status: byStatus, missing: missingDocs, expired: expiredDocs, upload_timeline: uploadTimeline, by_asset: byAsset },
  })
}

module.exports = {
  getSummary, listDocuments, getDocument, uploadDocuments, createMissing,
  updateDocument, deleteDocument, addVersion, downloadDocument, previewDocument,
  ocrExtract, addRelation, deleteRelation, listCategories, getArchiveContext, getReports,
}
