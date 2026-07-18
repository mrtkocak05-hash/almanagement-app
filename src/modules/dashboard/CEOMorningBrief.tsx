import { memo } from 'react'
import { Sparkles, TrendingUp, TrendingDown, ArrowUpRight, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useAIBrief } from '@/hooks/useAIDashboard'
import { aiMemory } from '@/services/aiMemoryService'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'

dayjs.locale('tr')

export const CEOMorningBrief = memo(function CEOMorningBrief() {
  const { data: brief, loading, refetch } = useAIBrief()

  if (brief && !loading) {
    aiMemory.record('analysis', brief.ai_comment, {
      portfolio_value: brief.portfolio.total_value,
      liquidity_pct: brief.cash.liquidity_pct,
      risk_count: brief.risks.length,
    })
  }

  const hour = dayjs().hour()
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'

  return (
    <div className="relative rounded-xl overflow-hidden border border-zinc-200/80 bg-white p-4 shadow-premium">
      <div className="flex items-start gap-3">

        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-zinc-600" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 mb-0.5">
            {greeting}, Mikail · AI Executive Briefing
          </p>

          {loading ? (
            <div className="space-y-1.5 mt-1">
              <div className="h-3 rounded bg-zinc-200/60 animate-pulse w-3/4" />
              <div className="h-3 rounded bg-zinc-200/60 animate-pulse w-1/2" />
            </div>
          ) : brief ? (
            <p className="text-sm text-zinc-600 leading-relaxed">
              {brief.ai_comment}
              {brief.risks.length > 0 && (
                <> Aktif <strong className="text-zinc-900">{brief.risks.length} risk</strong> tespit edildi.</>
              )}
              {brief.cash.liquidity_pct < 10 && (
                <> Likidite oranı <strong className="text-yellow-600">%{brief.cash.liquidity_pct.toFixed(0)}</strong> — dikkat.</>
              )}
            </p>
          ) : null}

          {/* Inline quick stats */}
          {!loading && brief && (
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <span className="font-medium text-zinc-900">{formatCurrency(brief.portfolio.total_value, 'TRY')}</span>
                <span>portföy</span>
                <span className={cn(
                  'flex items-center gap-0.5',
                  brief.portfolio.gain_loss_pct >= 0 ? 'text-emerald-600' : 'text-red-500'
                )}>
                  {brief.portfolio.gain_loss_pct >= 0
                    ? <TrendingUp className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />
                  }
                  %{Math.abs(brief.portfolio.gain_loss_pct).toFixed(1)}
                </span>
              </span>

              <span className="text-zinc-200">·</span>

              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <span className="font-medium text-zinc-900">{formatCurrency(brief.cash.capital, 'TRY')}</span>
                <span>nakit</span>
              </span>

              {brief.expiring_insurance > 0 && (
                <>
                  <span className="text-zinc-200">·</span>
                  <span className="text-xs font-medium text-red-600">{brief.expiring_insurance} sigorta yaklaşıyor</span>
                </>
              )}

              {brief.missing_docs > 0 && (
                <>
                  <span className="text-zinc-200">·</span>
                  <span className="text-xs font-medium text-yellow-600">{brief.missing_docs} belge eksik</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={refetch}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
          <button className="flex items-center gap-1 text-zinc-400 hover:text-zinc-600 transition-colors">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  )
})
