import { memo } from 'react'
import {
  Bell, AlertTriangle, AlertCircle, Info, ShieldAlert,
  Car, Image, FileText, FileSearch, Clock,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'
import { useAlerts } from '@/hooks/useAIDashboard'
import type { SmartAlert, AlertSeverity, AlertType } from '@/types/aiDashboard'

const SEV_CONFIG: Record<AlertSeverity, {
  label: string; icon: React.ComponentType<{ className?: string }>
  iconColor: string; badgeStyle: string; headerBg: string; rowBg: string
}> = {
  high: {
    label: 'Kritik',
    icon: ShieldAlert,
    iconColor: 'text-red-400',
    badgeStyle: 'bg-red-400/10 text-red-400 border-red-400/20',
    headerBg: 'bg-red-400/5',
    rowBg: 'hover:bg-red-400/5',
  },
  medium: {
    label: 'Dikkat',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    badgeStyle: 'bg-yellow-600/10 text-yellow-600 border-yellow-600/20',
    headerBg: 'bg-yellow-600/5',
    rowBg: 'hover:bg-yellow-600/5',
  },
  low: {
    label: 'Bilgi',
    icon: Info,
    iconColor: 'text-blue-400',
    badgeStyle: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    headerBg: 'bg-blue-400/5',
    rowBg: 'hover:bg-blue-400/5',
  },
}

const TYPE_ICONS: Record<AlertType, React.ComponentType<{ className?: string }>> = {
  waiting:      Clock,
  missing_value: Car,
  missing_photo: Image,
  expiring_doc:  AlertTriangle,
  missing_doc:   FileText,
}

function AlertRow({ alert }: { alert: SmartAlert }) {
  const sev = SEV_CONFIG[alert.severity]
  const Icon = TYPE_ICONS[alert.type] ?? FileSearch
  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-2.5 border-b border-border/50 last:border-0 transition-colors duration-150',
      sev.rowBg,
    )}>
      <div className={cn('mt-0.5 flex-shrink-0', sev.iconColor)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-snug">{alert.title}</p>
        {alert.detail && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{alert.detail}</p>
        )}
      </div>
    </div>
  )
}

function SeverityGroup({ severity, alerts }: { severity: AlertSeverity; alerts: SmartAlert[] }) {
  if (!alerts.length) return null
  const cfg = SEV_CONFIG[severity]
  const SevIcon = cfg.icon
  return (
    <div>
      {/* Group header */}
      <div className={cn(
        'flex items-center gap-2 px-4 py-1.5 sticky top-0 z-10',
        cfg.headerBg,
      )} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <SevIcon className={cn('w-3 h-3', cfg.iconColor)} />
        <p className={cn('text-[9px] font-bold uppercase tracking-widest', cfg.iconColor)}>{cfg.label}</p>
        <span className={cn('ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full border', cfg.badgeStyle)}>
          {alerts.length}
        </span>
      </div>
      {alerts.map((a, i) => <AlertRow key={i} alert={a} />)}
    </div>
  )
}

export const AkillıUyarılar = memo(function AkillıUyarılar() {
  const { data: alerts, loading } = useAlerts()

  const high   = alerts?.filter(a => a.severity === 'high')   ?? []
  const medium = alerts?.filter(a => a.severity === 'medium') ?? []
  const low    = alerts?.filter(a => a.severity === 'low')    ?? []

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 relative"
          style={{ backgroundColor: '#C9A84C' }}>
          <Bell className="w-3.5 h-3.5 text-white" />
          {(alerts?.length ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white leading-none">
                {Math.min(alerts!.length, 9)}
              </span>
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-none">Akıllı Uyarılar</p>
          <p className="text-xs text-muted-foreground mt-0.5">Öncelik sıralı</p>
        </div>
        {!loading && alerts && alerts.length > 0 && (
          <div className="flex gap-1 flex-shrink-0">
            {high.length > 0   && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-400/10 text-red-400 font-bold border border-red-400/20">{high.length}</span>}
            {medium.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-600/10 text-yellow-600 font-bold border border-yellow-600/20">{medium.length}</span>}
            {low.length > 0    && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-400/10 text-blue-400 font-bold border border-blue-400/20">{low.length}</span>}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0">
              <div className="w-3.5 h-3.5 rounded bg-muted/40 animate-pulse flex-shrink-0" />
              <div className="flex-1 h-3 rounded bg-muted/40 animate-pulse" />
            </div>
          ))
        ) : !alerts?.length ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Her şey yolunda!</p>
            <p className="text-xs text-muted-foreground">Aktif uyarı yok</p>
          </div>
        ) : (
          <>
            <SeverityGroup severity="high"   alerts={high} />
            <SeverityGroup severity="medium" alerts={medium} />
            <SeverityGroup severity="low"    alerts={low} />
          </>
        )}
      </div>

      {!loading && alerts && alerts.length > 0 && (
        <div className="px-4 py-2 border-t border-border flex-shrink-0 flex items-center gap-2">
          <AlertCircle className="w-3 h-3 text-muted-foreground/40" />
          <p className="text-[10px] text-muted-foreground/40">{alerts.length} uyarı · Otomatik güncellenir</p>
        </div>
      )}
    </Card>
  )
})
