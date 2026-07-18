import { useState, useEffect, useCallback } from 'react'
import { purchasesApi } from '@/services/purchasesApi'
import type { PurchaseDetail } from '@/types/purchases'

export function usePurchaseDetail(id: number | null) {
  const [data, setData] = useState<PurchaseDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      setData(await purchasesApi.get(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])
  return { data, loading, error, refetch: fetchData }
}
