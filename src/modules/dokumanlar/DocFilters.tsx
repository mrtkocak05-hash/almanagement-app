import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui'
import { DOC_CATEGORIES, MODULE_LABELS, STATUS_LABELS } from '@/types/archive'
import type { DocFilters } from '@/types/archive'

interface Props {
  filters: DocFilters
  onChange: (f: Partial<DocFilters>) => void
  onClear: () => void
}

export function DocFilters({ filters, onChange, onClear }: Props) {
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Ara... (başlık, dosya adı)"
          value={filters.search ?? ''}
          onChange={e => onChange({ search: e.target.value || undefined })}
        />
      </div>

      <select value={filters.category ?? ''} onChange={e => onChange({ category: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
        <option value="">Tüm Kategoriler</option>
        {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select value={filters.module ?? ''} onChange={e => onChange({ module: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
        <option value="">Tüm Modüller</option>
        {(Object.keys(MODULE_LABELS) as Array<keyof typeof MODULE_LABELS>).map(k => (
          <option key={k} value={k}>{MODULE_LABELS[k]}</option>
        ))}
      </select>

      <select value={filters.status ?? ''} onChange={e => onChange({ status: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
        <option value="">Tüm Durumlar</option>
        {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map(k => (
          <option key={k} value={k}>{STATUS_LABELS[k]}</option>
        ))}
      </select>

      <select value={filters.expire_status ?? ''} onChange={e => onChange({ expire_status: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground">
        <option value="">Tüm Geçerlilik</option>
        <option value="expired">Süresi Dolmuş</option>
        <option value="expiring_soon">Yakında Sona Erecek</option>
        <option value="valid">Geçerli</option>
      </select>

      <input type="date" value={filters.date_from ?? ''} onChange={e => onChange({ date_from: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground" />
      <span className="text-muted-foreground text-xs">—</span>
      <input type="date" value={filters.date_to ?? ''} onChange={e => onChange({ date_to: e.target.value || undefined })}
        className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground" />

      {hasFilters && (
        <button onClick={onClear} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5" />Temizle
        </button>
      )}
    </div>
  )
}
