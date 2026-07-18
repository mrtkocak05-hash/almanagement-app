export type UserRole = 'ceo' | 'yonetici' | 'muhasebe' | 'finans' | 'satinalma' | 'satis' | 'operasyon' | 'misafir'

export interface AuthUser {
  id: number
  full_name: string
  email: string
  phone: string | null
  avatar: string | null
  role: UserRole
  role_label: string
  company_id: number | null
  status: string
  last_login: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
  remember_me?: boolean
}

export const ROLE_MENU: Record<UserRole, string[]> = {
  ceo: ['*'],
  yonetici: ['*'],
  muhasebe: ['dashboard', 'varliklar', 'operasyon/finans', 'operasyon/masraflar', 'raporlar', 'ayarlar'],
  finans: ['dashboard', 'varliklar', 'operasyon/finans', 'operasyon/masraflar', 'raporlar'],
  satinalma: ['dashboard', 'varliklar', 'operasyon/satinalma', 'operasyon/piyasa-arastirma'],
  satis: ['dashboard', 'varliklar', 'operasyon/satislar', 'operasyon/musteriler'],
  operasyon: ['dashboard', 'varliklar', 'operasyon/satinalma', 'operasyon/satislar', 'operasyon/masraflar', 'operasyon/dokumanlar'],
  misafir: ['dashboard'],
}

export const MODULE_PERMISSIONS = {
  dashboard: { read: true, write: false, update: false, delete: false, export: false, ai: false },
  varliklar: { read: true, write: true, update: true, delete: true, export: true, ai: true },
  satinalma: { read: true, write: true, update: true, delete: true, export: true, ai: true },
  satislar: { read: true, write: true, update: true, delete: true, export: true, ai: true },
  finans: { read: true, write: true, update: true, delete: true, export: true, ai: false },
  masraflar: { read: true, write: true, update: true, delete: true, export: true, ai: false },
  dokumanlar: { read: true, write: true, update: true, delete: true, export: true, ai: false },
  musteriler: { read: true, write: true, update: true, delete: true, export: true, ai: false },
}
