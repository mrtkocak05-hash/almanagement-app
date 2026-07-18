import { RefreshCw, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui'
import { formatCurrency, formatNumber, formatDateTime } from '@/utils/format'
import type { DashboardData } from '@/types/dashboard'
import { cn } from '@/utils/cn'

interface CapitalCardProps {
  capital: DashboardData['capital']
  exchangeRates: DashboardData['exchange_rates']
  onRefresh?: () => void
  loading?: boolean
}

export function CapitalCard({ capital, exchangeRates, onRefresh, loading }: CapitalCardProps) {
  const hasData = capital.amount_try > 0
  const hasRates = exchangeRates.usd_try > 0 || exchangeRates.gold_gram_try > 0

  return (
    <Card className="p-7">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Mevcut Sermaye</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {capital.updated_at ? `Son güncelleme: ${formatDateTime(capital.updated_at)}` : 'Henüz tanımlanmadı'}
          </p>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} disabled={loading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        )}
      </div>

      {/* Dominant TL value */}
      <div className="mb-5">
        {hasData
          ? <p className="text-5xl font-bold text-foreground tracking-tight">{formatCurrency(capital.amount_try, 'TRY')}</p>
          : <p className="text-5xl font-bold text-muted-foreground/30 tracking-tight">— ₺</p>
        }
      </div>

      {/* Exchange rates as TRY reference values */}
      <div className="flex items-center gap-6 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">USD / TL Kuru</p>
          {exchangeRates.usd_try > 0
            ? <p className="text-base font-semibold text-foreground">{formatNumber(exchangeRates.usd_try, 2)} ₺</p>
            : <p className="text-base font-semibold text-muted-foreground/30">— ₺</p>
          }
        </div>

        <div className="w-px h-7 bg-border" />

        <div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Altın (gr) / TL</p>
          {exchangeRates.gold_gram_try > 0
            ? <p className="text-base font-semibold text-foreground">{formatCurrency(exchangeRates.gold_gram_try, 'TRY')}</p>
            : <p className="text-base font-semibold text-muted-foreground/30">— ₺</p>
          }
        </div>

        {!hasRates && (
          <>
            <div className="w-px h-7 bg-border" />
            <p className="text-xs text-muted-foreground italic">Kurlar Ayarlar'dan tanımlanabilir</p>
          </>
        )}
      </div>
    </Card>
  )
}
