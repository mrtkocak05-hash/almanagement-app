import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { accessToken, _hasHydrated } = useAuthStore()
  const location = useLocation()

  if (!_hasHydrated) return null
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
