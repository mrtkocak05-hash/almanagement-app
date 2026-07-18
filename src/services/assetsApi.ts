import type { AssetListResponse, AssetDetail, AssetFormData, AssetFilters, AssetPartner, AssetPhoto, AssetDocument } from '@/types/assets'
import { useAuthStore } from '@/store/authStore'

const BASE = '/api/assets'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> ?? {}),
    },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { message?: string }).message ?? `HTTP ${res.status}`)
  }
  const json = (await res.json()) as { success: boolean; data: T; message?: string }
  if (!json.success) throw new Error(json.message ?? 'API hatası')
  return json.data
}

export const assetsApi = {
  list: (filters: AssetFilters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)) })
    return req<AssetListResponse>(`${BASE}?${params}`)
  },

  get: (id: number) => req<AssetDetail>(`${BASE}/${id}`),

  create: (data: AssetFormData) => req<AssetDetail>(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  update: (id: number, data: Partial<AssetFormData>) => req<AssetDetail>(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  delete: (id: number) => req<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  uploadPhotos: (id: number, files: File[]) => {
    const form = new FormData()
    files.forEach(f => form.append('photos', f))
    return req<AssetPhoto[]>(`${BASE}/${id}/photos`, { method: 'POST', body: form })
  },

  setMainPhoto: (id: number, photoId: number) =>
    req<void>(`${BASE}/${id}/photos/${photoId}/main`, { method: 'PATCH' }),

  deletePhoto: (id: number, photoId: number) =>
    req<void>(`${BASE}/${id}/photos/${photoId}`, { method: 'DELETE' }),

  addPartner: (id: number, data: { name: string; share_percent: number; phone?: string; notes?: string }) =>
    req<AssetPartner>(`${BASE}/${id}/partners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  updatePartner: (id: number, pid: number, data: Partial<AssetPartner>) =>
    req<void>(`${BASE}/${id}/partners/${pid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deletePartner: (id: number, pid: number) =>
    req<void>(`${BASE}/${id}/partners/${pid}`, { method: 'DELETE' }),

  uploadDocument: (id: number, file: File, type: string, title: string) => {
    const form = new FormData()
    form.append('document', file)
    form.append('type', type)
    form.append('title', title)
    return req<AssetDocument>(`${BASE}/${id}/documents`, { method: 'POST', body: form })
  },

  deleteDocument: (id: number, docId: number) =>
    req<void>(`${BASE}/${id}/documents/${docId}`, { method: 'DELETE' }),
}
