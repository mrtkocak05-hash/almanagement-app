import type { AssetType } from './assets'
import type { PaymentMethod, PurchaseCurrency } from './purchases'

export type SaleStatus = 'draft' | 'completed'
export type BuyerType = 'individual' | 'company' | 'gallery' | 'dealer' | 'other'

export type { PaymentMethod }

export const BUYER_TYPE_LABELS: Record<BuyerType, string> = {
  individual: 'Bireysel',
  company: 'Şirket',
  gallery: 'Galeri',
  dealer: 'Bayi',
  other: 'Diğer',
}

export const SALE_EXPENSE_TYPES = [
  'Noter', 'Komisyon', 'Vergi', 'Sigorta', 'Nakliye', 'Temizlik', 'Reklam', 'Diğer',
]

export const SCORE_LABELS: Record<string, string> = {
  excellent: 'Mükemmel',
  very_good: 'Çok İyi',
  good: 'İyi',
  average: 'Ortalama',
  weak: 'Zayıf',
}

export function getScoreLabel(score: number | null): string {
  if (score === null) return '—'
  if (score >= 85) return 'Mükemmel'
  if (score >= 70) return 'Çok İyi'
  if (score >= 55) return 'İyi'
  if (score >= 40) return 'Ortalama'
  return 'Zayıf'
}

export function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground'
  if (score >= 85) return 'text-green-500'
  if (score >= 70) return 'text-emerald-500'
  if (score >= 55) return 'text-blue-500'
  if (score >= 40) return 'text-yellow-500'
  return 'text-red-500'
}

export interface SaleExpense {
  id: number
  sale_id: number
  expense_type: string
  expense_name: string
  amount: number
  currency: PurchaseCurrency
  exchange_rate: number
  amount_try: number
  paid_by: string | null
  created_at: string
  deleted_at: string | null
}

export interface SaleDocument {
  id: number
  sale_id: number
  asset_id: number | null
  type: string
  title: string
  filename: string
  path: string
  created_at: string
  deleted_at: string | null
}

export interface SalePartner {
  id: number
  name: string
  share_percent: number
  share_amount: number | null
  phone: string | null
  notes: string | null
}

export interface Sale {
  id: number
  sale_no: string
  asset_id: number
  asset_name: string
  asset_type: AssetType
  purchase_id: number | null
  purchase_price_try: number | null
  total_purchase_expenses_try: number
  total_cost_try: number | null
  share_percent: number
  my_share_cost: number | null
  purchase_date: string | null
  buyer_name: string | null
  buyer_type: BuyerType | null
  buyer_phone: string | null
  sale_date: string | null
  sale_price: number
  currency: PurchaseCurrency
  exchange_rate: number
  sale_price_try: number | null
  payment_method: string | null
  total_sale_expenses_try: number
  net_sale_try: number | null
  net_profit_try: number | null
  share_profit_try: number | null
  holding_days: number | null
  roi_percent: number | null
  annual_roi_percent: number | null
  investment_score: number | null
  sale_usd_rate: number | null
  sale_gold_rate: number | null
  purchase_usd_value: number | null
  current_usd_value: number | null
  purchase_gold_value: number | null
  current_gold_value: number | null
  status: SaleStatus
  notes: string | null
  expense_count?: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SaleDetail extends Sale {
  expenses: SaleExpense[]
  documents: SaleDocument[]
  activities: unknown[]
  partners: SalePartner[]
}

export interface SaleListResponse {
  items: Sale[]
  total: number
  page: number
  limit: number
  total_pages: number
  summary: {
    today_profit: number
    month_profit: number
    total_profit: number
    avg_roi: number
    count: number
  }
}

export interface WizardSaleExpense {
  expense_type: string
  expense_name: string
  amount: number
  currency: PurchaseCurrency
  exchange_rate: number
  amount_try: number
  paid_by?: string
}

export interface WizardSaleFile {
  file: File
  doc_type: string
  title: string
}

export interface SaleWizardData {
  // Step 1 — Asset
  asset_id: number | null
  asset_name: string
  asset_type: AssetType | null
  // From asset context
  purchase_id?: number | null
  purchase_price_try: number
  total_purchase_expenses_try: number
  total_cost_try: number
  share_percent: number
  purchase_date?: string | null
  // Step 2 — Sale Info
  sale_date: string
  sale_price: number
  currency: PurchaseCurrency
  exchange_rate: number
  sale_price_try: number
  buyer_name?: string
  buyer_type?: BuyerType
  buyer_phone?: string
  payment_method?: PaymentMethod
  notes?: string
  // Exchange rates at time of sale
  sale_usd_rate?: number
  sale_gold_rate?: number
  // Step 3 — Expenses
  expenses: WizardSaleExpense[]
  // Step 4 — Documents
  files: WizardSaleFile[]
}

export interface SaleFilters {
  search?: string
  status?: SaleStatus | ''
  page?: number
  limit?: number
}
