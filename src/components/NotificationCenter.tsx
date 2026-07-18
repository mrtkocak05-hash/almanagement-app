import { useState, useEffect, useRef, memo } from 'react'
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, AlertOctagon, Bot, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { notificationApi } from '@/services/notificationApi'
import type { Notification, NotificationType } from '@/types/notification'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/tr'

dayjs.extend(relativeTime)
dayjs.locale('tr')

const TYPE_ICON: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertOctagon,
  ai: Bot,
}

const TYPE_COLOR: Record<NotificationType, string> = {
  info: 'text-blue-400',
  success: 'text-green-500',
  warning: 'text-amber-400',
  critical: 'text-red-400',
  ai: 'text-purple-400',
}

const TYPE_BG: Record<NotificationType, string> = {
  info: 'bg-blue-400/10',
  success: 'bg-green-500/10',
  warning: 'bg-amber-400/10',
  critical: 'bg-red-400/10',
  ai: 'bg-purple-400/10',
}

type FilterType = 'all' | NotificationType

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'Tümü', info: 'Bilgi', success: 'Başarı', warning: 'Uyarı', critical: 'Kritik', ai: 'AI'
}

export const NotificationCenter = memo(function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [list, count] = await Promise.all([
        notificationApi.list({ limit: 50 }),
        notificationApi.unreadCount(),
      ])
      setNotifications(list)
      setUnread(count.count)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(() => {
      notificationApi.unreadCount().then(c => setUnread(c.count)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function toggleOpen() {
    setOpen(o => {
      if (!o) load()
      return !o
    })
  }

  async function handleMarkRead(id: number) {
    await notificationApi.markRead(id).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n))
    setUnread(u => Math.max(0, u - 1))
  }

  async function handleMarkAllRead() {
    await notificationApi.markAllRead().catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
    setUnread(0)
  }

  async function handleDelete(id: number) {
    const n = notifications.find(x => x.id === id)
    await notificationApi.deleteNotification(id).catch(() => {})
    setNotifications(prev => prev.filter(x => x.id !== id))
    if (n && !n.is_read) setUnread(u => Math.max(0, u - 1))
  }

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">{Math.min(unread, 99)}</span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-80 z-50 rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Bildirimler</p>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">{unread}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Tümünü okundu işaretle">
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-border">
            {(Object.keys(FILTER_LABELS) as FilterType[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  'text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0',
                  filter === f ? 'text-white' : 'text-muted-foreground bg-muted/30 hover:bg-muted/60'
                )}
                style={filter === f ? { backgroundColor: '#D97706' } : undefined}>
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-muted/40 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-muted/40 animate-pulse" />
                    <div className="h-2.5 w-1/2 rounded bg-muted/40 animate-pulse" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="w-8 h-8 text-muted/20" />
                <p className="text-xs text-muted-foreground">Bildirim yok</p>
              </div>
            ) : (
              filtered.map(n => {
                const Icon = TYPE_ICON[n.type]
                return (
                  <div key={n.id} className={cn('flex items-start gap-3 px-4 py-3 group hover:bg-accent/30 transition-colors', !n.is_read && 'bg-accent/20')}>
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', TYPE_BG[n.type])}>
                      <Icon className={cn('w-3.5 h-3.5', TYPE_COLOR[n.type])} />
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => !n.is_read && handleMarkRead(n.id)}>
                      <p className={cn('text-xs leading-snug', !n.is_read ? 'font-semibold text-foreground' : 'text-foreground/80')}>{n.title}</p>
                      {n.body && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>}
                      <p className="text-[9px] text-muted-foreground/50 mt-1">{dayjs(n.created_at).fromNow()}</p>
                    </div>
                    <button onClick={() => handleDelete(n.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground/40 hover:text-red-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
})
