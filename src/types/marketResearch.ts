export type ResearchCategory =
  | 'arac' | 'gayrimenkul' | 'motosiklet' | 'tekne' | 'karavan' | 'is_makinesi' | 'other'

export const RESEARCH_CATEGORY_LABELS: Record<ResearchCategory, string> = {
  arac: 'Araç',
  gayrimenkul: 'Gayrimenkul',
  motosiklet: 'Motosiklet',
  tekne: 'Tekne',
  karavan: 'Karavan',
  is_makinesi: 'İş Makinesi',
  other: 'Diğer',
}

export const RESEARCH_CATEGORIES: { value: ResearchCategory; label: string }[] = [
  { value: 'arac', label: 'Araç' },
  { value: 'gayrimenkul', label: 'Gayrimenkul' },
  { value: 'motosiklet', label: 'Motosiklet' },
  { value: 'tekne', label: 'Tekne' },
  { value: 'karavan', label: 'Karavan' },
  { value: 'is_makinesi', label: 'İş Makinesi' },
  { value: 'other', label: 'Diğer' },
]

export const PLATFORMS = ['Sahibinden', 'Arabam', 'Araba.com', 'Emlakjet', 'Hürriyet Emlak', 'Letgo', 'Instagram', 'Referans', 'Diğer']

export type OpportunityRating = 'firsat' | 'iyi' | 'normal' | 'riskli' | 'pahali'

export const OPPORTUNITY_LABELS: Record<OpportunityRating, string> = {
  firsat: 'Fırsat',
  iyi: 'İyi',
  normal: 'Normal',
  riskli: 'Riskli',
  pahali: 'Pahalı',
}

export const OPPORTUNITY_COLORS: Record<OpportunityRating, string> = {
  firsat: 'text-emerald-500',
  iyi: 'text-green-400',
  normal: 'text-amber-500',
  riskli: 'text-orange-500',
  pahali: 'text-red-500',
}

export interface MarketListing {
  id: number
  research_id: number
  title: string
  url: string | null
  platform: string | null
  price: number
  currency: string
  listing_date: string | null
  km: number | null
  description: string | null
  seller: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PriceStats {
  min: number
  max: number
  avg: number
  median: number
  range: number
  count: number
}

export interface OpportunityScore {
  score: number
  rating: OpportunityRating
  stars: number
}

export interface MarketResearch {
  id: number
  title: string
  category: ResearchCategory
  brand: string | null
  model: string | null
  version: string | null
  year_from: number | null
  year_to: number | null
  km_from: number | null
  km_to: number | null
  fuel_type: string | null
  transmission: string | null
  property_type: string | null
  room_count: string | null
  area_from: number | null
  area_to: number | null
  length_from: number | null
  length_to: number | null
  province: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined fields
  listing_count?: number
  avg_price?: number | null
  min_price?: number | null
  max_price?: number | null
}

export interface MarketResearchDetail extends MarketResearch {
  listings: MarketListing[]
  stats: PriceStats
  opportunity: OpportunityScore
}

export interface ResearchSelectorItem {
  id: number
  title: string
  category: ResearchCategory
  brand: string | null
  model: string | null
  avg_price: number | null
  listing_count: number
}

export interface CreateResearchPayload {
  title: string
  category: ResearchCategory
  brand?: string
  model?: string
  version?: string
  year_from?: number
  year_to?: number
  km_from?: number
  km_to?: number
  fuel_type?: string
  transmission?: string
  property_type?: string
  room_count?: string
  area_from?: number
  area_to?: number
  length_from?: number
  length_to?: number
  province?: string
  notes?: string
}

export interface CreateListingPayload {
  title: string
  url?: string
  platform?: string
  price: number
  currency?: string
  listing_date?: string
  km?: number
  description?: string
  seller?: string
  notes?: string
}
