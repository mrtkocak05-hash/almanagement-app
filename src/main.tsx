import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from './routes'
import { useThemeStore } from './store/themeStore'
import './styles/globals.css'

function ThemeInitializer() {
  const setTheme = useThemeStore(s => s.setTheme)
  const theme = useThemeStore(s => s.theme)

  useEffect(() => {
    setTheme(theme)
  }, [setTheme, theme])

  return null
}

function Root() {
  return (
    <StrictMode>
      <ThemeInitializer />
      <AppRouter />
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
