'use strict'
const { getDb } = require('../database/connection')

function listBrands(req, res) {
  try {
    const db = getDb()
    const brands = db.prepare(
      'SELECT id, name, country, sort_order FROM master_vehicle_brands ORDER BY name'
    ).all()
    res.json({ success: true, data: brands })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

function listModels(req, res) {
  try {
    const db = getDb()
    const { brand_id, brand_name } = req.query
    let models

    if (brand_id) {
      models = db.prepare(
        'SELECT id, brand_id, name FROM master_vehicle_models WHERE brand_id = ? ORDER BY name'
      ).all(Number(brand_id))
    } else if (brand_name) {
      const brand = db.prepare(
        'SELECT id FROM master_vehicle_brands WHERE name = ?'
      ).get(brand_name)
      models = brand
        ? db.prepare(
            'SELECT id, brand_id, name FROM master_vehicle_models WHERE brand_id = ? ORDER BY name'
          ).all(brand.id)
        : []
    } else {
      models = db.prepare(
        `SELECT m.id, m.brand_id, m.name, b.name AS brand_name
         FROM master_vehicle_models m
         JOIN master_vehicle_brands b ON m.brand_id = b.id
         ORDER BY b.name, m.name`
      ).all()
    }

    res.json({ success: true, data: models })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const TABLE_MAP = {
  versions:      'master_vehicle_versions',
  fuels:         'master_vehicle_fuels',
  transmissions: 'master_vehicle_transmissions',
  body_types:    'master_vehicle_body_types',
  drive_types:   'master_vehicle_drive_types',
  colors:        'master_vehicle_colors',
  currencies:    'master_currencies',
  cities:        'master_cities',
}

// Tables without sort_order column — versions only has id + name
const NO_SORT_ORDER = new Set(['versions'])

function listTable(req, res) {
  try {
    const { type } = req.params
    const table = TABLE_MAP[type]
    if (!table) return res.status(400).json({ success: false, message: 'Invalid type: ' + type })
    const db = getDb()
    let orderCol
    if (type === 'currencies') orderCol = 'sort_order, code'
    else if (NO_SORT_ORDER.has(type)) orderCol = 'name'
    else orderCol = 'sort_order, name'
    const items = db.prepare(`SELECT * FROM ${table} ORDER BY ${orderCol}`).all()
    res.json({ success: true, data: items })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

function listDistricts(req, res) {
  try {
    const { city_name } = req.query
    const db = getDb()
    if (!city_name) {
      return res.status(400).json({ success: false, message: 'city_name is required' })
    }
    const city = db.prepare('SELECT plate_code FROM master_cities WHERE name = ?').get(city_name)
    if (!city) {
      return res.json({ success: true, data: [] })
    }
    const districts = db.prepare(
      'SELECT id, name FROM master_districts WHERE city_code = ? ORDER BY name'
    ).all(city.plate_code)
    res.json({ success: true, data: districts })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

function debugCounts(req, res) {
  try {
    const db = getDb()
    const counts = {
      brands:       db.prepare('SELECT COUNT(*) as n FROM master_vehicle_brands').get().n,
      models:       db.prepare('SELECT COUNT(*) as n FROM master_vehicle_models').get().n,
      versions:     db.prepare('SELECT COUNT(*) as n FROM master_vehicle_versions').get().n,
      fuels:        db.prepare('SELECT COUNT(*) as n FROM master_vehicle_fuels').get().n,
      transmissions:db.prepare('SELECT COUNT(*) as n FROM master_vehicle_transmissions').get().n,
      colors:       db.prepare('SELECT COUNT(*) as n FROM master_vehicle_colors').get().n,
      cities:       db.prepare('SELECT COUNT(*) as n FROM master_cities').get().n,
      currencies:   db.prepare('SELECT COUNT(*) as n FROM master_currencies').get().n,
    }
    const sample_brands = db.prepare('SELECT name FROM master_vehicle_brands ORDER BY name LIMIT 5').all().map(r => r.name)
    res.json({ success: true, data: { counts, sample_brands } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { listBrands, listModels, listDistricts, listTable, debugCounts }
