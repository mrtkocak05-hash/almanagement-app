import { api } from '@/services/api'
import type { AIBrief, PortfolioBreakdown, Profitability, SmartAlert, ExecutiveAction, DashboardKPIs, ChartDataPoint, ExecutiveScoreData, TopInvestment, TopExpenseAsset, BalanceSummary, BalancePeriod } from '@/types/aiDashboard'

export const aiDashboardApi = {
  brief:              () => api.get<AIBrief>('/dashboard/ai-brief'),
  portfolioBreakdown: () => api.get<PortfolioBreakdown>('/dashboard/portfolio-breakdown'),
  profitability:      () => api.get<Profitability>('/dashboard/profitability'),
  alerts:             () => api.get<SmartAlert[]>('/dashboard/alerts'),
  executiveSummary:   () => api.get<ExecutiveAction[]>('/dashboard/executive-summary'),
  kpis:               () => api.get<DashboardKPIs>('/dashboard/kpis'),
  chartData:          (period: 'monthly' | 'weekly' | 'yearly' = 'monthly') =>
                        api.get<ChartDataPoint[]>(`/dashboard/chart-data?period=${period}`),
  executiveScore:     () => api.get<ExecutiveScoreData>('/dashboard/executive-score'),
  topInvestments:     () => api.get<TopInvestment[]>('/dashboard/top-investments'),
  topExpenseAssets:   () => api.get<TopExpenseAsset[]>('/dashboard/top-expense-assets'),
  balanceSummary:     (period: BalancePeriod = 'monthly') =>
                        api.get<BalanceSummary>(`/dashboard/balance-summary?period=${period}`),
}
