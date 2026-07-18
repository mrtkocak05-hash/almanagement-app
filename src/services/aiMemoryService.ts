import type { AIMemoryEntry } from '@/types/aiDashboard'
import { useAuthStore } from '@/store/authStore'

const STORAGE_KEY = 'alm_ai_memory'
const MAX_ENTRIES = 50

// ── AI Memory Provider Interface (Claude / ChatGPT / Gemini ready) ────────────
export interface AIMemoryProvider {
  name: string
  store(entry: AIMemoryEntry): Promise<void>
  recall(query: string, limit?: number): Promise<AIMemoryEntry[]>
  summarize(): Promise<string>
}

function loadEntries(): AIMemoryEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

// Local (localStorage) implementation
const localMemory: AIMemoryProvider = {
  name: 'local',

  async store(entry: AIMemoryEntry) {
    const entries = loadEntries()
    entries.unshift(entry)
    if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch (_) {}
  },

  async recall(_query: string, limit = 10) {
    return loadEntries().slice(0, limit)
  },

  async summarize() {
    const entries = loadEntries()
    if (!entries.length) return 'Henüz hafıza kaydı yok.'
    const recent = entries.slice(0, 5)
    return `Son ${recent.length} analiz: ${recent.map((e: AIMemoryEntry) => e.summary).join(' | ')}`
  },
}

// Provider registry — Claude / ChatGPT / Gemini bağlantısı buraya
const providers: Record<string, AIMemoryProvider> = {
  local: localMemory,
  // 'claude': claudeMemoryProvider,   // TODO
  // 'chatgpt': chatGptMemoryProvider, // TODO
  // 'gemini': geminiMemoryProvider,   // TODO
}

export function getMemoryProvider(name = 'local'): AIMemoryProvider {
  return providers[name] ?? localMemory
}

// Convenience singleton
export const aiMemory = {
  record(type: AIMemoryEntry['type'], summary: string, data: Record<string, unknown> = {}, module = 'dashboard') {
    const entry: AIMemoryEntry = {
      id: `mem_${type}_${module}`,
      timestamp: new Date().toISOString(),
      type,
      summary,
      data,
    }
    getMemoryProvider().store(entry).catch(() => {})
    // Also persist to backend (non-blocking)
    try {
      const token = useAuthStore.getState().accessToken
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      fetch('/api/ai-memory', {
        method: 'POST',
        headers,
        body: JSON.stringify({ type, module, summary, data_json: data }),
      }).catch(() => {})
    } catch { /* ignore */ }
  },

  getRecent(limit = 10) {
    return getMemoryProvider().recall('', limit)
  },

  getSummary() {
    return getMemoryProvider().summarize()
  },
}
