export type DocType =
  | 'arac_ruhsati'
  | 'arac_faturasi'
  | 'noter_satis'
  | 'eksper_raporu'
  | 'kasko'
  | 'trafik_sigortasi'
  | 'servis_faturasi'
  | 'tapu'
  | 'kira_kontrati'
  | 'is_makinesi_ruhsati'
  | 'diger'

export interface DocumentIntelligence {
  id: number
  document_id: number
  ocr_text: string | null
  extracted_fields: Record<string, string>
  document_type: DocType
  confidence_score: number
  summary: string | null
  auto_link_asset_id: number | null
  link_suggestions: AssetSuggestion[]
  is_duplicate: 0 | 1
  duplicate_of_id: number | null
  ocr_provider: string
  pipeline_steps: PipelineStep[]
  processed_at: string | null
  created_at: string
  updated_at: string
}

export interface PipelineStep {
  step: string
  [key: string]: unknown
}

export interface AssetSuggestion {
  asset_id: number
  asset_name: string
  asset_type: string
  score: number
  reason: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  score: number
}

export interface ProcessResult {
  document_id: number
  document_type: DocType
  confidence: number
  is_duplicate: boolean
  duplicate_of_id: number | null
  asset_match: {
    asset_id: number | null
    asset_name: string | null
    confidence: number
    suggestions: AssetSuggestion[]
  }
  fields: Record<string, string>
  summary: string
  validation: ValidationResult
  pipeline_steps: PipelineStep[]
  ocr_provider: string
  processed_at: string
}

export interface DocumentHealth {
  total_documents: number
  analyzed_documents: number
  unanalyzed: number
  expired_documents: number
  expiring_soon: number
  duplicate_documents: number
  low_confidence: number
  health_score: number
}

export interface AssetDocHealth {
  id: number
  name: string
  type: string
  doc_count: number
  confident_docs: number
  expired_docs: number
  duplicate_docs: number
  avg_confidence: number | null
  health_status: 'good' | 'warning' | 'critical' | 'missing'
}

export interface ExpiringDocument {
  id: number
  title: string
  expire_date: string
  asset_id: number | null
  asset_name: string | null
  asset_type: string | null
  document_type: DocType | null
  confidence_score: number | null
  days_left: number
  status: 'expiring' | 'expired'
}

export interface MissingDocument {
  id: number
  name: string
  type: string
  doc_count: number
}

export interface DocIntelStats {
  by_type: Array<{ document_type: DocType; count: number; avg_confidence: number }>
  by_provider: Array<{ ocr_provider: string; count: number; avg_confidence: number }>
  recent_processed: Array<{ document_id: number; document_type: DocType; confidence_score: number; processed_at: string; title: string }>
}
