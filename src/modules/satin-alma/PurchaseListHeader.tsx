import { Search, Plus, SlidersHorizontal, ShoppingCart, Calendar, TrendingUp, BarChart3 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { ASSET_TYPE_LABELS } from '@/types/assets'
import type { AssetType } from '@/types/assets'
import type { PurchaseFilters } from '@/types/purchases'

interface Summary {
  today_total: number
  month_total: number
  grand_total: number
  avg_total: number
  count: number
}

interface Props {
  summary: Summary | undefined
  filters: PurchaseFilters
  onFilterChange: (f: PurchaseFilters) => void
  onNew: () => void
}

export function PurchaseListHeader({ summary, filters, onFilterChange, onNew }: Props) {
  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Bugünkü Alımlar"
          value={formatCurrency(summary?.today_total ?? 0)}
          sub={`${summary?.count ?? 0} işlem`}
        />
        <StatCard
          icon={ShoppingCart}
          label="Bu Ayki Alımlar"
          value={formatCurrency(summary?.month_total ?? 0)}
        />
        <StatCard
          icon={TrendingUp}
          label="Toplam Alım Değeri"
          value={formatCurrency(summary?.grand_total ?? 0)}
          highlight
        />
        <StatCard
          icon={BarChart3}
          label="Ortalama Alım"
          value={formatCurrency(summary?.avg_total ?? 0)}
        />
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Varlık, satın alma no, satıcı..."
            value={filters.search ?? ''}
            onChange={e => onFilterChange({ search: e.target.value, page: 1 })}
            className="pl-9"
          />
        </div>

        <SlidersHorizontal className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <select
          value={filters.type ?? ''}
          onChange={e => onFilterChange({ type: e.target.value as AssetType | '', page: 1 })}
          className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Tüm Türler</option>
          {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map(t => (
            <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select
          value={filters.status ?? ''}
          onChange={e => onFilterChange({ status: e.target.value as 'draft' | 'completed' | '', page: 1 })}
          className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Tüm Durumlar</option>
          <option value="completed">Tamamlandı</option>
          <option value="draft">Taslak</option>
        </select>

        <div className="ml-auto">
          <Button onClick={onNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Satın Alma Başlat
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, highlight }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'border-foreground/20 bg-foreground/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-lg font-bold ${highlight ? 'text-foreground' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}
