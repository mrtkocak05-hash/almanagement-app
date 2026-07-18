import { Car, ShieldAlert, Camera, Wrench } from 'lucide-react'
import { useVehicleDashboardStats } from '@/hooks/useVehicleIntelligence'

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

export function AracSagligi() {
  const { data, loading } = useVehicleDashboardStats()

  const avgScore     = data?.avg_score ?? 0
  const scoreColor   =
    avgScore >= 80 ? 'bg-emerald-500/10 text-emerald-500'
    : avgScore >= 60 ? 'bg-yellow-600/10 text-yellow-600'
    : 'bg-red-500/10 text-red-500'

  return (
    <div className="rounded-2xl border border-border bg-card p-4 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Araç Sağlığı</h3>
        {!loading && data?.avg_score != null && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor}`}>
            Ort. {data.avg_score}/100
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
            icon={Car}
            label="Kayıtlı Araç"
            value={data?.total ?? 0}
            sub={`${data?.scored ?? 0} skoru hesaplı`}
            color="bg-blue-500/10 text-blue-500"
          />
          <Metric
            icon={ShieldAlert}
            label="Eksper Bekleyen"
            value={data?.expert_pending ?? 0}
            sub={data?.expert_pending ? 'Eksper gerekli' : 'Tümü tamamlandı'}
            color={data?.expert_pending ? 'bg-yellow-600/10 text-yellow-600' : 'bg-emerald-500/10 text-emerald-500'}
          />
          <Metric
            icon={Camera}
            label="Fotoğraf Eksik"
            value={data?.missing_photos ?? 0}
            sub={data?.missing_photos ? 'Fotoğraf eklenmeli' : 'Sorun yok'}
            color={data?.missing_photos ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}
          />
          <Metric
            icon={Wrench}
            label="Bakım Eksik"
            value={data?.missing_maintenance ?? 0}
            sub="Bakım kaydı yetersiz"
            color={data?.missing_maintenance ? 'bg-purple-500/10 text-purple-500' : 'bg-emerald-500/10 text-emerald-500'}
          />
        </div>
      )}
    </div>
  )
}
