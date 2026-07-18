import type {
  PurchaseListResponse, PurchaseDetail, PurchaseWizardData,
  PurchaseFilters, PurchaseExpense, PurchasePartner, PurchaseDocument
} from '@/types/purchases'
import { useAuthStore } from '@/store/authStore'

const BASE = '/api/purchases'

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

export const purchasesApi = {
  list: (filters: PurchaseFilters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)) })
    return req<PurchaseListResponse>(`${BASE}?${params}`)
  },

  get: (id: number) => req<PurchaseDetail>(`${BASE}/${id}`),

  create: (data: Omit<PurchaseWizardData, 'files'> & { complete: boolean }) =>
    req<PurchaseDetail>(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  complete: (id: number) => req<PurchaseDetail>(`${BASE}/${id}/complete`, { method: 'POST' }),

  update: (id: number, data: Partial<PurchaseWizardData>) =>
    req<PurchaseDetail>(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: number) => req<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  addExpense: (id: number, data: Omit<PurchaseExpense, 'id' | 'purchase_id' | 'created_at' | 'deleted_at'>) =>
    req<PurchaseExpense>(`${BASE}/${id}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteExpense: (id: number, eid: number) =>
    req<void>(`${BASE}/${id}/expenses/${eid}`, { method: 'DELETE' }),

  addPartner: (id: number, data: { name: string; share_percent: number; phone?: string; notes?: string }) =>
    req<PurchasePartner>(`${BASE}/${id}/partners`, {
      method: 'POST',
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
    return req<PurchaseDocument>(`${BASE}/${id}/documents`, { method: 'POST', body: form })
  },

  deleteDocument: (id: number, docId: number) =>
    req<void>(`${BASE}/${id}/documents/${docId}`, { method: 'DELETE' }),
}
