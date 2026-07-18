/**
 * Vehicle Valuation Controller — Sprint 13.1
 */

const db  = require('../database/init')
const svc = require('../services/vehicleValuationService')

function ok(res, data)           { return res.json({ success: true, data }) }
function fail(res, msg, s = 400) { return res.status(s).json({ success: false, message: msg }) }

// Map frontend asset type to DB market_researches category
const TYPE_TO_CATEGORY = {
  vehicle:                'vehicle',
  motorcycle:             'motorcycle',
  caravan:                'caravan',
  construction_equipment: 'equipment',
  default:                'vehicle',
}

function getListingsForVehicle({ category, brand, model, yearFrom, yearTo }) {
  const cat = TYPE_TO_CATEGORY[category] ?? 'vehicle'

  // Find best matching research
  const conditions = ['r.deleted_at IS NULL', 'r.category = ?']
  const params     = [cat]

  if (brand) { conditions.push('(r.brand IS NULL OR LOWER(r.brand) = LOWER(?))'); params.push(brand) }

  const researches = db.prepare(`
    SELECT r.id FROM market_researches r
    WHERE ${conditions.join(' AND ')}
    ORDER BY
      CASE WHEN LOWER(r.brand) = LOWER(?) THEN 0 ELSE 1 END,
      CASE WHEN LOWER(r.model) = LOWER(?) THEN 0 ELSE 1 END,
      r.updated_at DESC
    LIMIT 5
  `).all(...params, brand ?? '', model ?? '')

  if (!researches.length) {
    // Fallback: any vehicle research
    const fallback = db.prepare(
      "SELECT id FROM market_researches WHERE deleted_at IS NULL AND category = ? ORDER BY updated_at DESC LIMIT 3"
    ).all(cat)
    researches.push(...fallback)
  }

  if (!researches.length) return { listings: [], researchId: null }

  const ids = researches.map(r => r.id)
  const placeholders = ids.map(() => '?').join(',')
  const listings = db.prepare(
    `SELECT price, km FROM market_listings WHERE research_id IN (${placeholders}) AND deleted_at IS NULL`
  ).all(...ids)

  return { listings, researchId: ids[0] }
}

// ── POST /quick — instant valuation, no auth, no DB save ─────────────────────

function quickValuation(req, res) {
  const { category = 'vehicle', brand, model, year, km, price, vehicleAge } = req.body
  if (!price || price <= 0) return fail(res, 'Fiyat gerekli')

  const age  = vehicleAge ?? (year ? new Date().getFullYear() - Number(year) : 5)
  const { listings, researchId } = getListingsForVehicle({ category, brand, model })

  const result = svc.computeFullValuation({
    listings,
    ourPrice: Number(price),
    category,
    brand: brand ?? '',
    vehicleAge: age,
  })

  return ok(res, { ...result, research_id: researchId })
}

// ── POST /purchase/:purchaseId — compute + save for a purchase ────────────────

function valuatePurchase(req, res) {
  const purchaseId = parseInt(req.params.purchaseId, 10)
  const purchase   = db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId)
  if (!purchase) return fail(res, 'Satın alma bulunamadı', 404)

  const price = purchase.purchase_price_try
  if (!price || price <= 0) return fail(res, 'Satın alma fiyatı girilmemiş')

  const year     = purchase.year
  const age      = year ? new Date().getFullYear() - Number(year) : 5
  const category = TYPE_TO_CATEGORY[purchase.type] ? purchase.type : 'vehicle'

  const { listings, researchId } = getListingsForVehicle({
    category, brand: purchase.brand, model: purchase.model,
  })

  const result = svc.computeFullValuation({
    listings,
    ourPrice:    price,
    category,
    brand:       purchase.brand ?? '',
    vehicleAge:  age,
  })

  // Upsert
  const existing = db.prepare('SELECT id FROM vehicle_valuations WHERE purchase_id = ?').get(purchaseId)
  if (existing) {
    db.prepare(`
      UPDATE vehicle_valuations SET
        our_price=?, market_price=?, market_min=?, market_max=?, market_avg=?, market_median=?,
        market_std_dev=?, market_count=?, price_vs_market=?, negotiation_price=?, negotiation_advice=?,
        investment_score=?, liquidity_score=?, roi_1y=?, risk_score=?,
        value_6m=?, value_12m=?, value_24m=?,
        ai_recommendation=?, ai_analysis=?, research_id=?,
        updated_at=datetime('now')
      WHERE purchase_id=?
    `).run(
      result.our_price, result.market_price, result.market_min, result.market_max,
      result.market_avg, result.market_median, result.market_std_dev, result.market_count,
      result.price_vs_market, result.negotiation_price, result.negotiation_advice,
      result.investment_score, result.liquidity_score, result.roi_1y, result.risk_score,
      result.value_6m, result.value_12m, result.value_24m,
      result.ai_recommendation, result.ai_analysis, researchId,
      purchaseId,
    )
  } else {
    db.prepare(`
      INSERT INTO vehicle_valuations
        (purchase_id, our_price, market_price, market_min, market_max, market_avg, market_median,
         market_std_dev, market_count, price_vs_market, negotiation_price, negotiation_advice,
         investment_score, liquidity_score, roi_1y, risk_score,
         value_6m, value_12m, value_24m, ai_recommendation, ai_analysis, research_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      purchaseId, result.our_price, result.market_price, result.market_min, result.market_max,
      result.market_avg, result.market_median, result.market_std_dev, result.market_count,
      result.price_vs_market, result.negotiation_price, result.negotiation_advice,
      result.investment_score, result.liquidity_score, result.roi_1y, result.risk_score,
      result.value_6m, result.value_12m, result.value_24m,
      result.ai_recommendation, result.ai_analysis, researchId,
    )
  }

  const saved = db.prepare('SELECT * FROM vehicle_valuations WHERE purchase_id = ?').get(purchaseId)
  return ok(res, saved)
}

// ── POST /asset/:assetId — compute + save for an existing asset ───────────────

function valuateAsset(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  const asset   = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId)
  if (!asset) return fail(res, 'Varlık bulunamadı', 404)

  const price = asset.current_value ?? asset.purchase_price
  if (!price || price <= 0) return fail(res, 'Varlık değeri girilmemiş')

  const age      = asset.year ? new Date().getFullYear() - Number(asset.year) : 5
  const category = asset.type

  const { listings, researchId } = getListingsForVehicle({
    category, brand: asset.brand, model: asset.model,
  })

  const result = svc.computeFullValuation({
    listings,
    ourPrice:   price,
    category,
    brand:      asset.brand ?? '',
    vehicleAge: age,
  })

  const existing = db.prepare('SELECT id FROM vehicle_valuations WHERE asset_id = ?').get(assetId)
  if (existing) {
    db.prepare(`
      UPDATE vehicle_valuations SET
        our_price=?, market_price=?, market_min=?, market_max=?, market_avg=?, market_median=?,
        market_std_dev=?, market_count=?, price_vs_market=?, negotiation_price=?, negotiation_advice=?,
        investment_score=?, liquidity_score=?, roi_1y=?, risk_score=?,
        value_6m=?, value_12m=?, value_24m=?,
        ai_recommendation=?, ai_analysis=?, research_id=?,
        updated_at=datetime('now')
      WHERE asset_id=?
    `).run(
      result.our_price, result.market_price, result.market_min, result.market_max,
      result.market_avg, result.market_median, result.market_std_dev, result.market_count,
      result.price_vs_market, result.negotiation_price, result.negotiation_advice,
      result.investment_score, result.liquidity_score, result.roi_1y, result.risk_score,
      result.value_6m, result.value_12m, result.value_24m,
      result.ai_recommendation, result.ai_analysis, researchId,
      assetId,
    )
  } else {
    db.prepare(`
      INSERT INTO vehicle_valuations
        (asset_id, our_price, market_price, market_min, market_max, market_avg, market_median,
         market_std_dev, market_count, price_vs_market, negotiation_price, negotiation_advice,
         investment_score, liquidity_score, roi_1y, risk_score,
         value_6m, value_12m, value_24m, ai_recommendation, ai_analysis, research_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      assetId, result.our_price, result.market_price, result.market_min, result.market_max,
      result.market_avg, result.market_median, result.market_std_dev, result.market_count,
      result.price_vs_market, result.negotiation_price, result.negotiation_advice,
      result.investment_score, result.liquidity_score, result.roi_1y, result.risk_score,
      result.value_6m, result.value_12m, result.value_24m,
      result.ai_recommendation, result.ai_analysis, researchId,
    )
  }

  const saved = db.prepare('SELECT * FROM vehicle_valuations WHERE asset_id = ?').get(assetId)
  return ok(res, saved)
}

// ── GET /asset/:assetId ────────────────────────────────────────────────────────

function getAssetValuation(req, res) {
  const assetId = parseInt(req.params.assetId, 10)
  const v = db.prepare('SELECT * FROM vehicle_valuations WHERE asset_id = ?').get(assetId)
  return ok(res, v ?? null)
}

// ── GET /purchase/:purchaseId ─────────────────────────────────────────────────

function getPurchaseValuation(req, res) {
  const purchaseId = parseInt(req.params.purchaseId, 10)
  const v = db.prepare('SELECT * FROM vehicle_valuations WHERE purchase_id = ?').get(purchaseId)
  return ok(res, v ?? null)
}

// ── GET /dashboard — top investment opportunities ─────────────────────────────

function getDashboardOpportunities(req, res) {
  const rows = db.prepare(`
    SELECT
      vv.*,
      COALESCE(a.name, p.asset_name) as name,
      COALESCE(a.brand, p.brand)     as brand,
      COALESCE(a.model, p.model)     as model,
      COALESCE(a.year, p.year)       as year,
      COALESCE(a.id, p.asset_id)     as asset_id
    FROM vehicle_valuations vv
    LEFT JOIN assets a    ON a.id   = vv.asset_id
    LEFT JOIN purchases p ON p.id   = vv.purchase_id
    WHERE vv.investment_score IS NOT NULL
    ORDER BY vv.investment_score DESC
    LIMIT 6
  `).all()

  const cheapest = db.prepare(`
    SELECT
      vv.*,
      COALESCE(a.name, p.asset_name) as name,
      COALESCE(a.brand, p.brand)     as brand,
      COALESCE(a.model, p.model)     as model
    FROM vehicle_valuations vv
    LEFT JOIN assets a    ON a.id   = vv.asset_id
    LEFT JOIN purchases p ON p.id   = vv.purchase_id
    WHERE vv.price_vs_market IS NOT NULL AND vv.price_vs_market < 0
    ORDER BY vv.price_vs_market ASC
    LIMIT 4
  `).all()

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      AVG(investment_score) as avg_score,
      AVG(roi_1y) as avg_roi,
      AVG(liquidity_score) as avg_liquidity
    FROM vehicle_valuations
    WHERE investment_score IS NOT NULL
  `).get()

  return ok(res, { opportunities: rows, cheapest, stats })
}

module.exports = {
  quickValuation,
  valuatePurchase,
  valuateAsset,
  getAssetValuation,
  getPurchaseValuation,
  getDashboardOpportunities,
}
