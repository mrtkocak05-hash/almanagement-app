import type { AssetType } from './assets'

export type PurchaseStatus = 'draft' | 'completed'
export type PurchaseCurrency = 'TRY' | 'USD' | 'EUR' | 'Gold'
export type SellerType = 'individual' | 'company' | 'gallery' | 'dealer' | 'other'
export type PaymentMethod = 'cash' | 'bank' | 'credit_card' | 'cheque' | 'transfer'

export const SELLER_TYPE_LABELS: Record<SellerType, string> = {
  individual: 'Bireysel',
  company: 'Şirket',
  gallery: 'Galeri',
  dealer: 'Bayi',
  other: 'Diğer',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Nakit',
  bank: 'Banka',
  credit_card: 'Kredi Kartı',
  cheque: 'Çek',
  transfer: 'Havale/EFT',
}

export const EXPENSE_TYPES = [
  'Noter', 'Sigorta', 'Kasko', 'Bakım', 'Yakıt', 'Nakliye',
  'Konaklama', 'Komisyon', 'Ekspertiz', 'Servis', 'Vergi', 'Diğer',
]

export const CURRENCY_LABELS: Record<PurchaseCurrency, string> = {
  TRY: '₺ TRY', USD: '$ USD', EUR: '€ EUR', Gold: 'Altın (gr)',
}

export interface PurchaseExpense {
  id: number
  purchase_id: number
  expense_type: string
  expense_name: string
  amount: number
  currency: string
  exchange_rate: number
  amount_try: number
  paid_by: string | null
  is_shared: number
  my_share_amount: number | null
  created_at: string
  deleted_at: string | null
}

export interface PurchasePartner {
  id: number
  purchase_id: number
  name: string
  share_percent: number
  share_amount: number | null
  phone: string | null
  notes: string | null
  created_at: string
  deleted_at: string | null
}

export interface PurchaseDocument {
  id: number
  purchase_id: number
  asset_id: number | null
  type: string
  title: string
  filename: string
  path: string
  created_at: string
  deleted_at: string | null
}

export interface Purchase {
  id: number
  purchase_no: string
  type: AssetType
  asset_id: number | null
  asset_name: string
  seller_name: string | null
  seller_type: string | null
  seller_province: string | null
  seller_district: string | null
  purchase_date: string | null
  purchase_price: number | null
  currency: PurchaseCurrency
  exchange_rate: number
  purchase_price_try: number | null
  payment_method: string | null
  total_expenses_try: number
  total_cost_try: number | null
  share_percent: number
  my_share_cost: number | null
  status: PurchaseStatus
  notes: string | null
  // Asset fields
  brand: string | null
  model: string | null
  package_name: string | null
  year: number | null
  km: number | null
  fuel_type: string | null
  transmission: string | null
  plate: string | null
  vin: string | null
  engine_number: string | null
  engine_size: string | null
  color: string | null
  damage_status: string | null
  property_type: string | null
  gross_area: number | null
  net_area: number | null
  room_count: string | null
  building_age: number | null
  floor_number: string | null
  location_address: string | null
  title_deed: string | null
  length_m: number | null
  engine_power: string | null
  hull_type: string | null
  boat_reg_number: string | null
  equipment_type: string | null
  engine_hours: number | null
  serial_number: string | null
  investment_type: string | null
  institution: string | null
  units: number | null
  unit_price: number | null
  bank_wallet: string | null
  description: string | null
  // From query
  expense_count?: number
  partner_count?: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PurchaseDetail extends Purchase {
  expenses: PurchaseExpense[]
  partners: PurchasePartner[]
  documents: PurchaseDocument[]
  activities: unknown[]
}

export interface PurchaseListResponse {
  items: Purchase[]
  total: number
  page: number
  limit: number
  total_pages: number
  summary: {
    today_total: number
    month_total: number
    grand_total: number
    avg_total: number
    count: number
  }
}

// ─── Damage / Inspection ───────────────────────────────────────────
export type DamageStatus = 'orijinal' | 'boyali' | 'degisen' | 'lokal_boyali' | 'islemli'

export const DAMAGE_STATUS_CONFIG: Record<DamageStatus, { fill: string; stroke: string; label: string }> = {
  orijinal:     { fill: '#dcfce7', stroke: '#16a34a', label: 'Orijinal' },
  boyali:       { fill: '#fef9c3', stroke: '#ca8a04', label: 'Boyalı' },
  degisen:      { fill: '#fee2e2', stroke: '#dc2626', label: 'Değişen' },
  lokal_boyali: { fill: '#ffedd5', stroke: '#ea580c', label: 'Lokal Boyalı' },
  islemli:      { fill: '#dbeafe', stroke: '#2563eb', label: 'İşlemli' },
}

// ─── Photo ─────────────────────────────────────────────────────────
export interface WizardPhoto {
  file: File
  preview: string
  category: string
  is_cover: boolean
}

export const PHOTO_CATEGORIES = ['Ön', 'Arka', 'Sol', 'Sağ', 'İç Mekan', 'Motor', 'Hasarlı Bölge', 'Diğer']

// ─── Wizard form data ───────────────────────────────────────────────
export interface WizardExpense {
  expense_type: string
  expense_name: string
  amount: number
  currency: PurchaseCurrency
  exchange_rate: number
  amount_try: number
  paid_by?: string
  is_shared: boolean
}

export interface WizardPartner {
  name: string
  share_percent: number
  phone?: string
  notes?: string
}

export interface WizardFile {
  file: File
  doc_type: string
  title: string
}

export interface PurchaseWizardData {
  // Step 1
  type: AssetType
  // Step 2 - asset info
  asset_name: string
  // Real estate extras
  title_deed_type?: string
  ada?: string
  parsel?: string
  independent_section?: string
  front_exposure?: string
  heating_type?: string
  usage_status?: string
  brand?: string
  model?: string
  package_name?: string
  year?: number
  km?: number
  fuel_type?: string
  transmission?: string
  plate?: string
  vin?: string
  engine_number?: string
  engine_size?: string
  color?: string
  damage_status?: string
  property_type?: string
  gross_area?: number
  net_area?: number
  room_count?: string
  building_age?: number
  floor_number?: string
  location_address?: string
  title_deed?: string
  length_m?: number
  engine_power?: string
  hull_type?: string
  boat_reg_number?: string
  equipment_type?: string
  engine_hours?: number
  serial_number?: string
  investment_type?: string
  institution?: string
  units?: number
  unit_price?: number
  bank_wallet?: string
  description?: string
  // Step 3
  purchase_date: string
  purchase_price: number
  currency: PurchaseCurrency
  exchange_rate: number
  purchase_price_try: number
  share_percent: number
  seller_name?: string
  seller_type?: SellerType
  seller_province?: string
  seller_district?: string
  payment_method?: PaymentMethod
  notes?: string
  // Step 4
  partners: WizardPartner[]
  // Step 5
  expenses: WizardExpense[]
  // Step 6 — Hasar / Eksper (araç tipleri)
  damage_parts?: Record<string, DamageStatus>
  expert_company?: string
  expert_date?: string
  expert_no?: string
  score_engine?: number
  score_mechanical?: number
  score_body?: number
  score_paint?: number
  score_general?: number
  ai_risk_note?: string
  photos?: WizardPhoto[]
  // Step 7
  files: WizardFile[]
}

export interface PurchaseFilters {
  search?: string
  type?: AssetType | ''
  status?: PurchaseStatus | ''
  page?: number
  limit?: number
}
