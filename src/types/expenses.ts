export type PaymentSource = 'cash' | 'bank' | 'credit_card' | 'partner' | 'other'
export type ExpenseOwner = 'company' | 'personal' | 'partner'
export type ExpenseStatus = 'active' | 'void'

export const EXPENSE_CATEGORIES = [
  'Araç', 'Gayrimenkul', 'Tekne', 'Motosiklet', 'Karavan', 'İş Makinesi',
  'Ofis', 'Kişisel', 'Finans', 'Vergi', 'Sigorta', 'Bakım & Onarım',
  'Yakıt', 'Seyahat', 'Konaklama', 'Yemek', 'Reklam & Pazarlama',
  'Maaş & İşçilik', 'Fatura & Abonelik', 'Komisyon', 'Yazılım & Teknoloji', 'Diğer',
] as const

export type ExpenseCategoryValue = typeof EXPENSE_CATEGORIES[number]

// Category → color class (left border)
export const CATEGORY_COLOR: Record<string, string> = {
  'Araç': 'border-l-purple-500',
  'Motosiklet': 'border-l-purple-500',
  'Karavan': 'border-l-purple-500',
  'Yakıt': 'border-l-purple-400',
  'Gayrimenkul': 'border-l-blue-500',
  'Tekne': 'border-l-blue-400',
  'İş Makinesi': 'border-l-indigo-500',
  'Ofis': 'border-l-orange-500',
  'Kişisel': 'border-l-zinc-500',
  'Finans': 'border-l-yellow-500',
  'Vergi': 'border-l-yellow-400',
  'Sigorta': 'border-l-yellow-300',
  'Komisyon': 'border-l-yellow-300',
  'Maaş & İşçilik': 'border-l-red-400',
  'Reklam & Pazarlama': 'border-l-pink-500',
  'Fatura & Abonelik': 'border-l-orange-400',
  'Yazılım & Teknoloji': 'border-l-cyan-500',
  'Seyahat': 'border-l-cyan-400',
  'Konaklama': 'border-l-cyan-300',
  'Bakım & Onarım': 'border-l-teal-500',
  'Yemek': 'border-l-green-400',
  'Diğer': 'border-l-zinc-400',
}

export const CATEGORY_BADGE_COLOR: Record<string, string> = {
  'Araç': 'bg-purple-500/15 text-purple-300',
  'Motosiklet': 'bg-purple-500/15 text-purple-300',
  'Karavan': 'bg-purple-500/15 text-purple-300',
  'Yakıt': 'bg-purple-400/15 text-purple-300',
  'Gayrimenkul': 'bg-blue-500/15 text-blue-300',
  'Tekne': 'bg-blue-400/15 text-blue-300',
  'İş Makinesi': 'bg-indigo-500/15 text-indigo-300',
  'Ofis': 'bg-orange-500/15 text-orange-300',
  'Kişisel': 'bg-zinc-500/15 text-zinc-400',
  'Finans': 'bg-yellow-500/15 text-yellow-300',
  'Vergi': 'bg-yellow-400/15 text-yellow-300',
  'Sigorta': 'bg-yellow-300/15 text-yellow-300',
  'Komisyon': 'bg-yellow-300/15 text-yellow-300',
  'Maaş & İşçilik': 'bg-red-400/15 text-red-300',
  'Reklam & Pazarlama': 'bg-pink-500/15 text-pink-300',
  'Fatura & Abonelik': 'bg-orange-400/15 text-orange-300',
  'Yazılım & Teknoloji': 'bg-cyan-500/15 text-cyan-300',
  'Seyahat': 'bg-cyan-400/15 text-cyan-300',
  'Konaklama': 'bg-cyan-300/15 text-cyan-300',
  'Bakım & Onarım': 'bg-teal-500/15 text-teal-300',
  'Yemek': 'bg-green-400/15 text-green-300',
  'Diğer': 'bg-zinc-400/15 text-zinc-400',
}

export const PAYMENT_SOURCE_LABELS: Record<PaymentSource, string> = {
  cash: 'Kasa',
  bank: 'Banka',
  credit_card: 'Kredi Kartı',
  partner: 'Ortak',
  other: 'Diğer',
}

export const EXPENSE_OWNER_LABELS: Record<ExpenseOwner, string> = {
  company: 'Şirket',
  personal: 'Kişisel',
  partner: 'Ortak',
}

export const OWNER_COLOR: Record<ExpenseOwner, string> = {
  company: 'text-blue-300',
  personal: 'text-zinc-400',
  partner: 'text-teal-300',
}

export interface Expense {
  id: number
  expense_no: string
  expense_date: string
  category: string
  sub_category: string | null
  description: string
  amount: number
  currency: string
  exchange_rate: number
  amount_try: number
  payment_source: PaymentSource
  payment_source_id: number | null
  payment_source_name: string | null
  expense_owner: ExpenseOwner
  related_asset_id: number | null
  related_asset_name: string | null
  related_purchase_id: number | null
  related_sale_id: number | null
  tax_included: number
  vat_rate: number
  notes: string | null
  status: ExpenseStatus
  // joined
  asset_name_ref?: string | null
  purchase_no?: string | null
  sale_no?: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ExpenseDocument {
  id: number
  expense_id: number
  doc_type: string
  original_name: string
  file_path: string
  created_at: string
}

export interface ExpenseCategoryRow {
  id: number
  name: string
  slug: string
  color: string
  is_system: number
}

export interface ExpenseSummary {
  today: number
  month: number
  year: number
  avg_daily: number
  by_category: Array<{ category: string; total: number; cnt: number }>
  by_owner: Array<{ expense_owner: string; total: number; cnt: number }>
}

export interface ExpenseReports {
  year: string
  year_total: number
  by_category: Array<{ category: string; total: number; cnt: number }>
  monthly: Array<{ month: string; total: number; cnt: number }>
  by_owner: Array<{ expense_owner: string; total: number; cnt: number }>
  by_payment_source: Array<{ payment_source: string; total: number; cnt: number }>
  by_asset: Array<{ related_asset_id: number; asset_name: string; total: number; cnt: number }>
}

export interface FormContext {
  assets: Array<{ id: number; name: string; type: string }>
  purchases: Array<{ id: number; purchase_no: string; asset_name: string }>
  sales: Array<{ id: number; sale_no: string; asset_name: string }>
  cash_accounts: Array<{ id: number; name: string }>
  bank_accounts: Array<{ id: number; name: string }>
  credit_cards: Array<{ id: number; name: string; bank: string }>
}

export interface ExpenseFilters {
  category?: string
  owner?: string
  payment_source?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface PaginatedExpenses {
  items: Expense[]
  total: number
  page: number
  total_pages: number
  summary: { total_try: number }
}
