export type AIProviderName = 'claude' | 'openai' | 'gemini' | 'rule_engine'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIRequest {
  messages: AIMessage[]
  action?: 'chat' | 'analyze' | 'summarize' | 'extract' | 'forecast' | 'decision' | 'investment' | 'portfolio' | 'expense' | 'sale' | 'recommend' | 'compare'
  context?: Record<string, unknown>
}

export interface AIResponse {
  content: string
  provider: AIProviderName
  model: string
  inputTokens: number
  outputTokens: number
  durationMs: number
  costUsd: number
}

export interface AISettings {
  provider: AIProviderName
  claude_model: string
  openai_model: string
  gemini_model: string
  temperature: number
  max_tokens: number
  system_prompt: string | null
  persona: string
  memory_enabled: 0 | 1
  stream_enabled: 0 | 1
  // V2 fields
  default_persona?: string
  fallback_provider?: AIProviderName
  cost_limit_daily?: number
  auto_summary?: 0 | 1
}

export interface AIProviderStatus {
  configured: boolean
  model: string
}

export interface AIProviderStatusMap {
  claude: AIProviderStatus
  openai: AIProviderStatus
  gemini: AIProviderStatus
  rule_engine: AIProviderStatus
}

export interface CostEntry {
  day?: string
  month?: string
  provider: string
  cost: number
  tokens: number
  requests: number
}

export interface CostSummary {
  daily: CostEntry[]
  monthly: CostEntry[]
  total: CostEntry[]
}

export interface AILog {
  id: number
  user_id: number | null
  session_id: string | null
  provider: string
  model: string
  action: string
  prompt_text: string | null
  response_text: string | null
  input_tokens: number
  output_tokens: number
  duration_ms: number
  cost_usd: number
  error_text: string | null
  temperature: number | null
  status: string | null
  created_at: string
}

// ── V4 Memory ────────────────────────────────────────────────────────────────
export interface AIMemoryV4 {
  id: number
  user_id: number | null
  company_id: number | null
  tenant_id: number | null
  type: string
  module: string
  title: string | null
  content: string | null
  summary: string
  data_json: string | null
  importance: number
  tags: string | null
  source_module: string
  last_used_at: string | null
  usage_count: number
  embedding_placeholder: string | null
  status: 'active' | 'archived'
  relevance_score: number
  created_at: string
}

// ── AI Tasks ─────────────────────────────────────────────────────────────────
export interface AITask {
  id: number
  user_id: number | null
  company_id: number | null
  title: string
  description: string | null
  type: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority: number
  due_date: string | null
  result: string | null
  ai_provider: string | null
  ai_model: string | null
  created_at: string
  updated_at: string
}

// ── Executive Insights ───────────────────────────────────────────────────────
export interface ExecutiveInsight {
  dimension: string
  score: number
  status: 'good' | 'warning' | 'critical'
  summary: string
  metrics: Record<string, number | string | unknown[]>
  recommendations: string[]
}

export interface AllInsightsResponse {
  insights: ExecutiveInsight[]
  overall_score: number
}

// ── Decision Center ──────────────────────────────────────────────────────────
export interface DecisionRequest {
  question?: string
  saleId?: number
  assetId?: number
  assetIds?: number[]
  topic?: string
  period?: string
  context?: Record<string, unknown>
}

export interface DecisionResponse {
  content: string
  provider: AIProviderName
  model: string
  durationMs: number
  costUsd: number
}

// ── Provider Health ──────────────────────────────────────────────────────────
export interface ProviderHealth {
  provider: string
  status: 'ok' | 'error' | 'unknown'
  latency_ms: number | null
  fallback: string
  message?: string
  error?: string
}

// ── Token & Cost Engine ──────────────────────────────────────────────────────
export interface WeeklyCostEntry {
  week: string
  provider: string
  cost: number
  tokens: number
  requests: number
}

export interface CostEngineReport {
  daily: CostEntry[]
  weekly: WeeklyCostEntry[]
  monthly: CostEntry[]
  total: CostEntry[]
  chartData: Array<{ label: string; cost: number; tokens: number }>
}
