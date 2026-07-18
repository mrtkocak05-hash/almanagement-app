import { useState, useEffect, useMemo, useCallback } from 'react'
import { masterDataApi } from '@/services/masterDataApi'
import type { Brand, VehicleModel, MasterItem, District } from '@/services/masterDataApi'
import type { SmartSearchOption } from '@/components/ui'

// Module-level caches — persist across component mounts, cleared only on page reload
let _brands: Brand[] | null = null
let _brandsError: string | null = null
const _modelCache = new Map<string, VehicleModel[]>()
const _listCache = new Map<string, MasterItem[]>()
const _districtCache = new Map<string, District[]>()

export function useBrands() {
  const [data, setData] = useState<Brand[]>(() => _brands ?? [])
  const [loading, setLoading] = useState(() => _brands === null && _brandsError === null)
  const [fetchError, setFetchError] = useState<string | null>(() => _brandsError)

  const fetch = useCallback(() => {
    _brands = null
    _brandsError = null
    setData([])
    setFetchError(null)
    setLoading(true)
    masterDataApi.getBrands()
      .then(d => {
        _brands = d
        _brandsError = null
        setData(d)
        setFetchError(null)
      })
      .catch(err => {
        const msg = err?.message ?? 'Markalar yüklenemedi'
        _brandsError = msg
        setFetchError(msg)
        setData([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (_brands !== null || _brandsError !== null) return
    fetch()
  }, []) // eslint-disable-line

  const options = useMemo<SmartSearchOption[]>(
    () => data.map(b => ({ value: b.name, label: b.name, sub: b.country ?? undefined })),
    [data]
  )

  return { data, options, loading, fetchError, retry: fetch }
}

export function useModels(brandName?: string | null) {
  const [data, setData] = useState<VehicleModel[]>(() =>
    brandName ? (_modelCache.get(brandName) ?? []) : []
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!brandName) { setData([]); return }
    const cached = _modelCache.get(brandName)
    if (cached) {
      setData(cached)
      return
    }
    setLoading(true)
    masterDataApi.getModels({ brand_name: brandName })
      .then(d => {
        _modelCache.set(brandName, d)
        setData(d)
      })
      .catch(() => {
        setData([])
      })
      .finally(() => setLoading(false))
  }, [brandName])

  const options = useMemo<SmartSearchOption[]>(
    () => data.map(m => ({ value: m.name, label: m.name })),
    [data]
  )

  return { data, options, loading }
}

export function useMasterList(type: string) {
  const [data, setData] = useState<MasterItem[]>(() => _listCache.get(type) ?? [])
  const [loading, setLoading] = useState(() => !_listCache.has(type))

  useEffect(() => {
    if (_listCache.has(type)) return
    masterDataApi.getList(type)
      .then(d => {
        _listCache.set(type, d)
        setData(d)
      })
      .catch(() => {
        setData([])
      })
      .finally(() => setLoading(false))
  }, [type])

  const options = useMemo<SmartSearchOption[]>(
    () => data.map(i => ({ value: i.name, label: i.name })),
    [data]
  )

  return { data, options, loading }
}

// Versions are generic trim levels — gated on model selection so the field only appears when relevant
export function useVersionsByModel(modelName?: string | null) {
  const { options, loading } = useMasterList('versions')
  return {
    options: modelName ? options : [],
    loading: modelName ? loading : false,
  }
}

export function useDistricts(cityName?: string | null) {
  const [data, setData] = useState<District[]>(() =>
    cityName ? (_districtCache.get(cityName) ?? []) : []
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cityName) { setData([]); return }
    const cached = _districtCache.get(cityName)
    if (cached) { setData(cached); return }
    setLoading(true)
    masterDataApi.getDistricts(cityName)
      .then(d => {
        _districtCache.set(cityName, d)
        setData(d)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [cityName])

  const options = useMemo<SmartSearchOption[]>(
    () => data.map(d => ({ value: d.name, label: d.name })),
    [data]
  )

  return { data, options, loading }
}

// Convenience hooks
export const useVehicleFuels = () => useMasterList('fuels')
export const useVehicleTransmissions = () => useMasterList('transmissions')
export const useVehicleBodyTypes = () => useMasterList('body_types')
export const useVehicleColors = () => useMasterList('colors')
export const useVehicleVersions = () => useMasterList('versions')
export const useCities = () => useMasterList('cities')
export const useCurrencies = () => useMasterList('currencies')
