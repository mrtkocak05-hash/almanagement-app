import { useState, useEffect, useCallback, useRef } from 'react'
import { aiDashboardApi } from '@/services/aiDashboardApi'
import type { SmartAlert, ExecutiveAction, DashboardKPIs, ChartDataPoint, ExecutiveScoreData, TopInvestment, TopExpenseAsset, BalanceSummary, BalancePeriod } from '@/types/aiDashboard'

function useAIEndpoint<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetcher()
      if (mounted.current) setData(result)
    } catch (_) {}
    if (mounted.current) setLoading(false)
  }, [fetcher])

  useEffect(() => {
    mounted.current = true
    load()
    return () => { mounted.current = false }
  }, [load])

  return { data, loading, refetch: load }
}

export function useAIBrief() {
  return useAIEndpoint(aiDashboardApi.brief)
}

export function usePortfolioBreakdown() {
  return useAIEndpoint(aiDashboardApi.portfolioBreakdown)
}

export function useProfitability() {
  return useAIEndpoint(aiDashboardApi.profitability)
}

export function useAlerts() {
  return useAIEndpoint<SmartAlert[]>(aiDashboardApi.alerts)
}

export function useExecutiveSummary() {
  return useAIEndpoint<ExecutiveAction[]>(aiDashboardApi.executiveSummary)
}

export function useKPIs() {
  return useAIEndpoint<DashboardKPIs>(aiDashboardApi.kpis)
}

export function useExecutiveScore() {
  return useAIEndpoint<ExecutiveScoreData>(aiDashboardApi.executiveScore)
}

export function useTopInvestments() {
  return useAIEndpoint<TopInvestment[]>(aiDashboardApi.topInvestments)
}

export function useTopExpenseAssets() {
  return useAIEndpoint<TopExpenseAsset[]>(aiDashboardApi.topExpenseAssets)
}

// Chart data hook with period param (not using generic because fetcher changes)
export function useChartData(period: 'monthly' | 'weekly' | 'yearly') {
  const [data, setData] = useState<ChartDataPoint[] | null>(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    setLoading(true)
    aiDashboardApi.chartData(period)
      .then(d => { if (mounted.current) setData(d) })
      .catch(() => {})
      .finally(() => { if (mounted.current) setLoading(false) })
    return () => { mounted.current = false }
  }, [period])

  return { data, loading }
}

export function useBalanceSummary(period: BalancePeriod) {
  const [data, setData] = useState<BalanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    setLoading(true)
    aiDashboardApi.balanceSummary(period)
      .then(d => { if (mounted.current) setData(d) })
      .catch(() => {})
      .finally(() => { if (mounted.current) setLoading(false) })
    return () => { mounted.current = false }
  }, [period])

  return { data, loading }
}
