import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  aiPanelOpen: boolean
  toggleSidebar: () => void
  toggleAIPanel: () => void
  setSidebarCollapsed: (value: boolean) => void
}

export const useUIStore = create<UIState>()(set => ({
  sidebarCollapsed: false,
  aiPanelOpen: false,

  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleAIPanel: () => set(state => ({ aiPanelOpen: !state.aiPanelOpen })),
  setSidebarCollapsed: (value: boolean) => set({ sidebarCollapsed: value }),
}))
