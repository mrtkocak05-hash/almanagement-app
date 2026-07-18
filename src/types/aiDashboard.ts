export interface AIBriefPortfolio {
  active_count: number
  total_value: number
  total_cost: number
  gain_loss: number
  gain_loss_pct: number
}

export interface AIBriefCash {
  capital: number
  cash_assets: number
  liquidity_pct: number
}

export interface AIBriefActivity {
  type: string
  title: string
  amount: number | null
  currency: string
  activity_date: string
}

export interface AIBriefPending {
  type: string
  label: string
  count: number
}

export interface AIBrief {
  portfolio: AIBriefPortfolio
  cash: AIBriefCash
  risks: string[]
  opportunities: string[]
  pending: AIBriefPending[]
  last_24h: AIBriefActivity[]
  last_7d: PeriodSummary
  last_30d: PeriodSummary
  expiring_insurance: number
  missing_docs: number
  ai_comment: string
  generated_at: string
}

export interface PortfolioBreakdownItem {
  type: string
  count: number
  total_value: number
  total_cost: number
  pct: number
}

export interface PortfolioBreakdown {
  breakdown: PortfolioBreakdownItem[]
  total_value: number
}

export interface ProfitabilitySale {
  id: number
  asset_name: string
  asset_type: string
  net_profit_try: number
  roi_percent: number | null
  annual_roi_percent: number | null
  sale_date: string | null
  share_profit_try: number | null
}

export interface Profitability {
  sales: ProfitabilitySale[]
  best: ProfitabilitySale | null
  worst: ProfitabilitySale | null
  avg_roi: number
  total_profit: number
  total_loss: number
  net: number
}

export type AlertType = 'waiting' | 'missing_value' | 'missing_photo' | 'expiring_doc' | 'missing_doc'
export type AlertSeverity = 'high' | 'medium' | 'low'

export interface SmartAlert {
  type: AlertType
  severity: AlertSeverity
  title: string
  detail: string
  asset_id: number | null
  link: string
}

export type ActionIcon = 'clock' | 'trending_up' | 'search' | 'wallet' | 'alert' | 'file' | 'check'
export type ActionPriority = 'high' | 'medium' | 'low'

export interface ExecutiveAction {
  icon: ActionIcon
  priority: ActionPriority
  text: string
  link: string
}

// AI Comment Engine types
export interface AIComment {
  id: string
  text: string
  category: 'portfolio' | 'risk' | 'opportunity' | 'action' | 'market'
  importance: 'high' | 'medium' | 'low'
}

// Dashboard KPIs
export interface DashboardKPIs {
  portfolio_value: number
  total_sales: number
  total_purchases: number
  month_profit: number
  month_expenses: number
  net_cash: number
  avg_roi: number
  active_assets: number
  passive_assets: number
  pending_sales: number
}

// Chart data
export interface ChartDataPoint {
  period: string
  label: string
  income: number
  expenses: number
  profit: number
}

// Executive Score
export interface ExecScoreDimension {
  key: string
  label: string
  score: number
  detail: string
}

export interface ExecutiveScoreData {
  overall: number
  dimensions: ExecScoreDimension[]
}

// Enhanced AIBrief
export interface PeriodSummary {
  income: number
  expenses: number
  profit: number
  net: number
}

// Top Investments
export interface TopInvestment {
  id: number
  asset_name: string
  asset_type: string
  net_profit_try: number
  roi_percent: number
  annual_roi_percent: number | null
  sale_date: string | null
  purchase_date: string | null
  holding_days: number | null
  investment_score: number | null
}

// Top Expense Assets
export interface TopExpenseAsset {
  asset_id: number
  asset_name: string
  asset_type: string
  total_expenses: number
  expense_count: number
}

// Balance Summary
export type BalancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface BalanceSummary {
  period: BalancePeriod
  start_date: string
  end_date: string
  static_balance: number
  period_income: number
  income_breakdown: {
    sales: number
    activities: number
    capital_increase: number
    receivables: number
  }
  kasada_bulunan: number
  expenses: {
    personal: number
    company: number
    total: number
  }
  kalan: number
}

// AI Memory types
export interface AIMemoryEntry {
  id: string
  timestamp: string
  type: 'analysis' | 'alert' | 'recommendation' | 'chat' | 'forecast'
  data: Record<string, unknown>
  summary: string
}
