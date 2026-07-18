import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/authApi'
import { configureApi } from '@/services/api'
import type { AuthUser, UserRole } from '@/types/auth'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login(email: string, password: string, remember: boolean): Promise<void>
  logout(): Promise<void>
  hasRole(...roles: UserRole[]): boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, refreshToken, setAuth, clearAuth, updateUser } = useAuthStore()
  const navigate = useNavigate()

  const handleUnauthorized = useCallback(() => {
    clearAuth()
    navigate('/login', { replace: true })
  }, [clearAuth, navigate])

  useEffect(() => {
    configureApi(handleUnauthorized)
  }, [handleUnauthorized])

  // Re-fetch user on mount if we have a token but stale user data
  useEffect(() => {
    if (accessToken && user) {
      authApi.me().then(updateUser).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const result = await authApi.login({ email, password, remember_me: remember })
    setAuth(result.user, result.accessToken, result.refreshToken)
    navigate('/', { replace: true })
  }, [setAuth, navigate])

  const logout = useCallback(async () => {
    await authApi.logout(refreshToken)
    clearAuth()
    navigate('/login', { replace: true })
  }, [refreshToken, clearAuth, navigate])

  const hasRole = useCallback((...roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!accessToken, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
