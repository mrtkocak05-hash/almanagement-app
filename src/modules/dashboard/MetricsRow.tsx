import { Briefcase, TrendingUp, Wallet } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/utils/format'
import type { DashboardData } from '@/types/dashboard'

interface MetricsRowProps {
  metrics: DashboardData['metrics']
}

const KPI_COLORS = [
  { icon: '#C9A84C', bg: 'rgba(201,168,76,0.10)' },
  { icon: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
  { icon: '#16a34a', bg: 'rgba(22,163,74,0.10)' },
]

export function MetricsRow({ metrics }: MetricsRowProps) {
  const items = [
    {
      label: 'Toplam Varlık',
      value: formatNumber(metrics.total_assets, 0),
      sub: 'kayıtlı varlık',
      icon: Briefcase,
    },
    {
      label: 'Aktif Yatırım',
      value: formatNumber(metrics.active_investments, 0),
      sub: 'aktif pozisyon',
      icon: TrendingUp,
    },
    {
      label: 'Kullanılabilir Nakit',
      value: metrics.available_cash > 0 ? formatCurrency(metrics.available_cash, 'TRY') : '—',
      sub: 'nakit varlık',
      icon: Wallet,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item, idx) => {
        const Icon = item.icon
        const { icon: iconColor, bg: iconBg } = KPI_COLORS[idx]
        return (
          <div
            key={item.label}
            className="rounded-2xl bg-white border p-5 transition-shadow duration-200 hover:shadow-md flex flex-col gap-3"
            style={{ borderColor: '#ECE9E2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            {/* Icon top */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 self-start"
              style={{ backgroundColor: iconBg }}
            >
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>

            {/* Big number */}
            <div>
              <p className="text-2xl font-bold text-foreground tracking-tight leading-none">
                {item.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wide">
                {item.label}
              </p>
            </div>

            {/* Small description */}
            <p className="text-[11px] text-muted-foreground border-t pt-2" style={{ borderColor: '#ECE9E2' }}>
              {item.sub}
            </p>
          </div>
        )
      })}
    </div>
  )
}
