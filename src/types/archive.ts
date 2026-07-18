export type DocStatus = 'uploaded' | 'missing' | 'pending_review' | 'archived'
export type ExpireStatus = 'expired' | 'expiring_soon' | 'valid' | null
export type DocModule = 'asset' | 'purchase' | 'sale' | 'expense' | 'financial' | 'archive'
export type OcrStatus = 'pending' | 'processing' | 'completed' | null

export const OCR_STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor', processing: 'İşleniyor', completed: 'Tamamlandı',
}

export const OCR_STATUS_COLORS: Record<string, string> = {
  pending: 'text-zinc-400 bg-zinc-400/10',
  processing: 'text-amber-400 bg-amber-400/10',
  completed: 'text-green-400 bg-green-400/10',
}

export interface OcrExtractResult {
  document_id: number
  ocr_status: OcrStatus
  confidence: number
  extracted: Record<string, string>
  note: string
}

export const DOC_CATEGORIES = [
  'Alım Sözleşmesi', 'Satım Sözleşmesi', 'Fatura', 'Fiş', 'Ekspertiz Raporu',
  'Sigorta', 'Kasko', 'Ruhsat', 'Ehliyet', 'Tapu', 'Kimlik', 'Vekaletname',
  'Garanti', 'Bakım', 'Servis', 'Banka Belgesi', 'Kredi Belgesi',
  'Vergi Belgesi', 'Fotoğraf', 'Video', 'Diğer',
] as const

export const MODULE_LABELS: Record<DocModule, string> = {
  asset: 'Varlık', purchase: 'Alım', sale: 'Satış',
  expense: 'Gider', financial: 'Finans', archive: 'Arşiv',
}

export const STATUS_LABELS: Record<DocStatus, string> = {
  uploaded: 'Yüklendi', missing: 'Eksik', pending_review: 'İnceleme Bekliyor', archived: 'Arşivlendi',
}

export const STATUS_COLORS: Record<DocStatus, string> = {
  uploaded: 'bg-green-500/15 text-green-400',
  missing: 'bg-red-500/15 text-red-400',
  pending_review: 'bg-yellow-500/15 text-yellow-400',
  archived: 'bg-zinc-500/15 text-zinc-400',
}

export const EXPIRE_COLORS: Record<string, string> = {
  expired: 'text-red-400',
  expiring_soon: 'text-yellow-400',
  valid: 'text-green-400',
}

export const EXPIRE_LABELS: Record<string, string> = {
  expired: 'Süresi Doldu',
  expiring_soon: 'Yakında Sona Erecek',
  valid: 'Geçerli',
}

export interface ArchiveDocument {
  id: number
  title: string
  filename: string
  path: string
  type: string | null
  module: DocModule
  description: string | null
  category: string
  expire_date: string | null
  expire_status?: ExpireStatus
  status: DocStatus
  file_size: number | null
  mime_type: string | null
  original_name: string | null
  current_version: number
  importance_score: number | null
  verification_status: string | null
  ocr_status: string | null
  summary: string | null
  keywords: string | null
  // legacy FK
  asset_id: number | null
  purchase_id: number | null
  sale_id: number | null
  // joined
  asset_ref?: string | null
  asset_type?: string | null
  purchase_no?: string | null
  purchase_asset?: string | null
  sale_no?: string | null
  sale_asset?: string | null
  // relations/versions (from detail endpoint)
  relations?: DocRelation[]
  versions?: DocVersion[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DocRelation {
  id: number
  document_id: number
  relation_type: string
  relation_id: number | null
  relation_name: string | null
  created_at: string
}

export interface DocVersion {
  id: number
  document_id: number
  version_number: number
  filename: string
  path: string
  original_name: string | null
  file_size: number | null
  mime_type: string | null
  upload_note: string | null
  created_at: string
}

export interface ArchiveSummary {
  total: number
  missing: number
  pending: number
  expired: number
  expiring_soon: number
  recent: ArchiveDocument[]
  expiring_list: ArchiveDocument[]
}

export interface ArchiveContext {
  assets: Array<{ id: number; name: string; type: string }>
  purchases: Array<{ id: number; purchase_no: string; asset_name: string }>
  sales: Array<{ id: number; sale_no: string; asset_name: string }>
  expenses: Array<{ id: number; expense_no: string; description: string }>
}

export interface ArchiveReports {
  by_category: Array<{ category: string; cnt: number }>
  by_module: Array<{ module: string; cnt: number }>
  by_status: Array<{ status: string; cnt: number }>
  missing: ArchiveDocument[]
  expired: ArchiveDocument[]
  upload_timeline: Array<{ month: string; cnt: number }>
  by_asset: Array<{ asset_id: number; asset_name: string; cnt: number }>
}

export interface DocFilters {
  search?: string
  category?: string
  module?: string
  status?: string
  expire_status?: string
  date_from?: string
  date_to?: string
}

export interface PaginatedDocs {
  items: ArchiveDocument[]
  total: number
  page: number
  total_pages: number
}

// File type → icon name mapping
export type FileIconType = 'pdf' | 'image' | 'excel' | 'word' | 'video' | 'zip' | 'file'

export function getFileIconType(mimeType: string | null | undefined): FileIconType {
  if (!mimeType) return 'file'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'excel'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'word'
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) return 'zip'
  return 'file'
}

export function getRelatedLabel(doc: ArchiveDocument): string | null {
  if (doc.asset_ref) return `Varlık: ${doc.asset_ref}`
  if (doc.purchase_no) return `Alım: ${doc.purchase_no}`
  if (doc.sale_no) return `Satış: ${doc.sale_no}`
  return null
}
