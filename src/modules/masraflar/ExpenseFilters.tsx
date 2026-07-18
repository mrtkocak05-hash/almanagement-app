import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui'
import {
  EXPENSE_CATEGORIES, PAYMENT_SOURCE_LABELS, EXPENSE_OWNER_LABELS,
} from '@/types/expenses'
import type { ExpenseFilters } from '@/types/expenses'

interface Props {
  filters: ExpenseFilters
  onChange: (f: Partial<ExpenseFilters>) => void
  onClear: () => void
}

const QUICK_DATES = [
  { label: 'Bugün', from: () => new Date().toISOString().split('T')[0], to: () => new Date().toISOString().split('T')[0] },
  { label: 'Bu Ay', from: () => new Date().toISOString().slice(0, 7) + '-01', to: () => new Date().toISOString().split('T')[0] },
  { label: 'Bu Yıl', from: () => new Date().getFullYear() + '-01-01', to: () => new Date().toISOString().split('T')[0] },
]

export function ExpenseFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Object.values(filters).some(v => v)

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Ara... (açıklama, no)"
          value={filters.search ?? ''}
          onChange={e => onChange({ search: e.target.value || undefined })}
        />
      </div>

      {/* Category */}
      <select
        value={filters.category ?? ''}
        onChange={e => onChange({ category: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground"
      >
        <option value="">Tüm Kategoriler</option>
        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Owner */}
      <select
        value={filters.owner ?? ''}
        onChange={e => onChange({ owner: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground"
      >
        <option value="">Tüm Sahipler</option>
        {(Object.keys(EXPENSE_OWNER_LABELS) as Array<keyof typeof EXPENSE_OWNER_LABELS>).map(k => (
          <option key={k} value={k}>{EXPENSE_OWNER_LABELS[k]}</option>
        ))}
      </select>

      {/* Payment Source */}
      <select
        value={filters.payment_source ?? ''}
        onChange={e => onChange({ payment_source: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground"
      >
        <option value="">Tüm Kaynaklar</option>
        {(Object.keys(PAYMENT_SOURCE_LABELS) as Array<keyof typeof PAYMENT_SOURCE_LABELS>).map(k => (
          <option key={k} value={k}>{PAYMENT_SOURCE_LABELS[k]}</option>
        ))}
      </select>

      {/* Quick Date Buttons */}
      <div className="flex gap-1">
        {QUICK_DATES.map(d => (
          <button
            key={d.label}
            onClick={() => onChange({ date_from: d.from(), date_to: d.to() })}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      <input
        type="date"
        value={filters.date_from ?? ''}
        onChange={e => onChange({ date_from: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground"
      />
      <span className="text-muted-foreground text-xs">—</span>
      <input
        type="date"
        value={filters.date_to ?? ''}
        onChange={e => onChange({ date_to: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground"
      />

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="w-3.5 h-3.5" />Temizle
        </button>
      )}
    </div>
  )
}
