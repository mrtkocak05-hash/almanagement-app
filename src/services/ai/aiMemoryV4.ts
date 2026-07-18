import type { AIMemoryV4 } from './types'
import { useAuthStore } from '@/store/authStore'

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = useAuthStore.getState().accessToken
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: getAuthHeaders() })
  const body = await res.json() as { success: boolean; data: T; message?: string }
  if (!body.success) throw new Error(body.message ?? 'Hata')
  return body.data
}

async function post<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  const body = await res.json() as { success: boolean; data: T; message?: string }
  if (!body.success) throw new Error(body.message ?? 'Hata')
  return body.data
}

async function put<T>(path: string, data?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: data !== undefined ? JSON.stringify(data) : undefined,
  })
  const body = await res.json() as { success: boolean; data: T; message?: string }
  if (!body.success) throw new Error(body.message ?? 'Hata')
  return body.data
}

export interface SaveMemoryInput {
  type?: string
  title?: string
  content?: string
  summary?: string
  tags?: string[] | string
  importance?: number
  source_module?: string
  data_json?: unknown
}

export const aiMemoryV4 = {
  getRecent(params?: { limit?: number; type?: string; source_module?: string }): Promise<AIMemoryV4[]> {
    const q = new URLSearchParams()
    if (params?.limit)         q.set('limit', String(params.limit))
    if (params?.type)          q.set('type', params.type)
    if (params?.source_module) q.set('source_module', params.source_module)
    return get<AIMemoryV4[]>(`/api/ai/memories?${q}`)
  },

  getTop(limit = 10): Promise<AIMemoryV4[]> {
    return get<AIMemoryV4[]>(`/api/ai/memories/top?limit=${limit}`)
  },

  save(input: SaveMemoryInput): Promise<{ id: number }> {
    return post<{ id: number }>('/api/ai/memories', input)
  },

  search(params: { query: string; type?: string; source_module?: string; limit?: number }): Promise<AIMemoryV4[]> {
    return post<AIMemoryV4[]>('/api/ai/memories/search', params)
  },

  findRelated(memoryId: number, limit = 5): Promise<AIMemoryV4[]> {
    return post<AIMemoryV4[]>('/api/ai/memories/related', { memoryId, limit })
  },

  updateImportance(id: number, importance: number): Promise<null> {
    return put<null>(`/api/ai/memories/${id}/importance`, { importance })
  },

  archive(id: number): Promise<null> {
    return put<null>(`/api/ai/memories/${id}/archive`)
  },

  // Quick record helper — non-blocking
  record(summary: string, data?: unknown, options?: { type?: string; tags?: string[]; source_module?: string; importance?: number }): void {
    this.save({
      summary,
      data_json: data,
      type: options?.type ?? 'analysis',
      tags: options?.tags,
      source_module: options?.source_module ?? 'chat',
      importance: options?.importance ?? 5,
    }).catch(() => {})
  },
}
