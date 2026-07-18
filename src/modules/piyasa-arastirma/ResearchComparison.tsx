import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { marketResearchApi } from '@/services/marketResearchApi'
import type { ResearchSelectorItem, ResearchCategory } from '@/types/marketResearch'
import { RESEARCH_CATEGORY_LABELS } from '@/types/marketResearch'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'

interface Props {
  ourPrice: number
  category?: ResearchCategory
  onSelect?: (researchId: number | null) => void
}

export function ResearchComparison({ ourPrice, category, onSelect }: Props) {
  const [options, setOptions] = useState<ResearchSelectorItem[]>([])
  const [selected, setSelected] = useState<ResearchSelectorItem | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    marketResearchApi.selector(category)
      .then(data => setOptions(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category])

  function handleSelect(item: ResearchSelectorItem | null) {
    setSelected(item)
    setOpen(false)
    onSelect?.(item?.id ?? null)
  }

  const avgPrice = selected?.avg_price ?? null
  const diff = avgPrice != null && ourPrice > 0 ? avgPrice - ourPrice : null
  const pct = diff != null && avgPrice ? Math.abs(diff / avgPrice * 100) : null

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Piyasa Karşılaştırması</p>
      </div>

      {/* Selector */}
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-left text-foreground flex items-center justify-between hover:border-amber-500/40 transition-colors"
        >
          <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
            {selected ? selected.title : 'Araştırma seç...'}
          </span>
          <span className="text-muted-foreground text-xs">▾</span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute z-50 top-10 left-0 right-0 bg-card rounded-xl border border-border shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              <button
                onClick={() => handleSelect(null)}
                className="w-full px-3 py-2 text-xs text-muted-foreground hover:bg-accent text-left transition-colors"
              >
                — Seçme
              </button>
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-3">Yükleniyor...</p>
              ) : options.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Araştırma bulunamadı</p>
              ) : options.map(opt => (
                <button key={opt.id} onClick={() => handleSelect(opt)}
                  className="w-full px-3 py-2.5 hover:bg-accent transition-colors text-left">
                  <p className="text-xs font-medium text-foreground">{opt.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {RESEARCH_CATEGORY_LABELS[opt.category]} · {opt.listing_count} ilan
                    {opt.avg_price ? ` · Ort. ${formatCurrency(opt.avg_price, 'TRY')}` : ''}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Comparison result */}
      {selected && avgPrice != null && ourPrice > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Bizim alış fiyatı</span>
            <span className="font-semibold text-foreground">{formatCurrency(ourPrice, 'TRY')}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Piyasa ortalaması</span>
            <span className="font-semibold text-foreground">{formatCurrency(avgPrice, 'TRY')}</span>
          </div>
          {diff !== null && pct !== null && (
            <div className={cn(
              'flex items-center justify-between text-xs pt-2 border-t border-border',
              diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-400' : 'text-muted-foreground',
            )}>
              <div className="flex items-center gap-1">
                {diff > 0 ? <TrendingDown className="w-3 h-3" /> : diff < 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                <span className="font-semibold">{diff > 0 ? 'Avantaj' : diff < 0 ? 'Dezavantaj' : 'Piyasa Değeri'}</span>
              </div>
              <span className="font-bold">
                {diff !== 0 ? `${formatCurrency(Math.abs(diff), 'TRY')} · %${pct.toFixed(1)}` : 'Eşit'}
              </span>
            </div>
          )}
        </div>
      )}

      {selected && !avgPrice && (
        <p className="text-[10px] text-muted-foreground text-center">Bu araştırmada henüz ilan fiyatı yok</p>
      )}
    </div>
  )
}
