import { useEffect } from 'react'
import { useDashboardStore } from './store'
import { AppLayout } from './components/layout/AppLayout'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { useAutoEditMode } from './hooks/useAutoEditMode'
import { I18nProvider } from './i18n'

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useDashboardStore(s => s.settings.darkMode)
  const dashboardTitle = useDashboardStore(s => s.settings.dashboardTitle)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    document.title = dashboardTitle
  }, [dashboardTitle])

  return <>{children}</>
}

export default function App() {
  useKeyboardShortcut()
  useAutoEditMode()

  return (
    <ThemeProvider>
      <I18nProvider>
        <AppLayout />
      </I18nProvider>
    </ThemeProvider>
  )
}
