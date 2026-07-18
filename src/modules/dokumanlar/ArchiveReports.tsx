import { useArchiveReports } from '@/hooks/useArchive'
import { AlertTriangle, FileMinus, Files } from 'lucide-react'
import { MODULE_LABELS } from '@/types/archive'
import type { DocModule } from '@/types/archive'

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm text-muted-foreground w-40 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-border/30 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-foreground w-8 text-right">{value}</span>
    </div>
  )
}

export function ArchiveReports() {
  const { data, loading } = useArchiveReports()

  if (loading) return <div className="text-sm text-muted-foreground text-center py-12">Yükleniyor...</div>
  if (!data) return <div className="text-sm text-muted-foreground text-center py-12">Rapor yüklenemedi</div>

  const maxCat = Math.max(...(data.by_category ?? []).map(r => r.cnt), 1)
  const maxMod = Math.max(...(data.by_module ?? []).map(r => r.cnt), 1)
  const maxTl = Math.max(...(data.upload_timeline ?? []).map(r => r.cnt), 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* By Category */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Files className="w-4 h-4 text-blue-400" />Kategoriye Göre
          </h3>
          <div className="space-y-0.5">
            {(data.by_category ?? []).map(r => (
              <Bar key={r.category} label={r.category} value={r.cnt} max={maxCat} />
            ))}
          </div>
        </div>

        {/* By Module */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Files className="w-4 h-4 text-purple-400" />Modüle Göre
          </h3>
          <div className="space-y-0.5">
            {(data.by_module ?? []).map(r => (
              <Bar key={r.module} label={MODULE_LABELS[r.module as DocModule] ?? r.module} value={r.cnt} max={maxMod} />
            ))}
          </div>
        </div>
      </div>

      {/* Upload Timeline */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Aylık Yükleme</h3>
        <div className="flex items-end gap-2 h-28">
          {(data.upload_timeline ?? []).map(r => {
            const h = maxTl > 0 ? Math.max((r.cnt / maxTl) * 100, 4) : 4
            return (
              <div key={r.month} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">{r.cnt}</span>
                <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${h}%` }} />
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">{r.month?.slice(0, 7)}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Missing Docs */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileMinus className="w-4 h-4 text-orange-400" />Eksik Dokümanlar
          </h3>
          {(data.missing ?? []).length === 0
            ? <p className="text-sm text-muted-foreground">Eksik doküman yok</p>
            : (
              <div className="divide-y divide-border/40">
                {(data.missing ?? []).map(d => (
                  <div key={d.id} className="py-2">
                    <p className="text-sm font-medium text-foreground">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.category}</p>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Expired Docs */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />Süresi Dolmuş
          </h3>
          {(data.expired ?? []).length === 0
            ? <p className="text-sm text-muted-foreground">Süresi dolmuş doküman yok</p>
            : (
              <div className="divide-y divide-border/40">
                {(data.expired ?? []).map(d => (
                  <div key={d.id} className="py-2">
                    <p className="text-sm font-medium text-foreground">{d.title}</p>
                    <p className="text-xs text-red-400">{d.expire_date}</p>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
