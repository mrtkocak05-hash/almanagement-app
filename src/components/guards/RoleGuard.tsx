import { type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types/auth'

interface Props {
  roles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: Props) {
  const { hasRole } = useAuth()
  return hasRole(...roles) ? <>{children}</> : <>{fallback}</>
}
