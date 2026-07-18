import { useAuthStore } from '@/store/authStore'
import type {
  ProcessResult, DocumentIntelligence, DocumentHealth,
  AssetDocHealth, ExpiringDocument, MissingDocument, DocIntelStats,
} from '@/types/documentIntelligence'

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

async function apiGet<T>(path: string): Promise<T> {
  const res  = await fetch(path, { headers: getAuthHeaders() })
  const body = await res.json() as { success: boolean; data: T; message?: string }
  if (!body.success) throw new Error(body.message ?? 'Hata')
  return body.data
}

async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const res  = await fetch(path, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) })
  const body = await res.json() as { success: boolean; data: T; message?: string }
  if (!body.success) throw new Error(body.message ?? 'Hata')
  return body.data
}

export const docIntelApi = {
  process(documentId: number, ocrProvider = 'rule_engine'): Promise<ProcessResult> {
    return apiPost<ProcessResult>(`/api/doc-intel/${documentId}`, { ocr_provider: ocrProvider })
  },

  get(documentId: number): Promise<DocumentIntelligence> {
    return apiGet<DocumentIntelligence>(`/api/doc-intel/${documentId}`)
  },

  getHealth(): Promise<DocumentHealth> {
    return apiGet<DocumentHealth>('/api/doc-intel/health')
  },

  getHealthByAsset(): Promise<AssetDocHealth[]> {
    return apiGet<AssetDocHealth[]>('/api/doc-intel/health/assets')
  },

  getMissing(): Promise<MissingDocument[]> {
    return apiGet<MissingDocument[]>('/api/doc-intel/missing')
  },

  getExpiring(days = 30): Promise<ExpiringDocument[]> {
    return apiGet<ExpiringDocument[]>(`/api/doc-intel/expiring?days=${days}`)
  },

  getStats(): Promise<DocIntelStats> {
    return apiGet<DocIntelStats>('/api/doc-intel/stats')
  },
}
