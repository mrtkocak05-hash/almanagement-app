import type { AIRequest, AIResponse, AISettings, AIProviderStatusMap, CostSummary, AILog } from './types'
import type { AIMessage } from './types'
import { useAuthStore } from '@/store/authStore'

const BASE = '/api/ai'

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = useAuthStore.getState().accessToken
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'AI service error')
  return json.data as T
}

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), { headers: getAuthHeaders() })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'AI service error')
  return json.data as T
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'AI service error')
  return json.data as T
}

// ── Core AI calls ─────────────────────────────────────────────────────────────

export function chat(messages: AIMessage[], context?: Record<string, unknown>): Promise<AIResponse> {
  const req: AIRequest = { messages, action: 'chat', context }
  return post<AIResponse>('/chat', req)
}

export function ask(question: string, context?: Record<string, unknown>): Promise<AIResponse> {
  return post<AIResponse>('/chat', {
    messages: [{ role: 'user', content: question }],
    action: 'chat',
    context,
  })
}

export function analyze(content: string, instruction?: string): Promise<AIResponse> {
  const userMsg = instruction ? `${instruction}\n\n${content}` : `Şunu analiz et:\n\n${content}`
  return post<AIResponse>('/analyze', {
    messages: [{ role: 'user', content: userMsg }],
    action: 'analyze',
  })
}

export function summarize(content: string): Promise<AIResponse> {
  return post<AIResponse>('/chat', {
    messages: [{ role: 'user', content: `Şunu kısaca özetle:\n\n${content}` }],
    action: 'summarize',
  })
}

export function forecast(context: Record<string, unknown>): Promise<AIResponse> {
  return post<AIResponse>('/chat', {
    messages: [{ role: 'user', content: 'Mevcut verilere göre 30 günlük finansal tahmin yap.' }],
    action: 'forecast',
    context,
  })
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function getSettings(): Promise<AISettings> {
  return get<AISettings>('/settings')
}

export function updateSettings(settings: Partial<AISettings>): Promise<void> {
  return put<void>('/settings', settings)
}

export function getProviderStatus(): Promise<AIProviderStatusMap> {
  return get<AIProviderStatusMap>('/provider-status')
}

// ── Logs & Costs ──────────────────────────────────────────────────────────────

export function getLogs(params?: { provider?: string; limit?: number; offset?: number }): Promise<{ logs: AILog[]; total: number }> {
  return get<{ logs: AILog[]; total: number }>('/logs', params as Record<string, string | number>)
}

export function getCosts(): Promise<CostSummary> {
  return get<CostSummary>('/costs')
}
