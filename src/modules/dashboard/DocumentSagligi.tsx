import { FileCheck, FileWarning, FileClock, AlertTriangle } from 'lucide-react'
import { useDocumentHealth } from '@/hooks/useDocumentIntelligence'

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 flex-1 min-w-0">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  )
}

export function DocumentSagligi() {
  const { data, loading } = useDocumentHealth()

  const score    = data?.health_score      ?? 0
  const total    = data?.total_documents   ?? 0
  const analyzed = data?.analyzed_documents ?? 0
  const expired  = data?.expired_documents  ?? 0
  const expiring = data?.expiring_soon      ?? 0

  const scoreColor =
    score >= 80 ? 'bg-emerald-500/10 text-emerald-500'
    : score >= 60 ? 'bg-yellow-600/10 text-yellow-600'
    : 'bg-red-500/10 text-red-500'

  return (
    <div className="rounded-2xl border border-border bg-card p-4 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Belge Sağlığı</h3>
        {!loading && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor}`}>
            {score}/100
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex gap-2 flex-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-1 h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 flex-1">
          <Metric
            icon={FileCheck}
            label="Analiz Edildi"
            value={analyzed}
            sub={`/ ${total} belge`}
            color="bg-blue-500/10 text-blue-500"
          />
          <Metric
            icon={FileWarning}
            label="Süresi Dolmuş"
            value={expired}
            sub={expired > 0 ? 'Acil güncelleme' : 'Sorun yok'}
            color={expired > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}
          />
          <Metric
            icon={FileClock}
            label="30 Gün İçinde"
            value={expiring}
            sub={expiring > 0 ? 'Yenilenecek' : 'Sorun yok'}
            color={expiring > 0 ? 'bg-yellow-600/10 text-yellow-600' : 'bg-emerald-500/10 text-emerald-500'}
          />
          <Metric
            icon={AlertTriangle}
            label="Analiz Bekleyen"
            value={data?.unanalyzed ?? 0}
            sub="İşlenmemiş belge"
            color="bg-purple-500/10 text-purple-500"
          />
        </div>
      )}
    </div>
  )
}
