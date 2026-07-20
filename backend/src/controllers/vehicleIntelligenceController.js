/**
 * Vehicle Intelligence Controller — Sprint 13.0
 */

const path   = require('path')
const fs     = require('fs')
const multer = require('multer')
const db     = require('../database/init')
const svc    = require('../services/vehicleIntelligenceService')

const STORAGE_BASE = process.env.VERCEL
  ? '/tmp/vehicle-photos'
  : path.join(__dirname, '../../../storage/vehicle-photos')
if (!fs.existsSync(STORAGE_BASE)) fs.mkdirSync(STORAGE_BASE, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, STORAGE_BASE),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(res, data)          { return res.json({ success: true, data }) }
function fail(res, msg, s = 400){ return res.status(s).json({ success: false, message: msg }) }

function getOrCreateRecord(assetId) {
  const existing = db.prepare('SELECT id FROM vehicle_intelligence WHERE asset_id = ?').get(assetId)
  if (existing) return existing.id
  const r = db.prepare('INSERT INTO vehicle_intelligence (asset_id) VALUES (?)').run(assetId)
  return r.lastInsertRowid
}

function fetchFull(viId) {
  const vi   = db.prepare('SELECT * FROM vehicle_intelligence WHERE id = ?').get(viId)
  const parts= db.prepare('SELECT * FROM vehicle_parts WHERE vehicle_intelligence_id = ?').all(viId)
  const tires= db.prepare('SELECT * FROM vehicle_tires WHERE vehicle_intelligence_id = ?').all(viId)
  const batt = db.prepare('SELECT * FROM vehicle_battery WHERE vehicle_intelligence_id = ?').get(viId)
  const maint= db.prepare('SELECT * FROM vehicle_maintenance WHERE vehicle_intelligence_id = ? ORDER BY date DESC').all(viId)
  const photos=db.prepare('SELECT * FROM vehicle_part_photos WHERE vehicle_intelligence_id = ? ORDER BY created_at DESC').all(viId)
  return { ...vi, parts, tires, battery: batt ?? null, maintenance: maint, photos }
}

// ── GET /dashboard — widget stats ─────────────────────────────────────────────

function getDashboardStats(req, res) {
  const total   = db.prepare('SELECT COUNT(*) as c FROM vehicle_intelligence').get().c
  const scored  = db.prepare('SELECT COUNT(*) as c FROM vehicle_intelligence WHERE ai_score IS NOT NULL').get().c
  const avgScore= db.prepare('SELECT AVG(ai_score) as v FROM vehicle_intelligence WHERE ai_score IS NOT NULL').get().v
  const noExpert= db.prepare('SELECT COUNT(*) as c FROM vehicle_intelligence WHERE expert_firm IS NULL').get().c

  // Count assets with no photos
  const noPhotos= db.prepare(`
    SELECT COUNT(DISTINCT vi.id) as c
    FROM vehicle_intelligence vi
    LEFT JOIN vehicle_part_photos vpp ON vpp.vehicle_intelligence_id = vi.id
    WHERE vpp.id IS NULL
  `).get().c

  // Count with incomplete maintenance
  const noMaint = db.prepare(`
    SELECT COUNT(DISTINCT vi.id) as c
    FROM vehicle_intelligence vi
    WHERE (SELECT COUNT(*) FROM vehicle_maintenance vm WHERE vm.vehicle_intelligence_id = vi.id) < 3
  `).get().c

  return ok(res, {
    total,
    scored,
    avg_score: avgScore ? Math.round(avgScore) : null,
    expert_pending: noExpert,
    missing_photos: noPhotos,
    missing_maintenance: noMaint,
  })
}

// ── GET /:assetId — full data ─────────────────────────────────────────────────

function getByAsset(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  if (!assetId) return fail(res, 'Geçersiz assetId')
  const vi = db.prepare('SELECT * FROM vehicle_intelligence WHERE asset_id = ?').get(assetId)
  if (!vi) return ok(res, null)
  return ok(res, fetchFull(vi.id))
}

// ── POST /:assetId/expert ─────────────────────────────────────────────────────

function saveExpert(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  if (!assetId) return fail(res, 'Geçersiz assetId')
  const viId = getOrCreateRecord(assetId)
  const { expert_firm, expert_date, expert_no, expert_note, expert_score } = req.body
  db.prepare(`
    UPDATE vehicle_intelligence SET
      expert_firm=?, expert_date=?, expert_no=?, expert_note=?, expert_score=?,
      updated_at=datetime('now')
    WHERE id=?
  `).run(expert_firm ?? null, expert_date ?? null, expert_no ?? null,
         expert_note ?? null, expert_score ?? null, viId)
  return ok(res, fetchFull(viId))
}

// ── POST /:assetId/parts ──────────────────────────────────────────────────────

function saveParts(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  if (!assetId) return fail(res, 'Geçersiz assetId')
  const viId   = getOrCreateRecord(assetId)
  const { parts } = req.body // [{ part_key, status, notes }]
  if (!Array.isArray(parts)) return fail(res, 'parts dizisi gerekli')

  const upsert = db.prepare(`
    INSERT INTO vehicle_parts (vehicle_intelligence_id, part_key, status, notes, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(vehicle_intelligence_id, part_key)
    DO UPDATE SET status=excluded.status, notes=excluded.notes, updated_at=excluded.updated_at
  `)
  const tx = db.transaction(() => parts.forEach(p => upsert.run(viId, p.part_key, p.status ?? 'orijinal', p.notes ?? null)))
  tx()

  db.prepare("UPDATE vehicle_intelligence SET updated_at=datetime('now') WHERE id=?").run(viId)
  return ok(res, fetchFull(viId))
}

// ── POST /:assetId/photos — multer upload ─────────────────────────────────────

const uploadMiddleware = upload.single('photo')

function uploadPhoto(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  if (!assetId) return fail(res, 'Geçersiz assetId')

  uploadMiddleware(req, res, err => {
    if (err) return fail(res, `Yükleme hatası: ${err.message}`)
    if (!req.file) return fail(res, 'Dosya seçilmedi')

    const viId    = getOrCreateRecord(assetId)
    const partKey = req.body.part_key ?? 'genel'
    const relPath = `vehicle-photos/${req.file.filename}`

    db.prepare(`
      INSERT INTO vehicle_part_photos (vehicle_intelligence_id, part_key, file_path, original_name)
      VALUES (?, ?, ?, ?)
    `).run(viId, partKey, relPath, req.file.originalname)

    return ok(res, { file_path: relPath, part_key: partKey })
  })
}

// ── DELETE /photos/:photoId ───────────────────────────────────────────────────

function deletePhoto(req, res) {
  const photoId = parseInt(req.params.photoId, 10)
  const photo   = db.prepare('SELECT * FROM vehicle_part_photos WHERE id = ?').get(photoId)
  if (!photo) return fail(res, 'Fotoğraf bulunamadı', 404)

  const fullPath = path.join(__dirname, '../../../storage', photo.file_path)
  if (fs.existsSync(fullPath)) {
    try { fs.unlinkSync(fullPath) } catch (_) {}
  }
  db.prepare('DELETE FROM vehicle_part_photos WHERE id = ?').run(photoId)
  return ok(res, { deleted: true })
}

// ── POST /:assetId/tires ──────────────────────────────────────────────────────

function saveTires(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  if (!assetId) return fail(res, 'Geçersiz assetId')
  const viId  = getOrCreateRecord(assetId)
  const tires = req.body.tires // [{ position, brand, model, size, dot, tread_depth, status }]
  if (!Array.isArray(tires)) return fail(res, 'tires dizisi gerekli')

  const upsert = db.prepare(`
    INSERT INTO vehicle_tires (vehicle_intelligence_id, position, brand, model, size, dot, tread_depth, status, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(vehicle_intelligence_id, position)
    DO UPDATE SET brand=excluded.brand, model=excluded.model, size=excluded.size,
      dot=excluded.dot, tread_depth=excluded.tread_depth, status=excluded.status, updated_at=excluded.updated_at
  `)
  const tx = db.transaction(() => tires.forEach(t =>
    upsert.run(viId, t.position, t.brand ?? null, t.model ?? null,
               t.size ?? null, t.dot ?? null, t.tread_depth ?? null, t.status ?? 'iyi')
  ))
  tx()
  return ok(res, fetchFull(viId))
}

// ── POST /:assetId/battery ────────────────────────────────────────────────────

function saveBattery(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  if (!assetId) return fail(res, 'Geçersiz assetId')
  const viId = getOrCreateRecord(assetId)
  const { brand, ampere, install_date, test_result } = req.body

  const existing = db.prepare('SELECT id FROM vehicle_battery WHERE vehicle_intelligence_id = ?').get(viId)
  if (existing) {
    db.prepare(`UPDATE vehicle_battery SET brand=?,ampere=?,install_date=?,test_result=?,updated_at=datetime('now') WHERE vehicle_intelligence_id=?`)
      .run(brand ?? null, ampere ?? null, install_date ?? null, test_result ?? 'iyi', viId)
  } else {
    db.prepare(`INSERT INTO vehicle_battery (vehicle_intelligence_id,brand,ampere,install_date,test_result) VALUES (?,?,?,?,?)`)
      .run(viId, brand ?? null, ampere ?? null, install_date ?? null, test_result ?? 'iyi')
  }
  return ok(res, fetchFull(viId))
}

// ── GET /:assetId/maintenance ─────────────────────────────────────────────────

function getMaintenance(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  const vi = db.prepare('SELECT id FROM vehicle_intelligence WHERE asset_id = ?').get(assetId)
  if (!vi) return ok(res, [])
  return ok(res, db.prepare('SELECT * FROM vehicle_maintenance WHERE vehicle_intelligence_id = ? ORDER BY date DESC').all(vi.id))
}

// ── POST /:assetId/maintenance ────────────────────────────────────────────────

function addMaintenance(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  if (!assetId) return fail(res, 'Geçersiz assetId')
  const viId = getOrCreateRecord(assetId)
  const { type, date, km, notes, next_date, next_km } = req.body
  if (!type) return fail(res, 'type gerekli')
  const r = db.prepare(`
    INSERT INTO vehicle_maintenance (vehicle_intelligence_id,type,date,km,notes,next_date,next_km)
    VALUES (?,?,?,?,?,?,?)
  `).run(viId, type, date ?? null, km ?? null, notes ?? null, next_date ?? null, next_km ?? null)
  return ok(res, db.prepare('SELECT * FROM vehicle_maintenance WHERE id = ?').get(r.lastInsertRowid))
}

// ── PUT /maintenance/:id ──────────────────────────────────────────────────────

function updateMaintenance(req, res) {
  const id = parseInt(req.params.id, 10)
  const { date, km, notes, next_date, next_km } = req.body
  db.prepare(`UPDATE vehicle_maintenance SET date=?,km=?,notes=?,next_date=?,next_km=?,updated_at=datetime('now') WHERE id=?`)
    .run(date ?? null, km ?? null, notes ?? null, next_date ?? null, next_km ?? null, id)
  return ok(res, db.prepare('SELECT * FROM vehicle_maintenance WHERE id = ?').get(id))
}

// ── DELETE /maintenance/:id ───────────────────────────────────────────────────

function deleteMaintenance(req, res) {
  const id = parseInt(req.params.id, 10)
  db.prepare('DELETE FROM vehicle_maintenance WHERE id = ?').run(id)
  return ok(res, { deleted: true })
}

// ── POST /:assetId/ai-score ───────────────────────────────────────────────────

function generateScore(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  if (!assetId) return fail(res, 'Geçersiz assetId')
  const viId = getOrCreateRecord(assetId)
  const full = fetchFull(viId)

  // Try to get document health score for this asset
  const docScore = db.prepare(`
    SELECT AVG(di.confidence_score) as avg
    FROM documents d
    JOIN document_intelligence di ON di.document_id = d.id
    WHERE d.asset_id = ? AND d.deleted_at IS NULL
  `).get(assetId)?.avg ?? null

  const scores   = svc.calculateScores(full.parts, full.tires, full.battery, full.maintenance, docScore)
  const analysis = svc.generateAnalysis(full.parts, full.tires, full.battery, full.maintenance, full.expert_score)

  db.prepare(`
    UPDATE vehicle_intelligence SET
      ai_score=?, ai_analysis=?,
      score_kaporta=?, score_mekanik=?, score_elektrik=?,
      score_ic_mekan=?, score_lastik=?, score_bakim=?, score_belge=?,
      updated_at=datetime('now')
    WHERE id=?
  `).run(scores.aiScore, analysis, scores.kaporta, scores.mekanik,
         scores.elektrik, scores.icMekan, scores.lastik, scores.bakim, scores.belge, viId)

  return ok(res, { ...scores, analysis })
}

module.exports = {
  getDashboardStats,
  getByAsset,
  saveExpert,
  saveParts,
  uploadPhoto,
  deletePhoto,
  saveTires,
  saveBattery,
  getMaintenance,
  addMaintenance,
  updateMaintenance,
  deleteMaintenance,
  generateScore,
}
