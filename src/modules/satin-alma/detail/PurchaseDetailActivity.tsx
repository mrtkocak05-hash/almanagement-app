import { formatRelative } from '@/utils/format'
import type { PurchaseDetail } from '@/types/purchases'

interface Props { purchase: PurchaseDetail }

interface ActivityRecord { id: number; type: string; title: string; created_at: string }

export function PurchaseDetailActivity({ purchase }: Props) {
  const activities = (purchase.activities as ActivityRecord[]) ?? []

  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Aktivite yok.</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
      {activities.map((a, i) => (
        <div key={a.id ?? i} className="relative pl-9 pb-5 last:pb-0">
          <div className="absolute left-2.5 top-1.5 w-2 h-2 rounded-full bg-muted-foreground/40 ring-2 ring-background" />
          <p className="text-sm text-foreground font-medium">{a.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{a.type}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{formatRelative(a.created_at)}</p>
        </div>
      ))}
    </div>
  )
}
