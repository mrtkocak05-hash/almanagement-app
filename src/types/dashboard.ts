export type ActivityType =
  | 'purchase' | 'sale' | 'expense' | 'personal_expense'
  | 'income' | 'document' | 'capital'

export interface Activity {
  id: number
  type: ActivityType
  title: string
  amount: number | null
  currency: string
  note: string | null
  activity_date: string
  created_at: string
}

export type InsightLevel = 'info' | 'warning' | 'success' | 'error'

export interface Insight {
  level: InsightLevel
  message: string
}

export interface DashboardData {
  capital: {
    amount_try: number
    updated_at: string | null
  }
  metrics: {
    total_assets: number
    active_investments: number
    available_cash: number
    total_asset_value: number
  }
  recent_activities: Activity[]
  today_summary: {
    purchases: number
    sales: number
    expenses: number
    income: number
    net_change: number
  }
  exchange_rates: {
    usd_try: number
    gold_gram_try: number
    updated_at: string | null
  }
  insights: Insight[]
  last_updated: string
}
