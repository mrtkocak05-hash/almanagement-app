import type {
  MarketResearch, MarketResearchDetail, MarketListing,
  PriceStats, OpportunityScore, ResearchSelectorItem,
  CreateResearchPayload, CreateListingPayload,
} from '@/types/marketResearch'
import { useAuthStore } from '@/store/authStore'

const BASE = '/api/market-research'

interface ApiResponse<T> { success: boolean; data: T; message?: string; total?: number }

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options?.headers as Record<string, string> ?? {}),
    },
  })
  const json = await res.json() as ApiResponse<T>
  if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`)
  return json.data
}

export const marketResearchApi = {
  // Research CRUD
  list: (params?: { search?: string; category?: string; page?: number }) => {
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.category) q.set('category', params.category)
    if (params?.page) q.set('page', String(params.page))
    const qs = q.toString()
    return fetch(`${BASE}${qs ? '?' + qs : ''}`, { headers: authHeaders() }).then(r => r.json()) as Promise<{ success: boolean; data: MarketResearch[]; total: number }>
  },

  get: (id: number) => req<MarketResearchDetail>(`${BASE}/${id}`),

  create: (payload: CreateResearchPayload) => req<MarketResearch>(`${BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),

  update: (id: number, payload: Partial<CreateResearchPayload> & { status?: string }) => req<MarketResearch>(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),

  delete: (id: number) => req<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  // Listing CRUD
  createListing: (researchId: number, payload: CreateListingPayload) => req<MarketListing>(`${BASE}/${researchId}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),

  updateListing: (researchId: number, listingId: number, payload: Partial<CreateListingPayload>) => req<MarketListing>(`${BASE}/${researchId}/listings/${listingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),

  deleteListing: (researchId: number, listingId: number) => req<void>(`${BASE}/${researchId}/listings/${listingId}`, { method: 'DELETE' }),

  // Opportunity
  opportunity: (id: number) => req<{ stats: PriceStats; opportunity: OpportunityScore }>(`${BASE}/${id}/opportunity`),

  // Dashboard + selector
  todayOpportunities: () => req<MarketResearch[]>(`${BASE}/today-opportunities`),
  selector: (category?: string) => {
    const q = category ? `?category=${category}` : ''
    return req<ResearchSelectorItem[]>(`${BASE}/selector${q}`)
  },
}
