import { api } from './api'
import type { Notification, UnreadCount } from '@/types/notification'

function list(params?: { type?: string; unread_only?: boolean; limit?: number }): Promise<Notification[]> {
  const q = new URLSearchParams()
  if (params?.type) q.set('type', params.type)
  if (params?.unread_only) q.set('unread_only', 'true')
  if (params?.limit) q.set('limit', String(params.limit))
  const qs = q.toString()
  return api.get<Notification[]>(`/notifications${qs ? `?${qs}` : ''}`)
}

function unreadCount(): Promise<UnreadCount> {
  return api.get<UnreadCount>('/notifications/unread-count')
}

function markRead(id: number): Promise<null> {
  return api.put<null>(`/notifications/${id}/read`, {})
}

function markAllRead(): Promise<null> {
  return api.put<null>('/notifications/mark-all-read', {})
}

function deleteNotification(id: number): Promise<null> {
  return api.del<null>(`/notifications/${id}`)
}

export const notificationApi = { list, unreadCount, markRead, markAllRead, deleteNotification }
