import { useState, useEffect, useCallback } from 'react'
import { salesApi } from '@/services/salesApi'
import type { SaleListResponse, SaleDetail, SaleFilters } from '@/types/sales'

interface UseSalesResult {
  data: SaleListResponse | null
  loading: boolean
  error: string | null
  filters: SaleFilters
  setFilters: (f: SaleFilters) => void
  refetch: () => void
}

export function useSales(initialFilters: SaleFilters = {}): UseSalesResult {
  const [filters, setFiltersState] = useState<SaleFilters>(initialFilters)
  const [data, setData] = useState<SaleListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await salesApi.list(filters)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  const setFilters = useCallback((f: SaleFilters) => {
    setFiltersState(prev => ({ ...prev, ...f }))
  }, [])

  return { data, loading, error, filters, setFilters, refetch: fetchData }
}

interface UseSaleDetailResult {
  data: SaleDetail | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useSaleDetail(id: number | null): UseSaleDetailResult {
  const [data, setData] = useState<SaleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const result = await salesApi.get(id)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
