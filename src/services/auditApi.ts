import { api } from './api'
import type { AuditLog, AuditLogList } from '@/types/auditLog'

interface AuditQuery {
  module?: string
  action?: string
  user_id?: number
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

function list(params?: AuditQuery): Promise<AuditLogList> {
  const q = new URLSearchParams()
  if (params?.module) q.set('module', params.module)
  if (params?.action) q.set('action', params.action)
  if (params?.user_id) q.set('user_id', String(params.user_id))
  if (params?.date_from) q.set('date_from', params.date_from)
  if (params?.date_to) q.set('date_to', params.date_to)
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.offset) q.set('offset', String(params.offset))
  const qs = q.toString()
  return api.get<AuditLogList>(`/audit${qs ? `?${qs}` : ''}`)
}

function getLog(id: number): Promise<AuditLog> {
  return api.get<AuditLog>(`/audit/${id}`)
}

export const auditApi = { list, getLog }
