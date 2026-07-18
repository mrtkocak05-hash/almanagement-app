import { Files, AlertTriangle, Clock, FileMinus } from 'lucide-react'
import { useArchiveSummary } from '@/hooks/useArchive'
import type { DocFilters } from '@/types/archive'

interface Props {
  onFilterClick: (f: Partial<DocFilters>) => void
}

export function ArchiveSummaryCards({ onFilterClick }: Props) {
  const { data, loading } = useArchiveSummary()

  const cards = [
    {
      label: 'Toplam Doküman', value: data?.total ?? 0,
      icon: Files, color: 'text-blue-400', bg: 'bg-blue-500/10',
      filter: {},
    },
    {
      label: 'Süresi Dolmuş', value: data?.expired ?? 0,
      icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10',
      filter: { expire_status: 'expired' },
    },
    {
      label: 'Yakında Sona Erecek', value: data?.expiring_soon ?? 0,
      icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10',
      filter: { expire_status: 'expiring_soon' },
    },
    {
      label: 'Eksik', value: data?.missing ?? 0,
      icon: FileMinus, color: 'text-orange-400', bg: 'bg-orange-500/10',
      filter: { status: 'missing' },
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(c => (
        <button
          key={c.label}
          onClick={() => onFilterClick(c.filter)}
          className="bg-card border border-border rounded-xl p-4 text-left hover:border-foreground/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{c.label}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg}`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
          </div>
          <p className={`text-2xl font-semibold ${c.color}`}>{loading ? '—' : c.value}</p>
        </button>
      ))}
    </div>
  )
}
