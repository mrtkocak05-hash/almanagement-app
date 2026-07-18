import type {
  VehicleValuation,
  QuickValuationInput,
  DashboardOpportunities,
} from '@/types/vehicleValuation'

import { useAuthStore } from '@/store/authStore'

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

const BASE = '/api/vehicle-valuation'

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers ?? {}),
    },
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message ?? 'API hatası')
  return json.data as T
}

export const vehicleValuationApi = {
  quick: (input: QuickValuationInput) =>
    apiFetch<VehicleValuation>('/quick', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  valuatePurchase: (purchaseId: number) =>
    apiFetch<VehicleValuation>(`/purchase/${purchaseId}`, { method: 'POST' }),

  getPurchaseValuation: (purchaseId: number) =>
    apiFetch<VehicleValuation | null>(`/purchase/${purchaseId}`),

  valuateAsset: (assetId: number) =>
    apiFetch<VehicleValuation>(`/asset/${assetId}`, { method: 'POST' }),

  getAssetValuation: (assetId: number) =>
    apiFetch<VehicleValuation | null>(`/asset/${assetId}`),

  getDashboard: () =>
    apiFetch<DashboardOpportunities>('/dashboard'),
}
