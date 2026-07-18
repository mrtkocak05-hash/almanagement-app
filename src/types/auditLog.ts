export interface AuditLog {
  id: number
  user_id: number | null
  user_name: string | null
  action: string
  module: string
  record_id: number | null
  old_values: string | null
  new_values: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AuditLogList {
  logs: AuditLog[]
  total: number
}
