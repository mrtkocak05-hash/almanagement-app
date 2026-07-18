export type PartStatus =
  | 'orijinal' | 'boyali' | 'lokal_boyali' | 'degisen'
  | 'sok_tak' | 'islemli' | 'hasarli' | 'catlak' | 'gocuk'

export type TireStatus = 'iyi' | 'orta' | 'kotu' | 'degistir'
export type BatteryTestResult = 'iyi' | 'zayif' | 'degistir'

export type MaintenanceType =
  | 'periyodik' | 'yag' | 'filtre' | 'triger' | 'fren' | 'sanziman'

export interface VehiclePart {
  id: number
  vehicle_intelligence_id: number
  part_key: string
  status: PartStatus
  notes: string | null
}

export interface VehiclePartPhoto {
  id: number
  vehicle_intelligence_id: number
  part_key: string
  file_path: string
  original_name: string | null
  created_at?: string
}

export interface VehicleTire {
  id: number
  vehicle_intelligence_id: number
  position: 'on_sol' | 'on_sag' | 'arka_sol' | 'arka_sag'
  brand: string | null
  model: string | null
  size: string | null
  dot: string | null
  tread_depth: number | null
  status: TireStatus
}

export interface VehicleBattery {
  id: number
  vehicle_intelligence_id: number
  brand: string | null
  ampere: number | null
  install_date: string | null
  test_result: BatteryTestResult
}

export interface VehicleMaintenanceRecord {
  id: number
  vehicle_intelligence_id: number
  type: MaintenanceType
  date: string | null
  km: number | null
  notes: string | null
  next_date: string | null
  next_km: number | null
}

export interface VehicleScore {
  aiScore: number
  kaporta: number
  mekanik: number
  elektrik: number
  icMekan: number
  lastik: number
  bakim: number
  belge: number
  analysis: string
}

export interface VehicleIntelligence {
  id: number
  asset_id: number
  expert_firm: string | null
  expert_date: string | null
  expert_no: string | null
  expert_note: string | null
  expert_score: number | null
  expert_pdf_path: string | null
  ai_score: number | null
  ai_analysis: string | null
  score_kaporta: number | null
  score_mekanik: number | null
  score_elektrik: number | null
  score_ic_mekan: number | null
  score_lastik: number | null
  score_bakim: number | null
  score_belge: number | null
  created_at: string
  updated_at: string
}

export interface VehicleFullData extends VehicleIntelligence {
  parts: VehiclePart[]
  tires: VehicleTire[]
  battery: VehicleBattery | null
  maintenance: VehicleMaintenanceRecord[]
  photos: VehiclePartPhoto[]
}

export interface VehicleDashboardStats {
  total: number
  scored: number
  avg_score: number | null
  expert_pending: number
  missing_photos: number
  missing_maintenance: number
}

export const PART_LABELS: Record<string, string> = {
  on_tampon:         'Ön Tampon',
  arka_tampon:       'Arka Tampon',
  kaput:             'Kaput',
  tavan:             'Tavan',
  bagaj:             'Bagaj',
  sag_on_camurluk:   'Sağ Ön Çamurluk',
  sag_arka_camurluk: 'Sağ Arka Çamurluk',
  sol_on_camurluk:   'Sol Ön Çamurluk',
  sol_arka_camurluk: 'Sol Arka Çamurluk',
  sag_on_kapi:       'Sağ Ön Kapı',
  sag_arka_kapi:     'Sağ Arka Kapı',
  sol_on_kapi:       'Sol Ön Kapı',
  sol_arka_kapi:     'Sol Arka Kapı',
  sag_ayna:          'Sağ Ayna',
  sol_ayna:          'Sol Ayna',
  farlar:            'Farlar',
  stoplar:           'Stoplar',
  jantlar:           'Jantlar',
  camlar:            'Camlar',
}

export const STATUS_LABELS: Record<PartStatus, string> = {
  orijinal:     'Orijinal',
  boyali:       'Boyalı',
  lokal_boyali: 'Lokal Boyalı',
  degisen:      'Değişen',
  sok_tak:      'Sök-Tak',
  islemli:      'İşlemli',
  hasarli:      'Hasarlı',
  catlak:       'Çatlak',
  gocuk:        'Göçük',
}

export const STATUS_COLORS: Record<PartStatus, string> = {
  orijinal:     '#10B981',
  boyali:       '#F59E0B',
  lokal_boyali: '#FCD34D',
  degisen:      '#F97316',
  sok_tak:      '#FB923C',
  islemli:      '#A855F7',
  hasarli:      '#EF4444',
  catlak:       '#DC2626',
  gocuk:        '#B91C1C',
}

export const ALL_STATUSES: PartStatus[] = [
  'orijinal', 'boyali', 'lokal_boyali', 'degisen',
  'sok_tak', 'islemli', 'hasarli', 'catlak', 'gocuk',
]

export const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
  periyodik: 'Periyodik Bakım',
  yag:       'Yağ Değişimi',
  filtre:    'Filtre Değişimi',
  triger:    'Triger',
  fren:      'Fren',
  sanziman:  'Şanzıman',
}

export const VEHICLE_TYPES = ['arac', 'motosiklet', 'karavan', 'is_makinesi'] as const
