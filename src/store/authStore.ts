import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/auth'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  _hasHydrated: boolean
  setAuth(user: AuthUser, accessToken: string, refreshToken?: string | null): void
  updateUser(user: AuthUser): void
  updateAccessToken(token: string): void
  clearAuth(): void
  setHasHydrated(value: boolean): void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken: refreshToken ?? null }),
      updateUser: (user) => set((s) => ({ ...s, user })),
      updateAccessToken: (token) => set((s) => ({ ...s, accessToken: token })),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'alm-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
