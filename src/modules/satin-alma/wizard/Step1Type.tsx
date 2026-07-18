import { useEffect } from 'react'
import { Car, Building2, Anchor, Bike, Caravan, Construction, TrendingUp, Wallet, Package, Check } from 'lucide-react'
import { ASSET_TYPE_LABELS } from '@/types/assets'
import type { AssetType } from '@/types/assets'
import { cn } from '@/utils/cn'

const TYPE_ICONS: Record<AssetType, React.ComponentType<{ className?: string }>> = {
  vehicle: Car,
  real_estate: Building2,
  boat: Anchor,
  motorcycle: Bike,
  caravan: Caravan,
  construction_equipment: Construction,
  investment: TrendingUp,
  cash: Wallet,
  other: Package,
}

interface Props {
  selected: AssetType | null
  onChange: (t: AssetType) => void
  onConfirm?: () => void
}

export function Step1Type({ selected, onChange, onConfirm }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && selected && onConfirm) {
        e.preventDefault()
        onConfirm()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, onConfirm])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Satın Alma Türü</h2>
        <p className="text-sm text-muted-foreground mt-1">Hangi tür varlığı satın alıyorsunuz?</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map(type => {
          const Icon = TYPE_ICONS[type]
          const active = selected === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              onDoubleClick={() => {
                onChange(type)
                if (onConfirm) setTimeout(onConfirm, 50)
              }}
              className={cn(
                'relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-left focus:outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                active
                  ? 'border-amber-600 scale-[1.02] shadow-md'
                  : 'border-border hover:border-amber-400/60 hover:bg-amber-50/30 dark:hover:bg-amber-900/10',
              )}
              style={active ? { backgroundColor: '#D97706' } : undefined}
            >
              {active && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <Icon className={cn(
                'w-7 h-7 transition-colors',
                active ? 'text-white' : 'text-muted-foreground',
              )} />
              <span className={cn(
                'text-sm font-semibold text-center transition-colors',
                active ? 'text-white' : 'text-muted-foreground',
              )}>
                {ASSET_TYPE_LABELS[type]}
              </span>
            </button>
          )
        })}
      </div>

      {!selected && (
        <p className="text-xs text-muted-foreground text-center">
          Bir tür seçmek için tıklayın · İlerlemek için çift tıklayın veya Enter'a basın
        </p>
      )}
    </div>
  )
}
