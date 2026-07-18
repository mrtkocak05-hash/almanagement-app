import type { SaleListResponse, SaleDetail, SaleWizardData, SaleFilters, SaleExpense, SaleDocument } from '@/types/sales'
import { useAuthStore } from '@/store/authStore'

const BASE = '/api/sales'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> ?? {}),
    },
  })
  const json = await res.json() as { success: boolean; data: T; message?: string }
  if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`)
  return json.data
}

export const salesApi = {
  getAssetContext: (assetId: number) => req<SaleDetail>(`${BASE}/asset-context/${assetId}`),

  list: (filters: SaleFilters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)) })
    return req<SaleListResponse>(`${BASE}?${params}`)
  },

  get: (id: number) => req<SaleDetail>(`${BASE}/${id}`),

  create: (data: Omit<SaleWizardData, 'files'> & { complete: boolean }) =>
    req<SaleDetail>(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  complete: (id: number) => req<SaleDetail>(`${BASE}/${id}/complete`, { method: 'POST' }),

  delete: (id: number) => req<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  addExpense: (id: number, data: Omit<SaleExpense, 'id' | 'sale_id' | 'created_at' | 'deleted_at'>) =>
    req<SaleExpense>(`${BASE}/${id}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteExpense: (id: number, eid: number) => req<void>(`${BASE}/${id}/expenses/${eid}`, { method: 'DELETE' }),

  uploadDocument: (id: number, file: File, type: string, title: string) => {
    const form = new FormData()
    form.append('document', file)
    form.append('type', type)
    form.append('title', title)
    return req<SaleDocument>(`${BASE}/${id}/documents`, { method: 'POST', body: form })
  },

  deleteDocument: (id: number, docId: number) => req<void>(`${BASE}/${id}/documents/${docId}`, { method: 'DELETE' }),
}
