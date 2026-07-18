import type { DashboardData } from '@/types/dashboard'

export interface InvestorInsight {
  type: 'opportunity' | 'risk' | 'neutral' | 'action'
  title: string
  detail: string
  confidence: number
}

export interface InvestorAnalysis {
  summary: string
  rating: 'strong' | 'moderate' | 'caution' | 'alert'
  insights: InvestorInsight[]
  generatedBy: 'rule' | 'claude'
}

// Rule-based analysis — Claude API entegrasyonu için aşağıdaki fonksiyon hazır
export function analyzePortfolio(data: DashboardData): InvestorAnalysis {
  const insights: InvestorInsight[] = []
  const { metrics, recent_activities } = data

  const liquidityRatio = metrics.total_asset_value > 0
    ? (metrics.available_cash / metrics.total_asset_value) * 100
    : 0

  // Likidite analizi
  if (liquidityRatio > 20) {
    insights.push({
      type: 'opportunity',
      title: 'Güçlü likidite',
      detail: `Nakit oranı %${liquidityRatio.toFixed(1)} — yeni yatırım fırsatları için hazır sermaye mevcut.`,
      confidence: 0.85,
    })
  } else if (liquidityRatio < 5) {
    insights.push({
      type: 'risk',
      title: 'Düşük likidite uyarısı',
      detail: `Nakit oranı %${liquidityRatio.toFixed(1)} — acil ihtiyaçlar için nakit takviyesi önerilir.`,
      confidence: 0.90,
    })
  } else {
    insights.push({
      type: 'neutral',
      title: 'Dengeli nakit pozisyonu',
      detail: `Nakit oranı %${liquidityRatio.toFixed(1)} — optimal seviyede.`,
      confidence: 0.75,
    })
  }

  // Portföy büyüklüğü
  if (metrics.total_assets >= 10) {
    insights.push({
      type: 'opportunity',
      title: 'Çeşitlendirilmiş portföy',
      detail: `${metrics.total_assets} varlık — risk dağılımı portföy stabilitesini artırıyor.`,
      confidence: 0.80,
    })
  } else if (metrics.total_assets < 3) {
    insights.push({
      type: 'risk',
      title: 'Yoğunlaşma riski',
      detail: `${metrics.total_assets} varlık — portföy çeşitlendirmesi güçlendirilmeli.`,
      confidence: 0.70,
    })
  }

  // Aktif yatırım oranı
  const activeRatio = metrics.total_assets > 0 ? metrics.active_investments / metrics.total_assets : 0
  if (activeRatio > 0.7) {
    insights.push({
      type: 'action',
      title: 'Yüksek aktif pozisyon',
      detail: `Varlıkların %${(activeRatio * 100).toFixed(0)}'i aktif — likiditeye dönüştürme fırsatları değerlendirilebilir.`,
      confidence: 0.65,
    })
  }

  // Son aktivite analizi
  const recentExpenses = recent_activities.filter(a => a.type === 'expense' && a.amount).reduce((s, a) => s + (a.amount ?? 0), 0)
  const recentSales = recent_activities.filter(a => a.type === 'sale' && a.amount).reduce((s, a) => s + (a.amount ?? 0), 0)
  if (recentSales > recentExpenses) {
    insights.push({
      type: 'opportunity',
      title: 'Pozitif nakit akışı',
      detail: `Son dönemde satış geliri giderleri ${((recentSales / Math.max(recentExpenses, 1)) * 100 - 100).toFixed(0)}% aştı.`,
      confidence: 0.80,
    })
  }

  // Genel rating
  const opportunityCount = insights.filter(i => i.type === 'opportunity').length
  const riskCount = insights.filter(i => i.type === 'risk').length

  let rating: InvestorAnalysis['rating'] = 'moderate'
  if (opportunityCount >= 2 && riskCount === 0) rating = 'strong'
  else if (riskCount >= 2) rating = 'alert'
  else if (riskCount === 1 && opportunityCount === 0) rating = 'caution'

  const summaryMap: Record<InvestorAnalysis['rating'], string> = {
    strong: 'Portföy güçlü momentumda — büyüme fırsatları yüksek',
    moderate: 'Portföy dengeli — izleme ve seçici büyüme önerilir',
    caution: 'Dikkat gerektiren göstergeler mevcut — savunmacı pozisyon',
    alert: 'Acil aksiyon gerekebilir — risk yönetimi öncelikli',
  }

  return {
    summary: summaryMap[rating],
    rating,
    insights,
    generatedBy: 'rule',
  }
}

// Claude API entegrasyonu için hazır servis yapısı
// API key = import.meta.env.VITE_CLAUDE_API_KEY
export async function analyzePortfolioWithClaude(_data: DashboardData): Promise<InvestorAnalysis> {
  // TODO: Claude API çağrısı
  // const response = await fetch('https://api.anthropic.com/v1/messages', {
  //   method: 'POST',
  //   headers: {
  //     'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
  //     'anthropic-version': '2023-06-01',
  //     'content-type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'claude-opus-4-8',
  //     max_tokens: 1024,
  //     messages: [{
  //       role: 'user',
  //       content: `Portföy analizi yap: ${JSON.stringify(_data.metrics)}`,
  //     }],
  //   }),
  // })
  throw new Error('Claude API henüz yapılandırılmadı')
}
