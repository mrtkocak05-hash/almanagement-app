/**
 * Document Intelligence Controller
 * Full OCR → classify → extract → validate → match → summarize pipeline
 */

const db        = require('../database/init')
const ocrProv   = require('../services/ocrProvider')
const svc       = require('../services/documentIntelligenceService')
const aiMem     = require('./aiMemoryController')

// ── Helpers ───────────────────────────────────────────────────────────────────

function respond(res, data, status = 200) {
  return res.status(status).json({ success: true, data })
}

function fail(res, msg, status = 400) {
  return res.status(status).json({ success: false, message: msg })
}

// ── POST /:documentId — Full Intelligence Pipeline ────────────────────────────

async function processDocument(req, res) {
  const docId    = parseInt(req.params.documentId, 10)
  const ocrName  = req.body?.ocr_provider ?? 'rule_engine'
  const tenantId = req.user?.tenantId ?? req.user?.id ?? 1

  if (!docId) return fail(res, 'Geçersiz belge ID', 400)

  const doc = db.prepare(`
    SELECT d.*, a.*, p.*
    FROM documents d
    LEFT JOIN assets a ON d.asset_id = a.id
    LEFT JOIN asset_purchases p ON p.asset_id = a.id
    WHERE d.id = ? AND d.deleted_at IS NULL
  `).get(docId)

  if (!doc) return fail(res, 'Belge bulunamadı', 404)

  const steps = []
  let ocrText = ''
  let ocrConfidence = 0

  // Step 1: OCR
  try {
    const provider  = ocrProv.getProvider(ocrName)
    const filePath  = ocrProv.resolveFilePath(doc.file_path ?? doc.path)
    const ocrResult = await provider.extract(filePath, doc)
    ocrText         = ocrResult.text ?? ''
    ocrConfidence   = ocrResult.confidence ?? 0
    steps.push({ step: 'ocr', provider: provider.name, chars: ocrText.length, confidence: ocrConfidence })
  } catch (e) {
    steps.push({ step: 'ocr', error: e.message })
  }

  // Step 2: Classify
  const docType = svc.classifyDocument(doc.type, doc.category, doc.title, doc.keywords ?? '')
  steps.push({ step: 'classify', doc_type: docType })

  // Step 3: Extract fields (requires linked asset data)
  const asset    = doc.asset_id ? db.prepare('SELECT * FROM assets WHERE id = ?').get(doc.asset_id) : null
  const purchase = doc.asset_id ? db.prepare('SELECT * FROM asset_purchases WHERE asset_id = ? ORDER BY id DESC LIMIT 1').get(doc.asset_id) : null
  const fields   = svc.extractFields(docType, asset, purchase)
  steps.push({ step: 'extract', field_count: Object.keys(fields).length })

  // Step 4: Confidence
  const confidence = svc.calculateConfidence(docType, fields, ocrText)
  steps.push({ step: 'confidence', score: confidence })

  // Step 5: Duplicate detection
  const { is_duplicate, duplicate_of_id } = svc.detectDuplicate(db, docId, doc.title, doc.asset_id)
  steps.push({ step: 'duplicate', is_duplicate, duplicate_of_id })

  // Step 6: Asset matching
  const assetMatch = svc.findRelatedAsset(db, doc, fields, docType)
  steps.push({ step: 'asset_match', found: !!assetMatch.asset_id, confidence: assetMatch.confidence })

  // Step 7: Summary
  const summary = svc.summarizeDocument(docType, fields, asset, doc)
  steps.push({ step: 'summary', length: summary.length })

  // Step 8: Validation
  const validation = svc.validateDocument(docType, fields)
  steps.push({ step: 'validate', valid: validation.valid, errors: validation.errors.length })

  // Persist to document_intelligence
  const now = new Date().toISOString()
  const existing = db.prepare('SELECT id FROM document_intelligence WHERE document_id = ?').get(docId)

  const payload = {
    ocr_text:          ocrText,
    extracted_fields:  JSON.stringify(fields),
    document_type:     docType,
    confidence_score:  confidence,
    summary,
    auto_link_asset_id: assetMatch.asset_id ?? null,
    link_suggestions:  JSON.stringify(assetMatch.suggestions),
    is_duplicate:      is_duplicate ? 1 : 0,
    duplicate_of_id:   duplicate_of_id ?? null,
    ocr_provider:      ocrName,
    pipeline_steps:    JSON.stringify(steps),
    processed_at:      now,
    updated_at:        now,
  }

  if (existing) {
    db.prepare(`
      UPDATE document_intelligence SET
        ocr_text=?, extracted_fields=?, document_type=?, confidence_score=?,
        summary=?, auto_link_asset_id=?, link_suggestions=?,
        is_duplicate=?, duplicate_of_id=?, ocr_provider=?,
        pipeline_steps=?, processed_at=?, updated_at=?
      WHERE document_id=?
    `).run(
      payload.ocr_text, payload.extracted_fields, payload.document_type, payload.confidence_score,
      payload.summary, payload.auto_link_asset_id, payload.link_suggestions,
      payload.is_duplicate, payload.duplicate_of_id, payload.ocr_provider,
      payload.pipeline_steps, payload.processed_at, payload.updated_at,
      docId,
    )
  } else {
    db.prepare(`
      INSERT INTO document_intelligence
        (document_id, ocr_text, extracted_fields, document_type, confidence_score,
         summary, auto_link_asset_id, link_suggestions, is_duplicate, duplicate_of_id,
         ocr_provider, pipeline_steps, processed_at, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      docId,
      payload.ocr_text, payload.extracted_fields, payload.document_type, payload.confidence_score,
      payload.summary, payload.auto_link_asset_id, payload.link_suggestions,
      payload.is_duplicate, payload.duplicate_of_id, payload.ocr_provider,
      payload.pipeline_steps, payload.processed_at, now, now,
    )
  }

  // Save to AI Memory V4
  try {
    db.prepare(`
      INSERT INTO ai_memories (tenant_id, title, content, source_module, status, created_at, updated_at)
      VALUES (?, ?, ?, 'document_intelligence', 'active', datetime('now'), datetime('now'))
    `).run(
      tenantId,
      `Belge Analizi: ${doc.title ?? docType}`,
      `[${svc.DOC_TYPE_LABELS[docType]}] ${summary} | Güven: %${confidence}`,
    )
  } catch { /* non-fatal */ }

  return respond(res, {
    document_id:   docId,
    document_type: docType,
    confidence,
    is_duplicate,
    duplicate_of_id,
    asset_match:   assetMatch,
    fields,
    summary,
    validation,
    pipeline_steps: steps,
    ocr_provider:   ocrName,
    processed_at:   now,
  })
}

// ── GET /:documentId — Get Intelligence ──────────────────────────────────────

function getIntelligence(req, res) {
  const docId = parseInt(req.params.documentId, 10)
  const intel = db.prepare('SELECT * FROM document_intelligence WHERE document_id = ?').get(docId)
  if (!intel) return fail(res, 'Belge henüz analiz edilmedi', 404)

  return respond(res, {
    ...intel,
    extracted_fields:  JSON.parse(intel.extracted_fields  ?? '{}'),
    link_suggestions:  JSON.parse(intel.link_suggestions  ?? '[]'),
    pipeline_steps:    JSON.parse(intel.pipeline_steps    ?? '[]'),
  })
}

// ── GET /health — Document Health Summary ────────────────────────────────────

function getDocumentHealth(req, res) {
  const total   = db.prepare('SELECT COUNT(*) as c FROM documents WHERE deleted_at IS NULL').get().c
  const analyzed= db.prepare('SELECT COUNT(*) as c FROM document_intelligence').get().c
  const expired = db.prepare(`
    SELECT COUNT(*) as c FROM documents
    WHERE deleted_at IS NULL AND expire_date IS NOT NULL AND expire_date < date('now')
  `).get().c
  const expiring= db.prepare(`
    SELECT COUNT(*) as c FROM documents
    WHERE deleted_at IS NULL AND expire_date IS NOT NULL
      AND expire_date >= date('now') AND expire_date <= date('now','+30 days')
  `).get().c
  const duplicates = db.prepare('SELECT COUNT(*) as c FROM document_intelligence WHERE is_duplicate = 1').get().c
  const lowConf    = db.prepare('SELECT COUNT(*) as c FROM document_intelligence WHERE confidence_score < 40').get().c

  return respond(res, {
    total_documents:     total,
    analyzed_documents:  analyzed,
    unanalyzed:          total - analyzed,
    expired_documents:   expired,
    expiring_soon:       expiring,
    duplicate_documents: duplicates,
    low_confidence:      lowConf,
    health_score: Math.max(0, Math.round(
      100 - (expired * 15) - (expiring * 5) - (duplicates * 5) - ((total - analyzed) / Math.max(total, 1)) * 20
    )),
  })
}

// ── GET /health/assets — Health per Asset ────────────────────────────────────

function getHealthByAsset(req, res) {
  const rows = db.prepare(`
    SELECT
      a.id,
      a.name,
      a.type,
      COUNT(d.id)                                             AS doc_count,
      SUM(CASE WHEN di.confidence_score >= 70 THEN 1 ELSE 0 END) AS confident_docs,
      SUM(CASE WHEN d.expire_date < date('now') THEN 1 ELSE 0 END) AS expired_docs,
      SUM(CASE WHEN di.is_duplicate = 1 THEN 1 ELSE 0 END)        AS duplicate_docs,
      AVG(di.confidence_score)                                AS avg_confidence
    FROM assets a
    LEFT JOIN documents d ON d.asset_id = a.id AND d.deleted_at IS NULL
    LEFT JOIN document_intelligence di ON di.document_id = d.id
    WHERE a.deleted_at IS NULL
    GROUP BY a.id
    ORDER BY doc_count DESC
    LIMIT 50
  `).all()

  return respond(res, rows.map(r => ({
    ...r,
    avg_confidence: r.avg_confidence ? Math.round(r.avg_confidence) : null,
    health_status: r.expired_docs > 0 ? 'critical'
      : r.doc_count === 0             ? 'missing'
      : r.duplicate_docs > 0          ? 'warning'
      : r.confident_docs / Math.max(r.doc_count, 1) >= 0.7 ? 'good' : 'warning',
  })))
}

// ── GET /missing — Assets Missing Documents ───────────────────────────────────

function getMissingDocuments(req, res) {
  const rows = db.prepare(`
    SELECT a.id, a.name, a.type,
      (SELECT COUNT(*) FROM documents d WHERE d.asset_id = a.id AND d.deleted_at IS NULL) AS doc_count
    FROM assets a
    WHERE a.deleted_at IS NULL
    HAVING doc_count = 0
    ORDER BY a.name
    LIMIT 50
  `).all()

  return respond(res, rows)
}

// ── GET /expiring — Expiring Documents ───────────────────────────────────────

function getExpiringDocuments(req, res) {
  const days  = parseInt(req.query.days ?? '30', 10)
  const rows  = db.prepare(`
    SELECT
      d.id, d.title, d.expire_date, d.asset_id,
      a.name AS asset_name, a.type AS asset_type,
      di.document_type, di.confidence_score
    FROM documents d
    LEFT JOIN assets a ON a.id = d.asset_id
    LEFT JOIN document_intelligence di ON di.document_id = d.id
    WHERE d.deleted_at IS NULL AND d.expire_date IS NOT NULL
      AND d.expire_date <= date('now', '+' || ? || ' days')
    ORDER BY d.expire_date ASC
    LIMIT 50
  `).all(days)

  return respond(res, rows.map(r => ({
    ...r,
    days_left: Math.ceil((new Date(r.expire_date) - Date.now()) / 86400000),
    status: new Date(r.expire_date) < new Date() ? 'expired' : 'expiring',
  })))
}

// ── GET /stats — Intelligence Stats ──────────────────────────────────────────

function getStats(req, res) {
  const byType = db.prepare(`
    SELECT document_type, COUNT(*) as count, AVG(confidence_score) as avg_confidence
    FROM document_intelligence
    GROUP BY document_type
    ORDER BY count DESC
  `).all()

  const byProvider = db.prepare(`
    SELECT ocr_provider, COUNT(*) as count, AVG(confidence_score) as avg_confidence
    FROM document_intelligence
    GROUP BY ocr_provider
  `).all()

  const recent = db.prepare(`
    SELECT di.document_id, di.document_type, di.confidence_score, di.processed_at,
      d.title
    FROM document_intelligence di
    JOIN documents d ON d.id = di.document_id
    ORDER BY di.processed_at DESC
    LIMIT 10
  `).all()

  return respond(res, {
    by_type:    byType.map(r => ({ ...r, avg_confidence: Math.round(r.avg_confidence ?? 0) })),
    by_provider:byProvider.map(r => ({ ...r, avg_confidence: Math.round(r.avg_confidence ?? 0) })),
    recent_processed: recent,
  })
}

module.exports = {
  processDocument,
  getIntelligence,
  getDocumentHealth,
  getHealthByAsset,
  getMissingDocuments,
  getExpiringDocuments,
  getStats,
}
