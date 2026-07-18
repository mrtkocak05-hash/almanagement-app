export type SearchResultType = 'asset' | 'purchase' | 'sale' | 'expense' | 'document'

export interface SearchResult {
  type: SearchResultType
  id: number
  title: string
  subtitle?: string
  meta?: string
  url: string
}

const TYPE_ROUTES: Record<SearchResultType, string> = {
  asset: '/varliklar',
  purchase: '/satinalma',
  sale: '/satislar',
  expense: '/masraflar',
  document: '/dokumanlar',
}

export function getResultUrl(r: SearchResult): string {
  return `${TYPE_ROUTES[r.type]}/${r.id}`
}

export const globalSearchApi = {
  search: async (query: string): Promise<SearchResult[]> => {
    if (!query || query.trim().length < 2) return []
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
      if (!res.ok) return []
      const json = await res.json() as { success: boolean; data: SearchResult[] }
      return json.data ?? []
    } catch {
      return []
    }
  },
}
