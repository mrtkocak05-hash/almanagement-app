import { useState, useEffect, useCallback } from 'react'
import { vehicleValuationApi } from '@/services/vehicleValuationApi'
import type {
  VehicleValuation,
  QuickValuationInput,
  DashboardOpportunities,
} from '@/types/vehicleValuation'

export function useAssetValuation(assetId: number | null) {
  const [data, setData] = useState<VehicleValuation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [computing, setComputing] = useState(false)

  const load = useCallback(async () => {
    if (!assetId) return
    setLoading(true)
    try {
      const v = await vehicleValuationApi.getAssetValuation(assetId)
      setData(v)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Veri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [assetId])

  useEffect(() => { load() }, [load])

  const compute = useCallback(async () => {
    if (!assetId) return
    setComputing(true)
    setError(null)
    try {
      const v = await vehicleValuationApi.valuateAsset(assetId)
      setData(v)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Değerleme hesaplanamadı')
    } finally {
      setComputing(false)
    }
  }, [assetId])

  return { data, loading, error, computing, compute, refetch: load }
}

export function usePurchaseValuation(purchaseId: number | null) {
  const [data, setData] = useState<VehicleValuation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [computing, setComputing] = useState(false)

  const load = useCallback(async () => {
    if (!purchaseId) return
    setLoading(true)
    try {
      const v = await vehicleValuationApi.getPurchaseValuation(purchaseId)
      setData(v)
    } catch {
      // no saved valuation yet — not an error
    } finally {
      setLoading(false)
    }
  }, [purchaseId])

  useEffect(() => { load() }, [load])

  const compute = useCallback(async () => {
    if (!purchaseId) return
    setComputing(true)
    setError(null)
    try {
      const v = await vehicleValuationApi.valuatePurchase(purchaseId)
      setData(v)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Değerleme hesaplanamadı')
    } finally {
      setComputing(false)
    }
  }, [purchaseId])

  return { data, loading, error, computing, compute, refetch: load }
}

export function useQuickValuation() {
  const [data, setData] = useState<VehicleValuation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compute = useCallback(async (input: QuickValuationInput) => {
    setLoading(true)
    setError(null)
    try {
      const v = await vehicleValuationApi.quick(input)
      setData(v)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Değerleme başarısız')
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, compute }
}

export function useValuationDashboard() {
  const [data, setData] = useState<DashboardOpportunities | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    vehicleValuationApi.getDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
