const { getDb } = require('../database/connection')

const now = () => new Date().toISOString().replace('T', ' ').split('.')[0]

// ── Stats helper ──────────────────────────────────────────────────────────────

function computeStats(listings) {
  const prices = listings.map(l => l.price).sort((a, b) => a - b)
  if (!prices.length) return { min: 0, max: 0, avg: 0, median: 0, range: 0, count: 0 }
  const min = prices[0]
  const max = prices[prices.length - 1]
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
  const mid = Math.floor(prices.length / 2)
  const median = prices.length % 2 === 0 ? Math.round((prices[mid - 1] + prices[mid]) / 2) : prices[mid]
  return { min, max, avg, median, range: max - min, count: prices.length }
}

function computeOpportunityScore(listings) {
  if (!listings.length) return { score: 0, rating: 'pahalı', stars: 1 }
  const stats = computeStats(listings)
  const avg = stats.avg
  if (!avg) return { score: 0, rating: 'pahalı', stars: 1 }

  // Score based on listing spread and count
  let dataBonus = Math.min(listings.length * 2, 10)
  let spreadPenalty = stats.range / avg > 0.5 ? 5 : 0
  const baseScore = Math.max(0, 70 + dataBonus - spreadPenalty)

  let score = baseScore
  let rating, stars
  if (score >= 85)      { rating = 'firsat'; stars = 5 }
  else if (score >= 70) { rating = 'iyi';    stars = 4 }
  else if (score >= 55) { rating = 'normal'; stars = 3 }
  else if (score >= 40) { rating = 'riskli'; stars = 2 }
  else                  { rating = 'pahali'; stars = 1 }

  return { score: Math.round(score), rating, stars }
}

// ── Research CRUD ─────────────────────────────────────────────────────────────

function listResearches(req, res) {
  const db = getDb()
  const { search, category, page = 1, limit = 50 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  const conditions = ['r.deleted_at IS NULL']
  const params = []

  if (search) {
    conditions.push('(r.title LIKE ? OR r.brand LIKE ? OR r.model LIKE ?)')
    const s = `%${search}%`
    params.push(s, s, s)
  }
  if (category) { conditions.push('r.category = ?'); params.push(category) }

  const where = conditions.join(' AND ')
  const total = db.prepare(`SELECT COUNT(*) as c FROM market_researches r WHERE ${where}`).get(...params).c

  const rows = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM market_listings l WHERE l.research_id = r.id AND l.deleted_at IS NULL) as listing_count,
      (SELECT AVG(l.price)  FROM market_listings l WHERE l.research_id = r.id AND l.deleted_at IS NULL) as avg_price,
      (SELECT MIN(l.price)  FROM market_listings l WHERE l.research_id = r.id AND l.deleted_at IS NULL) as min_price,
      (SELECT MAX(l.price)  FROM market_listings l WHERE l.research_id = r.id AND l.deleted_at IS NULL) as max_price
    FROM market_researches r
    WHERE ${where}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset)

  res.json({ success: true, data: rows, total, page: Number(page), limit: Number(limit) })
}

function getResearch(req, res) {
  const db = getDb()
  const { id } = req.params
  const research = db.prepare('SELECT * FROM market_researches WHERE id = ? AND deleted_at IS NULL').get(Number(id))
  if (!research) return res.status(404).json({ success: false, message: 'Araştırma bulunamadı' })

  const listings = db.prepare('SELECT * FROM market_listings WHERE research_id = ? AND deleted_at IS NULL ORDER BY created_at DESC').all(Number(id))
  const stats = computeStats(listings)
  const opportunity = computeOpportunityScore(listings)

  res.json({ success: true, data: { ...research, listings, stats, opportunity } })
}

function createResearch(req, res) {
  const db = getDb()
  const {
    title, category = 'other', brand, model, version,
    year_from, year_to, km_from, km_to, fuel_type, transmission,
    property_type, room_count, area_from, area_to,
    length_from, length_to, province, notes,
  } = req.body

  if (!title) return res.status(400).json({ success: false, message: 'Başlık zorunlu' })

  const result = db.prepare(`
    INSERT INTO market_researches
      (title, category, brand, model, version, year_from, year_to, km_from, km_to,
       fuel_type, transmission, property_type, room_count, area_from, area_to,
       length_from, length_to, province, notes, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    title, category, brand ?? null, model ?? null, version ?? null,
    year_from ?? null, year_to ?? null, km_from ?? null, km_to ?? null,
    fuel_type ?? null, transmission ?? null,
    property_type ?? null, room_count ?? null, area_from ?? null, area_to ?? null,
    length_from ?? null, length_to ?? null,
    province ?? null, notes ?? null, now(), now()
  )

  const created = db.prepare('SELECT * FROM market_researches WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: created })
}

function updateResearch(req, res) {
  const db = getDb()
  const { id } = req.params
  const research = db.prepare('SELECT id FROM market_researches WHERE id = ? AND deleted_at IS NULL').get(Number(id))
  if (!research) return res.status(404).json({ success: false, message: 'Araştırma bulunamadı' })

  const {
    title, category, brand, model, version,
    year_from, year_to, km_from, km_to, fuel_type, transmission,
    property_type, room_count, area_from, area_to,
    length_from, length_to, province, notes, status,
  } = req.body

  db.prepare(`
    UPDATE market_researches SET
      title=?, category=?, brand=?, model=?, version=?,
      year_from=?, year_to=?, km_from=?, km_to=?, fuel_type=?, transmission=?,
      property_type=?, room_count=?, area_from=?, area_to=?,
      length_from=?, length_to=?, province=?, notes=?, status=?, updated_at=?
    WHERE id=?
  `).run(
    title, category, brand ?? null, model ?? null, version ?? null,
    year_from ?? null, year_to ?? null, km_from ?? null, km_to ?? null,
    fuel_type ?? null, transmission ?? null,
    property_type ?? null, room_count ?? null, area_from ?? null, area_to ?? null,
    length_from ?? null, length_to ?? null,
    province ?? null, notes ?? null, status ?? 'active', now(), Number(id)
  )

  const updated = db.prepare('SELECT * FROM market_researches WHERE id = ?').get(Number(id))
  res.json({ success: true, data: updated })
}

function deleteResearch(req, res) {
  const db = getDb()
  const { id } = req.params
  db.prepare('UPDATE market_researches SET deleted_at=? WHERE id=?').run(now(), Number(id))
  res.json({ success: true })
}

// ── Listing CRUD ──────────────────────────────────────────────────────────────

function createListing(req, res) {
  const db = getDb()
  const { id } = req.params
  const research = db.prepare('SELECT id FROM market_researches WHERE id = ? AND deleted_at IS NULL').get(Number(id))
  if (!research) return res.status(404).json({ success: false, message: 'Araştırma bulunamadı' })

  const { title, url, platform, price, currency = 'TRY', listing_date, km, description, seller, notes } = req.body
  if (!title) return res.status(400).json({ success: false, message: 'Başlık zorunlu' })
  if (!price && price !== 0) return res.status(400).json({ success: false, message: 'Fiyat zorunlu' })

  const result = db.prepare(`
    INSERT INTO market_listings (research_id, title, url, platform, price, currency, listing_date, km, description, seller, notes, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    Number(id), title, url ?? null, platform ?? null,
    Number(price), currency,
    listing_date ?? null, km ?? null, description ?? null, seller ?? null, notes ?? null,
    now(), now()
  )

  const created = db.prepare('SELECT * FROM market_listings WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: created })
}

function updateListing(req, res) {
  const db = getDb()
  const { listingId } = req.params
  const listing = db.prepare('SELECT id FROM market_listings WHERE id = ? AND deleted_at IS NULL').get(Number(listingId))
  if (!listing) return res.status(404).json({ success: false, message: 'İlan bulunamadı' })

  const { title, url, platform, price, currency, listing_date, km, description, seller, notes } = req.body
  db.prepare(`
    UPDATE market_listings SET title=?,url=?,platform=?,price=?,currency=?,listing_date=?,km=?,description=?,seller=?,notes=?,updated_at=?
    WHERE id=?
  `).run(title, url ?? null, platform ?? null, Number(price), currency ?? 'TRY', listing_date ?? null, km ?? null, description ?? null, seller ?? null, notes ?? null, now(), Number(listingId))

  const updated = db.prepare('SELECT * FROM market_listings WHERE id = ?').get(Number(listingId))
  res.json({ success: true, data: updated })
}

function deleteListing(req, res) {
  const db = getDb()
  const { listingId } = req.params
  db.prepare('UPDATE market_listings SET deleted_at=? WHERE id=?').run(now(), Number(listingId))
  res.json({ success: true })
}

// ── Opportunity endpoint ──────────────────────────────────────────────────────

function getOpportunity(req, res) {
  const db = getDb()
  const { id } = req.params
  const listings = db.prepare('SELECT price FROM market_listings WHERE research_id = ? AND deleted_at IS NULL').all(Number(id))
  const stats = computeStats(listings)
  const opportunity = computeOpportunityScore(listings)
  res.json({ success: true, data: { stats, opportunity } })
}

// ── Dashboard feed ────────────────────────────────────────────────────────────

function getTodayOpportunities(req, res) {
  const db = getDb()
  const rows = db.prepare(`
    SELECT r.id, r.title, r.category,
      (SELECT COUNT(*) FROM market_listings l WHERE l.research_id = r.id AND l.deleted_at IS NULL) as listing_count,
      (SELECT AVG(l.price)  FROM market_listings l WHERE l.research_id = r.id AND l.deleted_at IS NULL) as avg_price,
      (SELECT MIN(l.price)  FROM market_listings l WHERE l.research_id = r.id AND l.deleted_at IS NULL) as min_price
    FROM market_researches r
    WHERE r.deleted_at IS NULL AND r.status = 'active' AND r.listing_count > 0
    ORDER BY r.updated_at DESC
    LIMIT 5
  `).all()
  res.json({ success: true, data: rows })
}

// ── Research selector (for purchase wizard) ───────────────────────────────────

function listResearchSelector(req, res) {
  const db = getDb()
  const { category } = req.query
  const conditions = ['deleted_at IS NULL', 'status = \'active\'']
  const params = []
  if (category) { conditions.push('category = ?'); params.push(category) }

  const rows = db.prepare(`
    SELECT id, title, category, brand, model,
      (SELECT AVG(price) FROM market_listings WHERE research_id = market_researches.id AND deleted_at IS NULL) as avg_price,
      (SELECT COUNT(*) FROM market_listings WHERE research_id = market_researches.id AND deleted_at IS NULL) as listing_count
    FROM market_researches
    WHERE ${conditions.join(' AND ')}
    ORDER BY updated_at DESC
  `).all(...params)

  res.json({ success: true, data: rows })
}

module.exports = {
  listResearches, getResearch, createResearch, updateResearch, deleteResearch,
  createListing, updateListing, deleteListing,
  getOpportunity, getTodayOpportunities, listResearchSelector,
}
