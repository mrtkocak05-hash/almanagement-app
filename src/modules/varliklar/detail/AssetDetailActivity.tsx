import { formatRelative } from '@/utils/format'
import type { AssetDetail } from '@/types/assets'

interface Props { asset: AssetDetail }

interface ActivityRecord {
  id: number
  action: string
  description: string | null
  created_at: string
}

export function AssetDetailActivity({ asset }: Props) {
  const activities = (asset.activities as ActivityRecord[]) ?? []

  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Henüz aktivite yok.</p>
  }

  return (
    <div className="space-y-0 relative">
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
      {activities.map((act, i) => (
        <div key={act.id ?? i} className="relative pl-9 pb-5 last:pb-0">
          <div className="absolute left-2.5 top-1.5 w-2 h-2 rounded-full bg-muted-foreground/40 ring-2 ring-background" />
          <p className="text-sm text-foreground font-medium">{act.action}</p>
          {act.description && <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>}
          <p className="text-xs text-muted-foreground/60 mt-1">{formatRelative(act.created_at)}</p>
        </div>
      ))}
    </div>
  )
}
