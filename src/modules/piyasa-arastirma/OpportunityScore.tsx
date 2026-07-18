import { cn } from '@/utils/cn'
import type { OpportunityScore as OpportunityScoreType, OpportunityRating } from '@/types/marketResearch'
import { OPPORTUNITY_LABELS, OPPORTUNITY_COLORS } from '@/types/marketResearch'

const STAR_COUNTS: Record<OpportunityRating, number> = {
  firsat: 5, iyi: 4, normal: 3, riskli: 2, pahali: 1,
}

interface Props { opportunity: OpportunityScoreType; size?: 'sm' | 'md' | 'lg' }

export function OpportunityScore({ opportunity, size = 'md' }: Props) {
  const { rating, score } = opportunity
  const stars = STAR_COUNTS[rating] ?? 3
  const label = OPPORTUNITY_LABELS[rating] ?? rating
  const color = OPPORTUNITY_COLORS[rating] ?? 'text-amber-500'

  const starSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-base'
  const labelSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs'

  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex items-center', starSize)}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < stars ? 'text-amber-400' : 'text-muted/30'}>★</span>
        ))}
      </div>
      <div>
        <span className={cn('font-semibold', labelSize, color)}>{label}</span>
        {size !== 'sm' && <span className="text-[10px] text-muted-foreground ml-1">({score}/100)</span>}
      </div>
    </div>
  )
}
