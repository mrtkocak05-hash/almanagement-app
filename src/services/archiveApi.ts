import type {
  ArchiveDocument, ArchiveSummary, ArchiveContext,
  ArchiveReports, DocFilters, PaginatedDocs, OcrExtractResult,
} from '@/types/archive'
import { useAuthStore } from '@/store/authStore'

const BASE = '/api/archive'

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

function buildQ(f: DocFilters & { page?: number }) {
  const p = new URLSearchParams()
  if (f.page) p.set('page', String(f.page))
  if (f.search) p.set('search', f.search)
  if (f.category) p.set('category', f.category)
  if (f.module) p.set('module', f.module)
  if (f.status) p.set('status', f.status)
  if (f.expire_status) p.set('expire_status', f.expire_status)
  if (f.date_from) p.set('date_from', f.date_from)
  if (f.date_to) p.set('date_to', f.date_to)
  return p.toString()
}

export const archiveApi = {
  getSummary: () => req<ArchiveSummary>(`${BASE}/summary`),
  getContext: () => req<ArchiveContext>(`${BASE}/context`),
  listCategories: () => req<Array<{ id: number; name: string; slug: string }>>(`${BASE}/categories`),
  getReports: () => req<ArchiveReports>(`${BASE}/reports`),

  list: (filters: DocFilters & { page?: number } = {}) =>
    req<PaginatedDocs>(`${BASE}?${buildQ(filters)}`),

  get: (id: number) => req<ArchiveDocument>(`${BASE}/${id}`),

  upload: (files: File[], meta: {
    category?: string; module?: string; asset_id?: number
    purchase_id?: number; sale_id?: number; expire_date?: string
    description?: string; relation_type?: string; relation_id?: number; relation_name?: string
  }) => {
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    Object.entries(meta).forEach(([k, v]) => { if (v !== undefined) fd.append(k, String(v)) })
    return req<ArchiveDocument[]>(BASE, { method: 'POST', body: fd })
  },

  createMissing: (data: { title: string; category?: string; description?: string; asset_id?: number; expire_date?: string }) =>
    req<ArchiveDocument>(`${BASE}/missing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  update: (id: number, data: Partial<Pick<ArchiveDocument, 'title' | 'category' | 'description' | 'expire_date' | 'status' | 'keywords' | 'summary'>>) =>
    req<ArchiveDocument>(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  delete: (id: number) => req<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  downloadUrl: (id: number) => `${BASE}/${id}/download`,
  previewUrl: (id: number) => `${BASE}/${id}/preview`,
  ocrExtract: (id: number) => req<OcrExtractResult>(`${BASE}/${id}/ocr-extract`),

  addVersion: (id: number, file: File, note?: string) => {
    const fd = new FormData()
    fd.append('file', file)
    if (note) fd.append('upload_note', note)
    return req<ArchiveDocument>(`${BASE}/${id}/versions`, { method: 'POST', body: fd })
  },
}
