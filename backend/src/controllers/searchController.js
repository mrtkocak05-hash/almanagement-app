const { getDb } = require('../database/connection')

function search(req, res) {
  const db = getDb()
  const q = (req.query.q || '').trim()
  if (q.length < 2) return res.json({ success: true, data: [] })

  const like = `%${q}%`
  const results = []

  // Assets
  const assets = db.prepare(`
    SELECT id, name, type, plate, brand, model, status
    FROM assets WHERE deleted_at IS NULL
    AND (name LIKE ? OR plate LIKE ? OR brand LIKE ? OR model LIKE ? OR vin LIKE ? OR serial_number LIKE ?)
    LIMIT 10
  `).all(like, like, like, like, like, like)
  assets.forEach(a => results.push({
    type: 'asset', id: a.id,
    title: a.name,
    subtitle: [a.brand, a.model].filter(Boolean).join(' '),
    meta: a.plate ?? a.type,
    url: `/varliklar/${a.id}`,
  }))

  // Purchases
  const purchases = db.prepare(`
    SELECT id, purchase_no, asset_name, type, brand, model, plate
    FROM purchases WHERE deleted_at IS NULL
    AND (purchase_no LIKE ? OR asset_name LIKE ? OR brand LIKE ? OR model LIKE ? OR plate LIKE ?)
    LIMIT 8
  `).all(like, like, like, like, like)
  purchases.forEach(p => results.push({
    type: 'purchase', id: p.id,
    title: p.asset_name,
    subtitle: p.purchase_no,
    meta: [p.brand, p.model].filter(Boolean).join(' ') || p.type,
    url: `/operasyon/satinalma/${p.id}`,
  }))

  // Sales
  const sales = db.prepare(`
    SELECT id, sale_no, asset_name, asset_type, buyer_name, buyer_phone
    FROM sales WHERE deleted_at IS NULL
    AND (sale_no LIKE ? OR asset_name LIKE ? OR buyer_name LIKE ? OR buyer_phone LIKE ?)
    LIMIT 8
  `).all(like, like, like, like)
  sales.forEach(s => results.push({
    type: 'sale', id: s.id,
    title: s.asset_name,
    subtitle: s.sale_no,
    meta: s.buyer_name ?? s.asset_type,
    url: `/operasyon/satislar/${s.id}`,
  }))

  // Documents
  const docs = db.prepare(`
    SELECT id, title, category, module, original_name
    FROM documents WHERE deleted_at IS NULL AND status != 'missing'
    AND (title LIKE ? OR original_name LIKE ? OR description LIKE ?)
    LIMIT 6
  `).all(like, like, like)
  docs.forEach(d => results.push({
    type: 'document', id: d.id,
    title: d.title,
    subtitle: d.category,
    meta: d.module,
    url: `/operasyon/dokumanlar`,
  }))

  res.json({ success: true, data: results })
}

module.exports = { search }
