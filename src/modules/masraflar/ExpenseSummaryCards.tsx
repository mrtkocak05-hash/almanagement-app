import { Calendar, CalendarDays, TrendingDown, BarChart3 } from 'lucide-react'
import { useExpenseSummary } from '@/hooks/useExpenses'

const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)

export function ExpenseSummaryCards() {
  const { data, loading } = useExpenseSummary()

  const cards = [
    { label: 'Bugünün Gideri', value: data?.today ?? 0, icon: Calendar, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Bu Ay', value: data?.month ?? 0, icon: CalendarDays, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Bu Yıl', value: data?.year ?? 0, icon: TrendingDown, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Günlük Ortalama', value: data?.avg_daily ?? 0, icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{c.label}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg}`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
          </div>
          <p className={`text-xl font-semibold ${c.color}`}>
            {loading ? '...' : fmt(c.value)}
          </p>
        </div>
      ))}
    </div>
  )
}
