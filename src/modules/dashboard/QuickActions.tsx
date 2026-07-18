import { useNavigate } from 'react-router-dom'
import { ShoppingCart, TrendingUp, Receipt, FileUp } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'

const ACTIONS = [
  {
    label: 'Yeni Satınalma',
    icon: ShoppingCart,
    path: '/operasyon/satinalma',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
  },
  {
    label: 'Yeni Satış',
    icon: TrendingUp,
    path: '/operasyon/satislar',
    color: 'text-green-500',
    bg: 'bg-green-500/10 hover:bg-green-500/20',
  },
  {
    label: 'Yeni Masraf',
    icon: Receipt,
    path: '/operasyon/masraflar',
    color: 'text-red-500',
    bg: 'bg-red-500/10 hover:bg-red-500/20',
  },
  {
    label: 'Doküman Yükle',
    icon: FileUp,
    path: '/operasyon/dokumanlar',
    color: 'text-gray-500',
    bg: 'bg-muted hover:bg-accent',
  },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card className="p-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
        Hızlı İşlemler
      </p>
      <div className="grid grid-cols-4 gap-3">
        {ACTIONS.map(action => {
          const Icon = action.icon
          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={cn(
                'flex flex-col items-center gap-3 p-5 rounded-xl transition-colors cursor-pointer',
                action.bg
              )}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', action.bg)}>
                <Icon className={cn('w-5 h-5', action.color)} />
              </div>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
