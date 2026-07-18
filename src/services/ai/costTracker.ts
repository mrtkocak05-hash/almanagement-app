import type { CostEntry } from './types'

const COST_PER_MILLION: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5':  { input: 0.25, output: 1.25 },
  'claude-opus-4-8':   { input: 15.0, output: 75.0 },
  'gpt-4o':            { input: 5.0, output: 15.0 },
  'gpt-4o-mini':       { input: 0.15, output: 0.60 },
  'gemini-2.0-flash':  { input: 0.075, output: 0.30 },
  'gemini-1.5-pro':    { input: 1.25, output: 5.0 },
  'rule_engine':       { input: 0, output: 0 },
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_MILLION[model] ?? { input: 0, output: 0 }
  return (rates.input * inputTokens + rates.output * outputTokens) / 1_000_000
}

export function aggregateByProvider(entries: CostEntry[]): Record<string, { cost: number; tokens: number; requests: number }> {
  return entries.reduce<Record<string, { cost: number; tokens: number; requests: number }>>((acc, e) => {
    if (!acc[e.provider]) acc[e.provider] = { cost: 0, tokens: 0, requests: 0 }
    acc[e.provider].cost += e.cost
    acc[e.provider].tokens += e.tokens
    acc[e.provider].requests += e.requests
    return acc
  }, {})
}

export function formatCostUSD(usd: number): string {
  if (usd === 0) return '$0.00'
  if (usd < 0.001) return `$${(usd * 1000).toFixed(4)}m` // millicents
  return `$${usd.toFixed(4)}`
}

export const PROVIDER_COLORS: Record<string, string> = {
  claude: '#D97706',
  openai: '#16A34A',
  gemini: '#2563EB',
  rule_engine: '#6B7280',
}

export const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  rule_engine: 'Yerel Motor',
}
