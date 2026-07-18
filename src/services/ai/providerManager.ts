import type { ProviderHealth, AIProviderStatusMap, AIProviderName } from './types'
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

export const providerManager = {
  getHealth(): Promise<ProviderHealth> {
    return get<ProviderHealth>('/api/ai/provider/health')
  },

  getProviderStatus(): Promise<AIProviderStatusMap> {
    return get<AIProviderStatusMap>('/api/ai/provider-status')
  },
}

export const PROVIDER_META: Record<AIProviderName, { label: string; color: string; icon: string }> = {
  claude:      { label: 'Claude',       color: '#D97706', icon: '🧠' },
  openai:      { label: 'GPT-4o',       color: '#16A34A', icon: '🤖' },
  gemini:      { label: 'Gemini',       color: '#2563EB', icon: '💎' },
  rule_engine: { label: 'Yerel Motor',  color: '#6B7280', icon: '⚙️' },
}

export function getProviderMeta(provider: string) {
  return PROVIDER_META[provider as AIProviderName] ?? { label: provider, color: '#6B7280', icon: '❓' }
}

export function isRealProvider(provider: string): boolean {
  return ['claude', 'openai', 'gemini'].includes(provider)
}
