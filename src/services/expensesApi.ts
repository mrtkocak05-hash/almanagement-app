import type {
  Expense, ExpenseCategoryRow, ExpenseSummary,
  ExpenseReports, FormContext, ExpenseFilters, PaginatedExpenses,
} from '@/types/expenses'
import { useAuthStore } from '@/store/authStore'

const BASE = '/api/expenses'

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

function post<T>(url: string, body: unknown) {
  return req<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
function put<T>(url: string, body: unknown) {
  return req<T>(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
function del(url: string) { return req<void>(url, { method: 'DELETE' }) }

function buildParams(filters: ExpenseFilters & { page?: number }) {
  const p = new URLSearchParams()
  if (filters.page) p.set('page', String(filters.page))
  if (filters.category) p.set('category', filters.category)
  if (filters.owner) p.set('owner', filters.owner)
  if (filters.payment_source) p.set('payment_source', filters.payment_source)
  if (filters.date_from) p.set('date_from', filters.date_from)
  if (filters.date_to) p.set('date_to', filters.date_to)
  if (filters.search) p.set('search', filters.search)
  return p.toString()
}

export const expensesApi = {
  getSummary: () => req<ExpenseSummary>(`${BASE}/summary`),
  getFormContext: () => req<FormContext>(`${BASE}/form-context`),
  listCategories: () => req<ExpenseCategoryRow[]>(`${BASE}/categories`),
  getReports: (year?: number) => req<ExpenseReports>(`${BASE}/reports${year ? `?year=${year}` : ''}`),

  list: (filters: ExpenseFilters & { page?: number } = {}) =>
    req<PaginatedExpenses>(`${BASE}?${buildParams(filters)}`),

  get: (id: number) => req<Expense>(`${BASE}/${id}`),

  create: (data: Partial<Expense> & { tags?: string[] }) =>
    post<Expense>(BASE, data),

  update: (id: number, data: Partial<Expense> & { tags?: string[] }) =>
    put<Expense>(`${BASE}/${id}`, data),

  delete: (id: number) => del(`${BASE}/${id}`),

  uploadDocument: (id: number, file: File, docType: string) => {
    const fd = new FormData()
    fd.append('document', file)
    fd.append('doc_type', docType)
    return req<{ id: number; file_path: string; original_name: string }>(
      `${BASE}/${id}/documents`, { method: 'POST', body: fd }
    )
  },

  deleteDocument: (id: number, docId: number) => del(`${BASE}/${id}/documents/${docId}`),
}
