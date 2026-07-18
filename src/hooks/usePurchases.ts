import { useState, useEffect, useCallback } from 'react'
import { purchasesApi } from '@/services/purchasesApi'
import type { PurchaseListResponse, PurchaseFilters } from '@/types/purchases'

export function usePurchases(initialFilters: PurchaseFilters = {}) {
  const [filters, setFiltersState] = useState<PurchaseFilters>(initialFilters)
  const [data, setData] = useState<PurchaseListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setData(await purchasesApi.list(filters))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  const setFilters = useCallback((f: PurchaseFilters) => {
    setFiltersState(prev => ({ ...prev, ...f }))
  }, [])

  return { data, loading, error, refetch: fetchData, filters, setFilters }
}
