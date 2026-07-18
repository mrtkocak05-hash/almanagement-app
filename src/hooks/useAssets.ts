import { useState, useEffect, useCallback } from 'react'
import { assetsApi } from '@/services/assetsApi'
import type { AssetListResponse, AssetFilters } from '@/types/assets'

interface UseAssetsResult {
  data: AssetListResponse | null
  loading: boolean
  error: string | null
  refetch: () => void
  setFilters: (f: AssetFilters) => void
  filters: AssetFilters
}

export function useAssets(initialFilters: AssetFilters = {}): UseAssetsResult {
  const [filters, setFiltersState] = useState<AssetFilters>(initialFilters)
  const [data, setData] = useState<AssetListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await assetsApi.list(filters)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  const setFilters = useCallback((f: AssetFilters) => {
    setFiltersState(prev => ({ ...prev, ...f }))
  }, [])

  return { data, loading, error, refetch: fetchData, setFilters, filters }
}
