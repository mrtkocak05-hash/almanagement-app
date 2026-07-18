import type { AIMemoryEntry } from '@/types/aiDashboard'
import { useAuthStore } from '@/store/authStore'

export interface AIMemoryV3Entry extends AIMemoryEntry {
  tags?: string[]
  relevanceScore?: number
  module?: string
}

const STORAGE_KEY = 'alm_ai_memory_v3'
const MAX_ENTRIES = 100

function loadAll(): AIMemoryV3Entry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function saveAll(entries: AIMemoryV3Entry[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* storage full */ }
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter(t => t.length > 2)
}

function relevance(entry: AIMemoryV3Entry, queryTokens: string[]): number {
  if (!queryTokens.length) return entry.relevanceScore ?? 1
  const target = `${entry.summary} ${(entry.tags ?? []).join(' ')}`.toLowerCase()
  const hits = queryTokens.filter(t => target.includes(t)).length
  return (hits / queryTokens.length) * (entry.relevanceScore ?? 1)
}

export const aiMemoryV3 = {
  store(entry: AIMemoryV3Entry): void {
    const all = loadAll()
    const existing = all.findIndex(e => e.id === entry.id)
    if (existing >= 0) {
      all[existing] = { ...all[existing], ...entry, timestamp: new Date().toISOString() }
    } else {
      all.unshift(entry)
      if (all.length > MAX_ENTRIES) all.splice(MAX_ENTRIES)
    }
    saveAll(all)
    // Sync to backend non-blocking
    syncToBackend(entry)
  },

  recall(query: string, limit = 10): AIMemoryV3Entry[] {
    const all = loadAll()
    const tokens = tokenize(query)
    if (!tokens.length) return all.slice(0, limit)
    return all
      .map(e => ({ entry: e, score: relevance(e, tokens) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.entry)
  },

  recallByModule(module: string, limit = 5): AIMemoryV3Entry[] {
    return loadAll().filter(e => e.module === module).slice(0, limit)
  },

  recallByTag(tag: string, limit = 10): AIMemoryV3Entry[] {
    return loadAll().filter(e => (e.tags ?? []).includes(tag)).slice(0, limit)
  },

  summarize(limit = 5): string {
    const recent = loadAll().slice(0, limit)
    if (!recent.length) return 'Henüz hafıza kaydı yok.'
    return `Son ${recent.length} analiz: ${recent.map(e => e.summary).join(' | ')}`
  },

  clear(): void {
    saveAll([])
  },

  getAll(): AIMemoryV3Entry[] {
    return loadAll()
  },

  record(
    type: AIMemoryEntry['type'],
    summary: string,
    data: Record<string, unknown> = {},
    module = 'dashboard',
    tags: string[] = [],
  ): void {
    this.store({
      id: `mem_v3_${type}_${module}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      summary,
      data,
      module,
      tags,
      relevanceScore: 1.0,
    })
  },
}

function syncToBackend(entry: AIMemoryV3Entry): void {
  try {
    const token = useAuthStore.getState().accessToken
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    fetch('/api/ai-memory', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: entry.type,
        module: entry.module ?? 'dashboard',
        summary: entry.summary,
        data_json: entry.data,
        tags: (entry.tags ?? []).join(','),
        relevance_score: entry.relevanceScore ?? 1.0,
      }),
    }).catch(() => {})
  } catch { /* ignore */ }
}
