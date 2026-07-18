import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'

interface BriefItem {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  title: string
  detail: string
}

const ITEMS: BriefItem[] = [
  {
    icon: TrendingUp,
    color: 'text-yellow-600',
    bg: 'bg-yellow-600/10',
    title: 'Portföy performansı',
    detail: 'Son 30 günde %4,2 artış. Araç varlıkları en yüksek getiri sağlayan kategori.',
  },
  {
    icon: AlertCircle,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    title: '3 bekleyen işlem',
    detail: 'Onay bekleyen 2 satınalma ve 1 satış belgesi mevcut.',
  },
  {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    title: 'Nakit durumu sağlıklı',
    detail: 'Mevcut nakit, aylık operasyon giderlerinin 6,4 katını karşılıyor.',
  },
]

export function AIMorningBrief() {
  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#C9A84C' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">AI Morning Brief</p>
          <p className="text-xs text-muted-foreground mt-0.5">Günlük özet · Bugün</p>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 divide-y divide-border">
        {ITEMS.map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx} className="flex items-start gap-3 px-5 py-3.5 hover:bg-accent/30 transition-colors">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', item.bg)}>
                <Icon className={cn('w-3.5 h-3.5', item.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-border flex-shrink-0">
        <p className="text-[10px] text-muted-foreground/40 text-center">Claude AI entegrasyonu • Yakında</p>
      </div>
    </Card>
  )
}
