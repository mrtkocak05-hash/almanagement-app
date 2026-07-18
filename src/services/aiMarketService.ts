import type { MarketResearchDetail, PriceStats } from '@/types/marketResearch'

// AI provider interface — Claude / ChatGPT / Gemini entegrasyona hazır
export interface AIMarketProvider {
  name: string
  analyze(research: MarketResearchDetail): Promise<AIMarketAnalysis>
}

export interface AIMarketAnalysis {
  summary: string
  recommendation: string
  confidence: number
  suggestedBuyPrice: number | null
  provider: string
}

// Rule-based provider (no external API needed)
const ruleBasedProvider: AIMarketProvider = {
  name: 'rule-based',
  analyze(research: MarketResearchDetail): Promise<AIMarketAnalysis> {
    const { stats } = research
    if (!stats.count) {
      return Promise.resolve({
        summary: 'Henüz ilan girilmedi, analiz yapılamıyor.',
        recommendation: 'En az 3 ilan ekleyerek piyasa analizi başlatın.',
        confidence: 0,
        suggestedBuyPrice: null,
        provider: 'rule-based',
      })
    }

    const spread = stats.range / stats.avg
    const confidence = Math.min(0.4 + stats.count * 0.06, 0.95)

    let summary = `${stats.count} ilan analiz edildi. Piyasa fiyatı ${formatPrice(stats.avg)} ₺ (${formatPrice(stats.min)} – ${formatPrice(stats.max)} ₺ aralığında).`
    let recommendation: string

    if (spread < 0.1) {
      recommendation = `Fiyatlar çok istikrarlı. Piyasa ortalamasının (${formatPrice(stats.avg)} ₺) altında bir teklifle başlayın.`
    } else if (spread < 0.25) {
      recommendation = `Orta düzeyde fiyat dağılımı. Medyan değeri (${formatPrice(stats.median)} ₺) referans alın.`
    } else {
      recommendation = `Geniş fiyat aralığı mevcut — alt fiyat gruplarını araştırın. En düşük: ${formatPrice(stats.min)} ₺.`
    }

    const suggestedBuyPrice = Math.round(stats.avg * 0.92)

    return Promise.resolve({ summary, recommendation, confidence, suggestedBuyPrice, provider: 'rule-based' })
  },
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat('tr-TR').format(Math.round(n))
}

// Provider registry
const providers: Record<string, AIMarketProvider> = {
  'rule-based': ruleBasedProvider,
  // 'claude': claudeProvider,      // TODO: import when API key ready
  // 'chatgpt': chatGptProvider,    // TODO: import when API key ready
  // 'gemini': geminiProvider,      // TODO: import when API key ready
}

export function getAIMarketProvider(name = 'rule-based'): AIMarketProvider {
  return providers[name] ?? ruleBasedProvider
}

export function computeOpportunityScore(stats: PriceStats, targetPrice: number): { score: number; percentVsAvg: number } {
  if (!stats.avg || !targetPrice) return { score: 50, percentVsAvg: 0 }
  const ratio = targetPrice / stats.avg
  const percentVsAvg = Math.round((1 - ratio) * 100)
  let score: number
  if (ratio < 0.80) score = 95
  else if (ratio < 0.90) score = 82
  else if (ratio < 1.00) score = 68
  else if (ratio < 1.10) score = 52
  else if (ratio < 1.20) score = 35
  else score = 18
  return { score, percentVsAvg }
}
