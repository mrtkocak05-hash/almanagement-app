import type { CostEntry, CostSummary, CostEngineReport, WeeklyCostEntry } from './types'

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

export function estimateCostV2(model: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_MILLION[model] ?? { input: 0, output: 0 }
  return (rates.input * inputTokens + rates.output * outputTokens) / 1_000_000
}

export function formatCost(usd: number): string {
  if (usd === 0) return '$0.00'
  if (usd < 0.0001) return `<$0.0001`
  if (usd < 0.01)   return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(2)}`
}

export function totalFromEntries(entries: CostEntry[]): number {
  return entries.reduce((s, e) => s + e.cost, 0)
}

export function groupByProvider(entries: CostEntry[]): Record<string, { cost: number; tokens: number; requests: number }> {
  return entries.reduce<Record<string, { cost: number; tokens: number; requests: number }>>((acc, e) => {
    if (!acc[e.provider]) acc[e.provider] = { cost: 0, tokens: 0, requests: 0 }
    acc[e.provider].cost     += e.cost
    acc[e.provider].tokens   += e.tokens
    acc[e.provider].requests += e.requests
    return acc
  }, {})
}

export function buildWeeklyFromDaily(daily: CostEntry[]): WeeklyCostEntry[] {
  const weekMap = new Map<string, WeeklyCostEntry>()
  for (const entry of daily) {
    if (!entry.day) continue
    const d = new Date(entry.day)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const weekKey = `${weekStart.toISOString().slice(0, 10)}_${entry.provider}`
    const week = weekStart.toISOString().slice(0, 10)

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { week, provider: entry.provider, cost: 0, tokens: 0, requests: 0 })
    }
    const w = weekMap.get(weekKey)!
    w.cost     += entry.cost
    w.tokens   += entry.tokens
    w.requests += entry.requests
  }
  return Array.from(weekMap.values()).sort((a, b) => b.week.localeCompare(a.week))
}

export function buildChartData(daily: CostEntry[]): Array<{ label: string; cost: number; tokens: number }> {
  const dayMap = new Map<string, { label: string; cost: number; tokens: number }>()
  for (const entry of daily) {
    if (!entry.day) continue
    if (!dayMap.has(entry.day)) {
      const d = new Date(entry.day)
      dayMap.set(entry.day, {
        label: d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
        cost: 0,
        tokens: 0,
      })
    }
    const item = dayMap.get(entry.day)!
    item.cost   += entry.cost
    item.tokens += entry.tokens
  }
  return Array.from(dayMap.values()).reverse()
}

export function buildReport(summary: CostSummary): CostEngineReport {
  return {
    daily:     summary.daily,
    weekly:    buildWeeklyFromDaily(summary.daily),
    monthly:   summary.monthly,
    total:     summary.total,
    chartData: buildChartData(summary.daily),
  }
}

export function isOverDailyLimit(daily: CostEntry[], limitUsd: number): boolean {
  if (!limitUsd) return false
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayCost = daily.filter(e => e.day === todayStr).reduce((s, e) => s + e.cost, 0)
  return todayCost >= limitUsd
}
