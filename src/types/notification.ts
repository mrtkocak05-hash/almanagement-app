export type NotificationType = 'info' | 'success' | 'warning' | 'critical' | 'ai'

export interface Notification {
  id: number
  user_id: number | null
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  is_read: 0 | 1
  category: string
  created_at: string
}

export interface UnreadCount {
  count: number
}
