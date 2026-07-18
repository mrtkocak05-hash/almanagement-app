import type { AIBrief, Profitability, SmartAlert, AIComment } from '@/types/aiDashboard'
import type { DashboardData } from '@/types/dashboard'

const COMMENT_TEMPLATES = {
  portfolio_growing: (pct: number) => `Portföy değeri %${pct.toFixed(1)} artış gösteriyor — iyi bir momentum.`,
  portfolio_flat: () => `Portföy değeri neredeyse maliyetle eşit — değerleme güncellemesi önerilir.`,
  portfolio_loss: (pct: number) => `Portföy değeri maliyetin %${Math.abs(pct).toFixed(1)} altında — strateji gözden geçirilmeli.`,
  high_liquidity: (pct: number) => `Nakit oranı %${pct.toFixed(0)} — yatırım fırsatı için hazır sermaye mevcut.`,
  low_liquidity: (pct: number) => `Nakit oranı %${pct.toFixed(0)} ile düşük seviyede — likidite yönetimi öncelikli.`,
  waiting_assets: (n: number) => `${n} varlık 90 günü aşkın süredir bekliyor — satış stratejisi değerlendirilmeli.`,
  no_risks: () => `Portföyde önemli bir risk unsuru tespit edilmedi — izleme devam ediyor.`,
  profit_positive: (amount: number) => `Toplam gerçekleşen kar: ${new Intl.NumberFormat('tr-TR').format(Math.round(amount))} ₺ — portföy verimli çalışıyor.`,
  avg_roi: (roi: number) => `Ortalama ROI %${roi.toFixed(1)} — piyasa koşulları dikkate alındığında ${roi > 20 ? 'güçlü' : roi > 10 ? 'iyi' : 'orta'} performans.`,
  best_asset: (name: string, roi: number) => `En karlı yatırım: ${name} (%${roi.toFixed(0)} ROI) — bu kategori incelenmeli.`,
  alerts_exist: (n: number) => `${n} önemli uyarı mevcut — dashboard uyarılar bölümünü kontrol edin.`,
  no_alerts: () => `Sistematik uyarı yok — portföy takibi düzenli yürüyor.`,
  diversified: (n: number) => `${n} farklı kategoride varlık — iyi çeşitlendirilmiş portföy.`,
  concentrated: (type: string) => `Portföy ${type} kategorisinde yoğunlaşmış — çeşitlendirme değerlendirilebilir.`,
  active_today: (n: number) => `Son 24 saatte ${n} işlem kaydedildi — sistem aktif.`,
  research_active: (n: number) => `${n} piyasa araştırması aktif — alım kararlarına rehberlik edebilir.`,
}

export function generateComments(
  dashboard: DashboardData,
  brief: AIBrief | null,
  profitability: Profitability | null,
  alerts: SmartAlert[],
): AIComment[] {
  const comments: AIComment[] = []
  const add = (text: string, category: AIComment['category'], importance: AIComment['importance']) => {
    comments.push({ id: `c_${Date.now()}_${comments.length}`, text, category, importance })
  }

  // Portfolio performance
  if (brief) {
    const { portfolio, cash } = brief
    if (portfolio.total_cost > 0) {
      const pct = portfolio.gain_loss_pct
      if (pct > 5) add(COMMENT_TEMPLATES.portfolio_growing(pct), 'portfolio', 'high')
      else if (pct < -5) add(COMMENT_TEMPLATES.portfolio_loss(pct), 'portfolio', 'high')
      else add(COMMENT_TEMPLATES.portfolio_flat(), 'portfolio', 'medium')
    }

    // Liquidity
    if (cash.liquidity_pct > 15) add(COMMENT_TEMPLATES.high_liquidity(cash.liquidity_pct), 'opportunity', 'medium')
    else if (cash.liquidity_pct < 5 && portfolio.total_value > 0) add(COMMENT_TEMPLATES.low_liquidity(cash.liquidity_pct), 'risk', 'high')

    // Waiting assets
    const waitingRisk = brief.risks.find(r => r.includes('bekliyor'))
    if (waitingRisk) {
      const match = waitingRisk.match(/^(\d+)/)
      if (match) add(COMMENT_TEMPLATES.waiting_assets(Number(match[1])), 'action', 'high')
    } else if (brief.risks.length === 0) {
      add(COMMENT_TEMPLATES.no_risks(), 'risk', 'low')
    }
  }

  // Profitability
  if (profitability) {
    if (profitability.total_profit > 0) add(COMMENT_TEMPLATES.profit_positive(profitability.total_profit), 'portfolio', 'medium')
    if (profitability.avg_roi !== 0) add(COMMENT_TEMPLATES.avg_roi(profitability.avg_roi), 'portfolio', 'medium')
    if (profitability.best && profitability.best.roi_percent) {
      add(COMMENT_TEMPLATES.best_asset(profitability.best.asset_name, profitability.best.roi_percent), 'opportunity', 'medium')
    }
  }

  // Alerts
  if (alerts.length > 3) add(COMMENT_TEMPLATES.alerts_exist(alerts.length), 'risk', 'high')
  else if (alerts.length === 0) add(COMMENT_TEMPLATES.no_alerts(), 'action', 'low')

  // Diversification from dashboard metrics
  if (dashboard.metrics.total_assets >= 5) {
    add(COMMENT_TEMPLATES.diversified(dashboard.metrics.total_assets), 'portfolio', 'low')
  }

  // Last 24h activity
  if (brief && brief.last_24h.length > 0) {
    add(COMMENT_TEMPLATES.active_today(brief.last_24h.length), 'action', 'low')
  }

  // Sort by importance
  const order: Record<AIComment['importance'], number> = { high: 0, medium: 1, low: 2 }
  comments.sort((a, b) => order[a.importance] - order[b.importance])

  // Return 5-10 comments
  return comments.slice(0, 10)
}
