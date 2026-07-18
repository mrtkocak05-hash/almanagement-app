const { getDb } = require('../database/connection')
const { DB_PATH } = require('../database/init')
const { success, error } = require('../utils/response')

const ts = () => new Date().toISOString().replace('T', ' ').split('.')[0]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// ── GET /api/dev/status ───────────────────────────────────────────────────────
function getStatus(req, res) {
  try {
    const db = getDb()
    const tables = [
      'assets', 'purchases', 'sales', 'expenses', 'documents', 'activities',
      'bank_accounts', 'cash_accounts', 'notifications', 'ai_memories',
      'vehicle_intelligence', 'vehicle_valuations', 'market_researches',
    ]
    const counts = {}
    for (const t of tables) {
      try { counts[t] = db.prepare(`SELECT COUNT(*) as c FROM "${t}"`).get().c } catch (_) { counts[t] = 0 }
    }
    const capital = db.prepare('SELECT amount_try FROM capital WHERE id = 1').get()
    const rates = db.prepare('SELECT usd_try, gold_gram_try FROM exchange_rates WHERE id = 1').get()
    return success(res, {
      status: 'ok',
      env: process.env.NODE_ENV || 'development',
      db_path: DB_PATH,
      capital: capital?.amount_try ?? 0,
      usd_try: rates?.usd_try ?? 0,
      gold_gram_try: rates?.gold_gram_try ?? 0,
      counts,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return error(res, e.message)
  }
}

// ── POST /api/dev/reset-database ─────────────────────────────────────────────
function resetDatabase(req, res) {
  const db = getDb()
  let deleted = { assets: 0, purchases: 0, sales: 0, expenses: 0, documents: 0, activities: 0 }

  // Disable FK constraints for the duration of the reset
  db.pragma('foreign_keys = OFF')

  try {
    const tx = db.transaction(() => {
      const del = (t) => db.prepare(`DELETE FROM "${t}"`).run()

      // Tier 1: leaf children of vehicle_intelligence
      del('vehicle_part_photos')
      del('vehicle_tires')
      del('vehicle_battery')
      del('vehicle_maintenance')
      del('vehicle_parts')

      // Tier 2: vehicle_intelligence (child of assets)
      del('vehicle_intelligence')

      // Tier 3: vehicle_valuations (child of assets + purchases + market_researches)
      del('vehicle_valuations')

      // Tier 4: market tables
      del('market_listings')
      del('market_researches')

      // Tier 5: children of documents
      del('document_intelligence')
      del('document_versions')
      del('document_relations')

      // Tier 6: children of expenses
      del('expense_documents')
      del('expense_tags')

      // Tier 7: children of sales
      del('sale_expenses')

      // Tier 8: children of purchases
      del('purchase_expenses')
      del('purchase_partners')

      // Tier 9: direct children of assets
      del('asset_photos')
      del('asset_partners')

      // Tier 10: rows that reference assets / purchases / sales
      del('activities')
      del('documents')
      del('expenses')

      // Tier 11: sales then purchases (both reference assets)
      del('sales')
      del('purchases')

      // Tier 12: ASSETS — the main target
      del('assets')

      // Tier 13: financial tables
      del('financial_transactions')
      del('money_transfers')
      del('capital_movements')
      del('receivables')
      del('payables')
      del('credit_cards')
      del('bank_accounts')
      del('cash_accounts')

      // Tier 14: system / AI tables
      del('notifications')
      del('audit_logs')
      del('ai_memories')
      del('ai_logs')
      del('ai_tasks')

      // Reset autoincrement sequences — seed tables excluded
      const SEED = [
        'companies', 'users', 'refresh_tokens', 'password_resets', 'user_permissions',
        'expense_categories', 'document_categories', 'ai_settings',
        'master_vehicle_brands', 'master_vehicle_models', 'master_vehicle_versions',
        'master_vehicle_fuels', 'master_vehicle_transmissions', 'master_vehicle_body_types',
        'master_vehicle_drive_types', 'master_vehicle_colors',
        'master_currencies', 'master_cities', 'master_districts',
        'capital', 'exchange_rates',
      ]
      db.prepare(
        `DELETE FROM sqlite_sequence WHERE name NOT IN (${SEED.map(() => '?').join(',')})`
      ).run(...SEED)

      // Reset financial singletons
      db.prepare('UPDATE capital SET amount_try = 0, updated_at = ? WHERE id = 1').run(ts())
      db.prepare('UPDATE exchange_rates SET usd_try = 0, gold_gram_try = 0, updated_at = ? WHERE id = 1').run(ts())

      // Verify: every critical table MUST be 0 — throw if not
      const VERIFY = ['assets', 'purchases', 'sales', 'expenses', 'documents', 'activities']
      for (const t of VERIFY) {
        const cnt = db.prepare(`SELECT COUNT(*) as c FROM "${t}"`).get().c
        deleted[t] = cnt
        if (cnt !== 0) {
          throw new Error(`Doğrulama başarısız: "${t}" tablosunda ${cnt} kayıt kaldı.`)
        }
      }
    })

    tx()

    // VACUUM must run outside a transaction
    try { db.exec('VACUUM') } catch (_) {}

    return success(res, { success: true, deleted, message: 'Veritabanı tamamen temizlendi. Seed tablolar korundu.' })
  } catch (e) {
    return error(res, e.message)
  } finally {
    // Always restore FK constraints
    db.pragma('foreign_keys = ON')
  }
}

// ── POST /api/dev/clear-demo ─────────────────────────────────────────────────
function clearDemo(req, res) {
  return resetDatabase(req, res)
}

// ── POST /api/dev/create-demo-company ────────────────────────────────────────
function createDemoCompany(req, res) {
  try {
    const db = getDb()
    db.prepare(`
      UPDATE companies SET
        company_name = 'MK Premium Yatırım A.Ş.',
        tax_number   = '1234567890',
        tax_office   = 'Bornova',
        phone        = '+90 232 000 00 00',
        mail         = 'info@mkpremium.com.tr',
        address      = 'Bornova, İzmir',
        currency     = 'TRY',
        updated_at   = ?
      WHERE id = 1
    `).run(ts())
    return success(res, { message: 'Demo şirket oluşturuldu: MK Premium Yatırım A.Ş.' })
  } catch (e) {
    return error(res, e.message)
  }
}

// ── POST /api/dev/load-demo-data ─────────────────────────────────────────────
function loadDemoData(req, res) {
  try {
    const db = getDb()

    // Update company & rates outside transaction
    db.prepare(`UPDATE companies SET company_name='MK Premium Yatırım A.Ş.',tax_number='1234567890',tax_office='Bornova',phone='+90 232 000 00 00',mail='info@mkpremium.com.tr',address='Bornova, İzmir',updated_at=? WHERE id=1`).run(ts())
    db.prepare('UPDATE capital SET amount_try=15000000, updated_at=? WHERE id=1').run(ts())
    db.prepare('UPDATE exchange_rates SET usd_try=38.50, gold_gram_try=4150, updated_at=? WHERE id=1').run(ts())

    const summary = {}

    const tx = db.transaction(() => {
      // ── Banks
      const insBank = db.prepare(`INSERT INTO bank_accounts (bank_name,branch,iban,currency,opening_balance,current_balance,status,created_at,updated_at) VALUES (?,?,?,'TRY',?,?,'active',?,?)`)
      const banks = [
        ['Garanti BBVA', 'Bornova Şubesi', 'TR12 0006 2000 0001 0000 0000 01', 2500000, 2750000],
        ['İş Bankası', 'Alsancak Şubesi', 'TR34 0006 4000 0011 1000 0000 02', 1800000, 1950000],
        ['Ziraat Bankası', 'Konak Şubesi', 'TR56 0001 0017 0000 1234 5678 90', 3000000, 3200000],
        ['Yapı Kredi', 'Karşıyaka Şubesi', 'TR78 0006 7010 0000 0012 3456 78', 1200000, 1350000],
      ]
      for (const b of banks) insBank.run(...b, ts(), ts())

      // ── Kasa
      db.prepare(`INSERT INTO cash_accounts (name,currency,balance,description,status,created_at,updated_at) VALUES ('Merkez Kasa','TRY',500000,'Ana şirket kasası','active',?,?)`).run(ts(), ts())

      // ── Sermaye hareketi
      const insCapMov = db.prepare(`INSERT INTO capital_movements (type,movement_date,amount,currency,exchange_rate,amount_try,description,created_at,updated_at) VALUES (?,?,?,'TRY',1,?,?,?,?)`)
      insCapMov.run('initial', daysAgo(180), 15000000, 15000000, 'Başlangıç sermayesi — MK Premium Yatırım A.Ş.', ts(), ts())
      insCapMov.run('increase', daysAgo(90), 3000000, 3000000, 'Sermaye artışı — Q3 2024', ts(), ts())

      // ── Assets: Araçlar
      const insVehicle = db.prepare(`
        INSERT INTO assets (name,type,category,status,purchase_price,purchase_currency,current_value,purchase_date,
          brand,model,year,km,fuel_type,transmission,color,plate,description,created_at,updated_at)
        VALUES (?,'vehicle','Araç','active',?,'TRY',?,?,?,?,?,?,?,?,?,?,?,?,?)
      `)

      const vehicles = [
        { name: 'BMW 520i M Sport 2023', buy: 3200000, cur: 3450000, date: daysAgo(150), brand: 'BMW', model: '520i M Sport', year: 2023, km: 22000, fuel: 'Benzin', trans: 'Otomatik', color: 'Siyah', plate: '35 BMW 2023', desc: 'M Sport paket, tüm donanım' },
        { name: 'Mercedes E200 AMG 2022', buy: 2800000, cur: 2950000, date: daysAgo(200), brand: 'Mercedes-Benz', model: 'E200 AMG', year: 2022, km: 35000, fuel: 'Benzin', trans: 'Otomatik', color: 'Gümüş', plate: '35 MRC 2022', desc: 'AMG Line, sunroof, panoramik' },
        { name: 'Audi A6 S-Line', buy: 2500000, cur: 2680000, date: daysAgo(120), brand: 'Audi', model: 'A6 S-Line', year: 2023, km: 18000, fuel: 'Dizel', trans: 'Otomatik', color: 'Beyaz', plate: '35 AUD 2023', desc: 'S-Line dış, matrix LED farlar' },
        { name: 'Toyota Corolla Hybrid', buy: 1200000, cur: 1260000, date: daysAgo(90), brand: 'Toyota', model: 'Corolla Hybrid', year: 2024, km: 8000, fuel: 'Hibrit', trans: 'CVT', color: 'Kırmızı', plate: '35 TYT 2024', desc: 'Hibrit üst donanım, Toyota Safety Sense' },
        { name: 'TOGG T10X', buy: 1800000, cur: 1950000, date: daysAgo(60), brand: 'TOGG', model: 'T10X', year: 2024, km: 5500, fuel: 'Elektrik', trans: 'Otomatik', color: 'Mavi', plate: '35 TGG 2024', desc: 'Uzun menzil batarya, sürücü asistan paketi' },
        { name: 'Range Rover Sport', buy: 5500000, cur: 5820000, date: daysAgo(170), brand: 'Land Rover', model: 'Range Rover Sport', year: 2023, km: 28000, fuel: 'Benzin', trans: 'Otomatik', color: 'Koyu Yeşil', plate: '35 RNG 2023', desc: 'P400e Dynamic, panoramik tavan, 22 inç jant' },
      ]
      const vehicleIds = []
      for (const v of vehicles) {
        const r = insVehicle.run(v.name, v.buy, v.cur, v.date, v.brand, v.model, v.year, v.km, v.fuel, v.trans, v.color, v.plate, v.desc, ts(), ts())
        vehicleIds.push(r.lastInsertRowid)
      }

      // ── Assets: Gayrimenkuller
      const insRE = db.prepare(`
        INSERT INTO assets (name,type,category,status,purchase_price,purchase_currency,current_value,purchase_date,
          property_type,gross_area,net_area,location_address,description,created_at,updated_at)
        VALUES (?,'real_estate','Gayrimenkul','active',?,'TRY',?,?,?,?,?,?,?,?,?)
      `)
      const realEstates = [
        { name: 'Bornova Ofis', buy: 8000000, cur: 9500000, date: daysAgo(365), ptype: 'Ofis', gross: 320, net: 280, loc: 'Bornova, İzmir', desc: 'B sınıfı ofis, 4. kat, açık plan' },
        { name: 'Çeşme Villa', buy: 12000000, cur: 15000000, date: daysAgo(500), ptype: 'Villa', gross: 450, net: 380, loc: 'Çeşme, İzmir', desc: 'Deniz manzaralı 5+1 villa, özel havuz' },
        { name: 'Manisa Arsa', buy: 2500000, cur: 3200000, date: daysAgo(730), ptype: 'Arsa', gross: 2500, net: 2500, loc: 'Organize Sanayi, Manisa', desc: 'Sanayi bölgesi yatırım arsası' },
      ]
      const reIds = []
      for (const r of realEstates) {
        const res2 = insRE.run(r.name, r.buy, r.cur, r.date, r.ptype, r.gross, r.net, r.loc, r.desc, ts(), ts())
        reIds.push(res2.lastInsertRowid)
      }

      // ── Assets: İş Makineleri
      const insEquip = db.prepare(`
        INSERT INTO assets (name,type,category,status,purchase_price,purchase_currency,current_value,purchase_date,
          brand,model,year,equipment_type,engine_hours,serial_number,description,created_at,updated_at)
        VALUES (?,'equipment','İş Makinesi','active',?,'TRY',?,?,?,?,?,?,?,?,?,?,?)
      `)
      const equipment = [
        { name: 'CAT 320D', buy: 3800000, cur: 3600000, date: daysAgo(300), brand: 'Caterpillar', model: '320D', year: 2021, etype: 'Ekskavatör', ehours: 3200, sno: 'CAT320D-2021-001', desc: 'Paletli ekskavatör, 20 ton sınıfı' },
        { name: 'Komatsu PC210', buy: 3200000, cur: 3000000, date: daysAgo(400), brand: 'Komatsu', model: 'PC210', year: 2020, etype: 'Ekskavatör', ehours: 5600, sno: 'KOM-PC210-2020-001', desc: 'Paletli ekskavatör, yüksek performans modeli' },
        { name: 'JCB 3CX', buy: 2100000, cur: 1950000, date: daysAgo(450), brand: 'JCB', model: '3CX', year: 2021, etype: 'Kazıcı Yükleyici', ehours: 4100, sno: 'JCB3CX-2021-001', desc: 'Ekskavatör-yükleyici kombinasyonu' },
      ]
      const equipIds = []
      for (const e of equipment) {
        const r = insEquip.run(e.name, e.buy, e.cur, e.date, e.brand, e.model, e.year, e.etype, e.ehours, e.sno, e.desc, ts(), ts())
        equipIds.push(r.lastInsertRowid)
      }

      // ── Purchases (completed)
      const insPurch = db.prepare(`
        INSERT INTO purchases (purchase_no,type,asset_id,asset_name,seller_name,seller_type,
          purchase_date,purchase_price,currency,exchange_rate,purchase_price_try,
          payment_method,status,notes,created_at,updated_at)
        VALUES (?,?,?,?,?,'dealer',?,?,'TRY',1,?,'bank_transfer','completed',?,?,?)
      `)
      const purchDefs = [
        ...vehicles.map((v, i) => ({ aid: vehicleIds[i], name: v.name, price: v.buy, date: v.date, type: 'vehicle', seller: `${v.brand} İzmir Yetkili` })),
        ...realEstates.map((r, i) => ({ aid: reIds[i], name: r.name, price: r.buy, date: r.date, type: 'real_estate', seller: 'İzmir Emlak Ofisi' })),
        ...equipment.map((e, i) => ({ aid: equipIds[i], name: e.name, price: e.buy, date: e.date, type: 'equipment', seller: `${e.brand} Türkiye Distribütörü` })),
      ]
      const purchaseIds = []
      for (let i = 0; i < purchDefs.length; i++) {
        const p = purchDefs[i]
        const pno = `SAT-2024-${String(i + 1).padStart(4, '0')}`
        const r = insPurch.run(pno, p.type, p.aid, p.name, p.seller, p.date, p.price, p.price, `${p.name} alımı tamamlandı`, ts(), ts())
        purchaseIds.push(r.lastInsertRowid)
      }

      // ── Expenses (araç giderleri)
      const insExp = db.prepare(`
        INSERT INTO expenses (expense_no,expense_date,category,description,amount,currency,exchange_rate,amount_try,
          payment_source,expense_owner,related_asset_id,related_asset_name,status,created_at,updated_at)
        VALUES (?,?,'Araç',?,?,'TRY',1,?,'bank_transfer','company',?,?,'active',?,?)
      `)
      const expTypesData = [
        { cat: 'Sigorta',  amts: [18500, 14200, 13800, 7200, 9500, 24000], days: [15, 20, 18, 25, 10, 22] },
        { cat: 'Bakım',    amts: [8500,  7200,  6800,  4500, 5200, 12000], days: [30, 35, 28, 40, 20, 45] },
        { cat: 'Lastik',   amts: [12000, 10500, 9800,  5200, 7200, 18000], days: [60, 70, 65, 80, 50, 90] },
        { cat: 'Noter',    amts: [2800,  2500,  2200,  1800, 2000, 3500],  days: [150, 200, 120, 90, 60, 170] },
        { cat: 'Eksper',   amts: [1500,  1500,  1500,  1000, 1200, 2000],  days: [152, 202, 122, 92, 62, 172] },
        { cat: 'Yakıt',    amts: [4200,  3800,  2800,  2100, 0,    5500],  days: [5, 7, 4, 6, 0, 8] },
      ]
      let expNo = 1
      for (let vi = 0; vi < vehicles.length; vi++) {
        for (const et of expTypesData) {
          const amt = et.amts[vi]
          if (!amt) continue
          const eno = `GDR-2024-${String(expNo++).padStart(4, '0')}`
          insExp.run(eno, daysAgo(et.days[vi]), `${et.cat} — ${vehicles[vi].name}`, amt, amt, vehicleIds[vi], vehicles[vi].name, ts(), ts())
        }
      }

      // ── Activities (dashboard için)
      const insAct = db.prepare(`
        INSERT INTO activities (asset_id,type,title,amount,currency,note,activity_date,created_at,updated_at)
        VALUES (?,?,?,?,'TRY',?,?,?,?)
      `)
      // Satın alma aktiviteleri
      for (let i = 0; i < purchDefs.length; i++) {
        const p = purchDefs[i]
        insAct.run(p.aid, 'purchase', `Satın Alma: ${p.name}`, p.price, `${p.name} satın alındı`, p.date, ts(), ts())
      }
      // Gelir & gider aktiviteleri (son 30 gün)
      const recentActs = [
        { aid: vehicleIds[0], type: 'income',  title: 'Araç Kiralama — BMW 520i M Sport',    amt: 25000,  note: 'Kurumsal kiralama',          days: 3  },
        { aid: vehicleIds[5], type: 'income',  title: 'Araç Kiralama — Range Rover Sport',   amt: 35000,  note: 'Etkinlik kiralatması',        days: 5  },
        { aid: reIds[0],      type: 'income',  title: 'Kira Geliri — Bornova Ofis',          amt: 150000, note: 'Kasım 2024 kira tahsilatı',   days: 8  },
        { aid: reIds[1],      type: 'income',  title: 'Kira Geliri — Çeşme Villa',           amt: 80000,  note: 'Sezonluk kiralama',           days: 12 },
        { aid: equipIds[0],   type: 'income',  title: 'Makine Kiralama — CAT 320D',          amt: 120000, note: 'İnşaat firmasına kiralık',    days: 6  },
        { aid: vehicleIds[2], type: 'expense', title: 'Servis — Audi A6 S-Line',             amt: 8500,   note: '40.000 km periyodik bakım',   days: 10 },
        { aid: vehicleIds[1], type: 'expense', title: 'Kasko — Mercedes E200 AMG',           amt: 14200,  note: 'Yıllık kasko yenileme',       days: 20 },
        { aid: vehicleIds[4], type: 'expense', title: 'Şarj Gideri — TOGG T10X',            amt: 850,    note: 'Aylık şarj maliyeti',         days: 2  },
        { aid: equipIds[1],   type: 'income',  title: 'Makine Kiralama — Komatsu PC210',     amt: 95000,  note: 'Karayolu projesi',            days: 15 },
        { aid: reIds[2],      type: 'income',  title: 'Arsa Kira Geliri — Manisa',           amt: 45000,  note: 'Geçici depolama kirası',      days: 22 },
        { aid: vehicleIds[3], type: 'expense', title: 'Sigorta — Toyota Corolla Hybrid',     amt: 7200,   note: 'Yıllık kasko+trafik',         days: 25 },
        { aid: vehicleIds[0], type: 'income',  title: 'Sürücülü Kiralama — BMW 520i',        amt: 18000,  note: 'VIP transfer hizmeti',        days: 1  },
      ]
      for (const a of recentActs) {
        insAct.run(a.aid, a.type, a.title, a.amt, a.note, daysAgo(a.days), ts(), ts())
      }

      // ── Vehicle Intelligence
      const insVI = db.prepare(`
        INSERT INTO vehicle_intelligence (asset_id,expert_firm,expert_date,expert_no,expert_note,expert_score,
          ai_score,ai_analysis,score_kaporta,score_mekanik,score_elektrik,score_ic_mekan,score_lastik,score_bakim,score_belge,
          created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `)
      const viData = [
        { aid: vehicleIds[0], firm: 'Oto Eksper İzmir',       score: 92, ai: 94, analysis: 'BMW 520i M Sport mükemmel kondisyonda. Hasar kaydı yok. Bakımlar aksatılmamış. Piyasa değerinin üzerinde satış imkânı mevcut.', sc: [95,93,92,94,90,95,98] },
        { aid: vehicleIds[1], firm: 'Mercedes Ekspertiz',     score: 88, ai: 89, analysis: 'Mercedes E200 AMG iyi kondisyonda. Sol ön kanat bölgesinde hafif kaporta düzeltmesi mevcut. Genel değeri minimal etkileniyor.', sc: [82,90,88,92,87,88,95] },
        { aid: vehicleIds[2], firm: 'Audi İzmir Servisi',     score: 94, ai: 96, analysis: 'Audi A6 S-Line pristine durumda. Düşük km ve bakımlar tam. Değer artışı devam edecek. Yüksek yatırım skoru.', sc: [96,94,95,96,93,97,98] },
        { aid: vehicleIds[3], firm: 'Toyota Türkiye',         score: 98, ai: 97, analysis: 'Toyota Corolla Hybrid neredeyse sıfır kondisyon. Hibrit batarya sağlığı %100. Yakıt tüketimi rekabetçi.', sc: [99,98,99,98,98,99,99] },
        { aid: vehicleIds[4], firm: 'TOGG Servis Merkezi',    score: 99, ai: 98, analysis: 'TOGG T10X fabrika çıkışı durumda. Batarya sistemi optimal. Yerli teknoloji, kapsamlı garanti. Uzun vadeli değer artışı bekleniyor.', sc: [99,99,99,99,99,99,99] },
        { aid: vehicleIds[5], firm: 'Land Rover İzmir',       score: 86, ai: 87, analysis: 'Range Rover Sport güçlü yatırım değeri taşıyor. Yüzeysel çizikler mevcut, kaporta hasarı yok. Premium segment koruma sağlıyor.', sc: [88,85,86,90,84,87,92] },
      ]
      const viIds = []
      for (let i = 0; i < viData.length; i++) {
        const v = viData[i]
        const eno = `EKS-2024-${String(i + 1).padStart(3, '0')}`
        const r = insVI.run(v.aid, v.firm, daysAgo(i * 5 + 5), eno, 'Araç genel ekspertiz raporu', v.score, v.ai, v.analysis, ...v.sc, ts(), ts())
        viIds.push(r.lastInsertRowid)
      }

      // ── Vehicle Parts (hasar haritası)
      const insPart = db.prepare(`INSERT OR IGNORE INTO vehicle_parts (vehicle_intelligence_id,part_key,status,notes,created_at,updated_at) VALUES (?,?,?,?,?,?)`)
      const partKeys = ['on_cam','on_sol_kanat','on_sol_kapi','arka_sol_kapi','arka_sol_kanat','arka_cam','arka_ust','arka_sag_kanat','arka_sag_kapi','on_sag_kapi','on_sag_kanat','tavan','motor_kapagi','bagaj','tampon_on','tampon_arka']
      const partStatuses = [
        ['orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal'],
        ['orijinal','boyalı','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal'],
        ['orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal'],
        ['orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal'],
        ['orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal'],
        ['orijinal','boyalı','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','orijinal','boyalı','orijinal','orijinal','orijinal','orijinal','orijinal'],
      ]
      for (let vi = 0; vi < viIds.length; vi++) {
        for (let pi = 0; pi < partKeys.length; pi++) {
          insPart.run(viIds[vi], partKeys[pi], partStatuses[vi][pi], null, ts(), ts())
        }
      }

      // ── Vehicle Tires (lastikler)
      const insTire = db.prepare(`INSERT OR IGNORE INTO vehicle_tires (vehicle_intelligence_id,position,brand,model,size,dot,tread_depth,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'iyi',?,?)`)
      const tireBrands = ['Michelin', 'Bridgestone', 'Pirelli', 'Continental', 'Goodyear', 'Yokohama']
      const tireSizes  = ['245/45R18', '255/45R18', '255/40R19', '205/55R16', '235/55R17', '275/40R21']
      const positions  = ['on_sol', 'on_sag', 'arka_sol', 'arka_sag']
      for (let vi = 0; vi < viIds.length; vi++) {
        for (const pos of positions) {
          insTire.run(viIds[vi], pos, tireBrands[vi], 'Sport', tireSizes[vi], '3524', 6 + (vehicles[vi].km < 15000 ? 2 : 0), ts(), ts())
        }
      }

      // ── Vehicle Battery (akü)
      const insBatt = db.prepare(`INSERT OR IGNORE INTO vehicle_battery (vehicle_intelligence_id,brand,ampere,install_date,test_result,created_at,updated_at) VALUES (?,?,?,?,'iyi',?,?)`)
      const battBrands = ['Varta', 'Bosch', 'Exide', 'Banner', 'TOGG Batarya', 'Optima']
      const battAmps   = [70, 80, 70, 60, null, 95]
      const battDays   = [90, 150, 60, 200, 60, 120]
      for (let vi = 0; vi < viIds.length; vi++) {
        insBatt.run(viIds[vi], battBrands[vi], battAmps[vi], daysAgo(battDays[vi]), ts(), ts())
      }

      // ── Vehicle Maintenance (bakım)
      const insMaint = db.prepare(`INSERT INTO vehicle_maintenance (vehicle_intelligence_id,type,date,km,notes,next_date,next_km,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      const maintData = [
        { vi: 0, type: 'yag_filtre',         date: daysAgo(45),  km: 20000, notes: 'Motor yağı ve filtre değişimi',         next_date: daysAgo(-90),  next_km: 30000 },
        { vi: 1, type: 'genel_bakim',         date: daysAgo(60),  km: 30000, notes: 'Mercedes servis periyodik bakım',       next_date: daysAgo(-60),  next_km: 40000 },
        { vi: 2, type: 'yag_filtre',          date: daysAgo(30),  km: 15000, notes: 'Motor yağı ve filtre değişimi (Audi)', next_date: daysAgo(-120), next_km: 25000 },
        { vi: 3, type: 'genel_bakim',         date: daysAgo(20),  km: 5000,  notes: 'İlk 10.000 km Toyota periyodik bakım', next_date: daysAgo(-160), next_km: 15000 },
        { vi: 4, type: 'yazilim_guncelleme',  date: daysAgo(15),  km: 5000,  notes: 'OTA yazılım güncellemesi — TOGG v2.4', next_date: daysAgo(-90),  next_km: 15000 },
        { vi: 5, type: 'genel_bakim',         date: daysAgo(40),  km: 25000, notes: 'Land Rover servisi tam bakım',          next_date: daysAgo(-50),  next_km: 35000 },
      ]
      for (const m of maintData) {
        insMaint.run(viIds[m.vi], m.type, m.date, m.km, m.notes, m.next_date, m.next_km, ts(), ts())
      }

      // ── Vehicle Valuations (AI değerleme)
      const insVal = db.prepare(`
        INSERT INTO vehicle_valuations (
          asset_id,purchase_id,our_price,market_price,market_min,market_max,market_avg,market_median,
          market_std_dev,market_count,price_vs_market,negotiation_price,negotiation_advice,
          investment_score,liquidity_score,roi_1y,risk_score,
          value_6m,value_12m,value_24m,ai_recommendation,ai_analysis,created_at,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `)
      const valData = [
        { aid: vehicleIds[0], pid: purchaseIds[0], our: 3200000, mkt: 3450000, min: 3100000, max: 3800000, avg: 3430000, med: 3400000, std: 180000, cnt: 24, pvsm: -0.72, neg: 3350000, nadv: 'Piyasanın %0.7 altında konumlanmış. Alım fırsatı sunuyor.', inv: 88, liq: 85, roi: 12.5, risk: 15, v6: 3550000, v12: 3680000, v24: 3900000, rec: 'ALIM', ana: 'BMW 520i M Sport 2023 modeli premium segment için güçlü yatırım aracı. Piyasa talebi yüksek, 1 yıllık değer artışı %12-15 bekleniyor.' },
        { aid: vehicleIds[1], pid: purchaseIds[1], our: 2800000, mkt: 2950000, min: 2600000, max: 3200000, avg: 2920000, med: 2900000, std: 155000, cnt: 18, pvsm: -1.69, neg: 2870000, nadv: 'Piyasa ortalamasına yakın. Makul değerleme.', inv: 82, liq: 78, roi: 8.5, risk: 20, v6: 2980000, v12: 3050000, v24: 3150000, rec: 'TUT', ana: 'Mercedes E200 AMG stabil değer görünümünde. Kaporta düzeltmesi minimal etki yaratıyor. Orta vadeli değer artışı sınırlı.' },
        { aid: vehicleIds[2], pid: purchaseIds[2], our: 2500000, mkt: 2680000, min: 2350000, max: 2900000, avg: 2640000, med: 2620000, std: 135000, cnt: 21, pvsm: -6.72, neg: 2550000, nadv: 'Piyasanın %6.7 altında fiyat avantajı mevcut. Güçlü alım fırsatı.', inv: 91, liq: 88, roi: 14.2, risk: 12, v6: 2720000, v12: 2850000, v24: 3100000, rec: 'ALIM', ana: 'Audi A6 S-Line düşük km ve pristine kondisyon ile piyasanın altında fiyatlandırılmış. En yüksek ROI potansiyeline sahip araç.' },
        { aid: vehicleIds[3], pid: purchaseIds[3], our: 1200000, mkt: 1260000, min: 1150000, max: 1380000, avg: 1245000, med: 1240000, std: 65000, cnt: 35, pvsm: -3.57, neg: 1220000, nadv: 'Hibrit segment talebi güçlü. Fiyat avantajı mevcut.', inv: 86, liq: 92, roi: 10.8, risk: 10, v6: 1300000, v12: 1365000, v24: 1480000, rec: 'TUT', ana: 'Toyota Corolla Hybrid en yüksek likidite değerine sahip. Hibrit araç talebi sürekli artmakta. Güvenli değer koruma aracı.' },
        { aid: vehicleIds[4], pid: purchaseIds[4], our: 1800000, mkt: 1950000, min: 1750000, max: 2100000, avg: 1910000, med: 1890000, std: 90000, cnt: 12, pvsm: -7.69, neg: 1870000, nadv: 'Yerli EV pazarı büyüyor. TOGG markası değer kazanıyor. Alım fırsatı.', inv: 94, liq: 75, roi: 18.5, risk: 18, v6: 2000000, v12: 2150000, v24: 2600000, rec: 'ALIM', ana: 'TOGG T10X Türkiye EV pazarının öncüsü. Hükümet teşvikleri ve şarj altyapısı genişlemesiyle güçlü uzun vadeli değer artışı. Portföyün en yüksek potansiyelli varlığı.' },
        { aid: vehicleIds[5], pid: purchaseIds[5], our: 5500000, mkt: 5820000, min: 5200000, max: 6500000, avg: 5780000, med: 5750000, std: 320000, cnt: 8, pvsm: -5.50, neg: 5680000, nadv: 'Lüks SUV segmentinde piyasanın altında. Nadir alım fırsatı.', inv: 89, liq: 70, roi: 11.2, risk: 22, v6: 5980000, v12: 6200000, v24: 6700000, rec: 'TUT', ana: 'Range Rover Sport lüks SUV segmentinin zirvesinde konumlanmış. Likidite sınırlı ancak değer deposit güçlü. Uzun vadeli premium koruma sağlıyor.' },
      ]
      for (const v of valData) {
        insVal.run(v.aid, v.pid, v.our, v.mkt, v.min, v.max, v.avg, v.med, v.std, v.cnt, v.pvsm, v.neg, v.nadv, v.inv, v.liq, v.roi, v.risk, v.v6, v.v12, v.v24, v.rec, v.ana, ts(), ts())
      }

      // ── AI Memories
      const insAIMem = db.prepare(`
        INSERT INTO ai_memories (user_id,company_id,type,module,summary,data_json,importance,title,content,source_module,created_at)
        VALUES (1,1,?,?,?,?,?,?,?,?,?)
      `)
      const totalVehicleVal = vehicles.reduce((s, v) => s + v.cur, 0)
      const totalREVal = realEstates.reduce((s, r) => s + r.cur, 0)
      const totalEquipVal = equipment.reduce((s, e) => s + e.cur, 0)
      const totalPortfolio = totalVehicleVal + totalREVal + totalEquipVal
      const aiMems = [
        { type: 'analysis', module: 'dashboard', summary: `Portföy toplam değeri ${(totalPortfolio/1000000).toFixed(1)} milyon TL`, data: { total: totalPortfolio, vehicles: totalVehicleVal, real_estate: totalREVal, equipment: totalEquipVal, asset_count: 12 }, imp: 9, title: 'Portföy Genel Analizi', content: `MK Premium Yatırım A.Ş. toplam portföy değeri ${(totalPortfolio/1000000).toFixed(1)} milyon TL. Araçlar ${(totalVehicleVal/1000000).toFixed(1)}M, gayrimenkuller ${(totalREVal/1000000).toFixed(1)}M, iş makineleri ${(totalEquipVal/1000000).toFixed(1)}M TL değerinde. En yüksek değer artışı Çeşme Villa'da (%25). En yüksek ROI potansiyeli TOGG T10X'te (%18.5).`, src: 'dashboard' },
        { type: 'insight', module: 'varliklar', summary: 'BMW, Audi ve TOGG alım fırsatı sunuyor — piyasa altı fiyat', data: { opportunities: ['BMW 520i', 'Audi A6', 'TOGG T10X'], avg_discount: 4.98 }, imp: 8, title: 'Araç Alım Fırsatları', content: 'BMW 520i M Sport piyasanın %0.7 altında, Audi A6 S-Line %6.7 altında, TOGG T10X %7.7 altında fiyatlandırılmış. Bu 3 araç güçlü alım fırsatı sunuyor. Portföy ortalama yıllık ROI hedefi %12.6.', src: 'varliklar' },
        { type: 'analysis', module: 'finans', summary: 'Toplam banka bakiyesi 9.25 milyon TL, kasa 500K TL', data: { bank_total: 9250000, cash: 500000, capital: 15000000, liquidity_ratio: 65.3 }, imp: 8, title: 'Finansal Sağlık Raporu', content: 'Banka hesapları 9.25 milyon TL: Garanti 2.75M, Ziraat 3.2M, İş Bankası 1.95M, Yapı Kredi 1.35M. Kasa 500K TL. Sermaye kullanım oranı %34.7. Nakit pozisyon güçlü, yatırım kapasitesi mevcut.', src: 'finans' },
        { type: 'insight', module: 'gayrimenkul', summary: 'Gayrimenkul portföyü %18-28 değer artışı kaydetti', data: { total_re: totalREVal, gain_pct: 20.8 }, imp: 7, title: 'Gayrimenkul Değerleme', content: 'Manisa Arsa %28, Çeşme Villa %25, Bornova Ofis %18.75 değer artışı kaydetmiştir. Toplam gayrimenkul değeri 27.7M TL. Manisa sanayi arsası en yüksek getiri oranını sağladı. Çeşme Villa premium konumunu korumaktadır.', src: 'varliklar' },
        { type: 'analysis', module: 'dashboard', summary: 'Bu ay toplam 410.000 TL kira ve kiralama geliri', data: { rental_income: 410000, sources: ['Bornova Ofis', 'Çeşme Villa', 'CAT 320D', 'Komatsu PC210'] }, imp: 7, title: 'Pasif Gelir Özeti', content: 'Kasım 2024 pasif gelirler: Bornova Ofis kirası 150K TL, Çeşme Villa kirası 80K TL, CAT 320D makine kira 120K TL, Komatsu PC210 makine kira 95K TL. BMW araç kiralamaları 25K TL. Toplam 470K TL aylık pasif gelir.', src: 'dashboard' },
        { type: 'insight', module: 'piyasa-arastirma', summary: 'EV pazarı %35 büyüme gösteriyor — TOGG stratejik öneme sahip', data: { ev_growth: 35, togg_roi: 18.5, recommendation: 'ALIM' }, imp: 8, title: 'Elektrikli Araç Pazar Analizi', content: 'Türkiye EV pazarı yıldan yıla %35 büyüme kaydediyor. TOGG T10X satışları hızlanıyor. Şarj altyapısı genişliyor. 2-yıllık değer projeksiyonu 2.6M TL (%44.4 artış). Güçlü alım-tut stratejisi öneriliyor.', src: 'piyasa-arastirma' },
      ]
      for (const m of aiMems) {
        insAIMem.run(m.type, m.module, m.summary, JSON.stringify(m.data), m.imp, m.title, m.content, m.src, ts())
      }

      // ── Notifications
      const insNotif = db.prepare(`INSERT INTO notifications (user_id,type,title,body,category,is_read,created_at) VALUES (1,?,?,?,?,?,?)`)
      const notifs = [
        ['success', 'Demo Veriler Yüklendi', 'MK Premium Yatırım A.Ş. demo verisi başarıyla sisteme yüklendi.', 'system', 0],
        ['info',    'BMW 520i Bakım Yaklaşıyor', 'BMW 520i M Sport için 30.000 km bakımı yaklaşıyor. Servis randevusu alınması önerilir.', 'asset', 0],
        ['warning', 'Range Rover Sigorta Yenileme', 'Range Rover Sport sigorta poliçesi 30 gün içinde son bulacak.', 'asset', 0],
        ['success', 'Çeşme Villa Kira Tahsilatı', '80.000 TL kira tahsilatı başarıyla gerçekleşti.', 'financial', 1],
        ['info',    'TOGG T10X OTA Güncelleme', 'TOGG T10X yazılım güncellemesi v2.4 başarıyla tamamlandı.', 'asset', 1],
        ['info',    'AI Araç Analizi Hazır', 'Tüm araçlar için AI ekspertiz analizi tamamlandı. Sonuçları incelemek için tıklayın.', 'ai', 0],
        ['success', 'Komatsu PC210 Kiralama', 'Komatsu PC210 için 95.000 TL kiralama geliri tahsil edildi.', 'financial', 0],
        ['warning', 'Manisa Arsa İmar Güncellemesi', 'Manisa OSB bölgesi imar değişikliği duyurusu yayınlandı. Değer artışı bekleniyor.', 'market', 0],
      ]
      for (const n of notifs) {
        insNotif.run(...n, ts())
      }

      summary.vehicles   = vehicles.length
      summary.realEstate = realEstates.length
      summary.equipment  = equipment.length
      summary.purchases  = purchDefs.length
      summary.expenses   = expNo - 1
      summary.activities = purchDefs.length + recentActs.length
      summary.aiMemories = aiMems.length
      summary.notifications = notifs.length
    })

    tx()

    return success(res, {
      message: 'Demo veriler başarıyla yüklendi!',
      summary: {
        company:       'MK Premium Yatırım A.Ş.',
        capital:       '15.000.000 TL',
        bankAccounts:  4,
        cashAccounts:  1,
        ...summary,
      },
    })
  } catch (e) {
    console.error('[DEV] loadDemoData error:', e)
    return error(res, e.message)
  }
}

// ── POST /api/dev/rebuild-dashboard ─────────────────────────────────────────
function rebuildDashboard(req, res) {
  try {
    const db = getDb()
    // Set fresh exchange rates
    db.prepare('UPDATE exchange_rates SET usd_try=38.50, gold_gram_try=4150, updated_at=? WHERE id=1').run(ts())
    // Add today activities
    const assets = db.prepare("SELECT id, name, type FROM assets WHERE deleted_at IS NULL LIMIT 6").all()
    if (assets.length > 0) {
      const insAct = db.prepare(`INSERT INTO activities (asset_id,type,title,amount,currency,note,activity_date,created_at,updated_at) VALUES (?,?,?,?,'TRY',?,?,?,?)`)
      const today2 = daysAgo(0)
      const types = ['income', 'expense', 'income', 'income']
      const amounts = [25000, 8500, 120000, 45000]
      const notes = ['Günlük gelir', 'Günlük gider', 'Kiralama geliri', 'Pasif gelir']
      assets.slice(0, 4).forEach((a, i) => {
        insAct.run(a.id, types[i], `${types[i] === 'income' ? 'Gelir' : 'Gider'}: ${a.name}`, amounts[i], notes[i], today2, ts(), ts())
      })
    }
    // Add fresh AI memory
    const insAIMem = db.prepare(`INSERT INTO ai_memories (user_id,company_id,type,module,summary,data_json,importance,title,content,source_module,created_at) VALUES (1,1,?,?,?,?,?,?,?,?,?)`)
    insAIMem.run('insight', 'dashboard', 'Dashboard yeniden oluşturuldu — güncel piyasa analizi', JSON.stringify({ rebuilt: true, timestamp: new Date().toISOString() }), 7, 'Dashboard Yeniden Derlendi', 'Döviz kurları güncellendi (USD: 38.50 TL, Altın: 4.150 TL/gr). Günlük aktiviteler eklendi. Dashboard tüm modüller ile güncel gösterim yapıyor.', 'dashboard', ts())
    return success(res, { message: 'Dashboard başarıyla yeniden oluşturuldu.' })
  } catch (e) {
    return error(res, e.message)
  }
}

// ── GET /api/dev/statistics ──────────────────────────────────────────────────
function getStatistics(req, res) {
  try {
    const db = getDb()
    const q = (sql) => { try { return db.prepare(sql).get() } catch (_) { return { c: 0, s: 0 } } }
    const assets       = q("SELECT COUNT(*) as c FROM assets WHERE deleted_at IS NULL")
    const purchases    = q("SELECT COUNT(*) as c, COALESCE(SUM(purchase_price_try),0) as s FROM purchases WHERE deleted_at IS NULL")
    const sales        = q("SELECT COUNT(*) as c, COALESCE(SUM(sale_price_try),0) as s FROM sales WHERE deleted_at IS NULL")
    const expenses     = q("SELECT COUNT(*) as c, COALESCE(SUM(amount_try),0) as s FROM expenses WHERE deleted_at IS NULL")
    const documents    = q("SELECT COUNT(*) as c FROM documents WHERE deleted_at IS NULL")
    const activities   = q("SELECT COUNT(*) as c FROM activities WHERE deleted_at IS NULL")
    const aiMems       = q("SELECT COUNT(*) as c FROM ai_memories")
    const bankAccounts = q("SELECT COUNT(*) as c FROM bank_accounts WHERE deleted_at IS NULL")
    const vehicles     = q("SELECT COUNT(*) as c FROM assets WHERE type='vehicle' AND deleted_at IS NULL")
    const notifications= q("SELECT COUNT(*) as c FROM notifications WHERE is_read=0")
    return success(res, {
      total_assets:           assets.c,
      total_vehicles:         vehicles.c,
      total_purchases:        purchases.c,
      total_purchases_amount: purchases.s,
      total_sales:            sales.c,
      total_sales_amount:     sales.s,
      total_expenses:         expenses.c,
      total_expenses_amount:  expenses.s,
      total_documents:        documents.c,
      total_activities:       activities.c,
      total_ai_memories:      aiMems.c,
      total_bank_accounts:    bankAccounts.c,
      unread_notifications:   notifications.c,
    })
  } catch (e) {
    return error(res, e.message)
  }
}

module.exports = { getStatus, resetDatabase, clearDemo, loadDemoData, rebuildDashboard, createDemoCompany, getStatistics }
