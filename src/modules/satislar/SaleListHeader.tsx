import { TrendingUp, TrendingDown, Calendar, BarChart3, Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import type { SaleListResponse } from '@/types/sales'
import type { SaleFilters } from '@/types/sales'

interface Props {
  summary?: SaleListResponse['summary']
  filters: SaleFilters
  onFilterChange: (f: SaleFilters) => void
  onNew: () => void
}

function StatCard({ label, value, sub, icon: Icon, positive }: {
  label: string; value: string; sub?: string
  icon: React.FC<{ className?: string }>; positive?: boolean | null
}) {
  return (
    <div className="flex-1 p-4 rounded-xl border border-border bg-card space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className={`text-xl font-bold ${positive === true ? 'text-green-500' : positive === false ? 'text-red-500' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function SaleListHeader({ summary, filters, onFilterChange, onNew }: Props) {
  const totalProfit = summary?.total_profit ?? 0
  const avgRoi = summary?.avg_roi ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <StatCard
            label="Bugün Kâr"
            value={formatCurrency(summary?.today_profit ?? 0)}
            icon={Calendar}
            positive={null}
          />
          <StatCard
            label="Bu Ay Kâr"
            value={formatCurrency(summary?.month_profit ?? 0)}
            icon={TrendingUp}
            positive={null}
          />
          <StatCard
            label="Toplam Kâr"
            value={formatCurrency(totalProfit)}
            sub={`${summary?.count ?? 0} işlem`}
            icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
            positive={totalProfit >= 0}
          />
          <StatCard
            label="Ort. ROI"
            value={`%${avgRoi.toFixed(1)}`}
            icon={BarChart3}
            positive={avgRoi >= 0}
          />
        </div>
        <Button onClick={onNew} className="flex-shrink-0">
          <Plus className="w-4 h-4 mr-1.5" /> Yeni Satış
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={filters.search || ''}
          onChange={e => onFilterChange({ search: e.target.value, page: 1 })}
          placeholder="Satış no, varlık veya alıcı ara..."
          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={filters.status || ''}
          onChange={e => onFilterChange({ status: e.target.value as SaleFilters['status'], page: 1 })}
          className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Tüm Durumlar</option>
          <option value="draft">Taslak</option>
          <option value="completed">Tamamlandı</option>
        </select>
      </div>
    </div>
  )
}
