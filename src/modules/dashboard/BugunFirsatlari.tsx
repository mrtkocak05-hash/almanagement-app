import { useState, useEffect, memo } from 'react'
import { Flame, ArrowRight, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { marketResearchApi } from '@/services/marketResearchApi'
import type { MarketResearch } from '@/types/marketResearch'
import { RESEARCH_CATEGORY_LABELS } from '@/types/marketResearch'
import { cn } from '@/utils/cn'

function opportunityScore(listingCount: number): number {
  if (listingCount >= 10) return 5
  if (listingCount >= 7)  return 4
  if (listingCount >= 4)  return 3
  if (listingCount >= 2)  return 2
  return 1
}

function Stars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="w-2.5 h-2.5"
          style={i < score
            ? { fill: '#C9A84C', color: '#C9A84C' }
            : { fill: 'transparent', color: 'rgba(201,168,76,0.2)' }
          }
        />
      ))}
    </div>
  )
}

export const BugunFirsatlari = memo(function BugunFirsatlari() {
  const [items, setItems] = useState<MarketResearch[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    marketResearchApi.todayOpportunities()
      .then(data => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const maxScore = items.length
    ? Math.max(...items.map(i => opportunityScore(i.listing_count ?? 0)))
    : 0

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#C9A84C' }}>
            <Flame className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Bugünün Fırsatları</p>
            <p className="text-xs text-muted-foreground mt-0.5">Fırsat skoru sıralaması</p>
          </div>
        </div>
        <button onClick={() => navigate('/operasyon/piyasa-arastirma')}
          className="flex items-center gap-1 text-[10px] font-medium transition-colors"
          style={{ color: '#C9A84C' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#b45309')}
          onMouseLeave={e => (e.currentTarget.style.color = '#C9A84C')}>
          Tümü <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 rounded-full border-2 border-yellow-600/30 border-t-yellow-600 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 px-4 text-center">
            <Flame className="w-8 h-8 text-muted/20" />
            <p className="text-xs text-muted-foreground">Henüz piyasa araştırması yok</p>
            <button onClick={() => navigate('/operasyon/piyasa-arastirma')}
              className="text-[10px] font-medium transition-colors"
              style={{ color: '#C9A84C' }}>
              Araştırma ekle →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map(item => {
              const score = opportunityScore(item.listing_count ?? 0)
              const isTop = score === maxScore
              return (
                <button
                  key={item.id}
                  onClick={() => navigate('/operasyon/piyasa-arastirma')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors text-left"
                >
                  {/* Score badge */}
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black transition-all',
                    isTop ? 'text-white' : 'text-muted-foreground bg-muted/30',
                  )}
                    style={isTop ? { backgroundColor: '#C9A84C' } : undefined}>
                    {score}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground">
                        {RESEARCH_CATEGORY_LABELS[item.category]}
                      </span>
                      <span className="text-[9px] text-muted-foreground">·</span>
                      <span className="text-[9px] text-muted-foreground">{item.listing_count ?? 0} ilan</span>
                    </div>
                  </div>

                  {/* Right: price + stars */}
                  <div className="text-right flex-shrink-0 space-y-0.5">
                    {item.avg_price ? (
                      <p className="text-xs font-bold text-foreground tabular-nums">
                        {formatCurrency(item.avg_price, 'TRY')}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                    <Stars score={score} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className="px-4 py-2 border-t border-border flex-shrink-0">
          <p className="text-[10px] text-muted-foreground/40 text-center">
            {items.length} aktif araştırma · Otomasyon skoru
          </p>
        </div>
      )}
    </Card>
  )
})
