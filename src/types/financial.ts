export type AccountCurrency = 'TRY' | 'USD' | 'EUR' | 'Gold'
export type AccountStatus = 'active' | 'passive'
export type MovementType = 'increase' | 'withdrawal' | 'owner_contribution' | 'partner_contribution' | 'dividend' | 'investment_return' | 'other'
export type TransactionType = 'income' | 'expense' | 'transfer' | 'capital'
export type TransferAccountType = 'cash' | 'bank'
export type ReceivableStatus = 'pending' | 'partial' | 'collected'
export type PayableStatus = 'pending' | 'partial' | 'paid'

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  increase: 'Sermaye Artışı',
  withdrawal: 'Sermaye Çekimi',
  owner_contribution: 'Ortak Katkısı',
  partner_contribution: 'Hissedar Katkısı',
  dividend: 'Temettü',
  investment_return: 'Yatırım Getirisi',
  other: 'Diğer',
}

export const MOVEMENT_POSITIVE: MovementType[] = ['increase', 'owner_contribution', 'partner_contribution', 'investment_return']

export const TRANSACTION_COLORS: Record<TransactionType, string> = {
  income: 'text-green-500',
  expense: 'text-red-500',
  transfer: 'text-blue-500',
  capital: 'text-yellow-500',
}

export const TRANSACTION_BG: Record<TransactionType, string> = {
  income: 'bg-green-500/10',
  expense: 'bg-red-500/10',
  transfer: 'bg-blue-500/10',
  capital: 'bg-yellow-500/10',
}

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  income: 'Gelir',
  expense: 'Gider',
  transfer: 'Transfer',
  capital: 'Sermaye',
}

export const RECEIVABLE_STATUS_LABELS: Record<ReceivableStatus, string> = {
  pending: 'Bekliyor',
  partial: 'Kısmi',
  collected: 'Tahsil Edildi',
}

export const PAYABLE_STATUS_LABELS: Record<PayableStatus, string> = {
  pending: 'Bekliyor',
  partial: 'Kısmi',
  paid: 'Ödendi',
}

export interface CashAccount {
  id: number
  name: string
  currency: AccountCurrency
  balance: number
  description: string | null
  status: AccountStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface BankAccount {
  id: number
  bank_name: string
  branch: string | null
  iban: string | null
  currency: AccountCurrency
  opening_balance: number
  current_balance: number
  status: AccountStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreditCard {
  id: number
  bank: string
  card_name: string
  limit_amount: number
  available_limit: number
  current_debt: number
  due_date: string | null
  statement_date: string | null
  status: AccountStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CapitalMovement {
  id: number
  type: MovementType
  movement_date: string
  amount: number
  currency: AccountCurrency
  exchange_rate: number
  amount_try: number
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface MoneyTransfer {
  id: number
  from_type: TransferAccountType
  from_id: number
  from_name: string | null
  to_type: TransferAccountType
  to_id: number
  to_name: string | null
  amount: number
  currency: AccountCurrency
  exchange_rate: number
  amount_try: number
  transfer_date: string
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface FinancialTransaction {
  id: number
  type: TransactionType
  category: string | null
  source_type: string | null
  source_id: number | null
  amount: number
  currency: AccountCurrency
  exchange_rate: number
  amount_try: number
  transaction_date: string
  description: string | null
  reference_no: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Receivable {
  id: number
  customer: string
  amount: number
  currency: AccountCurrency
  exchange_rate: number
  amount_try: number
  due_date: string | null
  collected_amount: number
  status: ReceivableStatus
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Payable {
  id: number
  supplier: string
  amount: number
  currency: AccountCurrency
  exchange_rate: number
  amount_try: number
  due_date: string | null
  paid_amount: number
  status: PayableStatus
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface FinancialSummary {
  current_capital: number
  available_cash: number
  banks_total: number
  receivables_total: number
  payables_total: number
  credit_debt: number
  net_cash_position: number
  recent_transactions: FinancialTransaction[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  total_pages: number
  summary?: Record<string, number>
}
