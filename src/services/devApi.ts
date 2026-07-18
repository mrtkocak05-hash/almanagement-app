import { useAuthStore } from '@/store/authStore'

const BASE = '/api/dev'

export interface DevStatus {
  status: string
  env: string
  db_path: string
  capital: number
  usd_try: number
  gold_gram_try: number
  counts: Record<string, number>
  timestamp: string
}

export interface DevStatistics {
  total_assets: number
  total_vehicles: number
  total_purchases: number
  total_purchases_amount: number
  total_sales: number
  total_sales_amount: number
  total_expenses: number
  total_expenses_amount: number
  total_documents: number
  total_activities: number
  total_ai_memories: number
  total_bank_accounts: number
  unread_notifications: number
}

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> ?? {}),
    },
  })
  const json = await res.json() as { success: boolean; data: T; message?: string }
  if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`)
  return json.data
}

export const devApi = {
  getStatus:          () => req<DevStatus>(`${BASE}/status`),
  resetDatabase:      () => req<{ reset: boolean; message: string }>(`${BASE}/reset-database`, { method: 'POST' }),
  loadDemoData:       () => req<{ message: string; summary: Record<string, unknown> }>(`${BASE}/load-demo-data`, { method: 'POST' }),
  clearDemo:          () => req<{ reset: boolean; message: string }>(`${BASE}/clear-demo`, { method: 'POST' }),
  rebuildDashboard:   () => req<{ message: string }>(`${BASE}/rebuild-dashboard`, { method: 'POST' }),
  createDemoCompany:  () => req<{ message: string }>(`${BASE}/create-demo-company`, { method: 'POST' }),
  getStatistics:      () => req<DevStatistics>(`${BASE}/statistics`),
}
