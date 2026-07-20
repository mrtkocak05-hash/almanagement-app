import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '@/types'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const getSystemTheme = (): 'dark' | 'light' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const applyTheme = (resolved: 'dark' | 'light') => {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(resolved)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      resolvedTheme: 'light',

      setTheme: (theme: Theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme
        applyTheme(resolved)
        set({ theme, resolvedTheme: resolved })
      },

      // Initialize on first load
      _init: () => {
        const { theme } = get()
        const resolved = theme === 'system' ? getSystemTheme() : theme
        applyTheme(resolved)
        set({ resolvedTheme: resolved })
      },
    }),
    {
      name: 'al-management-theme',
    }
  )
)
