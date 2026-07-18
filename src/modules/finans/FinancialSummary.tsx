import { TrendingUp, Wallet, Building2, TrendingDown, CreditCard, ArrowRightLeft } from 'lucide-react'
import { useFinancialSummary } from '@/hooks/useFinancial'
import { TRANSACTION_COLORS, TRANSACTION_LABELS, TRANSACTION_BG } from '@/types/financial'
import { PageLoading } from '@/components/ui'
import { cn } from '@/utils/cn'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

interface Props {
  onQuickAction: (action: string) => void
}

export function FinancialSummary({ onQuickAction }: Props) {
  const { data, loading } = useFinancialSummary()

  if (loading) return <PageLoading />
  if (!data) return null

  const cards = [
    { label: 'Toplam Sermaye', value: data.current_capital, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Kasa Toplamı', value: data.available_cash, icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Banka Toplamı', value: data.banks_total, icon: Building2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Alacaklar', value: data.receivables_total, icon: TrendingDown, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Borçlar', value: data.payables_total, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Net Nakit Pozisyon', value: data.net_cash_position, icon: ArrowRightLeft, color: data.net_cash_position >= 0 ? 'text-emerald-400' : 'text-red-400', bg: data.net_cash_position >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
  ]

  const quickActions = [
    { label: 'Sermaye Hareketi', action: 'capital', color: 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25' },
    { label: 'Kasa Girişi', action: 'cash', color: 'bg-green-500/15 text-green-300 hover:bg-green-500/25' },
    { label: 'Transfer', action: 'transfer', color: 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25' },
    { label: 'Yeni Banka', action: 'bank', color: 'bg-purple-500/15 text-purple-300 hover:bg-purple-500/25' },
    { label: 'Alacak Ekle', action: 'receivable', color: 'bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/25' },
    { label: 'Borç Ekle', action: 'payable', color: 'bg-red-500/15 text-red-300 hover:bg-red-500/25' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{c.label}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', c.bg)}>
                <c.icon className={cn('w-4 h-4', c.color)} />
              </div>
            </div>
            <p className={cn('text-2xl font-semibold', c.color)}>{fmt(c.value)}</p>
            {c.label === 'Net Nakit Pozisyon' && data.credit_debt > 0 && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Kredi Kartı Borcu: {fmt(data.credit_debt)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Hızlı İşlemler</h3>
        <div className="flex flex-wrap gap-2">
          {quickActions.map(a => (
            <button
              key={a.action}
              onClick={() => onQuickAction(a.action)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', a.color)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Son İşlemler</h3>
        {data.recent_transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Henüz işlem bulunmuyor</p>
        ) : (
          <div className="space-y-2">
            {data.recent_transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold', TRANSACTION_BG[tx.type])}>
                    <span className={TRANSACTION_COLORS[tx.type]}>{TRANSACTION_LABELS[tx.type][0]}</span>
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{tx.description ?? TRANSACTION_LABELS[tx.type]}</p>
                    <p className="text-xs text-muted-foreground">{tx.transaction_date}</p>
                  </div>
                </div>
                <span className={cn('text-sm font-medium tabular-nums', TRANSACTION_COLORS[tx.type])}>
                  {tx.type === 'expense' ? '-' : '+'}{fmt(tx.amount_try)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
