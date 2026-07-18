import { useAuthStore } from '@/store/authStore'
import type {
  VehicleFullData,
  VehicleScore,
  VehicleDashboardStats,
  VehicleMaintenanceRecord,
  VehicleTire,
  VehicleBattery,
  VehiclePart,
} from '@/types/vehicleIntelligence'

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

const BASE = '/api/vehicle-intel'

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...(options.headers ?? {}) },
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message ?? 'API hatası')
  return json.data as T
}

export const vehicleIntelApi = {
  getByAsset: (assetId: number) =>
    apiFetch<VehicleFullData | null>(`/${assetId}`),

  saveExpert: (assetId: number, payload: {
    expert_firm?: string
    expert_date?: string
    expert_no?: string
    expert_note?: string
    expert_score?: number
  }) =>
    apiFetch<VehicleFullData>(`/${assetId}/expert`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  saveParts: (assetId: number, parts: Pick<VehiclePart, 'part_key' | 'status' | 'notes'>[]) =>
    apiFetch<VehicleFullData>(`/${assetId}/parts`, {
      method: 'POST',
      body: JSON.stringify({ parts }),
    }),

  uploadPhoto: async (assetId: number, file: File, partKey: string) => {
    const form = new FormData()
    form.append('photo', file)
    form.append('part_key', partKey)
    const res = await fetch(`${BASE}/${assetId}/photos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: form,
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.message ?? 'Yükleme hatası')
    return json.data as { file_path: string; part_key: string }
  },

  deletePhoto: (photoId: number) =>
    apiFetch<{ deleted: boolean }>(`/photos/${photoId}`, { method: 'DELETE' }),

  saveTires: (assetId: number, tires: Partial<VehicleTire>[]) =>
    apiFetch<VehicleFullData>(`/${assetId}/tires`, {
      method: 'POST',
      body: JSON.stringify({ tires }),
    }),

  saveBattery: (assetId: number, payload: Partial<VehicleBattery>) =>
    apiFetch<VehicleFullData>(`/${assetId}/battery`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMaintenance: (assetId: number) =>
    apiFetch<VehicleMaintenanceRecord[]>(`/${assetId}/maintenance`),

  addMaintenance: (assetId: number, payload: Partial<VehicleMaintenanceRecord>) =>
    apiFetch<VehicleMaintenanceRecord>(`/${assetId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMaintenance: (id: number, payload: Partial<VehicleMaintenanceRecord>) =>
    apiFetch<VehicleMaintenanceRecord>(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteMaintenance: (id: number) =>
    apiFetch<{ deleted: boolean }>(`/maintenance/${id}`, { method: 'DELETE' }),

  generateScore: (assetId: number) =>
    apiFetch<VehicleScore>(`/${assetId}/ai-score`, { method: 'POST' }),

  getDashboardStats: () =>
    apiFetch<VehicleDashboardStats>('/dashboard'),
}
