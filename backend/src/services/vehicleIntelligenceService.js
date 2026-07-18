/**
 * Vehicle Intelligence Service — Sprint 13.0
 * Score calculation + AI analysis text generation
 */

const VEHICLE_TYPES = ['arac', 'motosiklet', 'karavan', 'is_makinesi']

const BODY_PARTS = [
  'on_tampon', 'arka_tampon', 'kaput', 'tavan', 'bagaj',
  'sag_on_camurluk', 'sag_arka_camurluk', 'sol_on_camurluk', 'sol_arka_camurluk',
  'sag_on_kapi', 'sag_arka_kapi', 'sol_on_kapi', 'sol_arka_kapi',
  'sag_ayna', 'sol_ayna', 'farlar', 'stoplar', 'camlar',
]

const DAMAGE_STATUSES = ['hasarli', 'catlak', 'gocuk', 'degisen', 'islemli']
const PAINT_STATUSES  = ['boyali', 'lokal_boyali', 'sok_tak']

const STATUS_LABELS = {
  orijinal:     'Orijinal',
  boyali:       'Boyalı',
  lokal_boyali: 'Lokal Boyalı',
  degisen:      'Değişen',
  sok_tak:      'Sök-Tak',
  islemli:      'İşlemli',
  hasarli:      'Hasarlı',
  catlak:       'Çatlak',
  gocuk:        'Göçük',
}

const PART_LABELS = {
  on_tampon:         'Ön Tampon',
  arka_tampon:       'Arka Tampon',
  kaput:             'Kaput',
  tavan:             'Tavan',
  bagaj:             'Bagaj',
  sag_on_camurluk:   'Sağ Ön Çamurluk',
  sag_arka_camurluk: 'Sağ Arka Çamurluk',
  sol_on_camurluk:   'Sol Ön Çamurluk',
  sol_arka_camurluk: 'Sol Arka Çamurluk',
  sag_on_kapi:       'Sağ Ön Kapı',
  sag_arka_kapi:     'Sağ Arka Kapı',
  sol_on_kapi:       'Sol Ön Kapı',
  sol_arka_kapi:     'Sol Arka Kapı',
  sag_ayna:          'Sağ Ayna',
  sol_ayna:          'Sol Ayna',
  farlar:            'Farlar',
  stoplar:           'Stoplar',
  jantlar:           'Jantlar',
  camlar:            'Camlar',
}

const MAINTENANCE_LABELS = {
  periyodik: 'Periyodik Bakım',
  yag:       'Yağ Değişimi',
  filtre:    'Filtre Değişimi',
  triger:    'Triger',
  fren:      'Fren',
  sanziman:  'Şanzıman',
}

// ── Score Calculation ─────────────────────────────────────────────────────────

function calculateScores(parts, tires, battery, maintenance, docScore) {
  // Kaporta: penalize damaged/changed body parts
  const bodyParts = parts.filter(p => BODY_PARTS.includes(p.part_key))
  const damaged  = bodyParts.filter(p => DAMAGE_STATUSES.includes(p.status)).length
  const painted  = bodyParts.filter(p => PAINT_STATUSES.includes(p.status)).length
  const total    = BODY_PARTS.length
  const kaporta  = Math.max(0, 100 - (damaged * 12) - (painted * 5))

  // Lastik: based on tread depth and status
  let lastik = 75
  if (tires.length > 0) {
    const withDepth = tires.filter(t => t.tread_depth != null)
    if (withDepth.length > 0) {
      const avgDepth = withDepth.reduce((s, t) => s + t.tread_depth, 0) / withDepth.length
      lastik = Math.min(100, Math.round(avgDepth * 12.5))
    }
    const badTires = tires.filter(t => t.status && ['degistir', 'kotu', 'hasarli'].includes(t.status)).length
    lastik = Math.max(0, lastik - badTires * 20)
  }

  // Bakım: based on completeness of maintenance records
  const mTypes = Object.keys(MAINTENANCE_LABELS)
  const done   = mTypes.filter(t => maintenance.some(m => m.type === t)).length
  const bakim  = Math.round((done / mTypes.length) * 100)

  // Elektrik, İç Mekan: default if no specific data
  const elektrik = 72
  const icMekan  = 75

  // Mekanik: based on maintenance (oil, filter, triger) + bakım
  const mechTypes = ['yag', 'filtre', 'triger', 'fren']
  const mechDone  = mechTypes.filter(t => maintenance.some(m => m.type === t)).length
  const mekanik   = Math.round((mechDone / mechTypes.length) * 85 + 15)

  // Belge: from doc intelligence score or default
  const belge = docScore ? Math.round(docScore) : 55

  // Overall AI Score (weighted average)
  const weights = [
    { score: kaporta,  w: 0.25 },
    { score: mekanik,  w: 0.20 },
    { score: elektrik, w: 0.10 },
    { score: icMekan,  w: 0.10 },
    { score: lastik,   w: 0.15 },
    { score: bakim,    w: 0.10 },
    { score: belge,    w: 0.10 },
  ]
  const aiScore = Math.round(weights.reduce((s, { score, w }) => s + score * w, 0))

  return { aiScore, kaporta, mekanik, elektrik, icMekan, lastik, bakim, belge }
}

// ── AI Analysis Text ──────────────────────────────────────────────────────────

function generateAnalysis(parts, tires, battery, maintenance, expertScore) {
  const lines = []

  // Kaporta analysis
  const damagedParts  = parts.filter(p => DAMAGE_STATUSES.includes(p.status))
  const paintedParts  = parts.filter(p => PAINT_STATUSES.includes(p.status))
  const changedParts  = parts.filter(p => p.status === 'degisen')

  if (damagedParts.length === 0 && paintedParts.length === 0) {
    lines.push('Kaporta durumu temiz görünmektedir, belirgin hasar veya boya tespit edilmemiştir.')
  }
  if (paintedParts.length > 0) {
    const names = paintedParts.map(p => PART_LABELS[p.part_key] ?? p.part_key).join(', ')
    lines.push(`${names} parçalarında boya işlemi tespit edilmiştir.`)
  }
  if (damagedParts.length > 0) {
    const names = damagedParts.map(p => PART_LABELS[p.part_key] ?? p.part_key).join(', ')
    lines.push(`${names} parçalarında hasar bulunmaktadır; onarım önerilir.`)
  }
  if (changedParts.length > 0) {
    const names = changedParts.map(p => PART_LABELS[p.part_key] ?? p.part_key).join(', ')
    lines.push(`${names} değiştirilmiş parça olarak kayıtlıdır.`)
  }

  // Tire analysis
  if (tires.length > 0) {
    const withDepth = tires.filter(t => t.tread_depth != null)
    if (withDepth.length > 0) {
      const avg = withDepth.reduce((s, t) => s + t.tread_depth, 0) / withDepth.length
      if (avg < 3) {
        lines.push(`Lastik diş derinliği ortalama ${avg.toFixed(1)} mm — yakın vadede lastik değişimi planlanmalıdır.`)
      } else if (avg < 5) {
        lines.push(`Lastik diş derinliği ortalama ${avg.toFixed(1)} mm — orta düzey kullanım ömrü kalmıştır.`)
      } else {
        lines.push(`Lastikler ${avg.toFixed(1)} mm diş derinliğiyle iyi durumda görünmektedir.`)
      }
    }
  }

  // Battery analysis
  if (battery) {
    const ageYears = battery.install_date
      ? Math.floor((Date.now() - new Date(battery.install_date).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null
    if (ageYears != null && ageYears >= 3) {
      lines.push(`Akü ${ageYears} yıl önce takılmış; değişim planlanması tavsiye edilir.`)
    } else if (ageYears != null) {
      lines.push(`Akü ${ageYears} yıl önce takılmış; güncel durumu yeterli görünmektedir.`)
    }
  }

  // Maintenance analysis
  const missing = Object.keys(MAINTENANCE_LABELS).filter(t => !maintenance.some(m => m.type === t))
  if (missing.length > 0) {
    const names = missing.map(t => MAINTENANCE_LABELS[t]).join(', ')
    lines.push(`Bakım geçmişinde ${names} kaydı bulunmamaktadır.`)
  } else {
    lines.push('Tüm temel bakım kayıtları mevcut görünmektedir.')
  }

  // Expert analysis
  if (expertScore != null) {
    if (expertScore >= 80) {
      lines.push(`Eksper puanı ${expertScore} ile yüksek seviyede; araç alım için uygundur.`)
    } else if (expertScore >= 60) {
      lines.push(`Eksper puanı ${expertScore} — orta düzey, satın almadan önce öne çıkan konular değerlendirilmelidir.`)
    } else {
      lines.push(`Eksper puanı ${expertScore} — dikkatli değerlendirme yapılması tavsiye edilir.`)
    }
  }

  return lines.join('\n') || 'Henüz yeterli veri bulunmadığından analiz oluşturulamadı.'
}

module.exports = {
  calculateScores,
  generateAnalysis,
  VEHICLE_TYPES,
  PART_LABELS,
  STATUS_LABELS,
  MAINTENANCE_LABELS,
}
