import { useState, memo } from 'react'
import { Wallet, TrendingDown, User, Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useBalanceSummary } from '@/hooks/useAIDashboard'
import type { BalancePeriod } from '@/types/aiDashboard'

const PERIODS: { key: BalancePeriod; label: string }[] = [
  { key: 'daily',   label: 'Günlük' },
  { key: 'weekly',  label: 'Haftalık' },
  { key: 'monthly', label: 'Aylık' },
  { key: 'yearly',  label: 'Yıllık' },
]

function Skeleton() {
  return <div className="h-5 w-24 rounded bg-muted/40 animate-pulse" />
}

interface CardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: number
  loading: boolean
  sub?: string
  positive?: boolean
  highlight?: boolean
}

function Card({ icon, iconBg, label, value, loading, sub, positive, highlight }: CardProps) {
  return (
    <div className={cn(
      'flex flex-col gap-1.5 px-4 py-3 rounded-xl border bg-card transition-all duration-150',
      highlight
        ? value >= 0
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-red-400/30 bg-red-400/5'
        : 'border-border hover:border-yellow-600/30 hover:shadow-sm hover:-translate-y-px',
    )}>
      <div className="flex items-center gap-2">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
          {icon}
        </div>
        <p className="text-[10px] font-medium text-muted-foreground leading-none truncate">{label}</p>
        {typeof positive === 'boolean' && !loading && (
          <div className="ml-auto flex-shrink-0">
            {positive
              ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
              : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
          </div>
        )}
      </div>
      {loading ? <Skeleton /> : (
        <p className={cn(
          'text-lg font-bold tabular-nums leading-none',
          highlight
            ? value >= 0 ? 'text-green-500' : 'text-red-400'
            : 'text-foreground',
        )}>
          {formatCurrency(value, 'TRY')}
        </p>
      )}
      {sub && !loading && (
        <p className="text-[10px] text-muted-foreground leading-none truncate">{sub}</p>
      )}
    </div>
  )
}

export const BakiyeWidget = memo(function BakiyeWidget() {
  const [period, setPeriod] = useState<BalancePeriod>('monthly')
  const { data, loading } = useBalanceSummary(period)

  const kasadaSub = data
    ? `Hesaplar: ${formatCurrency(data.static_balance, 'TRY')} + Gelir: ${formatCurrency(data.period_income, 'TRY')}`
    : undefined

  const kalanSub = data
    ? data.kalan >= 0
      ? `Toplam gider: ${formatCurrency(data.expenses.total, 'TRY')}`
      : `Açık: ${formatCurrency(Math.abs(data.kalan), 'TRY')}`
    : undefined

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-foreground">Nakit Özeti</span>
        <div className="flex items-center gap-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-100',
                period === p.key
                  ? 'bg-yellow-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 cards */}
      <div className="grid grid-cols-4 gap-2">
        <Card
          icon={<Wallet className="w-4 h-4 text-yellow-600" />}
          iconBg="bg-yellow-600/10"
          label="Mevcut Bakiye"
          value={data?.kasada_bulunan ?? 0}
          loading={loading}
          sub={kasadaSub}
        />
        <Card
          icon={<User className="w-4 h-4 text-orange-500" />}
          iconBg="bg-orange-500/10"
          label="Kişisel Giderler"
          value={data?.expenses.personal ?? 0}
          loading={loading}
          positive={false}
        />
        <Card
          icon={<Building2 className="w-4 h-4 text-red-400" />}
          iconBg="bg-red-400/10"
          label="Şirket Giderleri"
          value={data?.expenses.company ?? 0}
          loading={loading}
          positive={false}
        />
        <Card
          icon={<TrendingDown className="w-4 h-4 text-green-500" />}
          iconBg="bg-green-500/10"
          label="Kalan Tutar"
          value={data?.kalan ?? 0}
          loading={loading}
          sub={kalanSub}
          highlight
        />
      </div>
    </div>
  )
})
