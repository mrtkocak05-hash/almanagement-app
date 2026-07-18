import { useAuthStore } from '@/store/authStore'

const BASE = '/api/master-data'

async function req<T>(url: string): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
  const json = await res.json() as { success: boolean; data: T }
  if (!res.ok || !json.success) throw new Error(`HTTP ${res.status}`)
  return json.data
}

export interface Brand { id: number; name: string; country: string | null; sort_order: number }
export interface VehicleModel { id: number; brand_id: number; name: string; brand_name?: string }
export interface MasterItem { id: number; name: string; sort_order?: number; hex_code?: string; country?: string; plate_code?: number }
export interface District { id: number; name: string }

export const masterDataApi = {
  getBrands: () => req<Brand[]>(`${BASE}/brands`),
  getModels: (params?: { brand_id?: number; brand_name?: string }) => {
    const q = params?.brand_id
      ? `brand_id=${params.brand_id}`
      : params?.brand_name
        ? `brand_name=${encodeURIComponent(params.brand_name)}`
        : ''
    return req<VehicleModel[]>(`${BASE}/models${q ? '?' + q : ''}`)
  },
  getDistricts: (city_name: string) =>
    req<District[]>(`${BASE}/districts?city_name=${encodeURIComponent(city_name)}`),
  getList: (type: string) => req<MasterItem[]>(`${BASE}/${type}`),
}
