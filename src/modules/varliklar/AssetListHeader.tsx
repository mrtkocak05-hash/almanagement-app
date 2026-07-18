import { Search, Plus, SlidersHorizontal } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from '@/types/assets'
import type { AssetType, AssetStatus, AssetFilters } from '@/types/assets'

interface AssetListHeaderProps {
  summary: { total_count: number; total_value: number; total_share_value: number } | undefined
  filters: AssetFilters
  onFilterChange: (f: AssetFilters) => void
  onNew: () => void
}

export function AssetListHeader({ summary, filters, onFilterChange, onNew }: AssetListHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-muted-foreground">Toplam Varlık</p>
          <p className="text-xl font-bold text-foreground">{summary?.total_count ?? 0}</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <p className="text-xs text-muted-foreground">Toplam Değer</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(summary?.total_value ?? 0)}</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <p className="text-xs text-muted-foreground">Hisseme Düşen</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(summary?.total_share_value ?? 0)}</p>
        </div>
        <div className="ml-auto">
          <Button onClick={onNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Yeni Varlık
          </Button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ara..."
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
          onChange={e => onFilterChange({ status: e.target.value as AssetStatus | '', page: 1 })}
          className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Tüm Durumlar</option>
          {(Object.keys(ASSET_STATUS_LABELS) as AssetStatus[]).map(s => (
            <option key={s} value={s}>{ASSET_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
