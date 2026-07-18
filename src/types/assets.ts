export type AssetType =
  | 'vehicle' | 'real_estate' | 'boat' | 'motorcycle'
  | 'caravan' | 'construction_equipment' | 'investment' | 'cash' | 'other'

export type AssetStatus = 'active' | 'sold' | 'passive'

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  vehicle: 'Araç',
  real_estate: 'Gayrimenkul',
  boat: 'Tekne',
  motorcycle: 'Motosiklet',
  caravan: 'Karavan',
  construction_equipment: 'İş Makinesi',
  investment: 'Yatırım',
  cash: 'Nakit',
  other: 'Diğer',
}

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  active: 'Aktif',
  sold: 'Satıldı',
  passive: 'Pasif',
}

export interface AssetPhoto {
  id: number
  asset_id: number
  filename: string
  path: string
  is_main: number
  created_at: string
  deleted_at: string | null
}

export interface AssetPartner {
  id: number
  asset_id: number
  name: string
  share_percent: number
  share_amount: number | null
  phone: string | null
  notes: string | null
  created_at: string
  deleted_at: string | null
}

export interface AssetDocument {
  id: number
  asset_id: number
  type: string
  title: string
  filename: string
  path: string
  created_at: string
  deleted_at: string | null
}

export interface Asset {
  id: number
  name: string
  type: AssetType
  category: string | null
  status: AssetStatus
  // Financials
  purchase_price: number | null
  purchase_currency: string
  current_value: number | null
  purchase_date: string | null
  share_percent: number
  // Vehicle / motorcycle / caravan
  brand: string | null
  model: string | null
  year: number | null
  km: number | null
  fuel_type: string | null
  transmission: string | null
  damage_status: string | null
  plate: string | null
  vin: string | null
  engine_number: string | null
  engine_size: string | null
  color: string | null
  // Real estate
  property_type: string | null
  gross_area: number | null
  net_area: number | null
  room_count: string | null
  building_age: number | null
  floor_number: string | null
  location_address: string | null
  // Boat
  length_m: number | null
  engine_power: string | null
  hull_type: string | null
  engine_type_boat: string | null
  boat_reg_number: string | null
  // Construction
  equipment_type: string | null
  engine_hours: number | null
  serial_number: string | null
  // Investment
  investment_type: string | null
  institution: string | null
  units: number | null
  unit_price: number | null
  // Cash
  bank_wallet: string | null
  // Generic
  description: string | null
  main_photo: string | null
  partner_count: number
  // Metadata
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AssetDetail extends Asset {
  photos: AssetPhoto[]
  partners: AssetPartner[]
  documents: AssetDocument[]
  activities: unknown[]
}

export interface AssetListResponse {
  items: Asset[]
  total: number
  page: number
  limit: number
  total_pages: number
  summary: {
    total_count: number
    total_value: number
    total_share_value: number
  }
}

export interface AssetFormData {
  name: string
  type: AssetType
  category?: string
  status: AssetStatus
  purchase_price?: number
  purchase_currency: string
  current_value?: number
  purchase_date?: string
  share_percent: number
  brand?: string
  model?: string
  package_name?: string
  year?: number
  km?: number
  fuel_type?: string
  transmission?: string
  damage_status?: string
  plate?: string
  vin?: string
  engine_number?: string
  engine_size?: string
  color?: string
  property_type?: string
  gross_area?: number
  net_area?: number
  room_count?: string
  building_age?: number
  floor_number?: string
  location_address?: string
  length_m?: number
  engine_power?: string
  hull_type?: string
  engine_type_boat?: string
  boat_reg_number?: string
  equipment_type?: string
  engine_hours?: number
  serial_number?: string
  investment_type?: string
  institution?: string
  units?: number
  unit_price?: number
  bank_wallet?: string
  description?: string
  partners?: PartnerFormData[]
}

export interface PartnerFormData {
  name: string
  share_percent: number
  phone?: string
  notes?: string
}

export interface AssetFilters {
  search?: string
  type?: AssetType | ''
  status?: AssetStatus | ''
  category?: string
  page?: number
  limit?: number
}
