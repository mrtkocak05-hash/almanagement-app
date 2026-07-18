import { useState, useEffect, useCallback } from 'react'
import { assetsApi } from '@/services/assetsApi'
import type { AssetDetail } from '@/types/assets'

interface UseAssetDetailResult {
  data: AssetDetail | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useAssetDetail(id: number | null): UseAssetDetailResult {
  const [data, setData] = useState<AssetDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const result = await assetsApi.get(id)
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
