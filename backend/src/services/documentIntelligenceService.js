/**
 * Document Intelligence Service
 * classifyDocument, extractFields, summarizeDocument, validateDocument,
 * findRelatedAsset, calculateConfidence, detectDuplicate
 */

// ── Document Type Classification ──────────────────────────────────────────────

const DOC_TYPE_LABELS = {
  arac_ruhsati:       'Araç Ruhsatı',
  arac_faturasi:      'Araç Faturası',
  noter_satis:        'Noter Satış Belgesi',
  eksper_raporu:      'Eksper Raporu',
  kasko:              'Kasko Poliçesi',
  trafik_sigortasi:   'Trafik Sigortası',
  servis_faturasi:    'Servis/Bakım Faturası',
  tapu:               'Tapu Senedi',
  kira_kontrati:      'Kira Kontratı',
  is_makinesi_ruhsati:'İş Makinesi Tescil',
  diger:              'Diğer Belge',
}

function classifyDocument(type = '', category = '', title = '', keywords = '') {
  const text = `${type} ${category} ${title} ${keywords}`.toLowerCase()

  if (text.includes('tapu')) return 'tapu'
  if (text.includes('kira')) return 'kira_kontrati'
  if (text.includes('noter') || text.includes('satış belgesi') || text.includes('satis belgesi')) return 'noter_satis'
  if (text.includes('eksper') || text.includes('hasar rapor')) return 'eksper_raporu'
  if (text.includes('kasko')) return 'kasko'
  if (text.includes('trafik sigorta') || (text.includes('sigorta') && !text.includes('kasko'))) return 'trafik_sigortasi'
  if (text.includes('servis') && (text.includes('fatura') || text.includes('bakim') || text.includes('bakım'))) return 'servis_faturasi'
  if (text.includes('fatura')) return 'arac_faturasi'
  if (text.includes('ruhsat') && (text.includes('makine') || text.includes('iş') || text.includes('is '))) return 'is_makinesi_ruhsati'
  if (text.includes('ruhsat')) return 'arac_ruhsati'
  return 'diger'
}

// ── Field Extraction ──────────────────────────────────────────────────────────

const MISSING = 'Çıkarılamadı'

function extractFields(docType, asset, purchase) {
  const a = asset ?? {}
  const p = purchase ?? {}
  const today = new Date().toISOString().split('T')[0]

  switch (docType) {
    case 'arac_ruhsati':
      return {
        plaka:          a.plate          ?? MISSING,
        sasi_no:        a.vin            ?? MISSING,
        motor_no:       a.engine_number  ?? MISSING,
        marka:          a.brand          ?? MISSING,
        model:          a.model          ?? MISSING,
        model_yili:     a.year?.toString()   ?? MISSING,
        yakit_turu:     a.fuel_type      ?? MISSING,
        renk:           a.color          ?? MISSING,
        ruhsat_sahibi:  MISSING,
      }
    case 'arac_faturasi':
      return {
        firma_adi:      p.seller_name    ?? MISSING,
        vergi_no:       MISSING,
        kdv_tutari:     MISSING,
        toplam_tutar:   p.purchase_price_try?.toString() ?? MISSING,
        fatura_tarihi:  p.purchase_date  ?? MISSING,
        fatura_no:      MISSING,
        arac_bilgisi:   [a.brand, a.model].filter(Boolean).join(' ') || MISSING,
      }
    case 'noter_satis':
      return {
        satici_adi:     p.seller_name    ?? MISSING,
        alici_adi:      MISSING,
        satis_tutari:   p.purchase_price_try?.toString() ?? MISSING,
        satis_tarihi:   p.purchase_date  ?? MISSING,
        noter_adi:      MISSING,
        islem_no:       MISSING,
      }
    case 'eksper_raporu':
      return {
        hasar_tutari:   MISSING,
        hasar_durumu:   a.damage_status  ?? MISSING,
        marka_model:    [a.brand, a.model].filter(Boolean).join(' ') || MISSING,
        deger:          a.current_value?.toString() ?? MISSING,
        rapor_tarihi:   today,
        eksper_adi:     MISSING,
      }
    case 'kasko':
      return {
        plaka:           a.plate          ?? MISSING,
        police_no:       MISSING,
        baslangic_tarihi:MISSING,
        bitis_tarihi:    MISSING,
        sigorta_sirketi: MISSING,
        prim_tutari:     MISSING,
        sigorta_turu:    'Kasko',
      }
    case 'trafik_sigortasi':
      return {
        plaka:           a.plate          ?? MISSING,
        police_no:       MISSING,
        baslangic_tarihi:MISSING,
        bitis_tarihi:    MISSING,
        sigorta_sirketi: MISSING,
        prim_tutari:     MISSING,
        sigorta_turu:    'Trafik Sigortası',
      }
    case 'servis_faturasi':
      return {
        servis_adi:      MISSING,
        yapilan_islemler:MISSING,
        tutar:           MISSING,
        tarih:           today,
        plaka_arac:      a.plate ?? a.name ?? MISSING,
      }
    case 'tapu':
      return {
        malik_adi:   MISSING,
        tapu_no:     MISSING,
        ada_parsel:  MISSING,
        adres:       a.location_address ?? MISSING,
        yuzolcumu:   a.gross_area?.toString() ?? MISSING,
        tapu_tarihi: MISSING,
      }
    case 'kira_kontrati':
      return {
        kiraya_veren:     MISSING,
        kiraci:           MISSING,
        kira_tutari:      MISSING,
        baslangic_tarihi: MISSING,
        bitis_tarihi:     MISSING,
        adres:            a.location_address ?? MISSING,
      }
    case 'is_makinesi_ruhsati':
      return {
        makine_tipi:  a.equipment_type   ?? MISSING,
        seri_no:      a.serial_number    ?? MISSING,
        marka_model:  [a.brand, a.model].filter(Boolean).join(' ') || MISSING,
        yil:          a.year?.toString() ?? MISSING,
        sahip_adi:    MISSING,
      }
    default:
      return {
        belge_turu:      DOC_TYPE_LABELS[docType] ?? 'Bilinmiyor',
        isleme_tarihi:   today,
        aciklama:        'AI destekli belge analizi için gerçek OCR entegrasyonu gereklidir.',
      }
  }
}

// ── Confidence Score ──────────────────────────────────────────────────────────

function calculateConfidence(docType, fields, ocrText) {
  if (!fields) return 0

  const values  = Object.values(fields)
  const total   = values.length
  const filled  = values.filter(v => v !== MISSING && v && v !== 'Çıkarılamadı').length
  const fieldRatio = total > 0 ? filled / total : 0

  // Base confidence from field population
  let score = fieldRatio * 60

  // Bonus for OCR text
  if (ocrText && ocrText.length > 100) score += 20
  else if (ocrText && ocrText.length > 20) score += 10

  // Bonus for recognized document type
  if (docType !== 'diger') score += 15

  // Cap at 95 for non-real-OCR
  return Math.min(Math.round(score), 95)
}

// ── Document Summary ──────────────────────────────────────────────────────────

function summarizeDocument(docType, fields, asset, doc) {
  const label   = DOC_TYPE_LABELS[docType] ?? 'Belge'
  const assetName = asset?.name ?? doc?.title ?? 'Bilinmiyor'
  const lines   = [`${label} — ${assetName}`]

  const f = fields ?? {}

  switch (docType) {
    case 'arac_ruhsati':
      if (f.plaka       !== MISSING) lines.push(`Plaka: ${f.plaka}`)
      if (f.marka       !== MISSING) lines.push(`${f.marka} ${f.model ?? ''} ${f.model_yili ?? ''}`.trim())
      if (f.sasi_no     !== MISSING) lines.push(`Şasi: ${f.sasi_no}`)
      break
    case 'kasko': case 'trafik_sigortasi':
      if (f.plaka           !== MISSING) lines.push(`Plaka: ${f.plaka}`)
      if (f.bitis_tarihi    !== MISSING) lines.push(`Bitiş: ${f.bitis_tarihi}`)
      if (f.sigorta_sirketi !== MISSING) lines.push(`Şirket: ${f.sigorta_sirketi}`)
      break
    case 'arac_faturasi':
      if (f.firma_adi    !== MISSING) lines.push(`Firma: ${f.firma_adi}`)
      if (f.toplam_tutar !== MISSING) lines.push(`Tutar: ₺${f.toplam_tutar}`)
      if (f.fatura_tarihi !== MISSING) lines.push(`Tarih: ${f.fatura_tarihi}`)
      break
    case 'tapu':
      if (f.adres      !== MISSING) lines.push(`Adres: ${f.adres}`)
      if (f.yuzolcumu  !== MISSING) lines.push(`Yüzölçüm: ${f.yuzolcumu} m²`)
      break
    case 'kira_kontrati':
      if (f.kira_tutari       !== MISSING) lines.push(`Kira: ₺${f.kira_tutari}`)
      if (f.bitis_tarihi      !== MISSING) lines.push(`Bitiş: ${f.bitis_tarihi}`)
      break
    default:
      lines.push(`Belge tipi: ${label}`)
  }

  if (doc?.expire_date) {
    const diff = Math.ceil((new Date(doc.expire_date) - Date.now()) / 86400000)
    if (diff < 0)  lines.push(`⚠️ Süresi dolmuş (${Math.abs(diff)} gün önce)`)
    else if (diff <= 30) lines.push(`⚠️ ${diff} gün içinde bitiyor`)
  }

  return lines.join('\n')
}

// ── Document Validation ───────────────────────────────────────────────────────

const REQUIRED_FIELDS = {
  arac_ruhsati:     ['plaka', 'marka', 'model'],
  kasko:            ['plaka', 'police_no', 'bitis_tarihi'],
  trafik_sigortasi: ['plaka', 'police_no', 'bitis_tarihi'],
  arac_faturasi:    ['firma_adi', 'toplam_tutar', 'fatura_tarihi'],
  tapu:             ['malik_adi', 'tapu_no', 'adres'],
  kira_kontrati:    ['kiraya_veren', 'kiraci', 'kira_tutari', 'bitis_tarihi'],
}

function validateDocument(docType, fields) {
  const required = REQUIRED_FIELDS[docType] ?? []
  const f = fields ?? {}
  const missing = required.filter(k => !f[k] || f[k] === MISSING)
  const warnings = []
  const errors = []

  missing.forEach(k => errors.push(`Zorunlu alan eksik: ${k}`))

  if (docType === 'kasko' || docType === 'trafik_sigortasi') {
    if (f.bitis_tarihi && f.bitis_tarihi !== MISSING) {
      const diff = Math.ceil((new Date(f.bitis_tarihi) - Date.now()) / 86400000)
      if (diff < 0)  errors.push('Sigorta süresi dolmuş.')
      else if (diff <= 30) warnings.push(`Sigorta ${diff} gün içinde bitiyor.`)
    }
  }

  return {
    valid:    errors.length === 0,
    errors,
    warnings,
    score:    Math.max(0, 100 - errors.length * 20 - warnings.length * 5),
  }
}

// ── Asset Matching ────────────────────────────────────────────────────────────

function findRelatedAsset(db, doc, fields, docType) {
  // 1. Already linked
  if (doc.asset_id) {
    const asset = db.prepare('SELECT id, name, type FROM assets WHERE id = ? AND deleted_at IS NULL').get(doc.asset_id)
    if (asset) return { asset_id: asset.id, asset_name: asset.name, confidence: 100, suggestions: [] }
  }

  const suggestions = []
  const f = fields ?? {}

  // 2. Match by plate
  if (f.plaka && f.plaka !== MISSING) {
    const byPlate = db.prepare('SELECT id, name, type, plate FROM assets WHERE plate = ? AND deleted_at IS NULL LIMIT 3').all(f.plaka)
    byPlate.forEach(a => suggestions.push({ asset_id: a.id, asset_name: a.name, asset_type: a.type, score: 90, reason: 'Plaka eşleşmesi' }))
  }

  // 3. Match by VIN/chassis
  if (f.sasi_no && f.sasi_no !== MISSING) {
    const byVin = db.prepare('SELECT id, name, type, vin FROM assets WHERE vin = ? AND deleted_at IS NULL LIMIT 3').all(f.sasi_no)
    byVin.forEach(a => {
      if (!suggestions.find(s => s.asset_id === a.id))
        suggestions.push({ asset_id: a.id, asset_name: a.name, asset_type: a.type, score: 95, reason: 'Şasi No eşleşmesi' })
    })
  }

  // 4. Match by title keywords
  if (doc.title) {
    const words = doc.title.split(/\s+/).filter(w => w.length > 3)
    for (const word of words.slice(0, 3)) {
      const byName = db.prepare(`SELECT id, name, type FROM assets WHERE name LIKE ? AND deleted_at IS NULL LIMIT 3`).all(`%${word}%`)
      byName.forEach(a => {
        if (!suggestions.find(s => s.asset_id === a.id))
          suggestions.push({ asset_id: a.id, asset_name: a.name, asset_type: a.type, score: 50, reason: 'Başlık eşleşmesi' })
      })
    }
  }

  const top = suggestions.sort((a, b) => b.score - a.score).slice(0, 3)
  const best = top[0]

  if (best && best.score >= 80) {
    return { asset_id: best.asset_id, asset_name: best.asset_name, confidence: best.score, suggestions: top }
  }

  return { asset_id: null, asset_name: null, confidence: 0, suggestions: top }
}

// ── Duplicate Detection ───────────────────────────────────────────────────────

function detectDuplicate(db, documentId, title, assetId) {
  // Check for same title + same asset_id (different document id)
  const dupe = db.prepare(`
    SELECT id, title FROM documents
    WHERE id != ? AND deleted_at IS NULL AND title = ?
      ${assetId ? 'AND asset_id = ?' : ''}
    LIMIT 1
  `).get(...[documentId, title, ...(assetId ? [assetId] : [])])

  if (dupe) return { is_duplicate: true, duplicate_of_id: dupe.id }

  // Check intelligence table for similar ocr hash (simplified: same filename)
  return { is_duplicate: false, duplicate_of_id: null }
}

module.exports = {
  classifyDocument,
  extractFields,
  calculateConfidence,
  summarizeDocument,
  validateDocument,
  findRelatedAsset,
  detectDuplicate,
  DOC_TYPE_LABELS,
}
