import { useState, useEffect, useCallback } from 'react'
import { vehicleIntelApi } from '@/services/vehicleIntelligenceApi'
import type {
  VehicleFullData,
  VehicleScore,
  VehicleDashboardStats,
} from '@/types/vehicleIntelligence'

export function useVehicleIntelligence(assetId: number | null) {
  const [data, setData] = useState<VehicleFullData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!assetId) return
    setLoading(true)
    setError(null)
    try {
      const result = await vehicleIntelApi.getByAsset(assetId)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Veri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [assetId])

  useEffect(() => { load() }, [load])

  const refetch = () => load()

  return { data, loading, error, refetch, setData }
}

export function useVehicleScore(assetId: number | null) {
  const [score, setScore] = useState<VehicleScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    if (!assetId) return
    setLoading(true)
    setError(null)
    try {
      const result = await vehicleIntelApi.generateScore(assetId)
      setScore(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Skor hesaplanamadı')
    } finally {
      setLoading(false)
    }
  }, [assetId])

  return { score, loading, error, generate }
}

export function useVehicleDashboardStats() {
  const [data, setData] = useState<VehicleDashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    vehicleIntelApi.getDashboardStats()
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Veri alınamadı'))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
