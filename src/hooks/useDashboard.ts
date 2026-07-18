import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import type { DashboardData } from '@/types/dashboard'

const REFRESH_INTERVAL_MS = 60_000

interface UseDashboardResult {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await api.get<DashboardData>('/dashboard')
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
