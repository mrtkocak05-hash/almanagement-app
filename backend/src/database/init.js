const path = require('path')
const fs = require('fs')
const { seedMasterData } = require('./masterDataSeed')

// In serverless environments (Lambda/Netlify/Vercel) use /tmp (writable ephemeral storage)
const IS_LAMBDA = !!(process.env.LAMBDA_TASK_ROOT || process.env.NETLIFY_LOCAL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL)
const DB_DIR = IS_LAMBDA ? '/tmp' : path.join(__dirname, '../../../database')
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'almanagement.db')

if (!IS_LAMBDA && !fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  -- Single-row capital configuration
  CREATE TABLE IF NOT EXISTS capital (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    amount_try REAL NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Exchange rates (single row)
  CREATE TABLE IF NOT EXISTS exchange_rates (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    usd_try       REAL NOT NULL DEFAULT 0,
    gold_gram_try REAL NOT NULL DEFAULT 0,
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Assets registry (Sprint 2)
  CREATE TABLE IF NOT EXISTS assets (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    name               TEXT NOT NULL,
    type               TEXT NOT NULL DEFAULT 'other',
    category           TEXT,
    status             TEXT NOT NULL DEFAULT 'active',
    -- Financials
    purchase_price     REAL,
    purchase_currency  TEXT NOT NULL DEFAULT 'TRY',
    current_value      REAL,
    purchase_date      TEXT,
    -- Share
    share_percent      REAL NOT NULL DEFAULT 100,
    -- Vehicle / motorcycle / caravan
    brand              TEXT,
    model              TEXT,
    year               INTEGER,
    km                 INTEGER,
    fuel_type          TEXT,
    transmission       TEXT,
    damage_status      TEXT,
    plate              TEXT,
    vin                TEXT,
    engine_number      TEXT,
    engine_size        TEXT,
    color              TEXT,
    -- Real estate
    property_type      TEXT,
    gross_area         REAL,
    net_area           REAL,
    room_count         TEXT,
    building_age       INTEGER,
    floor_number       TEXT,
    location_address   TEXT,
    -- Boat
    length_m           REAL,
    engine_power       TEXT,
    hull_type          TEXT,
    engine_type_boat   TEXT,
    boat_reg_number    TEXT,
    -- Construction equipment
    equipment_type     TEXT,
    engine_hours       INTEGER,
    serial_number      TEXT,
    -- Investment
    investment_type    TEXT,
    institution        TEXT,
    units              REAL,
    unit_price         REAL,
    -- Cash
    bank_wallet        TEXT,
    -- Generic
    description        TEXT,
    -- Metadata
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at         TEXT
  );

  -- Asset photos
  CREATE TABLE IF NOT EXISTS asset_photos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id   INTEGER NOT NULL REFERENCES assets(id),
    filename   TEXT NOT NULL,
    path       TEXT NOT NULL,
    is_main    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  -- Asset partners
  CREATE TABLE IF NOT EXISTS asset_partners (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id      INTEGER NOT NULL REFERENCES assets(id),
    name          TEXT NOT NULL,
    share_percent REAL NOT NULL DEFAULT 0,
    share_amount  REAL,
    phone         TEXT,
    notes         TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
  );

  -- Documents
  CREATE TABLE IF NOT EXISTS documents (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id   INTEGER REFERENCES assets(id),
    type       TEXT NOT NULL DEFAULT 'other',
    title      TEXT NOT NULL,
    filename   TEXT NOT NULL,
    path       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  -- Activity log
  CREATE TABLE IF NOT EXISTS activities (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id      INTEGER REFERENCES assets(id),
    purchase_id   INTEGER,
    sale_id       INTEGER,
    type          TEXT NOT NULL,
    title         TEXT NOT NULL,
    amount        REAL,
    currency      TEXT NOT NULL DEFAULT 'TRY',
    note          TEXT,
    activity_date TEXT NOT NULL DEFAULT (date('now')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
  );

  -- Purchases registry (Sprint 3)
  CREATE TABLE IF NOT EXISTS purchases (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_no          TEXT UNIQUE NOT NULL,
    type                 TEXT NOT NULL DEFAULT 'other',
    asset_id             INTEGER REFERENCES assets(id),
    asset_name           TEXT NOT NULL,
    -- Seller
    seller_name          TEXT,
    seller_type          TEXT,
    seller_province      TEXT,
    seller_district      TEXT,
    -- Financials
    purchase_date        TEXT,
    purchase_price       REAL,
    currency             TEXT NOT NULL DEFAULT 'TRY',
    exchange_rate        REAL NOT NULL DEFAULT 1,
    purchase_price_try   REAL,
    payment_method       TEXT,
    total_expenses_try   REAL NOT NULL DEFAULT 0,
    total_cost_try       REAL,
    share_percent        REAL NOT NULL DEFAULT 100,
    my_share_cost        REAL,
    -- Status
    status               TEXT NOT NULL DEFAULT 'draft',
    notes                TEXT,
    -- Vehicle / motorcycle / caravan
    brand                TEXT,
    model                TEXT,
    package_name         TEXT,
    year                 INTEGER,
    km                   INTEGER,
    fuel_type            TEXT,
    transmission         TEXT,
    plate                TEXT,
    vin                  TEXT,
    engine_number        TEXT,
    engine_size          TEXT,
    color                TEXT,
    damage_status        TEXT,
    -- Real estate
    property_type        TEXT,
    gross_area           REAL,
    net_area             REAL,
    room_count           TEXT,
    building_age         INTEGER,
    floor_number         TEXT,
    location_address     TEXT,
    title_deed           TEXT,
    -- Boat
    length_m             REAL,
    engine_power         TEXT,
    hull_type            TEXT,
    boat_reg_number      TEXT,
    -- Construction equipment
    equipment_type       TEXT,
    engine_hours         INTEGER,
    serial_number        TEXT,
    -- Investment
    investment_type      TEXT,
    institution          TEXT,
    units                REAL,
    unit_price           REAL,
    -- Cash
    bank_wallet          TEXT,
    description          TEXT,
    -- Metadata
    created_at           TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at           TEXT
  );

  -- Purchase expenses
  CREATE TABLE IF NOT EXISTS purchase_expenses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id     INTEGER NOT NULL REFERENCES purchases(id),
    expense_type    TEXT NOT NULL DEFAULT 'other',
    expense_name    TEXT NOT NULL,
    amount          REAL NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'TRY',
    exchange_rate   REAL NOT NULL DEFAULT 1,
    amount_try      REAL NOT NULL DEFAULT 0,
    paid_by         TEXT,
    is_shared       INTEGER NOT NULL DEFAULT 0,
    my_share_amount REAL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at      TEXT
  );

  -- Purchase partners
  CREATE TABLE IF NOT EXISTS purchase_partners (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id   INTEGER NOT NULL REFERENCES purchases(id),
    name          TEXT NOT NULL,
    share_percent REAL NOT NULL DEFAULT 0,
    share_amount  REAL,
    phone         TEXT,
    notes         TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
  );

  -- Sales registry (Sprint 4)
  CREATE TABLE IF NOT EXISTS sales (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_no                     TEXT UNIQUE NOT NULL,
    asset_id                    INTEGER NOT NULL REFERENCES assets(id),
    asset_name                  TEXT NOT NULL,
    asset_type                  TEXT NOT NULL DEFAULT 'other',
    -- Purchase context snapshot
    purchase_id                 INTEGER REFERENCES purchases(id),
    purchase_price_try          REAL,
    total_purchase_expenses_try REAL NOT NULL DEFAULT 0,
    total_cost_try              REAL,
    share_percent               REAL NOT NULL DEFAULT 100,
    my_share_cost               REAL,
    purchase_date               TEXT,
    -- Buyer
    buyer_name                  TEXT,
    buyer_type                  TEXT,
    buyer_phone                 TEXT,
    -- Sale financials
    sale_date                   TEXT,
    sale_price                  REAL NOT NULL DEFAULT 0,
    currency                    TEXT NOT NULL DEFAULT 'TRY',
    exchange_rate               REAL NOT NULL DEFAULT 1,
    sale_price_try              REAL,
    payment_method              TEXT,
    -- Calculated totals
    total_sale_expenses_try     REAL NOT NULL DEFAULT 0,
    net_sale_try                REAL,
    net_profit_try              REAL,
    share_profit_try            REAL,
    holding_days                INTEGER,
    roi_percent                 REAL,
    annual_roi_percent          REAL,
    investment_score            INTEGER,
    -- Exchange rate valuations
    sale_usd_rate               REAL,
    sale_gold_rate              REAL,
    purchase_usd_value          REAL,
    current_usd_value           REAL,
    purchase_gold_value         REAL,
    current_gold_value          REAL,
    -- Status
    status                      TEXT NOT NULL DEFAULT 'draft',
    notes                       TEXT,
    -- Metadata
    created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at                  TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at                  TEXT
  );

  -- Sale expenses
  CREATE TABLE IF NOT EXISTS sale_expenses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id         INTEGER NOT NULL REFERENCES sales(id),
    expense_type    TEXT NOT NULL DEFAULT 'other',
    expense_name    TEXT NOT NULL,
    amount          REAL NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'TRY',
    exchange_rate   REAL NOT NULL DEFAULT 1,
    amount_try      REAL NOT NULL DEFAULT 0,
    paid_by         TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at      TEXT
  );

  -- Sprint 5: Financial Hub tables

  CREATE TABLE IF NOT EXISTS cash_accounts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    currency    TEXT NOT NULL DEFAULT 'TRY',
    balance     REAL NOT NULL DEFAULT 0,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at  TEXT
  );

  CREATE TABLE IF NOT EXISTS bank_accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name       TEXT NOT NULL,
    branch          TEXT,
    iban            TEXT,
    currency        TEXT NOT NULL DEFAULT 'TRY',
    opening_balance REAL NOT NULL DEFAULT 0,
    current_balance REAL NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at      TEXT
  );

  CREATE TABLE IF NOT EXISTS credit_cards (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    bank            TEXT NOT NULL,
    card_name       TEXT NOT NULL,
    limit_amount    REAL NOT NULL DEFAULT 0,
    available_limit REAL NOT NULL DEFAULT 0,
    current_debt    REAL NOT NULL DEFAULT 0,
    due_date        TEXT,
    statement_date  TEXT,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at      TEXT
  );

  CREATE TABLE IF NOT EXISTS capital_movements (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    type          TEXT NOT NULL DEFAULT 'other',
    movement_date TEXT NOT NULL,
    amount        REAL NOT NULL DEFAULT 0,
    currency      TEXT NOT NULL DEFAULT 'TRY',
    exchange_rate REAL NOT NULL DEFAULT 1,
    amount_try    REAL NOT NULL DEFAULT 0,
    description   TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
  );

  CREATE TABLE IF NOT EXISTS money_transfers (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    from_type     TEXT NOT NULL,
    from_id       INTEGER NOT NULL,
    from_name     TEXT,
    to_type       TEXT NOT NULL,
    to_id         INTEGER NOT NULL,
    to_name       TEXT,
    amount        REAL NOT NULL DEFAULT 0,
    currency      TEXT NOT NULL DEFAULT 'TRY',
    exchange_rate REAL NOT NULL DEFAULT 1,
    amount_try    REAL NOT NULL DEFAULT 0,
    transfer_date TEXT NOT NULL,
    description   TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
  );

  CREATE TABLE IF NOT EXISTS financial_transactions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    type             TEXT NOT NULL DEFAULT 'expense',
    category         TEXT,
    source_type      TEXT,
    source_id        INTEGER,
    amount           REAL NOT NULL DEFAULT 0,
    currency         TEXT NOT NULL DEFAULT 'TRY',
    exchange_rate    REAL NOT NULL DEFAULT 1,
    amount_try       REAL NOT NULL DEFAULT 0,
    transaction_date TEXT NOT NULL,
    description      TEXT,
    reference_no     TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at       TEXT
  );

  CREATE TABLE IF NOT EXISTS receivables (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    customer         TEXT NOT NULL,
    amount           REAL NOT NULL DEFAULT 0,
    currency         TEXT NOT NULL DEFAULT 'TRY',
    exchange_rate    REAL NOT NULL DEFAULT 1,
    amount_try       REAL NOT NULL DEFAULT 0,
    due_date         TEXT,
    collected_amount REAL NOT NULL DEFAULT 0,
    status           TEXT NOT NULL DEFAULT 'pending',
    description      TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at       TEXT
  );

  CREATE TABLE IF NOT EXISTS payables (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier      TEXT NOT NULL,
    amount        REAL NOT NULL DEFAULT 0,
    currency      TEXT NOT NULL DEFAULT 'TRY',
    exchange_rate REAL NOT NULL DEFAULT 1,
    amount_try    REAL NOT NULL DEFAULT 0,
    due_date      TEXT,
    paid_amount   REAL NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'pending',
    description   TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
  );

  -- Sprint 6: Expense Intelligence Center

  CREATE TABLE IF NOT EXISTS expense_categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    slug       TEXT NOT NULL UNIQUE,
    color      TEXT NOT NULL DEFAULT 'gray',
    parent_id  INTEGER REFERENCES expense_categories(id),
    is_system  INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_no          TEXT NOT NULL UNIQUE,
    expense_date        TEXT NOT NULL,
    category            TEXT NOT NULL,
    sub_category        TEXT,
    description         TEXT NOT NULL,
    amount              REAL NOT NULL DEFAULT 0,
    currency            TEXT NOT NULL DEFAULT 'TRY',
    exchange_rate       REAL NOT NULL DEFAULT 1,
    amount_try          REAL NOT NULL DEFAULT 0,
    payment_source      TEXT NOT NULL DEFAULT 'other',
    payment_source_id   INTEGER,
    payment_source_name TEXT,
    expense_owner       TEXT NOT NULL DEFAULT 'company',
    related_asset_id    INTEGER REFERENCES assets(id),
    related_asset_name  TEXT,
    related_purchase_id INTEGER REFERENCES purchases(id),
    related_sale_id     INTEGER REFERENCES sales(id),
    tax_included        INTEGER NOT NULL DEFAULT 0,
    vat_rate            REAL NOT NULL DEFAULT 0,
    notes               TEXT,
    status              TEXT NOT NULL DEFAULT 'active',
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at          TEXT
  );

  CREATE TABLE IF NOT EXISTS expense_documents (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id    INTEGER NOT NULL REFERENCES expenses(id),
    doc_type      TEXT NOT NULL DEFAULT 'other',
    original_name TEXT NOT NULL,
    file_path     TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
  );

  CREATE TABLE IF NOT EXISTS expense_tags (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id INTEGER NOT NULL REFERENCES expenses(id),
    tag        TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  -- Sprint 7: Digital Archive

  CREATE TABLE IF NOT EXISTS document_categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    slug       TEXT NOT NULL UNIQUE,
    is_system  INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS document_relations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id   INTEGER NOT NULL REFERENCES documents(id),
    relation_type TEXT NOT NULL DEFAULT 'other',
    relation_id   INTEGER,
    relation_name TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
  );

  CREATE TABLE IF NOT EXISTS document_versions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id    INTEGER NOT NULL REFERENCES documents(id),
    version_number INTEGER NOT NULL DEFAULT 1,
    filename       TEXT NOT NULL,
    path           TEXT NOT NULL,
    original_name  TEXT,
    file_size      INTEGER,
    mime_type      TEXT,
    upload_note    TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at     TEXT
  );

  -- Singleton seed rows
  INSERT OR IGNORE INTO capital (id, amount_try) VALUES (1, 0);
  INSERT OR IGNORE INTO exchange_rates (id, usd_try, gold_gram_try) VALUES (1, 0, 0);

  -- Default document categories
  INSERT OR IGNORE INTO document_categories (id,name,slug,is_system,sort_order) VALUES
    (1,'Alım Sözleşmesi','alim-sozlesmesi',1,1),
    (2,'Satım Sözleşmesi','satim-sozlesmesi',1,2),
    (3,'Fatura','fatura',1,3),
    (4,'Fiş','fis',1,4),
    (5,'Ekspertiz Raporu','ekspertiz',1,5),
    (6,'Sigorta','sigorta',1,6),
    (7,'Kasko','kasko',1,7),
    (8,'Ruhsat','ruhsat',1,8),
    (9,'Ehliyet','ehliyet',1,9),
    (10,'Tapu','tapu',1,10),
    (11,'Kimlik','kimlik',1,11),
    (12,'Vekaletname','vekaletname',1,12),
    (13,'Garanti','garanti',1,13),
    (14,'Bakım','bakim',1,14),
    (15,'Servis','servis',1,15),
    (16,'Banka Belgesi','banka-belgesi',1,16),
    (17,'Kredi Belgesi','kredi-belgesi',1,17),
    (18,'Vergi Belgesi','vergi-belgesi',1,18),
    (19,'Fotoğraf','fotograf',1,19),
    (20,'Video','video',1,20),
    (21,'Diğer','diger',1,21);

  -- Default expense categories
  INSERT OR IGNORE INTO expense_categories (id,name,slug,color,is_system,sort_order) VALUES
    (1,'Araç','arac','purple',1,1),
    (2,'Gayrimenkul','gayrimenkul','blue',1,2),
    (3,'Tekne','tekne','blue',1,3),
    (4,'Motosiklet','motosiklet','purple',1,4),
    (5,'Karavan','karavan','purple',1,5),
    (6,'İş Makinesi','is-makinesi','indigo',1,6),
    (7,'Ofis','ofis','orange',1,7),
    (8,'Kişisel','kisisel','gray',1,8),
    (9,'Finans','finans','yellow',1,9),
    (10,'Vergi','vergi','yellow',1,10),
    (11,'Sigorta','sigorta','yellow',1,11),
    (12,'Bakım & Onarım','bakim',  'teal',1,12),
    (13,'Yakıt','yakit','purple',1,13),
    (14,'Seyahat','seyahat','cyan',1,14),
    (15,'Konaklama','konaklama','cyan',1,15),
    (16,'Yemek','yemek','green',1,16),
    (17,'Reklam & Pazarlama','reklam','pink',1,17),
    (18,'Maaş & İşçilik','maas','red',1,18),
    (19,'Fatura & Abonelik','fatura','orange',1,19),
    (20,'Komisyon','komisyon','yellow',1,20),
    (21,'Yazılım & Teknoloji','yazilim','cyan',1,21),
    (22,'Diğer','diger','gray',1,22);

  -- Sprint 7.1: Master Data tables

  CREATE TABLE IF NOT EXISTS master_vehicle_brands (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    country    TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS master_vehicle_models (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL REFERENCES master_vehicle_brands(id),
    name     TEXT NOT NULL,
    UNIQUE(brand_id, name)
  );

  CREATE TABLE IF NOT EXISTS master_vehicle_versions (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS master_vehicle_fuels (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS master_vehicle_transmissions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS master_vehicle_body_types (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS master_vehicle_drive_types (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS master_vehicle_colors (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    hex_code   TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS master_currencies (
    code       TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    symbol     TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS master_cities (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_code INTEGER,
    name       TEXT NOT NULL,
    country    TEXT NOT NULL DEFAULT 'TR',
    UNIQUE(plate_code, country)
  );

  CREATE TABLE IF NOT EXISTS master_districts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    city_code INTEGER NOT NULL,
    name      TEXT NOT NULL,
    UNIQUE(city_code, name)
  );

  -- Sprint 10: Enterprise Foundation

  CREATE TABLE IF NOT EXISTS companies (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    tax_number   TEXT,
    tax_office   TEXT,
    phone        TEXT,
    mail         TEXT,
    address      TEXT,
    logo         TEXT,
    currency     TEXT NOT NULL DEFAULT 'TRY',
    status       TEXT NOT NULL DEFAULT 'active',
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id    INTEGER REFERENCES companies(id),
    full_name     TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    phone         TEXT,
    password_hash TEXT NOT NULL,
    avatar        TEXT,
    role          TEXT NOT NULL DEFAULT 'misafir',
    status        TEXT NOT NULL DEFAULT 'active',
    last_login    TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at    TEXT
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    token      TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    token      TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_permissions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    module     TEXT NOT NULL,
    can_read   INTEGER NOT NULL DEFAULT 1,
    can_write  INTEGER NOT NULL DEFAULT 0,
    can_update INTEGER NOT NULL DEFAULT 0,
    can_delete INTEGER NOT NULL DEFAULT 0,
    can_export INTEGER NOT NULL DEFAULT 0,
    can_ai     INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, module)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id),
    type       TEXT NOT NULL DEFAULT 'info',
    title      TEXT NOT NULL,
    body       TEXT,
    link       TEXT,
    is_read    INTEGER NOT NULL DEFAULT 0,
    category   TEXT NOT NULL DEFAULT 'system',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id),
    user_name  TEXT,
    action     TEXT NOT NULL,
    module     TEXT NOT NULL,
    record_id  INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_memories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id),
    company_id INTEGER REFERENCES companies(id),
    type       TEXT NOT NULL DEFAULT 'analysis',
    module     TEXT NOT NULL DEFAULT 'dashboard',
    summary    TEXT NOT NULL,
    data_json  TEXT,
    importance INTEGER NOT NULL DEFAULT 5,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Sprint 11: AI Core Platform

  CREATE TABLE IF NOT EXISTS ai_logs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER REFERENCES users(id),
    session_id     TEXT,
    provider       TEXT NOT NULL DEFAULT 'rule_engine',
    model          TEXT,
    action         TEXT NOT NULL DEFAULT 'chat',
    prompt_text    TEXT,
    response_text  TEXT,
    input_tokens   INTEGER NOT NULL DEFAULT 0,
    output_tokens  INTEGER NOT NULL DEFAULT 0,
    duration_ms    INTEGER,
    cost_usd       REAL NOT NULL DEFAULT 0,
    error_text     TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_settings (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    provider        TEXT NOT NULL DEFAULT 'rule_engine',
    claude_model    TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    openai_model    TEXT NOT NULL DEFAULT 'gpt-4o',
    gemini_model    TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    temperature     REAL NOT NULL DEFAULT 0.7,
    max_tokens      INTEGER NOT NULL DEFAULT 2000,
    system_prompt   TEXT,
    persona         TEXT NOT NULL DEFAULT 'ceo',
    memory_enabled  INTEGER NOT NULL DEFAULT 1,
    stream_enabled  INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  INSERT OR IGNORE INTO ai_settings (id) VALUES (1);

  -- Sprint 13.0: Vehicle Intelligence Center
  CREATE TABLE IF NOT EXISTS vehicle_intelligence (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id          INTEGER NOT NULL UNIQUE REFERENCES assets(id),
    expert_firm       TEXT,
    expert_date       TEXT,
    expert_no         TEXT,
    expert_note       TEXT,
    expert_score      REAL,
    expert_pdf_path   TEXT,
    ai_score          REAL,
    ai_analysis       TEXT,
    score_kaporta     REAL,
    score_mekanik     REAL,
    score_elektrik    REAL,
    score_ic_mekan    REAL,
    score_lastik      REAL,
    score_bakim       REAL,
    score_belge       REAL,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vehicle_parts (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_intelligence_id INTEGER NOT NULL REFERENCES vehicle_intelligence(id),
    part_key                TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'orijinal',
    notes                   TEXT,
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(vehicle_intelligence_id, part_key)
  );

  CREATE TABLE IF NOT EXISTS vehicle_part_photos (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_intelligence_id INTEGER NOT NULL REFERENCES vehicle_intelligence(id),
    part_key                TEXT NOT NULL,
    file_path               TEXT NOT NULL,
    original_name           TEXT,
    created_at              TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vehicle_tires (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_intelligence_id INTEGER NOT NULL REFERENCES vehicle_intelligence(id),
    position                TEXT NOT NULL,
    brand                   TEXT,
    model                   TEXT,
    size                    TEXT,
    dot                     TEXT,
    tread_depth             REAL,
    status                  TEXT DEFAULT 'iyi',
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(vehicle_intelligence_id, position)
  );

  CREATE TABLE IF NOT EXISTS vehicle_battery (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_intelligence_id INTEGER NOT NULL UNIQUE REFERENCES vehicle_intelligence(id),
    brand                   TEXT,
    ampere                  REAL,
    install_date            TEXT,
    test_result             TEXT DEFAULT 'iyi',
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_intelligence_id INTEGER NOT NULL REFERENCES vehicle_intelligence(id),
    type                    TEXT NOT NULL,
    date                    TEXT,
    km                      INTEGER,
    notes                   TEXT,
    next_date               TEXT,
    next_km                 INTEGER,
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Sprint 12.2B: Document Intelligence
  CREATE TABLE IF NOT EXISTS document_intelligence (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id         INTEGER NOT NULL REFERENCES documents(id),
    ocr_text            TEXT,
    extracted_fields    TEXT,
    document_type       TEXT,
    confidence_score    REAL NOT NULL DEFAULT 0,
    summary             TEXT,
    auto_link_asset_id  INTEGER REFERENCES assets(id),
    link_suggestions    TEXT,
    is_duplicate        INTEGER NOT NULL DEFAULT 0,
    duplicate_of_id     INTEGER REFERENCES documents(id),
    ocr_provider        TEXT NOT NULL DEFAULT 'rule_engine',
    pipeline_steps      TEXT,
    processed_at        TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Sprint 13.1: Vehicle Valuations
  CREATE TABLE IF NOT EXISTS vehicle_valuations (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id            INTEGER REFERENCES assets(id),
    purchase_id         INTEGER REFERENCES purchases(id),
    our_price           REAL,
    market_price        REAL,
    market_min          REAL,
    market_max          REAL,
    market_avg          REAL,
    market_median       REAL,
    market_std_dev      REAL,
    market_count        INTEGER DEFAULT 0,
    price_vs_market     REAL,
    negotiation_price   REAL,
    negotiation_advice  TEXT,
    investment_score    REAL,
    liquidity_score     REAL,
    roi_1y              REAL,
    risk_score          REAL,
    value_6m            REAL,
    value_12m           REAL,
    value_24m           REAL,
    ai_recommendation   TEXT,
    ai_analysis         TEXT,
    research_id         INTEGER REFERENCES market_researches(id),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Sprint 12.2A: AI Tasks
  CREATE TABLE IF NOT EXISTS ai_tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id),
    company_id  INTEGER REFERENCES companies(id),
    title       TEXT NOT NULL,
    description TEXT,
    type        TEXT NOT NULL DEFAULT 'analysis',
    status      TEXT NOT NULL DEFAULT 'pending',
    priority    INTEGER NOT NULL DEFAULT 3,
    due_date    TEXT,
    result      TEXT,
    ai_provider TEXT,
    ai_model    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at  TEXT
  );

  -- Sprint 8.4: Market Intelligence Center

  CREATE TABLE IF NOT EXISTS market_researches (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    category     TEXT NOT NULL DEFAULT 'other',
    -- Vehicle / motorcycle / caravan / equipment filters
    brand        TEXT,
    model        TEXT,
    version      TEXT,
    year_from    INTEGER,
    year_to      INTEGER,
    km_from      INTEGER,
    km_to        INTEGER,
    fuel_type    TEXT,
    transmission TEXT,
    -- Real estate filters
    property_type TEXT,
    room_count    TEXT,
    area_from     REAL,
    area_to       REAL,
    -- Boat filters
    length_from  REAL,
    length_to    REAL,
    -- General
    province     TEXT,
    notes        TEXT,
    status       TEXT NOT NULL DEFAULT 'active',
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at   TEXT
  );

  CREATE TABLE IF NOT EXISTS market_listings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    research_id  INTEGER NOT NULL REFERENCES market_researches(id),
    title        TEXT NOT NULL,
    url          TEXT,
    platform     TEXT,
    price        REAL NOT NULL DEFAULT 0,
    currency     TEXT NOT NULL DEFAULT 'TRY',
    listing_date TEXT,
    km           INTEGER,
    description  TEXT,
    seller       TEXT,
    notes        TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at   TEXT
  );
`

function runSprint10Seed(db) {
  const bcrypt = require('bcryptjs')
  // Default company
  const companies = db.prepare('SELECT id FROM companies WHERE id = 1').get()
  if (!companies) {
    db.prepare(`INSERT INTO companies (id, company_name, currency) VALUES (1, 'AlManagement Demo', 'TRY')`).run()
  }
  // Admin user
  const admin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@alm.com')
  if (!admin) {
    const hash = bcrypt.hashSync('Admin123!', 10)
    db.prepare(`INSERT INTO users (company_id, full_name, email, password_hash, role, status) VALUES (1, 'Admin Kullanıcı', 'admin@alm.com', ?, 'ceo', 'active')`).run(hash)
  }
}

function runMigrations(db) {
  // Sprint 12.2A: ai_memories V4 — full memory schema
  const aiMemColsV4 = db.pragma('table_info(ai_memories)').map(c => c.name)
  const aiMemV4 = {
    tenant_id: 'INTEGER',
    title: 'TEXT',
    content: 'TEXT',
    source_module: "TEXT DEFAULT 'chat'",
    last_used_at: 'TEXT',
    usage_count: 'INTEGER DEFAULT 0',
    embedding_placeholder: 'TEXT',
    status: "TEXT DEFAULT 'active'",
  }
  for (const [col, def] of Object.entries(aiMemV4)) {
    if (!aiMemColsV4.includes(col)) {
      try { db.exec(`ALTER TABLE ai_memories ADD COLUMN ${col} ${def};`) } catch (_) {}
    }
  }

  // Sprint 12.2A: ai_settings V2
  const aiSetCols = db.pragma('table_info(ai_settings)').map(c => c.name)
  const aiSetV2 = {
    default_persona: "TEXT DEFAULT 'ceo'",
    fallback_provider: "TEXT DEFAULT 'rule_engine'",
    cost_limit_daily: 'REAL DEFAULT 0',
    auto_summary: 'INTEGER DEFAULT 0',
  }
  for (const [col, def] of Object.entries(aiSetV2)) {
    if (!aiSetCols.includes(col)) {
      try { db.exec(`ALTER TABLE ai_settings ADD COLUMN ${col} ${def};`) } catch (_) {}
    }
  }

  // Sprint 12.2A: ai_logs V2
  const aiLogCols = db.pragma('table_info(ai_logs)').map(c => c.name)
  const aiLogV2 = {
    temperature: 'REAL',
    status: "TEXT DEFAULT 'success'",
  }
  for (const [col, def] of Object.entries(aiLogV2)) {
    if (!aiLogCols.includes(col)) {
      try { db.exec(`ALTER TABLE ai_logs ADD COLUMN ${col} ${def};`) } catch (_) {}
    }
  }

  // Sprint 11: ai_memories V3 — vector-ready columns
  const aiMemCols = db.pragma('table_info(ai_memories)').map(c => c.name)
  const aiMemV3 = { embedding_json: 'TEXT', tags: 'TEXT', relevance_score: 'REAL DEFAULT 1.0' }
  for (const [col, def] of Object.entries(aiMemV3)) {
    if (!aiMemCols.includes(col)) {
      try { db.exec(`ALTER TABLE ai_memories ADD COLUMN ${col} ${def};`) } catch (_) {}
    }
  }

  // Sprint 8.4 migration: add research_id to purchases
  const purchCols = db.pragma('table_info(purchases)').map(c => c.name)
  if (!purchCols.includes('research_id')) {
    try { db.exec('ALTER TABLE purchases ADD COLUMN research_id INTEGER REFERENCES market_researches(id);') } catch (_) {}
  }

  // Sprint 7 migration: extend documents table for Digital Archive
  const docCols7 = db.pragma('table_info(documents)').map(c => c.name)
  const docExtCols = {
    module: 'TEXT DEFAULT \'asset\'',
    description: 'TEXT',
    category: 'TEXT DEFAULT \'Diğer\'',
    expire_date: 'TEXT',
    status: 'TEXT DEFAULT \'uploaded\'',
    file_size: 'INTEGER',
    mime_type: 'TEXT',
    original_name: 'TEXT',
    current_version: 'INTEGER DEFAULT 1',
    importance_score: 'REAL',
    verification_status: 'TEXT DEFAULT \'unverified\'',
    ocr_status: 'TEXT DEFAULT \'pending\'',
    summary: 'TEXT',
    keywords: 'TEXT',
  }
  for (const [col, def] of Object.entries(docExtCols)) {
    if (!docCols7.includes(col)) {
      try { db.exec(`ALTER TABLE documents ADD COLUMN ${col} ${def};`) } catch (_) {}
    }
  }
  // Backfill module column from existing FK relationships
  try {
    db.exec(`UPDATE documents SET module = 'asset'    WHERE module IS NULL AND asset_id IS NOT NULL;`)
    db.exec(`UPDATE documents SET module = 'purchase' WHERE module IS NULL AND purchase_id IS NOT NULL;`)
    db.exec(`UPDATE documents SET module = 'sale'     WHERE module IS NULL AND sale_id IS NOT NULL;`)
    db.exec(`UPDATE documents SET module = 'archive'  WHERE module IS NULL;`)
  } catch (_) {}

  // Sprint 4 migration: add sale_id to documents + activities
  const docCols4 = db.pragma('table_info(documents)').map(c => c.name)
  if (!docCols4.includes('sale_id')) {
    try { db.exec('ALTER TABLE documents ADD COLUMN sale_id INTEGER;') } catch (_) {}
  }
  const actCols4 = db.pragma('table_info(activities)').map(c => c.name)
  if (!actCols4.includes('sale_id')) {
    try { db.exec('ALTER TABLE activities ADD COLUMN sale_id INTEGER;') } catch (_) {}
  }

  // Sprint 3 migration: add purchase_id to documents + activities
  const docCols = db.pragma('table_info(documents)').map(c => c.name)
  if (!docCols.includes('purchase_id')) {
    try { db.exec('ALTER TABLE documents ADD COLUMN purchase_id INTEGER;') } catch (_) {}
  }
  const actCols2 = db.pragma('table_info(activities)').map(c => c.name)
  if (!actCols2.includes('purchase_id')) {
    try { db.exec('ALTER TABLE activities ADD COLUMN purchase_id INTEGER;') } catch (_) {}
  }

  // Sprint 2 migration: ensure assets table has the new schema
  const cols = db.pragma('table_info(assets)').map(c => c.name)
  if (!cols.includes('deleted_at')) {
    // Drop Sprint 1 assets table and let SCHEMA recreate it
    db.exec('DROP TABLE IF EXISTS assets;')
    console.log('[DB] Migrated assets table to Sprint 2 schema')
  }
  // Add updated_at + deleted_at to activities if missing (Sprint 1 didn't have them)
  const actCols = db.pragma('table_info(activities)').map(c => c.name)
  if (!actCols.includes('deleted_at')) {
    try {
      db.exec('ALTER TABLE activities ADD COLUMN updated_at TEXT;')
      db.exec('ALTER TABLE activities ADD COLUMN deleted_at TEXT;')
      db.exec('ALTER TABLE activities ADD COLUMN asset_id INTEGER;')
    } catch (_) { /* already exists */ }
  }
}

function createDatabase() {
  const DbClass = process.env.USE_SQLJS
    ? require('./sqljs-compat').Database
    : require('better-sqlite3')
  const db = new DbClass(DB_PATH)
  runMigrations(db)
  db.exec(SCHEMA)
  seedMasterData(db)
  runSprint10Seed(db)
  console.log(`[DB] SQLite initialized at: ${DB_PATH}`)
  return db
}

module.exports = { createDatabase, DB_PATH }
